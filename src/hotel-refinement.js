import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { chamferedBox } from './chamfered-box.js';
import { addHotelRoofDetails } from './hotel-roof.js';
import { landmarkFinish } from './landmark-finish.js';
function landmarkFinishForBase(){const source=new THREE.MeshStandardMaterial(),m=landmarkFinish(source,'atlantis');source.dispose();m.color.set('#a99d89');delete m.userData.cityGlass;delete m.userData.reflectionZone;return m;}

// Compress only the low podium zone; the sail and its structural ribs translate
// together above it, retaining their proportions and their contact with the deck.
export const hotelDeckHeight=y=>y<=.925?y*(.58/.925):y-(.925-.58);

/** Coordinates are measured in normalized landmark units, never atlas pixels. */
export function hotelSurface(material,id,floor=false){
  const prior=material.onBeforeCompile,key=material.customProgramCacheKey();
  material.onBeforeCompile=function(shader,renderer){
    prior.call(this,shader,renderer);
    shader.vertexShader='attribute vec3 hotelPosition; varying vec3 vHotelPosition;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvHotelPosition=hotelPosition;');
    shader.fragmentShader='varying vec3 vHotelPosition;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      vec3 hp=vHotelPosition;
      ${id==='burj_al_arab'&&!floor?`
      // Atlas luminance contains obsolete painted shadows. Retain dark joints
      // and blue glazing, but let current scene lighting shade neutral cladding.
      float shellMask=(1.-landmarkBlue)*(1.-landmarkGreen)*smoothstep(.035,.18,landmarkLum);
      vec3 shellAlbedo=vec3(.72,.735,.73)+vec3((landmarkLum-.5)*.035);
      diffuseColor.rgb=mix(diffuseColor.rgb,shellAlbedo,shellMask);
      `:''}
      ${id==='atlantis'?`float roofMetal=landmarkGreen*smoothstep(4.0,4.7,hp.y);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.29,.34,.27),roofMetal*.78);`:''}

      // Triplanar choice from geometric derivatives, independent of atlas UVs.
      vec3 hn=abs(normalize(cross(dFdx(hp),dFdy(hp))));
      vec2 st=hn.y>.65?hp.xz:(hn.z>hn.x?hp.xy:hp.zy);
      vec2 scale=hn.y>.65?vec2(.65,.48):vec2(.72,.34);
      vec2 tile=st/scale; tile.x+=mod(floor(tile.y),2.)*.5;
      vec2 edge=min(fract(tile),1.-fract(tile));
      vec2 aa=max(fwidth(tile),vec2(.0001));
      float joint=1.-min(smoothstep(.006,.006+aa.x,edge.x),smoothstep(.006,.006+aa.y,edge.y));
      float variation=fract(sin(dot(floor(tile),vec2(17.17,93.41)))*43758.5453)-.5;
      float stoneMask=${id==='atlantis'?'(1.-landmarkBlue)*(1.-landmarkGreen)':'0.'};
      ${floor?`diffuseColor.rgb=mix(vec3(.43,.39,.31),vec3(.63,.58,.47),smoothstep(.45,.85,hn.y))*(1.+variation*.07);stoneMask=1.;`:''}
      diffuseColor.rgb*=1.-stoneMask*(joint*.09-variation*.035);
      ${id==='burj_al_arab'&&!floor?`
      // Fine floor bands and vertical glazing divisions stay inside blue panels.
      vec2 glazingGrid=vec2(st.x/.33,hp.y/.30);
      vec2 ge=min(fract(glazingGrid),1.-fract(glazingGrid));
      vec2 ga=max(fwidth(glazingGrid),vec2(.0001));
      float mullion=1.-min(smoothstep(.014,.014+ga.x,ge.x),smoothstep(.022,.022+ga.y,ge.y));
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.51,.57,.58),mullion*landmarkBlue*(1.-landmarkGreen)*.65);`:''}
    `);
    if(floor)shader.fragmentShader=shader.fragmentShader.replace('roughnessFactor=mix(.86,.26,landmarkBlue*(1.-landmarkGreen));','roughnessFactor=.88;').replace('metalnessFactor=mix(.02,.48,landmarkBlue*(1.-landmarkGreen));','metalnessFactor=.02;');
  };
  material.customProgramCacheKey=()=>key+'-hotel-surface-v2-'+id+'-'+floor;
  return material;
}

// Five rays, including the full frame perimeter, must land on the same plane.
// This keeps every bay off the main arch void, corners, cornices and roof edges.
export function sampleHotelBay(asset,holder,u,y,side,w=.30,h=.48){
  const axis=side<2?'z':'x',sign=side%2?1:-1,other=axis==='z'?'x':'z';
  const inverse=holder.matrixWorld.clone().invert(),ray=new THREE.Raycaster(),points=[];
  for(const [du,dy] of [[0,0],[-w/2-.05,-h/2-.06],[w/2+.05,-h/2-.06],[-w/2-.05,h/2+.06],[w/2+.05,h/2+.06]]){
    const origin=new THREE.Vector3();origin[axis]=sign*30;origin[other]=u+du;origin.y=y+dy;
    const dir=new THREE.Vector3();dir[axis]=-sign;dir.transformDirection(holder.matrixWorld);
    ray.set(origin.applyMatrix4(holder.matrixWorld),dir);
    const hit=ray.intersectObject(asset,true)[0];if(!hit)return null;
    const n=hit.face.normal.clone().transformDirection(hit.object.matrixWorld).transformDirection(inverse);
    if(n[axis]*sign<.985)return null;
    points.push(hit.point.clone().applyMatrix4(inverse));
  }
  if(points.some(p=>Math.abs(p[axis]-points[0][axis])>.018))return null;
  return {point:points[0],axis,sign,other,w,h};
}
function hull(points){
  const sorted=[...new Map(points.map(p=>[p.map(x=>x.toFixed(4)).join(','),p])).values()].sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
  const cross=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);
  const half=ps=>{const out=[];for(const p of ps){while(out.length>1&&cross(out.at(-2),out.at(-1),p)<=0)out.pop();out.push(p);}return out;};
  const a=half(sorted),b=half([...sorted].reverse());return [...a.slice(0,-1),...b.slice(0,-1)];
}
export function refineHotel(landmark){
  if(!['atlantis','burj_al_arab'].includes(landmark.id)||!landmark.asset)return null;
  const {holder,asset,id}=landmark,root=new THREE.Group(),swaps=[],parts=new Map(),bays=[],top=[],feet=[];
  root.name='Hotel — framed bays and dressed terrace';holder.add(root);holder.updateWorldMatrix(true,true);
  const inverse=holder.matrixWorld.clone().invert(),v=new THREE.Vector3();
  asset.traverse(mesh=>{
    if(!mesh.isMesh)return;
    const before=mesh.geometry,after=before.clone(),p=after.attributes.position,coords=[];
    const toLocal=new THREE.Matrix4().multiplyMatrices(inverse,mesh.matrixWorld),fromLocal=toLocal.clone().invert();
    for(let i=0;i<p.count;i++){
      v.fromBufferAttribute(p,i).applyMatrix4(toLocal);
      if(id==='atlantis'&&v.y<.9)feet.push([v.x,v.z]);
      if(id==='burj_al_arab')v.y=hotelDeckHeight(v.y);
      if(mesh.name==='Dubai_FC_Floor'&&Math.abs(v.y-.58)<.018)top.push([v.x,v.z]);
      coords.push(...v.toArray());v.applyMatrix4(fromLocal);p.setXYZ(i,v.x,v.y,v.z);
    }
    after.setAttribute('hotelPosition',new THREE.Float32BufferAttribute(coords,3));
    if(id==='burj_al_arab')after.computeVertexNormals();
    after.computeBoundingBox();after.computeBoundingSphere();swaps.push({mesh,before,after});mesh.geometry=after;
  });
  const stone=new THREE.MeshStandardMaterial({color:'#d4c4aa',roughness:.86});
  const recess=new THREE.MeshStandardMaterial({color:'#454b48',roughness:.9});
  const glass=new THREE.MeshStandardMaterial({color:'#637e85',roughness:.24,metalness:.42,envMapIntensity:.85});
  glass.userData.cityGlass=true;glass.userData.reflectionZone='skyline';
  const bronze=new THREE.MeshStandardMaterial({color:'#8f7b59',roughness:.43,metalness:.5});
  const materials=[stone,recess,glass,bronze];let roofStats={roofEdges:0,roofBrackets:0};
  function add(g,m){if(g.index){const next=g.toNonIndexed();g.dispose();g=next;}if(!parts.has(m))parts.set(m,[]);parts.get(m).push(g);}
  function bayBox(b,u,y,depth,w,h,d,m){
    const p=b.point.clone();p[b.other]+=u;p.y+=y;p[b.axis]+=b.sign*depth;
    add(chamferedBox(w,h,d,.006).rotateY(b.axis==='x'?Math.PI/2:0).translate(...p.toArray()),m);
  }
  if(id==='atlantis'){
    roofStats=addHotelRoofDetails(asset,add,stone,bronze);
    // The source wings project beyond the narrow crescent: a low, continuous
    // foundation follows their footprint instead of leaving walls over water.
    if(feet.length>2){
      const outline=hull(feet).map(([x,z])=>{const r=Math.hypot(x,z)||1;return [x+x/r*.16,z+z/r*.16];});
      const shape=new THREE.Shape(outline.map(([x,z])=>new THREE.Vector2(x,-z)));
      const g=new THREE.ExtrudeGeometry(shape,{depth:.9,bevelEnabled:false,steps:1}).rotateX(-Math.PI/2).translate(0,-.91,0);
      g.setAttribute('hotelPosition',g.attributes.position.clone());
      const base=hotelSurface(landmarkFinishForBase(),'atlantis');materials.push(base);add(g,base);
    }
    for(let side=0;side<4;side++)for(let u=side<2?-9.6:-3;u<=(side<2?9.6:3);u+=.64){
      if(side<2&&Math.abs(u)<1.3)continue;
      for(let y=1.35;y<6.4;y+=.78){
        const b=sampleHotelBay(asset,holder,u,y,side);if(!b)continue;bays.push(b);
        bayBox(b,0,0,.014,.38,.56,.026,recess);
        bayBox(b,0,0,.030,.29,.46,.018,glass);
        for(const sign of [-1,1]){bayBox(b,sign*.18,0,.063,.035,.58,.10,stone);bayBox(b,0,sign*.27,.063,.39,.035,.10,stone);}
        bayBox(b,0,-.30,.09,.43,.045,.17,stone);
        bayBox(b,0,0,.047,.014,.47,.018,bronze);
      }
    }
    // Slab overlay follows the existing circular forecourt; no footprint growth.
    const paving=new THREE.MeshStandardMaterial({color:'#cbbca2',roughness:.9});materials.push(paving);
    const prior=paving.onBeforeCompile;paving.onBeforeCompile=function(s,r){prior.call(this,s,r);s.vertexShader='varying vec3 vp;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvp=position;');s.fragmentShader='varying vec3 vp;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      vec2 tile=vp.xz/vec2(.64,.46);tile.x+=mod(floor(tile.y),2.)*.5;
      vec2 e=min(fract(tile),1.-fract(tile)),aa=max(fwidth(tile),vec2(.0001));
      float line=1.-min(smoothstep(.008,.008+aa.x,e.x),smoothstep(.008,.008+aa.y,e.y));
      float shade=fract(sin(dot(floor(tile),vec2(13.1,27.7)))*43758.54)-.5;
      diffuseColor.rgb*=1.-line*.12+shade*.06;`);};paving.customProgramCacheKey=()=> 'hotel-forecourt-paving-v1';
    add(new THREE.CircleGeometry(6.05,96).rotateX(-Math.PI/2).translate(0,.018,-.5),paving);
  }else if(top.length>2){
    const rim=hull(top);
    for(let i=0;i<rim.length;i++){
      const a=rim[i],b=rim[(i+1)%rim.length],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),n=Math.ceil(length/.55);
      for(let j=0;j<n;j++){const t=(j+.5)/n;
        if(Math.abs(a[0]+dx*t)<1.35&&a[1]+dz*t< -5.3)continue;
        add(chamferedBox(length/n-.007,.055,.085,.009).rotateY(-Math.atan2(dz,dx)).translate(a[0]+dx*t,.596,a[1]+dz*t),stone);}
    }
  }
  for(const [m,geos] of parts){const geometry=mergeGeometries(geos);geos.forEach(g=>g.dispose());const mesh=new THREE.Mesh(geometry,m);mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);}
  let disposed=false;const stats={...roofStats,hotelBays:bays.length,drawCalls:root.children.length,triangles:root.children.reduce((n,m)=>n+m.geometry.attributes.position.count/3,0)};
  const result={root,swaps,bays,stats,setEnabled(v){root.visible=!!v&&!disposed;for(const s of swaps)s.mesh.geometry=v&&!disposed?s.after:s.before;},dispose(){if(disposed)return;this.setEnabled(false);disposed=true;root.removeFromParent();root.children.forEach(m=>m.geometry.dispose());materials.forEach(m=>m.dispose());swaps.forEach(s=>s.after.dispose());}};
  result.setEnabled(false);return result;
}
