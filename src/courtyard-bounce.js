// Bounded first-bounce approximation for the two shaded arcades. This is
// diffuse irradiance, applied before AO and tone mapping, not emissive paint.
export function installCourtyardBounce(material,origin,strength){
  const before=material.onBeforeCompile,key=material.customProgramCacheKey();
  material.onBeforeCompile=(shader,renderer)=>{
    before.call(material,shader,renderer);
    shader.uniforms.courtyardOrigin={value:origin};shader.uniforms.courtyardBounce=strength;
    shader.vertexShader='varying vec3 courtyardWorld;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\ncourtyardWorld=(modelMatrix*vec4(transformed,1.)).xyz;');
    shader.fragmentShader='varying vec3 courtyardWorld; uniform vec3 courtyardOrigin; uniform float courtyardBounce;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_end>',`#include <lights_fragment_end>
      vec3 cp=courtyardWorld-courtyardOrigin;
      float porch=exp(-pow((abs(cp.x+20.)-7.2)/1.05,2.));
      porch*=1.-smoothstep(2.7,3.3,abs(cp.z+9.8));
      porch*=1.-smoothstep(3.8,4.4,cp.y);
      vec3 worldN=inverseTransformDirection(normal,viewMatrix);
      float groundFacing=clamp(.65-.45*worldN.y,0.,1.);
      float falloff=exp(-max(cp.y-1.,0.)*.28);
      reflectedLight.indirectDiffuse+=diffuseColor.rgb*vec3(.38,.29,.19)*porch*groundFacing*falloff*courtyardBounce;
    `);
  };
  material.customProgramCacheKey=()=>key+'-courtyard-bounce-v1';
}
