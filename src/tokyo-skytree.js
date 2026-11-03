import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

/** A slender lattice silhouette based on the supplied skyline reference.
 * Model height remains cfg.h; source pick target and navigation radius remain. */
export function skytreeRadius(y){const t=Math.min(1,Math.max(0,y/23));return 1.05+1.12*(1-t)**2;}
export function createTokyoSkytree({city}){
 let record=null,enabled=false,disposed=false;
 const stats={tokyoSkytree:0,triangles:0,drawCalls:0};
 function build(L){
  const root=new THREE.Group();root.name='Tokyo Skytree — tapered lattice and observation decks';root.scale.setScalar(L.cfg.h/42);L.holder.add(root);
  const materials=[],batches=new Map();
  const mat=(color,roughness,metalness)=>{const m=new THREE.MeshStandardMaterial({color,roughness,metalness,envMapIntensity:.85});materials.push(m);batches.set(m,[]);return m;};
  const frame=mat('#c4cdcf',.42,.45),rim=mat('#d5d9d6',.48,.3),glass=mat('#456577',.18,.35),core=mat('#6d818c',.56,.3),stone=mat('#a9afac',.82,.02);
  glass.userData.cityGlass=true;glass.userData.reflectionZone='skyline';
  const add=(g,m)=>{if(g.index){const old=g;g=g.toNonIndexed();old.dispose();}batches.get(m).push(g);};
  const rod=(a,b,r,m=frame)=>{const from=new THREE.Vector3(...a),to=new THREE.Vector3(...b),d=to.clone().sub(from),g=new THREE.CylinderGeometry(r,r,d.length(),6);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize()));g.translate(...from.add(to).multiplyScalar(.5).toArray());add(g,m);};
  const cylinder=(m,y,h,rt,rb,n=48)=>add(new THREE.CylinderGeometry(rt,rb,h,n).translate(0,y,0),m);
  const ring=(m,y,r,t)=>add(new THREE.TorusGeometry(r,t,5,64).rotateX(Math.PI/2).translate(0,y,0),m);
  const node=(i,y)=>{const a=i*Math.PI/6,r=skytreeRadius(y)*(1+.16*Math.cos(a*3)*(1-Math.min(y/23,1)));return [Math.cos(a)*r,y,Math.sin(a)*r];};
  cylinder(stone,.14,.28,2.8,3,3);
  cylinder(core,11.5,23,.32,.65,24);
  for(let row=0;row<17;row++){
   const y0=.3+row*1.3,y1=y0+1.3;
   for(let i=0;i<12;i++){
    rod(node(i,y0),node(i,y1),i%4===0?.085:.042);
    rod(node(i,y0),node(i+1,y1),.027);rod(node(i+1,y0),node(i,y1),.027);
    rod(node(i,y0),node(i+1,y0),.033);
   }
  }
  cylinder(rim,22.75,.6,1.92,1.24);cylinder(glass,23.25,.42,1.96,1.92);ring(frame,23.48,1.96,.045);cylinder(rim,23.58,.2,1.79,1.96);
  for(let i=0;i<48;i++){const a=i*Math.PI/24;rod([Math.cos(a)*1.93,23.02,Math.sin(a)*1.93],[Math.cos(a)*1.96,23.46,Math.sin(a)*1.96],.016);}
  cylinder(core,26.5,6,.4,.58,24);
  for(let row=0;row<5;row++)for(let i=0;i<12;i++){
   const a=i*Math.PI/6,b=(i+1)*Math.PI/6,y=23.7+row*1.1,r0=.94-row*.045,r1=r0-.045;
   rod([Math.cos(a)*r0,y,Math.sin(a)*r0],[Math.cos(a)*r1,y+1.1,Math.sin(a)*r1],.037);
   rod([Math.cos(a)*r0,y,Math.sin(a)*r0],[Math.cos(b)*r1,y+1.1,Math.sin(b)*r1],.022);
   if(i===0)ring(frame,y,r0,.025);
  }
  cylinder(rim,29.55,.45,1.3,.74);cylinder(glass,29.99,.43,1.27,1.3);ring(rim,30.25,1.27,.065);cylinder(rim,30.45,.35,.78,1.27);
  for(let i=0;i<36;i++){const a=i*Math.PI/18;rod([Math.cos(a)*1.29,29.78,Math.sin(a)*1.29],[Math.cos(a)*1.26,30.2,Math.sin(a)*1.26],.014);}
  cylinder(frame,32.25,3.3,.31,.65,24);
  for(let y=30.8;y<33.9;y+=.45)ring(core,y,.66-(y-30.8)*.105,.025);
  cylinder(core,37.2,6.5,.16,.28,24);cylinder(frame,41.15,1.7,.055,.15,16);
  for(let y=34.3;y<40.5;y+=.74){ring(rim,y,.31-(y-34.3)*.015,.035);cylinder(rim,y,.12,.34-(y-34.3)*.016,.34-(y-34.3)*.016,24);}
  for(const [m,parts] of batches){const g=mergeGeometries(parts);parts.forEach(p=>p.dispose());const mesh=new THREE.Mesh(g,m);mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);stats.triangles+=g.attributes.position.count/3;}
  record={L,root,materials,visible:L.asset.visible};stats.tokyoSkytree=1;stats.drawCalls=root.children.length;
 }
 return {stats,apply(){if(disposed)return;const L=city.LM?.skytree;if(!record&&L?.asset)build(L);if(record){record.root.visible=enabled;record.L.asset.visible=enabled?false:record.visible;}},setEnabled(v){enabled=!!v&&!disposed;if(record){record.root.visible=enabled;record.L.asset.visible=enabled?false:record.visible;}},dispose(){if(disposed)return;this.setEnabled(false);disposed=true;if(record){record.root.removeFromParent();record.root.children.forEach(m=>m.geometry.dispose());record.materials.forEach(m=>m.dispose());}}};
}
