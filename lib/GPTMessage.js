"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const GPTPlugin_1 = require("./core/GPTPlugin");
class GPTDefaultFormatters {
    asCodeBlocks() {
        console.log('mould');
    }
}
GPTPlugin_1.GPTPlugin.extend(GPTMessage, [GPTDefaultFormatters]);
//# sourceMappingURL=GPTMessage.js.map