import * as THREE from 'three';

// Measured source envelope: hall x ±8.203, z -8.704..-3.515,
// floor .326, ceiling 4.577. The narthex projects toward the courtyard.
export const PRAYER_HALL_CUTS=[
 {min:[-2.155,.09,-.612],max:[2.155,3.93,.416]},
 {min:[-2.201,.325,-3.53],max:[2.201,4.01,-3.30]}
];
export function prayerArchPoints(radius,height){
 const p=new THREE.Path();p.moveTo(radius,0);p.lineTo(radius,height*.55);
 p.bezierCurveTo(radius,height*.77,radius*.52,height*.92,0,height);
 p.bezierCurveTo(-radius*.52,height*.92,-radius,height*.77,-radius,height*.55);p.lineTo(-radius,0);
 return p.getPoints(20);
}
export function prayerArchGeometry(halfWidth,top,radius,height,depth){
 const s=new THREE.Shape();s.moveTo(-halfWidth,0);s.lineTo(-halfWidth,top);s.lineTo(halfWidth,top);s.lineTo(halfWidth,0);
 for(const p of prayerArchPoints(radius,height))s.lineTo(p.x,p.y);s.closePath();
 return new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false});
}
export function installPrayerCarpet(material,{halfWidth=7.65,halfDepth=2.14,centerZ=-6.12}={}){
 material.onBeforeCompile=sh=>{
  sh.vertexShader='varying vec2 carpetP;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ncarpetP=position.xz;');
  sh.fragmentShader='varying vec2 carpetP;\n'+sh.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   vec2 p=carpetP;float edge=min(${halfWidth.toFixed(3)}-abs(p.x),${halfDepth.toFixed(3)}-abs(p.y-(${centerZ.toFixed(3)})));
   float aa=max(length(fwidth(p)),.002);
   float border=(1.-smoothstep(.05,.05+aa,abs(edge-.18)))*.5;
   vec2 cell=vec2(mod(p.x+.55,1.1)-.55,mod(p.y+.42,.84)-.42);
   float a=atan(cell.y,cell.x),r=length(cell);
   float flower=1.-smoothstep(.018,.018+aa,abs(r-(.13+.035*cos(a*8.))));
   float row=1.-smoothstep(.007,.007+aa,abs(cell.y)-.38);
   float visible=1.-smoothstep(.04,.14,aa);
   diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.45,.47,.28),clamp(border+flower*.25*visible,0.,.6));
   diffuseColor.rgb*=1.-(1.-row)*.06*visible;
  `);
 };material.customProgramCacheKey=()=>`abu-prayer-carpet-v2-${halfWidth}-${halfDepth}-${centerZ}`;
}
export function buildPrayerHall({add,box,cylinder,wall,trim,gold,floor,carpet,glass}){
 const arch=(x,y,z,half,top,riseR,riseH,depth,angle=0)=>add(prayerArchGeometry(half,top,riseR,riseH,depth).rotateY(angle).translate(x,y,z),wall);
 const mould=(x,y,z,r,h,angle=0)=>{
  const pts=prayerArchPoints(r,h).map(p=>new THREE.Vector3(p.x,p.y,0).applyAxisAngle(new THREE.Vector3(0,1,0),angle).add(new THREE.Vector3(x,y,z)));
  add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),32,.024,5,false),trim);
 };
 // Three open courtyard doors; their depths replace all old opaque inset panels.
 for(const [x,half,r,h] of [[0,.9,.64,2.78],[-1.527,.627,.35,1.91],[1.527,.627,.35,1.91]]){
  arch(x,.096,-.61,half,3.832,r,h,1.024);
  mould(x,.096,.437,r*1.04,h+.03);mould(x,.096,-.634,r*1.04,h+.03);
 }
 arch(0,.326,-3.524,2.2,3.68,1.16,3.35,.214);mould(0,.326,-3.287,1.19,3.4);mould(0,.326,-3.55,1.19,3.4);
 // Marble narthex threshold and main-hall perimeter, within the source shell.
 box(floor,0,.344,-1.55,4.28,.032,3.8);
 box(floor,0,.35,-6.11,16.3,.04,5.12);
 box(carpet,0,.379,-6.12,15.3,.018,4.28);
 for(const x of [-8.14,8.14]){
  box(wall,x,2.46,-6.11,.08,4.18,5.12);
  box(trim,x*.996,.53,-6.11,.12,.3,5.05);
  box(trim,x*.996,4.38,-6.11,.16,.18,5.05);
 }
 for(const x of [-4.475,4.475])add(new THREE.BoxGeometry(7.35,4.18,.08).translate(x,2.46,-8.65),wall);
 arch(0,.37,-8.69,.8,4.18,.62,2.55,.08);
 box(trim,0,.53,-8.58,16.23,.3,.1);
 box(trim,0,4.38,-8.55,16.23,.18,.15);
 box(wall,0,4.51,-6.11,16.3,.08,5.12);
 // Line the old front shell from inside, leaving the new central arch clear.
 for(const x of [-5.175,5.175])box(wall,x,2.46,-3.58,5.95,4.18,.08);
 box(wall,0,4.278,-3.58,4.4,.544,.08);
 // Two column lines define a broad central bay and quieter side aisles.
 for(const x of [-2.6,2.6]){
  for(const z of [-4.3,-6.12,-7.94]){
   cylinder(wall,x,1.83,z,.11,.14,2.76,16);
   box(trim,x,.47,z,.35,.2,.35);
   cylinder(gold,x,3.24,z,.21,.12,.12,16);
   box(trim,x,3.36,z,.43,.12,.43);
  }
  for(const z of [-5.21,-7.03])arch(x,3.37,z,.91,1.05,.74,.89,.14,Math.PI/2);
 }
 for(const z of [-4.3,-7.94])arch(0,3.37,z,2.6,1.05,2.38,.91,.16);
 // Back wall: shallow recessed mihrab, flanking framed panels; no invented text.
 const niche=new THREE.Shape();const outline=prayerArchPoints(.62,2.55);niche.moveTo(outline[0].x,outline[0].y);for(const p of outline.slice(1))niche.lineTo(p.x,p.y);niche.closePath();
 add(new THREE.ShapeGeometry(niche).translate(0,.37,-8.665),gold);
 mould(0,.37,-8.54,.66,2.59);
 for(let i=-3;i<=3;i++)box(gold,i*.14,1.32,-8.645,.012,1.67,.018);
 for(const x of [-6.4,-4.3,4.3,6.4]){
  box(trim,x,2.13,-8.51,1.6,2.8,.065);
  box(wall,x,2.13,-8.46,1.44,2.64,.06);
  mould(x,.82,-8.415,.55,2.12);
 }
 for(const x of [-5.4,0,5.4]){
  // Recessed ceiling panels and small clerestory-like luminous screens.
  box(trim,x,4.438,-6.1,4.7,.065,4.48);
  box(wall,x,4.395,-6.1,4.48,.04,4.26);
 }
 for(const sign of [-1,1])for(const z of [-4.7,-6.15,-7.6]){
  box(trim,sign*8.075,3.19,z,.07,1.37,.94);
  box(glass,sign*8.025,3.19,z,.025,1.2,.78);
  for(const dz of [-.25,0,.25])box(gold,sign*8.002,3.19,z+dz,.025,1.19,.013);
 }
 for(const z of [-5.14,-7.14]){
  cylinder(gold,0,3.9,z,.018,.018,.92,10);
  for(const [y,r] of [[3.42,.48],[3.16,.3]]){
   add(new THREE.TorusGeometry(r,.024,5,32).rotateX(Math.PI/2).translate(0,y,z),gold);
   for(let i=0;i<8;i++){
    const a=i*Math.PI/4,x=Math.cos(a)*r,zz=z+Math.sin(a)*r;
    cylinder(gold,x,y+.1,zz,.008,.008,.2,6);
    add(new THREE.SphereGeometry(.047,8,6).scale(1,1.8,1).translate(x,y-.08,zz),glass);
   }
  }
  add(new THREE.SphereGeometry(.11,12,8).scale(1,1.5,1).translate(0,3.05,z),glass);
 }
}
