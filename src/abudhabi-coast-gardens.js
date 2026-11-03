import {ABU_COAST} from './abudhabi-coastline.js';
import {pointInPolygon} from './shore-profile.js';
import {createAbuPublicRealm} from './abudhabi-public-realm.js';

// Small planting pockets between the new outer walk and the original city.
// Their bounding boxes include foliage, so the coastal lane stays continuous.
export function planAbuCoastGardens(ctx,reserved=[]){
 const outline=ctx.islands.find(i=>i.id==='mainland')?.outline||ABU_COAST,plots=[];
 let distance=0,last=-20;
 for(let i=0;i<outline.length;i++){
  const a=outline[i],b=outline[(i+1)%outline.length],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);distance+=len;
  if(distance-last<5.5)continue;
  const nx=dz/len,nz=-dx/len,offset=(a[1]+b[1])/2>36?2.85:3.5,x=(a[0]+b[0])/2-nx*offset,z=(a[1]+b[1])/2-nz*offset;
  const horizontal=Math.abs(dx)>Math.abs(dz),w=horizontal?3.8:1.7,d=horizontal?(z>36?1.2:1.7):3.8;
  // Keep the old Corniche, its railings and the new outer lane distinct.
  if(z>36&&z-d/2<45.5)continue;
  if(ctx.groundY(x,z)>1.05)continue;
  if(![-1,1].every(s=>[-1,1].every(t=>pointInPolygon(outline,x+s*(w/2+.5),z+t*(d/2+.5)))))continue;
  if((ctx.roads||[]).some(r=>{const ux=r.B[0]-r.A[0],uz=r.B[1]-r.A[1],u=Math.max(0,Math.min(1,((x-r.A[0])*ux+(z-r.A[1])*uz)/(ux*ux+uz*uz||1)));return Math.hypot(x-r.A[0]-u*ux,z-r.A[1]-u*uz)<(r.hw||2)+Math.hypot(w,d)/2+2;}))continue;
  if((ctx.circles||[]).some(c=>Math.hypot(x-c.x,z-c.z)<c.r+Math.hypot(w,d)/2+.7))continue;
  if([...(ctx.rects||[]),...reserved,...plots].some(p=>Math.abs(x-p.x)<(w+p.w)/2+.7&&Math.abs(z-p.z)<(d+p.d)/2+.7))continue;
  plots.push({x,z,w,d,y:1,kind:'garden',tree:plots.length%5===1});last=distance;
 }
 return plots;
}
export function createAbuCoastGardens({city,leafTexture,reserved=[]}){
 const plots=planAbuCoastGardens(city.w.ctx,reserved);
 const study=createAbuPublicRealm({city,leafTexture,plots});study.root.name='Abu Dhabi — coastal flower pockets';
 // Reuse the tested planting/obstacle lifecycle, including shared leaf textures.
 study.stats.coastGardens=plots.length;return study;
}
