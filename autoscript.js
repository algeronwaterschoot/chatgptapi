/*
document.getElementById("autoScript").addEventListener("click", () => {
  autoScript().then(response => {alert('Done. You may want to save the messageLog in console, for simulating API calls with no delay.')});
});
*/

async function testFunctionString(functionResponse, testResponse, functionName, successfulFunctions) {
    let implementedFunction = await extractCodeFromChatReply([functionResponse]); implementedFunction = implementedFunction.trim();
    let testFunction = await extractCodeFromChatReply([testResponse]); testFunction = testFunction.trim();
	let fnc = await extractCodeFromChatReply(successfulFunctions);
	fnc = implementedFunction + "\n" + fnc;
    return {
        function: fnc, // Adding in all functions for dependency reasons.
        test: testFunction,
    };
}

async function chatBuilder(parentChat, prompts, validations, retries = 0, verbosity = 'log', onFail = 'error', historyDepth = 10) {
  // Throttle
  // await new Promise(r => setTimeout(r, 1000));
  for (let r = 0; r <= retries; r++) {
    try {
	  var response = null;
	  for (let i = 0; i < prompts.length; i++) {
		  if (i == 0){
			if (parentChat !== null) {
				response = await parentChat.next(prompts[i]); // , parentChat.model, historyDepth
				console.log({"Fork subchat": response});
			}
			else {
				response = await new Prompt(prompts[i]); // , 'text-davinci-002-render-sha', historyDepth
				console.log({"New chat": response});
			}
		  }
		  else {
			  response = await response.next(prompts[i]); // , 'text-davinci-002-render-sha', 1
			  console.log({"Additional message": response});
		  }
	  }
	  if (Array.isArray(validations) && validations.length > 0) await validateReply('', response, validations);
	  break;
    } catch (err) {
      if (r === retries) {
		  const msg = `Failed to generate an implementation after ${retries + 1} attempts.`;
		  if (onFail === "error") {
			throw new Error(msg);
		  } else if (onFail === "warn") {
			console.error(msg);
		  } else if (onFail === "log") {
			console.log(msg);
		  }
	  }
	  else {
		  console.log({"Soft error": err.message});
	  }
    }
  }
  return response;
}

async function validateReply(fn, chat, criteria){
  const text = `Validate according the following criteria by writing either "PASS" or "FAIL" next to each list item.\n- ${criteria.join('\n- ')}\nWrite your response in a list, and don't write any text before or after the list.`;
  console.log("-- Validating");
  let feedback = await chat.next([text]); // , chat.model, 1
  if (feedback.response.includes('FAIL')) {
	  console.log(feedback);
	  throw new Error(`Function "${fn}" failed validation.`);
  }
}

/*
async function getMockChat(fn, stubChat, successfulFunctions) {
	var mockImpl = await stubChat.next([`Write a mock implementation for "${fn}" and add a TODO message.`, new CodeblockFormat("Assume all functions are available.")]);
	successfulFunctions.push(mockImpl.response);
	return mockImpl;
}
*/


async function generateTests(testDefs, testPrompts, stubCode) {
  var promptsAtRuntime1 = await getPromptsAtRuntime(`Write javascript functions that test this function: "${stubCode}"`, testPrompts.prompts);
  var promptsAtRuntime2 = await appendPromptsAtRuntime(testDefs, promptsAtRuntime1);
  var testChat = await chatBuilder(null, promptsAtRuntime2, testPrompts.validation, testPrompts.retries, 'log', testPrompts.fail);
  return testChat;
}

async function testCode(functionChat, testChat, fn, successfulFunctions, trackTests) {
  var successfulFunctionsWithTempTests = successfulFunctions.map(function(e){return e;});
  successfulFunctionsWithTempTests.push(trackTests);
  var str = await testFunctionString(functionChat.response, testChat.response, fn, successfulFunctionsWithTempTests);
  console.log({"Testing the following code:": str});
  var testResult = await executeJavaScript(str);
  await new Promise(r => setTimeout(r, 5000)); // TODO: Find out why await doesn't always seem to work.
  console.log(`${fn}: The test has succeeded!`);
  var cleanTest = await extractCodeFromChatReply([testChat.response]); cleanTest = cleanTest.trim();
  trackTests = trackTests + '\n' + cleanTest;
  previousSelfHealError = null;
  previousSelfHealErrorCount = 0;
  return trackTests;
}

async function parseScenarios(testDefResponse) {
  if (testDefResponse.response.includes("AFFIRMATIVE")) {
	  var testDefs = await extractCodeFromChatReply([testDefResponse.parent.response]);
  } else {
	  var testDefs = await extractCodeFromChatReply([testDefResponse.response]);
  }
  return testDefs;
}

async function processFunction(fn, firstChat, successfulFunctions, prompts, funcIndex) {
  console.log('PROCESSING: ' + fn);
  var promptsAtRuntime = await getPromptsAtRuntime(`Show me only the code of "${fn}" and its docblock.`, prompts.stub.prompts);
  var stubChat = await chatBuilder(firstChat, promptsAtRuntime, prompts.stub.validation, prompts.stub.retries, 'log', prompts.stub.fail, 1);
  var stubCode = await extractCodeFromChatReply([stubChat.response]);
  if (!(stubCode.includes(fn))) {
	  throw new Error('Stub code does not contain ' + fn);
  }
  console.log({'Generated stub': stubChat});

  /*
  console.log('- Collecting test scenarios');
  var promptsAtRuntime = await getPromptsAtRuntime(`"${JSON.stringify(prompts.examples)}"\n\n`, prompts.test_scenarios.prompts);
  var testScenariosResponse = await chatBuilder(null, promptsAtRuntime, prompts.test_scenarios.validation, prompts.test_scenarios.retries, 'log', prompts.test_scenarios.fail);
  console.log('testScenariosResponse');
  console.log(testScenariosResponse);
  // var testScenarios = await parseScenarios(testScenariosResponse);
  */
  // console.log({"Current test scenarios": prompts.tasks[funcIndex].examples});
  console.log({"Current test scenarios": prompts.examples});
  // var testScenarios = JSON.stringify(prompts.tasks[funcIndex].examples);
  var testScenarios = JSON.stringify(prompts.examples);

  /*
  if (stubChat.response.includes('@mock')){
	  console.log(`${fn}: Function was flagged for mock. Generating mock implementation instead...`);
	  await getMockChat(fn, stubChat, successfulFunctions);
	  return;
  }
  */
  var promptsAtRuntime = await getPromptsAtRuntime(`These test scenarios have been verified: ${testScenarios}\n\nImplement this function so it succeeds the tests:\n\n${stubCode}\n`, prompts.function.prompts);
  var functionChat = await chatBuilder(null, promptsAtRuntime, prompts.function.validation, prompts.function.retries, 'log', prompts.function.fail);
  console.log({'Generated function': functionChat});

  const maxInitialRetriesSingleFunction = 10;

  var testChat = await generateTests(testScenarios, prompts.test, stubCode);
  console.log({'Generated tests': testChat});
  var functionMaster = functionChat;
  for (let i = 0; i <= maxInitialRetriesSingleFunction; i++) {
    try {
	  var trackTests = await testCode(functionChat, testChat, fn, successfulFunctions, '');
	  var implementedFunction = await extractCodeFromChatReply([functionChat.response]);
	  functionMaster = functionChat;
	  console.log({"Created restore point": functionMaster});

	  var followupTests = 3;
	  if (followupTests > 0) {
		  var scenarioRestorePoint = await chatBuilder(null, [[`In my following message, I will ask you a question related to these test scenarios:\n${testScenarios}`]], [], 0, 'log', 'log');
		  console.log({"Created scenario writer": scenarioRestorePoint});
		  for (let f = 1; f <= followupTests; f++) {
			  console.log(`- Follow-up test attempt #${f}`);
			  try {
				  var scenariosByGPT = await chatBuilder(scenarioRestorePoint, prompts.test_scenarios_followup.prompts, prompts.test_scenarios_followup.validation, prompts.test_scenarios_followup.retries, 'log', prompts.test_scenarios_followup.fail);
				  var moreScenarios = await parseScenarios(scenariosByGPT);
				  try {
					console.log({"Current test scenarios": JSON.parse(moreScenarios.trim())});
				  } catch (error) {
				    console.log({"Current test scenarios": moreScenarios});
				  }
				  var moreTestsChat = await generateTests(moreScenarios, prompts.test, stubCode);
				  var testPromptsAtRuntime = await getPromptsAtRuntime(`These test scenarios have been verified:\n${testScenarios}\nThe code for those tests was:\n${implementedFunction}\nThe new tests are:\n${moreScenarios}\n\nTASKS:\n- Review and if necessary update the code to pass all of the above tests.`, prompts.function.prompts);
				  functionChat = await chatBuilder(null, testPromptsAtRuntime, prompts.function.validation, prompts.function.retries, 'log', prompts.function.fail);
				  var healingAttempts = 10;
				  for (let g = 1; g <= healingAttempts; g++) {
					  try {
						  trackTests = await testCode(functionChat, moreTestsChat, fn, successfulFunctions, trackTests);
						  implementedFunction = await extractCodeFromChatReply([functionChat.response]);
						  functionMaster = functionChat;
						  console.log({"Updated restore point": functionMaster});
						  scenarioRestorePoint = scenariosByGPT;
						  console.log({"Queueing up the next tests": scenarioRestorePoint});
						  break;
					  } catch(err) {
					  console.log({"Soft error": err.message});
						  if (g <= healingAttempts) {
							  functionChat = await selfHealer(functionChat, err, prompts, functionMaster, fn);
							  continue;
						  }
					  }
					  console.log(`${fn}: Follow-up test #${g} has failed.`);
				  }
			  } catch(err) {
				  console.trace(`${fn}: Error: ${err}`);
				  console.log(`${fn}: Something went wrong while generating new follow-up tests.`);
			  }
		  }
	  }
	  // var testFunction = await extractCodeFromChatReply([testChat.response]);
	  successfulFunctions.push(implementedFunction);
	  successfulFunctions.push(trackTests);

	  return true;
      break;
    } catch (err) {
      console.log({"Soft error": err.message});
      if (i === maxInitialRetriesSingleFunction) {
        console.log(`${fn}: The test has failed too many times.`);
        // console.log(`${fn}: The test has failed too many times. Generating mock implementation instead...`);
		// await getMockChat(fn, stubChat, successfulFunctions);
        break;
      }
      console.log(`${fn}: The test has failed.`);
	  functionChat = await selfHealer(functionChat, err, prompts, functionMaster, fn);
    }
  }
  console.error(`${fn}: Failed to implement.`);
  return false;
}

var previousSelfHealError = null;
var previousSelfHealErrorCount = 0;
async function selfHealer(functionChat, err, prompts, functionMaster, fn){
	// Throttling.
	// await new Promise(r => setTimeout(r, 1000));
	var promptsAtRuntime = await getPromptsAtRuntime(`While testing ${fn}, this error came up: "${err.message}\n"`, prompts.selfheal.prompts);
	if (err.message === previousSelfHealError && ++previousSelfHealErrorCount >= 2) {
		/*
		if (previousSelfHealErrorCount <= 2) {
			console.log({"Rerolling self-heal": functionChat});
			promptsAtRuntime = [[`Simplify ${fn} and print in a code block.`]];
			// console.log({"Reflecting on self-heal": functionChat});
			// console.log({"Reflecting on self-heal": functionChat});
			// promptsAtRuntime = await appendPromptsAtRuntime("Please review for issues, promptsAtRuntime);
		}
		else {
			//console.log();
			throw new Error({"Self-heal got stuck. Rerolling tests.": functionChat});
		}
		*/
		throw new Error({"Self-heal got stuck. Rerolling tests.": functionChat});
	} else {
		console.log({"Self-healing": functionChat});
		previousSelfHealError = err.message;
		previousSelfHealErrorCount = 0;
	}
	functionChat = await chatBuilder(functionChat, promptsAtRuntime, prompts.selfheal.validation, prompts.selfheal.retries, 'log', prompts.selfheal.fail, 1);
	return functionChat;
}

async function getPromptsAtRuntime(line, prompts) {
  var promptsAtRuntime = JSON.parse(JSON.stringify(prompts));
  promptsAtRuntime[0][0] = line;
  return promptsAtRuntime;
}

async function appendPromptsAtRuntime(line, prompts) {
  var promptsAtRuntime = JSON.parse(JSON.stringify(prompts));
  promptsAtRuntime[0].push(line);
  return promptsAtRuntime;
}

async function autoScript() {
    const instructions = await loadPromptDefinitions(), prompts = instructions.namespaces.autoscript;
    let output = '', userInput = prompt("Ask ChatGPT anything!", prompts.userinput.join('\n'));
    
    console.log('Generating first response. This might take a while...');
    const promptsAtRuntime = await getPromptsAtRuntime(`I have the following javascript userscript description: "${userInput}"\n`, prompts.first.prompts);
    const firstChat = await chatBuilder(null, promptsAtRuntime, prompts.first.validation, prompts.first.retries, 'log', prompts.first.fail);

    let functions = [], maxRetriesAllFunctions = 0, successfulFunctions = [], printfnc = await printFunctions(firstChat.response);
    
    try {
        for (let i = 0; i <= maxRetriesAllFunctions; i++) {
            let funcIndex = -1;
            for (const match of printfnc) {
                funcIndex++;
                if (!successfulFunctions.includes(match.functionName)) {
                    const success = await processFunction(match.functionName, firstChat, functions, prompts, funcIndex);
                    if (success) successfulFunctions.push(match.functionName);
                }
            }
        }
    } finally {
        output = await extractCodeFromChatReply(functions);
        console.log(output);
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        await chrome.tabs.sendMessage(tabs[0].id, { action: "chatgptapi-messagelog" });
    }
}






		  /*
		  if (match.functionName === "main") {
			console.log(`${match.functionName}: Generating implementation`);
			functions.push((await firstChat.next([`Please print (and if necessary, implement) function "${match.functionName}".`, new CodeblockFormat("Assume all functions are available.")])).response);
		  } else await processFunction(match.functionName, firstChat, functions);
		  */

		/*
		console.log('Adding "execute" logic...');
		functions.push((await firstChat.next(["Please show me how I can execute the \"main\" function. Assume all functions are available. Important: Don't write any text before or after the code block. Show me only the code to execute the \"main\" function, and nothing else."])).response);

		console.log('Adding userscript comment block...');
		functions.unshift((await firstChat.next(["I want to run this script as a userscript in Violentmonkey. Please write the comment block I would have to put at the top of the script. Important: Don't write any text before or after the code block. Show me only the comment block, and nothing else."])).response);
		console.log('successfulFunctions:');
		console.log(functions);
		*/


/*
async function getFirstPrompt() {
  // const userInput = prompt("Ask ChatGPT anything!", "A blue button gets shown in the top right corner of the page. When I click on it, it should get the current Tesla stock price, and show it to me in a popup.");
  const userInput = prompt("Ask ChatGPT anything!", "Requirements:\n- replaceClass(code, newCode)\n- replaceFunction(code, newCode)\n- replaceMethod(code, Newcode)\n- replaceConstructor(code, newCode)\n- renameFunction(old, new, code)\n- renameClass(old, new, code)\n- renameMethod(old, new, code)\n- The replacements will be happening in a string.\n- All parameters are of type string\n- Output for all functions is of type string.", "Take extra care to test for various formattings and line indents.");
  console.log('Generating first response. This might take a while...');

  // const response = await new Prompt(["I have the following javascript userscript description:", userInput, {Query: ["I want you to split this up into smaller functions.", 'The main function will be called "main".', "Add as many helper functions as needed.", "Do not implement any of the functions.", "Add a docblock to each function, and make the docblock as detailed as you possibly can; the docblock should contain all the information necessary for a developer to implement and test the function independently.", "The docblock should describe every parameter and return value, even if the function returns nothing."]}, new CodeblockFormat()]);
  const maxRetries = 2;
  for (let i = 1; i <= maxRetries; i++) {
    try {
		var response = await new Prompt(["I have the following javascript userscript description:", userInput, {Query: ["I want you to split this up into smaller functions.", "Add as many helper functions as needed.", "Do not implement any of the functions.", "Add a docblock to each function, and make the docblock as detailed as you possibly can; the docblock should contain all the information necessary for a developer to implement and test the function.", "The docblock should describe every parameter and return value, even if the function returns nothing."]}, new CodeblockFormat()]);
		console.log(response);
      response = await response.next(["Move the comments of each function into their docblocks.", "Update the docblocks so it conveys the same information with less words.", "Sort the functions so that the ones with the lowest number of dependencies on other functions are at the top.", new CodeblockFormat()]);
      await validateReply('', response, ["Does every function have a clear purpose?", "DOes every docblock adequately describe the function, including its parameters return values of it has any?", "Are the functions sorted from least dependencies to most?", "No nested functions.", "No external dependencies."]);
	  return response;
    } catch (err) {
      console.log(`${err.message}`);
      if (i === maxRetries) throw new Error(`Failed to generate an implementation after ${maxRetries} attempts.`);
    }
  }
  return response;
}
*/

/*

async function getTestResponse_old(fn, stub) {
  const maxRetries = 2;
  for (let i = 1; i <= maxRetries; i++) {
    try {
      console.log(`${fn}: Generating test`);
      let response = await stub.next([`Please implement an async function for "${fn}" and name it "test_${fn}".`, `It should test whether "${fn}" is working correctly.`, `If the test fails, "test_${fn}" should throw an error.`, "Do not use \"expect()\" or \"jest\".", "Update the docblock so it conveys the same information with less words", new CodeblockFormat("Assume all functions are available.")]);
      await validateReply(fn, response, ["Function has been implemented.", "Failed tests throw an error.", "Tests don't use expect().", "Tests don't use jest.", "Code does not contain a line where the test gets executed.", "No nested functions.", "No external dependencies."]);
	  return response;
    } catch (err) {
      console.log(`${fn}: ${err.message}`);
      if (i === maxRetries) console.log(`Failed to generate a test for function "${fn}" after ${maxRetries} attempts.`);
    }
  }
  return response;
}

async function getFunctionPrompt_old(fn, first) {
  const maxRetries = 2;
  for (let i = 1; i <= maxRetries; i++) {
    try {
      console.log(`${fn}: Generating implementation`);
      var response = await first.next([`Please implement function "${fn}".`, "Update the docblock so it conveys the same information with less words", new CodeblockFormat("Assume all functions are available.")]);
      await validateReply(fn, response, ["Function has been implemented.", "Return value is consistent with docblock.", "No nested functions.", "No external dependencies."]);
	  return response;
    } catch (err) {
      console.log(`${fn}: ${err.message}`);
      if (i === maxRetries) console.log(`Failed to generate an implementation for function "${fn}" after ${maxRetries} attempts.`);
    }
  }
  return response;
}

async function getNextFunctionPrompt_old(fn, funcp, test_code, error) {
  const maxRetries = 2;
  for (let i = 1; i <= maxRetries; i++) {
    try {
      console.log(`${fn}: Debugging implementation`);
      var response = await funcp.next(["The script failed with the following error: " + error, "Please show me an improvement or alternative.", "I want you to only make suggestions to change the " + fn + " function.", "Here is the javascript:", test_code, new CodeblockFormat()]);
      // await validateReply(fn, response, ["Function has been implemented."]);
	  return response;
    } catch (err) {
      console.log(`${fn}: ${err.message}`);
      if (i === maxRetries) console.log(`Failed to debug an implementation for function "${fn}" after ${maxRetries} attempts.`);
    }
  }
  return response;
}

async function getStubPrompt_old(fn, first) {
  const maxRetries = 2;
  for (let i = 1; i <= maxRetries; i++) {
    console.log(`${fn}: Generating description`);
    var stubChat = await first.next([
      `Please update the docblock of function "${fn}" with the most relevant you can think of.`,
	  "Move as much information from the comments into the docblock.",
      "Add the pseudocode to the docblock that describes the way this function could be implemented.",
      "If the function declares any parameters, add their names and data types to the docblock.",
      "If the function has any return values, add their names and data types to the docblock.",
      `Please update the docblock of function "${fn}" to include some testing criteria.`,
      `Please update the docblock of function "${fn}" so it conveys the same information with less words.`,
      new CodeblockFormat("Assume all functions are available.")
    ]);
	/*
	stubChat = await stubChat.next([
      `Please update the docblock of function "${fn}" to include some testing criteria.`,
      new CodeblockFormat("Assume all functions are available.")
    ]);
	stubChat = await stubChat.next([
      `Please update the docblock of function "${fn}" so it conveys the same information with less words.`,
	  // 'If this function intends to make API requests, add the "@mock" decorator.',
      new CodeblockFormat("Assume all functions are available.")
    ]);
	*\/
    try {
      await validateReply(fn, stubChat, ["Docblock has clear instructions to implement the function.", "Docblock specifies parameter names and data types, if those exist.", "Docblock specifies return value data types, if those exist.", "Docblock contains pseudocode.", "No nested functions.", "No external dependencies."]);
	  return stubChat;
    } catch (err) {
      if (i === maxRetries) console.log(`Failed to generate a description for function "${fn}" after ${maxRetries} attempts.`);
    }
  }
  return stubChat;
}
*/