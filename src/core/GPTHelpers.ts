import { ChatGPTRequestBody, ChatGPTResponseBody, GPTRequestBody, GPTResponseBody } from "./GPTRequestResponse"
import { baseGPTInteraction, baseGPTMessage } from "./GPTMessage"
import { JsonLoader } from "./GPTPrompt"


export class GPTInteraction extends baseGPTInteraction<GPTRequestBody, GPTResponseBody> { }
export class ChatGPTMessage extends baseGPTMessage<ChatGPTRequestBody | ChatGPTResponseBody> { }

export async function readEntireMessageLog(messages: string[] = []) {
    const jsonLoader = new JsonLoader()
    let messageLog: string[] = await jsonLoader.load("sample_data/logs/messages.log")
    // @ts-ignore
    for (let log of messageLog["message log"]) {
        messages.push(log.user ? log.user : log.assistant)
    }
    return messages
}