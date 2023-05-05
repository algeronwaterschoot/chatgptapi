// import { GPTPlugin } from "../core/GPTPlugin"
// import { IGPTMessage } from "../core/GPTMessage"

// class GPTDefaultFormatters {
//     asCodeBlocks() {
//         console.log('mould')
//     }
// }
// export interface GPTMessage extends GPTDefaultFormatters { }
// GPTPlugin.extend(GPTMessage, [GPTDefaultFormatters])


// export abstract class GPTProcess {
//     static abstract process(message)
//     static asCodeBlocks<T extends GPTMessage>(message: T): GPTMessage {
//         const codeBlocks = extractCodeBlocks(message.content)
//         message.tag('Format as code blocks', codeBlocks.length)
//         message.content = codeBlocks
//         return message
//     }
// }
