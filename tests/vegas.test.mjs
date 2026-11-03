import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createVegasLake,vegasJet} from '../src/vegas-lake.js';
import {createVegasSphere} from '../src/vegas-sphere.js';
import {createVegasScene} from '../src/vegas-scene.js';
import {VEGAS_LAKE,VEGAS_HOTEL,VEGAS_RESERVATIONS,vegasLakeObstacles} from '../src/vegas-layout.js';
import {CITIES} from '../src/cities.js';
const fixture=()=>({w:{root:new THREE.Group(),ctx:{rects:[],walkSurfaces:[],buildings:[],pools:{}}},LM:{}});
const contains=(r,x,z)=>Math.abs(x-r.x)<r.w/2&&Math.abs(z-r.z)<r.d/2;
test('Vegas reserves the lake and hotel before scatter and leaves sign/road outside the lake',()=>{
 assert.equal(CITIES.lasvegas.reservedPlots,VEGAS_RESERVATIONS);const p=VEGAS_LAKE,blocks=vegasLakeObstacles();
 for(let a=0;a<Math.PI*2;a+=.08)for(const r of [0,.5,.98])assert.ok(blocks.some(b=>contains(b,p.x+Math.cos(a)*p.rx*r,p.z+Math.sin(a)*p.rz*r)));
 for(const b of blocks){assert.ok(!contains(b,0,31));assert.ok(!contains(b,7,32));assert.ok(!contains(b,-23,42));assert.ok(!contains(b,-23,12));}
 assert.ok(VEGAS_HOTEL.z+VEGAS_HOTEL.d/2<p.z-p.rz);
 for(const b of [VEGAS_HOTEL,{x:p.x,z:p.z,w:p.rx*2,d:p.rz*2}])for(const x of [b.x-b.w/2,b.x+b.w/2])for(const z of [b.z-b.d/2,b.z+b.d/2])assert.ok(VEGAS_RESERVATIONS.some(r=>Math.abs(x-r.x)<=r.w/2&&Math.abs(z-r.z)<=r.d/2));
});
test('Fountain trajectory stays inside the lake and animation/toggle owns its collisions',()=>{
 const city=fixture(),original={x:80,z:0,w:1,d:1};city.w.ctx.rects.push(original);const s=createVegasLake({city});s.setEnabled(true);s.apply(3);assert.equal(city.w.ctx.walkSurfaces[0](-23,39.1),1.16);
 for(let lane=0;lane<36;lane++)for(let t=0;t<=1;t+=.05){const [x,y,z]=vegasJet(lane,t,3),p=VEGAS_LAKE;assert.ok(Math.hypot((x-p.x)/p.rx,(z-p.z)/p.rz)<1);assert.ok(y>=p.y&&y<5.1);}
 const drops=s.root.children.find(o=>o.isPoints),before=drops.geometry.attributes.position.array.slice();s.apply(4);assert.notDeepEqual(drops.geometry.attributes.position.array,before);assert.ok(drops.geometry.attributes.position.array.every(Number.isFinite));
 const jets=s.root.children.find(o=>o.isInstancedMesh);assert.equal(jets.count,432);assert.ok(jets.instanceMatrix.array.every(Number.isFinite));
 const n=city.w.ctx.rects.length;s.setEnabled(true);assert.equal(city.w.ctx.rects.length,n);s.setEnabled(false);assert.deepEqual(city.w.ctx.rects,[original]);assert.equal(city.w.ctx.walkSurfaces.length,0);s.setEnabled(true);s.dispose();s.dispose();assert.deepEqual(city.w.ctx.rects,[original]);assert.equal(city.w.root.children.length,0);
});
test('Sphere waits for its asset and restores source ownership without changing navigation',()=>{
 const city=fixture(),s=createVegasSphere({city});s.setEnabled(true);s.apply(3);assert.equal(s.stats.vegasSphere,0);
 const material=new THREE.MeshStandardMaterial(),geometry=new THREE.BoxGeometry(),asset=new THREE.Mesh(geometry,material),holder=new THREE.Group();holder.add(asset);city.LM.sphere={asset,holder,rXZ:8,size:[14,14,14]};const size=city.LM.sphere.size;let released=0;material.addEventListener('dispose',()=>released++);geometry.addEventListener('dispose',()=>released++);
 s.apply(4);assert.equal(asset.visible,false);assert.equal(s.stats.vegasSphere,1);assert.equal(city.LM.sphere.size,size);assert.equal(city.LM.sphere.rXZ,8);
 const root=holder.children.find(o=>o!==asset),box=new THREE.Box3().setFromObject(root);assert.ok(box.max.y<=14&&box.max.x<=7.21&&box.min.y>=-.001);
 const shell=root.children.find(o=>o.material.isShaderMaterial);assert.equal(shell.material.uniforms.showTime.value,4);s.apply(9);assert.equal(shell.material.uniforms.showTime.value,9);
 s.setEnabled(false);assert.equal(asset.visible,true);s.setEnabled(true);s.dispose();s.dispose();assert.equal(holder.children.length,1);assert.equal(released,0);geometry.dispose();material.dispose();
});
test('Vegas hotel and source instance/material swaps restore after repeated toggles',()=>{
 const city=fixture(),ctx=city.w.ctx,im=new THREE.InstancedMesh(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial(),1),initial=new THREE.Matrix4().makeTranslation(5,3,8);im.setMatrixAt(0,initial);
 ctx.pools.tower={m:im,hide(i){im.setMatrixAt(i,new THREE.Matrix4().makeScale(0,0,0));},set(i,m){im.setMatrixAt(i,m);},flush(){}};
 ctx.buildings=[{x:5,z:8,w:3,d:4,h:9,base:1,indices:{body:0}}];const sourceMat=new THREE.MeshStandardMaterial(),asset=new THREE.Mesh(new THREE.BoxGeometry(),sourceMat);city.LM.lvsign={asset};
 const s=createVegasScene({city});s.setEnabled(true);s.apply();assert.equal(s.stats.vegasBuildings,2);assert.notEqual(asset.material,sourceMat);const matrix=new THREE.Matrix4();im.getMatrixAt(0,matrix);assert.equal(matrix.elements[0],0);
 const n=ctx.rects.length;s.setEnabled(true);assert.equal(ctx.rects.length,n);s.setEnabled(false);im.getMatrixAt(0,matrix);assert.deepEqual(matrix,initial);assert.equal(asset.material,sourceMat);assert.equal(ctx.rects.length,0);s.setEnabled(true);s.apply();s.dispose();assert.equal(asset.material,sourceMat);assert.equal(ctx.rects.length,0);assert.equal(city.w.root.children.length,0);im.geometry.dispose();im.material.dispose();im.dispose();asset.geometry.dispose();sourceMat.dispose();
});
