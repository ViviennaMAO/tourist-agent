/** Metric, filtered surface detail. No light/shadow is painted into albedo;
 * normals and roughness respond to the actual scene lights and reflections. */
export function installSurfaceFinish(material,kind,{metricAttribute=false}={}){
  const previous=material.onBeforeCompile,key=material.customProgramCacheKey();
  material.userData.surfaceKind=kind;
  material.onBeforeCompile=function(shader,renderer){
    previous.call(this,shader,renderer);
    shader.vertexShader=`varying vec3 sfPosition;\n${metricAttribute?'attribute vec3 surfacePosition;':''}\n`+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>\nsfPosition=${metricAttribute?'surfacePosition':'position'};`);
    shader.fragmentShader=`varying vec3 sfPosition;
      float sfHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float sfNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(sfHash(i),sfHash(i+vec2(1,0)),f.x),mix(sfHash(i+vec2(0,1)),sfHash(i+1.),f.x),f.y);}
      float sfHeight,sfRough;
      `+shader.fragmentShader;
    const code={
      limestone:`
        vec2 courses=uv/vec2(1.15,.57);courses.x+=mod(floor(courses.y),2.)*.5;
        vec2 edge=min(fract(courses),1.-fract(courses));
        vec2 aa=max(fwidth(courses),vec2(.0001));
        float seam=1.-min(smoothstep(.003,.003+aa.x*1.2,edge.x),smoothstep(.005,.005+aa.y*1.2,edge.y));
        seam*=1.-smoothstep(.06,.22,max(aa.x,aa.y));
        float block=sfHash(floor(courses));
        float pore=smoothstep(.76,.94,sfNoise(uv*74.))*fine;
        diffuseColor.rgb*=.965+cloud*.06+(block-.5)*.045-seam*.045-pore*.018;
        sfHeight=(cloud-.5)*.003-pore*.0003-seam*.0005;
        sfRough=(cloud-.5)*.09+pore*.07;`,
      paving:`
        float grain=sfNoise(uv*38.)*fine;
        diffuseColor.rgb*=.97+cloud*.05+(grain-.5*fine)*.035;
        sfHeight=(grain-.5*fine)*.0018;sfRough=(cloud-.5)*.07;`,
      wood:`
        vec2 timber=vec2(sfPosition.x*.7,(sfPosition.z+sfPosition.y)*24.);
        float grain=sfNoise(timber+vec2(0.,sfNoise(timber*.11)*3.));
        float growth=sin((sfPosition.z+sfPosition.y)*110.+sfNoise(timber*.3)*7.);
        float visible=1.-smoothstep(.02,.09,footprint);
        diffuseColor.rgb*=.9+grain*.17+(growth*.035)*visible;
        sfHeight=(grain-.5)*.002*visible;sfRough=(grain-.5)*.12*visible;`,
      paint:`
        diffuseColor.rgb*=.985+cloud*.022;
        sfHeight=0.;sfRough=(cloud-.5)*.025;`,
      fabric:`
        float weave=sin(uv.x*460.)*sin(uv.y*460.);
        float visible=1.-smoothstep(.003,.014,footprint);
        diffuseColor.rgb*=.97+cloud*.035+weave*.018*visible;
        sfHeight=weave*.00025*visible;sfRough=cloud*.025;`
    }[kind];
    if(!code)throw new Error('Unknown surface finish: '+kind);
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      vec3 face=abs(normalize(cross(dFdx(sfPosition),dFdy(sfPosition))));
      vec2 uv=face.y>.65?sfPosition.xz:(face.x>face.z?sfPosition.zy:sfPosition.xy);
      float footprint=max(length(dFdx(uv)),length(dFdy(uv)));
      float fine=1.-smoothstep(.008,.045,footprint);
      float cloud=sfNoise(uv*1.7)*.65+sfNoise(uv*6.3)*.35;
      ${code}
    `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=clamp(roughnessFactor+sfRough,.06,1.);');
    shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
      vec3 sdx=dFdx(-vViewPosition),sdy=dFdy(-vViewPosition),srx=cross(sdy,normal),sry=cross(normal,sdx);
      float sdet=dot(sdx,srx);normal=normalize(abs(sdet)*normal-sign(sdet)*(dFdx(sfHeight)*srx+dFdy(sfHeight)*sry));`);
  };
  material.customProgramCacheKey=()=>key+'-metric-'+kind+'-'+metricAttribute+'-v1';
  material.needsUpdate=true;
}
