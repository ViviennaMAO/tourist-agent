import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createDubaiVehicles,spaceDubaiTraffic} from '../src/dubai-vehicles.js';

test('Dubai traffic is spaced in two directions with stable speed, without altering route geometry',()=>{
  const loop={tot:204,segs:[{a:[-34,-16],b:[34,-16],len:68,s0:0},{a:[34,-16],b:[34,-50],len:34,s0:68},
    {a:[34,-50],b:[-34,-50],len:68,s0:102},{a:[-34,-50],b:[-34,-16],len:34,s0:170}]};
  const before=JSON.stringify(loop),cars=Array.from({length:18},(_,i)=>({i,off:i,v:i+3,loop}));
  spaceDubaiTraffic(cars,loop);assert.equal(JSON.stringify(loop),before);
  for(const parity of [0,1]) {
    const lane=cars.filter((_,i)=>i%2===parity);
    for(let i=0;i<lane.length;i++)assert.ok(((lane[(i+1)%lane.length].off-lane[i].off+204)%204)>20);
    assert.ok(lane.every(c=>c.v===6));
  }
  assert.deepEqual(cars[1].loop.segs[0].a,loop.segs.at(-1).b);
  assert.deepEqual(cars[1].loop.segs[0].b,loop.segs.at(-1).a);
});

function fixture() {
  const pools={};
  for(const name of ['carBody','carTop']) {
    const m=new THREE.InstancedMesh(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial(),3);
    pools[name]={m,set:(i,a)=>m.setMatrixAt(i,a),hide:i=>m.setMatrixAt(i,new THREE.Matrix4().makeScale(0,0,0)),flush(){}};
  }
  const vehicles=[{i:0,distance:0},{i:2,distance:10}];
  return {w:{root:new THREE.Group(),ctx:{pools,vehicles}}};
}
const read=(m,i)=>{const a=new THREE.Matrix4();m.getMatrixAt(i,a);return a;};

test('sedan fleet has bounded lane clearance, true wheel arches, finite merged geometry',()=>{
  const city=fixture(),s=createDubaiVehicles({THREE,city});
  assert.equal(s.stats.vehicles,2);assert.equal(s.stats.drawCalls,8);
  assert.ok(s.stats.triangles/2<8500);
  for(const mesh of s.root.children) {
    for(const a of Object.values(mesh.geometry.attributes))assert.ok(a.array.every(Number.isFinite));
    assert.ok(mesh.geometry.index.array.every(i=>i<mesh.geometry.attributes.position.count));
    mesh.geometry.computeBoundingBox();const b=mesh.geometry.boundingBox;
    assert.ok(b.min.x>=-.761&&b.max.x<=.761,'fits one road lane including mirrors');
  }
  const paint=s.root.getObjectByName('satin automotive paint');
  const single=new THREE.Mesh(paint.geometry,paint.material);single.updateMatrixWorld();
  const ray=z=>new THREE.Raycaster(new THREE.Vector3(2,.13,z),new THREE.Vector3(-1,0,0)).intersectObject(single);
  assert.equal(ray(.98).length,0,'front arch must be a cutout, not a painted wheel on the body');
  assert.equal(ray(-.98).length,0);assert.ok(ray(0).length>0);
  s.dispose();
});

test('wheels stay on the road, rotate with travelled distance, freeze and restore source poses',()=>{
  const city=fixture(),s=createDubaiVehicles({THREE,city}),{pools,vehicles}=city.w.ctx;
  const pose=new THREE.Matrix4().makeTranslation(0,1.66,-16);
  const unselected=new THREE.Matrix4().makeTranslation(30,1.66,-20);
  const upload=()=>{for(const pool of Object.values(pools)){pool.set(0,pose);pool.set(2,pose);pool.set(1,unselected);}};
  upload();const stored=read(pools.carBody.m,0),untouched=read(pools.carBody.m,1);
  s.apply();const wheels=s.root.getObjectByName('wheel spokes'),tire=s.root.getObjectByName('tire rubber');
  const first=read(wheels,0);tire.geometry.computeBoundingBox();
  const ground=tire.geometry.boundingBox.clone().applyMatrix4(read(tire,0)).min.y;
  assert.ok(Math.abs(ground-1.38)<1e-5);
  assert.equal(read(pools.carBody.m,0).determinant(),0);
  assert.deepEqual(read(pools.carBody.m,1).elements,untouched.elements);
  vehicles[0].distance=.27*Math.PI/3;upload();s.apply();const rotated=read(wheels,0);
  assert.notDeepEqual(rotated.elements,first.elements);
  assert.deepEqual(new THREE.Vector3().setFromMatrixPosition(rotated).toArray(),new THREE.Vector3().setFromMatrixPosition(first).toArray());
  upload();s.apply();assert.deepEqual(read(wheels,0).elements,rotated.elements,'same time freezes rim pose');
  s.setEnabled(false);assert.deepEqual(read(pools.carBody.m,0).elements,stored.elements);
  s.setEnabled(true);upload();s.apply();s.dispose();assert.deepEqual(read(pools.carTop.m,2).elements,stored.elements);
});

test('vehicle disposal releases only owned resources exactly once',()=>{
  const city=fixture(),s=createDubaiVehicles({THREE,city});let geometries=0,materials=0,source=0;
  for(const mesh of s.root.children){mesh.geometry.addEventListener('dispose',()=>geometries++);mesh.material.addEventListener('dispose',()=>materials++);}
  city.w.ctx.pools.carBody.m.material.addEventListener('dispose',()=>source++);
  s.dispose();s.dispose();assert.equal(geometries,8);assert.equal(materials,8);assert.equal(source,0);
  assert.equal(city.w.root.children.length,0);
});
