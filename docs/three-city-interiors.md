# Three-city tourism and enterable interior studies

## Scope

The active game now contains Dubai, Abu Dhabi and Las Vegas only (20 landmarks). Tokyo is removed from the runtime recipe, map, city picker, quests, collections and model requests. Archived source studies and old saved checkins are retained; they do not count toward current progress. Las Vegas moves to the former southwest grid slot so the three islands remain connected by the existing bridge system.

The independent `tourist-agent` repository and deployment remain separate from `parallel-world-cities-opening`.

## Fifteen spaces

| City | Landmark → interior theme |
| --- | --- |
| Abu Dhabi | Grand Mosque → white-stone prayer hall; Emirates Palace → garden hall; Ferrari World → racing design gallery; Etihad Towers → bay observation lounge; Abrahamic Family House → light/courtyard gallery |
| Dubai | Burj Khalifa → skyline observation hall; Museum of the Future → future-life gallery; Atlantis → aquarium lounge; Burj Al Arab → blue/gold atrium; cruise terminal → harbor travel hall |
| Las Vegas | Sphere → star-screen theatre; Luxor → pyramid atrium; Resorts World → indoor garden hall; Strat → observation lounge; balloon landmark → Paris-themed observation capsule |

These are independently authored, explorable 3D dioramas, not photographs or measured reproductions. Each contains its own furnishings/exhibits or garden/water miniature. Abu Dhabi receives the most detailed first pass: supported ribbed palace dome, chandeliers, column arches, carpet borders, wall grilles, metric stone/wood finishes, branched interior trees, shaped car bodies and wheels, curved observation glazing, and three architectural courtyard models.

## Access and controls

- Open “室内” on the outdoor HUD to choose one of five spaces per city.
- Supported landmark cards also show “进入室内 · 查看微景观”. Entry is available without buying a demonstration ticket.
- “微景观全景” fits the entire model to the current screen; “步入室内” places the observation camera inside. Three named detail viewpoints provide closer inspection.
- Drag to orbit; scroll or pinch to zoom. WASD/arrows translate the observation camera. This is not collision-driven avatar walking or seamless entry through an outdoor doorway.
- Esc or “返回城市” restores outdoor position and controls. Native dialog focus trapping and restoration keep keyboard interaction inside the viewer.
- Interior exploration is stored separately as `ta_interior_visits`; unknown/removed spaces are ignored. Reset demonstration data clears it along with the other local progress.

## Runtime and limits

Only one interior is rendered at a time; outdoor simulation/rendering pauses while its dialog is open. Geometry is batched by material. Scenes, materials, controls, shadow targets and the extra WebGL context are released on exit. The viewer uses a 1024px shadow map and caps DPR at 1.5. Desktop and mobile camera fitting uses actual scene bounds.

This first interior release establishes all 15 usable spaces. Water, fish, vehicles and exhibits are largely static; glazing uses stylized reflected-horizon detailing, not a live panorama. Indirect light is an approximation. Fine upholstery, unique scanned materials, moving exhibits and photorealistic interiors remain future refinement work.

## Verification

- `npm run check` and `npm run build` pass. The existing Three.js chunk size warning remains.
- 138 automated tests cover the three-city roster, bridge connectivity, old-save filtering, 15 distinct registered spaces, valid geometry, resource disposal and portrait/landscape camera fit, plus prior city checks.
- Browser acceptance opens all 15 rooms, selects every detail viewpoint, enters inside views and returns to the city; it also checks 20/20 landmark loads, the 3-city picker, mobile directory/room layout and saved visits after reload.
- Actual renders are captured for all room overviews and Abu Dhabi detail/inside views. These are procedural theme studies; passing functionality checks is not a claim of matching the reference photographs.
