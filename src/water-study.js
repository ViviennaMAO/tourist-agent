import {createWaterReflection} from './water-reflection.js';
/** Analytic small-wave normals and Fresnel daylight, with the original shader
 * retained behind a uniform switch. Nearby water also samples a wave-distorted planar scene capture. */
export function createWaterStudy({ THREE, seaMat, lagoonMat, renderer, scene, camera }) {
  const records = [seaMat, lagoonMat].map(material => ({ material, fragment: material.fragmentShader }));
  const noise = `
    float waterHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    // Analytic gradient of smooth value noise: irregular crossing ripples,
    // without texture fetches or a single repeated direction across the bay.
    vec2 waterSlope(vec2 p){
      vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f),du=6.*f*(1.-f);
      float a=waterHash(i),b=waterHash(i+vec2(1,0));
      float c=waterHash(i+vec2(0,1)),d=waterHash(i+vec2(1,1));
      float crossTerm=a-b-c+d;
      return du*(vec2(b-a,c-a)+crossTerm*u.yx);
    }
  `;
  let planar=null;
  const body = `
    if (uRealism > .5) {
      vec2 p = vW.xz;
      float t = uT * .65;
      float distanceToEye = length(cameraPosition - vW);
      float fine = 1. - smoothstep(55., 220., distanceToEye);
      vec2 slope = vec2(0.);
      float warp=sin(dot(p,vec2(.7,.93))+t*.6)*.6;
      slope += vec2(.075,.025) * cos(dot(p,vec2(1.4,.42)) + t * 1.3+warp);
      slope += vec2(-.042,.075) * cos(dot(p,vec2(-.8,1.35)) - t * 1.1);
      slope += waterSlope(p*2.7+vec2(t*.41,-t*.27))*.16*fine;
      slope += waterSlope(mat2(.8,-.6,.6,.8)*p*8.3+vec2(-t*.5,t*.23))*.085*fine;
      // Fade centimetre ripples when their projected wavelength approaches a
      // pixel. Distance alone misses grazing views, where fine waves alias.
      float footprint=max(length(dFdx(p)),length(dFdy(p)));
      float capillary=fine*(1.-smoothstep(.025,.13,footprint));
      slope+=vec2(.06,.035)*cos(dot(p,vec2(32.,19.))+t*4.7+warp)*capillary;
      slope+=vec2(-.025,.055)*cos(dot(p,vec2(-23.,41.))-t*5.3)*capillary;
      vec3 N = normalize(vec3(-slope.x, 1., -slope.y));
      vec3 V = normalize(cameraPosition - vW);
      float fresnel = .025 + .975 * pow(1. - max(dot(N,V),0.), 5.);
      vec3 reflection = mix(vec3(.20,.30,.35), vec3(.55,.65,.69), clamp(reflect(-V,N).y,0.,1.));
      vec4 projected=uWaterReflectionMatrix*vec4(vW,1.);
      vec2 reflectionUV=projected.xy/max(projected.w,.0001)+slope*.018;
      float edge=min(min(reflectionUV.x,1.-reflectionUV.x),min(reflectionUV.y,1.-reflectionUV.y));
      float captureWeight=uWaterReflectionReady*smoothstep(.0,.06,edge)*step(.001,projected.w);
      if(captureWeight>.001){
        vec3 reflected=texture2D(uWaterReflection,reflectionUV).rgb;
        reflection=mix(reflection,reflected,captureWeight*.88);
      }
      float swell = .5 + .5 * sin(p.x*.21 + p.y*.13+t*.4) * sin(p.y*.28-t*.3);
      vec3 water = mix(vec3(.025,.10,.125), vec3(.065,.19,.20), swell);
      vec3 col = mix(water, reflection, .22 + fresnel*.68);
      vec3 H = normalize(V + normalize(uWaterSun));
      float glint = pow(max(dot(N,H),0.), 180.);
      col += vec3(1.,.87,.68) * (glint*1.3+pow(max(dot(N,H),0.),38.)*.22);
      col = mix(col, uWaterFog, smoothstep(uFogNear,uFogFar,distanceToEye));
      gl_FragColor = vec4(col,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      return;
    }
  `;
  for (const { material } of records) {
    material.uniforms.uRealism = { value: 0 };
    material.uniforms.uWaterReflection={value:null};
    material.uniforms.uWaterReflectionMatrix={value:new THREE.Matrix4()};
    material.uniforms.uWaterReflectionReady={value:0};
    material.uniforms.uWaterSun = { value: new THREE.Vector3(-.64,.88,.5).normalize() };
    material.uniforms.uWaterFog = { value: new THREE.Color('#e0e1d8') };
    material.fragmentShader = 'uniform float uRealism,uWaterReflectionReady; uniform vec3 uWaterSun,uWaterFog; uniform sampler2D uWaterReflection; uniform mat4 uWaterReflectionMatrix;\n' + noise + material.fragmentShader.replace('void main(){', 'void main(){' + body);
    material.needsUpdate = true;
  }
  // Used only by the Dubai lake; it shares time but owns the material.
  const lakeMaterial = lagoonMat.clone();
  lakeMaterial.uniforms.uT = seaMat.uniforms.uT;
  lakeMaterial.uniforms.uRealism.value = 1;
  const all=[seaMat,lagoonMat,lakeMaterial];
  return { lakeMaterial,
    capture(active){
      if(!active){for(const m of all)m.uniforms.uWaterReflectionReady.value=0;return;}
      if(!renderer)return;
      planar??=createWaterReflection({renderer,scene,camera,waterMaterials:all});
      // Elevated basins retain their local analytic surface: a sea-level
      // capture would place their reflected geometry below the wrong plane.
      if(planar.capture())for(const m of [seaMat,lagoonMat]){
        m.uniforms.uWaterReflection.value=planar.texture;
        m.uniforms.uWaterReflectionMatrix.value.copy(planar.matrix);
        m.uniforms.uWaterReflectionReady.value=1;
      }
    },
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
      for(const {material} of records)for(const key of ['uWaterReflection','uWaterReflectionMatrix','uWaterReflectionReady'])delete material.uniforms[key];
      planar?.dispose();lakeMaterial.dispose();
    }
  };
}
