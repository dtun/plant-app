# PRD: Replace KeyboardAvoidingView with KeyboardStickyView

## Overview
The chat screen and home screen use `KeyboardAvoidingView` with platform-specific behavior and hardcoded vertical offsets (100px on iOS). This is brittle across device sizes and iOS versions. This PRD replaces `KeyboardAvoidingView` entirely with `KeyboardStickyView` from `react-native-keyboard-controller` (already installed) and native `contentInset` management on scroll/list views. This fixes keyboard overlap bugs, eliminates hardcoded offsets, and improves animation smoothness.

## Goals
- Eliminate all hardcoded keyboard offset values across the app
- Remove `KeyboardAvoidingView` usage entirely in favor of `KeyboardStickyView`
- Use native `contentInset` on message/scroll lists so content flows above the composer without layout hacks
- Auto-scroll the message list to the bottom when the keyboard opens
- Improve keyboard animation smoothness using Reanimated shared values

## Quality Gates

These commands must pass for every user story:
- `npm run vibecheck` — lint, typecheck, and test

All commits must follow [Conventional Commits](https://www.conventionalcommits.org/) format.

## User Stories

### US-001: Add composer height tracking via shared value
As a developer, I want to track the chat composer's height in a Reanimated shared value so that the message list's contentInset can react to composer size changes.

**Acceptance Criteria:**
- [ ] `components/ui/chat-input.tsx` reports its height via an `onLayout` callback
- [ ] A Reanimated shared value holds the current composer height
- [ ] The shared value updates when the composer height changes (e.g., multiline expansion)
- [ ] No hardcoded height values are introduced

### US-002: Replace KeyboardAvoidingView with KeyboardStickyView on chat screen
As a user, I want the chat composer to stick to the top of the keyboard so that I can always see what I'm typing without overlap or offset bugs.

**Acceptance Criteria:**
- [ ] `KeyboardAvoidingView` is removed from `app/chat/[plantId].tsx`
- [ ] `KeyboardStickyView` from `react-native-keyboard-controller` wraps the composer input
- [ ] The composer animates smoothly with the keyboard open/close
- [ ] No hardcoded vertical offset values remain in the chat screen
- [ ] Works correctly on iOS (the primary platform with keyboard issues)

### US-003: Use native contentInset for message list keyboard adjustment
As a user, I want the message list to naturally make room for the composer and keyboard so that messages aren't hidden behind the input area.

**Acceptance Criteria:**
- [ ] The message list (`FlashList` or `FlatList`) uses `contentInset.bottom` driven by the composer height shared value
- [ ] When the keyboard opens, the list content inset adjusts so messages remain visible
- [ ] When the keyboard closes, the inset returns to the composer-only height
- [ ] No layout hacks or absolute positioning workarounds are used

### US-004: Auto-scroll message list to bottom on keyboard open
As a user, I want the message list to scroll to the latest message when the keyboard opens so that I can see the conversation context while typing.

**Acceptance Criteria:**
- [ ] When the keyboard opens, the message list scrolls to the bottom
- [ ] The scroll is animated (not a jarring jump)
- [ ] This works on both initial keyboard open and subsequent opens

### US-005: Replace KeyboardAvoidingView on home screen
As a user, I want the home screen to handle keyboard appearance smoothly without hardcoded offsets.

**Acceptance Criteria:**
- [ ] `KeyboardAvoidingView` is removed from `app/(drawer)/index.tsx`
- [ ] `KeyboardStickyView` (or equivalent from `react-native-keyboard-controller`) wraps the relevant input area
- [ ] No hardcoded vertical offset values remain on the home screen
- [ ] Existing home screen functionality is preserved

### US-006: Remove all KeyboardAvoidingView imports and dead code
As a developer, I want all traces of KeyboardAvoidingView removed from the codebase so that there's no confusion about which keyboard handling approach to use.

**Acceptance Criteria:**
- [ ] No file in the project imports `KeyboardAvoidingView` from `react-native`
- [ ] Any unused keyboard-related constants or helpers (e.g., hardcoded offset values) are removed
- [ ] The project passes `npm run vibecheck` with no regressions

## Functional Requirements
- FR-1: The composer must remain pinned to the top of the keyboard when it is open
- FR-2: The message list must use `contentInset.bottom` to account for composer + keyboard height
- FR-3: The `contentInset.bottom` value must be driven by a Reanimated shared value tracking composer height
- FR-4: The message list must auto-scroll to the bottom when the keyboard opens
- FR-5: All keyboard transitions must be animated (no layout jumps)
- FR-6: The home screen must use `KeyboardStickyView` instead of `KeyboardAvoidingView`
- FR-7: Zero hardcoded keyboard offset values in the codebase after migration

## Non-Goals
- Android-specific keyboard handling optimizations (Android `windowSoftInputMode` is out of scope)
- Refactoring the chat input component beyond adding `onLayout`
- Changing the visual design of the composer or message bubbles
- Adding keyboard dismiss gestures or interactive keyboard dismissal

## Technical Considerations
- `react-native-keyboard-controller` is already installed and `KeyboardProvider` is already in the root layout (`app/_layout.tsx`)
- `KeyboardStickyView` handles the sticky-to-keyboard behavior natively
- Use `useAnimatedStyle` and `useAnimatedRef` from `react-native-reanimated` for the contentInset integration
- The `useKeyboardHandler` hook from `react-native-keyboard-controller` can be used to trigger auto-scroll
- Files to modify: `app/chat/[plantId].tsx`, `app/(drawer)/index.tsx`, `components/ui/chat-input.tsx`, `hooks/use-gradual-animation.ts`

## Success Metrics
- Zero hardcoded keyboard offset values in the codebase
- Composer stays pinned to keyboard across all iOS device sizes
- No visual glitches during keyboard open/close transitions
- All existing tests pass (`npm run vibecheck`)

## Open Questions
- Does the home screen input need the same `contentInset` treatment, or is `KeyboardStickyView` alone sufficient there?
- Should `useGradualAnimation` hook be extended or should a new dedicated hook be created for composer height tracking?