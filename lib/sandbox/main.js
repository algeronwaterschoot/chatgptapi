"use strict";
function fibonacci(n) {
    if (n <= 1) {
        return n;
    }
    else {
        return fibonacci(n - 1) + fibonacci(n - 2);
    }
}
console.log(fibonacci(10));
//# sourceMappingURL=main.js.map