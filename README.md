# Tourist Agent

An independent, Explore-only edition of Parallel World. Walk through four miniature cities — Dubai, Abu Dhabi, Tokyo, and Las Vegas —, visit landmarks, and collect local demonstration stamps and tickets.

The active edition loads 25 landmarks across these four cities. Dubai now includes an animated waterfront observation wheel and a circular observation-wheel island and a curved eight-vessel harbor with ten waterfront cafés/restaurants and five walkable finger piers, both connected to shore navigation and checkins. City navigation, collections, quests and the world map share the same roster; archived local checkins remain stored but are excluded from active progress. See [four-city validation](docs/four-city-edition.md).

Abu Dhabi phase 7 refines the Ferrari/cultural venue envelopes: reflective glazing, stone finishes, measured roof edges and entrance hardware. See [implementation, validation and limits](docs/abudhabi-phase-7.md).

Abu Dhabi phase 6 adds stone edges and flower ribbons to three lagoon islands, 12 further landscape beds, two venue shade courts and entrance paving. See [scope, verification and limits](docs/abudhabi-phase-6.md).

Abu Dhabi phase 5 brings district details closer to Dubai: 13 garden beds, two lakefront shade structures, finer foliage, low-rise façade and tower-entry details, road finishes and 16 detailed vehicles. See [comparison, verification and remaining gaps](docs/abudhabi-phase-5.md).

Abu Dhabi phase 4 opens the palace portico, adds a furnished interior visible from outside, and refines the forecourt paving and drainage. See [details, validation and access limits](docs/abudhabi-phase-4.md).

Abu Dhabi phase 3 refines mosque/palace domes, four minarets and the palace upper façades. See [geometry, validation and limits](docs/abudhabi-phase-3.md).

Abu Dhabi phase 2 adds open mosque arcades, a planted palace forecourt with a clear central approach, and five ordinary-tower silhouette families. See [details and validation](docs/abudhabi-phase-2.md).

Abu Dhabi phase 1 adds a marble mosque forecourt, shallow pools, a walkable Corniche, natural palms/shrubs and a restrained city façade palette. Six landmarks remain available for navigation and checkins. See [scope, validation and remaining work](docs/abudhabi-phase-1.md).

This repository has its own history and Vercel project. It does not merge changes into `parallel-world-cities-opening`.

## Run

```sh
npm ci
npm run dev
npm run check
npm test
npm run build
```

Open the printed localhost URL. WASD/arrow keys move, Shift runs, dragging orbits the camera, scrolling zooms, and M opens the world map. Touch controls are available on narrow screens. City buttons teleport to a destination. Music starts only when enabled in the menu.

`/` and `/explore` launch the same game. `/film` redirects to `/`; no cinematic or construction playback mode is shipped.

## Round 1: visual foundation

- Muted daylight and an authored environment reflection map.
- Dubai-only procedural limestone paving, sand, asphalt, grass and material roughness/bump variation at consistent world scale.
- A paved edge at the existing Burj Khalifa lake and a restrained Dubai vegetation/building palette.
- Camera-following shadow coverage and distance-based city visibility; all cities stay available on the world map.
- Quiet, responsive travel UI and separate `ta_` local storage keys.

## Round 2: west Dubai street study

- Two low-rise buildings: recessed glazing, limestone reveals, cornices, parapets and slim metal balcony rails. Geometry stays within the original building footprints and height.
- Nine nearby palms: feathered fronds, tapered ringed trunks and the original animated transforms. Three instanced draw calls for the grove.
- Geometry changes can be toggled independently of round 1 lighting/materials. Other cities and walking collision footprints remain unchanged.

## Round 3: Dubai waterfront district

- 23 buildings use limestone façades or quieter glass/bronze finishes. Two-storey foreground shops add arches, recessed windows, warm storefront panes, lanterns, balcony planters, timber screens and selected rooftop pergolas/wind towers. Building heights change; horizontal collision footprints stay in place.
- 24 main-island palms, 32 reserved street-furniture/planting footprints, waterfront paving, irregular shore stones, café canopies, benches and a small fountain.
- Analytic wave normals, Fresnel daylight and sun highlights replace the ocean's graphic white ripples. Dubai's lake and new fountain share the water treatment. Blue atmospheric sky with procedural wisps.
- A stepped silver Burj Khalifa study replaces its coarse silhouette; Dubai Frame and Museum materials are desaturated. Original landmark identities, navigation and picking holders remain.
- Reversible A/B switches retain rounds 1 and 2. Added planting/furniture collisions are enabled and removed with the district pass.

The concept reference remains an art-direction target, not a screenshot or an achieved photorealism claim. Assets are procedural approximations, not surveyed architecture or scanned materials. Other cities keep their architecture; global sky, lighting and ocean changes are visible throughout the world.

## Round 4: playable Eva (superseded by round 6)

- Replaced the chibi player and all four NPC meshes with an articulated Eva model: adult proportions, green-eyed facial albedo, center-parted wavy black hair, a square-neck puff-sleeve cream dress, pleated calf-length skirt and ivory Mary Jane heels. NPCs share the model with muted color variations and lower geometry detail.
- Hip/knee/ankle and shoulder/elbow/hand joints support idle, walk and run. Foot targets keep a sole planted; the skirt clears the moving knees, with updated normals and small hair/idle motion. This is a procedural animation system, not motion capture or physical cloth simulation.
- Player avatar and overhead label heights follow the new proportions. Walk/run speeds are 3/6 world units per second to better match the gait; city teleport buttons remain available. Camera minimum distance is 4.5 for closer inspection.
- Street refinements extend selected ground-floor arches and add small crossed bronze balcony details.
- In the review page, Eva 正面 / 侧面 / 背面 inspect the actual player; the pose button cycles idle → walk → run → idle. These are preview poses; ordinary controls still move the player through the world.

## Round 6: illustrated Eva and street finishes

- The latest supplied character design is used as transparent front/three-quarter/back image cards in the world, with independent per-actor view selection, scene depth occlusion and soft contact shadows. The HUD and guide panels use the same artwork. Movement is a subtle illustration bounce, not articulated leg animation. The old 3D module is no longer bundled.
- Dubai mainland roads add jointed kerbs, pavers, drainage grilles and crossings; intersections remain clear. Villa openings add wood panels, bronze pulls, pleated curtains and timber grain.
- See [round 6 notes](docs/round-6-illustrated-eva-streets.md) for the asset prompt, limitations, tests and screenshots; [round 5 notes](docs/round-5-architecture-plants.md) cover the retained foliage and arcades.

## Visual review

Round 7 adds 18 detailed Dubai sedans with rotating wheels, lights, mirrors and subdued paint; evenly spaced two-way traffic uses the existing mainland loop. Villa windows gain stone returns, stepped sills, curtains and partial blinds. See [round 7 validation and limitations](docs/round-7-vehicles-windows.md). Eva remains the illustrated character from round 6.

Open `/?review=1`. Choose 全岛 / 广场 / 近景 / 街区 / 滨海, freeze the environment at 180 seconds, and switch Before / After without moving the camera. 第七轮 · 车辆与门窗 switches between the new district and round 2. 车辆细节 inspects a real traffic car at time 180. 几何精修 switches back to round 1. `?review=1&district=off` starts at round 2; `?review=1&detail=off` starts at round 1. The panel reports load failures, runtime errors, camera/character positions and renderer metrics. Ordinary players do not see these controls.

## Source and assets

Derived, at the owner's request, from `ViviennaMAO/parallel-world-cities-opening`, commit `fc073c36dba12ab6443924bf4178d337f3b85c0d`, entry `PW_城市开场动画.html` (2026-11-02).

- Three.js: 0.160.0, installed and bundled locally (MIT).
- Landmark GLB JavaScript packages, embedded diffuse textures, icon and optional city music: existing `https://resources.parallelworld.com/assets/` service. They are not republished in this repository. Continued availability depends on that service; its asset rights remain with their respective owners.
- Procedural surfaces and daylight environment: authored in `src/realism.js`, generated deterministically in the browser. They are not scanned PBR texture sets.
- Font JSON: Three.js helvetiker font used by existing city signage.

Ticket purchases, PWV balance and rewards are local prototype demonstrations. No payment backend is connected.

## Layout

`src/game.js` owns the city generator, world, character, navigation and game UI. `src/realism.js` owns the reversible visual pass; shared base materials are not mutated. `src/base.css` retains the game layout, while `src/style-overrides.css` supplies the restrained visual treatment. Vite bundles the app, and `vercel.json` declares deployment and routes.

See `docs/round-1.md` through `docs/round-4.md` for scope, limitations and validation. The `src/dubai-*.js` modules own local geometry and its disposal; `src/water-study.js` owns the reversible water shader; `src/eva-sprite.js` owns the active illustrated characters; `src/eva-character.js` retains the superseded articulated study. `npm test` checks geometry bounds, actor restoration, collision lifecycle, landmark loading, shader restoration, foot contact, knee/skirt clearance and character disposal.
