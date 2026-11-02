/** Footprint-contained office towers. All pieces join the district's existing
 * material batches; no per-window objects survive into the render loop. */
export function appendDubaiHighrise({ b, h, index, finishes, box }) {
  const { wall, trim, metal, skylineGlass, glass, amberGlass, roof, recess } = finishes;
  const spandrel=finishes.skylineSpandrel||glass;
  const { w, d } = b, variant = index % 3, lobby = 2.35;
  const crown = h - .72;
  const tiers = variant === 0
    ? [[lobby, h * .68, .91, .91, 0], [h * .68, h * .85, .76, .76, 0], [h * .85, crown, .57, .62, 0]]
    : variant === 1
      ? [[lobby, h * .82, .87, .9, 0], [h * .82, crown, .68, .72, 0]]
      : [[lobby, h * .58, .92, .87, 0], [h * .58, h * .8, .76, .79, w * .065], [h * .8, crown, .59, .67, w * .12]];
  let floorCount = 0, paneCount = 0;
  // Open colonnade: recessed glazing leaves a real sheltered lobby threshold.
  box(trim, 0, .09, 0, w - .04, .18, d - .04);
  box(glass, 0, lobby / 2, -.16, w - .78, lobby - .24, d - 1.1);
  for (const x of [-w / 2 + .22, w / 2 - .22]) {
    for (const z of [-d / 2 + .22, d / 2 - .22]) {
      box(wall, x, lobby / 2, z, .3, lobby, .3);
      box(metal, x, .2, z, .32, .12, .32);
    }
  }
  const doorZ = d / 2 - .71;
  for (const x of [-.47, 0, .47]) box(metal, x, 1.1, doorZ + .025, .035, 1.86, .04);
  box(metal, 0, 2.04, doorZ + .025, .98, .045, .04);
  for (const x of [-.09, .09]) box(trim, x, 1.05, doorZ + .075, .018, .24, .055);
  for (const side of [0, 1, 2, 3]) {
    const span = side % 2 ? d - 1.1 : w - .78;
    const depth = side % 2 ? w - .78 : d - 1.1;
    const angle = side * Math.PI / 2, c = Math.cos(angle), s = Math.sin(angle);
    const bays = Math.max(3, Math.round(span / .7));
    for (let j = 0; j <= bays; j++) {
      const u = -span / 2 + span * j / bays, v = depth / 2 + .015;
      box(metal, u * c + v * s, 1.2, -.16 - u * s + v * c, .026, 2.1, .035, angle);
    }
  }
  // Slender cantilever and its recessed dark soffit stay inside the old collider.
  box(wall, 0, lobby - .12, 0, w - .04, .24, d - .04);
  box(recess, 0, lobby - .255, d / 2 - .36, w - .55, .025, .64);
  box(metal, 0, lobby - .13, d / 2 - .055, w - .12, .08, .035);

  function facade(side, width, depth, ox, material, u, y, inset, bw, bh, bd) {
    const a = side * Math.PI / 2, c = Math.cos(a), s = Math.sin(a);
    const v = (side % 2 ? width : depth) / 2 - inset;
    box(material, ox + u * c + v * s, y, -u * s + v * c, bw, bh, bd, a);
  }
  for (let tier = 0; tier < tiers.length; tier++) {
    const [bottom, top, sx, sz, ox] = tiers[tier], width = w * sx, depth = d * sz;
    const height = top - bottom;
    box(skylineGlass, ox, (top + bottom) / 2, 0, width - .1, height, depth - .1);
    const floors = Math.max(1, Math.round(height / 1.22)), fh = height / floors;
    floorCount += floors;
    for (let side = 0; side < 4; side++) {
      const span = side % 2 ? depth : width;
      const cols = Math.max(3, Math.round((span - .2) / .6)), bay = (span - .2) / cols;
      const face = (m, u, y, inset, bw, bh, bd) => facade(side, width, depth, ox, m, u, y, inset, bw, bh, bd);
      for (let f = 0; f < floors; f++) {
        const y = bottom + f * fh;
        // Spandrel panels and a projecting drip edge make each slab legible.
        face(spandrel, 0, y + .09, .035, span - .13, .14, .055);
        face(metal, 0, y + .025, .015, span - .1, .04, .045);
        face(metal, 0, y + fh * .77, .027, span - .13, .018, .025);
        for (let j = 0; j < cols; j++) {
          const u = -(span - .2) / 2 + (j + .5) * bay;
          // Sparse occupied offices; broad reflections remain the dominant read.
          if ((j * 13 + f * 7 + side * 3 + index * 5) % 23 === 0) {
            face(amberGlass, u, y + fh * .56, .047, bay - .055, fh - .29, .018);
          }
          paneCount++;
        }
      }
      for (let j = 0; j <= cols; j++) {
        const u = -(span - .2) / 2 + j * bay;
        face(metal, u, (top + bottom) / 2, .025, .024, height, .055);
      }
      // Paired stone corner blades give the second family a framed silhouette.
      if (variant === 1 && side % 2 === 0) for (const sign of [-1, 1]) {
        face(trim, sign * (span / 2 - .14), (top + bottom) / 2, .085, .12, height, .17);
      }
      face(trim, 0, top - .055, .06, span, .11, .12);
    }
    box(roof, ox, top - .045, 0, width - .16, .09, depth - .16);
    if (tier < tiers.length - 1) {
      // Inset glass balustrades on the exposed setback terraces, with real gaps.
      for (let side = 0; side < 4; side++) {
        const span = side % 2 ? depth : width;
        facade(side, width, depth, ox, glass, 0, top + .19, .13, span - .32, .35, .025);
        facade(side, width, depth, ox, metal, 0, top + .38, .13, span - .3, .025, .035);
      }
    }
  }
  // Ventilated mechanical crown, rather than a flat brown roof lid.
  const last = tiers[tiers.length - 1], cw = w * last[2] * .75, cd = d * last[3] * .75, cx = last[4];
  box(recess, cx, crown + .27, 0, cw - .12, .54, cd - .12);
  for (let side = 0; side < 4; side++) {
    const span = side % 2 ? cd : cw;
    for (let j = 0; j < 6; j++) facade(side, cw, cd, cx, roof, 0, crown + .08 + j * .085, .02, span, .035, .055);
  }
  box(trim, cx, h - .13, 0, cw + .08, .12, cd + .08);
  box(roof, cx, h - .055, 0, cw - .12, .03, cd - .12);
  return { towerFamily: ['terraced', 'framed', 'offset'][variant], floors: floorCount,
    windowBays: paneCount, lobbyDepth: .71, crownHeight: .72, setbacks: tiers.length - 1 };
}
