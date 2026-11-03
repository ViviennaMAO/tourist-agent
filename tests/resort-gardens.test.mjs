import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {planResortGardens,createResortGardens,resortGround,hotelPlantingBounds} from '../src/resort-gardens.js';
import {inPlot,plotPoint} from '../src/island-layout.js';
import {pointInPolygon} from '../src/shore-profile.js';

function fixture(){
 const c={cx:0,cz:22,R:33,w:2.6,deg:112},A=c.deg*Math.PI/180,P=(a,r)=>[r*Math.sin(a),22+r*Math.cos(a)];
 const outline=[...Array.from({length:61},(_,i)=>P(-A+2*A*i/60,34.3)),...Array.from({length:61},(_,i)=>P(A-2*A*i/60,31.7))];
 const circle=(x,z,r)=>Array.from({length:96},(_,i)=>[x+Math.cos(i*Math.PI/48)*r,z+Math.sin(i*Math.PI/48)*r]);
 const palms=Array.from({length:28},(_,i)=>-A+.06+i*(2*A-.12)/27).filter(a=>Math.abs(a)>=.2).map(a=>({x:33*Math.sin(a),z:22+33*Math.cos(a)}));
 return {crescent:c,islands:[{outline},{outline:circle(0,55,6.5)},{outline:circle(-50,14,7)}],palms,roads:[{A:[-50,-5],B:[-50,7.6],kind:'bridge',hw:2.3}],orientedObstacles:[]};
}
const bounds=[{x:0,z:55.5,w:24.84,d:8.4924},{x:-49.9255,z:13.7919,w:8.1357,d:8.9008}];

test('crescent borders and hotel gardens stay ashore and leave entrances and inner lanes clear',()=>{
 const ctx=fixture(),beds=planResortGardens(ctx,bounds);
 assert.ok(beds.filter(b=>b.zone==='crescent').length>=20);
 assert.equal(beds.filter(b=>b.zone==='atlantis').length,4);
 assert.ok(beds.filter(b=>b.zone==='sail').length>=4);
 for(const b of beds){
  for(const u of [-1,1])for(const v of [-1,1]){
   const [x,z]=plotPoint(b,u*(b.w/2+.12),v*(b.d/2+.12));
   assert.ok(ctx.islands.some(i=>pointInPolygon(i.outline,x,z)));
   assert.ok(!bounds.some(q=>inPlot(q,x,z,.25)));
  }
  assert.ok(!ctx.palms.some(p=>inPlot(b,p.x,p.z,.38)));
 }
 for(const sign of [-1,1])for(let a=.45;a<1.88;a+=.005){
  const phi=sign*a,x=32.25*Math.sin(phi),z=22+32.25*Math.cos(phi);
  assert.ok(pointInPolygon(ctx.islands[0].outline,x,z));assert.ok(!beds.some(b=>inPlot(b,x,z,.45)),'inner lane includes full avatar clearance');
 }
 for(let z=48.7;z<51;z+=.05)assert.ok(!beds.some(b=>inPlot(b,0,z,.45)));
 for(let z=7.5;z<9.1;z+=.05)assert.ok(!beds.some(b=>inPlot(b,-50,z,.45)));
});

test('hotel planting waits for assets and restores only owned collision and rendering resources',()=>{
 const ctx=fixture(),other={x:300,z:0,w:1,d:1};ctx.orientedObstacles.push(other);
 const city={w:{root:new THREE.Group(),ctx},LM:{atlantis:{loaded:false},burj_al_arab:{loaded:false}}};
 const stone=new THREE.MeshStandardMaterial(),texture=new THREE.Texture(),g=createResortGardens({city,stoneMaterial:stone,leafTexture:texture});
 g.setEnabled(true);g.apply();assert.equal(g.beds.length,0);
 city.LM.atlantis.failed=true;city.LM.burj_al_arab.failed=true;g.apply();
 assert.ok(g.beds.length>20);assert.ok(g.stats.triangles<60000);assert.ok(g.stats.drawCalls<=7);
 for(const m of g.root.children)for(const a of Object.values(m.geometry.attributes))assert.ok(a.array.every(Number.isFinite));
 const count=ctx.orientedObstacles.length;g.apply();g.setEnabled(true);assert.equal(ctx.orientedObstacles.length,count);
 for(let i=0;i<3;i++){g.setEnabled(false);assert.deepEqual(ctx.orientedObstacles,[other]);g.setEnabled(true);assert.equal(ctx.orientedObstacles.length,count);}
 let disposed=0;stone.addEventListener('dispose',()=>disposed++);texture.addEventListener('dispose',()=>disposed++);
 g.dispose();g.dispose();assert.deepEqual(ctx.orientedObstacles,[other]);assert.equal(disposed,0);stone.dispose();texture.dispose();
});

test('hotel foundation sampling follows raised podiums and rejects large steps',()=>{
 const root=new THREE.Group();root.position.set(-345,0,-230);
 const holder=new THREE.Group();holder.position.copy(root.position);const asset=new THREE.Group();holder.add(asset);
 const mat=new THREE.MeshStandardMaterial(),platform=new THREE.Mesh(new THREE.BoxGeometry(8,.2,8).translate(0,1.8,0),mat);asset.add(platform);holder.updateMatrixWorld(true);
 const city={w:{root},LM:{atlantis:{asset,holder}}};
 const level=resortGround(city,{x:0,z:0,w:1,d:1});assert.ok(Math.abs(level.base-1.9)<.0001);assert.equal(level.base,level.foot);
 assert.equal(resortGround(city,{x:4,z:0,w:2,d:1}),null,'a large edge step cannot create floating earth');
 platform.geometry.dispose();mat.dispose();
});

test('hotel occupancy excludes only the named low platform, preserving tower clearances',()=>{
 const root=new THREE.Group();root.position.set(-345,0,-230);root.updateMatrixWorld(true);
 const holder=new THREE.Group();holder.position.set(-395,1,-215);const asset=new THREE.Group();holder.add(asset);
 const mat=new THREE.MeshStandardMaterial(),tower=new THREE.Mesh(new THREE.BoxGeometry(8,20,9),mat),floor=new THREE.Mesh(new THREE.BoxGeometry(14,.9,14),mat);floor.name='Dubai_FC_Floor';asset.add(tower,floor);
 const b=hotelPlantingBounds({w:{root},LM:{burj_al_arab:{asset,holder}}});assert.equal(b.length,1);assert.equal(b[0].w,8);assert.equal(b[0].x,-50);assert.equal(b[0].z,15);
 tower.geometry.dispose();floor.geometry.dispose();mat.dispose();
});
