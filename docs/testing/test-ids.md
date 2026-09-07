# testID naming convention

`testID`s let the e2e runner (Maestro) drive the app without depending on visible text. Every interactive element (anything tappable or typeable) on an instrumented screen carries one, and each screen carries one on its root container. Instrumented so far: home (plant form), chats (plant list), chat, AI settings, and the paywall.

## Naming

- Static elements: camelCase, role-suffixed names, e.g. `namePlantBtn`, `composerInput`, `saveSettingsBtn`, `chatScreen`. Buttons usually end in `Btn` or `Button`; screens and containers in `Screen`, `Page`, or `View`.
- List items and other repeated elements: a template id, `name-${key}`, keyed by something stable and human-readable where possible (`menuItemButton-${label}`, `providerSelector-${provider}`). Fall back to `-${index}` only when nothing better exists.
- No readable key: when the readable value is neither unique nor stable (plant names) or there is none (messages), key by the record id: `plantItem-${plantId}`, `chatMessage-${messageId}`. The key after the `-` is copied verbatim and is not subject to the camelCase rule.
- Composite components take one `testID` and use it as a namespace for their children: `OptionSelector` with `testID="providerSelector"` renders `providerSelector-OpenAI` and `providerSelector-Anthropic`. Leaf components (`SubmitButton`, `PhotoUpload`, `ChatInput`) accept `testID` in their props and forward it to the single pressable or input.
- Write the id as a literal at the call site. Maestro flows are YAML and copy the same literal, so renaming an id means updating the flows in the same change. Maestro's `id:` also accepts a regex, which is how a flow selects `chatMessage-.*` without knowing generated ids.
- Ids are identifiers, not labels: they never change when copy, translations, or icons change. Rename one only when the element itself changes purpose.
- `testID` is additive. Do not remove or alter `accessibilityLabel`, `accessibilityRole`, or `accessibilityHint` when adding one.

## Platform notes

- iOS: React Native maps `testID` to `accessibilityIdentifier`, which Maestro matches with `id:`.
- Android: `testID` maps to `resource-id`; Maestro `id:` matches it.
- Native chrome the app does not render itself (stack back button, drawer toggle, `Alert` buttons, zeego context/dropdown menu items) takes no testID; drive it by its visible text until a flow needs otherwise.

## Current ids

| Screen      | Container          | Elements                                                                                                       |
| ----------- | ------------------ | -------------------------------------------------------------------------------------------------------------- |
| Home        | `homeScreen`       | `plantDescriptionInput`, `addPhotoBtn`, `plantFormSubmitBtn`, `removePhotoBtn`, `resetFormBtn`                 |
| Chats       | `chatsScreen`      | `namePlantBtn`, `plantItem-${plantId}`                                                                         |
| Chat        | `chatScreen`       | `composerInput`, `sendBtn`, `attachPhotoBtn`, `removeAttachmentBtn`, `chatMenuBtn`, `chatMessage-${messageId}` |
| AI settings | `aiSettingsScreen` | `apiKeyInput`, `providerSelector-OpenAI`, `providerSelector-Anthropic`, `saveSettingsBtn`, `resetSettingsBtn`  |
| Paywall     | `paywallScreen`    | `subscribeBtn`, `restorePurchaseBtn`, `dismissPaywallBtn`                                                      |
