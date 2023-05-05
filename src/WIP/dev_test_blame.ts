import { ChatGPTContext } from "../core/GPTContext"
import { SearchScope, configureSearch } from "../core/GPTSearch"
import { deprecatedExtractCodeFromChatReply, sandboxEval } from "../core/GPTSandbox"
import { GPTContext } from "../core/GPTContext"
import { GPTMessageSearch } from "../core/GPTSearch"
import { GPTPrompt } from "../core/GPTPrompt"
export var taskEnum = { selfHeal: "Self-healing code", judge: "Judge", CODE: "Code branch", TEST: "Test branch", SANDBOX: "Sandbox", NONE: "None", EXTERNAL: "External factors", BOTH: "Both", }




export async function run() {
    const gpt = new ChatGPTContext("New chat")
    // gpt.api = new FlowChatMessageLogMockGPTAPI();
    // gptCopyForDevelopment = gpt
    const mainChat = await gpt.fork()
    const functionStubs = await mainChat.send(await run1FunctionStubsPrompt())
    const correctCodes = []
    for (let functionName of ["extractFunction", "replaceFunction"]) {
        let devBranch = await mainChat.fork()
        let devCode = await initialize_dev(functionName, devBranch)
        let testBranch = await mainChat.fork()
        let testCode = await initialize_test(functionName, testBranch)
        let judge = await mainChat.fork()
        // The judge should always receive messages from the testing environment.
        // judge.addToMetadata('receiver', myTaskEnum.judge);
        // judge.addToMetadata('message', `Show failed test to judge`);
        // judge.addToMetadata('sender', myTaskEnum.SANDBOX);
        // TODO: Add formatter to code so it's idempotent.
        let results = await sandboxEval(devCode + "\n" + testCode)

        for (let i = 0; i < 5; i++) {
            if (results.output == "success") results.success = true // TODO: Figure out why this sometimes happens.
            if (!results.success) {
                let error = results.output
                let verdict = await judge.send(
                    await run1JudgeVerdictPrompt(functionName, error, devCode, testCode)
                )
                let guilty = whoIsGuilty(verdict) // TODO: replace with judge metadata
                if (guilty == taskEnum.BOTH) {
                    devCode = await blame(devBranch, error, verdict, taskEnum.CODE)
                    testCode = await blame(testBranch, error, verdict, taskEnum.TEST)
                } else if (guilty == taskEnum.CODE)
                    devCode = await blame(devBranch, error, verdict, taskEnum.CODE)
                else if (guilty == taskEnum.TEST)
                    testCode = await blame(testBranch, error, verdict, taskEnum.TEST)
                else if (guilty == taskEnum.NONE) {
                    console.error("VERDICT:\n", verdict)
                    continue
                } else {
                    devBranch = await mainChat.fork() // We'll try a hard reset.
                    testBranch = await mainChat.fork()
                    devCode = await initialize_dev(functionName, devBranch)
                    testCode = await initialize_test(functionName, testBranch)
                }
                results = await sandboxEval(devCode + "\n" + testCode)
            }
        }
        if (!results.success) console.error("Failed. Aborting.")
        else correctCodes.push(devCode, testCode)
        const tests = { test1: new GPTMessageSearch([gpt, mainChat]).byContent("javascript"), }
    }
    let search = await (await configureSearch(new GPTMessageSearch(mainChat), SearchScope.Genealogy)).all()
    let flatMessageLog = search.map((x) => `${x.body.role}: ${x.content}`)
    const expectedMessageLog = run1SanityTest()
    for (let i in flatMessageLog) {
        if (flatMessageLog[i] !== expectedMessageLog[i])
            throw new Error("Something broke")
    }
    console.log("Made it to the end")

    async function blame(branch: GPTContext, output: any, verdict: string, guilty: string) {
        let code = await branch.send(await run1BlamePrompt(output, verdict))
        code = await deprecatedExtractCodeFromChatReply([code])
        code = code.trim()
        return code
    }

    async function initialize_test(functionName: string, testBranch: GPTContext) {
        const testPrompt = await run1InitTestPrompt(functionName)
        let testCode = await testBranch.send(testPrompt)
        testCode = await deprecatedExtractCodeFromChatReply([testCode])
        testCode = testCode.trim()
        return testCode
    }

    async function initialize_dev(functionName: string, devBranch: GPTContext) {
        const devPrompt = await run1InitDevPrompt(functionName)
        let devCode = await devBranch.send(devPrompt)
        devCode = await deprecatedExtractCodeFromChatReply([devCode])
        devCode = devCode.trim()
        return devCode
    }
}

export function whoIsGuilty(verdict: string): string {
    if (verdict.includes("BOTH")) return taskEnum.BOTH
    if (verdict.includes("CODE")) return taskEnum.CODE
    if (verdict.includes("TEST")) return taskEnum.TEST
    if (verdict.includes("SANDBOX")) return taskEnum.SANDBOX
    if (verdict.includes("NONE")) return taskEnum.NONE
    if (verdict.includes("UNSURE")) return taskEnum.EXTERNAL
    if (verdict.includes("EXTERNAL")) return taskEnum.EXTERNAL
    console.error("No verdict?")
    return taskEnum.EXTERNAL
}

async function run1InitDevPrompt(functionName: string): Promise<string> {
    return await GPTPrompt('run 1, initialize dev branch', { functionName: functionName })
    // return [ //     `TARGET: ${functionName}`, //     `TASK: Implement function definition`, //     "FORMAT:", //     "```", //     `function ${functionName}(params){let foo='bar baz';}`, //     "```", // ].join('\n')
}

async function run1InitTestPrompt(functionName: string): Promise<string> {
    return await GPTPrompt('run 1, initialize test branch', { functionName: functionName })
    // return [ //     `TARGET: ${functionName}`, //     `TASK: Write 3 tests for function`, //     `RECOMMENDED: If tests have similar structure, create an extra function to facilitate setup.`, //     "FORMAT:", //     "```", //     `function test_${functionName}_1(){if(testFailed) throw new Error("Input: {input} -- Expected: {expected} -- Actual: {actual}")}`, //     "```", //     `IGNORE: Differences in newlines or whitespaces.`, //     `ONLY CONCERN: Whether the function's declaration and definition are equivalent.`, // ].join('\n')
}

async function run1BlamePrompt(output: any, verdict: string): Promise<string> {
    return await GPTPrompt('run 1, blame', { output: output, verdict: verdict })
    // return [ //     `This error came up during testing:`, //     "```", //     output, //     "```", //     verdict, //     "Please fix the code, and show the full result.", // ].join('\n')
}

async function run1JudgeVerdictPrompt(functionName: string, error: any, devCode: string, testCode: string): Promise<string> {
    return await GPTPrompt('run 1, judge verdict', { functionName: functionName, error: error, devCode: devCode, testCode: testCode })
    // return [ //     `TARGET: ${functionName}`, //     `CONTEXT: A developer and a tester wrote code, but it produced an error.`, //     `TASK: Determine if the error came from "CODE" (developer), "TEST" (tester), "BOTH" (developer and tester both made mistakes), "SANDBOX" (a problem with the testing environment), "UNSURE", "EXTERNAL CAUSE", or "NONE"`, //     "FORMAT & EXAMPLE:", //     "```", //     ` /* CODE caused the error */`, //     `The reason is [...]`, //     "```", //     `THE ERROR TO ANALYZE:`, //     error, //     `THE CODE IT CAME FROM:`, //     devCode, //     `THE TESTS IT CAME FROM:`, //     testCode, // ].join('\n')
}

async function run1FunctionStubsPrompt(): Promise<string> {
    return await GPTPrompt('run 1, function stubs')
    // return [ //     `ROLE: Expert javascript developer`, //     `TASK: Write stubs for functions in FUNCTIONS LIST`, //     `ADDITIONAL TASK: Write comments between the function's brackets, to indicate data types of parameters/return values`, //     `FORMAT OF REPLY:`, //     "```", //     `function stubs(param1) {`, //     `  // @param param1: string[]`, //     `  // @return Promise<string>`, //     `}`, //     "```", //     "FUNCTIONS LIST:", //     `- extractFunction(functionName, code) {return functionDefinition}`, //     `- replaceFunction(oldFunctionName, newFunctionDefinition, code) {return updatedCode}`, // ].join('\n')
}

export function run1SanityTest() {
    return ["user: ROLE: Expert javascript developer\nTASK: Write stubs for functions in FUNCTIONS LIST\nADDITIONAL TASK: Write comments between the function's brackets, to indicate data types of parameters/return values\nFORMAT OF REPLY:\n```\nfunction stubs(param1) {\n  // @param param1: string[]\n  // @return Promise<string>\n}\n```\nFUNCTIONS LIST:\n- extractFunction(functionName, code) {return functionDefinition}\n- replaceFunction(oldFunctionName, newFunctionDefinition, code) {return updatedCode}", "assistant: ```\nfunction extractFunction(functionName, code) {\n  // @param functionName: string\n  // @param code: string\n  // @return string\n}\n\nfunction replaceFunction(oldFunctionName, newFunctionDefinition, code) {\n  // @param oldFunctionName: string\n  // @param newFunctionDefinition: string\n  // @param code: string\n  // @return string\n}\n```", "user: TARGET: extractFunction\nTASK: Implement function definition\nFORMAT:\n```\nfunction extractFunction(params){let foo='bar baz';}\n```", "assistant: Here's an implementation for the `extractFunction` function:\n\n```\nfunction extractFunction(functionName, code) {\n  // Find the start of the function definition\n  const startRegex = new RegExp(`function\\\\s+${functionName}\\\\s*\\\\(`);\n  const startIndex = code.search(startRegex);\n\n  if (startIndex === -1) {\n    // Function not found\n    throw new Error(`Function ${functionName} not found in code`);\n  }\n\n  // Find the end of the function definition\n  let bracketCount = 1;\n  let endIndex = startIndex + 1;\n\n  while (bracketCount > 0 && endIndex < code.length) {\n    if (code[endIndex] === '{') {\n      bracketCount++;\n    } else if (code[endIndex] === '}') {\n      bracketCount--;\n    }\n\n    endIndex++;\n  }\n\n  if (bracketCount !== 0) {\n    // Malformed function\n    throw new Error(`Malformed function ${functionName} in code`);\n  }\n\n  // Extract the function definition\n  return code.substring(startIndex, endIndex);\n}\n```\n\nThe `extractFunction` function takes two parameters: `functionName`, which is the name of the function to extract, and `code`, which is the code to search for the function definition.\n\nIt uses regular expressions to find the start of the function definition, and then searches for the end of the definition by counting brackets. If the function definition is malformed (i.e. the bracket count is not zero at the end), an error is thrown.\n\nFinally, the function returns the extracted function definition as a string.", 'user: TARGET: extractFunction\nTASK: Write 3 tests for function\nRECOMMENDED: If tests have similar structure, create an extra function to facilitate setup.\nFORMAT:\n```\nfunction test_extractFunction_1(){if(testFailed) throw new Error("Input: {input} -- Expected: {expected} -- Actual: {actual}")}\n```\nIGNORE: Differences in newlines or whitespaces.\nONLY CONCERN: Whether the function\'s declaration and definition are equivalent.', "assistant: Here are three tests for the `extractFunction` function:\n\n```\n// Test 1: Extract a function definition from code\nfunction test_extractFunction_1() {\n  const code = `\n    function add(a, b) {\n      return a + b;\n    }\n\n    function subtract(a, b) {\n      return a - b;\n    }\n  `;\n  const functionName = 'add';\n  const expected = 'function add(a, b) {\\n  return a + b;\\n}';\n  const actual = extractFunction(functionName, code);\n  if (actual !== expected) {\n    throw new Error(`Input: ${functionName}, ${code} -- Expected: ${expected} -- Actual: ${actual}`);\n  }\n}\n\n// Test 2: Extract a function definition that spans multiple lines\nfunction test_extractFunction_2() {\n  const code = `\n    function multiply(a, b) {\n      return a * b;\n    }\n\n    function divide(a, b) {\n      return a / b;\n    }\n  `;\n  const functionName = 'divide';\n  const expected = 'function divide(a, b) {\\n  return a / b;\\n}';\n  const actual = extractFunction(functionName, code);\n  if (actual !== expected) {\n    throw new Error(`Input: ${functionName}, ${code} -- Expected: ${expected} -- Actual: ${actual}`);\n  }\n}\n\n// Test 3: Extract a function definition that has nested functions\nfunction test_extractFunction_3() {\n  const code = `\n    function outerFunction() {\n      function innerFunction() {\n        console.log('Hello, world!');\n      }\n\n      innerFunction();\n    }\n\n    function anotherFunction() {\n      console.log('Goodbye, world!');\n    }\n  `;\n  const functionName = 'outerFunction';\n  const expected = `function outerFunction() {\\n  function innerFunction() {\\n    console.log('Hello, world!');\\n  }\\n\\n  innerFunction();\\n}`;\n  const actual = extractFunction(functionName, code);\n  if (actual !== expected) {\n    throw new Error(`Input: ${functionName}, ${code} -- Expected: ${expected} -- Actual: ${actual}`);\n  }\n}\n```\n\nThe tests should be run using a test runner or by calling each test function manually.", "user: TARGET: replaceFunction\nTASK: Implement function definition\nFORMAT:\n```\nfunction replaceFunction(params){let foo='bar baz';}\n```", "assistant: Here's an implementation for the `replaceFunction`:\n\n```\nfunction replaceFunction(oldFunctionName, newFunctionDefinition, code) {\n  // Find the location of the old function in the code\n  const start = code.indexOf(`function ${oldFunctionName}`);\n  if (start === -1) {\n    throw new Error(`Function ${oldFunctionName} not found in code`);\n  }\n\n  // Extract the old function's body\n  const oldFunctionBody = code.slice(start);\n  const end = oldFunctionBody.indexOf('}') + start + 1;\n  const oldFunction = oldFunctionBody.slice(0, end);\n\n  // Replace the old function with the new function definition\n  const updatedCode = code.slice(0, start) + newFunctionDefinition + code.slice(end);\n\n  return updatedCode;\n}\n``` \n\nThis implementation first finds the starting position of the old function definition in the code string using the `indexOf` method. It then extracts the entire body of the old function definition using `slice`. It calculates the end position of the old function definition by finding the position of the closing curly brace and adding it to the starting position. Then, it concatenates the new function definition with the code string before and after the old function definition, and returns the updated code string. If the old function definition is not found in the code string, it throws an error.", 'user: TARGET: replaceFunction\nTASK: Write 3 tests for function\nRECOMMENDED: If tests have similar structure, create an extra function to facilitate setup.\nFORMAT:\n```\nfunction test_replaceFunction_1(){if(testFailed) throw new Error("Input: {input} -- Expected: {expected} -- Actual: {actual}")}\n```\nIGNORE: Differences in newlines or whitespaces.\nONLY CONCERN: Whether the function\'s declaration and definition are equivalent.', 'assistant: Here are three tests for `replaceFunction`:\n\n```\nfunction test_replaceFunction_1() {\n  const oldFunctionName = "myFunction";\n  const newFunctionDefinition = "function myFunction() {\\n  console.log(\'Hello, world!\');\\n}";\n  const code = "function myFunction() {\\n  console.log(\'Goodbye, world!\');\\n}";\n  const expected = "function myFunction() {\\n  console.log(\'Hello, world!\');\\n}";\n  const actual = replaceFunction(oldFunctionName, newFunctionDefinition, code);\n  if (actual !== expected) {\n    throw new Error(`Input: ${oldFunctionName}, ${newFunctionDefinition}, ${code} -- Expected: ${expected} -- Actual: ${actual}`);\n  }\n}\n\nfunction test_replaceFunction_2() {\n  const oldFunctionName = "addNumbers";\n  const newFunctionDefinition = "function addNumbers(a, b) {\\n  return a + b;\\n}";\n  const code = "function addNumbers(a, b) {\\n  return a * b;\\n}";\n  const expected = "function addNumbers(a, b) {\\n  return a + b;\\n}";\n  const actual = replaceFunction(oldFunctionName, newFunctionDefinition, code);\n  if (actual !== expected) {\n    throw new Error(`Input: ${oldFunctionName}, ${newFunctionDefinition}, ${code} -- Expected: ${expected} -- Actual: ${actual}`);\n  }\n}\n\nfunction test_replaceFunction_3() {\n  const oldFunctionName = "greet";\n  const newFunctionDefinition = "function greet(name) {\\n  return `Hello, ${name}!`;\\n}";\n  const code = "function greet(name) {\\n  return `Hi, ${name}!`;\\n}";\n  const expected = "function greet(name) {\\n  return `Hello, ${name}!`;\\n}";\n  const actual = replaceFunction(oldFunctionName, newFunctionDefinition, code);\n  if (actual !== expected) {\n    throw new Error(`Input: ${oldFunctionName}, ${newFunctionDefinition}, ${code} -- Expected: ${expected} -- Actual: ${actual}`);\n  }\n}\n```',]
}