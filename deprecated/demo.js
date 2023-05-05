"use strict";
// @ts-nocheck
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
exports.demo = void 0;
const GPTPlugin_1 = require("../src_old/GPTPlugin");
const GPTContext_1 = require("../src/GPTContext");
function demo() {
    return __awaiter(this, void 0, void 0, function* () {
        const chatContext = new GPTContext_1.ChatGPTContext('New chat');
        const gpt = chatContext;
        // const gpt = new GPTSession(chatContext)
        const sizeOfMars = yield gpt.prompt('How big is Mars?');
        const sizeOfEarth = yield gpt.prompt('How big is Earth?');
        if (sizeOfMars !== 'Mercury, Venus, Earth, Mars')
            throw new Error('Something broke.');
        // if (sizeOfEarth !== 'Mercury, Venus, Earth, Mars') throw new Error('Something broke.'); // UPDATED. NOW IS ALWAYS CONVERSATION.
        if (sizeOfEarth !== "This is a conversation.")
            throw new Error('Something broke.');
        const chat = yield gpt.newConversation('Chatting about locations');
        const miamiLocation = yield chat.prompt('Where is Miami located?');
        const bostonLocation = yield chat.prompt('And Boston?');
        if (miamiLocation !== "Mercury, Venus, Earth, Mars")
            throw new Error('Something broke.');
        if (bostonLocation !== "This is a conversation.")
            throw new Error('Something broke.');
        // EXAMPLE 3: Conversations with subthreads
        const mainChat = yield gpt.newConversation('DessertGPT');
        const desserts = yield mainChat.prompt([
            'Give me a list of 10 dessert names. Answer in the format:',
            '```', 'Dessert name 1', 'Dessert name 2', '```'
        ]);
        const subChats = [];
        for (let dessert of desserts.split('\n')) {
            let subChat = yield mainChat.fork();
            subChat.prompt(`Let's talk specifically about ${dessert}`);
            subChats.push(subChat);
        }
        for (let subChat of subChats)
            console.log(yield subChat.prompt('How would you describe it?'));
        const testFork1 = yield mainChat.fork();
        const testFork2 = yield mainChat.fork();
        yield testFork2.prompt('Test prompt');
        if (testFork1.getInteractions().length + 1 !== testFork2.getInteractions().length)
            throw new Error('Something broke.');
        yield gpt.prompt(`This message will use FooContext's default text-davinci-002-render-sha model.`);
        yield gpt.prompt('This message will use gpt4 because a model is explicitly provided as a parameter', 'gpt-4');
        yield gpt.prompt(`text-davinci-002-render-sha again, because the default did not change.`);
        const modelChat = yield gpt.newConversation('Setting defaults');
        modelChat.defaultModel = 'gpt-4';
        yield modelChat.prompt('Tell me something about GPT4');
        modelChat.defaultModel = 'text-davinci-002-render-sha';
        yield modelChat.prompt('This chat will use model text-davinci-002-render-sha in a thread started by gpt-4');
        let gpt35modelmessage = modelChat.getInteractions().pop();
        if ((gpt35modelmessage === null || gpt35modelmessage === void 0 ? void 0 : gpt35modelmessage.gptReq.model) !== 'text-davinci-002-render-sha')
            throw new Error('Something broke.');
        let gpt4modelmessage = modelChat.getInteractions().pop();
        if ((gpt4modelmessage === null || gpt4modelmessage === void 0 ? void 0 : gpt4modelmessage.gptReq.model) !== 'gpt-4')
            throw new Error('Something broke.');
        // EXAMPLE 5: Customizing behavior
        const pluginChat = yield gpt.newConversation('Exploring plugins');
        const logToConsole = new GPTPlugin_1.GPTPlugin('Log to console', (request) => { console.log(`User:`, request.body.content); }, (response) => { console.log('Assistant:', response.content); });
        pluginChat.enablePlugin(logToConsole);
        yield pluginChat.prompt('Request and response should get logged');
        yield mainChat.prompt('Also for conversations');
        pluginChat.disablePlugin(logToConsole);
        yield pluginChat.prompt('No logging for this message, though');
        // EXAMPLE 6: Intercepting requests
        const mockResponses = new GPTPlugin_1.GPTPlugin('API interceptor plugin', (request) => { return `Message did not get sent to API: ${request.body.content}`; });
        pluginChat.enablePlugin(mockResponses);
        console.log(yield pluginChat.prompt('You mean this message?'));
        let currentMessageCount = pluginChat.getInteractions().length;
        yield pluginChat.prompt('Intercept message');
        if (currentMessageCount !== pluginChat.getInteractions().length)
            throw new Error('Something broke.');
        pluginChat.disablePlugin(mockResponses);
        yield pluginChat.prompt('No longer intercepting message');
        if (currentMessageCount + 1 !== pluginChat.getInteractions().length)
            throw new Error('Something broke.');
        // EXAMPLE 7: Adding metadata, generating sequence diagrams
        let mermaidCode = "sequenceDiagram\n";
        const generateMermaidCode = new GPTPlugin_1.GPTPlugin('Mermaid plugin', (request, metadata) => {
            if (metadata.currentTask == myTaskEnum.selfHeal) {
                mermaidCode += `participant ${metadata.receiver}\n`;
                mermaidCode += `${metadata.sender}->>${metadata.receiver}: Test failed\n`;
            }
        }, (response, metadata) => {
            if (metadata.currentTask == myTaskEnum.selfHeal) {
                mermaidCode += `participant ${metadata.receiver}\n`;
                mermaidCode += `${metadata.receiver}->>${metadata.sender}: New code from GPT\n`;
            }
        });
        pluginChat.enablePlugin(generateMermaidCode);
        var myTaskEnum = { selfHeal: "Self-healing code" };
        const metadata = { currentTask: myTaskEnum.selfHeal, sender: "Test branch", receiver: "Dev branch", message: "Ready to test" };
        pluginChat.replaceMetadata(metadata);
        for (let i = 0; i < 3; i++)
            yield pluginChat.prompt('Mermaid Test<->Dev message pair');
        // console.log(mermaidCode);
        if (!(mermaidCode.includes('Test failed') || mermaidCode.includes('New code from GPT')))
            throw new Error('Something broke.');
        const mermaidCodeBeforeFork = mermaidCode;
        const mermaidFork = yield pluginChat.fork();
        yield mermaidFork.prompt('Forks inherit metadata');
        if (mermaidCode === mermaidCodeBeforeFork)
            throw new Error('Something broke.');
        const mermaidCodeBeforeUnset = mermaidCode;
        mermaidFork.deleteMetadata();
        yield mermaidFork.prompt('Metadata can be unset');
        if (mermaidCode !== mermaidCodeBeforeUnset)
            throw new Error('Something broke.');
        // At the end, you can log or use the mermaidCode to generate the flowchart
        // console.log(mermaidCode);
        console.log('Made it to the end of the demo');
    });
}
exports.demo = demo;
//# sourceMappingURL=demo.js.map