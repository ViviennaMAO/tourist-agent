# Abu Dhabi — coastal planting, roof crowns and mosque arcade

## Changes

- Added 56 coastal planting pockets with white/pink flowers, low foliage and 11 small branching trees. Placement follows the curved shoreline and avoids existing plots, roads, canal mouths, raised ground and the original promenade. The outer walking lane remains separate; planting collisions are registered and removed with the refinement layer.
- Ordinary towers now have recessed mechanical rooms, horizontal louvers, thin parapets, selected open crown fins and stepped roof shoulders. Existing sloped crowns remain. Components reuse batched materials and retain each tower's footprint.
- Rebuilt the six front wing arcade openings using measured source-mesh bounds, replacing the faceted source sections with smooth extruded arches. Added paired slender shafts, gold capitals, double arch mouldings, stone rosettes, layered cornices and dentils. Portal surrounds gain shallow floral relief and stepped frames without closing the existing doorway.
- Arcade marble uses restrained surface variation instead of the grainier paving response. All additions follow the existing Before/After and resource-disposal lifecycle.

## Verification

- 126 tests cover all cities, including coastal land containment, canal clearances, walking-lane clearance, reversible planting collisions, borrowed texture ownership and mosque wall surgery preserving the neighboring portal/rear wall.
- Browser review includes close coastal planting, mosque arcade and tower roof views; curved-coast, Corniche and palace walking; six Abu Dhabi checkins; Before/After restoration; and Dubai/Las Vegas regressions.
- Added review views: `abuCoastPlanting`, `abuMosqueCraft`, `abuRoofscape`.

## Remaining limits

The city is a compressed game island. Coastal planting uses formal repeated beds; the original mosque's central portal, rear elevations and some interior geometry remain simplified. Roof equipment is an exterior approximation. This pass adds no mosque interior exploration or mobile performance benchmark.
