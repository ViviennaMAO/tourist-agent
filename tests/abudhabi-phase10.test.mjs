import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {ABU_COAST} from '../src/abudhabi-coastline.js';
import {planAbuCoastGardens,createAbuCoastGardens} from '../src/abudhabi-coast-gardens.js';
import {pointInPolygon} from '../src/shore-profile.js';
import {refineLandmarkGeometry} from '../src/abudhabi-landmarks.js';

test('Coastal planting remains on land and clear of canal mouths, reservations and outer walking lane',()=>{
 const reserved=[{x:-45,z:47,w:4,d:4}],ctx={islands:[{id:'mainland',outline:ABU_COAST}],rects:[],circles:[],roads:[{A:[10,-4],B:[10,48.5],hw:3},{A:[-22,-26],B:[-74.5,-26],hw:3}],groundY:()=>1};
 const plots=planAbuCoastGardens(ctx,reserved);assert.ok(plots.length>25);assert.ok(plots.filter(p=>p.z>46).length>=8);
 assert.deepEqual(plots,planAbuCoastGardens(ctx,reserved));
 for(const p of plots){
  for(const s of [-1,1])for(const t of [-1,1])assert.ok(pointInPolygon(ABU_COAST,p.x+s*(p.w/2+.5),p.z+t*(p.d/2+.5)));
  assert.ok(Math.abs(p.x+45)>(p.w+4)/2+.69||Math.abs(p.z-47)>(p.d+4)/2+.69);
  for(const r of ctx.roads){const dx=r.B[0]-r.A[0],dz=r.B[1]-r.A[1],t=Math.max(0,Math.min(1,((p.x-r.A[0])*dx+(p.z-r.A[1])*dz)/(dx*dx+dz*dz)));assert.ok(Math.hypot(p.x-r.A[0]-t*dx,p.z-r.A[1]-t*dz)>r.hw+Math.hypot(p.w,p.d)/2+1.9);}
 }
 // Sample the actual outer lane center; include the player's .35-unit radius.
 for(let i=0;i<ABU_COAST.length;i++){
  const a=ABU_COAST[i],b=ABU_COAST[(i+1)%ABU_COAST.length],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),x=(a[0]+b[0])/2-dz/len*1.1,z=(a[1]+b[1])/2+dx/len*1.1;
  for(const p of plots)assert.ok(Math.abs(x-p.x)>p.w/2+.35||Math.abs(z-p.z)>p.d/2+.35,'coastal lane blocked');
 }
});

test('Coast gardens remove only their own collisions and keep borrowed leaf texture alive',()=>{
 const old={x:0,z:0,w:3,d:3},ctx={islands:[{id:'mainland',outline:ABU_COAST}],rects:[old],roads:[],groundY:()=>1},city={w:{ctx,root:new THREE.Group()}},texture=new THREE.Texture();let disposed=0;texture.addEventListener('dispose',()=>disposed++);
 const study=createAbuCoastGardens({city,leafTexture:texture});study.setEnabled(true);assert.equal(ctx.rects.length,1+study.plots.length);study.setEnabled(true);assert.equal(ctx.rects.length,1+study.plots.length);
 study.setEnabled(false);assert.deepEqual(ctx.rects,[old]);study.setEnabled(true);study.dispose();study.dispose();assert.deepEqual(ctx.rects,[old]);assert.equal(disposed,0);assert.equal(city.w.root.children.length,0);texture.dispose();
});

test('Mosque arcade surgery cuts the measured wall and preserves neighboring portal and rear wall',()=>{
 const g=new THREE.BufferGeometry(),vertices=[3.4,.4,7.4, 4,.4,7.4, 3.4,1,7.4, 1,.4,8.5, 1.2,.4,8.5, 1,.6,8.5, 3.4,.4,6.8, 4,.4,6.8, 3.4,1,6.8];
 g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.computeVertexNormals();
 const next=refineLandmarkGeometry(g,new THREE.Matrix4(),'grand_mosque');assert.equal(next.attributes.position.count,6);assert.deepEqual(Array.from(next.attributes.position.array),Array.from(new Float32Array(vertices.slice(9))));assert.equal(g.attributes.position.count,9);g.dispose();next.dispose();
});
