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

## Billing

The seam between the app and the billing vendor (lives in `src/payments/`). Operations:

- `getEntitlement` — what the user currently owns.
- `getOffer` — the pro unlock as the UI needs to price it.
- `purchase` — buy the resolved offer.
- `restore` — recover a prior purchase on the account.
- `subscribe` — register for entitlement changes the vendor pushes asynchronously (cross-device purchase, refund, family share); returns an unsubscribe function.

Domain types are vendor-agnostic: `Entitlement` (`isPro` + the backing `productId`) and `ProOffer` (`priceLabel`). The vendor's own types (`PurchasesPackage`, `CustomerInfo`) never cross the seam — callers never see the vendor name. The lifetime "pro" unlock is the only entitlement today.

Failures cross as a discriminated `BillingFailure` (`cancelled | no-config | no-offer | network | unknown`), never as thrown errors. Copy belongs to the calling screen (`Paywall` maps each kind to localized text), mirroring PhotoPicker. "Nothing to restore" is **not** a failure — `restore` succeeds with an `Entitlement` whose `isPro` is false.

Adapters:

- **RevenueCatBilling** — the only production adapter. Resolves its public SDK key from env (`config.ts`); when no key is present it returns `no-config` from every operation without ever touching the SDK, so web/dev/tests stay unconfigured safely.
- **FakeBilling** — test adapter. Constructed with canned outcomes and can `emit` synthetic entitlement changes; replaces module-level mocking of the vendor SDK.

The open-vs-locked **policy** is _not_ in the seam — it lives in `PurchaseProvider`, which reads the facts the seam reports: `no-config` → app stays open (unconfigured), any other failure → fail closed (stay locked, protecting AI costs; RevenueCat's local cache still resolves legitimate owners on retry). The provider also mirrors the resolved tier into the LiveStore user record for analytics; the seam remains the source of truth for access.
