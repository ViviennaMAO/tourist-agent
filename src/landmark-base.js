import * as THREE from 'three';

// Preserve the towers above the podium, lowering them by the removed podium
// height. The bottom terrace is a separate source mesh, so only it is narrowed.
export function podiumHeight(y){
  if(y<=.94)return y*.30;
  if(y<=3.3)return .282+(y-.94)*.50;
  return y-(3.3-1.462);
}
export function refineLegacyBase(landmark){
  if(landmark.id!=='emirates_towers'||!landmark.asset)return null;
  const swaps=[];landmark.holder.updateWorldMatrix(true,true);
  const inverse=new THREE.Matrix4().copy(landmark.holder.matrixWorld).invert();
  landmark.asset.traverse(mesh=>{
    if(!mesh.isMesh)return;
    const toLocal=new THREE.Matrix4().multiplyMatrices(inverse,mesh.matrixWorld),fromLocal=toLocal.clone().invert();
    const before=mesh.geometry,after=before.clone(),p=after.attributes.position,v=new THREE.Vector3(),bounds=new THREE.Box3();
    for(let i=0;i<p.count;i++)bounds.expandByPoint(v.fromBufferAttribute(p,i).applyMatrix4(toLocal));
    const terrace=bounds.max.y<1.05,center=bounds.getCenter(new THREE.Vector3());
    for(let i=0;i<p.count;i++){
      v.fromBufferAttribute(p,i).applyMatrix4(toLocal);
      if(terrace){v.x=center.x+(v.x-center.x)*.79;v.z=center.z+(v.z-center.z)*.81;}
      v.y=podiumHeight(v.y);v.applyMatrix4(fromLocal);p.setXYZ(i,v.x,v.y,v.z);
    }
    after.computeVertexNormals();after.computeBoundingBox();after.computeBoundingSphere();swaps.push({mesh,before,after,terrace});
  });
  let disposed=false;
  return {swaps,setEnabled(v){for(const s of swaps)s.mesh.geometry=v&&!disposed?s.after:s.before;},dispose(){if(disposed)return;this.setEnabled(false);disposed=true;for(const s of swaps)s.after.dispose();}};
}
