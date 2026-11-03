import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {installSurfaceFinish} from '../src/surface-finish.js';
import {createDubaiAttraction} from '../src/dubai-attractions.js';

test('surface finishing composes existing lighting callbacks and has distinct shader variants',()=>{
 const keys=new Set();
 for(const kind of ['limestone','paving','wood','paint','fabric']){
  const m=new THREE.MeshStandardMaterial();let forwarded;
  m.onBeforeCompile=(s,r)=>{forwarded=r;s.uniforms.existing={value:1};};
  installSurfaceFinish(m,kind,{metricAttribute:true});
  const shader={uniforms:{},vertexShader:THREE.ShaderLib.standard.vertexShader,fragmentShader:THREE.ShaderLib.standard.fragmentShader},renderer={};
  m.onBeforeCompile(shader,renderer);assert.equal(forwarded,renderer);assert.equal(shader.uniforms.existing.value,1);
  assert.match(shader.vertexShader,/attribute vec3 surfacePosition/);
  assert.match(shader.fragmentShader,/fwidth\(courses\)|footprint/);
  assert.ok(shader.fragmentShader.indexOf('sfHeight=')<shader.fragmentShader.indexOf('dFdx(sfHeight)'));
  keys.add(m.customProgramCacheKey());m.dispose();
 }
 assert.equal(keys.size,5);
});

test('batched harbor retains finite metric coordinates and materials use the harbor reflection zone',()=>{
 const root=createDubaiAttraction('cruise');let transformed=0,reflective=0;
 root.traverse(o=>{
  if(!o.isMesh)return;
  const p=o.geometry.attributes.position,metric=o.geometry.attributes.surfacePosition;
  assert.equal(metric.count,p.count);assert.ok(metric.array.every(Number.isFinite));
  for(let i=0;i<p.count;i++)if(Math.abs(p.getX(i)-metric.getX(i))>.1){transformed++;break;}
  if(o.material.userData.cityGlass){reflective++;assert.equal(o.material.userData.reflectionZone,'harbor');}
 });
 assert.ok(transformed>5);assert.ok(reflective>=2);
 root.userData.dispose();
});
