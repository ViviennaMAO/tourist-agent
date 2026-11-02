import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** The old random speeds could stack cars inside each other. Dubai's ambient
 * traffic now uses two evenly spaced directions on the existing mainland loop.
 * This is a deterministic scenic circuit, not a traffic/AI simulation. */
export function spaceDubaiTraffic(cars,loop) {
  if(!cars.length||!loop?.tot)return;
  let length=0;
  const reverse={...loop,segs:[...loop.segs].reverse().map(s=>{
    const segment={a:s.b,b:s.a,len:s.len,s0:length};length+=s.len;return segment;
  })};
  cars.forEach((car,i)=>{
    const backwards=i%2===1,count=backwards?Math.floor(cars.length/2):Math.ceil(cars.length/2);
    car.loop=backwards?reverse:loop;
    car.off=(Math.floor(i/2)+(backwards?.5:0))*loop.tot/count;
    car.v=6;
  });
}

/** Compact sedans follow the original traffic actor matrices. Eight instanced
 * material batches cover the fleet; rotating wheels use four instances/car.
 * Source mesh pools remain reversible. Traffic timing is owned by the world. */
export function createDubaiVehicles({THREE,city}) {
  const root=new THREE.Group();root.name='Dubai — detailed sedan traffic';
  const ctx=city.w.ctx,pools=ctx.pools,cars=ctx.vehicles||[],parts=new Map(),materials=[],batches=[];
  let enabled=true,disposed=false;
  const originals=new Map(),matrix=new THREE.Matrix4(),wheelMatrix=new THREE.Matrix4(),local=new THREE.Matrix4();
  const wheelQ=new THREE.Quaternion(),axis=new THREE.Vector3(1,0,0),unit=new THREE.Vector3(1,1,1);
  const wheelCenters=[-1,1].flatMap(sign=>[-.98,.98].map(z=>new THREE.Vector3(sign*.615,-.01,z)));
  const finish=(name,color,roughness,metalness=0,extra={})=>{
    const m=new THREE.MeshStandardMaterial({color,roughness,metalness,envMapIntensity:1,...extra});
    m.name=name;materials.push(m);parts.set(m,[]);return m;
  };
  const paint=finish('satin automotive paint','#ffffff',.28,.42);
  const glass=finish('smoked blue automotive glass','#233b42',.15,.55,{envMapIntensity:1.8});
  const dark=finish('rubber seals and grille','#191e1d',.8);
  const chrome=finish('brushed brightwork','#a6aaa5',.27,.82);
  const head=finish('headlight lenses','#f4ebd0',.25,.12,{emissive:'#ffedc5',emissiveIntensity:.2});
  const tail=finish('rear light lenses','#771c16',.3,.15,{emissive:'#d72e16',emissiveIntensity:.12});
  const rubber=finish('tire rubber','#202320',.96),alloy=finish('wheel spokes','#8e9695',.32,.8);
  const add=(m,g)=>{if(!g.index)g.setIndex(Array.from({length:g.attributes.position.count},(_,i)=>i));parts.get(m).push(g);};
  const box=(m,x,y,z,w,h,d,r=.015)=>add(m,new RoundedBoxGeometry(w,h,d,1,r).translate(x,y-.28,z));
  function strip(m,a,b,r) {
    const from=new THREE.Vector3(...a),to=new THREE.Vector3(...b),direction=to.clone().sub(from);
    const g=new THREE.CylinderGeometry(r,r,direction.length(),6);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize()));
    g.translate(...from.add(to).multiplyScalar(.5).add(new THREE.Vector3(0,-.28,0)).toArray());add(m,g);
  }
  function quad(m,vertices) {
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices.flatMap(v=>[v[0],v[1]-.28,v[2]]),3));
    g.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,1,1,0,1],2));
    g.setIndex([0,1,2,0,2,3]);g.computeVertexNormals();add(m,g);
  }
  // A genuine wheel-arch profile, extruded across the car. Front is +Z.
  const silhouette=new THREE.Shape();
  silhouette.moveTo(-1.56,.34);silhouette.lineTo(-1.31,.34);
  silhouette.absarc(-.98,.29,.33,Math.PI,0,true);silhouette.lineTo(.65,.34);
  silhouette.absarc(.98,.29,.33,Math.PI,0,true);silhouette.lineTo(1.57,.34);
  silhouette.lineTo(1.59,.55);silhouette.quadraticCurveTo(1.48,.72,1.18,.75);
  silhouette.lineTo(.7,.8);silhouette.lineTo(-.92,.82);silhouette.lineTo(-1.51,.7);silhouette.closePath();
  add(paint,new THREE.ExtrudeGeometry(silhouette,{depth:1.23,steps:1,bevelEnabled:true,bevelSegments:2,bevelSize:.025,bevelThickness:.025,curveSegments:12})
    .translate(0,-.28,-.615).rotateY(-Math.PI/2));
  box(dark,0,.36,0,1.04,.15,1.25);
  box(paint,0,1.32,-.12,.98,.095,1.12,.04);
  // Sloped windscreen and rear window, plus separate trapezoidal side panes.
  quad(glass,[[-.56,.82,.78],[.56,.82,.78],[.46,1.28,.42],[-.46,1.28,.42]]);
  quad(glass,[[.56,.83,-1.01],[-.56,.83,-1.01],[-.46,1.28,-.64],[.46,1.28,-.64]]);
  for(const sign of [-1,1]) {
    const points=[[sign*.565,.84,.72],[sign*.565,.84,-.95],[sign*.465,1.28,-.62],[sign*.465,1.28,.4]];
    quad(glass,sign===1?points:points.reverse());
    strip(paint,[sign*.56,.81,.78],[sign*.46,1.31,.42],.033);
    strip(paint,[sign*.56,.82,-1.01],[sign*.46,1.31,-.64],.04);
    strip(dark,[sign*.567,.84,-.16],[sign*.468,1.28,-.16],.028);
    strip(chrome,[sign*.58,.82,.78],[sign*.58,.82,-.98],.012);
    box(paint,sign*.68,.89,.55,.16,.095,.15,.025);
    box(chrome,sign*.69,.89,.48,.13,.065,.012,.005);
    for(const z of [-.57,.22])box(chrome,sign*.646,.72,z,.016,.033,.14,.008);
    // Fine door shut line and lower sill; kept inside the tire/mirror envelope.
    strip(dark,[sign*.643,.39,-.15],[sign*.643,.79,-.15],.006);
    strip(chrome,[sign*.646,.37,-.6],[sign*.646,.37,.6],.012);
    box(head,sign*.43,.61,1.565,.29,.095,.025,.014);
    box(tail,sign*.43,.62,-1.56,.28,.1,.028,.012);
  }
  box(dark,0,.48,1.597,.55,.13,.018,.018);
  for(let i=-3;i<=3;i++)box(chrome,i*.066,.48,1.61,.013,.1,.012,.003);
  box(chrome,0,.35,1.55,1.12,.037,.035,.012);
  box(chrome,0,.35,-1.54,1.12,.035,.035,.01);
  box(head,0,.47,-1.58,.21,.075,.012,.004);
  // Wheels are authored at their own local origin, so rims rotate without
  // orbiting the car. The rubber shoulder is rounded, the rim has five spokes.
  add(rubber,new THREE.CylinderGeometry(.24,.24,.135,20).rotateZ(Math.PI/2));
  for(const sign of [-1,1])add(rubber,new THREE.TorusGeometry(.207,.063,6,20).rotateY(Math.PI/2).translate(sign*.034,0,0));
  add(alloy,new THREE.CylinderGeometry(.065,.065,.16,12).rotateZ(Math.PI/2));
  for(const sign of [-1,1]) {
    add(alloy,new THREE.TorusGeometry(.16,.012,4,20).rotateY(Math.PI/2).translate(sign*.078,0,0));
    for(let i=0;i<5;i++)add(alloy,new THREE.BoxGeometry(.014,.12,.028).translate(sign*.081,.1,0).rotateX(i*Math.PI*2/5));
  }
  const palette=['#e1d8c1','#e8e9e3','#4b5f60','#464d53','#a9a9a0','#806b5c'];
  let triangles=0;
  for(const [material,geometries] of parts) {
    if(!geometries.length)continue;
    const geometry=mergeGeometries(geometries,false);geometries.forEach(g=>g.dispose());
    const wheels=material===rubber||material===alloy;
    const mesh=new THREE.InstancedMesh(geometry,material,cars.length*(wheels?4:1));
    mesh.name=material.name;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=false;
    mesh.castShadow=true;mesh.receiveShadow=true;
    if(material===paint)cars.forEach((_,i)=>mesh.setColorAt(i,new THREE.Color(palette[i%palette.length])));
    root.add(mesh);batches.push({mesh,wheels});triangles+=geometry.index.count/3*(wheels?4:1);
  }
  city.w.root.add(root);
  function restore() {
    for(const {pool,index,pose} of originals.values())pool.set(index,pose);
    if(originals.size){pools.carBody.flush();pools.carTop.flush();}originals.clear();
  }
  return {root,stats:{vehicles:cars.length,triangles:triangles*cars.length,drawCalls:batches.length},apply(){
    if(!enabled||disposed)return;
    cars.forEach((car,i)=>{
      pools.carBody.m.getMatrixAt(car.i,matrix);
      for(const {mesh,wheels} of batches) {
        if(!wheels)mesh.setMatrixAt(i,matrix);
        else {
          wheelQ.setFromAxisAngle(axis,(car.distance||0)/.27);
          wheelCenters.forEach((center,wheel)=>{
            local.compose(center,wheelQ,unit);
            wheelMatrix.multiplyMatrices(matrix,local);mesh.setMatrixAt(i*4+wheel,wheelMatrix);
          });
        }
      }
      for(const name of ['carBody','carTop']) {
        const pool=pools[name],key=name+':'+car.i;
        if(!originals.has(key))originals.set(key,{pool,index:car.i,pose:new THREE.Matrix4()});
        pool.m.getMatrixAt(car.i,originals.get(key).pose);pool.hide(car.i);
      }
    });
    batches.forEach(({mesh})=>mesh.instanceMatrix.needsUpdate=true);
    if(cars.length){pools.carBody.flush();pools.carTop.flush();}
  },setEnabled(value){enabled=!!value;root.visible=enabled&&!disposed;if(!enabled)restore();},dispose(){
    if(disposed)return;disposed=true;restore();root.removeFromParent();
    batches.forEach(({mesh})=>{mesh.geometry.dispose();mesh.dispose();});materials.forEach(m=>m.dispose());
  }};
}
