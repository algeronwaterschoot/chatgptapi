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
exports.mermaidWIP = void 0;
const GPTSearch_1 = require("./core/GPTSearch");
const GPTMermaid_1 = require("./core/GPTMermaid");
const main_1 = require("./main");
function mermaidWIP() {
    return __awaiter(this, void 0, void 0, function* () {
        const gpt = main_1.gptCopyForDevelopment;
        let search = yield (yield (0, GPTSearch_1.configureSearch)(new GPTSearch_1.ChatGPTMessageSearch(gpt), GPTSearch_1.SearchScope.Genealogy)).all();
        let flatMessageLog = search.map((x) => `${x.body.role}: ${x.content}`);
        const messages = search;
        messages.sort((a, b) => { var _a, _b; return ((_a = a.body.sequence) !== null && _a !== void 0 ? _a : 0) - ((_b = b.body.sequence) !== null && _b !== void 0 ? _b : 0); });
        const customFormat = (message, type, partialDiagram) => {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            let output = [];
            switch (type) {
                case "flowchart":
                    let id = `${message.id}`;
                    const yellow = "fill:#EEFFAA,stroke:#333,stroke-width:2px";
                    const white = "fill:#FFFFFF,stroke:#333,stroke-width:4px";
                    const green = "fill:#66FF66,stroke:#333,stroke-width:2px";
                    const red = "fill:#FF4400,stroke:#333,stroke-width:4px";
                    if (message.metadata.has("Error")) {
                        addToFlowchart(id, "fa:fa-bug", message.metadata.get("title"), message, output, red);
                        break;
                    }
                    const isUser = message.body.role == "user";
                    let color = `${((_b = (_a = message.metadata) === null || _a === void 0 ? void 0 : _a.get("color")) !== null && _b !== void 0 ? _b : isUser) ? white : yellow}`;
                    let icon = `${((_d = (_c = message.metadata) === null || _c === void 0 ? void 0 : _c.get("icon")) !== null && _d !== void 0 ? _d : isUser) ? "fa:fa-user" : "fa:fa-robot"}`;
                    let body = `${(_f = (_e = message.metadata) === null || _e === void 0 ? void 0 : _e.get("title")) !== null && _f !== void 0 ? _f : message.body.role}`;
                    body = (0, GPTMermaid_1.sanitizeMermaid)(body);
                    // Styling for certain types of metadata
                    if ((_g = message.metadata) === null || _g === void 0 ? void 0 : _g.has("Reflect")) {
                        let reflect = message.metadata.get("Reflect");
                        if (reflect.wasCorrect) {
                            color = green;
                        }
                        else {
                            color = red;
                        }
                    }
                    addToFlowchart(id, icon, body, message, output, color);
                    // If reflect was wrong: Add a self-referential step to think of new answer
                    if ((_h = message.metadata) === null || _h === void 0 ? void 0 : _h.has("Reflect")) {
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
        const options = { direction: "TD", spacing: 40, padding: 20 };
        const diagramtype = "flowchart";
        // Create flowchart diagram
        const flowchartConverter = new GPTMermaid_1.DiagramConverterFactory().create(diagramtype);
        const flowchartDiagram = flowchartConverter.convert(messages, undefined, undefined, undefined, customFormat, options);
        // console.log(flowchartDiagram.content)
        const flowchartDiagramLength = flowchartDiagram.content.length;
        /*
          const expectedLength = 7896
          if (flowchartDiagramLength != expectedLength) throw new Error('Something broke')
          console.log('Flowchart test succeeded')
          */
        /**
         * TODO: This belongs in Mermaid, not here.
         */
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
    });
}
exports.mermaidWIP = mermaidWIP;
//# sourceMappingURL=mermaidWIP.js.map