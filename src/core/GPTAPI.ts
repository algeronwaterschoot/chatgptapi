import { ChatGPTRequest, GPTRequest, ChatGPTResponseBody, } from "./GPTRequestResponse"
import { UUID } from "../main"
import { isNodeJs } from "./GPTSandbox"
import { fs } from '../main'
export abstract class GPTAPI {
    requestModel() {
        return ChatGPTRequest
    } // TODO
    abstract fetch(request: GPTRequest): Promise<ChatGPTResponseBody>
}

export class ChatGPTAPI extends GPTAPI {
    async fetch(req: GPTRequest): Promise<ChatGPTResponseBody> {
        if (isNodeJs) throw new Error("Browser only")
        //@ts-ignore
        var cookies = await chrome.cookies.getAll({ domain: "chat.openai.com" })
        //@ts-ignore
        var tabs = await chrome.tabs.query({ active: true, currentWindow: true })
        //@ts-ignore
        const resp = await chrome.tabs.sendMessage(tabs[0].id, {
            action: "chatgptapi-message",
            cookies: cookies,
            message: req.body.content,
            chatId: req.body.id,
            parentChatId: req.body.parentId,
            conversationId: req.body.conversationId,
            model: req.body.model,
        })
        return new ChatGPTResponseBody(resp.chatId, resp.parentChatId, resp.conversationId, [resp.answer])
    }
}

var responseIndex = -1
function getMockResponse(content: string, logs: string | any[]) {
    const responses = []
    for (let i = responseIndex + 1; i < logs.length; i++) {
        try {
            if (logs[i].user.trim() == content.trim()) {
                responseIndex = i
                return logs[i + 1].assistant
            }
        } catch (err) { }
    }
    return "NO MORE MOCK REPLIES IN LOG"
}

export class GPTMessageLogAPI extends GPTAPI {
    messageLog: any
    async fetch(request: GPTRequest): Promise<ChatGPTResponseBody> {
        const prompt = request.body.content
        const reply = getMockResponse(prompt, this.messageLog)
        return new ChatGPTResponseBody(UUID(), UUID(), UUID(), [reply])
    }

    constructor() {
        super()
        const rawData = fs.readFileSync("sample_data/logs/messages.log")
        const data = JSON.parse(rawData)
        this.messageLog = data["message log"]
    }
}
