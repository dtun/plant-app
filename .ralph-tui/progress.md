# Ralph Progress Log

This file tracks progress across iterations. Agents update this file
after each iteration and it's included in prompts for context.

## Codebase Patterns (Study These First)

- **Test mocking pattern**: Global mocks in `jest.setup.js` cover `uniwind`, `expo-sqlite`, `expo-constants`, `expo-file-system`, `expo-crypto`, `@livestore/*`, and `@/src/livestore/schema`. Screen-level tests need additional mocks for `expo-router`, UI components, and utility modules.
- **LegendList mock for tests**: Mock `@legendapp/list` by returning RN's FlatList: `jest.mock("@legendapp/list", () => { let { FlatList } = require("react-native"); return { LegendList: FlatList }; })`. Requires `eslint-disable` for the `require()` call inside `jest.mock`.
- **LegendList ref type**: Use `LegendListRef` (not generic `LegendList<T>`) for refs. Supports `scrollToEnd`, `scrollToIndex`, `scrollIndexIntoView`, etc.
- **useQuery mock**: `useQuery` from `@livestore/react` is mocked as `jest.fn(() => [])`. Override with `mockReturnValue` or `mockImplementation` per-test. Multiple `useQuery` calls in a component need a counter-based mock to return different data for each call.

---

## 2026-02-07 - US-001

- Migrated chat screen FlatList to LegendList from `@legendapp/list`
- Added `estimatedItemSize={80}` for mixed message/separator content
- Ref type changed from `FlatList` to `LegendListRef`
- All existing props preserved: keyExtractor, renderItem, ListFooterComponent, ListEmptyComponent, contentContainerStyle, keyboardDismissMode, keyboardShouldPersistTaps, onContentSizeChange
- scrollToEnd auto-scroll behavior preserved via LegendListRef
- Created basic render test with empty state and message rendering tests
- Files changed:
  - `app/chat/[plantId].tsx` — FlatList → LegendList migration
  - `app/chat/chat-screen.test.tsx` — new test file (2 tests)
  - `package.json` — added `@legendapp/list` dependency
- **Learnings:**
  - LegendList is nearly drop-in for FlatList. The main differences: (1) requires `estimatedItemSize` prop, (2) ref type is `LegendListRef` not generic
  - `LegendListRef` exposes the same `scrollToEnd({ animated })` API as FlatList, plus extra methods like `scrollIndexIntoView` and `scrollItemIntoView`
  - `jest.mock` factory functions are synchronous, so `require()` is necessary inside them (not `import`). This triggers the `@typescript-eslint/no-require-imports` lint rule — suppress with inline eslint-disable comment

---
