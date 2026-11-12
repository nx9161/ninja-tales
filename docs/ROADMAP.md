# Ninja Tales production roadmap

Status: **in development — the complete game is not finished**.

The first work package is an original-content vertical slice. The final target remains a classic top-down, tile-based Naruto RPG covering the original manga from Chapter 1 through Chapter 700, without anime filler. Completing an engine feature or original training quest does not count as completing any manga chapter.

## Product contract

| Area | Confirmed final requirement |
| --- | --- |
| World | Detailed Pokémon-style top-down pixel-art exploration; Hidden Leaf Village and every required story location. |
| Protagonist | Naruto remains the permanent overworld protagonist. The original-content development avatar is explicitly a substitute, not a claim that canon Naruto content is implemented. |
| Party | At most four active members including the permanent protagonist; companions join and leave at canonical story events, not through free collection. |
| Battle | Dedicated turn-based tactical ninja battles, with readable actions, resources, targets, statuses, victory, and defeat. |
| Progression | Character growth, chakra and jutsu, equipment/inventory, quest state, dialogue, and durable saves. |
| Story | Manga Chapters 1–700; no anime-only filler; chapter evidence and review before “covered” status. |
| Platforms | Desktop and mobile browsers, with keyboard and touch controls. |
| Delivery | GitHub integration, automated checks before GitHub Pages deployment, persistent progress records and working builds. |
| Content rights | Original placeholder material wherever Naruto distribution rights have not been verified. |
| Quality | Inspect the actual playable environments. Basic rectangles and placeholder environments are never final artwork. |

## Milestones and exit gates

Statuses below describe scope and gates. Implementation/test results are recorded in `.war-room/office/log/runs/`; no unchecked gate is implied complete.

| Milestone | Deliverable | Exit gate | State at planning |
| --- | --- | --- | --- |
| M0 — Baseline and architecture | Source audit, approved constraints, module boundaries, rights policy, first test plan. | Baseline recorded, architecture agreed, scope/provenance explicit. | Audit drafted; architecture review in session. |
| M1 — Playable original slice | Detailed original village; home/academy/shop/clinic; exploration, quest chain, story companion, tactical battle, reward, inventory, save/export/import. | New-game-to-completion run; defeat/retry; resource/item tests; map reachability; save robustness; desktop and phone-sized browser check; visible original-content labeling. | Implementation underway; QA pending. |
| M2 — Production core | Multi-map campaign flow, battle targeting/statuses, party lifecycle, progression tables, jutsu unlocks, quest branching, robust persistence/migrations, settings. | No chapter-specific logic embedded in renderer; systematic gameplay tests; multiple party sizes; migration compatibility; adversarial save tests. | Planned. |
| M3 — Art and presentation | Production tilesets/sprites, authored village landmarks/interiors, animation, battle staging, music/SFX, accessibility/UI polish. | Owner-target visual comparison passes at gameplay scale; consistent scale/palette; provenance complete; mobile readability/performance verified. | Foundation art only; final art approval open. |
| M4 — Canon content pipeline | Chapter registry, source annotations, rights manifest, script format, location/party/jutsu mappings, automated continuity checks. | All 700 chapter IDs present; gaps/duplicates detected; filler excluded; rights-gated export; one representative segment passes editorial and gameplay review. | Planned; canon release gated. |
| M5 — Early campaign | First approved canon content batch, followed by successive verified contiguous batches. | Every included chapter maps to playable or explicitly reviewed narrative treatment; start/end party and world flags match approved source notes. | Not implemented. |
| M6 — Complete campaign | Expand the same process through Chapter 700, including required locations, encounters, transitions, and ending. | All 700 entries satisfy editorial, rights, implementation, QA, and continuity gates. No fabricated “100%” coverage from chapter numbering alone. | Not implemented. |
| M7 — Release candidate | Balance, progression/economy tuning, polish, migration/recovery, cross-browser/device QA, packaging and rollback. | Campaign completion playthroughs; no critical blockers; defined device/performance matrix passes; final content/art sign-off. | Not release-ready. |

## M1 release checklist

The coordinating run must attach actual evidence before checking these boxes:

- [ ] Original village has a distinct composition, layered scenery, and readable traversable routes.
- [ ] Required interiors are enterable and exit without trapping the player.
- [ ] Dialogue and objective updates guide a new player through the slice.
- [ ] Story events add/remove companions correctly and never exceed four active members.
- [ ] Attack, chakra-consuming jutsu, guard, and consumable use have distinct effects.
- [ ] Victory rewards apply exactly once; defeat allows safe recovery/retry.
- [ ] Experience/level progression, chakra, inventory, and quest flags survive a save round trip.
- [ ] Malformed/future/oversized save input cannot silently corrupt the running game.
- [ ] Save errors are explained, and export/import provide a recovery route.
- [ ] Held keyboard/touch movement stops on release, cancellation, blur, and menu/battle entry.
- [ ] A clean build and automated checks pass.
- [ ] Actual desktop and phone-sized gameplay screens are inspected.
- [ ] Changed code receives independent review and material findings are resolved.
- [ ] GitHub branch/PR and CI results are recorded; merge and deployment status are explicit.

## Content production cadence

Work in small contiguous chapter batches after the rights and pipeline gates. Each batch begins with a source-reviewed event outline, then a level/encounter plan, authored dialogue and original or licensed assets, implementation, continuity validation, and normal-control playthrough. Batch size follows complexity; the roadmap does not invent exact arc boundaries or a completion date.

The chapter denominator is fixed at 700. Track at least: planned, source-reviewed, rights-cleared, scripted, implemented, playtested, and accepted. A chapter may receive an intentionally compressed narrative treatment only after editorial approval; it must still have an explicit record and cannot disappear into a broad “arc complete” label.

## Architecture direction

Use a static browser client with native ES modules and Canvas 2D rendering. Keep content/map definitions separate from pure gameplay rules. Browser adapters own input, DOM panels, storage, file import/export, and rendering. Gameplay tests should run without a canvas or browser. Publish only the curated build output to Pages.

The agreed initial modules are `engine.js` (pure mutable state transitions and save serialization/restore), `world.js` (maps, collision, facing-based interaction lookup), `render.js` (Canvas rendering), and `main.js` (DOM controls, input, and storage). The village design is 48 × 36 tiles at 16 pixels per tile, with a 768 × 512 canvas view and four interiors. A door is entered by facing and interacting with it; walking over a door does not silently change maps.

The state boundary must enforce valid tile positions, party constraints, story transitions, turn order, bounded resource values, and one-time rewards. Never use imported save fields as executable code or HTML. Detailed interfaces belong in the architecture document maintained by the implementation team.

### First original story loop

The original development protagonist is **Ren**; the authored companion is **Aya**. The stage contract is:

| Stage | Player goal | System exercised |
| --- | --- | --- |
| 0 | Speak to the instructor inside the academy. | Interior interaction, dialogue, objective state. |
| 1 | Collect supplies at the shop. | Shop interaction, quest item/inventory. |
| 2 | Return to the academy; Aya joins. | Required flag validation, story-driven party update. |
| 3 | Defeat the trainee in the village. | Multi-member tactical rounds, enemy telegraph, resources and items. |
| 4 | Report back to the instructor. | Victory flag, one-time progression/reward. |
| 5 | Original slice complete. | Persistent completion, no duplicate rewards. |

The tactical action contract includes strike, jutsu, guard, focus, item, and flee. Defeat must recover to a valid retry state. This contract defines what to verify; it is not proof the implementation has passed.

## Quality and operations

- Budget: no paid services or account credentials required for the slice.
- Performance targets to establish in M2: responsive input, stable frame time on a named low-end phone, bounded map/entity and save sizes. Do not claim these passed from desktop emulation alone.
- Browser matrix: Chromium desktop and mobile viewport first; Firefox, Safari, actual iOS Safari, and Android Chrome before production readiness.
- Accessibility: keyboard-complete semantic actions, readable focus, contrast, text scaling, reduced motion, adjustable audio, and remapping review before final release.
- Delivery: build on a feature branch, automated checks, independent review, reviewable PR, then the authorized release path. Record the deployed commit and verify the live page separately.
- Rollback: retain the last working commit and save migration compatibility; redeploy a known good version through the same pipeline if a release fails.

## Known dependencies and limits

No verified Naruto distribution grant is recorded in this project. Original training content and game systems can progress now. Canon names, scripts, likenesses, music, sprites, and story reproduction must follow the owner's explicit original-placeholder instruction until the relevant rights evidence is reviewed. An agreement concerning another franchise does not establish Naruto rights.

The 45-seat protocol is an organizational roster, not 45 simultaneously running processes. Relevant real specialists run in batches within the environment's seven-agent concurrency ceiling. Seats not needed for this release, or not actually run, are not represented as independent approvals. No promise of unattended work after the current Work session is implied.
