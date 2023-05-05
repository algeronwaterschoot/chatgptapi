window.addEventListener('DOMContentLoaded', () => {
  window.addEventListener('message', handleMessageEvent);
});

const callbackMap = new Map();
let requestId = 0;

async function loadPromptDefinitions() {
	const url = chrome.runtime.getURL('prompts.json');
	return await fetch(url)
	  .then(response => response.json())
	  .catch(error => console.error(error));
}

async function handleMessageEvent(event) {
  let { id, result, error } = event.data;
  let callback = callbackMap.get(id);
  
  if (callback) {
    error ? callback.reject(new Error(`${error}`)) : callback.resolve(result);
    callbackMap.delete(id);
  }
}

async function executeJavaScript(code) {
  return new Promise((resolve, reject) => {
    let id = requestId++;
    callbackMap.set(id, { resolve, reject });
    let iframe = document.getElementById('sandbox');
    iframe.contentWindow.postMessage({ id, code }, '*');
  });
}

async function copyToClipboard(text) {
  navigator.clipboard.writeText(text)
    .then(() => alert('Done! Script has been copied to clipboard'))
    .catch(error => console.error('Error copying text:', error));
}

async function extractCodeFromChatReply(arr) {
  //if (!(Array.isArray(arr) && arr)) return '';
  var script = '';
  for (anEl of arr) {
	  var txt = await extractJavaScriptCode(anEl);
	  txt = await extractJavaScriptCode2(txt);
	  script = script + txt;
  }
  // return arr.map(text => await extractJavaScriptCode2(await extractJavaScriptCode(text))).join('');
  return script;
}

async function extractJavaScriptCode(text) {
  let start = text.indexOf("```javascript");
  if (start == -1) start = text.indexOf("```js");
  if (start == -1) start = text.indexOf("```json");
  let end = text.indexOf("```", start + 1);
  return start !== -1 && end !== -1 ? text.substring(start + "```javascript".length, end) : text;
}

async function extractJavaScriptCode2(text) {
  let start = text.indexOf("```");
  let end = text.indexOf("```", start + 1);
  return start !== -1 && end !== -1 ? text.substring(start + "```".length, end) : text;
}

function matchFunctions(str) {
  const pattern = /^function\s+(\w+)\s*\((.*)\)/;
  const matches = str.match(pattern);
  
  if (matches === null) {
    return null;
  }
  
  let [, functionName, parameters] = matches;
  let paramList = parameters.split(',').map(param => param.trim());
  
  return { functionName, parameters: paramList };
}

async function printFunctions(codeString) {
  const regex = /\/\*\*\s*\n([\s\S]*?)\*\/\s*\n\s*function\s+([\w$]+)\s*\(([\s\S]*?)\)\s*{([\s\S]*?)}/g;
  let matches = [];
  
  let match;
  while ((match = regex.exec(codeString)) !== null) {
    let [, docblock, functionName, params, functionBody] = match;
    console.log(docblock);
    let _functionBody = `function ${functionName}(${params}) {${functionBody}}`;
    console.log(_functionBody);
    matches.push({ functionName, docblock: `/**\n${docblock}\n */`, functionBody: _functionBody });
  }
  
  return matches;
}







					/*
			if (match.functionName !== 'main') {
				if (false) {
					// Generate test functions that include the feedback from the @monkeychatter decorator.
					var tests = 1;
					for (let i = 0; i < tests; i++) {
					  var testFunctionName = "test_decorated" + i + "_" + match.functionName;
					  console.log(match.functionName + ': Generating decorated test');
					  var testResponse = await decoratorPrompt.next("Please write a test function for \"" + match.functionName + "\" and name the test function \"" + testFunctionName + "\". Take special note of the \"@monkeychatter\" decorators in the docblock of \"" + match.functionName + "\", since these could offer valuable insights into how this function can best be tested.", [
							"Assume all functions are available.",
							new CodeblockFormat(),
						]);
					}
				}
			}
					if (false) {
						console.log(match.functionName + ': Debugging');
						var functionPrompt = await functionPrompt.next("", new Query(
							"Review function \"" + match.functionName + "\" for bugs. Rewrite it if necessary.",
							"Do not change the function specification.",
							"Do not tell me which changes, if any, you've made to the code.",
							"Then, I want you to show me the entire function in a code block.",
							new CodeblockFormat("Assume all functions are available."),
						));
					}

					if (false) {
						console.log(match.functionName + ': Adding decorators');
						var functionPrompt = await functionPrompt.next("Please tell me some suggestions, reservations or other feedback you may have about this function, but write them concisely in the docblock with the decorator \"@monkeychatter\". You may use multiple such decorators, so it looks like:\n/**\n * @monkeychatter Feedback item 1\n * @monkeychatter Feedback item 2\n *\/\n\n", [
							"Assume all functions are available.",
							new CodeblockFormat(),
						]);
					}

					if (false) {
						console.log(match.functionName + ': Generating reflect1x');
						var functionPrompt = await functionPrompt.next("Please review the \"@monkeychatter\" IMPROVEMENTs in the docblock, since these have been written as part of a code review of the function. Please rewrite the code in ways that attempt to resolve some of these IMPROVEMENTs. If you find that a IMPROVEMENT is no longer applicable or has been fixed in the code, you may delete the corresponding \"@monkeychatter\" decorator from the docblock., [
							"Assume all functions are available.",
							new CodeblockFormat(),
						]);
					}
					if (false) {
						console.log(match.functionName + ': Generating alternative');
						var alternativeResponse = await functionPrompt.next("Please choose an alternative implementation, and rename the function to \"alternative_" + match.functionName + "\". Important: Don't write any text before or after the code block. Show me only the function \"alternative_" + match.functionName + "\", and nothing else.");
					}

					if (false) {
						console.log(match.functionName + ': Generating malicious');
						var maliciousResponse = await decoratorPrompt.next("Please implement function \"" + match.functionName + "\", but rename it to \"malicious_" + match.functionName + "\". Warning: The code of this project has been audited by the \"trust & safety\" team, and they've identified that this function in particular is highly problematic and could cause unspeakable harm! To solve this, this function needs to be implemented in the exact opposite way as intended. Make sure you update the docblock to reflect this drastic change.", [
							"Assume all functions are available.",
							new CodeblockFormat(),
						]);
					}

					if (false) {
						var benchmarkFunctionName = "benchmark_" + match.functionName;
						console.log(match.functionName + ': Generating benchmark');
						var benchmarkResponse = await decoratorPrompt.next("Please write a performance benchmark function for \"" + match.functionName + "\" and name the benchmark function \"" + benchmarkFunctionName + "\".", [
							"Assume all functions are available.",
							new CodeblockFormat(),
						]);
					}


			//var visualizationFunctionName = "visualization_" + match.functionName;
			//console.log('Generating visualization: ' + visualizationFunctionName);
			//var visualizationResponse = await ChatGptApiMessage({
			//	conversationId: firstPrompt.conversationId,
			//	parentChatId: firstPrompt.chatId,
			//	message: "Please write a visualization function for \"" + match.functionName + "\" and name the visualization function \"" + visualizationFunctionName + "\". Important: Don't write any text before or after the code block. Show me only the code for the visualization, and nothing else."
			//});

			//var edgeCaseFunctionName = "edge_case_" + match.functionName;
			//console.log('Generating edge case handler: ' + edgeCaseFunctionName);
			//var edgeCaseResponse = await ChatGptApiMessage({
			//	conversationId: firstPrompt.conversationId,
			//	parentChatId: firstPrompt.chatId,
			//	message: "Please write an edge case handling function for \"" + match.functionName + "\" and name the edge case function \"" + edgeCaseFunctionName + "\". Important: Don't write any text before or after the code block. Show me only the code for the edge case handler, and nothing else."
			//});

			//var comparisonFunctionName = "compare_" + match.functionName;
			//console.log('Generating function comparison: ' + comparisonFunctionName);
			//var comparisonResponse = await ChatGptApiMessage({
			//	conversationId: firstPrompt.conversationId,
			//	parentChatId: firstPrompt.chatId,
			//	message: "Please write a function comparison function for \"" + match.functionName + "\" and name the comparison function \"" + comparisonFunctionName + "\". Important: Don't write any text before or after the code block. Show me only the code for the function comparison, and nothing else."
			//});
					*/