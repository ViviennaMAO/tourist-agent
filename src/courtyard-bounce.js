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
      float bayZ=clamp(floor((cp.z+9.8)/1.98+.5),-1.,1.)*1.98;
      // Actual pendant positions follow the two shop ceiling heights. Use
      // normal-aware falloff so shelf tops, pottery and back walls separate.
      vec3 roomN=vec3(worldN.x*sign(cp.x+20.),worldN.y,worldN.z);
      vec3 toLamp=vec3(.55-depth, (cp.x < -20. ? 3.036 : 3.16)-cp.y, bayZ-(cp.z+9.8));
      float lampDistance2=dot(toLamp,toLamp);
      float lampFacing=.16+.84*max(dot(roomN,toLamp*inversesqrt(max(lampDistance2,.0025))),0.);
      float lamp=lampFacing/(1.+3.2*lampDistance2);
      vec3 roomLight=vec3(.50,.58,.68)*exp(-max(depth,0.)*1.7)*windowFacing;
      roomLight+=vec3(2.20,1.13,.44)*lamp;
      // Narrow shelf undersides retain occlusion instead of being filled flat.
      // Shelf levels are the same 1.73 / 2.22 / 2.74 m used by the display mesh.
      vec3 belowShelf=vec3(1.73,2.22,2.74)-cp.y;
      vec3 shelfBand=(belowShelf-vec3(.045))/.055;
      vec3 shelfShade=exp(-shelfBand*shelfBand)*step(vec3(0.),belowShelf);
      float shelfAO=1.-.32*max(max(shelfShade.x,shelfShade.y),shelfShade.z)*smoothstep(.78,.96,depth);
      reflectedLight.indirectDiffuse*=1.-room*.65*courtyardBounce;
      roomLight*=shelfAO;
      reflectedLight.indirectDiffuse+=diffuseColor.rgb*roomLight*room*courtyardBounce;
    `);
  };
  material.customProgramCacheKey=()=>key+'-courtyard-bounce-v4';
}
