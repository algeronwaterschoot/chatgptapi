self.addEventListener('message', (event) => {
  const { id, code } = event.data;

  try {
    const result = eval(code);
    self.postMessage({ id, result, error: null });
  } catch (error) {
    self.postMessage({ id, result: null, error: error.message });
  }
});
