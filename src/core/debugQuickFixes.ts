import { ChatGPTRequestBody } from "./GPTRequestResponse"
import { GPTMessage, baseGPTMessage } from "./GPTMessage"
import { GPTContext } from "./GPTContext"
import { configureSearch, GPTMessageSearch, SearchScope } from "./GPTSearch"


export const debugQuickFixes = {
    rebuildEntityRelationships: async (searchable: GPTContext) => {
        const search = await configureSearch(new GPTMessageSearch(searchable), SearchScope.Genealogy)
        // const search = configureSearchBehavior(new GPTMessageSearch(searchable), SearchScope.Genealogy);
        const genealogy = await search.byContent('')

        if (genealogy.length === 0) return

        genealogy.forEach(msg => msg.replies = [])

        const chatGPTReplies = await search.byCallback((msg: GPTMessage | baseGPTMessage<ChatGPTRequestBody>) => msg?.body.role == 'assistant')

        chatGPTReplies.forEach(reply => reply.replyTo?.replies.push(reply))

        const messagesById = new Map(genealogy.map(msg => [msg.id, msg]))
        const messagesByParentId = new Map(genealogy.map(msg => [msg.replyTo?.id, msg]))

        for (const [id, msg] of messagesById) {
            if (messagesByParentId.has(id)) {
                const childMessage: baseGPTMessage<ChatGPTRequestBody> = messagesByParentId.get(id) as baseGPTMessage<ChatGPTRequestBody>
                msg.replies.push(childMessage)
                childMessage.replyTo = msg
            }
        }
    }
}
