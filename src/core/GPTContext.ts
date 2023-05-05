import { GPTRequest, ChatGPTResponseBody } from "./GPTRequestResponse"
import { GPTAPI } from "./GPTAPI"
import { debugQuickFixes } from "./debugQuickFixes"
import { GPTSearchable } from "./GPTSearch"
import { GPTMessage } from "./GPTMessage"
import { GPTInteraction } from "./GPTHelpers"
import { GPTTag } from "./GPTTag"
import { GPTPlugin, After, Before } from "./GPTPlugin"
// import { isPromise } from "util/types"
import { BuiltPrompt, GPTPrompt } from "./GPTPrompt"
// @ts-ignore
import { prompts } from '../../sample_data/prompts' // TODO: Is this realistic? It's nice to have autocomplete on prompts, but it might b
// @ts-ignore
import { templates } from '../../sample_data/templates'
// import { GPTProcess } from "../main"

export abstract class GPTContext implements GPTSearchable {

    private async handle(p: string, model: string) {
        const req = await this.getReq(p, model)
        const resp = await this.getResp(req)
        this.addInteraction(new GPTInteraction(req.body, resp))
        return resp.content
    }
    protected messages: GPTMessage[] = [];
    private interactions: GPTInteraction[] = [];
    superthread: GPTContext | null = null;
    subthreads: GPTContext[] = [];
    addInteraction(interaction: GPTInteraction) {
        /**
         * MAJOR TODO: The IDs are a complete mess due to the way Mock APIs handle IDs differently.
         * We have to assume this won't just be for mocks, but also when caching comes into play.
         * This needs better tests and maybe even a rethink of how it's done.
         * Why not just keep entity relationships hidden until it gets requested? Then we can just
         * go through the entire thread list and map relationships that way. */
        const debugQuickFix = true
        /** In the meantime, I'm keeping this workaround in place. */
        const firstMessageInThisThread = this.messages.length === 0
        const isSubThread = this.superthread
        let replyTo = null
        if (isSubThread) {
            const lastMessageFromSuperthread = isSubThread.interactions.slice(-1)[0]
            if (lastMessageFromSuperthread && lastMessageFromSuperthread !== undefined) {
                /*
                const ParentIdDoesNotMatch = lastMessageFromSuperthread.respMessage.id !== interaction.gptReq.parentId
                if (ParentIdDoesNotMatch) {
                    // throw new Error("Either a mock or a bug."); // Best keep around for tests.
                }
                */
                replyTo = firstMessageInThisThread ? lastMessageFromSuperthread.respMessage : this.getMessages().slice(-1)[0]
            }
        }
        else { if (!firstMessageInThisThread) { replyTo = this.getMessages().slice(-1)[0] } }
        // else it's the first message in the first thread, so it isn't a reply to anything.
        if (replyTo) {
            replyTo.replies.push(interaction.reqMessage)
            interaction.reqMessage.setReplyTo(replyTo)
        }
        if (!firstMessageInThisThread) {
            const messageIsAlreadyInMessageList = interaction.reqMessage.id == this.messages[this.messages.length - 1].id
            if (messageIsAlreadyInMessageList) {
                throw new Error('Is this ever reached?')
            }
            else {
                interaction.reqMessage.replyTo = this.messages[this.messages.length - 1]
                this.messages[this.messages.length - 1].replies.push(interaction.reqMessage)
                //this.interactions.at(-1)?.respMessage.replies.push
            }
        }
        this.messages.push(interaction.reqMessage, interaction.respMessage); this.interactions.push(interaction)
        if (debugQuickFix) debugQuickFixes.rebuildEntityRelationships(this)
    }
    getInteractions() { return this.interactions }
    // protected metadata: any;
    // copyMetadata() { return JSON.parse(JSON.stringify(this.metadata)); }
    // addToMetadata(key: any, value: any) { let newMeta = this.copyMetadata(); newMeta[key] = value; this.metadata = newMeta; }
    // removeFromMetadata(key: any) { let newMeta = this.copyMetadata(); delete newMeta[key];; this.metadata = newMeta; }
    // replaceMetadata(newMetadata: any) { this.metadata = newMetadata; }
    // deleteMetadata() { this.replaceMetadata({}); }

    tagOurs(
        callback: (sentMeta: GPTTag, sentMsg: GPTMessage) => void) {
        let lastInteraction = this.interactions.slice(-1)[0]
        callback(lastInteraction.reqMessage.metadata, lastInteraction.reqMessage)
    }

    tagTheirs(
        callback: (receivedMeta: GPTTag, receivedMsg: GPTMessage) => void) {
        let lastInteraction = this.interactions.slice(-1)[0]
        callback(lastInteraction.respMessage.metadata, lastInteraction.respMessage)
    }

    /**
    * @param title - The title of the context.
    */
    constructor(public title: string) { }
    getMessages(): GPTMessage[] { return this.messages }

    /**
    * Create a new conversation with the given title.
    * @param title - The title of the new conversation.
    */
    async newConversation(title: string) {
        let preClone = await this.blankClone() // TODO: These values will not be correct
        preClone.title = title
        preClone.api = this.api
        this.subthreads.push(preClone)
        preClone.superthread = this // TODO: What do we do with this guy's parent? It's a new conversation so we can't really give it an existing parent.

        return preClone
    }

    abstract defaultModel: string
    api!: GPTAPI

    /**
    * Send a text message to the GPT model.
    * @param prompt - The message to send.
    * @param model - The GPT model to use.
    */
    async send(prompt: string | string[] | Promise<string>, model = this.defaultModel): Promise<string> {
        // if (isPromise(prompt)) prompt = await prompt // TODO
        prompt = await prompt
        const p = Array.isArray(prompt) ? prompt.join('\n') : prompt
        return await this.handle(p as string, model)
    }

    /**
    * Similar to send(), but takes the ID of a saved prompt or template.
    * @param Id - The ID of the prompt or template.
    * @param model - The GPT model to use.
    */
    async prompt<T = keyof typeof prompts>(Id: T, replacements: {} = {}, model = this.defaultModel): Promise<GPTMessage> {
        return await this._prompt<T>(Id, replacements, model)
    }

    async promptFromTemplate<T = keyof typeof templates>(Id: T, replacements: {} = {}, model = this.defaultModel): Promise<GPTMessage> {
        return await this._prompt<T>(Id, replacements, model)
    }

    private async _prompt<T = keyof typeof prompts | keyof typeof templates>(Id: T, replacements: {}, model: string) {
        const builtPrompt: BuiltPrompt = await GPTPrompt(Id as string, replacements)
        await this.send(builtPrompt.content, model)
        this.tagOurs((x) => { builtPrompt.senderMetadata?.forEach((v, k) => { x.set(k, v) }) })
        this.tagTheirs((x) => { builtPrompt.receiverMetadata?.forEach((v, k) => { x.set(k, v) }) })
        return this.getLastInteraction().respMessage
    }

    /**
    * Get the request object for a prompt.
    * @param prompt - The prompt.
    * @param model - The GPT model to use.
    */
    @After()
    @Before()
    private async getReq(prompt: string, model: string) {
        const args = this.getInteractions().length ? [
            this.getLastInteraction().gptResp.id,
            this.getLastInteraction().gptResp.conversationId,
        ] : []
        const reqModel = this.api.requestModel()
        const make = await reqModel.make(prompt, model, ...args)
        return make
    }

    getLastInteraction() {
        return this.getInteractions().slice(-1)[0]
    }

    getLastMessage() {
        return this.getLastInteraction().respMessage
    }

    /**
    *
    * Get the response from the GPT API.
    * @param request - The GPT request.
    */
    @After()
    @Before()
    private async getResp(request: GPTRequest): Promise<ChatGPTResponseBody> { return await this.api.fetch(request) }

    /**
    * Create a new context by forking the current one.
    */
    async fork() {
        // TODO: Add title and send Mermaid message
        const clone = await this.blankClone()
        clone.interactions = [...this.interactions]
        // clone.replaceMetadata(this.metadata);
        GPTPlugin.copyInstanceBefores(this, clone)
        GPTPlugin.copyInstanceAfters(this, clone)
        clone.api = this.api
        clone.defaultModel = this.defaultModel
        clone.messages = [...this.messages]
        clone.superthread = this
        this.subthreads.push(clone)
        return clone
    }

    /**
    * Create a blank clone of the context.
    */
    protected abstract blankClone(): Promise<GPTContext>
}

/**
* An example subclass of GPTContext.
*/
export class ChatGPTContext extends GPTContext {
    defaultModel = 'text-davinci-002-render-sha';
    api!: GPTAPI
    /**
    * Create a blank clone of the ChatGPTContext.
    */
    protected async blankClone() {
        const newClone = new ChatGPTContext(this.title)
        // newClone.superthread = this; // TODO: This should be on the constructor
        // this.subthreads.push(newClone)
        return newClone
    }
}
