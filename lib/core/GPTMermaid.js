"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFlowchart = exports.sanitizeMermaid = exports.SequenceDiagramConverter = exports.GitgraphDiagramConverter = exports.FlowchartDiagramConverter = exports.DiagramConverterFactory = void 0;
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
function createFlowchart(messages, direction = 'TD') {
    const customFormat = (message, type, partialDiagram) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        let output = [];
        switch (type) {
            case "flowchart":
                let id = `${message.id}`;
                // const yellow = "fill:#EEFFAA,stroke:#333,stroke-width:2px"
                // const white = "fill:#FFFFFF,stroke:#333,stroke-width:4px"
                const deprecatedGreen = "fill:#66FF66,stroke:#333,stroke-width:2px";
                const deprecatedRed = "fill:#FF4400,stroke:#333,stroke-width:4px";
                if (message.metadata.has("Error")) {
                    addToFlowchart(id, "fa:fa-bug", message.metadata.get("title"), message, output, deprecatedRed);
                    break;
                }
                const isUser = message.body.role == "user";
                let color = `fill:${(_b = (_a = message.metadata) === null || _a === void 0 ? void 0 : _a.get("color")) !== null && _b !== void 0 ? _b : (isUser ? 'white' : 'lightyellow')},stroke:#333,stroke-width:4px`;
                let icon = `${((_d = (_c = message.metadata) === null || _c === void 0 ? void 0 : _c.get("icon")) !== null && _d !== void 0 ? _d : isUser) ? "fa:fa-user" : "fa:fa-robot"}`;
                let body = `${(_h = (_f = (_e = message.metadata) === null || _e === void 0 ? void 0 : _e.get("title")) !== null && _f !== void 0 ? _f : (_g = message.metadata) === null || _g === void 0 ? void 0 : _g.get("caption")) !== null && _h !== void 0 ? _h : message.body.role}`;
                body = sanitizeMermaid(body);
                // Styling for certain types of metadata
                if ((_j = message.metadata) === null || _j === void 0 ? void 0 : _j.has("Reflect")) {
                    let reflect = message.metadata.get("Reflect");
                    if (reflect.wasCorrect) {
                        color = deprecatedGreen;
                    }
                    else {
                        color = deprecatedRed;
                    }
                }
                addToFlowchart(id, icon, body, message, output, color);
                // If reflect was wrong: Add a self-referential step to think of new answer
                if ((_k = message.metadata) === null || _k === void 0 ? void 0 : _k.has("Reflect")) {
                    let reflect = message.metadata.get("Reflect");
                    if (!reflect.wasCorrect) {
                        output.push(`${message.id}-.->R${message.id}(fa:fa-spinner Updates answer)`);
                        output.push(`R${message.id}-.->${message.id}`);
                        // output.push(`${message.id}-->${message.id}`)
                    }
                }
                /*
                        // Connnect nodes in sequential order
                        // Disabled for now because it really messes up flowcharts, and probably belongs on sequence diagrams.
                        if (previousId !== message.replyTo?.id) { output.push(`${previousId}-.->${message.id}`) }
                        previousId = message.id
                        */
                // TODO: Plugin system should preprocess & postprocess diagrams, so this logic can be moved there.
                // Right now this implementaiton will fail if nodes are hidden from view.
                // Processing on diagram also allows us to draw different shaped lines if nodes are hidden.
                /*
                        if (message.body.sequence ?? 0 < Math.max(...messages.map(message => message.body.sequence ?? 0))) { }
                        */
                break;
            case "gitgraph":
                break;
            case "sequence":
                break;
        }
        return output;
    };
    // Diagram layout options
    const options = { direction: direction, spacing: 40, padding: 20 };
    const diagramtype = "flowchart";
    // Create flowchart diagram
    const flowchartConverter = new DiagramConverterFactory().create(diagramtype);
    const flowchartDiagram = flowchartConverter.convert(messages, undefined, undefined, undefined, customFormat, options);
    const flowchartDiagramLength = flowchartDiagram.content.length;
    /*
    const expectedLength = 7896
    if (flowchartDiagramLength != expectedLength) throw new Error('Something broke')
    console.log('Flowchart test succeeded')
    */
    const flowchartDiagramContent = flowchartDiagram.content;
    return flowchartDiagramContent;
}
exports.createFlowchart = createFlowchart;
function addToFlowchart(id, icon, body, message, output, color) {
    var _a;
    let line = `${id}(${icon} ${body})`;
    // Connect replies to requests
    if (message.replyTo)
        line = `${(_a = message.replyTo) === null || _a === void 0 ? void 0 : _a.id}-->${line}`;
    output.push(line);
    addStyle(output, message, color);
}
function addStyle(output, message, orange) {
    output.push(`style ${message.id} ${orange}`);
}
//# sourceMappingURL=GPTMermaid.js.map