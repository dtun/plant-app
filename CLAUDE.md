# Plant App Development Guide

## JavaScript Variable and Function Declaration Rules

### Variable Declarations

**Use `let` as the default for variables:**

- Use `let` for all variables that may be reassigned or modified
- Use `let` for variables with changing values, even if they start undefined
- Use `let` for loop counters, temporary variables, and mutable state

**Use `const` only for true constants:**

- Use `const` exclusively for values that are genuinely constant and will never change
- Examples: configuration values, mathematical constants, API endpoints, enum-like values
- String literals that represent fixed values (e.g., `const API_URL = "https://api.example.com"`)
- Numbers that represent constants (e.g., `const MAX_RETRIES = 3`)
- **Avoid `const` for objects or arrays that will be mutated, even if the reference doesn't change**

### Function Declarations

**Use `function` keyword for function definitions:**

- Always use `function functionName() {}` syntax for named functions
- Use `function` for all standard function declarations
- **Avoid `let functionName = () => {}` or `const functionName = () => {}`**

**Exception handling:**

- If there is a specific technical reason to use `let` or `const` for a function (e.g., conditional function assignment, function reassignment, or callback patterns), explicitly ask for approval and explain the reasoning
- Arrow functions assigned to variables should be rare and justified

### Examples

✅ **Correct:**

```javascript
let userName = "john";
let counter = 0;
const API_ENDPOINT = "https://api.example.com";
const MAX_CONNECTIONS = 10;

function processData() {
  // function body
}

function calculateTotal(items) {
  let sum = 0;
  // calculation logic
  return sum;
}
```

❌ **Incorrect:**

```javascript
const userName = "john"; // userName might change
const items = []; // array will be mutated
let API_ENDPOINT = "https://api.example.com"; // this is a true constant

const processData = () => {
  // should use function declaration
};

let calculateTotal = function (items) {
  // should use function declaration
};
```

### Decision Flow for LLMs

1. **For variables:** Ask "Will this value ever change?" If yes → `let`, If no and it's a true constant → `const`
2. **For functions:** Use `function` declaration unless there's a specific technical exception that requires explanation
3. **When in doubt:** Default to `let` for variables and `function` for functions
