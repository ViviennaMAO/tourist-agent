/** Six triangles follow the leaf outline instead of a folded rectangular card.
 * UVs retain the original alpha silhouette; the leaf bends along its midrib. */
export function createCurvedLeaf(THREE,length,width=1,detailed=true) {
  const uv=[[.5,.5],[.49,.015],[.80,.32],[.75,.68],[.51,.995],[.25,.68],[.20,.32]];
  if(!detailed)uv.shift();
  const positions=uv.flatMap(([u,v],i)=>[
    (u-.5)*length*2.1*width,(v-.5)*length*2.1,
    detailed&&i===0?length*.035:-length*.075*Math.pow(Math.max(v-.48,0)*2,2)
  ]);
  const indices=[];
  if(detailed)for(let i=1;i<=6;i++)indices.push(0,i,i===6?1:i+1);
  else for(let i=1;i<5;i++)indices.push(0,i,i+1);
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uv.flat(),2));
  g.setIndex(indices);g.computeVertexNormals();return g;
}
