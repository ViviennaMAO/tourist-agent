import * as THREE from 'three';
import {Reflector} from 'three/addons/objects/Reflector.js';

// Continuous, derivative-filtered stone veins; joints are sized in scene units.
export function installInteriorMarble(material,{tiles=true}={}){
 material.onBeforeCompile=shader=>{
  shader.vertexShader='varying vec3 marbleP;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nmarbleP=position;');
  shader.fragmentShader=`varying vec3 marbleP;
   float imHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
   float imNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(imHash(i),imHash(i+vec2(1,0)),f.x),mix(imHash(i+vec2(0,1)),imHash(i+1.),f.x),f.y);}
  `+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   vec3 axis=abs(normalize(cross(dFdx(marbleP),dFdy(marbleP))));vec2 p=axis.y>.6?marbleP.xz:marbleP.xy;
   float n=imNoise(p*.6)+.35*imNoise(p*1.8),vein=abs(sin(p.x*.9+p.y*.38+n*3.4));
   float aa=max(length(fwidth(p)),.003);float line=1.-smoothstep(.018,.08+aa,vein);
   diffuseColor.rgb*=.965+.035*n-line*.12;
   ${tiles?`vec2 cell=p/1.5,edge=min(fract(cell),1.-fract(cell)),fw=max(fwidth(cell),vec2(.001));float seam=1.-min(smoothstep(.002,.002+fw.x,edge.x),smoothstep(.002,.002+fw.y,edge.y));diffuseColor.rgb*=1.-seam*.13;diffuseColor.rgb*=.98+.04*imHash(floor(cell));`:''}
  `);
 };
 material.customProgramCacheKey=()=>`interior-marble-v1-${tiles}`;
}

export function installInteriorRug(material,halfWidth,halfDepth,{centerX=0,centerZ=0}={}){
 material.onBeforeCompile=shader=>{
  shader.vertexShader='varying vec2 rugP;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nrugP=position.xz;');
  shader.fragmentShader='varying vec2 rugP;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   vec2 p=rugP-vec2(${centerX.toFixed(3)},${centerZ.toFixed(3)});float aa=max(length(fwidth(p)),.002),edge=min(${halfWidth.toFixed(3)}-abs(p.x),${halfDepth.toFixed(3)}-abs(p.y));
   float borders=(1.-smoothstep(.015,.015+aa,abs(edge-.15)))+(1.-smoothstep(.02,.02+aa,abs(edge-.48)));
   vec2 cell=mod(p+vec2(.75,.6),vec2(1.5,1.2))-vec2(.75,.6);float a=atan(cell.y,cell.x),r=length(cell);
   float petals=1.-smoothstep(.015,.015+aa,abs(r-(.18+.055*cos(a*8.))));
   float vine=1.-smoothstep(.01,.01+aa,abs(cell.y-.29*sin(cell.x*6.)));
   float med=length(p/vec2(2.8,3.8)),ma=atan(p.y,p.x),medallion=1.-smoothstep(.012,.012+aa,abs(med-(.65+.06*cos(ma*12.))));
   float visible=1.-smoothstep(.05,.16,aa);float pattern=clamp(borders*.75+petals*.4*visible+vine*.14*visible+medallion*.55,0.,.9);
   diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.46,.36,.17),pattern);
   float weave=sin(p.x*380.)*sin(p.y*380.)*(1.-smoothstep(.004,.02,aa));diffuseColor.rgb*=.97+weave*.025;
  `);
 };
 material.customProgramCacheKey=()=>`interior-woven-rug-v2-${halfWidth}-${halfDepth}-${centerX}-${centerZ}`;
}

export function createInteriorPool({x,z,w,d,y=.452}){
 const mirror=new Reflector(new THREE.PlaneGeometry(w,d),{textureWidth:512,textureHeight:512,multisample:0,clipBias:.003,color:'#61969a'});
 mirror.name='Interior pool — reflected architecture';mirror.userData.skipContact=true;mirror.rotation.x=-Math.PI/2;mirror.position.set(x,y,z);
 const m=mirror.material;m.uniforms.time={value:0};
 m.vertexShader=m.vertexShader.replace('varying vec4 vUv;','varying vec4 vUv; varying vec2 poolP;').replace('vUv = textureMatrix','poolP=position.xy;\n vUv = textureMatrix');
 m.fragmentShader=m.fragmentShader.replace('varying vec4 vUv;','varying vec4 vUv; varying vec2 poolP; uniform float time;').replace('vec4 base = texture2DProj( tDiffuse, vUv );',`vec4 coord=vUv;vec2 ripple=vec2(sin(poolP.y*9.+time*.8)+sin(poolP.x*5.-time),cos(poolP.x*8.+time*.7));coord.xy+=ripple*.00045*coord.w;vec4 base=texture2DProj(tDiffuse,coord);`).replace('blendOverlay( base.rgb, color )','mix(vec3(.045,.17,.18),base.rgb,.5)');
 let last=-Infinity;const capture=mirror.onBeforeRender;
 mirror.onBeforeRender=function(...args){const now=m.uniforms.time.value;if(now-last<1/24)return;last=now;capture.apply(this,args);};
 return {mesh:mirror,update(t){m.uniforms.time.value=t;},dispose(){mirror.dispose();}};
}

// Small, deterministic animated emissive studies, confined to the two exhibits.
export function installExhibitLight(material,kind){
 const time={value:0};material.onBeforeCompile=shader=>{
  shader.uniforms.exhibitTime=time;
  shader.vertexShader='varying vec3 exhibitP;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nexhibitP=position;');
  shader.fragmentShader='varying vec3 exhibitP; uniform float exhibitTime;\n'+shader.fragmentShader;
  const colour=kind==='planet'?`
   vec3 p=normalize(exhibitP-vec3(0.,3.,-1.));float a=atan(p.z,p.x)+exhibitTime*.025;
   float land=sin(a*3.+sin(p.y*9.))*sin(p.y*7.+sin(a*5.));
   vec3 exhibitColour=mix(vec3(.015,.065,.16),vec3(.08,.28,.24),smoothstep(.1,.45,land));
   float cloud=pow(.5+.5*sin(a*8.+p.y*22.+sin(a*5.)*2.),16.);exhibitColour=mix(exhibitColour,vec3(.45,.65,.68),cloud*.6);
   diffuseColor.rgb=exhibitColour;totalEmissiveRadiance=exhibitColour*.12;`:`
   vec2 p=exhibitP.xy;float band=exp(-pow((p.y-3.4-sin(p.x*.38+exhibitTime*.05)*1.05)*1.1,2.));
   float dust=.5+.5*sin(p.x*2.8+sin(p.y*5.)+exhibitTime*.035);
   vec3 exhibitColour=vec3(.005,.012,.04)+band*mix(vec3(.025,.07,.12),vec3(.14,.05,.19),dust);
   diffuseColor.rgb*=.2;totalEmissiveRadiance=exhibitColour;`;
  shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n'+colour);
 };material.customProgramCacheKey=()=>`interior-exhibit-${kind}-v1`;
 return t=>{time.value=t;};
}
