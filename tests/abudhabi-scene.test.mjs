import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createAbuDhabiScene} from '../src/abudhabi-scene.js';
import {ABU_DETAIL_OBSTACLES} from '../src/abudhabi-details.js';
import {ABU_OBSTACLES,abuPromenade} from '../src/abudhabi-layout.js';

const clear=(x,z)=>ABU_OBSTACLES.every(o=>Math.abs(x-o.x)>o.w/2+.45||Math.abs(z-o.z)>o.d/2+.45);
test('Abu Dhabi promenade keeps a continuous dry lane and the mosque approach clear',()=>{
 for(const [a,b] of [[-65,5],[15,65]])for(let x=a;x<=b;x+=.2){assert.ok(abuPromenade(x,42));assert.ok(clear(x,42));}
 for(let z=38;z<=44;z+=.2)assert.ok(clear(-15,z));
 assert.equal(abuPromenade(10,42),false);
});

test('Abu Dhabi refinement restores source instances/materials and removes only its own navigation',()=>{
 const source=new THREE.MeshStandardMaterial(),geo=new THREE.BoxGeometry(),tex=new THREE.Texture();
 const asset=new THREE.Group();asset.add(new THREE.Mesh(geo,source));
 const instance=new THREE.InstancedMesh(geo,source,1),original=new THREE.Matrix4().makeTranslation(2,5,-60);instance.setMatrixAt(0,original);
 const pool={m:instance,hide(i){instance.setMatrixAt(i,new THREE.Matrix4().makeScale(0,0,0));},set(i,m){instance.setMatrixAt(i,m);},flush(){}};
 const obstacle={x:60,z:-40,w:5,d:5},surface=()=>null;
 const ctx={rects:[obstacle],walkSurfaces:[surface],pools:{tower:pool},buildings:[{x:2,z:-60,w:4,d:4,h:10,base:1,indices:{body:0}}]};
 const city={w:{root:new THREE.Group(),ctx},LM:{grand_mosque:{asset}}};
 const scene=createAbuDhabiScene({city,leafTexture:tex});let disposed=0;
 for(const o of [source,geo,tex])o.addEventListener('dispose',()=>disposed++);
 for(const mesh of scene.root.children)for(const a of Object.values(mesh.geometry.attributes))assert.ok(a.array.every(Number.isFinite));
 assert.ok(scene.stats.triangles<80000);assert.ok(scene.stats.drawCalls<20);
 scene.setEnabled(true);scene.apply();scene.setEnabled(true);assert.equal(ctx.rects.length,1+ABU_OBSTACLES.length+ABU_DETAIL_OBSTACLES.length);assert.equal(ctx.walkSurfaces.length,2);
 assert.notEqual(asset.children[0].material,source);
 assert.equal(ctx.walkSurfaces[1](-15,42),1.115);
 scene.setEnabled(false);assert.deepEqual(ctx.rects,[obstacle]);assert.deepEqual(ctx.walkSurfaces,[surface]);assert.equal(asset.children[0].material,source);
 const restored=new THREE.Matrix4();instance.getMatrixAt(0,restored);assert.deepEqual(restored.elements,original.elements);
 scene.dispose();scene.dispose();assert.equal(disposed,0);assert.equal(city.w.root.children.length,0);
 instance.dispose();geo.dispose();source.dispose();tex.dispose();
});

test('Abu Dhabi shrubs release owned resources and restore animated source transforms',async()=>{
 const {createAbuDhabiShrubs}=await import('../src/abudhabi-shrubs.js');
 const geo=new THREE.SphereGeometry(),material=new THREE.MeshStandardMaterial(),texture=new THREE.Texture();
 const source=new THREE.InstancedMesh(geo,material,1),matrix=new THREE.Matrix4().compose(new THREE.Vector3(4,1,7),new THREE.Quaternion(),new THREE.Vector3(2,2,2));
 source.setMatrixAt(0,matrix);const pool={n:1,m:source,set(i,m){source.setMatrixAt(i,m);},hide(i){this.set(i,new THREE.Matrix4().makeScale(0,0,0));},flush(){}};
 const city={w:{root:new THREE.Group(),ctx:{pools:{bush:pool}}}};
 let borrowedDisposals=0;for(const r of [geo,material,texture])r.addEventListener('dispose',()=>borrowedDisposals++);
 const study=createAbuDhabiShrubs({city,leafTexture:texture});study.setEnabled(true);study.apply();
 const visible=new THREE.Matrix4();study.root.getMatrixAt(0,visible);assert.deepEqual(visible.elements,matrix.elements);
 study.setEnabled(false);source.getMatrixAt(0,visible);assert.deepEqual(visible.elements,matrix.elements);
 study.dispose();study.dispose();assert.equal(city.w.root.children.length,0);assert.equal(borrowedDisposals,0);
 geo.dispose();material.dispose();texture.dispose();source.dispose();
});

 test('Palace garden preserves arrival and a continuous central approach',()=>{
 for(let z=11;z<=30;z+=.2)for(const x of [-55,-54,-53])assert.ok(ABU_DETAIL_OBSTACLES.every(o=>Math.abs(x-o.x)>o.w/2+.45||Math.abs(z-o.z)>o.d/2+.45));
 });

test('Relocating a palace shrub removes its old collision and restores it on disable',async()=>{
 const {createAbuDhabiShrubs}=await import('../src/abudhabi-shrubs.js');
 const geo=new THREE.SphereGeometry(),mat=new THREE.MeshStandardMaterial(),mesh=new THREE.InstancedMesh(geo,mat,1);
 const before=new THREE.Matrix4().makeTranslation(-54,2,16);mesh.setMatrixAt(0,before);
 const obstacle={x:-54,z:16,w:.96,d:.96},unrelated={x:-60,z:16,w:3,d:3};
 const ctx={rects:[obstacle,unrelated],pools:{bush:{n:1,m:mesh,set(i,m){mesh.setMatrixAt(i,m);},hide(i){mesh.setMatrixAt(i,new THREE.Matrix4().makeScale(0,0,0));},flush(){}}}};
 const city={w:{root:new THREE.Group(),ctx}};const study=createAbuDhabiShrubs({city});study.setEnabled(true);study.apply();
 assert.deepEqual(ctx.rects,[unrelated]);const displayed=new THREE.Matrix4();study.root.getMatrixAt(0,displayed);assert.notEqual(displayed.elements[12],-54);
 study.setEnabled(false);assert.ok(ctx.rects.includes(obstacle));assert.equal(ctx.rects.length,2);mesh.getMatrixAt(0,displayed);assert.deepEqual(displayed.elements,before.elements);
 study.dispose();geo.dispose();mat.dispose();mesh.dispose();
});
