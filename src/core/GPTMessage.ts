import { GPTTag } from "./GPTTag"

/**
* Abstract class representing a GPT context.
*/
export class baseGPTInteraction<TRequestBody extends { content: string; id: string }, TResponseBody extends { content: string; id: string }> {
    constructor(
        readonly gptReq: TRequestBody,
        readonly gptResp: TResponseBody,
        public reqMessage = new baseGPTMessage<TRequestBody>(gptReq),
        public respMessage = new baseGPTMessage<TResponseBody>(gptResp, reqMessage)
    ) { }
};

/**
* An API-agnostic way to represent prompts and replies. Makes it easier to work within
* conversational paradigms for APIs that don't support it, to facilitate mixing multiple APIs
* in a unified way.
*/
export interface GPTMessage {
    // body: GPTRequest | GPTResponse; // TODO
    body: any
    replyTo?: GPTMessage
    replies: GPTMessage[]
    content: any
    originalContent: string
    id: string
    tag(key: string, value: any): void
}

export class baseGPTMessage<TBody extends { content: string; id: string }> implements GPTMessage {
    replies: GPTMessage[] = [];
    metadata: GPTTag = new GPTTag();
    // metadata: GPTMetadata<T>; // <T> = new GPTMetadata<T>();
    constructor(public body: TBody, public replyTo?: GPTMessage,
        public content: string = body.content,
        public originalContent: string = content,
        public id: string = body.id
    ) { replyTo?.replies.push(this) }
    tag(key: string, value: any): void {
        this.metadata.set(key, value)
    }
    setReplyTo(message: GPTMessage) { this.replyTo = message }

}

