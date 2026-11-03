import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { chamferedBox } from './chamfered-box.js';

/** Replace visual bridge parts in their own local frame. Route endpoints, width
 * and walking elevation remain owned by the existing navigation records. */
export function createBridgeRefinement({group,length,halfWidth,top,source,crossing=false,start=0,end=length}){
  const root=new THREE.Group();root.name='Dubai — limestone bridge and open bronze rails';group.add(root);
  const saved=source.map(mesh=>({mesh,visible:mesh.visible})),parts=new Map();
  const stone=new THREE.MeshStandardMaterial({color:'#bbae96',roughness:.89});
  const light=new THREE.MeshStandardMaterial({color:'#c5b9a2',roughness:.9});
  const metal=new THREE.MeshStandardMaterial({color:'#574d3f',roughness:.48,metalness:.65});
  const dark=new THREE.MeshStandardMaterial({color:'#746e60',roughness:.93});
  const paving=new THREE.MeshStandardMaterial({color:'#c4b69f',roughness:.91});
  paving.onBeforeCompile=shader=>{
    shader.vertexShader='varying vec3 bridgeP;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nbridgeP=position;');
    shader.fragmentShader='varying vec3 bridgeP;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      vec2 tile=bridgeP.xz/vec2(.72,.60);tile.x+=mod(floor(tile.y),2.)*.5;
      vec2 e=min(fract(tile),1.-fract(tile)),aa=max(fwidth(tile),vec2(.0001));
      float line=1.-min(smoothstep(.006,.006+aa.x,e.x),smoothstep(.006,.006+aa.y,e.y));
      float shade=fract(sin(dot(floor(tile),vec2(13.1,27.7)))*43758.54)-.5;
      float spanEdge=min(fract(bridgeP.x/12.),1.-fract(bridgeP.x/12.));
      float expansion=1.-smoothstep(.001,.001+max(fwidth(bridgeP.x/12.),.0001),spanEdge);
      diffuseColor.rgb*=1.-line*.10+shade*.04-expansion*.12;`);
  };
  paving.customProgramCacheKey=()=> 'dubai-bridge-paving-v1';
  const materials=[stone,light,metal,dark,paving];
  function box(m,x,y,z,w,h,d,bevel=.012){const g=chamferedBox(w,h,d,bevel).translate(x,y,z);if(!parts.has(m))parts.set(m,[]);parts.get(m).push(g);}
  const span=end-start,edge=halfWidth-.12;
  box(stone,(start+end)/2,top-.17,0,span,.34,halfWidth*2,.035);
  // Open railing replaces the opaque white parapet, with slim uprights and
  // vertical infill. Posts stay outside the central clear span.
  for(const sign of [-1,1]){
    box(light,(start+end)/2,top+.025,sign*edge,span,.05,.22);
    box(metal,(start+end)/2,top+.70,sign*edge,span,.036,.045);
    box(metal,(start+end)/2,top+.16,sign*edge,span,.024,.035);
    const count=Math.ceil(span/2.2),step=span/count;
    for(let i=0;i<=count;i++){
      const x=start+i*step;box(metal,x,top+.36,sign*edge,.055,.70,.055);
      box(light,x,top+.055,sign*edge,.13,.11,.15);
      if(i<count)for(let j=1;j<6;j++)box(metal,x+j*step/6,top+.42,sign*edge,.017,.49,.021,.003);
    }
  }
  const strips=crossing?[[0,halfWidth*2-.18]]:[[-1.96,.55],[1.96,.55]];
  for(const [z,width] of strips){
    const g=new THREE.PlaneGeometry(span,width).rotateX(-Math.PI/2).translate((start+end)/2,top+.012,z).toNonIndexed();
    if(!parts.has(paving))parts.set(paving,[]);parts.get(paving).push(g);
  }
  for(let x=2;x<length-1;x+=crossing?12:3.4){
    const yBottom=-.85,h=top-.34-yBottom;
    box(stone,x,yBottom+h/2,0,crossing?.85:.55,h,crossing?3.1:2.3,.05);
    box(light,x,top-.39,0,crossing?1.25:.80,.16,crossing?3.5:2.65,.025);
    box(dark,x,-.76,0,crossing?1.05:.72,.18,crossing?3.3:2.48,.025);
  }
  for(const [m,geos] of parts){const g=mergeGeometries(geos);geos.forEach(v=>v.dispose());const mesh=new THREE.Mesh(g,m);mesh.castShadow=m!==paving;mesh.receiveShadow=true;root.add(mesh);}
  let enabled=false,disposed=false;root.visible=false;
  const restore=()=>saved.forEach(s=>s.mesh.visible=s.visible);
  return {root,stats:{bridges:1,triangles:root.children.reduce((n,m)=>n+m.geometry.attributes.position.count/3,0),drawCalls:root.children.length},apply(){if(enabled&&!disposed)saved.forEach(s=>s.mesh.visible=false);},setEnabled(v){if(disposed)return;enabled=!!v;root.visible=enabled;if(enabled)this.apply();else restore();},dispose(){if(disposed)return;this.setEnabled(false);disposed=true;root.removeFromParent();root.children.forEach(m=>m.geometry.dispose());materials.forEach(m=>m.dispose());}};
}
