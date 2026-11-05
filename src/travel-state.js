import {PLACE_BY_ID,MARINA_ROUTE} from './travel-catalog.js';
export const PASSPORT_KEY='ta_travel_passport_v1', EVENTS_KEY='ta_travel_events_v1';
const cleanIds = value => Array.isArray(value) ? [...new Set(value.filter(id=>typeof id==='string'&&PLACE_BY_ID.has(id)))].slice(0,50) : [];
export const normalizePassport = value => ({version:1,saved:cleanIds(value?.saved),cloud:cleanIds(value?.cloud)});
export function readPassport(storage) {try{return normalizePassport(JSON.parse(storage.getItem(PASSPORT_KEY)));}catch{return normalizePassport(null);}}
export function createPassport(storage) {
  let state=readPassport(storage),persistent=true;
  const save=()=>{try{storage.setItem(PASSPORT_KEY,JSON.stringify(state));persistent=true;}catch{persistent=false;}};
  return {
    get value(){return structuredClone(state);},get persistent(){return persistent;},
    toggle(id){if(!PLACE_BY_ID.has(id))return false;const had=state.saved.includes(id);state.saved=had?state.saved.filter(x=>x!==id):[...state.saved,id];save();return !had;},
    addRoute(){state.saved=cleanIds([...state.saved,...MARINA_ROUTE.ids]);save();},
    cloud(id){if(!PLACE_BY_ID.has(id)||state.cloud.includes(id))return false;state.cloud.push(id);save();return true;},
    move(id,delta){if(!PLACE_BY_ID.has(id)||Math.abs(delta)!==1)return false;
      const same=state.saved.filter(k=>PLACE_BY_ID.get(k).city===PLACE_BY_ID.get(id).city),at=same.indexOf(id),target=same[at+delta];
      if(at<0||!target)return false;const i=state.saved.indexOf(id),j=state.saved.indexOf(target);
      [state.saved[i],state.saved[j]]=[state.saved[j],state.saved[i]];save();return true;},
    reset(){state=normalizePassport(null);save();},
  };
}
const EVENTS=new Set(['entry_open','interest_selected','place_open','interior_open','detail_view','guide_complete','place_saved','place_removed','route_saved','itinerary_open','passport_open','map_open','official_open','scene_open']);
function cleanEvent(value){
  if(!EVENTS.has(value?.event)||!Number.isFinite(Date.parse(value.at)))return null;
  const data={event:value.event,at:new Date(value.at).toISOString()};
  if(PLACE_BY_ID.has(value.place))data.place=value.place;
  if(['waterfront','skyline','culture','family'].includes(value.interest))data.interest=value.interest;
  if(['explore','itinerary'].includes(value.entry))data.entry=value.entry;
  if(Number.isInteger(value.step)&&value.step>=0&&value.step<3)data.step=value.step;
  return data;
}
export function createTravelEvents(storage) {
  let events=[];try{const data=JSON.parse(storage.getItem(EVENTS_KEY));if(Array.isArray(data))events=data.map(cleanEvent).filter(Boolean).slice(-200);}catch{}
  return {
    record(event,detail={}){const data=cleanEvent({...detail,event,at:new Date().toISOString()});if(!data)return;
      events=[...events,data].slice(-200);try{storage.setItem(EVENTS_KEY,JSON.stringify(events));}catch{}
    },
    get value(){return structuredClone(events);},
    reset(){events=[];try{storage.removeItem(EVENTS_KEY);}catch{}},
  };
}
