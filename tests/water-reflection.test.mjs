import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createWaterReflection} from '../src/water-reflection.js';

test('planar capture excludes water, reflects the camera and restores renderer state after failure',()=>{
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(45,16/9,.1,100);
  camera.position.set(0,10,20);camera.lookAt(0,0,0);camera.updateMatrixWorld(true);
  const material=new THREE.MeshBasicMaterial(),water=new THREE.Mesh(new THREE.PlaneGeometry(),material);
  const hidden=water.clone();hidden.visible=false;scene.add(water,hidden);
  const originalTarget={},renderer={target:originalTarget,xr:{enabled:true},shadowMap:{autoUpdate:true},
    state:{buffers:{depth:{setMask(){}}}},getRenderTarget(){return this.target;},setRenderTarget(v){this.target=v;},
    render(s,c){assert.equal(water.visible,false);assert.equal(hidden.visible,false);assert.ok(c.position.y<0);throw new Error('capture failed');}};
  const reflection=createWaterReflection({renderer,scene,camera,waterMaterials:[material]});
  assert.throws(()=>reflection.capture(),/capture failed/);
  assert.equal(water.visible,true);assert.equal(hidden.visible,false);assert.equal(renderer.target,originalTarget);
  assert.equal(renderer.xr.enabled,true);assert.equal(renderer.shadowMap.autoUpdate,true);
  renderer.render=()=>{};
  assert.equal(reflection.capture(),true);assert.equal(reflection.captures,1);
  assert.ok(reflection.matrix.elements.every(Number.isFinite));
  assert.equal(reflection.capture(),false,'capture frequency is bounded');
  reflection.dispose();reflection.dispose();assert.equal(reflection.capture(),false);
  water.geometry.dispose();material.dispose();
});
