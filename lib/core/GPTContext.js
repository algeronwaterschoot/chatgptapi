"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
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
exports.ChatGPTContext = exports.GPTContext = void 0;
const debugQuickFixes_1 = require("./debugQuickFixes");
const GPTHelpers_1 = require("./GPTHelpers");
const GPTPlugin_1 = require("./GPTPlugin");
// import { isPromise } from "util/types"
const GPTPrompt_1 = require("./GPTPrompt");
// import { GPTProcess } from "../main"
class GPTContext {
    handle(p, model) {
        return __awaiter(this, void 0, void 0, function* () {
            const req = yield this.getReq(p, model);
            const resp = yield this.getResp(req);
            this.addInteraction(new GPTHelpers_1.GPTInteraction(req.body, resp));
            return resp.content;
        });
    }
    addInteraction(interaction) {
        /**
         * MAJOR TODO: The IDs are a complete mess due to the way Mock APIs handle IDs differently.
         * We have to assume this won't just be for mocks, but also when caching comes into play.
         * This needs better tests and maybe even a rethink of how it's done.
         * Why not just keep entity relationships hidden until it gets requested? Then we can just
         * go through the entire thread list and map relationships that way. */
        const debugQuickFix = true;
        /** In the meantime, I'm keeping this workaround in place. */
        const firstMessageInThisThread = this.messages.length === 0;
        const isSubThread = this.superthread;
        let replyTo = null;
        if (isSubThread) {
            const lastMessageFromSuperthread = isSubThread.interactions.slice(-1)[0];
            if (lastMessageFromSuperthread && lastMessageFromSuperthread !== undefined) {
                /*
                const ParentIdDoesNotMatch = lastMessageFromSuperthread.respMessage.id !== interaction.gptReq.parentId
                if (ParentIdDoesNotMatch) {
                    // throw new Error("Either a mock or a bug."); // Best keep around for tests.
                }
                */
                replyTo = firstMessageInThisThread ? lastMessageFromSuperthread.respMessage : this.getMessages().slice(-1)[0];
            }
        }
        else {
            if (!firstMessageInThisThread) {
                replyTo = this.getMessages().slice(-1)[0];
            }
        }
        // else it's the first message in the first thread, so it isn't a reply to anything.
        if (replyTo) {
            replyTo.replies.push(interaction.reqMessage);
            interaction.reqMessage.setReplyTo(replyTo);
        }
        if (!firstMessageInThisThread) {
            const messageIsAlreadyInMessageList = interaction.reqMessage.id == this.messages[this.messages.length - 1].id;
            if (messageIsAlreadyInMessageList) {
                throw new Error('Is this ever reached?');
            }
            else {
                interaction.reqMessage.replyTo = this.messages[this.messages.length - 1];
                this.messages[this.messages.length - 1].replies.push(interaction.reqMessage);
                //this.interactions.at(-1)?.respMessage.replies.push
            }
        }
        this.messages.push(interaction.reqMessage, interaction.respMessage);
        this.interactions.push(interaction);
        if (debugQuickFix)
            debugQuickFixes_1.debugQuickFixes.rebuildEntityRelationships(this);
    }
    getInteractions() { return this.interactions; }
    // protected metadata: any;
    // copyMetadata() { return JSON.parse(JSON.stringify(this.metadata)); }
    // addToMetadata(key: any, value: any) { let newMeta = this.copyMetadata(); newMeta[key] = value; this.metadata = newMeta; }
    // removeFromMetadata(key: any) { let newMeta = this.copyMetadata(); delete newMeta[key];; this.metadata = newMeta; }
    // replaceMetadata(newMetadata: any) { this.metadata = newMetadata; }
    // deleteMetadata() { this.replaceMetadata({}); }
    tagOurs(callback) {
        let lastInteraction = this.interactions.slice(-1)[0];
        callback(lastInteraction.reqMessage.metadata, lastInteraction.reqMessage);
    }
    tagTheirs(callback) {
        let lastInteraction = this.interactions.slice(-1)[0];
        callback(lastInteraction.respMessage.metadata, lastInteraction.respMessage);
    }
    /**
    * @param title - The title of the context.
    */
    constructor(title) {
        this.title = title;
        this.messages = [];
        this.interactions = [];
        this.superthread = null;
        this.subthreads = [];
    }
    getMessages() { return this.messages; }
    /**
    * Create a new conversation with the given title.
    * @param title - The title of the new conversation.
    */
    newConversation(title) {
        return __awaiter(this, void 0, void 0, function* () {
            let preClone = yield this.blankClone(); // TODO: These values will not be correct
            preClone.title = title;
            preClone.api = this.api;
            this.subthreads.push(preClone);
            preClone.superthread = this; // TODO: What do we do with this guy's parent? It's a new conversation so we can't really give it an existing parent.
            return preClone;
        });
    }
    /**
    * Send a text message to the GPT model.
    * @param prompt - The message to send.
    * @param model - The GPT model to use.
    */
    send(prompt, model = this.defaultModel) {
        return __awaiter(this, void 0, void 0, function* () {
            // if (isPromise(prompt)) prompt = await prompt // TODO
            prompt = yield prompt;
            const p = Array.isArray(prompt) ? prompt.join('\n') : prompt;
            return yield this.handle(p, model);
        });
    }
    /**
    * Similar to send(), but takes the ID of a saved prompt or template.
    * @param Id - The ID of the prompt or template.
    * @param model - The GPT model to use.
    */
    prompt(Id, replacements = {}, model = this.defaultModel) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._prompt(Id, replacements, model);
        });
    }
    promptFromTemplate(Id, replacements = {}, model = this.defaultModel) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._prompt(Id, replacements, model);
        });
    }
    _prompt(Id, replacements, model) {
        return __awaiter(this, void 0, void 0, function* () {
            const builtPrompt = yield (0, GPTPrompt_1.GPTPrompt)(Id, replacements);
            yield this.send(builtPrompt.content, model);
            this.tagOurs((x) => { var _a; (_a = builtPrompt.senderMetadata) === null || _a === void 0 ? void 0 : _a.forEach((v, k) => { x.set(k, v); }); });
            this.tagTheirs((x) => { var _a; (_a = builtPrompt.receiverMetadata) === null || _a === void 0 ? void 0 : _a.forEach((v, k) => { x.set(k, v); }); });
            return this.getLastInteraction().respMessage;
        });
    }
    /**
    * Get the request object for a prompt.
    * @param prompt - The prompt.
    * @param model - The GPT model to use.
    */
    getReq(prompt, model) {
        return __awaiter(this, void 0, void 0, function* () {
            const args = this.getInteractions().length ? [
                this.getLastInteraction().gptResp.id,
                this.getLastInteraction().gptResp.conversationId,
            ] : [];
            const reqModel = this.api.requestModel();
            const make = yield reqModel.make(prompt, model, ...args);
            return make;
        });
    }
    getLastInteraction() {
        return this.getInteractions().slice(-1)[0];
    }
    getLastMessage() {
        return this.getLastInteraction().respMessage;
    }
    /**
    *
    * Get the response from the GPT API.
    * @param request - The GPT request.
    */
    getResp(request) {
        return __awaiter(this, void 0, void 0, function* () { return yield this.api.fetch(request); });
    }
    /**
    * Create a new context by forking the current one.
    */
    fork() {
        return __awaiter(this, void 0, void 0, function* () {
            // TODO: Add title and send Mermaid message
            const clone = yield this.blankClone();
            clone.interactions = [...this.interactions];
            // clone.replaceMetadata(this.metadata);
            GPTPlugin_1.GPTPlugin.copyInstanceBefores(this, clone);
            GPTPlugin_1.GPTPlugin.copyInstanceAfters(this, clone);
            clone.api = this.api;
            clone.defaultModel = this.defaultModel;
            clone.messages = [...this.messages];
            clone.superthread = this;
            this.subthreads.push(clone);
            return clone;
        });
    }
}
__decorate([
    (0, GPTPlugin_1.After)(),
    (0, GPTPlugin_1.Before)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], GPTContext.prototype, "getReq", null);
__decorate([
    (0, GPTPlugin_1.After)(),
    (0, GPTPlugin_1.Before)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GPTContext.prototype, "getResp", null);
exports.GPTContext = GPTContext;
/**
* An example subclass of GPTContext.
*/
class ChatGPTContext extends GPTContext {
    constructor() {
        super(...arguments);
        this.defaultModel = 'text-davinci-002-render-sha';
    }
    /**
    * Create a blank clone of the ChatGPTContext.
    */
    blankClone() {
        return __awaiter(this, void 0, void 0, function* () {
            const newClone = new ChatGPTContext(this.title);
            // newClone.superthread = this; // TODO: This should be on the constructor
            // this.subthreads.push(newClone)
            return newClone;
        });
    }
}
exports.ChatGPTContext = ChatGPTContext;
//# sourceMappingURL=GPTContext.js.map