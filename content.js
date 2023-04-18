window.onload = function () {
	function injectScript(url) {
	  const script = document.createElement('script');
	  script.src = url;
	  script.async = true;
	  document.head.appendChild(script);
	}

	//injectScript('./bin/gcloud/api.js');

	
	const cloudApiKey = '';

	function initGoogleApiClient() {
	  return new Promise((resolve, reject) => {
		gapi.load('client', () => {
		  gapi.client.setApiKey(apiKey);
		  gapi.client.load('cloudfunctions', 'v1').then(resolve).catch(reject);
		});
	  });
	}
	// 
	const projectId = '';
	const region = '';
	const functionName = '';

	async function callPrivateCloudFunction() {
	  try {
		await initGoogleApiClient();

		const request = {
		  name: `projects/${projectId}/locations/${region}/functions/${functionName}`,
		};

		const response = await gapi.client.cloudfunctions.projects.locations.functions.call(request);
		const result = response.result;

		console.log('Private Cloud Function response:', result);
	  } catch (error) {
		console.error('Error calling private Cloud Function:', error);
	  }
	}

	// callPrivateCloudFunction();
}


function w(e, n) {
    return e.includes("checking your browser") ? 1 : e.includes("token_expired") ? 2 : !1
}

function v(e) {
    return e.replace(/\\u([a-fA-F0-9]{4})/g, function(n, t) {
        return String.fromCharCode(parseInt(t, 16))
    })
}

function k(e) {
    let n = 0,
        t = new Array;
    for (; e.indexOf("{{", n) != -1;) t.push(e.slice(e.indexOf("{{", n) + 2, e.indexOf("}}", n))), n = e.indexOf("}}", n) + 2;
    return t
}

function T(e) {
    let n = 0,
        t = 1,
        a = "",
        i = new Array;
    for (; e.indexOf(t + ". ", n) != -1;) a = t + 1 + ". ", i.push(e.slice(e.indexOf(t + ". ", n) + 3, e.indexOf(a, n))), n = e.indexOf(a, n);
    return i
}

function s(e, n) {
    var t = {};
    return t.texts = e, t.noCredit = n, t.help_message = {}, t
}
async function _(e) {
    let t = await (await fetch("https://chat.openai.com/api/auth/session", {
            headers: {
                cookie: "__Secure-next-auth.session-token=" + e
            }
        })).text(),
        a = w(t);
    if (a !== !1) return a;
    t = JSON.parse(t);
    const i = t.accessToken;
    if (!i) throw new Error("Unable to get access token");
    return i
}

function handleApiResponse(response, statusCode) {
    return {
        status: statusCode,
        statusText: "ok",
        body: JSON.stringify(response)
    };
}

async function fetchOpenAIChatResponse(authToken, event) {
	const headers = new Headers();
	headers.append("content-type", "application/json");
	headers.append("authorization", `Bearer ${authToken}`);

	var requestBody = {
		action: "next",
		messages: [
			{
				id: event.chatId,
				author: {
					role: "user"
				},
				content: {
					content_type: "text",
					parts: [event.message]
				}
			}
		],
		model: event.model,
		parent_message_id: event.parentChatId,
		timezone_offset_min: -120
	};
	if (event.conversationId !== undefined) {
	  requestBody.conversation_id = event.conversationId;
	}

	const response = await fetch("https://chat.openai.com/backend-api/conversation", {
		method: "POST",
		headers: headers,
		body: JSON.stringify(requestBody)
	});
	var _response = await response.text();
	//console.log(_response);
	return _response;
	//return await response.text();
}

var messageLog = [];
chrome.runtime.onMessage.addListener((event, sender, sendResponse) => {
    if (event?.action === "chatgptapi-message") {
        //chrome.runtime.sendMessage({ action: "chatgptapi-getcookies" }).then(async cookies => {
		new Promise(r => setTimeout(r, 10000)).then(async cookies => {
			// Throttle requests.
			await new Promise(r => setTimeout(r, 5000));
			if (event.chatId === undefined) {
			  event.chatId = crypto.randomUUID();
			}
			if (event.parentChatId === undefined) {
			  event.parentChatId = crypto.randomUUID();
			}
			if (event.model === undefined) {
			  event.model = 'text-davinci-002-render-sha';
			}
			cookies = event.cookies;
            const sessionTokenCookie = cookies.find(cookie => cookie.name === "__Secure-next-auth.session-token");

            if (!sessionTokenCookie) {
                sendResponse(handleApiResponse([], 200));
                return;
            }

            const authToken = await _(sessionTokenCookie.value);

            if (Number.isInteger(authToken)) {
                sendResponse(handleApiResponse([], authToken));
                return;
            }

			//console.log('apievents');
			//console.log(event);
			console.log({'user': event.message});
			messageLog.push({'user': event.message});
            const chatResponse = await fetchOpenAIChatResponse(authToken, event);
			//console.log('chatResponse');
			//console.log(chatResponse);
            const parsedResponse = w(chatResponse);

            if (parsedResponse !== false) {
                sendResponse(handleApiResponse([], parsedResponse));
                return;
            }

            var responseLines_ = chatResponse.split('\n').map(line => line).filter(str => str !== '');
			// console.log(responseLines_);
			var responseLines = [];
			for (responseLine of responseLines_) {
				if (responseLine.includes('message')){
					responseLines.push(responseLine);
				}
			}
			// console.log(responseLines);
            const lastLine = responseLines[responseLines.length - 1];
            const parsedLastLine = JSON.parse(lastLine.substring(6));
            const chatId = parsedLastLine.message.id;
            const answer = parsedLastLine.message.content.parts[0];
			const conversationId = parsedLastLine.conversation_id;
			const parentChatId = parsedLastLine.parent_message_id;

			console.log({'assistant': answer});
			messageLog.push({'assistant': answer});
            sendResponse({answer: answer, chatId: chatId, parentChatId: parentChatId, conversationId: conversationId});
        }).then(sendResponse);

        return true;
    }
});
