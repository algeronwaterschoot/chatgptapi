"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CodeMerger_1 = require("./CodeMerger");
const globals_1 = require("@jest/globals");
describe('CodeBlockMerger', () => {
    let codeMerger;
    beforeEach(() => {
        codeMerger = new CodeMerger_1.CodeBlockMerger();
    });
    (0, globals_1.test)('should merge code blocks correctly', () => {
        const codeBlocks = [
            `<code>class A { method1() { console.log("A1"); } }</code>`,
            `<code>class A { method1() { console.log("A2"); } method2() { console.log("A3"); } }</code>`,
            `<code>function B() { console.log("B1"); }</code>`,
        ];
        const expectedResult = [
            `class A {`,
            `    method1() { console.log("A2"); }`,
            `    method2() { console.log("A3"); }`,
            `}`,
            `function B() { console.log("B1"); }`,
            ""
        ].join('\n');
        const mergedCode = codeMerger.invoke(codeBlocks);
        (0, globals_1.expect)(mergedCode).toEqual(expectedResult);
    });
    (0, globals_1.test)('should handle empty code blocks', () => {
        const codeBlocks = [
            `<code></code>`,
            `<code>function A() { console.log('A1'); }</code>`,
        ];
        const expectedResult = [
            `function A() { console.log('A1'); }`,
            ""
        ].join('\n');
        const mergedCode = codeMerger.invoke(codeBlocks);
        (0, globals_1.expect)(mergedCode).toEqual(expectedResult);
    });
    (0, globals_1.test)('should merge overlapping code blocks', () => {
        const codeBlocks = [
            `<code>class A { method1() { console.log('A1'); } }</code>`,
            `<code>class A { method2() { console.log('A2'); } }</code>`,
        ];
        const expectedResult = [
            `class A {`,
            `    method1() { console.log('A1'); }`,
            `    method2() { console.log('A2'); }`,
            `}`,
            ``
        ].join("\n");
        const mergedCode = codeMerger.invoke(codeBlocks);
        (0, globals_1.expect)(mergedCode).toEqual(expectedResult);
    });
    (0, globals_1.test)('should handle multiple classes and functions', () => {
        const codeBlocks = [
            `<code>class A { method1() { console.log('A1'); } }</code>`,
            `<code>class B { method1() { console.log('B1'); } }</code>`,
            `<code>function C() { console.log('C1'); }</code>`,
        ];
        const expectedResult = [
            `class A {`,
            `    method1() { console.log('A1'); }`,
            `}`,
            `class B {`,
            `    method1() { console.log('B1'); }`,
            `}`,
            `function C() { console.log('C1'); }`,
            ``
        ].join('\n');
        const mergedCode = codeMerger.invoke(codeBlocks);
        (0, globals_1.expect)(mergedCode).toEqual(expectedResult);
    });
    (0, globals_1.test)('should handle updates to existing code', () => {
        const codeBlocks = [
            `<code>class A { method1() { console.log('A1'); } }</code>`,
            `<code>class A { method1() { console.log('Updated A1'); } }</code>`,
        ];
        const expectedResult = [
            "class A {",
            "    method1() { console.log('Updated A1'); }",
            "}",
            ""
        ].join('\n');
        const mergedCode = codeMerger.invoke(codeBlocks);
        (0, globals_1.expect)(mergedCode).toEqual(expectedResult);
    });
    it("should handle multiple class declarations", () => {
        const messages = [
            `<code>class A { method1() {} }</code>`,
            `<code>class B { method1() {} }</code>`
        ];
        const expectedResult = [`class A {`,
            `    method1() { }`,
            `}`,
            `class B {`,
            `    method1() { }`,
            `}`,
            ``].join('\n');
        const merger = new CodeMerger_1.CodeBlockMerger();
        const result = codeMerger.invoke(messages);
        (0, globals_1.expect)(result).toEqual(expectedResult);
    });
    it("should merge classes with different methods", () => {
        const messages = [
            `<code>class A { method1() {} }</code>`,
            `<code>class A { method2() {} }</code>`
        ];
        const expectedResult = [`class A {`,
            `    method1() { }`,
            `    method2() { }`,
            `}`,
            ``].join('\n');
        const result = codeMerger.invoke(messages);
        (0, globals_1.expect)(result).toEqual(expectedResult);
    });
    it("should merge interface declarations", () => {
        const messages = [
            `<code>interface IExample { prop1: string; }</code>`,
            `<code>interface IExample { prop2: number; }</code>`
        ];
        const expectedResult = [`interface IExample {`,
            `    prop1: string;`,
            `    prop2: number;`,
            `}`,
            ``].join('\n');
        const result = codeMerger.invoke(messages);
        (0, globals_1.expect)(result).toEqual(expectedResult);
    });
    it("should handle type alias declarations", () => {
        const messages = [
            `<code> type Example = { prop1: string }; </code>`,
            `<code>type Example = { prop2: number; };</code>`
        ];
        const expectedResult = [`type Example = {`,
            `    prop1: string;`,
            `    prop2: number;`,
            `};`,
            ``].join('\n');
        const result = codeMerger.invoke(messages);
        (0, globals_1.expect)(result).toEqual(expectedResult);
    });
    it("should handle imports", () => {
        const messages = [
            `<code>import { A } from "./A"; class MyClass { method1() {} }</code>`,
            `<code>import { B } from "./B"; class MyClass { method2() {} }</code>`
        ];
        const expectedResult = [`import { A } from "./A";`,
            `import { B } from "./B";`,
            `class MyClass {`,
            `    method1() { }`,
            `    method2() { }`,
            `}`,
            ``].join('\n');
        const result = codeMerger.invoke(messages);
        (0, globals_1.expect)(result).toEqual(expectedResult);
    });
    it("should handle class inheritance", () => {
        const messages = [
            `<code>class A { method1() {} }</code>`,
            `<code>class B extends A { method2() {} }</code>`
        ];
        const expectedResult = [`class A {`,
            `    method1() { }`,
            `}`,
            `class B extends A {`,
            `    method2() { }`,
            `}`,
            ``].join('\n');
        const merger = new CodeMerger_1.CodeBlockMerger();
        const result = merger.invoke(messages);
        (0, globals_1.expect)(result).toEqual(expectedResult);
    });
    it("should handle class implementations", () => {
        const messages = [
            `<code>interface IExample { method1(): void; }</code>`,
            `<code>class A implements IExample { method1() {} }</code>`
        ];
        const expectedResult = [`interface IExample {`,
            `    method1(): void;`,
            `}`,
            `class A implements IExample {`,
            `    method1() { }`,
            `}`,
            ``].join('\n');
        const merger = new CodeMerger_1.CodeBlockMerger();
        const result = merger.invoke(messages);
        (0, globals_1.expect)(result).toEqual(expectedResult);
    });
    // TODO
    /*
    it("should handle function overloads", () => {
        const messages = [
            `<code>function example(param1: string): string;</code>`,
            `<code>function example(param1: number): number;</code>`
        ]
        const expectedResult = `function example(param1: string): string;\nfunction example(param1: number): number;`
        const merger = new CodeBlockMerger()
        const result = merger.mergeCodeBlocks(messages)
        expect(result).toEqual(expectedResult)
    })
    */
    it("should handle enum declarations", () => {
        const messages = [
            `<code>enum Color { Red, Green }</code>`,
            `<code>enum Color { Blue }</code>`
        ];
        const expectedResult = [`enum Color {`,
            `    Red,`,
            `    Green,`,
            `    Blue`,
            `}`,
            ``].join('\n');
        const merger = new CodeMerger_1.CodeBlockMerger();
        const result = merger.invoke(messages);
        (0, globals_1.expect)(result).toEqual(expectedResult);
    });
    // TODO
    /*
    it("should handle namespace declarations", () => {
        const messages = [
            `<code>namespace MyNamespace { export class A { method1() {} } }</code>`,
            `<code>namespace MyNamespace { export class B { method2() {} } }</code>`
        ]
        const expectedResult = [
            `namespace MyNamespace {`,
            `  export class A {`,
            `    method1() { }`,
            `  }`,
            `  export class B {`,
            `    method2() { }`,
            `  }`,
            `}`,
            ``].join('\n')
        const merger = new CodeBlockMerger()
        const result = merger.mergeCodeBlocks(messages)
        expect(result).toEqual(expectedResult)
    })
    */
    // TODO: Decide if this should be supported.
    /*
    it("should handle const and let declarations", () => {
        const messages = [
            `<code>const a = 1;</code>`,
            `<code>let b = 2;</code>`
        ]
        const expectedResult = `const a = 1;\n\nlet b = 2;`
        const merger = new CodeBlockMerger()
        const result = merger.mergeCodeBlocks(messages)
        expect(result).toEqual(expectedResult)
    })
    */
    it("should handle decorators", () => {
        const messages = [
            `<code>class MyClass { @Log method1() {} }</code>`,
            `<code>function Log(target: any, key: string) {}</code>`
        ];
        const expectedResult = [`class MyClass {`,
            `    @Log`,
            `    method1() { }`,
            `}`,
            `function Log(target: any, key: string) { }`, ``].join('\n');
        const merger = new CodeMerger_1.CodeBlockMerger();
        const result = merger.invoke(messages);
        (0, globals_1.expect)(result).toEqual(expectedResult);
    });
    // TODO
    /*
    it("should handle export statements", () => {
        const messages = [
            `<code>class MyClass { method1() {} }</code>`,
            `<code>export { MyClass };</code>`
        ]
        const expectedResult = [`class MyClass {`, `    method1() { }`, `}`, `export { MyClass };`, ``].join('\n')
        const merger = new CodeBlockMerger()
        const result = merger.mergeCodeBlocks(messages)
        expect(result).toEqual(expectedResult)
    })
    */
    it("should handle import statements", () => {
        const messages = [
            `<code>import { A } from './A';</code>`,
            `<code>import { B } from './B';</code>`
        ];
        const expectedResult = [`import { A } from './A';`, `import { B } from './B';`, ``].join('\n');
        const merger = new CodeMerger_1.CodeBlockMerger();
        const result = merger.invoke(messages);
        (0, globals_1.expect)(result).toEqual(expectedResult);
    });
    // TODO
    /*
    it("should handle nested namespaces", () => {
        const messages = [
            `<code>namespace Outer { namespace Inner1 { export class A {} } }</code>`,
            `<code>namespace Outer { namespace Inner2 { export class B {} } }</code>`
        ]
        const expectedResult = `namespace Outer { namespace Inner1 { export class A {} } namespace Inner2 { export class B {} } }`
        const merger = new CodeBlockMerger()
        const result = merger.mergeCodeBlocks(messages)
        expect(result).toEqual(expectedResult)
    })
    */
    it("should handle comments inside functions and methods", () => {
        const messages = [
            `<code>class MyClass { method1() { \n// newline comment.\n} }</code>`,
            `<code>function myFunction() { // inline comment.\n}</code>`
        ];
        const expectedResult = [`class MyClass {`,
            `    method1() {`,
            `        // newline comment.`,
            `    }`,
            `}`,
            `function myFunction() {`,
            `}`, ``].join('\n');
        const merger = new CodeMerger_1.CodeBlockMerger();
        const result = merger.invoke(messages);
        (0, globals_1.expect)(result).toEqual(expectedResult);
    });
    // TODO: Support for "require()"
    // Alternatively: Keep everything on the first level the way it is,
    // and don't do anything other than remove duplicates. This comes at the risk
    // of leaving a lot of unwanted stuff lying around, but maybe that's better than
    // not knowing what was there after a merge...
});
//# sourceMappingURL=CodeMerger.test.js.map