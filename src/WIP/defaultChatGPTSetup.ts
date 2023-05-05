import { GPTPlugin } from "../core/GPTPlugin"
import { ChatGPTContext } from "../core/GPTContext"
import { GPTRequest, ChatGPTResponseBody } from "../core/GPTRequestResponse"


export var gptCopyForDevelopment: ChatGPTContext

export function defaultChatGPTSetup() {
    const gpt = new ChatGPTContext("New chat")
    // gpt.api = new ChatGPTAPI()
    gptCopyForDevelopment = gpt

    /*
      // Log to console
      FlowchatPlugin.addDefaultAfter(ChatGPTContext, 'getReq', (request: GPTRequest) => { console.log('User:', request.body.content) })
      FlowchatPlugin.addDefaultAfter(ChatGPTContext, 'getResp', (response: ChatGPTResponseBody) => { console.log('Assistant:', response.content) })
      // gpt.deleteMetadata();
      */
    // Track sequential order of messages
    let sequence = 0
    GPTPlugin.add(ChatGPTContext, "getReq", 'After',
        (request: GPTRequest) => { request.body.sequence = ++sequence }
    )
    GPTPlugin.add(ChatGPTContext, "getResp", 'After',
        (response: ChatGPTResponseBody) => { response.sequence = ++sequence }
    )
    return gpt
}
