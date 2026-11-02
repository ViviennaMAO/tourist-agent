import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createDubaiArchitecture } from '../src/dubai-architecture.js';
import { createDubaiPalms } from '../src/dubai-palms.js';

function fixture(height = 4.6) {
  const root = new THREE.Group(), pools = {};
  for (const name of ['tower', 'roof', 'pad', 'ant', 'gable', 'trunk', 'leaves']) {
    const m = new THREE.InstancedMesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial(), 6);
    pools[name] = { m, hide(i) { m.setMatrixAt(i, new THREE.Matrix4().makeScale(0, 0, 0)); },
      set(i, matrix) { m.setMatrixAt(i, matrix); }, flush() { m.instanceMatrix.needsUpdate = true; } };
  }
  const buildings = [0, 1].map(i => ({ x: -22 - i * 5, z: -23, w: 3.2 + i, d: 4,
    h: height, base: 1.28, ry: i * .23, style: 'shops',
    indices: { body: i, crown: -1, roof: -1, pad: -1, antenna: -1, gable: -1 } }));
  const palms = [{ index: 0, x: -25, y: 1.28, z: -13.6 }, { index: 1, x: 20, y: 1.28, z: -13.6 }];
  return { w: { root, ctx: { pools, buildings, palms } } };
}
function read(pool, i) { const m = new THREE.Matrix4(); pool.m.getMatrixAt(i, m); return m; }
function validateGeometry(root) {
  root.traverse(o => {
    if (!o.isMesh) return;
    for (const attribute of Object.values(o.geometry.attributes)) assert.ok(attribute.array.every(Number.isFinite));
    assert.ok(o.geometry.index.array.every(i => i < o.geometry.attributes.position.count));
  });
}

test('facades stay within the rotated building collision footprint across the floor threshold', () => {
  for (const h of [3, 4.59, 4.6, 5.25, 7.5]) {
    const city = fixture(h), module = createDubaiArchitecture({ THREE, city });
    assert.equal(module.stats.buildings, 2); assert.ok(module.stats.triangles < 12000);
    assert.ok(module.stats.drawCalls <= 7); validateGeometry(module.root);
    for (const mesh of module.root.children) {
      const a = mesh.geometry.attributes.position, p = new THREE.Vector3();
      for (let i = 0; i < a.count; i++) {
        p.fromBufferAttribute(a, i);
        assert.ok(city.w.ctx.buildings.some(b => {
          const local = p.clone().sub(new THREE.Vector3(b.x, b.base, b.z)).applyAxisAngle(new THREE.Vector3(0, 1, 0), -b.ry);
          return Math.abs(local.x) <= b.w / 2 + 1e-5 && Math.abs(local.z) <= b.d / 2 + 1e-5 && local.y >= -1e-5 && local.y <= b.h + 1e-5;
        }), 'facade vertex must remain inside an existing collider');
      }
    }
    module.dispose();
  }
});

test('both modules restore latest actor transforms, isolate unselected instances and release owned resources', () => {
  const city = fixture(), architecture = createDubaiArchitecture({ THREE, city }), palms = createDubaiPalms({ THREE, city });
  assert.equal(palms.stats.palms, 1); assert.equal(palms.stats.drawCalls, 3);
  assert.ok(palms.stats.triangles < 4000); validateGeometry(palms.root);
  const pools = city.w.ctx.pools, unselected = read(pools.leaves, 1);
  let disposed = 0;
  for (const module of [architecture, palms]) for (const mesh of module.root.children) {
    mesh.geometry.addEventListener('dispose', () => disposed++);
  }
  for (let frame = 0; frame < 3; frame++) {
    const matrix = new THREE.Matrix4().makeTranslation(frame + 10, 2, -22);
    for (const p of Object.values(pools)) { p.set(0, matrix); p.set(1, unselected); }
    for (const module of [architecture, palms]) { module.setEnabled(true); module.apply(); }
    assert.equal(read(pools.tower, 0).determinant(), 0);
    assert.equal(read(pools.leaves, 0).determinant(), 0);
    assert.deepEqual(read(pools.leaves, 1).elements, unselected.elements);
    for (const module of [architecture, palms]) module.setEnabled(false);
    assert.deepEqual(read(pools.tower, 0).elements, matrix.elements);
    assert.deepEqual(read(pools.leaves, 0).elements, matrix.elements);
  }
  for (const module of [architecture, palms]) { module.setEnabled(true); module.apply(); module.dispose(); module.dispose(); }
  assert.equal(city.w.root.children.length, 0); assert.equal(disposed, 10);
});
