import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {createCurvedLeaf} from './curved-leaf.js';
import {installSurfaceFinish} from './surface-finish.js';
import {installLeafDaylight} from './leaf-daylight.js';
import {ABU_OBSTACLES} from './abudhabi-layout.js';
import {ABU_DETAIL_OBSTACLES} from './abudhabi-details.js';

export function clearUrbanPlot(ctx,p,extra=[]){
 const radius=Math.hypot(p.w,p.d)/2;
 if((ctx.circles||[]).some(q=>Math.hypot(p.x-q.x,p.z-q.z)<q.r+radius+.65))return false;
 if([...(ctx.rects||[]),...extra].some(q=>Math.abs(p.x-q.x)<(p.w+q.w)/2+.6&&Math.abs(p.z-q.z)<(p.d+q.d)/2+.6))return false;
 if((ctx.roads||[]).some(q=>{const dx=q.B[0]-q.A[0],dz=q.B[1]-q.A[1],l=dx*dx+dz*dz,t=Math.max(0,Math.min(1,((p.x-q.A[0])*dx+(p.z-q.A[1])*dz)/(l||1)));return Math.hypot(p.x-q.A[0]-t*dx,p.z-q.A[1]-t*dz)<(q.hw||1.8)+radius+.7;}))return false;
 return Math.abs(p.x)+p.w/2<69&&p.z-p.d/2>-77&&p.z+p.d/2<36;
}
export function planAbuPublicRealm(ctx){
 const candidates=[];
 for(const x of [-14,0])candidates.push({x,z:-1,w:4.6,d:2.8,kind:'pergola'});
 for(const z of [-12,-22,-33])for(const x of [-26,26])candidates.push({x,z,w:2.1,d:3.4,kind:'garden'});
 for(const x of [-62,-50,-38,-26,-14])candidates.push({x,z:-49,w:4.4,d:1.8,kind:'garden'});
 for(const x of [-22,-10,2,14,24])candidates.push({x,z:1,w:3.4,d:1.8,kind:'garden'});
 for(const [x,z] of [[-66,-15],[-66,7],[-39,-12],[-67,32],[2,18],[2,29],[21,-39],[-21,-39],[62,-70],[65,-53],[67,16],[66,30],[-57,-73],[-40,-73],[-20,-73]])candidates.push({x,z,w:3.4,d:2.4,kind:'garden'});
 const selected=[];
 // Only the source's .96 m shrub reservations may yield to a seating court.
 // The shrub renderer receives the accepted courts and removes/restores those instances.
 for(const p of candidates){
  const layout=p.kind==='pergola'?{...ctx,rects:(ctx.rects||[]).filter(q=>Math.abs(q.w-.96)>.001||Math.abs(q.d-.96)>.001)}:ctx;
  if(clearUrbanPlot(layout,p,[...ABU_OBSTACLES,...ABU_DETAIL_OBSTACLES,...selected]))selected.push({...p,y:ctx.groundY?.(p.x,p.z)||1});
 }return selected;
}
export function createAbuPublicRealm({city,leafTexture}){
 const ctx=city.w.ctx,root=new THREE.Group();root.name='Abu Dhabi — lake gardens and shaded seating';city.w.root.add(root);
 const plots=planAbuPublicRealm(ctx),owned=[],batches=new Map();let enabled=false,registered=false,disposed=false;
 const mat=(color,roughness=.8,metalness=0)=>{const m=new THREE.MeshStandardMaterial({color,roughness,metalness});owned.push(m);batches.set(m,[]);return m;};
 const stone=mat('#d0c3aa'),paving=mat('#cec6b7'),wood=mat('#7e6245'),metal=mat('#626359',.45,.65),soil=mat('#665d45'),leafMat=mat('#b9c69e',.9),white=mat('#eee7ca'),pink=mat('#ab527a'),lamp=mat('#e9cd92',.5);
 installSurfaceFinish(stone,'limestone');installSurfaceFinish(paving,'paving');installSurfaceFinish(wood,'wood');leafMat.map=leafTexture||null;leafMat.side=THREE.DoubleSide;leafMat.alphaTest=.42;installLeafDaylight(leafMat);lamp.emissive.set('#e4b872');lamp.emissiveIntensity=.3;
 const add=(g,m)=>{if(g.index){const a=g;g=g.toNonIndexed();a.dispose();}batches.get(m).push(g);};
 const box=(m,x,y,z,w,h,d)=>add(new THREE.BoxGeometry(w,h,d).translate(x,y,z),m);
 const leaf=createCurvedLeaf(THREE,.13,.8,true);let trees=0;
 let seed=7351;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 function branch(a,b,r){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),v=bv.clone().sub(av),g=new THREE.CylinderGeometry(r*.55,r,v.length(),7);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize()));g.translate(...av.add(bv).multiplyScalar(.5).toArray());add(g,wood);}
 for(const [i,p] of plots.entries()){
  const {x,z,y}=p;
  if(p.kind==='pergola'){
   box(paving,x,y+.018,z,p.w+.6,.036,p.d+.6);
   for(const dx of [-2.1,2.1])for(const dz of [-1.1,1.1]){box(stone,x+dx,y+.14,z+dz,.3,.28,.3);box(wood,x+dx,y+1.65,z+dz,.085,3.1,.085);}
   for(const dz of [-1.15,1.15])box(wood,x,y+3.2,z+dz,4.55,.16,.12);
   for(let dx=-2.2;dx<=2.2;dx+=.28)box(wood,x+dx,y+3.34,z,.08,.13,2.75);
   for(const side of [-1,1]){for(let k=0;k<4;k++)box(wood,x,y+.55,z+side*.83+k*.09,2.6,.055,.06);box(wood,x,y+.85,z+side*1.02,2.6,.38,.05);for(const dx of [-1,1])box(metal,x+dx,y+.26,z+side*.92,.055,.5,.36);}
   box(stone,x,y+.63,z,1.3,.075,.7);box(metal,x,y+.3,z,.08,.6,.08);
   for(const dx of [-1.7,1.7]){
    box(stone,x+dx,y+.23,z,.55,.46,.62);box(soil,x+dx,y+.47,z,.43,.025,.5);
    for(let n=0;n<100;n++)add(leaf.clone().rotateX(rand()*2-1).rotateY(rand()*6.28).translate(x+dx+(rand()-.5)*.38,y+.53+rand()*.35,z+(rand()-.5)*.43),leafMat);
   }
  }else{
   box(stone,x,y+.16,z,p.w,.32,p.d);box(soil,x,y+.33,z,p.w-.2,.035,p.d-.2);
   for(let n=0;n<520;n++){
    const px=x+(rand()-.5)*(p.w-.35),pz=z+(rand()-.5)*(p.d-.35),py=y+.44+rand()*.4;
    add(leaf.clone().rotateX(rand()*2.4-1.2).rotateY(rand()*6.28).rotateZ(rand()*1.8-.9).translate(px,py,pz),leafMat);
    if(n%12===0)add(new THREE.SphereGeometry(.05,5,3).translate(px,py+.14,pz),i%4===0?pink:white);
   }
   if(i%3===0){
    trees++;branch([x,y+.3,z],[x+.16,y+2.35,z],.11);
    for(let b=0;b<5;b++){const a=b*2.399,r=.55+(b%2)*.3,tx=x+Math.cos(a)*r,tz=z+Math.sin(a)*r,ty=y+2.7+(b%3)*.26;branch([x+.12,y+1.65,z],[tx,ty,tz],.035);
     for(let n=0;n<250;n++){const angle=rand()*Math.PI*2,t=rand(),rad=Math.cbrt(rand()),rr=Math.sqrt(1-Math.pow(t*2-1,2))*.85*rad;add(leaf.clone().rotateX(rand()*Math.PI).rotateY(angle).rotateZ(rand()*Math.PI).translate(tx+Math.cos(angle)*rr,ty+(t-.5)*1.15*rad,tz+Math.sin(angle)*rr),leafMat);}
    }
   }
   box(metal,x+p.w*.38,y+.65,z,.07,1.3,.07);box(lamp,x+p.w*.38,y+1.32,z,.14,.22,.14);
  }
 }
 leaf.dispose();for(const [m,parts] of batches){if(!parts.length)continue;const g=mergeGeometries(parts);parts.forEach(g=>g.dispose());const mesh=new THREE.Mesh(g,m);mesh.castShadow=m!==paving;mesh.receiveShadow=true;if(m===paving)mesh.userData.skipContact=true;root.add(mesh);}
 const obstacles=plots.map(({x,z,w,d})=>({x,z,w,d}));
 function register(v){if(registered===v)return;registered=v;if(v)ctx.rects.push(...obstacles);else ctx.rects=ctx.rects.filter(p=>!obstacles.includes(p));}
 return {root,plots,stats:{gardens:plots.filter(p=>p.kind==='garden').length,borders:0,pockets:0,trees,pergolas:plots.filter(p=>p.kind==='pergola').length,triangles:root.children.reduce((n,m)=>n+m.geometry.attributes.position.count/3,0),drawCalls:root.children.length},apply(){},setEnabled(v){enabled=!!v&&!disposed;root.visible=enabled;register(enabled);},dispose(){if(disposed)return;this.setEnabled(false);disposed=true;root.removeFromParent();root.children.forEach(m=>m.geometry.dispose());owned.forEach(m=>m.dispose());}};
}
