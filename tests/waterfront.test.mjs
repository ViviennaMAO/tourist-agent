import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createDubaiWaterfront } from '../src/dubai-waterfront.js';
import { createDubaiLandscape } from '../src/dubai-landscape.js';

function fixture() {
  const rects=[], roads=[{A:[-34,-50],B:[-34,-16]},{A:[34,-50],B:[34,-16]},{A:[-48,-16],B:[48,-16]}], ctx={rects, pools:{}, groundY:()=>1,
    // Ctx.free reserves a 2.3 m road half-width, including the verge. The
    // traversable asphalt is narrower (1.65 m); placement must use the former.
    free(x,z,w,d){return !roads.some(r=>{
      const dx=r.B[0]-r.A[0], dz=r.B[1]-r.A[1];
      const u=Math.max(0,Math.min(1,((x-r.A[0])*dx+(z-r.A[1])*dz)/(dx*dx+dz*dz)));
      const px=r.A[0]+dx*u, pz=r.A[1]+dz*u;
      return Math.abs(dx)>Math.abs(dz)
        ?Math.abs(z-pz)<2.3+d/2+.6&&Math.abs(x-px)<w/2+.1
        :Math.abs(x-px)<2.3+w/2+.6&&Math.abs(z-pz)<d/2+.1;
    })
      && !rects.some(q=>Math.abs(x-q.x)<(w+q.w)/2+.9&&Math.abs(z-q.z)<(d+q.d)/2+.9);}};
  return {w:{root:new THREE.Group(),ctx}};
}

test('waterfront pilot frames the square, has real display rooms and disposes owned resources once',()=>{
  const city=fixture(), stone=new THREE.MeshStandardMaterial(); let sourceDisposed=0;stone.addEventListener('dispose',()=>sourceDisposed++);
  const p=createDubaiWaterfront({THREE,city,stoneMaterial:stone});
  // Round 10 adds open bronze fretwork and stone mouldings to the two pilots.
  assert.equal(p.stats.buildings,2);assert.ok(p.stats.triangles<45000);assert.ok(p.stats.drawCalls<=15);
  for(const m of p.root.children) {
    for(const a of Object.values(m.geometry.attributes)) assert.ok(a.array.every(Number.isFinite));
    assert.ok(m.geometry.index.array.every(i=>i<m.geometry.attributes.position.count));
  }
  p.root.updateMatrixWorld(true);
  const hits=new THREE.Raycaster(new THREE.Vector3(-23,2.55,-10.18),new THREE.Vector3(-1,0,0)).intersectObject(p.root,true);
  assert.ok(hits[0].object.material.transparent,'arcade must remain open up to the recessed glass');
  assert.ok(hits[0].distance>4.8&&hits[0].distance<5.1);
  assert.ok(hits.some(h=>!h.object.material.transparent&&h.distance>hits[0].distance+.2&&h.distance<6.2),'display geometry must exist behind the glass');
  let geometryDisposals=0;for(const m of p.root.children)m.geometry.addEventListener('dispose',()=>geometryDisposals++);
  const count=p.root.children.length;
  p.setEnabled(true);p.setEnabled(true);assert.equal(city.w.ctx.rects.length,2);
  p.setEnabled(false);assert.equal(city.w.ctx.rects.length,0);
  p.setEnabled(true);p.dispose();p.dispose();assert.equal(city.w.ctx.rects.length,0);
  assert.equal(geometryDisposals,count);assert.equal(sourceDisposed,0);stone.dispose();
});

test('pilot furniture respects both shops and leaves routes from shore spawn to street on both sides of fountain',()=>{
  const city=fixture(), stone=new THREE.MeshStandardMaterial(),water=new THREE.MeshBasicMaterial(),leafTexture=new THREE.Texture();
  const pilot=createDubaiWaterfront({THREE,city,stoneMaterial:stone});
  const landscape=createDubaiLandscape({THREE,city,stoneMaterial:stone,waterMaterial:water,leafTexture,exclusions:pilot.footprints});
  pilot.setEnabled(true);landscape.setEnabled(true);
  const rects=city.w.ctx.rects;
  assert.ok(rects.some(r=>r.x===-20&&r.z===-9.4),'fountain must actually be placed');
  assert.ok(rects.some(r=>r.x===-25&&r.z===-10.4),'west café must actually be placed');
  assert.ok(rects.some(r=>r.x===-15&&r.z===-10.4),'east café must actually be placed');
  for(const x of [-25,-15]) assert.ok(rects.some(r=>r.x===x&&r.z===-12.55),'rear flower borders must actually be placed');
  // The rough quay and five-sided flowers add a bounded batch of geometry.
  assert.ok(landscape.stats.triangles<170000,`pilot foliage and revetment budget exceeded: ${landscape.stats.triangles}`);
  const quay=landscape.root.children.find(m=>m.material.userData.pilotRevetment);
  assert.ok(quay,'rough stone must be present in the pilot');
  const q=quay.geometry.attributes.position,c=quay.geometry.attributes.color;
  assert.equal(q.count,c.count);
  for(let i=0;i<q.count;i++) {
    assert.ok(Number.isFinite(c.getX(i)+c.getY(i)+c.getZ(i)));
    assert.ok(q.getY(i)>=0&&q.getY(i)<1.01,'quay stays below the walking surface');
    assert.ok(q.getZ(i)>-5.3&&q.getZ(i)<-4.2,'quay stays outside the shore walking corridor');
  }
  const basin=landscape.root.children.find(m=>m.material.isShaderMaterial);
  assert.ok(basin,'pilot has its own shallow basin surface');
  let basinDisposals=0,sharedWaterDisposals=0;
  basin.material.addEventListener('dispose',()=>basinDisposals++);
  water.addEventListener('dispose',()=>sharedWaterDisposals++);
  for(const q of rects.filter(r=>!pilot.footprints.includes(r))) for(const b of pilot.footprints) {
    assert.ok(Math.abs(q.x-b.x)>=(q.w+b.w)/2+.45 || Math.abs(q.z-b.z)>=(q.d+b.d)/2+.45);
  }
  const walkable=(x,z)=>Math.abs(z+16)<1.65||!rects.some(q=>Math.abs(x-q.x)<q.w/2+.45&&Math.abs(z-q.z)<q.d/2+.45);
  for(const sideX of [-23.2,-16.8]) {
    const points=[[-20,-5.65],[sideX,-5.65],[sideX,-16]];
    for(let k=1;k<points.length;k++) {
      const a=points[k-1],b=points[k],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.05);
      for(let i=0;i<=n;i++)assert.ok(walkable(a[0]+(b[0]-a[0])*i/n,a[1]+(b[1]-a[1])*i/n),'avatar clearance must remain continuous');
    }
  }
  for(let i=0;i<3;i++){pilot.setEnabled(false);landscape.setEnabled(false);assert.equal(rects.length,0);pilot.setEnabled(true);landscape.setEnabled(true);}
  pilot.dispose();landscape.dispose();landscape.dispose();assert.equal(rects.length,0);
  assert.equal(basinDisposals,1);assert.equal(sharedWaterDisposals,0);
  stone.dispose();water.dispose();leafTexture.dispose();
});
