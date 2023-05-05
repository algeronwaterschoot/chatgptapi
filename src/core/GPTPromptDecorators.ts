
// import fs from "fs-extra"
// import natural from "natural"
// import prettier from "prettier"
// import { minify } from "uglify-js"
const _ = require('lodash')
// import * as ts from "typescript"
import { typescript as ts } from '../main'
import { PromptValidator, Validator, PromptDecorator, Decorator } from "./GPTPrompt"


export class RepeatValidator extends PromptValidator<string> {
    // TODO: Move to subclass
    validate(prompt: string): boolean {
        this.history.push(prompt)
        if (this.history.length > this.maxHistorySize) {
            this.history.shift()
        }

        if (this.hasRepeatedPrompts(prompt, 3)) {
            throw new Error("Failed: 3 previous prompts were identical.")
        }

        for (const validator of this.validators) {
            if (!validator(prompt)) {
                throw new Error("Validation failed.")
            }
        }
        return true
    }
    protected hasRepeatedPrompts(prompt: string, count: number): boolean {
        if (this.history.length < count) {
            return false
        }

        for (let i = 0; i < count; i++) {
            if (this.history[this.history.length - 1 - i] !== prompt) {
                return false
            }
        }
        return true
    }
}

// In the Validators module
export function regexSubstringCountValidator(
    regex: RegExp,
    count: number,
    comparison: (a: number, b: number) => boolean
): (value: string) => boolean {
    return (value: string) => {
        const matches = value.match(regex)
        const matchCount = matches ? matches.length : 0
        return comparison(matchCount, count)
    }
}
// In the Validators module
export function forbiddenWordsValidator(
    forbiddenWords: string[]
): (value: string) => boolean {
    return (value: string) => {
        return !forbiddenWords.some((word) => value.includes(word))
    }
}

export function mandatoryWordsValidator(
    mandatoryWords: string[]
): (value: string) => boolean {
    return (value: string) => {
        return mandatoryWords.every((word) => value.includes(word))
    }
}
// In the Decorators module
export function stringEscapingDecorator(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
}

// export function logToFileDecorator(
//     filePath: string
// ): (value: string) => string {
//     return (value: string) => {
//         fs.appendFile(
//             filePath,
//             `${new Date().toISOString()}: ${value}\n`,
//             (err) => {
//                 if (err) {
//                     console.error(`Failed to log to file: ${err.message}`)
//                 }
//             }
//         )
//         return value
//     }
// }


export const uppercaseDecorator: Decorator<string> = (value: string) =>
    value.toUpperCase()
export const lowercaseDecorator: Decorator<string> = (value: string) =>
    value.toLowerCase()

// Add maxLengthValidator for the input string
export const maxLengthValidator = (maxLength: number): Validator<string> => {
    return (value: string) => value.length <= maxLength
}

// Add minLengthValidator for the input string
export const minLengthValidator = (minLength: number): Validator<string> => {
    return (value: string) => value.length >= minLength
}

// Add a simple decorator to trim the input string
export const trimDecorator: Decorator<string> = (value: string) => value.trim()

export class PromptInputValidator extends PromptValidator<string> {
    // Add a maxLengthValidator of 100 and minLengthValidator of 1 by default
    constructor(
        validators: Validator<string>[] = [
            maxLengthValidator(100),
            minLengthValidator(1),
        ]
    ) {
        super(validators)
    }
    // Inside PromptInputValidator and PromptOutputValidator classes
    validate(value: string): boolean {
        for (const validator of this.validators) {
            if (!validator(value)) {
                return false
            }
        }
        return true
    }
}

export class PromptOutputValidator extends PromptValidator<string> {
    // Add a maxLengthValidator of 200 by default
    constructor(validators: Validator<string>[] = [maxLengthValidator(200)]) {
        super(validators)
    }
    // Inside PromptInputValidator and PromptOutputValidator classes
    validate(value: string): boolean {
        for (const validator of this.validators) {
            if (!validator(value)) {
                return false
            }
        }
        return true
    }
}

// export class PrettifyCodeDecorator {
//     decorate(prompt: string, args: {} = { parser: "typescript" }): string {
//         // const escaped = JSON.stringify(prompt)
//         const prettied = prettier.format(prompt, args)
//         const hi = 'hi'
//         return prettied
//     }
// }

// export class MinifyCodeDecorator {
//     decorate(prompt: string): string {
//         const result = minify(prompt)
//         if (result.error) {
//             throw new Error(`Minification failed: ${result.error}`)
//         }
//         return result.code
//     }
// }
export class ShortenSpacesDecorator {
    decorate(prompt: string): string {
        return prompt.replace(/\s{2,}/g, " ")
    }
}
export class SplitSentencesDecorator {
    decorate(prompt: string): string[] {
        return prompt.split(/(?<=[.!?;:])\s+/)
    }
}



// export class StemmingDecorator {
//     decorate(prompt: string): string {
//         const stemmedWords = natural.PorterStemmer.tokenizeAndStem(prompt)
//         return stemmedWords.join(" ")
//     }
// }
export class ExtractSubstringsDecorator {
    private start: string
    private end: string

    constructor(start: string, end: string) {
        this.start = start
        this.end = end
    }

    decorate(content: string): string[] {
        // @ts-ignore
        // content = content.replaceAll('\n', '\\n')
        // const regexpCodeBlock = _.escapeRegExp(content)
        const regex = new RegExp(`${this.escapeRegExp(this.start)}(.*?)${this.escapeRegExp(this.end)}`, 'gs')
        const mytest = content.match(regex)
        const matched = [...content.matchAll(regex)]
        let matches = matched.map((match) => match[1])
        const output = []
        for (const match of matches) {
            // @ts-ignore
            // output.push(match.replaceAll('\\n', '\n'))
            output.push(`${match}`)
        }
        return output
    }

    private escapeRegExp(string: string): string {
        return _.escapeRegExp(string)
        // @ts-ignore
        return string.replaceAll(/[.*+\-?^${}()|[\]\\]/g, '\\$&') // TODO: something strange is happening here
    }

    // async decorate(content: string): Promise<string[]> {
    //     const pattern = new RegExp(`${this.start}(.*?)${this.end}`, "g")
    //     // const matches = []
    //     const matches = pattern.exec(content.replace('\n', '\\n'))

    //     let match
    //     while ((match = pattern.exec(content)) !== null) {
    //         matches.push(match[1])
    //     }

    //     return matches
    // }
}

export class PromptBeforeDecorator extends PromptDecorator<string> {
    // Add a trimDecorator by default
    constructor(
        befores: Decorator<string>[] = [trimDecorator],
        afters: Decorator<string>[] = []
    ) {
        super(befores, afters)
    }
    preprocess(value: string): string {
        for (const before of this.befores) {
            value = before(value)
        }
        return value
    }

    postprocess(value: string): string {
        for (const after of this.afters) {
            value = after(value)
        }
        return value
    }
}


interface ClassMethod {
    className: string
    methodName: string
    node: ts.MethodDeclaration
}

export class RemoveDuplicateMethodsDecorator {
    private sourceFile: ts.SourceFile

    constructor(private code: string) {
        this.sourceFile = ts.createSourceFile(
            "temp.ts",
            code,
            ts.ScriptTarget.Latest,
            true
        )
    }

    removeDuplicates(): string {
        const classMethods: ClassMethod[] = []

        const visitNode = (node: ts.Node, parentClassName?: string) => {
            if (ts.isClassDeclaration(node)) {
                parentClassName = node.name?.getText(this.sourceFile) || ""
            } else if (ts.isMethodDeclaration(node) && parentClassName) {
                const methodName = node.name?.getText(this.sourceFile) || ""
                classMethods.push({ className: parentClassName, methodName, node })
            }

            ts.forEachChild(node, (child) => visitNode(child, parentClassName))
        }

        ts.forEachChild(this.sourceFile, visitNode)

        // Group class methods by class name and method name
        const groupedClassMethods: Map<string, ClassMethod[]> = new Map()
        classMethods.forEach((classMethod) => {
            const key = `${classMethod.className}.${classMethod.methodName}`
            const existingMethods = groupedClassMethods.get(key) || []
            existingMethods.push(classMethod)
            groupedClassMethods.set(key, existingMethods)
        })

        // Create a new transformer to remove duplicate methods
        // @ts-ignore
        const removeDuplicateMethodsTransformer: ts.TransformerFactory<ts.SourceFile> = (
            context
        ) => {
            // @ts-ignore
            const visit: ts.Visitor = (node) => {
                if (ts.isMethodDeclaration(node)) {
                    // @ts-ignore
                    const className = node.parent.name?.getText(this.sourceFile) || ""
                    const methodName = node.name?.getText(this.sourceFile) || ""
                    const key = `${className}.${methodName}`
                    const methods = groupedClassMethods.get(key) || []

                    if (methods.length > 1) {
                        methods.pop() // Remove the last method from the methods array
                        groupedClassMethods.set(key, methods)

                        // Return an empty statement to remove the method from the AST
                        return ts.isNotEmittedStatement(node)
                    }
                }

                return ts.visitEachChild(node, visit, context)
            }

            return (node) => ts.visitNode(node, visit)
        }

        // Apply the transformer to the sourceFile
        const result = ts.transform(this.sourceFile, [
            removeDuplicateMethodsTransformer,
        ])
        const transformedSourceFile = result.transformed[0] as ts.SourceFile

        // Convert the updated AST back to code
        const printer = ts.createPrinter()
        const updatedCode = printer.printFile(transformedSourceFile)

        return updatedCode
    }
}





