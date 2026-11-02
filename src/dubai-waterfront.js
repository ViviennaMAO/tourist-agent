import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { appendDubaiVilla } from './dubai-villas.js';

/** A bounded waterfront pilot: two inward-facing shops frame the public square.
 * New collisions are owned here and are removed on A/B or disposal. */
export function createDubaiWaterfront({ THREE, city, stoneMaterial }) {
  const root = new THREE.Group(); root.name = 'Dubai — waterfront courtyard pilot';
  const ctx = city.w.ctx, batches = new Map(), materials = [], footprints = [];
  let enabled = false, disposed = false;
  function finish(color, roughness = .8, extra = {}) {
    const m = new THREE.MeshStandardMaterial({ color, roughness, ...extra });
    materials.push(m); batches.set(m, []); return m;
  }
  const wall = stoneMaterial.clone(); wall.color.set('#f5edda');
  wall.onBeforeCompile = stoneMaterial.onBeforeCompile; wall.customProgramCacheKey = stoneMaterial.customProgramCacheKey;
  materials.push(wall); batches.set(wall, []);
  const trim = finish('#e4d8c0'), metal = finish('#645341', .37, { metalness: .65 });
  const glass = finish('#536563', .17, { metalness: .35, envMapIntensity: 1.5 });
  const shopGlass = finish('#c5d8d1', .12, { metalness: .12, transparent: true, opacity: .13, depthWrite: false, envMapIntensity: 1.4 });
  const roof = finish('#b0a38a'), recess = finish('#635340'), wood = finish('#765231');
  const amberGlass = finish('#8f7958', .25, { emissive: '#d39b53', emissiveIntensity: .1 });
  const lanternGlass = finish('#ffdf9e', .4, { emissive: '#ffbd68', emissiveIntensity: 1.2 });
  const plantGreen = finish('#566638'), flowers = finish('#b85177');
  const finishes = { wall, trim, metal, glass, shopGlass, roof, recess, wood, amberGlass, lanternGlass, plantGreen, flowers };
  let transform = new THREE.Matrix4();
  function add(g, m) {
    if (!g.index) g.setIndex(Array.from({length:g.attributes.position.count}, (_, i) => i));
    g.applyMatrix4(transform); batches.get(m).push(g);
  }
  function box(m, x, y, z, w, h, d, ry = 0) {
    add(new THREE.BoxGeometry(w, h, d).rotateY(ry).translate(x, y, z), m);
  }
  for (const [i, x, ry] of [[0, -29.15, Math.PI / 2], [1, -10.85, -Math.PI / 2]]) {
    const z = -9.8, w = 6.4, d = 4.7, base = ctx.groundY(x, z);
    // Footprint dimensions are swapped for the ninety-degree facades.
    if (!ctx.free(x, z, d, w)) continue;
    footprints.push({x, z, w:d, d:w});
    transform = new THREE.Matrix4().makeRotationY(ry).setPosition(x, base, z);
    appendDubaiVilla({THREE, b:{w, d, h:9, interior:true}, h:i ? 6.1 : 5.8, index:i,
      finishes, box, add});
  }
  // Pale paving with modest colour variation and actual thin joints. A darker
  // border describes the square without a raised step in the walking route.
  transform.identity();
  const pavers = ['#d6c9b4', '#daceb9', '#d2c5af'].map(c => finish(c, .88));
  const y = ctx.groundY(-20, -9.4);
  for (let row = 0; row < 12; row++) for (let col = 0; col < 32; col++) {
    const x = -31.625 + col * .75, z = -12.7 + row * .6;
    if (footprints.some(r => Math.abs(x-r.x)<r.w/2+.4 && Math.abs(z-r.z)<r.d/2+.3)) continue;
    box(pavers[((Math.imul(row+7,73856093)^Math.imul(col+11,19349663))>>>0)%7 < 4 ? 0 : (row+col)%2+1], x, y+.022, z, .735, .022, .585);
  }
  for (const z of [-13.04, -5.76]) box(trim, -20, y+.023, z, 24, .025, .12);
  const ring = new THREE.RingGeometry(2.66, 3.02, 80).rotateX(-Math.PI/2).translate(-20,y+.038,-9.4);
  add(ring, trim);
  for (const [m, geos] of batches) {
    if (!geos.length) continue;
    const g = mergeGeometries(geos); geos.forEach(p => p.dispose());
    const mesh = new THREE.Mesh(g, m); mesh.castShadow = !m.transparent; mesh.receiveShadow = true;
    root.add(mesh);
  }
  city.w.root.add(root); root.visible = false;
  const stats = { buildings:footprints.length, pilot:true, triangles:root.children.reduce((s,m)=>s+m.geometry.index.count/3,0), drawCalls:root.children.length };
  return {root, footprints, stats, apply(){}, setEnabled(value) {
    if (disposed || enabled === !!value) return;
    enabled = !!value; root.visible = enabled;
    if (enabled) ctx.rects.push(...footprints);
    else for (const r of footprints) { const i=ctx.rects.indexOf(r); if(i>=0) ctx.rects.splice(i,1); }
  }, dispose() {
    if(disposed) return; this.setEnabled(false); disposed=true; root.removeFromParent();
    root.children.forEach(m=>m.geometry.dispose()); materials.forEach(m=>m.dispose());
  }};
}
