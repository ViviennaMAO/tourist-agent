import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {prayerArchGeometry,PRAYER_HALL_CUTS} from '../src/mosque-prayer-hall.js';
import {refineLandmarkGeometry,createAbuDhabiLandmarks} from '../src/abudhabi-landmarks.js';

test('Prayer hall door profiles have open sightlines and solid side jambs',()=>{
 for(const [half,top,r,h,depth] of [[.9,3.832,.64,2.78,1.024],[.627,3.832,.35,1.91,1.024],[2.2,3.68,1.16,3.35,.214]]){
  const g=prayerArchGeometry(half,top,r,h,depth),m=new THREE.MeshBasicMaterial({side:THREE.DoubleSide}),mesh=new THREE.Mesh(g,m);mesh.updateMatrixWorld();
  for(const a of Object.values(g.attributes))assert.ok(a.array.every(Number.isFinite));
  for(const y of [.2,h*.5,h*.9])assert.equal(new THREE.Raycaster(new THREE.Vector3(0,y,3),new THREE.Vector3(0,0,-1)).intersectObject(mesh).length,0);
  assert.ok(new THREE.Raycaster(new THREE.Vector3((half+r)/2,.5,3),new THREE.Vector3(0,0,-1)).intersectObject(mesh).length>0);
  g.dispose();m.dispose();
 }
});
test('Prayer hall source cuts remove opaque doors, retaining roof and exterior side walls',()=>{
 const points=[];
 for(const c of PRAYER_HALL_CUTS){const [x,y,z]=c.min.map((v,i)=>(v+c.max[i])/2);points.push(x,y,z,x+.02,y,z,x,y+.02,z);}
 const retained=[0,4.4,0,.02,4.4,0,0,4.42,0, 8,2,-6,8,2.02,-6,8,2,-6.02];points.push(...retained);
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(points,3));g.computeVertexNormals();const next=refineLandmarkGeometry(g,new THREE.Matrix4(),'grand_mosque');
 assert.deepEqual(Array.from(next.attributes.position.array),Array.from(new Float32Array(retained)));assert.equal(g.attributes.position.count,12);next.dispose();g.dispose();
});
test('Prayer hall retains bounded geometry, local light toggling and source ownership',()=>{
 const holder=new THREE.Group(),asset=new THREE.Group(),g=new THREE.BoxGeometry(),m=new THREE.MeshStandardMaterial();asset.add(new THREE.Mesh(g,m));holder.add(asset);
 const s=createAbuDhabiLandmarks({city:{LM:{grand_mosque:{holder,asset,loaded:true}}}});s.setEnabled(true);s.apply();
 const root=holder.children.find(o=>o!==asset),lights=root.children.filter(o=>o.name==='Mosque prayer hall fill');assert.equal(lights.length,2);
 for(const l of lights){assert.equal(l.castShadow,false);assert.ok(l.distance<=7);assert.ok(l.position.z< -4&&l.position.z> -8);}
 assert.ok(s.stats.triangles<160000);assert.ok(s.stats.drawCalls<=13);
 s.setEnabled(false);assert.equal(root.visible,false);s.setEnabled(true);assert.equal(root.visible,true);s.dispose();assert.deepEqual(holder.children,[asset]);assert.equal(asset.children[0].geometry,g);g.dispose();m.dispose();
});
