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
exports.whoIsGuilty = exports.run = void 0;
const GPTContext_1 = require("./core/GPTContext");
const GPTSearch_1 = require("./core/GPTSearch");
const GPTSandbox_1 = require("./core/GPTSandbox");
const GPTSearch_2 = require("./core/GPTSearch");
const GPTPrompt_1 = require("./core/GPTPrompt");
const main_1 = require("./main");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        const gpt = new GPTContext_1.ChatGPTContext("New chat");
        // gpt.api = new FlowChatMessageLogMockGPTAPI();
        main_1.gptCopyForDevelopment = gpt;
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
                    if (guilty == main_1.taskEnum.BOTH) {
                        devCode = yield blame(devBranch, error, verdict, main_1.taskEnum.CODE);
                        testCode = yield blame(testBranch, error, verdict, main_1.taskEnum.TEST);
                    }
                    else if (guilty == main_1.taskEnum.CODE)
                        devCode = yield blame(devBranch, error, verdict, main_1.taskEnum.CODE);
                    else if (guilty == main_1.taskEnum.TEST)
                        testCode = yield blame(testBranch, error, verdict, main_1.taskEnum.TEST);
                    else if (guilty == main_1.taskEnum.NONE) {
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
        const expectedMessageLog = (0, main_1.run1SanityTest)();
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
function whoIsGuilty(verdict) {
    if (verdict.includes("BOTH"))
        return main_1.taskEnum.BOTH;
    if (verdict.includes("CODE"))
        return main_1.taskEnum.CODE;
    if (verdict.includes("TEST"))
        return main_1.taskEnum.TEST;
    if (verdict.includes("SANDBOX"))
        return main_1.taskEnum.SANDBOX;
    if (verdict.includes("NONE"))
        return main_1.taskEnum.NONE;
    if (verdict.includes("UNSURE"))
        return main_1.taskEnum.EXTERNAL;
    if (verdict.includes("EXTERNAL"))
        return main_1.taskEnum.EXTERNAL;
    console.error("No verdict?");
    return main_1.taskEnum.EXTERNAL;
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
//# sourceMappingURL=run.js.map