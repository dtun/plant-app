# AI routes

The KeepTend web app serves three AI routes. They mirror the three `PlantIntelligence` operations (see `CONTEXT.md`). The server holds the provider keys, chooses the provider and model, and checks the caller's `pro` entitlement on every request. The RemoteIntelligence client builds against this contract.

There is no free allowance yet. A caller without an active `pro` entitlement always gets `402`.

## Routes

| Route                | Operation                  | Success response                       |
| -------------------- | -------------------------- | -------------------------------------- |
| `POST /api/ai/name`  | `generatePlantName`        | `200` JSON `{ "name": string }`        |
| `POST /api/ai/photo` | `generatePhotoDescription` | `200` JSON `{ "description": string }` |
| `POST /api/ai/chat`  | `generateChatResponse`     | `200` NDJSON stream                    |

Every route takes a JSON body with `Content-Type: application/json`. The routes accept only `POST`.

## Request header

Every request must carry the RevenueCat app user id.

```
X-App-User-Id: $RCAnonymousID:0a1b2c3d
```

The name is vendor-neutral on purpose. The value is whatever `getAppUserId` returns. A missing or empty header gets `402` with kind `subscription-required`.

## Order of checks

The server runs the same steps for every route and stops at the first failure.

1. Read `X-App-User-Id`.
2. Ask RevenueCat whether the user has an active `pro` entitlement.
3. Parse the JSON body.
4. Call the provider.

An unentitled caller therefore gets `402` even when the body is invalid. The server never calls the provider before the entitlement check passes.

## Images

The server cannot read device URIs, so images travel as base64 in the body.

- Send raw base64 only. A `data:` prefix, a URL, or an empty string gets `400`.
- Send JPEG data. The server labels every image `image/jpeg`.

## Name

`POST /api/ai/name`

```json
{
  "plant": {
    "description": "A fern with long arching fronds",
    "plantType": "Boston fern",
    "size": "Small",
    "photoDescription": "Bright green, feathery leaves"
  },
  "avoidNames": ["Fernie", "Mossy"]
}
```

| Field                    | Type                                | Required |
| ------------------------ | ----------------------------------- | -------- |
| `plant.description`      | non-empty string                    | yes      |
| `plant.plantType`        | string                              | no       |
| `plant.size`             | `"Small"`, `"Medium"`, or `"Large"` | no       |
| `plant.photoDescription` | string                              | no       |
| `avoidNames`             | array of strings                    | no       |

The server keeps no state between requests. Send the names you generated earlier in `avoidNames` so the model does not repeat them.

Response `200`:

```json
{ "name": "Frondo" }
```

## Photo

`POST /api/ai/photo`

```json
{ "imageBase64": "/9j/4AAQSkZJRgABAQ..." }
```

Response `200`:

```json
{ "description": "Long, arching fronds with small, rounded leaflets..." }
```

## Chat

`POST /api/ai/chat`

```json
{
  "plantContext": {
    "name": "Frondo",
    "description": "Boston fern",
    "size": "Small",
    "aiAnalysis": "Likes humidity and indirect light"
  },
  "messages": [
    { "role": "user", "content": "How are you today?" },
    { "role": "assistant", "content": "Feeling fresh!" },
    { "role": "user", "content": "What is wrong with this leaf?", "imageBase64": "/9j/4AAQ..." }
  ]
}
```

| Field                      | Type                        | Required                        |
| -------------------------- | --------------------------- | ------------------------------- |
| `plantContext.name`        | non-empty string            | yes                             |
| `plantContext.description` | string or `null`            | no                              |
| `plantContext.size`        | string or `null`            | no                              |
| `plantContext.aiAnalysis`  | string or `null`            | no                              |
| `messages`                 | array, at least one message | yes                             |
| `messages[].role`          | `"user"` or `"assistant"`   | yes                             |
| `messages[].content`       | string                      | yes, may be empty with an image |
| `messages[].imageBase64`   | raw base64 string           | no                              |

Send the whole conversation, oldest message first. A message with `imageBase64` is sent to the model as a user message. The server uses a vision-capable model when any message has an image, and a lighter text model otherwise.

### Chat stream

The response is `200` with `Content-Type: application/x-ndjson; charset=utf-8`. The body is newline-delimited JSON. Each line is one complete JSON object, and each line ends with `\n`.

There are three event types.

| Event                                                     | Meaning                                                               |
| --------------------------------------------------------- | --------------------------------------------------------------------- |
| `{"type":"token","text":"..."}`                           | The next piece of the reply. Append it to the message.                |
| `{"type":"done","text":"..."}`                            | The reply is complete. `text` is the full reply, trimmed.             |
| `{"type":"error","error":{"kind":"...","message":"..."}}` | The reply failed. `error` has the same shape as a JSON error payload. |

A stream sends zero or more `token` lines and then exactly one terminal line, either `done` or `error`. Nothing follows the terminal line.

A successful stream:

```
{"type":"token","text":"Hello"}
{"type":"token","text":", friend"}
{"type":"token","text":"!"}
{"type":"done","text":"Hello, friend!"}
```

A stream that fails after it started. The `200` status is already sent, so the failure arrives as a line.

```
{"type":"token","text":"Hello"}
{"type":"error","error":{"kind":"network","message":"An upstream service could not be reached."}}
```

Client rules.

- Buffer the bytes and split on `\n`. A chunk can end in the middle of a line.
- Use `done.text` as the final reply. Tokens can carry leading or trailing whitespace that `done.text` trims.
- If the connection closes before a terminal line, treat it as a `network` failure.
- Stop reading when you cancel the request. The server stops pulling from the provider.

Failures the server detects before streaming starts are not streamed. They return the JSON error payload below, with the status from the table. These are an invalid body, a missing or refused entitlement, and a RevenueCat failure. A provider failure on chat always arrives as an `error` line, even when it happens before the first token.

## Errors

Every failure outside the chat stream returns a JSON body and an HTTP status.

```json
{ "error": { "kind": "subscription-required", "message": "An active subscription is required." } }
```

`kind` is one of four values. The client maps it onto `AIFailure` and shows its own localized text. The `message` is an English diagnostic for logs. Do not show it to users.

| Kind                    | Status | When                                                                            |
| ----------------------- | ------ | ------------------------------------------------------------------------------- |
| `subscription-required` | `402`  | The header is missing or empty, or the user has no active `pro` entitlement.    |
| `quota`                 | `429`  | The AI provider rejected the request with a `402` or `429`.                     |
| `network`               | `502`  | The server could not reach RevenueCat or the AI provider.                       |
| `unknown`               | `500`  | Anything else, including a server misconfiguration and an empty provider reply. |
| `unknown`               | `400`  | The body is not valid JSON or does not match the schema.                        |

A `400` names the fields that failed, for example `Invalid request body: plant.size.`. It never echoes their values.

The server never puts provider error text, keys, or key fragments in a response. A bad server key shows up as `unknown`, not as a message about the key.

## Environment variables

These are set on the server only. None of them starts with `NEXT_PUBLIC_`.

| Variable                | Required | Meaning                                                                |
| ----------------------- | -------- | ---------------------------------------------------------------------- |
| `AI_PROVIDER`           | no       | `Anthropic` (default) or `OpenAI`.                                     |
| `AI_API_KEY`            | yes      | API key for the chosen provider.                                       |
| `REVENUECAT_SECRET_KEY` | yes      | RevenueCat secret API key. The server uses it to read subscriber data. |

If a required variable is missing or `AI_PROVIDER` is not a known value, every route returns `500` with kind `unknown` and the message `The AI service is not configured.` The server logs which variable names are wrong.

Models by provider.

| Provider    | Text tier                   | Vision tier         |
| ----------- | --------------------------- | ------------------- |
| `Anthropic` | `claude-haiku-4-5-20251001` | `claude-sonnet-4-6` |
| `OpenAI`    | `gpt-4o-mini`               | `gpt-4o`            |

Names use the text tier. Photos use the vision tier. Chat uses the vision tier when any message has an image.

## Entitlement check

The server calls `GET https://api.revenuecat.com/v1/subscribers/{app_user_id}` with the secret key. The user is entitled when `subscriber.entitlements.pro` exists and its `expires_date` is `null` (a lifetime unlock) or in the future.

A RevenueCat response of `5xx` or a failed request maps to `network`. Any other failure, such as a `401` from a wrong secret key, maps to `unknown`.
