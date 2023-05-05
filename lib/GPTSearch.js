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
exports.configureSearch = exports.SearchScope = exports.ChatGPTMessageSearch = exports.GPTMessageSearch = void 0;
const FlowchatPlugin_1 = require("./FlowchatPlugin");
class MessageSearch {
    constructor(haystacks) {
        this.haystacks = [];
        this.haystacks = !haystacks ? [] : Array.isArray(haystacks) ? haystacks : [haystacks];
    }
    all() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.byCallback(() => true);
        });
    }
    byContent(searchTerm) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.byCallback(message => message.content.includes(searchTerm));
        });
    }
    byCallback(callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const initialSearchResults = yield this.searchInHaystacks(this.haystacks, callback);
            const reply = new Map(initialSearchResults.flatMap(result => result).map(message => [message.id, message]));
            return Array.from(reply.values());
        });
    }
    searchInHaystacks(haystacks, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const results = haystacks.map(searchable => searchable.getMessages().filter(callback));
            return results.filter(message => message !== undefined);
        });
    }
}
__decorate([
    (0, FlowchatPlugin_1.Postprocess)(),
    (0, FlowchatPlugin_1.Preprocess)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Function]),
    __metadata("design:returntype", Promise)
], MessageSearch.prototype, "searchInHaystacks", null);
class GPTMessageSearch extends MessageSearch {
}
exports.GPTMessageSearch = GPTMessageSearch;
class ChatGPTMessageSearch extends MessageSearch {
}
exports.ChatGPTMessageSearch = ChatGPTMessageSearch;
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
// type SearchBehavior<T extends GPTSearchable> = (haystacks: T[]) => void;
function configureSearch(messageSearch, scope = SearchScope.Parents) {
    return __awaiter(this, void 0, void 0, function* () {
        /**
         * Before
         */
        const searchScopeChildren = (haystacks, ...args) => __awaiter(this, void 0, void 0, function* () {
            const recurseAdd = (searchable, children) => {
                children.push(searchable);
                searchable.subthreads.forEach((subthread) => recurseAdd(subthread, children));
                return [haystacks, ...args];
            };
            haystacks.push(...haystacks.flatMap((haystack) => {
                const children = [];
                recurseAdd(haystack, children);
                return children;
            }));
        });
        /**
         * Before
         */
        const searchScopeSiblings = (haystacks, ...args) => __awaiter(this, void 0, void 0, function* () {
            haystacks.push(...haystacks.flatMap((haystack) => haystack.superthread ? haystack.superthread.subthreads : []));
            return [haystacks, ...args];
        });
        /**
         * Before
         */
        const searchScopeGenealogy = (haystacks, ...args) => __awaiter(this, void 0, void 0, function* () {
            haystacks.push(...haystacks.filter((chat) => chat.superthread && !haystacks.includes(chat.superthread)).map((chat) => chat.superthread));
            haystacks.forEach((haystack) => !haystack.superthread && searchScopeSiblings([haystack], ...args));
            searchScopeChildren(haystacks, ...args);
            return [haystacks, ...args];
        });
        const searchScopes = [
            () => { },
            searchScopeChildren,
            searchScopeSiblings,
            searchScopeGenealogy,
        ];
        if (searchScopes[scope])
            FlowchatPlugin_1.FlowchatPlugin.addInstanceBefore(messageSearch, 'searchInHaystacks', searchScopes[scope]);
        return messageSearch;
    });
}
exports.configureSearch = configureSearch;
//# sourceMappingURL=GPTSearch.js.map