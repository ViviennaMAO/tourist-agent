import * as THREE from 'three';
import {installSurfaceFinish} from './surface-finish.js';
import {createCurvedLeaf} from './curved-leaf.js';

/** Room-specific fit-out. Small fittings use simple profiles rather than spending
 * the triangle budget on bevels; larger furniture uses the shared rounded craft. */
export function furnishInteriorTheme(spec,k){
 const {add,addRoof,box,cyl,ring,soft,rod,path,material,marble,bronze,plaster,ink,timber,velvet,glow,vase,table,sconce}=k;
 const {theme}=spec,labels=[],features=[];
 const capture=()=>({geometry:k.captureStart(),labelIndex:labels.length});
 const transform=(start,matrix)=>{k.transformSince(start.geometry,matrix);for(let i=start.labelIndex;i<labels.length;i++)labels[i].matrix=matrix.clone();};
 const blue=material('#244f70',.2,.48),clay=material('#aa795a',0,.83),jade=material('#467e70',.05,.69);
 installSurfaceFinish(clay,'limestone');
 const block=(m,x,y,z,w,h,d,a=0)=>add(new THREE.BoxGeometry(w,h,d).rotateY(a).translate(x,y,z),m);
 const disk=(m,x,y,z,r,h=.05,n=24)=>cyl(m,x,y,z,r,h,n);
 const arc=(m,x,y,z,r,start,end,t=.018)=>{const ps=[];for(let i=0;i<=32;i++){const a=start+(end-start)*i/32;ps.push([x+r*Math.cos(a),y,z+r*Math.sin(a)]);}path(m,ps,t);};
 const plaque=(text,x,y,z,w=1.1,h=.25,a=0)=>{block(bronze,x,y,z,w+.05,h+.05,.045,a);labels.push({text,x,y,z:z+.03,w,h,a});};
 const panel=(x,y,z,w,h,m=ink)=>{box(timber,x,y,z,w+.14,h+.14,.15);block(m,x,y,z+.09,w,h,.055);for(const dx of [-w/2,w/2])block(bronze,x+dx,y,z+.13,.018,h,.02);};
 const relief=(x,z,w=1.5,h=2.7)=>{panel(x,3.3,z,w,h,blue);for(let i=0;i<9;i++){const xx=x-w*.4+i*w*.1,hh=.3+(i*7%9)*h*.065;block(bronze,xx,2.35+hh/2,z+.14,w*.065,hh,.06);}plaque('CITY / STUDY',x,1.72,z+.13,w,.18);};
 const pedestal=(x,z,w=1,d=1,h=1)=>{soft(ink,x,h/2,z,w,h,d,0,.06);box(marble,x,h+.03,z,w+.08,.08,d+.08);block(glow,x,.14,z+d/2+.01,w*.8,.018,.015);};
 const bollard=(x,z,y=0)=>{disk(ink,x,y+.035,z,.13,.06,12);cyl(bronze,x,y+.49,z,.022,.9,8);disk(bronze,x,y+.94,z,.055,.035,10);};
 const bench=(x,z,a=0)=>{soft(timber,x,.33,z,2.5,.22,.7,a);soft(velvet,x,.5,z,2.4,.16,.66,a);for(const s of [-.9,.9])block(bronze,x+s*Math.cos(a),.17,z-s*Math.sin(a),.09,.32,.48,a);};
 const stool=(x,z,a=0)=>{soft(velvet,x,.88,z,.5,.18,.5,a);for(const dx of [-.18,.18])for(const dz of [-.18,.18])rod(bronze,[x+dx,.1,z+dz],[x+dx,.79,z+dz],.022);ring(bronze,x,.35,z,.23,.018);};
 const pendant=(x,z,y=4.5,r=.27)=>{rod(bronze,[x,6.75,z],[x,y+.18,z],.012);disk(bronze,x,y+.08,z,r,.16);disk(glow,x,y-.01,z,r*.85,.025);};
 const lowGarden=(x,z,w=1.2,d=2)=>{
  box(marble,x,.29,z,w,.5,d);block(timber,x,.55,z,w-.12,.035,d-.12);
  for(let i=0;i<18;i++){const xx=x+Math.sin(i*2.4)*(w*.37),zz=z+Math.cos(i*1.71)*(d*.38),y=.67+(i%4)*.06;
   rod(velvet,[xx,.55,zz],[xx,y+.18,zz],.012);
   for(let j=0;j<3;j++){const a=i*1.7+j*2.1;const m=j?velvet:jade;m.side=THREE.DoubleSide;add(createCurvedLeaf(THREE,.13+(i%3)*.03,.85).rotateZ(.7).rotateY(a).translate(xx,y,zz),m);}
   if(i%4===0)for(let j=0;j<5;j++){const a=j*Math.PI*.4;add(new THREE.SphereGeometry(.035,6,4).scale(1,.3,1).translate(xx+Math.cos(a)*.035,y+.19,zz+Math.sin(a)*.035),plaster);}
  }
 };
 const spotlight=(x,z)=>{rod(ink,[x,6.76,z],[x,6.4,z],.025);disk(ink,x,6.35,z,.12,.2,12);disk(glow,x,6.24,z,.09,.025,12);};
 const rail=(x,z,w,y=0)=>{for(let xx=-w/2;xx<=w/2+.01;xx+=.36)cyl(bronze,x+xx,y+.55,z,.014,1.1,6);block(bronze,x,y+1.1,z,w,.035,.035);block(bronze,x,y+.1,z,w,.025,.025);};
 const contour=(x,y,z,w,h)=>{for(let j=0;j<7;j++){const ps=[];for(let i=0;i<=20;i++)ps.push([x-w/2+i*w/20,y+(j-3)*h/9+Math.sin(i*.43+j*.7)*h*.12,z]);path(bronze,ps,.01);}};
 const ledge=(x,z,w,y=1.1)=>{box(timber,x,y/2,z,w,y,.75);box(marble,x,y+.04,z,w+.1,.1,.86);for(let xx=x-w/2+.15;xx<x+w/2;xx+=.22)block(bronze,xx,y/2,z+.385,.018,y-.2,.02);};
 const modelFacade=(x,y,z,w,h,d)=>{for(let yy=y-h/2+.15;yy<y+h/2;yy+=.2){block(bronze,x,yy,z+d/2+.006,w,.012,.012);block(bronze,x+w/2+.006,yy,z,.012,.012,d);}for(const dx of [-w*.3,0,w*.3])block(plaster,x+dx,y,z+d/2+.015,.015,h,.018);};
 // Dedicated wall display on each side, turned inward with a common transform.
 const sideDisplay=(side,z,title,kind='city')=>{
  const start=capture(); // only new geometry is rotated into the side wall
  panel(0,3.1,0,2.35,2.4,ink);
  if(kind==='map')contour(0,3.1,.14,2.1,1.8);
  else for(let i=0;i<9;i++){const h=.2+(i*5%9)*.15;block(i%3?bronze:jade,-.94+i*.235,2.3+h/2,.15,.12,h,.07);}
  plaque(title,0,1.68,.13,2.1,.23);sconce(0,4.7,.05);
  transform(start,new THREE.Matrix4().makeRotationY(side<0?Math.PI/2:-Math.PI/2).setPosition(side*8.3,0,z));
 };
 const labelAt=(text,x,y,z,w=1.2)=>plaque(text,x,y,z,w,.22);

 if(theme==='burj'){
  features.push('architecture-exhibits','stepped-tower-model','observation-optics');
  sideDisplay(-1,-2,'DUBAI / VERTICAL CITY');sideDisplay(1,-3,'SKYLINE / MATERIALS');
  for(const x of [-5.6,5.6]){pedestal(x,-1.2,1.15,.95,1);for(let i=0;i<5;i++){block(i%2?marble:bronze,x-.4+i*.2,1.32,-1.2,.12,.5,.38);}labelAt('FACADE / 01',x,1.1,-.7,1);}
  // Three setback wings give the central tower an architectural silhouette.
  for(let level=0;level<9;level++){const h=.29,y=1.12+level*.3,r=.25-level*.021;for(let j=0;j<3;j++){const a=j*Math.PI*2/3,rr=r*.9;block(blue,Math.cos(a)*rr,y,-1+Math.sin(a)*rr,r*.9,h,r*1.15,a);}}
  for(let i=0;i<18;i++){const xx=-3+(i%9)*.72,zz=-1.95+Math.floor(i/9)*1.7,h=.4+((i*7)%11)*.15;modelFacade(xx,1+h/2,zz,.36,h,.38);}
  rail(0,1.55,7.3);labelAt('DUBAI / CITY IN MINIATURE',0,1.2,1.59,3.5);
  for(const x of [-4.5,0,4.5]){disk(ink,x,.1,-4.8,.25,.1);cyl(bronze,x,.82,-4.8,.045,1.4,12);rod(ink,[x,1.5,-4.8],[x,1.7,-5.4],.1);for(const dx of [-.11,.11])rod(bronze,[x+dx,1.62,-5.12],[x+dx,1.76,-5.45],.065);}
  for(const x of [-3,3]){block(bronze,x,.1,4,.025,.025,3.5);pendant(x,3,4.7);}
  labelAt('AT THE TOP / DUBAI',0,6.35,-6.5,3.8);
 }else if(theme==='future'){
  features.push('ribbed-lab-bays','biodiversity-specimens','interactive-consoles');
  const cyan=material('#77c6c5',.15,.42,.55);
  for(const side of [-1,1]){
   sideDisplay(side,2,'LIFE / SYSTEMS','map');
   for(const z of [-4,-1,2,5]){block(ink,side*8.45,3.45,z,.28,6.6,.25);block(cyan,side*8.27,3.45,z,.025,5.8,.06);}
   for(const z of [-3.5,-1]){const x=side*6.3;pedestal(x,z,1.2,.95,.9);for(let i=0;i<3;i++){const y=1.15+i*.35;ring(bronze,x,y,z,.32-i*.07,.025);for(let j=0;j<5;j++){const a=j*Math.PI*.4+i*.7;rod(jade,[x,y-.15,z],[x+Math.cos(a)*(.3-i*.06),y+.2,z+Math.sin(a)*(.3-i*.06)],.018);}}labelAt('BIO / 0'+(z===-1?2:1),x,.72,z+.5,.8);}
   const x=side*4;for(let i=0;i<6;i++)block(cyan,x-.38+i*.15,1.29,4.12,.065,.012,.2);labelAt('EXPLORE / LIFE',x,.9,4.36,1);
   for(const y of [1.02,2.1,3.1])ring(cyan,side*5.5,y,1,.79,.012);
  }
  for(const r of [1.8,2.05])ring(bronze,0,.105,-1,r,.016);
  for(const x of [-2.8,2.8]){block(cyan,x,.11,3.8,.025,.012,4.3);}
  labelAt('FUTURE / LIVING SYSTEMS',0,6.65,-6.65,5);
 }else if(theme==='aquarium'){
  features.push('aquatic-portal','coral-and-anemones','specimen-gallery');
  // Set-back aquatic window with a thick shell, riveted reveals and viewing rail.
  for(const x of [-8.3,8.3]){box(marble,x,3.3,-5.9,.46,6.5,.9);block(bronze,x,3.3,-5.42,.05,6.2,.04);for(let y=.5;y<6.4;y+=.45)disk(bronze,x,y,-5.4,.04,.06,8);}
  box(marble,0,6.55,-5.9,17,.34,.9);box(ink,0,.29,-5.55,16.5,.42,1.5);
  block(glow,0,6.35,-5.48,16,.025,.025);rail(0,-3.8,15.5);labelAt('THE LOST CHAMBERS / MARINE STUDY',0,6,-5.4,5);
  for(const side of [-1,1]){sideDisplay(side,-1.5,'OCEAN / SPECIMENS','map');pedestal(side*6.4,-2,1.25,1.1,.85);vase(side*6.4,.9,-2,.9);ring(bronze,side*6.4,1.35,-2,.4,.025);}
  for(let i=0;i<11;i++){const x=-7+i*1.35,z=-5.1-(i%2)*.5;
   const m=i%3?clay:jade;for(let j=0;j<7;j++){const a=j*2.4,h=.32+((i+j)%4)*.17;const tip=[x+Math.cos(a)*.3,.5+h,z+Math.sin(a)*.2];path(m,[[x,.5,z],[x+Math.cos(a)*.16,.5+h*.6,z+Math.sin(a)*.12],tip],.022);for(const d of [-1,1]){const end=[tip[0]+Math.cos(a+d*.7)*.13,tip[1]+.16,tip[2]+Math.sin(a+d*.7)*.13];rod(m,tip,end,.012);add(new THREE.SphereGeometry(.024,6,4).translate(...end),plaster);}}
   for(let j=0;j<4;j++)add(new THREE.SphereGeometry(.14+j*.02,8,5).scale(1,.25,1).translate(x+.3,.55+j*.13,z+.15),i%2?bronze:clay);
  }
  // Layered ruins have block joints, capstones and a weathered stair base.
  for(const x of [-2,0,2]){for(const y of [.38,.65,1,1.35,1.7])ring(bronze,x,y,-5.7,.185,.012);disk(marble,x,2,-5.7,.31,.18);}
  for(let i=0;i<3;i++)box(marble,0,.12+i*.13,-5.1-i*.15,4.7-i*.25,.12,.6);
  for(const x of [-5,5]){block(blue,x,.1,2,3,.025,2.9);for(const dx of [-1.45,1.45])block(bronze,x+dx,.12,2,.02,.02,2.8);pendant(x,2,4.4,.4);}
 }else if(theme==='sail'){
  features.push('layered-balcony-doors','cascading-water-stair','blue-gold-reception');
  for(const y of [2,3.5,5]){
   for(let x=-7;x<=7;x+=.4)cyl(bronze,x,y+.33,-5.34,.014,.59,6);
   for(const x of [-5,-2.5,0,2.5,5]){block(blue,x,y+.72,-6.32,1.4,1.15,.12);block(bronze,x,y+.72,-6.24,.022,1.1,.03);block(glow,x,y+1.32,-6.22,1.4,.022,.025);}
   for(const x of [-6.5,6.5])for(const z of [-4,0,4])ring(bronze,x,y,z,.28,.024);
  }
  // A visible stepped cascade rises behind the existing reflecting basin.
  const aqua=material('#458f99',.2,.24);
  for(let i=0;i<5;i++){const z=-2.7-i*.4,y=.5+i*.25;box(marble,0,y/2,z,3.2-i*.3,y,.5);block(aqua,0,y+.035,z,2.9-i*.3,.035,.46);block(aqua,0,y-.07,z+.25,2.9-i*.3,.18,.018);}
  for(const x of [-4.7,4.7]){ledge(x,-3.2,2.3);for(const dx of [-.6,.6])vase(x+dx,1.2,-3.2,.4,true);labelAt(x<0?'CONCIERGE':'LOUNGE',x,.8,-2.78,1.5);}
  for(const side of [-1,1])sideDisplay(side,1,'SAIL / BLUE & GOLD','map');
  for(const x of [-6,6]){box(blue,x,.12,0,3.15,.035,4.25);for(const dx of [-1.5,1.5])block(bronze,x+dx,.145,0,.025,.015,4.15);}
  labelAt('BURJ AL ARAB / ATRIUM',0,6.65,-5.3,4);
 }else if(theme==='harbor'){
  features.push('radial-piers','cruise-deck-fittings','terminal-cafe');
  for(let i=0;i<6;i++){const x=-3.5+i*1.4,z=-1+Math.sin(i)*.6;const shore=-1+2.5*Math.sqrt(1-(x/4.4)**2),near=z+.19;block(timber,x,1.35,(shore+near)/2,.18,.08,shore-near+.15);for(let zz=near;zz<shore;zz+=.15)block(bronze,x,1.397,zz,.18,.009,.009);block(marble,x,1.43,z+.2,.15,.035,.18);for(const side of [-1,1]){block(bronze,x+side*.3,1.76,z,.014,.1,.25);for(let j=0;j<5;j++)block(bronze,x+side*.3,1.74,z-.10+j*.05,.012,.1,.012);}for(const dx of [-.2,.2]){disk(ink,x+dx,1.82,z,.03,.1,8);block(clay,x+dx,1.57,z+.17,.13,.055,.045);}rod(bronze,[x,2.02,z],[x+.2,2.02,z],.009);}
  // Boardwalk, waterfront buildings and miniature planting follow the harbor arc.
  for(let i=0;i<17;i++){const a=.12+i*(Math.PI-.24)/16,x=4.4*Math.cos(a),z=-1+2.5*Math.sin(a);block(marble,x,1.46,z,.39,.09,.33,-a);if(i%2===0){block(plaster,x,1.7,z+.25,.36,.4,.28);block(blue,x,1.72,z+.41,.25,.15,.015);block(timber,x,1.94,z+.28,.4,.055,.38);disk(jade,x+.28,1.62,z,.09,.2,8);}}
  for(const x of [-6.4,6.4]){ledge(x,-2,2.1);pendant(x,-2,4);for(const dx of [-.55,0,.55]){disk(plaster,x+dx,1.25,-1.85,.075,.18,12);stool(x+dx,-.8);}}
  for(const side of [-1,1])sideDisplay(side,1,'PORT / VOYAGES','map');
  labelAt('DUBAI / HARBOUR',0,6.35,-6.5,3.8);labelAt('CRUISE TERMINAL / BERTH PLAN',0,.93,2.07,3.8);
  for(const x of [-3,3]){pedestal(x,4.5,.7,.6,.85);box(clay,x,1.18,4.5,.55,.6,.35);ring(ink,x,1.52,4.5,.13,.025,0);}
 }else if(theme==='sphere'){
  features.push('acoustic-wall-bays','lighting-truss','seat-hardware');
  const acoustic=material('#242d3a',0,.96);installSurfaceFinish(acoustic,'fabric');
  for(const side of [-1,1]){
   for(const z of [-3,-.2,2.6,5.4]){box(acoustic,side*8.7,3.4,z,.18,4.6,2.35);for(let dz=-.9;dz<=.91;dz+=.18)block(ink,side*8.57,3.4,z+dz,.05,4.4,.05);block(glow,side*8.53,5.5,z,.025,.025,2.1);}
   for(let row=0;row<4;row++){const z=-1+row*1.65,y=.44+row*.44;block(ink,side*7.2,y,z,.5,.16,.55);block(glow,side*7.2,y+.09,z+.24,.4,.018,.03);}
  }
  for(const z of [-4,2]){rod(bronze,[-7,6.35,z],[7,6.35,z],.035);rod(bronze,[-7,6.65,z],[7,6.65,z],.035);for(let x=-7;x<7;x+=.7)rod(bronze,[x,6.35,z],[x+.7,6.65,z],.018);for(const x of [-5,-2,2,5])spotlight(x,z);}
  for(let row=0;row<4;row++)for(let x=-6;x<=6;x+=1.2){const z=-.6+row*1.65,y=1.1+row*.44;for(const dx of [-.36,.36])block(ink,x+dx,y-.65,z,.055,.5,.12);ring(ink,x+.47,y+.04,z-.14,.06,.012);block(bronze,x,y+.16,z+.1,.16,.07,.01);}
  for(const r of [2.03,2.13])arc(bronze,0,.29,-4,r,0,Math.PI*2,.018);
  labelAt('SPHERE / IMMERSIVE THEATRE',0,6.65,-6.25,4.5);
 }else if(theme==='luxor'){
  features.push('sandstone-relief-gallery','pyramid-joints','obelisk-vitrines');
  for(const x of [-7.6,-3.9,0,3.9,7.6]){
   panel(x,3.5,-6.65,2.4,4.55,clay);for(const y of [1.65,2.35,3.05,3.75,4.45,5.15])for(let i=-2;i<=2;i++){const xx=x+i*.36;const motif=(i+Math.round(y*10))%3;
    if(motif===0){ring(bronze,xx,y,-6.47,.08,.014,0);rod(bronze,[xx,y-.12,-6.45],[xx,y-.28,-6.45],.012);}
    else if(motif===1){for(let j=0;j<3;j++)rod(bronze,[xx-.12,y-.12+j*.08,-6.45],[xx+.12,y+.01+j*.08,-6.45],.012);}
    else{rod(bronze,[xx,y-.2,-6.45],[xx,y+.12,-6.45],.014);for(const dx of [-.12,.12]){rod(bronze,[xx,y-.1,-6.45],[xx+dx,y+.07,-6.45],.014);rod(bronze,[xx+dx,y+.07,-6.45],[xx,y+.12,-6.45],.014);}}}
  }
  for(const x of [-6,6])for(const z of [-4,0,4]){for(let j=0;j<8;j++){const a=j*Math.PI/4;rod(bronze,[x+Math.cos(a)*.405,.7,z+Math.sin(a)*.405],[x+Math.cos(a)*.405,4.7,z+Math.sin(a)*.405],.014);}disk(marble,x,.13,z,.56,.2,8);}
  // Stepped plinth and four face courses; each tier narrows toward the apex.
  for(let i=0;i<3;i++)box(clay,0,.13+i*.13,0,5.45-i*.25,.12,5.45-i*.25);
  for(let j=0;j<10;j++){const y=.7+j*.29,r=2.12*(1-(y-.6)/3.6);for(const z of [-r,r])block(bronze,0,y,z,2*r,.014,.012);for(const x of [-r,r])block(bronze,x,y,0,.012,.014,2*r);}
  for(const x of [-3.8,3.8]){pedestal(x,-3.9,1.15,1.15,.7);add(new THREE.CylinderGeometry(.12,.3,2.3,4).rotateY(Math.PI/4).translate(x,1.9,-3.9),clay);add(new THREE.ConeGeometry(.17,.35,4).rotateY(Math.PI/4).translate(x,3.22,-3.9),bronze);labelAt('OBELISK / STUDY',x,.63,-3.29,1);}
  bench(-4,4.4);bench(4,4.4);for(const x of [-7,-3,3,7])sconce(x,5.9,-6.4);labelAt('LUXOR / DESERT GALLERY',0,6.25,-6.4,4.5);
  for(const x of [-3.1,3.1])for(const z of [-2.9,2.9])bollard(x,z);
  for(const z of [-2.9,2.9])path(bronze,[[-3.1,.95,z],[0,.77,z],[3.1,.95,z]],.018);
 }else if(theme==='resort'){
  features.push('botanical-feature-wall','tea-lounge','layered-garden-beds');
  panel(0,3.3,-6.48,6.3,4.3,velvet);
  for(let i=0;i<9;i++){const x=-2.65+i*.66;rod(bronze,[x,1.3,-6.3],[x+Math.sin(i)*.3,5.15,-6.3],.022);for(let j=0;j<6;j++){const y=1.6+j*.55;add(createCurvedLeaf(THREE,.22,.6).rotateX(Math.PI/2).rotateZ(j%2?.6:-.6).translate(x+(j%2?.12:-.12),y,-6.2),jade);}}
  for(const x of [-4.2,4.2])lowGarden(x,-3.6,1.55,3.8);
  for(const x of [-6,6]){ledge(x,3.9,2.7);for(const dx of [-.7,0,.7]){disk(bronze,x+dx,1.22,3.9,.17,.025);disk(plaster,x+dx,1.33,3.9,.07,.18,12);}vase(x,1.2,4.07,.35,true);pendant(x,3.8,4.3,.4);}
  for(const side of [-1,1])sideDisplay(side,0,'GARDEN / RETREAT','map');
  // Slender lanterns and lily-like floral inlays surround the water courtyard.
  for(const x of [-2.7,2.7])for(const z of [-2.8,.8]){box(ink,x,.38,z,.26,.55,.26);block(glow,x,.43,z+.14,.15,.31,.02);box(bronze,x,.69,z,.34,.07,.34);}
  labelAt('RESORTS / GARDEN LOUNGE',0,5.85,-6.25,4.5);
 }else if(theme==='strat'){
  features.push('bottle-backbar','desert-topography','observation-instruments');
  sideDisplay(-1,-2,'NEVADA / DESERT ATLAS','map');sideDisplay(1,3,'THE STRAT / ELEVATION');
  // Turn a bar cabinet inward, away from the model and the window mullions.
  const start=capture();panel(0,3.25,0,3.9,3.2,timber);
  for(const y of [2,2.9,3.8]){block(bronze,0,y,.26,3.7,.065,.45);for(let i=0;i<10;i++){const x=-1.6+i*.35;disk(i%3?jade:clay,x,y+.25,.23,.065,.37,10);disk(bronze,x,y+.48,.23,.025,.1,8);}}
  plaque('SKY / LOUNGE',0,4.7,.12,2.6,.25);transform(start,new THREE.Matrix4().makeRotationY(-Math.PI/2).setPosition(8.3,0,-1.5));
  for(const z of [-2.2,-.4,1.4])stool(4.45,z);
  for(let i=0;i<8;i++){const x=-2.9+i*.85;add(new THREE.ConeGeometry(.35+(i%3)*.06,.25+(i%4)*.1,5).scale(1,1,.5).translate(x,1.08,-2.45),clay);}
  for(const [x,z] of [[-2,-1],[1,0]]){disk(ink,x,1.1,z,.35,.15);cyl(plaster,x,1.65,z,.06,1,12);disk(blue,x,2.16,z,.28,.22);disk(bronze,x,2.29,z,.32,.06);}
  for(const x of [-4.7,4.7]){disk(ink,x,.15,-4.7,.24,.1);cyl(bronze,x,.85,-4.7,.035,1.4,10);rod(blue,[x,1.55,-4.7],[x,1.7,-5.15],.1);}
  rail(0,1.55,7.3);labelAt('LAS VEGAS / DESERT CITY',0,1.2,1.58,3.8);labelAt('THE STRAT / SKY LOUNGE',0,6.35,-6.5,4.5);
 }else if(theme==='balloon'){
  features.push('riveted-cabin-ribs','paris-gallery','detailed-tower-base');
  for(const y of [2,4,6]){const r=Math.sqrt(6.5**2-(y-4)**2);ring(bronze,0,y,0,r,.025);}
  // Blue panels, gilded motifs and alternating inset vignettes at the perimeter.
  for(const side of [-1,1])sideDisplay(side,0,'PARIS / AERIAL STUDY','map');
  for(const x of [-4,0,4]){panel(x,3.8,-5.65,2.3,2.6,blue);contour(x,3.8,-5.49,1.9,1.9);labelAt('PARIS / 0'+(x/4+2),x,2.15,-5.48,1.8);}
  for(let i=0;i<24;i++){const a=i*Math.PI/12;disk(bronze,Math.cos(a)*1.97,.93,Math.sin(a)*1.97,.027,.04,6);}
  // Platforms have railings and an open arch at each of the tower's four feet.
  for(const y of [1.8,2.8]){const r=.9-(y-.9)*.235;for(const z of [-r,r]){for(let x=-r;x<=r;x+=.12)cyl(bronze,x,y+.14,z,.007,.24,5);block(bronze,0,y+.26,z,r*2,.012,.012);}}
  for(const z of [-.85,.85]){const ps=[];for(let i=0;i<=24;i++){const a=i*Math.PI/24;ps.push([Math.cos(a)*.75,.92+Math.sin(a)*.6,z]);}path(bronze,ps,.025);}
  for(const x of [-3,3]){pedestal(x,-3,.8,.7,.85);vase(x,.9,-3,.7,true);}
  for(const x of [-5,5])pendant(x,3,4.5);labelAt('PARIS / BALLOON OBSERVATORY',0,5.7,-6.22,4.8);
 }else if(theme==='mosque'){
  features.push('pier-inlays','prayer-row-borders','reading-niches');
  for(const x of [-5,5])for(const z of [-4,0,4])for(let j=0;j<4;j++){const a=j*Math.PI/2;path(bronze,[[x+Math.cos(a)*.195,.7,z+Math.sin(a)*.195],[x+Math.cos(a+.1)*.195,1.35,z+Math.sin(a+.1)*.195],[x+Math.cos(a)*.195,2,z+Math.sin(a)*.195]],.009);}
  for(let z=-5.5;z<6;z+=1.7)for(const x of [-6.7,0,6.7])block(bronze,x,.094,z,x===0?8.7:2.5,.008,.016);
  labelAt('PRAYER HALL / ARCHITECTURAL STUDY',0,.37,6.15,4);
 }else if(theme==='palace'){
  features.push('marquetry-counter','perimeter-inlays','garden-bed-detail');
  for(const x of [-7.4,7.4])lowGarden(x,2.4,.85,1.45);
  for(const x of [-3.2,3.2])for(const z of [-4.1,2.1]){block(bronze,x,.11,z,.35,.012,.035);block(bronze,x,.11,z,.035,.012,.35);}
  labelAt('EMIRATES / GARDEN HALL',0,1.14,-5.18,2.6);
 }else if(theme==='racing'){
  features.push('pit-tool-board','display-restraints','race-telemetry');
  for(const x of [-5.45,5.45]){panel(x,3.4,-6.4,2.1,2.6,ink);for(let i=0;i<6;i++){const xx=x-.95+i*.38;rod(bronze,[xx,2.4,-6.2],[xx,3.1+(i%3)*.3,-6.2],.028);ring(bronze,xx,3.22+(i%3)*.3,-6.2,.09,.018,0);}}
  for(const x of [-5.2,-.8])for(const z of [-.5,2.5])bollard(x,z);for(const z of [-.5,2.5])path(bronze,[[-5.2,.95,z],[-3,.7,z],[-.8,.95,z]],.018);
  for(const x of [-3,0,3])labelAt('TELEMETRY / 0'+(x/3+2),x,2.4,-6.14,2);
  labelAt('RACING / DESIGN LAB',0,5.4,-6.4,4);
 }else if(theme==='etihad'){
  features.push('tower-model-podiums','coastal-interpretation','lounge-curation');
  sideDisplay(-1,-2,'ABU DHABI / COAST','map');
  for(let i=0;i<5;i++){block(marble,-1.2+i*.6,1.02,-1,.45,.08,.6);for(let j=0;j<3;j++)block(bronze,-1.2+i*.6+(j-1)*.08,1.2,-.69,.025,.24,.018);}
  labelAt('ETIHAD / FIVE TOWERS',0,.81,.89,2.9);for(const x of [-4.7,4.7]){pedestal(x,-3.7,.8,.75,.9);vase(x,.95,-3.7,.65,true);}
 }else if(theme==='courtyard'){
  features.push('model-cutaway-courts','architectural-labels','perforated-display-screen');
  for(const x of [-5,0,5]){labelAt(x<0?'MOSQUE':x===0?'CHURCH':'SYNAGOGUE',x,1.09,-2.7,1.5);for(const dx of [-.95,.95])block(bronze,x+dx,1.05,-2.75,.04,.4,.025);}
  for(const side of [-1,1])sideDisplay(side,2,'LIGHT / SHARED COURTYARD','map');
  for(const x of [-2.4,2.4])for(let z=-3;z<4;z+=.8){block(bronze,x,.1,z,.22,.015,.025);}
 }
 return {features,labels};
}

/** One atlas per room keeps the many readable exhibit labels in a single draw.
 * Node geometry checks use the same planes without allocating a browser canvas. */
export function buildInteriorLabels(labels,add,material){
 if(!labels.length)return null;
 const m=material('#eee8d9',.05,.8);const rows=labels.length;let texture=null;
 if(typeof document!=='undefined'){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=rows*64;const ctx=canvas.getContext('2d');
  ctx.fillStyle='#263c40';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#eee8d9';
  labels.forEach((p,i)=>{const sx=16*p.h/p.w;ctx.save();ctx.translate(512,i*64+32);ctx.scale(sx,1);ctx.font='500 40px Arial, sans-serif';const size=Math.min(40,40*940/(sx*ctx.measureText(p.text).width));ctx.font=`500 ${size}px Arial, sans-serif`;ctx.fillText(p.text,0,0);ctx.restore();});
  texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;m.map=texture;m.color.set('#ffffff');
 }
 labels.forEach((p,i)=>{const g=new THREE.PlaneGeometry(p.w,p.h),uv=g.attributes.uv;for(let j=0;j<uv.count;j++)uv.setY(j,1-(i+1-uv.getY(j))/rows);g.rotateY(p.a);g.translate(p.x,p.y,p.z);if(p.matrix)g.applyMatrix4(p.matrix);add(g,m);});
 return texture;
}

// Each detail button frames the named exhibit rather than sharing a generic shot.
export const INTERIOR_SHOTS={
 burj:{entry:{p:[.8,2.9,6.2],q:[0,2,-1.8]},details:[{p:[4.2,4.1,3.7],q:[0,1.9,-1]},{p:[-2.5,2.3,-1],q:[0,3,-5.8]},{p:[-2,2.1,2.1],q:[-5.6,1.6,-1.2]}]},
 future:{entry:{p:[1,3.2,6.5],q:[0,3.2,-2.2]},details:[{p:[3.6,3.3,2.8],q:[0,3,-1]},{p:[1.4,2.5,4.8],q:[5.5,2,1]},{p:[6.2,4.1,5],q:[0,4,-3]}]},
 aquarium:{entry:{p:[0,2.7,6.1],q:[0,2.8,-4.7]},details:[{p:[3.5,2.8,2.7],q:[0,3.5,-6]},{p:[-2.5,1.65,-1.5],q:[-4.5,1,-5.2]},{p:[3.2,2.2,-1.1],q:[0,1.35,-5.5]}]},
 sail:{entry:{p:[1.2,2.6,6],q:[0,2,-2.8]},details:[{p:[3,2.8,2.8],q:[0,.8,-2.7]},{p:[1,3.4,1],q:[0,4.2,-5.6]},{p:[1,2.3,4.5],q:[6,1.2,0]}]},
 harbor:{entry:{p:[.6,3.1,6.4],q:[0,1.6,-1]},details:[{p:[5.2,4.8,4.9],q:[0,1.6,-1]},{p:[1,2.4,1.7],q:[.7,1.7,-.9]},{p:[1.6,2.3,2.8],q:[6.3,1.4,-1.5]}]},
 sphere:{entry:{p:[0,3.6,6.2],q:[0,3.2,-5.5]},details:[{p:[0,3.6,5.7],q:[0,4,-5]},{p:[7.6,4.6,5.8],q:[0,1.7,1.8]},{p:[4.3,3,0],q:[0,.6,-4]}]},
 luxor:{entry:{p:[1,3,6.3],q:[0,2.5,-1]},details:[{p:[4.2,3.6,4.5],q:[0,1.8,0]},{p:[-2.8,2.8,2.8],q:[-6,3,-2]},{p:[4.9,3.2,5.4],q:[0,6.5,-2]}]},
 resort:{entry:{p:[1,2.6,6],q:[0,2.3,-3.8]},details:[{p:[1,2.6,.6],q:[-4.1,1.8,-3.6]},{p:[3.7,3,3.8],q:[0,.6,-1]},{p:[1,2.4,3],q:[6,1.4,1.5]}]},
 strat:{entry:{p:[1.2,2.9,6.2],q:[0,1.9,-1.8]},details:[{p:[3.7,3.6,3.7],q:[0,1.5,-1]},{p:[-3,2.2,-1],q:[0,3.3,-5.8]},{p:[1.7,2.5,3],q:[6.8,2,-1.4]}]},
 balloon:{entry:{p:[1,2.5,6.2],q:[0,2.2,-1]},details:[{p:[3.1,2.8,3.4],q:[0,2.2,0]},{p:[2.4,3,3.8],q:[0,7,-1]},{p:[1.2,2.5,4.6],q:[5,1.5,2.4]}]}
};
