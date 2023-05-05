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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const mocha_1 = require("mocha");
const JsonLoader_1 = __importDefault(require("./JsonLoader"));
const TemplateManager_1 = __importDefault(require("./TemplateManager"));
const VariableSubstitutor_1 = __importDefault(require("./VariableSubstitutor"));
const PromptBuilder_1 = __importDefault(require("./PromptBuilder"));
const PromptValidator_1 = __importDefault(require("./PromptValidator"));
const PromptDecorator_1 = __importDefault(require("./PromptDecorator"));
// Define unit tests
(0, mocha_1.describe)('PromptBuilder', () => {
    (0, mocha_1.describe)('#loadTemplateFromFile()', () => {
        (0, mocha_1.it)('should load templates from a JSON file', () => __awaiter(void 0, void 0, void 0, function* () {
            const loader = new JsonLoader_1.default();
            const manager = new TemplateManager_1.default(loader);
            const templates = yield manager.loadTemplatesFromFile('templates.json');
            (0, chai_1.expect)(templates).to.be.an('array');
            (0, chai_1.expect)(templates).to.have.lengthOf.at.least(1);
            (0, chai_1.expect)(templates[0]).to.have.property('templateId');
            (0, chai_1.expect)(templates[0]).to.have.property('templateString');
        }));
    });
    (0, mocha_1.describe)('#loadCustomPromptFromFile()', () => {
        (0, mocha_1.it)('should load custom prompts from a JSON file', () => __awaiter(void 0, void 0, void 0, function* () {
            const loader = new JsonLoader_1.default();
            const manager = new TemplateManager_1.default(loader);
            const prompts = yield manager.loadCustomPromptsFromFile('prompts.json');
            (0, chai_1.expect)(prompts).to.be.an('array');
            (0, chai_1.expect)(prompts).to.have.lengthOf.at.least(1);
            (0, chai_1.expect)(prompts[0]).to.have.property('promptId');
            (0, chai_1.expect)(prompts[0]).to.have.property('promptString');
        }));
    });
    (0, mocha_1.describe)('#buildPrompt()', () => {
        (0, mocha_1.it)('should build a prompt from a template and substitutions', () => __awaiter(void 0, void 0, void 0, function* () {
            const loader = new JsonLoader_1.default();
            const manager = new TemplateManager_1.default(loader);
            const substitutor = new VariableSubstitutor_1.default();
            const builder = new PromptBuilder_1.default(manager, substitutor);
            const templates = yield manager.loadTemplatesFromFile('templates.json');
            const templateId = templates[0].templateId;
            const substitutions = {
                name: 'John',
                age: '30',
            };
            const prompt = builder.buildPrompt(templateId, substitutions);
            (0, chai_1.expect)(prompt).to.be.a('string');
            (0, chai_1.expect)(prompt).to.include('John');
            (0, chai_1.expect)(prompt).to.include('30');
        }));
    });
    (0, mocha_1.describe)('#buildDynamicPrompt()', () => {
        (0, mocha_1.it)('should build a prompt from multiple templates and substitutions', () => __awaiter(void 0, void 0, void 0, function* () {
            const loader = new JsonLoader_1.default();
            const manager = new TemplateManager_1.default(loader);
            const substitutor = new VariableSubstitutor_1.default();
            const builder = new PromptBuilder_1.default(manager, substitutor);
            const templates = yield manager.loadTemplatesFromFile('templates.json');
            const templateIds = templates.map(template => template.templateId);
            const substitutions = {
                name: 'John',
                age: '30',
            };
            const prompt = builder.buildDynamicPrompt(templateIds, substitutions);
            (0, chai_1.expect)(prompt).to.be.a('string');
            (0, chai_1.expect)(prompt).to.include('John');
            (0, chai_1.expect)(prompt).to.include('30');
        }));
    });
    (0, mocha_1.describe)('#getTemplateMetadata()', () => {
        (0, mocha_1.it)('should return the metadata for a template', () => __awaiter(void 0, void 0, void 0, function* () {
            const loader = new JsonLoader_1.default();
            const manager = new TemplateManager_1.default(loader);
            const builder = new PromptBuilder_1.default(manager);
            const templates = yield manager.loadTemplatesFromFile('templates.json');
            const templateId = templates[0].templateId;
            const metadata = builder.getTemplateMetadata(templateId);
            (0, chai_1.expect)(metadata).to.be.an('object');
        }));
        (0, mocha_1.describe)('#getCustomPromptMetadata()', () => {
            (0, mocha_1.it)('should return the metadata for a custom prompt', () => __awaiter(void 0, void 0, void 0, function* () {
                const loader = new JsonLoader_1.default();
                const manager = new TemplateManager_1.default(loader);
                const builder = new PromptBuilder_1.default(manager);
                const prompts = yield manager.loadCustomPromptsFromFile('prompts.json');
                const promptId = prompts[0].promptId;
                const metadata = builder.getCustomPromptMetadata(promptId);
                (0, chai_1.expect)(metadata).to.be.an('object');
            }));
        });
        (0, mocha_1.describe)('#applyValidators()', () => {
            (0, mocha_1.it)('should validate a prompt using validators', () => {
                const prompt = 'Hello world!';
                const validators = [str => str.includes('world')];
                const validator = new PromptValidator_1.default(validators);
                (0, chai_1.expect)(() => validator.validate(prompt)).to.not.throw();
                const invalidPrompt = 'Hello universe!';
                (0, chai_1.expect)(() => validator.validate(invalidPrompt)).to.throw();
            });
        });
        (0, mocha_1.describe)('#applyDecorators()', () => {
            (0, mocha_1.it)('should preprocess and postprocess a prompt using decorators', () => {
                const prompt = 'Hello world!';
                const preprocessors = [
                    str => str.toUpperCase(),
                    str => str.replace('WORLD', 'Universe'),
                ];
                const postprocessors = [
                    str => str.toLowerCase(),
                    str => str.replace('UNIVERSE', 'world'),
                ];
                const decorator = new PromptDecorator_1.default(preprocessors, postprocessors);
                const processedPrompt = decorator.preprocess(prompt);
                (0, chai_1.expect)(processedPrompt).to.equal('HELLO UNIVERSE!');
                const postProcessedPrompt = decorator.postprocess(processedPrompt);
                (0, chai_1.expect)(postProcessedPrompt).to.equal('hello world!');
            });
        });
    });
});
//# sourceMappingURL=newFile.js.map