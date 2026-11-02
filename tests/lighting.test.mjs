import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createContactNormals} from '../src/contact-shadows.js';
import {createDubaiBackdrop} from '../src/dubai-backdrop.js';
import {createCityReflections} from '../src/city-reflections.js';

test('contact normal pass preserves cutouts, hidden objects and source resources even if drawing fails',()=>{
  const scene=new THREE.Scene(),texture=new THREE.Texture();
  const leaf=new THREE.MeshStandardMaterial({map:texture,alphaTest:.42,side:THREE.DoubleSide});
  const glass=new THREE.MeshStandardMaterial({transparent:true,opacity:.13});
  const solid=new THREE.MeshStandardMaterial();
  const objects=[new THREE.Mesh(new THREE.PlaneGeometry(),leaf),new THREE.Mesh(new THREE.BoxGeometry(),glass),new THREE.Mesh(new THREE.BoxGeometry(),solid)];
  objects[2].visible=false;scene.add(...objects);
  const normals=createContactNormals();let sourceDisposed=0,proxyDisposed=0,normal;
  for(const m of [leaf,glass,solid,texture])m.addEventListener('dispose',()=>sourceDisposed++);
  assert.throws(()=>normals.withMaterials(scene,()=>{
    normal=objects[0].material;assert.ok(normal.isMeshNormalMaterial);assert.equal(normal.side,THREE.DoubleSide);
    normal.addEventListener('dispose',()=>proxyDisposed++);
    assert.equal(objects[1].visible,false);assert.equal(objects[2].visible,false);
    const shader={uniforms:{},vertexShader:'#include <begin_vertex>',fragmentShader:'#include <clipping_planes_fragment>'};
    normal.onBeforeCompile(shader);
    assert.equal(shader.uniforms.contactAlpha.value,texture);assert.match(shader.fragmentShader,/discard/);
    throw new Error('simulated draw failure');
  }),/simulated draw failure/);
  assert.equal(objects[0].material,leaf);assert.equal(objects[1].material,glass);assert.equal(objects[1].visible,true);assert.equal(objects[2].visible,false);
  normals.withMaterials(scene,()=>assert.equal(objects[0].material,normal));
  normals.dispose();normals.dispose();assert.equal(proxyDisposed,1);assert.equal(sourceDisposed,0);
  objects.forEach(o=>o.geometry.dispose());[leaf,glass,solid,texture].forEach(m=>m.dispose());
});

test('inland skyline adds bounded staggered buildings and restores only its own collisions',()=>{
  const existing={x:0,z:-65,w:8,d:8},rects=[existing];
  const ctx={rects,groundY:()=>1,free:(x,z,w,d)=>Math.hypot(x,z+65)>10+Math.hypot(w,d)/2};
  const city={w:{root:new THREE.Group(),ctx}},backdrop=createDubaiBackdrop({THREE,city});
  assert.ok(backdrop.stats.buildings>=18);assert.ok(backdrop.stats.triangles<30000);assert.equal(backdrop.stats.drawCalls,5);
  for(const b of backdrop.footprints) {
    assert.ok(ctx.free(b.x,b.z,b.w,b.d));assert.ok(b.z-b.d/2>=-84&&Math.abs(b.x)+b.w/2<64);
    assert.ok(b.h>=8&&b.h<=20);
  }
  assert.ok(new Set(backdrop.footprints.map(b=>b.h)).size>8);
  for(const mesh of backdrop.root.children) {
    for(const a of Object.values(mesh.geometry.attributes))assert.ok(a.array.every(Number.isFinite));
    const p=mesh.geometry.attributes.position;
    for(let i=0;i<p.count;i++)assert.ok(backdrop.footprints.some(b=>Math.abs(p.getX(i)-b.x)<=b.w/2+.00001&&Math.abs(p.getZ(i)-b.z)<=b.d/2+.00001&&p.getY(i)>=b.base-.00001&&p.getY(i)<=b.base+b.h+1.6));
  }
  for(let i=0;i<3;i++){backdrop.setEnabled(true);backdrop.setEnabled(true);assert.equal(rects.length,1+backdrop.stats.buildings);backdrop.setEnabled(false);assert.deepEqual(rects,[existing]);}
  backdrop.setEnabled(true);backdrop.dispose();backdrop.dispose();assert.deepEqual(rects,[existing]);assert.equal(city.w.root.children.length,0);
});

test('reflection setup preserves material callbacks, original maps and shared resources on disposal',()=>{
  const map=new THREE.Texture(),material=new THREE.MeshStandardMaterial({envMap:map});
  const originalCompile=shader=>{shader.uniforms.original={value:7};},originalKey=()=>'original-key';
  material.userData.cityGlass=true;material.onBeforeCompile=originalCompile;material.customProgramCacheKey=originalKey;
  const root=new THREE.Group();root.add(new THREE.Mesh(new THREE.BoxGeometry(),material));
  let disposed=0;map.addEventListener('dispose',()=>disposed++);material.addEventListener('dispose',()=>disposed++);
  const probe=createCityReflections({renderer:{},scene:new THREE.Scene(),city:{w:{root}}});
  const shader={uniforms:{},vertexShader:'#include <worldpos_vertex>',fragmentShader:'#include <envmap_physical_pars_fragment>'};
  material.onBeforeCompile(shader);
  assert.equal(shader.uniforms.original.value,7);assert.match(shader.fragmentShader,/cityProjectedReflection/);
  probe.setEnabled(true);probe.setEnabled(false);assert.equal(material.envMap,map);
  probe.dispose();probe.dispose();assert.equal(material.onBeforeCompile,originalCompile);assert.equal(material.customProgramCacheKey,originalKey);assert.equal(disposed,0);
  root.children[0].geometry.dispose();material.dispose();map.dispose();
});
