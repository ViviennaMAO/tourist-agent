import test from 'node:test';
import assert from 'node:assert/strict';
import {CITIES,CITY_LIBRARY,activeCheckinKeys} from '../src/cities.js';
import {INTERIORS,INTERIOR_LIBRARY} from '../src/interior-catalog.js';
import {PLACES,PLACE_BY_ID,ROOM_GUIDES,MARINA_ROUTE,mapUrl} from '../src/travel-catalog.js';
import {createPassport,createTravelEvents,PASSPORT_KEY,EVENTS_KEY} from '../src/travel-state.js';
const memory=()=>{const values=new Map();return {getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};};
test('Cooperation roster excludes archived content at every active landmark and interior boundary',()=>{
 assert.deepEqual(Object.keys(CITIES),['dubai','abudhabi']);assert.ok(CITY_LIBRARY.lasvegas);assert.equal(INTERIOR_LIBRARY.length,15);
 for(const c of Object.values(CITIES))for(const id of Object.keys(c.landmarks))assert.ok(PLACE_BY_ID.has(`${c.id}:${id}`));
 assert.equal(new Set(PLACES.map(p=>p.id)).size,PLACES.length);
 assert.deepEqual(activeCheckinKeys(['lasvegas:sphere','dubai:burj_khalifa']),['dubai:burj_khalifa']);
 for(const room of INTERIORS){assert.equal(ROOM_GUIDES[room.id].length,3);assert.ok(ROOM_GUIDES[room.id].every(s=>s.length>20));}
});
test('Place links use real destination names, never miniature coordinates or payment placeholders',()=>{
 for(const p of PLACES){assert.equal(new URL(p.official).protocol,'https:');const url=new URL(mapUrl(p.id));assert.equal(url.hostname,'www.google.com');assert.equal(url.searchParams.get('query'),p.mapQuery);assert.equal(p.partner,false);assert.ok(p.visitNote);}
 assert.equal(mapUrl('unknown:fake'),null);assert.ok(PLACE_BY_ID.get('dubai:cruise_terminal').description.includes('不把邮轮码头等同于'));
 assert.ok(MARINA_ROUTE.ids.every(id=>PLACE_BY_ID.get(id).area==='Dubai Marina'));
});
test('Legacy demo orders, balances and stamps cannot create real visits or rewards',()=>{
 const storage=memory();storage.setItem('ta_demo_pwv_balance','99999');storage.setItem('ta_demo_ticket_orders','[{"city":"dubai"}]');storage.setItem('ta_explore_checkins','["dubai:burj_khalifa"]');
 const p=createPassport(storage);assert.deepEqual(p.value,{version:1,saved:[],cloud:[]});p.cloud('dubai:burj_khalifa');
 assert.deepEqual(Object.keys(p.value),['version','saved','cloud']);assert.equal(storage.getItem('ta_demo_pwv_balance'),'99999');p.reset();assert.equal(storage.getItem('ta_demo_ticket_orders'),'[{"city":"dubai"}]');
});
test('Malformed and manipulated local saves are filtered and do not expose hidden cities',()=>{
 for(const raw of ['bad','null','[]','{"saved":"dubai"}','{"saved":["lasvegas:sphere",null,{},"<img>","dubai:burj_khalifa","dubai:burj_khalifa"],"cloud":["bad"]}']){
  const storage=memory();storage.setItem(PASSPORT_KEY,raw);const p=createPassport(storage);assert.ok(Array.isArray(p.value.saved));assert.ok(p.value.saved.every(id=>PLACE_BY_ID.has(id)));assert.ok(p.value.saved.length<=1);
 }
});
test('Saving a route is idempotent, persists across reloads and does not create cloud or verified visits',()=>{
 const storage=memory(),p=createPassport(storage);p.addRoute();p.addRoute();assert.deepEqual(p.value.saved,MARINA_ROUTE.ids);assert.deepEqual(p.value.cloud,[]);
 assert.deepEqual(createPassport(storage).value,p.value);assert.equal(p.cloud('dubai:cruise_terminal'),true);assert.equal(p.cloud('dubai:cruise_terminal'),false);assert.equal(p.cloud('lasvegas:sphere'),false);
});
test('Itinerary movement stays within a city even when saved city entries are interleaved',()=>{
 const p=createPassport(memory());for(const id of ['dubai:burj_khalifa','abudhabi:grand_mosque','dubai:atlantis'])p.toggle(id);
 assert.equal(p.move('dubai:atlantis',-1),true);assert.deepEqual(p.value.saved,['dubai:atlantis','abudhabi:grand_mosque','dubai:burj_khalifa']);
 assert.equal(p.move('dubai:atlantis',-1),false);assert.equal(p.move('abudhabi:grand_mosque',1),false);assert.equal(p.move('unknown:x',1),false);
 assert.equal(p.toggle('dubai:atlantis'),false);assert.equal(p.value.saved.includes('dubai:atlantis'),false);
});
test('Blocked browser storage preserves usable in-memory itinerary and reports persistence failure',()=>{
 const storage={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');},removeItem(){throw Error('blocked');}},p=createPassport(storage);
 p.addRoute();assert.equal(p.persistent,false);assert.equal(p.value.saved.length,3);const e=createTravelEvents(storage);e.record('route_saved');assert.equal(e.value.length,1);e.reset();assert.equal(e.value.length,0);
});
test('Pilot events record only UI actions, cap history, and never assert financial or arrival success',()=>{
 const storage=memory(),e=createTravelEvents(storage);for(const name of ['payment_confirmed','arrived','booking_confirmed','pwc_reward'])e.record(name);
 assert.equal(e.value.length,0);e.record('official_open',{place:'dubai:atlantis',email:'secret',url:'https://bad.invalid/?secret',step:100});
 assert.deepEqual(Object.keys(e.value[0]),['event','at','place']);for(let i=0;i<220;i++)e.record('place_open',{place:'dubai:burj_khalifa'});
 assert.equal(e.value.length,200);assert.equal(JSON.parse(storage.getItem(EVENTS_KEY)).length,200);
 storage.setItem(EVENTS_KEY,JSON.stringify([{event:'place_open',at:'2026-11-05T00:00:00Z',place:'dubai:atlantis',email:'unwanted'},{event:'payment_confirmed',at:'2026-11-05'},{event:'place_open',at:'invalid'}]));
 const reloaded=createTravelEvents(storage);assert.equal(reloaded.value.length,1);assert.deepEqual(Object.keys(reloaded.value[0]),['event','at','place']);
});
