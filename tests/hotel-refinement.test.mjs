import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {refineHotel,sampleHotelBay,hotelDeckHeight,hotelSurface} from '../src/hotel-refinement.js';
import {landmarkFinish} from '../src/landmark-finish.js';
import {resortGround,createResortGardens} from '../src/resort-gardens.js';

test('hotel bays require a whole flat wall and leave arch voids and corner edges empty',()=>{
 const holder=new THREE.Group();holder.position.set(100,1,-40);holder.rotation.y=.32;
 const asset=new THREE.Group();holder.add(asset);const mat=new THREE.MeshStandardMaterial();
 for(const x of [-2,2])asset.add(new THREE.Mesh(new THREE.BoxGeometry(2,5,1).translate(x,2.5,0),mat));
 holder.updateWorldMatrix(true,true);
 assert.ok(sampleHotelBay(asset,holder,2,2,0));
 assert.equal(sampleHotelBay(asset,holder,0,2,0),null,'open arch has no window');
 assert.equal(sampleHotelBay(asset,holder,1.1,2,0),null,'frame overhangs corner');
 assert.equal(sampleHotelBay(asset,holder,2,4.9,0),null,'frame crosses roof');
 const study=refineHotel({id:'atlantis',holder,asset});study.setEnabled(true);
 assert.ok(study.bays.length>0);assert.ok(study.stats.drawCalls<=6);assert.ok(study.stats.triangles<30000);
 for(const mesh of study.root.children)for(const a of Object.values(mesh.geometry.attributes))assert.ok(a.array.every(Number.isFinite));
 let disposed=0;mat.addEventListener('dispose',()=>disposed++);study.dispose();study.dispose();assert.equal(disposed,0);
 asset.children.forEach(m=>m.geometry.dispose());mat.dispose();
});

test('sail podium reprofile preserves footprint and upper silhouette, gardens sample new deck and A/B restores sources',()=>{
 const root=new THREE.Group(),holder=new THREE.Group();holder.position.set(-50,1,15);const asset=new THREE.Group();holder.add(asset);
 const mat=new THREE.MeshStandardMaterial(),floor=new THREE.Mesh(new THREE.BoxGeometry(14,.925,14).translate(0,.4625,0),mat),tower=new THREE.Mesh(new THREE.BoxGeometry(4,18,4).translate(0,9.925,0),mat);floor.name='Dubai_FC_Floor';asset.add(floor,tower);
 const source=floor.geometry,towerSource=tower.geometry,study=refineHotel({id:'burj_al_arab',holder,asset});study.setEnabled(true);
 assert.ok(Math.abs(floor.geometry.boundingBox.max.y-.58)<1e-6);assert.equal(floor.geometry.boundingBox.max.x,7);
 assert.ok(Math.abs(tower.geometry.boundingBox.min.y-.58)<1e-6);assert.ok(Math.abs(tower.geometry.boundingBox.max.y-tower.geometry.boundingBox.min.y-18)<1e-5);
 for(let y=0;y<20;y+=.01)assert.ok(hotelDeckHeight(y+.01)>hotelDeckHeight(y));
 const level=resortGround({w:{root},LM:{burj_al_arab:{holder,asset}}},{x:-55,z:12,w:.7,d:.9});assert.ok(Math.abs(level.base-1.58)<1e-6);
 for(let i=0;i<3;i++){study.setEnabled(false);assert.equal(floor.geometry,source);study.setEnabled(true);assert.notEqual(floor.geometry,source);}
 study.dispose();assert.equal(floor.geometry,source);assert.equal(tower.geometry,towerSource);source.dispose();towerSource.dispose();mat.dispose();
});

test('hotel finish chains atlas and clipping shader, while disabled gardens defer height capture',()=>{
 const texture=new THREE.Texture(),plane=new THREE.Plane(),before=new THREE.MeshStandardMaterial({map:texture,clippingPlanes:[plane]});
 let sharedDisposals=0;texture.addEventListener('dispose',()=>sharedDisposals++);
 const after=hotelSurface(landmarkFinish(before,'burj_al_arab'),'burj_al_arab',true);
 const shader={uniforms:{},vertexShader:THREE.ShaderLib.standard.vertexShader,fragmentShader:THREE.ShaderLib.standard.fragmentShader};after.onBeforeCompile(shader,{});
 assert.equal(after.map,texture);assert.equal(after.clippingPlanes.length,1);assert.ok(shader.fragmentShader.includes('#include <clipping_planes_fragment>'));
 assert.ok(shader.fragmentShader.includes('roughnessFactor=.88'));assert.ok(shader.vertexShader.includes('attribute vec3 hotelPosition'));
 after.dispose();assert.equal(sharedDisposals,0);
 const root=new THREE.Group(),city={w:{root,ctx:{islands:[{outline:[[-8,48],[8,48],[8,62],[-8,62]]}],roads:[],palms:[]}},LM:{atlantis:{failed:true},burj_al_arab:{failed:true}}};
 const gardens=createResortGardens({city,stoneMaterial:before});gardens.apply();assert.equal(gardens.beds.length,0);
 gardens.setEnabled(true);gardens.apply();assert.equal(gardens.beds.length,4);gardens.dispose();before.dispose();texture.dispose();
});
