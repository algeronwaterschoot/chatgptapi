"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultChatGPTSetup = exports.gptCopyForDevelopment = void 0;
const GPTPlugin_1 = require("../core/GPTPlugin");
const GPTContext_1 = require("../core/GPTContext");
function defaultChatGPTSetup() {
    const gpt = new GPTContext_1.ChatGPTContext("New chat");
    // gpt.api = new ChatGPTAPI()
    exports.gptCopyForDevelopment = gpt;
    /*
      // Log to console
      FlowchatPlugin.addDefaultAfter(ChatGPTContext, 'getReq', (request: GPTRequest) => { console.log('User:', request.body.content) })
      FlowchatPlugin.addDefaultAfter(ChatGPTContext, 'getResp', (response: ChatGPTResponseBody) => { console.log('Assistant:', response.content) })
      // gpt.deleteMetadata();
      */
    // Track sequential order of messages
    let sequence = 0;
    GPTPlugin_1.GPTPlugin.add(GPTContext_1.ChatGPTContext, "getReq", 'After', (request) => { request.body.sequence = ++sequence; });
    GPTPlugin_1.GPTPlugin.add(GPTContext_1.ChatGPTContext, "getResp", 'After', (response) => { response.sequence = ++sequence; });
    return gpt;
}
exports.defaultChatGPTSetup = defaultChatGPTSetup;
//# sourceMappingURL=defaultChatGPTSetup.js.map