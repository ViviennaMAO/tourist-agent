import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {installSurfaceFinish} from './surface-finish.js';
import {installCurtainWallFinish} from './curtain-wall.js';
import {VEGAS_HOTEL} from './vegas-layout.js';

export function createVegasScene({city}){
 const root=new THREE.Group();root.name='Las Vegas — limestone hotels and retail podiums';city.w.root.add(root);
 const ctx=city.w.ctx,batches=new Map(),owned=[],saved=new Map(),swaps=[],styled=new Set();let enabled=false,disposed=false,registered=false;
 const mat=(color,roughness=.7,metalness=0,kind)=>{const m=new THREE.MeshStandardMaterial({color,roughness,metalness,envMapIntensity:.9});owned.push(m);batches.set(m,[]);if(kind)installSurfaceFinish(m,kind);return m;};
 const walls=[mat('#d8c7a0',.78,0,'limestone'),mat('#c5bda9',.82,0,'limestone'),mat('#bca98c',.8,0,'limestone')];
 const trim=mat('#e4d8be',.67),bronze=mat('#70604b',.4,.6),roof=mat('#626d67',.55,.2),paving=mat('#c7baa1',.85,0,'paving');paving.userData.floorFinish=true;
 const panes=[mat('#36545c',.2,.3),mat('#53656c',.23,.25),mat('#766347',.24,.35)];for(const m of panes){m.userData.cityGlass=true;m.userData.reflectionZone='strip';installCurtainWallFinish(m);}
 const warm=mat('#d8ba85',.55);warm.emissive.set('#e6b56d');warm.emissiveIntensity=.35;
 const add=(g,m)=>{if(g.index){const old=g;g=g.toNonIndexed();old.dispose();}batches.get(m).push(g);};
 const source=(ctx.buildings||[]).filter(b=>b.indices),buildings=[...source,{...VEGAS_HOTEL,hotel:true}];
 for(const [i,b] of buildings.entries()){
  const {w,d,h,x,z,base}=b,ry=b.ry||0,tall=h>8,hotel=!!b.hotel;
  const part=(m,u,y,v,ww,hh,dd)=>add(new THREE.BoxGeometry(ww,hh,dd).translate(u,y,v).rotateY(ry).translate(x,base,z),m);
  const wall=walls[i%3],glass=panes[i%3];
  part(paving,0,.025,0,w+.35,.05,d+.35);part(wall,0,h/2,0,w,h,d);
  for(const y of [.18,h*.78,h-.15])part(trim,0,y,0,w+.16,.12,d+.16);
  const floors=Math.max(2,Math.floor(h/(hotel?1.15:1.65))),fh=h/floors;
  for(let side=0;side<4;side++){
   const a=side*Math.PI/2,span=side%2?d:w,depth=side%2?w:d;
   const face=(m,u,y,off,ww,hh,dd)=>add(new THREE.BoxGeometry(ww,hh,dd).translate(u,y,depth/2+off).rotateY(a+ry).translate(x,base,z),m);
   const cols=Math.max(2,Math.floor(span/(hotel?.85:1.15))),bay=span/cols;
   for(let f=0;f<floors;f++)for(let j=0;j<cols;j++){
    const u=-span/2+(j+.5)*bay,wh=fh*.72,y=(f+.51)*fh,ww=bay*(hotel?.56:.68);
    face(glass,u,y,.025,ww,wh,.04);
    for(const sign of [-1,1])face(trim,u+sign*(ww/2+.025),y,.05,.05,wh+.08,.08);
    face(trim,u,y-wh/2,.09,ww+.12,.045,.16);
    face(bronze,u,y,.055,.022,wh,.025);
    if(f===0&&j%2===0)face(warm,u,1.72,.15,.08,.18,.07);
   }
   if(hotel||tall)for(let j=0;j<=cols;j+=hotel?3:2)face(trim,-span/2+j*bay,h/2,.09,.12,h,.18);
   else {face(bronze,0,2.1,.3,span,.1,.65);face(warm,0,2.35,.06,span*.55,.22,.06);}
   if(hotel){face(trim,0,1.35,.32,span+.1,.15,.72);face(bronze,0,.7,.065,.03,1.3,.06);}
  }
  part(roof,0,h+.08,0,w-.14,.15,d-.14);
  part(trim,0,h+.18,0,w+.2,.16,d+.2);
  if(hotel){
   part(wall,0,h+.75,0,3.4,1.25,d*.85);part(trim,0,h+1.42,0,3.65,.12,d*.9);
   add(new THREE.ConeGeometry(2.4,.8,4).rotateY(Math.PI/4).translate(x,base+h+1.86,z),roof);
   for(const u of [-w*.4,w*.4]){part(wall,u,h+.42,0,2.4,.7,d*.9);add(new THREE.ConeGeometry(1.9,.7,4).rotateY(Math.PI/4).translate(x+u,base+h+1.1,z),roof);}
  }else {part(wall,0,h+.6,0,w*.65,1,d*.67);part(roof,0,h+1.12,0,w*.67,.08,d*.69);}
 }
 // Sign arrival apron stays outside the roadside palms and includes no new obstacle.
 add(new THREE.CircleGeometry(5.4,64).rotateX(-Math.PI/2).translate(7,1.015,32),paving);
 for(const [m,parts] of batches){if(!parts.length)continue;const g=mergeGeometries(parts);parts.forEach(g=>g.dispose());const mesh=new THREE.Mesh(g,m);mesh.castShadow=!m.userData.floorFinish;mesh.receiveShadow=true;root.add(mesh);}
 const obstacle={x:VEGAS_HOTEL.x,z:VEGAS_HOTEL.z,w:VEGAS_HOTEL.w+.2,d:VEGAS_HOTEL.d+.2};
 const mapping={body:'tower',crown:'tower',roof:'roof',pad:'pad',antenna:'ant',gable:'gable'};
 function assets(){for(const [id,L] of Object.entries(city.LM||{})){
  if(id==='sphere'||!L.asset||styled.has(L))continue;
  L.asset.traverse(o=>{if(!o.isMesh)return;const before=o.material;
   const convert=m=>{const n=m.clone();n.roughness=id==='luxor'?.27:id==='lvsign'?.45:.55;n.metalness=id==='luxor'?.25:.12;n.envMapIntensity=.85;
    const prev=m.onBeforeCompile,key=m.customProgramCacheKey();n.onBeforeCompile=function(sh,r){prev.call(this,sh,r);sh.fragmentShader=sh.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>\nfloat vegasLum=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));diffuseColor.rgb=mix(vec3(vegasLum),diffuseColor.rgb,${id==='lvsign'||id==='rqq'?'.95':'.7'});`);};n.customProgramCacheKey=()=>key+'-vegas-atlas-'+id;owned.push(n);return n;};
   const after=Array.isArray(before)?before.map(convert):convert(before);swaps.push({o,before,after});o.material=enabled?after:before;
  });styled.add(L);
 }}
 return {root,stats:{vegasBuildings:buildings.length,drawCalls:root.children.length},apply(){if(disposed)return;assets();if(!enabled)return;
  for(const b of source)for(const [key,name] of Object.entries(mapping)){const i=b.indices[key],pool=ctx.pools[name];if(!pool||!Number.isInteger(i)||i<0)continue;const id=name+i;if(!saved.has(id)){const matrix=new THREE.Matrix4();pool.m.getMatrixAt(i,matrix);saved.set(id,{pool,i,matrix});}pool.hide(i);pool.flush();}
 },setEnabled(v){enabled=!!v&&!disposed;root.visible=enabled;if(enabled!==registered){registered=enabled;if(enabled)ctx.rects.push(obstacle);else ctx.rects=ctx.rects.filter(q=>q!==obstacle);}if(!enabled){for(const {pool,i,matrix} of saved.values()){pool.set(i,matrix);pool.flush();}saved.clear();}for(const s of swaps)s.o.material=enabled?s.after:s.before;},dispose(){if(disposed)return;this.setEnabled(false);disposed=true;root.removeFromParent();root.children.forEach(m=>m.geometry.dispose());owned.forEach(m=>m.dispose());}};
}
