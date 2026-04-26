# KeepTend Domain Glossary

Living document. Terms are added as they get grilled through architecture reviews — don't pre-fill speculatively.

## PlantIntelligence

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

## PhotoPicker

The seam between the app and device photo capture (camera + library). Two operations:

- `pickImageFromLibrary` — pick an existing image from the device's photo library.
- `takePhotoWithCamera` — capture a new image via the device's camera.

Both return `PhotoResult` — a discriminated union (`{ ok: true; uri; base64 } | { ok: false; failure: PhotoFailure }`) mirroring the `Result`/`AIFailure` shape used by PlantIntelligence. Failures cross the seam as `PhotoFailure` (`cancelled | permission-denied | failed`), never as thrown errors and never as user-facing dialogs from inside the util — copy belongs to the calling screen so it can localize and contextualize.

Adapter:

- **expo-image-picker** — the only adapter today. Permission requests are handled inside the seam; permission-denied is surfaced as a typed failure, not a `Alert.alert`.

The chooser dialog (`showPhotoPickerAlert`) is a separate UI helper, not part of the seam — it dispatches to one of the two operations based on the user's choice.
