document.getElementById("autoScript").addEventListener("click", () => {
  autoScript().then(response => {alert('Done. You can save your chat message history by typing messageLog in console.')});
});

async function testFunctionString(functionResp, testResp, functionName, functionsArray) {
    let implementedFunction = await cleanupFunctionFragments([functionResp]); implementedFunction = implementedFunction.trim();
    let testFunction = await cleanupFunctionFragments([testResp]); testFunction = testFunction.trim();
	let fnc = await cleanupFunctionFragments(functionsArray);
	fnc = implementedFunction + "\n" + fnc;
    return {
        function: fnc, // Adding in all functions for dependency reasons.
        test: testFunction,
    };
}

async function promptBuilder(parentPrompt, prompts, validations, retries = 0, verbosity = 'log', onFail = 'error', historyDepth = 10) {
  // Throttle
  // await new Promise(r => setTimeout(r, 1000));
  for (let r = 0; r <= retries; r++) {
    try {
	  var response = null;
	  for (let i = 0; i < prompts.length; i++) {
		  if (i == 0){
			if (parentPrompt !== null) {
				response = await parentPrompt.next(prompts[i]); // , parentPrompt.model, historyDepth
				console.log({"Branch": response});
			}
			else {
				response = await new Prompt(prompts[i]); // , 'text-davinci-002-render-sha', historyDepth
				console.log({"New chat": response});
			}
		  }
		  else {
			  response = await response.next(prompts[i]); // , 'text-davinci-002-render-sha', 1
			  console.log({"Reply": response});
		  }
	  }
	  if (Array.isArray(validations) && validations.length > 0) await flagPrompt('', response, validations);
	  break;
    } catch (err) {
		console.error(err);
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
    }
  }
  return response;
}

async function flagPrompt(fn, prmpt, flags){
  const text = `Validate according the following criteria by writing either "PASS" or "FAIL" next to each list item.\n- ${flags.join('\n- ')}\nWrite your response in a list, and don't write any text before or after the list.`;
  console.log("-- Validating");
  let feedback = await prmpt.next([text]); // , prmpt.model, 1
  if (feedback.response.includes('FAIL')) {
	  console.log(feedback);
	  throw new Error(`Function "${fn}" failed validation.`);
  }
}





async function getMockPrompt(fn, stubPrompt, functionsArray) {
	var mockImpl = await stubPrompt.next([`Write a mock implementation for "${fn}" and add a TODO message.`, new CodeblockFormat("Assume all functions are available.")]);
	functionsArray.push(mockImpl.response);
	return mockImpl;
}

async function processFunction(fn, firstPrompt, functionsArray, prompts) {
  console.log('PROCESSING: ' + fn);
  console.log('- Generating stub');
  var newBlock = await addPlaceholderToPromptBlock(`Show me only the code of "${fn}" and its docblock.`, prompts.stub.prompts);
  var stubPrompt = await promptBuilder(firstPrompt, newBlock, prompts.stub.validation, prompts.stub.retries, 'log', prompts.stub.fail, 1);
  var stubCode = await cleanupFunctionFragments([stubPrompt.response]);
  if (!(stubCode.includes(fn))) {
	  throw new Error('Stub code does not contain ' + fn);
  }

  async function parseTestDefinitions(testDefResponse) {
	  if (testDefResponse.response.includes("AFFIRMATIVE")) {
		  var testDefs = await cleanupFunctionFragments([testDefResponse.parent.response]);
	  } else {
		  var testDefs = await cleanupFunctionFragments([testDefResponse.response]);
	  }
	  return testDefs;
  }

  /*
  console.log('- Collecting test scenarios');
  var newBlock = await addPlaceholderToPromptBlock(`"${JSON.stringify(prompts.examples)}"\n\n`, prompts.test_scenarios.prompts);
  var testDefinitionsResponse = await promptBuilder(null, newBlock, prompts.test_scenarios.validation, prompts.test_scenarios.retries, 'log', prompts.test_scenarios.fail);
  console.log('testDefinitionsResponse');
  console.log(testDefinitionsResponse);
  // var testDefinitions = await parseTestDefinitions(testDefinitionsResponse);
  */
  console.log({"Current test scenarios": prompts.examples});
  var testDefinitions = JSON.stringify(prompts.examples);

  /*
  if (stubPrompt.response.includes('@mock')){
	  console.log(`${fn}: Function was flagged for mock. Generating mock implementation instead...`);
	  await getMockPrompt(fn, stubPrompt, functionsArray);
	  return;
  }
  */
  console.log('- Generating function');
  var newBlock = await addPlaceholderToPromptBlock(`These test scenarios have been verified: ${testDefinitions}\n\nImplement this function so it succeeds the tests:\n\n${stubCode}\n`, prompts.function.prompts);
  var functionPrompt = await promptBuilder(null, newBlock, prompts.function.validation, prompts.function.retries, 'log', prompts.function.fail);

  const maxRetriesSingleFunction = 10;


  console.log('- Generating tests');
  async function generateTests(testDefs, testPrompts) {
	  var newBlock = await appendPlaceholderToPromptBlock(testDefs, testPrompts.prompts);
	  var testResp = await promptBuilder(null, newBlock, testPrompts.validation, testPrompts.retries, 'log', testPrompts.fail);
	  return testResp;
  }
  var testResponse = await generateTests(testDefinitions, prompts.test);
  var functionMaster = functionPrompt;
  for (let i = 0; i <= maxRetriesSingleFunction; i++) {
    try {
	  var trackTests = '';
	  async function testCode(functionPrompt, testResponse, fn, functionsArray) {
		  var functionsArrayWithTempTests = functionsArray.map(function(e){return e;});
		  functionsArrayWithTempTests.push(trackTests);
		  var str = await testFunctionString(functionPrompt.response, testResponse.response, fn, functionsArrayWithTempTests);
		  console.log({"Testing the following code:": str});
		  var testResult = await executeJavaScript(str);
		  await new Promise(r => setTimeout(r, 5000)); // TODO: Find out why await doesn't always seem to work.
		  console.log(`${fn}: The test has succeeded!`);
		  var cleanTest = await cleanupFunctionFragments([testResponse.response]); cleanTest = cleanTest.trim();
		  trackTests = trackTests + '\n' + cleanTest;
		  previousSelfHealError = null;
		  previousSelfHealErrorCount = 0;
	  }
	  await testCode(functionPrompt, testResponse, fn, functionsArray);

	  console.log(`${fn}: Creating restore point.`);
	  var implementedFunction = await cleanupFunctionFragments([functionPrompt.response]);
	  functionMaster = functionPrompt;

	  var followupTests = 3;
	  if (followupTests > 0) {
		  console.log(`- Creating test generator branch.`);
		  var baseFollowUpTestDefinitionsResponse = await promptBuilder(null, [[`In my following message, I will ask you a question related to these test scenarios:\n${testDefinitions}`]], [], 0, 'log', 'log');
		  for (let f = 1; f <= followupTests; f++) {
			  console.log(`- Follow-up test attempt #${f}`);
			  try {
				  var followUpTestDefinitionsResponse = await promptBuilder(baseFollowUpTestDefinitionsResponse, prompts.test_scenarios_followup.prompts, prompts.test_scenarios_followup.validation, prompts.test_scenarios_followup.retries, 'log', prompts.test_scenarios_followup.fail);
				  var followUpTestDefinitions = await parseTestDefinitions(followUpTestDefinitionsResponse);
				  try {
					console.log({"Current test scenarios": JSON.parse(followUpTestDefinitions.trim())});
				  } catch (error) {
				    console.log({"Current test scenarios": followUpTestDefinitions});
				  }
				  var followUpTestResponse = await generateTests(followUpTestDefinitions, prompts.test);
				  var newPromptBlock = await addPlaceholderToPromptBlock(`These test scenarios have been verified:\n${testDefinitions}\nThe code for those tests was:\n${implementedFunction}\nThe new tests are:\n${followUpTestDefinitions}\n\nTASKS:\n- Review and if necessary update the code to pass all of the above tests.`, prompts.function.prompts);
				  functionPrompt = await promptBuilder(null, newPromptBlock, prompts.function.validation, prompts.function.retries, 'log', prompts.function.fail);
				  var healingAttempts = 10;
				  for (let g = 1; g <= healingAttempts; g++) {
					  try {
						  await testCode(functionPrompt, followUpTestResponse, fn, functionsArray);
						  implementedFunction = await cleanupFunctionFragments([functionPrompt.response]);
						  functionMaster = functionPrompt;
						  console.log(`${fn}: Advancing test branch.`);
						  baseFollowUpTestDefinitionsResponse = followUpTestDefinitionsResponse;
						  break;
					  } catch(err) {
					  console.log({"Soft error": err.message});
						  if (g <= healingAttempts) {
							  functionPrompt = await selfHealer(functionPrompt, err, prompts, functionMaster, fn);
							  continue;
						  }
					  }
					  console.log(`${fn}: Follow-up test #${g} has failed.`);
				  }
			  } catch(err) {
				  console.log(`${fn}: Error: ${err}`);
				  console.log(`${fn}: Something went wrong while generating new follow-up tests.`);
			  }
		  }
	  }
	  // var testFunction = await cleanupFunctionFragments([testResponse.response]);
	  functionsArray.push(implementedFunction);
	  functionsArray.push(trackTests);

	  return true;
      break;
    } catch (err) {
      console.log({"Soft error": err.message});
      if (i === maxRetriesSingleFunction) {
        console.log(`${fn}: The test has failed too many times.`);
        // console.log(`${fn}: The test has failed too many times. Generating mock implementation instead...`);
		// await getMockPrompt(fn, stubPrompt, functionsArray);
        break;
      }
      console.log(`${fn}: The test has failed.`);
	  functionPrompt = await selfHealer(functionPrompt, err, prompts, functionMaster, fn);
    }
  }
  console.error(`${fn}: Failed to implement.`);
  return false;
}

var previousSelfHealError = null;
var previousSelfHealErrorCount = 0;
async function selfHealer(functionPrompt, err, prompts, functionMaster, fn){
	// Throttling.
	// await new Promise(r => setTimeout(r, 1000));
	var newBlock = await addPlaceholderToPromptBlock(`While testing ${fn}, this error came up: "${err.message}\n"`, prompts.selfheal.prompts);
	if (err.message === previousSelfHealError) {
		++previousSelfHealErrorCount;
		if (previousSelfHealErrorCount <= 2) {
			console.log({"Rerolling self-heal": functionPrompt});
			newBlock = [[`Simplify ${fn} and print in a code block.`]];
			// console.log({"Reflecting on self-heal": functionPrompt});
			// console.log({"Reflecting on self-heal": functionPrompt});
			// newBlock = await appendPlaceholderToPromptBlock("Please review for issues, newBlock);
		}
		else {
			//console.log();
			throw new Error({"Self-heal got stuck. Rerolling tests.": functionPrompt});
		}
	} else {
		console.log({"Self-healing": functionPrompt});
		previousSelfHealError = err.message;
		previousSelfHealErrorCount = 0;
	}
	functionPrompt = await promptBuilder(functionPrompt, newBlock, prompts.selfheal.validation, prompts.selfheal.retries, 'log', prompts.selfheal.fail, 1);
	return functionPrompt;
}

async function addPlaceholderToPromptBlock(line, promptBlock) {
  var newBlock = JSON.parse(JSON.stringify(promptBlock));
  newBlock[0][0] = line;
  return newBlock;
}

async function appendPlaceholderToPromptBlock(line, promptBlock) {
  var newBlock = JSON.parse(JSON.stringify(promptBlock));
  newBlock[0].push(line);
  return newBlock;
}

async function autoScript() {
  const instructions = await loadPromptDefinitions();
  var prompts = instructions.namespaces.autoscript;
  const formats = instructions.namespaces.formats;
  var output = '';
  const userInput = prompt("Ask ChatGPT anything!", prompts.userinput.join('\n'));
  console.log('Generating first response. This might take a while...');
  var newBlock = await addPlaceholderToPromptBlock(`I have the following javascript userscript description: "${userInput}"\n`, prompts.first.prompts);
  const firstPrompt = await promptBuilder(null, newBlock, prompts.first.validation, prompts.first.retries, 'log', prompts.first.fail);
  functions = [];
  maxRetriesAllFunctions = 0;
  var succeededFunctions = [];
  var printfnc = await printFunctions(firstPrompt.response);
	try {
	  for (let i = 0; i <= maxRetriesAllFunctions; i++) {
		for (const match of printfnc) {
		  if (!(succeededFunctions.includes(match.functionName))) {
			var promptsClone = JSON.parse(JSON.stringify(prompts));
			var success = await processFunction(match.functionName, firstPrompt, functions, promptsClone);
			if (success) {
				succeededFunctions.push(match.functionName);
			}
		  }
		}
	  }
	} finally {
		output = await cleanupFunctionFragments(functions);
		console.log(output);
	}
}





		  /*
		  if (match.functionName === "main") {
			console.log(`${match.functionName}: Generating implementation`);
			functions.push((await firstPrompt.next([`Please print (and if necessary, implement) function "${match.functionName}".`, new CodeblockFormat("Assume all functions are available.")])).response);
		  } else await processFunction(match.functionName, firstPrompt, functions);
		  */

		/*
		console.log('Adding "execute" logic...');
		functions.push((await firstPrompt.next(["Please show me how I can execute the \"main\" function. Assume all functions are available. Important: Don't write any text before or after the code block. Show me only the code to execute the \"main\" function, and nothing else."])).response);

		console.log('Adding userscript comment block...');
		functions.unshift((await firstPrompt.next(["I want to run this script as a userscript in Violentmonkey. Please write the comment block I would have to put at the top of the script. Important: Don't write any text before or after the code block. Show me only the comment block, and nothing else."])).response);
		console.log('functionsArray:');
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
      await flagPrompt('', response, ["Does every function have a clear purpose?", "DOes every docblock adequately describe the function, including its parameters return values of it has any?", "Are the functions sorted from least dependencies to most?", "No nested functions.", "No external dependencies."]);
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
      await flagPrompt(fn, response, ["Function has been implemented.", "Failed tests throw an error.", "Tests don't use expect().", "Tests don't use jest.", "Code does not contain a line where the test gets executed.", "No nested functions.", "No external dependencies."]);
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
      await flagPrompt(fn, response, ["Function has been implemented.", "Return value is consistent with docblock.", "No nested functions.", "No external dependencies."]);
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
      // await flagPrompt(fn, response, ["Function has been implemented."]);
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
    var stubPrompt = await first.next([
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
	stubPrompt = await stubPrompt.next([
      `Please update the docblock of function "${fn}" to include some testing criteria.`,
      new CodeblockFormat("Assume all functions are available.")
    ]);
	stubPrompt = await stubPrompt.next([
      `Please update the docblock of function "${fn}" so it conveys the same information with less words.`,
	  // 'If this function intends to make API requests, add the "@mock" decorator.',
      new CodeblockFormat("Assume all functions are available.")
    ]);
	*\/
    try {
      await flagPrompt(fn, stubPrompt, ["Docblock has clear instructions to implement the function.", "Docblock specifies parameter names and data types, if those exist.", "Docblock specifies return value data types, if those exist.", "Docblock contains pseudocode.", "No nested functions.", "No external dependencies."]);
	  return stubPrompt;
    } catch (err) {
      if (i === maxRetries) console.log(`Failed to generate a description for function "${fn}" after ${maxRetries} attempts.`);
    }
  }
  return stubPrompt;
}
*/