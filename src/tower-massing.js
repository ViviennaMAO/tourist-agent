/** Metre-scaled, footprint-contained silhouettes. Each family has its own
 * shoulder and crown rather than repeating a three-step pyramid. */
export function towerMassing(w, d, h, index, lobby = 2.35) {
  const family = ((index % 5) + 5) % 5, top = h - .72;
  const tier = (bottom, end, sx, sz, ox = 0) => ({ bottom, top: end, w: w * sx, d: d * sz, x: ox });
  const tiers = [
    [tier(lobby, h * .77, .9, .88), tier(h * .77, top, .68, .7)],
    [tier(lobby, top, .77, .84)],
    [tier(lobby, h * .66, .9, .87), tier(h * .66, top, .64, .7, w * .1)],
    [tier(lobby, top, .67, .9)],
    [tier(lobby, top, .82, .83)]
  ][family];
  return { family, name: ['shoulder', 'framed', 'offset', 'blade', 'sloped'][family], tiers };
}

/** Closed sloping cap, including a real diagonal silhouette on both end faces. */
export function slopedCrown(THREE, w, d, h, rise) {
  const g = new THREE.BoxGeometry(w, rise, d), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const top = p.getY(i) > 0;
    p.setY(i, top ? h - rise * (.12 + .72 * (p.getX(i) / w + .5)) : h - rise);
  }
  g.computeVertexNormals();
  return g;
}
