# Abu Dhabi — venue envelopes, glazing and edge details

Ferrari World's roof/glass and the cultural venue's pale masonry were still mostly flat atlas colours. This pass follows their existing miniature geometry and measured holder coordinates to add material response and restrained edge construction.

## Implemented

- Ferrari roof colour keeps the original badge and trim, reduces the strongest baked colour gradient, and adds restrained metal/paint roughness and filtered panel variation. The artificial green insert is toned down.
- Glazing triangles are identified from several samples within each source atlas triangle, transformed into holder coordinates, and overlaid with reflective glazing. Boundary frames follow the source edges; fine pane divisions are filtered with distance. Red roof, yellow badge and stone are excluded.
- Cultural courtyard pools are explicitly excluded from the low horizontal glass geometry. Their source blue material also bypasses the stone finish; they do not acquire window grids.
- Added Ferrari's oculus rim, entrance frame/handles/threshold, canopy underside, drip edge and small warm fixtures. These remain exterior miniature details.
- The three cultural pavilions retain their different measured rotations and proportions, with stone surface variation, slim roof caps, recessed drip lines and base bands. A dedicated local reflection probe serves this part of Abu Dhabi.
- Added entrance and pavilion close-up cameras. No landmark collision or travel route was changed.

## Verification

- Syntax checks, 105 tests and production build pass. Tests cover glass/badge separation, pool exclusion, normalized coordinates, shader composition, delayed asset loading and independent geometry/material restoration.
- Reviewed venue close-ups and the city overview. The complete browser route covers Abu Dhabi views, palace/Corniche walking, six local checkins, Before/After and return to Dubai; all 25 landmarks load without a browser runtime error.
- The existing Three.js bundle-size advisory remains. Local reflection captures occur on invalidation, not every frame; mobile performance has not been benchmarked.

## Limits

Venue interiors remain closed, and the original low-polygon shell silhouettes still limit very close views. Reflections use static local probes rather than ray tracing. This is a miniature visual refinement, not a surveyed architectural reconstruction.
