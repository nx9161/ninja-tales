# Ninja Tales

A top-down pixel RPG in development. Current work is an original-content training slice, not the finished Naruto Chapter1–700 campaign.

Start with [the Codex handoff](CODEX_HANDOFF.md), [roadmap](docs/ROADMAP.md), and [audit](docs/AUDIT.md).

```sh
npm ci
npx playwright install --with-deps chromium
npm run verify
npm run dev
```

Requires Node24+. Open http://127.0.0.1:4173. Arrow keys/WASD move; E interacts; Q opens the journal; Escape opens the menu. Touch controls support movement and interaction. Face a person or door before interacting.

The working branch is `feat/playable-foundation`, with [draft PR1](https://github.com/nx9161/ninja-tales/pull/1). CI validates before main-only Pages deployment. Check latest CI results; do not infer deployed status from an existing URL.
