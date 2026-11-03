import * as THREE from 'three';
import {archPoint} from './pointed-arch.js';

// Measured from the source GLB after its 18-unit height normalization.
export const MOSQUE_ARCADE_CUTS=[-1,1].map(sign=>({
 min:[sign<0?-7.16:3.22,-.025,7.29],max:[sign<0?-3.22:7.16,2.765,7.55]
}));
export function buildMosqueArcade({add,box,cylinder,white,stone,gold,shade}){
 const z=7.535,spring=1.026,r=.438,rise=.675;
 const mould=(x,offset,m,tube)=>{
  const points=[];for(let i=0;i<=48;i++){const p=archPoint(i/48,r,rise,offset);points.push(new THREE.Vector3(x+p.x,spring+p.y,z+.035));}
  add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),48,tube,6,false),m);
 };
 for(const sign of [-1,1]){
  for(const center of [3.878,5.186,6.494]){
   const x=sign*center,shape=new THREE.Shape();
   shape.moveTo(-.654,0);shape.lineTo(-.654,2.639);shape.lineTo(.654,2.639);shape.lineTo(.654,0);shape.lineTo(r,0);shape.lineTo(r,spring);
   for(let i=1;i<=48;i++){const p=archPoint(i/48,r,rise);shape.lineTo(p.x,p.y+spring);}shape.lineTo(-r,0);shape.closePath();
   add(new THREE.ExtrudeGeometry(shape,{depth:.232,bevelEnabled:false,curveSegments:24}).translate(x,0,7.303),white);
   mould(x,0,white,.022);mould(x,.065,stone,.018);
   for(const s of [-1,1]){
    cylinder(white,x+s*(r+.055),.55,z+.055,.044,.055,1.02,20);
    box(white,x+s*(r+.055),.075,z+.055,.14,.15,.17);
    cylinder(gold,x+s*(r+.055),1.055,z+.055,.078,.052,.09,20);
   }
   // Shallow eight-petal stone rosette, with an actual recessed shadow gap.
   add(new THREE.TorusGeometry(.155,.014,6,32).translate(x,2.24,z+.027),shade);
   for(let k=0;k<8;k++){
    const a=k*Math.PI/4;
    add(new THREE.SphereGeometry(.028,8,5).scale(1,2.3,.45).rotateZ(-a).translate(x+Math.sin(a)*.084,2.24+Math.cos(a)*.084,z+.045),white);
   }
  }
  // Layered coping and small dentils replace a single broad blank fascia.
  box(white,sign*5.19,2.66,7.46,3.96,.065,.36);
  box(stone,sign*5.19,2.735,7.46,3.99,.045,.39);
  for(let x=3.37;x<7.07;x+=.22)box(white,sign*x,2.6,7.58,.065,.09,.09);
 }
 // Portal surround stays outside the existing doorway; no opaque door panel.
 for(const sign of [-1,1]){
  box(white,sign*1.25,1.66,8.56,.12,3.1,.13);
  box(stone,sign*1.15,1.66,8.55,.025,3.02,.07);
  box(white,sign*1.25,.12,8.6,.22,.22,.22);
  for(let y=.55;y<2.8;y+=.42){
   const path=new THREE.CatmullRomCurve3([new THREE.Vector3(sign*1.01,y-.15,8.544),new THREE.Vector3(sign*.93,y,8.55),new THREE.Vector3(sign*1.01,y+.15,8.544)]);
   add(new THREE.TubeGeometry(path,14,.009,4,false),stone);
   for(const dx of [-.04,.04])add(new THREE.SphereGeometry(.018,6,4).scale(1,2.2,.35).rotateZ(dx>0?-.7:.7).translate(sign*.97+dx,y+.03,8.56),gold);
  }
 }
 for(const [y,w,d] of [[3.15,2.62,.15],[3.245,2.73,.21]])box(white,0,y,8.56,w,.075,d);
}
