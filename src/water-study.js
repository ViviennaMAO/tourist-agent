/** Analytic small-wave normals and Fresnel daylight, with the original shader
 * retained behind a uniform switch. No screen-space or reflected-scene claim. */
export function createWaterStudy({ THREE, seaMat, lagoonMat }) {
  const records = [seaMat, lagoonMat].map(material => ({ material, fragment: material.fragmentShader }));
  const body = `
    if (uRealism > .5) {
      vec2 p = vW.xz;
      float t = uT * .65;
      float distanceToEye = length(cameraPosition - vW);
      float fine = 1. - smoothstep(55., 220., distanceToEye);
      vec2 slope = vec2(0.);
      slope += vec2(.15,.045) * cos(dot(p,vec2(1.4,.42)) + t * 1.3);
      slope += vec2(-.072,.12) * cos(dot(p,vec2(-.8,1.35)) - t * 1.1);
      slope += vec2(.055,.11) * cos(dot(p,vec2(3.6,7.2)) - t * 2.1) * fine;
      slope += vec2(-.07,.033) * cos(dot(p,vec2(-8.4,4.1)) + t * 2.7) * fine;
      slope += vec2(.045,-.035) * cos(dot(p,vec2(15.6,-12.2)) + t * 3.1) * fine;
      vec3 N = normalize(vec3(-slope.x, 1., -slope.y));
      vec3 V = normalize(cameraPosition - vW);
      float fresnel = .025 + .975 * pow(1. - max(dot(N,V),0.), 5.);
      vec3 reflection = mix(vec3(.20,.30,.35), vec3(.55,.65,.69), clamp(reflect(-V,N).y,0.,1.));
      float swell = .5 + .5 * sin(p.x*.21 + p.y*.13+t*.4) * sin(p.y*.28-t*.3);
      vec3 water = mix(vec3(.025,.10,.125), vec3(.065,.19,.20), swell);
      vec3 col = mix(water, reflection, .22 + fresnel*.68);
      vec3 H = normalize(V + normalize(uWaterSun));
      float glint = pow(max(dot(N,H),0.), 180.);
      col += vec3(1.,.83,.58) * glint * 1.1;
      col = mix(col, uWaterFog, smoothstep(uFogNear,uFogFar,distanceToEye));
      gl_FragColor = vec4(col,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      return;
    }
  `;
  for (const { material } of records) {
    material.uniforms.uRealism = { value: 0 };
    material.uniforms.uWaterSun = { value: new THREE.Vector3(-.64,.88,.5).normalize() };
    material.uniforms.uWaterFog = { value: new THREE.Color('#e0e1d8') };
    material.fragmentShader = 'uniform float uRealism; uniform vec3 uWaterSun,uWaterFog;\n' + material.fragmentShader.replace('void main(){', 'void main(){' + body);
    material.needsUpdate = true;
  }
  // Used only by the Dubai lake; it shares time but owns the material.
  const lakeMaterial = lagoonMat.clone();
  lakeMaterial.uniforms.uT = seaMat.uniforms.uT;
  lakeMaterial.uniforms.uRealism.value = 1;
  return { lakeMaterial,
    setEnabled(v) { records.forEach(r => r.material.uniforms.uRealism.value = v ? 1 : 0); },
    update({ sunDirection, fog, near, far }) {
      for (const m of [...records.map(r => r.material), lakeMaterial]) {
        m.uniforms.uWaterSun.value.copy(sunDirection); m.uniforms.uWaterFog.value.copy(fog);
        m.uniforms.uFogNear.value = near; m.uniforms.uFogFar.value = far;
      }
    },
    dispose() {
      for (const { material, fragment } of records) {
        material.fragmentShader = fragment; material.needsUpdate = true;
        delete material.uniforms.uRealism; delete material.uniforms.uWaterSun; delete material.uniforms.uWaterFog;
      }
      lakeMaterial.dispose();
    }
  };
}
