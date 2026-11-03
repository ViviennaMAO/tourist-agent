# Abu Dhabi — portal, planting and lobby close-up refinement

## Changes

- Replaced the central mosque doorway's faceted surround with a smooth horseshoe/pointed profile, a 0.358-unit deep reveal, layered mouldings, jamb bases and a small crown ornament. Geometry is cut only in the measured central surround; the upper facade and adjacent bays remain intact. The aperture stays open. Thin white trim does not cast its own shadow, avoiding striped shadow-map artifacts over the adjacent marble; the wall still casts shadows.
- Reworked public-realm planting across the coastal beds, gardens and venue grounds: smaller varied leaves, restrained per-leaf color differences, a low groundcover layer, five-petal flowers and slender stems. Small tree crowns have asymmetric branch directions and less uniform clusters. Existing plot positions, counts and collision boundaries remain.
- Added chamfered planter walls and raised coping around the soil. Ordinary-tower lobbies gain base courses, inset joints, canopy brackets and narrow threshold grilles using existing batched materials. These are exterior details, not new interior destinations.
- Added close review cameras for the central portal, planting and tower entry.

## Validation

- 128 tests. New portal ray checks verify the open aperture and solid jambs; geometry surgery checks preserve the upper facade and borrowed source buffers.
- Planting retains the original test budgets: the public-realm fixture is 179,658 triangles and nine draw calls (under the 200,000-triangle cap); the landscape fixture remains below 230,000 triangles and 17 draw calls. Leaf/stem meshes were simplified after the first draft exceeded these limits.
- Browser checks cover the new close views, the coast, courtyard reflection, towers and palace; curved-coast/Corniche/palace walking; all six Abu Dhabi checkins; Before/After restoration; Dubai and Las Vegas regressions; all 25 landmark assets; and runtime/console errors.

## Remaining limits

The mosque's two small side openings, inner/rear arches and much of its interior retain their original simplified geometry. The scene remains a miniature city, and planting is still procedural. No mobile performance benchmark or change to the other cities' visual designs is included.
