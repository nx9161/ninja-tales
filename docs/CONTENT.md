# Content policy and campaign coverage

## Current content boundary

The playable foundation uses original characters, locations, dialogue, and code-native pixel scenery. Its training story is a **development slice**, not an adaptation of a Naruto chapter. The final approved design still specifies Naruto as the permanent overworld protagonist and a maximum four-member story-driven active party.

No Naruto distribution-rights evidence is stored or verified in this repository. The owner's instruction is to use original placeholders for any unverified material. This is a project release condition, not a legal opinion or a claim that merely changing names clears an otherwise copied story or asset.

Do not import manga pages, scanlations, anime footage/music, extracted commercial game sprites, franchise logos, or fan assets of unknown provenance. The approved village image is a visual quality reference; it is not automatically an asset license. Avoid public distribution of the reference image until its provenance and rights are established.

## Provenance records

Every shipped content/asset pack should have an explicit record before release:

| Field | Required meaning |
| --- | --- |
| `id` | Stable unique content or asset identifier. |
| `kind` | Map, sprite, animation, audio, dialogue, quest, encounter, item, jutsu, or chapter treatment. |
| `origin` | Original project work, licensed third-party work, or development placeholder. |
| `creator` | Author/artist/provider as known; do not invent ownership or a license grant. |
| `source` | Source URL or project path; private agreements should be referenced privately, not committed. |
| `license` | Exact applicable license or approval reference; “found online” is not sufficient. |
| `distributionStatus` | `original`, `verified`, `unverified`, or `blocked`. |
| `review` | Reviewer, date, scope, and remaining limitations. |
| `replaces` | Final asset/content identifier when this is a placeholder. |

Original code-native art should remain editable in source. If third-party tools or assets are introduced, keep their required notices and record whether the license covers the tool, output, or both. Tool availability is not proof of permission to distribute supplied franchise material.

## Canon chapter registry — planned

The registry must contain exactly one record for each integer Chapter 1–700. A bare range or list of titles is scaffolding, not playable coverage. Until that pipeline and editorial review exist, report canon coverage as **0 verified playable chapters out of 700**, regardless of how many original mechanics have shipped.

Recommended record fields:

```json
{
  "chapter": 1,
  "status": "planned",
  "sourceReferences": [],
  "sourceReviewedBy": null,
  "rightsStatus": "unverified",
  "treatment": null,
  "events": [],
  "maps": [],
  "encounters": [],
  "partyBefore": [],
  "partyAfter": [],
  "requiredFlags": [],
  "resultFlags": [],
  "jutsuUnlocks": [],
  "assetIds": [],
  "qaEvidence": [],
  "acceptedBy": null
}
```

This is a schema proposal, not implemented chapter content. The first record is an example of an empty planning entry and makes no claim about Chapter 1 events.

Required validators before canon production:

1. Exactly 700 unique integer chapter IDs, with no gaps or out-of-range entries.
2. Each accepted record has reviewed source references, rights clearance, an explicit narrative/playable treatment, and QA evidence.
3. Required event order and world flags connect across chapter boundaries.
4. Active party always includes the permanent protagonist, contains unique members, has no more than four members, and changes only at authored story events.
5. Referenced maps, actors, items, jutsu, encounters, and assets resolve to real records.
6. No anime-only event is accepted without evidence that it belongs to the original manga scope.
7. Rewards cannot replay after completion or after loading a save; chapter transitions remain recoverable.
8. Public build packaging rejects blocked or unverified franchise content and omits private evidence.

## Original slice versus final campaign

| Layer | Foundation meaning | Final campaign requirement |
| --- | --- | --- |
| Protagonist | An explicitly original development character. | Naruto, after applicable rights review. |
| Village | Original environment exploring the approved density, palette, and navigation quality. | Faithful required locations with approved content/art. |
| Companion | Original companion demonstrating authored party changes. | Canonical join/leave chronology and maximum four active characters. |
| Quest | Original training narrative exercising dialogue, inventory, battle, and rewards. | Source-reviewed chapter event treatments across 1–700. |
| Jutsu and chakra | Original mechanics and names testing resource and tactical systems. | Approved character-specific progression consistent with reviewed source notes. |
| Art | Editable original pixel scenery, explicitly a foundation. | Final reviewed assets that approach the approved in-game concept. |

## Status reporting rules

Keep system readiness, art approval, story coverage, rights review, device verification, and deployment as separate statuses. A passing unit test does not approve the art; a visually polished map does not complete a chapter; a local build does not prove GitHub Pages is live. Never relabel original training content as canon to make the progress percentage appear larger.
