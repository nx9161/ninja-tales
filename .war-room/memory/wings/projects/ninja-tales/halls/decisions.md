# Architecture and product decisions

## ADR-001 — Preserve the production target; deliver a reviewable slice

- Date: November 11, 2026 (America/New_York).
- Owner: Sloane/coordinator, with Game Producer product review.
- Context: a single-file movement trial is far short of the requested 700-chapter RPG.
- Decision: retain the complete confirmed scope, but implement a coherent original quest-to-battle-to-reward loop first. Do not claim original training content covers any manga chapter.
- Evidence: baseline source audit; explicit user specifications.
- Remaining gates: actual implementation, tests, visual inspection, independent code review, and release evidence.

## ADR-002 — Static modular browser architecture

- Date: November 11, 2026 (America/New_York).
- Owner: coordinator/Game Architect.
- Context: GitHub Pages deployment and a simple dependency-free baseline favor a static client.
- Decision: native ESM; `engine.js` for state transitions and save encode/decode, `world.js` for data/collision/interaction, `render.js` for Canvas, `main.js` for browser controls/storage. Keep rules testable without DOM or canvas; publish only curated `dist/` output.
- Evidence: installed Node runtime; current Pages workflow; scoped MDN and GitHub documentation in the audit dossier.
- Remaining gates: API integration, save validation and failure recovery, map reachability, browser testing, CI execution.

## ADR-003 — Original content until rights evidence is verified

- Date: November 11, 2026 (America/New_York).
- Owner: user's explicit constraint, implemented by coordinator and producer.
- Context: no verified Naruto distribution authorization is recorded in this project.
- Decision: Ren and Aya, original village/dialogue/mechanics names and original pixel scenery for the slice; reserve final Naruto/canon content for a provenance-aware pipeline. Do not distribute the approved reference image as an asset.
- Evidence: user execution instruction 6; content policy in `docs/CONTENT.md`.
- Remaining gates: verified rights and editorial/source review before canon releases; this is not a legal opinion.

## ADR-004 — Honest specialist coverage and release reporting

- Date: November 11, 2026 (America/New_York).
- Owner: coordinator.
- Context: 45-role protocol roster exceeds the runtime's seven-agent concurrency ceiling; not every specialty applies to a static game slice.
- Decision: run relevant real specialists in batches; distinguish coordinator perspectives, independent reviews, and seats not invoked. Record local tests, CI, merge, deployment, and live verification separately.
- Evidence: confirmed live roster, runtime concurrency limit, user reporting instructions.
- Remaining gates: independent review and final evidence reconciliation. No global “45 seats approved” claim is permitted without actual per-seat work.

## ADR-005 — Interaction and first-story contract

- Date: November 11, 2026 (America/New_York).
- Owner: coordinator/Game Architect; product contract recorded by Game Producer.
- Context: the prototype has no enterable locations or meaningful progression.
- Decision: 48 × 36 tile village, 16-pixel tiles, 768 × 512 canvas view; four interiors; face a door and interact to enter. Stages: academy instructor → shop supplies → academy/Aya joins → village trainee battle → report → completion. Battle actions: strike, jutsu, guard, focus, item, flee; explicit defeat recovery.
- Evidence: architecture and gameplay handoff from coordinator.
- Remaining gates: all routes and actions must be tested through normal controls; balance and final art approval remain open.
