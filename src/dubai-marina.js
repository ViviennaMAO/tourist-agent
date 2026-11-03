import * as THREE from 'three';
import {MARINA_PIERS,MARINA_BOATS,MARINA_CAFES} from './dubai-marina-layout.js';

/** Eight sheltered berths and a low waterfront dining strip. All coordinates
 * are baked into the terminal landmark at Dubai-local [80,13]. */
export function appendDubaiMarina({root,add,box,beam,rail,finish,stone,ivory,steel,bronze,glass,dark,teak,green,flower,warm,paver,paverLight}){
  const textures=[];
  function groupAt(x,z,y=0,yaw=0){const g=new THREE.Group();g.position.set(x-80,y,z-13);g.rotation.y=yaw;root.add(g);return g;}
  // The quay is a promenade with open entrances at every finger pier.
  box(stone,0,1.03,3,7.7,.12,54);
  for(let z=-23;z<=29;z+=2)for(const x of [-2.8,-.9,.9,2.8])box((z+23)%6?paver:paverLight,x,1.1,z,1.82,.025,1.96);
  for(const [a,b] of [[-11,-5],[-3,6],[8,17],[19,28],[30,39],[41,43]])rail(3.7,a-13,3.7,b-13,1.16);
  rail(-3.7,30,3.7,30,1.16);
  for(const p of MARINA_PIERS){
    const g=groupAt(p.x,p.z);g.name='finger-pier';
    box(ivory,0,.92,0,p.w,.3,p.d,g);box(teak,0,1.08,0,p.w-.1,.05,p.d-.1,g);
    for(let x=-9.5;x<=9.5;x+=.65)box(bronze,x,1.113,0,.018,.008,p.d-.12,g);
    for(let x=-8;x<=9;x+=4)for(const z of [-.53,.53]){
      add(new THREE.CylinderGeometry(.08,.11,.25,8).translate(x,1.22,z),bronze,g);
      box(dark,x,.75,z*1.2,.3,.7,.22,g);
    }
    for(const x of [-8,8]){beam(steel,[x,.3,0],[x,1.6,0],.065,g);box(warm,x,1.62,0,.16,.2,.16,g);}
  }
  // Shorter hulls point out into the harbor, leaving circulation between slips.
  for(const [i,b] of MARINA_BOATS.entries()){
    const g=groupAt(b.x,b.z,0,Math.PI/2);g.name='berthed-'+b.kind;g.userData.boat=b;
    const l=b.length,w=b.width,s=new THREE.Shape();
    s.moveTo(-w*.42,-l*.5);s.lineTo(-w*.5,-l*.35);s.lineTo(-w*.5,l*.27);
    s.quadraticCurveTo(-w*.4,l*.44,0,l*.5);s.quadraticCurveTo(w*.4,l*.44,w*.5,l*.27);s.lineTo(w*.5,-l*.35);s.lineTo(w*.42,-l*.5);s.closePath();
    const freeboard=b.decks===3?1.25:.85;
    add(new THREE.ExtrudeGeometry(s,{depth:freeboard+.16,bevelEnabled:true,bevelThickness:.06,bevelSize:.09,bevelSegments:2,curveSegments:8}).rotateX(Math.PI/2).translate(0,freeboard,0),ivory,g);
    box(teak,0,freeboard+.07,-l*.38,w*.72,.06,l*.15,g);
    for(const sign of [-1,1]){
      box(dark,sign*(w/2+.095),.38,-l*.06,.025,.18,l*.62,g);
      for(let z=-l*.36;z<l*.29;z+=.85)box(glass,sign*(w/2+.096),freeboard*.7,z,.028,.14,.28,g);
    }
    const points=s.getPoints(8);
    for(let k=0;k<points.length-1;k++){
      const a=points[k],c=points[k+1];beam(steel,[a.x,freeboard+.1,a.y],[a.x,freeboard+.55,a.y],.018,g);beam(steel,[a.x,freeboard+.55,a.y],[c.x,freeboard+.55,c.y],.016,g);
    }
    for(let deck=0;deck<b.decks;deck++){
      const y=freeboard+.25+deck*.8,d=l*(.66-deck*.07),ww=w*(.83-deck*.05);
      box(ivory,0,y,-.3,ww,.12,d,g);box(glass,0,y+.35,-.3,ww-.12,.56,d-.35,g);box(ivory,0,y+.68,-.3,ww+.05,.12,d+.1,g);
      for(const sign of [-1,1])for(let z=-d/2;z<d/2;z+=.85)box(ivory,sign*(ww/2-.02),y+.35,z-.3,.05,.57,.045,g);
    }
    const top=freeboard+.25+b.decks*.8;
    box(teak,0,top-.05,-l*.15,w*.6,.06,l*.3,g);
    box(ivory,0,top+.25,-l*.18,w*.4,.5,l*.13,g);box(dark,0,top+.53,-l*.18,w*.42,.06,l*.14,g);
    beam(steel,[0,top,l*.12],[0,top+1,l*.12],.025,g);
    if(b.decks===3){
      for(const x of [-w*.48,w*.48])for(const z of [-l*.24,0]){add(new THREE.CapsuleGeometry(.16,.55,2,6).rotateX(Math.PI/2).translate(x,1.65,z),ivory,g);}
      box(glass,0,top,l*.14,w*.45,.08,l*.13,g);
    }else{box(ivory,0,freeboard+.17,l*.31,w*.5,.18,l*.15,g);}
    // Stern boarding ramp aligns with the nearby finger; not a walkable ship.
    const pierZ=MARINA_PIERS[Math.floor(i/2)+(i%2?1:0)].z;
    const ramp=groupAt(89,(b.z+pierZ)/2);box(teak,0,1.1,0,.75,.08,Math.abs(b.z-pierZ),ramp);
  }
  const fabric=finish('#d8ccae',.92),awning=finish('#73816c',.88),terracotta=finish('#a97c61',.88);
  const interior=finish('#b9a181',.94),joint=finish('#bfb49e',.95),shopGlass=finish('#a9c6c8',.24,.12);
  interior.emissive.set('#a17a4b');interior.emissiveIntensity=.15;
  shopGlass.transparent=true;shopGlass.opacity=.19;shopGlass.depthWrite=false;
  shopGlass.userData.noShadow=true;
  // Cafes face the water; terrace furniture stays behind a continuous edge path.
  for(const [i,c] of MARINA_CAFES.entries()){
    const g=groupAt(c.x,c.z,1.05,c.yaw);g.name='waterfront-restaurant';g.userData.cafe=c;
    const h=3.2+(i%3)*.22,front=c.d/2;
    // Hollow shell: real interior depth behind the storefront glazing.
    box(interior,0,.06,0,c.w-.15,.12,c.d,g);
    box(stone,0,h/2,-front+.1,c.w,h,.2,g);
    for(const sign of [-1,1]){
      box(stone,sign*(c.w/2-.1),h/2,0,.2,h,c.d,g);
      box(glass,sign*(c.w/2+.012),1.65,0,.025,1.4,c.d*.48,g);
      box(ivory,sign*(c.w/2+.05),.9,0,.14,.12,c.d*.52,g);
      for(const z of [-c.d*.25,0,c.d*.25])box(bronze,sign*(c.w/2+.04),1.65,z,.06,1.45,.045,g);
      box(stone,sign*(c.w/2-.16),h/2,front,.32,h,.24,g);
    }
    box(stone,0,h-.2,front,c.w,.4,.24,g);
    box(stone,0,h+.08,0,c.w+.15,.18,c.d+.15,g);
    // Slim roof parapets and subdued rear stone coursing.
    for(const z of [-front,front])box(ivory,0,h+.26,z,c.w+.15,.22,.16,g);
    for(const x of [-c.w/2,c.w/2])box(ivory,x,h+.26,0,.16,.22,c.d,g);
    for(let y=.65;y<h-.1;y+=.65)box(joint,0,y,-front-.006,c.w-.12,.012,.012,g);
    for(const x of [-c.w*.28,c.w*.28]){
      box(bronze,x,1.8,-front-.025,c.w*.2,1.25,.04,g);
      for(let y=1.25;y<2.4;y+=.14)box(teak,x,y,-front-.065,c.w*.2,.065,.06,g);
    }
    // Back counter, shelves, cups and pendant shades remain visible in daylight.
    box(teak,0,.55,-front+.7,c.w-.7,1.1,.65,g);
    box(fabric,0,1.13,-front+.7,c.w-.55,.1,.75,g);
    for(const y of [1.65,2.13]){
      box(teak,0,y,-front+.3,c.w-.55,.07,.45,g);
      for(let x=-c.w/2+.6;x<c.w/2-.4;x+=.6)box(i%2?terracotta:fabric,x,y+.16,-front+.3,.16,.25,.16,g);
    }
    for(const x of [-1.8,1.8]){
      beam(bronze,[x,h-.1,.4],[x,2.35,.4],.018,g);
      add(new THREE.ConeGeometry(.25,.18,12).translate(x,2.35,.4),warm,g);
    }
    // Recess-like glazing, frames, interior shelf/counter and warm lamps.
    for(const x of [-c.w*.3,0,c.w*.3]){
      box(shopGlass,x,1.55,front+.026,c.w*.27,2.25,.025,g);
      for(const side of [-1,1])box(bronze,x+side*c.w*.137,1.55,front+.075,.045,2.35,.06,g);
      box(teak,x,.9,front+.055,c.w*.25,.18,.08,g);
      box(warm,x,2.6,front+.15,.15,.25,.15,g);
    }
    box(bronze,0,2.94,front+.12,c.w-.25,.38,.12,g);
    if(typeof document!=='undefined'){
      const canvas=document.createElement('canvas');canvas.width=512;canvas.height=64;
      const ctx=canvas.getContext('2d');ctx.fillStyle='#514938';ctx.fillRect(0,0,512,64);ctx.fillStyle='#f3e8cd';ctx.font='500 36px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(c.label,256,33);
      const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;textures.push(t);
      const m=finish('#ffffff',.9);m.map=t;add(new THREE.PlaneGeometry(c.w-.38,.3).translate(0,2.95,front+.188),m,g);
    }
    // Fabric shade or timber pergola gives alternating shopfront silhouettes.
    if(i%2){
      for(let x=-c.w/2;x<=c.w/2;x+=.65)box(teak,x,2.65,front+.8,.1,.14,1.9,g);
      box(teak,0,2.65,front+1.65,c.w+.2,.16,.12,g);
    }else{const canopy=new THREE.BoxGeometry(c.w+.15,.08,1.65).rotateX(.12).translate(0,2.72,front+.72);add(canopy,i%3?fabric:awning,g);}
    for(const x of [-1.8,1.8]){
      const z=front+1.5;
      add(new THREE.CylinderGeometry(.52,.52,.07,16).translate(x,.79,z),teak,g);beam(bronze,[x,.05,z],[x,.75,z],.055,g);
      for(const side of [-1,1]){
        box(fabric,x+side*.72,.46,z,.46,.09,.48,g);box(teak,x+side*.94,.77,z,.07,.53,.48,g);
        for(const dz of [-.16,.16])beam(bronze,[x+side*.72,.1,z+dz],[x+side*.72,.43,z+dz],.028,g);
      }
      if(i%3===0){beam(bronze,[x,0,z],[x,2.6,z],.035,g);add(new THREE.ConeGeometry(1.03,.35,8).translate(x,2.55,z),fabric,g);}
    }
    for(const x of [-c.w/2+.25,c.w/2-.25]){
      box(terracotta,x,.24,front+.65,.5,.48,.5,g);
      for(let n=0;n<7;n++){const a=n*2.4;add(new THREE.IcosahedronGeometry(.15,1).scale(1,1.6,1).translate(x+Math.cos(a)*.16,.65+(n%2)*.14,front+.65+Math.sin(a)*.16),n%3?green:flower,g);}
    }
  }
  root.userData.marina={boats:MARINA_BOATS.length,cafes:MARINA_CAFES.length,piers:MARINA_PIERS.length};
  return textures;
}
