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
  const palettes = (district ? ['#314e27','#526b32','#677b3d','#3e5d2e','#8b854b'] : ['#637346', '#75804d', '#51633d', '#85935d']).map(c => new THREE.Color(c));
  let seed=7281;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const v = (x, y, z) => new THREE.Vector3(x, y, z);
  function triangle(a, b, c, color) {
    const i = positions.length / 3;
    for (const p of [a, b, c]) { positions.push(p.x, p.y, p.z); colors.push(color.r, color.g, color.b); }
    indices.push(i, i + 1, i + 2);
  }
  const ribs = [];
  for (let f = 0; f < (district ? 23 : 13); f++) {
    const angle = f * 2.39996 + (district ? (random()-.5)*.48 : 0), upper = f >= (district ? 16 : 9);
    const length = district ? (upper ? 1.25+random()*.8 : 2.05+random()*.95) : upper ? 1.65 + (f % 3) * .14 : 2.35 + (f % 3) * .14;
    const lift = district ? (upper ? 1.8+random()*.8 : .8+random()*.7) : upper ? 1.55 : .64;
    const droop = district ? (upper ? .6+random()*.6 : 1.8+random()*.8) : upper ? .58 : 1.25;
    const bend = district ? (random()-.5)*.5 : 0;
    const point = t => v(.8 + Math.cos(angle+bend*t) * length * t,
      3.6 + lift * t - droop * t * t, Math.sin(angle+bend*t) * length * t);
    const side = v(-Math.sin(angle), 0, Math.cos(angle));
    const curve = new THREE.CatmullRomCurve3(Array.from({ length: 7 }, (_, j) => point(j / 6)));
    ribs.push(new THREE.TubeGeometry(curve, 12, .012, 3, false));
    const color = palettes[district && f<3 ? 4 : f % (district ? 4 : palettes.length)];
    const leaflets=district ? 25 : 19;
    for (let j = 1; j <= leaflets; j++) {
      const t = .08 + (j+(district ? (random()-.5)*.45 : 0)) / (leaflets+1) * .89;
      const width = (district ? .42+random()*.19 : .50) * Math.pow(Math.sin(Math.PI * t), .75);
      for (const sign of [-1, 1]) {
        const base = point(t), next = point(Math.min(1, t + .10));
        const tip = next.clone().addScaledVector(side, width * sign); tip.y -= width * .43;
        const ridge = base.clone().lerp(tip, .45); ridge.y += .022;
        const left = point(t - .019), right = point(t + .019);
        if(district) {
          // Folded, swept blades have a drooping tip and irregular paired lengths.
          tip.addScaledVector(side,sign*(random()-.5)*width*.25);tip.y-=.08+random()*.13;
          const mid=base.clone().lerp(tip,.58);mid.y+=.075;
          const spread=point(t+.018).sub(base).multiplyScalar(.7);
          const a=mid.clone().sub(spread),b=mid.clone().add(spread);
          triangle(left,a,b,color);triangle(left,b,right,color);
          triangle(a,tip,b,color.clone().multiplyScalar(.85));
        } else {
          triangle(left, ridge, tip, color); triangle(ridge, right, tip, color);
          triangle(left, right, ridge, color);
        }
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
    const t = j / rings, radius = district ? .12+.075*(1-t)+.075*Math.exp(-t*13) : (.18-.07*t)*(j%2?.94:1.04);
    const color = new THREE.Color(district ? '#87745d' : j % 2 ? '#938269' : '#ab987a');
    for (let k = 0; k <= sides; k++) {
      const a = k / sides * Math.PI * 2;
      const relief=district?1+.055*Math.sin(a*3+j*1.7):1;
      trunkPositions.push(.8*t*t+Math.cos(a)*radius*relief,3.6*t,Math.sin(a)*radius*relief);
      const shade=district?.87+.13*Math.sin(a*2+j*.8):1;
      trunkColors.push(color.r*shade,color.g*shade,color.b*shade);
      if (j < rings && k < sides) { const i = j * (sides + 1) + k, n = i + sides + 1; trunkIndices.push(i, n, i + 1, i + 1, n, n + 1); }
    }
  }
  let trunk = new THREE.BufferGeometry();
  trunk.setAttribute('position', new THREE.Float32BufferAttribute(trunkPositions, 3));
  trunk.setAttribute('color', new THREE.Float32BufferAttribute(trunkColors, 3));
  trunk.setIndex(trunkIndices); trunk.computeVertexNormals();
  if(district) {
    // Overlapping cut petiole bases break the smooth ring silhouette of the
    // trunk. They share its vertex-colour batch, so cost no extra draw calls.
    const bark=[trunk];
    for(let row=1;row<32;row++) for(let k=0;k<11;k++) {
      const t=(row+(random()-.5)*.4)/34,a=k/11*Math.PI*2+row*.44+(random()-.5)*.24,r=.12+.075*(1-t)+.075*Math.exp(-t*13);
      const g=new THREE.OctahedronGeometry(1,0).scale(.045+random()*.017,.063+random()*.023,.019+random()*.009).rotateY(Math.PI/2-a);
      g.deleteAttribute('uv');
      g.setIndex(Array.from({length:g.attributes.position.count},(_,i)=>i));
      g.translate(.8*t*t+Math.cos(a)*r,3.6*t,Math.sin(a)*r);
      const c=new THREE.Color('#786047').multiplyScalar(.75+random()*.45);
      g.setAttribute('color',new THREE.Float32BufferAttribute(Array.from({length:g.attributes.position.count},()=>[c.r,c.g,c.b]).flat(),3));bark.push(g);
    }
    trunk=mergeGeometries(bark);bark.forEach(g=>g.dispose());
  }
  const leafMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .87, side: THREE.DoubleSide, envMapIntensity: .32 });
  const ribMat = new THREE.MeshStandardMaterial({ color: district ? '#686c38' : '#8a8e59', roughness: .91 });
  const trunkMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .95 });
  const meshes = [[foliage, leafMat], [ribGeometry, ribMat], [trunk, trunkMat]].map(([geometry, material]) => {
    const mesh = new THREE.InstancedMesh(geometry, material, selected.length);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.castShadow = true; mesh.receiveShadow = true;
    root.add(mesh); return mesh;
  });
  city.w.root.add(root);
  let enabled = true, disposed = false;
  const variants=selected.map((p,i)=>new THREE.Matrix4().compose(new THREE.Vector3(),
    new THREE.Quaternion().setFromAxisAngle(v(0,1,0),district ? i*2.39996 : 0),
    v(district ? .92+(i%4)*.055 : 1,district ? .94+(i%5)*.03 : 1,district ? .95+(i%3)*.05 : 1)));
  const instance=new THREE.Matrix4();
  const saved = selected.map(() => ({ trunk: new THREE.Matrix4(), leaves: new THREE.Matrix4(), valid: false }));
  function apply() {
    if (!enabled || disposed) return;
    selected.forEach((p, i) => {
      pools.trunk.m.getMatrixAt(p.index, saved[i].trunk);
      pools.leaves.m.getMatrixAt(p.index, saved[i].leaves); saved[i].valid = true;
      instance.multiplyMatrices(saved[i].trunk,variants[i]);
      meshes.forEach(mesh => mesh.setMatrixAt(i, instance));
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
