# Fifteen interiors — theme-specific refinement

The active roster is unchanged: five spaces in each of Dubai, Abu Dhabi and Las Vegas. This pass brings the ten Dubai/Las Vegas rooms beyond the earlier shared furnishing pass and continues detailing the five Abu Dhabi interiors. The independent `tourist-agent` project remains separate from the original game.

## Room-by-room work

| Space | Added detail |
| --- | --- |
| Dubai — Burj Khalifa | Three-wing setback tower model, model facade ribs, material-sample plinths, skyline exhibit walls, viewing optics and model guardrail |
| Dubai — future gallery | Ribbed illuminated wall bays, specimen pedestals, branching biological studies, life-pod bands and console controls |
| Dubai — aquarium | Deep window surround, layered aquatic light, branching coral, plate coral, ruined-column joints/capitals, specimen displays and viewing rail |
| Dubai — sail atrium | Balcony balusters and doors, blue/gold floor inlays, concierge counters and a stepped cascade behind the reflecting pool |
| Dubai — harbor hall | Shaped cruise hulls, windows/lifeboats/masts, boarding piers, curved waterfront shops and cafe counters/stools |
| Las Vegas — Sphere | Acoustic wall bays, lighting trusses, seat supports/cup holders, aisle details and stage edge rings |
| Las Vegas — Luxor | Sloping roof enclosure, articulated column shafts, varied geometric sandstone reliefs, pyramid courses/plinth, obelisk exhibits and restraint ropes |
| Las Vegas — garden resort | Botanical wall relief, layered planting beds, lanterns, tea counters and ceramic arrangements |
| Las Vegas — Strat | Bottle backbar, desert contour exhibits, terrain/tower models, viewing instruments and furnished bar seating |
| Las Vegas — balloon cabin | Horizontal shell rings, riveted exhibit base, tower-platform railings, open arches, curved upper canopy and Paris-themed panels |
| Abu Dhabi — mosque | Fine column inlays and floor row borders complement the detailed prayer hall |
| Abu Dhabi — palace | Low planted beds, floor-border fittings and reception signage complement the garden hall |
| Abu Dhabi — racing gallery | Pit tool displays, telemetry labels and display-restraint ropes |
| Abu Dhabi — Etihad | Tower podiums, coastal wall exhibit and curated flower displays |
| Abu Dhabi — courtyard | Model identification, entry fittings, wall exhibits and pathway details |

All ten Dubai/Las Vegas rooms now have individually composed entry/detail viewpoints. Labels are drawn to one atlas per room, with aspect-correct text and inward-facing side panels. They are not separate DOM overlays. The existing 15-space directory, saved visits, indoor overview controls and restoration of outdoor position remain intact.

## Visual corrections found during acceptance

The first screenshot review exposed side exhibits hidden behind timber slats, overly compressed label lettering, overlapping legacy decoration behind the sail-hotel balconies and short cruise models. These were corrected before the next visual pass. The aquarium's plain blue background also received a restrained animated underwater depth/light treatment; its fish remain static models. A final close-view review also connected piers to the boardwalk, attached cruise masts to decks, exposed the roof framing below Luxor’s ceiling and separated the racing-gallery tires onto supported shelves. Life pods now have translucent shells so their specimens are visible.

## Validation and performance

- Syntax checks, production build and 141 automated tests pass. Tests cover finite geometry, scene bounds, portrait/landscape overview fitting, resource disposal, label-atlas UV rows/orientation and exactly-once atlas disposal.
- All rooms remain within the existing 100,000-triangle and 40-root-draw-call budgets. These are geometry limits, not a guarantee of frame rate on every device. Reflection/shadow/contact passes add rendering work.
- Browser acceptance checks every room's entry, overview and three named close views; mobile acceptance checks the inside and overview of all 15 rooms. It also checks saved visits after reload, return-position preservation, the three-city picker and 20 exterior landmark loads.
- The existing production bundle-size advisory remains. No external image/font requests were added.

## Limits

These rooms are detailed procedural architectural miniatures, not measured reproductions or photographic interiors. Window panes still use a stylized reflected horizon rather than a live exterior view. Most exhibits remain static. The chosen compositions are authored interpretations of each landmark theme; the exhibit labels identify those studies rather than claiming the real venues contain these exact objects or layouts.
