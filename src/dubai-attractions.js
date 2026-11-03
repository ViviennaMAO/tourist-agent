import {appendDubaiMarina} from './dubai-marina.js';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** Authored miniature attractions, not surveyed replicas. Local metres are kept
 * intact by the landmark loader so the pier and navigation surfaces align. */
export function createDubaiAttraction(kind) {
  if(!['wheel','cruise'].includes(kind))throw new Error('Unknown Dubai attraction: '+kind);
  const root=new THREE.Group();root.name=kind==='wheel'?'Dubai waterfront observation wheel':'Dubai cruise terminal';
  const textures=[],materials=[],geometries=new Set(),batches=new Map();
  const finish=(color,roughness=.7,metalness=0)=>{const m=new THREE.MeshStandardMaterial({color,roughness,metalness});materials.push(m);return m;};
  const stone=finish('#d9ceba',.88),ivory=finish('#e1dfd1',.44,.22),steel=finish('#a5afad',.32,.7),bronze=finish('#746247',.43,.55),glass=finish('#587782',.2,.38),dark=finish('#273e47',.5,.2),teak=finish('#927751',.85),green=finish('#647c48',.95),flower=finish('#ac5277',.9),warm=finish('#f2d8a1',.5),orange=finish('#c88b4c',.65);
  const paver=finish('#d9ceba',.9),paverLight=finish('#d4cab8',.9);
  paver.userData.paving=paverLight.userData.paving=true;
  const cabinInstances=[];
  warm.emissive.set('#deb77b');warm.emissiveIntensity=.24;
  function add(g,m,parent=root){if(!g.index)g.setIndex(Array.from({length:g.attributes.position.count},(_,i)=>i));if(!batches.has(parent))batches.set(parent,new Map());const b=batches.get(parent);if(!b.has(m))b.set(m,[]);b.get(m).push(g);}
  function box(m,x,y,z,w,h,d,parent=root){add(new THREE.BoxGeometry(w,h,d).translate(x,y,z),m,parent);}
  function beam(m,a,b,r=.07,parent=root){const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),v=q.clone().sub(p);const g=new THREE.CylinderGeometry(r,r,v.length(),6);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize()));g.translate(...p.add(q).multiplyScalar(.5).toArray());add(g,m,parent);}
  function rail(x1,z1,x2,z2,y=1.1,parent=root){const n=Math.ceil(Math.hypot(x2-x1,z2-z1)/1.5);for(let i=0;i<=n;i++){const t=i/n,x=x1+(x2-x1)*t,z=z1+(z2-z1)*t;beam(bronze,[x,y,z],[x,y+.85,z],.035,parent);}for(const h of [.4,.85])beam(steel,[x1,y+h,z1],[x2,y+h,z2],.026,parent);}
  function planter(x,z,w=2,d=1,parent=root){const lift=kind==='cruise'?1.1:0;const patch=new THREE.Group();patch.position.y=lift;parent.add(patch);parent=patch;box(stone,x,.32,z,w,.64,d,parent);box(dark,x,.65,z,w-.14,.05,d-.14,parent);for(let i=0;i<12;i++){const px=x+Math.sin(i*2.4)*(w*.36),pz=z+Math.cos(i*2.4)*(d*.3);add(new THREE.IcosahedronGeometry(.22+(i%3)*.04,1).scale(1,.8,1).translate(px,.82+(i%3)*.08,pz),i%4===0?flower:green,parent);}}
  function lamp(x,z,parent=root){const lift=kind==='cruise'?1.1:0;const patch=new THREE.Group();patch.position.y=lift;parent.add(patch);parent=patch;beam(bronze,[x,.1,z],[x,2.5,z],.045,parent);box(warm,x,2.57,z,.18,.38,.18,parent);box(bronze,x,2.8,z,.27,.06,.27,parent);}
  let update=()=>{};
  if(kind==='wheel'){
    // Circular substrate closes the clipped grid at the curved shore.
    add(new THREE.CircleGeometry(19.85,128).rotateX(-Math.PI/2).translate(0,.012,0),paver);
    // Staggered paving sets the plaza at the island's existing walk height.
    for(let row=-9;row<=9;row++)for(let col=-9;col<=9;col++){const x=col*1.99,z=row*1.99;if(Math.hypot(Math.abs(x)+1,Math.abs(z)+1)<19.8)box((row+col)%7?paver:paverLight,x,.02,z,1.97,.04,1.97);}
    // Twin rim, tension spokes, braced A-frame and 24 self-leveling cabins.
    const cy=17,r=13.5,rotor=new THREE.Group();rotor.name='wheel-rotor';rotor.position.y=cy;root.add(rotor);
    for(const z of [-1,1]){
      add(new THREE.TorusGeometry(r,.14,8,128).translate(0,0,z),ivory,rotor);
      add(new THREE.TorusGeometry(r-.5,.045,5,128).translate(0,0,z),steel,rotor);
      for(let i=0;i<48;i++){const a=i/48*Math.PI*2;beam(steel,[Math.cos(a)*.6,Math.sin(a)*.6,z*.4],[Math.cos(a)*r,Math.sin(a)*r,z],i%2?.026:.04,rotor);}
    }
    for(let i=0;i<48;i++){const a=i/48*Math.PI*2,b=a+Math.PI/24;beam(ivory,[Math.cos(a)*r,Math.sin(a)*r,-1],[Math.cos(a)*r,Math.sin(a)*r,1],.065,rotor);beam(steel,[Math.cos(a)*r,Math.sin(a)*r,-1],[Math.cos(b)*r,Math.sin(b)*r,1],.035,rotor);}
    const axle=new THREE.CylinderGeometry(.63,.63,4,24).rotateX(Math.PI/2).translate(0,cy,0);add(axle,steel);
    for(const z of [-2.5,2.5])for(const x of [-4.5,4.5]){box(stone,x,.25,z,2,.5,2);beam(ivory,[x,.5,z],[0,cy,z*.5],.32);beam(steel,[x,.7,z],[0,cy-1.5,-z*.45],.07);}
    const cabins=[];
    for(let i=0;i<24;i++){
      const g=new THREE.Group();g.name='observation-cabin';rotor.add(g);cabins.push(g);
      beam(steel,[0,0,0],[0,-.48,0],.055,g);
      box(glass,0,-1.02,0,1.02,.95,1.45,g);box(ivory,0,-.48,0,1.15,.12,1.57,g);box(ivory,0,-1.55,0,1.15,.16,1.57,g);
      for(const x of [-.48,.48])for(const z of [-.69,.69])beam(ivory,[x,-.52,z],[x,-1.5,z],.035,g);
      for(const z of [-.73,.73])box(bronze,0,-1.05,z,.035,.9,.03,g);
      box(warm,0,-.57,0,.65,.035,.7,g);
    }
    // Low loading pavilion leaves a continuous public route around the wheel.
    box(stone,0,.2,0,10,.4,4.4);box(glass,0,1.1,-2.7,5.5,1.6,1.3);box(ivory,0,2,-2.7,6.2,.18,1.8);
    update=t=>{const angle=t*.012;rotor.rotation.z=angle;cabins.forEach((g,i)=>{const a=i/24*Math.PI*2;g.position.set(Math.cos(a)*r,Math.sin(a)*r,0);g.rotation.z=-angle;g.updateMatrix();});
      for(const mesh of cabinInstances){cabins.forEach((g,i)=>mesh.setMatrixAt(i,g.matrix));mesh.instanceMatrix.needsUpdate=true;}
    };
    root.userData.cabins=cabins;root.userData.rotor=rotor;
  }else{
    textures.push(...appendDubaiMarina({root,add,box,beam,rail,finish,stone,ivory,steel,bronze,glass,dark,teak,green,flower,warm,paver,paverLight}));
    // Static harbor furniture and ships share material batches across all berths.
    root.updateMatrixWorld(true);
    const flat=new Map();
    for(const [parent,byMaterial] of batches)for(const [m,gs] of byMaterial){
      if(!flat.has(m))flat.set(m,[]);
      gs.forEach(g=>flat.get(m).push(g.applyMatrix4(parent.matrixWorld)));
    }
    batches.clear();batches.set(root,flat);
  }
  for(const [parent,byMaterial] of batches)for(const [m,gs] of byMaterial){
    const cabin=parent.name==='observation-cabin';
    if(cabin&&parent!==root.userData.cabins[0]){gs.forEach(g=>g.dispose());continue;}
    const g=mergeGeometries(gs);gs.forEach(g=>g.dispose());geometries.add(g);
    const mesh=cabin?new THREE.InstancedMesh(g,m,24):new THREE.Mesh(g,m);
    mesh.castShadow=!m.userData.paving&&!m.userData.noShadow;mesh.receiveShadow=true;
    if(m.userData.paving)mesh.userData.skipContact=true;
    if(cabin){mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);root.userData.rotor.add(mesh);cabinInstances.push(mesh);}else parent.add(mesh);
  }
  root.userData.animate=update;update(0);
  let disposed=false;root.userData.dispose=()=>{if(disposed)return;disposed=true;root.removeFromParent();root.traverse(o=>{if(o.isInstancedMesh)o.dispose();});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());};
  root.userData.stats={triangles:0,drawCalls:0};
  root.traverse(o=>{if(o.isMesh){root.userData.stats.drawCalls++;root.userData.stats.triangles+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);}});
  return root;
}
