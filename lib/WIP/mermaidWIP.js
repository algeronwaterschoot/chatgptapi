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
exports.mermaidWIP = void 0;
const GPTSearch_1 = require("../core/GPTSearch");
const GPTMermaid_1 = require("../core/GPTMermaid");
const defaultChatGPTSetup_1 = require("./defaultChatGPTSetup");
function mermaidWIP() {
    return __awaiter(this, void 0, void 0, function* () {
        const gpt = defaultChatGPTSetup_1.gptCopyForDevelopment;
        let search = yield (yield (0, GPTSearch_1.configureSearch)(new GPTSearch_1.ChatGPTMessageSearch(gpt), GPTSearch_1.SearchScope.Genealogy)).all();
        let flatMessageLog = search.map((x) => `${x.body.role}: ${x.content}`);
        const messages = search;
        messages.sort((a, b) => { var _a, _b; return ((_a = a.body.sequence) !== null && _a !== void 0 ? _a : 0) - ((_b = b.body.sequence) !== null && _b !== void 0 ? _b : 0); });
        const flowchartDiagramContent = (0, GPTMermaid_1.createFlowchart)(messages);
        console.log(flowchartDiagramContent);
    });
}
exports.mermaidWIP = mermaidWIP;
//# sourceMappingURL=mermaidWIP.js.map