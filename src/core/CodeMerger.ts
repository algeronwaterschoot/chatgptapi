const _ = require('lodash')
import { typescript as ts } from '../main'
import { ExtractSubstringsDecorator, RemoveDuplicateMethodsDecorator } from "./GPTPromptDecorators"

type CodeBlock = {
    type: "class" | "function" | "interface" | "type" | "method" | "prop" | "import" | "enum" | "other"
    name: string
    code: string
    parentDeclarationName?: string
}

export class CodeBlockMerger {
    private extractSubstringsDecorator: ExtractSubstringsDecorator
    // private prettifyCodeDecorator: PrettifyCodeDecorator = new PrettifyCodeDecorator()
    private codeBlocksMap: Map<string, CodeBlock> = new Map()

    constructor(block_start: string = "```", block_end: string = "```") {
        this.extractSubstringsDecorator = new ExtractSubstringsDecorator(block_start, block_end)
    }

    invoke(messages: string[]): string {

        for (const message of messages) {
            const codeBlocks = this.extractCodeBlocks(message)
            for (const codeBlock of codeBlocks) {
                this.mergeCodeBlock(codeBlock)
            }
        }
        const mergedCode = this.reassembleCode()
        let postprocessing = mergedCode
        const decorator = new RemoveDuplicateMethodsDecorator(postprocessing)
        const cleanedCode = decorator.removeDuplicates()

        return cleanedCode
    }

    private extractCodeBlocks(message: string): CodeBlock[][] {
        const rawCodeBlocks = this.extractSubstringsDecorator.decorate(message)
        // const prettifiedCodeBlocks = rawCodeBlocks.map(((block) =>
        //     this.prettifyCodeDecorator.decorate(block)
        // ))
        const codeBlocks = rawCodeBlocks.map(((block) =>
            this.extractCodeElements(block))
        )
        return codeBlocks
    }

    private extractCodeElements(codeBlock: string): CodeBlock[] {
        const sourceFile = ts.createSourceFile(
            "temp.ts",
            codeBlock,
            ts.ScriptTarget.Latest,
            true
        )
        const codeElements: CodeBlock[] = []

        const visitNode = (node: ts.Node, parentDeclarationName?: string) => {
            if (
                ts.isClassDeclaration(node) ||
                ts.isFunctionDeclaration(node) ||
                ts.isInterfaceDeclaration(node) ||
                ts.isTypeAliasDeclaration(node) ||
                ts.isEnumDeclaration(node) ||
                ts.isImportDeclaration(node)
            ) {
                // @ts-ignore
                let name = node.name?.getText(sourceFile) || ""
                let code = codeBlock.substring(node.pos, node.end).trim()
                if (name.length === 0) name = code
                let type: CodeBlock["type"]
                if (ts.isClassDeclaration(node)) type = 'class'
                else if (ts.isFunctionDeclaration(node)) type = 'function'
                else if (ts.isInterfaceDeclaration(node)) type = 'interface'
                else if (ts.isTypeAliasDeclaration(node)) type = 'type'
                else if (ts.isEnumDeclaration(node)) type = 'enum'
                else if (ts.isImportDeclaration(node)) type = 'import'
                else throw new Error('Not implemented')

                if (['class', 'type', 'interface', 'enum'].includes(type)) {
                    code = code.replace(/\{.*}/gs, '{ }')
                }

                codeElements.push({ type: type, name, code })

                if (ts.isClassDeclaration(node) ||
                    ts.isInterfaceDeclaration(node) ||
                    ts.isTypeAliasDeclaration(node) ||
                    ts.isEnumDeclaration(node)) {
                    parentDeclarationName = name
                }
            } else if (parentDeclarationName && (
                ts.isMethodDeclaration(node) ||
                ts.isTypeElement(node) ||
                ts.isClassElement(node) ||
                ts.isEnumMember(node)
            )) {
                const methodName = node.name?.getText(sourceFile) || ""
                const code = codeBlock.substring(node.pos, node.end).trim()
                codeElements.push({ type: "prop", name: `${parentDeclarationName}.${methodName}`, code, parentDeclarationName: parentDeclarationName })
            }

            ts.forEachChild(node, (child) => visitNode(child, parentDeclarationName))
        }

        ts.forEachChild(sourceFile, visitNode)
        return codeElements
    }

    private mergeCodeBlock(codeBlock: CodeBlock[]): void {
        for (const subcode of codeBlock) {
            const key = subcode.type === "method"
                ? `${subcode.parentDeclarationName}.${subcode.name}`
                : subcode.name
            this.codeBlocksMap.set(key, subcode)
        }
    }

    private reassembleCode(): string {
        let mergedCodeArray = Array.from(this.codeBlocksMap.values())
        let output: string[] = []

        mergedCodeArray = this.sortCodesByType(mergedCodeArray)

        for (const codeElement of mergedCodeArray) {
            switch (codeElement.type) {
                case "class":
                case "interface":
                case "type":
                case "function":
                case "enum":
                case "import":
                case "other":
                    output.push(codeElement.code)
                    break
                case "method":
                case "prop":
                    // Find the class in the output array and insert the method inside the class
                    if (codeElement.parentDeclarationName) {
                        const parentDeclarationName = codeElement.parentDeclarationName
                        const parentTypes = _.uniq(['class', 'interface', 'type', 'enum'].flatMap((x) => [`${x}`, `abstract ${x}`]).flatMap((x) => [`${x}`, `export ${x}`]))
                        for (const parentType of parentTypes) {
                            const classIndex = output.findIndex(
                                (item) => item.startsWith(`${parentType} ${parentDeclarationName} `)
                            )
                            if (classIndex !== -1) {
                                const classCode = output[classIndex]
                                const closingBraceIndex = classCode.lastIndexOf("}")
                                const updatedClassCode =
                                    classCode.slice(0, closingBraceIndex) +
                                    codeElement.code +
                                    `\n` +
                                    classCode.slice(closingBraceIndex)
                                output[classIndex] = updatedClassCode
                            }
                        }
                    }
                    break
            }
        }

        const mergedCode = output.join(`\n\n`)
        // const outputCode = this.prettifyCodeDecorator.decorate(mergedCode, {
        //     parser: "typescript",
        //     tabWidth: 2,
        //     indent_size: 2,
        //     tab_width: 2,
        //     editorconfig: false
        // })
        this.eraseMemory()
        return mergedCode
    }
    private sortCodesByType(mergedCodeArray: CodeBlock[]): CodeBlock[] {
        const output: CodeBlock[] = []
        const shouldGoFirst = ["import", "enum", "interface", "type"] // , "class", "function", "prop", "method"
        for (const type of shouldGoFirst) {
            for (const block of mergedCodeArray) {
                if (block.type == type) output.push(block)
            }
        }
        for (const block of mergedCodeArray) {
            if (!(shouldGoFirst.includes(block.type))) output.push(block)
        }
        return output
    }

    private eraseMemory() {
        // TODO: Probably makes more sense to turn into a static class
        // @ts-ignore
        delete this.extractSubstringsDecorator
        // @ts-ignore
        delete this.prettifyCodeDecorator
        // @ts-ignore
        delete this.codeBlocksMap
    }
}
