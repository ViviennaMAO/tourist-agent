import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {prayerArchPoints} from './mosque-prayer-hall.js';
import {installSurfaceFinish} from './surface-finish.js';
import {installInteriorMarble,installInteriorRug} from './interior-surfaces.js';

// Shared fabrication vocabulary: every detail is actual geometry, batched by finish.
export function createInteriorCraft(c){
 const {add,box,cyl,ball,material}=c;
 const ring=(m,x,y,z,r,t=.02,rx=Math.PI/2)=>add(new THREE.TorusGeometry(r,t,5,32).rotateX(rx).translate(x,y,z),m);
 const marble=material('#ddd7ca',.08,.3),bronze=material('#92734b',.72,.27),plaster=material('#e6e0d4',0,.8),ink=material('#243a3c',.1,.6),timber=material('#594537',0,.6),fabric=material('#a99a7f',0,.94),velvet=material('#36564f',0,.94),glow=material('#ffe4b7',0,.25,1.8),crystal=material('#e5e9de',.2,.12);
 installInteriorMarble(marble);installSurfaceFinish(fabric,'fabric');installSurfaceFinish(velvet,'fabric');installSurfaceFinish(timber,'wood');
 const soft=(m,x,y,z,w,h,d,angle=0,r=.08)=>add(new RoundedBoxGeometry(w,h,d,1,Math.min(r,w/3,h/3,d/3)).rotateY(angle).translate(x,y,z),m);
 const rod=(m,a,b,r=.018)=>{const v=new THREE.Vector3(...b).sub(new THREE.Vector3(...a)),g=new THREE.CylinderGeometry(r,r,v.length(),6);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),v.clone().normalize()));g.translate(...a.map((n,i)=>(n+b[i])/2));add(g,m);};
 const path=(m,ps,r=.015)=>add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ps.map(p=>new THREE.Vector3(...p))),Math.min(64,Math.max(16,ps.length)),r,4,false),m);
 const mould=(x,y,z,r,h,m=bronze)=>path(m,prayerArchPoints(r,h).map(p=>[x+p.x,y+p.y,z]),.023);
 const rosette=(x,y,z,r=.25,m=bronze,flat=false)=>{
  const ps=[];for(let i=0;i<=48;i++){const a=i*Math.PI/24,rr=r*(.83+.17*Math.cos(a*8));ps.push(flat?[x+Math.cos(a)*rr,y,z+Math.sin(a)*rr]:[x+Math.cos(a)*rr,y+Math.sin(a)*rr,z]);}path(m,ps,.014);
  if(flat)ring(m,x,y,z,r*.26,.014);else ring(m,x,y,z,r*.26,.014,0);
 };
 const vase=(x,y,z,s=.4,flowers=false)=>{
  const profile=[[.22,0],[.25,.08],[.38,.28],[.36,.53],[.19,.75],[.17,.88],[.22,.91]].map(([r,h])=>new THREE.Vector2(r*s,h*s));
  add(new THREE.LatheGeometry(profile,18).translate(x,y,z),marble);ring(bronze,x,y+.87*s,z,.18*s,.01);
  if(flowers)for(let i=0;i<7;i++){const a=i*2.4,xx=x+Math.cos(a)*s*.25,zz=z+Math.sin(a)*s*.25,yy=y+s*(1.2+(i%3)*.13);rod(velvet,[x,y+.6*s,z],[xx,yy,zz],.008);for(let k=0;k<5;k++){const aa=k*Math.PI*.4;add(new THREE.SphereGeometry(.055*s,6,4).scale(1,.35,1).translate(xx+Math.cos(aa)*.07*s,yy,zz+Math.sin(aa)*.07*s),plaster);}}
 };
 const table=(x,z,r=.62,y=.65)=>{
  cyl(bronze,x,y/2,z,.07,y,12);cyl(ink,x,.08,z,r*.5,.1,20);cyl(marble,x,y,z,r,.08,32);
  cyl(bronze,x+.2,y+.055,z,.16,.025,16);cyl(plaster,x+.2,y+.14,z,.075,.16,16);ring(bronze,x+.28,y+.15,z,.045,.012,0);vase(x-.2,y+.04,z,.28,true);
 };
 const sofa=(x,z,angle=0)=>{
  const at=(xx,yy,zz)=>[x+xx*Math.cos(angle)+zz*Math.sin(angle),yy,z-xx*Math.sin(angle)+zz*Math.cos(angle)];
  const b=(m,xx,yy,zz,w,h,d,r=.06)=>soft(m,...at(xx,yy,zz),w,h,d,angle,r);
  for(const xx of [-.92,.92])for(const zz of [-.32,.32])box(bronze,...at(xx,.15,zz),.055,.25,.055,angle);
  b(timber,0,.33,0,2.25,.2,.97);for(const xx of [-.55,.55]){b(fabric,xx,.56,.04,1.04,.28,.83,.11);b(fabric,xx,.98,-.36,1.04,.65,.25,.12);b(velvet,xx,1.02,-.17,.38,.37,.13,.1);}
  for(const xx of [-1.08,1.08]){b(timber,xx,.67,0,.12,.62,.92);b(fabric,xx,.97,0,.17,.12,.96);}
  for(const xx of [-.55,.55])for(const dz of [-.29,.34])rod(bronze,at(xx-.48,.704,dz),at(xx+.48,.704,dz),.007);
  table(...[at(0,0,1.4)[0],at(0,0,1.4)[2]],.51,.58);
 };
 const chandelier=(x,z,y=5.5)=>{
  cyl(bronze,x,(y+7.06)/2,z,.025,Math.max(.1,7.06-y),10);cyl(bronze,x,7.04,z,.22,.09,20);
  for(const [r,dy,n] of [[1.05,0,20],[.72,-.38,16],[.34,-.74,10]]){
   ring(bronze,x,y+dy,z,r,.035);ring(bronze,x,y+dy+.12,z,r*.98,.02);
   for(let k=0;k<n;k++){const a=k*Math.PI*2/n,xx=x+Math.cos(a)*r,zz=z+Math.sin(a)*r;rod(bronze,[x,y+.3,z],[xx,y+dy+.04,zz],.012);
    add(new THREE.OctahedronGeometry(.075,0).scale(.7,2.8,.7).translate(xx,y+dy-.16,zz),crystal);add(new THREE.SphereGeometry(.035,8,6).translate(xx,y+dy+.04,zz),glow);
   }
  }ball(crystal,x,y-.96,z,.11,[1,1.6,1]);
 };
 const frame=(x,y,z,w,h)=>{box(timber,x,y,z,w+.14,h+.14,.1);box(marble,x,y,z+.06,w,h,.1);for(const xx of [-1,1])box(bronze,x+xx*(w/2+.025),y,z+.13,.025,h+.06,.02);for(const yy of [-1,1])box(bronze,x,y+yy*(h/2+.025),z+.13,w+.08,.025,.02);};
 const sconce=(x,y,z)=>{box(bronze,x,y,z,.14,.55,.09);rod(bronze,[x,y-.12,z],[x,y-.12,z+.22],.026);cyl(glow,x,y+.12,z+.22,.09,.4,12);ring(bronze,x,y+.33,z+.22,.1,.018);};
 return {...c,ring,marble,bronze,plaster,ink,timber,fabric,velvet,glow,crystal,soft,rod,path,mould,rosette,vase,table,sofa,chandelier,frame,sconce};
}

export function refineInterior(spec,k){
 const {add,addRoof,box,cyl,ball,ring,material,marble,bronze,plaster,ink,timber,fabric,velvet,glow,soft,rod,path,mould,rosette,vase,table,frame,sconce}=k;
 const theme=spec.theme,night=['sphere','future','aquarium'].includes(theme),ornate=['mosque','palace','sail','resort','luxor'].includes(theme);
 const roofBox=(m,x,y,z,w,h,d)=>addRoof(new THREE.BoxGeometry(w,h,d).translate(x,y,z),m);
 const roofM=night?ink:plaster;
 // The upper enclosure is revealed only at interior camera heights.
 for(const x of [-9,9])roofBox(roofM,x,5.65,0,.2,2.9,14);
 if(theme==='palace'){
  roofBox(plaster,-6.55,7.15,0,4.9,.25,14);roofBox(plaster,6.55,7.15,0,4.9,.25,14);
  roofBox(plaster,0,7.15,-6,8.2,.25,2);roofBox(plaster,0,7.15,5.1,8.2,.25,3.8);
 }else roofBox(roofM,0,theme==='future'?9.15:7.15,0,18,.25,14);
 if(theme==='future'){for(const x of [-9,9])roofBox(ink,x,8.1,0,.2,2,14);roofBox(ink,0,8.1,-7,18,2,.2);}
 for(const x of [-8.8,8.8])for(const [y,w] of [[.22,.18],[.53,.12],[4.05,.18]])box(night?ink:ornate?marble:timber,x,y,0,w,.09,13.8);
 for(const [y,h,d] of [[.2,.28,.16],[.48,.07,.2],[6.55,.13,.25],[6.72,.18,.35],[6.9,.07,.45]])box(night?ink:ornate?marble:timber,0,y,-6.8,17.8,h,d);
 // Rectangular marble slabs replace the old evenly spaced stripe floor.
 if(theme!=='mosque')box(night?ink:marble,0,.06,0,17.7,.035,13.7);
 if(!['palace','balloon','sphere','future'].includes(theme)){
  for(const x of [-6,0,6])for(const z of [-4,1,5]){
   roofBox(timber,x,6.97,z,4.9,.12,3.2);roofBox(roofM,x,6.88,z,4.7,.08,3);
   for(const dx of [-2.2,2.2])roofBox(bronze,x+dx,6.82,z,.025,.03,2.8);
   roofBox(glow,x,6.81,z-.98,2.1,.025,.035);
  }
 }
 if(theme==='mosque'){
  for(const x of [-5,5])for(const z of [-4,0,4]){
   for(const [y,r] of [[.47,.26],[3.92,.23],[4.08,.29]])ring(bronze,x,y,z,r,.022);
   for(let j=0;j<8;j++){const a=j*Math.PI/4;add(new THREE.SphereGeometry(.07,8,5).scale(.6,2.3,.35).rotateY(-a).translate(x+Math.cos(a)*.24,3.96,z+Math.sin(a)*.24),bronze);}
  }
  // Recessed gold-lined mihrab, layered moulding and inset floral stone panels.
  mould(0,.1,-6.4,1.02,4.42,marble);mould(0,.1,-6.36,1.1,4.53);mould(0,.1,-6.33,1.19,4.66,marble);
  const niche=new THREE.PlaneGeometry(1,1,20,28),np=niche.attributes.position;
  for(let i=0;i<np.count;i++){const u=np.getX(i)*2,y=(np.getY(i)+.5)*4.23+.12,w=.91*(1-Math.pow(Math.max(0,(y-2.35)/2),1.5));np.setXYZ(i,u*w,y,-6.75+.38*u*u);}niche.computeVertexNormals();add(niche,bronze);
  for(const x of [-.56,.56])box(marble,x,1.32,-6.48,.025,2.4,.024);
  for(const x of [-7,-3,3,7]){
   frame(x,2.9,-6.55,1.45,3.9);box(plaster,x,2.9,-6.38,1.27,3.7,.08);mould(x,1.05,-6.29,.52,3.3,marble);
   for(const y of [1.6,2.4,3.2]){rosette(x,y,-6.27,.2);path(velvet,[[x,1.25,-6.26],[x-.2,1.9,-6.26],[x+.17,2.8,-6.26],[x,3.8,-6.26]],.012);}
  }
  for(const x of [-8,-1.9,1.9,8])sconce(x,4.8,-6.45);
  for(const z of [-4,4])for(const x of [-3,-1,1,3])rosette(x,5.85,z+.26,.13,bronze);
  // Wall-mounted timber shelving and open book stands at the side aisles.
  for(const x of [-7.4,7.4]){
   box(timber,x,.76,-4.9,1.8,1.45,.4);for(const y of [.22,.72,1.2])box(bronze,x,y,-4.65,1.76,.025,.04);
   for(let i=0;i<10;i++)box(i%2?velvet:bronze,x-.75+i*.16,.95,-4.62,.09,.38,.12);
   const g=new THREE.BoxGeometry(.75,.045,.48).rotateZ(.65).translate(x,.47,1.8);add(g,timber);add(new THREE.BoxGeometry(.75,.045,.48).rotateZ(-.65).translate(x,.47,1.8),timber);
   add(new THREE.BoxGeometry(.32,.035,.42).rotateZ(-.22).translate(x-.14,.76,1.8),plaster);add(new THREE.BoxGeometry(.32,.035,.42).rotateZ(.22).translate(x+.14,.76,1.8),plaster);
  }
 }else if(theme==='palace'||theme==='sail'||theme==='resort'){
  for(const x of [-7.9,-4,4,7.9]){frame(x,3.4,-6.55,1.6,4.7);box(timber,x,3.4,-6.37,1.42,4.5,.08);mould(x,1.15,-6.25,.55,3.9,marble);for(let y=1.6;y<5.2;y+=.9)rosette(x,y,-6.22,.17);}
  for(const x of [-6,6])for(const z of [-4,4]){vase(x,.1,z,.8,true);}
  for(const x of [-2.4,2.4])for(const z of [-2.75,.75])cyl(bronze,x,.36,z,.07,.5,12);
  for(const x of [-6,6]){const rug=material('#8a6e55',0,x<0?.971:.972);installInteriorRug(rug,1.65,2.2,{centerX:x});box(rug,x,.1,0,3.3,.025,4.4);}
  for(const x of [-5.8,-2,2,5.8])sconce(x,4.3,-6.45);
  if(theme==='palace'){
   for(let i=0;i<24;i++){const a=i*Math.PI/12,x=Math.cos(a)*3.76,z=-1+Math.sin(a)*3.76;ball(bronze,x,6.46,z,.05);}
   // Reception desk, inset front panels, small lamps and ceramic arrangements.
   soft(timber,0,.74,-5.7,3.8,1.32,.8,0,.07);box(marble,0,1.44,-5.7,4,.1,.98);
   for(const x of [-1.35,-.45,.45,1.35]){box(bronze,x,.78,-5.26,.7,.97,.035);box(plaster,x,.78,-5.23,.63,.9,.025);rosette(x,.8,-5.2,.17);}
   vase(1.3,1.49,-5.7,.5,true);box(ink,-.6,1.65,-5.7,.6,.32,.08);
   frame(0,3.9,-6.55,3.5,4.25);box(ink,0,3.9,-6.37,3.25,4,.04);mould(0,1.95,-6.26,1.42,3.8,marble);
   for(let y=2.2;y<5.7;y+=.43)for(let x=-1.2;x<=1.21;x+=.4){if(y>4.2&&Math.abs(x)>1.4-(y-4.2)*.7)continue;for(const [dx,dy,ex,ey] of [[0,.2,.18,0],[.18,0,0,-.2],[0,-.2,-.18,0],[-.18,0,0,.2]])rod(bronze,[x+dx,y+dy,-6.24],[x+ex,y+ey,-6.24],.014);}
   for(const x of [-3.9,3.9])for(const z of [-4.9,2.9]){for(const y of [.45,5.72,5.89])ring(bronze,x,y,z,.25,.019);}

   // Inlaid perimeter and central marble medallion around the reflecting pool.
   for(const x of [-3.1,3.1])box(bronze,x,.09,-1,.035,.018,5.6);for(const z of [-3.8,1.8])box(bronze,0,.09,z,6.2,.018,.035);
   for(const x of [-3,3])for(const z of [-3.7,1.7])rosette(x,.1,z,.23,bronze,true);
  }
 }else if(['etihad','burj','strat'].includes(theme)){
  // A modelled distant skyline behind a blue horizon relief, in the window recess.
  for(let i=0;i<20;i++){const x=-7.7+i*.8,h=.35+(i*7%13)*.12;box(i%2?ink:bronze,x,2.3+h/2,-6.55,.22,h,.08);}
  for(const z of [-2.2,-.4,1.4]){soft(velvet,5.9,.6,z,.52,.16,.52);for(const dx of [-.18,.18])rod(bronze,[5.9+dx,.1,z],[5.9+dx,.52,z],.025);}
  box(marble,6,1.59,-1,2.22,.1,3.5);for(const z of [-2.3,-1,.3]){vase(6,1.65,z,.28);cyl(plaster,6.5,1.73,z,.075,.16,16);}
  // Full-height slat feature walls and inset display cases flank the lounge.
  for(const x of [-8.6,8.6])for(let z=-5;z<5;z+=.27)box(timber,x,2.4,z,.11,4.6,.07);
  for(const x of [-4,4]){frame(x,4.7,-6.42,1.5,.6);}
  for(const x of [-6,0,6]){cyl(bronze,x,6.5,2.8,.015,1.05,8);cyl(glow,x,5.95,2.8,.28,.12,20);}
  if(theme==='etihad')for(let i=0;i<5;i++){const h=1.5+i*.23,center=1.9+i*.115,tilt=(i-2)*.045;
   for(let y=-h/2+.15;y<h/2;y+=.17)add(new THREE.TorusGeometry(.23-.06*(y/h+.5)+.004,.006,4,16).rotateX(Math.PI/2).translate(0,y,0).rotateZ(tilt).translate(-1.2+i*.6,center,-1),bronze);
  }
  // Roads, a curved coastline and planted squares make the city model legible.
  for(const z of [-2.75,.65])box(marble,0,.98,z,6.7,.025,.13);
  for(const x of [-2.7,-.55,1.6])box(marble,x,.98,-1,.11,.025,3.3);
  for(let i=0;i<14;i++){const x=-3.1+i*.46;cyl(velvet,x,1.05,.5,.075,.13,6);}

 }else if(theme==='racing'){
  // Dark rubber exhibition flooring, pit wall tool cabinets and inspection lights.
  box(ink,0,.09,0,16.6,.03,12.7);for(const x of [-5,0,5])box(bronze,x,.11,0,.018,.012,12.3);
  box(timber,0,.73,-5.95,11,1.4,1);box(marble,0,1.46,-5.95,11.2,.1,1.15);
  for(let x=-4.8;x<=5;x+=1.2)for(const y of [.35,.7,1.05]){box(ink,x,y,-5.4,1.1,.27,.06);box(bronze,x,y+.04,-5.35,.43,.025,.025);}
  for(const x of [-3,0,3]){frame(x,3.3,-6.35,2.3,1.4);box(ink,x,3.3,-6.17,2.15,1.25,.03);for(let j=0;j<5;j++)box(glow,x-.85+j*.4,3.02+Math.sin(j+x)*.2,-6.14,.23,.025,.01);}
  for(const x of [-7,0,7]){rod(bronze,[x,6.8,-6],[x,6.8,6],.04);for(const z of [-3,1,4]){cyl(ink,x,6.6,z,.16,.28,12);cyl(glow,x,6.43,z,.13,.04,12);}}
  for(const [x,z,s] of [[-3,1,1.2],[3,-3,.9]]){
   for(const dx of [-.95,.98])for(const dz of [-.78,.78]){ring(bronze,x+dx*s,.34*s,z+dz*s,.23*s,.014,0);for(let k=0;k<5;k++){const a=k*Math.PI*.4;rod(bronze,[x+dx*s,.34*s,z+dz*s],[x+(dx+Math.cos(a)*.16)*s,(.34+Math.sin(a)*.16)*s,z+dz*s],.012);}}
   for(const side of [-1,1])box(ink,x+1.1*s,.55*s,z+side*.43*s,.45*s,.025,.08*s);
   box(bronze,x+.85*s,.67*s,z,.55*s,.015,.018);box(plaster,x-.15*s,1.051*s,z,.08,.012,.66*s);
  }
  // Track model gets a landscape, pit buildings, barriers and miniature cars.
  box(velvet,4,1.52,3,3.78,.03,2.28);for(let i=0;i<20;i++){const a=i*Math.PI/10;box(i%2?plaster:bronze,4+Math.cos(a)*1.56,1.62,3+Math.sin(a)*.94,.13,.06,.08,-a);}
  for(let i=0;i<5;i++){box(plaster,3.1+i*.4,1.68,3.1,.28,.26,.38);box(ink,3.1+i*.4,1.83,3.1,.29,.04,.4);}
 }else if(theme==='courtyard'){
  // Galleries of architectural models: doors, colonnades, layered roofs and steps.
  for(const x of [-5,0,5]){
   for(const y of [.1,.22,.34])box(marble,x,y,-2.35,3.2-y,.12,.7);
   box(timber,x,1.45,-2.81,.6,1.3,.08);box(bronze,x,2.14,-2.72,.66,.07,.12);
   for(const dx of [-1.13,1.13])for(const dz of [-.9,.9])cyl(bronze,x+dx,1.75,-4+dz,.035,1.8,8);
   for(const dx of [-.9,-.45,.45,.9]){box(ink,x+dx,1.9,-2.79,.19,.65,.06);box(marble,x+dx,1.57,-2.72,.25,.07,.15);}
   for(const yy of [2.52,2.62])box(marble,x,yy,-4,2.87,.08,2.5);
   soft(timber,x,.8,-1.75,.6,.08,.42,0,.02);rod(bronze,[x,.1,-1.75],[x,.77,-1.75],.025);
  }
  for(const x of [-7,7]){box(marble,x,.26,-1,1.3,.45,5.5);box(timber,x,.5,-1,1.15,.025,5.3);for(let i=0;i<15;i++){const z=-3.4+i*.34;for(let j=0;j<3;j++){const a=i*2.4+j*2;add(new THREE.SphereGeometry(.2,6,4).scale(.35,1,.22).rotateZ(Math.sin(a)*.5).translate(x+Math.cos(a)*.35,.67+(i%3)*.07,z),velvet);}}}
  for(const z of [-2,1,4])for(const x of [-8.8,8.8])box(glow,x,1.3,z,.05,.35,.25);
 }
 // Other city rooms share the same fabricated furniture/material pass, plus exhibits.
 if(theme==='aquarium'){
  for(let i=0;i<24;i++){const x=-7+(i*2.31)%14,y=1+(i*.71)%4.8;add(new THREE.SphereGeometry(.017,6,4).translate(x+.2,y+.025,-6.27),ink);add(new THREE.ConeGeometry(.09,.16,3).scale(1,1,.25).translate(x,y+.12,-6.32),bronze);}
  for(let i=0;i<18;i++){const x=-7+i*.8;rod(velvet,[x,.2,-5.9],[x+.16,.8+(i%4)*.2,-5.85],.025);for(let j=0;j<5;j++){rod(velvet,[x,.35+j*.13,-5.9],[x+(j%2?-.2:.2),.55+j*.14,-5.8],.018);add(new THREE.OctahedronGeometry(.09,0).scale(1,.55,.7).translate(x+(j%2?-.2:.2),.55+j*.14,-5.8),i%2?bronze:plaster);}}
  for(let i=0;i<24;i++){const x=-7+(i*2.31)%14,y=1+(i*.71)%4.8;add(new THREE.ConeGeometry(.1,.2,3).rotateZ(Math.PI/2).scale(1,1,.3).translate(x-.34,y,-6.32),bronze);}
 }else if(theme==='future'){
  for(const x of [-5.5,5.5]){for(const y of [1,2,3])ring(bronze,x,y,1,.74,.028);for(let k=0;k<6;k++){const a=k*Math.PI/3;rod(bronze,[x+Math.cos(a)*.74,1,1+Math.sin(a)*.74],[x+Math.cos(a)*.74,3,1+Math.sin(a)*.74],.018);}}
  for(const x of [-4,4]){soft(ink,x,.65,4,1.2,1.2,.7);box(glow,x,1.27,4,.98,.025,.53);}
 }else if(theme==='sphere'){
  for(let row=0;row<4;row++)for(let x=-6;x<=6;x+=1.2)for(const dx of [-.47,.47])box(bronze,x+dx,1+row*.44,-.9+row*1.65,.045,.11,.6);
  for(let row=0;row<4;row++)for(const x of [-7.3,7.3])box(glow,x,.48+row*.44,-1+row*1.65,.12,.025,1.3);
  for(const x of [-8,8]){box(ink,x,3,-5,.55,3.4,.7);for(let y=1.7;y<4.4;y+=.55)ring(bronze,x,y,-4.63,.17,.015,0);}
 }else if(theme==='luxor'){
  for(const x of [-6,6])for(const z of [-4,0,4]){for(const y of [.24,.45,4.85])ring(bronze,x,y,z,.43,.028);for(let y=1;y<4.5;y+=.5)for(let i=0;i<4;i++)box(bronze,x-.2+i*.13,y,z+.405,.06,.18,.025);}
 }else if(theme==='harbor'){
  for(let i=0;i<6;i++){const x=-3.5+i*1.4,z=-1+Math.sin(i)*.6;for(const dx of [-.24,-.08,.08,.24])box(ink,x+dx,1.73,z+.14,.075,.07,.012);rod(bronze,[x,1.85,z],[x,2.15,z],.012);}
  for(const x of [-6,6])vase(x,.1,-3,.7,true);
 }else if(theme==='balloon'){
  for(let i=0;i<32;i++){const a=i*Math.PI/16,x=Math.cos(a)*5.8,z=Math.sin(a)*5.8;cyl(bronze,x,.65,z,.025,1.3,8);}ring(bronze,0,1.28,0,5.8,.035);ring(bronze,0,.15,0,5.8,.035);
 }
 return {ceiling:true,crafted:true};
}
