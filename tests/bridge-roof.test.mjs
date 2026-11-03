import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createBridgeRefinement} from '../src/bridge-refinement.js';
import {hotelRoofEdges} from '../src/hotel-roof.js';
import {hotelSurface} from '../src/hotel-refinement.js';
import {landmarkFinish} from '../src/landmark-finish.js';

test('bridge replacement keeps deck elevation and centre passage open, and restores animated source parts',()=>{
 for(const crossing of [false,true]){
  const group=new THREE.Group(),material=new THREE.MeshStandardMaterial(),source=new THREE.Mesh(new THREE.BoxGeometry(18,.8,7.4),material);group.add(source);
  const top=crossing?1.5:1.33,halfWidth=crossing?3.7:2.3;
  const study=createBridgeRefinement({group,length:18,halfWidth,top,source:[source],crossing});study.setEnabled(true);group.updateWorldMatrix(true,true);
  assert.equal(source.visible,false);source.visible=true;study.apply();assert.equal(source.visible,false);
  for(let x=.25;x<17.8;x+=.5){
   const hits=new THREE.Raycaster(new THREE.Vector3(x,4,0),new THREE.Vector3(0,-1,0)).intersectObject(study.root,true);
   assert.ok(hits.length);assert.ok(Math.abs(hits[0].point.y-top)<.015,'bridge surface stays at the navigation elevation');
   assert.equal(new THREE.Raycaster(new THREE.Vector3(x,top+.4,-halfWidth+.32),new THREE.Vector3(0,0,1),0,2*halfWidth-.64).intersectObject(study.root,true).length,0,'clear centre span has no cross rail');
  }
  assert.ok(study.stats.drawCalls<=5);assert.ok(study.stats.triangles<35000);
  for(const m of study.root.children)for(const a of Object.values(m.geometry.attributes))assert.ok(a.array.every(Number.isFinite));
  let shared=0;material.addEventListener('dispose',()=>shared++);source.geometry.addEventListener('dispose',()=>shared++);
  for(let i=0;i<3;i++){study.setEnabled(false);assert.equal(source.visible,true);study.setEnabled(true);}
  study.dispose();study.dispose();assert.equal(source.visible,true);assert.equal(shared,0);assert.equal(group.children.length,1);source.geometry.dispose();material.dispose();
 }
});

test('roof outlines cancel triangle diagonals across UV splits and ignore lower terraces',()=>{
 const asset=new THREE.Group();
 for(const y of [3,5]){
  const geometry=new THREE.BoxGeometry(2,.1,1).translate(0,y-.05,0).toNonIndexed();geometry.setAttribute('hotelPosition',geometry.attributes.position.clone());asset.add(new THREE.Mesh(geometry));
 }
 const edges=hotelRoofEdges(asset);assert.equal(edges.length,4);
 assert.ok(edges.every(e=>Math.abs(e.a[1]-5)<.0001&&Math.abs(e.b[1]-5)<.0001));
 for(const e of edges)assert.ok(Math.abs(e.a[0]-e.b[0])<.001||Math.abs(e.a[2]-e.b[2])<.001,'no triangulation diagonals');
 asset.children.forEach(m=>{m.geometry.dispose();m.material.dispose();});
});

test('sail de-lighting retains atlas classification and runtime lighting without affecting the floor shader',()=>{
 const source=new THREE.MeshStandardMaterial();
 for(const floor of [false,true]){
  const m=hotelSurface(landmarkFinish(source,'burj_al_arab'),'burj_al_arab',floor);
  const s={uniforms:{},vertexShader:THREE.ShaderLib.standard.vertexShader,fragmentShader:THREE.ShaderLib.standard.fragmentShader};m.onBeforeCompile(s,{});
  assert.equal(s.fragmentShader.includes('vec3 shellAlbedo'),!floor);
  assert.ok(s.fragmentShader.includes('#include <lights_fragment_begin>'));
  assert.ok(s.fragmentShader.includes('float landmarkBlue'));
  m.dispose();
 }
 source.dispose();
});
