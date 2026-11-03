import {installVenueFinish} from './abudhabi-venues.js';
import {buildAbuDetails,ABU_DETAIL_OBSTACLES,palaceGarden} from './abudhabi-details.js';
import {towerMassing,slopedCrown} from './tower-massing.js';
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {installSurfaceFinish} from './surface-finish.js';
import {installCurtainWallFinish} from './curtain-wall.js';
import {chamferedBox} from './chamfered-box.js';
import {installLeafDaylight} from './leaf-daylight.js';
import {createCurvedLeaf} from './curved-leaf.js';
import {ABU_POOLS,ABU_BEDS,ABU_BENCHES,ABU_OBSTACLES,abuPromenade} from './abudhabi-layout.js';
import {MOSQUE_INLAY_BOUNDS} from './abudhabi-inlay.js';

export function createAbuDhabiScene({city,leafTexture,extraBuildings=[]}){
 const root=new THREE.Group();root.name='Abu Dhabi — marble forecourt and Corniche';city.w.root.add(root);
 const ctx=city.w.ctx,batches=new Map(),owned=[],saved=new Map(),swaps=[],styled=new Set();let enabled=false,disposed=false;
 const finish=(color,roughness=.8,metalness=0)=>{const m=new THREE.MeshStandardMaterial({color,roughness,metalness,envMapIntensity:.55});owned.push(m);batches.set(m,[]);return m;};
 const arcade=finish('#edf0ee',.34);
 const gardenPaving=finish('#dbd4c5',.7),gardenWarm=finish('#dfd4bf',.74),inlay=finish('#a99a7f',.65);
 for(const m of [gardenPaving,gardenWarm,inlay]){m.userData.floorFinish=true;installSurfaceFinish(m,'paving');}
 const marble=finish('#edf0ee',.24),stone=finish('#cfbea0',.85),trim=finish('#dbd8cc',.65),bronze=finish('#796446',.35,.7),wood=finish('#826444',.72),soil=finish('#594f39',1),green=finish('#b8c49c',.9),flower=finish('#ece6cc',.85),glass=finish('#6d8792',.16,.24),roof=finish('#a29e90',.9);
 const tileTrim=finish('#dbd8cc',.65);tileTrim.userData.floorFinish=true;installSurfaceFinish(tileTrim,'paving');
 installSurfaceFinish(stone,'limestone');installSurfaceFinish(trim,'paving');installSurfaceFinish(wood,'wood');
 glass.userData.cityGlass=true;glass.userData.reflectionZone='skyline';installCurtainWallFinish(glass);
 green.map=leafTexture||null;green.alphaTest=.42;green.side=THREE.DoubleSide;installLeafDaylight(green);
 marble.onBeforeCompile=sh=>{
  sh.vertexShader='varying vec3 abuStone;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nabuStone=position;');
  sh.fragmentShader='varying vec3 abuStone;\n'+sh.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   float vein=sin(abuStone.x*3.1+abuStone.z*2.6+sin(abuStone.x*.7+abuStone.y*1.1)*1.6);
   float fine=1.-smoothstep(.08,.3,length(fwidth(abuStone)));
   float mineral=pow(abs(vein),22.)*fine;
   diffuseColor.rgb*=1.-mineral*.035;
  `).replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor+=mineral*.05;');
 };marble.customProgramCacheKey=()=> 'abu-white-marble-v1';
 const add=(g,m)=>{if(g.index){const n=g.toNonIndexed();g.dispose();g=n;}batches.get(m).push(g);};
 const box=(m,x,y,z,w,h,d,ry=0)=>add((m===stone&&Math.min(w,h,d)>.16?chamferedBox(w,h,d,.018):new THREE.BoxGeometry(w,h,d)).rotateY(ry).translate(x,y,z),m);
 const cyl=(m,x,y,z,r,h)=>add(new THREE.CylinderGeometry(r,r,h,10).translate(x,y,z),m);
 // Continuous low promenade, interrupted only at the existing canal mouth.
 for(const [a,b] of [[-66,6],[14,66]]){
  box(marble,(a+b)/2,1.025,41.35,b-a,.05,7.3);
  for(let x=a+.6;x<b;x+=1.2)for(let z=38.3;z<45;z+=1.2){
   // The continuous inlaid slab replaces these tiles. Keeping hidden trim
   // below it still projects square shadow-map artefacts through the surface.
   const b=MOSQUE_INLAY_BOUNDS;
   if(Math.abs(x-b.x)<b.w/2+.59&&Math.abs(z-b.z)<b.d/2+.59)continue;
   box((Math.round(x*5+z)%7)?marble:tileTrim,x,1.059,z,1.18,.018,1.18);
  }
  box(stone,(a+b)/2,1.1,45,b-a,.2,.25);
  for(let x=a+1;x<b;x+=2){cyl(bronze,x,1.49,45,.025,.78);}
  box(bronze,(a+b)/2,1.87,45,b-a,.035,.035);
 }
 // Formal mosque approach, with a broad dry central aisle between shallow pools.
 box(marble,-15,1.04,36,34,.08,5);
 for(const p of ABU_POOLS){
  box(stone,p.x,1.1,p.z,p.w+.22,.2,p.d+.22);
  box(marble,p.x,1.22,p.z,p.w+.3,.08,p.d+.3);
 }
 const water=new THREE.MeshPhysicalMaterial({color:'#3b8897',roughness:.1,metalness:.18,clearcoat:1,envMapIntensity:1.5});owned.push(water);batches.set(water,[]);water.userData.cityGlass=true;water.userData.reflectionZone='courtyard';
 for(const p of ABU_POOLS)box(water,p.x,1.267,p.z,p.w-.15,.015,p.d-.15);
 const lamp=finish('#efdab0',.6);lamp.emissive.set('#e9bc77');lamp.emissiveIntensity=.22;
 for(const x of [-63,-51,-39,-31,1,18,30,42,54,65]){
  cyl(bronze,x,2.2,44.3,.035,2.3);box(bronze,x,3.3,44.3,.23,.4,.23);box(lamp,x,3.3,44.3,.17,.32,.17);
 }
 for(const b of ABU_BENCHES){
  for(let j=0;j<4;j++)box(wood,b.x,1.55,b.z-.22+j*.14,b.w,.065,.1);
  for(let j=0;j<3;j++)box(wood,b.x,1.77+j*.12,b.z-.34,b.w,.08,.05);
  for(const x of [b.x-.8,b.x+.8]){box(bronze,x,1.29,b.z,.055,.5,.5);box(bronze,x,1.72,b.z-.34,.055,.8,.05);}
 }
 const leaf=createCurvedLeaf(THREE,.18,.75,true);
 for(const [i,b] of ABU_BEDS.entries()){
  box(stone,b.x,1.25,b.z,b.w,.45,b.d);box(soil,b.x,1.485,b.z,b.w-.18,.02,b.d-.18);
  for(let n=0;n<140;n++){
   const x=b.x+Math.sin(n*5.13+i)*(b.w/2-.22),z=b.z+Math.cos(n*2.4)*.5,y=1.55+((n*31)%97)/97*.58;
   add(leaf.clone().rotateX(-.5+(n%5)*.22).rotateY(n*2.399).translate(x,y,z),green);
   if(n%4===0)add(new THREE.SphereGeometry(.045,5,3).translate(x,y+.12,z),flower);
  }
 }leaf.dispose();
 buildAbuDetails({add,box,marble:arcade,paving:gardenPaving,pavingWarm:gardenWarm,inlay,stone,trim,bronze,green,flower,soil});
 // Refine ordinary buildings within their existing footprint and collision.
 const buildings=[...(ctx.buildings||[]).filter(b=>b.indices&&b.w>=2.5&&b.d>=2.5),...extraBuildings];
 for(const [index,b] of buildings.entries()){
  const h=b.h,w=b.w,d=b.d,tall=h>8,skin=tall?glass:stone,ry=b.ry||0;
  const part=(m,x,y,z,ww,hh,dd)=>{
   const g=new THREE.BoxGeometry(ww,hh,dd).translate(x,y,z).rotateY(ry).translate(b.x,b.base,b.z);add(g,m);
  };
  if(tall){
   const {family,tiers}=towerMassing(w,d,h,index,1.9);
   part(stone,0,.25,0,w,.5,d);part(glass,0,1.2,0,w*.86,1.4,d*.86);
   // Human-scale entrance glazing and slender canopy beneath each tower.
   for(const side of [0,1,2,3]){
    const angle=side*Math.PI/2,span=(side%2?d:w)*.86,depth=(side%2?w:d)*.86;
    const entry=(m,u,y,off,ww,hh,dd)=>add(new THREE.BoxGeometry(ww,hh,dd).translate(u,y,depth/2+off).rotateY(angle+ry).translate(b.x,b.base,b.z),m);
    entry(bronze,0,1.15,.035,span*.64,1.22,.045);
    for(const sign of [-1,1]){entry(glass,sign*span*.155,1.16,.066,span*.29,1.12,.025);entry(trim,sign*span*.32,1.16,.08,.045,1.26,.08);entry(bronze,sign*.07,1.15,.09,.025,.23,.025);}
    entry(trim,0,1.86,.13,span*.82,.07,.4);
    entry(trim,0,.53,.11,span*.72,.06,.24);
   }
   for(const t of tiers){
    part(glass,t.x,(t.bottom+t.top)/2,0,t.w,t.top-t.bottom,t.d);
    part(trim,t.x,t.bottom,0,t.w+.045,.065,t.d+.045);
    const floor=family===3?1.45:1.12;
    for(let y=t.bottom+.15;y<t.top;y+=floor)part(trim,t.x,y,0,t.w+.04,.035,t.d+.04);
    for(const sign of [-1,1]){
     for(let x=-t.w/2+.12;x<t.w/2;x+=family===1?.65:1.1)part(trim,t.x+x,(t.top+t.bottom)/2,sign*(t.d/2+.02),.025,t.top-t.bottom,.04);
     for(let z=-t.d/2+.12;z<t.d/2;z+=1.1)part(trim,t.x+sign*(t.w/2+.02),(t.top+t.bottom)/2,z,.04,t.top-t.bottom,.025);
    }
   }
   const t=tiers.at(-1);
   if(family===4)add(slopedCrown(THREE,t.w+.08,t.d+.08,h,.72).translate(t.x,0,0).rotateY(ry).translate(b.x,b.base,b.z),trim);
   else{part(trim,t.x,h-.64,0,t.w+.08,.16,t.d+.08);part(roof,t.x,h-.34,0,t.w*.72,.45,t.d*.72);}
   if(family===1||family===3)for(const sign of [-1,1])part(trim,sign*w*.41,h*.53,0,.1,h*.94,d*.84);
   continue;
  }
  part(skin,0,h/2,0,w,h,d);part(trim,0,.13,0,w+.08,.26,d+.08);part(roof,0,h+.08,0,w,.16,d);
  for(const side of [0,1,2,3]){
   const angle=side*Math.PI/2,span=side%2?d:w,depth=side%2?w:d;
   const face=(m,u,y,offset,ww,hh,dd)=>{const g=new THREE.BoxGeometry(ww,hh,dd).translate(u,y,depth/2+offset).rotateY(angle+ry).translate(b.x,b.base,b.z);add(g,m);};
   const floors=Math.max(1,Math.floor(h/(tall?1.05:2.5))),fh=h/floors,cols=Math.max(2,Math.floor(span/(tall?.85:1.5))),bay=span/cols;
   for(let f=0;f<floors;f++){
    face(trim,0,(f+1)*fh,.035,span,.045,.08);
    for(let j=0;j<cols;j++){
     const u=-span/2+(j+.5)*bay;
     if(!tall){
      const wy=f*fh+fh*.52,ww=bay*.65,wh=fh*.64;
      face(glass,u,wy,.025,ww,wh,.035);
      for(const sign of [-1,1])face(trim,u+sign*(ww/2+.035),wy,.09,.07,wh+.12,.17);
      face(trim,u,wy-wh/2-.035,.16,ww+.2,.075,.32);
      face(trim,u,wy+wh/2+.045,.08,ww+.16,.08,.17);
      face(bronze,u,wy,.055,.022,wh,.045);
      if(f===0&&j%2===0){face(wood,u,wy+.15,.07,ww*.8,.04,.045);face(wood,u,wy-.18,.07,ww*.8,.04,.045);}
     }
     face(tall?trim:bronze,u-bay*.37,f*fh+fh*.52,.045,.025,fh*.75,.045);
    }
   }
   if(!tall){
    face(wood,0,h-.35,.38,span,.1,.8);face(bronze,0,1.05,.06,.035,1.9,.045);
    face(trim,0,h+.23,-.07,span,.32,.16);
    for(let u=-span/2+.2;u<span/2;u+=.48)face(wood,u,h-.47,.38,.05,.16,.8);
   }
  }
  if(index%2===0){
   for(const x of [-w*.32,w*.32])for(const z of [-d*.3,d*.3])part(wood,x,h+.77,z,.055,1.4,.055);
   for(let x=-w*.4;x<=w*.4;x+=.28)part(wood,x,h+1.5,0,.065,.1,d*.8);
   for(const z of [-d*.32,d*.32])part(wood,0,h+1.43,z,w*.86,.1,.065);
  }
 }
 for(const [m,gs] of batches){if(!gs.length)continue;const g=mergeGeometries(gs);gs.forEach(g=>g.dispose());const mesh=new THREE.Mesh(g,m);mesh.castShadow=m!==water&&m!==marble&&!m.userData.floorFinish;mesh.receiveShadow=true;if(m===marble||m.userData.floorFinish)mesh.userData.skipContact=true;root.add(mesh);}
 const mapping={body:'tower',crown:'tower',roof:'roof',pad:'pad',antenna:'ant',gable:'gable'};
 const surface=(x,z)=>enabled?(abuPromenade(x,z)?1.115:palaceGarden(x,z)?1.09:null):null;
 const obstacles=[...ABU_OBSTACLES,...ABU_DETAIL_OBSTACLES,...extraBuildings.map(b=>({x:b.x,z:b.z,w:b.w+.2,d:b.d+.2}))].map(o=>({...o}));let registered=false;
 function register(v){if(v===registered)return;registered=v;if(v){ctx.rects.push(...obstacles);ctx.walkSurfaces.push(surface);}else{ctx.rects=ctx.rects.filter(o=>!obstacles.includes(o));const i=ctx.walkSurfaces.indexOf(surface);if(i>=0)ctx.walkSurfaces.splice(i,1);}}
 function styleAssets(){
  for(const [id,l] of Object.entries(city.LM||{})){
   if(!l.asset||styled.has(l))continue;
   l.asset.traverse(o=>{if(!o.isMesh)return;const before=o.material;
    const convert=m=>{
     const a=m.clone();a.color.set('#ffffff');a.emissiveIntensity=0;a.roughness=id==='grand_mosque'?.32:.66;a.metalness=.03;a.envMapIntensity=.7;
     if(id==='ferrari_world'||id==='abrahamic'){installVenueFinish(a,id);owned.push(a);return a;}
     const prev=m.onBeforeCompile,key=m.customProgramCacheKey();
     a.onBeforeCompile=function(sh,r){prev.call(this,sh,r);sh.fragmentShader=sh.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
      float abuLum=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
      float abuBlue=smoothstep(.03,.2,diffuseColor.b-max(diffuseColor.r,diffuseColor.g*.85));
      float abuGold=smoothstep(.06,.25,diffuseColor.r-diffuseColor.b);
      ${id==='ferrari_world'?`diffuseColor.rgb=mix(vec3(abuLum),diffuseColor.rgb,.82);`:`diffuseColor.rgb=mix(vec3(abuLum)*vec3(${id==='emirates_palace'?'1.06,.98,.85':'.98,1.,1.'}),vec3(.29,.42,.48)*(.7+abuLum*.3),abuBlue*.8);${id==='grand_mosque'?"diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.72,.57,.30)*(.7+abuLum*.3),abuGold*.8);":''}`}
     `).replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>\nroughnessFactor=mix(${id==='grand_mosque'?'.32':'.76'},.18,abuBlue);`).replace('#include <metalnessmap_fragment>','#include <metalnessmap_fragment>\nmetalnessFactor=mix(.02,.25,abuBlue);');};
     a.customProgramCacheKey=()=>key+'-abu-landmark-v1-'+id;if(id==='emirates_palace')installSurfaceFinish(a,'limestone',{metricAttribute:true});owned.push(a);return a;
    };
    const after=Array.isArray(before)?before.map(convert):convert(before);swaps.push({mesh:o,before,after});o.material=enabled?after:before;
   });styled.add(l);
  }
 }
 function restore(){for(const s of saved.values()){s.pool.set(s.index,s.matrix);s.pool.flush();}saved.clear();}
 return {root,stats:{buildings:buildings.length,triangles:root.children.reduce((n,m)=>n+m.geometry.attributes.position.count/3,0),drawCalls:root.children.length},footprints:obstacles,
  apply(){if(disposed)return;styleAssets();if(!enabled)return;for(const b of buildings)for(const [key,name] of Object.entries(mapping)){
   const index=b.indices[key],pool=ctx.pools[name];if(!pool||!Number.isInteger(index)||index<0)continue;
   const id=name+index;if(!saved.has(id))saved.set(id,{pool,index,matrix:new THREE.Matrix4()});pool.m.getMatrixAt(index,saved.get(id).matrix);pool.hide(index);pool.flush();
  }},
  setEnabled(v){enabled=!!v&&!disposed;root.visible=enabled;register(enabled);if(!enabled)restore();swaps.forEach(s=>s.mesh.material=enabled?s.after:s.before);},
  dispose(){if(disposed)return;this.setEnabled(false);disposed=true;root.removeFromParent();root.children.forEach(m=>m.geometry.dispose());owned.forEach(m=>m.dispose());}
 };
}
