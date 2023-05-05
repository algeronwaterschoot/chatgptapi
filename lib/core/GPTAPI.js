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
exports.GPTMessageLogAPI = exports.ChatGPTAPI = exports.GPTAPI = void 0;
const GPTRequestResponse_1 = require("./GPTRequestResponse");
const main_1 = require("../main");
const GPTSandbox_1 = require("./GPTSandbox");
const main_2 = require("../main");
class GPTAPI {
    requestModel() {
        return GPTRequestResponse_1.ChatGPTRequest;
    } // TODO
}
exports.GPTAPI = GPTAPI;
class ChatGPTAPI extends GPTAPI {
    fetch(req) {
        return __awaiter(this, void 0, void 0, function* () {
            if (GPTSandbox_1.isNodeJs)
                throw new Error("Browser only");
            //@ts-ignore
            var cookies = yield chrome.cookies.getAll({ domain: "chat.openai.com" });
            //@ts-ignore
            var tabs = yield chrome.tabs.query({ active: true, currentWindow: true });
            //@ts-ignore
            const resp = yield chrome.tabs.sendMessage(tabs[0].id, {
                action: "chatgptapi-message",
                cookies: cookies,
                message: req.body.content,
                chatId: req.body.id,
                parentChatId: req.body.parentId,
                conversationId: req.body.conversationId,
                model: req.body.model,
            });
            return new GPTRequestResponse_1.ChatGPTResponseBody(resp.chatId, resp.parentChatId, resp.conversationId, [resp.answer]);
        });
    }
}
exports.ChatGPTAPI = ChatGPTAPI;
var responseIndex = -1;
function getMockResponse(content, logs) {
    const responses = [];
    for (let i = responseIndex + 1; i < logs.length; i++) {
        try {
            if (logs[i].user.trim() == content.trim()) {
                responseIndex = i;
                return logs[i + 1].assistant;
            }
        }
        catch (err) { }
    }
    return "NO MORE MOCK REPLIES IN LOG";
}
class GPTMessageLogAPI extends GPTAPI {
    fetch(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const prompt = request.body.content;
            const reply = getMockResponse(prompt, this.messageLog);
            return new GPTRequestResponse_1.ChatGPTResponseBody((0, main_1.UUID)(), (0, main_1.UUID)(), (0, main_1.UUID)(), [reply]);
        });
    }
    constructor() {
        super();
        const rawData = main_2.fs.readFileSync("sample_data/logs/messages.log");
        const data = JSON.parse(rawData);
        this.messageLog = data["message log"];
    }
}
exports.GPTMessageLogAPI = GPTMessageLogAPI;
//# sourceMappingURL=GPTAPI.js.map