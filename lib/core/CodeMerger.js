"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeBlockMerger = void 0;
const _ = require('lodash');
const main_1 = require("../main");
const GPTPromptDecorators_1 = require("./GPTPromptDecorators");
class CodeBlockMerger {
    constructor(block_start = "```", block_end = "```") {
        // private prettifyCodeDecorator: PrettifyCodeDecorator = new PrettifyCodeDecorator()
        this.codeBlocksMap = new Map();
        this.extractSubstringsDecorator = new GPTPromptDecorators_1.ExtractSubstringsDecorator(block_start, block_end);
    }
    invoke(messages) {
        for (const message of messages) {
            const codeBlocks = this.extractCodeBlocks(message);
            for (const codeBlock of codeBlocks) {
                this.mergeCodeBlock(codeBlock);
            }
        }
        const mergedCode = this.reassembleCode();
        let postprocessing = mergedCode;
        const decorator = new GPTPromptDecorators_1.RemoveDuplicateMethodsDecorator(postprocessing);
        const cleanedCode = decorator.removeDuplicates();
        return cleanedCode;
    }
    extractCodeBlocks(message) {
        const rawCodeBlocks = this.extractSubstringsDecorator.decorate(message);
        // const prettifiedCodeBlocks = rawCodeBlocks.map(((block) =>
        //     this.prettifyCodeDecorator.decorate(block)
        // ))
        const codeBlocks = rawCodeBlocks.map(((block) => this.extractCodeElements(block)));
        return codeBlocks;
    }
    extractCodeElements(codeBlock) {
        const sourceFile = main_1.typescript.createSourceFile("temp.ts", codeBlock, main_1.typescript.ScriptTarget.Latest, true);
        const codeElements = [];
        const visitNode = (node, parentDeclarationName) => {
            var _a, _b;
            if (main_1.typescript.isClassDeclaration(node) ||
                main_1.typescript.isFunctionDeclaration(node) ||
                main_1.typescript.isInterfaceDeclaration(node) ||
                main_1.typescript.isTypeAliasDeclaration(node) ||
                main_1.typescript.isEnumDeclaration(node) ||
                main_1.typescript.isImportDeclaration(node)) {
                // @ts-ignore
                let name = ((_a = node.name) === null || _a === void 0 ? void 0 : _a.getText(sourceFile)) || "";
                let code = codeBlock.substring(node.pos, node.end).trim();
                if (name.length === 0)
                    name = code;
                let type;
                if (main_1.typescript.isClassDeclaration(node))
                    type = 'class';
                else if (main_1.typescript.isFunctionDeclaration(node))
                    type = 'function';
                else if (main_1.typescript.isInterfaceDeclaration(node))
                    type = 'interface';
                else if (main_1.typescript.isTypeAliasDeclaration(node))
                    type = 'type';
                else if (main_1.typescript.isEnumDeclaration(node))
                    type = 'enum';
                else if (main_1.typescript.isImportDeclaration(node))
                    type = 'import';
                else
                    throw new Error('Not implemented');
                if (['class', 'type', 'interface', 'enum'].includes(type)) {
                    code = code.replace(/\{.*}/gs, '{ }');
                }
                codeElements.push({ type: type, name, code });
                if (main_1.typescript.isClassDeclaration(node) ||
                    main_1.typescript.isInterfaceDeclaration(node) ||
                    main_1.typescript.isTypeAliasDeclaration(node) ||
                    main_1.typescript.isEnumDeclaration(node)) {
                    parentDeclarationName = name;
                }
            }
            else if (parentDeclarationName && (main_1.typescript.isMethodDeclaration(node) ||
                main_1.typescript.isTypeElement(node) ||
                main_1.typescript.isClassElement(node) ||
                main_1.typescript.isEnumMember(node))) {
                const methodName = ((_b = node.name) === null || _b === void 0 ? void 0 : _b.getText(sourceFile)) || "";
                const code = codeBlock.substring(node.pos, node.end).trim();
                codeElements.push({ type: "prop", name: `${parentDeclarationName}.${methodName}`, code, parentDeclarationName: parentDeclarationName });
            }
            main_1.typescript.forEachChild(node, (child) => visitNode(child, parentDeclarationName));
        };
        main_1.typescript.forEachChild(sourceFile, visitNode);
        return codeElements;
    }
    mergeCodeBlock(codeBlock) {
        for (const subcode of codeBlock) {
            const key = subcode.type === "method"
                ? `${subcode.parentDeclarationName}.${subcode.name}`
                : subcode.name;
            this.codeBlocksMap.set(key, subcode);
        }
    }
    reassembleCode() {
        let mergedCodeArray = Array.from(this.codeBlocksMap.values());
        let output = [];
        mergedCodeArray = this.sortCodesByType(mergedCodeArray);
        for (const codeElement of mergedCodeArray) {
            switch (codeElement.type) {
                case "class":
                case "interface":
                case "type":
                case "function":
                case "enum":
                case "import":
                case "other":
                    output.push(codeElement.code);
                    break;
                case "method":
                case "prop":
                    // Find the class in the output array and insert the method inside the class
                    if (codeElement.parentDeclarationName) {
                        const parentDeclarationName = codeElement.parentDeclarationName;
                        const parentTypes = _.uniq(['class', 'interface', 'type', 'enum'].flatMap((x) => [`${x}`, `abstract ${x}`]).flatMap((x) => [`${x}`, `export ${x}`]));
                        for (const parentType of parentTypes) {
                            const classIndex = output.findIndex((item) => item.startsWith(`${parentType} ${parentDeclarationName} `));
                            if (classIndex !== -1) {
                                const classCode = output[classIndex];
                                const closingBraceIndex = classCode.lastIndexOf("}");
                                const updatedClassCode = classCode.slice(0, closingBraceIndex) +
                                    codeElement.code +
                                    `\n` +
                                    classCode.slice(closingBraceIndex);
                                output[classIndex] = updatedClassCode;
                            }
                        }
                    }
                    break;
            }
        }
        const mergedCode = output.join(`\n\n`);
        // const outputCode = this.prettifyCodeDecorator.decorate(mergedCode, {
        //     parser: "typescript",
        //     tabWidth: 2,
        //     indent_size: 2,
        //     tab_width: 2,
        //     editorconfig: false
        // })
        this.eraseMemory();
        return mergedCode;
    }
    sortCodesByType(mergedCodeArray) {
        const output = [];
        const shouldGoFirst = ["import", "enum", "interface", "type"]; // , "class", "function", "prop", "method"
        for (const type of shouldGoFirst) {
            for (const block of mergedCodeArray) {
                if (block.type == type)
                    output.push(block);
            }
        }
        for (const block of mergedCodeArray) {
            if (!(shouldGoFirst.includes(block.type)))
                output.push(block);
        }
        return output;
    }
    eraseMemory() {
        // TODO: Probably makes more sense to turn into a static class
        // @ts-ignore
        delete this.extractSubstringsDecorator;
        // @ts-ignore
        delete this.prettifyCodeDecorator;
        // @ts-ignore
        delete this.codeBlocksMap;
    }
}
exports.CodeBlockMerger = CodeBlockMerger;
//# sourceMappingURL=CodeMerger.js.map