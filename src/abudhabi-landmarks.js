import {buildPrayerHall,PRAYER_HALL_CUTS,installPrayerCarpet} from './mosque-prayer-hall.js';
import {buildMosqueVestibule,MOSQUE_VESTIBULE_CUTS} from './mosque-vestibule.js';
import {buildMosquePortal,MOSQUE_PORTAL_CUT} from './mosque-portal.js';
import {buildMosqueArcade,MOSQUE_ARCADE_CUTS} from './mosque-arcade.js';
import {carveGeometryBox} from './geometry-carve.js';
import {buildPalaceInterior,PALACE_ENTRANCE_CUT} from './palace-interior.js';
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {installSurfaceFinish} from './surface-finish.js';
import {chamferedBox} from './chamfered-box.js';

// Measured in the normalized holder coordinates of the existing two GLBs.
export const MOSQUE_DOMES=[{x:0,z:-6.115,y:6.48,r:2.37,h:4.17,cut:6.4},{x:0,z:-1.355,y:5,r:1.72,h:2.96,cut:4.95},{x:-5.5,z:-6.02,y:5.43,r:1.49,h:2.56,cut:5.38},{x:5.5,z:-6.02,y:5.43,r:1.49,h:2.56,cut:5.38},{x:0,z:7.055,y:3.65,r:.98,h:1.69,cut:3.6}];
export const MINARETS=[-8.925,8.925].flatMap(x=>[-1.82,7.083].map(z=>({x,z})));
export const PALACE_DOMES=[{x:0,z:-1.384,y:5.58,r:3.05,h:2.4,cut:5.56},...[[ -5.332,3.948],[-5.866,-1.384],[0,4.482],[5.332,3.948],[0,-7.249],[-5.332,-6.716],[5.866,-1.384],[5.332,-6.716]].map(([x,z])=>({x,z,y:4.72,r:.934,h:1.1,cut:4.68}))];
export function replacedRegion(id,p){
 if(id==='grand_mosque'&&MINARETS.some(t=>Math.hypot(p.x-t.x,p.z-t.z)<1.23))return true;
 return (id==='grand_mosque'?MOSQUE_DOMES:PALACE_DOMES).some(d=>p.y>d.cut&&Math.hypot(p.x-d.x,p.z-d.z)<d.r+.18);
}
// Retain original attributes/coordinates for the atlas; only the index changes.
export function refineLandmarkGeometry(source,toHolder,id){
 const geometry=source.clone(),pos=source.attributes.position,indices=source.index?.array||Array.from({length:pos.count},(_,i)=>i),keep=[],points=[];
 const metric=new Float32Array(pos.count*3);
 for(let i=0;i<pos.count;i++){const p=new THREE.Vector3().fromBufferAttribute(pos,i).applyMatrix4(toHolder);points.push(p);p.toArray(metric,i*3);}
 for(let i=0;i<indices.length;i+=3){const tri=[indices[i],indices[i+1],indices[i+2]];if(!tri.every(v=>replacedRegion(id,points[v])))keep.push(...tri);}
 geometry.setIndex(keep);geometry.clearGroups();geometry.setAttribute('surfacePosition',new THREE.BufferAttribute(metric,3));
 if(id==='emirates_palace'){const cut=carveGeometryBox(geometry,PALACE_ENTRANCE_CUT.min,PALACE_ENTRANCE_CUT.max);geometry.dispose();return cut;}
 if(id==='grand_mosque'){let result=geometry;for(const c of [...MOSQUE_ARCADE_CUTS,MOSQUE_PORTAL_CUT,...MOSQUE_VESTIBULE_CUTS,...PRAYER_HALL_CUTS]){const cut=carveGeometryBox(result,c.min,c.max);result.dispose();result=cut;}return result;}return geometry;
}
export function domeGeometry(r,h,onion=true){
 const curve=new THREE.CatmullRomCurve3((onion?[[.92,0],[.99,.16],[1,.36],[.94,.56],[.78,.76],[.5,.92],[.12,1]]:[[1,0],[.96,.22],[.82,.49],[.62,.74],[.35,.94],[.12,1]]).map(([x,y])=>new THREE.Vector3(x*r,y*h,0)));
 return new THREE.LatheGeometry([...curve.getPoints(28).map(p=>new THREE.Vector2(p.x,p.y)),new THREE.Vector2(0,h)],64);
}
export function createAbuDhabiLandmarks({city}){
 const records=[],done=new Set();let enabled=false,disposed=false;
 const stats={landmarks:0,triangles:0,drawCalls:0};
 function build(id,L){
  L.holder.updateWorldMatrix(true,true);const inv=L.holder.matrixWorld.clone().invert(),swaps=[];
  L.asset.traverse(o=>{if(o.isMesh){const before=o.geometry,after=refineLandmarkGeometry(before,new THREE.Matrix4().multiplyMatrices(inv,o.matrixWorld),id);swaps.push({o,before,after});o.geometry=enabled?after:before;}});
  const root=new THREE.Group();root.name='Abu Dhabi refined '+id;L.holder.add(root);root.visible=enabled;
  const batches=new Map(),materials=[];
  function mat(color,roughness=.5,metalness=0){const m=new THREE.MeshStandardMaterial({color,roughness,metalness,envMapIntensity:.7});materials.push(m);batches.set(m,[]);return m;}
  const white=mat(id==='grand_mosque'?'#edf0ee':'#e2d5b9',.46),stone=mat('#d9c8aa',.78),gold=mat('#a58b54',.38,.65),shade=mat('#bfb09a',.8),glass=mat('#40575e',.21,.2);
  installSurfaceFinish(stone,'limestone');installSurfaceFinish(white,'paving');
  const domeMat=mat(white.color,.46);
  domeMat.onBeforeCompile=sh=>{
   sh.vertexShader='varying vec2 domeUV;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ndomeUV=uv;');
   sh.fragmentShader='varying vec2 domeUV;\n'+sh.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    float domeU=domeUV.x*24.;float domeEdge=min(fract(domeU),1.-fract(domeU));
    float domeAA=max(fwidth(domeU),.0001);
    float domeSeam=(1.-smoothstep(.006,.006+domeAA,domeEdge))*(1.-smoothstep(.12,.5,domeAA));
    diffuseColor.rgb*=1.-domeSeam*.045;
   `);
  };domeMat.customProgramCacheKey=()=> 'abu-dome-seams-v1';
  const add=(g,m)=>{if(g.index){const old=g;g=g.toNonIndexed();old.dispose();}batches.get(m).push(g);};
  const box=(m,x,y,z,w,h,d,angle=0)=>add(chamferedBox(w,h,d,.012).rotateY(angle).translate(x,y,z),m);
  const cylinder=(m,x,y,z,rt,rb,h,n=48)=>add(new THREE.CylinderGeometry(rt,rb,h,n).translate(x,y,z),m);
  function ring(m,x,y,z,r,t=.025){add(new THREE.TorusGeometry(r,t,6,64).rotateX(Math.PI/2).translate(x,y,z),m);}
  function finial(x,y,z,scale){
   cylinder(gold,x,y+scale*.42,z,.006*scale,.055*scale,.84*scale,20);
   for(const [offset,r] of [[.16,.1],[.4,.073],[.63,.045]])add(new THREE.SphereGeometry(r*scale,20,12).translate(x,y+offset*scale,z),gold);
  }
  for(const d of id==='grand_mosque'?MOSQUE_DOMES:PALACE_DOMES){
   add(domeGeometry(d.r,d.h,id==='grand_mosque').translate(d.x,d.y,d.z),domeMat);
   cylinder(white,d.x,d.y-.045,d.z,d.r*.93,d.r*.93,.12);
   ring(shade,d.x,d.y+.015,d.z,d.r*.93,.028);ring(gold,d.x,d.y+.07,d.z,d.r*.93,.015);
   finial(d.x,d.y+d.h,d.z,d.r*.42);
  }
  if(id==='grand_mosque')for(const t of MINARETS){
   const {x,z}=t;
   box(white,x,2.16,z,1.46,4.12,1.46);
   cylinder(white,x,6.525,z,.43,.59,4.65,48);
   cylinder(white,x,10.725,z,.29,.39,3.65,48);
   cylinder(white,x,13.625,z,.2,.27,2.15,48);
   for(const [y,r] of [[4.24,.73],[8.85,.94],[12.55,.65],[14.7,.49]]){
    cylinder(white,x,y,z,r,r*.76,.18);ring(gold,x,y+.13,z,r,.018);
    ring(white,x,y+.43,z,r*.92,.032);
    for(let k=0;k<24;k++){const a=k*Math.PI/12;cylinder(white,x+Math.cos(a)*r*.92,y+.28,z+Math.sin(a)*r*.92,.018,.018,.3,6);}
    for(let k=0;k<12;k++){const a=k*Math.PI/6;box(white,x+Math.cos(a)*r*.71,y-.22,z+Math.sin(a)*r*.71,.08,.35,.12,-a);}
   }
   cylinder(white,x,15.25,z,.19,.24,1.1);
   add(domeGeometry(.38,.66).translate(x,15.77,z),white);finial(x,16.43,z,1.75);
   // Slim inset slit panels and corner trims give the lower shaft a readable scale.
   for(const a of [0,Math.PI/2,Math.PI,Math.PI*1.5]){
    for(const y of [1.15,2.6])box(shade,x+Math.sin(a)*.737,y,z+Math.cos(a)*.737,.1,.7,.018,a);
   }
  }
  if(id==='grand_mosque'){
   const arcadeMarble=mat('#edf0ee',.34);installSurfaceFinish(arcadeMarble,'paint');
   buildMosqueArcade({add,box,cylinder,white:arcadeMarble,stone,gold,shade});
   const portalTrim=mat('#edf0ee',.34);portalTrim.userData.detailNoShadow=true;
   buildMosquePortal({add,box,white:arcadeMarble,trim:portalTrim,stone,gold});
   const floor=mat('#dedbd1',.37),inlay=mat('#9d947f',.55),lamp=mat('#f3dfb3',.32);
   floor.userData.detailNoShadow=true;inlay.userData.detailNoShadow=true;lamp.userData.detailNoShadow=true;
   installSurfaceFinish(floor,'paint');lamp.emissive.set('#f3cd87');lamp.emissiveIntensity=.45;
   buildMosqueVestibule({add,box,cylinder,white:arcadeMarble,trim:portalTrim,stone,gold,floor,inlay,lamp});
   const fill=new THREE.PointLight('#ffe5b8',.65,3.8,2);fill.position.set(0,2.62,7.055);root.add(fill);fill.name='Mosque vestibule fill';
   const hallWall=mat('#eee9dc',.55),carpet=mat('#526c58',.96),hallGlass=mat('#f7e3bb',.32);
   hallWall.userData.detailNoShadow=true;carpet.userData.detailNoShadow=true;hallGlass.userData.detailNoShadow=true;
   hallWall.emissive.set('#c5ba9c');hallWall.emissiveIntensity=.09;hallGlass.emissive.set('#ffe1a3');hallGlass.emissiveIntensity=.65;
   installSurfaceFinish(hallWall,'paint');installPrayerCarpet(carpet);
   buildPrayerHall({add,box,cylinder,wall:hallWall,trim:portalTrim,gold,floor,carpet,glass:hallGlass});
   for(const z of [-5.14,-7.14]){const light=new THREE.PointLight('#ffe9c7',3.2,7,2);light.position.set(0,3.1,z);light.name='Mosque prayer hall fill';root.add(light);}

  }
  if(id==='emirates_palace'){
   buildPalaceInterior({mat,add,box,cylinder,white,stone,gold,shade});
   // The source openings are nine bays, two rows, recessed .20 behind the face.
   const centers=[-3.97,-3.187,-2.404,-.81,0,.81,2.404,3.187,3.97];
   for(let side=0;side<4;side++){
    const angle=side*Math.PI/2,place=(g,m)=>add(g.translate(0,0,7.212).rotateY(angle).translate(0,0,-1.384),m);
    const faceBox=(m,x,y,z,w,h,d)=>place(chamferedBox(w,h,d,.009).translate(x,y,z),m);
    for(const bottom of [2.307,3.432])for(const x of centers){
     const s=new THREE.Shape();s.moveTo(-.24,0);s.lineTo(.24,0);s.lineTo(.24,.55);s.quadraticCurveTo(.2,.67,0,.79);s.quadraticCurveTo(-.2,.67,-.24,.55);s.closePath();
     place(new THREE.ShapeGeometry(s,12).translate(x,bottom+.02,.012),glass);
     for(const sign of [-1,1])faceBox(stone,x+sign*.285,bottom+.3,.065,.045,.6,.1);
     const arc=new THREE.CatmullRomCurve3([new THREE.Vector3(x-.27,bottom+.56,.09),new THREE.Vector3(x-.19,bottom+.71,.09),new THREE.Vector3(x,bottom+.84,.09),new THREE.Vector3(x+.19,bottom+.71,.09),new THREE.Vector3(x+.27,bottom+.56,.09)]);
     place(new THREE.TubeGeometry(arc,18,.023,5,false),stone);
     faceBox(stone,x,bottom-.015,.055,.64,.065,.22);faceBox(gold,x,bottom+.36,.03,.014,.64,.02);
    }
    for(const y of [.16,2.23,3.32,4.55])faceBox(stone,0,y,.025,10.42,y===.16?.2:.065,.11);
    for(const x of [-5.18,-1.63,1.63,5.18]){faceBox(stone,x,3.46,.035,.1,2.1,.12);faceBox(white,x,4.55,.08,.22,.13,.2);}
    for(let x=-5.06;x<5.1;x+=.44)faceBox(stone,x,4.75,.13,.09,.13,.12);
   }
  }
  for(const [m,parts] of batches){if(!parts.length)continue;const geometry=mergeGeometries(parts);parts.forEach(g=>g.dispose());const mesh=new THREE.Mesh(geometry,m);mesh.castShadow=!m.transparent&&!m.userData.detailNoShadow;mesh.receiveShadow=true;root.add(mesh);stats.triangles+=geometry.attributes.position.count/3;stats.drawCalls++;}
  stats.landmarks++;records.push({root,swaps,materials});done.add(id);
 }
 return {stats,apply(){if(disposed)return;for(const id of ['grand_mosque','emirates_palace']){const L=city.LM?.[id];if(L?.loaded&&L.asset&&!done.has(id))build(id,L);}},setEnabled(v){enabled=!!v&&!disposed;for(const r of records){r.root.visible=enabled;r.swaps.forEach(s=>s.o.geometry=enabled?s.after:s.before);}},dispose(){if(disposed)return;this.setEnabled(false);disposed=true;for(const r of records){r.root.removeFromParent();r.root.traverse(o=>o.geometry?.dispose());r.swaps.forEach(s=>s.after.dispose());r.materials.forEach(m=>m.dispose());}}};
}
