# PRD: High-Performance List Rendering

## Overview
Replace stock React Native FlatList with purpose-built list libraries in the chat screen and chats list screen to improve rendering performance with dynamic-height items and frequent data updates. This is foundational work to support a better UX in future iterations (AI streaming, large conversations). The plant form screen is explicitly out of scope.

## Goals
- Replace FlatList with LegendList (`@legendapp/list`) in the chat screen (`app/chat/[plantId].tsx`) for better handling of dynamic-height message bubbles
- Replace FlatList with FlashList (`@shopify/flash-list`) in the chats list screen (`app/(drawer)/chats.tsx`) for efficient rendering of fixed-height chat rows
- Preserve all existing scroll behavior (auto-scroll-to-bottom, keyboard dismiss, etc.)
- Add minimal tests for the migrated screens using a bare-bones TDD approach
- Ensure zero regressions — all existing tests and quality checks continue to pass

## Quality Gates

These commands must pass for every user story:
- `npm run vibecheck` (runs lint, typecheck, and test)

## User Stories

### US-001: Migrate chat screen FlatList to LegendList
As a developer, I want the chat screen to use LegendList instead of FlatList so that dynamic-height message bubbles render more efficiently.

**Acceptance Criteria:**
- [ ] `@legendapp/list` is installed as a dependency
- [ ] `app/chat/[plantId].tsx` imports from `@legendapp/list` instead of `FlatList` from `react-native`
- [ ] LegendList receives an `estimatedItemSize` prop (use a reasonable estimate for mixed message/separator content, e.g. 80)
- [ ] Existing `ref` usage is preserved — `scrollToEnd` and `onContentSizeChange` auto-scroll behavior works as before
- [ ] `keyExtractor`, `renderItem`, `ListFooterComponent`, `ListEmptyComponent`, `contentContainerStyle`, `keyboardDismissMode`, and `keyboardShouldPersistTaps` props are all carried over
- [ ] Mixed item types (message bubbles + day separators) render correctly
- [ ] A basic render test exists for the chat screen (e.g. renders without crashing, shows empty state)

### US-002: Migrate chats list screen FlatList to FlashList
As a developer, I want the chats list screen to use FlashList instead of FlatList so that the list of chat conversations renders efficiently with image thumbnails.

**Acceptance Criteria:**
- [ ] `@shopify/flash-list` is installed as a dependency
- [ ] `app/(drawer)/chats.tsx` imports `FlashList` from `@shopify/flash-list` instead of `FlatList` from `react-native`
- [ ] FlashList receives an `estimatedItemSize` prop (approximately 72 based on ChatListItem height)
- [ ] `keyExtractor` and `renderItem` props are carried over
- [ ] ChatListItem components render correctly with name, photo, last message, and timestamp
- [ ] A basic render test exists for the chats list screen (e.g. renders without crashing, renders list items)

## Functional Requirements
- FR-1: The chat screen must use LegendList from `@legendapp/list` as its list component
- FR-2: The chat screen must preserve auto-scroll-to-bottom behavior when new messages appear
- FR-3: The chat screen must continue to support mixed item types (MessageBubble and DaySeparator) in a single list
- FR-4: The chats list screen must use FlashList from `@shopify/flash-list` as its list component
- FR-5: The chats list screen must provide `estimatedItemSize={72}` to FlashList based on ChatListItem height
- FR-6: Both screens must preserve existing keyboard handling (`keyboardDismissMode`, `keyboardShouldPersistTaps`) where applicable
- FR-7: The plant form screen (`components/plant-form.tsx`) must NOT be modified

## Non-Goals
- AI streaming optimization (future PRD)
- Benchmarking or performance measurement
- Migrating the plant form FlatList
- Adding `maintainVisibleContentPosition` or new scroll behaviors
- Comprehensive UI test coverage — only bare-bones render tests

## Technical Considerations
- LegendList supports the same API surface as FlatList, so migration should be a near drop-in replacement
- LegendList's `ref` type may differ from FlatList — verify `scrollToEnd` is available on the LegendList ref
- FlashList requires `estimatedItemSize` — ChatListItem is approximately 72px tall based on its padding and content structure
- FlashList may require items to have a defined height or `overrideItemLayout` for optimal performance
- Both libraries support `keyboardDismissMode` and `keyboardShouldPersistTaps`
- No existing tests cover these screens, so new tests can be written without worrying about test migration
- Existing test infrastructure uses Jest with `jest-expo` preset and `@testing-library/react-native`

## Success Metrics
- All existing tests pass (`npm run vibecheck`)
- New basic tests pass for both migrated screens
- Chat screen preserves auto-scroll and all existing UX behavior
- Chats list screen renders correctly with FlashList

## Open Questions
- Does LegendList's ref expose `scrollToEnd` with the same signature as FlatList? If not, what is the equivalent API?
- Are there any Expo-specific compatibility concerns with either library?