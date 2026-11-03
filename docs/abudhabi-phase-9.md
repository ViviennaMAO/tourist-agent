# Abu Dhabi — curved Corniche, varied tower façades and marble reflections

## Implemented

- Replaced the mainland rounded rectangle with a sampled outward-curving polygon. The original usable land remains inside it, retaining existing landmarks, buildings and garden routes. The two canal mouths remain anchored; the original raised north/east plots are preserved.
- Added a slim curved coastal walkway and edge strip along exposed low ground, with gaps at canals and bridge approaches. Revetment stones follow the actual new outline. Abu Dhabi canal mouths now exclude revetment segments, and their water fall extends beyond the wider bank lip.
- Ordinary towers retain their footprints and five massing families but now use four independent façade treatments: fine silver curtain walls, pale stone window bays (selected small balconies), narrow vertical fins, and bronze/glass spandrel bands. Three restrained glass palettes, corner returns and differentiated floor spacing reduce the uniform white grid.
- The existing floral marble forecourt gains a camera-dependent planar reflection at its actual height. A lightly filtered capture is mixed with the lit stone and flowers, with stronger reflection at grazing angles. It does not replace the floor with a second mirror mesh.
- Capture is limited to 10 Hz, only while the courtyard intersects the camera frustum within 85 units. Other cities are excluded from that reflection pass. Disabling reflections or the enhancement restores the material response; errors restore renderer state and hidden objects.
- Added coastline, façade and low-angle reflection review views. Review position reporting retains the actual smoothed character height introduced in the Vegas pass.

## Verification

- Syntax checks, 123 tests and production build. New coverage samples the old usable land inside the new coast, checks canal outlets and shoreline gaps, confirms walkway resource ownership, and verifies the reflected-camera height, failure restoration and distant-view capture suppression.
- Existing material/instance restoration and all city tests pass. The ordinary-building draw-call bound increases from below 20 to below 24 for the fixture, reflecting the additional batched glass/metal finishes.
- Browser route covers the curved coast, courtyard reflections, ordinary façade types, five-tower landmark, promenade and palace garden, plus Las Vegas and Dubai regressions. Six Abu Dhabi arrivals/checkins, palace/Corniche walking and Before/After restoration are checked; all 25 assets must load without runtime/console errors.
- The shoreline recipe change is permanent in both comparison views; material and detail layers remain reversible. The scene is still a compressed island, not the geographic Corniche.

## Limits

Reflections are a 768×432 planar approximation with a small spatial filter, not ray-traced rough reflections. Their extra render cost is reduced by distance/frustum/rate limits but mobile performance has not been benchmarked. Generic towers and the original mosque shell remain simplified; curved-coast planting and more detailed beach transitions remain separate work. The existing large-bundle advisory remains.
