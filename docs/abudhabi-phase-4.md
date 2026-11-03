# Abu Dhabi — palace entry, visible interior and forecourt finishes

The palace's blocked lower entrance is replaced by an open miniature portico and a furnished room visible from outside. The existing landmark collision envelope is retained: this is not yet a player-enterable hotel interior.

## Changes

- A box subtraction clips the old lower-front source triangles and interpolates their vertex attributes. Adjacent walls and upper façades remain intact; Before/After restores the borrowed original geometry.
- Added columns, a curved entrance arch, a stepped canopy, coffered underside and shallow threshold. The central entry is visually open; lightly tinted side glazing shows the room behind it.
- The room has separate back/side walls, floor and ceiling, a reception desk, small counter props, two seating groups, wood wall panels, pendant lights and an entrance rug. A bounded diffuse-light approximation adds cool window fill and warmer lamp contribution; it is not full global illumination.
- Forecourt slabs use two subtle warm stone tones and narrower joints. A small eight-point stone medallion, border bands and drainage slots distinguish the entrance axis. Approach walk height now matches the paving from the garden to the existing collision boundary.
- Added door-level and paving close-up review cameras.

## Verification

- Syntax checks, 95 tests and production build pass. The existing Three.js bundle-size advisory remains.
- New tests check partial-triangle clipping, removed wall area, UV interpolation, finite normals, source-resource ownership, palace-room cleanup and Before/After restoration.
- Browser review includes the new door and paving views, palace/city views, continuous central-axis walking, Corniche walking, all six Abu Dhabi checkins, material toggles and return to Dubai.

## Limits

The room is a shallow miniature interior for external viewing. A future walk-in interior needs a new height/layout and collision pass to fit Eva's current scale. Lights use emissive fixtures and local diffuse fill rather than extra dynamic point lights. Stone and furnishings remain procedural approximations. Mobile frame rate has not been benchmarked.
