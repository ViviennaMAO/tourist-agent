import {ShaderChunk,CustomToneMapping,SRGBColorSpace} from 'three';

// One display transform for the two renderers. Keep ACES highlight roll-off,
// then restore muted midtone chroma in linear sRGB before output encoding.
// Three r160 bypasses tone mapping for reflection render targets, so probes and
// water remain scene-linear and are graded only when displayed on the screen.
const marker='// tourist-clear-daylight-v1';
const custom=`${marker}
vec3 CustomToneMapping( vec3 color ) {
 vec3 mapped = ACESFilmicToneMapping(color);
 float luma = dot(mapped,vec3(.2126,.7152,.0722));
 float peak = max(mapped.r,max(mapped.g,mapped.b));
 float low = min(mapped.r,min(mapped.g,mapped.b));
 float chroma = (peak-low)/max(peak,.0001);
 float vibrance = .38*(1.-smoothstep(.65,.98,chroma));
 vibrance *= 1.-smoothstep(.68,.96,luma);
 vec3 delta = (mapped-vec3(luma))*vibrance;
 // Fit the chroma increase into gamut instead of clipping individual channels.
 vec3 room = mix(mapped,vec3(1.)-mapped,step(vec3(0.),delta));
 vec3 limits = room/max(abs(delta),vec3(.00001));
 float gain = min(1.,min(limits.r,min(limits.g,limits.b)));
 return mapped+delta*gain;
}`;
export function configureColorLook(renderer,exposure){
 if(!ShaderChunk.tonemapping_pars_fragment.includes(marker)){
  const source=ShaderChunk.tonemapping_pars_fragment;
  const replaced=source.replace(/vec3 CustomToneMapping\( vec3 color \) \{ return color; \}/,custom);
  if(source===replaced)throw new Error('Unsupported Three.js custom tone mapping chunk');
  ShaderChunk.tonemapping_pars_fragment=replaced;
 }
 renderer.outputColorSpace=SRGBColorSpace;
 renderer.toneMapping=CustomToneMapping;
 renderer.toneMappingExposure=exposure;
}
