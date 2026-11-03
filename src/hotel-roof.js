import * as THREE from 'three';
import { chamferedBox } from './chamfered-box.js';

/** Find real horizontal roof/ledge boundaries in landmark coordinates. Internal
 * triangulation edges cancel even when the source splits vertices at UV seams. */
export function hotelRoofEdges(asset){
  const edges=new Map(),key=v=>v.map(n=>Math.round(n*500)).join(',');
  asset.traverse(mesh=>{
    if(!mesh.isMesh)return;const g=mesh.geometry,p=g.attributes.hotelPosition;if(!p)return;
    const count=g.index?g.index.count:p.count;
    for(let i=0;i<count;i+=3){
      const vs=[0,1,2].map(j=>new THREE.Vector3().fromBufferAttribute(p,g.index?g.index.getX(i+j):i+j));
      const n=vs[1].clone().sub(vs[0]).cross(vs[2].clone().sub(vs[0]));
      if(n.length()<.001||n.normalize().y<.997||vs.some(v=>v.y<4.1))continue;
      for(let j=0;j<3;j++){
        const a=vs[j].toArray(),b=vs[(j+1)%3].toArray(),ka=key(a),kb=key(b),k=ka<kb?ka+'|'+kb:kb+'|'+ka;
        if(edges.has(k))edges.get(k).count++;else edges.set(k,{a,b,count:1});
      }
    }
  });
  return [...edges.values()].filter(e=>e.count===1&&Math.hypot(e.b[0]-e.a[0],e.b[2]-e.a[2])>.32);
}
export function addHotelRoofDetails(asset,add,stone,bronze){
  const edges=hotelRoofEdges(asset);let brackets=0;
  for(const {a,b} of edges){
    const dx=b[0]-a[0],dz=b[2]-a[2],L=Math.hypot(dx,dz),angle=-Math.atan2(dz,dx),nx=-dz/L,nz=dx/L,y=(a[1]+b[1])/2;
    const box=(m,t,out,yy,w,h,d)=>add(chamferedBox(w,h,d,.005).rotateY(angle).translate(a[0]+dx*t+nx*out,yy,a[2]+dz*t+nz*out),m);
    box(stone,.5,0,y+.016,L,.032,.065);
    box(bronze,.5,.014,y-.022,L,.012,.025);
    // Dentils are reserved for broad cornices; short crowns keep a fine edge.
    if(L>1.05){const n=Math.floor(L/.33);for(let j=0;j<n;j++){box(stone,(j+.5)/n,-.016,y-.072,.06,.078,.085);brackets++;}}
  }
  return {roofEdges:edges.length,roofBrackets:brackets};
}
