import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { chamferedBox } from './chamfered-box.js';

const intersects = (a,b,gap=.65) => Math.abs(a.x-b.x)<(a.w+b.w)/2+gap && Math.abs(a.z-b.z)<(a.d+b.d)/2+gap;

/** Landscape connections between the old town and the skyline. Occupancy is
 * checked against source roads/landmarks AND all other refinement footprints. */
export function createDubaiGardens({THREE,city,stoneMaterial,leafTexture=null,exclusions=[]}) {
  const ctx=city.w.ctx,root=new THREE.Group(); root.name='Dubai — district gardens and rear promenade';
  const batches=new Map(),materials=[],footprints=[],surfaces=[];
  let enabled=false,disposed=false,seed=19031,trees=0;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  function finish(color,extra={}) { const m=new THREE.MeshStandardMaterial({color,roughness:.9,...extra});materials.push(m);return m; }
  const stone=stoneMaterial.clone();stone.onBeforeCompile=stoneMaterial.onBeforeCompile;stone.customProgramCacheKey=stoneMaterial.customProgramCacheKey;
  stone.color.set('#cfc4ad'); materials.push(stone);
  const soil=finish('#4a4231'),bark=finish('#77604b');
  const leafOptions={side:THREE.DoubleSide,...(leafTexture?{map:leafTexture,alphaTest:.42}:{}),envMapIntensity:.4};
  const greens=[finish(leafTexture?'#c3c8ad':'#4a6836',leafOptions),finish(leafTexture?'#e0dfba':'#708049',leafOptions)];
  const flowers=[finish('#f2e8ce',{side:THREE.DoubleSide}),finish('#b9547a',{side:THREE.DoubleSide})];
  const paving=[finish('#c3b9a6'),finish('#c8beac'),finish('#beb5a4')];
  function add(g,m) { if(!g.index)g.setIndex(Array.from({length:g.attributes.position.count},(_,i)=>i));if(!batches.has(m))batches.set(m,[]);batches.get(m).push(g); }
  const box=(m,x,y,z,w,h,d)=>add(new THREE.BoxGeometry(w,h,d).translate(x,y,z),m);
  const up=new THREE.Vector3(0,1,0);
  function branch(a,b,r) {const delta=b.clone().sub(a);add(new THREE.CylinderGeometry(r*.55,r,delta.length(),5,1,true).applyQuaternion(new THREE.Quaternion().setFromUnitVectors(up,delta.clone().normalize())).translate(...a.clone().add(b).multiplyScalar(.5).toArray()),bark);}
  function leaves(x,y,z,rx,ry,rz,count,size=.12) {
    for(let i=0;i<count;i++) {
      const az=random()*Math.PI*2,yy=random()*2-1,rr=Math.sqrt(1-yy*yy)*(.55+random()*.45);
      const g=new THREE.PlaneGeometry(size*1.45,size*2.1,size>=.12?2:1,1),p=g.attributes.position;
      for(let j=0;j<p.count;j++)p.setZ(j,(1-Math.abs(p.getX(j))/(size*.725))*.018);
      g.computeVertexNormals();g.rotateX(-.9+random()*2).rotateY(az).rotateZ(random()*2.8);
      g.translate(x+Math.cos(az)*rx*rr,y+yy*ry,z+Math.sin(az)*rz*rr);add(g,greens[i%2]);
    }
  }
  function plant(b,index) {
    const y=ctx.groundY(b.x,b.z),rim=.13;
    // Rounded dressed-stone curbs with open earth, no large green solid blob.
    box(soil,b.x,y+.14,b.z,b.w-.15,.18,b.d-.15);
    for(const sign of [-1,1]) {
      add(chamferedBox(b.w,.25,rim,.018).translate(b.x,y+.13,b.z+sign*(b.d-rim)/2),stone);
      add(chamferedBox(rim,.25,b.d-.26,.018).translate(b.x+sign*(b.w-rim)/2,y+.13,b.z),stone);
    }
    for(let row=0;row<3;row++)for(let col=0;col<9;col++) {
      const px=b.x+(col-4)*(b.w-.7)/8+(random()-.5)*.08;
      const pz=b.z+(row-1)*(b.d-.85)/2+(random()-.5)*.08;
      leaves(px,y+.43+random()*.13,pz,.27,.26,.26,24,.105);
    }
    for(let i=0;i<7;i++) {
      const x=b.x+(i-3)*(b.w-.65)/7,z=b.z+Math.sin(i*2.4+index)*b.d*.19;
      // Small flower sprays sit among foliage, each on a visible fine stem.
      for(let k=0;k<4;k++) {
        const a=random()*6.28,px=x+Math.cos(a)*.2,pz=z+Math.sin(a)*.18,py=y+.56+random()*.22;
        branch(new THREE.Vector3(px,y+.24,pz),new THREE.Vector3(px+.025,py,pz),.004);
        for(let petal=0;petal<5;petal++) {
          const turn=petal*Math.PI*2/5;
          add(new THREE.CircleGeometry(.025,3).rotateX(-Math.PI/2+.2).translate(px+Math.cos(turn)*.025,py,pz+Math.sin(turn)*.025),flowers[index%3===0?1:0]);
        }
      }
    }
    // Middle-height canopies join the flower beds to the palm/high-rise scale.
    if(index%2===0) {
      trees++;const height=3.0+random()*.85,x=b.x+.15*Math.sin(index),z=b.z;
      const a=new THREE.Vector3(x,y+.2,z),fork=new THREE.Vector3(x+.09,y+height*.65,z+.035);
      const bend=new THREE.Vector3(x-.055,y+height*.33,z+.065);
      branch(a,bend,.085);branch(bend,fork,.063);
      for(let k=0;k<5;k++) {
        const angle=k*2.39996,tip=new THREE.Vector3(x+Math.cos(angle)*.48,y+height+Math.sin(k*1.9)*.22,z+Math.sin(angle)*.25);
        branch(fork,tip,.033);leaves(tip.x,tip.y,tip.z,.57,.48,.38,55,.14);
      }
    }
  }
  // Plots follow three planted bands with deliberate gaps, then smaller side
  // gardens. Rejected candidates never create geometry or collision records.
  const candidates=[];
  for(const z of [-64.8,-74.8])for(let i=0;i<13;i++)candidates.push({x:-55+i*8.7+Math.sin(i*1.9)*.55,z:z+Math.sin(i*2.7)*.65,w:3.2+(i%3)*.22,d:2.1});
  for(const z of [-22,-34,-43,-57])for(const x of [-54,-39,-28,-12,12,27,39,54])candidates.push({x,z,w:3.3,d:2.1});
  for(const x of [-46,-40,-27,-13,12,18,24,30,41,47])candidates.push({x,z:-37,w:3.3,d:2.1});
  const palmRoots=(ctx.palms||[]).map(p=>({x:p.x,z:p.z,w:.7,d:.7}));
  for(const b of candidates) {
    if(!ctx.free(b.x,b.z,b.w,b.d)||palmRoots.some(q=>intersects(b,q,.4))||exclusions.some(q=>intersects(b,q,.9))||footprints.some(q=>intersects(b,q,1.3)))continue;
    footprints.push(b);plant(b,footprints.length-1);
  }
  // Human-scaled slabs replace the bare rear development pad and connect its
  // sides to existing streets. Flat surfaces add no navigation obstacles.
  for(const [x1,z1,x2,z2] of [[-62,-82,62,-58],[-60,-58,-49,-20],[49,-58,60,-20]]) {
    for(let row=0,z=z1;z<z2-.01;row++,z+=.9) {
      const depth=Math.min(.9,z2-z);
      for(let col=0,x=x1;x<x2-.01;col++) {
        const width=Math.min(col===0&&row%2?.9:1.8,x2-x),cx=x+width/2,cz=z+depth/2;
        x+=width;
        const corners=[[cx-width/2,cz-depth/2],[cx+width/2,cz-depth/2],[cx+width/2,cz+depth/2],[cx-width/2,cz+depth/2]];
        const heights=corners.map(([px,pz])=>ctx.groundY(px,pz));
        // Reject a tile straddling a raised land boundary rather than float it.
        if(Math.max(...heights)-Math.min(...heights)>.08)continue;
        const g=new THREE.PlaneGeometry(width-.012,depth-.012).rotateX(-Math.PI/2).translate(cx,heights[0]+.016,cz);
        add(g,paving[(row*11+col*7)%9===0?1:(row+col)%7===0?2:0]);surfaces.push({x:cx,z:cz,w:width,d:depth});
      }
    }
  }
  // Grade down from the two existing rear-road ends to the new side paths.
  // These are walking surfaces, not raised curbs across the route.
  const ramps=[];
  for(const road of ctx.roads||[]) {
    if(road.bridge||road.kind!=='road'||road.A[1]!==-50||road.B[1]!==-50)continue;
    for(const [x,z] of [road.A,road.B]) {
      if(Math.abs(x)!==48)continue;
      const sign=Math.sign(x),width=(road.hw||2.3)*2;
      const positions=[x,1.334,z-width/2,x+sign*1.45,1.018,z-width/2,x+sign*1.45,1.018,z+width/2,x,1.334,z+width/2];
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
      g.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,1,1,0,1],2));
      g.setIndex(sign>0?[0,2,1,0,3,2]:[0,1,2,0,2,3]);g.computeVertexNormals();add(g,paving[0]);
      ramps.push({x,z,width,upper:1.334,lower:1.018});
    }
  }
  const dunes=[];city.w.root.traverse(o=>{if(o.userData.dubaiRearDune)dunes.push({mesh:o,visible:o.visible});});
  for(const [m,parts] of batches) {
    const g=mergeGeometries(parts);parts.forEach(p=>p.dispose());const mesh=new THREE.Mesh(g,m);
    mesh.receiveShadow=true;mesh.castShadow=!paving.includes(m);if(paving.includes(m))mesh.userData.skipContact=true;root.add(mesh);
  }
  city.w.root.add(root);root.visible=false;
  const stats={gardens:footprints.length,trees,pavers:surfaces.length,ramps:ramps.length,triangles:root.children.reduce((n,m)=>n+m.geometry.index.count/3,0),drawCalls:root.children.length};
  return {root,footprints,surfaces,ramps,stats,apply(){if(enabled&&!disposed)for(const d of dunes){d.visible=d.mesh.visible;d.mesh.visible=false;}},setEnabled(v){
    if(disposed||enabled===!!v)return;enabled=!!v;root.visible=enabled;
    if(enabled)ctx.rects.push(...footprints);
    else {for(const r of footprints){const i=ctx.rects.indexOf(r);if(i>=0)ctx.rects.splice(i,1);}for(const d of dunes)d.mesh.visible=d.visible;}
  },dispose(){if(disposed)return;this.setEnabled(false);disposed=true;root.removeFromParent();root.children.forEach(m=>m.geometry.dispose());materials.forEach(m=>m.dispose());}};
}
