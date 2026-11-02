/** Regrade the legacy colour atlas per surface, preserving UVs and ornament.
 * Blue glazing gets its own roughness/metalness; walls and green podiums remain
 * matte. Shared source textures are never changed or disposed. */
export function landmarkFinish(before,id) {
  const after=before.clone(),prior=before.onBeforeCompile,priorKey=before.customProgramCacheKey();
  const frame=id==='dubai_frame',museum=id==='museum_future';
  after.color.set('#ffffff');after.emissiveIntensity=0;after.envMapIntensity=1.05;
  if(!frame&&!museum){after.userData.cityGlass=true;after.userData.reflectionZone='skyline';}
  after.roughness=frame?.42:museum?.32:.8;after.metalness=frame?.68:museum?.62:.02;
  after.onBeforeCompile=function(shader,renderer){
    prior.call(this,shader,renderer);
    const tone=id==='atlantis'?'1.10,.87,.72':id==='burj_al_arab'?'.96,.98,1.0':'.94,.96,.95';
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
      float landmarkLum=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
      float landmarkBlue=smoothstep(.025,.18,diffuseColor.b-max(diffuseColor.r,diffuseColor.g*.83));
      float landmarkGreen=smoothstep(.015,.12,diffuseColor.g-max(diffuseColor.r,diffuseColor.b));
      ${frame||museum?`diffuseColor.rgb=mix(diffuseColor.rgb,vec3(landmarkLum),.9)*vec3(${frame?'1.12,.88,.52':'.94,1.,1.03'});`:`
      vec3 wall=vec3(landmarkLum)*vec3(${tone});
      vec3 glazing=vec3(.34,.46,.54)*(.48+.78*sqrt(max(landmarkLum,0.)));
      vec3 planted=vec3(.30,.36,.19)*(.42+.72*landmarkLum);
      diffuseColor.rgb=mix(mix(wall,glazing,landmarkBlue),planted,landmarkGreen);
      `}
    `);
    if(!frame&&!museum){
      shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(.86,.26,landmarkBlue*(1.-landmarkGreen));');
      shader.fragmentShader=shader.fragmentShader.replace('#include <metalnessmap_fragment>','#include <metalnessmap_fragment>\nmetalnessFactor=mix(.02,.48,landmarkBlue*(1.-landmarkGreen));');
    }
  };
  after.customProgramCacheKey=()=>priorKey+'-dubai-landmark-v2-'+id;
  return after;
}
