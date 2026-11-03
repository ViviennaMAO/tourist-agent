import * as THREE from 'three';
import {installSurfaceFinish} from './surface-finish.js';
import {archPoint} from './pointed-arch.js';

export const PALACE_ENTRANCE_CUT={min:[-5.22,-.1,4.75],max:[5.22,2.24,9.1]};
function interiorLight(m){
 const before=m.onBeforeCompile,key=m.customProgramCacheKey();
 m.onBeforeCompile=function(sh,r){before.call(this,sh,r);sh.vertexShader='varying vec3 palaceRoomPoint;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\npalaceRoomPoint=position;');
  sh.fragmentShader='varying vec3 palaceRoomPoint;\n'+sh.fragmentShader.replace('#include <lights_fragment_end>',`#include <lights_fragment_end>
   vec3 p=palaceRoomPoint;vec3 lamp=vec3(clamp(p.x,-3.5,3.5),1.95,5.5)-p;
   vec3 n=inverseTransformDirection(normal,viewMatrix);
   float falloff=1./(1.+dot(lamp,lamp)*1.8);
   float facing=.25+.75*max(dot(n,normalize(lamp+vec3(.0001))),0.);
   reflectedLight.indirectDiffuse+=diffuseColor.rgb*(vec3(.18,.21,.24)*exp(-max(5.9-p.z,0.)*.9)+vec3(.74,.46,.20)*falloff*facing);
  `);
 };m.customProgramCacheKey=()=>key+'-palace-room-fill-v1';
}
export function buildPalaceInterior({mat,add,box,cylinder,white,stone,gold,shade}){
 const wall=mat('#c9b58e',.85),wood=mat('#654b36',.68),fabric=mat('#a49472',.95),floor=mat('#ddd1b5',.48),dark=mat('#4c453a',.8),light=mat('#f1d5a0',.4);
 installSurfaceFinish(wood,'wood');installSurfaceFinish(wall,'limestone');installSurfaceFinish(floor,'paving');
 for(const m of [wall,wood,fabric,floor,dark])interiorLight(m);
 light.emissive.set('#efbd76');light.emissiveIntensity=.65;
 // Separate back and side walls, floor and ceiling give the room true depth.
 box(wall,0,1.16,4.82,10.4,2.17,.14);box(floor,0,.075,5.5,10.4,.13,1.5);box(floor,0,.075,7.3,3.8,.13,2.8);
 box(white,0,2.18,5.5,10.4,.12,1.5);
 for(const x of [-5.15,5.15])box(wall,x,1.15,5.5,.14,2.15,1.5);
 for(const x of [-3.4,0,3.4]){
  box(wood,x,1.18,4.91,2.5,1.85,.055);
  for(let u=-1.1;u<1.2;u+=.22)box(gold,x+u,1.18,4.95,.012,1.7,.015);
  cylinder(gold,x,1.89,5.55,.025,.025,.48,12);
  cylinder(light,x,1.63,5.55,.14,.21,.18,24);
  box(wood,x,x===0?.54:.31,5.42,x===0?1.9:.9,x===0?.68:.4,.58);
  box(stone,x,x===0?.9:.55,5.42,x===0?2.04:1.02,.075,.68);
  if(x===0){box(dark,-.48,1.05,5.48,.28,.25,.04);box(gold,.52,.99,5.5,.3,.07,.22);}
  else for(const side of [-1,1]){
   const u=x+side*.85;box(fabric,u,.39,5.6,.57,.2,.6);box(fabric,u,.64,5.31,.57,.55,.12);
   for(const dx of [-.2,.2])for(const dz of [-.2,.2])box(wood,u+dx,.2,5.6+dz,.045,.3,.045);
  }
 }
 // The center portal stays visually open. Side glazing is deliberately faint.
 const pane=mat('#bdd0c9',.18);pane.transparent=true;pane.opacity=.12;pane.depthWrite=false;pane.side=THREE.DoubleSide;
 for(const x of [-3.55,3.55]){
  add(new THREE.PlaneGeometry(2.4,1.7).translate(x,1.05,5.94),pane);
  for(const dx of [-1.25,0,1.25])box(gold,x+dx,1.11,5.97,.035,1.9,.045);
  box(stone,x,.17,5.95,2.64,.1,.21);box(stone,x,2.07,5.95,2.64,.12,.21);
 }
 // New projecting entry canopy uses actual open arches, instead of the old
 // blocked triangular door faces. All pieces stay inside the landmark envelope.
 for(const x of [-1.7,1.7]){
  for(const z of [6.1,8.45]){cylinder(white,x,.92,z,.12,.16,1.66,20);box(stone,x,.13,z,.42,.19,.42);box(gold,x,1.75,z,.34,.12,.34);}
 }
 const arch=new THREE.Shape();arch.moveTo(-1.7,0);arch.lineTo(-1.7,.54);arch.lineTo(1.7,.54);arch.lineTo(1.7,0);
 for(let i=1;i<=32;i++){const p=archPoint(i/32,1.7,.4);arch.lineTo(p.x,p.y);}arch.closePath();
 add(new THREE.ExtrudeGeometry(arch,{depth:.18,bevelEnabled:true,bevelThickness:.01,bevelSize:.01,bevelSegments:1}).translate(0,1.78,8.35),stone);
 box(white,0,2.31,7.35,3.8,.14,2.6);box(stone,0,2.42,7.35,3.94,.09,2.72);
 box(gold,0,2.25,8.69,3.75,.025,.025);
 for(const x of [-1.45,1.45]){box(wood,x,1.04,6.13,.12,1.98,.15);box(gold,x,1.05,6.23,.025,1.82,.02);}
 box(wood,0,2.04,6.13,3.03,.12,.15);
 // Shallow threshold, coffered underside and framed carpet inside the portal.
 box(floor,0,.12,8.66,3.9,.08,.25);box(dark,0,.147,7.14,2.5,.012,1.2);
 for(const x of [-1.28,1.28])box(gold,x,.155,7.14,.025,.009,1.23);
 for(const z of [6.53,7.75])box(gold,0,.155,z,2.59,.009,.025);
 for(const z of [6.3,7.3,8.3])box(wood,0,2.1,z,3.25,.045,.045);
 for(const x of [-.8,.8])box(wood,x,2.1,7.3,.035,.045,2.1);
 cylinder(gold,0,1.96,7.3,.018,.018,.25,10);cylinder(light,0,1.8,7.3,.15,.21,.17,24);
}
