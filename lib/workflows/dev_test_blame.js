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
exports.run1SanityTest = exports.whoIsGuilty = exports.run = exports.taskEnum = void 0;
const GPTContext_1 = require("../core/GPTContext");
const GPTSearch_1 = require("../core/GPTSearch");
const GPTSandbox_1 = require("../core/GPTSandbox");
const GPTSearch_2 = require("../core/GPTSearch");
const GPTPrompt_1 = require("../core/GPTPrompt");
exports.taskEnum = { selfHeal: "Self-healing code", judge: "Judge", CODE: "Code branch", TEST: "Test branch", SANDBOX: "Sandbox", NONE: "None", EXTERNAL: "External factors", BOTH: "Both", };
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        const gpt = new GPTContext_1.ChatGPTContext("New chat");
        // gpt.api = new FlowChatMessageLogMockGPTAPI();
        // gptCopyForDevelopment = gpt
        const mainChat = yield gpt.fork();
        const functionStubs = yield mainChat.send(yield run1FunctionStubsPrompt());
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
                    let verdict = yield judge.send(yield run1JudgeVerdictPrompt(functionName, error, devCode, testCode));
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
                let code = yield branch.send(yield run1BlamePrompt(output, verdict));
                code = yield (0, GPTSandbox_1.deprecatedExtractCodeFromChatReply)([code]);
                code = code.trim();
                return code;
            });
        }
        function initialize_test(functionName, testBranch) {
            return __awaiter(this, void 0, void 0, function* () {
                const testPrompt = yield run1InitTestPrompt(functionName);
                let testCode = yield testBranch.send(testPrompt);
                testCode = yield (0, GPTSandbox_1.deprecatedExtractCodeFromChatReply)([testCode]);
                testCode = testCode.trim();
                return testCode;
            });
        }
        function initialize_dev(functionName, devBranch) {
            return __awaiter(this, void 0, void 0, function* () {
                const devPrompt = yield run1InitDevPrompt(functionName);
                let devCode = yield devBranch.send(devPrompt);
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
        return yield (0, GPTPrompt_1.GPTPrompt)('run 1, initialize dev branch', { functionName: functionName });
        // return [ //     `TARGET: ${functionName}`, //     `TASK: Implement function definition`, //     "FORMAT:", //     "```", //     `function ${functionName}(params){let foo='bar baz';}`, //     "```", // ].join('\n')
    });
}
function run1InitTestPrompt(functionName) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield (0, GPTPrompt_1.GPTPrompt)('run 1, initialize test branch', { functionName: functionName });
        // return [ //     `TARGET: ${functionName}`, //     `TASK: Write 3 tests for function`, //     `RECOMMENDED: If tests have similar structure, create an extra function to facilitate setup.`, //     "FORMAT:", //     "```", //     `function test_${functionName}_1(){if(testFailed) throw new Error("Input: {input} -- Expected: {expected} -- Actual: {actual}")}`, //     "```", //     `IGNORE: Differences in newlines or whitespaces.`, //     `ONLY CONCERN: Whether the function's declaration and definition are equivalent.`, // ].join('\n')
    });
}
function run1BlamePrompt(output, verdict) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield (0, GPTPrompt_1.GPTPrompt)('run 1, blame', { output: output, verdict: verdict });
        // return [ //     `This error came up during testing:`, //     "```", //     output, //     "```", //     verdict, //     "Please fix the code, and show the full result.", // ].join('\n')
    });
}
function run1JudgeVerdictPrompt(functionName, error, devCode, testCode) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield (0, GPTPrompt_1.GPTPrompt)('run 1, judge verdict', { functionName: functionName, error: error, devCode: devCode, testCode: testCode });
        // return [ //     `TARGET: ${functionName}`, //     `CONTEXT: A developer and a tester wrote code, but it produced an error.`, //     `TASK: Determine if the error came from "CODE" (developer), "TEST" (tester), "BOTH" (developer and tester both made mistakes), "SANDBOX" (a problem with the testing environment), "UNSURE", "EXTERNAL CAUSE", or "NONE"`, //     "FORMAT & EXAMPLE:", //     "```", //     ` /* CODE caused the error */`, //     `The reason is [...]`, //     "```", //     `THE ERROR TO ANALYZE:`, //     error, //     `THE CODE IT CAME FROM:`, //     devCode, //     `THE TESTS IT CAME FROM:`, //     testCode, // ].join('\n')
    });
}
function run1FunctionStubsPrompt() {
    return __awaiter(this, void 0, void 0, function* () {
        return yield (0, GPTPrompt_1.GPTPrompt)('run 1, function stubs');
        // return [ //     `ROLE: Expert javascript developer`, //     `TASK: Write stubs for functions in FUNCTIONS LIST`, //     `ADDITIONAL TASK: Write comments between the function's brackets, to indicate data types of parameters/return values`, //     `FORMAT OF REPLY:`, //     "```", //     `function stubs(param1) {`, //     `  // @param param1: string[]`, //     `  // @return Promise<string>`, //     `}`, //     "```", //     "FUNCTIONS LIST:", //     `- extractFunction(functionName, code) {return functionDefinition}`, //     `- replaceFunction(oldFunctionName, newFunctionDefinition, code) {return updatedCode}`, // ].join('\n')
    });
}
function run1SanityTest() {
    return ["user: ROLE: Expert javascript developer\nTASK: Write stubs for functions in FUNCTIONS LIST\nADDITIONAL TASK: Write comments between the function's brackets, to indicate data types of parameters/return values\nFORMAT OF REPLY:\n```\nfunction stubs(param1) {\n  // @param param1: string[]\n  // @return Promise<string>\n}\n```\nFUNCTIONS LIST:\n- extractFunction(functionName, code) {return functionDefinition}\n- replaceFunction(oldFunctionName, newFunctionDefinition, code) {return updatedCode}", "assistant: ```\nfunction extractFunction(functionName, code) {\n  // @param functionName: string\n  // @param code: string\n  // @return string\n}\n\nfunction replaceFunction(oldFunctionName, newFunctionDefinition, code) {\n  // @param oldFunctionName: string\n  // @param newFunctionDefinition: string\n  // @param code: string\n  // @return string\n}\n```", "user: TARGET: extractFunction\nTASK: Implement function definition\nFORMAT:\n```\nfunction extractFunction(params){let foo='bar baz';}\n```", "assistant: Here's an implementation for the `extractFunction` function:\n\n```\nfunction extractFunction(functionName, code) {\n  // Find the start of the function definition\n  const startRegex = new RegExp(`function\\\\s+${functionName}\\\\s*\\\\(`);\n  const startIndex = code.search(startRegex);\n\n  if (startIndex === -1) {\n    // Function not found\n    throw new Error(`Function ${functionName} not found in code`);\n  }\n\n  // Find the end of the function definition\n  let bracketCount = 1;\n  let endIndex = startIndex + 1;\n\n  while (bracketCount > 0 && endIndex < code.length) {\n    if (code[endIndex] === '{') {\n      bracketCount++;\n    } else if (code[endIndex] === '}') {\n      bracketCount--;\n    }\n\n    endIndex++;\n  }\n\n  if (bracketCount !== 0) {\n    // Malformed function\n    throw new Error(`Malformed function ${functionName} in code`);\n  }\n\n  // Extract the function definition\n  return code.substring(startIndex, endIndex);\n}\n```\n\nThe `extractFunction` function takes two parameters: `functionName`, which is the name of the function to extract, and `code`, which is the code to search for the function definition.\n\nIt uses regular expressions to find the start of the function definition, and then searches for the end of the definition by counting brackets. If the function definition is malformed (i.e. the bracket count is not zero at the end), an error is thrown.\n\nFinally, the function returns the extracted function definition as a string.", 'user: TARGET: extractFunction\nTASK: Write 3 tests for function\nRECOMMENDED: If tests have similar structure, create an extra function to facilitate setup.\nFORMAT:\n```\nfunction test_extractFunction_1(){if(testFailed) throw new Error("Input: {input} -- Expected: {expected} -- Actual: {actual}")}\n```\nIGNORE: Differences in newlines or whitespaces.\nONLY CONCERN: Whether the function\'s declaration and definition are equivalent.', "assistant: Here are three tests for the `extractFunction` function:\n\n```\n// Test 1: Extract a function definition from code\nfunction test_extractFunction_1() {\n  const code = `\n    function add(a, b) {\n      return a + b;\n    }\n\n    function subtract(a, b) {\n      return a - b;\n    }\n  `;\n  const functionName = 'add';\n  const expected = 'function add(a, b) {\\n  return a + b;\\n}';\n  const actual = extractFunction(functionName, code);\n  if (actual !== expected) {\n    throw new Error(`Input: ${functionName}, ${code} -- Expected: ${expected} -- Actual: ${actual}`);\n  }\n}\n\n// Test 2: Extract a function definition that spans multiple lines\nfunction test_extractFunction_2() {\n  const code = `\n    function multiply(a, b) {\n      return a * b;\n    }\n\n    function divide(a, b) {\n      return a / b;\n    }\n  `;\n  const functionName = 'divide';\n  const expected = 'function divide(a, b) {\\n  return a / b;\\n}';\n  const actual = extractFunction(functionName, code);\n  if (actual !== expected) {\n    throw new Error(`Input: ${functionName}, ${code} -- Expected: ${expected} -- Actual: ${actual}`);\n  }\n}\n\n// Test 3: Extract a function definition that has nested functions\nfunction test_extractFunction_3() {\n  const code = `\n    function outerFunction() {\n      function innerFunction() {\n        console.log('Hello, world!');\n      }\n\n      innerFunction();\n    }\n\n    function anotherFunction() {\n      console.log('Goodbye, world!');\n    }\n  `;\n  const functionName = 'outerFunction';\n  const expected = `function outerFunction() {\\n  function innerFunction() {\\n    console.log('Hello, world!');\\n  }\\n\\n  innerFunction();\\n}`;\n  const actual = extractFunction(functionName, code);\n  if (actual !== expected) {\n    throw new Error(`Input: ${functionName}, ${code} -- Expected: ${expected} -- Actual: ${actual}`);\n  }\n}\n```\n\nThe tests should be run using a test runner or by calling each test function manually.", "user: TARGET: replaceFunction\nTASK: Implement function definition\nFORMAT:\n```\nfunction replaceFunction(params){let foo='bar baz';}\n```", "assistant: Here's an implementation for the `replaceFunction`:\n\n```\nfunction replaceFunction(oldFunctionName, newFunctionDefinition, code) {\n  // Find the location of the old function in the code\n  const start = code.indexOf(`function ${oldFunctionName}`);\n  if (start === -1) {\n    throw new Error(`Function ${oldFunctionName} not found in code`);\n  }\n\n  // Extract the old function's body\n  const oldFunctionBody = code.slice(start);\n  const end = oldFunctionBody.indexOf('}') + start + 1;\n  const oldFunction = oldFunctionBody.slice(0, end);\n\n  // Replace the old function with the new function definition\n  const updatedCode = code.slice(0, start) + newFunctionDefinition + code.slice(end);\n\n  return updatedCode;\n}\n``` \n\nThis implementation first finds the starting position of the old function definition in the code string using the `indexOf` method. It then extracts the entire body of the old function definition using `slice`. It calculates the end position of the old function definition by finding the position of the closing curly brace and adding it to the starting position. Then, it concatenates the new function definition with the code string before and after the old function definition, and returns the updated code string. If the old function definition is not found in the code string, it throws an error.", 'user: TARGET: replaceFunction\nTASK: Write 3 tests for function\nRECOMMENDED: If tests have similar structure, create an extra function to facilitate setup.\nFORMAT:\n```\nfunction test_replaceFunction_1(){if(testFailed) throw new Error("Input: {input} -- Expected: {expected} -- Actual: {actual}")}\n```\nIGNORE: Differences in newlines or whitespaces.\nONLY CONCERN: Whether the function\'s declaration and definition are equivalent.', 'assistant: Here are three tests for `replaceFunction`:\n\n```\nfunction test_replaceFunction_1() {\n  const oldFunctionName = "myFunction";\n  const newFunctionDefinition = "function myFunction() {\\n  console.log(\'Hello, world!\');\\n}";\n  const code = "function myFunction() {\\n  console.log(\'Goodbye, world!\');\\n}";\n  const expected = "function myFunction() {\\n  console.log(\'Hello, world!\');\\n}";\n  const actual = replaceFunction(oldFunctionName, newFunctionDefinition, code);\n  if (actual !== expected) {\n    throw new Error(`Input: ${oldFunctionName}, ${newFunctionDefinition}, ${code} -- Expected: ${expected} -- Actual: ${actual}`);\n  }\n}\n\nfunction test_replaceFunction_2() {\n  const oldFunctionName = "addNumbers";\n  const newFunctionDefinition = "function addNumbers(a, b) {\\n  return a + b;\\n}";\n  const code = "function addNumbers(a, b) {\\n  return a * b;\\n}";\n  const expected = "function addNumbers(a, b) {\\n  return a + b;\\n}";\n  const actual = replaceFunction(oldFunctionName, newFunctionDefinition, code);\n  if (actual !== expected) {\n    throw new Error(`Input: ${oldFunctionName}, ${newFunctionDefinition}, ${code} -- Expected: ${expected} -- Actual: ${actual}`);\n  }\n}\n\nfunction test_replaceFunction_3() {\n  const oldFunctionName = "greet";\n  const newFunctionDefinition = "function greet(name) {\\n  return `Hello, ${name}!`;\\n}";\n  const code = "function greet(name) {\\n  return `Hi, ${name}!`;\\n}";\n  const expected = "function greet(name) {\\n  return `Hello, ${name}!`;\\n}";\n  const actual = replaceFunction(oldFunctionName, newFunctionDefinition, code);\n  if (actual !== expected) {\n    throw new Error(`Input: ${oldFunctionName}, ${newFunctionDefinition}, ${code} -- Expected: ${expected} -- Actual: ${actual}`);\n  }\n}\n```',];
}
exports.run1SanityTest = run1SanityTest;
//# sourceMappingURL=dev_test_blame.js.map