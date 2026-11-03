import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {metricVenueGeometry,venueGlassGeometry,isVenueGlass,installVenueFinish,createAbuVenues,CULTURE_PAVILIONS} from '../src/abudhabi-venues.js';
import {createAbuDhabiScene} from '../src/abudhabi-scene.js';

test('venue atlas mask separates blue glazing from red roof, yellow badge and pale stone',()=>{
 assert.equal(isVenueGlass([.25,.43,.49]),true);
 for(const c of [[.8,.09,.04],[1,.8,.1],[.85,.81,.71],[.1,.1,.1]])assert.equal(isVenueGlass(c),false);
 const source=new THREE.PlaneGeometry(2,2),matrix=new THREE.Matrix4().makeTranslation(5,3,-2),before=source.attributes.position.array.slice();
 const metric=metricVenueGeometry(source,matrix);assert.deepEqual(source.attributes.position.array,before);assert.ok(!source.attributes.surfacePosition);
 assert.equal(metric.attributes.surfacePosition.getX(0),source.attributes.position.getX(0)+5);
 assert.deepEqual(metric.attributes.uv.array,source.attributes.uv.array);
 assert.equal(venueGlassGeometry(source,matrix,()=>[1,.8,.1]),null);
 const glass=venueGlassGeometry(source,matrix,()=>[.25,.43,.49]);glass.computeBoundingBox();assert.ok(Math.abs(glass.boundingBox.min.z+1.988)<1e-5);assert.equal(glass.attributes.position.count,6);
 const pool=new THREE.PlaneGeometry(2,2).rotateX(-Math.PI/2);
 assert.equal(venueGlassGeometry(pool,new THREE.Matrix4(),()=>[.25,.43,.49],{excludeLowHorizontal:true}),null);
 const skylight=venueGlassGeometry(pool,new THREE.Matrix4().makeTranslation(0,3,0),()=>[.25,.43,.49],{excludeLowHorizontal:true});assert.ok(skylight);skylight.dispose();pool.dispose();
 source.dispose();metric.dispose();glass.dispose();
});

test('metric stone and venue shader compose without duplicate surface attributes',()=>{
 for(const id of ['ferrari_world','abrahamic']){
  const material=new THREE.MeshStandardMaterial();installVenueFinish(material,id);
  const shader={vertexShader:THREE.ShaderLib.standard.vertexShader,fragmentShader:THREE.ShaderLib.standard.fragmentShader};material.onBeforeCompile(shader,{});
  assert.equal((shader.vertexShader.match(/attribute vec3 surfacePosition;/g)||[]).length,1);
  assert.ok(shader.fragmentShader.includes('venueRaw'));assert.ok(shader.fragmentShader.includes('roughnessFactor='));
  assert.ok(!shader.fragmentShader.includes('undefined'));material.dispose();
 }
 for(const p of CULTURE_PAVILIONS)assert.ok(p.top>p.base&&p.w>4);
});

test('venue details build after assets load and restore borrowed geometry across toggles',()=>{
 const city={LM:{}},study=createAbuVenues({city,sampleColor:()=>[.25,.43,.49]});study.setEnabled(true);study.apply();assert.equal(study.stats.venues,0);
 const geo=new THREE.BoxGeometry(),material=new THREE.MeshStandardMaterial(),holder=new THREE.Group(),asset=new THREE.Group(),mesh=new THREE.Mesh(geo,material);asset.add(mesh);holder.add(asset);holder.position.set(40,1,-62);asset.scale.setScalar(2);city.LM.ferrari_world={loaded:true,asset,holder};
 let disposed=0;geo.addEventListener('dispose',()=>disposed++);material.addEventListener('dispose',()=>disposed++);
 study.apply();study.apply();assert.equal(study.stats.venues,1);assert.equal(study.stats.glassTriangles,12);assert.ok(study.stats.drawCalls<=5);assert.ok(study.stats.triangles<15000);
 const refined=mesh.geometry;assert.notEqual(refined,geo);holder.children[1].traverse(o=>{if(o.isMesh)for(const a of Object.values(o.geometry.attributes))assert.ok(a.array.every(Number.isFinite));});
 study.setEnabled(false);assert.equal(mesh.geometry,geo);study.setEnabled(true);assert.equal(mesh.geometry,refined);study.dispose();study.dispose();assert.equal(mesh.geometry,geo);assert.equal(holder.children.length,1);assert.equal(disposed,0);geo.dispose();material.dispose();
});

test('scene material styling and venue geometry have independent reversible ownership',()=>{
 const geo=new THREE.BoxGeometry(),material=new THREE.MeshStandardMaterial(),holder=new THREE.Group(),asset=new THREE.Group(),mesh=new THREE.Mesh(geo,material);asset.add(mesh);holder.add(asset);
 const ctx={rects:[],walkSurfaces:[],pools:{},buildings:[]},city={w:{root:new THREE.Group(),ctx},LM:{abrahamic:{loaded:true,asset,holder}}};
 const scene=createAbuDhabiScene({city}),venues=createAbuVenues({city});scene.setEnabled(true);venues.setEnabled(true);scene.apply();venues.apply();assert.notEqual(mesh.material,material);assert.ok(mesh.geometry.attributes.surfacePosition);
 scene.setEnabled(false);venues.setEnabled(false);assert.equal(mesh.material,material);assert.equal(mesh.geometry,geo);
 scene.setEnabled(true);venues.setEnabled(true);scene.apply();venues.apply();assert.ok(mesh.geometry.attributes.surfacePosition);
 venues.dispose();scene.dispose();assert.equal(mesh.geometry,geo);assert.equal(mesh.material,material);assert.equal(holder.children.length,1);geo.dispose();material.dispose();
});
