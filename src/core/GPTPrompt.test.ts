// import { expect } from 'chai'
// import { describe, it } from 'mocha'

import { JsonLoader, TemplateManager, VariableSubstitutor, PromptManager, IPromptTemplateMetadata } from "./GPTPrompt"
import { expect, jest, test } from '@jest/globals'

import fs from 'fs-extra'
import { maxLengthValidator, minLengthValidator, PromptInputValidator, PromptOutputValidator, trimDecorator, PromptBeforeDecorator, regexSubstringCountValidator, forbiddenWordsValidator, mandatoryWordsValidator, stringEscapingDecorator, logToFileDecorator, RepeatValidator, PrettifyCodeDecorator, MinifyCodeDecorator, ShortenSpacesDecorator, SplitSentencesDecorator, ExtractSubstringsDecorator } from "./GPTPromptDecorators"

// Set up mocks
jest.mock('./GPTPrompt')

class MockTemplateManager extends TemplateManager {
    constructor() {
        super(new JsonLoader())
    }

    public getTemplateMetadata(templateId: string): IPromptTemplateMetadata | undefined {
        if (templateId === 'test_template') {
            return {}
        }
        return undefined
    }

    public getCustomPromptMetadata(promptId: string): IPromptTemplateMetadata | undefined {
        if (promptId === 'custom_prompt') {
            return { decorators: [], validators: [] }
        }
        return undefined
    }
}


describe('TemplateManager', () => {
    let jsonLoader: JsonLoader
    let templateManager: TemplateManager

    beforeEach(async () => {
        jsonLoader = new JsonLoader()
        templateManager = new TemplateManager(jsonLoader)
        await templateManager.loadTemplatesFromFile('sample_data/unit_tests/templates.json')
        await templateManager.loadPromptFromFile('sample_data/unit_tests/prompts.json')
    })

    test('should add a template correctly', () => {
        const newTemplate = {
            id: 'test_id',
            content: 'Test content',
            metadata: {},
        }
        templateManager.addTemplate(newTemplate)

        const addedTemplate = templateManager.getTemplateById('test_id')
        expect(addedTemplate).toEqual(newTemplate)
    })
    test('should load templates from file correctly', () => {
        const template = templateManager.getTemplateById('template_1')
        expect(template).toBeDefined()
        expect(template).toEqual({
            id: 'template_1',
            content: 'Hello, {{name}}!',
            metadata: { decorators: [], validators: [] },
        })
    })

    test('should load custom prompts from file correctly', () => {
        const customPrompt = templateManager.getCustomPromptById('custom_prompt_1')
        expect(customPrompt).toBeDefined()
        expect(customPrompt).toEqual({
            promptId: 'custom_prompt_1',
            promptString: 'Welcome, {{name}}!',
            metadata: { decorators: [], validators: [] },
        })
    })

    test('should return undefined for non-existing template id', () => {
        const template = templateManager.getTemplateById('non_existing_template')
        expect(template).toBeUndefined()
    })

    test('should return undefined for non-existing custom prompt id', () => {
        const customPrompt = templateManager.getCustomPromptById('non_existing_prompt')
        expect(customPrompt).toBeUndefined()
    })
})

describe('PromptBuilder', () => {
    let jsonLoader: JsonLoader
    let templateManager: TemplateManager
    let variableSubstitutor: VariableSubstitutor
    let promptBuilder: PromptManager
    const mockTemplateManager = new MockTemplateManager()

    beforeEach(() => {
        jsonLoader = new JsonLoader()
        templateManager = new TemplateManager(jsonLoader)
        variableSubstitutor = new VariableSubstitutor()
        promptBuilder = new PromptManager(templateManager, variableSubstitutor)
    })

    test('should create and build a new template correctly', async () => {
        const templateId = 'test_template'
        const templateString = 'Hello, {{name}}!'
        const metadata = {}

        await promptBuilder.createTemplate(templateId, templateString, metadata)

        // Check if the template was created correctly
        const createdTemplate = templateManager.getTemplateById(templateId)
        expect(createdTemplate).toEqual({
            id: templateId,
            content: templateString,
            metadata: metadata,
        })

        const substitutions = { name: 'John' }
        const builtPrompt = await promptBuilder.buildPrompt(templateId, substitutions)

        expect(builtPrompt).toBe('Hello, John!')
    })
    test('should build a dynamic prompt correctly', async () => {
        const templateId1 = 'test_template1'
        const templateString1 = 'Hello, {{name}}!'
        const metadata1 = {}
        await promptBuilder.createTemplate(templateId1, templateString1, metadata1)

        const templateId2 = 'test_template2'
        const templateString2 = ' Have a great day, {{name}}!'
        const metadata2 = {}
        await promptBuilder.createTemplate(templateId2, templateString2, metadata2)

        const substitutions = { name: 'John' }
        const builtPrompt = await promptBuilder.buildDynamicPrompt([templateId1, templateId2], substitutions)

        expect(builtPrompt).toBe('Hello, John! Have a great day, John!')
    })

    test('should get template metadata correctly', () => {
        promptBuilder = new PromptManager(mockTemplateManager, variableSubstitutor)
        const templateId = 'test_template'
        const metadata = promptBuilder.getTemplateMetadata(templateId)

        expect(metadata).toEqual({})
    })

    test('should get custom prompt metadata correctly', () => {
        promptBuilder = new PromptManager(mockTemplateManager, variableSubstitutor)
        const promptId = 'custom_prompt'
        const metadata = promptBuilder.getCustomPromptMetadata(promptId)

        expect(metadata).toEqual({ decorators: [], validators: [] })
    })

    test('should get metadata with specific decorators and validators correctly', async () => {
        const templateId = 'template_with_metadata'
        await promptBuilder.createTemplate(templateId, 'Hello, {{name}}!', {
            // @ts-ignore
            decorators: ['trim'],
            // @ts-ignore
            validators: ['maxLength(10)'],
        })

        const metadata = await promptBuilder.getTemplateMetadata(templateId)
        expect(metadata).toEqual({
            decorators: ['trim'],
            validators: ['maxLength(10)'],
        })
    })


})

describe('PromptValidator and PromptDecorator', () => {
    const maxLengthValidatorFn = maxLengthValidator(10)
    const minLengthValidatorFn = minLengthValidator(1)
    const inputValidator = new PromptInputValidator([maxLengthValidatorFn, minLengthValidatorFn])
    const outputValidator = new PromptOutputValidator([maxLengthValidatorFn])

    const beforeDecoratorFn = trimDecorator
    const beforeDecorator = new PromptBeforeDecorator([beforeDecoratorFn])

    test('should validate input correctly', () => {
        const validInput = 'Test input'
        const invalidInput = 'This input is too long and should fail the maxLengthValidator'
        expect(inputValidator.validate(validInput)).toBe(true)
        expect(inputValidator.validate(invalidInput)).toBe(false)
    })

    test('should validate output correctly', () => {
        const validOutput = 'Test out' // Shortened to comply with the maxLengthValidator
        const invalidOutput = 'This output is too long and should fail the maxLengthValidator'
        expect(outputValidator.validate(validOutput)).toBe(true)
        expect(outputValidator.validate(invalidOutput)).toBe(false)
    })


    test('should apply before decorator correctly', () => {
        const stringWithSpaces = '  Trim this string  '
        const stringWithoutSpaces = 'Trim this string'
        expect(beforeDecorator.preprocess(stringWithSpaces)).toBe(stringWithoutSpaces)
    })
})

describe('TemplateManager', () => {
    let templateManager: TemplateManager
    let jsonLoader: JsonLoader

    beforeEach(() => {
        jsonLoader = new JsonLoader()
        templateManager = new TemplateManager(jsonLoader)
    })

    test('should save templates to file correctly', async () => {
        const templates = [
            {
                id: 'template1',
                content: 'Hello, {{name}}!',
                metadata: {},
            },
            {
                id: 'template2',
                content: 'Goodbye, {{name}}!',
                metadata: {},
            },
        ]

        templateManager.templates = templates

        const filePath = '/tmp/templates-test.json'
        await templateManager.saveTemplatesToFile(filePath)

        const savedTemplates = await fs.readJson(filePath)
        expect(savedTemplates).toEqual(templates)

        // Clean up
        await fs.remove(filePath)
    })

    test('should save custom prompts to file correctly', async () => {
        const customPrompts = [
            {
                promptId: 'prompt1',
                promptString: 'What is your name?',
                metadata: {},
            },
            {
                promptId: 'prompt2',
                promptString: 'Where do you live?',
                metadata: {},
            },
        ]

        templateManager.customPrompts = customPrompts

        const filePath = '/tmp/custom-prompts-test.json'
        await templateManager.saveCustomPromptsToFile(filePath)

        const savedCustomPrompts = await fs.readJson(filePath)
        expect(savedCustomPrompts).toEqual(customPrompts)

        // Clean up
        await fs.remove(filePath)
    })
})


// Tests for validators and decorators
describe('Validators and Decorators', () => {
    test('regexSubstringCountValidator should validate correctly', () => {
        const validator = regexSubstringCountValidator(/[aeiou]/gi, 5, (a, b) => a >= b)
        expect(validator('This is a test with enough vowels.')).toBe(true)
        expect(validator('This isn\'t :-().')).toBe(false)
    })

    test('forbiddenWordsValidator should validate correctly', () => {
        const validator = forbiddenWordsValidator(['badword', 'anotherbadword'])
        expect(validator('This text contains no bad words.')).toBe(true)
        expect(validator('This text has a badword in it.')).toBe(false)
    })

    test('mandatoryWordsValidator should validate correctly', () => {
        const validator = mandatoryWordsValidator(['first', 'second', 'third'])
        expect(validator('This text contains the first, second, and third words.')).toBe(true)
        expect(validator('This text has only the first and second words.')).toBe(false)
    })

    test('stringEscapingDecorator should escape strings correctly', () => {
        const input = `<script>alert("Hello!");</script>`
        const expected = `&lt;script&gt;alert(&quot;Hello!&quot;);&lt;/script&gt;`
        expect(stringEscapingDecorator(input)).toBe(expected)
    })

    test('logToFileDecorator should log to a file correctly', async () => {
        const filePath = '/tmp/test_log.txt'
        const decorator = logToFileDecorator(filePath)
        const testMessage = 'Testing log to file.'
        decorator(testMessage)

        const fileContent = await fs.promises.readFile(filePath, 'utf-8')
        expect(fileContent).toContain(testMessage)

        // Clean up the test log file
        await fs.promises.unlink(filePath)
    })
    test('should fail if 3 previous prompts were identical', () => {
        const promptValidator = new RepeatValidator([])
        const identicalPrompt = 'This prompt is the same as the previous one.'
        const differentPrompt = 'This prompt is different from the previous one.'

        promptValidator.validate(differentPrompt)
        promptValidator.validate(identicalPrompt)
        promptValidator.validate(identicalPrompt)

        expect(() => promptValidator.validate(identicalPrompt)).toThrow('Failed: 3 previous prompts were identical.')
    })

})


describe('PromptBuilder', () => {
    let jsonLoader: JsonLoader
    let templateManager: TemplateManager
    let variableSubstitutor: VariableSubstitutor
    let promptBuilder: PromptManager
    const mockTemplateManager = new MockTemplateManager()

    beforeEach(() => {
        jsonLoader = new JsonLoader()
        templateManager = new TemplateManager(jsonLoader)
        variableSubstitutor = new VariableSubstitutor()
        promptBuilder = new PromptManager(templateManager, variableSubstitutor)
    })

    test('should throttle prompts if too many were sent', async () => {
        const templateId = 'test_template'
        const templateString = 'Hello, {{name}}!'
        const metadata = {}
        promptBuilder = new PromptManager(mockTemplateManager, variableSubstitutor, undefined, undefined, 2, 2)
        await promptBuilder.createTemplate(templateId, templateString, metadata)
        templateManager.getTemplateById(templateId)

        const startTime = Date.now()
        for (let i = 0; i < 3; i++) {
            await promptBuilder.buildPrompt(templateId, { name: 'John' })
        }
        const endTime = Date.now()
        const elapsedTime = endTime - startTime
        // Check that the 3rd prompt took at least 2 second to be built
        expect(elapsedTime).toBeGreaterThanOrEqual(1000)

    })
    test('should prettify TypeScript code correctly', async () => {
        const decorator = new PrettifyCodeDecorator()
        const code = 'const x=1;function test(){return x;}'
        const expected = [`const x = 1;`, `function test() {`, `  return x;`, `}`, ``].join('\n')

        const result = await decorator.decorate(code)
        expect(result).toBe(expected)
    })
    test('should minify TypeScript code correctly', async () => {
        const decorator = new MinifyCodeDecorator()
        const code = [``, `const x = 1;`, `function test() {`, `  return x;`, `}`, ``].join('\n')

        const expected = 'const x=1;function test(){return x}'
        const result = await decorator.decorate(code)
        expect(result).toBe(expected)
    })
    test('should shorten consecutive spaces correctly', async () => {
        const decorator = new ShortenSpacesDecorator()
        const stringWithExtraSpaces = 'This  is   a   string    with  extra   spaces.'
        const expected = 'This is a string with extra spaces.'

        const result = await decorator.decorate(stringWithExtraSpaces)
        expect(result).toBe(expected)
    })
    test('should split content into a list of sentences correctly', async () => {
        const decorator = new SplitSentencesDecorator()
        const text = 'This is a sentence. And this is another one! Here is a question? A semicolon; A colon: Done.'
        const expected = [
            'This is a sentence.',
            'And this is another one!',
            'Here is a question?',
            'A semicolon;',
            'A colon:',
            'Done.',
        ]

        const result = await decorator.decorate(text)
        expect(result).toEqual(expected)
    })
    // test('should apply stemming correctly', async () => {
    //     const decorator = new StemmingDecorator()
    //     const text = 'running jumped swimming'
    //     const expected = 'run jump swim'

    //     const result = await decorator.decorate(text)
    //     expect(result).toBe(expected)
    // })
    test('should extract substrings between start and end strings correctly', async () => {
        const start = 'are'
        const end = 'you'
        const decorator = new ExtractSubstringsDecorator(start, end)
        const content = "Hello, how are you? Are you okay? You are very tired, aren't you? You aren't in your prime anymore."
        const expected = [' ', " very tired, aren't ", "n't in "]

        const result = await decorator.decorate(content)
        expect(result).toEqual(expected)
    })
    test('Should correctly extract when start and end delineators are the same', async () => {
        const start = 'are'
        const end = 'are'
        const decorator = new ExtractSubstringsDecorator(start, end)
        const content = "Hello, how are you? Are you okay? You are very tired, aren't you? You aren't in your prime anymore."
        const expected = [' you? Are you okay? You ', "n't you? You "]

        const result = await decorator.decorate(content)
        expect(result).toEqual(expected)
    })

})
