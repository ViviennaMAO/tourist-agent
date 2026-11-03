import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createAbuDhabiLandmarks,refineLandmarkGeometry,domeGeometry} from '../src/abudhabi-landmarks.js';

test('Landmark surgery preserves unrelated triangles and source attributes',()=>{
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([0,8,-6, .1,8,-6, 0,8.1,-6, 20,0,20,21,0,20,20,1,20],3));g.setIndex([0,1,2,3,4,5]);g.computeVertexNormals();
 const original=Array.from(g.index.array),next=refineLandmarkGeometry(g,new THREE.Matrix4(),'grand_mosque');assert.deepEqual(Array.from(next.attributes.position.array),[20,0,20,21,0,20,20,1,20]);assert.deepEqual(Array.from(g.index.array),original);assert.equal(next.attributes.surfacePosition.count,3);assert.notEqual(next.attributes.position,g.attributes.position);
 next.dispose();g.dispose();
});
test('Dome geometry has finite normals and stays within its designed envelope',()=>{
 for(const onion of [true,false]){const g=domeGeometry(3,4,onion);g.computeBoundingBox();assert.ok(g.boundingBox.min.y>-.001);assert.ok(g.boundingBox.max.y<4.01);assert.ok(g.boundingBox.max.x<3.04);for(const a of Object.values(g.attributes))assert.ok(a.array.every(Number.isFinite));g.dispose();}
});
test('Delayed landmark refinement toggles and disposes without releasing source assets',()=>{
 const city={LM:{}},study=createAbuDhabiLandmarks({city});study.setEnabled(true);study.apply();assert.equal(study.stats.landmarks,0);
 const geo=new THREE.BoxGeometry(),mat=new THREE.MeshStandardMaterial(),holder=new THREE.Group(),asset=new THREE.Group(),mesh=new THREE.Mesh(geo,mat);asset.add(mesh);holder.add(asset);city.LM.grand_mosque={holder,asset,loaded:true};
 let releases=0;geo.addEventListener('dispose',()=>releases++);mat.addEventListener('dispose',()=>releases++);
 study.apply();assert.equal(study.stats.landmarks,1);assert.notEqual(mesh.geometry,geo);const refined=mesh.geometry;study.apply();assert.equal(study.stats.landmarks,1);assert.ok(study.stats.triangles<160000);
 study.setEnabled(false);assert.equal(mesh.geometry,geo);study.setEnabled(true);assert.equal(mesh.geometry,refined);
 study.dispose();study.dispose();assert.equal(mesh.geometry,geo);assert.equal(holder.children.length,1);assert.equal(releases,0);geo.dispose();mat.dispose();
});

test('Palace interior resources and source geometry restore across toggles',()=>{
 const geo=new THREE.BoxGeometry(14,9,17),mat=new THREE.MeshStandardMaterial(),holder=new THREE.Group(),asset=new THREE.Group(),mesh=new THREE.Mesh(geo,mat);asset.add(mesh);holder.add(asset);
 const city={LM:{emirates_palace:{holder,asset,loaded:true}}},study=createAbuDhabiLandmarks({city});let disposed=0;geo.addEventListener('dispose',()=>disposed++);mat.addEventListener('dispose',()=>disposed++);
 study.setEnabled(true);study.apply();assert.equal(study.stats.landmarks,1);assert.ok(study.stats.drawCalls<20);
 const root=holder.children.find(c=>c!==asset);assert.ok(root.children.some(m=>m.material.transparent));for(const m of root.children)assert.ok(m.geometry.attributes.position.array.every(Number.isFinite));
 study.setEnabled(false);assert.equal(mesh.geometry,geo);assert.equal(root.visible,false);study.setEnabled(true);assert.equal(root.visible,true);
 study.dispose();assert.equal(holder.children.length,1);assert.equal(mesh.geometry,geo);assert.equal(disposed,0);geo.dispose();mat.dispose();
});
