# Ninja Tales development instructions

Read [CODEX_HANDOFF.md](CODEX_HANDOFF.md) before changing this project. Continue `feat/playable-foundation` and PR1 when working on this milestone. Preserve unrelated work.

The final target is a Pokémon-style top-down Naruto manga1–700 RPG with permanent Naruto protagonist and at most4 story-driven party members. Current playable content is an explicitly original training slice. Do not claim the full campaign or final artwork is finished.

Use original placeholder content when distribution rights are not verified. Keep gameplay rules independent from browser/renderer APIs. Validate all imported saves and preserve the running game on failure. Add meaningful regression coverage for gameplay/persistence defects. Run `npm run verify`; browser tests require Playwright Chromium and Node24. Maintain docs and report actual checks, missing checks and deployment status.

Follow the user's invoked45-seat War Room scope honestly: delegate relevant work only within actual tool limits; do not represent a roster as independent reviews. Keep main deployable and use reviewed PRs. Obtain specific owner delegation before merging PR1 under the invoked protocol.
