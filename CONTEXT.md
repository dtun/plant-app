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
