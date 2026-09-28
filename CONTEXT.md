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

## Entitlements

The seam between the app and the billing vendor (lives in `src/entitlements/`). Operations:

- `getEntitlement` — what the user currently owns.
- `getOffer` — the pro subscription as the UI needs to price it.
- `purchase(offer)` — buy the given offer. The offer is re-resolved against the store at purchase time, so there is no ordering dependency on `getOffer`; an offer that has left the storefront returns `no-offer`.
- `restore` — recover a prior purchase on the account.
- `getAppUserId` — the vendor's anonymous app user id. The planned RemoteIntelligence adapter will send it with every built-in AI request, and the server will meter free allowance and verify entitlement by it. Null when the vendor is unconfigured or unreachable; never throws.
- `subscribe` — register for entitlement changes the vendor pushes asynchronously (cross-device purchase, refund, family share); returns an unsubscribe function.

Domain types are vendor-agnostic. `Entitlement` carries `isPro`, the backing `productId`, `expiresAt` (epoch ms; null for a lifetime unlock or when not pro), `willRenew` (the store will bill again at `expiresAt`), and `managementUrl` (where the user manages or cancels; null when the store offers none). `ProOffer` carries `priceLabel`, the store `productId` that `purchase` resolves it by, and `term` (how often the store bills: `weekly | monthly | two-month | three-month | six-month | annual | lifetime`, or null when the package carries no recognized term). The vendor's own types (`PurchasesPackage`, `CustomerInfo`) never cross the seam — callers never see the vendor name. "Pro" is the only entitlement; it may be backed by a subscription or a lifetime unlock.

Failures cross as a discriminated `EntitlementFailure` (`cancelled | not-allowed | no-config | no-offer | network | store-error | unknown`), never as thrown errors. `not-allowed` means the device or account may not make purchases (parental controls, managed device). Copy belongs to the calling screen, which maps each kind to localized text, mirroring PhotoPicker. "Nothing to restore" is **not** a failure — `restore` succeeds with an `Entitlement` whose `isPro` is false.

Adapters:

- **RevenueCatEntitlements** — the only production adapter. Resolves its public SDK key from env (`config.ts`); when no key is present it returns `no-config` from every operation without ever touching the SDK, so web/dev/tests stay unconfigured safely.
- **FakeEntitlements** — test adapter. Constructed with canned outcomes (entitlement, offer, purchase, restore, app user id) and can `emit` synthetic entitlement changes; replaces module-level mocking of the vendor SDK.

In the app, `EntitlementsProvider` / `useEntitlements()` (`apps/mobile/contexts/`) is the single reactive source of subscription state for the paywall, AI settings, and adapter selection. It reads the entitlement on mount, subscribes to vendor-pushed changes for its lifetime, and exposes `status` (`loading | ready | unavailable | error`; `unavailable` when the seam is unconfigured, `error` when the read failed for any other reason and a `refresh` may succeed) plus `purchase`, `restore`, and `refresh`, which return the seam's `Result` unchanged.

The **paywall** (`apps/mobile/app/paywall.tsx`, presented as a modal) is where every `subscription-required` failure and the AI settings screen send the user. It prices the offer from `getOffer`, purchases and restores through the provider, and owns the localized copy for each failure kind; `cancelled` returns the screen to idle with no message, and a restore that finds nothing says so rather than dismissing. It takes a `reason` param; `allowance-exhausted` swaps the headline to acknowledge the user's spent free interactions.

The **subscription section** (`apps/mobile/components/subscription-section.tsx`) sits at the top of the AI settings screen, above the bring-your-own-key form. It reads the provider and shows either the subscribed state (renewal or expiry date, none for a lifetime unlock, and a Manage action when the store offers a `managementUrl`) or the not-subscribed state with Subscribe and Restore. Subscribe and Manage hand off to callbacks the screen wires to the paywall route and the platform URL opener, so the section is tested without a router. It renders nothing when the seam is unconfigured.
