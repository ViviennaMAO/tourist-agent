# Tourist Agent

An independent, Explore-only edition of Parallel World. Walk through eleven miniature cities, visit landmarks, and collect local demonstration stamps and tickets.

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

The concept reference remains an art-direction target, not a screenshot or an achieved photorealism claim. Assets are procedural approximations, not surveyed architecture or scanned materials. Other cities keep their architecture; global sky, lighting and ocean changes are visible throughout the world. Player/NPC models still use the existing chibi style; Eva's guide panels use the supplied character direction.

## Visual review

Open `/?review=1`. Choose 全岛 / 广场 / 近景 / 街区 / 滨海, freeze the environment at 180 seconds, and switch Before / After without moving the camera. 第三轮 · 街区整体 switches between the new district and round 2. 几何精修 switches back to round 1. `?review=1&district=off` starts at round 2; `?review=1&detail=off` starts at round 1. The panel reports load failures, runtime errors, camera/character positions and renderer metrics. Ordinary players do not see these controls.

## Source and assets

Derived, at the owner's request, from `ViviennaMAO/parallel-world-cities-opening`, commit `fc073c36dba12ab6443924bf4178d337f3b85c0d`, entry `PW_城市开场动画.html` (2026-11-02).

- Three.js: 0.160.0, installed and bundled locally (MIT).
- Landmark GLB JavaScript packages, embedded diffuse textures, icon and optional city music: existing `https://resources.parallelworld.com/assets/` service. They are not republished in this repository. Continued availability depends on that service; its asset rights remain with their respective owners.
- Procedural surfaces and daylight environment: authored in `src/realism.js`, generated deterministically in the browser. They are not scanned PBR texture sets.
- Font JSON: Three.js helvetiker font used by existing city signage.

Ticket purchases, PWV balance and rewards are local prototype demonstrations. No payment backend is connected.

## Layout

`src/game.js` owns the city generator, world, character, navigation and game UI. `src/realism.js` owns the reversible visual pass; shared base materials are not mutated. `src/base.css` retains the game layout, while `src/style-overrides.css` supplies the restrained visual treatment. Vite bundles the app, and `vercel.json` declares deployment and routes.

See `docs/round-1.md`, `docs/round-2.md` and `docs/round-3.md` for scope, limitations and validation. The `src/dubai-*.js` modules own local geometry and its disposal; `src/water-study.js` owns the reversible water shader. `npm test` checks geometry bounds, actor restoration, collision lifecycle, late landmark loading and shader restoration.
