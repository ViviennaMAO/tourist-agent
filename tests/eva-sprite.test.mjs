import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createEvaSprite,selectEvaFrame,EVA_FRAMES} from '../src/eva-sprite.js';

test('view selection follows actor yaw and camera, with independent atlas crops',()=>{
  const atlas=new THREE.Texture({width:1536,height:1024});
  const a=createEvaSprite({THREE,atlasTexture:atlas}),b=createEvaSprite({THREE,atlasTexture:atlas});
  const camera=new THREE.PerspectiveCamera();camera.position.set(0,3,10);
  a.root.position.set(2,1,1);a.root.rotation.y=Math.PI;
  a.updateView(camera);b.updateView(camera);
  assert.equal(a.root.userData.view,'back');assert.equal(b.root.userData.view,'front');
  for(const [actor,index] of [[a,2],[b,0]]) {
    const uv=actor.root.getObjectByName('Eva illustrated body').geometry.attributes.uv;
    const xs=Array.from({length:uv.count},(_,i)=>uv.getX(i));
    assert.ok(Math.abs(Math.min(...xs)-EVA_FRAMES[index].x/1536)<1e-6);
    assert.ok(Math.abs(Math.max(...xs)-(EVA_FRAMES[index].x+EVA_FRAMES[index].width)/1536)<1e-6);
  }
  for(const sign of [-1,1]) {
    camera.position.set(sign*10,3,0);b.updateView(camera);
    assert.equal(b.root.userData.view,'side');assert.equal(b.root.userData.mirrored,sign<0);
  }
  assert.deepEqual(atlas.offset.toArray(),[0,0]);assert.deepEqual(atlas.repeat.toArray(),[1,1]);
  assert.deepEqual(selectEvaFrame(Math.PI*2),{index:0,mirror:false});
  a.dispose();b.dispose();atlas.dispose();
});

test('image motion preserves navigation and freezes; alpha participates in scene depth',()=>{
  const atlas=new THREE.Texture({width:1536,height:1024}),c=createEvaSprite({THREE,atlasTexture:atlas});
  const picture=c.root.getObjectByName('Eva illustrated body');
  c.root.position.set(5,1.38,-3);c.root.rotation.y=.6;
  for(let n=0;n<90;n++)c.animate(1/60,1,n/60);
  assert.deepEqual(c.root.position.toArray(),[5,1.38,-3]);assert.equal(c.root.rotation.y,.6);
  c.animate(0,1,180);const y=picture.position.y;c.animate(0,1,180);assert.equal(picture.position.y,y);
  assert.equal(picture.material.depthTest,true);assert.equal(picture.material.depthWrite,true);
  assert.equal(picture.material.alphaTest,.45);assert.equal(c.stats.triangles,4);
  let sharedDisposed=0,ownedDisposed=0;
  atlas.addEventListener('dispose',()=>sharedDisposed++);
  c.root.traverse(o=>{if(o.isMesh)o.geometry.addEventListener('dispose',()=>ownedDisposed++);});
  c.dispose();c.dispose();assert.equal(sharedDisposed,0);assert.equal(ownedDisposed,2);
});
