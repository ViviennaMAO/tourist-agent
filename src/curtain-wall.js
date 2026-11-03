/** Small manufacturing differences in curtain-wall panes. No downloaded maps,
 * extra windows or draw calls; the facade stays readable from a distance. */
export function installCurtainWallFinish(material) {
  const before=material.onBeforeCompile,key=material.customProgramCacheKey();
  material.onBeforeCompile=function(shader,renderer){
    before.call(this,shader,renderer);
    shader.vertexShader='varying vec3 curtainPosition;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\ncurtainPosition=position;');
    shader.fragmentShader=`varying vec3 curtainPosition;
      float curtainHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float curtainVariation;
      vec2 curtainUv;
      `+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      vec3 curtainFace=abs(normalize(cross(dFdx(curtainPosition),dFdy(curtainPosition))));
      curtainUv=vec2(curtainFace.x>curtainFace.z?curtainPosition.z:curtainPosition.x,curtainPosition.y)/vec2(.44,.72);
      curtainVariation=mix(curtainHash(floor(curtainUv)),curtainHash(floor(curtainUv/vec2(3.,2.))),.65);
      // Suppress per-pane variation once a pane falls below a few pixels.
      float curtainDetail=1.-smoothstep(.18,.8,max(fwidth(curtainUv.x),fwidth(curtainUv.y)));
      diffuseColor.rgb*=1.+(curtainVariation-.5)*.10*curtainDetail;
    `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
      roughnessFactor=clamp(roughnessFactor+(curtainVariation-.5)*.035*curtainDetail,.065,1.);
    `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
      // A shallow, smooth bow breaks the perfect shared mirror plane without
      // turning window edges into a noisy normal map.
      float bow=sin(curtainUv.x*6.283185)*sin(curtainUv.y*6.283185)*.0007*curtainDetail;
      vec3 dx=dFdx(-vViewPosition),dy=dFdy(-vViewPosition);
      vec3 rx=cross(dy,normal),ry=cross(normal,dx);
      float det=dot(dx,rx);
      normal=normalize(abs(det)*normal-sign(det)*(dFdx(bow)*rx+dFdy(bow)*ry));
    `);
  };
  material.customProgramCacheKey=()=>key+'-curtain-wall-v5';
  material.needsUpdate=true;
}
