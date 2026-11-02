/** Limestone houses with a shaded ground arcade and a usable-looking upper
 * loggia. All geometry stays inside the source collision envelope. The arcade
 * is a visual recess, not a new traversable room. Finishes share district batches.
 */
export function appendDubaiVilla({ THREE, b, h, index, finishes, box, add }) {
  const { wall, trim, metal, glass, roof, recess, wood, amberGlass, lanternGlass, plantGreen, flowers } = finishes;
  const { w, d } = b;
  const front = d / 2, back = -d / 2;
  const porch = Math.min(1.15, d * .28), shopZ = front - porch;
  const floor = Math.min(2.85, h * .47), ceiling = h - .3;
  const cols = w > 5 ? 3 : 2, edge = .23, bay = (w - 2 * edge) / cols;
  const pier = .24, opening = bay - pier, radius = opening / 2;
  const spring = floor - .38 - radius;
  // The core ends behind the porch. This void is what creates long contact
  // shadows under the arches instead of painting an arch onto flat glass.
  const roomDepth = b.interior ? .9 : 0;
  box(recess, 0, ceiling / 2, -porch / 2 - roomDepth / 2, w - .7, ceiling, d - porch - .7 - roomDepth);
  box(trim, 0, .09, 0, w, .18, d);
  box(trim, 0, floor - .1, 0, w, .2, d);
  box(roof, 0, ceiling - .06, -porch / 2, w - .08, .12, d - porch);
  // Three solid outside walls with individual deep reveals.
  for (let side = 1; side < 4; side++) {
    const angle = side * Math.PI / 2, cs = Math.cos(angle), sn = Math.sin(angle);
    const span = side === 2 ? w : d - porch;
    const depth = side === 2 ? d : w;
    const shift = side === 1 ? porch / 2 : side === 3 ? -porch / 2 : 0;
    const face = (mat,u,y,inward,ww,hh,dd) => {
      const z = depth / 2 - inward;
      box(mat,(u+shift)*cs+z*sn,y,-(u+shift)*sn+z*cs,ww,hh,dd,angle);
    };
    const n = span > 4.3 ? 3 : 2, spacing = span/n, ww = Math.min(.83,spacing-.48);
    for (const [bottom,top] of [[.18,floor-.2],[floor,ceiling]]) {
      const sill=bottom+.55, head=top-.36;
      face(wall,0,(bottom+sill)/2,.13,span,sill-bottom,.24);
      face(wall,0,(head+top)/2,.13,span,top-head,.24);
      for(let j=0;j<n;j++) {
        const u=-span/2+spacing*(j+.5), flank=(spacing-ww)/2;
        for(const sign of [-1,1]) face(wall,u+sign*(ww/2+flank/2),(sill+head)/2,.13,flank,head-sill,.24);
        face((j+side+index)%4===0?amberGlass:glass,u,(sill+head)/2,.27,ww,head-sill,.02);
        // Narrow stone returns, a deep shadow at the sill, and stepped drip
        // mouldings break the flat window rectangle at pedestrian distance.
        for(const sign of [-1,1])face(trim,u+sign*(ww/2+.025),(sill+head)/2,.17,.05,head-sill+.1,.19);
        face(recess,u,sill-.012,.22,ww,.028,.11);
        face(trim,u,head+.12,.17,ww+.23,.035,.32);
        face(trim,u,sill-.09,.14,ww+.1,.025,.22);
        // A few occupied-looking windows have folded drapes; other panes stay
        // open to daylight reflection, avoiding identical repeated treatment.
        if((j+index+side)%3!==1)for(const sign of [-1,1])for(let pleat=0;pleat<3;pleat++) {
          face(pleat%2?trim:wall,u+sign*(ww*.41-pleat*.03),(sill+head)/2,.249+pleat%2*.007,.033,head-sill-.06,.012);
        }
        if((j+index+side)%5===2)for(let slat=0;slat<5;slat++)face(wood,u,head-.065-slat*.055,.245,ww-.04,.023,.02);
        for(const sign of [-1,1]) face(wood,u+sign*ww/2,(sill+head)/2,.22,.045,head-sill,.07);
        face(wood,u,(sill+head)/2,.22,.025,head-sill,.055);
        for(const y of [sill,head,sill+(head-sill)*.72]) face(wood,u,y,.22,ww,.035,.055);
        face(trim,u,sill-.045,.14,ww+.15,.09,.28);
        face(trim,u,head+.055,.16,ww+.19,.11,.3);
        // Paired timber shutters with visible rails and individual louvers.
        if((j+index+side)%3===0) for(const sign of [-1,1]) {
          const su=u+sign*(ww/2+.14);
          for(let k=0;k<12;k++) face(wood,su,sill+.08+(head-sill-.16)*k/11,.04,.19,.025,.05);
          for(const dx of [-.1,.1]) face(wood,su+dx,(sill+head)/2,.04,.025,head-sill,.05);
        }
      }
    }
    face(trim,0,floor-.04,.13,span,.08,.26);
    face(wall,0,h-.16,.12,span,.28,.22);
    face(trim,0,h-.025,.15,span,.05,.3);
  }
  // Storefronts and upstairs French doors sit over a metre behind the colonnade.
  for(const [bottom,top] of [[.18,floor-.2],[floor+.12,ceiling-.15]]) {
    box(wall,0,top+.055,shopZ-.06,w-.38,.11,.18);
    for(let j=0;j<cols;j++) {
      const x=-w/2+edge+bay*(j+.5), wh=top-bottom;
      const shop = b.interior && bottom < 1;
      box(shop ? finishes.shopGlass : j%2===index%2?amberGlass:glass,x,(top+bottom)/2,shopZ,opening-.08,wh,.025);
      if (shop) {
        // Small real display rooms sit behind the glazing: shelves, pottery,
        // a counter and a pendant light. No painted-on interior texture.
        box(trim,x,bottom,shopZ-.56,opening-.06,.045,1.03);
        box(wall,x,(top+bottom)/2,shopZ-1.13,opening-.06,wh,.04);
        for (const sy of [bottom+.55,bottom+1.02,bottom+1.5]) {
          box(wood,x,sy,shopZ-.96,opening-.17,.045,.25);
          for(let k=0;k<3;k++) {
            const px=x+(k-1)*(opening-.35)/3;
            const profile=[[0,0],[.05,0],[.075,.035],[.065,.09],[.03,.135],[.035,.17],[.025,.17],[.022,.14]].map(([r,y])=>new THREE.Vector2(r,y));
            add(new THREE.LatheGeometry(profile,12).scale(1,k===1?1.15:.9,1).translate(px,sy+.025,shopZ-.91),k%2?trim:amberGlass);
          }
        }
        box(wood,x,bottom+.35,shopZ-.42,opening*.65,.7,.32);
        box(trim,x,bottom+.72,shopZ-.42,opening*.72,.06,.38);
        box(metal,x,top-.23,shopZ-.55,.012,.4,.012);
        add(new THREE.ConeGeometry(.15,.15,16).translate(x,top-.43,shopZ-.55),metal);
        add(new THREE.SphereGeometry(.065,10,6).translate(x,top-.49,shopZ-.55),lanternGlass);
      }
      for(const sx of [-1,1]) box(wood,x+sx*(opening/2-.025),(top+bottom)/2,shopZ+.025,.05,wh,.065);
      for(const yy of [bottom,top,bottom+wh*.76]) box(wood,x,yy,shopZ+.025,opening,.04,.065);
      box(wood,x,(top+bottom)/2,shopZ+.03,.028,wh,.065);
      box(metal,x+.07,bottom+.85,shopZ+.08,.018,.18,.02);
      // Raised timber kick panels, bronze pulls and pleated ivory curtains give
      // the recessed openings a domestic scale without filling the arcade.
      for(const sign of [-1,1]) {
        const px=x+sign*opening*.24, pw=opening*.4;
        box(wood,px,bottom+.27,shopZ+.035,pw,.46,.045);
        for(const yy of [bottom+.08,bottom+.46]) box(metal,px,yy,shopZ+.062,pw-.055,.012,.012);
        box(metal,x+sign*.065,bottom+.91,shopZ+.084,.018,.17,.022);
        if(bottom>1 || (j+index)%3===0) for(let pleat=0;pleat<4;pleat++) {
          const cx=x+sign*(opening*.43-pleat*.041);
          box(pleat%2?trim:wall,cx,bottom+wh*.57,shopZ+.018+pleat%2*.009,.044,wh*.67,.017);
        }
      }
      box(trim,x,top+.015,shopZ+.045,opening+.04,.055,.085);

    }
    for(let j=0;j<=cols;j++) box(wall,-w/2+edge+bay*j,(bottom+top)/2,shopZ-.03,pier,top-bottom,.24);
  }
  // Arcade: square piers, capitals, arched intrados and individually jointed
  // limestone voussoirs. Extrusion gives the arch a real soffit and return.
  for(let j=0;j<=cols;j++) {
    const x=-w/2+edge+bay*j;
    box(wall,x,(spring+.18)/2,front-.22,pier,spring-.18,.42);
    box(trim,x,.29,front-.22,pier+.12,.22,.44);
    box(trim,x,spring-.02,front-.22,pier+.12,.12,.44);
  }
  for(let j=0;j<cols;j++) {
    const x=-w/2+edge+bay*(j+.5);
    const s=new THREE.Shape();
    s.moveTo(-radius,spring);s.lineTo(-radius,floor-.18);s.lineTo(radius,floor-.18);s.lineTo(radius,spring);
    s.absarc(0,spring,radius,0,Math.PI,false);s.closePath();
    add(new THREE.ExtrudeGeometry(s,{depth:.38,curveSegments:16,bevelEnabled:false}).translate(x,0,front-.42),wall);
    for(let k=0;k<13;k++) {
      const a=k*Math.PI/13+.009, z=(k+1)*Math.PI/13-.009, outer=radius+.105;
      const stone=new THREE.Shape();
      stone.moveTo(Math.cos(a)*radius,spring+Math.sin(a)*radius);
      stone.absarc(0,spring,radius,a,z,false);
      stone.lineTo(Math.cos(z)*outer,spring+Math.sin(z)*outer);
      stone.absarc(0,spring,outer,z,a,true);stone.closePath();
      add(new THREE.ExtrudeGeometry(stone,{depth:.045,curveSegments:3,bevelEnabled:false}).translate(x,0,front-.046),k%4===0?wall:trim);
    }
    // Pendant lantern hangs inside the shaded arcade, not on the glass plane.
    const ly=floor-.76, lz=front-porch*.56;
    box(metal,x,floor-.39,lz,.014,.38,.014);
    box(lanternGlass,x,ly,lz,.115,.23,.115);
    for(const sx of [-1,1]) for(const sz of [-1,1]) box(metal,x+sx*.068,ly,lz+sz*.068,.015,.28,.015);
    for(const yy of [ly-.14,ly+.14]) box(metal,x,yy,lz,.18,.035,.18);
  }
  // Upper loggia has a continuous stone sill, patterned bronze balustrade and
  // an open timber canopy. No opaque box fills the air behind the railing.
  box(trim,0,floor+.08,front-.16,w-.12,.12,.3);
  for(const yy of [floor+.23,floor+.92]) box(metal,0,yy,front-.1,w-.22,.035,.04);
  const rails=Math.ceil((w-.4)/.23);
  for(let k=0;k<=rails;k++) box(metal,-w/2+.2+(w-.4)*k/rails,floor+.55,front-.1,.018,.73,.025);
  for(let k=0;k<cols*2;k++) {
    const x=-w/2+.36+(w-.72)*(k+.5)/(cols*2);
    const ring=new THREE.TorusGeometry(.105,.012,4,12).translate(x,floor+.58,front-.1);add(ring,metal);
  }
  for(const x of [-w/2+.14,w/2-.14]) {
    box(wall,x,(floor+ceiling)/2,front-.17,.26,ceiling-floor,.3);
    box(trim,x,ceiling-.06,front-.2,.28,.12,.4);
  }
  for(const z of [front-.16,shopZ+.03]) box(wood,0,ceiling-.14,z,w-.14,.13,.12);
  for(let k=0;k<=Math.ceil(w/.26);k++) {
    const x=-w/2+.1+(w-.2)*k/Math.ceil(w/.26);
    box(wood,x,ceiling-.025,front-porch/2-.04,.075,.09,porch+.04);
  }
  // Roof parapet at the recessed room edge makes the two volumes legible.
  box(wall,0,h-.16,shopZ-.09,w-.08,.28,.18);
  box(trim,0,h-.025,shopZ-.12,w-.02,.05,.24);
  // Wind catchers use the space vacated by the previous tall building, so
  // silhouettes vary without increasing the original envelope's height.
  if(b.h-h>2.1 && index%3===0) {
    const tw=Math.min(1.25,w*.31), tx=-w/2+tw/2+.22, tz=back+tw/2+.22;
    box(wall,tx,h+.24,tz,tw,.48,tw);
    box(recess,tx,h+1.08,tz,tw-.27,1.2,tw-.27);
    for(const sx of [-1,1]) for(const sz of [-1,1]) box(wall,tx+sx*(tw/2-.06),h+1.09,tz+sz*(tw/2-.06),.12,1.22,.12);
    for(let side=0;side<4;side++) {
      const angle=side*Math.PI/2, r=(tw-.24)/2;
      const shape=new THREE.Shape();
      shape.moveTo(-r,1.2);shape.lineTo(-r,1.73);shape.lineTo(r,1.73);shape.lineTo(r,1.2);
      shape.absarc(0,1.2,r,0,Math.PI,false);shape.closePath();
      const g=new THREE.ExtrudeGeometry(shape,{depth:.11,curveSegments:10,bevelEnabled:false});
      g.translate(0,h,tw/2-.12).rotateY(angle).translate(tx,0,tz);add(g,wall);
      const cs=Math.cos(angle),sn=Math.sin(angle);
      box(trim,tx+(tw/2-.055)*sn,h+.51,tz+(tw/2-.055)*cs,tw+.08,.08,.11,angle);
    }
    box(trim,tx,h+1.79,tz,tw+.17,.13,tw+.17);
    box(wall,tx,h+1.88,tz,tw+.08,.06,tw+.08);
  }
  // Climbing bougainvillea stays within the loggia, with branching stems and
  // clusters of leaves/bracts instead of a line of identical pink spheres.
  const vineX=(index%2?1:-1)*(w/2-.23);
  box(trim,vineX,floor+.23,front-.47,.36,.34,.48);
  for(let k=0;k<6;k++) {
    const yy=floor+.45+k*.32, xx=vineX+Math.sin(k*1.9)*.09;
    box(wood,xx,yy,front-.36,.025,.43,.027);
    for(let j=0;j<7;j++) {
      const a=k*2.4+j*1.7, px=THREE.MathUtils.clamp(xx+Math.cos(a)*.22,-w/2+.07,w/2-.07);
      const py=yy+Math.sin(a)*.13,pz=front-.38+Math.sin(a*1.4)*.16;
      add(new THREE.SphereGeometry(.065,5,3).scale(1.3,.36,.65).rotateZ(a).translate(px,py,pz),plantGreen);
      if(j%2===0) add(new THREE.IcosahedronGeometry(.055,0).scale(1,.55,1).translate(px,py+.04,pz+.015),flowers);
    }
  }
  return { porchDepth:porch, arcadeBays:cols, loggias:1 };
}
