import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** Coastal public realm. Objects reserve reversible collision footprints and
 * leave roads, existing buildings, landmarks and the spawn corridor clear. */
export function createDubaiLandscape({ THREE, city, stoneMaterial, waterMaterial, leafTexture=null, exclusions=[] }) {
  const root = new THREE.Group(); root.name = 'Dubai — waterfront public realm';
  const ctx = city.w.ctx, batches = new Map(), ownedMaterials = [], colliders = [];
  let enabled = false, disposed = false, seed = 21973;
  const random = () => { seed = (Math.imul(seed,1664525)+1013904223)>>>0; return seed/4294967296; };
  function material(color, roughness = .85, options = {}) {
    const m = new THREE.MeshStandardMaterial({color,roughness,...options}); ownedMaterials.push(m); return m;
  }
  const stone = stoneMaterial.clone(); stone.onBeforeCompile = stoneMaterial.onBeforeCompile;
  stone.customProgramCacheKey = stoneMaterial.customProgramCacheKey; ownedMaterials.push(stone);
  const dark = material('#393c30',.64,{metalness:.55}), wood = material('#99784d'), soil = material('#4e4935');
  const leafOptions={side:THREE.DoubleSide,envMapIntensity:.4,...(leafTexture ? {map:leafTexture,alphaTest:.42,bumpMap:leafTexture,bumpScale:.006} : {})};
  const greens = [material(leafTexture?'#c6cbb2':'#344f28',.88,leafOptions),material(leafTexture?'#f0edd0':'#657b3b',.86,leafOptions)];
  const bloom = [material('#b7446e',.88,{side:THREE.DoubleSide}),material('#f1e7c9',.9,{side:THREE.DoubleSide})];
  const lamp = material('#ffe1a0',.4,{emissive:'#ffc06a',emissiveIntensity:1.0});
  const fabric = material('#e9dcc1');
  const cube = new THREE.BoxGeometry(1,1,1), matrix = new THREE.Matrix4(), quat = new THREE.Quaternion();
  const up = new THREE.Vector3(0,1,0), unit = new THREE.Vector3(1,1,1);
  function add(geo, mat, x=0,y=0,z=0,ry=0) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    geo.dispose(); quat.setFromAxisAngle(up,ry); matrix.compose(new THREE.Vector3(x,y,z),quat,unit); g.applyMatrix4(matrix);
    if (!batches.has(mat)) batches.set(mat,[]); batches.get(mat).push(g);
  }
  function box(mat,x,y,z,w,h,d,ry=0) { add(cube.clone().scale(w,h,d),mat,x,y,z,ry); }
  function cylinder(mat,x,y,z,rt,rb,h,n=10) { add(new THREE.CylinderGeometry(rt,rb,h,n),mat,x,y,z); }
  const reserved = [];
  function reserve(x,z,w,d) {
    if (!ctx.free(x,z,w,d)) return false;
    if (exclusions.some(q=>Math.abs(x-q.x)<(w+q.w)/2+.45&&Math.abs(z-q.z)<(d+q.d)/2+.45)) return false;
    if (reserved.some(q=>Math.abs(x-q.x)<(w+q.w)/2+.45&&Math.abs(z-q.z)<(d+q.d)/2+.45)) return false;
    const r={x,z,w,d}; reserved.push(r); colliders.push(r); return true;
  }
  // Tiled pedestrian surfaces: modest offsets follow each existing ground level.
  for (const [x,z,w,d] of [[-24,-8.9,46,6.0],[24,-8.9,46,6.0],[-20,-25,23,12],[20,-25,23,12]]) {
    box(stone,x,ctx.groundY(x,z)+.006,z,w,.012,d);
  }
  // Rock revetment along the mainland shore; entrances at x=0 and -50 stay open.
  const rocks = material('#998d76',.98);
  for (let x=-60; x<61; x+=.66) {
    if (Math.abs(x)<3.4 || Math.abs(x+50)<3.4 || (exclusions.length && x>-33 && x<-7)) continue;
    const z=-4.75 + .12*Math.sin(x*1.5);
    add(new THREE.DodecahedronGeometry(.43+random()*.16,0).scale(.8+random()*.3,.7,.75).rotateX(random()*1.8),rocks,x,.48+random()*.12,z,random()*6.28);
    add(new THREE.DodecahedronGeometry(.25+random()*.16,0).scale(1,.6,.8),rocks,x+.18,.2,z+.15,random()*6.28);
    box(stone,x,1.015,-4.9,.68,.1,.48);
  }
  // Three irregular courses of rough limestone sit below a separate cut-stone
  // coping. Vertex colour carries mineral variation and the darker wet toe.
  if (exclusions.length) {
    const quarry=material('#ffffff',.96,{vertexColors:true});
    quarry.userData.pilotRevetment=true;
    quarry.onBeforeCompile=shader=>{
      shader.vertexShader='varying vec3 quarryPosition;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nquarryPosition=position;');
      shader.fragmentShader=`varying vec3 quarryPosition;
        float quarryHash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
        float quarryNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
          return mix(mix(mix(quarryHash(i),quarryHash(i+vec3(1,0,0)),f.x),mix(quarryHash(i+vec3(0,1,0)),quarryHash(i+vec3(1,1,0)),f.x),f.y),
          mix(mix(quarryHash(i+vec3(0,0,1)),quarryHash(i+vec3(1,0,1)),f.x),mix(quarryHash(i+vec3(0,1,1)),quarryHash(i+vec3(1,1,1)),f.x),f.y),f.z);}
        `+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
        float quarryGrain=quarryNoise(quarryPosition*29.);
        diffuseColor.rgb*=.88+.22*quarryGrain;
      `);
      shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
        float relief=quarryGrain*.018+quarryNoise(quarryPosition*9.)*.035;
        vec3 dx=dFdx(-vViewPosition),dy=dFdy(-vViewPosition);
        vec3 rx=cross(dy,normal),ry=cross(normal,dx);float det=dot(dx,rx);
        normal=normalize(abs(det)*normal-sign(det)*(dFdx(relief)*rx+dFdy(relief)*ry));
      `);
    };
    quarry.customProgramCacheKey=()=> 'pilot-quarry-v1';
    for(let row=0;row<3;row++) {
      let edge=-33;
      while(edge<-7) {
        const width=Math.min(.52+random()*.57,-7-edge),x=edge+width/2;
        edge+=width;
        const g=new THREE.BoxGeometry(2,2,2,3,2,2);
        const a=g.attributes.position,colors=[];
        const tint=new THREE.Color(['#a3957e','#b5a68b','#c4b49a','#bbaa90'][Math.floor(random()*4)]);
        for(let j=0;j<a.count;j++) {
          const point=new THREE.Vector3().fromBufferAttribute(a,j);
          const core=point.clone().clampScalar(-.82,.82);
          point.sub(core).normalize().multiplyScalar(.18).add(core);
          const px=point.x,py=point.y,pz=point.z;
          // Coordinate-based displacement keeps coincident vertices together.
          const n=Math.sin(px*31.7+py*53.3+pz*19.1+x*7.1);
          const yy=.18+row*.29+py*.22;
          a.setXYZ(j,px*(width-.018)*.5+n*.018,py*(.135+Math.sin(x*3)*.012)+n*.009,pz*(.24+row*.025)+n*.055);
          const c=tint.clone().multiplyScalar((yy<.22?.64:yy<.36?.82:1)*(.9+n*.10));
          colors.push(c.r,c.g,c.b);
        }
        g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();
        add(g,quarry,x,.18+row*.29,-4.68+(random()-.5)*.08);
      }
    }
    const coping=material('#d0c4ad',.86);
    for(let j=0;j<32;j++) box(coping,-33+(j+.5)*26/32,1.06,-4.91,26/32-.018,.12,.6);
  }
  // Small raised beds with actual individual leaves and flowering clusters.
  function foliage(x,y,z,r,flowers=false,fine=false,dense=false) {
    for (let j=0;j<(dense?88:fine?56:leafTexture?48:32);j++) {
      const angle=random()*6.28, radius=r*Math.sqrt(random()), h=r*.65*Math.sqrt(1-radius*radius/(r*r))*(.35+random()*.65);
      const px=x+Math.cos(angle)*radius, pz=z+Math.sin(angle)*radius;
      // Pointed elliptical leaves with a raised midrib; irregular orientation
      // catches light without looking like low-poly balls or flat confetti.
      const length=fine?.055+random()*.05:.105+random()*.095,width=length*(.35+random()*.12);
      let leaf;
      if(leafTexture) {
        // Alpha-tested folded cards keep visible veins and smooth leaf edges.
        // Four triangles per leaf allow denser clusters at the same mesh budget.
        leaf=new THREE.PlaneGeometry(length*2.1,length*2.1,2,1).rotateX(-Math.PI/2);
        const a=leaf.attributes.position;
        for(let k=0;k<a.count;k++) a.setY(k,.012*(1-Math.abs(a.getX(k))/length)-Math.max(0,a.getZ(k))*.12);
        leaf.computeVertexNormals();
      } else {
      leaf = new THREE.BufferGeometry();
      leaf.setAttribute('position',new THREE.Float32BufferAttribute([
        0,0,-length, -width,0,-length*.25, -width*.85,-.008,length*.48,
        0,-.025,length, width*.85,-.008,length*.48, width,0,-length*.25, 0,.022,0
      ],3));
      leaf.setIndex([0,6,1,1,6,2,2,6,3,3,6,4,4,6,5,5,6,0]);leaf.computeVertexNormals();
      }
      leaf.rotateX(random()*.9-.35).rotateZ(random()*1.2-.6);
      add(leaf,greens[j%2],px,y+h,pz,angle);
      if (flowers&&j%(dense?4:leafTexture?9:6)===0) {
        const blossom=bloom[dense ? ((j/4)%5===0?1:0) : (j%4===0?1:0)];
        // Small three-bract blossoms sit above foliage, interspersed with buds.
        for(let petal=0;petal<3;petal++) {
          const a=petal*Math.PI*2/3;
          const g=new THREE.CircleGeometry((dense?.045:.03)+random()*.025,5).scale(1,.76,1).rotateX(-Math.PI*(.28+random()*.25));
          add(g,blossom,px+Math.cos(a)*.035,y+h+.065,pz+Math.sin(a)*.035,a);
        }
        add(new THREE.TetrahedronGeometry(.018,0),bloom[1],px,y+h+.073,pz);
      }
    }
  }
  function bed(x,z,w=2.4,d=.9,flowers=true) {
    if (!reserve(x,z,w,d)) return;
    const y=ctx.groundY(x,z);
    box(stone,x,y+.24,z,w,.48,d); box(soil,x,y+.485,z,w-.18,.015,d-.18);
    for(const sign of [-1,1]) box(stone,x,y+.49,z+sign*(d/2-.045),w,.08,.09);
    const n=Math.ceil((w-.5)/.34);
    for (let i=0;i<n;i++) foliage(x-w/2+.3+(w-.6)*i/(n-1),y+.48+random()*.12,z+(random()-.5)*.25,.23+random()*.09,flowers);
  }
  for (const x of [-43,-36,-29,-12,12,21,29,38,44]) bed(x,-6.8,3.2,.85);
  for (const [x,z] of [[-27,-20],[-15,-20],[15,-20],[27,-20],[-28,-34],[28,-38],[-10,-45],[10,-45]]) bed(x,z,2.4,1.1);
  if(exclusions.length) {
    // Two low, dense mixed borders close the bare strip behind the café. They
    // remain outside both continuous fountain-to-street pedestrian corridors.
    for(const x of [-25,-15]) {
      const z=-12.55, y=ctx.groundY(x,z);
      if(!reserve(x,z,2.3,.85)) continue;
      box(stone,x,y+.19,z,2.3,.38,.85);
      box(soil,x,y+.39,z,2.12,.015,.67);
      for(let j=0;j<7;j++) foliage(x-.9+j*.3,y+.40+random()*.13,z+(random()-.5)*.22,.26+random()*.08,true,false,true);
    }
    // Roof planters and cascading bougainvillea are attached only to buildings
    // which were actually placed; the building already owns their collision.
    for(const b of exclusions) {
      const left=b.x<-20, innerX=b.x+(left?1:-1)*.9;
      const y=ctx.groundY(b.x,b.z)+(left?5.8:6.1);
      box(stone,innerX,y+.13,b.z+.65,.52,.34,2.8);
      box(soil,innerX,y+.31,b.z+.65,.38,.015,2.64);
      for(let j=0;j<8;j++) {
        const z=b.z-.45+j*.3;
        foliage(innerX,y+.34,z,.30,true,false,true);
        if(j%2===0) for(let drop=0,n=3+Math.floor(random()*3);drop<n;drop++) {
          foliage(innerX+(left?1:-1)*(.28+drop*.07),y+.14-drop*.20,z+(random()-.5)*.16,.17+random()*.07,true,true,true);
        }
      }
    }
  }
  // Layered small-leaf crowns add middle-height shade between low beds and palms.
  // Their entire crowns stay inside reserved planting footprints.
  for (const [x,z] of [...(exclusions.length?[[-25.1,-6.9],[-14.9,-6.9]]:[]),[-39,-10],[-33,-7.5],[17,-7.5],[33,-7.5],[-13,-25],[13,-25],[-25,-36],[28,-43]]) {
    const pilot=z===-6.9;
    if (!reserve(x,z,pilot?1.8:2.8,pilot?1.8:2.8)) continue;
    const y=ctx.groundY(x,z);
    cylinder(stone,x,y+.22,z,pilot?.72:1.1,pilot?.8:1.2,.44,24);
    cylinder(soil,x,y+.45,z,pilot?.67:.95,pilot?.67:.95,.035,24);
    cylinder(wood,x,y+1.55,z,.055,.12,2.3,8);
    for(let branch=0;branch<9;branch++) {
      const a=branch*2.39996, r=.3+random()*.35, cy=y+2.4+random()*.95;
      const end=new THREE.Vector3(x+Math.cos(a)*r,cy,z+Math.sin(a)*r), start=new THREE.Vector3(x,y+1.8,z);
      const delta=end.clone().sub(start), limb=new THREE.CylinderGeometry(.022,.045,delta.length(),6);
      limb.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(up,delta.clone().normalize()));
      add(limb,wood,...start.clone().add(end).multiplyScalar(.5).toArray());
      for(let cluster=0;cluster<3;cluster++) {
        const tip=end.clone().add(new THREE.Vector3((random()-.5)*.35,(random()-.5)*.45,(random()-.5)*.35));
        const delta=tip.clone().sub(end);
        const twig=new THREE.CylinderGeometry(.007,.015,delta.length(),5);
        twig.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(up,delta.clone().normalize()));
        add(twig,wood,...end.clone().add(tip).multiplyScalar(.5).toArray());
        foliage(tip.x,tip.y,tip.z,.35,false,pilot);
      }
    }
    foliage(x,y+.55,z,pilot?.6:.8,true,pilot);
  }
  // Keep all substantial decorations outside the traversable carriageway.
  function bench(x,z,ry=0) {
    if (!reserve(x,z,2.1,.85)) return;
    const y=ctx.groundY(x,z), point=(a,b)=>[x+Math.cos(ry)*a+Math.sin(ry)*b,z-Math.sin(ry)*a+Math.cos(ry)*b];
    for (const dz of [-.24,-.08,.08,.24]) { const [xx,zz]=point(0,dz); box(wood,xx,y+.5,zz,1.95,.075,.11,ry); }
    for (const dy of [.73,.91]) { const [xx,zz]=point(0,-.29); box(wood,xx,y+dy,zz,1.95,.12,.07,ry); }
    for (const dx of [-.78,.78]) { const [xx,zz]=point(dx,0); box(dark,xx,y+.26,zz,.065,.5,.65,ry); const [bx,bz]=point(dx,-.29); box(dark,bx,y+.68,bz,.05,.65,.06,ry); }
  }
  for (const x of [-28,-12,12,28,42]) bench(x,-10.5);
  function lantern(x,z) {
    if (!reserve(x,z,.28,.28)) return;
    const y=ctx.groundY(x,z);
    cylinder(dark,x,y+.12,z,.17,.22,.24);
    cylinder(dark,x,y+1.65,z,.045,.065,3.1,8);
    box(lamp,x,y+3.15,z,.19,.46,.19);
    for (const a of [-1,1]) for (const b of [-1,1]) box(dark,x+a*.13,y+3.15,z+b*.13,.025,.52,.025);
    box(dark,x,y+2.88,z,.32,.06,.32); add(new THREE.ConeGeometry(.27,.16,4).rotateY(Math.PI/4),dark,x,y+3.48,z);
  }
  for (const x of [-44,-30,-16,16,30,44]) lantern(x,-12.3);
  // A compact waterfront fountain, in the open beach strip away from the road.
  const fountainX=-20, fountainZ=-9.4, fountainR=2.4;
  const jetMeshes=[];
  const fountainTime={value:0};
  if (reserve(fountainX,fountainZ,5.3,5.3)) {
    const y=ctx.groundY(fountainX,fountainZ);
    cylinder(stone,fountainX,y+.21,fountainZ,2.5,2.6,.42,80);
    let basinMaterial=waterMaterial;
    if(exclusions.length) {
      // A small shallow basin has centimetre-scale ripples and visible caustics;
      // reusing the ocean shader here made the fountain read as a flat blue disc.
      basinMaterial=new THREE.ShaderMaterial({
        uniforms:{uTime:fountainTime},
        vertexShader:`varying vec2 vUv; varying vec3 vWorld;
          void main(){vUv=uv;vec4 p=modelMatrix*vec4(position,1.);vWorld=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}`,
        fragmentShader:`uniform float uTime; varying vec2 vUv; varying vec3 vWorld;
          void main(){
            vec2 p=(vUv-.5)*4.8;float t=uTime;
            float r=max(length(p),.001);float wave=sin(r*28.-t*4.);
            vec2 slope=p/r*cos(r*28.-t*4.)*.045;
            slope+=vec2(cos(p.x*15.+p.y*9.+t*1.7),sin(p.y*19.-p.x*7.-t*2.))*.035;
            vec3 N=normalize(vec3(-slope.x,1.,-slope.y));
            vec3 V=normalize(cameraPosition-vWorld);
            float fresnel=pow(1.-max(dot(N,V),0.),4.);
            float a=sin(p.x*12.+sin(p.y*8.+t*.6)+t*.8);
            float b=sin(p.y*13.+sin(p.x*9.-t*.7)-t*.5);
            float caustic=pow(max(0.,1.-abs(a+b)*1.6),7.);
            vec3 col=mix(vec3(.055,.23,.24),vec3(.27,.46,.49),.3+fresnel*.55);
            col+=vec3(.24,.32,.26)*caustic*.45;
            col+=vec3(.18,.23,.22)*pow(max(wave,0.),12.)*exp(-r*.8)*.22;
            float sun=pow(max(dot(N,normalize(V+normalize(vec3(-.9,.85,1.05)))),0.),100.);
            col+=vec3(1.,.87,.65)*sun*.65;
            gl_FragColor=vec4(col,1.);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`
      });
      ownedMaterials.push(basinMaterial);
      // Repeated ivory diamonds and recessed bronze-blue tesserae form a
      // continuous frieze; two restrained stone courses frame the ornament.
      const mosaic=material('#617f79',.72);
      for(let j=0;j<80;j++) {
        const a=j/80*Math.PI*2, xx=fountainX+Math.sin(a)*2.555, zz=fountainZ+Math.cos(a)*2.555;
        add(new THREE.BoxGeometry(.12,.12,.018).rotateZ(Math.PI/4),mosaic,xx,y+.235,zz,a);
      }
      for(const yy of [y+.075,y+.38]) add(new THREE.TorusGeometry(2.56,.025,4,80).rotateX(Math.PI/2),stone,fountainX,yy,fountainZ);
    }
    const water=new THREE.Mesh(new THREE.CircleGeometry(fountainR,64).rotateX(-Math.PI/2),basinMaterial);
    water.position.set(fountainX,y+.435,fountainZ); root.add(water);
    const rim=new THREE.TorusGeometry(2.48,.10,8,80).rotateX(Math.PI/2); add(rim,stone,fountainX,y+.46,fountainZ);
    const spray=material('#d4e7df',.15,{transparent:true,opacity:.72,depthWrite:false});
    for(let j=0;j<7;j++) {
      const angle=j/7*Math.PI*2;
      const a=new THREE.Vector3(Math.cos(angle)*1.1,0,Math.sin(angle)*1.1);
      const curve=new THREE.QuadraticBezierCurve3(a,a.clone().multiplyScalar(.45).setY(2),new THREE.Vector3(0,0,0));
      const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,16,.026,4,false),spray);
      mesh.position.set(fountainX,y+.46,fountainZ); root.add(mesh); jetMeshes.push(mesh);
    }
  }
  // Café tables with quiet linen canopies, replacing the original beach umbrellas.
  for (const [x,z,small] of [...(exclusions.length?[[-25,-10.4,true],[-15,-10.4,true]]:[]),[-39,-8.6,false],[-6,-8.6,false],[7,-8.6,false],[36,-8.6,false]]) {
    if (!reserve(x,z,small?2.4:3.4,small?2.4:3.2)) continue;
    const y=ctx.groundY(x,z);
    cylinder(dark,x,y+.5,z,.065,.09,1); cylinder(wood,x,y+1.02,z,.65,.65,.08,24);
    cylinder(wood,x,y+1.6,z,.035,.035,3.2,8);
    const canopyRadius=small?1.15:1.6;
    add(new THREE.ConeGeometry(canopyRadius,.42,12),fabric,x,y+3.2,z,Math.PI/8);
    for(let j=0;j<12;j++) {
      const a=j/12*Math.PI*2+Math.PI/8, b=(j+1)/12*Math.PI*2+Math.PI/8;
      const start=new THREE.Vector3(x,y+3.41,z), end=new THREE.Vector3(x+Math.sin(a)*canopyRadius,y+2.99,z+Math.cos(a)*canopyRadius);
      const rib=new THREE.CylinderGeometry(.009,.012,start.distanceTo(end),4);
      rib.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(up,end.clone().sub(start).normalize()));
      add(rib,wood,...start.clone().add(end).multiplyScalar(.5).toArray());
      // A narrow cloth valance gives the canopy an edge instead of a paper cone.
      const mid=(a+b)/2;
      box(fabric,x+Math.sin(mid)*canopyRadius*.966,y+2.955,z+Math.cos(mid)*canopyRadius*.966,canopyRadius*.518,.09,.018,mid);
    }
    for(const dx of (small?[-.75,.75]:[-.95,.95])) { box(wood,x+dx,y+.53,z,.45,.07,.45); box(wood,x+dx,y+.88,z-.2,.45,.52,.055); for(const a of [-.16,.16]) for(const b of [-.16,.16]) box(dark,x+dx+a,y+.27,z+b,.03,.52,.03); }
  }
  cube.dispose();
  for(const [m,geometries] of batches) {
    const g=mergeGeometries(geometries); geometries.forEach(x=>x.dispose());
    const mesh=new THREE.Mesh(g,m); mesh.castShadow=true; mesh.receiveShadow=true; root.add(mesh);
  }
  city.w.root.add(root); root.visible=false;
  const shore=[], savedPools=[];
  city.w.root.traverse(o=>{if(o.userData.shoreline) shore.push(o);});
  for(const name of ['canopy','pole']) {
    const p=ctx.pools[name]; if(!p) continue;
    for(let i=0;i<p.m.count;i++) savedPools.push({pool:p,index:i,matrix:new THREE.Matrix4(),valid:false});
  }
  const stats={decorations:colliders.length,triangles:root.children.reduce((n,m)=>n+(m.geometry.index?.count||m.geometry.attributes.position.count)/3,0),drawCalls:root.children.length};
  function restore(){savedPools.forEach(s=>{if(s.valid){s.pool.set(s.index,s.matrix);s.pool.flush();s.valid=false;}});shore.forEach(m=>m.visible=true);}
  return {root,stats,apply(time=0){
    if(!enabled||disposed)return;
    fountainTime.value=time;
    savedPools.forEach(s=>{s.pool.m.getMatrixAt(s.index,s.matrix);s.valid=true;s.pool.hide(s.index);});
    for(const p of new Set(savedPools.map(s=>s.pool))) p.flush();
    shore.forEach(m=>m.visible=false);
    jetMeshes.forEach((m,i)=>m.scale.y=.95+.05*Math.sin(time*1.3+i));
  },setEnabled(v){
    if(disposed)return;
    const next=!!v; if(next===enabled)return; enabled=next;root.visible=next;
    if(next)ctx.rects.push(...colliders);
    else {for(const r of colliders){const i=ctx.rects.indexOf(r);if(i>=0)ctx.rects.splice(i,1);}restore();}
  },dispose(){if(disposed)return;this.setEnabled(false);disposed=true;root.removeFromParent();root.children.forEach(m=>m.geometry.dispose());ownedMaterials.forEach(m=>m.dispose());}};
}
