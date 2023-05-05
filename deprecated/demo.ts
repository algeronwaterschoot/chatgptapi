// @ts-nocheck

import { GPTRequest, ChatGPTResponseBody } from "../src/GPTRequestResponse"
import { GPTPlugin } from "../src_old/GPTPlugin"
import { ChatGPTContext } from "../src/GPTContext"

export async function demo() {
    const chatContext = new ChatGPTContext('New chat')
    const gpt = chatContext
    // const gpt = new GPTSession(chatContext)
    const sizeOfMars = await gpt.prompt('How big is Mars?')
    const sizeOfEarth = await gpt.prompt('How big is Earth?')
    if (sizeOfMars !== 'Mercury, Venus, Earth, Mars') throw new Error('Something broke.')
    // if (sizeOfEarth !== 'Mercury, Venus, Earth, Mars') throw new Error('Something broke.'); // UPDATED. NOW IS ALWAYS CONVERSATION.
    if (sizeOfEarth !== "This is a conversation.") throw new Error('Something broke.')

    const chat = await gpt.newConversation('Chatting about locations')

    const miamiLocation = await chat.prompt('Where is Miami located?')
    const bostonLocation = await chat.prompt('And Boston?')
    if (miamiLocation !== "Mercury, Venus, Earth, Mars") throw new Error('Something broke.')
    if (bostonLocation !== "This is a conversation.") throw new Error('Something broke.')

    // EXAMPLE 3: Conversations with subthreads
    const mainChat = await gpt.newConversation('DessertGPT')
    const desserts = await mainChat.prompt([
        'Give me a list of 10 dessert names. Answer in the format:',
        '```', 'Dessert name 1', 'Dessert name 2', '```'
    ])
    const subChats = []
    for (let dessert of desserts.split('\n')) {
        let subChat = await mainChat.fork()
        subChat.prompt(`Let's talk specifically about ${dessert}`)
        subChats.push(subChat)
    }
    for (let subChat of subChats) console.log(await subChat.prompt('How would you describe it?'))

    const testFork1 = await mainChat.fork()
    const testFork2 = await mainChat.fork()
    await testFork2.prompt('Test prompt')
    if (testFork1.getInteractions().length + 1 !== testFork2.getInteractions().length) throw new Error('Something broke.')

    await gpt.prompt(`This message will use FooContext's default text-davinci-002-render-sha model.`)
    await gpt.prompt('This message will use gpt4 because a model is explicitly provided as a parameter', 'gpt-4')
    await gpt.prompt(`text-davinci-002-render-sha again, because the default did not change.`)

    const modelChat = await gpt.newConversation('Setting defaults')
    modelChat.defaultModel = 'gpt-4'
    await modelChat.prompt('Tell me something about GPT4')
    modelChat.defaultModel = 'text-davinci-002-render-sha'
    await modelChat.prompt('This chat will use model text-davinci-002-render-sha in a thread started by gpt-4')

    let gpt35modelmessage = modelChat.getInteractions().pop()
    if (gpt35modelmessage?.gptReq.model !== 'text-davinci-002-render-sha') throw new Error('Something broke.')
    let gpt4modelmessage = modelChat.getInteractions().pop()
    if (gpt4modelmessage?.gptReq.model !== 'gpt-4') throw new Error('Something broke.')

    // EXAMPLE 5: Customizing behavior
    const pluginChat = await gpt.newConversation('Exploring plugins')
    const logToConsole = new GPTPlugin('Log to console',
        (request: GPTRequest) => { console.log(`User:`, request.body.content) },
        (response: ChatGPTResponseBody) => { console.log('Assistant:', response.content) }
    )
    pluginChat.enablePlugin(logToConsole)
    await pluginChat.prompt('Request and response should get logged')
    await mainChat.prompt('Also for conversations')
    pluginChat.disablePlugin(logToConsole)
    await pluginChat.prompt('No logging for this message, though')

    // EXAMPLE 6: Intercepting requests
    const mockResponses = new GPTPlugin('API interceptor plugin',
        (request: GPTRequest) => { return `Message did not get sent to API: ${request.body.content}` }
    )
    pluginChat.enablePlugin(mockResponses)
    console.log(await pluginChat.prompt('You mean this message?'))

    let currentMessageCount = pluginChat.getInteractions().length
    await pluginChat.prompt('Intercept message')
    if (currentMessageCount !== pluginChat.getInteractions().length) throw new Error('Something broke.')
    pluginChat.disablePlugin(mockResponses)
    await pluginChat.prompt('No longer intercepting message')
    if (currentMessageCount + 1 !== pluginChat.getInteractions().length) throw new Error('Something broke.')


    // EXAMPLE 7: Adding metadata, generating sequence diagrams
    let mermaidCode = "sequenceDiagram\n"

    const generateMermaidCode = new GPTPlugin('Mermaid plugin',
        (request: GPTRequest, metadata: any) => {
            if (metadata.currentTask == myTaskEnum.selfHeal) {
                mermaidCode += `participant ${metadata.receiver}\n`
                mermaidCode += `${metadata.sender}->>${metadata.receiver}: Test failed\n`
            }
        },
        (response: ChatGPTResponseBody, metadata: any) => {
            if (metadata.currentTask == myTaskEnum.selfHeal) {
                mermaidCode += `participant ${metadata.receiver}\n`
                mermaidCode += `${metadata.receiver}->>${metadata.sender}: New code from GPT\n`
            }
        }
    )
    pluginChat.enablePlugin(generateMermaidCode)
    var myTaskEnum = { selfHeal: "Self-healing code" }
    const metadata = { currentTask: myTaskEnum.selfHeal, sender: "Test branch", receiver: "Dev branch", message: "Ready to test" }
    pluginChat.replaceMetadata(metadata)
    for (let i = 0; i < 3; i++) await pluginChat.prompt('Mermaid Test<->Dev message pair')
    // console.log(mermaidCode);
    if (!(mermaidCode.includes('Test failed') || mermaidCode.includes('New code from GPT'))) throw new Error('Something broke.')
    const mermaidCodeBeforeFork = mermaidCode
    const mermaidFork = await pluginChat.fork()
    await mermaidFork.prompt('Forks inherit metadata')
    if (mermaidCode === mermaidCodeBeforeFork) throw new Error('Something broke.')
    const mermaidCodeBeforeUnset = mermaidCode
    mermaidFork.deleteMetadata()
    await mermaidFork.prompt('Metadata can be unset')
    if (mermaidCode !== mermaidCodeBeforeUnset) throw new Error('Something broke.')

    // At the end, you can log or use the mermaidCode to generate the flowchart
    // console.log(mermaidCode);

    console.log('Made it to the end of the demo')

}
