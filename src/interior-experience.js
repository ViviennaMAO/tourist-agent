import * as THREE from 'three';
import {createContactShadows} from './contact-shadows.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {INTERIORS,activeInteriorVisits} from './interior-catalog.js';
import {CITIES,CITY_ORDER} from './cities.js';
import {createInteriorScene,interiorOverviewShot} from './interior-scene.js';
import './interiors.css';

export function createInteriorExperience({onEnter=()=>{},onExit=()=>{}}={}){
 const dialog=document.createElement('dialog');dialog.id='interiorDialog';dialog.setAttribute('aria-label','城市室内探索');document.body.append(dialog);
 let current=null,room=null,contact=null,renderer=null,environment=null,camera=null,controls=null,last=0,city='abudhabi',previousFocus=null,overviewActive=false;const keys=new Set();
 let visits=[];try{visits=activeInteriorVisits(JSON.parse(localStorage.getItem('ta_interior_visits')||'[]'));}catch{}
 const size=()=>{if(!renderer)return;const area=dialog.querySelector('.interior-stage');if(!area)return;renderer.setSize(area.clientWidth,area.clientHeight,false);camera.aspect=area.clientWidth/Math.max(1,area.clientHeight);camera.updateProjectionMatrix();if(overviewActive&&room)frame(interiorOverviewShot(room,camera.aspect),true);};
 const observer=new ResizeObserver(size);observer.observe(dialog);
 function release(){contact?.dispose();contact=null;controls?.dispose();room?.dispose();room=null;controls=null;current=null;overviewActive=false;delete dialog.dataset.room;delete dialog.dataset.ready;keys.clear();}
 function activate(){if(dialog.open)return;previousFocus=document.activeElement;onEnter();dialog.showModal();}
 function frame(shot,isOverview=false){overviewActive=isOverview;camera.position.fromArray(shot.p);controls.target.fromArray(shot.q);controls.update();
  dialog.querySelectorAll('[data-interior-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.interiorView==='overview'?isOverview:shot===room?.entry)));
 }
 function header(title,subtitle){dialog.innerHTML=`<header class="interior-head"><div><span class="interior-kicker">室内探索 · 主题微景观</span><h2>${title}</h2><p>${subtitle}</p></div><button data-interior-close aria-label="返回城市">返回城市 ↗</button></header>`;}
 function directory(id=city){
  release();if(renderer){environment?.dispose();environment=null;renderer.dispose();renderer.forceContextLoss();renderer=null;}city=CITIES[id]?id:'abudhabi';activate();header('走进城市的另一面','每座城市 5 个空间，进入后可环绕、缩放并选择细节观察点。');
  const nav=document.createElement('nav');nav.className='interior-cities';nav.setAttribute('aria-label','室内目的地城市');
  nav.innerHTML=CITY_ORDER.map(id=>`<button data-interior-city="${id}" aria-pressed="${id===city}">${CITIES[id].nameZh} <small>${INTERIORS.filter(r=>r.city===id&&visits.includes(r.id)).length}/5 已探索</small></button>`).join('');dialog.append(nav);
  const list=document.createElement('div');list.className='interior-grid';list.innerHTML=INTERIORS.filter(r=>r.city===city).map((r,i)=>`<button class="interior-room" data-interior-room="${r.id}"><span class="interior-cover cover-${r.theme}" aria-hidden="true"><b>${String(i+1).padStart(2,'0')}</b><i></i><i></i><i></i></span><span class="interior-room-name">${r.title}</span><span class="interior-room-desc">${r.description}</span><span class="interior-room-cta">${visits.includes(r.id)?'再次进入':'进入空间'} →</span></button>`).join('');dialog.append(list);dialog.querySelector(`[data-interior-city="${city}"]`)?.focus();
 }
 function open(id){
  const spec=INTERIORS.find(r=>r.id===id);if(!spec)return false;release();activate();city=spec.city;current=spec;
  header(`${CITIES[city].nameZh} · ${spec.title}`,spec.description);
  const tools=document.createElement('div');tools.className='interior-tools';tools.innerHTML='<button data-interior-list>← 选择空间</button><button data-interior-view="overview">微景观全景</button><button data-interior-view="entry">步入室内</button>'+spec.details.map((t,i)=>`<button data-interior-detail="${i}">${t}</button>`).join('');dialog.append(tools);
  const area=document.createElement('div');area.className='interior-stage';dialog.append(area);
  const help=document.createElement('p');help.className='interior-help';help.textContent='拖动环绕 · 滚轮 / 双指缩放 · WASD 平移观察 · Esc 返回城市';dialog.append(help);
  try{
   room=createInteriorScene(spec);if(!renderer){renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;const env=new RoomEnvironment(renderer),pmrem=new THREE.PMREMGenerator(renderer);environment=pmrem.fromScene(env,.06);env.dispose();pmrem.dispose();}
   room.scene.environment=environment.texture;
   area.append(renderer.domElement);renderer.domElement.setAttribute('aria-label',spec.title+'三维场景');renderer.domElement.tabIndex=0;
   camera=new THREE.PerspectiveCamera(48,1,.08,120);controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.minDistance=.8;controls.maxDistance=90;controls.minPolarAngle=.12;controls.maxPolarAngle=Math.PI-.12;controls.enablePan=true;controls.addEventListener('start',()=>{overviewActive=false;});frame(room.entry);size();room.setInteriorView(true);contact=createContactShadows({renderer,scene:room.scene,camera});renderer.render(room.scene,camera);contact.render();
   visits=activeInteriorVisits([...visits,id]);try{localStorage.setItem('ta_interior_visits',JSON.stringify(visits));}catch{}
   dialog.dataset.room=id;dialog.dataset.ready='true';renderer.domElement.focus();return true;
  }catch(e){release();dialog.dataset.ready='false';area.textContent='这个空间暂时无法打开，请返回列表重试。';console.error(e);return false;}
 }
 function close(){if(!dialog.open)return;release();if(renderer){environment?.dispose();environment=null;renderer.dispose();renderer.forceContextLoss();renderer=null;}dialog.close();dialog.innerHTML='';delete dialog.dataset.room;delete dialog.dataset.ready;onExit();previousFocus?.focus?.();}
 dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 dialog.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-interior-close'))close();else if(b.dataset.interiorRoom)open(b.dataset.interiorRoom);else if(b.dataset.interiorCity)directory(b.dataset.interiorCity);else if(b.hasAttribute('data-interior-list'))directory();else if(b.dataset.interiorView&&room)frame(b.dataset.interiorView==='overview'?interiorOverviewShot(room,camera.aspect):room.entry,b.dataset.interiorView==='overview');else if(b.hasAttribute('data-interior-detail')&&room)frame(room.points[Number(b.dataset.interiorDetail)]);});
 dialog.addEventListener('keydown',e=>{if(room&&['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)){keys.add(e.code);e.preventDefault();e.stopPropagation();}if(e.code==='Escape'){e.preventDefault();e.stopPropagation();close();}});
 dialog.addEventListener('keyup',e=>keys.delete(e.code));dialog.addEventListener('focusout',()=>keys.clear());const blur=()=>keys.clear();addEventListener('blur',blur);
 return {get active(){return dialog.open;},open,directory,close,update(now){const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;if(!room||!renderer)return;
   const dx=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0),dz=(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0);
   if(dx||dz){overviewActive=false;const shift=new THREE.Vector3(dx,0,dz).normalize().multiplyScalar(dt*3);const next=controls.target.clone().add(shift);if(Math.abs(next.x)<8&&Math.abs(next.z)<6){camera.position.add(shift);controls.target.copy(next);}}
   controls.update();room.setInteriorView(!overviewActive&&camera.position.y<6.5);room.update(now/1000);renderer.render(room.scene,camera);contact?.render();},dispose(){close();observer.disconnect();removeEventListener('blur',blur);dialog.remove();}};
}
