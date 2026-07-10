# KeepTend Development Guide

## JavaScript Variable and Function Declarations

Enforced by ESLint (`func-style`, `prefer-const` off); rationale in `docs/adr/0002-let-by-default-const-for-true-constants.md`. What the linter can't check:

- `let` by default; `const` only for true constants.
- Mutation counts as change: a value that gets pushed to or has properties written is `let`, even if never reassigned.
- Use the `function` keyword; assigning an arrow function to a variable needs approval and a stated reason.

## AI Integration

AI capabilities (plant naming, photo description, chat) go through the `PlantIntelligence` seam — see `CONTEXT.md`. The interface is operation-shaped and provider-agnostic: callers never see provider names, model names, or API keys, and failures cross the seam as a typed `AIFailure`, never as thrown errors. Provider wiring, config resolution, and model selection (vision-capable models for photo analysis, lighter models for name generation) are private to the adapter in `apps/mobile/src/intelligence/`.

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

## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues (dtun/plant-app) via the `gh` CLI; external PRs are also a triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage labels are used as-is: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
