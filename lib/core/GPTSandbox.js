"use strict";
// @ts-check
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
exports.sandboxEval = exports.sandbox = exports.isNodeJs = exports.extractCodeBlocks = exports.deprecatedExtractCodeFromChatReply = void 0;
const Errors_1 = require("./Errors");
function deprecatedExtractCodeFromChatReply(arr) {
    return __awaiter(this, void 0, void 0, function* () {
        //if (!(Array.isArray(arr) && arr)) return ''
        var script = '';
        for (let anEl of arr) {
            var txt = yield extractJavaScriptCode(anEl);
            txt = yield extractJavaScriptCode2(txt);
            script = script + txt;
        }
        // return arr.map(text => await extractJavaScriptCode2(await extractJavaScriptCode(text))).join('')
        return script.trim();
    });
}
exports.deprecatedExtractCodeFromChatReply = deprecatedExtractCodeFromChatReply;
function extractCodeBlocks(input) {
    // TODO: replace with how CodeMerger does it.
    let processedInput = input;
    const codeBlocks = [];
    // Replace all "```scriptlanguage" with "```" to make it consistent
    let inputLines = processedInput.split('\n');
    let sanitizedInputLines = [];
    for (let inputLine of inputLines) {
        if (inputLine.includes('```'))
            inputLine = '```';
        sanitizedInputLines.push(inputLine);
    }
    processedInput = sanitizedInputLines.join('\n');
    // Test: Count the number of "```". It should be an even number.
    let count = (processedInput.match(/```/g) || []).length;
    // TODO: If not an even number, ChatGPT derped on the output, which we cannot yet handle.
    if (count % 2 !== 0) {
        throw new Errors_1.GPTCodeBlockError('Incomplete code block detected. ChatGPT probably ran out of buffer in its answer.');
    }
    // If zero, return an empty string, since there's no code.
    if (count === 0)
        return [];
    // Split by "```", which means we'll have:
    // ["Blabla before code", "code", "Blabla between code", "code", ... "code", "Blabla after code"]
    inputLines = processedInput.split('```');
    // We can assume:
    // - The array will have at least 3 entries. If ChatGPT only gave a code block and nothing else, the first and last entries will be empty strings, but will still be entries.
    if (inputLines.length < 3)
        throw new Error('Unexpected error #2 while processing ChatGPT code block');
    // - Every even-numbered entry is a code block.
    // - The total number of entries should be uneven.
    if (inputLines.length % 2 === 0)
        throw new Error('Unexpected error #3 while processing ChatGPT code block');
    // We don't know how to handle ChatGPT writing code block syntax inside code blocks, and I'm not sure that's a TODO or not.
    // Extract only the even-numbered entries, which are code blocks.
    let output = [];
    for (let i = 0; i < (inputLines.length - 1) / 2; i++) {
        output.push(inputLines[1 + (i * 2)].trim());
    }
    return output;
}
exports.extractCodeBlocks = extractCodeBlocks;
function extractJavaScriptCode(text) {
    return __awaiter(this, void 0, void 0, function* () {
        let start = text.indexOf("```javascript");
        if (start == -1)
            start = text.indexOf("```js");
        if (start == -1)
            start = text.indexOf("```json");
        let end = text.indexOf("```", start + 1);
        return start !== -1 && end !== -1 ? text.substring(start + "```javascript".length, end) : text;
    });
}
function extractJavaScriptCode2(text) {
    return __awaiter(this, void 0, void 0, function* () {
        let start = text.indexOf("```");
        let end = text.indexOf("```", start + 1);
        return start !== -1 && end !== -1 ? text.substring(start + "```".length, end) : text;
    });
}
exports.isNodeJs = (typeof window === 'undefined'); // 'Running in Node.js'
/*
var vm2
// if (isNodeJs) vm2 = require('vm') // For testing in sandbox
// else vm2 = ''
vm2 = vm
const vm = vm2
vm2 = ''
*/
// const vm = isNodeJs ? require('vm') : new Error('VM only works in NodeJS');
//@ts-ignore
const sandboxBrowser = (code) => __awaiter(void 0, void 0, void 0, function* () { const result = yield executeJavaScript(code); });
const sandboxNodeJS = (code) => {
    const sandbox = {
        // any global variables or functions you want to make available to the sandbox should be added here.
        console: console
    };
    // @ts-ignore
    const script = new vm.Script(code);
    script.runInNewContext(sandbox);
    let hi = 'hi';
};
exports.sandbox = exports.isNodeJs ? sandboxNodeJS : sandboxBrowser;
function sandboxEval(code) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield (0, exports.sandbox)(code);
        }
        catch (error) {
            return { success: false, output: error.message };
        }
        return { success: true, output: '' }; // TODO: Capture output even on success.
    });
}
exports.sandboxEval = sandboxEval;
/*
import "../pkg/uglifyjs.js"
const mini = UglifyJS.minify(`// Return the relative path from file1 => file2
function relativePath(file1, file2) {
    var file1Dirname = path.dirname(file1);
    var file2Dirname = path.dirname(file2);

    if (file1Dirname !== file2Dirname) {
        return path.relative(file1Dirname, file2Dirname);
    }
    return '';
}`)
*/ 
//# sourceMappingURL=GPTSandbox.js.map