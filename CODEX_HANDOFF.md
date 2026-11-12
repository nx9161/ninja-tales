# Ninja Tales — Codex continuation
Updated 2026-11-12 (America/New_York).

## Resume this work
- Repository: https://github.com/nx9161/ninja-tales
- Working branch: `feat/playable-foundation`
- Existing draft PR: https://github.com/nx9161/ninja-tales/pull/1
- Existing deployment: https://nx9161.github.io/ninja-tales/ — this still serves the original main-branch trial until a merge/deploy is verified.
- Continue the existing branch and PR; do not restart the project or overwrite unrelated changes.
- The owner asked to switch this project from ChatGPT Work to Codex. This file preserves context; it does not itself create a Codex cloud task.
- The Work execution environment became unavailable. GitHub is the durable source. Do not depend on old scratch paths or uncommitted files.

## Confirmed final specifications
Classic Pokémon-style top-down pixel-art exploration. Richly detailed Hidden Leaf Village and every story location needed for the original Naruto manga Chapters 1–700, without anime filler. Naruto is the permanent overworld protagonist. At most four active party members total; companions join/leave through canonical story events. Dedicated turn-based tactical ninja battles. Full character progression, chakra, jutsu, inventory, quests, dialogue, saves, desktop/mobile input, automated tests and GitHub Pages delivery.

Use original placeholder content for Naruto material without verified distribution rights. No Naruto distribution grant is verified in this project. Do not confuse another franchise's paperwork with this project's rights. Canon chapters implemented/accepted: **0 of 700**.

The approved visual target is a dense, polished pixel-art village with layered roofs, lush foliage, cliffs/water, landmarks, interiors, party UI and tactical battle UI. Current procedural art is development art and is below final approval. Do not label basic rectangles or placeholder environments finished artwork.

## Implemented original slice
Ren and Aya are original development characters, not the final Naruto campaign.
- 48×36-tile Leafwood village, 16px tiles, four interiors: academy/home/shop/clinic.
- Facing-based interactions and collision, including water, NPCs and props.
- Quest: instructor → supplies → recruit Aya → team exercise → report.
- Battle: two members, two enemies, target selection, telegraphed intent, strike/jutsu/guard/focus/salve/retreat, real loss/recovery, one-time XP/coin rewards.
- Inventory, shop/rest, leveling, quest journal and responsive camera.
- Validated versioned local saves, automatic safe checkpoints, manual save/load and JSON export/import.
- Native ES modules, no production npm dependencies; pinned Playwright1.58.2 development dependency.
- CI on Ubuntu24.04 + Node24. Tests/build gate main-only Pages deployment. Publish dist only.

## Architecture
`src/world.js`: declarative maps, collision and getInteractable.
`src/engine.js`: deterministic mutable gameplay transitions; functions return {ok,message}. Save serialization/validation lives here.
`src/render.js`: code-drawn cached pixel assets, depth sorting and camera.
`src/main.js`: DOM panels, keyboard/pointer lifecycle, storage and file adapters.
`src/style.css`: responsive game interface.
`tests/engine.test.js`, `tests/world.test.js`, `tests/browser-game.mjs`: logic, reachability, real-control browser flow.
`scripts/`: static server, syntax checker, allowlisted dist builder.

## Verification and review evidence
The original branch commit `3caaea1e4ab584c6aaec6f34ded6d2b99bf4e888` passed GitHub Actions run https://github.com/nx9161/ninja-tales/actions/runs/43152331178:
- 30 Node engine/map tests.
- 12 browser cases (6 desktop Chromium +6 iPhone13-sized Chromium).
- Syntax check and production build.
- Actual village and battle screenshots inspected at desktop/mobile sizes. Original artifact13914685915 was retained7days; it may expire.
- No updated Pages deployment occurred; PR deploy was skipped.

Independent review by other authors found:
1. Maximum-level imported saves could earn XP beyond the restore invariant, becoming unsavable.
2. Map/facing enum checks accepted arrays through object-key coercion.
3. Battle controls could clip on 320px screens.
4. Import/load save labels were stale and restart wording omitted automatic checkpoints.
5. Pointer-cancel tests were synthetic; mobile full-quest traversal still used keyboard events.

The handoff commit fixes1–4, adds regression tests, a 320px project, bounds checks for battle buttons, and trusted tap/click input testing. Check the **latest commit's CI**, not merely the earlier green run. Physical mobile hardware/Safari, Firefox/WebKit, gamepad/remapping, performance/balance and final art remain unverified.

## Next actions
1. Check PR1 CI; fix any failing new regressions. Expect31 Node tests and21 browser cases after the handoff changes.
2. Inspect fresh desktop,390px and320px screenshots. Re-review narrow layouts and genuine pointer capture.
3. Keep docs and the PR aligned with actual results, then request/obtain owner merge delegation as required by the invoked protocol. Do not claim a deployment without a successful deploy job and live smoke check.
4. Extract quest/dialogue/encounters into a validated data-driven content pipeline and add versioned migrations.
5. Build original location/story milestones while canon remains rights-gated; implement party lifecycle and content for3/4 members, status effects, jutsu unlocks and progression balancing.
6. Raise authored art, animation, battle staging, audio and world density to the approved target.
7. Add source/rights/editorial/implementation/playtest status for each chapter1–700; numbering alone never counts as coverage.
8. Continue milestones as session tools permit; report meaningful blockers and verified deliverables, not routine role theater.

## Commands
```sh
git switch feat/playable-foundation
npm ci
npx playwright install --with-deps chromium
npm run verify
npm run dev
```
The test runner serves dist on127.0.0.1:4173. `npm run dev` serves source. Use Node24 and a supported browser host; the previous Work sandbox could not launch Chromium. The original Ubuntu-latest26.04 CI setup failed before tests; the pinned Ubuntu24.04 run passed.

## Protocol and scope
The owner explicitly requested War Room Protocol with45 specialist seats. The live roster was verified from nx9161/war-room-protocol. It is an organizational roster, not45 simultaneous independent agents. Actual specialist work was batched within a7-agent runtime ceiling; do not fabricate attendance/independent approvals.
Read project docs/AUDIT.md, docs/ROADMAP.md, docs/CONTENT.md, docs/SECURITY.md and .war-room records. Some initial run-ledger rows were written before test results; the exact CI evidence above supersedes their pending status.
Use feature branches, conventional commits, review, and the existing PR. Current protocol says the owner merges unless a specific merge is delegated. No merge or final release approval has been given for PR1. Production deployment intent was requested, but complete applicable checks first.
