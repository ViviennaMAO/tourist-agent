# Tokyo — phase 1

The first Tokyo pass replaces the primitive neighbourhood surfaces and vegetation while retaining the five source landmarks, road/rail network and navigation reservations. It belongs only to the independent `tourist-agent` project.

## Implemented

- 35 ordinary buildings: grey pitched tile roofs, timber lattice windows, projecting sills/eaves, fabric entrance curtains and lanterns for the western townhouses; neutral urban facades, slender frames, selected balconies, parapets and rooftop equipment for modern blocks.
- 102 branching trees, including 66 cherry trees. Seeded branch/flower geometry and textured broadleaf foliage replace solid crown spheres. Existing tree positions and collision footprints remain in place.
- Restrained grass colour, grey street kerbs, pedestrian crossings and drains; 16 detailed vehicles follow their existing routes.
- Two western pedestrian paths and checked doorway connectors; shallow temple/tower forecourt paving. The small surface offsets are below four centimetres and do not add elevated obstacles.
- 280 dark grey retaining stones along the original imperial island contour, with coping and a darker waterline. Stone faces sit outside the original half-metre bevel rather than behind it.
- Two local static reflection zones and the existing contact-shadow system now run near Tokyo. Global sun/exposure and the other cities' authored finishes are unchanged.
- Fixed an existing Imperial Palace visit issue: its moat kept the default arrival outside the automatic checkin range. A three-metre south-bank viewpoint now supports visiting while the water/collision remains closed.
- Nine review cameras cover the city, townhouses, cherry street, skyline, moat, Akihabara and the three tall/temple landmarks.

## Ownership and verification

The scene, trees and ground modules own their geometry/materials. Source pooled building/tree transforms and delayed landmark materials are restored on disable/dispose. No source texture is disposed. Street helper palette overrides leave its Dubai/Abu Dhabi defaults intact.

`npm run check`, `npm test` (109 tests), and `npm run build` pass. Browser checks cover nine Tokyo views, walking, five landmark checkins, repeated Before/After switches and returning to Abu Dhabi/Dubai. WebGL errors are captured separately. The existing Three.js bundle-size warning remains.

## Remaining work

This is the first visual pass, not a completed photoreal city. The old landmark geometry still determines Tokyo Tower/Skytree/temple/palace proportions and surface detail. Ordinary high-rises need more varied massing; empty lawns need deliberate street-block planting and furniture. Temple roofs, canal walls, railway platforms/bridges and Akihabara signage need their own close-up passes. Venues remain exterior scenery. Mobile performance has not been benchmarked.
