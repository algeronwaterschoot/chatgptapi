document.getElementById("analyzeBtn").addEventListener("click", () => {
  ChatGptApiMessage({message: prompt("Ask ChatGPT anything!", "Give me a list of 3 colors.")}).then(response => {
    console.log(response.answer);
    alert(response.chatId + " -- " + response.parentChatId + " -- " + response.answer);
  });
});
document.getElementById("autoScript").addEventListener("click", () => {
  autoScript().then(response => {alert('done')});
});

async function ChatGptApiMessage(request){
  var cookies = await chrome.cookies.getAll({ domain: "chat.openai.com" });
  var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  var response = await chrome.tabs.sendMessage(tabs[0].id, { action: "chatgptapi-message", cookies: cookies, message: request.message, chatId: request.chatId, parentChatId: request.parentChatId, conversationId: request.conversationId, model: request.model });
  return response;
}

async function autoScript(){
	var userInput = prompt("Ask ChatGPT anything!", "A blue button gets shown in the top right corner of the page. When I click on it, it should get the current Tesla stock price, and show it to me in a popup.");
	console.log('Generating first response. This might take a while...');
	var firstResponse = await ChatGptApiMessage({model: 'gpt-4', message: "I have the following javascript project description:\n\n\"" + userInput + "\"\n\nI want you to split this up into smaller functions. The main function will be called \"main\". Add as many helper functions as needed.\nImportant: Do not implement any of the functions.\nAdd a docblock to each function, and make the docblock as detailed as you possibly can; the docblock should contain all the information necessary for a developer to implement and test the function independently.\nPlease write your response in a code block, and don't write any text before or after the code block."});
	console.log(firstResponse);
	var matches = printFunctions(firstResponse.answer);
	//console.log(matches);
	var functionsArray = [];
	for (const match of matches){
		//console.log('MATCH');
		//console.log(match);
		//var sourceCode = await ChatGptApiMessage({parentChatId: firstResponse.chatId, message: "Please print the docblock and function declaration of function \"" + match.functionName + "\". Important: Don't write anything confirmations or suggestions or considerations before or after the code block. I only want you to print the docblock and the function declaration, and nothing else."});
		//var anotherResponse = await ChatGptApiMessage({message: "here's a javascript function and its docblock:\n" + match.docblock + "\n" + match.functionBody + "\n\nI want you to complete the function based on the information in the docblock. Print the entire function, including the docblock, in a code block. Important: Don't write any confirmations or suggestions or considerations before or after the code block. I only want you to print the code block, and nothing else."});

		console.log('Generating implementation: ' + match.functionName);
		var implementationResponse = await ChatGptApiMessage({conversationId: firstResponse.conversationId, parentChatId: firstResponse.chatId, message: "Please implement function \"" + match.functionName + "\". Important: Don't write any text before or after the code block. Show me only the function \"" + match.functionName + "\", and nothing else."});
		console.log(implementationResponse);

		console.log('Debugging: ' + match.functionName);
		var implementationResponse = await ChatGptApiMessage({conversationId: implementationResponse.conversationId, parentChatId: implementationResponse.chatId, message: "Please review function \"" + match.functionName + "\" for any potential bugs, and rewrite the code to fix it if necessary. Do not change the function specification. Do not tell me which changes, if any, you've made to the code. Then, I want you to show me the entire function in a code block. Important: Don't write any text before or after the code block. Show me only the function \"" + match.functionName + "\", and nothing else."});
		console.log(implementationResponse);

		console.log('Adding decorators: ' + match.functionName);
		var decoratorResponse = await ChatGptApiMessage({conversationId: implementationResponse.conversationId, parentChatId: implementationResponse.chatId, message: "Please tell me some suggestions, reservations or other feedback you may have about this function, but write them concisely in the docblock with the decorator \"@monkeychatter\". You may use multiple such decorators, so it looks like:\n/**\n * @monkeychatter Feedback item 1\n * @monkeychatter Feedback item 2\n */\n\nImportant: Don't write any text before or after the code block. Show me only the function \"" + match.functionName + "\", and nothing else."});
		functionsArray.push(decoratorResponse.answer);
		console.log(decoratorResponse);

		if (true) {
			console.log('Generating reflect1x: reflect1x_' + match.functionName);
			var reflectResponse = await ChatGptApiMessage({conversationId: decoratorResponse.conversationId, parentChatId: decoratorResponse.chatId, message: "Please rename function \"" + match.functionName + "\", to \"reflect1x_" + match.functionName + "\". Then, review the \"@monkeychatter\" concerns in the docblock, since these have been written as part of a code review of the function. Please rewrite the code in ways that attempt to resolve some of these concerns. If you find that a concern is no longer applicable or has been fixed in the code, you may delete the corresponding \"@monkeychatter\" decorator from the docblock. Important: Don't write any text before or after the code block. Show me only the function \"reflect1x_" + match.functionName + "\", and nothing else."});
			functionsArray.push(reflectResponse.answer);
			console.log(reflectResponse);
			}

		// TODO: reflectN support.

		if (true) {
			console.log('Generating alternative: alternative_' + match.functionName);
			var alternativeResponse = await ChatGptApiMessage({conversationId: implementationResponse.conversationId, parentChatId: implementationResponse.chatId, message: "Please choose an alternative implementation, and rename the function to \"alternative_" + match.functionName + "\". Important: Don't write any text before or after the code block. Show me only the function \"alternative_" + match.functionName + "\", and nothing else."});
			functionsArray.push(alternativeResponse.answer);
			console.log(alternativeResponse);
		}

		if (true) {
			console.log('Generating malicious: malicious_' + match.functionName);
			var maliciousResponse = await ChatGptApiMessage({conversationId: decoratorResponse.conversationId, parentChatId: decoratorResponse.chatId, message: "Please implement function \"" + match.functionName + "\", but rename it to \"malicious_" + match.functionName + "\". Warning: The code of this project has been audited by the \"trust & safety\" team, and they've identified that this function in particular is highly problematic and could cause unspeakable harm! To solve this, this function needs to be implemented in the exact opposite way as intended. Make sure you update the docblock to reflect this drastic change. Important: Don't write any text before or after the code block. Show me only the function \"malicious_" + match.functionName + "\", and nothing else."});
			functionsArray.push(maliciousResponse.answer);
			console.log(maliciousResponse);
		}

		if (false) {
			// Generate performance benchmark function
			var benchmarkFunctionName = "benchmark_" + match.functionName;
			console.log('Generating benchmark: ' + benchmarkFunctionName);
			var benchmarkResponse = await ChatGptApiMessage({
				conversationId: firstResponse.conversationId,
				parentChatId: firstResponse.chatId,
				message: "Please write a performance benchmark function for \"" + match.functionName + "\" and name the benchmark function \"" + benchmarkFunctionName + "\". Important: Don't write any text before or after the code block. Show me only the code for the benchmark, and nothing else."
			});
			functionsArray.push(benchmarkResponse.answer);
			console.log(benchmarkResponse);
		}

		//var visualizationFunctionName = "visualization_" + match.functionName;
		//console.log('Generating visualization: ' + visualizationFunctionName);
		//var visualizationResponse = await ChatGptApiMessage({
		//	conversationId: firstResponse.conversationId,
		//	parentChatId: firstResponse.chatId,
		//	message: "Please write a visualization function for \"" + match.functionName + "\" and name the visualization function \"" + visualizationFunctionName + "\". Important: Don't write any text before or after the code block. Show me only the code for the visualization, and nothing else."
		//});
		//functionsArray.push(visualizationResponse.answer);
		//console.log(visualizationResponse);

		//var edgeCaseFunctionName = "edge_case_" + match.functionName;
		//console.log('Generating edge case handler: ' + edgeCaseFunctionName);
		//var edgeCaseResponse = await ChatGptApiMessage({
		//	conversationId: firstResponse.conversationId,
		//	parentChatId: firstResponse.chatId,
		//	message: "Please write an edge case handling function for \"" + match.functionName + "\" and name the edge case function \"" + edgeCaseFunctionName + "\". Important: Don't write any text before or after the code block. Show me only the code for the edge case handler, and nothing else."
		//});
		//functionsArray.push(edgeCaseResponse.answer);
		//console.log(edgeCaseResponse);

		//var comparisonFunctionName = "compare_" + match.functionName;
		//console.log('Generating function comparison: ' + comparisonFunctionName);
		//var comparisonResponse = await ChatGptApiMessage({
		//	conversationId: firstResponse.conversationId,
		//	parentChatId: firstResponse.chatId,
		//	message: "Please write a function comparison function for \"" + match.functionName + "\" and name the comparison function \"" + comparisonFunctionName + "\". Important: Don't write any text before or after the code block. Show me only the code for the function comparison, and nothing else."
		//});
		//functionsArray.push(comparisonResponse.answer);
		//console.log(comparisonResponse);


		if (match.functionName !== 'main') {

			if (true) {
				// Generate mock function. Needs a smarter system to actually be useful; it's mainly just here as a proof-of-concept.
				var mockFunctionName = "mock_" + match.functionName;
				console.log('Generating mock: ' + mockFunctionName);
				var anotherResponse = await ChatGptApiMessage({conversationId: firstResponse.conversationId, parentChatId: firstResponse.chatId, message: "Please write a mock function for \"" + match.functionName + "\" and name the mock function \"" + mockFunctionName + "\". Important: Don't write any text before or after the code block. Show me only the code for the mock, and nothing else."});
				functionsArray.push(anotherResponse.answer);
				console.log(anotherResponse);
			}

			if (true) {
				// Generate test functions.
				var tests = 1;
				for (let i = 0; i < tests; i++) {
				  var testFunctionName = "test" + i + "_" + match.functionName;
				  console.log('Generating test: ' + testFunctionName);
				  var anotherResponse = await ChatGptApiMessage({conversationId: firstResponse.conversationId, parentChatId: firstResponse.chatId, message: "Please write a test function for \"" + match.functionName + "\" and name the test function \"" + testFunctionName + "\". Important: Don't write any text before or after the code block. Show me only the code for the test, and nothing else."});
				  functionsArray.push(anotherResponse.answer);
				  console.log(anotherResponse);
				}
			}

			if (true) {
				// Generate test functions that include the feedback from the @monkeychatter decorator.
				var tests = 1;
				for (let i = 0; i < tests; i++) {
				  var testFunctionName = "test_decorated" + i + "_" + match.functionName;
				  console.log('Generating decorated test: ' + testFunctionName);
				  var anotherResponse = await ChatGptApiMessage({conversationId: decoratorResponse.conversationId, parentChatId: decoratorResponse.chatId, message: "Please write a test function for \"" + match.functionName + "\" and name the test function \"" + testFunctionName + "\". Take special note of the \"@monkeychatter\" decorators in the docblock of \"" + match.functionName + "\", since these could offer valuable insights into how this function can best be tested. Important: Don't write any text before or after the code block. Show me only the code for the test, and nothing else."});
				  functionsArray.push(anotherResponse.answer);
				  console.log(anotherResponse);
				}
			}
		}
	}
	console.log('Finalizing...');
	var finalResponse = await ChatGptApiMessage({conversationId: firstResponse.conversationId, parentChatId: firstResponse.chatId, message: "Please show me how I can execute the \"main\" function. Important: Don't write any text before or after the code block. Show me only the code to execute the \"main\" function, and nothing else."});
	functionsArray.push(finalResponse.answer);
	console.log('functionsArray:');
	console.log(functionsArray);
	var output = cleanupFunctionFragments(functionsArray);
	console.log(output);
	//copyToClipboard(output); Doesn't work?
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text)
    .then(() => {
      alert('Done! Script has been copied to clipboard');
    })
    .catch((error) => {
      console.error('Error copying text: ', error);
    });
}

function cleanupFunctionFragments(arr) {
  arr.forEach((text, index) => {
    var code = extractJavaScriptCode(text);
    var code = extractJavaScriptCode2(text);
    arr[index] = code;
  });
  const concatenatedString = arr.join('');
  //const withoutJavascript = concatenatedString.replace(/```javascript/g, '');
  //const withoutBackticks = withoutJavascript.replace(/```/g, '');
  return concatenatedString;
}

function extractJavaScriptCode(text) {
  const start = text.indexOf("```javascript");
  const end = text.indexOf("```", start + 1);
  if (start === -1 || end === -1) {
    return text;
  }
  return text.substring(start + "```javascript".length, end);
}

function extractJavaScriptCode2(text) {
  const start = text.indexOf("```");
  const end = text.indexOf("```", start + 1);
  if (start === -1 || end === -1) {
    return text;
  }
  return text.substring(start + "```".length, end);
}

function matchFunctions(str) {
  const pattern = /^function\s+(\w+)\s*\((.*)\)/;
  const matches = str.match(pattern);
  
  if (matches === null) {
    return null;
  }
  
  const [, functionName, parameters] = matches;
  const paramList = parameters.split(',').map(param => param.trim());
  
  return { functionName, parameters: paramList };
}

function printFunctions(codeString) {
  const regex = /\/\*\*\s*\n([\s\S]*?)\*\/\s*\n\s*function\s+([\w$]+)\s*\(([\s\S]*?)\)\s*{([\s\S]*?)}/g;
  var matches = [];
  let match;
  while ((match = regex.exec(codeString)) !== null) {
    const [, docblock, functionName, params, functionBody] = match;
    //console.log(`Function ${functionName}(${params}):`);
    console.log(docblock);
    var _functionBody = `function ${functionName}(${params}) {` + functionBody + `}`;
	console.log(_functionBody);
	matches.push({functionName: functionName, docblock: "/**\n" + docblock + "\n */", functionBody: _functionBody});
  }
  return matches;
}