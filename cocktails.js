// ==UserScript==
// @name         My UserScript
// @description  Description of my UserScript
// @version      1.0
// @match        https://example.com/*
// @grant        none
// ==/UserScript==

// Function definitions below

/**
 * Replaces a function with new code in a given string of code.
 * 
 * @param {string} code - The original code where the function will be replaced.
 * @param {string} newCode - The new code that will replace the original function.
 * 
 * @returns {string} - The updated code with the replaced function.
 * 
 * @throws {TypeError} - If either parameter is not of type string.
 * @throws {Error} - If the function being replaced is not found in the provided code.
 */
function replaceFunction(code, newCode) {
  if (typeof code !== 'string' || typeof newCode !== 'string') {
    throw new TypeError('Parameters code and newCode must be strings');
  }
  
  const FUNCTION_REGEX = /function\s+[^\(]*\([^)]*\)\s*\{[^}]*\}/gm;
  const matchedFunctions = code.match(FUNCTION_REGEX);
  
  if (!matchedFunctions) {
    throw new Error('No functions found in provided code');
  }
  
  let functionFound = false;
  const updatedCode = code.replace(FUNCTION_REGEX, (matchedFunction) => {
    const functionName = matchedFunction.match(/function\s+([^\(]*)/)[1];
    
    if (functionName === newCode.match(/function\s+([^\(]*)/)[1]) {
      functionFound = true;
      return newCode;
    }
    
    return matchedFunction;
  });
  
  if (!functionFound) {
    throw new Error('Function not found in provided code');
  }
  
  return updatedCode;
}

/**
 * Tests the replaceFunction function to ensure it's working correctly.
 * 
 * @throws {Error} - If the test fails.
 */
async function test_replaceFunction() {
  const originalCode = `function add(x, y) {
    return x + y;
  }`;
  const expectedCode = `function add(x, y) {
    return x + y + 1;
  }`;
  
  const updatedCode = await replaceFunction(originalCode, expectedCode);
  
  if (updatedCode !== expectedCode) {
    throw new Error('replaceFunction test failed');
  }
}

/**
 * Replaces a method with new code.
 * 
 * @param {string} code - The original code where the method will be replaced.
 * @param {string} newCode - The new code that will replace the original method.
 * @returns {string} - The updated code with the replaced method.
 * 
 * @description Finds and replaces a method in a code string with new code.
 * 
 * Steps:
 * 1. Parse the original code to extract the class name, method name, and method signature.
 * 2. Check if the method exists in the original code.
 * 3. If the method exists, replace the method code with the new code using string replace.
 * 4. If the method does not exist, return the original code.
 * 
 * Example:
 * const updatedCode = replaceMethod(code, newCode);
 */
function replaceMethod(code, newCode) {
  const methodRegExp = /([a-zA-Z0-9_$]+)\s*\((.*?)\)\s*\{([\s\S]*?)\}/;
  const matches = code.match(methodRegExp);

  if (!matches) {
    return code;
  }

  const methodName = matches[1];
  const methodSignature = matches[2];
  const methodCode = matches[3];

  const newMethodCode = newCode.trim().replace(/^{([\s\S]*)}$/, '$1');

  return code.replace(methodRegExp, `${methodName}(${methodSignature}) {${newMethodCode}}`);
}

/**
 * Tests whether the function replaceMethod is working correctly.
 * 
 * @returns {Promise<void>} - Throws an error if the test fails.
 * 
 * @description The test creates a string of code with a method and replaces it with new code.
 * 
 * Steps:
 * 1. Create a string of code with a class that has a method.
 * 2. Call the replaceMethod function to replace the method with new code.
 * 3. Check if the updated code contains the new code.
 * 4. Throw an error if the updated code does not contain the new code.
 * 
 * Example:
 * await test_replaceMethod();
 */
async function test_replaceMethod() {
  const originalCode = `class MyClass {
  myMethod() {
    console.log('original method');
  }
}`;
  const newCode = `console.log('new method');`;
  const updatedCode = replaceMethod(originalCode, newCode);
  
  if (!updatedCode.includes(newCode)) {
    throw new Error('replaceMethod test failed: updated code does not contain new code');
  }
}

/**
 * Replaces the constructor in the provided code with new code.
 * 
 * @param {string} code - The original code where the constructor will be replaced.
 * @param {string} newCode - The new code that will replace the original constructor.
 * @returns {string} - The updated code with the replaced constructor.
 * 
 * @description
 * Uses a regular expression to replace the constructor in the given code with the new code.
 * 
 * The new code will replace the matched constructor body.
 * 
 * Pseudocode:
 * 1. Create a regular expression that matches the constructor declaration in code.
 * 2. Replace the constructor body in the matched code with newCode.
 * 3. Return the updated code.
 */
function replaceConstructor(code, newCode) {
  const regex = /constructor\s*\([^\)]*\)\s*{[^}]*}/;
  return code.replace(regex, newCode);
}

/**
 * Tests whether the "replaceConstructor" function is working correctly.
 * 
 * @returns {Promise<void>}
 * 
 * @throws {Error} - If the test fails.
 * 
 * @description
 * This function tests whether the "replaceConstructor" function correctly replaces the constructor in the provided code with the new code.
 * 
 * It does so by:
 * 1. Creating a test class string that includes a constructor with a body.
 * 2. Using the "replaceConstructor" function to replace the constructor with new code.
 * 3. Checking that the resulting code string includes the new code and not the original constructor body.
 */
async function test_replaceConstructor() {
  const originalCode = 'class TestClass {\n  constructor(param) {\n    console.log(param);\n  }\n}';
  const newCode = 'console.log("Hello, world!");';

  const updatedCode = replaceConstructor(originalCode, newCode);

  if (!updatedCode.includes(newCode)) {
    throw new Error('Test failed: constructor was not replaced.');
  }
  if (updatedCode.includes('console.log(param);')) {
    throw new Error('Test failed: original constructor body was not removed.');
  }
}


var myTestClass = `
class Prompt {
  constructor(
    input,
    model = "text-davinci-002-render-sha",
    parentId = crypto.randomUUID(),
    conversationId = null,
  ) {
    this.input = input;
    this.parentId = parentId;
    this.conversationId = conversationId;
    this.model = model;
    this.Id = crypto.randomUUID();
    this.parent = null;
    this.children = [];

    return this._send();
  }

  flattenInput(inputArray) {
    return inputArray.reduce((accumulator, item) => {
      if (Array.isArray(item)) {
        return accumulator.concat(this.flattenInput(item));
      } else if (item instanceof PromptList) {
        return accumulator.concat(item);
      } else if (typeof item === 'object') {
        return accumulator.concat(
          Object.entries(item).map(([key, value]) => new PromptList(key, value))
        );
      } else {
        return accumulator.concat(item);
      }
    }, []);
  }

  async _send() {
    const flattenedInput = this.flattenInput(this.input);
    let messageWithInput = '';

    flattenedInput.forEach((item) => {
      if (item instanceof PromptList) {
        messageWithInput = item.apply(messageWithInput) + '\n';
      } else {
        messageWithInput += item + '\n';
      }
    });
	  var cookies = await chrome.cookies.getAll({ domain: "chat.openai.com" });
	  var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
	  var response = await chrome.tabs.sendMessage(tabs[0].id, { action: "chatgptapi-message", cookies: cookies, message: messageWithInput, chatId: this.Id, parentChatId: this.parentId, conversationId: this.conversationId, model: this.model });
	  this.conversationId = response.conversationId;
	  this.response = response.answer;
	  this.Id = response.chatId;
	  this.parentId = response.parentChatId;
	  
	  // Throttle requests.
	  await new Promise(r => setTimeout(r, 3000));

	  return this;
  }

  async next(input, model = "text-davinci-002-render-sha") {
    var newPrompt = await new Prompt(
      input,
      model,
      this.Id,
      this.conversationId,
    );
	newPrompt.parent = this;
	this.children.push(newPrompt);
	return newPrompt;
  }
}`;
var newConstructor = `
constructor(
    input,
    hello = "freak-bitches",
    parentId = crypto.randomUUID(),
    conversationId = null,
  ) {
    this.input = yo;
    this.parentId = parentId;
    this.conversationId = conversationId;
    this.model = man;
    this.Id = crypto.randomUUID();
    this.parent = null;
    this.children = [];

    return this._send();
  }`;
const myTestFunction = `function add(x, y) {
  return x + y;
}`;
const myNewFunction1 = `function add(x, y) {
  return x + y + 2;
}`;
const myNewFunction2 = `function add(x, y) {
  return x + y + 2;
}`;
const myNewFunction3 = `function add(Z, y) {
  return x + y + 2;
}`;
const originalCode = `function add(x, y) {
  return x + y;
}`;
const expectedCode = `function add(x, y) {
  return x + y + 1;
}`;
window.addEventListener('DOMContentLoaded', () => {
  /*
  // var replacedCode = replaceConstructor(myOwnTest, newConstructor);
  var replacedFunction = replaceFunction(myTestFunction, myNewFunction1);
  console.log(replacedFunction);
  var replacedFunction = replaceFunction(myTestFunction, myNewFunction2);
  console.log(replacedFunction);
  var replacedFunction = replaceFunction(myTestFunction, myNewFunction3);
  console.log(replacedFunction);
  */
});