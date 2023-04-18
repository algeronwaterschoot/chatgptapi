
/*
function processData(apiClient) {
  const data = apiClient.fetchData();
  return `Processed: ${data}`;
}
*/


const url = chrome.runtime.getURL('sample_data/sample1/plugin_log.json');
var messages = [];
fetch(url)
    .then((response) => response.json())
    .then((json) => messages = json);

var responseIndex = 0;

function getMockResponse(message) {
  const responses = [];
  for (let i = responseIndex; i < messages.length; i++) {
	  try {
		  // console.log([messages[i].user, message]);
		if (messages[i].user.trim() == message.trim()) {
			responseIndex = i;
			return messages[i + 1].assistant;
		}
	  }catch(err){}
  }
  return null;
  // return responses.length > 0 ? responses : null;
}

async function mockPrompt() {
	const original_chatgptapi = Prompt.prototype._chatgptapi;

	Prompt.prototype._chatgptapi = function (message) {
		// console.log('Intercepted ChatGPT API call:');
		//message = message.replace(/\n/g, '');
		//console.log(message);
		//message = JSON.stringify(JSON.parse(message));
		//console.log(message);
		// Throttle requests just to be on the safe side...
		// await new Promise(r => setTimeout(r, 100));
		var returnVal = {
			conversationId: crypto.randomUUID(),
			answer: getMockResponse(message),
			chatId: crypto.randomUUID(),
			parentChatId: crypto.randomUUID(),
		};
		return returnVal;
	};

	return () => {
		// Restore the original method when the mock is no longer needed.
		Prompt.prototype._chatgptapi = original_chatgptapi;
	};
}

//const unmockPrompt = mockPrompt();
//const apiClient = new Prompt();
//console.log(processData(apiClient)); // Processed: Mocked data
//unmockPrompt();