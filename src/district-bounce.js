/** Low, restrained diffuse ground return shared by the ordinary limestone
 * houses. This is an irradiance approximation, before AO and tone mapping. */
export function installDistrictBounce(material, origin, strength) {
  const before = material.onBeforeCompile, key = material.customProgramCacheKey();
  material.onBeforeCompile = function(shader, renderer) {
    before.call(this, shader, renderer);
    shader.uniforms.districtGroundOrigin = { value: origin };
    shader.uniforms.districtGroundBounce = strength;
    shader.vertexShader = 'varying vec3 districtGroundPosition;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\ndistrictGroundPosition=(modelMatrix*vec4(transformed,1.)).xyz;');
    shader.fragmentShader = 'varying vec3 districtGroundPosition; uniform vec3 districtGroundOrigin; uniform float districtGroundBounce;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
      float districtHeight=max(districtGroundPosition.y-districtGroundOrigin.y-1.,0.);
      vec3 districtN=inverseTransformDirection(normal,viewMatrix);
      float districtReturn=exp(-districtHeight*.48)*clamp(.65-.45*districtN.y,0.,1.);
      reflectedLight.indirectDiffuse+=diffuseColor.rgb*vec3(.18,.145,.105)*districtReturn*districtGroundBounce;
    `);
  };
  material.customProgramCacheKey = () => key + '-district-ground-bounce-v1';
}
