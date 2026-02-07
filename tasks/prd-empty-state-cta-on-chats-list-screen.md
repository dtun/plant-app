# PRD: Empty State CTA on Chats List Screen

## Overview
The chats list screen (`app/(drawer)/chats.tsx`) currently shows a passive "Name a plant to start chatting!" message when no plants exist. This provides zero affordance for users to take action. This feature adds a pressable row — text plus an animated circle-arrow icon — that navigates to the home/root screen where users can name their first plant.

## Goals
- Provide a clear call-to-action on the empty chats list screen so new users know how to get started
- Make the entire empty state row (text + icon) a single pressable target
- Add a subtle hop animation to the arrow icon to draw the eye without being distracting
- Navigate to the root screen (`/`) where the plant naming form lives

## Quality Gates

These commands must pass for every user story:
- `npm run vibecheck` — lint, typecheck, and test

## User Stories

### US-001: Pressable Empty State Row with Navigation
As a new user viewing the chats list with no plants, I want to tap the "Name a plant to start chatting!" area so that I'm taken to the screen where I can name my first plant.

**Acceptance Criteria:**
- [ ] The empty state renders a horizontally-laid-out row: text on the left, circular icon button on the right
- [ ] The row is vertically centered on the screen (matching current empty state positioning)
- [ ] The entire row (text + icon) is a single pressable area using `TouchableOpacity` or `Pressable`
- [ ] Pressing anywhere on the row navigates to the root screen (`/`) via `router.push("/")`
- [ ] The circular icon contains an "arrow.up.right" SF Symbol (or equivalent) matching the existing `IconSymbol` pattern
- [ ] The circle button matches the existing `SubmitButton` visual style (rounded, `bg-tint` background, appropriate size)
- [ ] The text "Name a plant to start chatting!" is preserved
- [ ] Accessibility: the pressable area has `accessibilityRole="button"`, an appropriate `accessibilityLabel`, and `accessibilityHint` describing the navigation destination

### US-002: Subtle Hop Animation on Arrow Icon
As a user seeing the empty state, I want the arrow icon to do a small repeating hop animation so that it subtly draws my attention to the call-to-action.

**Acceptance Criteria:**
- [ ] The arrow icon performs a small vertical hop animation (translate Y, roughly 3-4px upward and back)
- [ ] The animation uses `react-native-reanimated` (consistent with existing animation patterns in the app)
- [ ] The animation loops continuously with a gentle easing (not jarring or fast)
- [ ] The animation is subtle — it should catch the eye without being distracting
- [ ] The animation does not interfere with the pressable behavior of the row
- [ ] The animation uses `useNativeDriver` equivalent (Reanimated worklets) for smooth performance

## Functional Requirements
- FR-1: When the `plants` array is empty in `app/(drawer)/chats.tsx`, the screen must render the pressable empty state CTA instead of the current passive text
- FR-2: The pressable row must navigate to the root route (`/`) using Expo Router's `useRouter` hook
- FR-3: The circular icon must use the existing `IconSymbol` component with an upward-right arrow
- FR-4: The hop animation must start automatically when the empty state mounts and loop until the component unmounts
- FR-5: The row layout must be horizontal with the text left-aligned and the circle icon to its right, with appropriate spacing

## Non-Goals
- No changes to the root/home screen or plant form
- No changes to the empty state when plants exist but have no messages
- No onboarding tutorial or multi-step walkthrough
- No new shared components — this is scoped to the chats screen empty state

## Technical Considerations
- The empty state lives in `app/(drawer)/chats.tsx` (lines 16-22)
- Use `react-native-reanimated` for the hop animation (`withRepeat`, `withSequence`, `withTiming`)
- The existing `SubmitButton` component (`components/ui/submit-button.tsx`) can serve as visual reference for the circle style
- The existing `IconSymbol` component is used throughout the app for SF Symbol icons
- Navigation uses `useRouter()` from `expo-router` — same pattern used in `plant-form.tsx`

## Success Metrics
- New users see and interact with the CTA on first app launch
- The button navigates correctly to the plant naming screen
- The animation renders smoothly at 60fps without jank

## Open Questions
- Should the hop animation pause after a few cycles or loop indefinitely?