/** A small finish layered over the existing world-scaled limestone. Corners
 * receive irregular scuffs; the bottom course carries a restrained dust tint. */
export function installStoneWear(material,origin){
  const before=material.onBeforeCompile,key=material.customProgramCacheKey();
  material.onBeforeCompile=(shader,renderer)=>{
    before.call(material,shader,renderer);
    shader.uniforms.wearOrigin={value:origin};
    shader.fragmentShader='uniform vec3 wearOrigin;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      vec3 wearP=taWorld-wearOrigin;
      vec2 cornerA=abs(abs(wearP.xz-vec2(-29.15,-9.8))-vec2(2.35,3.2));
      vec2 cornerB=abs(abs(wearP.xz-vec2(-10.85,-9.8))-vec2(2.35,3.2));
      float corner=1.-smoothstep(.012,.085,min(length(cornerA),length(cornerB)));
      float grain=texture2D(taHeight,wearP.xy*.73).r;
      float scuff=corner*smoothstep(.45,.65,grain);
      float dust=exp(-max(wearP.y-1.,0.)*5.)*(.4+.6*grain);
      diffuseColor.rgb*=mix(vec3(1.),vec3(.85,.80,.72),dust*.22+scuff*.35);
    `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',
      '#include <roughnessmap_fragment>\nroughnessFactor=min(1.,roughnessFactor+scuff*.08);');
  };
  material.customProgramCacheKey=()=>key+'-corner-wear-v1';
}
