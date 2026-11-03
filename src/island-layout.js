// Oriented plots keep a 0.9-unit walking strip along the opposite shore.
export function plotLocal(b,x,z){const c=Math.cos(b.ry||0),s=Math.sin(b.ry||0),dx=x-b.x,dz=z-b.z;return [c*dx-s*dz,s*dx+c*dz];}
export function inPlot(b,x,z,pad=0){const [u,v]=plotLocal(b,x,z);return Math.abs(u)<b.w/2+pad&&Math.abs(v)<b.d/2+pad;}
export function plotPoint(b,u,v){const c=Math.cos(b.ry||0),s=Math.sin(b.ry||0);return [b.x+c*u+s*v,b.z-s*u+c*v];}
export function planIslandVillas(ctx,buildings){
  return buildings.map(b=>{
    const f=(ctx.fronds||[]).find(f=>{const L=Math.hypot(f.B[0]-f.A[0],f.B[1]-f.A[1]),u=((b.x-f.A[0])*(f.B[0]-f.A[0])+(b.z-f.A[1])*(f.B[1]-f.A[1]))/L;return u>0&&u<L&&Math.hypot(b.x-f.A[0]-(f.B[0]-f.A[0])*u/L,b.z-f.A[1]-(f.B[1]-f.A[1])*u/L)<.8;});
    if(!f)return {...b};
    const L=Math.hypot(f.B[0]-f.A[0],f.B[1]-f.A[1]),dx=(f.B[0]-f.A[0])/L,dz=(f.B[1]-f.A[1])/L;
    const side=Math.sign((b.x-f.A[0])*(-dz)+(b.z-f.A[1])*dx)||1;
    const along=(b.x-f.A[0])*dx+(b.z-f.A[1])*dz;
    for(const width of [3.8,3.4,3])for(const shift of [0,.35,-.35,.7,-.7,1.1,-1.1]){
      const t=along+shift;if(t-width/2<3.1||t+width/2>L-.1)continue;
      const p={...b,x:f.A[0]+dx*t-dz*side*.63,z:f.A[1]+dz*t+dx*side*.63,w:width,d:1.5,h:2.65,ry:f.ang+(side>0?Math.PI:0),frond:f,side};
      if((ctx.palms||[]).some(q=>inPlot(p,q.x,q.z,.32)))continue;
      return p;
    }
    return {...b,h:2.65,ry:f.ang+(side>0?Math.PI:0),frond:f,side};
  });
}
