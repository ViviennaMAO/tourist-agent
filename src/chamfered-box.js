import * as THREE from 'three';

// Six broad planes, twelve 45-degree bevels and eight small corner triangles.
// The original collision envelope is preserved, with only 44 triangles.
export function chamferedBox(w,h,d,r=.018){
  const half=[w/2,h/2,d/2];r=Math.min(r,...half.map(v=>v*.45));
  const inset=half.map(v=>v-r),positions=[],uvs=[];
  function face(points){
    const p=points.map(v=>new THREE.Vector3(...v));
    const normal=p[1].clone().sub(p[0]).cross(p[2].clone().sub(p[0]));
    const center=p.reduce((a,b)=>a.add(b),new THREE.Vector3()).divideScalar(p.length);
    if(normal.dot(center)<0)p.reverse();
    for(let i=1;i<p.length-1;i++)for(const v of [p[0],p[i],p[i+1]]){positions.push(...v.toArray());uvs.push(0,0);}
  }
  for(let axis=0;axis<3;axis++)for(const s of [-1,1]){
    const a=(axis+1)%3,b=(axis+2)%3;
    face([[-1,-1],[1,-1],[1,1],[-1,1]].map(([u,v])=>{const p=[];p[axis]=s*half[axis];p[a]=u*inset[a];p[b]=v*inset[b];return p;}));
  }
  for(let axis=0;axis<3;axis++)for(const sa of [-1,1])for(const sb of [-1,1]){
    const a=(axis+1)%3,b=(axis+2)%3;
    face([[-1,0],[1,0],[1,1],[-1,1]].map(([s,edge])=>{const p=[];p[axis]=s*inset[axis];p[a]=sa*(edge?inset[a]:half[a]);p[b]=sb*(edge?half[b]:inset[b]);return p;}));
  }
  for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1]){
    const signs=[x,y,z];face([0,1,2].map(axis=>half.map((v,i)=>signs[i]*(i===axis?v:inset[i]))));
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.computeVertexNormals();return g;
}
