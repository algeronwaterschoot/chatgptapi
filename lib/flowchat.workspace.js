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
exports.whoIsGuilty = exports.run3 = exports.run2 = exports.run = exports.taskEnum = exports.gptCopyForDevelopment = exports.UUID = void 0;
const uuid_1 = require("uuid");
// @ts-ignore
function UUID() {
    return GPTSandbox_1.isNodeJs ? (0, uuid_1.v4)() : crypto.randomUUID();
}
exports.UUID = UUID;
const GPTContext_1 = require("./GPTContext");
const GPTSearch_1 = require("./GPTSearch");
const GPTSandbox_1 = require("./GPTSandbox");
const GPTSearch_2 = require("./GPTSearch");
const GPTMermaid_1 = require("./GPTMermaid");
const GPTAPI_1 = require("./GPTAPI");
const Errors_1 = require("./Errors");
const FlowchatPlugin_1 = require("./FlowchatPlugin");
const GPTPrompt_1 = require("./GPTPrompt");
exports.taskEnum = { selfHeal: "Self-healing code", judge: "Judge", CODE: "Code branch", TEST: "Test branch", SANDBOX: "Sandbox", NONE: "None", EXTERNAL: "External factors", BOTH: "Both", };
require("./CodeMerger");
const CodeMerger_1 = require("./CodeMerger");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        const gpt = new GPTContext_1.ChatGPTContext("New chat");
        // gpt.api = new FlowChatMessageLogMockGPTAPI();
        exports.gptCopyForDevelopment = gpt;
        const mainChat = yield gpt.fork();
        const functionStubs = yield mainChat.prompt(yield run1FunctionStubsPrompt());
        const correctCodes = [];
        for (let functionName of ["extractFunction", "replaceFunction"]) {
            let devBranch = yield mainChat.fork();
            let devCode = yield initialize_dev(functionName, devBranch);
            let testBranch = yield mainChat.fork();
            let testCode = yield initialize_test(functionName, testBranch);
            let judge = yield mainChat.fork();
            // The judge should always receive messages from the testing environment.
            // judge.addToMetadata('receiver', myTaskEnum.judge);
            // judge.addToMetadata('message', `Show failed test to judge`);
            // judge.addToMetadata('sender', myTaskEnum.SANDBOX);
            // TODO: Add formatter to code so it's idempotent.
            let results = yield (0, GPTSandbox_1.sandboxEval)(devCode + "\n" + testCode);
            for (let i = 0; i < 5; i++) {
                if (results.output == "success")
                    results.success = true; // TODO: Figure out why this sometimes happens.
                if (!results.success) {
                    let error = results.output;
                    let verdict = yield judge.prompt(yield run1JudgeVerdictPrompt(functionName, error, devCode, testCode));
                    let guilty = whoIsGuilty(verdict); // TODO: replace with judge metadata
                    if (guilty == exports.taskEnum.BOTH) {
                        devCode = yield blame(devBranch, error, verdict, exports.taskEnum.CODE);
                        testCode = yield blame(testBranch, error, verdict, exports.taskEnum.TEST);
                    }
                    else if (guilty == exports.taskEnum.CODE)
                        devCode = yield blame(devBranch, error, verdict, exports.taskEnum.CODE);
                    else if (guilty == exports.taskEnum.TEST)
                        testCode = yield blame(testBranch, error, verdict, exports.taskEnum.TEST);
                    else if (guilty == exports.taskEnum.NONE) {
                        console.error("VERDICT:\n", verdict);
                        continue;
                    }
                    else {
                        devBranch = yield mainChat.fork(); // We'll try a hard reset.
                        testBranch = yield mainChat.fork();
                        devCode = yield initialize_dev(functionName, devBranch);
                        testCode = yield initialize_test(functionName, testBranch);
                    }
                    results = yield (0, GPTSandbox_1.sandboxEval)(devCode + "\n" + testCode);
                }
            }
            if (!results.success)
                console.error("Failed. Aborting.");
            else
                correctCodes.push(devCode, testCode);
            const tests = { test1: new GPTSearch_2.GPTMessageSearch([gpt, mainChat]).byContent("javascript"), };
        }
        let search = yield (yield (0, GPTSearch_1.configureSearch)(new GPTSearch_2.GPTMessageSearch(mainChat), GPTSearch_1.SearchScope.Genealogy)).all();
        let flatMessageLog = search.map((x) => `${x.body.role}: ${x.content}`);
        const expectedMessageLog = run1SanityTest();
        for (let i in flatMessageLog) {
            if (flatMessageLog[i] !== expectedMessageLog[i])
                throw new Error("Something broke");
        }
        console.log("Made it to the end");
        function blame(branch, output, verdict, guilty) {
            return __awaiter(this, void 0, void 0, function* () {
                let code = yield branch.prompt(yield run1BlamePrompt(output, verdict));
                code = yield (0, GPTSandbox_1.deprecatedExtractCodeFromChatReply)([code]);
                code = code.trim();
                return code;
            });
        }
        function initialize_test(functionName, testBranch) {
            return __awaiter(this, void 0, void 0, function* () {
                const testPrompt = yield run1InitTestPrompt(functionName);
                let testCode = yield testBranch.prompt(testPrompt);
                testCode = yield (0, GPTSandbox_1.deprecatedExtractCodeFromChatReply)([testCode]);
                testCode = testCode.trim();
                return testCode;
            });
        }
        function initialize_dev(functionName, devBranch) {
            return __awaiter(this, void 0, void 0, function* () {
                const devPrompt = yield run1InitDevPrompt(functionName);
                let devCode = yield devBranch.prompt(devPrompt);
                devCode = yield (0, GPTSandbox_1.deprecatedExtractCodeFromChatReply)([devCode]);
                devCode = devCode.trim();
                return devCode;
            });
        }
    });
}
exports.run = run;
function run2() {
    return __awaiter(this, void 0, void 0, function* () {
        const initialTitle = "Request TypeScript interfaces";
        const initialPrompt = yield run2FirstAnswerPrompt();
        const recursiveSubtaskCount = 2;
        const gpt = standardGPTContextSetup();
        const mainChat = yield gpt.fork();
        let finalCode = yield standardRun(mainChat, initialPrompt, initialTitle, recursiveSubtaskCount);
        let messages = [];
        yield readFromMessageLog(messages);
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
function readFromMessageLog(messages) {
    return __awaiter(this, void 0, void 0, function* () {
        const jsonLoader = new GPTPrompt_1.JsonLoader();
        let messageLog = yield jsonLoader.load("sample_data/logs/messages.log");
        // @ts-ignore
        for (let log of messageLog["message log"]) {
            messages.push(log.user ? log.user : log.assistant);
        }
    });
}
function run3() {
    return __awaiter(this, void 0, void 0, function* () {
        const title = "Request TypeScript interfaces";
        const firstPrompt = yield run3FirstAnswerPrompt();
        const recursiveSubtaskCount = 2;
        const gpt = standardGPTContextSetup();
        const mainChat = yield gpt.fork();
        let finalCode = yield standardRun(mainChat, firstPrompt, title, recursiveSubtaskCount);
    });
}
exports.run3 = run3;
function standardRun(mainChat, firstPrompt, chatTitle, recursiveDepth) {
    return __awaiter(this, void 0, void 0, function* () {
        const firstAnswer = yield mainChat.prompt(firstPrompt);
        mainChat.includeMetadata((sent, meta) => meta.set("title", chatTitle), (received, meta) => meta.set("title", "Gives answer"));
        let mainCode = yield reflection(mainChat, firstAnswer);
        let output = [];
        output.push(mainCode);
        const initialSubtaskPrompt = yield standardSubtaskPrompt();
        yield tryRecursiveSubtasks(recursiveDepth, mainChat, initialSubtaskPrompt, output);
        let overrideOutput = yield standardOverrideOutput(mainChat);
        let finalCode = overrideOutput.join("\n").split("\n").join("\n");
        return finalCode;
    });
}
// TODO: "correctCodes" is obviously not correct since we've done no validation on it.
// and ChatGPT has the habit of only giving partial answers if the method/function is too big.
// Therefore we'll just override it with all of the code we got from ChatGPT so far,
// and we'll puzzle it together manually until we have a better way to automerge everything.
function standardOverrideOutput(mainChat) {
    return __awaiter(this, void 0, void 0, function* () {
        let searchResults = (yield (yield (0, GPTSearch_1.configureSearch)(new GPTSearch_2.GPTMessageSearch(mainChat), GPTSearch_1.SearchScope.Genealogy)).all());
        let outputMap = new Map();
        let overrideOutput = [];
        let i = 0;
        for (let message of searchResults) {
            try {
                const codes = yield (0, GPTSandbox_1.extractCodeBlocks)(message.content);
                if (codes.length > 0) {
                    outputMap.set(message.body.sequence, codes.join("\n"));
                }
            }
            catch (error) {
                if (!(error instanceof Errors_1.FlowChatCodeBlockError))
                    throw error;
                // The answer didn't fit in ChatGPT's output buffer.
            }
        }
        const sequenceKeys = Array.from(outputMap.keys()).sort();
        for (let sequence of sequenceKeys) {
            overrideOutput.push(outputMap.get(sequence));
        }
        return overrideOutput;
    });
}
function standardGPTContextSetup() {
    const gpt = new GPTContext_1.ChatGPTContext("New chat");
    gpt.api = new GPTAPI_1.FlowChatMessageLogMockGPTAPI();
    // gpt.api = new ChatGPTAPI()
    exports.gptCopyForDevelopment = gpt;
    /*
      // Log to console
      FlowchatPlugin.addDefaultAfter(ChatGPTContext, 'getReq', (request: GPTRequest) => { console.log('User:', request.body.content) })
      FlowchatPlugin.addDefaultAfter(ChatGPTContext, 'getResp', (response: ChatGPTResponseBody) => { console.log('Assistant:', response.content) })
      // gpt.deleteMetadata();
      */
    // Track sequential order of messages
    let sequence = 0;
    FlowchatPlugin_1.FlowchatPlugin.addDefaultAfter(GPTContext_1.ChatGPTContext, "getReq", (request) => { request.body.sequence = ++sequence; });
    FlowchatPlugin_1.FlowchatPlugin.addDefaultAfter(GPTContext_1.ChatGPTContext, "getResp", (response) => { response.sequence = ++sequence; });
    return gpt;
}
function tryRecursiveSubtasks(depth, branch, prompt, output) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield recursiveSubtasks(depth, branch, prompt, output);
        }
        catch (error) {
            if (!(error instanceof Errors_1.FlowChatCodeBlockError))
                throw error;
            // The answer didn't fit in ChatGPT's output buffer. Mark it in the metadata, and continue.
            const overflowError = { error: error, };
            branch.subthreads
                .slice(-1)[0]
                .includeMetadata(undefined, (received, meta) => {
                meta.set("title", "Output buffer overflow");
                meta.set("Error", overflowError);
            });
        }
    });
}
function recursiveSubtasks(depth, ctx, prompt, output) {
    return __awaiter(this, void 0, void 0, function* () {
        depth--;
        const subtasksList = yield ctx.prompt(prompt);
        ctx.includeMetadata((sent, meta) => meta.set("title", "Ask for list of subtasks"), (received, meta) => meta.set("title", "Gives answer"));
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
            const answer = yield devCtx.prompt(yield run2SubtaskImplementationPrompt(i));
            devCtx.includeMetadata((sent, meta) => meta.set("title", subtask), (received, meta) => meta.set("title", "Provides implementation"));
            let correctCode = yield reflection(devCtx, answer);
            output.push(correctCode);
            if (depth > 0) {
                const nextPrompt = yield run2AreThereMoreTodosPrompt(i);
                yield tryRecursiveSubtasks(depth, devCtx, nextPrompt, output);
            }
        }
    });
}
function reflection(context, firstAnswer, retries = 5) {
    return __awaiter(this, void 0, void 0, function* () {
        firstAnswer = (yield (0, GPTSandbox_1.extractCodeBlocks)(firstAnswer)).join("\n");
        let bestAnswer = firstAnswer;
        let validate = "N/A";
        let tries = 0;
        while (validate.length > 0 && tries < retries) {
            tries++;
            let newAnswer = yield context.prompt(yield run2ReflectionPrompt());
            validate = (yield (0, GPTSandbox_1.extractCodeBlocks)(newAnswer)).join("\n");
            const sentMeta = (sent, meta) => meta.set("title", "Ask ChatGPT to reflect on answer");
            if (validate.length > 0) {
                bestAnswer = validate;
                const reflect = { wasCorrect: false };
                context.includeMetadata(sentMeta, (received, meta) => {
                    meta.set("title", "I was wrong");
                    meta.set("Reflect", reflect);
                });
            }
            else {
                const reflect = { wasCorrect: true };
                context.includeMetadata(sentMeta, (received, meta) => {
                    meta.set("title", "I was right");
                    meta.set("Reflect", reflect);
                });
            }
        }
        return bestAnswer;
    });
}
function newDevelopment() {
    return __awaiter(this, void 0, void 0, function* () {
        const gpt = exports.gptCopyForDevelopment;
        let search = yield (yield (0, GPTSearch_1.configureSearch)(new GPTSearch_1.ChatGPTMessageSearch(gpt), GPTSearch_1.SearchScope.Genealogy)).all();
        let flatMessageLog = search.map((x) => `${x.body.role}: ${x.content}`);
        const messages = search;
        messages.sort((a, b) => { var _a, _b; return ((_a = a.body.sequence) !== null && _a !== void 0 ? _a : 0) - ((_b = b.body.sequence) !== null && _b !== void 0 ? _b : 0); });
        let previousId = undefined;
        // Custom format function
        const customFormat = (message, type, partialDiagram) => {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            let output = [];
            switch (type) {
                case "flowchart":
                    let id = `${message.id}`;
                    const yellow = "fill:#EEFFAA,stroke:#333,stroke-width:2px";
                    const white = "fill:#FFFFFF,stroke:#333,stroke-width:4px";
                    const green = "fill:#66FF66,stroke:#333,stroke-width:2px";
                    const red = "fill:#FF4400,stroke:#333,stroke-width:4px";
                    if (message.metadata.has("Error")) {
                        addToFlowchart(id, "fa:fa-bug", message.metadata.get("title"), message, output, red);
                        break;
                    }
                    const isUser = message.body.role == "user";
                    let color = `${((_b = (_a = message.metadata) === null || _a === void 0 ? void 0 : _a.get("color")) !== null && _b !== void 0 ? _b : isUser) ? white : yellow}`;
                    let icon = `${((_d = (_c = message.metadata) === null || _c === void 0 ? void 0 : _c.get("icon")) !== null && _d !== void 0 ? _d : isUser) ? "fa:fa-user" : "fa:fa-robot"}`;
                    let body = `${(_f = (_e = message.metadata) === null || _e === void 0 ? void 0 : _e.get("title")) !== null && _f !== void 0 ? _f : message.body.role}`;
                    body = (0, GPTMermaid_1.sanitizeMermaid)(body);
                    // Styling for certain types of metadata
                    if ((_g = message.metadata) === null || _g === void 0 ? void 0 : _g.has("Reflect")) {
                        let reflect = message.metadata.get("Reflect");
                        if (reflect.wasCorrect) {
                            color = green;
                        }
                        else {
                            color = red;
                        }
                    }
                    addToFlowchart(id, icon, body, message, output, color);
                    // If reflect was wrong: Add a self-referential step to think of new answer
                    if ((_h = message.metadata) === null || _h === void 0 ? void 0 : _h.has("Reflect")) {
                        let reflect = message.metadata.get("Reflect");
                        if (!reflect.wasCorrect) {
                            output.push(`${message.id}-.->R${message.id}(fa:fa-spinner Updates answer)`);
                            output.push(`R${message.id}-.->${message.id}`);
                            // output.push(`${message.id}-->${message.id}`)
                        }
                    }
                    /*
                            // Connnect nodes in sequential order
                            // Disabled for now because it really messes up flowcharts, and probably belongs on sequence diagrams.
                            if (previousId !== message.replyTo?.id) { output.push(`${previousId}-.->${message.id}`) }
                            previousId = message.id
                            */
                    // TODO: Plugin system should preprocess & postprocess diagrams, so this logic can be moved there.
                    // Right now this implementaiton will fail if nodes are hidden from view.
                    // Processing on diagram also allows us to draw different shaped lines if nodes are hidden.
                    /*
                            if (message.body.sequence ?? 0 < Math.max(...messages.map(message => message.body.sequence ?? 0))) { }
                            */
                    break;
                case "gitgraph":
                    break;
                case "sequence":
                    break;
            }
            return output;
        };
        // Diagram layout options
        const options = { direction: "TD", spacing: 40, padding: 20 };
        // Create flowchart diagram
        const flowchartConverter = new GPTMermaid_1.DiagramConverterFactory().create("flowchart");
        const flowchartDiagram = flowchartConverter.convert(messages, undefined, undefined, undefined, customFormat, options);
        // console.log(flowchartDiagram.content)
        const flowchartDiagramLength = flowchartDiagram.content.length;
        /*
          const expectedLength = 7896
          if (flowchartDiagramLength != expectedLength) throw new Error('Something broke')
          console.log('Flowchart test succeeded')
          */
        /**
         * TODO: This belongs in Mermaid, not here.
         */
        function addToFlowchart(id, icon, body, message, output, color) {
            var _a;
            let line = `${id}(${icon} ${body})`;
            // Connect replies to requests
            if (message.replyTo)
                line = `${(_a = message.replyTo) === null || _a === void 0 ? void 0 : _a.id}-->${line}`;
            output.push(line);
            addStyle(output, message, color);
        }
        function addStyle(output, message, orange) {
            output.push(`style ${message.id} ${orange}`);
        }
    });
}
// demo().then(() => { run().then(() => { newDevelopment().then(() => { console.log('all done') }) }) })
run2().then(() => {
    newDevelopment().then(() => {
        console.log("all done");
    });
});
// @ts-ignore
/*
document.getElementById("autoScript").addEventListener("click", () => {
    run2().then(() => {
        alert('Done. You may want to save the messageLog in console, for simulating API calls with no delay.')
    }).finally(async () => {
        // @ts-ignore
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
        // @ts-ignore
        await chrome.tabs.sendMessage(tabs[0].id, { action: "chatgptapi-messagelog" })
    });
    }
);
*/
function whoIsGuilty(verdict) {
    if (verdict.includes("BOTH"))
        return exports.taskEnum.BOTH;
    if (verdict.includes("CODE"))
        return exports.taskEnum.CODE;
    if (verdict.includes("TEST"))
        return exports.taskEnum.TEST;
    if (verdict.includes("SANDBOX"))
        return exports.taskEnum.SANDBOX;
    if (verdict.includes("NONE"))
        return exports.taskEnum.NONE;
    if (verdict.includes("UNSURE"))
        return exports.taskEnum.EXTERNAL;
    if (verdict.includes("EXTERNAL"))
        return exports.taskEnum.EXTERNAL;
    console.error("No verdict?");
    return exports.taskEnum.EXTERNAL;
}
exports.whoIsGuilty = whoIsGuilty;
function run1InitDevPrompt(functionName) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield new GPTPrompt_1.PromptBuilder().load('run 1, initialize dev branch', { functionName: functionName });
        // return [ //     `TARGET: ${functionName}`, //     `TASK: Implement function definition`, //     "FORMAT:", //     "```", //     `function ${functionName}(params){let foo='bar baz';}`, //     "```", // ].join('\n')
    });
}
function run1InitTestPrompt(functionName) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield new GPTPrompt_1.PromptBuilder().load('run 1, initialize test branch', { functionName: functionName });
        // return [ //     `TARGET: ${functionName}`, //     `TASK: Write 3 tests for function`, //     `RECOMMENDED: If tests have similar structure, create an extra function to facilitate setup.`, //     "FORMAT:", //     "```", //     `function test_${functionName}_1(){if(testFailed) throw new Error("Input: {input} -- Expected: {expected} -- Actual: {actual}")}`, //     "```", //     `IGNORE: Differences in newlines or whitespaces.`, //     `ONLY CONCERN: Whether the function's declaration and definition are equivalent.`, // ].join('\n')
    });
}
function run1BlamePrompt(output, verdict) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield new GPTPrompt_1.PromptBuilder().load('run 1, blame', { output: output, verdict: verdict });
        // return [ //     `This error came up during testing:`, //     "```", //     output, //     "```", //     verdict, //     "Please fix the code, and show the full result.", // ].join('\n')
    });
}
function run1JudgeVerdictPrompt(functionName, error, devCode, testCode) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield new GPTPrompt_1.PromptBuilder().load('run 1, judge verdict', { functionName: functionName, error: error, devCode: devCode, testCode: testCode });
        // return [ //     `TARGET: ${functionName}`, //     `CONTEXT: A developer and a tester wrote code, but it produced an error.`, //     `TASK: Determine if the error came from "CODE" (developer), "TEST" (tester), "BOTH" (developer and tester both made mistakes), "SANDBOX" (a problem with the testing environment), "UNSURE", "EXTERNAL CAUSE", or "NONE"`, //     "FORMAT & EXAMPLE:", //     "```", //     ` /* CODE caused the error */`, //     `The reason is [...]`, //     "```", //     `THE ERROR TO ANALYZE:`, //     error, //     `THE CODE IT CAME FROM:`, //     devCode, //     `THE TESTS IT CAME FROM:`, //     testCode, // ].join('\n')
    });
}
function run1FunctionStubsPrompt() {
    return __awaiter(this, void 0, void 0, function* () {
        return yield new GPTPrompt_1.PromptBuilder().load('run 1, function stubs');
        // return [ //     `ROLE: Expert javascript developer`, //     `TASK: Write stubs for functions in FUNCTIONS LIST`, //     `ADDITIONAL TASK: Write comments between the function's brackets, to indicate data types of parameters/return values`, //     `FORMAT OF REPLY:`, //     "```", //     `function stubs(param1) {`, //     `  // @param param1: string[]`, //     `  // @return Promise<string>`, //     `}`, //     "```", //     "FUNCTIONS LIST:", //     `- extractFunction(functionName, code) {return functionDefinition}`, //     `- replaceFunction(oldFunctionName, newFunctionDefinition, code) {return updatedCode}`, // ].join('\n')
    });
}
function standardSubtaskPrompt() {
    return __awaiter(this, void 0, void 0, function* () {
        return yield new GPTPrompt_1.PromptBuilder().load('standard subtask prompt');
        // return [ //     `if you could split up the remaining tasks in a way that independent developers can work on them in isolation,`, //     `without needing to coordinate with each other, what would be the best way to do that?`, //     `Answer in the following format, in a code block:`, //     ``, //     "```", //     `- Subtask 1: Description`, //     `- Subtask 2: Description`, //     "```", //     ``, //     `Remember, it should be possible to work on the subtasks in isolation and in parallel. `, //     `Only when this list of subtasks is finished can we move on to the next step.`, // ].join('\n')
    });
}
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
function run3FirstAnswerPrompt() {
    return __awaiter(this, void 0, void 0, function* () {
        return yield new GPTPrompt_1.PromptBuilder().load('run 2, initial input');
    });
}
function run2AreThereMoreTodosPrompt(i) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield new GPTPrompt_1.PromptBuilder().load('run 2, are there more TODOs?', { i: i });
        // return [ //     `Thank you for working on this subtask.`, //     `Is there anything else that needs to be done in order to finalize this subtask?`, //     `Answer in the following format, in a code block:`, //     ``, //     "```", //     `- Subtask ${i}, remaining TODO #1: Description`, //     `- Subtask ${i}, remaining TODO #2: Description`, //     "```", //     ``, //     `(if there are no remaining TODOs, just answer "This subtask is done")`, //     `Remember, it should be possible to work on the remaining TODOs in isolation and in parallel. `, //     `Only when this list of remaining TODOs is finished can we move on to the next step.`, // ].join('\n')
    });
}
function run2SubtaskImplementationPrompt(i) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield new GPTPrompt_1.PromptBuilder().load('run 2, subtask implementation', { i: i });
        // return [ //     `Can you show me an implementation of #${i}?`, //     `Don't write any comments, and don't show me examples of how to use it.`, //     `I only want the declarations and definitions.`, // ].join('\n')
    });
}
function run2ReflectionPrompt() {
    return __awaiter(this, void 0, void 0, function* () {
        return yield new GPTPrompt_1.PromptBuilder().load('run 2, reflection');
        // return `Before we continue, can you review your answer and tell me if you think it's correct? If yes, say "yes". If no, show me the correction.`
    });
}
function run1SanityTest() {
    return ["user: ROLE: Expert javascript developer\nTASK: Write stubs for functions in FUNCTIONS LIST\nADDITIONAL TASK: Write comments between the function's brackets, to indicate data types of parameters/return values\nFORMAT OF REPLY:\n```\nfunction stubs(param1) {\n  // @param param1: string[]\n  // @return Promise<string>\n}\n```\nFUNCTIONS LIST:\n- extractFunction(functionName, code) {return functionDefinition}\n- replaceFunction(oldFunctionName, newFunctionDefinition, code) {return updatedCode}", "assistant: ```\nfunction extractFunction(functionName, code) {\n  // @param functionName: string\n  // @param code: string\n  // @return string\n}\n\nfunction replaceFunction(oldFunctionName, newFunctionDefinition, code) {\n  // @param oldFunctionName: string\n  // @param newFunctionDefinition: string\n  // @param code: string\n  // @return string\n}\n```", "user: TARGET: extractFunction\nTASK: Implement function definition\nFORMAT:\n```\nfunction extractFunction(params){let foo='bar baz';}\n```", "assistant: Here's an implementation for the `extractFunction` function:\n\n```\nfunction extractFunction(functionName, code) {\n  // Find the start of the function definition\n  const startRegex = new RegExp(`function\\\\s+${functionName}\\\\s*\\\\(`);\n  const startIndex = code.search(startRegex);\n\n  if (startIndex === -1) {\n    // Function not found\n    throw new Error(`Function ${functionName} not found in code`);\n  }\n\n  // Find the end of the function definition\n  let bracketCount = 1;\n  let endIndex = startIndex + 1;\n\n  while (bracketCount > 0 && endIndex < code.length) {\n    if (code[endIndex] === '{') {\n      bracketCount++;\n    } else if (code[endIndex] === '}') {\n      bracketCount--;\n    }\n\n    endIndex++;\n  }\n\n  if (bracketCount !== 0) {\n    // Malformed function\n    throw new Error(`Malformed function ${functionName} in code`);\n  }\n\n  // Extract the function definition\n  return code.substring(startIndex, endIndex);\n}\n```\n\nThe `extractFunction` function takes two parameters: `functionName`, which is the name of the function to extract, and `code`, which is the code to search for the function definition.\n\nIt uses regular expressions to find the start of the function definition, and then searches for the end of the definition by counting brackets. If the function definition is malformed (i.e. the bracket count is not zero at the end), an error is thrown.\n\nFinally, the function returns the extracted function definition as a string.", 'user: TARGET: extractFunction\nTASK: Write 3 tests for function\nRECOMMENDED: If tests have similar structure, create an extra function to facilitate setup.\nFORMAT:\n```\nfunction test_extractFunction_1(){if(testFailed) throw new Error("Input: {input} -- Expected: {expected} -- Actual: {actual}")}\n```\nIGNORE: Differences in newlines or whitespaces.\nONLY CONCERN: Whether the function\'s declaration and definition are equivalent.', "assistant: Here are three tests for the `extractFunction` function:\n\n```\n// Test 1: Extract a function definition from code\nfunction test_extractFunction_1() {\n  const code = `\n    function add(a, b) {\n      return a + b;\n    }\n\n    function subtract(a, b) {\n      return a - b;\n    }\n  `;\n  const functionName = 'add';\n  const expected = 'function add(a, b) {\\n  return a + b;\\n}';\n  const actual = extractFunction(functionName, code);\n  if (actual !== expected) {\n    throw new Error(`Input: ${functionName}, ${code} -- Expected: ${expected} -- Actual: ${actual}`);\n  }\n}\n\n// Test 2: Extract a function definition that spans multiple lines\nfunction test_extractFunction_2() {\n  const code = `\n    function multiply(a, b) {\n      return a * b;\n    }\n\n    function divide(a, b) {\n      return a / b;\n    }\n  `;\n  const functionName = 'divide';\n  const expected = 'function divide(a, b) {\\n  return a / b;\\n}';\n  const actual = extractFunction(functionName, code);\n  if (actual !== expected) {\n    throw new Error(`Input: ${functionName}, ${code} -- Expected: ${expected} -- Actual: ${actual}`);\n  }\n}\n\n// Test 3: Extract a function definition that has nested functions\nfunction test_extractFunction_3() {\n  const code = `\n    function outerFunction() {\n      function innerFunction() {\n        console.log('Hello, world!');\n      }\n\n      innerFunction();\n    }\n\n    function anotherFunction() {\n      console.log('Goodbye, world!');\n    }\n  `;\n  const functionName = 'outerFunction';\n  const expected = `function outerFunction() {\\n  function innerFunction() {\\n    console.log('Hello, world!');\\n  }\\n\\n  innerFunction();\\n}`;\n  const actual = extractFunction(functionName, code);\n  if (actual !== expected) {\n    throw new Error(`Input: ${functionName}, ${code} -- Expected: ${expected} -- Actual: ${actual}`);\n  }\n}\n```\n\nThe tests should be run using a test runner or by calling each test function manually.", "user: TARGET: replaceFunction\nTASK: Implement function definition\nFORMAT:\n```\nfunction replaceFunction(params){let foo='bar baz';}\n```", "assistant: Here's an implementation for the `replaceFunction`:\n\n```\nfunction replaceFunction(oldFunctionName, newFunctionDefinition, code) {\n  // Find the location of the old function in the code\n  const start = code.indexOf(`function ${oldFunctionName}`);\n  if (start === -1) {\n    throw new Error(`Function ${oldFunctionName} not found in code`);\n  }\n\n  // Extract the old function's body\n  const oldFunctionBody = code.slice(start);\n  const end = oldFunctionBody.indexOf('}') + start + 1;\n  const oldFunction = oldFunctionBody.slice(0, end);\n\n  // Replace the old function with the new function definition\n  const updatedCode = code.slice(0, start) + newFunctionDefinition + code.slice(end);\n\n  return updatedCode;\n}\n``` \n\nThis implementation first finds the starting position of the old function definition in the code string using the `indexOf` method. It then extracts the entire body of the old function definition using `slice`. It calculates the end position of the old function definition by finding the position of the closing curly brace and adding it to the starting position. Then, it concatenates the new function definition with the code string before and after the old function definition, and returns the updated code string. If the old function definition is not found in the code string, it throws an error.", 'user: TARGET: replaceFunction\nTASK: Write 3 tests for function\nRECOMMENDED: If tests have similar structure, create an extra function to facilitate setup.\nFORMAT:\n```\nfunction test_replaceFunction_1(){if(testFailed) throw new Error("Input: {input} -- Expected: {expected} -- Actual: {actual}")}\n```\nIGNORE: Differences in newlines or whitespaces.\nONLY CONCERN: Whether the function\'s declaration and definition are equivalent.', 'assistant: Here are three tests for `replaceFunction`:\n\n```\nfunction test_replaceFunction_1() {\n  const oldFunctionName = "myFunction";\n  const newFunctionDefinition = "function myFunction() {\\n  console.log(\'Hello, world!\');\\n}";\n  const code = "function myFunction() {\\n  console.log(\'Goodbye, world!\');\\n}";\n  const expected = "function myFunction() {\\n  console.log(\'Hello, world!\');\\n}";\n  const actual = replaceFunction(oldFunctionName, newFunctionDefinition, code);\n  if (actual !== expected) {\n    throw new Error(`Input: ${oldFunctionName}, ${newFunctionDefinition}, ${code} -- Expected: ${expected} -- Actual: ${actual}`);\n  }\n}\n\nfunction test_replaceFunction_2() {\n  const oldFunctionName = "addNumbers";\n  const newFunctionDefinition = "function addNumbers(a, b) {\\n  return a + b;\\n}";\n  const code = "function addNumbers(a, b) {\\n  return a * b;\\n}";\n  const expected = "function addNumbers(a, b) {\\n  return a + b;\\n}";\n  const actual = replaceFunction(oldFunctionName, newFunctionDefinition, code);\n  if (actual !== expected) {\n    throw new Error(`Input: ${oldFunctionName}, ${newFunctionDefinition}, ${code} -- Expected: ${expected} -- Actual: ${actual}`);\n  }\n}\n\nfunction test_replaceFunction_3() {\n  const oldFunctionName = "greet";\n  const newFunctionDefinition = "function greet(name) {\\n  return `Hello, ${name}!`;\\n}";\n  const code = "function greet(name) {\\n  return `Hi, ${name}!`;\\n}";\n  const expected = "function greet(name) {\\n  return `Hello, ${name}!`;\\n}";\n  const actual = replaceFunction(oldFunctionName, newFunctionDefinition, code);\n  if (actual !== expected) {\n    throw new Error(`Input: ${oldFunctionName}, ${newFunctionDefinition}, ${code} -- Expected: ${expected} -- Actual: ${actual}`);\n  }\n}\n```',];
}
//# sourceMappingURL=flowchat.workspace.js.map