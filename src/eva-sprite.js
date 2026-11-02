/** The supplied character artwork in a 3D world: upright, depth-tested image
 * cards with view-dependent front/three-quarter/back frames, not a 3D body.
 * The shared atlas is owned by the game; each actor owns only its geometry and
 * materials. Navigation continues to own root.position and root.rotation.
 */
export const EVA_FRAMES = [
  {name:'front',x:125,width:335},
  {name:'side',x:597,width:339},
  {name:'back',x:1078,width:338}
];
export function selectEvaFrame(angle) {
  const a=Math.atan2(Math.sin(angle),Math.cos(angle)),abs=Math.abs(a);
  return {index:abs<Math.PI*.23?0:abs>Math.PI*.77?2:1,mirror:abs>=Math.PI*.23&&abs<=Math.PI*.77&&a<0};
}
export function createEvaSprite({THREE,atlasTexture}) {
  const root=new THREE.Group();root.name='Eva — illustrated character';
  root.userData.character='eva-sprite-v1';root.userData.headHeight=2.79;root.userData.tagHeight=3.4;
  const billboard=new THREE.Group();root.add(billboard);
  const height=3.28,geometry=new THREE.PlaneGeometry(1,height,1,1);
  const material=new THREE.MeshBasicMaterial({map:atlasTexture,alphaTest:.45,side:THREE.DoubleSide,
    depthWrite:true,depthTest:true,toneMapped:false,fog:true});
  const picture=new THREE.Mesh(geometry,material);picture.name='Eva illustrated body';
  picture.position.y=height/2-.024;billboard.add(picture);
  const shadowData=new Uint8Array(64*64*4);
  for(let y=0;y<64;y++)for(let x=0;x<64;x++) {
    const r=Math.hypot((x-31.5)/31.5,(y-31.5)/31.5);
    shadowData.set([37,39,32,Math.round(Math.pow(Math.max(0,1-r),2)*78)],(y*64+x)*4);
  }
  const shadowTexture=new THREE.DataTexture(shadowData,64,64);shadowTexture.needsUpdate=true;
  shadowTexture.magFilter=THREE.LinearFilter;
  const shadowMaterial=new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false,toneMapped:false});
  const shadow=new THREE.Mesh(new THREE.PlaneGeometry(1.1,.75).rotateX(-Math.PI/2),shadowMaterial);
  shadow.name='Eva soft contact shadow';shadow.position.y=.018;root.add(shadow);
  const localCamera=new THREE.Vector3();let frame=-1,flipped=false,phase=0,blend=0,disposed=false;
  function setFrame(index,mirror=false) {
    if(frame===index&&flipped===mirror)return;
    frame=index;flipped=mirror;const cell=EVA_FRAMES[index],uv=geometry.attributes.uv;
    // Geometry UVs crop the atlas per actor; no shared texture offset mutations.
    for(let j=0;j<uv.count;j++) {
      const right=geometry.attributes.position.getX(j)>0;
      uv.setXY(j,(cell.x+((right!==mirror)?cell.width:0))/1536,geometry.attributes.position.getY(j)/height+.5);
    }
    uv.needsUpdate=true;picture.scale.x=height*cell.width/1024;
    root.userData.view=cell.name;root.userData.mirrored=mirror;
  }
  function updateView(camera) {
    if(disposed)return;
    camera.getWorldPosition(localCamera);root.worldToLocal(localCamera);
    const angle=Math.atan2(localCamera.x,localCamera.z),choice=selectEvaFrame(angle);
    setFrame(choice.index,choice.mirror);billboard.rotation.y=angle;billboard.updateMatrixWorld(true);
  }
  setFrame(0);
  return {root,stats:{triangles:4,drawCalls:2},updateView,
    animate(dt,speed,time) {
      if(disposed)return;
      const step=Math.min(.1,Math.max(0,dt));blend+=(Math.min(1,speed)-blend)*(1-Math.exp(-step*12));
      phase+=step*(speed>1?13:9)*Math.min(1,speed);
      // Illustration motion only: subtle walking bounce/sway, no claim of a
      // skeletal gait or individual leg animation from a single still image.
      picture.position.y=height/2-.024+Math.abs(Math.sin(phase))*.024*blend;
      picture.rotation.z=Math.sin(phase)*.009*blend;
      picture.scale.y=1+Math.sin(time*1.6)*.0015*(1-blend);
      picture.visible=!!atlasTexture?.image;
    },dispose(){
      if(disposed)return;disposed=true;root.removeFromParent();
      geometry.dispose();material.dispose();shadow.geometry.dispose();shadowMaterial.dispose();shadowTexture.dispose();
    }
  };
}
