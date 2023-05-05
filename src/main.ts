/**
 * WHAT THIS FILE IS:
 * 
 * This script starts a conversation with ChatGPT and asks it to write pure functions
 * to validate and improve "FooVendingMachine", which is a fictional class
 * that covers the plight and concerns of a JavaScript-operated vending machine.
 * FooVendingMachine has various properties and methods for taking orders; updating its display;
 * adjusting internal temp; requesting restocks; etc. (see sample_data/prompts.js for details)
 * Despite being a ficitonal class that is lacking any implementation details whatsoever,
 * in a way that doesn't really matter. ChatGPT can still run with it and generate useful code.
 * 
 * 
 * WHAT THIS DEMO COVERS:
 * 
 * We will initially ask ChatGPT to come up with 3 functions. Then, we will continually ask
 * it for more, but we'll randomly switching branches in the process, so we end up with several
 * variations on the same functions. Though, if the names are identical, we'll take whichever one
 * came last, so we can copy-paste ChatGPT's output into an IDE without any hassle.
 * 
 * 
 * YOU WILL LEARN HOW TO:
 * 
 * - Compose and send prompts to ChatGPT
 * - Create branches and return to them
 * - Render messages as a Mermaid flowchart
 * - Add basic styling to Mermaid nodes
 * - Extract code blocks from ChatGPT messages
 * - Merge code from different code blocks
 */


/* IMPORTS */

import { isNodeJs } from "./core/GPTSandbox"
import { v4 as uuidv4 } from "uuid"
export function UUID(): string { return isNodeJs ? uuidv4() : crypto.randomUUID() }
import { ChatGPTAPI, GPTAPI, GPTMessageLogAPI } from "./core/GPTAPI"
import { defaultChatGPTSetup } from "./WIP/defaultChatGPTSetup"
import { CodeBlockMerger } from './core/CodeMerger'
import { search } from './core/GPTSearch'
import { createFlowchart } from './core/GPTMermaid'



/* SETUP */

// IMPORTANT:
// Uncomment the "require" lines if you're in NodeJS, or the "{}" ones if you're in browser.    (TODO)

export const fs = require("fs-extra")
export const typescript = require("typescript")
// export const fs = {}
// export const typescript = {}



const iterations = 0 // set to 0 if you want to use a seeded list of 30 iterations
const mermaidDiagramDirection = 'TD'

// The following colors will be used in the final Mermaid flowchart. A colored node means that
// a new branch was created somewhere. Where, exactly, depends on one of 4 random outcomes:

// 0) SEQUENTIAL
// A sequential message is the default mode. Our next message will continue from the last reply we got from GPT.
const sequentialColor = 'wheat'

// 1) CHILD BRANCH
// A "child branch" means new prompts will branch off from the current reply. If there's only 1 branch,
// it might not look like anything special is happening compared to sequential messages,
//but it influences what happens when a "sibling" or "cousin" branch is created.
const childBranchColor = 'aqua'

// 2) SIBLING BRANCH
// A "sibling branch" means we return back to the reply where we branched off from, and create a
// new branch from there. In ChatGPT jargon, we are "editing" the message we sent after that reply.
const siblingBranchColor = 'chartreuse'

// 3) COUSIN BRANCH
// A "cousin branch" is similar to a sibling branch, but instead of going back to the previous 
// branching-off point, we are going back to the one before that.
const cousinBranchColor = 'orange'



/* INIT */

let api: GPTAPI // Will be set to ChatGPT in browser and MessageLogAPI in NodeJS
const choices = { sequential: 0, childBranch: 1, siblingBranch: 2, cousinBranch: 3 }
const randomChoices: number[] = setupRandomChoices()

export async function branchingDemo() {

    const gpt = defaultChatGPTSetup()
    gpt.api = api
    await gpt.prompt('Pure functions for FooVendingMachine')

    let branch = await gpt.fork()
    branch.tagTheirs((x) => x.set('color', childBranchColor))

    for (const i in randomChoices) {
        await branch.promptFromTemplate('Follow-up, JavaScript - Functional programming')

        const choice = randomChoices[i]
        if (choice == choices.sequential) {
            branch.tagTheirs((x) => x.set('color', sequentialColor))
        }
        if (choice == choices.childBranch) {
            branch.tagTheirs((x) => x.set('color', childBranchColor))
            branch = await branch.fork()
        }
        if (choice == choices.siblingBranch) {
            branch.tagTheirs((x) => x.set('color', siblingBranchColor))
            branch = await branch.superthread!.fork()
        }
        if (choice == choices.cousinBranch) {
            branch.tagTheirs((x) => x.set('color', cousinBranchColor))
            // Prevent cousin branches from editing our initial prompt, since we'd otherwise lose
            // all context and ChatGPT won't understand what "follow-up" means.
            if (branch.superthread?.superthread) branch = await branch.superthread!.superthread!.fork()
            else branch = await branch.superthread!.fork()
        }
    }

    const messages = await search(gpt)
    const contents = messages.map((x) => x.content)
    const withoutInitialPrompt = contents.slice(1)

    let code: string
    if (isNodeJs) {
        // TODO: Code merging has some typescript dependencies, which need to be ironed out
        // in order to make it browser-compatible.
        code = new CodeBlockMerger().invoke(withoutInitialPrompt)
        console.log(`CODE:\n\n${code}\n\n\n`)
    }

    const flowchart = createFlowchart(messages, mermaidDiagramDirection)
    console.log(`FLOWCHART:\n\n${flowchart}\n\n\n`)

}



/* RUN */

if (isNodeJs) {
    api = new GPTMessageLogAPI()
    branchingDemo().then(() => {
        console.log("Done.")
    })
}
else {
    api = new ChatGPTAPI()
    // @ts-ignore
    document.getElementById("autoScript").addEventListener("click", () => {
        branchingDemo().then(() => {
            alert('Done. You may want to save the messageLog in console, for simulating API calls with no delay.')
        }).finally(async () => {
            // @ts-ignore
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
            // @ts-ignore
            await chrome.tabs.sendMessage(tabs[0].id, { action: "chatgptapi-messagelog" })
        })
    }
    )
}

function setupRandomChoices() {
    const numChoices = Object.keys(choices).length
    let randomChoices: number[] = []
    if (iterations > 0) for (let i = 0; i < iterations; i++) randomChoices.push(Math.floor(Math.random() * numChoices))
    else randomChoices = [3, 2, 1, 0, 3, 0, 1, 3, 0, 0, 1, 2, 1, 1, 0, 2, 2, 1, 0, 3, 1, 0, 3, 3, 2, 2, 3, 2, 3, 3]
    return randomChoices
}
