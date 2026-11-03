import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createDubaiAttraction} from '../src/dubai-attractions.js';
import {pointInPolygon} from '../src/shore-profile.js';
import {CITIES} from '../src/cities.js';

test('wheel and cruise geometry are finite, bounded and dispose shared resources once',()=>{
 for(const kind of ['wheel','cruise']){
  const root=createDubaiAttraction(kind),materials=new Set(),geometries=new Set();
  root.traverse(o=>{if(!o.isMesh)return;materials.add(o.material);geometries.add(o.geometry);for(const a of Object.values(o.geometry.attributes))assert.ok(a.array.every(Number.isFinite));});
  assert.ok(root.userData.stats.triangles<65000);assert.ok(root.userData.stats.drawCalls<40);
  const bounds=new THREE.Box3().setFromObject(root);assert.ok(bounds.min.y>-.5&&bounds.max.y<33);
  let g=0,m=0;geometries.forEach(x=>x.addEventListener('dispose',()=>g++));materials.forEach(x=>x.addEventListener('dispose',()=>m++));
  root.userData.dispose();root.userData.dispose();assert.equal(g,geometries.size);assert.equal(m,materials.size);
 }
});

test('observation cabins move on the wheel and remain upright at all phases',()=>{
 const root=createDubaiAttraction('wheel'),cabins=root.userData.cabins;assert.equal(cabins.length,24);
 let first;
 for(const t of [0,50,180,524]){
  root.userData.animate(t);root.updateMatrixWorld(true);
  for(const g of cabins){const q=g.getWorldQuaternion(new THREE.Quaternion());assert.ok(new THREE.Vector3(0,1,0).applyQuaternion(q).distanceTo(new THREE.Vector3(0,1,0))<1e-6);}
  root.userData.rotor.traverse(mesh=>{if(!mesh.isInstancedMesh)return;for(let i=0;i<mesh.count;i++){
    const matrix=new THREE.Matrix4();mesh.getMatrixAt(i,matrix);matrix.premultiply(mesh.matrixWorld);
    assert.ok(new THREE.Vector3(0,1,0).transformDirection(matrix).distanceTo(new THREE.Vector3(0,1,0))<1e-6);
    assert.ok(new THREE.Vector3().setFromMatrixPosition(matrix).distanceTo(cabins[i].getWorldPosition(new THREE.Vector3()))<1e-5);
  }});
  const p=cabins[0].getWorldPosition(new THREE.Vector3());if(t===0)first=p;else if(t===50)assert.ok(p.distanceTo(first)>5);
 }
 root.userData.dispose();
});

test('both attractions have usable shore arrivals outside their collision footprints',()=>{
 const city=CITIES.dubai;
 for(const id of ['waterfront_wheel','cruise_terminal']){
  const c=city.landmarks[id],[x,z]=c.arrival;
  const q=c.walkSurface;assert.ok(q.circle?Math.hypot(x-q.circle[0],z-q.circle[1])<q.circle[2]:pointInPolygon(q.polygon,x,z));assert.ok(q.height>=1.08&&q.height<=1.2);
  assert.ok(city.script.includes("landmark('"+id+"')"));

  for(const q of c.walkObstacles)assert.ok(Math.abs(x-c.pos[0]-q.x)>=q.w/2+.45||Math.abs(z-c.pos[1]-q.z)>=q.d/2+.45);
 }
});
