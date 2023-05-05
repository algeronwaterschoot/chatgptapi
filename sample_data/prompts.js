"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prompts = void 0;
exports.prompts = {
    "Pure functions for FooVendingMachine": {
        template: ["JavaScript - Functional programming"],
        description: [
            "class: FooVendingMachine",
            "properties:",
            "- id (UUID)",
            "- built (Date) The date of manufacture",
            "- stock (Map<ConsumableID, [Consumable]>) Which items it has in stock",
            "- endpoint (URL) The API endpoint where it can request restocks",
            "- envData (Map<string, any>) where it stores all information its sensors have access to",
            "",
            "methods:",
            "- processOrder(input: ConsumableID): Consumable",
            "- adjustTemperature(newTemp: number)",
            "- acceptPayment(amount, owed, paymentType: 'cash' | 'card'): Promise<boolean>",
            "- releaseItem(ConsumableID)",
            "- requestRestock()",
            "- detectCounterfeitCash()",
            "- detectVandalism()"
        ]
    },
    "Pure functions for GPTMessage": {
        template: ["JavaScript - Functional programming"],
        description: [
            "I have a system for sending messages to GPT and receiving answers.",
            "This is in the context of automated programming, so most messages will be JavaScript-related.",
            "",
            "Messages are class 'GPTMessage', which has the following properties:",
            "- id (UUID)",
            "- date (Date) when the message got sent/received",
            "- content (string) The content of the message.",
            "- replyTo (GPTMessage | null) The previous message this was a reply to.",
            "- replies (GPTMessage[]) The messages that replied to this one.",
            "- role ('user' | 'assistant') Whether the message was from the user or from GPT."
        ]
    },
    "run 2, initial input": {
        template: ["typescript technical blueprint"],
        description: [
            "A `prompt builder` that helps developers write and organize their prompts for ChatGPT.",
            "It needs to be able to do the following:",
            "1) Prompt management",
            "- Load prompt templates from a JSON file",
            "- Load custom prompts from another JSON file",
            "2) Template variable substitution",
            "- Variables can be declared in templates and custom prompts, and variables (strings) are injected at runtime.",
            "3) Dynamic prompt building",
            "- It should be possible to reference multiple smaller templates to build larger prompts.",
            "- Templates can be selected based on conditional logic at runtime.",
            "4) Metadata",
            "- Templates and custom prompts can be tagged with metadata.",
            "- This metadata should be stored in file.",
            "4) Smart prompts",
            "- There will be 2 special types of metadata: Validators, and Decorators. Both are references to functions.",
            "- A validator can evaluate the input prompt or the output response, and throw an error if validation failed.",
            "- Decorators allow callbacks to be injected as preprocessors and postprocessors when sending prompts and receiving replies."
        ]
    }
};
//# sourceMappingURL=prompts.js.map