"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genericConfigureSearchBehavior = exports.configureSearchBehavior = exports.SearchScope = exports.ChatGPTMessageSearch = exports.GPTMessageSearch = void 0;
const GPTPlugin_1 = require("./GPTPlugin");
class GPTMessageSearch {
    constructor(haystacks) {
        this.haystacks = [];
        this.plugins = [];
        this.haystacks = !(haystacks) ? [] : Array.isArray(haystacks) ? haystacks : [haystacks];
    }
    disablePlugin(plugin) { this.plugins = this.plugins.filter(p => p !== plugin); }
    enablePlugin(plugin) { this.plugins.push(plugin); }
    all() {
        return this.byCallback((message) => { return true; });
    }
    byContent(searchTerm) {
        return this.byCallback((message) => { return message.content.includes(searchTerm); });
    }
    /*
    byRole(role: string): GPTMessage[] {
        return this.byCallback((message: GPTMessage) => { return message.metadata.role === role; })
    }

    byTag(tag: string): GPTMessage[] {
        return this.byCallback((message: GPTMessage) => { return message.metadata.tags.includes(tag); })
    }
    */
    byCallback(callback) {
        const initialSearchResults = this.searchInHaystacks(this.haystacks, callback);
        const potentialDuplicates = (initialSearchResults.length == 0) ? [] : initialSearchResults.reduce((prev, cur) => { return prev.concat(cur); }); // Remove duplicates
        let reply = new Map();
        for (let message of potentialDuplicates)
            reply.set(message.id, message);
        return Array.from(reply.values());
    }
    searchInHaystacks(haystacks, callback) {
        for (let plugin of this.plugins)
            if (plugin.reqCallback)
                plugin.reqCallback(haystacks);
        let results = haystacks.map((searchable) => {
            return searchable.getMessages().filter(callback);
        });
        for (let plugin of this.plugins)
            if (plugin.respCallback)
                plugin.respCallback(results);
        return results.filter(message => message !== undefined);
    }
}
exports.GPTMessageSearch = GPTMessageSearch;
class genericMessageSearch {
    constructor(haystacks) {
        this.haystacks = [];
        this.plugins = [];
        this.haystacks = !haystacks ? [] : Array.isArray(haystacks) ? haystacks : [haystacks];
    }
    disablePlugin(plugin) {
        this.plugins = this.plugins.filter(p => p !== plugin);
    }
    enablePlugin(plugin) {
        this.plugins.push(plugin);
    }
    all() {
        return this.byCallback(() => true);
    }
    byContent(searchTerm) {
        return this.byCallback(message => message.content.includes(searchTerm));
    }
    byCallback(callback) {
        const initialSearchResults = this.searchInHaystacks(this.haystacks, callback);
        const reply = new Map(initialSearchResults.flatMap(result => result).map(message => [message.id, message]));
        return Array.from(reply.values());
    }
    searchInHaystacks(haystacks, callback) {
        this.plugins.forEach(plugin => { var _a; return (_a = plugin.reqCallback) === null || _a === void 0 ? void 0 : _a.call(plugin, haystacks); });
        const results = haystacks.map(searchable => searchable.getMessages().filter(callback));
        this.plugins.forEach(plugin => { var _a; return (_a = plugin.respCallback) === null || _a === void 0 ? void 0 : _a.call(plugin, results); });
        return results.filter(message => message !== undefined);
    }
}
exports.ChatGPTMessageSearch = (genericMessageSearch);
/**
* By default, Search works by going through the chat history of each thread,
* from the start of the converastion up to that point.
* This can lead to unexpected results, since forked subchats (which are not messages) are not included in the list.
* (If you forked off the main context before sending a message, you may have been wondering why the thread was empty)
* Included here is an example of how to use the plugin system to change the way search works.
* @param messageSearch The Search instance you want to modify.
*/
var SearchScope;
(function (SearchScope) {
    SearchScope[SearchScope["Parents"] = 0] = "Parents";
    SearchScope[SearchScope["Children"] = 1] = "Children";
    SearchScope[SearchScope["Siblings"] = 2] = "Siblings";
    SearchScope[SearchScope["Genealogy"] = 3] = "Genealogy";
})(SearchScope = exports.SearchScope || (exports.SearchScope = {}));
function configureSearchBehavior(messageSearch, scope = SearchScope.Parents) {
    //@myLog()
    function searchScope(scope) {
        let scopeCallback;
        switch (scope) {
            case SearchScope.Parents: return; // This is the default behavior.
            case SearchScope.Children:
                scopeCallback = searchScopeChildren;
                break;
            case SearchScope.Siblings:
                scopeCallback = searchScopeSiblings;
                break;
            case SearchScope.Genealogy:
                scopeCallback = searchScopeGenealogy;
                break;
        }
        messageSearch.enablePlugin(new GPTPlugin_1.GPTPlugin("Search scope", scopeCallback));
    }
    // @DedupeArgs
    const searchScopeChildren = (haystacks) => {
        const recurseAdd = (searchable, children) => {
            children.push(searchable);
            for (let subthread of searchable.subthreads) {
                recurseAdd(subthread, children);
            }
        };
        let children = [];
        for (const haystack of haystacks) {
            recurseAdd(haystack, children);
        }
        haystacks.push(...children);
    };
    // @DedupeArgs
    const searchScopeSiblings = (haystacks) => {
        let siblings = [];
        for (let haystack of haystacks) {
            const parent = haystack.superthread;
            if (parent) {
                siblings.push(...parent.subthreads);
            }
        }
        haystacks.push(...siblings);
    };
    const searchScopeGenealogy = (haystacks) => {
        for (const chat of haystacks) {
            let parent = chat.superthread;
            if (parent && !(haystacks.includes(parent))) {
                haystacks.push(parent);
            }
        }
        // for (let haystack of haystacks) { if (!haystack.superthread) { searchScopeSiblings([haystack]) } }
        for (let haystack of haystacks) {
            if (!haystack.superthread) {
                searchScopeSiblings([haystack]);
            }
        }
        searchScopeChildren(haystacks);
    };
    searchScope(scope);
    return messageSearch;
}
exports.configureSearchBehavior = configureSearchBehavior;
function genericConfigureSearchBehavior(messageSearch, scope = SearchScope.Parents) {
    const searchScopeChildren = (haystacks) => {
        const recurseAdd = (searchable, children) => {
            children.push(searchable);
            searchable.subthreads.forEach((subthread) => recurseAdd(subthread, children));
        };
        haystacks.push(...haystacks.flatMap((haystack) => {
            const children = [];
            recurseAdd(haystack, children);
            return children;
        }));
    };
    const searchScopeSiblings = (haystacks) => {
        haystacks.push(...haystacks.flatMap((haystack) => haystack.superthread ? haystack.superthread.subthreads : []));
    };
    const searchScopeGenealogy = (haystacks) => {
        haystacks.push(...haystacks.filter((chat) => chat.superthread && !haystacks.includes(chat.superthread)).map((chat) => chat.superthread));
        haystacks.forEach((haystack) => !haystack.superthread && searchScopeSiblings([haystack]));
        searchScopeChildren(haystacks);
    };
    const searchScopes = [
        searchScopeChildren,
        searchScopeSiblings,
        searchScopeGenealogy,
    ];
    if (searchScopes[scope])
        messageSearch.enablePlugin(new GPTPlugin_1.GPTPlugin("Search scope", searchScopes[scope]));
    return messageSearch;
}
exports.genericConfigureSearchBehavior = genericConfigureSearchBehavior;
//# sourceMappingURL=configureSearchBehavior.js.map