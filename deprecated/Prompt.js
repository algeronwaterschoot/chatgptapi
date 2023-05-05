/* MOCKS */


/*
you are an expert at object-oriented programming in javascript.

I want to create a "Prompt" class that facilitates working with prompts that get sent to ChatGPT's API, to initiate or continue chat conversations.

Parameters:
- message (string)
- parentId (UUID, default random),
- conversationId (UUID, default null)
- model (string, default "text-davinci-002-render-sha")

During construction:
- Property Id (UUID, random)
- Property parent (Prompt, null)
- Property children (list of Prompt instances, empty)
- Call private async method "_send" (TODO for now) which updates conversationId and sets property "response".

- Methods:
- "next": message (string), model (string, default "text-davinci-002-render-sha"). Returns a new instance of the same class, with its parentId set to the Id of the parent instance, and its conversationId set to the parent's conversationId. Sets its own "parent" property to the instance it was called from, and adds itself to the list of children of its parent.
- "Edit": message (string), Returns a new instance of the same class. Similar to "And", but reuses the same parentId.
- "Reroll". Returns a new instance of the same class. Similar to "Edit", but takes no parameters.
- Getters for parent and children. No setters.

Additional notes:
- To generate random UUIDs, you may use crypto.randomUUID()".
- I only want javascript for browsers; not for NodeJS.
*/

class Prompt {
  constructor(
    input,
    model = "text-davinci-002-render-sha",
	// historyDepth = 10,
    parent = null,
    conversationId = null,
  ) {
    this.input = input;
    this.parent = parent;
	if (parent == null) {
		this.parentId = crypto.randomUUID();
	}
	else {
		this.parentId = parent.Id;
	}
    this.conversationId = conversationId;
    this.model = model;
    this.Id = crypto.randomUUID();
    this.children = [];
	// this.historyDepth = historyDepth;

    return this._send();
  }

  flattenInput(inputArray) {
    return inputArray.reduce((accumulator, item) => {
      if (Array.isArray(item)) {
        return accumulator.concat(this.flattenInput(item));
      } else if (item instanceof PromptList) {
        return accumulator.concat(item);
      } else if (typeof item === 'object') {
        return accumulator.concat(
          Object.entries(item).map(([key, value]) => new PromptList(key, value))
        );
      } else {
        return accumulator.concat(item);
      }
    }, []);
  }

  async getMessage() {
	  const flattenedInput = this.flattenInput(this.input);
    let messageWithInput = '';

    flattenedInput.forEach((item) => {
      if (item instanceof PromptList) {
        messageWithInput = item.apply(messageWithInput) + '\n';
      } else {
        messageWithInput += item + '\n';
      }
    });
	return messageWithInput;
  }

  async _chatgptapi(message) {
	  // throw new Error("Debug");
	  var cookies = await chrome.cookies.getAll({ domain: "chat.openai.com" });
	  var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
	  return await chrome.tabs.sendMessage(tabs[0].id, { action: "chatgptapi-message", cookies: cookies, message: message, chatId: this.Id, parentChatId: this.parentId, conversationId: this.conversationId, model: this.model });
  }

  async _send() {
	  /*
	  var messages = await this.getChatHistory();
	  var takeHistory = Math.min(messages.length, this.historyDepth + 1);
	  var recentMessages = [];
	  for (let i = 0; i < takeHistory; i++) {
		  recentMessages.push(messages.pop());
	  }
	  messages = recentMessages.toReversed();
	  console.log('messages2');
	  console.log(messages);
	  */
	  /*
	  if (messages.length <= 1) {
		  console.error('WARNING: Message length low');
	  }
	  */
		var message = await this.getMessage();
	    var response = await this._chatgptapi(message);
		if (response.mock == true) {

		// var cookies = await chrome.cookies.getAll({ domain: "chat.openai.com" });
		  var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
		  await chrome.tabs.sendMessage(tabs[0].id, { action: "chatgptapi-mockmessage", mockMessage: message.trim(), mockResponse: response.answer });
		}
		/*
		var apiKey = "";
		const headers = new Headers();
		headers.append("content-type", "application/json");
		headers.append("authorization", `Bearer ${apiKey}`);

		var requestBody = {
			messages: messages,
			max_tokens: 2000,
			model: this.model,
		};
		const response = await fetch("https://api.openai.com/v1/chat/completions", {
			method: "POST",
			headers: headers,
			body: JSON.stringify(requestBody)
		});
		var _response = await response.text();
		// console.log(_response);
		var apiResponse = JSON.parse(_response);
		//return await response.text();
	  console.log('apiResponse');
	  console.log(apiResponse);
	  // {"id":"chatcmpl-7674Be2hOMPDrRjw3XJUyxyA7tAdg","object":"chat.completion","created":1681691487,"model":"text-davinci-002-render-sha-0301","usage":{"prompt_tokens":17,"completion_tokens":11,"total_tokens":28},"choices":[{"message":{"role":"assistant","content":"1. Blue \n2. Green \n3. Yellow"},"finish_reason":"stop","index":0}]}
	  */
	  this.conversationId = response.conversationId;
	  this.response = response.answer;
	  this.Id = response.chatId;
	  this.parentId = response.parentChatId;
	  /*
      this.conversationId = null;
	  this.response = apiResponse.choices[0].message.content;
	  this.Id = apiResponse.id;
	  if (this.parent !== null) {
		  this.parentId = this.parent.Id;
	  }
	  */
	  return this;
  }

  async getChatHistory(append = []) {
	  if (this.parent !== null) {
		  append = await this.parent.getChatHistory(append);
	  }
	  var msg = await this.getMessage();
	  append.push({role: "user", content: msg});
	  if (this.response !== undefined) {
		  append.push({role: "assistant", content: this.response});
	  }
	  return append;
  }

  async next(input, model = "text-davinci-002-render-sha") { // , historyDepth = 10
    var newPrompt = await new Prompt(
      input,
      model,
      // historyDepth,
	  this,
      this.conversationId
    );
	this.children.push(newPrompt);
	return newPrompt;
  }
}


/*
  edit(message) {
    var newPrompt = new Prompt(
      message,
      this.parentId,
      this.conversationId,
      this.model
    ).then(result => {
		// newPrompt.parent = this;
		this.parent.children.push(newPrompt);
	});
    return newPrompt;
  }
*/

  /*
  reroll() {
    const newPrompt = new Prompt(
      this.message,
      this.parentId,
      this.conversationId,
      this.model
    ).then(result => {
		// newPrompt.parent = this;
		this.parent.children.push(newPrompt);
	});
    return newPrompt;
  }
  */

/*
class Criteria {
  constructor(...criteria) {
    this.criteria = criteria;
  }

  flattenCriteria(criteriaList) {
    return criteriaList.reduce((accumulator, criterium) => {
      if (criterium instanceof Criteria) {
        return accumulator.concat(this.flattenCriteria(criterium.criteria));
      } else {
        return accumulator.concat(criterium);
      }
    }, []);
  }

  apply(message) {
    const flattenedCriteria = this.flattenCriteria(this.criteria);
    const criteriaString = flattenedCriteria
      .map((criterium) => `\n- ${criterium}`)
      .join("");
	if (criteriaString) {
		return message + '\n\nCriteria: ' + criteriaString;
	}
	else {
		return message + criteriaString;
	}
  }
}

}
*/



class PromptList {
  constructor(listName, ...items) {
    this.listName = listName;
    this.items = items;
  }


  flattenInput(inputArray) {
    return inputArray.reduce((accumulator, item) => {
      if (Array.isArray(item)) {
        return accumulator.concat(this.flattenInput(item));
      } else if (item instanceof PromptList) {
        return accumulator.concat(item);
      } else if (typeof item === 'object') {
        return accumulator.concat(
          Object.entries(item).map(([key, value]) => new PromptList(key, value))
        );
      } else {
        return accumulator.concat(item);
      }
    }, []);
  }

  apply(message) {
    const flattenedList = this.flattenInput(this.items);
    const listString = flattenedList
      .map((item) => `\n- ${item}`).filter((str) => str !== `\n- `)
      .join("");
    return message + `\n\n${this.listName}:` + listString;
  }
}

class CodeblockFormat extends PromptList {
  constructor(...additionalItems) {
    super('Format',
	  "Please write your response in a code block.",
	  "Don't write any text before or after the code block.",
	  ...additionalItems
	);
  }
}
