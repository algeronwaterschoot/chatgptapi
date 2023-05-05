"use strict";
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
exports.ChatGPTRequest = exports.ChatGPTResponseBody = exports.ChatGPTRequestBody = void 0;
const flowchat_workspace_1 = require("./flowchat.workspace");
class ChatGPTRequestBody {
    constructor(content, model, parentId, conversationId) {
        this.content = content;
        this.model = model;
        this.parentId = parentId;
        this.conversationId = conversationId;
        this.id = (0, flowchat_workspace_1.UUID)();
        this.action = "next";
        this.role = "user";
        this.endpoint = "https://api.foo.com";
        this.timezone_offset_min = -120;
    }
}
exports.ChatGPTRequestBody = ChatGPTRequestBody;
class ChatGPTResponseBody {
    constructor(id, parentId, conversationId, parts) {
        this.id = id;
        this.parentId = parentId;
        this.conversationId = conversationId;
        this.parts = parts;
        this.role = "assistant";
        this.content = this.parts[this.parts.length - 1];
        this.body = this.content;
    }
}
exports.ChatGPTResponseBody = ChatGPTResponseBody;
class ChatGPTRequest {
    constructor(body, headers, id = body.id) {
        this.body = body;
        this.headers = headers;
        this.id = id;
    }
    static make(prompt, model, parentId = (0, flowchat_workspace_1.UUID)(), conversationId) {
        return __awaiter(this, void 0, void 0, function* () {
            const body = new ChatGPTRequestBody(prompt, model, parentId, conversationId);
            const headers = new ChatGPTRequestHeaders();
            return new ChatGPTRequest(body, headers);
        });
    }
}
exports.ChatGPTRequest = ChatGPTRequest;
class ChatGPTRequestHeaders {
} // TODO: Currently uses a different implementation.
//# sourceMappingURL=ChatGPTRequest.js.map