# Underplay

Multiplayer shedding card game from the Tapped-Four family. Play **under** (≤) the top card of the central stack, or play higher and pick up the pile.

## Specs

- `GAME_SPEC.md` — normative rules and engine architecture
- `GAME_SPEC_AMENDMENT_A_PRESENTATION.md` — photorealistic presentation layer

## Development

```bash
npm install
npm run test          # rules engine tests
npm run dev           # http://localhost:3000
npm run build         # production build
```

## Structure

- `packages/engine` — pure TypeScript rules engine + CPU AI
- `apps/web` — Next.js client (local vs CPU demo)

## Deploy

Configured for Vercel; root directory `apps/web`.