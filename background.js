chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.action === "chatgptapi-getcookies") {
	  // Deprecated.
  }
});