import * as THREE from 'three';
import {mosquePortalGeometry,mosquePortalPath} from './mosque-portal.js';

// Source GLB measurements in the normalized landmark holder, not city space.
export const MOSQUE_SIDE_BAYS=[-1.8935,1.8935];
export const MOSQUE_VESTIBULE_CUTS=[
 {min:[-.716,-.025,5.579],max:[.716,2.173,5.94]},
 ...MOSQUE_SIDE_BAYS.flatMap(x=>[
  {min:[x-.548,-.025,7.436],max:[x+.548,2.174,7.721]},
  {min:[x-.548,-.025,6.388],max:[x+.548,2.174,6.673]}
 ])
];
export function sideBayPath(){
 const points=mosquePortalPath().getPoints(32);
 return points.map(p=>new THREE.Vector2(p.x*.628,p.y*(1.728/2.011)));
}
export function sideBayGeometry(x,z){
 const shape=new THREE.Shape();shape.moveTo(-.547,0);shape.lineTo(-.547,2.173);shape.lineTo(.547,2.173);shape.lineTo(.547,0);
 for(const p of sideBayPath())shape.lineTo(p.x,p.y);shape.closePath();
 return new THREE.ExtrudeGeometry(shape,{depth:.282,bevelEnabled:false}).translate(x,0,z);
}
export function buildMosqueVestibule({add,box,cylinder,white,trim,stone,gold,floor,inlay,lamp}){
 // Matching rear opening removes the faceted silhouette visible through the entry.
 add(mosquePortalGeometry().translate(0,0,5.58-8.17),white);
 for(const x of MOSQUE_SIDE_BAYS)for(const z of [6.39,7.438])add(sideBayGeometry(x,z),white);
 function outline(points,x,z,material,r){
  add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(x+p.x,p.y,z))),48,r,5,false),material);
 }
 for(const z of [5.562,5.96]){
  outline(mosquePortalPath().getPoints(32).map(p=>new THREE.Vector2(p.x*1.06,p.y+.012)),0,z,trim,.022);
  for(const x of [-.736,.736])box(trim,x,1.09,z,.045,2.18,.065);
  box(trim,0,2.185,z,1.51,.045,.065);
 }
 for(const x of MOSQUE_SIDE_BAYS){
  for(const z of [6.372,6.69,7.42,7.738]){
   outline(sideBayPath().map(p=>new THREE.Vector2(p.x*1.06,p.y+.012)),x,z,trim,.02);
   outline(sideBayPath().map(p=>new THREE.Vector2(p.x*1.18,p.y+.018)),x,z,stone,.011);
  }
  for(const z of [6.37,7.74]){
   for(const sign of [-1,1]){
    cylinder(trim,x+sign*.417,.5,z,.026,.034,.94,16);
    cylinder(gold,x+sign*.417,1.003,z,.046,.03,.065,16);
    box(trim,x+sign*.417,.065,z,.095,.13,.1);
   }
   box(trim,x,2.175,z,1.11,.045,.07);
  }
  // Paving spans the side passage without a raised threshold or closed panel.
  box(floor,x,.037,7.055,1.08,.026,1.36);
 }
 // Existing vestibule is 2.56 wide, from z=5.94 to 8.17, below its dome.
 box(floor,0,.037,7.055,2.55,.026,2.25);
 for(const x of [-1.15,1.15])box(inlay,x,.052,7.055,.028,.004,2.16);
 for(const z of [6.04,8.08])box(inlay,0,.052,z,2.32,.004,.028);
 // Non-shadowing inset strips avoid sub-pixel shadow acne on the pale floor.
 for(const z of [6.5,7.1,7.7])box(inlay,0,.053,z,2.25,.006,.008);
 for(const x of [-1.246,1.246]){
  box(trim,x,.095,7.055,.048,.19,2.19);
  box(stone,x,.205,7.055,.055,.025,2.19);
  // Paired shallow pilasters leave the central sightline open.
  for(const z of [6.2,7.9]){
   box(trim,x,1.55,z,.065,2.6,.11);
   box(trim,x,2.88,z,.09,.09,.19);
   box(gold,x,2.8,z,.07,.026,.15);
  }
 }
 box(white,0,3.106,7.055,2.54,.065,2.2);
 for(const x of [-1.16,1.16])box(trim,x,3.04,7.055,.065,.07,2.09);
 for(const z of [6.05,7.055,8.06])box(trim,0,3.04,z,2.36,.07,.065);
 for(const z of [6.55,7.56]){
  box(gold,0,3.063,z,1.7,.008,.013);
  cylinder(gold,0,2.84,z,.009,.009,.39,8);
  cylinder(gold,0,2.635,z,.1,.13,.045,24);
  add(new THREE.SphereGeometry(.085,20,12).scale(1,1.45,1).translate(0,2.51,z),lamp);
  cylinder(gold,0,2.39,z,.04,.06,.04,16);
 }
}
