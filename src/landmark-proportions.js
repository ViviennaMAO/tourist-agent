import { Box3, Matrix4, Vector3 } from 'three';

// Scale about the actual contact plane, even for assets with nested transforms.
// Holder/navigation destination stay fixed and source geometry is never edited.
export function refineLandmarkProportions(landmark) {
  const factors={dubai_frame:[.92,.86,.92],museum_future:[.84,.84,.84],emirates_towers:[.90,.90,.90]}[landmark.id];
  if(!factors||!landmark.asset)return null;
  const asset=landmark.asset,parent=asset.parent;
  parent?.updateWorldMatrix(true,true);
  const inverse=parent?new Matrix4().copy(parent.matrixWorld).invert():new Matrix4();
  const bounds=new Box3(),p=new Vector3(),matrix=new Matrix4();
  asset.traverse(mesh=>{if(!mesh.isMesh)return;matrix.multiplyMatrices(inverse,mesh.matrixWorld);
    const a=mesh.geometry.attributes.position;
    for(let i=0;i<a.count;i++)bounds.expandByPoint(p.fromBufferAttribute(a,i).applyMatrix4(matrix));
  });
  if(bounds.isEmpty())return null;
  const pivot=bounds.getCenter(new Vector3());pivot.y=bounds.min.y;
  const before={scale:asset.scale.clone(),position:asset.position.clone(),radius:landmark.rXZ,size:landmark.size};
  const scale=new Vector3(...factors),position=before.position.clone().sub(pivot).multiply(scale).add(pivot);
  let disposed=false;
  return {setEnabled(value){const on=value&&!disposed;asset.scale.copy(before.scale);asset.position.copy(on?position:before.position);
    if(on)asset.scale.multiply(scale);
    if(Number.isFinite(before.radius))landmark.rXZ=before.radius*(on?Math.max(factors[0],factors[2]):1);
    if(before.size)landmark.size=on?before.size.map((v,i)=>v*factors[i]):before.size;
    asset.updateMatrixWorld(true);
  },dispose(){if(disposed)return;this.setEnabled(false);disposed=true;}};
}
