import * as THREE from 'three';

// Clipped irregular cells give the retaining wall fitted fieldstones without
// continuous horizontal courses. Seeded generation keeps review shots stable.
export function quayCells() {
  let seed=91273;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const sites=[];
  for(let row=0;row<3;row++)for(let col=0;col<30;col++)
    sites.push([-33+(col+.18+random()*.64)*26/30,.04+(row+.12+random()*.76)*.94/3]);
  return sites.map((s,index)=>{
    let poly=[[-33,.04],[-7,.04],[-7,.98],[-33,.98]];
    for(const q of sites){
      if(q===s)continue;
      const nx=q[0]-s[0],ny=q[1]-s[1],limit=(q[0]**2+q[1]**2-s[0]**2-s[1]**2)/2;
      const out=[];
      for(let i=0;i<poly.length;i++){
        const a=poly[i],b=poly[(i+1)%poly.length],da=a[0]*nx+a[1]*ny-limit,db=b[0]*nx+b[1]*ny-limit;
        if(da<=0)out.push(a);
        if((da<=0)!==(db<=0)){const t=da/(da-db);out.push([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]);}
      }
      poly=out;if(!poly.length)break;
    }
    // Insets leave narrow, genuinely recessed mortar seams between stones.
    const center=poly.reduce((a,p)=>[a[0]+p[0]/poly.length,a[1]+p[1]/poly.length],[0,0]);
    return {index,center,polygon:poly.map(p=>{const d=Math.hypot(p[0]-center[0],p[1]-center[1]);
      const f=Math.max(.7,1-.025/d);return [center[0]+(p[0]-center[0])*f,center[1]+(p[1]-center[1])*f];})};
  });
}

export function quayContour(x){return .095*Math.sin((x+33)*.43)+.035*Math.sin(x*1.31);}

export function createQuayStone(cell){
  const shape=new THREE.Shape(cell.polygon.map(p=>new THREE.Vector2(...p)));
  // The source island's wall is at z=-4.5. Every face must remain seaward of
  // it, including the chipped edge, or that old wall clips through the stone.
  const front=-4.34+quayContour(cell.center[0])*.4+.015*Math.sin(cell.index*7.1);
  const g=new THREE.ExtrudeGeometry(shape,{depth:front+5.04,steps:1,bevelEnabled:true,bevelThickness:.018,bevelSize:.012,bevelSegments:1,curveSegments:1});
  g.translate(0,0,-5.04);
  const p=g.attributes.position,colors=[];
  const tint=new THREE.Color(['#b6a38a','#baa88e','#c3b397','#a99880','#c7b69c'][cell.index%5]);
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
    if(z>-4.9)p.setZ(i,z+.025*Math.sin(x*29.1+y*17.3));
    const shade=.94+.06*Math.sin(x*11.8+y*13.7),c=tint.clone().multiplyScalar(shade);
    colors.push(c.r,c.g,c.b);
  }
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();return g;
}
