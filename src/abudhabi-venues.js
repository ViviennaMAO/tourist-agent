import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {chamferedBox} from './chamfered-box.js';
import {installSurfaceFinish} from './surface-finish.js';

export const CULTURE_PAVILIONS=[
 {x:-9.455,z:6.981,w:4.98,angle:1.1155,top:5.37,base:.648},
 {x:0,z:-7.168,w:4.844,angle:.9336,top:5.521,base:1.208},
 {x:9.1725,z:6.6915,w:5.947,angle:.5962,top:6,base:.655}
];
export const isVenueGlass=([r,g,b])=>b>r+.035&&g>r+.025&&b>g*.82;
export function metricVenueGeometry(source,toHolder){
 const g=source.clone(),p=source.attributes.position,a=new Float32Array(p.count*3),v=new THREE.Vector3();
 for(let i=0;i<p.count;i++)v.fromBufferAttribute(p,i).applyMatrix4(toHolder).toArray(a,i*3);
 g.setAttribute('surfacePosition',new THREE.BufferAttribute(a,3));return g;
}
export function venueGlassGeometry(source,toHolder,sample,{excludeLowHorizontal=false}={}){
 const pos=source.attributes.position,uv=source.attributes.uv,norm=source.attributes.normal,idx=source.index?.array||Array.from({length:pos.count},(_,i)=>i),positions=[],normals=[];
 const normalMatrix=new THREE.Matrix3().getNormalMatrix(toHolder);if(!uv||!norm)return null;
 for(let k=0;k<idx.length;k+=3){
  const ids=[idx[k],idx[k+1],idx[k+2]],us=ids.map(i=>new THREE.Vector2().fromBufferAttribute(uv,i));
  if(excludeLowHorizontal){
   const points=ids.map(i=>new THREE.Vector3().fromBufferAttribute(pos,i).applyMatrix4(toHolder));
   const face=points[1].clone().sub(points[0]).cross(points[2].clone().sub(points[0])).normalize();
   if(Math.abs(face.y)>.7&&points.every(p=>p.y<1.6))continue;
  }
  const votes=[[1/3,1/3,1/3],[.6,.2,.2],[.2,.6,.2],[.2,.2,.6]].filter(weights=>{
   const u=us.reduce((p,q,j)=>p.addScaledVector(q,weights[j]),new THREE.Vector2());return isVenueGlass(sample(u.x,u.y));
  }).length;if(votes<3)continue;
  for(const i of ids){const n=new THREE.Vector3().fromBufferAttribute(norm,i).applyMatrix3(normalMatrix).normalize(),p=new THREE.Vector3().fromBufferAttribute(pos,i).applyMatrix4(toHolder).addScaledVector(n,.012);positions.push(...p.toArray());normals.push(...n.toArray());}
 }
 if(!positions.length)return null;
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));return g;
}

/** Source atlas still supplies the badge, trim and recess masks. Material
 * response uses normalized metre coordinates, not source-centimetre noise. */
export function installVenueFinish(material,id){
 const prev=material.onBeforeCompile,key=material.customProgramCacheKey();
 material.onBeforeCompile=function(sh,r){
  prev.call(this,sh,r);
  sh.vertexShader=(id==='abrahamic'?'':'attribute vec3 surfacePosition; ')+'varying vec3 venuePoint;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvenuePoint=surfacePosition;');
  sh.fragmentShader='varying vec3 venuePoint; float venueRed; float venueBlue;\n'+sh.fragmentShader;
  sh.fragmentShader=sh.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
   vec3 venueRaw=diffuseColor.rgb;
   float venueLum=dot(venueRaw,vec3(.2126,.7152,.0722));
   venueBlue=smoothstep(.015,.09,venueRaw.b-max(venueRaw.r,venueRaw.g*.78));
   venueRed=smoothstep(.06,.24,venueRaw.r-max(venueRaw.g,venueRaw.b));
   ${id==='ferrari_world'?`
    // Bound the old baked roof gradient while retaining the yellow emblem.
    vec3 roofPaint=vec3(.43,.036,.024)*mix(.92,1.06,clamp(venueLum*2.,0.,1.));
    diffuseColor.rgb=mix(venueRaw,roofPaint,venueRed*.72);
    float venueGreen=smoothstep(.04,.18,venueRaw.g-max(venueRaw.r,venueRaw.b));
    diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.17,.23,.065)*mix(.85,1.05,venueLum),venueGreen*.7);
    float radius=length(venuePoint.xz-vec2(0.,-1.8));
    float panel=radius/1.35;
    float seam=(1.-smoothstep(.004,.004+max(fwidth(panel),.001),min(fract(panel),1.-fract(panel))))*(1.-smoothstep(.12,.4,fwidth(panel)));
    diffuseColor.rgb*=1.-seam*venueRed*.035;
   `:`
    float pale=smoothstep(.22,.55,venueLum);
    diffuseColor.rgb=mix(venueRaw,vec3(.77,.75,.70)*mix(.91,1.03,venueLum),pale*.78);
   `}
  `).replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
   roughnessFactor=${id==='ferrari_world'?'mix(.64,.34,venueRed)':'mix(.68,.18,venueBlue)'};
  `).replace('#include <metalnessmap_fragment>',`#include <metalnessmap_fragment>
   metalnessFactor=${id==='ferrari_world'?'venueRed*.2':'.025'};
  `);
 };material.customProgramCacheKey=()=>key+'-abu-venue-'+id+'-v1';
 if(id==='abrahamic'){
  installSurfaceFinish(material,'limestone',{metricAttribute:true});
  const finish=material.onBeforeCompile;
  material.onBeforeCompile=function(sh,r){finish.call(this,sh,r);sh.fragmentShader=sh.fragmentShader.replace('#include <alphamap_fragment>',`diffuseColor.rgb=mix(diffuseColor.rgb,venueRaw,venueBlue);sfHeight*=1.-venueBlue;sfRough*=1.-venueBlue;
#include <alphamap_fragment>`);};
 }
}
function atlasSampler(image){
 if(!image||typeof document==='undefined')return ()=>[0,0,0];
 const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(image,0,0);
 const {data,width,height}=context.getImageData(0,0,canvas.width,canvas.height);
 return (u,v)=>{const x=Math.min(width-1,Math.max(0,Math.floor(u*width))),y=Math.min(height-1,Math.max(0,Math.floor(v*height))),i=(y*width+x)*4;return [data[i]/255,data[i+1]/255,data[i+2]/255];};
}
function installGlazing(material){
 material.onBeforeCompile=sh=>{
  sh.vertexShader='varying vec3 venueGlassPoint;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvenueGlassPoint=position;');
  sh.fragmentShader='varying vec3 venueGlassPoint;\n'+sh.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   vec3 face=abs(normalize(cross(dFdx(venueGlassPoint),dFdy(venueGlassPoint))));
   vec2 pane=face.y>.7?venueGlassPoint.xz:vec2(face.x>face.z?venueGlassPoint.z:venueGlassPoint.x,venueGlassPoint.y);
   pane/=vec2(.72,1.18);
   vec2 aa=max(fwidth(pane),vec2(.0001)),edge=min(fract(pane),1.-fract(pane));
   float frame=(1.-min(smoothstep(.012,.012+aa.x,edge.x),smoothstep(.009,.009+aa.y,edge.y)))*(1.-smoothstep(.18,.6,max(aa.x,aa.y)));
   diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.12,.14,.14),frame*.6);
  `);
 };material.customProgramCacheKey=()=> 'abu-venue-glazing-v1';
}

export function createAbuVenues({city,sampleColor}){
 const records=[],done=new Set(),samplers=new Map();let enabled=false,disposed=false;
 const stats={venues:0,glassTriangles:0,triangles:0,drawCalls:0};
 function build(id,L){
  L.holder.updateWorldMatrix(true,true);const inv=L.holder.matrixWorld.clone().invert(),swaps=[],glassParts=[];
  L.asset.traverse(o=>{if(!o.isMesh)return;
   const before=o.geometry,toHolder=new THREE.Matrix4().multiplyMatrices(inv,o.matrixWorld),after=metricVenueGeometry(before,toHolder);
   const image=(Array.isArray(o.material)?o.material[0]:o.material).map?.image;
   if(!samplers.has(image))samplers.set(image,atlasSampler(image));
   const glass=venueGlassGeometry(before,toHolder,sampleColor||samplers.get(image),{excludeLowHorizontal:id==='abrahamic'});if(glass)glassParts.push(glass);
   swaps.push({o,before,after});o.geometry=enabled?after:before;
  });
  const root=new THREE.Group();root.name='Abu Dhabi detailed venue '+id;root.visible=enabled;L.holder.add(root);
  const materials=[],batches=new Map();
  const mat=(color,roughness=.7,metalness=0)=>{const m=new THREE.MeshStandardMaterial({color,roughness,metalness});materials.push(m);batches.set(m,[]);return m;};
  const stone=mat('#d7d0bf'),trim=mat('#a9aaa1',.36,.55),recess=mat('#686c63',.7),glass=mat('#526e76',.16,.28),warm=mat('#d4bd8e',.7);
  installSurfaceFinish(stone,'limestone');glass.side=THREE.DoubleSide;glass.envMapIntensity=1.15;glass.userData.cityGlass=true;glass.userData.reflectionZone=id==='abrahamic'?'culture':'skyline';installGlazing(glass);
  warm.emissive.set('#c3a371');warm.emissiveIntensity=.15;
  const add=(g,m)=>{if(g.index){const old=g;g=g.toNonIndexed();old.dispose();}batches.get(m).push(g);};
  const box=(m,x,y,z,w,h,d,angle=0)=>add(chamferedBox(w,h,d,.008).rotateY(angle).translate(x,y,z),m);
  for(const part of glassParts){
   stats.glassTriangles+=part.attributes.position.count/3;
   const edges=new THREE.EdgesGeometry(part,35),p=edges.attributes.position;
   for(let i=0;i<p.count;i+=2){const a=new THREE.Vector3().fromBufferAttribute(p,i),b=new THREE.Vector3().fromBufferAttribute(p,i+1),v=b.clone().sub(a),length=v.length();if(length<.3)continue;
    const g=new THREE.CylinderGeometry(.014,.014,length,5);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize()));g.translate(...a.add(b).multiplyScalar(.5).toArray());add(g,trim);
   }edges.dispose();add(part,glass);
  }
  if(id==='abrahamic')for(const p of CULTURE_PAVILIONS){
   const local=(m,x,y,z,w,h,d)=>{const g=chamferedBox(w,h,d,.008).translate(x,y,z).rotateY(p.angle).translate(p.x,0,p.z);add(g,m);};
   for(const sign of [-1,1]){
    local(trim,0,p.top+.012,sign*(p.w/2-.018),p.w,.034,.055);local(trim,sign*(p.w/2-.018),p.top+.012,0,.055,.034,p.w);
    local(recess,0,p.top-.18,sign*(p.w/2-.04),p.w-.08,.035,.05);local(recess,sign*(p.w/2-.04),p.top-.18,0,.05,.035,p.w-.08);
    local(stone,0,p.base+.035,sign*(p.w/2-.2),p.w-.36,.07,.09);local(stone,sign*(p.w/2-.2),p.base+.035,0,.09,.07,p.w-.36);
   }
  }
  if(id==='ferrari_world'){
   add(new THREE.TorusGeometry(2.925,.028,6,80).rotateX(Math.PI/2).translate(0,4.62,-1.8),trim);
   // Existing miniature entrance, viewed externally; no new walk-in collision.
   for(const sign of [-1,1])box(trim,sign*.64,.94,6.563,.055,.86,.055);
   box(trim,0,1.37,6.563,1.34,.05,.055);box(stone,0,.51,6.6,1.46,.06,.26);
   box(trim,0,.92,6.565,.025,.76,.035);
   for(const x of [-.08,.08])box(trim,x,.91,6.59,.018,.18,.024);
   box(recess,0,2.08,5.58,4.88,.028,1.86);
   box(trim,0,2.31,6.58,4.97,.045,.065);
   for(const x of [-1.8,-.9,0,.9,1.8])box(warm,x,2.06,6.1,.32,.018,.08);
  }
  for(const [m,parts] of batches){if(!parts.length)continue;const g=mergeGeometries(parts);parts.forEach(p=>p.dispose());const mesh=new THREE.Mesh(g,m);mesh.castShadow=m!==glass&&m!==warm;mesh.receiveShadow=true;root.add(mesh);stats.triangles+=g.attributes.position.count/3;stats.drawCalls++;}
  records.push({root,swaps,materials});done.add(id);stats.venues++;
 }
 return {stats,apply(){if(disposed)return;for(const id of ['ferrari_world','abrahamic']){const L=city.LM?.[id];if(L?.loaded&&L.asset&&!done.has(id))build(id,L);}},setEnabled(v){enabled=!!v&&!disposed;for(const r of records){r.root.visible=enabled;r.swaps.forEach(s=>s.o.geometry=enabled?s.after:s.before);}},dispose(){if(disposed)return;this.setEnabled(false);disposed=true;for(const r of records){r.root.removeFromParent();r.root.children.forEach(o=>o.geometry.dispose());r.swaps.forEach(s=>s.after.dispose());r.materials.forEach(m=>m.dispose());}samplers.clear();}};
}
