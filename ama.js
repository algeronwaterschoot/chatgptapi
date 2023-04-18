document.getElementById("analyzeBtn").addEventListener("click", () => {
	new Prompt([
        prompt("Ask ChatGPT anything!", "Give me a list of 3 colors.")
    ]).then(response => {
		console.log(response.response);
		alert(response.response);
    });
});