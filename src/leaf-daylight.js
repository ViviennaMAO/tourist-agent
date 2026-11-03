/** Bounded thin-leaf approximation; keeps alpha cutouts and real shadows. */
export function installLeafDaylight(material) {
  const before=material.onBeforeCompile,key=material.customProgramCacheKey();
  material.onBeforeCompile=function(shader,renderer){
    before.call(this,shader,renderer);
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      // The source leaf carries dark photographic shading. Lift that baked
      // shadow before applying the scene lighting, retaining vein contrast.
      diffuseColor.rgb=mix(diffuseColor.rgb,sqrt(max(diffuseColor.rgb,vec3(0.)))*.72,.45);
    `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_end>',`#include <lights_fragment_end>
      vec3 leafSun=normalize((viewMatrix*vec4(-1.1,.72,.85,0.)).xyz);
      float leafBacklight=pow(max(dot(-normal,leafSun),0.),1.4);
      reflectedLight.directDiffuse+=diffuseColor.rgb*vec3(.26,.23,.13)*leafBacklight;
    `);
  };
  material.customProgramCacheKey=()=>key+'-leaf-daylight-v1';
}
