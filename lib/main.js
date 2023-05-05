"use strict";
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
exports.branchingDemo = exports.typescript = exports.fs = exports.UUID = void 0;
/* IMPORTS */
const GPTSandbox_1 = require("./core/GPTSandbox");
const uuid_1 = require("uuid");
function UUID() { return GPTSandbox_1.isNodeJs ? (0, uuid_1.v4)() : crypto.randomUUID(); }
exports.UUID = UUID;
const GPTAPI_1 = require("./core/GPTAPI");
const defaultChatGPTSetup_1 = require("./WIP/defaultChatGPTSetup");
const CodeMerger_1 = require("./core/CodeMerger");
const GPTSearch_1 = require("./core/GPTSearch");
const GPTMermaid_1 = require("./core/GPTMermaid");
/* SETUP */
// IMPORTANT:
// Uncomment the "require" lines if you're in NodeJS, or the "{}" ones if you're in browser.    (TODO)
exports.fs = require("fs-extra");
exports.typescript = require("typescript");
// export const fs = {}
// export const typescript = {}
const iterations = 0; // set to 0 if you want to use a seeded list of 30 iterations
const mermaidDiagramDirection = 'TD';
// The following colors will be used in the final Mermaid flowchart. A colored node means that
// a new branch was created somewhere. Where, exactly, depends on one of 4 random outcomes:
// 0) SEQUENTIAL
// A sequential message is the default mode. Our next message will continue from the last reply we got from GPT.
const sequentialColor = 'wheat';
// 1) CHILD BRANCH
// A "child branch" means new prompts will branch off from the current reply. If there's only 1 branch,
// it might not look like anything special is happening compared to sequential messages,
//but it influences what happens when a "sibling" or "cousin" branch is created.
const childBranchColor = 'aqua';
// 2) SIBLING BRANCH
// A "sibling branch" means we return back to the reply where we branched off from, and create a
// new branch from there. In ChatGPT jargon, we are "editing" the message we sent after that reply.
const siblingBranchColor = 'chartreuse';
// 3) COUSIN BRANCH
// A "cousin branch" is similar to a sibling branch, but instead of going back to the previous 
// branching-off point, we are going back to the one before that.
const cousinBranchColor = 'orange';
/* INIT */
let api; // Will be set to ChatGPT in browser and MessageLogAPI in NodeJS
const choices = { sequential: 0, childBranch: 1, siblingBranch: 2, cousinBranch: 3 };
const randomChoices = setupRandomChoices();
function branchingDemo() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const gpt = (0, defaultChatGPTSetup_1.defaultChatGPTSetup)();
        gpt.api = api;
        yield gpt.prompt('Pure functions for FooVendingMachine');
        let branch = yield gpt.fork();
        branch.tagTheirs((x) => x.set('color', childBranchColor));
        for (const i in randomChoices) {
            yield branch.promptFromTemplate('Follow-up, JavaScript - Functional programming');
            const choice = randomChoices[i];
            if (choice == choices.sequential) {
                branch.tagTheirs((x) => x.set('color', sequentialColor));
            }
            if (choice == choices.childBranch) {
                branch.tagTheirs((x) => x.set('color', childBranchColor));
                branch = yield branch.fork();
            }
            if (choice == choices.siblingBranch) {
                branch.tagTheirs((x) => x.set('color', siblingBranchColor));
                branch = yield branch.superthread.fork();
            }
            if (choice == choices.cousinBranch) {
                branch.tagTheirs((x) => x.set('color', cousinBranchColor));
                // Prevent cousin branches from editing our initial prompt, since we'd otherwise lose
                // all context and ChatGPT won't understand what "follow-up" means.
                if ((_a = branch.superthread) === null || _a === void 0 ? void 0 : _a.superthread)
                    branch = yield branch.superthread.superthread.fork();
                else
                    branch = yield branch.superthread.fork();
            }
        }
        const messages = yield (0, GPTSearch_1.search)(gpt);
        const contents = messages.map((x) => x.content);
        const withoutInitialPrompt = contents.slice(1);
        let code;
        if (GPTSandbox_1.isNodeJs) {
            // TODO: Code merging has some typescript dependencies, which need to be ironed out
            // in order to make it browser-compatible.
            code = new CodeMerger_1.CodeBlockMerger().invoke(withoutInitialPrompt);
            console.log(`CODE:\n\n${code}\n\n\n`);
        }
        const flowchart = (0, GPTMermaid_1.createFlowchart)(messages, mermaidDiagramDirection);
        console.log(`FLOWCHART:\n\n${flowchart}\n\n\n`);
    });
}
exports.branchingDemo = branchingDemo;
/* RUN */
if (GPTSandbox_1.isNodeJs) {
    api = new GPTAPI_1.GPTMessageLogAPI();
    branchingDemo().then(() => {
        console.log("Done.");
    });
}
else {
    api = new GPTAPI_1.ChatGPTAPI();
    // @ts-ignore
    document.getElementById("autoScript").addEventListener("click", () => {
        branchingDemo().then(() => {
            alert('Done. You may want to save the messageLog in console, for simulating API calls with no delay.');
        }).finally(() => __awaiter(void 0, void 0, void 0, function* () {
            // @ts-ignore
            const tabs = yield chrome.tabs.query({ active: true, currentWindow: true });
            // @ts-ignore
            yield chrome.tabs.sendMessage(tabs[0].id, { action: "chatgptapi-messagelog" });
        }));
    });
}
function setupRandomChoices() {
    const numChoices = Object.keys(choices).length;
    let randomChoices = [];
    if (iterations > 0)
        for (let i = 0; i < iterations; i++)
            randomChoices.push(Math.floor(Math.random() * numChoices));
    else
        randomChoices = [3, 2, 1, 0, 3, 0, 1, 3, 0, 0, 1, 2, 1, 1, 0, 2, 2, 1, 0, 3, 1, 0, 3, 3, 2, 2, 3, 2, 3, 3];
    return randomChoices;
}
//# sourceMappingURL=main.js.map