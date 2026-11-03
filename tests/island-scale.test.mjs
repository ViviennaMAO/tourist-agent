import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { planIslandVillas,inPlot,plotPoint } from '../src/island-layout.js';
import { createIslandGardens } from '../src/island-gardens.js';
import { createDubaiArchitecture } from '../src/dubai-architecture.js';
import { refineLegacyBase,podiumHeight } from '../src/landmark-base.js';

// Actual source frond layout: 16 narrow capsules, alternating house/tree sides.
function fixture(){
 const ctx={fronds:[],buildings:[],palms:[],pools:{},orientedObstacles:[]};
 for(let i=0;i<8;i++)for(const sign of [-1,1]){
  const z=9+i*4,beta=(-12+46*i/7)*Math.PI/180,x=sign*1.6,dx=sign*Math.cos(beta),dz=Math.sin(beta);let L=24;
  while(L>6&&Math.hypot(x+dx*L,z+dz*L-22)>27.9)L-=.5;
  const f={A:[x,z],B:[x+dx*L,z+dz*L],r:1.6,ang:Math.atan2(-dz,dx)},fi=ctx.fronds.length;ctx.fronds.push(f);
  for(let q=0;q<2;q++){
   const u=.42+q*.42,side=(q+fi)%2?1:-1;
   ctx.buildings.push({x:x+dx*L*u-dz*side*.55,z:z+dz*L*u+dx*side*.55,w:1.9,d:1.5,h:1.25,base:1,ry:f.ang,indices:{body:ctx.buildings.length}});
   const t=.22+q*.5+.12*(fi%2);ctx.palms.push({x:x+dx*L*t+dz*side*.7,z:z+dz*L*t-dx*side*.7});
  }
 }
 return ctx;
}

test('32 enlarged island houses stay ashore, clear roots and face their side passage',()=>{
 const ctx=fixture(),plots=planIslandVillas(ctx,ctx.buildings);
 assert.equal(plots.length,32);assert.ok(plots.every(p=>p.h===2.65&&p.w>=3));
 for(const p of plots){
  assert.ok(!ctx.palms.some(t=>inPlot(p,t.x,t.z,.32)));
  const f=p.frond,dx=f.B[0]-f.A[0],dz=f.B[1]-f.A[1],L=Math.hypot(dx,dz);
  for(const [u,v] of [[-p.w/2,-p.d/2],[p.w/2,-p.d/2],[p.w/2,p.d/2],[-p.w/2,p.d/2]]){
   const [x,z]=plotPoint(p,u,v),along=((x-f.A[0])*dx+(z-f.A[1])*dz)/L,across=((x-f.A[0])*(-dz)+(z-f.A[1])*dx)/L;
   assert.ok(along>0&&along<L);assert.ok(Math.abs(across)<f.r-.1);
  }
  const [x,z]=plotPoint(p,0,p.d/2+.55);assert.ok(!inPlot(p,x,z,.45));
  const across=((x-f.A[0])*(-dz)+(z-f.A[1])*dx)/L;assert.ok(across*p.side<0,'door opens toward clear opposite shore');
 }
});

test('island planting and enlarged geometry remain finite, reversible and leave connected side routes',()=>{
 const ctx=fixture(),other={x:500,z:0,w:1,d:1};ctx.orientedObstacles.push(other);
 const city={w:{ctx,root:new THREE.Group()}},stone=new THREE.MeshStandardMaterial(),texture=new THREE.Texture();
 const architecture=createDubaiArchitecture({THREE,city,district:true,island:true});
 const g=createIslandGardens({THREE,city,plots:architecture.islandPlots,stoneMaterial:stone,leafTexture:texture});
 assert.ok(g.beds.length>=40);assert.ok(g.stats.drawCalls<=6);assert.ok(g.stats.triangles<80000);
 for(const root of [g.root,architecture.root])root.traverse(m=>{if(m.isMesh)for(const a of Object.values(m.geometry.attributes))assert.ok(a.array.every(Number.isFinite));});
 g.setEnabled(true);
 // Search a 0.1-unit grid for a collision-free route from trunk to each tip.
 for(const f of ctx.fronds){
  const dx=f.B[0]-f.A[0],dz=f.B[1]-f.A[1],L=Math.hypot(dx,dz),plot={x:f.A[0],z:f.A[1],ry:f.ang};
  let reachable=new Set(Array.from({length:23},(_,i)=>i));
  for(let t=2.5;t<L-.3;t+=.1){
   const next=new Set();
   for(let i=0;i<23;i++){
    const [x,z]=plotPoint(plot,t,(i-11)*.1);
    if(ctx.orientedObstacles.some(b=>inPlot(b,x,z,.45)))continue;
    if([i-1,i,i+1].some(j=>reachable.has(j)))next.add(i);
   }
   assert.ok(next.size>0,'passage must remain connected');reachable=next;
  }
 }
 for(let i=0;i<3;i++){g.setEnabled(false);architecture.setEnabled(false);assert.deepEqual(ctx.orientedObstacles,[other]);architecture.setEnabled(true);g.setEnabled(true);}
 let disposed=0;stone.addEventListener('dispose',()=>disposed++);texture.addEventListener('dispose',()=>disposed++);
 g.dispose();architecture.dispose();assert.deepEqual(ctx.orientedObstacles,[other]);assert.equal(disposed,0);stone.dispose();texture.dispose();
});

test('legacy podium compression preserves upper tower shape and restores original shared geometry',()=>{
 const holder=new THREE.Group();holder.position.set(41,1.25,-33);holder.rotation.y=.3;
 const asset=new THREE.Group();holder.add(asset);const mat=new THREE.MeshStandardMaterial();
 const platform=new THREE.Mesh(new THREE.BoxGeometry(16,.94,25).translate(0,.47,0),mat),tower=new THREE.Mesh(new THREE.BoxGeometry(7,14.7,8).translate(0,10.65,0),mat);asset.add(platform,tower);
 const source=platform.geometry,originalTower=tower.geometry;
 const study=refineLegacyBase({id:'emirates_towers',holder,asset});study.setEnabled(true);
 assert.notEqual(platform.geometry,source);assert.ok(platform.geometry.boundingBox.max.x<6.4);
 assert.ok(Math.abs(platform.geometry.boundingBox.max.y-.282)<.0001);
 const box=tower.geometry.boundingBox;assert.ok(Math.abs(box.max.y-box.min.y-14.7)<.001,'tower above podium keeps its height');
 for(let y=0;y<18;y+=.01)assert.ok(podiumHeight(y+.01)>podiumHeight(y),'no folded or inverted tier');
 study.dispose();assert.equal(platform.geometry,source);assert.equal(tower.geometry,originalTower);source.dispose();originalTower.dispose();mat.dispose();
});
