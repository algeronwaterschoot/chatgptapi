import { GPTMessage } from "./GPTMessage"
import { ChatGPTMessage } from "./GPTHelpers"
import { ChatGPTContext, GPTContext } from "./GPTContext"
import { GPTPlugin, After, Before } from "./GPTPlugin"

export interface GPTSearchable {
    subthreads: GPTSearchable[]
    superthread: GPTSearchable | null
    getMessages(): GPTMessage[]
}

class MessageSearch<TSearch extends GPTSearchable, TMessage extends GPTMessage> {
    haystacks: TSearch[] = [];

    constructor(haystacks?: TSearch | TSearch[]) {
        this.haystacks = !haystacks ? [] : Array.isArray(haystacks) ? haystacks : [haystacks]
    }

    async all() {
        return this.byCallback(() => true)
    }

    async byContent(searchTerm: string): Promise<TMessage[]> {
        return this.byCallback(message => message.content.includes(searchTerm))
    }

    async byCallback(callback: (message: TMessage) => {}) {
        const initialSearchResults = await this.searchInHaystacks(this.haystacks, callback)
        const reply = new Map(initialSearchResults.flatMap(result => result).map(message => [message.id, message]))
        return Array.from(reply.values())
    }

    @After()
    @Before()
    private async searchInHaystacks(haystacks: TSearch[], callback: (message: any) => {}) {
        const results = haystacks.map(searchable => searchable.getMessages().filter(callback) as unknown as TMessage[])
        return results.filter(message => message !== undefined)
    }
}
export class GPTMessageSearch extends MessageSearch<GPTContext, GPTMessage> { }
export class ChatGPTMessageSearch extends MessageSearch<ChatGPTContext, ChatGPTMessage> { }
/**
* By default, Search works by going through the chat history of each thread,
* from the start of the converastion up to that point.
* This can lead to unexpected results, since forked subchats (which are not messages) are not included in the list.
* (If you forked off the main context before sending a message, you may have been wondering why the thread was empty)
* Included here is an example of how to use the plugin system to change the way search works.
* @param messageSearch The Search instance you want to modify.
*/
export enum SearchScope { Parents, Children, Siblings, Genealogy }
// type SearchBehavior<T extends GPTSearchable> = (haystacks: T[]) => void;

export async function configureSearch<TMessage extends GPTMessage>(
    messageSearch: MessageSearch<GPTSearchable, TMessage>,
    scope: SearchScope = SearchScope.Parents
) {

    /**
     * Before
     */
    const searchScopeChildren = async (haystacks: GPTSearchable[], ...args: any) => {
        const recurseAdd = (searchable: GPTSearchable, children: GPTSearchable[]) => {
            children.push(searchable)
            searchable.subthreads.forEach((subthread) => recurseAdd(subthread, children))
            return [haystacks, ...args]
        }

        haystacks.push(...haystacks.flatMap((haystack) => {
            const children: GPTSearchable[] = []
            recurseAdd(haystack, children)
            return children
        }))
    }

    /**
     * Before
     */
    const searchScopeSiblings = async (haystacks: GPTSearchable[], ...args: any) => {
        haystacks.push(...haystacks.flatMap(
            (haystack) => haystack.superthread ? haystack.superthread.subthreads : []
        ))
        return [haystacks, ...args]
    }

    /**
     * Before
     */
    const searchScopeGenealogy = async (haystacks: GPTSearchable[], ...args: any) => {
        haystacks.push(...haystacks.filter(
            (chat) => chat.superthread && !haystacks.includes(chat.superthread)
        ).map((chat) => chat.superthread as GPTSearchable))
        haystacks.forEach((haystack) => !haystack.superthread && searchScopeSiblings([haystack], ...args))
        searchScopeChildren(haystacks, ...args)
        return [haystacks, ...args]
    }

    const searchScopes = [
        () => { },
        searchScopeChildren,
        searchScopeSiblings,
        searchScopeGenealogy,
    ]
    if (searchScopes[scope])
        GPTPlugin.add(messageSearch, 'searchInHaystacks', 'Before', searchScopes[scope])

    return messageSearch
}

export async function search<TMessage extends ChatGPTMessage, TSearchable extends GPTSearchable>(
    branch: TSearchable,
    filter: (message: TMessage) => {} = (message: TMessage) => true
) {
    const messageSearch = new MessageSearch<TSearchable, TMessage>(branch)
    const scope: SearchScope = SearchScope.Children
    let searchResults = await (await configureSearch(messageSearch, scope)).byCallback(filter)
    searchResults.sort((a, b) => (a.body.sequence ?? 0) - (b.body.sequence ?? 0))
    return searchResults
}
