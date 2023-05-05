"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CodeMerger_1 = require("./CodeMerger");
describe('CodeBlockMerger', () => {
    const codeMerger = new CodeMerger_1.CodeBlockMerger();
    test('should merge code blocks correctly', () => {
        const codeBlocks = [
            `<code>class A { method1() { console.log('A1'); } }</code>`,
            `<code>class A { method1() { console.log('A2'); } method2() { console.log('A3'); } }</code>`,
            `<code>function B() { console.log('B1'); }</code>`,
        ];
        const expectedResult = [
            `class A {`,
            `method1() { console.log('A2'); }`,
            `method2() { console.log('A3'); }`,
            `}`,
            `function B() { console.log('B1'); }`,
        ].join('\n');
        const mergedCode = codeMerger.mergeCodeBlocks(codeBlocks);
        expect(mergedCode).toEqual(expectedResult);
    });
});
//# sourceMappingURL=CodeMerger.tests.js.map