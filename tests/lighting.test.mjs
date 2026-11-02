import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createContactNormals,createContactShadows} from '../src/contact-shadows.js';
import {createDubaiBackdrop} from '../src/dubai-backdrop.js';
import {createCityReflections} from '../src/city-reflections.js';
import {installSkylineAtmosphere} from '../src/skyline-atmosphere.js';
import {installCurtainWallFinish} from '../src/curtain-wall.js';

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
  assert.equal(new Set(backdrop.footprints.map(b=>b.family)).size,5);
  assert.ok(new Set(backdrop.footprints.map(b=>b.z)).size>18);
  for(const [i,a] of backdrop.footprints.entries())for(const b of backdrop.footprints.slice(i+1)) {
    assert.ok(Math.abs(a.x-b.x)>=(a.w+b.w)/2+.9||Math.abs(a.z-b.z)>=(a.d+b.d)/2+.9);
  }
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
  const renderer={};let forwarded;
  const originalCompile=(shader,r)=>{forwarded=r;shader.uniforms.original={value:7};},originalKey=()=>'original-key';
  material.userData.cityGlass=true;material.onBeforeCompile=originalCompile;material.customProgramCacheKey=originalKey;
  installCurtainWallFinish(material);
  const finishCompile=material.onBeforeCompile,finishKey=material.customProgramCacheKey;
  const root=new THREE.Group();root.add(new THREE.Mesh(new THREE.BoxGeometry(),material));
  let disposed=0;map.addEventListener('dispose',()=>disposed++);material.addEventListener('dispose',()=>disposed++);
  const probe=createCityReflections({renderer,scene:new THREE.Scene(),city:{w:{root}}});
  const shader={uniforms:{},vertexShader:'#include <worldpos_vertex>',fragmentShader:'#include <envmap_physical_pars_fragment>'};
  material.onBeforeCompile(shader,renderer);assert.equal(forwarded,renderer);
  assert.equal(shader.uniforms.original.value,7);assert.match(shader.fragmentShader,/cityProjectedReflection/);
  probe.setEnabled(true);probe.setEnabled(false);assert.equal(material.envMap,map);
  probe.dispose();probe.dispose();assert.equal(material.onBeforeCompile,finishCompile);assert.equal(material.customProgramCacheKey,finishKey);assert.equal(disposed,0);
  root.children[0].geometry.dispose();material.dispose();map.dispose();
});

test('contact filtering follows camera/viewport changes and restores renderer after a failed pass',()=>{
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(40,1,.5,6000);
  const source=new THREE.MeshStandardMaterial(),mesh=new THREE.Mesh(new THREE.BoxGeometry(),source);scene.add(mesh);
  const originalTarget={name:'caller target'},color=new THREE.Color('#365478');
  let target=originalTarget,alpha=.4,size=new THREE.Vector2(1920,1080),fail=false,filter;
  const renderer={autoClear:true,shadowMap:{autoUpdate:true},
    getDrawingBufferSize:v=>v.copy(size),getRenderTarget:()=>target,setRenderTarget:v=>target=v,
    getClearColor:v=>v.copy(color),getClearAlpha:()=>alpha,
    setClearColor:(v,a=1)=>{color.set(v);alpha=a;},setClearAlpha:v=>alpha=v,clear(){},
    render(object){
      if(object===scene){assert.ok(mesh.material.isMeshNormalMaterial);return;}
      if(object.material.uniforms.tNormal&&object.material.uniforms.tDiffuse){
        filter=object.material;if(fail)throw new Error('filter failure');
      }
    }
  };
  const shadows=createContactShadows({renderer,scene,camera});shadows.render();
  assert.equal(shadows.resolution,'800×450');
  assert.ok(filter.uniforms.tDepth.value.isDepthTexture);
  assert.equal(filter.uniforms.cameraFar.value,6000);
  size.set(390,844);camera.near=.2;camera.far=1200;camera.updateProjectionMatrix();fail=true;
  assert.throws(()=>shadows.render(),/filter failure/);
  assert.equal(shadows.resolution,'293×633');
  assert.equal(filter.uniforms.cameraNear.value,.2);assert.equal(filter.uniforms.cameraFar.value,1200);
  assert.equal(target,originalTarget);assert.equal(renderer.autoClear,true);assert.equal(renderer.shadowMap.autoUpdate,true);
  assert.equal(color.getHexString(),'365478');assert.equal(alpha,.4);assert.equal(mesh.material,source);
  shadows.dispose();shadows.dispose();mesh.geometry.dispose();source.dispose();
});


test('skyline air preserves curtain-wall and reflection callbacks before tone mapping',()=>{
  const material=new THREE.MeshStandardMaterial();
  material.onBeforeCompile=shader=>{shader.uniforms.original={value:1};};
  installCurtainWallFinish(material);installSkylineAtmosphere(material,.32);
  const shader={uniforms:{},vertexShader:THREE.ShaderLib.standard.vertexShader,fragmentShader:THREE.ShaderLib.standard.fragmentShader};
  material.onBeforeCompile(shader,{});
  assert.equal(shader.uniforms.original.value,1);
  assert.equal(shader.uniforms.skylineAirStrength.value,.32);
  assert.match(shader.fragmentShader,/curtainVariation/);
  const air=shader.fragmentShader.indexOf('outgoingLight = mix');
  assert.ok(air>0&&air<shader.fragmentShader.indexOf('#include <tonemapping_fragment>'));
  material.dispose();
});
