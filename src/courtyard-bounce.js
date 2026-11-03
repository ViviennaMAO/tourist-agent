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
      reflectedLight.indirectDiffuse+=diffuseColor.rgb*vec3(.46,.39,.29)*porch*groundFacing*falloff*courtyardBounce;
      // Display rooms sit behind the glazing, 7.94–9.1 m from the plaza axis.
      // Suppress uniform outdoor sky fill there, then add bounded window and
      // pendant irradiance. This is a local approximation, not global GI.
      float depth=abs(cp.x+20.)-7.94;
      float room=smoothstep(-.04,.16,depth)*(1.-smoothstep(1.12,1.28,depth));
      room*=1.-smoothstep(2.7,3.05,abs(cp.z+9.8));
      room*=smoothstep(1.12,1.23,cp.y)*(1.-smoothstep(3.45,3.75,cp.y));
      float windowFacing=.25+.75*max(dot(worldN,vec3(-sign(cp.x+20.),0.,0.)),0.);
      float bayDistance=min(abs(cp.z+9.8),abs(abs(cp.z+9.8)-1.98));
      float lamp=exp(-1.6*(bayDistance*bayDistance+pow(depth-.55,2.))-.45*pow(cp.y-2.8,2.));
      vec3 roomLight=vec3(.28,.33,.40)*exp(-max(depth,0.)*1.4)*windowFacing;
      roomLight+=vec3(.42,.24,.115)*lamp;
      reflectedLight.indirectDiffuse*=1.-room*.52*courtyardBounce;
      reflectedLight.indirectDiffuse+=diffuseColor.rgb*roomLight*room*courtyardBounce;
    `);
  };
  material.customProgramCacheKey=()=>key+'-courtyard-bounce-v3';
}
