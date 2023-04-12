document.getElementById("analyzeBtn").addEventListener("click", () => {
  ChatGptApiMessage(prompt("Ask ChatGPT anything!", "Give me a list of 3 colors.")).then(response => {
    console.log(response);
    alert(response);
  });
});

async function ChatGptApiMessage(message){
  var cookies = await chrome.cookies.getAll({ domain: "chat.openai.com" });
  var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  var response = await chrome.tabs.sendMessage(tabs[0].id, { action: "chatgptapi-message", cookies: cookies, message: message });
  return response;
}