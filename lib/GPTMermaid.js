"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeMermaid = exports.SequenceDiagramConverter = exports.GitgraphDiagramConverter = exports.FlowchartDiagramConverter = exports.DiagramConverterFactory = void 0;
// mermaidAPI.
class DiagramConverterFactory {
    create(diagramType) {
        switch (diagramType) {
            case 'sequence':
                return new SequenceDiagramConverter();
            case 'flowchart':
                return new FlowchartDiagramConverter();
            case 'gitgraph':
                return new GitgraphDiagramConverter();
            default:
                throw new Error(`Invalid diagram type: ${diagramType}`);
        }
    }
}
exports.DiagramConverterFactory = DiagramConverterFactory;
class FlowchartDiagramConverter {
    convert(messages, before, getNodeStyle, getEdgeStyle, customFormat, options) {
        const title = 'Flowchart Diagram';
        if (before) {
            messages = messages.map(before);
        }
        const content = this.generateFlowchartDiagramContent(messages, getNodeStyle, getEdgeStyle, customFormat, options);
        return {
            type: 'flowchart',
            title,
            content,
        };
    }
    generateFlowchartDiagramContent(messages, getNodeStyle, getEdgeStyle, customFormat, options) {
        let content = 'graph';
        if (options === null || options === void 0 ? void 0 : options.direction) {
            content += ` ${options.direction}`;
        }
        content += '\n';
        messages.forEach((message) => {
            const customStyle = customFormat ? customFormat(message, 'flowchart', content) : [];
            if (customStyle.length > 0) {
                content += customStyle.join('\n') + '\n';
            }
            else {
                content = this.defaultBehavior(getNodeStyle, message, getEdgeStyle, content);
            }
        });
        return content.trim();
    }
    defaultBehavior(getNodeStyle, message, getEdgeStyle, content) {
        const nodeStyle = getNodeStyle ? getNodeStyle(message) : {};
        const edgeStyle = message.replyTo && getEdgeStyle ? getEdgeStyle(message) : {};
        content += `    ${message.id}${nodeStyle.shape || ''}("${message.content}")`;
        if (nodeStyle.color || nodeStyle.textColor) {
            content += `[${nodeStyle.textColor ? nodeStyle.textColor + ' ' : ''}${nodeStyle.color ? 'fill:' + nodeStyle.color : ''}]`;
        }
        content += '\n';
        if (message.replyTo) {
            content += `    ${message.replyTo.id}-->`;
            if (edgeStyle.style || edgeStyle.color) {
                content += `|${edgeStyle.label || ''}|`;
            }
            content += `${message.id}`;
            if (edgeStyle.style || edgeStyle.color) {
                content += `[${edgeStyle.style ? edgeStyle.style + ' ' : ''}${edgeStyle.color ? 'stroke:' + edgeStyle.color : ''}]`;
            }
            content += '\n';
        }
        return content;
    }
}
exports.FlowchartDiagramConverter = FlowchartDiagramConverter;
class GitgraphDiagramConverter {
    convert(messages, before) {
        const title = 'Gitgraph Diagram';
        if (before) {
            messages = messages.map(before);
        }
        const content = this.generateGitgraphDiagramContent(messages);
        return {
            type: 'gitgraph',
            title,
            content,
        };
    }
    generateGitgraphDiagramContent(messages) {
        let content = 'gitGraph:\n';
        messages.forEach((message, index) => {
            content += `    commit${index}["${message.content}"]\n`;
            if (message.replyTo) {
                const parentIndex = messages.findIndex((m) => { var _a; return m.id === ((_a = message === null || message === void 0 ? void 0 : message.replyTo) === null || _a === void 0 ? void 0 : _a.id); });
                content += `    commit${parentIndex}-->commit${index}\n`;
            }
        });
        return content;
    }
}
exports.GitgraphDiagramConverter = GitgraphDiagramConverter;
class SequenceDiagramConverter {
    convert(messages, before) {
        const title = 'Sequence Diagram';
        if (before) {
            messages = messages.map(before);
        }
        const content = this.generateSequenceDiagramContent(messages);
        return {
            type: 'sequence',
            title,
            content,
        };
    }
    generateSequenceDiagramContent(messages) {
        let content = 'sequenceDiagram\n';
        const participants = new Set();
        messages.forEach((message) => {
            participants.add(message.id);
            if (message.replyTo) {
                participants.add(message.replyTo.id);
                content += `    ${message.replyTo.id}->>${message.id}: ${message.content}\n`;
            }
        });
        participants.forEach((participant) => {
            content = `participant ${participant}\n` + content;
        });
        return content;
    }
}
exports.SequenceDiagramConverter = SequenceDiagramConverter;
function sanitizeMermaid(diagram) {
    for (let invalidchar of [`"`, `"`, `'`, '{', '}', `(`, `)`, `[`, `]`]) {
        // @ts-ignore
        diagram = diagram.replaceAll(invalidchar, '');
    }
    return diagram;
}
exports.sanitizeMermaid = sanitizeMermaid;
//# sourceMappingURL=GPTMermaid.js.map