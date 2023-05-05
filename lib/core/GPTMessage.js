"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.baseGPTMessage = exports.baseGPTInteraction = void 0;
const GPTTag_1 = require("./GPTTag");
/**
* Abstract class representing a GPT context.
*/
class baseGPTInteraction {
    constructor(gptReq, gptResp, reqMessage = new baseGPTMessage(gptReq), respMessage = new baseGPTMessage(gptResp, reqMessage)) {
        this.gptReq = gptReq;
        this.gptResp = gptResp;
        this.reqMessage = reqMessage;
        this.respMessage = respMessage;
    }
}
exports.baseGPTInteraction = baseGPTInteraction;
;
class baseGPTMessage {
    // metadata: GPTMetadata<T>; // <T> = new GPTMetadata<T>();
    constructor(body, replyTo, content = body.content, originalContent = content, id = body.id) {
        this.body = body;
        this.replyTo = replyTo;
        this.content = content;
        this.originalContent = originalContent;
        this.id = id;
        this.replies = [];
        this.metadata = new GPTTag_1.GPTTag();
        replyTo === null || replyTo === void 0 ? void 0 : replyTo.replies.push(this);
    }
    tag(key, value) {
        this.metadata.set(key, value);
    }
    setReplyTo(message) { this.replyTo = message; }
}
exports.baseGPTMessage = baseGPTMessage;
//# sourceMappingURL=GPTMessage.js.map