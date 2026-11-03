import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {CITIES,CITY_ORDER,CITY_COUNT,CITY_GRID,activeCheckinKeys,overviewFrame} from '../src/cities.js';

test('four-city roster has complete recipes, sequential labels and connected travel layout',()=>{
  assert.deepEqual(CITY_ORDER,['dubai','abudhabi','tokyo','lasvegas']);
  assert.equal(CITY_COUNT,4);
  assert.deepEqual(Object.keys(CITY_GRID),CITY_ORDER);
  for(const [i,id] of CITY_ORDER.entries()){
    const c=CITIES[id];assert.equal(c.index,i+1);assert.equal(c.total,4);
    for(const match of c.script.matchAll(/landmark\('([^']+)'\)/g))assert.ok(c.landmarks[match[1]],`${id}: missing landmark`);
    assert.ok(Object.keys(c.landmarks).length>0);
  }
  const connected=new Set(['dubai']);
  for(let i=0;i<CITY_COUNT;i++)for(const a of connected)for(const b of CITY_ORDER){
    const A=CITY_GRID[a],B=CITY_GRID[b];if(Math.hypot(A[0]-B[0],A[1]-B[1])<270)connected.add(b);
  }
  assert.equal(connected.size,4);
});

test('old saves count only valid active landmarks without erasing archived checkins',()=>{
  const keys=new Set(['dubai:burj_khalifa','tokyo:tokyo_tower','paris:eiffel','dubai:missing','unknown:x']);
  assert.deepEqual(activeCheckinKeys(keys),['dubai:burj_khalifa','tokyo:tokyo_tower']);
  assert.equal(keys.size,5);
  assert.deepEqual(activeCheckinKeys(new Set(['paris:eiffel'])),[]);
});

test('overview fits all four island envelopes on landscape and portrait screens',()=>{
  for(const aspect of [1440/900,390/844]){
    const f=overviewFrame(aspect),camera=new THREE.PerspectiveCamera(35,aspect,.5,6000);
    camera.position.fromArray(f.position);camera.lookAt(new THREE.Vector3(...f.target));camera.updateMatrixWorld(true);
    for(const [x,z] of Object.values(CITY_GRID))for(const dx of [-110,110])for(const dz of [-110,110])for(const y of [0,110]){
      const projected=new THREE.Vector3(x+dx,y,z+dz).project(camera);
      assert.ok(Math.abs(projected.x)<1&&Math.abs(projected.y)<1&&projected.z<1&&projected.z>-1,`clipped at aspect ${aspect}`);
    }
  }
});
