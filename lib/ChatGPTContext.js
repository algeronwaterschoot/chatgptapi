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
exports.ChatGPTContext = exports.GPTContext = void 0;
const GPTAPI_1 = require("./GPTAPI");
const GPTMessage_1 = require("./GPTMessage");
const GPTPlugin_1 = require("./GPTPlugin");
const flowchat_workspace_1 = require("./flowchat.workspace");
/**
* Abstract class representing a GPT context.
*/
class GPTContext {
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
            flowchat_workspace_1.debugQuickFixes.rebuildEntityRelationships(this);
    }
    getInteractions() { return this.interactions; }
    copyMetadata() { return JSON.parse(JSON.stringify(this.metadata)); }
    addToMetadata(key, value) { let newMeta = this.copyMetadata(); newMeta[key] = value; this.metadata = newMeta; }
    removeFromMetadata(key) { let newMeta = this.copyMetadata(); delete newMeta[key]; ; this.metadata = newMeta; }
    replaceMetadata(newMetadata) { this.metadata = newMetadata; }
    deleteMetadata() { this.replaceMetadata({}); }
    /**
    * @param title - The title of the context.
    */
    constructor(title) {
        this.title = title;
        this.messages = [];
        this.interactions = [];
        this.superthread = null;
        this.subthreads = [];
        this.plugins = [];
        this.pluginHandler = new GPTPlugin_1.GPTPluginHandler(this);
    }
    getMessages() { return this.messages; }
    /**
    * Enable a plugin.
    * @param plugin - The plugin to enable.
    */
    enablePlugin(plugin) { this.pluginHandler.enablePlugin(plugin); }
    /**
    * Disable a plugin.
    * @param plugin - The plugin to disable.
    */
    disablePlugin(plugin) { this.pluginHandler.disablePlugin(plugin); }
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
    * Send a prompt to the GPT model.
    * @param prompt - The prompt to send.
    * @param model - The GPT model to use.
    */
    prompt(prompt, model = this.defaultModel) {
        return __awaiter(this, void 0, void 0, function* () {
            const p = Array.isArray(prompt) ? prompt.join('\n') : prompt;
            return yield this.handle(p, model);
        });
    }
    handle(p, model) {
        return __awaiter(this, void 0, void 0, function* () {
            const req = yield this.getReq(p, model);
            let answer = yield this.pluginHandler.pluginReq(req, this.metadata);
            const requestWasNotHandledByPlugin = answer === undefined;
            if (requestWasNotHandledByPlugin) {
                const resp = yield this.getResp(req);
                yield this.pluginHandler.pluginResp(resp, this.metadata);
                this.addInteraction(new GPTMessage_1.genericGPTInteraction(req.body, resp));
                return resp.content;
            }
            return answer;
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
                this.getInteractions().slice(-1)[0].gptResp.id,
                this.getInteractions().slice(-1)[0].gptResp.conversationId,
            ] : [];
            return yield this.api.requestModel().make(prompt, model, ...args);
        });
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
            clone.replaceMetadata(this.metadata);
            clone.plugins = this.plugins.slice();
            clone.api = this.api;
            clone.defaultModel = this.defaultModel;
            clone.messages = [...this.messages];
            clone.superthread = this;
            this.subthreads.push(clone);
            return clone;
        });
    }
}
exports.GPTContext = GPTContext;
/**
* An example subclass of GPTContext.
*/
class ChatGPTContext extends GPTContext {
    constructor() {
        super(...arguments);
        this.defaultModel = 'text-davinci-002-render-sha';
        this.api = new GPTAPI_1.MockGPTAPI();
    }
    // api = new JSONMockGPTAPI()
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
//# sourceMappingURL=ChatGPTContext.js.map