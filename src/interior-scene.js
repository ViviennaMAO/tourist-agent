import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {prayerArchGeometry} from './mosque-prayer-hall.js';
import {installSurfaceFinish} from './surface-finish.js';
import {createInteriorCraft,refineInterior} from './interior-detail.js';
import {installInteriorRug,createInteriorPool,installExhibitLight} from './interior-surfaces.js';
import {createCurvedLeaf} from './curved-leaf.js';
import {chamferedBox} from './chamfered-box.js';

export function createInteriorScene(spec){
 const scene=new THREE.Scene();scene.background=new THREE.Color('#d9e2e5');scene.fog=new THREE.Fog('#d9e2e5',38,90);
 const root=new THREE.Group();scene.add(root);const materials=new Map(),batches=new Map(),roofBatches=new Map(),animated=[],obstacles=[],pools=[],ceilings=[];
 const material=(color,metal=0,rough=.58,glow=0)=>{const key=[color,metal,rough,glow].join();if(materials.has(key))return materials.get(key);const m=new THREE.MeshStandardMaterial({color,metalness:metal,roughness:rough});if(glow){m.emissive.set(color);m.emissiveIntensity=glow;}m.envMapIntensity=.42;materials.set(key,m);batches.set(m,[]);roofBatches.set(m,[]);return m;};
 const add=(g,m)=>{if(g.index){const old=g;g=g.toNonIndexed();old.dispose();}batches.get(m).push(g);};
 const addRoof=(g,m)=>{if(g.index){const old=g;g=g.toNonIndexed();old.dispose();}roofBatches.get(m).push(g);};
 const box=(m,x,y,z,w,h,d,angle=0)=>add(chamferedBox(w,h,d,.045).rotateY(angle).translate(x,y,z),m);
 const cyl=(m,x,y,z,r,h,n=24,rt=r)=>add(new THREE.CylinderGeometry(rt,r,h,n).translate(x,y,z),m);
 const ball=(m,x,y,z,r,s=[1,1,1])=>add(new THREE.SphereGeometry(r,16,10).scale(...s).translate(x,y,z),m);
 const ring=(m,x,y,z,r,t=.045,rx=Math.PI/2)=>add(new THREE.TorusGeometry(r,t,6,48).rotateX(rx).translate(x,y,z),m);
 const cream=material('#e8dfcb'),white=material('#eeeae0'),gold=material('#ac8649',.65,.3),dark=material('#314647'),wood=material('#72523e'),leaf=material('#58734b'),water=material('#398a91',.3,.18),light=material('#ffe4ae',0,.3,.8),blue=material('#3c7394',.3,.25),red=material('#b92c32',.3,.35);
 installSurfaceFinish(cream,'limestone');installSurfaceFinish(white,'paving');installSurfaceFinish(wood,'wood');
 const night=['sphere','future','aquarium'].includes(spec.theme);const wall=night?material('#162c40'):cream;
 if(night){scene.background.set('#081426');scene.fog.color.copy(scene.background);}
 box(dark,0,-.3,0,18.6,.5,14.6);box(white,0,-.025,0,18,.12,14);
 box(wall,0,3.5,-7,18,7,.22);
 for(const x of [-9,9]){box(wall,x,2.1,0,.2,4.2,14);box(gold,x,4.2,0,.26,.09,14);}
 for(const x of [-8.7,8.7])box(gold,x,.08,0,.035,.025,13.5);
 for(let z=-6.5;z<7;z+=1)box(material('#c6c2b7'),0,.043,z,17.6,.012,.012);
 const tree=(x,z,scale=1)=>{
  cyl(cream,x,.4,z,.5,.8);cyl(wood,x,1.35,z,.065,1.9,10,.035);
  for(let k=0;k<5;k++){const a=k*2.4,bx=x+Math.cos(a)*.42*scale,bz=z+Math.sin(a)*.42*scale,by=2.05+(k%3)*.23*scale;
   const ps=[new THREE.Vector3(x,1.3,z),new THREE.Vector3(x+(bx-x)*.4,1.9,z+(bz-z)*.4),new THREE.Vector3(bx,by,bz)];add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ps),6,.025,5,false),wood);
   for(let j=0;j<38;j++){const aa=j*2.399+k,rr=.15+(j%7)*.058,vertical=Math.sin(j*1.73)*.38;
    const leafMat=j%3?leaf:material('#77925c');leafMat.side=THREE.DoubleSide;
    add(createCurvedLeaf(THREE,.13+(j%4)*.012,.82).rotateX(-.5+(j%6)*.23).rotateZ(Math.sin(aa)*.45).rotateY(aa).translate(bx+Math.cos(aa)*rr*scale,by+vertical*scale,bz+Math.sin(aa)*rr*scale),leafMat);
   }
  }obstacles.push({x,z,w:1.3,d:1.3});
 };
 const craft=createInteriorCraft({add,addRoof,box,cyl,ball,ring,material});
 const sofa=(x,z,angle=0)=>{craft.sofa(x,z,angle);obstacles.push({x,z,w:2.5,d:2.4});};
 const chandelier=craft.chandelier;
 const pool=(x,z,w,d)=>{box(cream,x,.22,z,w+.3,.4,d+.3);box(water,x,.435,z,w,.025,d);if(!pools.length){const p=createInteriorPool({x,z,w,d});pools.push(p);root.add(p.mesh);}obstacles.push({x,z,w:w+.4,d:d+.4});};
 const windows=()=>{
  // The glazing is faceted along a shallow arc; alternating mullions and a
  // reflected horizon give it depth without a second reflection renderer.
  for(let i=0;i<13;i++){const a=(i-6)*.105,x=Math.sin(a)*12,z=5.3-Math.cos(a)*12;
   box(material(i%3?'#6496ac':'#729faf',.45,.2),x,3.65,z,1.23,5.5,.09,-a);
   box(gold,x+.6*Math.cos(a),3.65,z+.6*Math.sin(a),.035,5.65,.07,-a);
   for(const y of [1,4.1,6.42])box(dark,x,y,z+.06,1.25,.035,.04,-a);
   box(material('#c5d5ce',.3,.3),x,2.2,z+.07,1.18,.045,.015,-a);
  }
 };
 const skyline=(x,z,style)=>{box(wood,x,.75,z,7,.35,3.7);box(style==='strat'?material('#c9a984'):water,x,.94,z,6.8,.04,3.5);for(let i=0;i<18;i++){const xx=x-3+(i%9)*.72,zz=z-.95+Math.floor(i/9)*1.7,h=.4+((i*7)%11)*.15;box(i%3?blue:cream,xx,1+h/2,zz,.36,h,.38);for(let y=1.2;y<1+h;y+=.27)box(gold,xx,y,zz+.198,.33,.012,.012);}if(style==='burj'){cyl(blue,x,2.5,z,.24,3,18,.08);cyl(gold,x,4.3,z,.018,.8,8);}obstacles.push({x,z,w:7.4,d:4.1});};
 let points=[{label:spec.details[0],p:[8,7,10],q:[0,1.5,0]},{label:spec.details[1],p:[-5,4,2],q:[0,3,-5]},{label:spec.details[2],p:[6,3,5],q:[4,1.5,0]}];
 if(spec.theme==='mosque'){
  const carpet=material('#344e47',0,.97);installInteriorRug(carpet,8.4,6.3);box(carpet,0,.07,0,16.8,.03,12.6);
  for(const x of [-5,5])for(const z of [-4,0,4]){cyl(white,x,2.1,z,.19,4,20);box(white,x,.23,z,.65,.46,.65);cyl(gold,x,4.15,z,.34,.2,20);box(white,x,4.35,z,.75,.24,.75);}
  for(const z of [-4,4])add(prayerArchGeometry(5,1.7,4.6,1.45,.24).translate(0,4.4,z),white);
  for(const x of [-5,5])for(const z of [-2,2])add(prayerArchGeometry(2,1.7,1.6,1.4,.24).rotateY(Math.PI/2).translate(x,4.4,z),white);
  add(prayerArchGeometry(1.65,5.7,.95,4.3,.25).translate(0,.1,-6.7),white);box(gold,0,2.3,-6.79,2,4.4,.03);
  for(const x of [-7,-3,3,7]){box(gold,x,3,-6.8,1.25,3.5,.05);box(white,x,3,-6.72,1.15,3.4,.06);}
  for(const x of [-8.82,8.82]){
   box(white,x,.28,0,.11,.45,13.7);box(white,x,3.95,0,.14,.18,13.7);
   for(const z of [-4.5,-1.5,1.5,4.5]){box(gold,x,2.6,z,.12,1.7,1.25);box(white,x*.996,2.6,z,.14,1.6,1.15);for(let j=-2;j<=2;j++)box(gold,x*.99,2.6,z+j*.19,.035,1.5,.018);}
  }
  for(const x of [-7,-3,3,7])for(let j=-2;j<=2;j++)box(gold,x+j*.18,3,-6.66,.018,3.2,.025);
  for(const z of [-4,4])box(gold,0,6.15,z,10.6,.08,.3);
  chandelier(0,-2,5.5);chandelier(0,3,5.5);
  points=[{label:spec.details[0],p:[7.8,3,5.3],q:[0,3,-2]},{label:spec.details[1],p:[0,2.2,-2.8],q:[0,2.6,-6.5]},{label:spec.details[2],p:[2,6,5],q:[0,.1,0]}];
 }else if(['palace','resort','sail'].includes(spec.theme)){
  for(const x of [-6.5,6.5])for(const z of [-4,0,4]){cyl(spec.theme==='sail'?blue:cream,x,3,z,.26,6);cyl(gold,x,5.9,z,.42,.2);}
  pool(0,-1,4.2,3);chandelier(0,-1,6.2);
  for(const x of [-6,6]){tree(x*1.25,-4.3);tree(x*1.25,4.3);sofa(x,0,x>0?-Math.PI/2:Math.PI/2);}
  for(const x of [-6.5,6.5]){box(cream,x,6.1,0,.65,.35,10.2);box(gold,x,6.32,0,.72,.09,10.4);}
  for(const z of [-4,4]){add(prayerArchGeometry(6.5,1.1,6.1,.9,.35).translate(0,5.95,z),cream);box(gold,0,7.08,z,13.5,.07,.38);}
  if(spec.theme==='palace'){
   for(const x of [-3.9,3.9])for(const z of [-4.9,2.9]){cyl(cream,x,3.05,z,.22,6.1);cyl(gold,x,5.96,z,.38,.2);box(cream,x,.2,z,.65,.4,.65);}
   for(const x of [-3.9,3.9])box(cream,x,6.22,-1,.5,.4,8.3);
   for(const z of [-4.9,2.9])add(prayerArchGeometry(3.9,.8,3.5,.62,.4).translate(0,5.95,z),cream);
   add(new THREE.CylinderGeometry(3.85,3.85,.35,48,1,true).translate(0,6.54,-1),cream);cream.side=THREE.DoubleSide;ring(gold,0,6.72,-1,3.86,.055);
   add(new THREE.SphereGeometry(3.8,40,20,0,Math.PI*2,0,Math.PI/2).scale(1,.55,1).translate(0,6.7,-1),cream);
   // Meridians describe a ribbed dome, attached to its drum and four supports.
   for(const [radius,height] of [[3.84,2.13],[3.75,2.04]])for(let k=0;k<16;k++){const a=k*Math.PI/8,ps=[];for(let j=0;j<=20;j++){const t=j*Math.PI/40;ps.push(new THREE.Vector3(Math.sin(t)*radius*Math.cos(a),6.7+Math.cos(t)*height,-1+Math.sin(t)*radius*Math.sin(a)));}add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ps),20,.021,5,false),gold);}
   for(const x of [-7.8,-4,4,7.8]){box(gold,x,3.6,-6.82,1.5,4.8,.06);box(white,x,3.6,-6.76,1.38,4.65,.06);add(prayerArchGeometry(.62,3.2,.48,2.8,.08).translate(x,1.8,-6.65),cream);}
   points=[{label:spec.details[0],p:[6,4,5],q:[0,.6,-1]},{label:spec.details[1],p:[0,3.1,1.7],q:[0,6.3,-1]},{label:spec.details[2],p:[1,3,5],q:[6,1.8,0]}];
  }
  if(spec.theme==='sail'){for(let y=2;y<7;y+=1.5){box(white,0,y,-5.9,15,.22,1);box(gold,0,y+.6,-5.35,15,.05,.05);}for(let i=0;i<4;i++)pool(0,-2+i*.8,2.5-i*.3,.5);}
  if(spec.theme==='resort'){tree(-3,-4,1.4);tree(3,-4,1.3);box(red,0,2.7,-6.7,7,4,.1);}
 }else if(['etihad','burj','strat'].includes(spec.theme)){
  windows();skyline(0,-1,spec.theme);sofa(-6,3);sofa(6,3);tree(-7,-4);tree(7,-4);box(wood,6,.8,-1,2.1,1.5,3.4);
  if(spec.theme==='etihad'){
   for(let i=0;i<5;i++){const g=new THREE.CylinderGeometry(.17,.23,1.5+i*.23,12);g.rotateZ((i-2)*.045).translate(-1.2+i*.6,1.9+i*.115,-1);add(g,blue);}
   points=[{label:spec.details[0],p:[5.3,4.5,4.2],q:[0,1.6,-1]},{label:spec.details[1],p:[2,2.6,1.5],q:[0,3.8,-6]},{label:spec.details[2],p:[1,2.6,5.4],q:[6,1,2]}];
  }
 }else if(spec.theme==='racing'){
  for(const x of [-7,0,7]){box(red,x,3.7,-6.6,1,7.4,.6);box(red,x,7,0,.4,.4,13);}
  for(const x of [-7,7])box(red,x,3.5,6.3,.25,7,.25);box(red,0,7,6.3,14,.3,.3);
  const car=(x,z,s=1)=>{
   box(dark,x,.12,z,3.7*s,.18,1.95*s);
   const wedge=(m,pts)=>{const v=pts.flatMap(([xx,y,zz])=>[x+xx*s,y*s,z+zz*s]);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(16),2));g.setIndex([0,2,1,0,3,2,4,5,6,4,6,7,0,1,5,0,5,4,3,7,6,3,6,2,1,2,6,1,6,5,0,4,7,0,7,3]);g.computeVertexNormals();add(g,m);};
   wedge(red,[[-1.5,.3,-.52],[1.5,.3,-.52],[1.5,.3,.52],[-1.5,.3,.52],[-1.3,.65,-.48],[1.45,.49,-.42],[1.45,.49,.42],[-1.3,.65,.48]]);
   wedge(blue,[[-.85,.63,-.4],[.75,.55,-.4],[.75,.55,.4],[-.85,.63,.4],[-.55,1,-.32],[.22,1,-.32],[.22,1,.32],[-.55,1,.32]]);
   box(red,x-.15*s,1.02*s,z,.85*s,.05,.7*s);box(dark,x-1.25*s,.85*s,z,.18,.07,1.4*s);
   for(const dz of [-.38,.38]){box(gold,x+1.46*s,.48*s,z+dz*s,.035,.1,.22);box(dark,x-1.25*s,.7*s,z+dz*s,.07,.3,.06);}
   for(const dx of [-.95,.98])for(const dz of [-.63,.63]){add(new THREE.CylinderGeometry(.31*s,.31*s,.25*s,24).rotateX(Math.PI/2).translate(x+dx*s,.34*s,z+dz*s),dark);add(new THREE.CylinderGeometry(.18*s,.18*s,.27*s,12).rotateX(Math.PI/2).translate(x+dx*s,.34*s,z+dz*s),gold);}
   obstacles.push({x,z,w:3.8*s,d:2*s});
  };car(-3,1,1.2);car(3,-3,.9);
  box(cream,4,.8,3,4,1.4,2.5);for(const r of [1,.75])add(new THREE.TorusGeometry(r,.09,5,48).rotateX(Math.PI/2).scale(1.65,1,1).translate(4,1.55,3),dark);
  box(wood,-7,.5,-4,1.5,.9,1.2);for(let i=0;i<4;i++){ring(dark,-7,1+i*.65,-4,.42,.12,0);ring(gold,-7,1+i*.65,-3.99,.27,.025,0);}
  for(const x of [-4.8,-1.2]){cyl(gold,x,.7,2.2,.025,1.4,8);box(cream,x,1.38,2.2,.6,.06,.42);}
  points=[{label:spec.details[0],p:[1.4,2.7,4.5],q:[-3,.7,1]},{label:spec.details[1],p:[7,3.8,5.8],q:[4,1.4,3]},{label:spec.details[2],p:[-3.3,2.4,-.4],q:[-7,2,-4]}];
 }else if(spec.theme==='courtyard'){
  pool(0,0,3.8,7);for(const x of [-6,6]){tree(x,4,1.4);sofa(x,1);}
  for(const [i,x] of [-5,0,5].entries()){box(cream,x,.5,-4,3.5,.8,2.8);box(white,x,1.7,-4,2.7,1.8,2.3);if(i===0)ball(white,x,2.7,-4,1.1,[1,.6,1]);if(i===1)for(let k=-2;k<=2;k++)box(gold,x+k*.45,2,-2.83,.09,2.3,.12);if(i===2)add(new THREE.ConeGeometry(1.9,1.2,4).rotateY(Math.PI/4).translate(x,3.1,-4),cream);}
  for(let x=-8;x<=8;x+=.55)box(wood,x,6,-1,.09,.14,10);
  for(const z of [-6,4])box(wood,0,5.9,z,16.2,.2,.2);
  for(const x of [-8,8])for(const z of [-6,4])box(wood,x,3,z,.14,6,.14);
  points=[{label:spec.details[0],p:[7.7,5,1],q:[0,1.8,-4]},{label:spec.details[1],p:[3.8,2.5,5.2],q:[0,.5,-1]},{label:spec.details[2],p:[-6,3.5,4.8],q:[-3,5.8,-3]}];
 }else if(spec.theme==='future'){
  for(const [r,z] of [[4.7,-5],[3.6,-2],[2.5,1]])ring(material('#62cbd9',.2,.3,.8),0,3.8,z,r,.075,0);
  const planet=material('#4286c3',.15,.52,.1);animated.push(installExhibitLight(planet,'planet'));add(new THREE.SphereGeometry(1.15,48,24).translate(0,3,-1),planet);ring(gold,0,3,-1,1.7,.04,.5);
  for(const x of [-5.5,5.5]){cyl(dark,x,.5,1,1,.9);cyl(material('#45b9aa',.1,.4,.3),x,2,1,.68,2.2);tree(x,1,.5);}
 }else if(spec.theme==='aquarium'){
  box(material('#165a77',.04,.7,.22),0,3.5,-6.7,16,6,.18);for(const x of [-8,8])box(gold,x,3.5,-6.5,.2,6.2,.2);
  for(let i=0;i<24;i++){const x=-7+(i*2.31)%14,y=1+(i*.71)%4.8;ball(material(i%3?'#94c2c7':'#d7a44b',.15,.4),x,y,-6.36,.16,[1.8,.65,.5]);}
  for(let i=0;i<16;i++){const x=-7+i*.9;add(new THREE.DodecahedronGeometry(.32,0).scale(1,.55,.8).rotateY(i).translate(x,.22,-5.8),material(i%2?'#8f8580':'#698d85'));}for(const x of [-2,0,2])cyl(cream,x,1.1,-5.7,.18,1.8);box(cream,0,2.1,-5.7,4.6,.2,.4);sofa(-5,2);sofa(5,2);
 }else if(spec.theme==='harbor'){
  windows();box(wood,0,.65,-1,10,1.2,6);box(water,0,1.27,-1,9.8,.04,5.8);
  const curve=new THREE.EllipseCurve(0,-1,4.4,2.5,0,Math.PI,false);const ps=curve.getPoints(48).map(p=>new THREE.Vector3(p.x,1.4,p.y));add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ps),48,.12,6,false),cream);
  for(let i=0;i<6;i++){const x=-3.5+i*1.4,z=-1+Math.sin(i)*.6;box(white,x,1.48,z,.9,.28,.38);box(cream,x,1.73,z,.65,.22,.26);box(blue,x,1.83,z,.45,.12,.22);}sofa(-6,4);sofa(6,4);obstacles.push({x:0,z:-1,w:10,d:6});
 }else if(spec.theme==='sphere'){
  const screen=material('#102e5e',0,.9,.5);animated.push(installExhibitLight(screen,'screen'));const g=new THREE.PlaneGeometry(16,6.2,48,20),pos=g.attributes.position;
  const screenZ=(x,y)=>-6.7+.027*x*x+.025*(y-3.8)**2;
  for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i)+3.8;pos.setXYZ(i,x,y,screenZ(x,y));}g.computeVertexNormals();add(g,screen);screen.side=THREE.DoubleSide;
  for(let i=0;i<160;i++){const x=-7.8+(i*2.317)%15.6,y=.8+(i*.719)%5.9;add(new THREE.SphereGeometry(.018+(i%4)*.007,6,4).translate(x,y,screenZ(x,y)+.05),i%5?light:blue);}
  const halo=[];for(let i=0;i<=64;i++){const a=i*Math.PI/32,x=Math.cos(a)*2.6,y=3.8+Math.sin(a)*1.6;halo.push(new THREE.Vector3(x,y,screenZ(x,y)+.06));}add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(halo),64,.025,5,false),blue);
  red.roughness=.86;installSurfaceFinish(red,'fabric');
  for(let row=0;row<4;row++){box(dark,0,.25+row*.22,-1+row*1.65,14,.45+row*.44,1.5);for(let x=-6;x<=6;x+=1.2){craft.soft(red,x,.7+row*.44,-1+row*1.65,.85,.35,.8);craft.soft(red,x,1.1+row*.44,-.6+row*1.65,.85,.7,.18);}}
  cyl(material('#7751b5',.2,.3,.4),0,.15,-4,2,.25);points=[{label:spec.details[0],p:[0,3.2,5.7],q:[0,4,-5]},{label:spec.details[1],p:[7,4.2,5.7],q:[0,1.2,2]},{label:spec.details[2],p:[4.3,3,0],q:[0,.6,-4]}];
 }else if(spec.theme==='luxor'){
  for(const x of [-6,6])for(const z of [-4,0,4]){cyl(cream,x,2.6,z,.4,5.2,8);box(gold,x,5.3,z,1.1,.3,1.1);}
  box(wood,0,.3,0,5,.6,5);add(new THREE.ConeGeometry(3,3.6,4).rotateY(Math.PI/4).translate(0,2.4,0),gold);
  for(const z of [-4,0,4])for(const x of [-8,8])add(chamferedBox(.18,11.3,.18,.02).rotateZ(x>0?Math.PI/4:-Math.PI/4).translate(x/2,4.1,z),gold);obstacles.push({x:0,z:0,w:5,d:5});
 }else if(spec.theme==='balloon'){
  windows();for(let i=0;i<8;i++)add(new THREE.TorusGeometry(6.5,.07,6,48).rotateY(i*Math.PI/8).translate(0,4,0),gold);
  cyl(blue,0,.45,0,2,.9);
  const rod=(a,b,r=.035)=>{const v=new THREE.Vector3(...b).sub(new THREE.Vector3(...a)),g=new THREE.CylinderGeometry(r,r,v.length(),6);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),v.clone().normalize()));g.translate(...a.map((n,i)=>(n+b[i])/2));add(g,gold);};
  for(const sx of [-1,1])for(const sz of [-1,1]){rod([sx*.9,.9,sz*.9],[sx*.12,4.2,sz*.12]);for(let k=0;k<5;k++){const y=1+k*.55,r=.9-(y-.9)*.235,nr=r-.13;rod([sx*r,y,sz*r],[-sx*nr,y+.55,sz*nr],.018);}}
  for(const y of [1.8,2.8])box(gold,0,y,0,2*(.9-(y-.9)*.235),.09,2*(.9-(y-.9)*.235));cyl(gold,0,4.4,0,.025,.6,8);sofa(-5,3);sofa(5,3);obstacles.push({x:0,z:0,w:4,d:4});
 }
 const detail=refineInterior(spec,craft);
 // Enclosed rooms receive cooler sky fill, warm lamps and material reflections.
 scene.add(new THREE.HemisphereLight(night?'#9bb9d6':'#e7efff','#b2a28b',night?.65:1.05));
 const sun=new THREE.DirectionalLight('#fff0d5',night?.7:2.4);sun.position.set(-8,14,10);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-15,right:15,top:15,bottom:-15,near:.5,far:50});sun.shadow.normalBias=.015;sun.shadow.bias=-.00008;sun.shadow.radius=3;scene.add(sun);
 for(const x of [-4,4]){const l=new THREE.PointLight(night?'#9bd3ff':'#ffe0aa',65,22,2);l.position.set(x,5,1);scene.add(l);}
 let triangles=0;
 for(const [collection,isCeiling] of [[batches,false],[roofBatches,true]])for(const [m,parts] of collection){
  if(!parts.length)continue;const g=mergeGeometries(parts);parts.forEach(p=>p.dispose());if(!g)throw new Error('Incompatible interior geometry');
  const mesh=new THREE.Mesh(g,m);mesh.castShadow=!m.emissive.getHex();mesh.receiveShadow=true;mesh.name=isCeiling?'Interior ceiling and upper enclosure':'Crafted interior surfaces';
  if(isCeiling){mesh.visible=false;ceilings.push(mesh);}root.add(mesh);triangles+=g.attributes.position.count/3;
 }
 const overview={p:[17,13,20],q:[0,2,0]},entry=spec.theme==='sphere'?{p:[0,3.6,6.2],q:[0,3.2,-5.5]}:{p:[0,2.1,6],q:[0,2.3,-3]};
 let disposed=false;
 return {scene,root,points,overview,entry,obstacles,stats:{triangles,drawCalls:root.children.length,crafted:detail.crafted,reflectingPools:pools.length,ceilingMeshes:ceilings.length},setInteriorView(on){ceilings.forEach(o=>o.visible=on);},update(t){for(const a of animated)a(t);pools.forEach(p=>p.update(t));},dispose(){if(disposed)return;disposed=true;root.traverse(o=>o.geometry?.dispose());pools.forEach(p=>p.dispose());materials.forEach(m=>m.dispose());sun.shadow.map?.dispose();scene.clear();}};
}

export function interiorOverviewShot(room,aspect){
 const target=new THREE.Vector3().fromArray(room.overview.q),direction=new THREE.Vector3().fromArray(room.overview.p).sub(target).normalize();
 const right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),direction).normalize(),up=new THREE.Vector3().crossVectors(direction,right);
 const bounds=new THREE.Box3().setFromObject(room.root),tanY=Math.tan(THREE.MathUtils.degToRad(24)),tanX=tanY*Math.max(.2,aspect);let distance=0;
 for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){const v=new THREE.Vector3(x,y,z).sub(target);distance=Math.max(distance,v.dot(direction)+Math.abs(v.dot(right))*1.12/tanX,v.dot(direction)+Math.abs(v.dot(up))*1.12/tanY);}
 return {p:target.clone().addScaledVector(direction,distance).toArray(),q:target.toArray()};
}
