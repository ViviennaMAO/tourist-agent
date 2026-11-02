import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {shoreBulge,shoreSlope,promenadePolygon,pointInPolygon} from '../src/shore-profile.js';
import {pointedSpandrel} from '../src/pointed-arch.js';

test('curved promenade joins the old shore smoothly and keeps its navigable edge inside the stone cap',()=>{
  const points=promenadePolygon();
  for(const x of [-33,-7]){assert.ok(Math.abs(shoreBulge(x))<1e-8);assert.ok(Math.abs(shoreSlope(x))<.001);}
  for(let x=-32.9;x<-7.1;x+=.1){
    assert.ok(pointInPolygon(points,x,-5.8),'continuous access from the old shore');
    assert.ok(pointInPolygon(points,x,-4.9+shoreBulge(x)),'new promenade is walkable');
    assert.ok(!pointInPolygon(points,x,-4.5+shoreBulge(x)),'water beyond the cap is excluded');
  }
});

test('spandrel stars are actual holes through both faces and the arch remains open',()=>{
  const shape=pointedSpandrel(.85,.952,1.5,2.65);
  assert.ok(shape.holes.length>5);
  const geometry=new THREE.ExtrudeGeometry(shape,{depth:.38,curveSegments:1,bevelEnabled:false});
  const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide}),mesh=new THREE.Mesh(geometry,material);
  mesh.updateMatrixWorld(true);
  const hits=(x,y)=>new THREE.Raycaster(new THREE.Vector3(x,y,1),new THREE.Vector3(0,0,-1)).intersectObject(mesh);
  assert.equal(hits(0,2).length,0,'pointed opening stays clear');
  assert.ok(hits(0,2.63).length>0,'solid top border remains');
  for(const hole of shape.holes){
    const p=hole.getPoints().slice(0,-1),center=p.reduce((a,b)=>a.add(b),new THREE.Vector2()).divideScalar(p.length);
    assert.equal(hits(center.x,center.y).length,0,'stars cannot be filled by triangulation');
  }
  geometry.dispose();material.dispose();
});
