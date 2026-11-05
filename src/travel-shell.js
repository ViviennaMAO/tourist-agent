import {createPassport,createTravelEvents} from './travel-state.js';
import {createTravelExperience} from './travel-experience.js';
import eva from './assets/eva-sprite-atlas-v1.png';
let storage;try{storage=localStorage;}catch{storage={getItem:()=>null,setItem(){throw new Error('Storage unavailable');},removeItem(){}};}
export const passport=createPassport(storage),travelEvents=createTravelEvents(storage);
let scene={},loader=null;
export const connectTravelScene=api=>{scene=api;};
export const connectSceneLoader=fn=>{loader=fn;};
const ensureScene=async()=>{if(!scene.openInterior&&loader)await loader();return !!scene.openInterior;};
export const travel=createTravelExperience({passport,events:travelEvents,
  onEnter(){scene.onEnter?.();},onExit(){scene.onExit?.();},onChange(){scene.onChange?.();},
  imageFor(id){return scene.imageFor?.(id)||'';},
  guideMarkup(){return `<svg viewBox="125 0 335 1024" role="img" aria-label="导游 Eva"><image href="${eva}" width="1536" height="1024"/></svg>`;},
  async onInterior(id){if(await ensureScene())scene.openInterior(id);else travel.open('place',id);},
  async onScene(id){if(await ensureScene())scene.openPlace(id);else travel.open('place',id);},
});
