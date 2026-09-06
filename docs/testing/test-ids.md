# testID naming convention

`testID`s let the e2e runner (Maestro) drive the app without depending on visible text. Every interactive element (anything tappable or typeable) on an instrumented screen must carry one. Instrumented so far: plant list, plant form, chat, and AI settings.

- Format: kebab-case `<screen>.<element>`, dot-separated, e.g. `plant-list.name-plant-button`, `plant-form.description-input`, `chat.send-button`, `settings.api-key-input`.
- Repeated elements put the dynamic segment last: `plant-list.row.<plantId>`, `chat.message.<messageId>`, `settings.provider-option.<provider>`.
- IDs come from the registry in `apps/mobile/src/testing/test-ids.ts`. Components and e2e flows share it; never write the string literal at the call site. Dynamic ids come from that module's helper functions (`plantRowTestId(id)`, etc.).
- IDs are identifiers, not labels: they never change when copy, translations, or icons change. Rename one only when the element itself changes purpose, and update the e2e flows in the same change.
- `testID` is additive. Do not remove or alter `accessibilityLabel`, `accessibilityRole`, or `accessibilityHint` when adding one; screen readers keep working from the labels.

Platform notes:

- iOS: React Native maps `testID` to `accessibilityIdentifier`, which Maestro matches with `id:`.
- Android: `testID` becomes the view tag / resource-id. On some core components the id and `accessibilityLabel` interact in the accessibility tree; keep labels as they are regardless and select by `id:` in flows.
- Native chrome the app does not render itself (stack back button, drawer toggle, `Alert` buttons, zeego context/dropdown menu items) takes no testID; drive it by its visible text.
