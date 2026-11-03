# Abu Dhabi — photo-reference towers and marble courtyard

The supplied coastal skyline and mosque photographs guide this pass. The existing compressed island layout is retained; the photographs are visual references rather than surveyed construction drawings.

## Implemented

- Replaced the coarse Etihad asset in the enhanced view with five separately shaped, oval blue-glass towers. Heights, lean and sloping crowns vary, with finer mullions, side blades and a glazed shared podium. A fourth local reflection probe serves this group.
- Kept the original landmark holder, navigation identity and reserved radius. The original asset and its size metadata are restored when the enhancement is disabled; delayed loading and disposal are covered by tests.
- Added 14 muted blue, rose and gold stone flower motifs with green vine/leaf inlays to the dry mosque forecourt. The continuous polished slab leaves a clear central route, stays below walking height, and does not cover the pools or add obstacles.
- Removed underlying tile geometry from the inlay area and separated pavement trim from shadow-casting architectural trim. This fixes square shadow artefacts that appeared in the first browser review.
- Neutralised the mosque's warm stone tint, including its added domes and arcades. The palace retains its warmer palette.
- Added eight ordinary buildings to available parcels (36 refined ordinary buildings total), avoiding roads, canals, garden plots, venue approaches and existing collisions. Their new collision reservations are reversible.
- Added review cameras for the five-tower group and courtyard inlays. Tokyo, Dubai and Eva's illustrated character remain intact.

## Verification

- Syntax checks, 116 tests and the production build pass. New coverage checks tower bounds and source restoration, dry-floor placement, deterministic infill and collision cleanup.
- Desktop browser review covers the overview, Etihad group, courtyard, mosque, Corniche, north skyline, palace/garden and Tokyo river, followed by return to Dubai. Six Abu Dhabi landmark arrivals/checkins, garden/Corniche walking and Before/After toggling pass; all 25 landmark assets load without console/runtime errors.
- The first inlay screenshot exposed hidden-tile shadow artefacts; a second close-up review confirmed their removal from the new slab. Remaining promenade trim uses a non-shadow-casting floor material.
- Existing large Three.js bundle advisory remains. The extra tower geometry is batched into six material draws; reflection probes refresh on invalidation rather than every frame. Mobile performance has not been benchmarked.

## Remaining gaps

The city still has a compact rectangular coastline rather than the long beaches and curved Corniche in the photographs. Generic tower façades remain repetitive, the mosque's original shell has simplified openings, and the floral pattern is a restrained procedural approximation. Local cube-map reflections do not reproduce the photograph's mirror-like courtyard reflections. Further passes should address these items individually; this is not a claim of photographic fidelity.
