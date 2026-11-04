# Interior refinement — architecture, furnishings and light

## Delivered

All 15 rooms share layered cornices and skirting, ceiling enclosures, subtle stone variation, refined furniture and environment/contact lighting. Opening a room starts inside; the overview hides the ceiling for model inspection. The existing outdoor position, saved visits and three-city scope remain intact.

Abu Dhabi receives the most extensive additions:

- Prayer hall: recessed curved mihrab, layered pointed mouldings, floral wall panels, column bands/capitals, tiered crystal chandeliers, bookcases and book stands, woven-pattern carpet.
- Palace: dark inset panels, arch surrounds, lattice reception backdrop, flower vases, furnished seating areas, rugs, dome details and an architectural reflection in the central pool.
- Racing gallery: pit drawers, telemetry screens, track lighting, wheel spokes/headlights and a landscaped circuit model.
- Etihad lounge: bar stools/counterware, pendants, wall slats and articulated tower models with roads and planting.
- Courtyard gallery: model doors, windows, frames, cornices, steps, planting and wall lighting.

Dubai and Las Vegas also receive theme-specific additions including aquarium coral/fish details, future-life pod frames and animated planet, cruise-model windows/masts, Luxor column details, balloon railings and Sphere seating/aisle lights/speakers with an animated screen. Sphere’s entry camera is raised above the rear seats; the future gallery ceiling clears its orbital rings.

## Runtime

Geometry remains batched by material; each room stays below 100,000 triangles and 40 root draw calls in the geometry tests. At most one 512-square planar pool reflector is active per room, captured at up to 24 Hz. The contact-shading normal pass excludes the reflector to avoid recursive captures. Shadow maps are 2048 square and DPR is capped at 1.5. Room resources and reflection targets are disposed on change; the shared environment target and renderer are released when the viewer closes.

These are geometry budgets, not a claim of measured frame rate on every device. Reflection, contact shading and shadow rendering add passes beyond the root draw count.

## Verification

- Syntax checks, production build and all 139 tests pass. The existing bundle-size advisory remains.
- Browser checks cover all 15 rooms, their detail/inside/overview views, saved visits after reload, mobile layout, return-position preservation and all 20 exterior landmarks.
- Screenshots were reviewed for Abu Dhabi architecture/furniture, mobile prayer-hall views, Sphere entry visibility and the future-gallery ceiling. No browser errors were reported in local acceptance.

## Remaining limits

Materials and exhibit surfaces are procedural interpretations. Windows do not show a live exterior panorama; indoor trees, fish and vehicles remain stylized/static. Room scale and layouts are designed miniature studies rather than surveyed reproductions. The detail level is improved, but it does not yet match photographic architectural references.
