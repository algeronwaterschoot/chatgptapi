import { SearchScope, configureSearch, ChatGPTMessageSearch } from "../core/GPTSearch"
import { createFlowchart } from "../core/GPTMermaid"
import { gptCopyForDevelopment } from "./defaultChatGPTSetup"

export async function mermaidWIP() {
    const gpt = gptCopyForDevelopment
    let search = await (await configureSearch(new ChatGPTMessageSearch(gpt), SearchScope.Genealogy)).all()
    let flatMessageLog = search.map((x) => `${x.body.role}: ${x.content}`)

    const messages = search

    messages.sort((a, b) => (a.body.sequence ?? 0) - (b.body.sequence ?? 0))

    const flowchartDiagramContent = createFlowchart(messages)
    console.log(flowchartDiagramContent)

}