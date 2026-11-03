import * as THREE from 'three';
import {createWaterReflection} from './water-reflection.js';

// One view-dependent capture at the actual marble height. It augments (rather
// than replaces) the lit stone and inlay colours; no second mirror plane is drawn.
export function createMarbleReflection({renderer,scene,camera,city,inlay,excludeObjects=()=>[]}){
 const materials=inlay.materials,capture=createWaterReflection({renderer,scene,camera,waterMaterials:materials,planeY:city.w.root.position.y+1.085,excludeObjects,interval:100});
 const ready={value:0},saved=[],frustum=new THREE.Frustum(),projection=new THREE.Matrix4(),bounds=new THREE.Box3();let enabled=false,disposed=false;
 for(const m of materials){
  const compile=m.onBeforeCompile,key=m.customProgramCacheKey();saved.push({m,compile,key:m.customProgramCacheKey});
  m.onBeforeCompile=function(sh,r){compile.call(this,sh,r);Object.assign(sh.uniforms,{marbleMap:{value:capture.texture},marbleMatrix:{value:capture.matrix},marbleReady:ready});
   sh.vertexShader='varying vec3 marbleWorld;\n'+sh.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nmarbleWorld=(modelMatrix*vec4(transformed,1.)).xyz;');
   sh.fragmentShader='varying vec3 marbleWorld;uniform sampler2D marbleMap;uniform mat4 marbleMatrix;uniform float marbleReady;\n'+sh.fragmentShader.replace('#include <opaque_fragment>',`vec4 marbleP=marbleMatrix*vec4(marbleWorld,1.);
    vec2 marbleUV=marbleP.xy/max(.0001,marbleP.w);float marbleEdge=min(min(marbleUV.x,1.-marbleUV.x),min(marbleUV.y,1.-marbleUV.y));
    if(marbleReady>.5&&marbleP.w>0.&&marbleEdge>0.){
     vec2 texel=vec2(1./768.,1./432.);vec3 reflected=texture2D(marbleMap,marbleUV).rgb*.4;
     reflected+=(texture2D(marbleMap,marbleUV+texel).rgb+texture2D(marbleMap,marbleUV-texel).rgb+texture2D(marbleMap,marbleUV+vec2(texel.x,-texel.y)).rgb+texture2D(marbleMap,marbleUV+vec2(-texel.x,texel.y)).rgb)*.15;
     float angle=pow(1.-abs(normalize(cameraPosition-marbleWorld).y),3.);
     outgoingLight=mix(outgoingLight,reflected*mix(vec3(1.),diffuseColor.rgb,.12),(.24+.42*angle)*smoothstep(0.,.04,marbleEdge));
    }
    #include <opaque_fragment>`);
  };m.customProgramCacheKey=()=>key+'-planar-marble-v1';m.needsUpdate=true;
 }
 return {setEnabled(v){enabled=!!v&&!disposed;ready.value=enabled&&capture.captures?1:0;},capture(){if(!enabled||disposed)return;
   inlay.root.updateWorldMatrix(true,true);bounds.setFromObject(inlay.root);projection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);frustum.setFromProjectionMatrix(projection);
   if(!frustum.intersectsBox(bounds)||camera.position.distanceTo(bounds.getCenter(new THREE.Vector3()))>85){ready.value=0;return;}
   capture.capture();if(capture.captures)ready.value=1;},get captures(){return capture.captures;},dispose(){if(disposed)return;disposed=true;ready.value=0;for(const r of saved){r.m.onBeforeCompile=r.compile;r.m.customProgramCacheKey=r.key;r.m.needsUpdate=true;}capture.dispose();}};
}
