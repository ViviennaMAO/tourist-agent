import test from 'node:test';
import assert from 'node:assert/strict';
import {CITIES,CITY_ORDER} from '../src/cities.js';
import {INTERIORS,activeInteriorVisits} from '../src/interior-catalog.js';
import {createInteriorScene} from '../src/interior-scene.js';

test('Three active cities each have five distinct enterable landmark spaces',()=>{
 assert.equal(INTERIORS.length,15);assert.equal(new Set(INTERIORS.map(r=>r.theme)).size,15);
 for(const city of CITY_ORDER){const rooms=INTERIORS.filter(r=>r.city===city);assert.equal(rooms.length,5);for(const r of rooms){assert.ok(CITIES[city].landmarks[r.landmark]);assert.equal(r.details.length,3);}}
 assert.ok(INTERIORS.every(r=>CITY_ORDER.includes(r.city)));
});
test('Interior progress ignores removed cities and unknown spaces without mutating saved data',()=>{
 const saved=['tokyo:tokyo_tower','abudhabi:grand_mosque','abudhabi:grand_mosque','dubai:missing'];assert.deepEqual(activeInteriorVisits(saved),['abudhabi:grand_mosque']);assert.equal(saved.length,4);
});
test('All fifteen interior scenes are finite, bounded and dispose their own geometry once',()=>{
 for(const r of INTERIORS){const study=createInteriorScene(r);assert.equal(study.points.length,3);assert.ok(study.stats.triangles<100000,r.id);assert.ok(study.stats.drawCalls<40,r.id);let disposals=0,count=0;
  study.root.traverse(o=>{if(!o.isMesh)return;count++;for(const a of Object.values(o.geometry.attributes))assert.ok(a.array.every(Number.isFinite),r.id);o.geometry.computeBoundingBox();const b=o.geometry.boundingBox;assert.ok(b.min.x>=-20&&b.max.x<=20&&b.min.z>=-20&&b.max.z<=20&&b.max.y<20,r.id);o.geometry.addEventListener('dispose',()=>disposals++);});
  study.dispose();study.dispose();assert.equal(disposals,count,r.id);assert.equal(study.scene.children.length,0);
 }
});

test('Interior overview fits every room in landscape and narrow mobile frames',async()=>{
 const THREE=await import('three');const {interiorOverviewShot}=await import('../src/interior-scene.js');
 for(const spec of INTERIORS){const room=createInteriorScene(spec),bounds=new THREE.Box3().setFromObject(room.root);
  for(const aspect of [1.7,.62]){const shot=interiorOverviewShot(room,aspect),camera=new THREE.PerspectiveCamera(48,aspect,.08,120);camera.position.fromArray(shot.p);camera.lookAt(new THREE.Vector3().fromArray(shot.q));camera.updateMatrixWorld();
   for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){const v=new THREE.Vector3(x,y,z).project(camera);assert.ok(Math.abs(v.x)<1&&Math.abs(v.y)<1&&v.z<1,`${spec.id} aspect ${aspect}`);}
  }room.dispose();
 }
});
