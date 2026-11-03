import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {sideBayGeometry,MOSQUE_SIDE_BAYS} from '../src/mosque-vestibule.js';
import {refineLandmarkGeometry,createAbuDhabiLandmarks} from '../src/abudhabi-landmarks.js';

test('Both side passages have aligned open front/rear arches and solid jambs',()=>{
 for(const x of MOSQUE_SIDE_BAYS){
  const root=new THREE.Group(),mat=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
  for(const z of [6.39,7.438]){const g=sideBayGeometry(x,z);for(const a of Object.values(g.attributes))assert.ok(a.array.every(Number.isFinite));root.add(new THREE.Mesh(g,mat));}
  root.updateMatrixWorld(true);const hit=(px,y)=>new THREE.Raycaster(new THREE.Vector3(px,y,9),new THREE.Vector3(0,0,-1)).intersectObject(root,true);
  for(const y of [.2,.8,1.4,1.6])assert.equal(hit(x,y).length,0);
  for(const sign of [-1,1])assert.ok(hit(x+sign*.48,1).length>=2);
  root.children.forEach(m=>m.geometry.dispose());mat.dispose();
 }
});

test('Side/rear cuts preserve source buffers and the upper stone wall',()=>{
 const vertices=[];for(const [x,y,z] of [[1.5,.3,7.5],[-1.5,.3,6.5],[0,.3,5.8],[0,2.8,7]])vertices.push(x,y,z,x+.025,y,z,x,y+.025,z);
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.computeVertexNormals();const original=Array.from(g.attributes.position.array),result=refineLandmarkGeometry(g,new THREE.Matrix4(),'grand_mosque');
 assert.deepEqual(Array.from(result.attributes.position.array),original.slice(-9));assert.deepEqual(Array.from(g.attributes.position.array),original);g.dispose();result.dispose();
});

test('Vestibule light and surfaces hide with the refinement and are detached on disposal',()=>{
 const holder=new THREE.Group(),asset=new THREE.Group(),geometry=new THREE.BoxGeometry(),material=new THREE.MeshStandardMaterial();asset.add(new THREE.Mesh(geometry,material));holder.add(asset);
 const s=createAbuDhabiLandmarks({city:{LM:{grand_mosque:{holder,asset,loaded:true}}}});s.setEnabled(true);s.apply();
 const root=holder.children.find(c=>c!==asset),lights=root.children.filter(c=>c.isPointLight);assert.equal(lights.length,1);assert.equal(lights[0].castShadow,false);assert.ok(lights[0].distance<4);assert.ok(s.stats.triangles<160000);
 const floor=root.children.find(m=>m.isMesh&&m.material.color.getHexString()==='dedbd1');assert.ok(floor);assert.equal(floor.castShadow,false);
 s.setEnabled(false);assert.equal(root.visible,false);s.setEnabled(true);assert.equal(root.visible,true);s.dispose();s.dispose();assert.deepEqual(holder.children,[asset]);assert.equal(asset.children[0].geometry,geometry);geometry.dispose();material.dispose();
});
