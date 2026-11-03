import {inPlot} from '../src/island-layout.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {MARINA_PIERS,MARINA_BOATS,MARINA_CAFES,MARINA_OBSTACLES,HARBOR,WHEEL_ISLAND,polar,onQuay,inPier,MARINA_OUTLINE} from '../src/dubai-marina-layout.js';
import {pointInPolygon} from '../src/shore-profile.js';
import {CITIES} from '../src/cities.js';
const clear=(x,z)=>MARINA_OBSTACLES.every(o=>o.walkShape?!inPlot({...o,...o.walkShape},x,z,.45):Math.abs(x-o.x)>o.w/2+.45||Math.abs(z-o.z)>o.d/2+.45);
const boatPoint=(b,x,z)=>({x:b.x+Math.cos(b.yaw)*x+Math.sin(b.yaw)*z,z:b.z-Math.sin(b.yaw)*x+Math.cos(b.yaw)*z});
test('eight vessels fit inside the curved bay without hitting quay, island or neighboring piers',()=>{
 assert.equal(MARINA_BOATS.length,8);
 for(const b of MARINA_BOATS)for(let z=-b.length/2;z<=b.length/2;z+=.2)for(const x of [-b.width/2-.09,b.width/2+.09]){
  const p=boatPoint(b,x,z);assert.ok(Math.hypot(p.x-HARBOR.x,p.z-HARBOR.z)<HARBOR.inner-.1);
  assert.ok(Math.hypot(p.x-WHEEL_ISLAND.x,p.z-WHEEL_ISLAND.z)>WHEEL_ISLAND.r);
  for(const pier of MARINA_PIERS)assert.ok(!inPier(pier,p.x,p.z));
  for(const other of MARINA_BOATS)if(other!==b){const dx=p.x-other.x,dz=p.z-other.z;assert.ok(Math.abs(Math.cos(other.yaw)*dx-Math.sin(other.yaw)*dz)>other.width/2+.09||Math.abs(Math.sin(other.yaw)*dx+Math.cos(other.yaw)*dz)>other.length/2+.09);}
 }
});
test('rotated finger piers join the curved quay with no gaps in the walking surface',()=>{
 const c=CITIES.dubai.landmarks.cruise_terminal;assert.deepEqual(c.walkAreas,MARINA_PIERS);
 for(const p of MARINA_PIERS){
  assert.equal(p.height,c.walkSurface.height);
  for(let r=15.1;r<=33;r+=.1){const q=polar(r,p.angle);assert.ok(inPier(p,q.x,q.z)||pointInPolygon(MARINA_OUTLINE,q.x,q.z));}
 }
});
test('circular island and concave harbor preserve continuous edge walks and clear arrivals',()=>{
 assert.equal(MARINA_CAFES.length,10);
 for(let a=0;a<360;a++){const p=polar(19.35,a,WHEEL_ISLAND);assert.ok(clear(p.x,p.z),'island edge '+a);}
 for(let a=121;a<240;a++){const p=polar(32.55,a);assert.ok(onQuay(p.x,p.z)&&clear(p.x,p.z),'quay edge '+a);}
 for(const id of ['waterfront_wheel','cruise_terminal'])assert.ok(clear(...CITIES.dubai.landmarks[id].arrival));
 assert.ok(!pointInPolygon(MARINA_OUTLINE,HARBOR.x,HARBOR.z));
});
