"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoveDuplicateMethodsDecorator = exports.PromptBeforeDecorator = exports.ExtractSubstringsDecorator = exports.StemmingDecorator = exports.SplitSentencesDecorator = exports.ShortenSpacesDecorator = exports.MinifyCodeDecorator = exports.PrettifyCodeDecorator = exports.PromptOutputValidator = exports.PromptInputValidator = exports.trimDecorator = exports.minLengthValidator = exports.maxLengthValidator = exports.lowercaseDecorator = exports.uppercaseDecorator = exports.logToFileDecorator = exports.stringEscapingDecorator = exports.mandatoryWordsValidator = exports.forbiddenWordsValidator = exports.regexSubstringCountValidator = exports.RepeatValidator = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const natural_1 = __importDefault(require("natural"));
const prettier_1 = __importDefault(require("prettier"));
const uglify_js_1 = require("uglify-js");
const _ = require('lodash');
const ts = __importStar(require("typescript"));
const GPTPrompt_1 = require("./GPTPrompt");
class RepeatValidator extends GPTPrompt_1.PromptValidator {
    // TODO: Move to subclass
    validate(prompt) {
        this.history.push(prompt);
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        }
        if (this.hasRepeatedPrompts(prompt, 3)) {
            throw new Error("Failed: 3 previous prompts were identical.");
        }
        for (const validator of this.validators) {
            if (!validator(prompt)) {
                throw new Error("Validation failed.");
            }
        }
        return true;
    }
    hasRepeatedPrompts(prompt, count) {
        if (this.history.length < count) {
            return false;
        }
        for (let i = 0; i < count; i++) {
            if (this.history[this.history.length - 1 - i] !== prompt) {
                return false;
            }
        }
        return true;
    }
}
exports.RepeatValidator = RepeatValidator;
// In the Validators module
function regexSubstringCountValidator(regex, count, comparison) {
    return (value) => {
        const matches = value.match(regex);
        const matchCount = matches ? matches.length : 0;
        return comparison(matchCount, count);
    };
}
exports.regexSubstringCountValidator = regexSubstringCountValidator;
// In the Validators module
function forbiddenWordsValidator(forbiddenWords) {
    return (value) => {
        return !forbiddenWords.some((word) => value.includes(word));
    };
}
exports.forbiddenWordsValidator = forbiddenWordsValidator;
function mandatoryWordsValidator(mandatoryWords) {
    return (value) => {
        return mandatoryWords.every((word) => value.includes(word));
    };
}
exports.mandatoryWordsValidator = mandatoryWordsValidator;
// In the Decorators module
function stringEscapingDecorator(value) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
exports.stringEscapingDecorator = stringEscapingDecorator;
function logToFileDecorator(filePath) {
    return (value) => {
        fs_extra_1.default.appendFile(filePath, `${new Date().toISOString()}: ${value}\n`, (err) => {
            if (err) {
                console.error(`Failed to log to file: ${err.message}`);
            }
        });
        return value;
    };
}
exports.logToFileDecorator = logToFileDecorator;
const uppercaseDecorator = (value) => value.toUpperCase();
exports.uppercaseDecorator = uppercaseDecorator;
const lowercaseDecorator = (value) => value.toLowerCase();
exports.lowercaseDecorator = lowercaseDecorator;
// Add maxLengthValidator for the input string
const maxLengthValidator = (maxLength) => {
    return (value) => value.length <= maxLength;
};
exports.maxLengthValidator = maxLengthValidator;
// Add minLengthValidator for the input string
const minLengthValidator = (minLength) => {
    return (value) => value.length >= minLength;
};
exports.minLengthValidator = minLengthValidator;
// Add a simple decorator to trim the input string
const trimDecorator = (value) => value.trim();
exports.trimDecorator = trimDecorator;
class PromptInputValidator extends GPTPrompt_1.PromptValidator {
    // Add a maxLengthValidator of 100 and minLengthValidator of 1 by default
    constructor(validators = [
        (0, exports.maxLengthValidator)(100),
        (0, exports.minLengthValidator)(1),
    ]) {
        super(validators);
    }
    // Inside PromptInputValidator and PromptOutputValidator classes
    validate(value) {
        for (const validator of this.validators) {
            if (!validator(value)) {
                return false;
            }
        }
        return true;
    }
}
exports.PromptInputValidator = PromptInputValidator;
class PromptOutputValidator extends GPTPrompt_1.PromptValidator {
    // Add a maxLengthValidator of 200 by default
    constructor(validators = [(0, exports.maxLengthValidator)(200)]) {
        super(validators);
    }
    // Inside PromptInputValidator and PromptOutputValidator classes
    validate(value) {
        for (const validator of this.validators) {
            if (!validator(value)) {
                return false;
            }
        }
        return true;
    }
}
exports.PromptOutputValidator = PromptOutputValidator;
class PrettifyCodeDecorator {
    decorate(prompt, args = { parser: "typescript" }) {
        // const escaped = JSON.stringify(prompt)
        const prettied = prettier_1.default.format(prompt, args);
        const hi = 'hi';
        return prettied;
    }
}
exports.PrettifyCodeDecorator = PrettifyCodeDecorator;
class MinifyCodeDecorator {
    decorate(prompt) {
        const result = (0, uglify_js_1.minify)(prompt);
        if (result.error) {
            throw new Error(`Minification failed: ${result.error}`);
        }
        return result.code;
    }
}
exports.MinifyCodeDecorator = MinifyCodeDecorator;
class ShortenSpacesDecorator {
    decorate(prompt) {
        return prompt.replace(/\s{2,}/g, " ");
    }
}
exports.ShortenSpacesDecorator = ShortenSpacesDecorator;
class SplitSentencesDecorator {
    decorate(prompt) {
        return prompt.split(/(?<=[.!?;:])\s+/);
    }
}
exports.SplitSentencesDecorator = SplitSentencesDecorator;
class StemmingDecorator {
    decorate(prompt) {
        const stemmedWords = natural_1.default.PorterStemmer.tokenizeAndStem(prompt);
        return stemmedWords.join(" ");
    }
}
exports.StemmingDecorator = StemmingDecorator;
class ExtractSubstringsDecorator {
    constructor(start, end) {
        this.start = start;
        this.end = end;
    }
    decorate(content) {
        // @ts-ignore
        // content = content.replaceAll('\n', '\\n')
        // const regexpCodeBlock = _.escapeRegExp(content)
        const regex = new RegExp(`${this.escapeRegExp(this.start)}(.*?)${this.escapeRegExp(this.end)}`, 'gs');
        const mytest = content.match(regex);
        const matched = [...content.matchAll(regex)];
        let matches = matched.map((match) => match[1]);
        const output = [];
        for (const match of matches) {
            // @ts-ignore
            // output.push(match.replaceAll('\\n', '\n'))
            output.push(`${match}`);
        }
        return output;
    }
    escapeRegExp(string) {
        return _.escapeRegExp(string);
        // @ts-ignore
        return string.replaceAll(/[.*+\-?^${}()|[\]\\]/g, '\\$&'); // TODO: something strange is happening here
    }
}
exports.ExtractSubstringsDecorator = ExtractSubstringsDecorator;
class PromptBeforeDecorator extends GPTPrompt_1.PromptDecorator {
    // Add a trimDecorator by default
    constructor(befores = [exports.trimDecorator], afters = []) {
        super(befores, afters);
    }
    preprocess(value) {
        for (const before of this.befores) {
            value = before(value);
        }
        return value;
    }
    postprocess(value) {
        for (const after of this.afters) {
            value = after(value);
        }
        return value;
    }
}
exports.PromptBeforeDecorator = PromptBeforeDecorator;
class RemoveDuplicateMethodsDecorator {
    constructor(code) {
        this.code = code;
        this.sourceFile = ts.createSourceFile("temp.ts", code, ts.ScriptTarget.Latest, true);
    }
    removeDuplicates() {
        const classMethods = [];
        const visitNode = (node, parentClassName) => {
            var _a, _b;
            if (ts.isClassDeclaration(node)) {
                parentClassName = ((_a = node.name) === null || _a === void 0 ? void 0 : _a.getText(this.sourceFile)) || "";
            }
            else if (ts.isMethodDeclaration(node) && parentClassName) {
                const methodName = ((_b = node.name) === null || _b === void 0 ? void 0 : _b.getText(this.sourceFile)) || "";
                classMethods.push({ className: parentClassName, methodName, node });
            }
            ts.forEachChild(node, (child) => visitNode(child, parentClassName));
        };
        ts.forEachChild(this.sourceFile, visitNode);
        // Group class methods by class name and method name
        const groupedClassMethods = new Map();
        classMethods.forEach((classMethod) => {
            const key = `${classMethod.className}.${classMethod.methodName}`;
            const existingMethods = groupedClassMethods.get(key) || [];
            existingMethods.push(classMethod);
            groupedClassMethods.set(key, existingMethods);
        });
        // Create a new transformer to remove duplicate methods
        // @ts-ignore
        const removeDuplicateMethodsTransformer = (context) => {
            // @ts-ignore
            const visit = (node) => {
                var _a, _b;
                if (ts.isMethodDeclaration(node)) {
                    // @ts-ignore
                    const className = ((_a = node.parent.name) === null || _a === void 0 ? void 0 : _a.getText(this.sourceFile)) || "";
                    const methodName = ((_b = node.name) === null || _b === void 0 ? void 0 : _b.getText(this.sourceFile)) || "";
                    const key = `${className}.${methodName}`;
                    const methods = groupedClassMethods.get(key) || [];
                    if (methods.length > 1) {
                        methods.pop(); // Remove the last method from the methods array
                        groupedClassMethods.set(key, methods);
                        // Return an empty statement to remove the method from the AST
                        return ts.isNotEmittedStatement(node);
                    }
                }
                return ts.visitEachChild(node, visit, context);
            };
            return (node) => ts.visitNode(node, visit);
        };
        // Apply the transformer to the sourceFile
        const result = ts.transform(this.sourceFile, [
            removeDuplicateMethodsTransformer,
        ]);
        const transformedSourceFile = result.transformed[0];
        // Convert the updated AST back to code
        const printer = ts.createPrinter();
        const updatedCode = printer.printFile(transformedSourceFile);
        return updatedCode;
    }
}
exports.RemoveDuplicateMethodsDecorator = RemoveDuplicateMethodsDecorator;
//# sourceMappingURL=GPTPromptDecorators.js.map