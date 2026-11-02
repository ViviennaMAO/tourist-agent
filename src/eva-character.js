import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** Articulated, true-volume Eva model. +Z is forward, Y=0 is the shoe sole.
 * A projected facial albedo is mapped to a sculpted head; there are no billboards.
 * Geometry is merged only within rigid joints, preserving independent gait pivots.
 */
export function createEvaCharacter({ THREE, faceTexture = null, look = {}, detail = 'high' }) {
  const high = detail === 'high', segments = high ? 48 : 32;
  const root = new THREE.Group(); root.name = 'Eva — playable character';
  root.userData.character = 'eva-v2'; root.userData.headHeight = 2.98; root.userData.tagHeight = 3.38;
  const body = new THREE.Group(); root.add(body);
  const owned = [], joints = [], batches = new Map();
  const material = (color, properties = {}) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness: .7, ...properties }); owned.push(m); return m;
  };
  const skinColor = new THREE.Color(look.skin || '#e7ac90');
  const skin = material(skinColor, { roughness: .76 });
  const faceTint = new THREE.Color('#ffffff'), base = new THREE.Color('#e7ac90');
  if (look.skin) faceTint.setRGB(skinColor.r/base.r,skinColor.g/base.g,skinColor.b/base.b);
  const face = material(faceTexture ? faceTint : skinColor, { map: faceTexture, roughness: .78 });
  const hair = material(look.hair || '#151619', { roughness: .49, metalness: 0, envMapIntensity: .55 });
  const hairSheen = material(look.hair || '#292a29', { roughness: .44, envMapIntensity: .65 });
  const dress = material(look.dress || '#e8d7a1', { roughness: .73 });
  const trim = material(look.dress2 || '#cebc87', { roughness: .78 });
  const shoes = material('#e8e1ce', { roughness: .36, metalness: .04 });
  const sole = material('#625343', { roughness: .85 });
  const buckle = material('#c5ad73', { metalness: .75, roughness: .3 });
  const weaveData=new Uint8Array(128*128*4);
  for(let y=0;y<128;y++)for(let x=0;x<128;x++) {
    const v=128+Math.round(18*Math.sin(x*Math.PI/2)*Math.cos(y*Math.PI/2));
    weaveData.set([v,v,v,255],(y*128+x)*4);
  }
  const weave=new THREE.DataTexture(weaveData,128,128);weave.wrapS=weave.wrapT=THREE.RepeatWrapping;
  weave.repeat.set(8,10);weave.magFilter=THREE.LinearFilter;weave.minFilter=THREE.LinearMipmapLinearFilter;weave.generateMipmaps=true;weave.needsUpdate=true;
  dress.bumpMap=weave;dress.bumpScale=.0014;trim.bumpMap=weave;trim.bumpScale=.001;
  const up = new THREE.Vector3(0,1,0), axisX = new THREE.Vector3(1,0,0);

  function joint(parent,name,x,y,z=0) {const g=new THREE.Group();g.name=name;g.position.set(x,y,z);parent.add(g);joints.push(g);return g;}
  function add(parent,geo,mat,x=0,y=0,z=0,scale=[1,1,1],rotation=[0,0,0]) {
    geo.scale(...scale);geo.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...rotation)));geo.translate(x,y,z);
    if(!batches.has(parent))batches.set(parent,new Map());const byMat=batches.get(parent);
    if(!byMat.has(mat))byMat.set(mat,[]);byMat.get(mat).push(geo);return geo;
  }
  function ellipsoid(parent,mat,x,y,z,rx,ry,rz) {return add(parent,new THREE.SphereGeometry(1,high?20:12,high?12:8),mat,x,y,z,[rx,ry,rz]);}
  function box(parent,mat,x,y,z,w,h,d) {return add(parent,new THREE.BoxGeometry(w,h,d),mat,x,y,z);}
  function tube(parent,mat,points,r=.006,n=24,sides=6) {
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    return add(parent,new THREE.TubeGeometry(curve,n,r,sides,false),mat);
  }
  // Smooth section interpolation gives organic silhouettes without stacks of primitives.
  function profile(rows,t) {
    let i=0;while(i<rows.length-2&&t>rows[i+1][0])i++;
    const a=rows[i],b=rows[i+1],f=THREE.MathUtils.smoothstep(t,a[0],b[0]);
    return a.slice(1).map((v,k)=>THREE.MathUtils.lerp(v,b[k+1],f));
  }
  function surface(fn,nu=segments,nv=20,uvFn=null,flip=false) {
    const p=[],uv=[],idx=[];
    for(let v=0;v<=nv;v++)for(let u=0;u<=nu;u++) {
      const a=u/nu*Math.PI*2,t=v/nv,point=fn(a,t);p.push(...point);
      uv.push(...(uvFn?uvFn(point,a,t):[u/nu,t]));
      if(v<nv&&u<nu){const i=v*(nu+1)+u;idx.push(...(flip?[i,i+nu+1,i+1,i+1,i+nu+1,i+nu+2]:[i,i+1,i+nu+1,i+1,i+nu+2,i+nu+1]));}
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
  }
  function limb(parent,length,rows) {
    add(parent,surface((a,t)=>{const [rx,rz]=profile(rows,t);return[Math.sin(a)*rx,-t*length,Math.cos(a)*rz];},high?20:12,14,null,true),skin);
  }
  // Legs are articulated at both hip and knee; the shoe itself has heel, sole,
  // an open vamp and a curved Mary Jane strap instead of a solid rectangular foot.
  const legs=[-1,1].map(s=>{
    const hip=joint(body,`hip ${s}`,s*.125,1.75),knee=joint(hip,`knee ${s}`,0,-.77),ankle=joint(knee,`ankle ${s}`,0,-.82);
    limb(hip,.77,[[0,.105,.105],[.3,.11,.105],[.8,.07,.075],[1,.066,.069]]);
    limb(knee,.82,[[0,.067,.068],[.25,.078,.084],[.6,.054,.060],[1,.037,.044]]);
    ellipsoid(knee,skin,0,-.02,.015,.064,.07,.07);
    ellipsoid(ankle,skin,0,-.025,.055,.047,.04,.10);
    const vamp=new THREE.SphereGeometry(1,24,14),vp=vamp.attributes.position;
    for(let i=0;i<vp.count;i++){const x=vp.getX(i),y=vp.getY(i),z=vp.getZ(i);vp.setXYZ(i,x*.075*(1-.36*Math.max(0,z)),y*.052-.075,z*.17+.1);}vamp.computeVertexNormals();add(ankle,vamp,shoes);
    ellipsoid(ankle,sole,0,-.115,.105,.071,.012,.17);
    // Scoop out the top visually with skin inset surrounded by an ivory vamp.
    ellipsoid(ankle,skin,0,-.027,.065,.049,.018,.078);
    tube(ankle,shoes,[[-.055,-.021,.09],[-.052,.003,.02],[0,.017,-.015],[.052,.003,.02],[.055,-.021,.09]],.009,18);
    tube(ankle,shoes,[[-.067,-.035,.12],[-.049,.014,.08],[0,.025,.065],[.049,.014,.08],[.067,-.035,.12]],.012,18);
    box(ankle,shoes,0,-.11,-.019,.045,.10,.045);
    box(ankle,sole,0,-.158,-.019,.048,.009,.048);
    box(ankle,buckle,s*.061,-.008,.09,.012,.033,.026);
    return {hip,knee,ankle};
  });

  // Skin beneath the square neckline slopes naturally into the neck.
  add(body,surface((a,t)=>{const [rx,rz]=profile([[0,.20,.13],[.45,.275,.16],[.65,.30,.14],[.79,.22,.12],[.89,.085,.077],[1,.070,.069]],t);
    const y=2.0+t*.72,covered=y<2.355?.9:t<.9?.94:1;
    return[Math.sin(a)*rx*covered,y,Math.cos(a)*rz*covered];}),skin);
  const bodice=surface((a,t)=>{
    const shoulder=Math.abs(Math.sin(a))>.74, top=shoulder?2.52:2.355;
    const [rx,rz]=profile([[0,.211,.142],[.32,.23,.151],[.7,.285,.178],[1,.297,.153]],t);
    return[Math.sin(a)*rx,2.0+t*(top-2.0),Math.cos(a)*rz];
  },segments,24);add(body,bodice,dress);
  // Sewn waist band and top binding follow the actual square neckline.
  add(body,surface((a,t)=>[Math.sin(a)*(.216+t*.001),1.985+t*.055,Math.cos(a)*.147],segments,2),trim);
  tube(body,trim,[[-.21,2.355,.112],[-.13,2.355,.15],[0,2.355,.155],[.13,2.355,.15],[.21,2.355,.112]],.006,24);
  for(const s of [-1,1])tube(body,trim,[[s*.13,2.02,.117],[s*.15,2.15,.146],[s*.18,2.31,.149],[s*.20,2.355,.12]],.0028,20,4);

  const skirtGeometry=surface((a,t)=>{
    const radius=.214+Math.pow(1-t,.78)*.315;
    const fold=(Math.sin(a*14+.15+t*.2)*.028+Math.sin(a*23+t*.8)*.006)*Math.pow(1-t,1.15);
    const r=radius+fold;return[Math.sin(a)*r,.66+1.34*t,Math.cos(a)*r*.78];
  },high?96:48,high?24:16);
  const skirt=new THREE.Mesh(skirtGeometry,dress);skirt.name='Eva pleated A-line skirt';skirt.castShadow=true;skirt.receiveShadow=true;body.add(skirt);
  const rest=skirtGeometry.attributes.position.array.slice();
  // Hem piping uses the same pleated contour, and is animated with the fabric.
  const hem=surface((a,t)=>{const r=.53+Math.sin(a*14+.15)*.028+Math.sin(a*23)*.006;return[Math.sin(a)*r,.664+t*.014,Math.cos(a)*r*.78];},high?96:48,1);
  const hemMesh=new THREE.Mesh(hem,trim);hemMesh.castShadow=true;body.add(hemMesh);
  const hemRest=hem.attributes.position.array.slice();

  const arms=[-1,1].map(s=>{
    const shoulder=joint(body,`shoulder ${s}`,s*.315,2.48),elbow=joint(shoulder,`elbow ${s}`,0,-.43),hand=joint(elbow,`hand ${s}`,0,-.41);
    shoulder.rotation.z=s*.07;
    limb(shoulder,.43,[[0,.073,.073],[.3,.070,.074],[1,.051,.055]]);
    const sleeve=surface((a,t)=>{
      const r=profile([[0,.075],[.28,.133],[.64,.122],[1,.074]],t)[0]*(1+.065*Math.cos(a*10));
      return[Math.sin(a)*r,-t*.28,Math.cos(a)*r];
    },high?32:20,14,null,true);add(shoulder,sleeve,dress);
    add(shoulder,new THREE.CylinderGeometry(.075,.077,.035,24),trim,0,-.27);
    limb(elbow,.41,[[0,.052,.056],[.25,.058,.055],[.8,.035,.038],[1,.032,.034]]);
    ellipsoid(elbow,skin,0,0,0,.052,.055,.055);
    ellipsoid(hand,skin,0,-.065,.005,.046,.081,.022);
    for(let j=0;j<4;j++) {
      const x=(j-1.5)*.021,len=[.085,.106,.101,.076][j];
      tube(hand,skin,[[x,-.10,.008],[x,-.13,.018],[x,-.10-len,.022]],.009,8,6);
    }
    tube(hand,skin,[[s*.036,-.035,.006],[s*.061,-.077,.018],[s*.055,-.107,.024]],.013,10,6);
    return {shoulder,elbow,hand};
  });

  const head=joint(body,'head',0,2.69);
  const headGeometry=surface((a,t)=>{
    const [rx,rz]=profile([[0,.018,.035],[.06,.055,.065],[.18,.105,.10],[.32,.15,.132],[.5,.178,.151],[.7,.175,.156],[.88,.16,.14],[.97,.09,.08],[1,.002,.002]],t);
    const x=Math.sin(a)*rx,front=Math.max(0,Math.cos(a));let z=Math.cos(a)*rz;
    const gauss=(c,w)=>Math.exp(-(((t-c)/w)**2));
    z+=front**8*(.047*Math.exp(-((x/.032)**2))*gauss(.38,.075)+.022*Math.exp(-((x/.023)**2))*gauss(.52,.15)+.012*gauss(.17,.07));
    return[x,t*.5,z];
  },high?64:40,high?40:24,(p,a,t)=>Math.cos(a)>0?[THREE.MathUtils.clamp(.5+p[0]/.43,0,1),t]:[.02,.97]);
  add(head,headGeometry,face);
  for(const s of [-1,1])ellipsoid(head,skin,s*.171,.26,-.006,.022,.05,.028);

  const hairRoot=joint(head,'wavy hair',0,0);
  // Crown shell; its lower edge exposes the forehead and temples in front.
  add(hairRoot,surface((a,t)=>{
    const edge=Math.cos(a)>0 ? .88+.68*Math.pow(Math.abs(Math.sin(a)),.7) : 1.76;
    const phi=t*edge,r=.204;
    return[Math.sin(a)*Math.sin(phi)*r,.295+Math.cos(phi)*.237,Math.cos(a)*Math.sin(phi)*.20];
  },segments,20,null,true),hair);
  // Continuous under-layer prevents see-through gaps between locks in profile.
  add(hairRoot,surface((angle,t)=>{
    const a=.85+angle/(Math.PI*2)*(Math.PI*2-1.7);
    const r=profile([[0,.208],[.18,.235],[.5,.21],[.8,.195],[1,.12]],t)[0];
    return[Math.sin(a)*r,-.13+t*.6+Math.cos(a*5)*.007,Math.cos(a)*r*.82-.012];
  },segments,20),hair);
  // Broad overlapping elliptical locks with a thin ridge, not spherical curls.
  function lock(points,width,thickness,index,radial=new THREE.Vector3(0,0,1)) {
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    const g=surface((a,t)=>{
      const p=curve.getPoint(t),tangent=curve.getTangent(t);
      const u=radial.clone().cross(tangent).normalize();if(u.lengthSq()<.1)u.copy(axisX);
      const v=tangent.clone().cross(u).normalize(),taper=Math.pow(Math.sin(Math.PI*(.08+.91*t)),.45);
      return p.addScaledVector(u,Math.cos(a)*width*taper).addScaledVector(v,Math.sin(a)*thickness*taper).toArray();
    },8,high?30:20);add(hairRoot,g,index%5===0?hairSheen:hair);
  }
  for(let j=0;j<16;j++) {
    const a=.9+j/15*(Math.PI*2-1.8),sx=Math.sin(a),sz=Math.cos(a);
    const points=[];
    for(let k=0;k<7;k++) {
      const t=k/6,rad=.07+.155*Math.sin(Math.min(1,t*1.9)*Math.PI/2)+.022*Math.sin(t*10+j*.55);
      points.push([sx*rad,.49-.64*t,sz*rad*.82-.018]);
    }
    lock(points,.054,.026,j,new THREE.Vector3(sx,0,sz));
  }
  for(const s of [-1,1])for(let j=0;j<3;j++) {
    const off=j*.018;
    lock([[s*(.012+off),.51,.035],[s*(.12+off),.47,.132],[s*(.20+off),.35,.123],[s*(.202+off),.19,.11],[s*(.24+off),.03,.10],[s*(.215+off),-.13,.075]],.043-j*.004,.024,j+1);
  }
  // Fine central part; scalp-colored sliver is mostly hidden between the locks.
  tube(hairRoot,skin,[[0,.525,.015],[0,.516,.065],[0,.495,.105]],.003,10,4);

  // Merge stationary parts by material within each joint to bound draw calls.
  for(const [parent,byMat] of batches)for(const [mat,geometries] of byMat) {
    const g=mergeGeometries(geometries);geometries.forEach(g=>g.dispose());
    const mesh=new THREE.Mesh(g,mat);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);
  }
  const shadowMat=new THREE.MeshBasicMaterial({color:'#263022',transparent:true,opacity:.12,depthWrite:false});owned.push(shadowMat);
  const shadow=new THREE.Mesh(new THREE.CircleGeometry(.42,32).rotateX(-Math.PI/2),shadowMat);shadow.position.y=.012;root.add(shadow);
  let phase=0,blend=0,disposed=false,lastCloth=null;
  const stats={triangles:0,drawCalls:0};root.traverse(o=>{if(o.isMesh){stats.drawCalls++;stats.triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;}});
  return {root,arms:arms.map(a=>a.shoulder),joints,stats,
    animate(dt,speed,t) {
      if(disposed)return;
      const step=Math.min(.1,Math.max(0,dt)),move=Math.min(1,Math.max(0,speed));
      blend+=(move-blend)*(1-Math.exp(-step*14));
      if(blend<.001)blend=0;else if(blend>.999)blend=1;
      const run=Math.max(0,Math.min(1,(speed-1)/.8));
      phase+=step*(10.5+run*2.5)*move;
      const swing=Math.sin(phase)*(.29+.12*run)*blend;
      body.position.y=-(.085+.085*run)*blend+Math.abs(Math.sin(phase))*.012*blend+Math.sin(t*1.9)*.003*(1-blend);
      body.rotation.x=.012*blend+.02*run*blend;body.rotation.z=Math.sin(phase)*.008*blend;
      legs.forEach((leg,i)=>{
        // Two-link IK targets a planted sole during stance and lifts it on swing.
        const p=phase+i*Math.PI,z=Math.cos(p)*(.43+.25*run)*blend;
        const lift=Math.max(0,-Math.sin(p))*(.12+.14*run)*blend;
        const ankleY=(.163+lift-body.position.y+z*Math.sin(body.rotation.x))/Math.cos(body.rotation.x);
        const down=1.75-ankleY,d=Math.min(1.5899,Math.hypot(down,z));
        const alpha=Math.acos(THREE.MathUtils.clamp((.77**2+d*d-.82**2)/(2*.77*d),-1,1));
        const knee=Math.PI-Math.acos(THREE.MathUtils.clamp((.77**2+.82**2-d*d)/(2*.77*.82),-1,1));
        leg.hip.rotation.x=Math.atan2(-z,down)-alpha;
        leg.knee.rotation.x=knee;
        leg.ankle.rotation.x=-leg.hip.rotation.x-knee-body.rotation.x;
      });
      arms.forEach((arm,i)=>{
        const s=i===0?-1:1;arm.shoulder.rotation.x=s*swing*.7;
        arm.shoulder.rotation.z=s*(.07+.012*Math.sin(t*1.6)*(1-blend));
        arm.elbow.rotation.x=-.10-.3*run*blend;
      });
      head.rotation.y=Math.sin(t*.52)*.035*(1-blend);head.rotation.z=Math.sin(phase)*.012*blend;
      hairRoot.rotation.x=Math.sin(phase+.5)*.018*blend;hairRoot.rotation.z=Math.sin(t*1.5)*.01;
      // Idle/frozen cloth has no new pose: avoid rebuilding normals or uploading
      // identical vertex buffers for the player and every background traveller.
      if(lastCloth && lastCloth[0]===phase && lastCloth[1]===blend && lastCloth[2]===run)return;
      lastCloth=[phase,blend,run];
      const legLines=legs.map(leg=>{
        const a=leg.hip.rotation.x,b=a+leg.knee.rotation.x;
        const knee=[1.75-.77*Math.cos(a),-.77*Math.sin(a)];
        return [[1.75,0],knee,[knee[0]-.82*Math.cos(b),knee[1]-.82*Math.sin(b)]];
      });
      function cloth(x,y,z) {
        const lower=Math.pow((2-y)/1.34,1.7),radius=(.214+Math.pow((2-y)/1.34,.78)*.315)*.78;
        let front=radius,back=-radius;
        for(const line of legLines)for(let j=0;j<2;j++){
          const a=line[j],b=line[j+1];if(y>a[0]||y<b[0])continue;
          const zz=THREE.MathUtils.lerp(a[1],b[1],(a[0]-y)/(a[0]-b[0]));
          front=Math.max(front,zz+.105);back=Math.min(back,zz-.105);
        }
        const angleWeight=Math.pow(Math.min(1,Math.abs(z)/radius),.5);
        const clearance=z>0?Math.max(0,front-radius):-Math.max(0,-back-radius);
        return[x*(1+.025*blend*lower),y,z+clearance*angleWeight+Math.sin(phase)*.018*blend*lower];
      }
      const p=skirtGeometry.attributes.position;
      for(let i=0;i<p.count;i++) {
        p.setXYZ(i,...cloth(rest[i*3],rest[i*3+1],rest[i*3+2]));
      }
      p.needsUpdate=true;skirtGeometry.computeVertexNormals();
      const hp=hem.attributes.position;
      for(let i=0;i<hp.count;i++)hp.setXYZ(i,...cloth(hemRest[i*3],hemRest[i*3+1],hemRest[i*3+2]));
      hp.needsUpdate=true;hem.computeVertexNormals();
    },dispose(){if(disposed)return;disposed=true;root.removeFromParent();root.traverse(o=>{if(o.isMesh)o.geometry.dispose();});owned.forEach(m=>m.dispose());weave.dispose();}
  };
}
