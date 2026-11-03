# Tokyo — reference-image pass

The user supplied three Tokyo photographs on 2026-11-03: a dense Tokyo Tower skyline, a cherry-lined waterway, and the Sensoji/Skytree skyline. This pass follows their visible massing, vegetation and material cues, while retaining the miniature island layout.

## Changes

- Added 15 ordinary buildings after checking the existing roads, railway clearance, building/tree footprints, landmark reservations and palace shore viewpoint. The ordinary-building total is now 50. Selected taller buildings have recessed upper floors and rooftop setbacks.
- Added 13 cherry trees along the existing diagonal river, with asymmetric crowns leaning over water and low foliage at the roots. Existing cherries have broader, denser crowns and a pinker palette. The tree total is 115, including 79 cherries.
- Rebuilt the Skytree exterior as a slender tapered lattice, two glazed observation decks and a stepped antenna. Its 42-unit game height, existing pick target and navigation/checkin radius are retained. The source asset is reversibly hidden; it is not deleted.
- Tokyo Tower's orange atlas areas now use a deeper red while white areas retain their colour. Tokyo canal walls use grey stone rather than sandy tones. Global sky, sunlight and the other cities remain unchanged.
- Added a river review camera and widened the Skytree camera to include its antenna.

## Verification

113 tests pass, including deterministic/clear infill plots, reversible collision ownership, dry-bank tree placement, delayed Skytree loading, source restoration, geometry budget and unchanged navigation metadata. Syntax checks and production build pass; the existing bundle-size warning remains.

Browser verification covers ten Tokyo viewpoints, walking, all five landmark checkins, Before/After restoration, and return views in Abu Dhabi and Dubai. Screenshots and runtime logs are saved with the phase artifacts.

## Remaining differences

This is an incremental scene pass, not a reconstruction of the photographed city. The island has fewer blocks and much more open space; ordinary facades still need more variation. The Sensoji main hall, pagoda brackets/roof eaves, temple planting, canal embankment slope and Tokyo Tower's coarse structural members still need dedicated work. Cherry blossoms are real-time procedural geometry, not photogrammetry. No mobile performance benchmark was performed.
