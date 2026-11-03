import * as THREE from 'three';
import {Reflector} from 'three/addons/objects/Reflector.js';

// A bounded, low-resolution planar capture. It is not added as another visible
// sea surface: the existing water shader samples it with its wave distortion.
export function createWaterReflection({renderer,scene,camera,waterMaterials,planeY=.002,excludeObjects=()=>[],interval=50}){
  const mirror=new Reflector(new THREE.PlaneGeometry(1,1),{textureWidth:768,textureHeight:432,clipBias:.003,multisample:0});
  mirror.rotation.x=-Math.PI/2;mirror.position.y=planeY;mirror.updateMatrixWorld(true);
  const matrix=new THREE.Matrix4(),inverse=mirror.matrixWorld.clone().invert();
  let disposed=false,last=-Infinity,captures=0;
  return {texture:mirror.getRenderTarget().texture,matrix,
    capture(){
      if(disposed||camera.position.y<=planeY+.1||performance.now()-last<interval)return false;
      const saved=[],target=renderer.getRenderTarget(),shadow=renderer.shadowMap.autoUpdate,xr=renderer.xr.enabled;
      for(const o of excludeObjects()){saved.push([o,o.visible]);o.visible=false;}
      scene.traverse(o=>{
        if(o.isMesh&&(Array.isArray(o.material)?o.material:[o.material]).some(m=>waterMaterials.includes(m))){saved.push([o,o.visible]);o.visible=false;}
      });
      try{
        mirror.onBeforeRender(renderer,scene,camera);
        matrix.copy(mirror.material.uniforms.textureMatrix.value).multiply(inverse);
        last=performance.now();captures++;return true;
      }finally{
        for(const [o,visible] of saved)o.visible=visible;
        renderer.xr.enabled=xr;renderer.shadowMap.autoUpdate=shadow;renderer.setRenderTarget(target);
      }
    },get captures(){return captures;},dispose(){if(disposed)return;disposed=true;mirror.geometry.dispose();mirror.dispose();}
  };
}
