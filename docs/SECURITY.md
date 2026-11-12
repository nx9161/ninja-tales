# Security review — original-content slice

Review scope: static application and local save boundary. This is a source review, not an independent penetration test or a claim of production certification.

## Boundary decisions

- The game has no account, server, payment, multiplayer, telemetry, or AI execution surface. It requires no secrets and ships no production dependencies.
- Save imports are untrusted. Parse at a bounded size, validate version, map, integer positions, walkability, story-derived party composition, progression, resource bounds, and then construct known fields. Never merge arbitrary imported objects into application state.
- Render imported messages and player-visible content with text nodes, not HTML interpolation. A malformed import must leave the active game and previous saved copy intact.
- Local storage writes and reads can fail. Surface the error and preserve the active in-memory game; never announce saving succeeded when it failed.
- Storage is origin-local, not authentication or encryption. Exported saves contain gameplay data only. Clearing browser storage removes local saves.
- Keyboard and touch input must release on pointer cancellation, window blur, and hidden tabs. Menus and conversations must block world movement.
- Build uses an explicit runtime allowlist. Private working notes, tests, version-control metadata, and development dependencies are excluded from the Pages artifact.
- CI has read-only repository access. Pages write and OIDC permissions are confined to the gated deployment job; PR checks cannot deploy.

## Verification status

See `docs/QA.md` (when produced) and the recorded test output for checks actually run. CI configuration alone is not evidence that a remote workflow or deployment succeeded. Any unrun browser or device case remains unverified.
