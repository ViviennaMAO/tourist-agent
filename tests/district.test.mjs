import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createDubaiLandscape } from '../src/dubai-landscape.js';
import { createDubaiLandmarks } from '../src/dubai-landmarks.js';
import { createWaterStudy } from '../src/water-study.js';
import { createDubaiArchitecture } from '../src/dubai-architecture.js';

function finite(root) {
  root.traverse(o => {
    if (!o.isMesh) return;
    for (const a of Object.values(o.geometry.attributes)) assert.ok(a.array.every(Number.isFinite));
    if(o.geometry.index) assert.ok(o.geometry.index.array.every(i=>i<o.geometry.attributes.position.count));
  });
}

test('district architecture preserves horizontal collision envelopes after skyline changes',()=>{
  for(const height of [3,4.6,7,20,32]) {
    const buildings=[{x:-22,z:-23,w:4,d:5,h:height,base:1.28,ry:.37,indices:{body:0}},
      {x:20,z:-48,w:5,d:4,h:height,base:1.28,ry:0,indices:{body:1}}];
    const city={w:{root:new THREE.Group(),ctx:{buildings,pools:{}}}};
    const study=createDubaiArchitecture({THREE,city,district:true});
    assert.equal(study.stats.buildings,2);assert.ok(study.stats.drawCalls<=13);finite(study.root);
    study.root.traverse(o=>{if(!o.isMesh)return;const a=o.geometry.attributes.position;
      for(let i=0;i<a.count;i++) {
        const p=new THREE.Vector3().fromBufferAttribute(a,i);
        assert.ok(buildings.some(b=>{const q=p.clone().sub(new THREE.Vector3(b.x,b.base,b.z)).applyAxisAngle(new THREE.Vector3(0,1,0),-b.ry);
          return Math.abs(q.x)<=b.w/2+.00001&&Math.abs(q.z)<=b.d/2+.00001&&q.y>=-.00001&&q.y<=Math.max(b.h,5.8)+.00001;}));
      }
    });study.dispose();
  }
});

test('landscape reserves clear paths and removes only its own collisions across repeated A/B',()=>{
  const existing={x:0,z:0,w:2,d:2},rects=[existing];
  const city={w:{root:new THREE.Group(),ctx:{rects,pools:{},groundY:()=>1,
    free:(x,z,w,d)=>Math.abs(x)>w/2+2.9&&Math.abs(z+16)>d/2+2.9}}};
  const stone=new THREE.MeshStandardMaterial(),water=new THREE.MeshBasicMaterial();
  const study=createDubaiLandscape({THREE,city,stoneMaterial:stone,waterMaterial:water});
  finite(study.root);assert.ok(study.stats.decorations>10);assert.ok(study.stats.triangles<100000);
  for(let i=0;i<3;i++) {
    study.setEnabled(true);study.setEnabled(true);study.apply(180);
    assert.equal(rects.length,1+study.stats.decorations);
    for(const r of rects.slice(1)) assert.ok(city.w.ctx.free(r.x,r.z,r.w,r.d));
    study.setEnabled(false);assert.deepEqual(rects,[existing]);
  }
  study.setEnabled(true);study.dispose();study.dispose();assert.deepEqual(rects,[existing]);
  assert.equal(city.w.root.children.length,0);stone.dispose();water.dispose();
});

test('water keeps source shaders reversible and shares lake animation time',()=>{
  const make=()=>new THREE.ShaderMaterial({uniforms:{uT:{value:8},uFogNear:{value:280},uFogFar:{value:1150}},fragmentShader:'void main(){gl_FragColor=vec4(1.);}'});
  const seaMat=make(),lagoonMat=make(),fragment=seaMat.fragmentShader;
  const study=createWaterStudy({THREE,seaMat,lagoonMat});
  assert.equal(study.lakeMaterial.uniforms.uT,seaMat.uniforms.uT);
  study.setEnabled(true);assert.equal(seaMat.uniforms.uRealism.value,1);
  study.update({sunDirection:new THREE.Vector3(1,1,0),fog:new THREE.Color('#eeeeee'),near:300,far:1000});
  assert.equal(study.lakeMaterial.uniforms.uFogNear.value,300);
  study.setEnabled(false);assert.equal(lagoonMat.uniforms.uRealism.value,0);
  study.dispose();assert.equal(seaMat.fragmentShader,fragment);assert.equal(lagoonMat.fragmentShader,fragment);
  assert.ok(!('uRealism' in seaMat.uniforms));seaMat.dispose();lagoonMat.dispose();
});

test('landmark replacement handles late assets and restores their materials/visibility',()=>{
  const landmark=id=>({id,cfg:{h:46},holder:new THREE.Group(),loaded:false});
  const city={LM:{burj_khalifa:landmark('burj_khalifa'),dubai_frame:landmark('dubai_frame'),museum_future:landmark('museum_future')}};
  const study=createDubaiLandmarks({THREE,city});finite(study.root);
  assert.ok(study.stats.triangles<80000);study.setEnabled(true);study.apply();assert.equal(study.root.visible,false);
  const before=[];
  for(const l of Object.values(city.LM)) {l.asset=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial());l.holder.add(l.asset);l.loaded=true;before.push(l.asset.material);}
  study.apply();assert.equal(study.root.visible,true);assert.equal(city.LM.burj_khalifa.asset.visible,false);
  assert.notEqual(city.LM.dubai_frame.asset.material,before[1]);
  study.setEnabled(false);assert.equal(city.LM.burj_khalifa.asset.visible,true);assert.equal(city.LM.dubai_frame.asset.material,before[1]);
  study.setEnabled(true);study.dispose();assert.equal(city.LM.museum_future.asset.material,before[2]);
  assert.equal(city.LM.burj_khalifa.holder.children.length,1);
});
