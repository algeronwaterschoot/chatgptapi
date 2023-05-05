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
exports.debugQuickFixes = void 0;
const GPTSearch_1 = require("./GPTSearch");
exports.debugQuickFixes = {
    rebuildEntityRelationships: (searchable) => __awaiter(void 0, void 0, void 0, function* () {
        const search = yield (0, GPTSearch_1.configureSearch)(new GPTSearch_1.GPTMessageSearch(searchable), GPTSearch_1.SearchScope.Genealogy);
        // const search = configureSearchBehavior(new GPTMessageSearch(searchable), SearchScope.Genealogy);
        const genealogy = yield search.byContent('');
        if (genealogy.length === 0)
            return;
        genealogy.forEach(msg => msg.replies = []);
        const chatGPTReplies = yield search.byCallback((msg) => (msg === null || msg === void 0 ? void 0 : msg.body.role) == 'assistant');
        chatGPTReplies.forEach(reply => { var _a; return (_a = reply.replyTo) === null || _a === void 0 ? void 0 : _a.replies.push(reply); });
        const messagesById = new Map(genealogy.map(msg => [msg.id, msg]));
        const messagesByParentId = new Map(genealogy.map(msg => { var _a; return [(_a = msg.replyTo) === null || _a === void 0 ? void 0 : _a.id, msg]; }));
        for (const [id, msg] of messagesById) {
            if (messagesByParentId.has(id)) {
                const childMessage = messagesByParentId.get(id);
                msg.replies.push(childMessage);
                childMessage.replyTo = msg;
            }
        }
    })
};
//# sourceMappingURL=debugQuickFixes.js.map