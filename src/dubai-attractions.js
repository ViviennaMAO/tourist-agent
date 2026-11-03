import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** Authored miniature attractions, not surveyed replicas. Local metres are kept
 * intact by the landmark loader so the pier and navigation surfaces align. */
export function createDubaiAttraction(kind) {
  if(!['wheel','cruise'].includes(kind))throw new Error('Unknown Dubai attraction: '+kind);
  const root=new THREE.Group();root.name=kind==='wheel'?'Dubai waterfront observation wheel':'Dubai cruise terminal';
  const materials=[],geometries=new Set(),batches=new Map();
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
    // Staggered paving sets the plaza at the island's existing walk height.
    for(let row=0;row<18;row++)for(let col=0;col<17;col++)box((row+col)%7?paver:paverLight,-15+col*1.99,.02,-17.9+row*1.94,1.97,.04,1.92);
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
    for(const x of [-9,9]){planter(x,5,3,1.2);lamp(x,2);box(teak,x,.45,7,2.4,.16,.65);for(const xx of [-.8,.8])box(bronze,x+xx,.23,7,.08,.46,.55);}
    for(let i=0;i<8;i++)box(stone,-13+i*3.7,.025,9,3.65,.05,2.2);
    update=t=>{const angle=t*.012;rotor.rotation.z=angle;cabins.forEach((g,i)=>{const a=i/24*Math.PI*2;g.position.set(Math.cos(a)*r,Math.sin(a)*r,0);g.rotation.z=-angle;g.updateMatrix();});
      for(const mesh of cabinInstances){cabins.forEach((g,i)=>mesh.setMatrixAt(i,g.matrix));mesh.instanceMatrix.needsUpdate=true;}
    };
    root.userData.cabins=cabins;root.userData.rotor=rotor;
  }else{
    // Terminal stays on the pier; the full bow and stern lie outside the quay.
    box(stone,0,1.03,0,7.7,.12,48);
    for(let z=-22;z<=22;z+=2)for(const x of [-2.8,-.9,.9,2.8])box(z%4?paver:paverLight,x,1.1,z,1.82,.025,1.96);
    box(stone,-.8,2.65,-6,4.4,3.1,13);box(glass,-.8,2.7,1,4.1,2.6,.08);
    for(const z of [-11,-8,-5,-2]){box(glass,1.45,2.7,z,.06,2.25,2.5);box(bronze,1.51,2.7,z,.04,2.3,.04);}
    for(const y of [1.2,4.2])box(ivory,-.8,y,-6,4.8,.16,13.6);
    for(let i=0;i<9;i++){const z=-12+i*1.6;box(teak,-.5,4.45,z,6.3,.15,.13);}
    for(const z of [-16,6,18]){planter(-2.5,z,1.2,2);lamp(-2.8,z+2);}
    rail(-3.65,-22,-3.65,-14);rail(-3.65,4,-3.65,23);rail(-3.65,23,3.65,23);rail(3.65,-22,3.65,23);
    for(let z=-21;z<=21;z+=4){box(dark,4, .7,z,.35,1.1,.65);add(new THREE.CylinderGeometry(.12,.18,.35,8).translate(3.3,1.3,z),bronze);}
    // A long tapered hull with multiple decks, bridge, balconies and lifeboats.
    const ship=new THREE.Group();ship.position.set(14,0,0);ship.name='berthed-cruise-ship';root.add(ship);
    const hull=new THREE.Shape();hull.moveTo(-4.4,-18);hull.lineTo(-5,-12);hull.lineTo(-5,14);hull.quadraticCurveTo(-4.5,20,0,23);hull.quadraticCurveTo(4.5,20,5,14);hull.lineTo(5,-12);hull.lineTo(4.4,-18);hull.closePath();
    const hullGeo=new THREE.ExtrudeGeometry(hull,{depth:3.8,bevelEnabled:true,bevelThickness:.18,bevelSize:.35,bevelSegments:2,steps:1,curveSegments:16}).rotateX(Math.PI/2).translate(0,3.6,0);add(hullGeo,ivory,ship);
    // Dark waterline and rows of portholes are below the balcony decks.
    for(const x of [-5.37,5.37]){
      box(dark,x,1.1,-1,.07,.45,29,ship);
      for(let z=-15;z<15;z+=1.1)add(new THREE.CylinderGeometry(.11,.11,.07,10).rotateZ(Math.PI/2).translate(x,2.65,z),glass,ship);
    }
    const outline=hull.getPoints(12);
    for(let i=0;i<outline.length-1;i++){
      const a=outline[i],b=outline[i+1];
      beam(steel,[a.x,3.85,a.y],[a.x,4.6,a.y],.025,ship);
      for(const y of [4.2,4.6])beam(steel,[a.x,y,a.y],[b.x,y,b.y],.022,ship);
    }
    for(const x of [-1.8,1.8]){add(new THREE.CylinderGeometry(.27,.32,.3,12).translate(x,3.98,17),bronze,ship);box(steel,x,3.82,17,.9,.1,1.1,ship);}
    for(let deck=0;deck<4;deck++){
      const y=4+deck*1.1,len=31-deck*2,w=8.8-deck*.35;
      box(ivory,0,y,-1,w,.18,len,ship);box(glass,0,y+.48,-1,w-.32,.78,len-.8,ship);
      box(ivory,0,y+.94,-1,w-.12,.12,len-.4,ship);
      for(const sign of [-1,1])for(let z=-len/2;z<len/2-1;z+=1.25){box(ivory,sign*(w/2-.11),y+.5,z,.10,.78,.06,ship);beam(steel,[sign*w/2,y+.65,z],[sign*w/2,y+.65,z+1.2],.022,ship);}
    }
    box(glass,0,8.45,9,6.8,.9,3.8,ship);box(ivory,0,9,9,7.5,.16,4.3,ship);
    box(teak,0,8.4,-7,6.6,.08,10,ship);box(glass,0,8.46,-8,2.8,.09,4.7,ship);
    for(const x of [-2.4,2.4])for(let z=-11;z<-3;z+=1.5)box(ivory,x,8.58,z,.55,.2,1,ship);
    box(ivory,0,8.85,0,3.3,1.3,3.8,ship);box(dark,0,9.53,0,3.35,.12,3.9,ship);
    beam(steel,[0,9,9],[0,11,9],.055,ship);beam(steel,[-1.5,10.1,9],[1.5,10.1,9],.04,ship);
    for(const sign of [-1,1])for(let z=-12;z<=8;z+=5){add(new THREE.CapsuleGeometry(.42,1.55,3,8).rotateX(Math.PI/2).translate(sign*5.05,4.45,z),orange,ship);}
    // Two enclosed passenger gangways span the water to the ship side.
    for(const z of [-8,8]){box(ivory,6.25,2.1,z,5,.22,1.15);box(glass,6.25,2.8,z,5,1.2,.92);box(ivory,6.25,3.45,z,5.1,.12,1.3);for(let x=4;x<=8.5;x+=.9)box(steel,x,2.8,z,.05,1.2,1.02);}
  }
  for(const [parent,byMaterial] of batches)for(const [m,gs] of byMaterial){
    const cabin=parent.name==='observation-cabin';
    if(cabin&&parent!==root.userData.cabins[0]){gs.forEach(g=>g.dispose());continue;}
    const g=mergeGeometries(gs);gs.forEach(g=>g.dispose());geometries.add(g);
    const mesh=cabin?new THREE.InstancedMesh(g,m,24):new THREE.Mesh(g,m);
    mesh.castShadow=mesh.receiveShadow=true;
    if(m.userData.paving)mesh.userData.skipContact=true;
    if(cabin){mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);root.userData.rotor.add(mesh);cabinInstances.push(mesh);}else parent.add(mesh);
  }
  root.userData.animate=update;update(0);
  let disposed=false;root.userData.dispose=()=>{if(disposed)return;disposed=true;root.removeFromParent();root.traverse(o=>{if(o.isInstancedMesh)o.dispose();});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());};
  root.userData.stats={triangles:0,drawCalls:0};
  root.traverse(o=>{if(o.isMesh){root.userData.stats.drawCalls++;root.userData.stats.triangles+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);}});
  return root;
}
