import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {installSurfaceFinish} from './surface-finish.js';
import {installCurtainWallFinish} from './curtain-wall.js';
import {chamferedBox} from './chamfered-box.js';

/** Tokyo's first material/architecture pass. All massing stays in the source
 * building footprints; no shared source geometry or materials are mutated. */
export function createTokyoScene({city}) {
 const ctx=city.w.ctx,root=new THREE.Group();root.name='Tokyo — timber shops and urban facades';city.w.root.add(root);
 const batches=new Map(),owned=[],saved=new Map(),swaps=[],styled=new Set();let enabled=false,disposed=false;
 const mat=(color,roughness=.8,metalness=0,kind)=>{const m=new THREE.MeshStandardMaterial({color,roughness,metalness,envMapIntensity:.75});owned.push(m);batches.set(m,[]);if(kind)installSurfaceFinish(m,kind);return m;};
 const plaster=mat('#d5d0c3',.84,0,'paint'),concrete=mat('#b7b6af',.82,0,'paving'),stone=mat('#a4a6a0',.88,0,'paving');
 const wood=mat('#574434',.74,0,'wood'),timber=mat('#7c6650',.78,0,'wood'),tile=mat('#454e53',.63,.07),metal=mat('#596367',.43,.48);
 const skins=[mat('#c8c6bd',.78,0,'paint'),mat('#aeb9bc',.66,.08,'paint'),mat('#b4aa99',.83,0,'paint')];
 const glass=mat('#5b7680',.2,.28);glass.userData.cityGlass=true;glass.userData.reflectionZone='skyline';installCurtainWallFinish(glass);
 const shopGlass=mat('#526565',.26,.12);shopGlass.userData.cityGlass=true;shopGlass.userData.reflectionZone='street';
 const warm=mat('#b9a280',.65);warm.emissive.set('#e6b875');warm.emissiveIntensity=.16;
 const indigo=mat('#384955',.9,0,'fabric'),paper=mat('#e6d6b6',.86),red=mat('#913d32',.72);
 const add=(g,m)=>{if(g.index){const old=g;g=g.toNonIndexed();old.dispose();}batches.get(m).push(g);};
 const box=(m,x,y,z,w,h,d,ry=0)=>add(chamferedBox(w,h,d,Math.min(.014,h*.1)).rotateY(ry).translate(x,y,z),m);
 const buildings=(ctx.buildings||[]).filter(b=>b.indices);
 for(const [index,b] of buildings.entries()){
  const {w,d,h,x,z,base}=b,ry=b.ry||0,traditional=b.style==='wa',tall=h>8;
  const part=(m,u,y,v,ww,hh,dd)=>add(chamferedBox(ww,hh,dd,.012).translate(u,y,v).rotateY(ry).translate(x,base,z),m);
  part(stone,0,.025,0,w+.6,.05,d+.6);
  part(traditional?plaster:skins[index%3],0,h/2,0,w,h,d);
  part(concrete,0,.12,0,w+.04,.24,d+.04);
  for(const side of [0,1,2,3]){
   const a=side*Math.PI/2,span=side%2?d:w,depth=side%2?w:d;
   const face=(m,u,y,off,ww,hh,dd)=>add(new THREE.BoxGeometry(ww,hh,dd).translate(u,y,depth/2+off).rotateY(a+ry).translate(x,base,z),m);
   const floors=traditional?2:Math.max(1,Math.floor(h/(tall?1.65:2.25))),fh=h/floors,cols=Math.max(2,Math.floor(span/1.2)),bay=span/cols;
   for(let f=0;f<floors;f++){
    face(traditional?wood:concrete,0,f*fh+.15,.018,span,.07,.075);
    for(let j=0;j<cols;j++){
     const u=-span/2+(j+.5)*bay,wy=f*fh+fh*.54,ww=bay*.72,wh=fh*.65;
     face(f===0&&!tall?shopGlass:glass,u,wy,.026,ww,wh,.04);
     for(const sign of [-1,1])face(traditional?wood:metal,u+sign*ww/2,wy,.06,.035,wh+.08,.06);
     face(traditional?wood:concrete,u,wy-wh/2,.09,ww+.1,.055,.18);
     face(traditional?wood:metal,u,wy+wh/2,.06,ww+.08,.035,.08);
     if(traditional){
      for(let k=1;k<5;k++)face(timber,u-ww/2+k*ww/5,wy,.079,.022,wh,.035);
      face(wood,u,wy,.085,ww,.028,.045);
     }else if(tall&&index%3===0&&f>0){
      face(concrete,u,wy-wh/2-.06,.16,bay*.94,.09,.32);
      face(metal,u,wy-wh/2+.28,.3,bay*.9,.025,.025);
      for(const sign of [-1,0,1])face(metal,u+sign*bay*.4,wy-wh/2+.12,.3,.025,.34,.025);
     }else face(metal,u,wy,.06,.022,wh,.05);
    }
   }
   if(traditional){
    for(const sign of [-1,1])face(wood,sign*(span/2-.07),h/2,.045,.105,h,.1);
    face(wood,0,fh,.05,span,.12,.12);
    // Slatted eaves, a split fabric entrance curtain and lantern at two faces.
    face(tile,0,fh+.08,.22,span+.16,.08,.5);
    for(let u=-span/2+.12;u<span/2;u+=.32)face(wood,u,fh-.02,.2,.055,.1,.45);
    if(side===0||side===2){
     for(const sign of [-1,1])face(indigo,sign*.21,1.44,.13,.39,.36,.035);
     face(timber,0,1.66,.13,.96,.05,.06);
     const g=new THREE.CylinderGeometry(.12,.12,.34,12).translate(span*.34,1.42,depth/2+.22).rotateY(a+ry).translate(x,base,z);add(g,paper);
     face(wood,span*.34,1.64,.22,.25,.04,.25);
     face(wood,span*.34,1.2,.22,.21,.04,.21);
    }
   }else{
    face(concrete,0,h+.17,-.035,span,.3,.14);
    if(!tall){
     face(index%2?red:indigo,0,2.02,.22,span-.2,.12,.47);
     face(warm,0,2.23,.065,span*.7,.22,.055);
     for(let j=0;j<cols;j++)face(metal,-span/2+(j+.5)*bay,.95,.07,.025,1.6,.05);
    }
   }
  }
  if(traditional){
   const rise=Math.min(1.12,b.gable?.h*.65||1),half=d/2+.24,slant=Math.hypot(half,rise),angle=Math.atan2(rise,half);
   for(const sign of [-1,1]){
    // Broad dark-grey tiled slopes with narrow raised roll joints.
    add(new THREE.BoxGeometry(w+.48,.075,slant).rotateX(sign*angle).translate(0,h+rise/2,sign*half/2).rotateY(ry).translate(x,base,z),tile);
    for(let u=-w/2-.18;u<=w/2+.18;u+=.23)add(new THREE.CylinderGeometry(.028,.028,slant,5).rotateX(Math.PI/2+sign*angle).translate(u,h+rise/2+.05,sign*half/2).rotateY(ry).translate(x,base,z),tile);
    part(wood,0,h-.04,sign*half,w+.52,.12,.1);
    for(let u=-w/2;u<=w/2;u+=.32)part(timber,u,h-.14,sign*(d/2+.12),.065,.1,.35);
   }
   part(tile,0,h+rise+.06,0,w+.58,.13,.16);
   // Closed triangular gable ends (no hollow roof when seen from the side).
   for(const sign of [-1,1]){
    const shape=new THREE.Shape();shape.moveTo(-d/2,0);shape.lineTo(d/2,0);shape.lineTo(0,rise);shape.closePath();
    const g=new THREE.ShapeGeometry(shape);g.rotateY(sign*Math.PI/2).translate(sign*w/2,h,0).rotateY(ry).translate(x,base,z);add(g,plaster);
   }
  }else{
   part(tile,0,h+.025,0,w-.12,.05,d-.12);
   part(concrete,w*.18,h+.42,-d*.17,w*.3,.72,d*.3);
   part(metal,-w*.25,h+.25,d*.18,.55,.45,.65);
   for(let k=0;k<5;k++)part(tile,-w*.25,h+.49,d*.18-.24+k*.12,.48,.025,.035);
  }
 }
 for(const [m,gs] of batches){if(!gs.length)continue;const g=mergeGeometries(gs);gs.forEach(g=>g.dispose());const mesh=new THREE.Mesh(g,m);mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);}
 const mapping={body:'tower',crown:'tower',roof:'roof',pad:'pad',antenna:'ant',gable:'gable'};
 function styleAssets(){for(const [id,l] of Object.entries(city.LM||{})){
  if(!l.asset||styled.has(l))continue;
  l.asset.traverse(o=>{if(!o.isMesh)return;const before=o.material;
   const convert=m=>{const a=m.clone();a.roughness=id==='skytree'?.38:.68;a.metalness=id==='skytree'?.28:.05;a.envMapIntensity=.65;
    const prev=m.onBeforeCompile,key=m.customProgramCacheKey();
    a.onBeforeCompile=function(sh,r){prev.call(this,sh,r);sh.fragmentShader=sh.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
     float tkLum=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
     diffuseColor.rgb=mix(vec3(tkLum),diffuseColor.rgb,${id==='akihabara'?'.94':'.84'});
    `);};a.customProgramCacheKey=()=>key+'-tokyo-atlas-v1';owned.push(a);return a;};
   const after=Array.isArray(before)?before.map(convert):convert(before);swaps.push({mesh:o,before,after});o.material=enabled?after:before;
  });styled.add(l);
 }}
 return {root,stats:{buildings:buildings.length,triangles:root.children.reduce((n,m)=>n+m.geometry.attributes.position.count/3,0),drawCalls:root.children.length},
  apply(){if(disposed)return;styleAssets();if(!enabled)return;for(const b of buildings)for(const [key,name] of Object.entries(mapping)){
   const i=b.indices[key],pool=ctx.pools[name];if(!pool||!Number.isInteger(i)||i<0)continue;
   const id=name+i;if(!saved.has(id)){const matrix=new THREE.Matrix4();pool.m.getMatrixAt(i,matrix);saved.set(id,{pool,i,matrix});}pool.hide(i);pool.flush();
  }},
  setEnabled(v){enabled=!!v&&!disposed;root.visible=enabled;if(!enabled){for(const {pool,i,matrix} of saved.values()){pool.set(i,matrix);pool.flush();}saved.clear();}for(const s of swaps)s.mesh.material=enabled?s.after:s.before;},
  dispose(){if(disposed)return;this.setEnabled(false);disposed=true;root.removeFromParent();root.children.forEach(m=>m.geometry.dispose());owned.forEach(m=>m.dispose());}
 };
}
