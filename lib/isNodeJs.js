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
exports.sandbox = exports.isNodeJs = void 0;
exports.isNodeJs = (typeof window === 'undefined'); // 'Running in Node.js'
/*
var vm2
if (isNodeJs) vm2 = require('vm') // For testing in sandbox
else vm2 = ''
const vm = vm2
vm2 = ''
*/
const vm = exports.isNodeJs ? require('vm') : new Error('VM only works in NodeJS');
//@ts-ignore
const sandboxBrowser = (code) => __awaiter(void 0, void 0, void 0, function* () { const result = yield executeJavaScript(code); });
const sandboxNodeJS = (code) => {
    const sandbox = {
        // any global variables or functions you want to make available to the sandbox should be added here.
        console: console
    };
    const script = new vm.Script(code);
    script.runInNewContext(sandbox);
    let hi = 'hi';
};
exports.sandbox = exports.isNodeJs ? sandboxNodeJS : sandboxBrowser;
//# sourceMappingURL=isNodeJs.js.map