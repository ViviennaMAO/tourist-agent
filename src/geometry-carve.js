import * as THREE from 'three';

/** Subtract an axis-aligned box in surfacePosition coordinates, interpolating
 * every vertex attribute. The borrowed input remains unchanged. */
export function carveGeometryBox(source,min,max){
 const attrs=Object.entries(source.attributes),out=Object.fromEntries(attrs.map(([name])=>[name,[]])),indices=source.index?.array||Array.from({length:source.attributes.position.count},(_,i)=>i);
 const vertex=i=>Object.fromEntries(attrs.map(([name,a])=>[name,Array.from({length:a.itemSize},(_,k)=>a.array[i*a.itemSize+k])]));
 const interpolate=(a,b,t)=>Object.fromEntries(attrs.map(([name])=>[name,a[name].map((v,k)=>v+(b[name][k]-v)*t)]));
 function emit(poly){for(let i=1;i<poly.length-1;i++)for(const v of [poly[0],poly[i],poly[i+1]])for(const [name] of attrs)out[name].push(...v[name]);}
 for(let i=0;i<indices.length;i+=3){let remaining=[vertex(indices[i]),vertex(indices[i+1]),vertex(indices[i+2])];
  if([0,1,2].some(k=>remaining.every(v=>v.surfacePosition[k]<=min[k])||remaining.every(v=>v.surfacePosition[k]>=max[k]))){emit(remaining);continue;}
  for(const [axis,sign,bound] of [[0,1,min[0]],[0,-1,max[0]],[1,1,min[1]],[1,-1,max[1]],[2,1,min[2]],[2,-1,max[2]]]){
   if(!remaining.length)break;const inside=[],outside=[];
   for(let j=0;j<remaining.length;j++){
    const a=remaining[j],b=remaining[(j+1)%remaining.length],da=(a.surfacePosition[axis]-bound)*sign,db=(b.surfacePosition[axis]-bound)*sign;
    (da>=0?inside:outside).push(a);
    if((da>=0)!==(db>=0)){const hit=interpolate(a,b,da/(da-db));inside.push(hit);outside.push(hit);}
   }
   emit(outside);remaining=inside;
  }
 }
 const result=new THREE.BufferGeometry();for(const [name,a] of attrs)result.setAttribute(name,new THREE.Float32BufferAttribute(out[name],a.itemSize));result.normalizeNormals();return result;
}
