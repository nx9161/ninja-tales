# Prototype audit

Audit date: November 11, 2026 (America/New_York). Baseline commit: `4b9359472c6378221194b323ab2b0900e8cfacf9`.

This records the repository as inspected **before** the foundation work. It is not a report that the eventual game has passed acceptance. New implementation evidence belongs in the run record and release checklist; baseline findings remain here so the changes are reviewable.

## Verdict

The baseline is a small movement-and-interaction trial, not a complete RPG. It contains one approximately 6.7 KB HTML file with inline CSS and JavaScript, a minimal README, and a GitHub Pages workflow. It has no dependencies, tests, build pipeline, separate content database, or documented architecture. Four buildings have exterior rectangles but no interiors. Two NPCs and a fixed training encounter are the only playable content.

Evidence below comes from direct source inspection. Baseline desktop/mobile behavior was not independently playtested for this audit; source presence does not establish device compatibility or performance.

| Priority | Finding and evidence | Consequence | Foundation response / required proof |
| --- | --- | --- | --- |
| P0 | `interact()` always inflicts 10 damage; enemy starts with 30 HP; counterattack clamps player HP to at least 1. | Three actions always win; no defeat, tactical decisions, party turns, or resource trade-offs. | Add explicit encounter state, meaningful attack/jutsu/guard/item actions, bounded resources, defeat/retry, and tests for each outcome. |
| P0 | Only position and `talked` are saved; `save()` does not catch storage errors. Loaded coordinates are not checked for integer type or finite values. | Saving can fail without recovery; malformed saves can create invalid state. | Versioned schema, bounded validation, controlled migration, storage failure handling, round-trip tests, and recoverable export/import. |
| P0 | Deploy workflow uploads repository root and has no validation job. | A syntax error or regression can reach the live site, and future internal files could enter the public artifact. | Test before deploying; publish an explicit `dist/` allowlist; reject broken assets or modules. |
| P1 | All game data, state mutation, rendering, input, and persistence are in one closure. | Each expansion risks regressions across unrelated systems. | Separate data, pure rules/state, rendering, browser input/UI, and persistence boundaries. |
| P1 | Four houses are solid collision rectangles; no transitions or indoor maps exist. | Village destinations are decorative. | Enterable home, academy, clinic, and shop; each exit returns to a valid reachable tile. |
| P1 | No inventory, economy, levels, experience, jutsu, chakra, quests, or party data. | The requested core loop is absent. | A complete original quest-to-battle-to-reward loop exercising the shared systems. |
| P1 | NPC selection uses any Manhattan-adjacent NPC; calculated facing vector is unused. | Interaction may target an NPC behind the player. | Consistent facing/target policy with tests and understandable UI hints. |
| P1 | Touch movement occurs only on `pointerdown`; there is no held-direction controller or release lifecycle. | Walking requires repeated taps; future repeat logic could stick without cancellation. | Held movement, immediate step, release on pointerup/pointercancel/blur, and mobile browser checks. |
| P1 | No chapter records or content provenance exist. | There is no defensible way to claim manga coverage or distinguish approved and original content. | Rights-aware content records and a chapter coverage registry before canon production. |
| P1 | Houses, trees, and figures are basic filled rectangles; the village is sparse and flat. | Actual playable visuals are far below the approved dense village concept. | Layered original pixel environment with roofs, paths, trees, water, props, interiors, shadows, and actual browser screenshot review. Do not label final art complete. |
| P2 | No battle menu keyboard focus model, settings, key rebinding, gamepad, or accessibility test evidence. | A canvas label and live text alone do not make the game broadly accessible. | Semantic DOM action controls and readable feedback now; accessibility/device matrix remains a production gate. |
| P2 | No audio, localization system, asset manifest, performance budgets, or release/rollback instructions. | Production quality and maintainability are unmeasured. | Stage these explicitly; report missing checks rather than implying readiness. |

## Approved visual reference

The owner's “Ninja Tales: Hidden Leaf Village UI.png” establishes a dense, layered village rather than a sparse field of rectangle buildings: a strong central landmark, varied roofs, forest boundary, river/cliffs, connected streets, distinct service buildings, indoor locations, and readable battle/party panels. It is a **quality and composition reference**, not distributable game artwork or proof of Naruto distribution rights.

A procedural pixel renderer can establish coherent original scenery and playable collision quickly. That work is still a foundation until reviewed at gameplay scale. A polished landing page, static mockup, or screenshot cannot substitute for the in-game map.

## Acceptance evidence required

1. A fresh clone builds using documented commands, and only intended runtime files appear in the distribution.
2. The original slice can be completed from a new game using normal controls, including all required interactions and a victory reward exactly once.
3. Defeat/retry, resource exhaustion, item exhaustion, invalid imports, failed storage access, and pause/input cancellation are exercised.
4. Every required door, NPC, and objective is reachable; map transitions and save restoration cannot place the protagonist inside blocked terrain.
5. Desktop and phone-sized browser runs show readable controls, no horizontal page overflow, no uncaught runtime errors, and no stuck touch movement. Real iOS/Android testing is a separate gate.
6. At least one reviewer inspects actual rendered overworld, indoor, and battle screens. Final pixel-art approval remains open until comparison with the owner's target is satisfactory.
7. GitHub CI, Pages deployment, and the live URL are reported separately. Local success alone is not a deployment claim.

## Technical reference dossier

Research was scoped to the current static-browser architecture. These are the upstream documents consulted by the coordinating session, not a claim of exhaustive review of all web standards:

- [MDN: Canvas image smoothing](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/imageSmoothingEnabled) — preserve intentional pixel edges when scaling.
- [MDN: Using Pointer Events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events/Using_Pointer_Events) — shared mouse/touch/pen input and cancellation handling.
- [MDN: localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) — origin-scoped persistence and possible access exceptions; storage availability is not guaranteed.
- [GitHub: custom Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) — build/artifact/deploy separation and Pages permissions.

Installed execution runtime observed during intake: Node.js `v24.22.1`; npm `11.9.0`. The shipped game should not require a server account, secret, subscription, or paid service.
