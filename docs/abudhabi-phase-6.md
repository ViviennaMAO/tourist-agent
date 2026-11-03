# Abu Dhabi — venue grounds, lagoon shores and infill gardens

The three lake islands previously ended in exposed grass bevels, while the Ferrari World and Abrahamic Family House edges lacked planted transitions and places to pause. This pass adds detailed shore edges and a second set of checked landscape plots.

## Changes

- Three lake-island boundaries now have pale stone coping, recessed backing, staggered stone faces and a darker waterline band at the lagoon's actual 1.31 m water level. The geometry follows source circle/capsule dimensions; it does not use the sea-level coast generator.
- Stone widths vary independently of the coping joints. Shared face normals remove the obvious triangular facets seen in the first close-up review.
- Interrupted low flower ribbons follow the inner island edges and avoid the existing palm bases. The city-name sign remains unobstructed.
- Actual world placement accepts 12 additional flower beds and two shaded seating courts around the venue edges and remaining gaps. Some beds are long, others combine groundcover with branching trees. Their layout rejects original buildings, water, roads, landmark envelopes, earlier landscape plots and both venue arrival axes.
- Added nearly flush paving at Ferrari World's arrival and a bordered threshold across the cultural venue's existing promenade frontage. Public-space furniture owns its collision rectangles; lake-island decoration adds no new navigation surfaces.
- Reduced alpha cutout threshold on Abu Dhabi garden foliage after the overview exposed disappearing distant leaves. Shared Dubai vegetation and lighting remain unchanged.
- Added three fixed review cameras for the lagoon edge and both venue grounds.

## Verification

- Syntax checks, 101 tests and production build pass. Tests cover shore direction/fit, deterministic layout, reserved entrance clearances, finite geometry, resource cleanup and collision restoration. New geometry stays below 230,000 triangles and at most 17 material batches in the test fixture. The existing Three.js bundle-size advisory remains.
- Browser review covers the new views, the existing Abu Dhabi cameras, palace/Corniche walking, all six local checkins, Before/After restoration and return to Dubai. All 25 city landmarks load successfully.

## Limits

The lake islands remain decorative and inaccessible across the existing water collision. The courts are scenery, without a sit interaction. Venue interiors and shell geometry still need their own later pass. The shore remains authored procedural masonry, not scanned stone. Mobile performance has not been benchmarked.
