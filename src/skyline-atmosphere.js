import { Color } from 'three';

/** Distance-dependent aerial light for the skyline only. Applied in linear
 * radiance before tone mapping; near facades retain their material contrast. */
export function installSkylineAtmosphere(material, strength = .20) {
  const before = material.onBeforeCompile, key = material.customProgramCacheKey();
  material.onBeforeCompile = function(shader, renderer) {
    before.call(this, shader, renderer);
    shader.uniforms.skylineAir = { value: new Color('#91aec8') };
    shader.uniforms.skylineAirStrength = { value: strength };
    shader.fragmentShader = 'uniform vec3 skylineAir;\nuniform float skylineAirStrength;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
      float aerialAmount = smoothstep(48., 180., length(vViewPosition)) * skylineAirStrength;
      outgoingLight = mix(outgoingLight, skylineAir, aerialAmount);
      #include <opaque_fragment>`);
  };
  material.customProgramCacheKey = () => key + '-skyline-air-v2';
  material.needsUpdate = true;
}
