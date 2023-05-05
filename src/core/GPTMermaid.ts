import { ChatGPTMessage } from "./GPTHelpers"
import { GPTMessage } from "./GPTMessage"
import { GPTTagReflect } from "./GPTTag"

export interface MermaidDiagram {
    type: DiagramType
    title: string
    content: string
}

export type DiagramType = 'sequence' | 'flowchart' | 'gitgraph'


export interface NodeStyle {
    shape?: string
    color?: string
    textColor?: string
}

export interface EdgeStyle {
    style?: 'solid' | 'dashed' | 'dotted'
    color?: string
    label?: string
}

export type MermaidLine = string

export interface DiagramConverter<T extends GPTMessage> {
    convert(
        messages: T[],
        before?: (message: T) => T,
        getNodeStyle?: (message: T) => NodeStyle,
        getEdgeStyle?: (message: T) => EdgeStyle,
        customFormat?: (message: T, diagramType: DiagramType, diagramSoFar: string) => MermaidLine[],
        options?: any
    ): MermaidDiagram
}


export interface MermaidFormatter<T, TOptions> {
    format(component: T, options: TOptions, diagramSoFar: string): string
}

export type MermaidParticipant = {
    id?: string
    text?: string
    decorator?: {
        pre: string
        post: string
    }
}

export type MermaidLink = ''

export class DiagramConverterFactory<T extends GPTMessage> {
    create(diagramType: DiagramType): DiagramConverter<T> {
        switch (diagramType) {
            case 'sequence':
                return new SequenceDiagramConverter()
            case 'flowchart':
                return new FlowchartDiagramConverter()
            case 'gitgraph':
                return new GitgraphDiagramConverter()
            default:
                throw new Error(`Invalid diagram type: ${diagramType}`)
        }
    }
}



export class FlowchartDiagramConverter<T extends GPTMessage> implements DiagramConverter<T> {
    convert(
        messages: T[],
        before?: (message: T) => T,
        getNodeStyle?: (message: T) => NodeStyle,
        getEdgeStyle?: (message: T) => EdgeStyle,
        customFormat?: (message: T, diagramType: DiagramType, diagramSoFar: string) => MermaidLine[],
        options?: { direction?: string; spacing?: number; padding?: number }
    ): MermaidDiagram {
        const title = 'Flowchart Diagram'

        if (before) {
            messages = messages.map(before)
        }

        const content = this.generateFlowchartDiagramContent(messages, getNodeStyle, getEdgeStyle, customFormat, options)

        return {
            type: 'flowchart',
            title,
            content,
        }
    }

    private generateFlowchartDiagramContent(
        messages: T[],
        getNodeStyle?: (message: T) => NodeStyle,
        getEdgeStyle?: (message: T) => EdgeStyle,
        customFormat?: (message: T, diagramType: DiagramType, diagramSoFar: string) => MermaidLine[],
        options?: { direction?: string; spacing?: number; padding?: number }
    ): string {
        let content = 'graph'

        if (options?.direction) {
            content += ` ${options.direction}`
        }

        content += '\n'

        messages.forEach((message) => {
            const customStyle = customFormat ? customFormat(message, 'flowchart', content) : []
            if (customStyle.length > 0) {
                content += customStyle.join('\n') + '\n'
            }
            else {
                content = this.defaultBehavior(getNodeStyle, message, getEdgeStyle, content)
            }
        })

        return content.trim()
    }



    private defaultBehavior(getNodeStyle: ((message: T) => NodeStyle) | undefined, message: T, getEdgeStyle: ((message: T) => EdgeStyle) | undefined, content: string) {
        const nodeStyle = getNodeStyle ? getNodeStyle(message) : {}
        const edgeStyle = message.replyTo && getEdgeStyle ? getEdgeStyle(message) : {}

        content += `    ${message.id}${nodeStyle.shape || ''}("${message.content}")`

        if (nodeStyle.color || nodeStyle.textColor) {
            content += `[${nodeStyle.textColor ? nodeStyle.textColor + ' ' : ''}${nodeStyle.color ? 'fill:' + nodeStyle.color : ''}]`
        }

        content += '\n'

        if (message.replyTo) {
            content += `    ${message.replyTo.id}-->`

            if (edgeStyle.style || edgeStyle.color) {
                content += `|${edgeStyle.label || ''}|`
            }

            content += `${message.id}`

            if (edgeStyle.style || edgeStyle.color) {
                content += `[${edgeStyle.style ? edgeStyle.style + ' ' : ''}${edgeStyle.color ? 'stroke:' + edgeStyle.color : ''}]`
            }

            content += '\n'
        }
        return content
    }
}



export class GitgraphDiagramConverter<T extends GPTMessage> implements DiagramConverter<T> {
    convert(messages: T[], before?: (message: T) => T): MermaidDiagram {
        const title = 'Gitgraph Diagram'

        if (before) {
            messages = messages.map(before)
        }

        const content = this.generateGitgraphDiagramContent(messages)

        return {
            type: 'gitgraph',
            title,
            content,
        }
    }

    private generateGitgraphDiagramContent(messages: T[]): string {
        let content = 'gitGraph:\n'

        messages.forEach((message, index) => {
            content += `    commit${index}["${message.content}"]\n`
            if (message.replyTo) {
                const parentIndex = messages.findIndex((m) => m.id === message?.replyTo?.id)
                content += `    commit${parentIndex}-->commit${index}\n`
            }
        })

        return content
    }
}


export class SequenceDiagramConverter<T extends GPTMessage> implements DiagramConverter<T> {
    convert(messages: T[], before?: (message: T) => T): MermaidDiagram {
        const title = 'Sequence Diagram'

        if (before) {
            messages = messages.map(before)
        }

        const content = this.generateSequenceDiagramContent(messages)

        return {
            type: 'sequence',
            title,
            content,
        }
    }

    private generateSequenceDiagramContent(messages: T[]): string {
        let content = 'sequenceDiagram\n'
        const participants = new Set<string>()

        messages.forEach((message) => {
            participants.add(message.id)
            if (message.replyTo) {
                participants.add(message.replyTo.id)
                content += `    ${message.replyTo.id}->>${message.id}: ${message.content}\n`
            }
        })

        participants.forEach((participant) => {
            content = `participant ${participant}\n` + content
        })

        return content
    }
}



export function sanitizeMermaid(diagram: string) {
    for (let invalidchar of [`"`, `"`, `'`, '{', '}', `(`, `)`, `[`, `]`]) {
        // @ts-ignore
        diagram = diagram.replaceAll(invalidchar, '')
    }
    return diagram
}

export function createFlowchart<T extends ChatGPTMessage>(messages: T[], direction = 'TD') {
    const customFormat = (message: T, type: DiagramType, partialDiagram: string): MermaidLine[] => {
        let output: MermaidLine[] = []
        switch (type) {
            case "flowchart":
                let id = `${message.id}`
                // const yellow = "fill:#EEFFAA,stroke:#333,stroke-width:2px"
                // const white = "fill:#FFFFFF,stroke:#333,stroke-width:4px"
                const deprecatedGreen = "fill:#66FF66,stroke:#333,stroke-width:2px"
                const deprecatedRed = "fill:#FF4400,stroke:#333,stroke-width:4px"

                if (message.metadata.has("Error")) {
                    addToFlowchart(id, "fa:fa-bug", message.metadata.get("title"), message, output, deprecatedRed)
                    break
                }

                const isUser = message.body.role == "user"
                let color = `fill:${message.metadata?.get("color") ?? (isUser ? 'white' : 'lightyellow')},stroke:#333,stroke-width:4px`
                let icon = `${(message.metadata?.get("icon") ?? isUser) ? "fa:fa-user" : "fa:fa-robot"}`
                let body = `${message.metadata?.get("title") ?? message.metadata?.get("caption") ?? message.body.role}`
                body = sanitizeMermaid(body)

                // Styling for certain types of metadata
                if (message.metadata?.has("Reflect")) {
                    let reflect: GPTTagReflect = message.metadata.get("Reflect")
                    if (reflect.wasCorrect) { color = deprecatedGreen } else { color = deprecatedRed }
                }

                addToFlowchart(id, icon, body, message, output, color)

                // If reflect was wrong: Add a self-referential step to think of new answer
                if (message.metadata?.has("Reflect")) {
                    let reflect: GPTTagReflect = message.metadata.get("Reflect")
                    if (!reflect.wasCorrect) {
                        output.push(`${message.id}-.->R${message.id}(fa:fa-spinner Updates answer)`)
                        output.push(`R${message.id}-.->${message.id}`)
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
                break
            case "gitgraph":
                break
            case "sequence":
                break
        }
        return output
    }

    // Diagram layout options
    const options = { direction: direction, spacing: 40, padding: 20 }

    const diagramtype = "flowchart"
    // Create flowchart diagram
    const flowchartConverter = new DiagramConverterFactory<T>().create(diagramtype)
    const flowchartDiagram = flowchartConverter.convert(messages, undefined, undefined, undefined, customFormat, options)
    const flowchartDiagramLength = flowchartDiagram.content.length
    /*
    const expectedLength = 7896
    if (flowchartDiagramLength != expectedLength) throw new Error('Something broke')
    console.log('Flowchart test succeeded')
    */
    const flowchartDiagramContent = flowchartDiagram.content
    return flowchartDiagramContent
}

function addToFlowchart<T extends GPTMessage>(id: string, icon: string, body: string, message: T, output: string[], color: string) {
    let line = `${id}(${icon} ${body})`
    // Connect replies to requests
    if (message.replyTo) line = `${message.replyTo?.id}-->${line}`
    output.push(line)
    addStyle(output, message, color)
}

function addStyle<T extends GPTMessage>(output: string[], message: T, orange: string) {
    output.push(`style ${message.id} ${orange}`)
}
