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

Most buildings and landmark textures still come from the original game. The concept reference remains an art-direction target, not a screenshot. Landmark materials, additional buildings and the ocean are future local iterations.

## Visual review

Open `/?review=1`. Choose 全岛 / 广场 / 近景 / 街区, freeze the environment at 180 seconds, and switch Before / After without moving the camera. Use 第二轮 · 建筑与棕榈 / 第一轮 · 材质基线 to compare the geometry pass at identical lighting. `?review=1&detail=off` starts at the round 1 baseline. The review panel reports load failures, runtime errors, camera/character positions and renderer metrics. Before compares the retained base surfaces and lighting in this Explore build; both views include the same extraction, UI and visibility improvements.

## Source and assets

Derived, at the owner's request, from `ViviennaMAO/parallel-world-cities-opening`, commit `fc073c36dba12ab6443924bf4178d337f3b85c0d`, entry `PW_城市开场动画.html` (2026-11-02).

- Three.js: 0.160.0, installed and bundled locally (MIT).
- Landmark GLB JavaScript packages, embedded diffuse textures, icon and optional city music: existing `https://resources.parallelworld.com/assets/` service. They are not republished in this repository. Continued availability depends on that service; its asset rights remain with their respective owners.
- Procedural surfaces and daylight environment: authored in `src/realism.js`, generated deterministically in the browser. They are not scanned PBR texture sets.
- Font JSON: Three.js helvetiker font used by existing city signage.

Ticket purchases, PWV balance and rewards are local prototype demonstrations. No payment backend is connected.

## Layout

`src/game.js` owns the city generator, world, character, navigation and game UI. `src/realism.js` owns the reversible visual pass; shared base materials are not mutated. `src/base.css` retains the game layout, while `src/style-overrides.css` supplies the restrained visual treatment. Vite bundles the app, and `vercel.json` declares deployment and routes.

See `docs/round-1.md` and `docs/round-2.md` for scope and validation. `src/dubai-architecture.js` and `src/dubai-palms.js` own the reversible local geometry and its disposal; `npm test` checks geometry bounds and actor-transform restoration.
