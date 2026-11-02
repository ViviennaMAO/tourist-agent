import * as THREE from 'three';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';

// The normal pass must respect cutout leaves and Eva's illustrated silhouette.
// A solid override material would turn every leaf/card into an opaque rectangle.
export function createContactNormals() {
  const cache=new Map();
  function proxy(source) {
    if(cache.has(source)) return cache.get(source);
    const material=new THREE.MeshNormalMaterial({side:source.side});
    if(source.alphaTest>0 && source.map) {
      material.onBeforeCompile=shader=>{
        shader.uniforms.contactAlpha={value:source.map};
        shader.uniforms.contactCutoff={value:source.alphaTest};
        shader.vertexShader='varying vec2 contactUv;\n'+shader.vertexShader;
        shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ncontactUv=uv;');
        shader.fragmentShader='varying vec2 contactUv; uniform sampler2D contactAlpha; uniform float contactCutoff;\n'+shader.fragmentShader;
        shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>',
          '#include <clipping_planes_fragment>\nif(texture2D(contactAlpha,contactUv).a<contactCutoff) discard;');
      };
      material.customProgramCacheKey=()=>`contact-cutout-${source.map.uuid}`;
    }
    cache.set(source,material);return material;
  }
  return {withMaterials(scene,draw) {
    const saved=[];
    scene.traverse(o=>{
      if(o.isPoints||o.isLine||o.isSprite) {saved.push([o,o.visible,null]);o.visible=false;}
      else if(o.isMesh) {
        const mats=Array.isArray(o.material)?o.material:[o.material];
        saved.push([o,o.visible,o.material]);
        if(mats.some(m=>m.transparent||m.depthWrite===false)||o.userData.skipContact) o.visible=false;
        else o.material=Array.isArray(o.material)?mats.map(proxy):proxy(o.material);
      }
    });
    try {return draw();} finally {
      for(const [o,visible,material] of saved) {o.visible=visible;if(material)o.material=material;}
    }
  },dispose(){for(const m of cache.values())m.dispose();cache.clear();}};
}

/** Bounded near-camera SSAO, composited over the existing tone-mapped frame.
 * This keeps the game's native MSAA and Eva's unlit artwork colour unchanged
 * apart from the contact darkening itself. No additional full-size colour target.
 */
export function createContactShadows({renderer,scene,camera}) {
  const pass=new SSAOPass(scene,camera,1,1,32), normals=createContactNormals();
  let disposed=false, width=0,height=0;
  pass.kernelRadius=.42;
  pass.ssaoMaterial.fragmentShader=pass.ssaoMaterial.fragmentShader.replace(
    'vec3( 1.0 - occlusion )','vec3( 1.0 - occlusion * .52 * (1.0-smoothstep(65.0,130.0,-viewZ)) )');
  // Blur only neighbours on the same surface. A box blur spreads occlusion
  // across the sky, thin foliage and window silhouettes as a grey fringe.
  Object.assign(pass.blurMaterial.uniforms,{
    tDepth:{value:pass.normalRenderTarget.depthTexture},
    tNormal:{value:pass.normalRenderTarget.texture},
    cameraNear:{value:camera.near},cameraFar:{value:camera.far}
  });
  pass.blurMaterial.fragmentShader=`
    uniform sampler2D tDiffuse,tDepth,tNormal;
    uniform vec2 resolution;
    uniform float cameraNear,cameraFar;
    varying vec2 vUv;
    #include <packing>
    void main(){
      float depth=texture2D(tDepth,vUv).x;
      if(depth>=.999999){gl_FragColor=vec4(1.);return;}
      float z=perspectiveDepthToViewZ(depth,cameraNear,cameraFar);
      vec3 n=unpackRGBToNormal(texture2D(tNormal,vUv).xyz);
      float result=0.,total=0.;
      for(int x=-2;x<=2;x++)for(int y=-2;y<=2;y++){
        vec2 offset=vec2(float(x),float(y));
        vec2 uv=vUv+offset/resolution;
        float sampleZ=perspectiveDepthToViewZ(texture2D(tDepth,uv).x,cameraNear,cameraFar);
        vec3 sampleN=unpackRGBToNormal(texture2D(tNormal,uv).xyz);
        float weight=exp(-dot(offset,offset)*.32)
          *exp(-abs(sampleZ-z)/max(.07,-z*.003))
          *pow(max(dot(n,sampleN),0.),8.);
        result+=texture2D(tDiffuse,uv).r*weight;total+=weight;
      }
      gl_FragColor=vec4(vec3(result/max(total,.0001)),1.);
    }`;
  const size=new THREE.Vector2(), clearColor=new THREE.Color();
  return {render(){
    if(disposed)return;
    renderer.getDrawingBufferSize(size);
    const scale=Math.min(.75,800/size.x),w=Math.max(1,Math.round(size.x*scale)),h=Math.max(1,Math.round(size.y*scale));
    if(w!==width||h!==height) {width=w;height=h;pass.setSize(w,h);}
    const uniforms=pass.ssaoMaterial.uniforms;
    uniforms.cameraProjectionMatrix.value.copy(camera.projectionMatrix);
    uniforms.cameraInverseProjectionMatrix.value.copy(camera.projectionMatrixInverse);
    uniforms.cameraNear.value=camera.near;uniforms.cameraFar.value=camera.far;
    pass.blurMaterial.uniforms.cameraNear.value=camera.near;
    pass.blurMaterial.uniforms.cameraFar.value=camera.far;
    uniforms.kernelRadius.value=pass.kernelRadius;
    // SSAOPass compares normalized linear depth, whereas these limits are metres.
    uniforms.minDistance.value=.025/(camera.far-camera.near);
    uniforms.maxDistance.value=.7/(camera.far-camera.near);
    const target=renderer.getRenderTarget(),autoClear=renderer.autoClear,shadowAuto=renderer.shadowMap.autoUpdate;
    const alpha=renderer.getClearAlpha();renderer.getClearColor(clearColor);
    try {
      renderer.autoClear=false;renderer.shadowMap.autoUpdate=false;
      renderer.setRenderTarget(pass.normalRenderTarget);renderer.setClearColor(0x7777ff,1);renderer.clear();
      normals.withMaterials(scene,()=>renderer.render(scene,camera));
      pass.renderPass(renderer,pass.ssaoMaterial,pass.ssaoRenderTarget);
      pass.renderPass(renderer,pass.blurMaterial,pass.blurRenderTarget);
      pass.copyMaterial.uniforms.tDiffuse.value=pass.blurRenderTarget.texture;
      pass.copyMaterial.blending=THREE.CustomBlending;
      pass.renderPass(renderer,pass.copyMaterial,target);
    } finally {
      renderer.setRenderTarget(target);renderer.setClearColor(clearColor,alpha);
      renderer.autoClear=autoClear;renderer.shadowMap.autoUpdate=shadowAuto;
    }
  },get resolution(){return `${width}×${height}`;},dispose(){
    if(disposed)return;disposed=true;normals.dispose();pass.dispose();
    // Three r160's SSAOPass.dispose omits these two owned resources.
    pass.ssaoMaterial.dispose();pass.noiseTexture.dispose();
  }};
}
