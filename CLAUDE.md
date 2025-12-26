# KeepTend Development Guide

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

## AI Integration Architecture

### Provider Abstraction Pattern

- Use AI SDK with createOpenAI() and createAnthropic() for provider abstraction
- Support multiple AI providers (OpenAI, Anthropic) with unified interface
- Store provider choice and API keys in localStorage using expo-sqlite polyfill

### Model Selection Strategy

- **Photo Analysis**: Use vision-capable models (GPT-4o, Claude-3.5-Sonnet)
- **Name Generation**: Use lighter models (GPT-4o-mini, Claude-3-Haiku) for cost efficiency
- Structured error handling with user-friendly messages for common API issues

## Form & Validation Strategy

### React Hook Form + Zod Pattern

- Use `useForm` with `zodResolver` for type-safe validation
- Controller components for controlled form inputs
- Schema-first validation with TypeScript inference using `z.infer`

## State Management Philosophy

### Local State Only

- Use React hooks (`useState`, `useCallback`) for component state
- localStorage for persistent settings only

### State Patterns

- Loading states for async operations (`isGenerating`, `isAnalyzing`)
- Error boundaries handled at component level
- Form state managed by React Hook Form

## UI/UX Patterns

### Theme System

- `useThemeColor` hook for consistent theming
- Support light/dark modes with automatic switching
- Dynamic color application for borders, text, and backgrounds

### Navigation Structure

- Drawer navigation for main app structure
- File-based routing with Expo Router

### Accessibility

- Proper `accessibilityRole`, `accessibilityLabel`, and `accessibilityHint`
- Screen reader support for all interactive elements
- High contrast support through theme system

## Development Workflow

### Code Quality Checks

Before committing code, run the vibecheck script to ensure code quality:

```bash
npm run vibecheck
```

This script runs the following checks in order:

1. **Format check** (`format:check`) - Verifies code formatting with Prettier
2. **Lint** (`lint`) - Checks code quality with ESLint
3. **Type check** (`typecheck`) - Validates TypeScript types
4. **Test** (`test`) - Runs Jest test suite

Individual scripts:

- `npm run format` - Auto-format code with Prettier
- `npm run format:check` - Check formatting without modifying files
- `npm run lint` - Run ESLint checks
- `npm run typecheck` - Run TypeScript compiler checks
- `npm run test` - Run tests

### Code Formatting

This project uses Prettier for consistent code formatting:

- Double quotes for strings
- Semicolons at end of statements
- ES5 trailing commas
- 100 character line width
- 2-space indentation

The format is enforced through Prettier configuration (.prettierrc.json).
