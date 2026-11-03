import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {installSurfaceFinish} from './surface-finish.js';

// The outer expansion preserves every existing building and the two canal mouths.
export function abuCoastOutline(){
 const points=[],corners=[[-60,-68,Math.PI,Math.PI*1.5],[60,-68,Math.PI*1.5,Math.PI*2],[60,34,0,Math.PI/2],[-60,34,Math.PI/2,Math.PI]];
 for(let k=0;k<4;k++){
  const [cx,cz,a,b]=corners[k],next=corners[(k+1)%4];
  for(let j=0;j<=16;j++){const t=a+(b-a)*j/16;points.push([cx+12*Math.cos(t),cz+12*Math.sin(t)]);}
  const end=points.at(-1),start=[next[0]+12*Math.cos(next[2]),next[1]+12*Math.sin(next[2])],n=Math.ceil(Math.hypot(start[0]-end[0],start[1]-end[1])/2);
  for(let j=1;j<n;j++)points.push([end[0]+(start[0]-end[0])*j/n,end[1]+(start[1]-end[1])*j/n]);
 }
 return points.map(([x,z])=>{
  const alongX=Math.sin(Math.PI*(x+72)/144)**2,alongZ=Math.sin(Math.PI*(z+80)/126)**2;
  const westGap=1-Math.exp(-(((z+26)/10)**2)),southGap=1-Math.exp(-(((x-10)/10)**2));
  return [x+(x>0?1:-1)*6.5*alongZ*(Math.abs(x)/72)**8*(x<0?westGap:1),z+(z>0?1:-1)*(z>0?7*southGap:3.5)*alongX*(Math.abs(z)/(z>0?46:80))**8];
 });
}
export const ABU_COAST=abuCoastOutline();
export function createAbuCoastalWalk({city}){
 const root=new THREE.Group();root.name='Abu Dhabi — curved outer Corniche walk';city.w.root.add(root);
 const points=city.w.ctx.islands.find(i=>i.id==='mainland')?.outline||ABU_COAST;
 const paving=new THREE.MeshStandardMaterial({color:'#d6cbb6',roughness:.8}),edge=new THREE.MeshStandardMaterial({color:'#b7aa90',roughness:.88});installSurfaceFinish(paving,'paving');installSurfaceFinish(edge,'limestone');
 const parts=new Map([[paving,[]],[edge,[]]]);let disposed=false;
 for(let i=0;i<points.length;i++){
  const a=points[i],b=points[(i+1)%points.length],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),x=(a[0]+b[0])/2,z=(a[1]+b[1])/2,nx=dz/len,nz=-dx/len;
  // Preserve the canal mouths and bridge landings, using source road corridors.
  if(city.w.ctx.roads.some(r=>{const ux=r.B[0]-r.A[0],uz=r.B[1]-r.A[1],u=Math.max(0,Math.min(1,((x-r.A[0])*ux+(z-r.A[1])*uz)/(ux*ux+uz*uz)));return Math.hypot(x-r.A[0]-ux*u,z-r.A[1]-uz*u)<(r.hw||2)+2.5;}))continue;
  // Existing raised north/east plazas already own their edge heights.
  if(city.w.ctx.groundY(x-nx*1.4,z-nz*1.4)>1.05)continue;
  for(const [m,offset,width] of [[paving,1.1,1.4],[edge,1.84,.08]])parts.get(m).push(new THREE.BoxGeometry(len+.025,.025,width).rotateY(-Math.atan2(dz,dx)).translate(x-nx*offset,1.012,z-nz*offset));
 }
 for(const [m,gs] of parts){if(!gs.length)continue;const g=mergeGeometries(gs);gs.forEach(g=>g.dispose());const mesh=new THREE.Mesh(g,m);mesh.receiveShadow=true;mesh.userData.skipContact=true;root.add(mesh);}
 return {root,stats:{curvedCoast:points.length},apply(){},setEnabled(v){root.visible=!!v&&!disposed;},dispose(){if(disposed)return;disposed=true;root.removeFromParent();root.children.forEach(m=>m.geometry.dispose());paving.dispose();edge.dispose();}};
}
