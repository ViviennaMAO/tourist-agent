import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {installSurfaceFinish} from './surface-finish.js';
import {VEGAS_LAKE,vegasLakeObstacles} from './vegas-layout.js';

export function vegasJet(lane,t,time){
 const a=(lane/36)*Math.PI*2,x=VEGAS_LAKE.x+Math.cos(a)*11.5,z=VEGAS_LAKE.z+Math.sin(a)*4;
 const height=1.3+2.3*(.5+.5*Math.sin(time*.7+lane*.42));
 return [x+Math.cos(a)*.35*t,VEGAS_LAKE.y+.04+4*height*t*(1-t),z+Math.sin(a)*.25*t];
}
export function createVegasLake({city}){
 const root=new THREE.Group();root.name='Las Vegas — fountain lake and promenade';city.w.root.add(root);
 const ctx=city.w.ctx,parts=[],owned=[],waterTime={value:0};let enabled=false,registered=false,disposed=false,last=NaN;
 const p=VEGAS_LAKE;
 const stone=new THREE.MeshStandardMaterial({color:'#d4c6aa',roughness:.8});installSurfaceFinish(stone,'limestone');owned.push(stone);
 const metal=new THREE.MeshStandardMaterial({color:'#766750',roughness:.45,metalness:.65});owned.push(metal);
 const water=new THREE.MeshPhysicalMaterial({color:'#3b7a80',roughness:.14,metalness:.2,clearcoat:.8,envMapIntensity:1.15});owned.push(water);water.userData.cityGlass=true;water.userData.reflectionZone='lake';
 water.onBeforeCompile=sh=>{sh.uniforms.vgTime=waterTime;sh.vertexShader='varying vec3 vgWater;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvgWater=position;');sh.fragmentShader='uniform float vgTime;varying vec3 vgWater;\n'+sh.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
 vec2 q=vgWater.xz;float w1=sin(q.x*3.4+q.y*2.8+vgTime*1.1),w2=cos(q.y*7.1-q.x*4.2-vgTime*1.5);
 normal=normalize(normal+mat3(viewMatrix)*vec3(w1*.035,0.,w2*.025));
 `).replace('#include <color_fragment>',`#include <color_fragment>
 float r=length(vec2((vgWater.x+23.)/11.5,(vgWater.z-31.)/4.));float ripple=pow(max(0.,sin(r*90.-vgTime*4.)),15.)*exp(-abs(r-1.)*7.);
 diffuseColor.rgb+=vec3(.04,.055,.055)*ripple;
 `);};water.customProgramCacheKey=()=> 'vegas-lake-waves-v1';
 function mesh(g,m,shadow=false){const o=new THREE.Mesh(g,m);o.receiveShadow=true;o.castShadow=shadow;root.add(o);return o;}
 mesh(new THREE.CircleGeometry(1,112).rotateX(-Math.PI/2).scale(p.rx,1,p.rz).translate(p.x,p.y,p.z),water);
 mesh(new THREE.RingGeometry(1,1.15,112).rotateX(-Math.PI/2).scale(p.rx,1,p.rz).translate(p.x,1.115,p.z),stone).userData.skipContact=true;
 const curve=new THREE.CatmullRomCurve3(Array.from({length:112},(_,i)=>new THREE.Vector3(p.x+Math.cos(i/112*Math.PI*2)*p.rx,1.2,p.z+Math.sin(i/112*Math.PI*2)*p.rz)),true);
 mesh(new THREE.TubeGeometry(curve,112,.13,6,true),stone);
 // Low bollards and warm lamps on the seaward half; gaps remain walkable.
 const glow=new THREE.MeshStandardMaterial({color:'#f6d998',emissive:'#efbb66',emissiveIntensity:.7,roughness:.4});owned.push(glow);const lights=[];
 for(let i=0;i<13;i++){
  const a=i/12*Math.PI,x=p.x+Math.cos(a)*(p.rx+1.6),z=p.z+Math.sin(a)*(p.rz+1.05);
  parts.push(new THREE.CylinderGeometry(.055,.07,1.1,8).translate(x,1.55,z));
  lights.push(new THREE.BoxGeometry(.15,.25,.15).translate(x,2.12,z));
 }
 for(const [gs,m] of [[parts,metal],[lights,glow]]){const g=mergeGeometries(gs);gs.forEach(g=>g.dispose());mesh(g,m,true);}
 const count=36*48,positions=new Float32Array(count*3),g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));g.boundingSphere=new THREE.Sphere(new THREE.Vector3(p.x,2,p.z),16);
 const spray=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{pixelRatio:{value:1}},vertexShader:`uniform float pixelRatio;varying float fade;void main(){vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=clamp(62./max(1.,-p.z),1.1,4.)*pixelRatio;fade=clamp(45./max(1.,-p.z),.5,1.);}`,fragmentShader:`varying float fade;void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;gl_FragColor=vec4(.93,.94,.86,(1.-smoothstep(.15,1.,r))*.85*fade);#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}`.replace(';#include',';\n#include')});owned.push(spray);
 const drops=new THREE.Points(g,spray);drops.userData.excludeReflection=true;drops.onBeforeRender=r=>spray.uniforms.pixelRatio.value=r.getPixelRatio();root.add(drops);
 const jetMat=new THREE.MeshPhysicalMaterial({color:'#d2e7e7',roughness:.18,metalness:.08,transparent:true,opacity:.42,depthWrite:false});owned.push(jetMat);
 const jets=new THREE.InstancedMesh(new THREE.CylinderGeometry(1,1,1,5),jetMat,36*12);jets.instanceMatrix.setUsage(THREE.DynamicDrawUsage);jets.frustumCulled=false;jets.userData.excludeReflection=true;root.add(jets);
 const matrix=new THREE.Matrix4(),rotation=new THREE.Quaternion(),up=new THREE.Vector3(0,1,0),scale=new THREE.Vector3(),from=new THREE.Vector3(),to=new THREE.Vector3(),direction=new THREE.Vector3(),mid=new THREE.Vector3();
 const obstacles=vegasLakeObstacles();const surface=(x,z)=>enabled&&Math.hypot((x-p.x)/p.rx,(z-p.z)/p.rz)<=1.15?1.16:null;
 return {root,stats:{vegasJets:36,drawCalls:root.children.length},apply(time=0){if(disposed||!enabled||time===last)return;last=time;waterTime.value=time;
  for(let i=0;i<count;i++){const lane=i%36,t=((Math.floor(i/36)/48+time*.65)%1+1)%1,q=vegasJet(lane,t,time);q[0]+=Math.sin(i*5.3)*.025;q[2]+=Math.cos(i*7.1)*.025;positions.set(q,i*3);}g.attributes.position.needsUpdate=true;
  for(let lane=0;lane<36;lane++)for(let j=0;j<12;j++){
   from.fromArray(vegasJet(lane,j/12,time));to.fromArray(vegasJet(lane,(j+1)/12,time));direction.subVectors(to,from);const length=direction.length();rotation.setFromUnitVectors(up,direction.normalize());const radius=.023-(j/12)*.012;scale.set(radius,length,radius);mid.copy(from).add(to).multiplyScalar(.5);matrix.compose(mid,rotation,scale);jets.setMatrixAt(lane*12+j,matrix);
  }jets.instanceMatrix.needsUpdate=true;
 },setEnabled(v){enabled=!!v&&!disposed;root.visible=enabled;if(registered!==enabled){registered=enabled;if(enabled){ctx.rects.push(...obstacles);ctx.walkSurfaces.push(surface);}else{ctx.rects=ctx.rects.filter(q=>!obstacles.includes(q));ctx.walkSurfaces=ctx.walkSurfaces.filter(f=>f!==surface);}}},dispose(){if(disposed)return;this.setEnabled(false);disposed=true;root.removeFromParent();root.children.forEach(m=>{m.geometry.dispose();if(m.isInstancedMesh)m.dispose();});owned.forEach(m=>m.dispose());}};
}
