import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** Coastal public realm. Objects reserve reversible collision footprints and
 * leave roads, existing buildings, landmarks and the spawn corridor clear. */
export function createDubaiLandscape({ THREE, city, stoneMaterial, waterMaterial }) {
  const root = new THREE.Group(); root.name = 'Dubai — waterfront public realm';
  const ctx = city.w.ctx, batches = new Map(), ownedMaterials = [], colliders = [];
  let enabled = false, disposed = false, seed = 21973;
  const random = () => { seed = (Math.imul(seed,1664525)+1013904223)>>>0; return seed/4294967296; };
  function material(color, roughness = .85, options = {}) {
    const m = new THREE.MeshStandardMaterial({color,roughness,...options}); ownedMaterials.push(m); return m;
  }
  const stone = stoneMaterial.clone(); stone.onBeforeCompile = stoneMaterial.onBeforeCompile;
  stone.customProgramCacheKey = stoneMaterial.customProgramCacheKey; ownedMaterials.push(stone);
  const dark = material('#393c30',.64,{metalness:.55}), wood = material('#99784d'), soil = material('#4e4935');
  const greens = [material('#43592f',.92,{side:THREE.DoubleSide}),material('#74854b',.91,{side:THREE.DoubleSide})];
  const bloom = [material('#bd5075'),material('#eee3c3')];
  const lamp = material('#ffe1a0',.4,{emissive:'#ffc06a',emissiveIntensity:1.0});
  const fabric = material('#e9dcc1');
  const cube = new THREE.BoxGeometry(1,1,1), matrix = new THREE.Matrix4(), quat = new THREE.Quaternion();
  const up = new THREE.Vector3(0,1,0), unit = new THREE.Vector3(1,1,1);
  function add(geo, mat, x=0,y=0,z=0,ry=0) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    geo.dispose(); quat.setFromAxisAngle(up,ry); matrix.compose(new THREE.Vector3(x,y,z),quat,unit); g.applyMatrix4(matrix);
    if (!batches.has(mat)) batches.set(mat,[]); batches.get(mat).push(g);
  }
  function box(mat,x,y,z,w,h,d,ry=0) { add(cube.clone().scale(w,h,d),mat,x,y,z,ry); }
  function cylinder(mat,x,y,z,rt,rb,h,n=10) { add(new THREE.CylinderGeometry(rt,rb,h,n),mat,x,y,z); }
  const reserved = [];
  function reserve(x,z,w,d) {
    if (!ctx.free(x,z,w,d)) return false;
    if (reserved.some(q=>Math.abs(x-q.x)<(w+q.w)/2+.45&&Math.abs(z-q.z)<(d+q.d)/2+.45)) return false;
    const r={x,z,w,d}; reserved.push(r); colliders.push(r); return true;
  }
  // Tiled pedestrian surfaces: modest offsets follow each existing ground level.
  for (const [x,z,w,d] of [[-24,-8.9,46,6.0],[24,-8.9,46,6.0],[-20,-25,23,12],[20,-25,23,12]]) {
    box(stone,x,ctx.groundY(x,z)+.006,z,w,.012,d);
  }
  // Rock revetment along the mainland shore; entrances at x=0 and -50 stay open.
  const rocks = material('#998d76',.98);
  for (let x=-60; x<61; x+=.66) {
    if (Math.abs(x)<3.4 || Math.abs(x+50)<3.4) continue;
    const z=-4.75 + .12*Math.sin(x*1.5);
    add(new THREE.DodecahedronGeometry(.43+random()*.16,0).scale(.8+random()*.3,.7,.75).rotateX(random()*1.8),rocks,x,.48+random()*.12,z,random()*6.28);
    add(new THREE.DodecahedronGeometry(.25+random()*.16,0).scale(1,.6,.8),rocks,x+.18,.2,z+.15,random()*6.28);
    box(stone,x,1.015,-4.9,.68,.1,.48);
  }
  // Small raised beds with actual individual leaves and flowering clusters.
  function foliage(x,y,z,r,flowers=false) {
    for (let j=0;j<26;j++) {
      const angle=random()*6.28, radius=r*Math.sqrt(random()), h=random()*r*.7;
      const px=x+Math.cos(angle)*radius, pz=z+Math.sin(angle)*radius;
      const leaf = new THREE.SphereGeometry(.12,4,2).scale(1.55,.18,.65);
      leaf.rotateX(random()*1.1).rotateZ(random()*1.2-.6);
      add(leaf,greens[j%2],px,y+h,pz,angle);
      if (flowers&&j%5===0) add(new THREE.IcosahedronGeometry(.085,0),bloom[j%2],px,y+h+.09,pz);
    }
  }
  function bed(x,z,w=2.4,d=.9,flowers=true) {
    if (!reserve(x,z,w,d)) return;
    const y=ctx.groundY(x,z);
    box(stone,x,y+.24,z,w,.48,d); box(soil,x,y+.485,z,w-.18,.015,d-.18);
    for (let i=0;i<Math.ceil(w/.45);i++) foliage(x-w/2+.23+i*.44,y+.52,z,.38,flowers);
  }
  for (const x of [-43,-36,-29,-12,12,21,29,38,44]) bed(x,-6.8,3.2,.85);
  for (const [x,z] of [[-27,-20],[-15,-20],[15,-20],[27,-20],[-28,-34],[28,-38],[-10,-45],[10,-45]]) bed(x,z,2.4,1.1);
  // Layered small-leaf crowns add middle-height shade between low beds and palms.
  // Their entire crowns stay inside reserved planting footprints.
  for (const [x,z] of [[-39,-10],[-33,-7.5],[17,-7.5],[33,-7.5],[-13,-25],[13,-25],[-25,-36],[28,-43]]) {
    if (!reserve(x,z,2.8,2.8)) continue;
    const y=ctx.groundY(x,z);
    cylinder(stone,x,y+.22,z,1.1,1.2,.44,20);
    cylinder(soil,x,y+.45,z,.95,.95,.035,20);
    cylinder(wood,x,y+1.55,z,.055,.12,2.3,8);
    for(let branch=0;branch<8;branch++) {
      const a=branch/8*Math.PI*2, r=.35+random()*.4, cy=y+2.3+random()*.9;
      const end=new THREE.Vector3(x+Math.cos(a)*r,cy,z+Math.sin(a)*r), start=new THREE.Vector3(x,y+1.8,z);
      const delta=end.clone().sub(start), limb=new THREE.CylinderGeometry(.022,.045,delta.length(),6);
      limb.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(up,delta.clone().normalize()));
      add(limb,wood,...start.clone().add(end).multiplyScalar(.5).toArray());
      for(let cluster=0;cluster<3;cluster++) foliage(end.x+(random()-.5)*.4,end.y+(random()-.5)*.5,end.z+(random()-.5)*.4,.38,false);
    }
    foliage(x,y+.55,z,.8,true);
  }
  // Keep all substantial decorations outside the traversable carriageway.
  function bench(x,z,ry=0) {
    if (!reserve(x,z,2.1,.85)) return;
    const y=ctx.groundY(x,z), point=(a,b)=>[x+Math.cos(ry)*a+Math.sin(ry)*b,z-Math.sin(ry)*a+Math.cos(ry)*b];
    for (const dz of [-.24,-.08,.08,.24]) { const [xx,zz]=point(0,dz); box(wood,xx,y+.5,zz,1.95,.075,.11,ry); }
    for (const dy of [.73,.91]) { const [xx,zz]=point(0,-.29); box(wood,xx,y+dy,zz,1.95,.12,.07,ry); }
    for (const dx of [-.78,.78]) { const [xx,zz]=point(dx,0); box(dark,xx,y+.26,zz,.065,.5,.65,ry); const [bx,bz]=point(dx,-.29); box(dark,bx,y+.68,bz,.05,.65,.06,ry); }
  }
  for (const x of [-28,-12,12,28,42]) bench(x,-10.5);
  function lantern(x,z) {
    if (!reserve(x,z,.28,.28)) return;
    const y=ctx.groundY(x,z);
    cylinder(dark,x,y+.12,z,.17,.22,.24);
    cylinder(dark,x,y+1.65,z,.045,.065,3.1,8);
    box(lamp,x,y+3.15,z,.19,.46,.19);
    for (const a of [-1,1]) for (const b of [-1,1]) box(dark,x+a*.13,y+3.15,z+b*.13,.025,.52,.025);
    box(dark,x,y+2.88,z,.32,.06,.32); add(new THREE.ConeGeometry(.27,.16,4).rotateY(Math.PI/4),dark,x,y+3.48,z);
  }
  for (const x of [-44,-30,-16,16,30,44]) lantern(x,-12.3);
  // A compact waterfront fountain, in the open beach strip away from the road.
  const fountainX=-20, fountainZ=-8.8, fountainR=2.05;
  const jetMeshes=[];
  if (reserve(fountainX,fountainZ,4.5,4.5)) {
    const y=ctx.groundY(fountainX,fountainZ);
    cylinder(stone,fountainX,y+.21,fountainZ,2.15,2.25,.42,64);
    const water=new THREE.Mesh(new THREE.CircleGeometry(fountainR,64).rotateX(-Math.PI/2),waterMaterial);
    water.position.set(fountainX,y+.435,fountainZ); root.add(water);
    const rim=new THREE.TorusGeometry(2.13,.10,8,64).rotateX(Math.PI/2); add(rim,stone,fountainX,y+.46,fountainZ);
    const spray=material('#d4e7df',.15,{transparent:true,opacity:.72,depthWrite:false});
    for(let j=0;j<7;j++) {
      const angle=j/7*Math.PI*2;
      const a=new THREE.Vector3(Math.cos(angle)*1.1,0,Math.sin(angle)*1.1);
      const curve=new THREE.QuadraticBezierCurve3(a,a.clone().multiplyScalar(.45).setY(2),new THREE.Vector3(0,0,0));
      const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,16,.026,4,false),spray);
      mesh.position.set(fountainX,y+.46,fountainZ); root.add(mesh); jetMeshes.push(mesh);
    }
  }
  // Café tables with quiet linen canopies, replacing the original beach umbrellas.
  for (const x of [-39,-6,7,36]) {
    const z=-8.6;
    if (!reserve(x,z,3.4,3.2)) continue;
    const y=ctx.groundY(x,z);
    cylinder(dark,x,y+.5,z,.065,.09,1); cylinder(wood,x,y+1.02,z,.65,.65,.08,24);
    cylinder(wood,x,y+1.6,z,.035,.035,3.2,8);
    add(new THREE.ConeGeometry(1.6,.55,8),fabric,x,y+3.2,z,Math.PI/8);
    for(const dx of [-.95,.95]) { box(wood,x+dx,y+.53,z,.45,.07,.45); box(wood,x+dx,y+.88,z-.2,.45,.52,.055); for(const a of [-.16,.16]) for(const b of [-.16,.16]) box(dark,x+dx+a,y+.27,z+b,.03,.52,.03); }
  }
  cube.dispose();
  for(const [m,geometries] of batches) {
    const g=mergeGeometries(geometries); geometries.forEach(x=>x.dispose());
    const mesh=new THREE.Mesh(g,m); mesh.castShadow=true; mesh.receiveShadow=true; root.add(mesh);
  }
  city.w.root.add(root); root.visible=false;
  const shore=[], savedPools=[];
  city.w.root.traverse(o=>{if(o.userData.shoreline) shore.push(o);});
  for(const name of ['canopy','pole']) {
    const p=ctx.pools[name]; if(!p) continue;
    for(let i=0;i<p.m.count;i++) savedPools.push({pool:p,index:i,matrix:new THREE.Matrix4(),valid:false});
  }
  const stats={decorations:colliders.length,triangles:root.children.reduce((n,m)=>n+(m.geometry.index?.count||m.geometry.attributes.position.count)/3,0),drawCalls:root.children.length};
  function restore(){savedPools.forEach(s=>{if(s.valid){s.pool.set(s.index,s.matrix);s.pool.flush();s.valid=false;}});shore.forEach(m=>m.visible=true);}
  return {root,stats,apply(time=0){
    if(!enabled||disposed)return;
    savedPools.forEach(s=>{s.pool.m.getMatrixAt(s.index,s.matrix);s.valid=true;s.pool.hide(s.index);});
    for(const p of new Set(savedPools.map(s=>s.pool))) p.flush();
    shore.forEach(m=>m.visible=false);
    jetMeshes.forEach((m,i)=>m.scale.y=.95+.05*Math.sin(time*1.3+i));
  },setEnabled(v){
    if(disposed)return;
    const next=!!v; if(next===enabled)return; enabled=next;root.visible=next;
    if(next)ctx.rects.push(...colliders);
    else {for(const r of colliders){const i=ctx.rects.indexOf(r);if(i>=0)ctx.rects.splice(i,1);}restore();}
  },dispose(){if(disposed)return;this.setEnabled(false);disposed=true;root.removeFromParent();root.children.forEach(m=>m.geometry.dispose());ownedMaterials.forEach(m=>m.dispose());}};
}
