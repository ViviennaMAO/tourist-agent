import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { coastSamples,createDubaiCoast } from '../src/dubai-coast.js';
import { pointInPolygon } from '../src/shore-profile.js';
import { createDubaiArchitecture } from '../src/dubai-architecture.js';
import { createDubaiPalms } from '../src/dubai-palms.js';
import { createDubaiLandmarks } from '../src/dubai-landmarks.js';
import { landmarkFinish } from '../src/landmark-finish.js';
import { createCityReflections } from '../src/city-reflections.js';

const rect=(id,x1,z1,x2,z2)=>({id,outline:[[x1,z1],[x2,z1],[x2,z2],[x1,z2]]});
const circle=(id,x,z,r)=>({id,outline:Array.from({length:56},(_,i)=>[x+r*Math.cos(i*Math.PI/28),z+r*Math.sin(i*Math.PI/28)])});
const finite=root=>root.traverse(m=>{if(m.isMesh)for(const a of Object.values(m.geometry.attributes))assert.ok(a.array.every(Number.isFinite));});

test('coast covers outward edges of a union and leaves bridge landings open for both windings',()=>{
  const islands=[rect('trunk',-3,0,3,25),rect('frond',-14,9,14,12),circle('pad',0,25,5)];
  const roads=[{A:[0,-4],B:[0,5],kind:'bridge',hw:1.2}];
  const samples=coastSamples(islands,roads);
  assert.equal(new Set(samples.map(s=>s.id)).size,3);
  for(const s of samples){
    assert.ok(!islands.some((p,i)=>i!==s.sourceIndex&&pointInPolygon(p.outline,s.x+s.nx*.53,s.z+s.nz*.53)));
    assert.ok(pointInPolygon(islands[s.sourceIndex].outline,s.x-s.nx*.01,s.z-s.nz*.01));
    assert.ok(!(Math.abs(s.x)<1.8&&s.z<5),'bridge entrance remains clear');
  }
  const reverse=coastSamples(islands.map(i=>({...i,outline:[...i.outline].reverse()})),roads);
  assert.equal(reverse.length,samples.length);
  for(const s of reverse)assert.ok(pointInPolygon(islands[s.sourceIndex].outline,s.x-s.nx*.01,s.z-s.nz*.01));
});

test('continuous revetments have outward stone faces, clear approaches and shared-resource safety',()=>{
  const islands=[rect('test',-10,-10,10,10)],roads=[{A:[0,8],B:[0,14],kind:'bridge',hw:1.5}];
  const city={w:{root:new THREE.Group(),ctx:{islands,roads,rects:[]}}},stone=new THREE.MeshStandardMaterial();
  const haloSource=new THREE.MeshBasicMaterial({color:'#aaffff',transparent:true,opacity:.6});
  const halo=new THREE.Mesh(new THREE.PlaneGeometry(),haloSource);halo.userData.shoreline=true;city.w.root.add(halo);
  let disposed=0;stone.addEventListener('dispose',()=>disposed++);
  const study=createDubaiCoast({THREE,city,stoneMaterial:stone});finite(study.root);study.root.updateMatrixWorld(true);
  assert.equal(study.stats.drawCalls,3);assert.ok(study.stats.triangles<45000);
  const ray=(x,y,z,dx,dz)=>new THREE.Raycaster(new THREE.Vector3(x,y,z),new THREE.Vector3(dx,0,dz)).intersectObject(study.root,true);
  assert.ok(ray(5,.49,12,0,-1)[0].point.z>10.5,'rough face is seaward of the original bevel');
  assert.ok(ray(-12,.49,4,1,0)[0].point.x<-10.5);
  assert.equal(new THREE.Raycaster(new THREE.Vector3(0,3,10),new THREE.Vector3(0,-1,0)).intersectObject(study.root,true).length,0);
  assert.deepEqual(city.w.ctx.rects,[],'no invisible collision walls');
  study.setEnabled(true);assert.notEqual(halo.material,haloSource);
  halo.material.opacity=.6;study.apply();assert.equal(halo.material.opacity,.048,'source animation cannot restore the bright halo');
  assert.equal(haloSource.opacity,.6);study.setEnabled(false);assert.equal(study.root.visible,false);assert.equal(halo.material,haloSource);
  study.dispose();study.dispose();assert.equal(disposed,0);stone.dispose();halo.geometry.dispose();haloSource.dispose();
});

test('island villas include low southern fronds and retain compact height and rotated footprints',()=>{
  const buildings=[{x:-12,z:3.8,w:1.9,d:1.5,h:1.25,base:1,ry:.4,indices:{body:0}},{x:12,z:33,w:1.9,d:1.5,h:1.25,base:1,ry:-.3,indices:{body:1}}];
  const city={w:{root:new THREE.Group(),ctx:{buildings,pools:{}}}};
  const study=createDubaiArchitecture({THREE,city,district:true,island:true});finite(study.root);
  assert.equal(study.stats.buildings,2);assert.ok(study.stats.drawCalls<=8);
  study.root.traverse(m=>{if(!m.isMesh)return;const p=m.geometry.attributes.position;
    for(let i=0;i<p.count;i++)assert.ok(buildings.some(b=>{const q=new THREE.Vector3().fromBufferAttribute(p,i).sub(new THREE.Vector3(b.x,b.base,b.z)).applyAxisAngle(new THREE.Vector3(0,1,0),-b.ry);return Math.abs(q.x)<=b.w/2+.02&&Math.abs(q.z)<=b.d/2+.02&&q.y>=-.001&&q.y<=b.h+.001;}));
  });study.dispose();
});

test('district palm refinement includes fronds and crescent roots without adding draw batches',()=>{
  const city={w:{root:new THREE.Group(),ctx:{pools:{trunk:{flush(){}},leaves:{flush(){}}},palms:[{x:0,z:-20,index:0},{x:10,z:15,index:1},{x:28,z:38,index:2}]}}};
  const study=createDubaiPalms({THREE,city,district:true});finite(study.root);
  assert.equal(study.stats.palms,3);assert.equal(study.stats.drawCalls,3);
  // No actor matrices were replaced, so disposal only flushes the source pools.
  study.dispose();
});

test('all late legacy landmarks support multi-material meshes and restore shared atlases',()=>{
  const ids=['burj_khalifa','dubai_frame','museum_future','emirates_towers','atlantis','burj_al_arab'];
  const LM=Object.fromEntries(ids.map(id=>[id,{id,cfg:{h:46},holder:new THREE.Group(),loaded:false}]));
  const city={LM},study=createDubaiLandmarks({THREE,city}),texture=new THREE.Texture();let disposed=0;
  texture.addEventListener('dispose',()=>disposed++);study.setEnabled(true);study.apply();
  const source=new THREE.MeshStandardMaterial({map:texture,emissiveIntensity:.18});
  for(const l of Object.values(LM)){l.asset=new THREE.Mesh(new THREE.BoxGeometry(),[source,source]);l.holder.add(l.asset);l.loaded=true;}
  study.apply();assert.equal(study.stats.landmarks,6);
  for(const id of ids.slice(1)){assert.notEqual(LM[id].asset.material[0],source);assert.equal(LM[id].asset.material[0].map,texture);assert.equal(LM[id].asset.material[0].emissiveIntensity,0);}
  const styled=landmarkFinish(source,'emirates_towers'),shader={uniforms:{},vertexShader:THREE.ShaderLib.standard.vertexShader,fragmentShader:THREE.ShaderLib.standard.fragmentShader};styled.onBeforeCompile(shader,{});
  assert.ok(shader.fragmentShader.includes('roughnessFactor=mix(.86,.26,landmarkBlue'));assert.ok(shader.fragmentShader.includes('metalnessFactor=mix(.02,.48,landmarkBlue'));
  study.setEnabled(false);for(const id of ids.slice(1))assert.equal(LM[id].asset.material[0],source);
  study.dispose();styled.dispose();assert.equal(disposed,0);source.dispose();texture.dispose();
  for(const l of Object.values(LM))l.asset.geometry.dispose();
});

test('late landmark-layer materials join the reflection probe without losing their finish',()=>{
  const root=new THREE.Group(),landmarkGroup=new THREE.Group(),city={w:{root},landmarkGroup,LM:{tower:{loaded:false}}};
  const probe=createCityReflections({renderer:{},scene:new THREE.Scene(),city});
  const original=new THREE.MeshStandardMaterial(),finish=landmarkFinish(original,'emirates_towers'),compile=finish.onBeforeCompile;
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(),finish);landmarkGroup.add(mesh);
  probe.setEnabled(true);probe.captureIfNeeded(); // Assets still loading: register, without GPU capture.
  const shader={uniforms:{},vertexShader:THREE.ShaderLib.standard.vertexShader,fragmentShader:THREE.ShaderLib.standard.fragmentShader};finish.onBeforeCompile(shader,{});
  assert.ok(shader.fragmentShader.includes('landmarkBlue'));assert.ok(shader.fragmentShader.includes('cityProjectedReflection'));
  probe.dispose();assert.equal(finish.onBeforeCompile,compile);mesh.geometry.dispose();finish.dispose();original.dispose();
});
