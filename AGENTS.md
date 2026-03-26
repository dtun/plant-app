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

**Important: Mutability vs. Reassignment**

JavaScript's `const` prevents reassignment but does NOT prevent mutation. While `const items = []; items.push(1)` is technically valid JavaScript, we use `let` for mutable data structures to clearly indicate they will change:

```javascript
// ❌ Incorrect - const with mutable array
const items = [];
items.push(1); // This works in JavaScript, but violates our convention

// ✅ Correct - let for mutable array
let items = [];
items.push(1);

// ❌ Incorrect - const with mutable object
const config = {};
config.apiKey = "abc123"; // This works, but we avoid it

// ✅ Correct - let for mutable object
let config = {};
config.apiKey = "abc123";
```

Our rule: If you intend to mutate it (push, pop, modify properties, etc.), use `let`.

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

- **Photo Analysis**: Use vision-capable models (gpt-4o, claude-sonnet-4-6)
- **Name Generation**: Use lighter models (gpt-4o-mini, claude-haiku-4-5-20251001) for cost efficiency
- Structured error handling with user-friendly messages for common API issues

## Internationalization (Lingui v5)

- All user-facing strings must use Lingui for i18n support
- In components: `let { t } = useLingui()` then `` t`translatable string` `` for template literals
- In JSX: `<Trans>translatable text</Trans>` for inline translations
- Imports: `useLingui` from `@lingui/react/macro`, `Trans` from `@lingui/react/macro`
- Utility files use `msg` + `i18n._()` from `@lingui/core/macro`
- Zod schemas using `t` must be inside components with `useMemo` keyed on `[t]`

## Context Provider Pattern

- Contexts live in `apps/mobile/contexts/` directory
- Follow `{Name}Provider` + `use{Name}()` hook pattern
- Example: `ComposerProvider` component + `useComposer()` hook
- Chat screen uses stacked providers: ChatProvider > MessageListProvider > ComposerProvider > ChatLayout

## Form & Validation Strategy

### React Hook Form + Zod Pattern

- Use `useForm` with `zodResolver` for type-safe validation
- Controller components for controlled form inputs
- Schema-first validation with TypeScript inference using `z.infer`

## State Management

### LiveStore (Persistent App Data)

- Plants, messages, and users are stored via LiveStore with event-sourced architecture
- Schema defined in `apps/mobile/src/livestore/schema.ts` (Events → Tables → Materializers)
- Queries defined in `apps/mobile/src/livestore/queries.ts` (reactive query factories with `$` suffix)
- Write data with `store.commit(events.eventName({...}))` via `useStore()`
- Read data with `useQuery(queryFactory$(params))` from `@livestore/react`
- `LiveStoreProvider` wraps the app in `app/_layout.tsx`

### UI State (Temporary)

- Use React hooks (`useState`, `useCallback`) for component-level UI state
- Loading states for async operations (`isGenerating`, `isAnalyzing`)
- Form state managed by React Hook Form

### Settings (Simple Persistent)

- AI API keys and provider choice stored in localStorage via expo-sqlite polyfill

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
cd apps/mobile && npm run vibecheck
```

This script runs the following checks in order:

1. **Lint** (`lint`) - Checks code quality with ESLint
2. **Type check** (`typecheck`) - Validates TypeScript types
3. **Test** (`test`) - Runs Jest test suite

Formatting is handled automatically by a PostToolUse hook that runs Prettier after every Write/Edit operation (configured in `.claude/settings.json`).

Individual scripts (run from `apps/mobile/`):

- `npm run format` - Auto-format code with Prettier (also available from root)
- `npm run lint` - Run ESLint checks
- `npm run typecheck` - Run TypeScript compiler checks
- `npm run test` - Run tests

### Monorepo Structure

This project uses npm workspaces. The root `package.json` defines workspaces at `apps/*` and `packages/*`.

- **`apps/mobile/`** - Expo React Native app (`@keeptend/mobile`)
- **`apps/web/`** - Web app placeholder (`@keeptend/web`)
- **`packages/`** - Shared packages (future)

Shared devDeps (prettier, eslint, husky, commitlint) live at the root. App-specific deps live in each workspace.

### Testing

This project uses **Jest** as the testing framework (not Vitest).

**Test Configuration:**

- Jest is configured in `apps/mobile/package.json` and `apps/mobile/jest.setup.js`
- Test setup file: `apps/mobile/jest.setup.js` (runs before all tests)
- Uses `jest-expo` preset for React Native compatibility
- Manual mocks are placed in `apps/mobile/__mocks__/` directories

**Mock Structure:**

- External package mocks: `apps/mobile/__mocks__/package-name.ts`
- Scoped package mocks: `apps/mobile/__mocks__/@scope/package-name.ts`
- Local module mocks: `apps/mobile/src/path/__mocks__/module.ts`

**Running Tests:**

```bash
cd apps/mobile
npm run test        # Run all tests
npm run vibecheck   # Run lint, typecheck, and tests
```

### Code Formatting

This project uses Prettier for consistent code formatting:

- Double quotes for strings
- Semicolons at end of statements
- ES5 trailing commas
- 100 character line width
- 2-space indentation

The format is enforced through Prettier configuration (.prettierrc.json).

### Commit Conventions

This project uses [Conventional Commits](https://www.conventionalcommits.org/). All commits must follow this format:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```
