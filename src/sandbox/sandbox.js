const sandbox = document.getElementById("sandbox");

// Create an iframe to serve as the sandbox
const iframe = document.createElement("iframe");
iframe.setAttribute("sandbox", "allow-scripts");
sandbox.appendChild(iframe);

// Get a reference to the iframe's window and document
const win = iframe.contentWindow;
const doc = iframe.contentDocument;

// Define a function that will be called by ts-compiler when the compilation is complete
function onCompileComplete(compiledCode) {
  // Load the compiled code into the sandbox
  const script = doc.createElement("script");
  script.textContent = compiledCode;
  doc.head.appendChild(script);

  // Get a reference to the fibonacci function and call it
  const fibonacci = win.app.fibonacci;
  console.log(fibonacci(10));
}

// Load the main.ts code using an XMLHttpRequest object
const xhr = new XMLHttpRequest();
xhr.open("GET", "main.ts", true);
xhr.onreadystatechange = function() {
  if (xhr.readyState === 4 && xhr.status === 200) {
    // Compile the TypeScript code using ts-compiler
    const mainTsCode = xhr.responseText;
    const compiler = new ts.Compiler();
    compiler.compile(mainTsCode, onCompileComplete);
  }
};
xhr.send();
