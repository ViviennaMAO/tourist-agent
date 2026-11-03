import test from 'node:test';
import assert from 'node:assert/strict';
import {MARINA_PIERS, MARINA_BOATS, MARINA_CAFES, MARINA_OBSTACLES} from '../src/dubai-marina-layout.js';
import {CITIES} from '../src/cities.js';

const clear=(x,z)=>MARINA_OBSTACLES.every(o=>Math.abs(x-o.x)>o.w/2+.45||Math.abs(z-o.z)>o.d/2+.45);

test('eight smaller vessels fit separate berths without crossing piers or the quay',()=>{
 assert.equal(MARINA_BOATS.length,8);assert.equal(MARINA_PIERS.length,5);
 for(const [i,b] of MARINA_BOATS.entries()){
  // Hull bevel extends 0.09 beyond the nominal plan.
  assert.ok(b.x-b.length/2-.09>84);assert.ok(b.x+b.length/2+.09<105);
  for(const p of MARINA_PIERS)assert.ok(Math.abs(b.z-p.z)>b.width/2+p.d/2+.09);
  for(const other of MARINA_BOATS.slice(i+1))assert.ok(Math.abs(b.z-other.z)>(b.width+other.width)/2+.18);
 }
 assert.equal(new Set(MARINA_BOATS.map(b=>b.kind)).size,2);
});

test('finger piers join the walkable quay and share its walking height',()=>{
 const c=CITIES.dubai.landmarks.cruise_terminal;
 assert.deepEqual(c.walkAreas,MARINA_PIERS);
 for(const p of MARINA_PIERS){
  assert.equal(p.x-p.w/2,c.walkSurface.bounds[2]);
  assert.equal(p.height,c.walkSurface.height);
  assert.ok(p.z-p.d/2>=c.walkSurface.bounds[1]&&p.z+p.d/2<=c.walkSurface.bounds[3]);
  assert.ok(clear(83.2,p.z));
 }
});

test('ten dining terraces leave continuous waterfront routes and both arrivals open',()=>{
 assert.equal(MARINA_CAFES.length,10);
 for(let z=11;z<=43;z+=.25)assert.ok(clear(42.8,z),'west promenade '+z);
 for(let x=43;x<=83;x+=.25)assert.ok(clear(x,43.2),'south promenade '+x);
 for(let x=51;x<=76;x+=.25)assert.ok(clear(x,10.8),'north promenade '+x);
 for(let z=-10;z<=42;z+=.25)assert.ok(clear(83.2,z),'quay '+z);
 for(const id of ['waterfront_wheel','cruise_terminal'])assert.ok(clear(...CITIES.dubai.landmarks[id].arrival));
});
