import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createAbuTowers,ETIHAD_TOWERS,etihadPoint} from '../src/abudhabi-towers.js';
import {createMosqueInlay,MOSQUE_INLAY_BOUNDS} from '../src/abudhabi-inlay.js';
import {planAbuInfill} from '../src/abudhabi-infill.js';
import {ABU_POOLS} from '../src/abudhabi-layout.js';
import {createAbuDhabiScene} from '../src/abudhabi-scene.js';

const overlap=(a,b,gap=0)=>Math.abs(a.x-b.x)<(a.w+b.w)/2+gap&&Math.abs(a.z-b.z)<(a.d+b.d)/2+gap;
test('Etihad has five distinct curved crowns and restores delayed source navigation/visibility',()=>{
 const city={LM:{}},s=createAbuTowers({city});s.setEnabled(true);s.apply();assert.equal(s.stats.etihadTowers,0);
 const geo=new THREE.BoxGeometry(),mat=new THREE.MeshStandardMaterial(),asset=new THREE.Mesh(geo,mat),holder=new THREE.Group();holder.add(asset);
 const size=[30,26,22],L={asset,holder,cfg:{h:26,r:16},rXZ:19,size};city.LM.etihad_towers=L;s.apply();assert.equal(asset.visible,false);assert.equal(s.stats.etihadTowers,5);assert.equal(L.rXZ,16);assert.equal(L.size[1],26);
 const root=holder.children.find(c=>c!==asset),box=new THREE.Box3().setFromObject(root);assert.ok(box.max.y<26.1&&box.max.y>25.8);assert.ok(s.stats.triangles<400000);
 root.traverse(m=>{if(m.isMesh)for(const a of Object.values(m.geometry.attributes))assert.ok(a.array.every(Number.isFinite));});
 assert.equal(new Set(ETIHAD_TOWERS.map(t=>t.h)).size,5);
 for(const t of ETIHAD_TOWERS)for(let i=0;i<24;i++){const p=etihadPoint(t,i*Math.PI/12,1);assert.ok(p.y<=26.01);assert.ok(Math.hypot(p.x,p.z)<15);}
 let disposed=0;geo.addEventListener('dispose',()=>disposed++);mat.addEventListener('dispose',()=>disposed++);s.setEnabled(false);assert.equal(asset.visible,true);assert.equal(L.size,size);assert.equal(L.rXZ,19);s.setEnabled(true);s.dispose();s.dispose();assert.equal(holder.children.length,1);assert.equal(disposed,0);assert.equal(L.size,size);geo.dispose();mat.dispose();
});

test('Marble inlays remain on the dry forecourt, below walking height, without new obstacles',()=>{
 const b=MOSQUE_INLAY_BOUNDS;for(const p of ABU_POOLS)assert.ok(!overlap(b,p));assert.ok(b.y<1.115);
 const obstacle={x:0,z:0,w:1,d:1},ctx={rects:[obstacle],walkSurfaces:[]},city={w:{root:new THREE.Group(),ctx}},s=createMosqueInlay({city});
 assert.equal(s.stats.marbleFlowers,14);const bounds=new THREE.Box3().setFromObject(s.root);assert.ok(bounds.max.y<1.1);assert.ok(bounds.min.z>=40-.01);assert.ok(bounds.max.z<=44.51);
 for(const m of s.root.children){assert.ok(m.material.userData.cityGlass);assert.equal(m.castShadow,false);for(const a of Object.values(m.geometry.attributes))assert.ok(a.array.every(Number.isFinite));}
 s.setEnabled(true);s.dispose();s.dispose();assert.deepEqual(ctx.rects,[obstacle]);assert.deepEqual(ctx.walkSurfaces,[]);assert.equal(city.w.root.children.length,0);
});

test('Abu infill avoids gardens and source obstacles and adds reversible building collisions',()=>{
 const garden={x:-40,z:-72,w:5,d:5},original={x:-64,z:-61,w:6,d:6};
 const ctx={rects:[original],walkSurfaces:[],pools:{},buildings:[],groundY:()=>1.25,free(x,z,w,d){return !this.rects.some(q=>overlap({x,z,w,d},q,1));}};
 const extra=planAbuInfill(ctx,[garden]);assert.ok(extra.length>0);assert.deepEqual(extra,planAbuInfill(ctx,[garden]));
 for(const p of extra){assert.ok(!overlap(p,garden,1.3));assert.ok(!overlap(p,original,1));for(const q of extra)if(q!==p)assert.ok(!overlap(p,q,1.3));}
 const city={w:{ctx,root:new THREE.Group()},LM:{}},s=createAbuDhabiScene({city,extraBuildings:extra});s.setEnabled(true);s.apply();const count=ctx.rects.length;s.setEnabled(true);assert.equal(ctx.rects.length,count);assert.ok(count>extra.length);s.setEnabled(false);assert.deepEqual(ctx.rects,[original]);s.dispose();assert.deepEqual(ctx.walkSurfaces,[]);
});
