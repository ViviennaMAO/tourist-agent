import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {clearUrbanPlot,planAbuPublicRealm,createAbuPublicRealm} from '../src/abudhabi-public-realm.js';
import {createAbuDhabiShrubs} from '../src/abudhabi-shrubs.js';
import {ABU_OBSTACLES} from '../src/abudhabi-layout.js';
import {ABU_DETAIL_OBSTACLES} from '../src/abudhabi-details.js';

test('public realm avoids water, roads, landmarks, custom beds and other selected plots',()=>{
 const ctx={rects:[{x:0,z:-20,w:44,d:32}],circles:[{x:-54,z:0,r:9},{x:-15,z:27,r:11}],roads:[{A:[-31,6],B:[6,6],hw:1.8},{A:[10,-4],B:[10,48.5],hw:3}],groundY:()=>1.25};
 const plots=planAbuPublicRealm(ctx);assert.deepEqual(plots,planAbuPublicRealm(ctx));
 assert.equal(plots.filter(p=>p.kind==='pergola').length,2);
 assert.ok(plots.some(p=>p.kind==='garden'));
 for(const p of plots){assert.equal(p.y,1.25);assert.ok(clearUrbanPlot(ctx,p,[...ABU_OBSTACLES,...ABU_DETAIL_OBSTACLES,...plots.filter(q=>q!==p)]));}
 assert.equal(clearUrbanPlot(ctx,{x:0,z:-20,w:3,d:3}),false);
 assert.equal(clearUrbanPlot(ctx,{x:10,z:20,w:2,d:2}),false);
 assert.equal(clearUrbanPlot(ctx,{x:-54,z:0,w:2,d:2}),false);
 // A genuine building cannot be removed to make room for the court.
 const blocked=planAbuPublicRealm({...ctx,rects:[...ctx.rects,{x:-14,z:-1,w:3,d:3}]});
 assert.ok(!blocked.some(p=>p.kind==='pergola'&&p.x===-14));
});

test('public realm batches finite geometry and restores only owned collisions and buffers',()=>{
 const obstacle={x:-54,z:0,w:10,d:10},ctx={rects:[obstacle],circles:[],roads:[]};
 const texture=new THREE.Texture();let textureDisposals=0;texture.addEventListener('dispose',()=>textureDisposals++);
 const city={w:{root:new THREE.Group(),ctx}},s=createAbuPublicRealm({city,leafTexture:texture});
 assert.ok(s.stats.drawCalls<=9);assert.ok(s.stats.triangles<200000);
 for(const m of s.root.children)for(const a of Object.values(m.geometry.attributes))assert.ok(a.array.every(Number.isFinite));
 s.setEnabled(true);s.setEnabled(true);assert.equal(ctx.rects.length,1+s.plots.length);
 s.setEnabled(false);assert.deepEqual(ctx.rects,[obstacle]);s.setEnabled(true);s.dispose();s.dispose();
 assert.deepEqual(ctx.rects,[obstacle]);assert.equal(city.w.root.children.length,0);assert.equal(textureDisposals,0);texture.dispose();
});

test('seating courts replace intersecting source shrubs and restore them on disable',()=>{
 const geo=new THREE.SphereGeometry(),mat=new THREE.MeshStandardMaterial(),mesh=new THREE.InstancedMesh(geo,mat,1),original=new THREE.Matrix4().makeTranslation(-14,2,-1);mesh.setMatrixAt(0,original);
 const shrub={x:-14,z:-1,w:.96,d:.96},other={x:5,z:5,w:2,d:2};
 const ctx={rects:[shrub,other],pools:{bush:{n:1,m:mesh,set(i,m){mesh.setMatrixAt(i,m);},hide(i){mesh.setMatrixAt(i,new THREE.Matrix4().makeScale(0,0,0));},flush(){}}}};
 const city={w:{root:new THREE.Group(),ctx}},s=createAbuDhabiShrubs({city,clearedPlots:[{x:-14,z:-1,w:4.6,d:2.8}]});
 s.setEnabled(true);s.apply();const shown=new THREE.Matrix4();s.root.getMatrixAt(0,shown);assert.equal(shown.elements[0],0);assert.deepEqual(ctx.rects,[other]);
 s.setEnabled(false);mesh.getMatrixAt(0,shown);assert.deepEqual(shown.elements,original.elements);assert.ok(ctx.rects.includes(shrub));
 s.dispose();geo.dispose();mat.dispose();mesh.dispose();
});
