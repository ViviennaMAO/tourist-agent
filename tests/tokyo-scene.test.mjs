import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createTokyoScene} from '../src/tokyo-scene.js';
import {createTokyoTrees} from '../src/tokyo-trees.js';
import {createTokyoGround,TOKYO_PAVING,moatStoneSamples} from '../src/tokyo-ground.js';

function fixture(){
 const geo=new THREE.BoxGeometry(),mat=new THREE.MeshStandardMaterial(),tex=new THREE.Texture();
 const matrix=new THREE.Matrix4().makeTranslation(-56,3,-20),pools={};
 for(const name of ['tower','gable','treeTrunk','treeCrown']){
  const mesh=new THREE.InstancedMesh(geo,mat,2);mesh.setMatrixAt(0,matrix);mesh.setMatrixAt(1,new THREE.Matrix4().makeTranslation(60,10,-60));
  pools[name]={m:mesh,hide(i){mesh.setMatrixAt(i,new THREE.Matrix4().makeScale(0,0,0));},set(i,m){mesh.setMatrixAt(i,m);},flush(){}};
 }
 const root=new THREE.Group(),obstacle={x:-56,z:-20,w:4,d:3},surface=()=>null;
 const ctx={pools,rects:[obstacle],walkSurfaces:[surface],trees:[{i:0,x:7,z:15,y:1.25,sc:1,ry:0,kind:'sakura'},{i:1,x:8,z:20,y:1.25,sc:1.1,ry:.5,kind:'green'}],buildings:[{x:-56,z:-20,w:4,d:3,h:3,base:1.25,style:'wa',gable:{h:1.6},indices:{body:0,gable:0}},{x:60,z:-60,w:5,d:4,h:18,base:1.25,style:'glass',indices:{body:1}}],lagoonIsles:[{outline:[[-1,-41],[25,-41],[25,-19],[-1,-19]]}]};
 return {city:{w:{root,ctx},LM:{}},ctx,geo,mat,tex,matrix,obstacle,surface,dispose(){Object.values(pools).forEach(p=>p.m.dispose());geo.dispose();mat.dispose();tex.dispose();}};
}
function checkMeshes(root,budget){let triangles=0;root.traverse(m=>{if(!m.isMesh)return;for(const a of Object.values(m.geometry.attributes))assert.ok(a.array.every(Number.isFinite));triangles+=(m.geometry.index?.count||m.geometry.attributes.position.count)/3;});assert.ok(triangles>0&&triangles<budget,`budget ${triangles}`);}

test('Tokyo replaces and restores buildings and delayed landmark materials without shared mutation',()=>{
 const f=fixture(),s=createTokyoScene({city:f.city});checkMeshes(s.root,40000);
 s.setEnabled(true);s.apply();const m=new THREE.Matrix4();f.ctx.pools.tower.m.getMatrixAt(0,m);assert.equal(m.elements[0],0);
 const asset=new THREE.Mesh(f.geo,f.mat);f.city.LM.tokyo_tower={asset};s.apply();assert.notEqual(asset.material,f.mat);
 s.apply();s.setEnabled(false);f.ctx.pools.tower.m.getMatrixAt(0,m);assert.deepEqual(m.elements,f.matrix.elements);assert.equal(asset.material,f.mat);
 let disposed=0;for(const r of [f.geo,f.mat,f.tex])r.addEventListener('dispose',()=>disposed++);
 s.dispose();s.dispose();assert.equal(disposed,0);assert.deepEqual(f.ctx.rects,[f.obstacle]);assert.deepEqual(f.ctx.walkSurfaces,[f.surface]);assert.equal(f.city.w.root.children.length,0);f.dispose();
});

test('Tokyo branching trees stay seeded and restore source crowns across repeated enable/apply',()=>{
 const f=fixture(),a=createTokyoTrees({city:f.city,leafTexture:f.tex}),b=createTokyoTrees({city:f.city,leafTexture:f.tex});
 checkMeshes(a.root,30000);assert.equal(a.stats.sakura,1);assert.equal(a.stats.tokyoTrees,2);assert.ok(a.stats.drawCalls<=7);
 assert.deepEqual(a.root.children[0].geometry.attributes.position.array,b.root.children[0].geometry.attributes.position.array);
 let borrowed=0;f.tex.addEventListener('dispose',()=>borrowed++);
 a.setEnabled(true);a.apply();a.apply();a.setEnabled(false);const matrix=new THREE.Matrix4();f.ctx.pools.treeCrown.m.getMatrixAt(0,matrix);assert.deepEqual(matrix.elements,f.matrix.elements);
 a.dispose();b.dispose();assert.equal(borrowed,0);assert.deepEqual(f.ctx.rects,[f.obstacle]);f.dispose();
});

test('Tokyo ground keeps existing navigation, and moat stones follow either contour winding',()=>{
 const f=fixture(),a=moatStoneSamples(f.ctx.lagoonIsles),b=moatStoneSamples([{outline:[...f.ctx.lagoonIsles[0].outline].reverse()}]);
 for(const sample of [...a,...b])assert.ok((sample.x-12)*sample.nx+(sample.z+30)*sample.nz>0);
 assert.equal(a.length,b.length);assert.ok(a.every(s=>s.length<=.68));
 for(const p of TOKYO_PAVING){assert.ok(p.x+p.w/2<-16||p.z+p.d/2<-35);assert.ok(p.z-p.d/2>-53);assert.ok(p.z+p.d/2<39);}
 const s=createTokyoGround({city:f.city});checkMeshes(s.root,40000);s.setEnabled(true);s.apply();s.dispose();assert.deepEqual(f.ctx.rects,[f.obstacle]);assert.deepEqual(f.ctx.walkSurfaces,[f.surface]);f.dispose();
});
