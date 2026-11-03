# Abu Dhabi — main prayer hall

## Changes

- Replaced the opaque, faceted three-door courtyard frontage with smooth open arches and deep reveals. The inner hall doorway is also open, making the chandelier, carpet and back wall visible along the entrance axis.
- Fitted the interior to the measured source shell (x ±8.203, z -8.704 to -3.515, floor .326, ceiling 4.577). Added two lines of marble columns, gold capitals, longitudinal arches, transverse arches, wall skirting and recessed ceiling panels.
- Added a shallow gold mihrab recess, flanking wall frames, a green carpet with filtered geometric floral/border detail, and two tiered pendant chandeliers. Side screens have a restrained luminous finish; they do not simulate physical daylight through new exterior windows. No inscriptions were invented.
- Two short-range unshadowed lights provide local warm fill. A subtle emissive contribution keeps pale wall details readable. This is an artistic lighting approximation, not baked or path-traced indirect lighting.
- Added entrance, hall and side-aisle review cameras. The two interior views use a 55-degree lens; normal exploration/map configuration restores the original 35-degree field of view.

## Validation

- 135 tests; syntax and production build pass. Added open-door ray checks, selective source-cut preservation, light/resource lifecycle checks, and review-lens restoration coverage.
- Mosque fixture: 159,189 triangles, 13 batched draw calls, within the existing 160,000-triangle budget. Dome subdivision and oversized central-portal moulding tessellation were reduced to accommodate the hall; silhouette review remains part of browser acceptance.
- Browser review covers the new entrance/hall/aisle views, prior vestibule/side arches and city views, all 25 landmark assets, Abu Dhabi walking and six checkins, material toggles, and Dubai/Las Vegas regressions.

## Limits

The existing landmark collision boundaries are retained: this adds a visible interior, not a new walkable interior mode. Geometry and carpet motifs are stylized approximations, not a surveyed reconstruction of the Sheikh Zayed Grand Mosque. Side-room furnishings, elaborate dome interiors and photographic material assets remain future work. Mobile performance has not been benchmarked.
