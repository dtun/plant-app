# KeepTend

AI-powered plant care companion. Chat with your plants, analyze photos, and generate creative names — all powered by OpenAI or Anthropic.

## Quick Setup

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the mobile app

   ```bash
   cd apps/mobile
   npx expo start
   ```

3. Configure your AI provider in the app (Settings > AI Setup) with an OpenAI or Anthropic API key

## Features

- Chat conversations with your plants via AI
- Camera and photo library integration for plant photos
- AI-powered photo analysis and plant descriptions
- Creative plant name generation
- Light/dark theme support
- Internationalization (i18n) via Lingui

## Tech Stack

- React Native + Expo (Expo Router for navigation)
- TypeScript
- AI SDK (OpenAI/Anthropic)
- LiveStore (event-sourced persistent state)
- React Hook Form + Zod validation
- Lingui (i18n)
- Jest + jest-expo (testing)

## Project Structure

This is an npm workspaces monorepo:

- `apps/mobile/` — Expo React Native app
- `apps/web/` — Web app (placeholder)
- `packages/` — Shared packages (future)

## Development

Run lint, typecheck, and tests before committing:

```bash
cd apps/mobile && npm run vibecheck
```

See [AGENTS.md](AGENTS.md) for full coding conventions and architecture details.
