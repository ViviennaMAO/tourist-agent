import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createDubaiGardens } from '../src/dubai-gardens.js';
import { createDubaiBackdrop } from '../src/dubai-backdrop.js';
import { createDubaiArchitecture } from '../src/dubai-architecture.js';
import { installDistrictBounce } from '../src/district-bounce.js';
import { refinedWalkHeight } from '../src/walk-surfaces.js';

const overlap=(a,b,gap=0)=>Math.abs(a.x-b.x)<(a.w+b.w)/2+gap&&Math.abs(a.z-b.z)<(a.d+b.d)/2+gap;
test('outer pocket gardens keep the shore lane open and reject plots crossing land or height boundaries',()=>{
  const ctx={rects:[],palms:[],roads:[],groundY:()=>1,free:x=>Math.abs(x)>57,
    islands:[{id:'mainland',outline:[[-64,-84],[64,-84],[64,-5],[-64,-5]]}]};
  const stone=new THREE.MeshStandardMaterial(),city={w:{root:new THREE.Group(),ctx}};
  const gardens=createDubaiGardens({THREE,city,stoneMaterial:stone});
  assert.equal(gardens.stats.pockets,8);gardens.root.updateMatrixWorld(true);
  for(const b of gardens.footprints){
    assert.ok(b.pocket&&Math.abs(b.x)+b.w/2<64&&b.z-b.d/2>-84&&b.z+b.d/2<-5);
    const hits=new THREE.Raycaster(new THREE.Vector3(b.x+.7,2,b.z+1.7),new THREE.Vector3(0,-1,0)).intersectObject(gardens.root,true);
    assert.ok(hits.some(h=>Math.abs(h.point.y-1.17)<.001),'garden contains upward-facing earth');
  }
  for(const sign of [-1,1])for(let z=-80;z<-20;z+=.5){
    assert.ok(!gardens.footprints.some(b=>overlap(b,{x:sign*56,z,w:1.2,d:1.2})), 'continuous coastal walking clearance');
    const hits=new THREE.Raycaster(new THREE.Vector3(sign*56,8,z),new THREE.Vector3(0,-1,0)).intersectObject(gardens.root,true);
    assert.ok(hits.every(h=>h.point.y<1.04),'no invisible raised surface or hanging vegetation over the lane');
  }
  gardens.dispose();ctx.groundY=x=>x>60?1.3:1;
  const stepped=createDubaiGardens({THREE,city,stoneMaterial:stone});assert.equal(stepped.stats.pockets,4);assert.ok(stepped.footprints.every(b=>b.x<0));stepped.dispose();
  ctx.islands[0].outline=[[-58,-84],[58,-84],[58,-5],[-58,-5]];ctx.groundY=()=>1;
  const narrow=createDubaiGardens({THREE,city,stoneMaterial:stone});assert.equal(narrow.stats.pockets,0);narrow.dispose();stone.dispose();
});
test('gardens avoid roads, landmarks, existing and deferred refinement footprints',()=>{
  const existing={x:-28,z:-34,w:6,d:6},rects=[existing];
  const ctx={rects,palms:[{x:54,z:-43}],groundY:()=>1,free:(x,z,w,d)=>
    Math.abs(z+50)>2.9+d/2&&Math.hypot(x-21,z+27)>7.6+Math.hypot(w,d)/2&&!overlap({x,z,w,d},existing,.9)};
  const city={w:{root:new THREE.Group(),ctx}},backdrop=createDubaiBackdrop({THREE,city});
  const stone=new THREE.MeshStandardMaterial(),leafTexture=new THREE.Texture();
  const gardens=createDubaiGardens({THREE,city,stoneMaterial:stone,leafTexture,exclusions:backdrop.footprints});
  assert.ok(gardens.stats.gardens>10&&gardens.stats.trees>5);
  assert.ok(gardens.stats.triangles<150000);assert.ok(gardens.stats.drawCalls<=10);
  for(const [i,r] of gardens.footprints.entries()) {
    assert.ok(ctx.free(r.x,r.z,r.w,r.d));
    assert.ok(!backdrop.footprints.some(q=>overlap(r,q,.9)));
    assert.ok(!ctx.palms.some(p=>overlap(r,{...p,w:.7,d:.7},.4)));
    assert.ok(!gardens.footprints.slice(i+1).some(q=>overlap(r,q,1.3)));
  }
  for(const m of gardens.root.children) {
    for(const attr of Object.values(m.geometry.attributes))assert.ok(attr.array.every(Number.isFinite));
    assert.ok(m.geometry.index.array.every(i=>i<m.geometry.attributes.position.count));
  }
  for(const p of gardens.surfaces)assert.ok(p.x-p.w/2>=-62&&p.x+p.w/2<=62&&p.z-p.d/2>=-82&&p.z+p.d/2<=-20+.00001);
  for(let i=0;i<3;i++) {
    gardens.setEnabled(true);gardens.setEnabled(true);assert.equal(rects.length,1+gardens.footprints.length);
    gardens.setEnabled(false);assert.deepEqual(rects,[existing]);
  }
  let disposed=0;stone.addEventListener('dispose',()=>disposed++);leafTexture.addEventListener('dispose',()=>disposed++);
  gardens.setEnabled(true);gardens.dispose();gardens.dispose();assert.deepEqual(rects,[existing]);assert.equal(disposed,0);
  backdrop.dispose();stone.dispose();leafTexture.dispose();
});

test('rear road-end ramps descend to paving with upward faces and no collision obstacles',()=>{
  const city={w:{root:new THREE.Group(),ctx:{rects:[],groundY:()=>1,free:()=>false,roads:[{A:[-48,-50],B:[48,-50],kind:'road',hw:2.3}]}}};
  const stone=new THREE.MeshStandardMaterial(),g=createDubaiGardens({THREE,city,stoneMaterial:stone});
  assert.equal(g.ramps.length,2);assert.equal(g.footprints.length,0);
  g.root.updateMatrixWorld(true);
  for(const sign of [-1,1]) {
    const ray=x=>new THREE.Raycaster(new THREE.Vector3(sign*x,3,-50),new THREE.Vector3(0,-1,0)).intersectObject(g.root,true)[0];
    assert.ok(ray(48.05).point.y>1.31);assert.ok(ray(49.4).point.y<1.04);
    assert.ok(ray(48.7).face.normal.y>.9);
  }
  g.dispose();stone.dispose();
});

test('rear paving rejects height discontinuities and dune suppression is reversible',()=>{
  const city={w:{root:new THREE.Group(),ctx:{rects:[],free:()=>false,groundY:(x)=>x>0?1.28:1}}};
  const dune=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial());dune.userData.dubaiRearDune=true;city.w.root.add(dune);
  const unrelated=new THREE.Object3D();city.w.root.add(unrelated);
  const stone=new THREE.MeshStandardMaterial(),g=createDubaiGardens({THREE,city,stoneMaterial:stone});
  for(const p of g.surfaces)assert.ok(!(p.x-p.w/2<=0&&p.x+p.w/2>0),'no floating slab across terrain step');
  g.setEnabled(true);g.apply();g.apply();assert.equal(dune.visible,false);assert.equal(unrelated.visible,true);
  g.setEnabled(false);assert.equal(dune.visible,true);g.dispose();stone.dispose();dune.geometry.dispose();dune.material.dispose();
});

test('avatar surface follows both rendered ramps and paving across the old road end caps',()=>{
  const other=()=>null;
  const ctx={rects:[],walkSurfaces:[other],groundY:()=>1,free:()=>false,roads:[{A:[-48,-50],B:[48,-50],kind:'road',hw:2.3}]};
  const city={w:{root:new THREE.Group(),ctx}},stone=new THREE.MeshStandardMaterial();
  const g=createDubaiGardens({THREE,city,stoneMaterial:stone});
  g.setEnabled(true);g.root.updateMatrixWorld(true);
  for(const sign of [-1,1]) {
    let previous=1.38;
    for(let x=48.001;x<50.7;x+=.043) {
      const y=refinedWalkHeight(ctx,sign*x,-50,1.38);
      const hit=new THREE.Raycaster(new THREE.Vector3(sign*x,3,-50),new THREE.Vector3(0,-1,0)).intersectObject(g.root,true)[0];
      assert.ok(hit);assert.ok(Math.abs(y-hit.point.y-.046)<.003,'feet follow the drawn slope and slabs');
      assert.ok(Math.abs(y-previous)<.02,'no jump at the old circular road cap');previous=y;
    }
    assert.equal(refinedWalkHeight(ctx,sign*48,-47,1.28),1.28,'outside paving uses existing ground');
  }
  for(let i=0;i<3;i++){g.setEnabled(false);assert.deepEqual(ctx.walkSurfaces,[other]);g.setEnabled(true);assert.equal(ctx.walkSurfaces.length,2);}
  g.dispose();assert.deepEqual(ctx.walkSurfaces,[other]);stone.dispose();
});

test('long mixed borders keep road openings and bridge the raised lawn edge',()=>{
  const ctx={rects:[],groundY:x=>Math.abs(x)<48?1.28:1,free:(x,z,w,d)=>Math.abs(z+16)>2.9+d/2&&Math.abs(z+50)>2.9+d/2};
  const city={w:{root:new THREE.Group(),ctx}},stone=new THREE.MeshStandardMaterial();
  const g=createDubaiGardens({THREE,city,stoneMaterial:stone});
  assert.equal(g.stats.borders,6);assert.ok(g.edging.length>0);
  g.root.updateMatrixWorld(true);
  for(const b of g.footprints.filter(b=>b.border)) {
    assert.ok(ctx.free(b.x,b.z,b.w,b.d));assert.ok(b.d>4*b.w);
    const hits=new THREE.Raycaster(new THREE.Vector3(b.x,3,b.z),new THREE.Vector3(0,-1,0)).intersectObject(g.root,true);
    assert.ok(hits.some(h=>Math.abs(h.point.y-1.51)<.001),'earth covers the higher grass surface');
  }
  for(const b of g.edging)assert.ok(Math.abs(b.z+50)>2.9+b.d/2);
  for(const sign of [-1,1])for(let z=-46;z<=-20;z+=.1) {
    assert.ok(!g.footprints.some(q=>Math.abs(sign*50.7-q.x)<q.w/2+.45&&Math.abs(z-q.z)<q.d/2+.45),'continuous avatar clearance along each side path');
  }
  g.dispose();stone.dispose();
});

test('ordinary houses get physical stone bevels and controllable pre-AO ground return',()=>{
  const city={w:{root:new THREE.Group(),ctx:{pools:{},buildings:[{x:0,z:-24,w:4,d:5,h:7,base:1.28,indices:{body:0}}]}}};
  const s=createDubaiArchitecture({THREE,city,district:true});
  assert.ok(s.stats.beveledPieces>50);
  const m=s.root.children.find(m=>m.material.color.getHexString()==='dfd3bf').material;
  const shader={uniforms:{},vertexShader:THREE.ShaderLib.standard.vertexShader,fragmentShader:THREE.ShaderLib.standard.fragmentShader};
  m.onBeforeCompile(shader,{});s.setBounce(false);assert.equal(shader.uniforms.districtGroundBounce.value,0);
  s.setBounce(true);assert.equal(shader.uniforms.districtGroundBounce.value,1);
  assert.ok(shader.fragmentShader.indexOf('float districtReturn')<shader.fragmentShader.indexOf('#include <aomap_fragment>'));
  s.dispose();
  const material=new THREE.MeshStandardMaterial();material.onBeforeCompile=s=>s.uniforms.original={value:1};
  installDistrictBounce(material,new THREE.Vector3(),{value:1});material.onBeforeCompile(shader,{});
  assert.equal(shader.uniforms.original.value,1);material.dispose();
});
