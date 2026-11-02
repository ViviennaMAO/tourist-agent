import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** Two reversible, footprint-preserving facade studies for the west Dubai plaza.
 * All details are opaque PBR meshes, merged by finish. Existing actors still own
 * the building instances; apply() suppresses them only after the actors update.
 */
export function createDubaiArchitecture({ THREE, city, stoneMaterial }) {
  const root = new THREE.Group();
  root.name = 'Dubai — limestone courtyard shops';
  let enabled = true, disposed = false;
  const pools = city.w.ctx.pools;
  const candidates = (city.w.ctx.buildings || []).filter(b =>
    b.indices && Number.isInteger(b.indices.body) && b.indices.body >= 0 &&
    b.z + b.d / 2 < -16 && b.h >= 3 && b.h <= 7.5 && !b.gable && !b.crown &&
    b.w >= 3 && b.d >= 3);
  const inStudy = b => b.x >= -31 && b.x <= -13 && b.z >= -31 && b.z <= -19;
  const rank = b => (inStudy(b) ? 0 : 1000) + (b.style === 'shops' ? 0 : 100) +
    Math.hypot(b.x + 20, b.z + 22);
  const selected = [...candidates].sort((a, b) => rank(a) - rank(b)).slice(0, 2);
  const materials = [], batches = new Map(), originals = new Map();
  const finish = (color, roughness, metalness = 0, extra = {}) => {
    const material = new THREE.MeshStandardMaterial({ color, roughness, metalness,
      envMapIntensity: .65, ...extra });
    materials.push(material); batches.set(material, []); return material;
  };
  // Copy the source shader explicitly: Material.clone does not retain callbacks.
  function limestone(color) {
    if (!stoneMaterial) return finish(color, .84);
    const material = stoneMaterial.clone();
    material.onBeforeCompile = stoneMaterial.onBeforeCompile;
    material.customProgramCacheKey = stoneMaterial.customProgramCacheKey;
    material.color.set(color); material.roughness = .84;
    materials.push(material); batches.set(material, []); return material;
  }
  const ivory = limestone('#f3ebdb'), warm = limestone('#d4cabb');
  const trim = finish('#d8cfbc', .77);
  const metal = finish('#5c5140', .36, .72);
  const glass = finish('#334b53', .19, .38, { envMapIntensity: 1.25 });
  const roof = finish('#9b9688', .94);
  const recess = finish('#4b4b43', .95);
  const matrix = new THREE.Matrix4(), quaternion = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  let transform = new THREE.Matrix4();
  function box(material, x, y, z, w, h, d, angle = 0) {
    if (Math.min(w, h, d) <= 0) return;
    const geometry = new THREE.BoxGeometry(w, h, d);
    quaternion.setFromAxisAngle(up, angle);
    matrix.compose(new THREE.Vector3(x, y, z), quaternion, new THREE.Vector3(1, 1, 1));
    geometry.applyMatrix4(matrix).applyMatrix4(transform);
    batches.get(material).push(geometry);
  }
  selected.forEach((b, buildingIndex) => {
    const wall = buildingIndex === 0 ? ivory : warm;
    transform = new THREE.Matrix4().makeRotationY(b.ry || 0);
    transform.setPosition(b.x, b.base, b.z);
    const { w, d, h } = b;
    const floorCount = h >= 4.6 ? 2 : 1;
    const parapetHeight = .25, roofLevel = h - parapetHeight;
    const groundHeight = floorCount === 2 ? Math.min(2.65, roofLevel * .53) : roofLevel;
    const floors = floorCount === 2 ? [[0, groundHeight], [groundHeight, roofLevel]] : [[0, roofLevel]];
    const inset = .045, thickness = .23;
    // Solid inset core occludes interiors behind recessed glazing. Wall openings
    // genuinely have side/top/bottom reveals; no glass or window texture overlay.
    box(recess, 0, roofLevel / 2, 0, w - .64, roofLevel, d - .64);
    box(trim, 0, .105, 0, w, .21, d);
    box(roof, 0, roofLevel - .045, 0, w - .2, .09, d - .2);
    for (const [level] of floors.slice(1)) {
      box(trim, 0, level - .08, 0, w, .16, d);
    }
    // Four narrow parapets preserve the exact original overall roof height.
    box(wall, 0, h - .15, d / 2 - .11, w - .08, .3, .14);
    box(wall, 0, h - .15, -d / 2 + .11, w - .08, .3, .14);
    box(wall, -w / 2 + .11, h - .15, 0, .14, .3, d - .22);
    box(wall, w / 2 - .11, h - .15, 0, .14, .3, d - .22);
    // Thin projecting cornice remains entirely inside the original footprint.
    box(trim, 0, roofLevel - .1, 0, w, .14, d);
    box(trim, 0, h - .025, d / 2 - .105, w, .05, .21);
    box(trim, 0, h - .025, -d / 2 + .105, w, .05, .21);
    box(trim, -w / 2 + .105, h - .025, 0, .21, .05, d - .42);
    box(trim, w / 2 - .105, h - .025, 0, .21, .05, d - .42);

    // Facade coordinates: u is horizontal and v runs inward from the boundary.
    for (let side = 0; side < 4; side++) {
      const span = side % 2 === 0 ? w : d;
      const depth = side % 2 === 0 ? d : w;
      const angle = side * Math.PI / 2;
      const cs = Math.cos(angle), sn = Math.sin(angle);
      function facade(material, u, y, inward, width, height, thick) {
        const z = depth / 2 - inward;
        box(material, u * cs + z * sn, y, -u * sn + z * cs, width, height, thick, angle);
      }
      const columns = span >= 4.1 ? 3 : 2;
      const margin = .35, bay = (span - margin * 2) / columns;
      const pier = .2, openingWidth = bay - pier;
      floors.forEach(([bottom, top], floor) => {
        const isGround = floor === 0;
        const doorColumn = Math.floor(columns / 2);
        const front = side === 0;
        const lower = isGround ? .36 : bottom + .62;
        const upper = top - (isGround ? .4 : .36);
        // Upper and lower wall belts + individual piers form real window voids.
        facade(wall, 0, (upper + top) / 2, inset + thickness / 2, span - 2 * inset, top - upper, thickness);
        facade(wall, -span / 2 + margin / 2, (bottom + upper) / 2,
          inset + thickness / 2, margin, upper - bottom, thickness);
        facade(wall, span / 2 - margin / 2, (bottom + upper) / 2,
          inset + thickness / 2, margin, upper - bottom, thickness);
        for (let col = 0; col < columns; col++) {
          const center = -span / 2 + margin + bay * (col + .5);
          const door = isGround && front && col === doorColumn;
          const sill = door ? .12 : lower;
          const windowHeight = upper - sill;
          facade(wall, center, (bottom + sill) / 2, inset + thickness / 2,
            openingWidth, sill - bottom, thickness);
          for (const sign of [-1, 1]) {
            facade(wall, center + sign * bay / 2, (bottom + upper) / 2,
              inset + thickness / 2, pier, upper - bottom, thickness);
          }
          // Recessed, opaque reflective glass is backed by the interior core.
          const glassDepth = inset + .235;
          facade(glass, center, (sill + upper) / 2, glassDepth, openingWidth - .035,
            windowHeight - .035, .024);
          const frame = .026;
          for (const sign of [-1, 1]) {
            facade(metal, center + sign * (openingWidth / 2 - frame / 2), (sill + upper) / 2,
              glassDepth - .022, frame, windowHeight, .035);
            facade(metal, center, sign > 0 ? upper - frame / 2 : sill + frame / 2,
              glassDepth - .022, openingWidth, frame, .035);
          }
          facade(metal, center, (sill + upper) / 2, glassDepth - .023,
            .018, windowHeight, .037);
          facade(metal, center, sill + windowHeight * .74, glassDepth - .023,
            openingWidth, .02, .037);
          facade(trim, center, sill - .035, .135, openingWidth + .09, .07, .25);
          if (door) {
            facade(metal, center + .11, 1.12, glassDepth - .054, .018, .23, .025);
            // Deep stone lintel shades the entry without projecting into a path.
            facade(trim, center, upper + .08, .19, openingWidth + .24, .12, .38);
          }
          if (!isGround && front) {
            // Juliet balcony: contained within the original facade envelope.
            const railHeight = .65, railDepth = .035;
            facade(trim, center, sill - .06, .17, openingWidth + .16, .1, .34);
            for (let j = 0; j <= 6; j++) {
              facade(metal, center - openingWidth / 2 + openingWidth * j / 6,
                sill + railHeight / 2, railDepth, .026, railHeight, .028);
            }
            facade(metal, center, sill + railHeight, railDepth,
              openingWidth + .04, .045, .045);
            facade(metal, center, sill + .08, railDepth,
              openingWidth + .04, .025, .03);
          }
        }
      });
    }
  });
  let triangles = 0;
  for (const [material, geometries] of batches) {
    if (!geometries.length) continue;
    const geometry = mergeGeometries(geometries, false);
    geometries.forEach(g => g.dispose());
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = `Dubai facade finish ${root.children.length + 1}`;
    mesh.castShadow = true; mesh.receiveShadow = true;
    triangles += geometry.index ? geometry.index.count / 3 : geometry.attributes.position.count / 3;
    root.add(mesh);
  }
  city.w.root.add(root);
  const mappings = { body: 'tower', crown: 'tower', roof: 'roof', pad: 'pad', antenna: 'ant', gable: 'gable' };
  const stats = { buildings: selected.length, triangles, drawCalls: root.children.length,
    selected: selected.map(b => ({ x: b.x, z: b.z, w: b.w, d: b.d, h: b.h,
      base: b.base, ry: b.ry || 0, style: b.style || 'unknown', inStudy: inStudy(b) })) };
  function apply() {
    if (!enabled || disposed) return;
    const touched = new Set();
    for (const b of selected) for (const [key, poolName] of Object.entries(mappings)) {
      const index = b.indices[key], pool = pools[poolName];
      if (!Number.isInteger(index) || index < 0 || !pool) continue;
      const id = `${poolName}:${index}`;
      if (!originals.has(id)) originals.set(id, { pool, index, matrix: new THREE.Matrix4() });
      pool.m.getMatrixAt(index, originals.get(id).matrix);
      pool.hide(index); touched.add(pool);
    }
    touched.forEach(pool => pool.flush());
  }
  function restore() {
    const touched = new Set();
    originals.forEach(({ pool, index, matrix: before }) => { pool.set(index, before); touched.add(pool); });
    touched.forEach(pool => pool.flush()); originals.clear();
  }
  return { root, apply, stats, setEnabled(value) {
    enabled = Boolean(value); root.visible = enabled && !disposed;
    if (!enabled) restore();
  }, dispose() {
    if (disposed) return;
    restore(); disposed = true; root.removeFromParent();
    root.children.forEach(mesh => mesh.geometry.dispose());
    materials.forEach(material => material.dispose());
  } };
}
