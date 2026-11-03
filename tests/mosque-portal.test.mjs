import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {mosquePortalGeometry} from '../src/mosque-portal.js';
import {refineLandmarkGeometry} from '../src/abudhabi-landmarks.js';

test('Refined portal keeps its doorway open and has finite, thick jambs',()=>{
 const g=mosquePortalGeometry(),material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide}),mesh=new THREE.Mesh(g,material);mesh.updateMatrixWorld(true);
 for(const a of Object.values(g.attributes))assert.ok(a.array.every(Number.isFinite));g.computeBoundingBox();assert.ok(g.boundingBox.max.z-g.boundingBox.min.z>.35);
 const hit=(x,y)=>new THREE.Raycaster(new THREE.Vector3(x,y,10),new THREE.Vector3(0,0,-1)).intersectObject(mesh).length;
 for(const y of [.1,.8,1.4,1.8])assert.equal(hit(0,y),0,`open at ${y}`);
 for(const x of [-.65,.65])assert.ok(hit(x,1.2)>0);assert.ok(hit(0,2.13)>0);g.dispose();material.dispose();
});

test('Portal replacement removes its old facets while retaining the upper facade and source buffers',()=>{
 const points=[-.6,.2,8.4,-.55,.2,8.4,-.6,.3,8.4, 0,2.5,8.5,.2,2.5,8.5,0,2.7,8.5];
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(points,3));g.computeVertexNormals();const before=Array.from(g.attributes.position.array);
 const refined=refineLandmarkGeometry(g,new THREE.Matrix4(),'grand_mosque');assert.equal(refined.attributes.position.count,3);assert.deepEqual(Array.from(refined.attributes.position.array),before.slice(9));assert.deepEqual(Array.from(g.attributes.position.array),before);g.dispose();refined.dispose();
});
