// @ts-nocheck
import { GPTRequest, ChatGPTResponseBody } from "./GPTRequestResponse"
import { GPTContext } from "./GPTContext"

export interface GPTPluginSupport {
    plugins: GPTPlugin[]
    enablePlugin(plugin: GPTPlugin): void
    disablePlugin(plugin: GPTPlugin): void
}
/**
* Handles GPT plugins.
*/
export class GPTPluginHandler {
    /**
    * @param ctx - The GPT context.
    */
    constructor(private ctx: GPTContext) { }

    /**
    * Call the response callback for all plugins.
    * @param resp - The GPT response body.
    * @param meta - Metadata object.
    */
    async pluginResp(resp: ChatGPTResponseBody, meta: Object) {
        this.ctx.plugins.forEach(plugin => plugin.respCallback?.(resp, meta))
    }

    /**
    * Call the request callback for all plugins.
    * @param req - The GPT request.
    * @param meta - Metadata object.
    */
    async pluginReq(req: GPTRequest, meta: Object) {
        for (const plugin of this.ctx.plugins) {
            const answer = plugin.reqCallback?.(req, meta)
            if (answer !== undefined) return answer
        }
    }

    /**
    * Disable a plugin.
    * @param plugin - The plugin to disable.
    */
    disablePlugin(plugin: GPTPlugin) { this.ctx.plugins = this.ctx.plugins.filter(p => p !== plugin) }

    /**
    * Enable a plugin.
    * @param plugin - The plugin to enable.
    */
    enablePlugin(plugin: GPTPlugin) { this.ctx.plugins.push(plugin) }
}
export class GPTPlugin {
    constructor(
        public id: string,
        // TODO: Figure out what the correct TypeScript syntax is for callbacks.
        // requestCallback: (request: GPTRequest) => void | string,
        // responseCallback: (response: GPTResponseBody) => {},
        // requestCallback:  {(request: GPTRequest): string | void},
        // responseCallback: {(response: GPTResponseBody): string}
        public reqCallback?: Function,
        public respCallback?: Function
    ) { }
}

/*
// type newGPTPluginPreprocessor = {(request: GPTRequest): string | void}

interface newGPTPlugin {
    name: string
    preprocess: Function
    postprocess: Function
}

type aNewGPTPlugin<T1, T2> = {
    name: string
    preprocess: (request: T1, metadata?: any) => boolean
    postprocess: (response: T2, metadata?: any) => void
}

\/*
type newGPTContextPlugin = newGPTPlugin & {
    preprocess: (request: GPTRequest) => boolean
    postprocess: (request: GPTRequest) => void
}
*\/

function logger = aNew
type InterruptibleProcessor<T> = (data: T, ...args: any) => boolean

*/
