"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonLoader = exports.PromptDecorator = exports.PromptValidator = exports.GPTPrompt = exports.PromptManager = exports.VariableSubstitutor = exports.TemplateManager = void 0;
const _ = require('lodash');
const main_1 = require("../main");
// import { stringEscapingDecorator } from "./GPTPromptDecorators"
// @ts-ignore
const prompts_1 = require("../../sample_data/prompts"); // TODO: Is this realistic? It's nice to have autocomplete on prompts, but it might b
// @ts-ignore
const templates_1 = require("../../sample_data/templates");
class TemplateManager {
    constructor() {
        this.templates = [];
        this.customPrompts = [];
    }
    // constructor(private jsonLoader: JsonLoader = new JsonLoader()) { }
    loadTemplatesFromFile(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            // const templates = await this.jsonLoader.load<IPromptTemplate[]>(filePath)
            // @ts-ignore
            const customTemplates = Object.keys(templates_1.templates).map((key) => templates_1.templates[key]);
            let i = 0;
            for (const key of Object.keys(templates_1.templates)) {
                customTemplates[i]['templateId'] = key;
                i++;
            }
            this.templates = customTemplates.map((template) => ({
                id: template.templateId,
                content: Array.isArray(template.templateString) ? template.templateString.join('\n') : template.templateString,
                metadata: template.metadata,
            }));
            // console.log('Loaded templates:', this.templates)
        });
    }
    loadPromptFromFile(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            // const prompts = await this.jsonLoader.load<ICustomPrompt[]>(filePath)
            // @ts-ignore
            this.customPrompts = Object.keys(prompts_1.prompts).map((key) => prompts_1.prompts[key]);
            let i = 0;
            for (const key of Object.keys(prompts_1.prompts)) {
                this.customPrompts[i]['promptId'] = key;
                i++;
            }
            const hi = 'hi';
            // console.log('Loaded custom prompts:', this.customPrompts)
        });
    }
    addTemplate(template) {
        this.templates.push(template);
    }
    // // Inside TemplateManager class
    // async saveTemplatesToFile(filePath: string): Promise<void> {
    //     await this.jsonLoader.saveToFile(filePath, this.templates)
    // }
    // async saveCustomPromptsToFile(filePath: string): Promise<void> {
    //     await this.jsonLoader.saveToFile(filePath, this.customPrompts)
    // }
    getTemplateById(templateId) {
        return this.templates.find((template) => template.id === templateId);
    }
    getCustomPromptById(promptId) {
        return this.customPrompts.find((prompt) => prompt.promptId === promptId);
    }
    getTemplateMetadata(templateId) {
        const template = this.getTemplateById(templateId);
        return template === null || template === void 0 ? void 0 : template.metadata;
    }
    getCustomPromptMetadata(promptId) {
        const customPrompt = this.getCustomPromptById(promptId);
        return customPrompt === null || customPrompt === void 0 ? void 0 : customPrompt.metadata;
    }
}
exports.TemplateManager = TemplateManager;
class VariableSubstitutor {
    static getKeys(template) {
        // const keys = []
        const matches = template === null || template === void 0 ? void 0 : template.matchAll(VariableSubstitutor.regex);
        if (matches)
            return [...matches];
        else
            return [];
        // return [...matches]
    }
    substitute(template, substitutions) {
        return template.replace(VariableSubstitutor.regex, 
        // @ts-ignore
        (match, capture) => Array.isArray(substitutions[capture]) ? substitutions[capture].join('\n') : substitutions[capture] || match);
    }
}
VariableSubstitutor.regex = /{{\s*(\w+)\s*}}/g;
exports.VariableSubstitutor = VariableSubstitutor;
class PromptManager {
    constructor(templateManager, variableSubstitutor, validators = [], decorators = [], throttleMessages = 10, throttleSeconds = 60) {
        this.templateManager = templateManager;
        this.variableSubstitutor = variableSubstitutor;
        this.validators = validators;
        this.decorators = decorators;
        // Initialize the rate limiter with a limit of 10 prompts per minute (customize as needed)
        this.rateLimiter = new RateLimiter(throttleMessages, throttleSeconds * 1000);
    }
    loadTemplateFromFile(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.templateManager.loadTemplatesFromFile(filePath);
            return this.templateManager.templates.map((template) => ({
                templateId: template.id,
                templateString: template.content,
                metadata: template.metadata,
            }));
        });
    }
    loadPromptFromFile(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.templateManager.loadPromptFromFile(filePath);
            return this.templateManager.customPrompts;
        });
    }
    buildPrompt(templateId, substitutions) {
        return __awaiter(this, void 0, void 0, function* () {
            // Add rate limiting here
            yield this.rateLimiter.consume();
            const template = yield this.templateManager.getTemplateById(templateId);
            if (!template) {
                throw new Error(`Template with ID "${templateId}" not found`);
            }
            const promptString = this.variableSubstitutor.substitute(template.content, substitutions);
            this.applyValidators(promptString);
            return this.applyDecorators(promptString);
        });
    }
    buildDynamicPrompt(templateIds, substitutions) {
        return __awaiter(this, void 0, void 0, function* () {
            // Add rate limiting here
            yield this.rateLimiter.consume();
            let promptString = "";
            for (const templateId of templateIds) {
                const template = yield this.templateManager.getTemplateById(templateId);
                if (!template) {
                    throw new Error(`Template with ID "${templateId}" not found`);
                }
                if (substitutions === undefined)
                    promptString += template.content;
                else
                    promptString += this.variableSubstitutor.substitute(template.content, substitutions);
            }
            this.applyValidators(promptString);
            const outputContent = this.applyDecorators(promptString);
            return outputContent;
        });
    }
    buildMoreDynamicPrompt(templateIds, substitutions) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            // Add rate limiting here
            yield this.rateLimiter.consume();
            let promptString = "";
            const senderMeta = new Map();
            const receiverMeta = new Map();
            for (const templateId of templateIds) {
                const template = yield this.templateManager.getTemplateById(templateId);
                if (!template) {
                    throw new Error(`Template with ID "${templateId}" not found`);
                }
                if (substitutions === undefined)
                    promptString += template.content;
                else
                    promptString += this.variableSubstitutor.substitute(template.content, substitutions);
                if (((_a = template.metadata) === null || _a === void 0 ? void 0 : _a.request) !== undefined) {
                    const x = template.metadata.request;
                    Object.keys(x).forEach((k) => senderMeta.set(k, x[k]));
                }
                if (((_b = template.metadata) === null || _b === void 0 ? void 0 : _b.response) !== undefined) {
                    const x = template.metadata.response;
                    Object.keys(x).forEach((k) => receiverMeta.set(k, x[k]));
                }
            }
            this.applyValidators(promptString);
            const outputContent = this.applyDecorators(promptString);
            const output = { content: outputContent, senderMetadata: senderMeta, receiverMetadata: receiverMeta };
            return output;
        });
    }
    createTemplate(templateId, templateString, metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            const newTemplate = {
                id: templateId,
                content: templateString,
                metadata,
            };
            this.templateManager.addTemplate(newTemplate);
        });
    }
    getTemplateMetadata(templateId) {
        return this.templateManager.getTemplateMetadata(templateId);
    }
    getCustomPromptMetadata(promptId) {
        return this.templateManager.getCustomPromptMetadata(promptId);
    }
    applyValidators(promptString) {
        for (const validator of this.validators) {
            validator.validate(promptString);
        }
    }
    applyDecorators(promptString) {
        let processedPromptString = promptString;
        for (const decorator of this.decorators) {
            processedPromptString = decorator.preprocess(processedPromptString);
        }
        for (const decorator of this.decorators) {
            processedPromptString = decorator.postprocess(processedPromptString);
        }
        return processedPromptString;
    }
}
exports.PromptManager = PromptManager;
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
    constructor() {
        this.templateManager = new TemplateManager();
        this.variableSubstitutor = new VariableSubstitutor();
        this.promptManager = new PromptManager(this.templateManager, this.variableSubstitutor);
        this.promptPath = 'sample_data/prompts.json';
        this.templatePath = 'sample_data/templates.json';
    }
    load(promptId, replacements = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.templateManager.loadPromptFromFile(this.promptPath);
            yield this.templateManager.loadTemplatesFromFile(this.templatePath);
            const prompt = yield this.templateManager.getCustomPromptById(promptId);
            // if (prompt === undefined) throw new Error(`Prompt "${promptId}" not found in ${this.promptPath}`)
            let templateIds;
            if (prompt !== undefined)
                templateIds = prompt.template; // TODO: What if template is empty?
            else
                templateIds = [promptId];
            if (!Array.isArray(templateIds))
                templateIds = [templateIds];
            // @ts-ignore
            return yield this.promptManager.buildMoreDynamicPrompt(templateIds, prompt);
        });
    }
}
function GPTPrompt(promptId, replacements = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield new _GPTPrompt().load(promptId, replacements);
    });
}
exports.GPTPrompt = GPTPrompt;
class PromptValidator {
    constructor(validators, maxHistorySize = 3) {
        this.validators = [];
        this.history = [];
        this.validators = validators;
        this.maxHistorySize = maxHistorySize;
    }
    registerValidator(name, validatorFunction) {
        // @ts-ignore
        this.validators[name] = validatorFunction;
    }
    registerOutputValidator(name, validatorFunction) {
        this.registerValidator(name, validatorFunction); // TODO:
    }
    // Add this method to the PromptValidator class
    registerRegexValidator(name, regex) {
        this.registerValidator(name, (value) => regex.test(value));
        // this.registerOutputValidator(name, (value: string) => regex.test(value));
    }
}
exports.PromptValidator = PromptValidator;
class PromptDecorator {
    constructor(befores, afters) {
        this.befores = [];
        this.afters = [];
        this.befores = befores;
        this.afters = afters;
    }
    // In the PromptDecorator class
    registerBeforeDecorator(name, decoratorFunction) {
        // @ts-ignore
        this.befores[name] = decoratorFunction;
    }
    registerAfterDecorator(name, decoratorFunction) {
        // @ts-ignore
        this.afters[name] = decoratorFunction;
    }
}
exports.PromptDecorator = PromptDecorator;
class RateLimiter {
    constructor(maxTokens, refillInterval) {
        this.maxTokens = maxTokens;
        this.refillInterval = refillInterval;
        this.tokens = maxTokens;
        this.lastRefill = Date.now();
    }
    consume() {
        return __awaiter(this, void 0, void 0, function* () {
            const now = Date.now();
            const timeSinceLastRefill = now - this.lastRefill;
            if (timeSinceLastRefill >= this.refillInterval) {
                this.tokens = this.maxTokens;
                this.lastRefill = now;
            }
            if (this.tokens <= 0) {
                const waitTime = this.refillInterval - timeSinceLastRefill;
                yield new Promise((resolve) => setTimeout(resolve, waitTime));
                this.tokens = this.maxTokens - 1;
                this.lastRefill = Date.now();
            }
            else {
                this.tokens = Math.min(this.tokens - 1, this.maxTokens);
            }
        });
    }
}
class JsonLoader {
    static load(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const realFilePath = JsonLoader.doubleCheckFilePath(filePath);
            // console.log(filePath, realFilePath)
            const rawData = yield main_1.fs.readFile(realFilePath, "utf-8");
            const data = yield JSON.parse(rawData);
            return data;
            // const rawData = await fs.readFile(JsonLoader.promptPath, 'utf-8')
        });
    }
    load(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield JsonLoader.load(filePath);
        });
    }
    saveToFile(filePath, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const realFilePath = JsonLoader.doubleCheckFilePath(filePath);
            if (realFilePath.length < 6)
                throw new Error("File save path is suspiciously short.");
            try {
                yield main_1.fs.writeJson(filePath, data, { spaces: 2 });
            }
            catch (error) {
                throw new Error(`Error saving data to file: ${error.message}`);
            }
        });
    }
    /**
     * MAJOR TODO: GPT writes unit tests, which is all fun and games until it starts writing files
     * in & outside the repo. This method is a temporary solution, and a real one will involve setting
     * up a sandbox (or at minimum a Proxy).
     */
    static doubleCheckFilePath(filePath) {
        const backupstring = filePath;
        // Allow files written to /tmp folder (tests) and sample_data (API)
        if (filePath.includes("/tmp/") ||
            filePath.includes("sample_data/") ||
            filePath.includes("demo/"))
            return filePath;
        let realFilePath;
        // Redirect GPT file read/writes to folder with sample data for unit tests.
        if (filePath.includes("template"))
            realFilePath = this.templatePath;
        else if (filePath.includes("prompt"))
            realFilePath = this.promptPath;
        else
            throw new Error("Unexpected filepath. Aborting, just to be on the safe side...");
        return realFilePath;
    }
}
JsonLoader.promptPath = "sample_data/unit_tests/prompts.json";
JsonLoader.templatePath = "sample_data/unit_tests/templates.json";
exports.JsonLoader = JsonLoader;
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
//# sourceMappingURL=GPTPrompt.js.map