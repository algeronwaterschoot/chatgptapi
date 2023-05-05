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
exports.run2 = void 0;
const GPTPrompt_1 = require("../core/GPTPrompt");
const CodeMerger_1 = require("../core/CodeMerger");
const Errors_1 = require("../core/Errors");
const GPTSandbox_1 = require("../core/GPTSandbox");
const GPTHelpers_1 = require("../core/GPTHelpers");
const defaultChatGPTSetup_1 = require("./defaultChatGPTSetup");
function run2() {
    return __awaiter(this, void 0, void 0, function* () {
        const chatTitle = "Request TypeScript interfaces";
        const firstPrompt = yield run2FirstAnswerPrompt();
        const recursiveDepth = 2;
        const gpt = (0, defaultChatGPTSetup_1.defaultChatGPTSetup)();
        const mainChat = yield gpt.fork();
        const firstAnswer = yield mainChat.send(firstPrompt);
        mainChat.tagOurs((tag) => tag.set("title", chatTitle));
        mainChat.tagTheirs((tag) => tag.set("title", "Gives answer"));
        let mainCode = yield run2Reflection(mainChat, firstAnswer);
        // let output: string[] = []
        // output.push(mainCode)
        const initialSubtaskPrompt = yield (0, GPTPrompt_1.GPTPrompt)('standard subtask prompt');
        yield run2TryRecursiveSubtasks(recursiveDepth, mainChat, initialSubtaskPrompt);
        // let overrideOutput = await standardOverrideOutput(mainChat)
        // let finalCode = overrideOutput.join("\n").split("\n").join("\n")
        // return finalCode
        let messages = [];
        yield (0, GPTHelpers_1.readEntireMessageLog)(messages);
        // messages = [await fs.readFile("src/CodeMerger.ts", "utf8",)]
        // messages = [await fs.readFile("demo/CodeMergeDemo.ts", "utf8",)]
        // messages[0] = `<customcode>${messages[0]}</customcode>`
        // const codeBlockMerger = new CodeBlockMerger('<customcode>', '</customcode>')
        const codeBlockMerger = new CodeMerger_1.CodeBlockMerger('```', '```');
        const mergedCode = codeBlockMerger.invoke(messages);
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
        const returnval = yield (0, GPTPrompt_1.GPTPrompt)('run 2, initial input');
        const beforelength = beforeval.join('\n').length;
        const returnlength = returnval.length;
        if (beforelength !== returnlength)
            throw new Error('Something broke');
        return returnval;
    });
}
function run2TryRecursiveSubtasks(depth, branch, prompt) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield run2RecursiveSubtasks(depth, branch, prompt);
        }
        catch (error) {
            if (!(error instanceof Errors_1.GPTCodeBlockError))
                throw error;
            // The answer didn't fit in ChatGPT's output buffer. Mark it in the metadata, and continue.
            const overflowError = { error: error, };
            const guiltySubThread = branch.subthreads.slice(-1)[0];
            guiltySubThread.tagTheirs((tag) => {
                tag.set("title", "Output buffer overflow");
                tag.set("Error", overflowError);
            });
        }
    });
}
function run2RecursiveSubtasks(depth, ctx, prompt) {
    return __awaiter(this, void 0, void 0, function* () {
        depth--;
        const subtasksList = yield ctx.send(prompt);
        ctx.tagOurs((tag) => tag.set("title", "Ask for list of subtasks"));
        ctx.tagTheirs((tag) => tag.set("title", "Gives answer"));
        let sanitizedList = (yield (0, GPTSandbox_1.extractCodeBlocks)(subtasksList)).join("").trim();
        let subtasks = sanitizedList
            .split("\n")
            .filter((x) => x)
            .map((x) => x.substring(x.indexOf(":") + 1, x.indexOf(".") + 1).trim());
        // If there are no subtasks, return.
        // If there is only one subtask, ChatGPT probably put "this subtask is done" in a code block,
        // which it was asked not to, but well... In that scenario, also return.
        if (subtasks.length < 2)
            return;
        let i = 0;
        for (let subtask of subtasks) {
            i++;
            let devCtx = yield ctx.fork();
            const answer = yield devCtx.send(yield (0, GPTPrompt_1.GPTPrompt)('run 2, subtask implementation', { i: i }));
            devCtx.tagOurs((meta) => meta.set("title", subtask));
            devCtx.tagTheirs((meta) => meta.set("title", "Provides implementation"));
            let correctCode = yield run2Reflection(devCtx, answer);
            // output.push(correctCode)
            if (depth > 0) {
                const nextPrompt = yield (0, GPTPrompt_1.GPTPrompt)('run 2, are there more TODOs?', { i: i });
                yield run2TryRecursiveSubtasks(depth, devCtx, nextPrompt);
            }
        }
    });
}
function run2Reflection(context, firstAnswer, retries = 5) {
    return __awaiter(this, void 0, void 0, function* () {
        firstAnswer = (yield (0, GPTSandbox_1.extractCodeBlocks)(firstAnswer)).join("\n");
        let bestAnswer = firstAnswer;
        let validate = "N/A";
        let tries = 0;
        while (validate.length > 0 && tries < retries) {
            tries++;
            let newAnswer = yield context.send(yield (0, GPTPrompt_1.GPTPrompt)('run 2, reflection'));
            validate = (yield (0, GPTSandbox_1.extractCodeBlocks)(newAnswer)).join("\n");
            context.tagOurs((meta) => meta.set("title", "Ask ChatGPT to reflect on answer"));
            if (validate.length > 0) {
                bestAnswer = validate;
                const reflect = { wasCorrect: false };
                context.tagTheirs((tag) => {
                    tag.set("title", "I was wrong");
                    tag.set("Reflect", reflect);
                });
            }
            else {
                const reflect = { wasCorrect: true };
                context.tagTheirs((tag) => {
                    tag.set("title", "I was right");
                    tag.set("Reflect", reflect);
                });
            }
        }
        return bestAnswer;
    });
}
// TODO: Check if this TODO is still a TODO :-)
/*
// TODO: "correctCodes" is obviously not correct since we've done no validation on it.
// and ChatGPT has the habit of only giving partial answers if the method/function is too big.
// Therefore we'll just override it with all of the code we got from ChatGPT so far,
// and we'll puzzle it together manually until we have a better way to automerge everything.
async function standardOverrideOutput(mainChat: GPTContext) {
    let searchResults: ChatGPTMessage[] = (await (
        await configureSearch(new GPTMessageSearch(mainChat), SearchScope.Genealogy)
    ).all()) as ChatGPTMessage[]
    let outputMap = new Map<number, string>()
    let overrideOutput = []
    let i = 0
    for (let message of searchResults) {
        try {
            const codes: string[] = await extractCodeBlocks(message.content)
            if (codes.length > 0) { outputMap.set(message.body.sequence!, codes.join("\n")) }
        } catch (error) {
            if (!(error instanceof FlowChatCodeBlockError)) throw error
            // The answer didn't fit in ChatGPT's output buffer.
        }
    }
    const sequenceKeys = Array.from(outputMap.keys()).sort()
    for (let sequence of sequenceKeys) {
        overrideOutput.push(outputMap.get(sequence)!)
    }
    return overrideOutput
}
*/ 
//# sourceMappingURL=request_typescript_interfaces.js.map