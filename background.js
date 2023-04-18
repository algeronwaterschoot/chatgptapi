

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {

  if (message.action === "chatgptapi-getcookies") {
	  // Deprecated.
  }
});



//var testf = new Function('number', 'return number * 2');
//console.log(testf(5));
/*
	// Load test dependencies in sandbox.
	fetch('lib/jasmine/jasmine.js')
	  .then(response => response.text())
	  .then(contents => {
		executeJavaScript(contents);
	  });
	fetch('lib/jasmine/jasmine-html.js')
	  .then(response => response.text())
	  .then(contents => {
		executeJavaScript(contents);
	  });
	fetch('lib/jasmine/boot.js')
	  .then(response => response.text())
	  .then(contents => {
		executeJavaScript(contents);
	  });*/