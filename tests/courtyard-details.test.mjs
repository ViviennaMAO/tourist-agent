import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {chamferedBox} from '../src/chamfered-box.js';
import {installCourtyardBounce} from '../src/courtyard-bounce.js';

test('stone bevels preserve the footprint, face outward and remove the sharp box corner',()=>{
  const g=chamferedBox(.22,2.8,.24,.022),p=g.attributes.position,n=g.attributes.normal;
  g.computeBoundingBox();
  const size=g.boundingBox.getSize(new THREE.Vector3());
  for(const [v,w] of size.toArray().map((v,i)=>[v,[.22,2.8,.24][i]]))assert.ok(Math.abs(v-w)<1e-6);
  for(let i=0;i<p.count;i+=3){
    const a=new THREE.Vector3().fromBufferAttribute(p,i),b=new THREE.Vector3().fromBufferAttribute(p,i+1),c=new THREE.Vector3().fromBufferAttribute(p,i+2);
    assert.ok(b.clone().sub(a).cross(c.clone().sub(a)).length()>1e-8);
    assert.ok(a.clone().add(b).add(c).dot(new THREE.Vector3().fromBufferAttribute(n,i))>0,'outward winding on all faces');
  }
  const mesh=new THREE.Mesh(g,new THREE.MeshBasicMaterial());mesh.updateMatrixWorld(true);
  const ray=new THREE.Raycaster(new THREE.Vector3(1,0,1),new THREE.Vector3(-1,0,-1).normalize());
  const hit=ray.intersectObject(mesh)[0];assert.ok(hit);assert.ok(hit.point.x<.11-.004,'corner has a geometric bevel');
  assert.ok(Math.abs(hit.face.normal.x)>.5&&Math.abs(hit.face.normal.z)>.5);
  mesh.material.dispose();g.dispose();
});

test('courtyard fill preserves existing shader hooks and can be switched without recompiling',()=>{
  const material=new THREE.MeshStandardMaterial(),strength={value:1};let originalCalls=0;
  material.onBeforeCompile=shader=>{originalCalls++;shader.uniforms.existing={value:3};};
  material.customProgramCacheKey=()=> 'stone';
  installCourtyardBounce(material,new THREE.Vector3(-345,0,-230),strength);
  const shader={uniforms:{},vertexShader:THREE.ShaderLib.standard.vertexShader,fragmentShader:THREE.ShaderLib.standard.fragmentShader};
  material.onBeforeCompile(shader,{});
  assert.equal(originalCalls,1);assert.equal(shader.uniforms.existing.value,3);
  assert.equal(shader.uniforms.courtyardBounce,strength);strength.value=0;assert.equal(shader.uniforms.courtyardBounce.value,0);
  assert.ok(shader.fragmentShader.indexOf('float porch=')<shader.fragmentShader.indexOf('#include <aomap_fragment>'));
  assert.equal(material.customProgramCacheKey(),'stone-courtyard-bounce-v3');material.dispose();
});
