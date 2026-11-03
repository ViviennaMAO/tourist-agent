import * as THREE from 'three';
import {shoreBulge} from './shore-profile.js';

// Clipped irregular cells give the retaining wall fitted fieldstones without
// continuous horizontal courses. Seeded generation keeps review shots stable.
export function quayCells() {
  let seed=91273;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const sites=[];
  // Smaller, mixed-height rubble: about 45 cm wide, with no level courses.
  for(let row=0;row<4;row++)for(let col=0;col<58;col++)
    sites.push([-33+(col+.18+random()*.64)*26/58,.04+(row+.12+random()*.76)*.94/4]);
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
      const f=Math.max(.7,1-(.014+.008*(.5+.5*Math.sin(index*3.7)))/d);return [center[0]+(p[0]-center[0])*f,center[1]+(p[1]-center[1])*f];})};
  });
}

export function quayContour(x){return .095*Math.sin((x+33)*.43)+.035*Math.sin(x*1.31);}

export function createQuayStone(cell){
  // A chipped rim, inset shoulder and off-centre crown replace the extruded
  // flat cap. All relief remains seaward of the old wall and below the coping.
  const n=cell.polygon.length,[cx,cy]=cell.center,front=-4.405+quayContour(cx)*.18+.016*Math.sin(cell.index*7.1);
  const crown=[cx+.025*Math.sin(cell.index),cy+.016*Math.cos(cell.index),front+.052+.009*Math.sin(cell.index*1.8)];
  const vertices=[...crown],indices=[],colors=[];
  for(const [i,p] of cell.polygon.entries())vertices.push(p[0],p[1],front-.012+.012*Math.sin(i*2.7+cell.index));
  for(const [i,p] of cell.polygon.entries()){
    const f=.72+.09*Math.sin(i*1.9+cell.index);
    vertices.push(cx+(p[0]-cx)*f,cy+(p[1]-cy)*f,front+.040+.014*Math.sin(i*2.3+cell.index*3.1));
  }
  for(const p of cell.polygon)vertices.push(p[0],p[1],-5.04);
  for(let k=0;k<n;k++){
    const a=1+k,b=1+(k+1)%n,ia=a+n,ib=b+n;
    indices.push(0,ia,ib,ia,a,b,ia,b,ib,a,a+2*n,b,b,a+2*n,b+2*n);
  }
  const tint=new THREE.Color(['#b6a38a','#baa88e','#c3b397','#a99880','#c7b69c'][cell.index%5]);
  for(let i=0;i<vertices.length;i+=3){
    vertices[i+2]+=shoreBulge(vertices[i]);
    const c=tint.clone().multiplyScalar(.96+.035*Math.sin(cell.index*2.6+vertices[i+1]*4));colors.push(c.r,c.g,c.b);
  }
  const indexed=new THREE.BufferGeometry();
  indexed.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  indexed.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  indexed.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(vertices.length/3*2),2));
  indexed.setIndex(indices);indexed.computeVertexNormals();
  const g=indexed.toNonIndexed();indexed.dispose();return g;
}
