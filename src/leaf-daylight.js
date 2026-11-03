/** Thin-leaf diffuse fill; keeps cutouts, scene shadows and vein contrast. */
export function installLeafDaylight(material) {
  const before=material.onBeforeCompile,key=material.customProgramCacheKey();
  const bakedTexture=!!material.map;
  material.onBeforeCompile=function(shader,renderer){
    before.call(this,shader,renderer);
    if(bakedTexture)shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      // Unbake only the darkest photographed leaf areas. Vertex-coloured palms
      // have no photographic shadow and must keep their authored palette.
      float leafLuma=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
      float bakedShadow=1.-smoothstep(.035,.24,leafLuma);
      diffuseColor.rgb=mix(diffuseColor.rgb,sqrt(max(diffuseColor.rgb,vec3(0.)))*.78,.62*bakedShadow);
    `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_end>',`#include <lights_fragment_end>
      // Absolute world orientation keeps the two-sided sky return stable when
      // the camera crosses a leaf. This is bounded diffuse fill, not emission.
      vec3 leafWorldN=inverseTransformDirection(normal,viewMatrix);
      float leafSky=.45+.55*abs(leafWorldN.y);
      reflectedLight.indirectDiffuse+=diffuseColor.rgb*vec3(.15,.19,.14)*leafSky;
      vec3 leafSun=normalize(vec3(-1.1,.72,.85));
      float leafTransmission=pow(abs(dot(leafWorldN,leafSun)),1.4);
      reflectedLight.indirectDiffuse+=diffuseColor.rgb*vec3(.14,.12,.055)*leafTransmission;
    `);
  };
  material.customProgramCacheKey=()=>key+'-leaf-daylight-v2-'+(bakedTexture?'map':'vertex');
}
