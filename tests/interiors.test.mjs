import test from 'node:test';
import assert from 'node:assert/strict';
import {CITIES,CITY_ORDER} from '../src/cities.js';
import {INTERIORS,activeInteriorVisits} from '../src/interior-catalog.js';
import {createInteriorScene} from '../src/interior-scene.js';

test('Two active cities each have five distinct enterable landmark spaces',()=>{
 assert.equal(INTERIORS.length,10);assert.equal(new Set(INTERIORS.map(r=>r.theme)).size,10);
 for(const city of CITY_ORDER){const rooms=INTERIORS.filter(r=>r.city===city);assert.equal(rooms.length,5);for(const r of rooms){assert.ok(CITIES[city].landmarks[r.landmark]);assert.equal(r.details.length,3);}}
 assert.ok(INTERIORS.every(r=>CITY_ORDER.includes(r.city)));
});
test('Interior progress ignores removed cities and unknown spaces without mutating saved data',()=>{
 const saved=['tokyo:tokyo_tower','abudhabi:grand_mosque','abudhabi:grand_mosque','dubai:missing'];assert.deepEqual(activeInteriorVisits(saved),['abudhabi:grand_mosque']);assert.equal(saved.length,4);
});
test('All ten interior scenes are finite, bounded and dispose their own geometry once',()=>{
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

test('Detailed interiors restore cutaway roofs and release reflecting water targets',()=>{
 for(const spec of INTERIORS){const room=createInteriorScene(spec),ceilings=room.root.children.filter(o=>o.name==='Interior ceiling and upper enclosure');
  assert.ok(room.stats.crafted);assert.ok(ceilings.length>0);assert.ok(ceilings.every(o=>!o.visible));
  room.setInteriorView(true);assert.ok(ceilings.every(o=>o.visible));room.setInteriorView(false);assert.ok(ceilings.every(o=>!o.visible));
  const pools=room.root.children.filter(o=>o.isReflector);let disposed=0;
  for(const p of pools){assert.equal(p.userData.skipContact,true);assert.equal(p.getRenderTarget().width,512);p.getRenderTarget().addEventListener('dispose',()=>disposed++);}
  room.update(1);for(const p of pools)assert.equal(p.material.uniforms.time.value,1);
  room.dispose();room.dispose();assert.equal(disposed,pools.length);
 }
});

test('Exhibit label atlas rows stay separated and rotated side labels face into the room',async()=>{
 const THREE=await import('three');const {buildInteriorLabels}=await import('../src/interior-themes.js');const parts=[];
 const m=new THREE.MeshStandardMaterial();const matrix=new THREE.Matrix4().makeRotationY(Math.PI/2).setPosition(-8.3,0,-2);
 buildInteriorLabels([{text:'SIDE',x:0,y:3,z:.1,w:2,h:.3,a:0,matrix},{text:'FRONT',x:0,y:1,z:2,w:2,h:.3,a:0}],g=>parts.push(g),()=>m);
 for(let i=0;i<parts.length;i++){const uv=parts[i].attributes.uv;for(let j=0;j<uv.count;j++){assert.ok(uv.getY(j)>=1-(i+1)/2&&uv.getY(j)<=1-i/2);}}
 const side=parts[0];side.computeBoundingBox();assert.ok(Math.abs(side.boundingBox.min.x+8.2)<.0001);assert.ok(side.attributes.normal.getX(0)>.99);parts.forEach(g=>g.dispose());m.dispose();
});

test('Room changes dispose their exhibit atlas texture exactly once',()=>{
 const previous=globalThis.document;
 const context={fillRect(){},save(){},translate(){},scale(){},restore(){},fillText(){},measureText(){return {width:300};}};
 globalThis.document={createElement:()=>({getContext:()=>context})};
 try{for(const spec of INTERIORS){const room=createInteriorScene(spec),maps=new Set();room.root.traverse(o=>{if(o.material?.map)maps.add(o.material.map);});assert.equal(maps.size,1,spec.id);let disposed=0;maps.forEach(m=>m.addEventListener('dispose',()=>disposed++));room.dispose();room.dispose();assert.equal(disposed,1,spec.id);}}
 finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
});
