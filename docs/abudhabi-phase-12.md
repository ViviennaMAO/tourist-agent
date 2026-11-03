# Abu Dhabi — small side arches and entry vestibule

## Changes

- Replaced the measured front and rear surrounds of both small mosque side passages with smooth open arches. Layered white/stone mouldings, slender columns, gold capitals, feet and coping give the openings depth. Front and rear apertures share the same profile and alignment.
- Rebuilt the central entry's rear surround so the original faceted profile no longer shows through the front portal. A narrow rectangular trim closes the cut/source seam; upper walls and source buffers remain intact.
- Added stone paving, perimeter inlay, narrow non-shadowing floor joints, wall skirting, shallow pilasters, divided ceiling trims and two warm glass pendant lamps to the measured entry vestibule. One short-range, unshadowed point light provides local fill; this is not baked/global indirect illumination.
- Added three review views for the side opening, ceiling/lamps and paving/skirting. Only the two interior review shots use a smaller camera orbit minimum; ordinary game camera behavior is unchanged.

## Validation

- 131 tests, including open-aperture ray checks, retained jambs, selective source cuts, finite geometry, source restoration, light lifecycle and the existing triangle budget.
- Mosque fixture: 155,636 triangles and ten batched draw calls, within the existing 160,000-triangle limit. One unshadowed point light is added. The first draft exceeded the limit; moulding tube segments were reduced before acceptance.
- Local browser checks cover the new views and existing Abu Dhabi review views, walking on the coast/Corniche/palace approaches, all six checkins, Before/After toggling, all 25 landmark assets, and Dubai/Las Vegas regressions. No runtime or console errors were recorded.

## Limits

These are visible entry-vestibule details, not a new navigable interior. Existing landmark collision footprints remain. The main prayer hall, farther courtyard openings and other interior areas still retain simplified source geometry. Materials remain procedural approximations; mobile performance has not been benchmarked.
