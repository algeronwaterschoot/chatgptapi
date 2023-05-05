"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.templates = void 0;
exports.templates = {
    "JavaScript - Functional programming": {
        templateString: [
            "ROLE: Expert functional programmer, JavaScript",
            "TASK: Analyze user input in REQUIREMENTS LIST and convert it into pure functions to create maintainable software.",
            "ADDITIONAL TASKS:",
            "- No explanations. Only code.",
            "- Show only 3 functions at a time. When I'm ready, I will ask to see the next ones.",
            "- Implement the functions fully.",
            "FORMAT OF REPLY:",
            "```",
            "function 1 code",
            "function 2 code",
            "function 3 code",
            "```",
            "REQUIREMENTS LIST:",
            "{{description}}"
        ],
        metadata: {
            request: {
                caption: "Request 3 pure functions"
            },
            response: {
                caption: "Provide 3 pure functions"
            }
        }
    },
    "Follow-up, JavaScript - Functional programming": {
        templateString: [
            "Show me 3 more pure functions"
        ],
        metadata: {
            request: {
                caption: "Request more"
            },
            response: {
                caption: "Provide more"
            }
        }
    },
    "typescript technical blueprint": {
        templateString: [
            "ROLE: Expert typescript developer",
            "TASK: Write interfaces, types and abstract classes for items in REQUIREMENTS LIST",
            "ADDITIONAL TASKS:",
            "- Use generics and decorators to make code more modular",
            "- Annotate with next steps for how to implement classes",
            "- Do not write definitions for abstract classes. Only declaration.",
            "FORMAT OF REPLY:",
            "```",
            "type MyInterface<T> {",
            "condition: (message: T) => boolean;",
            "style: string;",
            "}",
            "```",
            "REQUIREMENTS LIST:",
            "{{description}}",
            "",
            "If you understand the task, you may start. Remember: Only interfaces, types and abstract classes. No definitions. Use generics and decorators wherever it makes sense."
        ],
        metadata: {
            request: {
                caption: "Request typescript blueprint"
            },
            response: {
                caption: "Give answer"
            }
        }
    },
    "run 1, initialize dev branch": {
        templateString: [
            "TARGET: {{functionName}}",
            "TASK: Implement function definition",
            "FORMAT:",
            "```",
            "function {{functionName}}(params){let foo='bar baz';}",
            "```"
        ],
        metadata: {
            request: {
                caption: "Init dev branch"
            },
            response: {
                caption: "Implement {{functionName}}"
            }
        }
    },
    "run 1, initialize test branch": {
        templateString: [
            "TARGET: {{functionName}}",
            "TASK: Write 3 tests for function",
            "RECOMMENDED: If tests have similar structure, create an extra function to facilitate setup.",
            "FORMAT:",
            "```",
            "function test_{{functionName}}_1(){if(testFailed) throw new Error('Input: {input} -- Expected: {expected} -- Actual: {actual}')}",
            "```",
            "IGNORE: Differences in newlines or whitespaces.",
            "ONLY CONCERN: Whether the function's declaration and definition are equivalent."
        ],
        metadata: {
            request: {
                caption: "Init test branch"
            },
            response: {
                caption: "Write tests for {{functionName}}"
            }
        }
    },
    "run 1, blame": {
        templateString: [
            "This error came up during testing:",
            "```",
            "{{output}}",
            "```",
            "{{verdict}}",
            "Please fix the code, and show the full result."
        ],
        metadata: {
            request: {
                caption: "Blame"
            },
            response: {
                caption: "Fix code"
            }
        }
    },
    "run 1, judge verdict": {
        templateString: [
            "TARGET: {{functionName}}",
            "CONTEXT: A developer and a tester wrote code, but it produced an error.",
            "TASK: Determine if the error came from 'CODE' (developer), 'TEST' (tester), 'BOTH' (developer and tester both made mistakes), 'SANDBOX' (a problem with the testing environment), 'UNSURE', 'EXTERNAL CAUSE', or 'NONE'",
            "FORMAT & EXAMPLE:",
            "```",
            " /* CODE caused the error */",
            "The reason is [...]",
            "```",
            "THE ERROR TO ANALYZE:",
            "{{error}}",
            "THE CODE IT CAME FROM:",
            "{{devCode}}",
            "THE TESTS IT CAME FROM:",
            "{{testCode}}"
        ],
        metadata: {
            request: {
                caption: "Ask judge about error in {{functionName}}"
            },
            response: {
                caption: "Cast blame"
            }
        }
    },
    "run 1, function stubs": {
        templateString: [
            "ROLE: Expert javascript developer",
            "TASK: Write stubs for functions in FUNCTIONS LIST",
            "ADDITIONAL TASK: Write comments between the function's brackets, to indicate data types of parameters/return values",
            "FORMAT OF REPLY:",
            "```",
            "function stubs(param1) {",
            "  // @param param1: string[]",
            "  // @return Promise<string>",
            "}",
            "```",
            "FUNCTIONS LIST:",
            "- extractFunction(functionName, code) {return functionDefinition}",
            "- replaceFunction(oldFunctionName, newFunctionDefinition, code) {return updatedCode}"
        ],
        metadata: {
            request: {
                caption: "Request stubs for functions"
            },
            response: {
                caption: "Write stubs"
            }
        }
    },
    "standard subtask prompt": {
        templateString: [
            "if you could split up the remaining tasks in a way that independent developers can work on them in isolation,",
            "without needing to coordinate with each other, what would be the best way to do that?",
            "Answer in the following format, in a code block:",
            "",
            "```",
            "- Subtask 1: Description",
            "- Subtask 2: Description",
            "```",
            "",
            "Remember, it should be possible to work on the subtasks in isolation and in parallel. ",
            "Only when this list of subtasks is finished can we move on to the next step."
        ],
        metadata: {
            request: {
                caption: "Request subtasks"
            },
            response: {
                caption: "Give list of subtasks"
            }
        }
    },
    "run 2, are there more TODOs?": {
        templateString: [
            "Thank you for working on this subtask.",
            "Is there anything else that needs to be done in order to finalize this subtask?",
            "Answer in the following format, in a code block:",
            "",
            "```",
            "- Subtask {{i}}, remaining TODO #1: Description",
            "- Subtask {{i}}, remaining TODO #2: Description",
            "```",
            "",
            "(if there are no remaining TODOs, just answer 'This subtask is done')",
            "Remember, it should be possible to work on the remaining TODOs in isolation and in parallel.",
            "Only when this list of remaining TODOs is finished can we move on to the next step."
        ],
        metadata: {
            request: {
                caption: "Any TODOs?"
            },
            response: {
                caption: 'List of TODOs / "Done"'
            }
        }
    },
    "run 2, subtask implementation": {
        templateString: [
            "Can you show me an implementation of #{{i}}?",
            "Don't write any comments, and don't show me examples of how to use it.",
            "I only want the declarations and definitions."
        ],
        metadata: {
            request: {
                caption: "Can you implement #{{i}}?"
            },
            response: {
                caption: "Answer"
            }
        }
    },
    "run 2, reflection": {
        templateString: [
            "Before we continue, can you review your answer and tell me if you think it's correct? If yes, say 'yes'. If no, show me the correction."
        ],
        metadata: {
            request: {
                caption: "Ask to reflect"
            },
            response: {
                caption: "Reflect"
            }
        }
    }
};
//# sourceMappingURL=templates.js.map