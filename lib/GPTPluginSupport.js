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
exports.GPTPlugin = exports.GPTPluginHandler = void 0;
/**
* Handles GPT plugins.
*/
class GPTPluginHandler {
    /**
    * @param ctx - The GPT context.
    */
    constructor(ctx) {
        this.ctx = ctx;
    }
    /**
    * Call the response callback for all plugins.
    * @param resp - The GPT response body.
    * @param meta - Metadata object.
    */
    pluginResp(resp, meta) {
        return __awaiter(this, void 0, void 0, function* () {
            this.ctx.plugins.forEach(plugin => { var _a; return (_a = plugin.respCallback) === null || _a === void 0 ? void 0 : _a.call(plugin, resp, meta); });
        });
    }
    /**
    * Call the request callback for all plugins.
    * @param req - The GPT request.
    * @param meta - Metadata object.
    */
    pluginReq(req, meta) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            for (const plugin of this.ctx.plugins) {
                const answer = (_a = plugin.reqCallback) === null || _a === void 0 ? void 0 : _a.call(plugin, req, meta);
                if (answer !== undefined)
                    return answer;
            }
        });
    }
    /**
    * Disable a plugin.
    * @param plugin - The plugin to disable.
    */
    disablePlugin(plugin) { this.ctx.plugins = this.ctx.plugins.filter(p => p !== plugin); }
    /**
    * Enable a plugin.
    * @param plugin - The plugin to enable.
    */
    enablePlugin(plugin) { this.ctx.plugins.push(plugin); }
}
exports.GPTPluginHandler = GPTPluginHandler;
class GPTPlugin {
    constructor(id, 
    // TODO: Figure out what the correct TypeScript syntax is for callbacks.
    // requestCallback: (request: GPTRequest) => void | string,
    // responseCallback: (response: GPTResponseBody) => {},
    // requestCallback:  {(request: GPTRequest): string | void},
    // responseCallback: {(response: GPTResponseBody): string}
    reqCallback, respCallback) {
        this.id = id;
        this.reqCallback = reqCallback;
        this.respCallback = respCallback;
    }
}
exports.GPTPlugin = GPTPlugin;
//# sourceMappingURL=GPTPluginSupport.js.map