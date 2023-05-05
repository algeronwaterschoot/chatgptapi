"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MermaidDiagramBuilder = exports.MermaidSequenceFormatter = void 0;
class MermaidSequenceFormatter {
    formatMessage(message, appliedStyles) {
        // Format the message as a sequence diagram node
        // (Replace this with your specific implementation)
        // return `${message.id} ${appliedStyles} ${message.content.replace('\n', ' ').slice(0, 15)}`;
        return `${message.id}`;
    }
}
exports.MermaidSequenceFormatter = MermaidSequenceFormatter;
class MermaidFlowchartFormatter {
    formatMessage(message, appliedStyles) {
        // Format the message as a flowchart node
        // (Replace this with your specific implementation)
        // return `${message.id}(${message.content.replace('\n', ' ').slice(0, 15)})${appliedStyles}`;
        return `${message.id}`;
    }
}
// MermaidDiagramBuilder class
class MermaidDiagramBuilder {
    constructor(config) {
        this.config = config;
    }
    generateMermaidCode(context) {
        // Initialize Mermaid code
        // let mermaidCode = '';
        // Process the GPTContext and its subthreads
        const mermaidCode = ['flowchart TD'];
        this.processContext(context, this.firstGraphName(0), 0, mermaidCode);
        return mermaidCode.join('\n');
    }
    processContext(context, superthreadName, id, mermaidCodeArray) {
        const threadName = this.nextGraphName(superthreadName, id);
        if (context.subthreads.length == 0) { // TODO: // Messages are repeated for every subthread due to the way the system works. I might keep it, I might not, but for now, this means we can only process the messages at the deepest level of subthreads.
            mermaidCodeArray.push(this.createMermaidNode({ id: `subgraph ${threadName}`, content: '' }));
            let nodes = [];
            for (let message of context.getMessages()) {
                nodes.push(this.createMermaidNode(message));
            }
            if (nodes.length > 0)
                mermaidCodeArray.push(nodes.join(' -->\n'));
        }
        // Process each subthread
        let i = 0;
        for (let subthread of context.subthreads) {
            i++;
            this.processContext(subthread, threadName, i, mermaidCodeArray);
        }
        if (context.subthreads.length == 0) {
            mermaidCodeArray.push(this.createMermaidNode({ id: `end`, content: '' }));
        }
        i = 0;
        for (let subthread of context.subthreads) {
            i++;
            const subgraphName = this.nextGraphName(threadName, i);
            mermaidCodeArray.push(this.createMermaidNode({ id: `${threadName} --> ${subgraphName}`, content: '' }));
        }
    }
    nextGraphName(graphName, index) {
        return `${graphName}.${index}`;
    }
    firstGraphName(subthreadIndex) {
        return `subgraph${subthreadIndex}`;
    }
    createMermaidNode(message) {
        // Apply styles based on the message and the list of Mermaid styles
        const appliedStyles = this.config.styles
            .filter((style) => style.condition(message))
            .map((style) => style.style)
            .join(';');
        return this.config.formatter.formatMessage(message, appliedStyles);
    }
}
exports.MermaidDiagramBuilder = MermaidDiagramBuilder;
//# sourceMappingURL=GPTMermaid.js.map