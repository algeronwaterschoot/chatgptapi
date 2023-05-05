"use strict";
// import { expect } from 'chai'
// import { describe, it } from 'mocha'
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const GPTPrompt_1 = require("./GPTPrompt");
const globals_1 = require("@jest/globals");
const fs_extra_1 = __importDefault(require("fs-extra"));
const GPTPromptDecorators_1 = require("./GPTPromptDecorators");
// Set up mocks
globals_1.jest.mock('./GPTPrompt');
class MockTemplateManager extends GPTPrompt_1.TemplateManager {
    constructor() {
        super(new GPTPrompt_1.JsonLoader());
    }
    getTemplateMetadata(templateId) {
        if (templateId === 'test_template') {
            return {};
        }
        return undefined;
    }
    getCustomPromptMetadata(promptId) {
        if (promptId === 'custom_prompt') {
            return { decorators: [], validators: [] };
        }
        return undefined;
    }
}
describe('TemplateManager', () => {
    let jsonLoader;
    let templateManager;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        jsonLoader = new GPTPrompt_1.JsonLoader();
        templateManager = new GPTPrompt_1.TemplateManager(jsonLoader);
        yield templateManager.loadTemplatesFromFile('sample_data/unit_tests/templates.json');
        yield templateManager.loadPromptFromFile('sample_data/unit_tests/prompts.json');
    }));
    (0, globals_1.test)('should add a template correctly', () => {
        const newTemplate = {
            id: 'test_id',
            content: 'Test content',
            metadata: {},
        };
        templateManager.addTemplate(newTemplate);
        const addedTemplate = templateManager.getTemplateById('test_id');
        (0, globals_1.expect)(addedTemplate).toEqual(newTemplate);
    });
    (0, globals_1.test)('should load templates from file correctly', () => {
        const template = templateManager.getTemplateById('template_1');
        (0, globals_1.expect)(template).toBeDefined();
        (0, globals_1.expect)(template).toEqual({
            id: 'template_1',
            content: 'Hello, {{name}}!',
            metadata: { decorators: [], validators: [] },
        });
    });
    (0, globals_1.test)('should load custom prompts from file correctly', () => {
        const customPrompt = templateManager.getCustomPromptById('custom_prompt_1');
        (0, globals_1.expect)(customPrompt).toBeDefined();
        (0, globals_1.expect)(customPrompt).toEqual({
            promptId: 'custom_prompt_1',
            promptString: 'Welcome, {{name}}!',
            metadata: { decorators: [], validators: [] },
        });
    });
    (0, globals_1.test)('should return undefined for non-existing template id', () => {
        const template = templateManager.getTemplateById('non_existing_template');
        (0, globals_1.expect)(template).toBeUndefined();
    });
    (0, globals_1.test)('should return undefined for non-existing custom prompt id', () => {
        const customPrompt = templateManager.getCustomPromptById('non_existing_prompt');
        (0, globals_1.expect)(customPrompt).toBeUndefined();
    });
});
describe('PromptBuilder', () => {
    let jsonLoader;
    let templateManager;
    let variableSubstitutor;
    let promptBuilder;
    const mockTemplateManager = new MockTemplateManager();
    beforeEach(() => {
        jsonLoader = new GPTPrompt_1.JsonLoader();
        templateManager = new GPTPrompt_1.TemplateManager(jsonLoader);
        variableSubstitutor = new GPTPrompt_1.VariableSubstitutor();
        promptBuilder = new GPTPrompt_1.PromptManager(templateManager, variableSubstitutor);
    });
    (0, globals_1.test)('should create and build a new template correctly', () => __awaiter(void 0, void 0, void 0, function* () {
        const templateId = 'test_template';
        const templateString = 'Hello, {{name}}!';
        const metadata = {};
        yield promptBuilder.createTemplate(templateId, templateString, metadata);
        // Check if the template was created correctly
        const createdTemplate = templateManager.getTemplateById(templateId);
        (0, globals_1.expect)(createdTemplate).toEqual({
            id: templateId,
            content: templateString,
            metadata: metadata,
        });
        const substitutions = { name: 'John' };
        const builtPrompt = yield promptBuilder.buildPrompt(templateId, substitutions);
        (0, globals_1.expect)(builtPrompt).toBe('Hello, John!');
    }));
    (0, globals_1.test)('should build a dynamic prompt correctly', () => __awaiter(void 0, void 0, void 0, function* () {
        const templateId1 = 'test_template1';
        const templateString1 = 'Hello, {{name}}!';
        const metadata1 = {};
        yield promptBuilder.createTemplate(templateId1, templateString1, metadata1);
        const templateId2 = 'test_template2';
        const templateString2 = ' Have a great day, {{name}}!';
        const metadata2 = {};
        yield promptBuilder.createTemplate(templateId2, templateString2, metadata2);
        const substitutions = { name: 'John' };
        const builtPrompt = yield promptBuilder.buildDynamicPrompt([templateId1, templateId2], substitutions);
        (0, globals_1.expect)(builtPrompt).toBe('Hello, John! Have a great day, John!');
    }));
    (0, globals_1.test)('should get template metadata correctly', () => {
        promptBuilder = new GPTPrompt_1.PromptManager(mockTemplateManager, variableSubstitutor);
        const templateId = 'test_template';
        const metadata = promptBuilder.getTemplateMetadata(templateId);
        (0, globals_1.expect)(metadata).toEqual({});
    });
    (0, globals_1.test)('should get custom prompt metadata correctly', () => {
        promptBuilder = new GPTPrompt_1.PromptManager(mockTemplateManager, variableSubstitutor);
        const promptId = 'custom_prompt';
        const metadata = promptBuilder.getCustomPromptMetadata(promptId);
        (0, globals_1.expect)(metadata).toEqual({ decorators: [], validators: [] });
    });
    (0, globals_1.test)('should get metadata with specific decorators and validators correctly', () => __awaiter(void 0, void 0, void 0, function* () {
        const templateId = 'template_with_metadata';
        yield promptBuilder.createTemplate(templateId, 'Hello, {{name}}!', {
            // @ts-ignore
            decorators: ['trim'],
            // @ts-ignore
            validators: ['maxLength(10)'],
        });
        const metadata = yield promptBuilder.getTemplateMetadata(templateId);
        (0, globals_1.expect)(metadata).toEqual({
            decorators: ['trim'],
            validators: ['maxLength(10)'],
        });
    }));
});
describe('PromptValidator and PromptDecorator', () => {
    const maxLengthValidatorFn = (0, GPTPromptDecorators_1.maxLengthValidator)(10);
    const minLengthValidatorFn = (0, GPTPromptDecorators_1.minLengthValidator)(1);
    const inputValidator = new GPTPromptDecorators_1.PromptInputValidator([maxLengthValidatorFn, minLengthValidatorFn]);
    const outputValidator = new GPTPromptDecorators_1.PromptOutputValidator([maxLengthValidatorFn]);
    const beforeDecoratorFn = GPTPromptDecorators_1.trimDecorator;
    const beforeDecorator = new GPTPromptDecorators_1.PromptBeforeDecorator([beforeDecoratorFn]);
    (0, globals_1.test)('should validate input correctly', () => {
        const validInput = 'Test input';
        const invalidInput = 'This input is too long and should fail the maxLengthValidator';
        (0, globals_1.expect)(inputValidator.validate(validInput)).toBe(true);
        (0, globals_1.expect)(inputValidator.validate(invalidInput)).toBe(false);
    });
    (0, globals_1.test)('should validate output correctly', () => {
        const validOutput = 'Test out'; // Shortened to comply with the maxLengthValidator
        const invalidOutput = 'This output is too long and should fail the maxLengthValidator';
        (0, globals_1.expect)(outputValidator.validate(validOutput)).toBe(true);
        (0, globals_1.expect)(outputValidator.validate(invalidOutput)).toBe(false);
    });
    (0, globals_1.test)('should apply before decorator correctly', () => {
        const stringWithSpaces = '  Trim this string  ';
        const stringWithoutSpaces = 'Trim this string';
        (0, globals_1.expect)(beforeDecorator.preprocess(stringWithSpaces)).toBe(stringWithoutSpaces);
    });
});
describe('TemplateManager', () => {
    let templateManager;
    let jsonLoader;
    beforeEach(() => {
        jsonLoader = new GPTPrompt_1.JsonLoader();
        templateManager = new GPTPrompt_1.TemplateManager(jsonLoader);
    });
    (0, globals_1.test)('should save templates to file correctly', () => __awaiter(void 0, void 0, void 0, function* () {
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
        ];
        templateManager.templates = templates;
        const filePath = '/tmp/templates-test.json';
        yield templateManager.saveTemplatesToFile(filePath);
        const savedTemplates = yield fs_extra_1.default.readJson(filePath);
        (0, globals_1.expect)(savedTemplates).toEqual(templates);
        // Clean up
        yield fs_extra_1.default.remove(filePath);
    }));
    (0, globals_1.test)('should save custom prompts to file correctly', () => __awaiter(void 0, void 0, void 0, function* () {
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
        ];
        templateManager.customPrompts = customPrompts;
        const filePath = '/tmp/custom-prompts-test.json';
        yield templateManager.saveCustomPromptsToFile(filePath);
        const savedCustomPrompts = yield fs_extra_1.default.readJson(filePath);
        (0, globals_1.expect)(savedCustomPrompts).toEqual(customPrompts);
        // Clean up
        yield fs_extra_1.default.remove(filePath);
    }));
});
// Tests for validators and decorators
describe('Validators and Decorators', () => {
    (0, globals_1.test)('regexSubstringCountValidator should validate correctly', () => {
        const validator = (0, GPTPromptDecorators_1.regexSubstringCountValidator)(/[aeiou]/gi, 5, (a, b) => a >= b);
        (0, globals_1.expect)(validator('This is a test with enough vowels.')).toBe(true);
        (0, globals_1.expect)(validator('This isn\'t :-().')).toBe(false);
    });
    (0, globals_1.test)('forbiddenWordsValidator should validate correctly', () => {
        const validator = (0, GPTPromptDecorators_1.forbiddenWordsValidator)(['badword', 'anotherbadword']);
        (0, globals_1.expect)(validator('This text contains no bad words.')).toBe(true);
        (0, globals_1.expect)(validator('This text has a badword in it.')).toBe(false);
    });
    (0, globals_1.test)('mandatoryWordsValidator should validate correctly', () => {
        const validator = (0, GPTPromptDecorators_1.mandatoryWordsValidator)(['first', 'second', 'third']);
        (0, globals_1.expect)(validator('This text contains the first, second, and third words.')).toBe(true);
        (0, globals_1.expect)(validator('This text has only the first and second words.')).toBe(false);
    });
    (0, globals_1.test)('stringEscapingDecorator should escape strings correctly', () => {
        const input = `<script>alert("Hello!");</script>`;
        const expected = `&lt;script&gt;alert(&quot;Hello!&quot;);&lt;/script&gt;`;
        (0, globals_1.expect)((0, GPTPromptDecorators_1.stringEscapingDecorator)(input)).toBe(expected);
    });
    (0, globals_1.test)('logToFileDecorator should log to a file correctly', () => __awaiter(void 0, void 0, void 0, function* () {
        const filePath = '/tmp/test_log.txt';
        const decorator = (0, GPTPromptDecorators_1.logToFileDecorator)(filePath);
        const testMessage = 'Testing log to file.';
        decorator(testMessage);
        const fileContent = yield fs_extra_1.default.promises.readFile(filePath, 'utf-8');
        (0, globals_1.expect)(fileContent).toContain(testMessage);
        // Clean up the test log file
        yield fs_extra_1.default.promises.unlink(filePath);
    }));
    (0, globals_1.test)('should fail if 3 previous prompts were identical', () => {
        const promptValidator = new GPTPromptDecorators_1.RepeatValidator([]);
        const identicalPrompt = 'This prompt is the same as the previous one.';
        const differentPrompt = 'This prompt is different from the previous one.';
        promptValidator.validate(differentPrompt);
        promptValidator.validate(identicalPrompt);
        promptValidator.validate(identicalPrompt);
        (0, globals_1.expect)(() => promptValidator.validate(identicalPrompt)).toThrow('Failed: 3 previous prompts were identical.');
    });
});
describe('PromptBuilder', () => {
    let jsonLoader;
    let templateManager;
    let variableSubstitutor;
    let promptBuilder;
    const mockTemplateManager = new MockTemplateManager();
    beforeEach(() => {
        jsonLoader = new GPTPrompt_1.JsonLoader();
        templateManager = new GPTPrompt_1.TemplateManager(jsonLoader);
        variableSubstitutor = new GPTPrompt_1.VariableSubstitutor();
        promptBuilder = new GPTPrompt_1.PromptManager(templateManager, variableSubstitutor);
    });
    (0, globals_1.test)('should throttle prompts if too many were sent', () => __awaiter(void 0, void 0, void 0, function* () {
        const templateId = 'test_template';
        const templateString = 'Hello, {{name}}!';
        const metadata = {};
        promptBuilder = new GPTPrompt_1.PromptManager(mockTemplateManager, variableSubstitutor, undefined, undefined, 2, 2);
        yield promptBuilder.createTemplate(templateId, templateString, metadata);
        templateManager.getTemplateById(templateId);
        const startTime = Date.now();
        for (let i = 0; i < 3; i++) {
            yield promptBuilder.buildPrompt(templateId, { name: 'John' });
        }
        const endTime = Date.now();
        const elapsedTime = endTime - startTime;
        // Check that the 3rd prompt took at least 2 second to be built
        (0, globals_1.expect)(elapsedTime).toBeGreaterThanOrEqual(1000);
    }));
    (0, globals_1.test)('should prettify TypeScript code correctly', () => __awaiter(void 0, void 0, void 0, function* () {
        const decorator = new GPTPromptDecorators_1.PrettifyCodeDecorator();
        const code = 'const x=1;function test(){return x;}';
        const expected = [`const x = 1;`, `function test() {`, `  return x;`, `}`, ``].join('\n');
        const result = yield decorator.decorate(code);
        (0, globals_1.expect)(result).toBe(expected);
    }));
    (0, globals_1.test)('should minify TypeScript code correctly', () => __awaiter(void 0, void 0, void 0, function* () {
        const decorator = new GPTPromptDecorators_1.MinifyCodeDecorator();
        const code = [``, `const x = 1;`, `function test() {`, `  return x;`, `}`, ``].join('\n');
        const expected = 'const x=1;function test(){return x}';
        const result = yield decorator.decorate(code);
        (0, globals_1.expect)(result).toBe(expected);
    }));
    (0, globals_1.test)('should shorten consecutive spaces correctly', () => __awaiter(void 0, void 0, void 0, function* () {
        const decorator = new GPTPromptDecorators_1.ShortenSpacesDecorator();
        const stringWithExtraSpaces = 'This  is   a   string    with  extra   spaces.';
        const expected = 'This is a string with extra spaces.';
        const result = yield decorator.decorate(stringWithExtraSpaces);
        (0, globals_1.expect)(result).toBe(expected);
    }));
    (0, globals_1.test)('should split content into a list of sentences correctly', () => __awaiter(void 0, void 0, void 0, function* () {
        const decorator = new GPTPromptDecorators_1.SplitSentencesDecorator();
        const text = 'This is a sentence. And this is another one! Here is a question? A semicolon; A colon: Done.';
        const expected = [
            'This is a sentence.',
            'And this is another one!',
            'Here is a question?',
            'A semicolon;',
            'A colon:',
            'Done.',
        ];
        const result = yield decorator.decorate(text);
        (0, globals_1.expect)(result).toEqual(expected);
    }));
    // test('should apply stemming correctly', async () => {
    //     const decorator = new StemmingDecorator()
    //     const text = 'running jumped swimming'
    //     const expected = 'run jump swim'
    //     const result = await decorator.decorate(text)
    //     expect(result).toBe(expected)
    // })
    (0, globals_1.test)('should extract substrings between start and end strings correctly', () => __awaiter(void 0, void 0, void 0, function* () {
        const start = 'are';
        const end = 'you';
        const decorator = new GPTPromptDecorators_1.ExtractSubstringsDecorator(start, end);
        const content = "Hello, how are you? Are you okay? You are very tired, aren't you? You aren't in your prime anymore.";
        const expected = [' ', " very tired, aren't ", "n't in "];
        const result = yield decorator.decorate(content);
        (0, globals_1.expect)(result).toEqual(expected);
    }));
    (0, globals_1.test)('Should correctly extract when start and end delineators are the same', () => __awaiter(void 0, void 0, void 0, function* () {
        const start = 'are';
        const end = 'are';
        const decorator = new GPTPromptDecorators_1.ExtractSubstringsDecorator(start, end);
        const content = "Hello, how are you? Are you okay? You are very tired, aren't you? You aren't in your prime anymore.";
        const expected = [' you? Are you okay? You ', "n't you? You "];
        const result = yield decorator.decorate(content);
        (0, globals_1.expect)(result).toEqual(expected);
    }));
});
//# sourceMappingURL=GPTPrompt.test.js.map