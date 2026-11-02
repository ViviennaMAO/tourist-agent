# Round 14 — paving, arcades, foliage and fountain

Continues the Dubai waterfront pilot in `tourist-agent`; the original game repository is untouched. Eva remains the illustrated multi-angle character. Layout and traversal footprints are unchanged.

## Changes

- Slabs use restrained individual stone colours instead of a second wall-joint texture. General paving has weaker joint contrast and bump. Browser A/B inspection identified SSAO as the remaining source of dotted black seams: thin slabs now use the continuous ground below for contact depth, while planters/buildings keep their contact shadows. SSAO also attenuates nearly coplanar occluders by their height above the receiving surface.
- Arcade piers, arch mouldings and balcony members are slimmer. Arch joints are narrower, with a continuous trim finish; alternating wall-coloured wedges had made the arch appear broken in close views.
- Palm fronds have less regular angles and colour, two aged lower fronds with missing leaflets, and a restrained backlight tint. Shade trees use a separate bark finish and a slightly curved stem. Dense flowering clusters include small woody branches.
- Seven thinner, translucent fountain jets land separately inside the basin. 168 animated point droplets share the trajectories; each landing contributes fading water ripples and a small disturbed patch. Points are excluded from static reflection captures. Freeze mode stops the droplet buffer updates.
- Sea normals combine broad waves, irregular analytic noise gradients and small cross ripples; the smallest ripple frequency fades with screen footprint. Sun highlights have a narrow and a broad lobe. This is analytic sky/sun shading, not reflected scene water.

## Validation

- 27 tests pass, including fountain landing separation, bounds, deterministic freeze and animation advance. Existing collision, resource disposal, arcade depth and reversible A/B tests remain passing.
- Syntax check, production build and whitespace check pass. The existing Three.js vendor chunk warning remains (560.34 kB minified).
- Browser: checked waterfront, fountain, shopfront, garden, street and quay at 1280×720 CSS pixels / DPR 1.5. No captured console warnings or errors; review HUD reports 54/54 landmarks and zero runtime errors.
- Evidence in `validation/round-14/`: `waterfront.png`, `fountain.png`, `facade.png`, `garden.png`, `palms.png`, `quay.png`. Contact shadows are enabled in final images. These are actual running-game screenshots.

## Remaining reference gap

The scene still reads as procedural game geometry. Coastal rocks remain too regularly coursed and the coastline too straight; trunk bark is still visibly faceted; flowers need more varied silhouettes and fuller trailing growth. Facade ornament, pavement transitions and the warm/cool lighting balance remain less rich than the reference. Sea reflections are approximate, and some AO stepping remains around narrow coping edges. No claim of matching the reference's photoreal quality or of full-device performance validation.
