# Abu Dhabi — district detail pass against Dubai

Comparison of fixed overview and close views showed the biggest gap between landmarks: blank paved margins, simple low-rise windows, sparse lake seating, plain road edges and early car models. This pass brings those areas closer to the established Dubai detailing language while retaining Abu Dhabi's white marble, warm stone and restrained bronze palette.

## Implemented

- 13 collision-checked garden beds, four branching shade trees and two lakefront timber pergolas with benches, tables and planted pots. Placement excludes roads, canals, water, landmarks, existing buildings and the earlier mosque/palace garden furniture.
- Existing shrubs intersecting accepted seating courts are hidden together with their original reservations; Before/After restores both. New gardens own and remove only their own collision rectangles.
- Replaced regular leaf spirals in Abu Dhabi shrubs with seeded volume sampling, smaller leaves and varied tilt; new trees use branching, overlapping leaf clusters instead of a hollow regular shell.
- Low-rise projecting sills, stone reveals, lintels, bronze mullions, canopy rafters, parapets and selected rooftop timber shade structures. Ordinary towers gain ground-floor glazed entry framing, shallow canopies and thresholds.
- Reused Dubai's batched road-edge finishes: kerb joints, gutter details, grates and junction crossings. The original Dubai road filter remains the default; Abu Dhabi opts into its non-bridge roads.
- Reused detailed vehicles for Abu Dhabi's 16 cars, retaining each source route and distributing the cars along each route.
- Added lakefront and north district review views. Global lighting, Dubai's composition and the other city layouts are unchanged.

## Verification

- Syntax checks, 98 tests and production build pass. Tests cover placement safety, source shrub/collision restoration, finite batched geometry and resource ownership. The existing Three.js bundle-size advisory remains.
- Browser review: 12 Abu Dhabi views, palace central-axis and Corniche walking, all six Abu Dhabi landmark arrivals/checkins, material toggles and return to Dubai. All 25 landmarks loaded; no browser runtime errors in the reviewed session.

## Remaining visual gaps

This is still a stylized miniature rather than the photoreal reference. The north tower bases and large east/west gaps remain sparse; Ferrari World's shell, the Abrahamic Family House surroundings and lagoon island edges need dedicated detailing. Lake gardens are modest clusters, not a continuous planted waterfront. Seating courts are decorative furniture zones with collision, not a sit interaction. The palace interior remains visible from outside only. Mobile performance is not benchmarked.
