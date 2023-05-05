import { GPTPrompt } from "../core/GPTPrompt"
import { CodeBlockMerger } from "../core/CodeMerger"
import { GPTCodeBlockError } from "../core/Errors"
import { GPTContext } from "../core/GPTContext"
import { GPTTag, GPTTagError, GPTTagReflect } from "../core/GPTTag"
import { extractCodeBlocks } from "../core/GPTSandbox"
import { readEntireMessageLog } from "../core/GPTHelpers"
import { defaultChatGPTSetup } from "./defaultChatGPTSetup"




export async function run2() {
    const chatTitle = "Request TypeScript interfaces"
    const firstPrompt = await run2FirstAnswerPrompt()
    const recursiveDepth = 2
    const gpt = defaultChatGPTSetup()
    const mainChat = await gpt.fork()

    const firstAnswer = await mainChat.send(firstPrompt)
    mainChat.tagOurs((tag: GPTTag) => tag.set("title", chatTitle))
    mainChat.tagTheirs((tag: GPTTag) => tag.set("title", "Gives answer"))
    let mainCode = await run2Reflection(mainChat, firstAnswer)
    // let output: string[] = []
    // output.push(mainCode)
    const initialSubtaskPrompt = await GPTPrompt('standard subtask prompt')
    await run2TryRecursiveSubtasks(recursiveDepth, mainChat, initialSubtaskPrompt)
    // let overrideOutput = await standardOverrideOutput(mainChat)
    // let finalCode = overrideOutput.join("\n").split("\n").join("\n")
    // return finalCode

    let messages: string[] = []
    await readEntireMessageLog(messages)
    // messages = [await fs.readFile("src/CodeMerger.ts", "utf8",)]
    // messages = [await fs.readFile("demo/CodeMergeDemo.ts", "utf8",)]
    // messages[0] = `<customcode>${messages[0]}</customcode>`
    // const codeBlockMerger = new CodeBlockMerger('<customcode>', '</customcode>')
    const codeBlockMerger = new CodeBlockMerger('```', '```')
    const mergedCode = codeBlockMerger.invoke(messages)
    console.log(mergedCode)

    const expectedMergedCodeLength = 5605
    console.log(mergedCode.length)
    if (expectedMergedCodeLength !== mergedCode.length) throw new Error("Something broke.")
}

async function run2FirstAnswerPrompt(): Promise<string> {
    const beforeval = [`ROLE: Expert typescript developer`, `TASK: Write interfaces, types and abstract classes for items in REQUIREMENTS LIST`, `ADDITIONAL TASKS:`, `- Use generics and decorators to make code more modular`, `- Annotate with next steps for how to implement classes`, `- Do not write definitions for abstract classes. Only declaration.`, `FORMAT OF REPLY:`, "```", `type MyInterface<T> {`, `condition: (message: T) => boolean;`, `style: string;`, `}`, "```", "REQUIREMENTS LIST:", `A "prompt builder" that helps developers write and organize their prompts for ChatGPT.`, `It needs to be able to do the following:`, `1) Prompt management`, `- Load prompt templates from a JSON file`, `- Load custom prompts from another JSON file`, `2) Template variable substitution`, `- Variables can be declared in templates and custom prompts, and variables (strings) are injected at runtime.`, `3) Dynamic prompt building`, `- It should be possible to reference multiple smaller templates to build larger prompts.`, `- Templates can be selected based on conditional logic at runtime.`, `4) Metadata`, `- Templates and custom prompts can be tagged with metadata.`, `- This metadata should be stored in file.`, `4) Smart prompts`, `- There will be 2 special types of metadata: Validators, and Decorators. Both are references to functions.`, `- A validator can evaluate the input prompt or the output response, and throw an error if validation failed.`, `- Decorators allow callbacks to be injected as preprocessors and postprocessors when sending prompts and receiving replies.`, ``, `If you understand the task, you may start. Remember: Only interfaces, types and abstract classes. No definitions. Use generics and decorators wherever it makes sense.`,]
    const returnval = await GPTPrompt('run 2, initial input')
    const beforelength = beforeval.join('\n').length
    const returnlength = returnval.length
    if (beforelength !== returnlength) throw new Error('Something broke')
    return returnval
}

async function run2TryRecursiveSubtasks(depth: number, branch: GPTContext, prompt: string) {
    try {
        await run2RecursiveSubtasks(depth, branch, prompt)
    } catch (error) {
        if (!(error instanceof GPTCodeBlockError)) throw error
        // The answer didn't fit in ChatGPT's output buffer. Mark it in the metadata, and continue.
        const overflowError: GPTTagError<GPTCodeBlockError> = { error: error, }
        const guiltySubThread = branch.subthreads.slice(-1)[0]
        guiltySubThread.tagTheirs((tag: GPTTag) => {
            tag.set("title", "Output buffer overflow")
            tag.set("Error", overflowError)
        })
    }
}

async function run2RecursiveSubtasks(depth: number, ctx: GPTContext, prompt: string) {
    depth--
    const subtasksList = await ctx.send(prompt)

    ctx.tagOurs((tag: GPTTag) => tag.set("title", "Ask for list of subtasks"),)
    ctx.tagTheirs((tag: GPTTag) => tag.set("title", "Gives answer"))

    let sanitizedList: string = (await extractCodeBlocks(subtasksList)).join("").trim()
    let subtasks: string[] = sanitizedList
        .split("\n")
        .filter((x) => x)
        .map((x) => x.substring(x.indexOf(":") + 1, x.indexOf(".") + 1).trim())

    // If there are no subtasks, return.
    // If there is only one subtask, ChatGPT probably put "this subtask is done" in a code block,
    // which it was asked not to, but well... In that scenario, also return.
    if (subtasks.length < 2) return

    let i = 0
    for (let subtask of subtasks) {
        i++
        let devCtx = await ctx.fork()
        const answer = await devCtx.send(await GPTPrompt('run 2, subtask implementation', { i: i }))

        devCtx.tagOurs((meta: GPTTag) => meta.set("title", subtask),)
        devCtx.tagTheirs((meta: GPTTag) => meta.set("title", "Provides implementation"))

        let correctCode = await run2Reflection(devCtx, answer)
        // output.push(correctCode)

        if (depth > 0) {
            const nextPrompt = await GPTPrompt('run 2, are there more TODOs?', { i: i })
            await run2TryRecursiveSubtasks(depth, devCtx, nextPrompt)
        }
    }
}

async function run2Reflection(context: GPTContext, firstAnswer: string, retries: number = 5) {
    firstAnswer = (await extractCodeBlocks(firstAnswer)).join("\n")
    let bestAnswer = firstAnswer
    let validate = "N/A"
    let tries = 0
    while (validate.length > 0 && tries < retries) {
        tries++
        let newAnswer = await context.send(await GPTPrompt('run 2, reflection'))
        validate = (await extractCodeBlocks(newAnswer)).join("\n")
        context.tagOurs((meta: GPTTag) =>
            meta.set("title", "Ask ChatGPT to reflect on answer"))
        if (validate.length > 0) {
            bestAnswer = validate
            const reflect: GPTTagReflect = { wasCorrect: false }
            context.tagTheirs((tag: GPTTag): void => {
                tag.set("title", "I was wrong")
                tag.set("Reflect", reflect)
            }
            )
        } else {
            const reflect: GPTTagReflect = { wasCorrect: true }
            context.tagTheirs((tag: GPTTag) => {
                tag.set("title", "I was right")
                tag.set("Reflect", reflect)
            }
            )
        }
    }
    return bestAnswer
}



// TODO: Check if this TODO is still a TODO :-)
/*
// TODO: "correctCodes" is obviously not correct since we've done no validation on it.
// and ChatGPT has the habit of only giving partial answers if the method/function is too big.
// Therefore we'll just override it with all of the code we got from ChatGPT so far,
// and we'll puzzle it together manually until we have a better way to automerge everything.
async function standardOverrideOutput(mainChat: GPTContext) {
    let searchResults: ChatGPTMessage[] = (await (
        await configureSearch(new GPTMessageSearch(mainChat), SearchScope.Genealogy)
    ).all()) as ChatGPTMessage[]
    let outputMap = new Map<number, string>()
    let overrideOutput = []
    let i = 0
    for (let message of searchResults) {
        try {
            const codes: string[] = await extractCodeBlocks(message.content)
            if (codes.length > 0) { outputMap.set(message.body.sequence!, codes.join("\n")) }
        } catch (error) {
            if (!(error instanceof FlowChatCodeBlockError)) throw error
            // The answer didn't fit in ChatGPT's output buffer.
        }
    }
    const sequenceKeys = Array.from(outputMap.keys()).sort()
    for (let sequence of sequenceKeys) {
        overrideOutput.push(outputMap.get(sequence)!)
    }
    return overrideOutput
}
*/