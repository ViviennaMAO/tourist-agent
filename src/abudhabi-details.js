import * as THREE from 'three';
import {archPoint} from './pointed-arch.js';
import {createCurvedLeaf} from './curved-leaf.js';

// Keep the palace arrival at (-54, 13), its central axis and the Corniche clear.
export const PALACE_BEDS=[-63,-47.5].flatMap(x=>[16,25].map(z=>({x,z,w:4.2,d:5.2})));
export const ARCADE_COLUMNS=[-29,-26.5,-24,-21.5,-8.5,-6,-3.5,-1].map(x=>({x,z:36.7,w:.38,d:.38}));
export const ABU_DETAIL_OBSTACLES=[...PALACE_BEDS,...ARCADE_COLUMNS];
export const palaceGarden=(x,z)=>(x>=-69&&x<=-43&&z>=11&&z<=30)||(x>=-57&&x<=-51&&z>=9.3&&z<11);
export function palaceShrubPosition(index){
 const b=PALACE_BEDS[index%4],t=Math.floor(index/4)*2.399963;
 return [b.x+Math.cos(t)*1.25,1.64,b.z+Math.sin(t)*1.9];
}

/** Adds batched geometry; the parent owns materials, buffers and navigation. */
export function buildAbuDetails({add,box,marble,paving,pavingWarm,inlay,stone,trim,bronze,green,flower,soil}){
 const column=(x,z)=>{
  add(new THREE.CylinderGeometry(.11,.15,2.05,16).translate(x,2.17,z),marble);
  box(marble,x,1.18,z,.38,.16,.38);box(trim,x,3.23,z,.36,.13,.36);
  add(new THREE.CylinderGeometry(.22,.12,.19,16).translate(x,3.08,z),bronze);
  for(let i=0;i<8;i++){const a=i*Math.PI/4;add(new THREE.SphereGeometry(.055,6,4).scale(1,2.4,.6).rotateY(a).translate(x+Math.cos(a)*.16,3.16,z+Math.sin(a)*.16),marble);}
 };
 for(const xs of [[-29,-26.5,-24,-21.5],[-8.5,-6,-3.5,-1]]){
  for(const x of xs)column(x,36.7);
  for(let i=0;i<xs.length-1;i++){
   const x=(xs[i]+xs[i+1])/2,shape=new THREE.Shape();
   shape.moveTo(-1.25,0);shape.lineTo(-1.25,1.18);shape.lineTo(1.25,1.18);shape.lineTo(1.25,0);
   for(let n=1;n<=32;n++){const p=archPoint(n/32,1.25,.94);shape.lineTo(p.x,p.y);}shape.closePath();
   add(new THREE.ExtrudeGeometry(shape,{depth:.24,bevelEnabled:true,bevelSize:.012,bevelThickness:.012,bevelSegments:1,steps:1}).translate(x,3.23,36.56),marble);
   // Recessed ceiling is separate from the arch face: direct light and shadow
   // can describe the depth instead of a dark painted rectangle.
   box(marble,x,4.34,36.04,2.5,.14,1.65);
   box(trim,x,4.46,36.04,2.56,.09,1.74);
   box(bronze,x,4.53,36.86,2.5,.025,.025);
  }
 }
 // Palace forecourt: a clear axial approach with four planted parterres.
 box(trim,-56,1.025,20.5,26,.05,19);
 box(paving,-54,1.045,10,6,.07,3);
 for(let z=11.6;z<30;z+=1.2)for(let x=-68.4;x<-43;x+=1.2)box((Math.round(x*5+z*7)%5===0)?pavingWarm:paving,x,1.061,z,1.19,.018,1.19);
 for(const x of [-57,-51])box(stone,x,1.075,20.5,.11,.025,19);
 // Quiet inlaid compass medallion and drainage at the entrance edge.
 for(const r of [1.38,1.6])add(new THREE.RingGeometry(r,r+.035,64).rotateX(-Math.PI/2).translate(-54,1.078,20.5),inlay);
 const star=new THREE.Shape();for(let k=0;k<16;k++){const a=k*Math.PI/8,r=k%2?.48:1.12;k?star.lineTo(Math.cos(a)*r,Math.sin(a)*r):star.moveTo(Math.cos(a)*r,Math.sin(a)*r);}star.closePath();
 add(new THREE.ShapeGeometry(star).rotateX(-Math.PI/2).translate(-54,1.079,20.5),inlay);
 for(const x of [-57,-51])for(let z=10;z<12;z+=.12)box(inlay,x,1.084,z,.2,.008,.035);
 for(const z of [11.1,29.8])box(inlay,-54,1.079,z,6,.008,.06);
 const leaf=createCurvedLeaf(THREE,.16,.75,true);
 for(const [i,b] of PALACE_BEDS.entries()){
  box(stone,b.x,1.2,b.z,b.w,.35,b.d);box(soil,b.x,1.385,b.z,b.w-.18,.025,b.d-.18);
  // Low hedges delineate the garden; flower tips break their regular outline.
  for(let n=0;n<240;n++){
   const side=n%4,t=((n*37)%59)/59-.5;
   const x=b.x+(side<2?t*(b.w-.35):(side===2?-1:1)*(b.w/2-.25));
   const z=b.z+(side<2?(side===0?-1:1)*(b.d/2-.25):t*(b.d-.35));
   const y=1.52+((n*17)%31)/31*.42;
   add(leaf.clone().rotateX(-.45+(n%5)*.21).rotateY(n*2.399).translate(x,y,z),green);
   if(n%8===0)add(new THREE.SphereGeometry(.055,5,3).translate(x,y+.12,z),flower);
  }
  // Low, overlapping groundcover hides broad exposed soil without a solid
  // green block. Keep the taller border and cypress silhouettes readable.
  for(let n=0;n<520;n++){
   const x=b.x+(((n*.6180339+i*.17)%1)-.5)*(b.w-.65);
   const z=b.z+(((n*.4142136+i*.11)%1)-.5)*(b.d-.65);
   const y=1.49+((n*13)%29)/29*.17;
   add(leaf.clone().scale(1.35,1.35,1.35).rotateX(-1.1+(n%4)*.2).rotateY(n*2.399).translate(x,y,z),green);
   if(n%13===0)add(new THREE.SphereGeometry(.045,5,3).translate(x,y+.12,z),flower);
  }
  // Narrow ornamental cypress provides vertical garden structure.
  const tx=b.x,tz=b.z+(i%2?1:-1)*.8;
  add(new THREE.CylinderGeometry(.045,.075,1.6,8).translate(tx,2.05,tz),bronze);
  for(let n=0;n<240;n++){
   const t=n/240,a=n*2.4,r=.46*Math.sin(Math.PI*t)*(.8+(n%3)*.1);
   add(leaf.clone().rotateY(a).rotateZ(.3).translate(tx+Math.cos(a)*r,1.8+t*2.4,tz+Math.sin(a)*r),green);
  }
 }
 leaf.dispose();
}
