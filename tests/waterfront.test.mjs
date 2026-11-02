import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createDubaiWaterfront } from '../src/dubai-waterfront.js';
import { createDubaiLandscape } from '../src/dubai-landscape.js';

function fixture() {
  const rects=[], roads=[{x:-34},{x:34},{z:-16}], ctx={rects, pools:{}, groundY:()=>1,
    free(x,z,w,d){return !roads.some(r=>r.x!==undefined?Math.abs(x-r.x)<1.65+w/2+.6:Math.abs(z-r.z)<1.65+d/2+.6)
      && !rects.some(q=>Math.abs(x-q.x)<(w+q.w)/2+.9&&Math.abs(z-q.z)<(d+q.d)/2+.9);}};
  return {w:{root:new THREE.Group(),ctx}};
}

test('waterfront pilot frames the square, has real display rooms and disposes owned resources once',()=>{
  const city=fixture(), stone=new THREE.MeshStandardMaterial(); let sourceDisposed=0;stone.addEventListener('dispose',()=>sourceDisposed++);
  const p=createDubaiWaterfront({THREE,city,stoneMaterial:stone});
  assert.equal(p.stats.buildings,2);assert.ok(p.stats.triangles<40000);assert.ok(p.stats.drawCalls<=15);
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
  pilot.dispose();landscape.dispose();assert.equal(rects.length,0);stone.dispose();water.dispose();leafTexture.dispose();
});
