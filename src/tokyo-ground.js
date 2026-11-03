import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {chamferedBox} from './chamfered-box.js';
import {installSurfaceFinish} from './surface-finish.js';

export const TOKYO_PAVING=[
 {x:-44.7,z:-25,w:1.6,d:54}, {x:-44.7,z:25,w:1.6,d:24},
 {x:-24,z:-44,w:15,d:16},
];
export function moatStoneSamples(isles){
 const out=[];
 for(const isle of isles){const pts=isle.outline||[];
  const area=pts.reduce((s,p,i)=>{const q=pts[(i+1)%pts.length];return s+p[0]*q[1]-q[0]*p[1];},0),sign=area>=0?1:-1;
  for(let i=0;i<pts.length;i++){
   const a=pts[i],b=pts[(i+1)%pts.length],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);if(length<.001)continue;
   const n=Math.ceil(length/.68);for(let k=0;k<n;k++)out.push({x:a[0]+dx*(k+.5)/n,z:a[1]+dz*(k+.5)/n,angle:-Math.atan2(dz,dx),length:length/n,nx:sign*dz/length,nz:-sign*dx/length});
  }
 }return out;
}
export function createTokyoGround({city}){
 const ctx=city.w.ctx,root=new THREE.Group();root.name='Tokyo — shrine paving and moat stonework';city.w.root.add(root);
 const batches=new Map(),materials=[];let enabled=false,disposed=false;
 const mat=(c,roughness=.9)=>{const m=new THREE.MeshStandardMaterial({color:c,roughness});materials.push(m);batches.set(m,[]);installSurfaceFinish(m,'paving');return m;};
 const paving=mat('#bcbcb2'),border=mat('#949d99'),rocks=[mat('#747d77'),mat('#899088'),mat('#93958a')],wet=mat('#576660',.58);
 const add=(g,m)=>{if(g.index){const old=g;g=g.toNonIndexed();old.dispose();}batches.get(m).push(g);};
 const box=(m,x,y,z,w,h,d,ry=0)=>add(chamferedBox(w,h,d,.015).rotateY(ry).translate(x,y,z),m);
 for(const p of TOKYO_PAVING){
  box(paving,p.x,1.265,p.z,p.w,.03,p.d);
  for(const sign of [-1,1])box(border,p.x+sign*(p.w/2-.045),1.285,p.z,.09,.02,p.d);
  for(let z=p.z-p.d/2+.6;z<p.z+p.d/2;z+=1.2)box(border,p.x,1.282,z,p.w-.16,.006,.014);
 }
 const disk=new THREE.CylinderGeometry(6.75,6.75,.035,80).translate(-24,1.268,-22);add(disk,paving);
 // Continue each shop threshold only as far as the original street clearance.
 for(const b of ctx.buildings||[]){if(b.style!=='wa')continue;
  const edge=b.x+(b.ry?b.d:b.w)/2,span=-45.5-edge;
  if(span<=0||span>18)continue;
  const rect={x:(edge-45.5)/2,z:b.z,w:span,d:.9};
  const clear=(ctx.rects||[]).every(q=>Math.abs(q.x-b.x)<.01&&Math.abs(q.z-b.z)<.01||Math.abs(rect.x-q.x)>=(rect.w+q.w)/2+.1||Math.abs(rect.z-q.z)>=(rect.d+q.d)/2+.1);
  if(clear)box(paving,rect.x,1.266,rect.z,rect.w,.032,rect.d);
 }
 const rim=moatStoneSamples(ctx.lagoonIsles||[]);
 for(const [i,s] of rim.entries()){
  box(border,s.x+s.nx*.25,1.77,s.z+s.nz*.25,s.length+.01,.09,.66,s.angle);
  for(let row=0;row<2;row++){
   const k=Math.sin(i*7.13+row*3.1),offset=row===0?.57:.53;
   box(row?rocks[i%3]:wet,s.x+s.nx*offset,1.415+row*.18,s.z+s.nz*offset,s.length-.018,.165+.015*k,.19+.018*k,s.angle);
  }
 }
 for(const [m,parts] of batches){if(!parts.length)continue;const g=mergeGeometries(parts);parts.forEach(g=>g.dispose());const mesh=new THREE.Mesh(g,m);mesh.castShadow=false;mesh.receiveShadow=true;root.add(mesh);}
 return {root,stats:{tokyoPaving:TOKYO_PAVING.length+1,moatStones:rim.length*2,drawCalls:root.children.length},apply(){},setEnabled(v){enabled=!!v&&!disposed;root.visible=enabled;},dispose(){if(disposed)return;this.setEnabled(false);disposed=true;root.removeFromParent();root.children.forEach(m=>m.geometry.dispose());materials.forEach(m=>m.dispose());}};
}
