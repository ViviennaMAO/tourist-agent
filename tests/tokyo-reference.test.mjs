import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {planTokyoInfill,createTokyoInfillReservations,planTokyoRiverTrees} from '../src/tokyo-layout.js';
import {createTokyoSkytree,skytreeRadius} from '../src/tokyo-skytree.js';
import {createTokyoTrees} from '../src/tokyo-trees.js';

const overlap=(a,b,gap=0)=>Math.abs(a.x-b.x)<(a.w+b.w)/2+gap&&Math.abs(a.z-b.z)<(a.d+b.d)/2+gap;
test('Tokyo infill is deterministic, respects occupied plots, and owns only its added collisions',()=>{
 const source={x:-55,z:-68,w:8,d:9};const ctx={rects:[source],groundY:()=>1.25,free(x,z,w,d){return !this.rects.some(q=>overlap({x,z,w,d},q,1));}};
 const plots=planTokyoInfill(ctx);assert.ok(plots.length>10);assert.deepEqual(plots,planTokyoInfill(ctx));
 for(const p of plots){assert.ok(!overlap(p,source,1));assert.ok(p.x-p.w/2>-68&&p.x+p.w/2<68);assert.ok(p.z-p.d/2>-74&&p.z+p.d/2<40);for(const q of plots)if(p!==q)assert.ok(!overlap(p,q,1.3));}
 const s=createTokyoInfillReservations(ctx,plots);s.setEnabled(true);s.setEnabled(true);assert.equal(ctx.rects.length,plots.length+1);s.setEnabled(false);assert.deepEqual(ctx.rects,[source]);s.setEnabled(true);s.dispose();assert.deepEqual(ctx.rects,[source]);
});

test('River cherry trunks stay outside the canal and avoid planned buildings',()=>{
 const ctx={free:()=>true,groundY:()=>1.25},building={x:-20,z:20,w:10,d:8};
 const trees=planTokyoRiverTrees(ctx,[building]);assert.ok(trees.length>=10);
 const dx=-35.5,dz=72.5,L=Math.hypot(dx,dz);
 for(const t of trees){const dist=Math.abs((t.x+6)*dz-(t.z+22)*dx)/L;assert.ok(dist>5.8);assert.ok(!overlap({x:t.x,z:t.z,w:2,d:2},building));assert.ok(t.lean.every(Number.isFinite));}
});

test('Skytree replaces delayed source visibility with a slender 42-unit lattice and restores it',()=>{
 const city={LM:{}},study=createTokyoSkytree({city});study.setEnabled(true);study.apply();assert.equal(study.stats.tokyoSkytree,0);
 const geo=new THREE.BoxGeometry(9,42,9),mat=new THREE.MeshBasicMaterial(),asset=new THREE.Mesh(geo,mat),holder=new THREE.Group();holder.add(asset);
 const L={asset,holder,cfg:{h:42},rXZ:5,size:[10,42,10]};city.LM.skytree=L;study.apply();assert.equal(asset.visible,false);
 const root=holder.children.find(c=>c!==asset),bounds=new THREE.Box3().setFromObject(root),size=bounds.getSize(new THREE.Vector3());
 assert.ok(Math.abs(bounds.max.y-42)<.01);assert.ok(size.x<6&&size.z<6);assert.equal(L.rXZ,5);assert.deepEqual(L.size,[10,42,10]);assert.ok(study.stats.triangles<80000);
 root.traverse(m=>{if(m.isMesh)for(const a of Object.values(m.geometry.attributes))assert.ok(a.array.every(Number.isFinite));});
 assert.ok(skytreeRadius(0)>skytreeRadius(12)&&skytreeRadius(12)>skytreeRadius(23));
 let disposed=0;geo.addEventListener('dispose',()=>disposed++);mat.addEventListener('dispose',()=>disposed++);
 study.setEnabled(false);assert.equal(asset.visible,true);study.setEnabled(true);study.apply();study.dispose();study.dispose();assert.equal(asset.visible,true);assert.equal(holder.children.length,1);assert.equal(disposed,0);geo.dispose();mat.dispose();
});

test('Additional river trees reserve their trunks and release owned resources',()=>{
 const source={x:4,z:4,w:1,d:1},ctx={rects:[source],trees:[],pools:{}},city={w:{ctx,root:new THREE.Group()}};
 const s=createTokyoTrees({city,extraTrees:[{x:-20,z:20,y:1.25,sc:1.2,ry:0,kind:'sakura',river:true,lean:[1,0]}]});
 assert.equal(s.stats.riverTrees,1);assert.ok(s.stats.triangles<24000);s.setEnabled(true);s.apply();s.setEnabled(true);assert.equal(ctx.rects.length,2);s.setEnabled(false);assert.deepEqual(ctx.rects,[source]);s.dispose();assert.equal(city.w.root.children.length,0);
});
