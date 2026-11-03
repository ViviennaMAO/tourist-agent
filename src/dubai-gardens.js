import { createCurvedLeaf } from './curved-leaf.js';
import { installLeafDaylight } from './leaf-daylight.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { chamferedBox } from './chamfered-box.js';
import { createPavingSurface } from './walk-surfaces.js';
import { pointInPolygon } from './shore-profile.js';

const intersects = (a,b,gap=.65) => Math.abs(a.x-b.x)<(a.w+b.w)/2+gap && Math.abs(a.z-b.z)<(a.d+b.d)/2+gap;

/** Landscape connections between the old town and the skyline. Occupancy is
 * checked against source roads/landmarks AND all other refinement footprints. */
export function createDubaiGardens({THREE,city,stoneMaterial,leafTexture=null,exclusions=[]}) {
  const ctx=city.w.ctx,root=new THREE.Group(); root.name='Dubai — district gardens and rear promenade';
  const batches=new Map(),materials=[],footprints=[],surfaces=[],edging=[];
  let enabled=false,disposed=false,seed=19031,trees=0;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  function finish(color,extra={}) { const m=new THREE.MeshStandardMaterial({color,roughness:.9,...extra});materials.push(m);return m; }
  const stone=stoneMaterial.clone();stone.onBeforeCompile=stoneMaterial.onBeforeCompile;stone.customProgramCacheKey=stoneMaterial.customProgramCacheKey;
  stone.color.set('#cfc4ad'); materials.push(stone);
  const soil=finish('#4a4231'),bark=finish('#77604b');
  // Preserve small-leaf coverage in mipmaps instead of clipping whole distant crowns.
  const leafOptions={side:THREE.DoubleSide,...(leafTexture?{map:leafTexture,alphaTest:.24,alphaToCoverage:true}:{}),envMapIntensity:.4};
  const greens=[finish(leafTexture?'#c3c8ad':'#4a6836',leafOptions),finish(leafTexture?'#e0dfba':'#708049',leafOptions)];
  greens.forEach(installLeafDaylight);
  const flowers=[finish('#f2e8ce',{side:THREE.DoubleSide}),finish('#b9547a',{side:THREE.DoubleSide})];
  const paving=[finish('#c3b9a6'),finish('#c8beac'),finish('#beb5a4')];
  function add(g,m) { if(!g.index)g.setIndex(Array.from({length:g.attributes.position.count},(_,i)=>i));if(!batches.has(m))batches.set(m,[]);batches.get(m).push(g); }
  const box=(m,x,y,z,w,h,d)=>add(new THREE.BoxGeometry(w,h,d).translate(x,y,z),m);
  const up=new THREE.Vector3(0,1,0);
  function branch(a,b,r) {const delta=b.clone().sub(a);add(new THREE.CylinderGeometry(r*.55,r,delta.length(),r<.01?3:5,1,true).applyQuaternion(new THREE.Quaternion().setFromUnitVectors(up,delta.clone().normalize())).translate(...a.clone().add(b).multiplyScalar(.5).toArray()),bark);}
  function leaves(x,y,z,rx,ry,rz,count,size=.12,groundcover=false,curved=false) {
    for(let i=0;i<count;i++) {
      const az=random()*Math.PI*2,yy=random()*2-1,rr=Math.sqrt(1-yy*yy)*Math.cbrt(random());
      const g=curved?createCurvedLeaf(THREE,size,1,false):new THREE.PlaneGeometry(size*1.45,size*2.1,!groundcover&&size>=.12?2:1,1),p=g.attributes.position;
      if(!curved)for(let j=0;j<p.count;j++)p.setZ(j,(1-Math.abs(p.getX(j))/(size*.725))*.018);
      g.computeVertexNormals();
      if(groundcover)g.rotateZ(random()*2.8).rotateX(-Math.PI/2+(random()-.5)*.5).rotateY(az);
      else g.rotateX(-.9+random()*2).rotateY(az).rotateZ(random()*2.8);
      g.translate(x+Math.cos(az)*rx*rr,y+yy*ry,z+Math.sin(az)*rz*rr);add(g,greens[i%2]);
    }
  }
  function plant(b,index) {
    const heights=[ctx.groundY(b.x,b.z),ctx.groundY(b.x-b.w/2,b.z),ctx.groundY(b.x+b.w/2,b.z)];
    const base=Math.min(...heights),y=Math.max(...heights),rim=.13,curbHeight=y-base+.25;
    // Rounded dressed-stone curbs with open earth, no large green solid blob.
    if(b.pocket) {
      const outline=(w,d,r)=>{
        const s=new THREE.Shape();s.moveTo(-w/2+r,-d/2);s.lineTo(w/2-r,-d/2);s.quadraticCurveTo(w/2,-d/2,w/2,-d/2+r);
        s.lineTo(w/2,d/2-r);s.quadraticCurveTo(w/2,d/2,w/2-r,d/2);s.lineTo(-w/2+r,d/2);
        s.quadraticCurveTo(-w/2,d/2,-w/2,d/2-r);s.lineTo(-w/2,-d/2+r);s.quadraticCurveTo(-w/2,-d/2,-w/2+r,-d/2);return s;
      };
      const curb=outline(b.w,b.d,.65),earth=outline(b.w-.26,b.d-.26,.52);
      curb.holes.push(new THREE.Path(earth.getPoints(5).reverse()));
      add(new THREE.ExtrudeGeometry(curb,{depth:curbHeight,bevelEnabled:false,curveSegments:5}).rotateX(-Math.PI/2).translate(b.x,base,b.z),stone);
      add(new THREE.ShapeGeometry(earth,5).rotateX(-Math.PI/2).translate(b.x,y+.17,b.z),soil);
    } else {
      box(soil,b.x,y+.14,b.z,b.w-.15,.18,b.d-.15);
      for(const sign of [-1,1]) {
        add(chamferedBox(b.w,curbHeight,rim,.018).translate(b.x,base+curbHeight/2+.005,b.z+sign*(b.d-rim)/2),stone);
        add(chamferedBox(rim,curbHeight,b.d-.26,.018).translate(b.x+sign*(b.w-rim)/2,base+curbHeight/2+.005,b.z),stone);
      }
    }
    const rows=b.pocket?Math.ceil(b.d/.72):b.border?Math.ceil(b.d/.5):3,cols=b.pocket?5:b.border?3:9;
    for(let row=0;row<rows;row++)for(let col=0;col<cols;col++) {
      const px=b.x+(col/(cols-1)-.5)*(b.w-.65)+(random()-.5)*.08;
      const pz=b.z+(row/(rows-1)-.5)*(b.d-.65)+(random()-.5)*.08;
      const tall=b.pocket?.06+.12*Math.sin(row*1.3+col*2.1):b.border&&col===1?.2+.14*Math.sin(row*1.7):0;
      // Slightly larger leaf cards retain coverage with fewer hidden overlaps.
      if(b.pocket){
        leaves(px,y+.255,pz,.34,.045,.39,16,.16,true);
        leaves(px,y+.43+tall,pz,.25,.12,.28,3,.118);
        // Fine open twigs tie the upper leaf tufts to the low carpet.
        {
          const a=row,tip=new THREE.Vector3(px+Math.cos(a)*.16,y+.48+tall,pz+Math.sin(a)*.16);
          branch(new THREE.Vector3(px,y+.19,pz),tip,.004);
        }
      } else leaves(px,y+.43+random()*.13+tall,pz,.27,.26+tall*.4,.29,b.border?28:19,.118);
      if(b.border)leaves(px,y+.3,pz,.31,.045,.31,12,.11,true);
    }
    const sprays=b.pocket?Math.ceil(b.d*2.4):b.border?Math.ceil(b.d*2):7;
    for(let i=0;i<sprays;i++) {
      const x=b.border||b.pocket?b.x+Math.sin(i*2.4)*b.w*.21:b.x+(i-3)*(b.w-.65)/7;
      const z=b.border||b.pocket?b.z+(i/(sprays-1)-.5)*(b.d-.85):b.z+Math.sin(i*2.4+index)*b.d*.19;
      // Small flower sprays sit among foliage, each on a visible fine stem.
      for(let k=0;k<4;k++) {
        const a=random()*6.28,px=x+Math.cos(a)*.2,pz=z+Math.sin(a)*.18,py=y+.56+random()*.22;
        branch(new THREE.Vector3(px,y+.24,pz),new THREE.Vector3(px+.025,py,pz),.004);
        for(let petal=0;petal<5;petal++) {
          const turn=petal*Math.PI*2/5;
          const petalGeometry=new THREE.CircleGeometry(.025,3);petalGeometry.setIndex([1,2,3]);
          add(petalGeometry.rotateX(-Math.PI/2+.2).translate(px+Math.cos(turn)*.025,py,pz+Math.sin(turn)*.025),flowers[index%3===0?1:0]);
        }
      }
    }
    // Middle-height canopies join the flower beds to the palm/high-rise scale.
    if(!b.border&&(b.pocket||index%2===0)) {
      trees++;const height=3.0+random()*.85,x=b.x+.15*Math.sin(index),z=b.z;
      const a=new THREE.Vector3(x,y+.2,z),fork=new THREE.Vector3(x+.09,y+height*.65,z+.035);
      const bend=new THREE.Vector3(x-.055,y+height*.33,z+.065);
      branch(a,bend,.085);branch(bend,fork,.063);
      for(let k=0;k<5;k++) {
        const angle=k*2.39996+random()*.35,reach=.38+random()*.37,tip=new THREE.Vector3(x+Math.cos(angle)*reach,y+height-.35+random()*.85,z+Math.sin(angle)*reach*.85);
        branch(fork,tip,.033);
        for(let twig=0;twig<3;twig++) {
          const end=tip.clone().add(new THREE.Vector3(Math.cos(angle+twig*2.1)*.30,.12+twig*.08,Math.sin(angle+twig*2.1)*.26));
          branch(tip,end,.010);leaves(end.x,end.y,end.z,.40,.46,.38,18,.104,false,true);
        }
      }
    }
  }
  // Plots follow three planted bands with deliberate gaps, then smaller side
  // gardens. Rejected candidates never create geometry or collision records.
  const candidates=[];
  // Larger planted rooms occupy the bare outer pads. Keep the x=56 walking
  // lane and the road-end ramps open; existing occupancy may reject a plot.
  for(const x of [-59.5,59.5])for(const z of [-25,-39,-65,-77])candidates.push({x,z,w:3.6,d:7.4,pocket:true});
  // Long, low mixed borders along the raised lawn edge; openings remain at
  // street ends and wherever existing buildings or landmarks need clearance.
  for(const x of [-48.45,48.45])for(const z of [-23,-31,-39])candidates.push({x,z,w:1.5,d:6.4,border:true});
  for(const z of [-64.8,-74.8])for(let i=0;i<13;i++)candidates.push({x:-55+i*8.7+Math.sin(i*1.9)*.55,z:z+Math.sin(i*2.7)*.65,w:3.2+(i%3)*.22,d:2.1});
  for(const z of [-22,-34,-43,-57])for(const x of [-54,-39,-28,-12,12,27,39,54])candidates.push({x,z,w:3.3,d:2.1});
  for(const x of [-46,-40,-27,-13,12,18,24,30,41,47])candidates.push({x,z:-37,w:3.3,d:2.1});
  const palmRoots=(ctx.palms||[]).map(p=>({x:p.x,z:p.z,w:.7,d:.7}));
  for(const b of candidates) {
    if(b.pocket){
      const corners=[[-1,-1],[-1,1],[1,-1],[1,1]].map(([sx,sz])=>[b.x+sx*(b.w/2+.1),b.z+sz*(b.d/2+.1)]);
      if(ctx.islands&&!corners.every(([x,z])=>ctx.islands.some(i=>i.id==='mainland'&&i.outline&&pointInPolygon(i.outline,x,z))))continue;
      const heights=corners.map(([x,z])=>ctx.groundY(x,z));if(Math.max(...heights)-Math.min(...heights)>.06)continue;
    }
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
        add(g,paving[(row*11+col*7)%9===0?1:(row+col)%7===0?2:0]);surfaces.push({x:cx,z:cz,w:width,d:depth,y:heights[0]+.016});
      }
    }
  }
  // A thin retaining edge and a flush apron replace the raw lawn/sand join.
  // Omit pieces covered by planted borders; never place a curb across a road.
  for(const sign of [-1,1])for(let z=-45.4;z<-20;z+=1.2) {
    const b={x:sign*48.12,z,w:.24,d:1.188};
    if(!ctx.free(b.x,b.z,b.w,b.d)||footprints.some(q=>intersects(b,q,.02))||exclusions.some(q=>intersects(b,q,.1)))continue;
    if(ctx.groundY(sign*47.9,z)<1.2)continue;
    add(chamferedBox(.24,.32,1.188,.018).translate(b.x,1.17,z),stone);edging.push(b);
  }
  for(const sign of [-1,1])for(let z=-46;z<-20;z+=.9) {
    const depth=Math.min(.9,-20-z),cx=sign*48.62,cz=z+depth/2;
    const b={x:cx,z:cz,w:.76,d:depth};
    if(footprints.some(q=>intersects(b,q,0)))continue;
    add(new THREE.PlaneGeometry(.748,depth-.012).rotateX(-Math.PI/2).translate(cx,1.016,cz),paving[0]);
    surfaces.push({...b,y:1.016});
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
      ramps.push({x,z,width,length:1.45,upper:1.334,lower:1.018});
    }
  }
  const dunes=[];city.w.root.traverse(o=>{if(o.userData.dubaiRearDune)dunes.push({mesh:o,visible:o.visible});});
  for(const [m,parts] of batches) {
    const g=mergeGeometries(parts);parts.forEach(p=>p.dispose());const mesh=new THREE.Mesh(g,m);
    mesh.receiveShadow=true;mesh.castShadow=!paving.includes(m);if(paving.includes(m))mesh.userData.skipContact=true;root.add(mesh);
  }
  city.w.root.add(root);root.visible=false;
  const walkSurface=createPavingSurface(surfaces,ramps);ctx.walkSurfaces??=[];
  const stats={gardens:footprints.length,borders:footprints.filter(b=>b.border).length,pockets:footprints.filter(b=>b.pocket).length,trees,pavers:surfaces.length,ramps:ramps.length,edging:edging.length,triangles:root.children.reduce((n,m)=>n+m.geometry.index.count/3,0),drawCalls:root.children.length};
  return {root,footprints,surfaces,ramps,edging,stats,apply(){if(enabled&&!disposed)for(const d of dunes){d.visible=d.visible||d.mesh.visible;d.mesh.visible=false;}},setEnabled(v){
    if(disposed||enabled===!!v)return;enabled=!!v;root.visible=enabled;
    if(enabled){ctx.rects.push(...footprints);ctx.walkSurfaces.push(walkSurface);}
    else {for(const r of footprints){const i=ctx.rects.indexOf(r);if(i>=0)ctx.rects.splice(i,1);}const i=ctx.walkSurfaces.indexOf(walkSurface);if(i>=0)ctx.walkSurfaces.splice(i,1);for(const d of dunes)d.mesh.visible=d.visible;}
  },dispose(){if(disposed)return;this.setEnabled(false);disposed=true;root.removeFromParent();root.children.forEach(m=>m.geometry.dispose());materials.forEach(m=>m.dispose());}};
}
