// @ts-nocheck
import { GPTMessage } from "./GPTMessage";
import { GPTContext } from "./GPTContext";

/*
function ChatThread(thread: string) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args: any[]) {
            const response = await originalMethod.apply(this, args);
            // const chatSession = get chat session object from context or parameters;
            chatSession.currentThread = thread;
            return response;
        };
    };
}
*/
// MermaidStyle and MermaidConfig interfaces
interface MermaidStyle {
    condition: (message: GPTMessage) => boolean;
    style: string;
}
export interface MermaidConfig {
    formatter: MermaidFormatter;
    styles: MermaidStyle[];
}
// MermaidFormatter interface and implementations
interface MermaidFormatter {
    formatMessage(message: GPTMessage, appliedStyles: string): string;
}
export class MermaidSequenceFormatter implements MermaidFormatter {
    formatMessage(message: GPTMessage, appliedStyles: string): string {
        // Format the message as a sequence diagram node
        // (Replace this with your specific implementation)
        // return `${message.id} ${appliedStyles} ${message.content.replace('\n', ' ').slice(0, 15)}`;
        return `${message.id}`;
    }
}
class MermaidFlowchartFormatter implements MermaidFormatter {
    formatMessage(message: GPTMessage, appliedStyles: string): string {
        // Format the message as a flowchart node
        // (Replace this with your specific implementation)
        // return `${message.id}(${message.content.replace('\n', ' ').slice(0, 15)})${appliedStyles}`;
        return `${message.id}`;
    }
}
// MermaidDiagramBuilder class
export class MermaidDiagramBuilder {
    private config: MermaidConfig;

    constructor(config: MermaidConfig) {
        this.config = config;
    }

    public generateMermaidCode(context: GPTContext): string {
        // Initialize Mermaid code
        // let mermaidCode = '';
        // Process the GPTContext and its subthreads
        const mermaidCode: string[] = ['flowchart TD'];
        this.processContext(context, this.firstGraphName(0), 0, mermaidCode);

        return mermaidCode.join('\n');
    }



    private processContext(context: GPTContext, superthreadName: string, id: number, mermaidCodeArray: string[]) {
        const threadName = this.nextGraphName(superthreadName, id);
        if (context.subthreads.length == 0) { // TODO: // Messages are repeated for every subthread due to the way the system works. I might keep it, I might not, but for now, this means we can only process the messages at the deepest level of subthreads.
            mermaidCodeArray.push(this.createMermaidNode({ id: `subgraph ${threadName}`, content: '' } as GPTMessage));
            let nodes: string[] = [];
            for (let message of context.getMessages()) {
                nodes.push(this.createMermaidNode(message));
            }
            if (nodes.length > 0) mermaidCodeArray.push(nodes.join(' -->\n'));
        }
        // Process each subthread
        let i = 0;
        for (let subthread of context.subthreads) {
            i++;
            this.processContext(subthread, threadName, i, mermaidCodeArray);
        }
        if (context.subthreads.length == 0) {
            mermaidCodeArray.push(this.createMermaidNode({ id: `end`, content: '' } as GPTMessage));
        }
        i = 0;
        for (let subthread of context.subthreads) {
            i++;
            const subgraphName = this.nextGraphName(threadName, i);
            mermaidCodeArray.push(this.createMermaidNode({ id: `${threadName} --> ${subgraphName}`, content: '' } as GPTMessage));
        }
    }

    private nextGraphName(graphName: string, index: number): string {
        return `${graphName}.${index}`;
    }

    private firstGraphName(subthreadIndex: number) {
        return `subgraph${subthreadIndex}`;
    }

    private createMermaidNode(message: GPTMessage): string {

        // Apply styles based on the message and the list of Mermaid styles
        const appliedStyles = this.config.styles
            .filter((style) => style.condition(message))
            .map((style) => style.style)
            .join(';');

        return this.config.formatter.formatMessage(message, appliedStyles);
    }
}


