import { UUID } from "../main"


interface GPTEntity { readonly id: string }
export interface GPTRequest extends GPTEntity { readonly body: ChatGPTRequestBody }
export interface GPTRequestBody extends GPTEntity { readonly model: string; readonly conversationId?: string; readonly content: string; readonly parentId: string }
export interface GPTResponseBody extends GPTEntity { readonly conversationId: string; readonly content: string; sequence?: number }
export class ChatGPTRequestBody implements GPTRequestBody {
    readonly id = UUID();
    readonly action = "next";
    readonly role = "user";
    readonly endpoint = "https://api.foo.com";
    readonly timezone_offset_min = -120;
    sequence?: number | undefined

    constructor(
        readonly content: string,
        readonly model: string,
        readonly parentId: string,
        readonly conversationId?: string
    ) { }
}
export class ChatGPTResponseBody implements GPTResponseBody {
    readonly role = "assistant";
    readonly content: string = this.parts[this.parts.length - 1];
    readonly body = this.content;
    sequence?: number | undefined

    constructor(
        readonly id: string,
        readonly parentId: string,
        readonly conversationId: string,
        readonly parts: string[]
    ) { }
}
export class ChatGPTRequest implements GPTRequest {
    constructor(readonly body: ChatGPTRequestBody, readonly headers: ChatGPTRequestHeaders, readonly id: string = body.id) { }

    static async make(prompt: string, model: string, parentId: string = UUID(), conversationId?: string): Promise<ChatGPTRequest> {
        const body = new ChatGPTRequestBody(prompt, model, parentId, conversationId)
        const headers = new ChatGPTRequestHeaders()
        return new ChatGPTRequest(body, headers)
    }
}
class ChatGPTRequestHeaders { } // TODO: Currently uses a different implementation in ../content.js
