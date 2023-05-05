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
exports.run2ReflectionPrompt = exports.run2SubtaskImplementationPrompt = exports.run2AreThereMoreTodosPrompt = exports.run2 = void 0;
const GPTPrompt_1 = require("./core/GPTPrompt");
const CodeMerger_1 = require("./core/CodeMerger");
const main_1 = require("./main");
function run2() {
    return __awaiter(this, void 0, void 0, function* () {
        const initialTitle = "Request TypeScript interfaces";
        const initialPrompt = yield run2FirstAnswerPrompt();
        const recursiveSubtaskCount = 2;
        const gpt = (0, main_1.standardGPTContextSetup)();
        const mainChat = yield gpt.fork();
        let finalCode = yield (0, main_1.standardRun)(mainChat, initialPrompt, initialTitle, recursiveSubtaskCount);
        let messages = [];
        yield (0, main_1.readFromMessageLog)(messages);
        // messages = [await fs.readFile("src/CodeMerger.ts", "utf8",)]
        // messages = [await fs.readFile("demo/CodeMergeDemo.ts", "utf8",)]
        // messages[0] = `<customcode>${messages[0]}</customcode>`
        // const codeBlockMerger = new CodeBlockMerger('<customcode>', '</customcode>')
        const codeBlockMerger = new CodeMerger_1.CodeBlockMerger('```', '```');
        const mergedCode = codeBlockMerger.mergeCodeBlocks(messages);
        console.log(mergedCode);
        const expectedMergedCodeLength = 5605;
        console.log(mergedCode.length);
        if (expectedMergedCodeLength !== mergedCode.length)
            throw new Error("Something broke.");
    });
}
exports.run2 = run2;
function run2FirstAnswerPrompt() {
    return __awaiter(this, void 0, void 0, function* () {
        const beforeval = [`ROLE: Expert typescript developer`, `TASK: Write interfaces, types and abstract classes for items in REQUIREMENTS LIST`, `ADDITIONAL TASKS:`, `- Use generics and decorators to make code more modular`, `- Annotate with next steps for how to implement classes`, `- Do not write definitions for abstract classes. Only declaration.`, `FORMAT OF REPLY:`, "```", `type MyInterface<T> {`, `condition: (message: T) => boolean;`, `style: string;`, `}`, "```", "REQUIREMENTS LIST:", `A "prompt builder" that helps developers write and organize their prompts for ChatGPT.`, `It needs to be able to do the following:`, `1) Prompt management`, `- Load prompt templates from a JSON file`, `- Load custom prompts from another JSON file`, `2) Template variable substitution`, `- Variables can be declared in templates and custom prompts, and variables (strings) are injected at runtime.`, `3) Dynamic prompt building`, `- It should be possible to reference multiple smaller templates to build larger prompts.`, `- Templates can be selected based on conditional logic at runtime.`, `4) Metadata`, `- Templates and custom prompts can be tagged with metadata.`, `- This metadata should be stored in file.`, `4) Smart prompts`, `- There will be 2 special types of metadata: Validators, and Decorators. Both are references to functions.`, `- A validator can evaluate the input prompt or the output response, and throw an error if validation failed.`, `- Decorators allow callbacks to be injected as preprocessors and postprocessors when sending prompts and receiving replies.`, ``, `If you understand the task, you may start. Remember: Only interfaces, types and abstract classes. No definitions. Use generics and decorators wherever it makes sense.`,];
        const returnval = yield new GPTPrompt_1.PromptBuilder().load('run 2, initial input');
        const beforelength = beforeval.join('\n').length;
        const returnlength = returnval.length;
        if (beforelength !== returnlength)
            throw new Error('Something broke');
        return returnval;
    });
}
function run2AreThereMoreTodosPrompt(i) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield new GPTPrompt_1.PromptBuilder().load('run 2, are there more TODOs?', { i: i });
        // return [ //     `Thank you for working on this subtask.`, //     `Is there anything else that needs to be done in order to finalize this subtask?`, //     `Answer in the following format, in a code block:`, //     ``, //     "```", //     `- Subtask ${i}, remaining TODO #1: Description`, //     `- Subtask ${i}, remaining TODO #2: Description`, //     "```", //     ``, //     `(if there are no remaining TODOs, just answer "This subtask is done")`, //     `Remember, it should be possible to work on the remaining TODOs in isolation and in parallel. `, //     `Only when this list of remaining TODOs is finished can we move on to the next step.`, // ].join('\n')
    });
}
exports.run2AreThereMoreTodosPrompt = run2AreThereMoreTodosPrompt;
function run2SubtaskImplementationPrompt(i) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield new GPTPrompt_1.PromptBuilder().load('run 2, subtask implementation', { i: i });
        // return [ //     `Can you show me an implementation of #${i}?`, //     `Don't write any comments, and don't show me examples of how to use it.`, //     `I only want the declarations and definitions.`, // ].join('\n')
    });
}
exports.run2SubtaskImplementationPrompt = run2SubtaskImplementationPrompt;
function run2ReflectionPrompt() {
    return __awaiter(this, void 0, void 0, function* () {
        return yield new GPTPrompt_1.PromptBuilder().load('run 2, reflection');
        // return `Before we continue, can you review your answer and tell me if you think it's correct? If yes, say "yes". If no, show me the correction.`
    });
}
exports.run2ReflectionPrompt = run2ReflectionPrompt;
//# sourceMappingURL=request_typescript_interfaces.js.map