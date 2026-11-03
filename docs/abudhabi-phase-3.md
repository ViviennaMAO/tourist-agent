# Abu Dhabi — domes, minarets and palace façades

This pass refines the existing mosque and palace assets while keeping their holders, landmark identities, navigation and collision envelopes.

## Geometry and materials

- Measured the two current GLBs in their normalized holder coordinates. A reversible index filter removes the selected old dome/minaret surfaces; unrelated source triangles, atlas coordinates and materials remain owned by their original loader.
- Five mosque domes and nine palace domes now use 72-segment lathed curves, base mouldings and restrained finials. The crown is capped. Filtered low-contrast radial joints replace thin overlapping line meshes that shimmered in the first review.
- Four mosque minarets gain continuous tapered shafts, four levels of balconies, slender balusters, corbels and small crown domes. The first draft's shaft gaps were corrected during screenshot review.
- Palace upper façades gain 72 glazed arched openings with raised stone surrounds, sills and narrow bronze mullions. Floor bands, pilasters and restrained cornice dentils stay on the flat façade spans instead of projecting across the source model's chamfered corners.
- Palace stone detail uses a normalized metric attribute for subtle pores, joints and roughness. Global lighting and Dubai geometry are unchanged.
- Added repeatable minaret and palace-façade close-up cameras.

## Validation

- Syntax checks, 93 tests and production build pass. The existing Three.js bundle-size advisory remains.
- Tests cover finite dome geometry, preserved source attributes/triangles, delayed asset loading, Before/After restoration, idempotent cleanup and borrowed-resource ownership.
- Browser review includes city overview, mosque, Corniche, palace, garden, skyline and the two new close-ups. Palace-axis/Corniche walking and all six Abu Dhabi checkins pass; material toggles and return to Dubai remain functional.

## Remaining scope

The mesh surgery is calibrated to the current two source GLBs. A future source-model replacement requires new measurements. Palace glazing is shallow façade infill, not a modeled interior. The lower palace entrance and mosque wall ornament remain simplified, and decorative profiles are an authored miniature treatment rather than surveyed architectural reconstruction. Mobile performance has not been benchmarked.
