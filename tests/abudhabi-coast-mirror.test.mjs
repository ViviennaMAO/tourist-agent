import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {ABU_COAST,createAbuCoastalWalk} from '../src/abudhabi-coastline.js';
import {pointInPolygon} from '../src/shore-profile.js';
import {createMosqueInlay} from '../src/abudhabi-inlay.js';
import {createMarbleReflection} from '../src/marble-reflection.js';
import {coastSamples} from '../src/dubai-coast.js';

test('Abu curved coast retains old usable land and leaves both canal outlets open',()=>{
 assert.ok(ABU_COAST.length>100);assert.ok(ABU_COAST.flat().every(Number.isFinite));
 for(let x=-71;x<72;x+=2)for(let z=-79;z<46;z+=2){const cx=Math.max(-60,Math.min(60,x)),cz=Math.max(-68,Math.min(34,z));if(Math.hypot(x-cx,z-cz)<11.95)assert.ok(pointInPolygon(ABU_COAST,x,z),`retained ${x},${z}`);}
 assert.ok(pointInPolygon(ABU_COAST,-22,50));assert.ok(pointInPolygon(ABU_COAST,76,-15));
 assert.ok(!pointInPolygon(ABU_COAST,10,48.5));assert.ok(!pointInPolygon(ABU_COAST,-74.5,-26));
 for(let i=0;i<ABU_COAST.length;i++){const a=ABU_COAST[i],b=ABU_COAST[(i+1)%ABU_COAST.length];assert.ok(Math.hypot(a[0]-b[0],a[1]-b[1])>.01);}
 const roads=[{kind:'road',A:[10,-4],B:[10,48.5],hw:3},{kind:'road',A:[-22,-26],B:[-74.5,-26],hw:3}];
 const samples=coastSamples([{id:'mainland',outline:ABU_COAST}],roads,.48,false);
 assert.ok(samples.every(p=>!(Math.abs(p.x-10)<3.6&&p.z>45)&&!(p.x<-70&&Math.abs(p.z+26)<3.6)));
});

test('Curved promenade adds no obstacle and disposes its own resources',()=>{
 const ctx={islands:[{id:'mainland',outline:ABU_COAST}],roads:[],groundY:()=>1,rects:[],walkSurfaces:[]},city={w:{ctx,root:new THREE.Group()}};
 const s=createAbuCoastalWalk({city});s.setEnabled(true);assert.equal(s.root.children.length,2);
 for(const m of s.root.children){for(const a of Object.values(m.geometry.attributes))assert.ok(a.array.every(Number.isFinite));assert.equal(m.castShadow,false);}
 s.dispose();s.dispose();assert.equal(city.w.root.children.length,0);assert.equal(ctx.rects.length,0);assert.equal(ctx.walkSurfaces.length,0);
});

test('Marble capture uses floor height, omits other cities, restores state and skips distant views',()=>{
 const scene=new THREE.Scene(),root=new THREE.Group(),other=new THREE.Group();scene.add(root,other);
 const city={w:{root}},inlay=createMosqueInlay({city}),material=inlay.materials[0],compile=material.onBeforeCompile,key=material.customProgramCacheKey;
 const camera=new THREE.PerspectiveCamera(50,1.6,.1,1000);camera.position.set(-15,6,49);camera.lookAt(-15,1,40);camera.updateMatrixWorld(true);
 const original={},renderer={target:original,xr:{enabled:true},shadowMap:{autoUpdate:true},state:{buffers:{depth:{setMask(){}}}},getRenderTarget(){return this.target;},setRenderTarget(v){this.target=v;},render(s,c){assert.equal(other.visible,false);assert.ok(inlay.root.children.every(m=>!m.visible));assert.ok(Math.abs(c.position.y-(2*1.085-6))<.001);throw new Error('failed capture');}};
 const mirror=createMarbleReflection({renderer,scene,camera,city,inlay,excludeObjects:()=>[other]});mirror.setEnabled(true);
 assert.throws(()=>mirror.capture(),/failed capture/);assert.ok(other.visible);assert.ok(inlay.root.children.every(m=>m.visible));assert.equal(renderer.target,original);assert.equal(renderer.xr.enabled,true);assert.equal(renderer.shadowMap.autoUpdate,true);
 renderer.render=()=>{};mirror.capture();assert.equal(mirror.captures,1);mirror.capture();assert.equal(mirror.captures,1);
 const shader={vertexShader:THREE.ShaderLib.physical.vertexShader,fragmentShader:THREE.ShaderLib.physical.fragmentShader,uniforms:{}};material.onBeforeCompile(shader,renderer);assert.equal(shader.uniforms.marbleReady.value,1);assert.ok(shader.fragmentShader.includes('outgoingLight=mix'));
 camera.position.set(-15,150,250);camera.lookAt(-15,1,40);camera.updateMatrixWorld(true);mirror.capture();assert.equal(mirror.captures,1);assert.equal(shader.uniforms.marbleReady.value,0);
 mirror.dispose();mirror.dispose();assert.equal(material.onBeforeCompile,compile);assert.equal(material.customProgramCacheKey,key);inlay.dispose();
});
