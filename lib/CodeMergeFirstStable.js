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
exports.MockGPTAPI = void 0;
// Usage
(() => {
    const output = workflow.execute();
    // console.log(workflow.processedSteps.length)
    // throw new Error("")
    console.log("Final output:", output);
    // console.log(new MermaidDiagram().execute(workflow))
})();
class MockGPTResponse {
}
class MockApiEndpoint extends GPTAPI {
    fetch(request) {
        return __awaiter(this, void 0, void 0, function* () {
            return new MockGPTResponse();
        });
    }
}
/code>;
/code>;
class RuntimeCache {
    constructor() {
        this.cache = new Map();
    }
    get(key) {
        return this.cache.get(key);
    }
    set(key, value, fromCache) {
        if (!fromCache) {
            this.cache.set(key, value);
        }
    }
}
/code>;
class CallbackCache {
    constructor(getCallback, setCallback) {
        this.getCallback = getCallback;
        this.setCallback = setCallback;
    }
    get(key) {
        return this.getCallback(key);
    }
    set(key, value, fromCache) {
        if (!fromCache) {
            this.setCallback(key, value);
        }
    }
}
/code>;
class Context {
    constructor(loggers, caches) {
        this.loggers = loggers;
        this.threads = [];
        this.objects = [];
        this.caches = caches;
    }
    newThread() {
        const thread = new Thread(this);
        this.threads.push(thread);
        return thread;
    }
}
/code>;
/code>;
class FooContext extends Context {
    prompt(question, thread) {
        throw new Error("Method not implemented.");
    }
    clone(thread) {
        throw new Error("Method not implemented.");
    }
    constructor(apiKey, apiEndpoint, loggers, caches, options = {}) {
        super(loggers, caches);
        this.apiKey = apiKey;
        this.apiEndpoint = apiEndpoint;
        this.apiEndpointUrl = options.apiEndpoint || "https://api.foo.com";
        this.timeout = options.timeout || 10000;
    }
    setDefaultModel(model) {
        this.defaultModel = model;
    }
    newThread() {
        return new Thread(this);
    }
    subThread(thread) {
        throw new Error("Method not implemented.");
    }
}
/code>;
class FooContext extends Context {
    constructor(apiKey, logger) {
        super(logger);
        this.apiKey = apiKey;
    }
    prompt(question, thread) {
        return __awaiter(this, void 0, void 0, function* () {
            // Implement the prompt logic for FooContext
        });
    }
    clone(thread) {
        const clonedThread = new Thread(this);
        // Implement any additional cloning logic here, if necessary
        this.threads.push(clonedThread);
        return clonedThread;
    }
}
/code>;
/code>;
class ConsoleLogger {
    log(message) {
        console.log(message);
    }
    error(message) {
        console.error(message);
    }
}
/code>;
class FileLogger {
    constructor(filePath) {
        this.filePath = filePath;
    }
    error(message) {
        throw new Error("Method not implemented.");
    }
    log(message) {
        // Implement file writing logic here
    }
}
/code>;
class Thread {
    constructor(context) {
        this.context = context;
        this.requests = [];
        this.responses = [];
    }
    prompt(question) {
        return this.context.prompt(question, this);
    }
    clone() {
        return this.context.clone(this);
    }
}
/code>;
const consoleLogger = new ConsoleLogger();
const runtimeCache = new RuntimeCache();
const callbackCache = new CallbackCache((key) => {
    // Implement the "get" callback logic here
}, (key, value) => {
    // Implement the "set" callback logic here
});
function testMockApiEndpoint() {
    return __awaiter(this, void 0, void 0, function* () {
        const mockApiEndpoint = new MockApiEndpoint();
        // Add mock responses
        const mockRequest1 = new FooGPTRequestBody("fooModel1", "What are the closest planets to the sun?", "randomparentuuid");
        const mockResponse1 = new FooGPTResponseBody("uuid1", "uuid0", "uuidConv1", [
            "Mercury",
            "Mercury, Venus",
            "Mercury, Venus, Earth",
            "Mercury, Venus, Earth, Mars",
        ]);
        mockApiEndpoint.addMockResponse(mockRequest1, mockResponse1);
        const mockRequest2 = new FooGPTRequestBody("fooModel1", "What is the size of Mercury?", "uuid1");
        const mockResponse2 = new FooGPTResponseBody("uuid2", "uuid1", "uuidConv1", [
            "Mercury is 4,880 km in diameter.",
        ]);
        mockApiEndpoint.addMockResponse(mockRequest2, mockResponse2);
        // Create a FooContext with the MockApiEndpoint
        const fooContext = new FooContext("fakeApiKey", mockApiEndpoint);
        fooContext.setDefaultModel("fooModel1");
        const context = fooContext;
        const gpt = context.newThread();
        const planets = yield gpt.ask("What are the closest planets to the sun?");
        console.log(`Planets: ${planets}`);
        const planetThread = gpt.subThread();
        const size = yield planetThread.ask("What is the size of Mercury?");
        console.log(`Size: ${size}`);
        if (!(planets == "Mercury, Venus, Earth, Mars"))
            throw new Error("");
    });
}
/code>;
testMockApiEndpoint();
class GPTSession {
    constructor(context) {
        this.context = context;
    }
    prompt(prompt, model = this.context.defaultModel) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.context.prompt(prompt, model);
        });
    }
    fork() {
        return this.context.fork();
    }
    newConversation(title = "New chat") {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.context.newConversation(title);
        });
    }
    // startConversation(title: string = 'New chat') { return this.context.startConversation(title); }
    enablePlugin(plugin) {
        this.context.enablePlugin(plugin);
    }
    disablePlugin(plugin) {
        this.context.disablePlugin(plugin);
    }
}
/code>;
const config = {
    formatter: new MermaidSequenceFormatter(),
    styles: [
        {
            condition: (message) => message.content.includes("error"),
            style: "background:red",
        },
        // Add other styles as needed
    ],
};
const builder = new MermaidDiagramBuilder(config);
const mermaidCode = builder.generateMermaidCode(context);
// console.log(mermaidCode)
let expectedMermaidCode = "flowchart TD\nsubgraph subgraph0.0.1.1\nbdf0f49d-e2de-455e-bf95-d88c9a39ecbd -->\n213def66-3bf2-4ffe-b8df-f7e56166336b -->\n850034bf-ebbd-471a-b05c-dc1912baaeb3 -->\nf7561032-0705-4809-a835-cabd0d07b3b5\nend\nsubgraph subgraph0.0.1.2\nbdf0f49d-e2de-455e-bf95-d88c9a39ecbd -->\n213def66-3bf2-4ffe-b8df-f7e56166336b -->\ne7aff983-3094-4a88-a78f-a1806bc7178c -->\na1fd9290-39b0-4fac-a5ba-804f3cba1e81\nend\nsubgraph subgraph0.0.1.3\nbdf0f49d-e2de-455e-bf95-d88c9a39ecbd -->\n213def66-3bf2-4ffe-b8df-f7e56166336b\nend\nsubgraph subgraph0.0.1.4\nbdf0f49d-e2de-455e-bf95-d88c9a39ecbd -->\n213def66-3bf2-4ffe-b8df-f7e56166336b -->\n24d5e4f7-6caa-4bc7-9eb7-ee815997face -->\n155845f1-7ff8-471e-a0a5-cb0914ab01f2\nend\nsubgraph subgraph0.0.1.5\nbdf0f49d-e2de-455e-bf95-d88c9a39ecbd -->\n213def66-3bf2-4ffe-b8df-f7e56166336b -->\nbc5e62aa-1d53-4766-9da1-9d7ae221486e -->\nf20d8ad1-207c-4e35-b301-ce2654e68cd2\nend\nsubgraph subgraph0.0.1.6\nbdf0f49d-e2de-455e-bf95-d88c9a39ecbd -->\n213def66-3bf2-4ffe-b8df-f7e56166336b\nend\nsubgraph0.0.1 --> subgraph0.0.1.1\nsubgraph0.0.1 --> subgraph0.0.1.2\nsubgraph0.0.1 --> subgraph0.0.1.3\nsubgraph0.0.1 --> subgraph0.0.1.4\nsubgraph0.0.1 --> subgraph0.0.1.5\nsubgraph0.0.1 --> subgraph0.0.1.6\nsubgraph0.0 --> subgraph0.0.1";
if (mermaidCode.split("\n").length != expectedMermaidCode.split("\n").length)
    throw new Error("Mermaidcode broke");
function isAsyncFunction(func) {
    const AsyncFunction = Object.getPrototypeOf(function () {
        return __awaiter(this, void 0, void 0, function* () { });
    }).constructor;
    return func instanceof AsyncFunction;
    // return func.constructor.name === 'AsyncFunction' || func[Symbol.toStringTag] === 'AsyncFunction';
}
/code>;
class JSONMockGPTAPI extends GPTAPI {
    fetch(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const prompt = request.body.content;
            const promptAnswerPairs = JSONMockGPTAPI.promptAnswerPairs;
            for (const details of promptAnswerPairs) {
                if (details.prompt == prompt)
                    return new ChatGPTResponseBody(UUID(), UUID(), UUID(), details.reply);
            }
            return new ChatGPTResponseBody(UUID(), UUID(), UUID(), ["No data"]);
        });
    }
}
JSONMockGPTAPI.promptAnswerPairs = [
    {
        prompt: [
            `ROLE: Expert javascript developer`,
            `TASK: Write stubs and docblocks for functions in FUNCTIONS LIST`,
            `FORMAT OF REPLY:`,
            "```",
            "stubs and docblocks",
            "```",
            "FUNCTIONS LIST:",
            `- extractFunction(functionName, code) {return functionDefinition}`,
            `- replaceFunction(oldFunctionName, newFunctionDefinition, code) {return updatedCode}`,
        ].join("\n"),
        reply: ["extractFunction\nreplaceFunction"],
    },
    {
        prompt: [
            `TARGET: extractFunction`,
            `TASK: Implement function definition`,
        ].join("\n"),
        reply: ["function extractFunction(a, b){}"],
    },
    {
        prompt: [
            `TARGET: replaceFunction`,
            `TASK: Implement function definition`,
        ].join("\n"),
        reply: ["function replaceFunction(a, b){}"],
    },
    {
        prompt: [
            `TARGET: extractFunction`,
            `TASK: Write 4 tests for function`,
            "FORMAT: if(testFailed) throw new Error(`Input: ${input} -- Expected: ${expected} -- Actual: ${actual}`)",
        ].join("\n"),
        reply: [
            "function test1(){}\nfunction test2(){}\nfunction test3(){}\nfunction test4(){}",
        ],
    },
    {
        prompt: [
            `TARGET: replaceFunction`,
            `TASK: Write 4 tests for function`,
            "FORMAT: if(testFailed) throw new Error(`Input: ${input} -- Expected: ${expected} -- Actual: ${actual}`)",
        ].join("\n"),
        reply: [
            'function test1(){throw new Error("Hello Error")}\nfunction test2(){}\nfunction test3(){}\nfunction test4(){}test1();',
        ],
    },
];
/code>;
class MockGPTAPI extends GPTAPI {
    fetch(request) {
        return __awaiter(this, void 0, void 0, function* () {
            if (request.body.conversationId)
                return new ChatGPTResponseBody(UUID(), UUID(), UUID(), [
                    "Mercury, Venus, Earth",
                    "This is a conversation.",
                ]);
            return new ChatGPTResponseBody(UUID(), UUID(), UUID(), [
                "Mercury",
                "Mercury, Venus",
                "Mercury, Venus, Earth",
                "Mercury, Venus, Earth, Mars",
            ]);
        });
    }
}
exports.MockGPTAPI = MockGPTAPI;
/code>;
//# sourceMappingURL=CodeMergeFirstStable.js.map