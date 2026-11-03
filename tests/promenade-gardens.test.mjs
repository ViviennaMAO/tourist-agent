import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {planPromenadeGardens,createPromenadeGardens} from '../src/promenade-gardens.js';
const context=()=>({rects:[],palms:[],islands:[{id:'mainland',outline:[[-64,-84],[64,-84],[64,-5],[-64,-5]]}],groundY:()=>1,free:()=>true});
const overlaps=(a,b,p=0)=>Math.abs(a.x-b.x)<(a.w+b.w)/2+p&&Math.abs(a.z-b.z)<(a.d+b.d)/2+p;
test('promenade gardens respect land, obstacles, ground steps and a continuous walking lane',()=>{
 const ctx=context(),all=planPromenadeGardens(ctx);assert.equal(all.length,17);
 const blocker=all[0];ctx.palms=[{x:all[1].x,z:all[1].z}];
 const beds=planPromenadeGardens(ctx,[blocker]);assert.equal(beds.length,15);
 assert.ok(beds.every(b=>!overlaps(b,blocker,.8)&&!overlaps(b,{...ctx.palms[0],w:.7,d:.7},.5)));
 for(const sign of [-1,1])for(let z=-80;z<-14;z+=.25)assert.ok(!beds.some(b=>overlaps(b,{x:sign*56,z,w:.9,d:.9})));
 for(let z=-15;z<-5;z+=.25)assert.ok(!beds.some(b=>overlaps(b,{x:0,z,w:2,d:.9})));
 ctx.free=()=>false;assert.deepEqual(planPromenadeGardens(ctx),[]);
 ctx.free=()=>true;ctx.islands=[];assert.deepEqual(planPromenadeGardens(ctx),[]);
 const stepped=context();stepped.groundY=x=>x>60?1.3:1;
 assert.ok(planPromenadeGardens(stepped).every(b=>b.x!==60));
});
test('promenade geometry stays inside collision footprints and restores shared state',()=>{
 const ctx=context(),existing={x:0,z:0,w:1,d:1};ctx.rects.push(existing);
 const city={w:{ctx,root:new THREE.Group()}},stone=new THREE.MeshStandardMaterial(),leaf=new THREE.Texture();
 let sharedDisposed=0;stone.addEventListener('dispose',()=>sharedDisposed++);leaf.addEventListener('dispose',()=>sharedDisposed++);
 const g=createPromenadeGardens({city,stoneMaterial:stone,leafTexture:leaf});
 assert.ok(g.stats.triangles<60000);assert.ok(g.stats.drawCalls<=7);
 for(const mesh of g.root.children){
  const a=mesh.geometry.attributes.position;
  for(let i=0;i<a.count;i++){
   const x=a.getX(i),z=a.getZ(i),y=a.getY(i);assert.ok([x,y,z].every(Number.isFinite));
   assert.ok(g.footprints.some(b=>Math.abs(x-b.x)<=b.w/2+.0001&&Math.abs(z-b.z)<=b.d/2+.0001),'plant tips stay inside collision footprint');
   assert.ok(y>=.9999&&y<1.8);
  }
 }
 g.root.updateMatrixWorld(true);
 const b=g.footprints[0];
 const hits=new THREE.Raycaster(new THREE.Vector3(b.x,2,b.z),new THREE.Vector3(0,-1,0)).intersectObject(g.root,true);
 assert.ok(hits.some(h=>Math.abs(h.point.y-1.085)<.0001),'soil has a visible upward face');
 for(let i=0;i<3;i++){g.setEnabled(true);g.setEnabled(true);assert.equal(ctx.rects.length,18);g.setEnabled(false);assert.deepEqual(ctx.rects,[existing]);}
 g.setEnabled(true);g.dispose();g.dispose();assert.deepEqual(ctx.rects,[existing]);assert.equal(city.w.root.children.length,0);assert.equal(sharedDisposed,0);
 stone.dispose();leaf.dispose();
});
