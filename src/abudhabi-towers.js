import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {installCurtainWallFinish} from './curtain-wall.js';

// Miniature composition derived from the supplied photos, not a surveyed model.
export const ETIHAD_TOWERS=[
 {x:-6.4,z:-2.4,h:22.6,rx:1.65,rz:1.18,lean:.5,cut:1.4},
 {x:-2.2,z:-3.5,h:26,rx:1.52,rz:1.1,lean:.7,cut:1.65},
 {x:2.1,z:-2.6,h:24.2,rx:1.55,rz:1.15,lean:.55,cut:1.4},
 {x:6.1,z:1.5,h:21.5,rx:1.7,rz:1.15,lean:-.6,cut:1.2},
 {x:-2.1,z:3.2,h:18.1,rx:1.35,rz:1.35,lean:0,cut:0}
];
export function etihadPoint(t,angle,u){
 const swell=.83+.17*Math.sin(Math.PI*u),top=t.h-t.cut*(.5+.5*Math.cos(angle));
 return new THREE.Vector3(t.x+Math.cos(angle)*t.rx*swell+t.lean*u*u,2+u*(top-2),t.z+Math.sin(angle)*t.rz*swell);
}
export function createAbuTowers({city}){
 let record=null,enabled=false,disposed=false;const stats={etihadTowers:0,triangles:0,drawCalls:0};
 function build(L){
  const root=new THREE.Group();root.name='Abu Dhabi — five curved waterfront towers';L.holder.add(root);
  const batches=new Map(),materials=[];
  const mat=(color,roughness=.35,metalness=.3)=>{const m=new THREE.MeshStandardMaterial({color,roughness,metalness,envMapIntensity:1.1});materials.push(m);batches.set(m,[]);return m;};
  const glasses=['#385b70','#527789','#3d647c'].map(c=>{const m=mat(c,.18,.35);m.userData.cityGlass=true;m.userData.reflectionZone='etihad';installCurtainWallFinish(m);return m;});
  const silver=mat('#aebdc2',.4,.62),stone=mat('#d5d6cb',.76,.02),dark=mat('#657b86',.5,.4);
  const add=(g,m)=>{if(g.index){const old=g;g=g.toNonIndexed();old.dispose();}batches.get(m).push(g);};
  const rod=(a,b,r,m)=>{const d=b.clone().sub(a),g=new THREE.CylinderGeometry(r,r,d.length(),5);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize()));g.translate(...a.clone().add(b).multiplyScalar(.5).toArray());add(g,m);};
  const ellipse=(m,y,h,rx,rz)=>add(new THREE.CylinderGeometry(1,1,h,80).scale(rx,1,rz).translate(0,y,0),m);
  ellipse(stone,.2,.4,10.1,6.35);ellipse(glasses[1],1.18,1.55,9.7,6);ellipse(stone,2.02,.16,10,6.3);
  for(const y of [.6,1.18,1.76])ellipse(silver,y,.045,9.75,6.05);
  for(let k=0;k<64;k++){const a=k*Math.PI/32;rod(new THREE.Vector3(Math.cos(a)*9.72,.43,Math.sin(a)*6.02),new THREE.Vector3(Math.cos(a)*9.72,1.95,Math.sin(a)*6.02),.018,silver);}
  for(const [index,t] of ETIHAD_TOWERS.entries()){
   const p=[],uv=[],indices=[],segments=48,rows=24;
   for(let j=0;j<=rows;j++)for(let i=0;i<=segments;i++){const v=etihadPoint(t,i/segments*Math.PI*2,j/rows);p.push(...v.toArray());uv.push(i/segments,j/rows);}
   for(let j=0;j<rows;j++)for(let i=0;i<segments;i++){const a=j*(segments+1)+i,b=a+segments+1;indices.push(a,b,a+1,a+1,b,b+1);}
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();add(g,glasses[index%3]);
   // Fine horizontal floor bands and narrow continuous vertical mullions.
   for(let y=2.4;y<t.h-.25;y+=.47){const u=(y-2)/(t.h-2);for(let k=0;k<48;k++)rod(etihadPoint(t,k*Math.PI/24,u),etihadPoint(t,(k+1)*Math.PI/24,u),.012,silver);}
   for(let k=0;k<24;k++)for(let j=0;j<24;j++)rod(etihadPoint(t,k*Math.PI/12,j/24),etihadPoint(t,k*Math.PI/12,(j+1)/24),k%6===0?.035:.013,silver);
   const cap=new THREE.BufferGeometry(),cp=[];const center=new THREE.Vector3(t.x+t.lean,t.h-t.cut*.5,t.z);
   for(let k=0;k<48;k++){const a=etihadPoint(t,k*Math.PI/24,1),b=etihadPoint(t,(k+1)*Math.PI/24,1);cp.push(...center.toArray(),...b.toArray(),...a.toArray());rod(a,b,.055,silver);}
   cap.setAttribute('position',new THREE.Float32BufferAttribute(cp,3));cap.setAttribute('uv',new THREE.Float32BufferAttribute(Array(cp.length/3*2).fill(0),2));cap.computeVertexNormals();add(cap,dark);
   // Two pale curved blades on the tallest towers emphasise their tapered crown.
   if(index<4)for(const angle of [Math.PI*.53,Math.PI*1.53])for(let j=0;j<32;j++)rod(etihadPoint(t,angle,j/32),etihadPoint(t,angle,(j+1)/32),.075,silver);
  }
  for(const [m,parts] of batches){const g=mergeGeometries(parts);parts.forEach(g=>g.dispose());const mesh=new THREE.Mesh(g,m);mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);stats.triangles+=g.attributes.position.count/3;}
  record={root,L,materials,visible:L.asset.visible,size:L.size,rXZ:L.rXZ};stats.etihadTowers=5;stats.drawCalls=root.children.length;
 }
 function sync(){if(!record)return;const {L,root}=record;root.visible=enabled;L.asset.visible=enabled?false:record.visible;L.size=enabled?[21,26,14]:record.size;L.rXZ=enabled?L.cfg.r:record.rXZ;}
 return {stats,apply(){if(disposed)return;const L=city.LM?.etihad_towers;if(!record&&L?.asset)build(L);sync();},setEnabled(v){enabled=!!v&&!disposed;sync();},dispose(){if(disposed)return;this.setEnabled(false);disposed=true;if(record){record.root.removeFromParent();record.root.children.forEach(m=>m.geometry.dispose());record.materials.forEach(m=>m.dispose());}}};
}
