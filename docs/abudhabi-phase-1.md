# Abu Dhabi — phase 1

The independent Tourist Agent edition now gives Abu Dhabi its first material and landscape pass. Dubai remains at its preceding revision; this phase does not change the global sun/exposure or the Dubai district design.

## Delivered

- White marble mosque approach with two shallow blue pools, a clear central entrance and low-contrast stone veining.
- A continuous Corniche promenade on both sides of the existing canal mouth, with six benches, six layered flowerbeds, slender rails and ten lamps. The canal remains open; pools, beds and benches have walking obstacles.
- 43 detailed palms, 56 layered leaf shrubs and exposed island revetments. Existing actor locations and animation transforms are retained.
- 28 ordinary buildings use restrained blue-gray glazing or warm stone and timber; floor bands, mullions, canopies and base trims fit their original footprints.
- Six existing landmark assets receive local atlas/material grading. Ferrari World retains its red identity. No landmark identifiers or checkin targets were replaced.
- Two local environment probes for the courtyard and skyline, with contact shadows near Abu Dhabi. Other cities retain their own reflection coverage.
- Five repeatable Abu Dhabi review cameras. Collection navigation temporarily hides the review overlay so it cannot intercept clicks.

## Art direction references

The [Sheikh Zayed Grand Mosque's white marble](https://szgmc.gov.ae/en/islamic-architecture/the-white-marble) and [reflective pools](https://www.szgmc.gov.ae/en/islamic-architecture/reflective-pools) guide the mosque forecourt palette. [Experience Abu Dhabi's architecture overview](https://visitabudhabi.ae/en/plan-your-trip/article-hub/13-must-see-architecture/) guides the distinction between stone cultural buildings and contemporary towers. The game remains a compressed miniature layout, not a surveyed recreation of the city.

## Verification

- `npm run check`, 88 unit tests and production build pass. The existing Three.js bundle-size advisory remains.
- Chromium/Metal, 1440×900: all 25 active landmarks load; no browser runtime or shader errors.
- Real keyboard movement along the Corniche passes. Collection navigation arrives at and records all six Abu Dhabi checkins.
- Before/After restoration is exercised, followed by a return to Dubai's waterfront.
- Reviewed overview, mosque, Corniche, palace and skyline screenshots. Automated tests cover the dry lane, source-transform restoration, resource ownership and navigation cleanup.

## Next passes / limits

- The mosque's original simplified domes, minarets and arches still need dedicated geometry work, column detail and recessed openings.
- Palace gardens, shaded courtyards, pavement transitions and remaining broad empty parcels need a separate landscape/layout pass.
- Ordinary towers currently share a restrained curtain-wall vocabulary; their crowns, silhouettes and façade rhythms still need more variation.
- Pool reflection uses static local environment probes; it is not planar or ray-traced reflection. No claim of physical water optics or reference-image photorealism.
- The island remains the original compressed rectangular layout. Adjacent miniature cities remain visible from wide angles.
- Desktop screenshot checks are not a mobile performance benchmark; mobile frame rate remains unmeasured.
