import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createFountainSpray,fountainPoint} from '../src/fountain-spray.js';

test('fountain jets land separately inside the basin and droplets freeze deterministically',()=>{
  const landings=[];
  for(let lane=0;lane<7;lane++){
    const start=fountainPoint(lane,0),end=fountainPoint(lane,1);
    assert.ok(Math.abs(Math.hypot(start[0],start[2])-.22)<1e-6);
    assert.ok(Math.abs(Math.hypot(end[0],end[2])-1.3)<1e-6);
    assert.equal(start[1],end[1]);landings.push(end);
  }
  for(let i=0;i<7;i++)for(let j=i+1;j<7;j++)assert.ok(new THREE.Vector3(...landings[i]).distanceTo(new THREE.Vector3(...landings[j]))>.9);
  const spray=createFountainSpray(),a=spray.mesh.geometry.attributes.position;
  for(const time of [0,1,180,100000]){
    spray.update(time);
    const copy=a.array.slice(),version=a.version;
    spray.update(time);assert.deepEqual(a.array,copy);assert.equal(a.version,version);
    for(let i=0;i<a.count;i++){
      const point=new THREE.Vector3().fromBufferAttribute(a,i);
      assert.ok([point.x,point.y,point.z].every(Number.isFinite));
      assert.ok(point.y>0&&point.y<1.15);assert.ok(Math.hypot(point.x,point.z)<1.37);
      assert.ok(spray.mesh.geometry.boundingSphere.containsPoint(point));
    }
  }
  const before=a.array.slice();spray.update(100000.1);assert.notDeepEqual(a.array,before);
  assert.equal(spray.mesh.material.depthWrite,false);assert.equal(spray.mesh.userData.excludeReflection,true);
  spray.mesh.geometry.dispose();spray.mesh.material.dispose();
});
