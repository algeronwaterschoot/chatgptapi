const _ = require('lodash')
import { fs } from '../main'
// import { stringEscapingDecorator } from "./GPTPromptDecorators"
// @ts-ignore
import { prompts } from '../../sample_data/prompts' // TODO: Is this realistic? It's nice to have autocomplete on prompts, but it might b
// @ts-ignore
import { templates } from '../../sample_data/templates'

export interface ICustomPrompt {
    promptId: string
    promptString: string
    metadata?: IPromptTemplateMetadata
    template?: string | string[]
}

export interface ITemplate {
    id: string
    content: string
    metadata?: IPromptTemplateMetadata
}
export interface IPromptTemplateMetadata {
    validators?: Function[]
    decorators?: Function[]
    request?: {}
    response?: {}
    [key: string]: any
}

export interface IPromptTemplate {
    templateId: string
    templateString: string
    metadata?: IPromptTemplateMetadata
}
export interface IPromptManager {
    loadTemplateFromFile: (filePath: string) => Promise<IPromptTemplate[]>
    loadPromptFromFile: (filePath: string) => Promise<ICustomPrompt[]>
    buildPrompt: (templateId: string, substitutions: Record<string, string>) => Promise<string>
    buildDynamicPrompt: (templateIds: string[], substitutions: Record<string, string>) => Promise<string>
    getTemplateMetadata: (templateId: string) => IPromptTemplateMetadata | undefined
    getCustomPromptMetadata: (promptId: string) => IPromptTemplateMetadata | undefined
}

export type BuiltPrompt = {
    content: string
    senderMetadata?: Map<string, string>
    receiverMetadata?: Map<string, string>
}

export class TemplateManager {
    public templates: ITemplate[] = [];
    public customPrompts: ICustomPrompt[] = [];

    // constructor(private jsonLoader: JsonLoader = new JsonLoader()) { }

    public async loadTemplatesFromFile(filePath: string): Promise<void> {
        // const templates = await this.jsonLoader.load<IPromptTemplate[]>(filePath)
        // @ts-ignore
        const customTemplates = Object.keys(templates).map((key) => templates[key])
        let i = 0
        for (const key of Object.keys(templates)) {
            customTemplates[i]['templateId'] = key
            i++
        }
        this.templates = customTemplates.map((template) => ({
            id: template.templateId,
            content: Array.isArray(template.templateString) ? template.templateString.join('\n') : template.templateString,
            metadata: template.metadata,
        }))
        // console.log('Loaded templates:', this.templates)
    }

    public async loadPromptFromFile(filePath: string): Promise<void> {
        // const prompts = await this.jsonLoader.load<ICustomPrompt[]>(filePath)
        // @ts-ignore
        this.customPrompts = Object.keys(prompts).map((key) => prompts[key])
        let i = 0
        for (const key of Object.keys(prompts)) {
            this.customPrompts[i]['promptId'] = key
            i++
        }
        const hi = 'hi'
        // console.log('Loaded custom prompts:', this.customPrompts)
    }

    public addTemplate(template: ITemplate): void {
        this.templates.push(template)
    }

    // // Inside TemplateManager class
    // async saveTemplatesToFile(filePath: string): Promise<void> {
    //     await this.jsonLoader.saveToFile(filePath, this.templates)
    // }

    // async saveCustomPromptsToFile(filePath: string): Promise<void> {
    //     await this.jsonLoader.saveToFile(filePath, this.customPrompts)
    // }

    public getTemplateById(templateId: string): ITemplate | undefined {
        return this.templates.find((template) => template.id === templateId)
    }

    public getCustomPromptById(promptId: string): ICustomPrompt | undefined {
        return this.customPrompts.find((prompt) => prompt.promptId === promptId)
    }

    public getTemplateMetadata(templateId: string): IPromptTemplateMetadata | undefined {
        const template = this.getTemplateById(templateId)
        return template?.metadata
    }

    public getCustomPromptMetadata(promptId: string): IPromptTemplateMetadata | undefined {
        const customPrompt = this.getCustomPromptById(promptId)
        return customPrompt?.metadata
    }
}


export class VariableSubstitutor {
    static readonly regex = /{{\s*(\w+)\s*}}/g
    public static getKeys(template: string) {
        // const keys = []
        const matches = template?.matchAll(VariableSubstitutor.regex)
        if (matches) return [...matches]
        else return []
        // return [...matches]
    }

    public substitute(template: string, substitutions: Record<string, string | string[]> | ICustomPrompt): string {
        return template.replace(
            VariableSubstitutor.regex,
            // @ts-ignore
            (match, capture) => Array.isArray(substitutions[capture]) ? substitutions[capture].join('\n') : substitutions[capture] || match
        )
    }
}


export class PromptManager implements IPromptManager {
    private templateManager: TemplateManager
    private variableSubstitutor: VariableSubstitutor
    private validators: PromptValidator<string>[]
    private decorators: PromptDecorator<string>[]
    private rateLimiter: RateLimiter

    constructor(
        templateManager: TemplateManager,
        variableSubstitutor: VariableSubstitutor,
        validators: PromptValidator<string>[] = [],
        decorators: PromptDecorator<string>[] = [],
        throttleMessages: number = 10,
        throttleSeconds: number = 60
    ) {
        this.templateManager = templateManager
        this.variableSubstitutor = variableSubstitutor
        this.validators = validators
        this.decorators = decorators
        // Initialize the rate limiter with a limit of 10 prompts per minute (customize as needed)
        this.rateLimiter = new RateLimiter(
            throttleMessages,
            throttleSeconds * 1000
        )
    }
    async loadTemplateFromFile(filePath: string): Promise<IPromptTemplate[]> {
        await this.templateManager.loadTemplatesFromFile(filePath)
        return this.templateManager.templates.map((template) => ({
            templateId: template.id,
            templateString: template.content,
            metadata: template.metadata,
        }))
    }

    async loadPromptFromFile(filePath: string): Promise<ICustomPrompt[]> {
        await this.templateManager.loadPromptFromFile(filePath)
        return this.templateManager.customPrompts
    }

    async buildPrompt(templateId: string, substitutions: Record<string, string>): Promise<string> {
        // Add rate limiting here
        await this.rateLimiter.consume()
        const template = await this.templateManager.getTemplateById(templateId)
        if (!template) {
            throw new Error(`Template with ID "${templateId}" not found`)
        }
        const promptString = this.variableSubstitutor.substitute(
            template.content,
            substitutions
        )
        this.applyValidators(promptString)
        return this.applyDecorators(promptString)
    }

    async buildDynamicPrompt(templateIds: string[], substitutions?: Record<string, string> | ICustomPrompt): Promise<string> {
        // Add rate limiting here
        await this.rateLimiter.consume()
        let promptString = ""
        for (const templateId of templateIds) {
            const template = await this.templateManager.getTemplateById(templateId)
            if (!template) {
                throw new Error(`Template with ID "${templateId}" not found`)
            }
            if (substitutions === undefined) promptString += template.content
            else promptString += this.variableSubstitutor.substitute(
                template.content,
                substitutions
            )
        }
        this.applyValidators(promptString)
        const outputContent = this.applyDecorators(promptString)
        return outputContent
    }

    async buildMoreDynamicPrompt(templateIds: string[], substitutions?: Record<string, string> | ICustomPrompt): Promise<BuiltPrompt> {
        // Add rate limiting here
        await this.rateLimiter.consume()
        let promptString = ""
        const senderMeta = new Map<string, string>()
        const receiverMeta = new Map<string, string>()
        for (const templateId of templateIds) {
            const template = await this.templateManager.getTemplateById(templateId)
            if (!template) {
                throw new Error(`Template with ID "${templateId}" not found`)
            }
            if (substitutions === undefined) promptString += template.content
            else promptString += this.variableSubstitutor.substitute(
                template.content,
                substitutions
            )
            if (template.metadata?.request !== undefined) {
                const x: any = template.metadata!.request!
                Object.keys(x).forEach((k) => senderMeta.set(k, x[k]))
            }
            if (template.metadata?.response !== undefined) {
                const x: any = template.metadata!.response!
                Object.keys(x).forEach((k) => receiverMeta.set(k, x[k]))
            }
        }
        this.applyValidators(promptString)
        const outputContent = this.applyDecorators(promptString)
        const output: BuiltPrompt = { content: outputContent, senderMetadata: senderMeta, receiverMetadata: receiverMeta }
        return output
    }
    async createTemplate(templateId: string, templateString: string, metadata?: IPromptTemplateMetadata): Promise<void> {
        const newTemplate: ITemplate = {
            id: templateId,
            content: templateString,
            metadata,
        }

        this.templateManager.addTemplate(newTemplate)
    }

    getTemplateMetadata(templateId: string) {
        return this.templateManager.getTemplateMetadata(templateId)
    }

    getCustomPromptMetadata(promptId: string) {
        return this.templateManager.getCustomPromptMetadata(promptId)
    }

    private applyValidators(promptString: string) {
        for (const validator of this.validators) {
            validator.validate(promptString)
        }
    }

    private applyDecorators(promptString: string) {
        let processedPromptString = promptString
        for (const decorator of this.decorators) {
            processedPromptString = decorator.preprocess(processedPromptString)
        }
        for (const decorator of this.decorators) {
            processedPromptString = decorator.postprocess(processedPromptString)
        }
        return processedPromptString
    }
}

// class PromptAutocompleter {
//     templateIds: string[]
//     // keys: []
//     constructor(private promptManager: PromptManager, public templates?: ITemplate[]) {
//         // const templateIds = templates?.flatMap((template?) => VariableSubstitutor.getKeys(template?.id)) ?? []
//         // this.templateIds = _.uniq([...templateIds])
//         this.templateIds = templates?.map((x) => x.id) ?? []
//     }

//     async with(args: {}) {
//         // const newArgs = Map<string, string>()
//         // for (const arg of args) {
//         //     newArgs.set(arg.)
//         // }
//     }
// }

class _GPTPrompt {
    private templateManager = new TemplateManager()
    private variableSubstitutor = new VariableSubstitutor()
    private promptManager = new PromptManager(this.templateManager, this.variableSubstitutor)
    promptPath: string = 'sample_data/prompts.json'
    templatePath: string = 'sample_data/templates.json'

    async load(promptId: string, replacements: {} = {}) {
        await this.templateManager.loadPromptFromFile(this.promptPath)
        await this.templateManager.loadTemplatesFromFile(this.templatePath)
        const prompt = await this.templateManager.getCustomPromptById(promptId)
        // if (prompt === undefined) throw new Error(`Prompt "${promptId}" not found in ${this.promptPath}`)
        let templateIds
        if (prompt !== undefined) templateIds = prompt.template // TODO: What if template is empty?
        else templateIds = [promptId]
        if (!Array.isArray(templateIds)) templateIds = [templateIds]

        // @ts-ignore
        return await this.promptManager.buildMoreDynamicPrompt(templateIds, prompt)
    }
}

export async function GPTPrompt(promptId: string, replacements: {} = {}): Promise<BuiltPrompt> {
    return await new _GPTPrompt().load(promptId, replacements)
}

export type Validator<T> = (value: T) => boolean
export type Decorator<T> = (value: T) => T

export abstract class PromptValidator<T> {
    protected validators: Validator<T>[] = [];
    protected history: string[] = [];
    protected maxHistorySize: number

    constructor(validators: Validator<T>[], maxHistorySize: number = 3) {
        this.validators = validators
        this.maxHistorySize = maxHistorySize
    }

    abstract validate(value: T): void

    registerValidator(name: string, validatorFunction: (value: string) => boolean): void {
        // @ts-ignore
        this.validators[name] = validatorFunction
    }

    protected registerOutputValidator(name: string, validatorFunction: (value: string) => boolean): void {
        this.registerValidator(name, validatorFunction) // TODO:
    }

    // Add this method to the PromptValidator class
    registerRegexValidator(name: string, regex: RegExp): void {
        this.registerValidator(name, (value: string) => regex.test(value))
        // this.registerOutputValidator(name, (value: string) => regex.test(value));
    }
}

export abstract class PromptDecorator<T> {
    protected befores: Decorator<T>[] = [];
    protected afters: Decorator<T>[] = [];

    constructor(befores: Decorator<T>[], afters: Decorator<T>[]) {
        this.befores = befores
        this.afters = afters
    }

    abstract preprocess(value: T): T
    abstract postprocess(value: T): T

    // In the PromptDecorator class
    registerBeforeDecorator(name: string, decoratorFunction: (value: string) => string): void {
        // @ts-ignore
        this.befores[name] = decoratorFunction
    }

    registerAfterDecorator(name: string, decoratorFunction: (value: string) => string): void {
        // @ts-ignore
        this.afters[name] = decoratorFunction
    }
}

class RateLimiter {
    private tokens: number
    private lastRefill: number

    constructor(private maxTokens: number, private refillInterval: number) {
        this.tokens = maxTokens
        this.lastRefill = Date.now()
    }

    async consume(): Promise<void> {
        const now = Date.now()
        const timeSinceLastRefill = now - this.lastRefill

        if (timeSinceLastRefill >= this.refillInterval) {
            this.tokens = this.maxTokens
            this.lastRefill = now
        }

        if (this.tokens <= 0) {
            const waitTime = this.refillInterval - timeSinceLastRefill
            await new Promise((resolve) => setTimeout(resolve, waitTime))
            this.tokens = this.maxTokens - 1
            this.lastRefill = Date.now()
        } else {
            this.tokens = Math.min(this.tokens - 1, this.maxTokens)
        }
    }
}

export class JsonLoader {
    private static readonly promptPath = "sample_data/unit_tests/prompts.json";
    private static readonly templatePath =
        "sample_data/unit_tests/templates.json";

    static async load<T>(filePath: string): Promise<any> {
        const realFilePath = JsonLoader.doubleCheckFilePath<T>(filePath)
        // console.log(filePath, realFilePath)
        const rawData = await fs.readFile(realFilePath, "utf-8")
        const data = await JSON.parse(rawData)
        return data
        // const rawData = await fs.readFile(JsonLoader.promptPath, 'utf-8')
    }

    async load<T>(filePath: string): Promise<T> {
        return await JsonLoader.load<T>(filePath)
    }
    async saveToFile(filePath: string, data: any): Promise<void> {
        const realFilePath = JsonLoader.doubleCheckFilePath<any>(filePath)
        if (realFilePath.length < 6)
            throw new Error("File save path is suspiciously short.")
        try {
            await fs.writeJson(filePath, data, { spaces: 2 })
        } catch (error: any) {
            throw new Error(`Error saving data to file: ${error.message}`)
        }
    }

    /**
     * MAJOR TODO: GPT writes unit tests, which is all fun and games until it starts writing files
     * in & outside the repo. This method is a temporary solution, and a real one will involve setting
     * up a sandbox (or at minimum a Proxy).
     */
    private static doubleCheckFilePath<T>(filePath: string) {
        const backupstring = filePath
        // Allow files written to /tmp folder (tests) and sample_data (API)
        if (
            filePath.includes("/tmp/") ||
            filePath.includes("sample_data/") ||
            filePath.includes("demo/")
        )
            return filePath
        let realFilePath
        // Redirect GPT file read/writes to folder with sample data for unit tests.
        if (filePath.includes("template")) realFilePath = this.templatePath
        else if (filePath.includes("prompt")) realFilePath = this.promptPath
        else
            throw new Error(
                "Unexpected filepath. Aborting, just to be on the safe side..."
            )
        return realFilePath
    }
}






/*
JsonLoader.load().then((resp) => {
    // console.log(resp)
})
*/
/*
async function main() {
    const jsonLoader = new JsonLoader()
    const templateManager = new TemplateManager(jsonLoader)
    const variableSubstitutor = new VariableSubstitutor()
    const promptBuilder = new PromptBuilder(templateManager, variableSubstitutor)

    // Load templates from file
    const templatesFilePath = 'path/to/your/templates-file.json'
    await promptBuilder.loadTemplateFromFile(templatesFilePath)

    // Load custom prompts from file (if necessary)
    const customPromptsFilePath = 'path/to/your/custom-prompts-file.json'
    await promptBuilder.loadCustomPromptFromFile(customPromptsFilePath)

    // Create a new template
    const newTemplateId = 'template_id'
    const newTemplateString = 'This is a new template with {{variable}} substitution.'
    const newTemplateMetadata: IPromptTemplateMetadata = { /* optional metadata *\/ }
await promptBuilder.createTemplate(newTemplateId, newTemplateString, newTemplateMetadata)

// Now that the new template is created, you can build a prompt using that template
const substitutions = { variable: 'custom value' }
const builtPrompt = await promptBuilder.buildPrompt(newTemplateId, substitutions)

console.log('Built prompt:', builtPrompt)
}

main().catch((error) => {
    console.error('An error occurred:', error)
})
*/
