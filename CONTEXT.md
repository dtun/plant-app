# KeepTend Context

## Why KeepTend Exists

People who keep houseplants form real attachments to them, but the relationship is mute. A plant can't say it's thirsty, can't react to being repotted, can't be talked to after a long day — so owners oscillate between guesswork and worry, and the affection they feel has nowhere to land. Existing plant apps treat plants as maintenance objects: databases to identify them, schedules to service them. Nothing treats the plant as a companion.

KeepTend gives each plant a voice — a name, a personality grounded in what it actually is, and a conversation — so tending becomes a relationship rather than a chore list. Care knowledge arrives through the plant's voice, not through features the owner configures.

This framing is a filter: a feature belongs in KeepTend when it deepens the owner–plant relationship or arrives through the plant's voice. A capability that treats the plant as a maintenance object (a bare encyclopedia lookup, a configuration-heavy schedule) is off-mission unless the plant delivers it.

## Domain Glossary

Living document. Terms are added as they get grilled through architecture reviews — don't pre-fill speculatively.

### PlantIntelligence

The seam between the app and AI capabilities about plants. Three operations:

- `generatePlantName` — propose a name for a plant given its profile.
- `generatePhotoDescription` — describe a plant from a photo (botanical features useful for care).
- `generateChatResponse` — respond in first person as the plant in conversation.

The interface is operation-shaped and provider-agnostic. Failures cross the seam as a discriminated `AIFailure` (`no-config | invalid-key | quota | network | unknown`) carrying a localized `message`, never as thrown errors.

Adapters:

- **LocalIntelligence** — calls AI provider SDKs directly from the client, using a config resolved from user-provided keys / public config endpoint / env fallbacks. Today's only production adapter.
- **RemoteIntelligence** (planned) — `POST keeptend.com/api/ai/*`; server holds provider keys. Ships when the server is ready.
- **FakeIntelligence** — test adapter. Constructed with canned responses; replaces module-level `jest.mock` of the AI module.

Provider choice (OpenAI vs Anthropic) is private to whichever adapter is wired up. Callers never see provider names, model names, or API keys.

### PhotoPicker

The seam between the app and device photo capture (camera + library). Two operations:

- `pickImageFromLibrary` — pick an existing image from the device's photo library.
- `takePhotoWithCamera` — capture a new image via the device's camera.

Both return `PhotoResult` — a discriminated union (`{ ok: true; uri; base64 } | { ok: false; failure: PhotoFailure }`) mirroring the `Result`/`AIFailure` shape used by PlantIntelligence. Failures cross the seam as `PhotoFailure` (`cancelled | permission-denied | failed`), never as thrown errors and never as user-facing dialogs from inside the util — copy belongs to the calling screen so it can localize and contextualize.

Adapter:

- **expo-image-picker** — the only adapter today. Permission requests are handled inside the seam; permission-denied is surfaced as a typed failure, not a `Alert.alert`.

The chooser dialog (`showPhotoPickerAlert`) is a separate UI helper, not part of the seam — it dispatches to one of the two operations based on the user's choice.
