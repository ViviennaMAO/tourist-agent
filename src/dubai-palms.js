import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** A small grove beside the west plaza. Geometry shares the original palm's
 * local origin and crown position, so the existing actor still owns its sway.
 * Feathered fronds use opaque geometry; no alpha sorting or texture downloads.
 */
export function createDubaiPalms({ THREE, city, district = false }) {
  const root = new THREE.Group(); root.name = 'Dubai — west promenade date palms';
  const pools = city.w.ctx.pools;
  const selected = city.w.ctx.palms.filter(p => district ? p.z < -5 : p.x >= -34 && p.x <= 5 && p.z > -50 && p.z < -10);
  const positions = [], colors = [], indices = [];
  const palettes = ['#637346', '#75804d', '#51633d', '#85935d'].map(c => new THREE.Color(c));
  const v = (x, y, z) => new THREE.Vector3(x, y, z);
  function triangle(a, b, c, color) {
    const i = positions.length / 3;
    for (const p of [a, b, c]) { positions.push(p.x, p.y, p.z); colors.push(color.r, color.g, color.b); }
    indices.push(i, i + 1, i + 2);
  }
  const ribs = [];
  for (let f = 0; f < 13; f++) {
    const angle = f * 2.39996, upper = f >= 9;
    const length = upper ? 1.65 + (f % 3) * .14 : 2.35 + (f % 3) * .14;
    const lift = upper ? 1.55 : .64, droop = upper ? .58 : 1.25;
    const point = t => v(.8 + Math.cos(angle) * length * t,
      3.6 + lift * t - droop * t * t, Math.sin(angle) * length * t);
    const side = v(-Math.sin(angle), 0, Math.cos(angle));
    const curve = new THREE.CatmullRomCurve3(Array.from({ length: 7 }, (_, j) => point(j / 6)));
    ribs.push(new THREE.TubeGeometry(curve, 12, .012, 3, false));
    const color = palettes[f % palettes.length];
    for (let j = 1; j <= 19; j++) {
      const t = .08 + j / 20 * .89;
      const width = .50 * Math.pow(Math.sin(Math.PI * t), .75);
      for (const sign of [-1, 1]) {
        const base = point(t), next = point(Math.min(1, t + .10));
        const tip = next.clone().addScaledVector(side, width * sign); tip.y -= width * .43;
        const ridge = base.clone().lerp(tip, .45); ridge.y += .022;
        const left = point(t - .019), right = point(t + .019);
        triangle(left, ridge, tip, color); triangle(ridge, right, tip, color);
        triangle(left, right, ridge, color);
      }
    }
  }
  const foliage = new THREE.BufferGeometry();
  foliage.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  foliage.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  foliage.setIndex(indices); foliage.computeVertexNormals();
  const ribGeometry = mergeGeometries(ribs); ribs.forEach(g => g.dispose());
  // Ringed, tapered trunk follows the source curve and touches the same ground.
  const trunkPositions = [], trunkColors = [], trunkIndices = [], rings = 48, sides = 9;
  for (let j = 0; j <= rings; j++) {
    const t = j / rings, radius = (.18 - .07 * t) * (j % 2 ? .94 : 1.04);
    const color = new THREE.Color(j % 2 ? '#938269' : '#ab987a');
    for (let k = 0; k <= sides; k++) {
      const a = k / sides * Math.PI * 2;
      trunkPositions.push(.8 * t * t + Math.cos(a) * radius, 3.6 * t, Math.sin(a) * radius);
      trunkColors.push(color.r, color.g, color.b);
      if (j < rings && k < sides) { const i = j * (sides + 1) + k, n = i + sides + 1; trunkIndices.push(i, n, i + 1, i + 1, n, n + 1); }
    }
  }
  const trunk = new THREE.BufferGeometry();
  trunk.setAttribute('position', new THREE.Float32BufferAttribute(trunkPositions, 3));
  trunk.setAttribute('color', new THREE.Float32BufferAttribute(trunkColors, 3));
  trunk.setIndex(trunkIndices); trunk.computeVertexNormals();
  const leafMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .87, side: THREE.DoubleSide, envMapIntensity: .32 });
  const ribMat = new THREE.MeshStandardMaterial({ color: '#8a8e59', roughness: .91 });
  const trunkMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .95 });
  const meshes = [[foliage, leafMat], [ribGeometry, ribMat], [trunk, trunkMat]].map(([geometry, material]) => {
    const mesh = new THREE.InstancedMesh(geometry, material, selected.length);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.castShadow = true; mesh.receiveShadow = true;
    root.add(mesh); return mesh;
  });
  city.w.root.add(root);
  let enabled = true, disposed = false;
  const saved = selected.map(() => ({ trunk: new THREE.Matrix4(), leaves: new THREE.Matrix4(), valid: false }));
  function apply() {
    if (!enabled || disposed) return;
    selected.forEach((p, i) => {
      pools.trunk.m.getMatrixAt(p.index, saved[i].trunk);
      pools.leaves.m.getMatrixAt(p.index, saved[i].leaves); saved[i].valid = true;
      meshes.forEach(mesh => mesh.setMatrixAt(i, saved[i].trunk));
      pools.trunk.hide(p.index); pools.leaves.hide(p.index);
    });
    meshes.forEach(mesh => { mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere(); });
    pools.trunk.flush(); pools.leaves.flush();
  }
  function restore() {
    selected.forEach((p, i) => {
      if (!saved[i].valid) return;
      pools.trunk.set(p.index, saved[i].trunk); pools.leaves.set(p.index, saved[i].leaves); saved[i].valid = false;
    });
    pools.trunk.flush(); pools.leaves.flush();
  }
  const stats = { palms: selected.length, triangles: selected.length * meshes.reduce((n, m) => n + m.geometry.index.count / 3, 0), drawCalls: meshes.length };
  return { root, stats, apply, setEnabled(value) {
    enabled = Boolean(value); root.visible = enabled && !disposed; if (!enabled) restore();
  }, dispose() {
    if (disposed) return; restore(); disposed = true; root.removeFromParent();
    meshes.forEach(m => { m.geometry.dispose(); m.material.dispose(); m.dispose(); });
  } };
}
