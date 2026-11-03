import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {planAbuVenueGrounds,lagoonRimSamples,createAbuLandscape,ABU_VENUE_AISLES} from '../src/abudhabi-landscape.js';
import {clearUrbanPlot} from '../src/abudhabi-public-realm.js';
import {ABU_OBSTACLES} from '../src/abudhabi-layout.js';
import {ABU_DETAIL_OBSTACLES} from '../src/abudhabi-details.js';
const isles=[{kind:'capsule',args:[[-14,-22,6,-22],6]},{kind:'circle',args:[[14,-13],4]},{kind:'circle',args:[[-16,-9],3]}];
const context=()=>({rects:[{x:0,z:-20,w:44,d:32}],circles:[{x:40,z:-62,r:15},{x:44,z:28,r:13},{x:12,z:-63,r:7},{x:56,z:-20,r:16}],roads:[{A:[31,-44],B:[-31,-44],hw:1.8},{A:[10,-4],B:[10,48.5],hw:3.8,kind:'canal'}],groundY:()=>1.25,lagoonIsles:isles});

test('venue gardens keep arrival axes and source collisions clear without overlapping earlier work',()=>{
 const ctx=context(),existing=[{x:65,z:-53,w:3.4,d:2.4},{x:66,z:30,w:3.4,d:2.4}],plots=planAbuVenueGrounds(ctx,existing);
 assert.ok(plots.some(p=>p.site==='ferrari'));assert.ok(plots.some(p=>p.site==='culture'));assert.ok(plots.some(p=>p.site==='infill'));
 assert.deepEqual(plots,planAbuVenueGrounds(ctx,existing));
 for(const p of plots)assert.ok(clearUrbanPlot(ctx,p,[...existing,...ABU_OBSTACLES,...ABU_DETAIL_OBSTACLES,...ABU_VENUE_AISLES,...plots.filter(q=>q!==p)]));
 for(const [x,z] of [[40,-43],[44,45]])assert.ok(plots.every(p=>Math.abs(p.x-x)>p.w/2+1||Math.abs(p.z-z)>p.d/2+1));
});

test('lagoon shore samples are closed, outward-facing and fitted to source outlines',()=>{
 const samples=lagoonRimSamples(isles);assert.equal(new Set(samples.map(p=>p.island)).size,3);
 assert.deepEqual(samples,lagoonRimSamples(isles));
 for(const p of samples){
  assert.ok(p.length>0&&p.length<=.44);assert.ok(Math.abs(p.nx*p.tx+p.nz*p.tz)<1e-10);
  const x=p.island===0?Math.max(-14,Math.min(6,p.x)):isles[p.island].args[0][0],z=p.island===0?-22:isles[p.island].args[0][1];
  assert.ok((p.x-x)*p.nx+(p.z-z)*p.nz>0);
  assert.ok(Math.abs(Math.hypot(p.x-x,p.z-z)-isles[p.island].args[1])<.005);
 }
 const perimeter=samples.reduce((s,p)=>s+p.length,0);assert.ok(Math.abs(perimeter-(40+26*Math.PI))<.1);
});

test('lake and venue geometry stays finite, budgets batches and restores only owned navigation',()=>{
 const ctx=context(),before=[...ctx.rects],texture=new THREE.Texture(),original=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial());
 isles[0].mesh=original;const sourceGeometry=original.geometry,sourceMaterial=original.material;
 const city={w:{root:new THREE.Group(),ctx}},s=createAbuLandscape({city,leafTexture:texture});let borrowedDisposed=0;texture.addEventListener('dispose',()=>borrowedDisposed++);
 assert.equal(s.stats.lagoonIslands,3);assert.ok(s.stats.triangles<230000);assert.ok(s.stats.drawCalls<=17);
 city.w.root.traverse(o=>{if(o.isMesh)for(const a of Object.values(o.geometry.attributes))assert.ok(a.array.every(Number.isFinite));});
 s.setEnabled(true);s.setEnabled(true);assert.equal(ctx.rects.length,before.length+s.plots.length);
 s.setEnabled(false);assert.deepEqual(ctx.rects,before);s.setEnabled(true);s.dispose();s.dispose();
 assert.deepEqual(ctx.rects,before);assert.equal(city.w.root.children.length,0);assert.equal(borrowedDisposed,0);assert.equal(original.geometry,sourceGeometry);assert.equal(original.material,sourceMaterial);
 original.geometry.dispose();original.material.dispose();texture.dispose();delete isles[0].mesh;
});
