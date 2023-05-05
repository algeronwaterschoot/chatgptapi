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
exports.readEntireMessageLog = exports.ChatGPTMessage = exports.GPTInteraction = void 0;
const GPTMessage_1 = require("./GPTMessage");
const GPTPrompt_1 = require("./GPTPrompt");
class GPTInteraction extends GPTMessage_1.baseGPTInteraction {
}
exports.GPTInteraction = GPTInteraction;
class ChatGPTMessage extends GPTMessage_1.baseGPTMessage {
}
exports.ChatGPTMessage = ChatGPTMessage;
function readEntireMessageLog(messages = []) {
    return __awaiter(this, void 0, void 0, function* () {
        const jsonLoader = new GPTPrompt_1.JsonLoader();
        let messageLog = yield jsonLoader.load("sample_data/logs/messages.log");
        // @ts-ignore
        for (let log of messageLog["message log"]) {
            messages.push(log.user ? log.user : log.assistant);
        }
        return messages;
    });
}
exports.readEntireMessageLog = readEntireMessageLog;
//# sourceMappingURL=GPTHelpers.js.map