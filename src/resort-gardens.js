import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { inPlot,plotPoint } from './island-layout.js';
import { pointInPolygon } from './shore-profile.js';
import { chamferedBox } from './chamfered-box.js';

const corners=(b,pad=0)=>[-1,1].flatMap(u=>[-1,1].map(v=>plotPoint(b,u*(b.w/2+pad),v*(b.d/2+pad))));
const roadDistance=(x,z,r)=>{const dx=r.B[0]-r.A[0],dz=r.B[1]-r.A[1],t=Math.max(0,Math.min(1,((x-r.A[0])*dx+(z-r.A[1])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-r.A[0]-t*dx,z-r.A[1]-t*dz);};

/** Conservative planted plots: all corners ashore, hotel volume excluded,
 * central approach clear, and a continuous inner crescent lane reserved. */
export function planResortGardens(ctx,hotelBounds=[]){
  const plots=[],c=ctx.crescent;
  const add=b=>{
    const pts=corners(b,.12);
    if(!pts.every(([x,z])=>(ctx.islands||[]).some(i=>i.outline&&pointInPolygon(i.outline,x,z))))return;
    if((ctx.palms||[]).some(p=>inPlot(b,p.x,p.z,.38)))return;
    if(pts.some(([x,z])=>hotelBounds.some(q=>inPlot(q,x,z,.25))))return;
    if(pts.some(([x,z])=>(ctx.roads||[]).some(r=>r.kind!=='canal'&&roadDistance(x,z,r)<r.hw+.3)))return;
    plots.push(b);
  };
  if(c){
    const A=c.deg*Math.PI/180;
    // Deliberate gaps at palm roots, hotel frontage and crescent ends.
    for(let phi=-A+.13,k=0;phi<A-.1;phi+=.105,k++){
      if(Math.abs(phi)<.42)continue;
      const r=c.R+c.w/2-.43;
      add({x:c.cx+r*Math.sin(phi),z:c.cz+r*Math.cos(phi),w:1.65+(k%3)*.22,d:.42,ry:phi,zone:'crescent',height:.42+(k%3)*.09,pink:k%4===0});
    }
  }
  // Front gardens flank, rather than fill, the hotels' central approaches.
  for(const sign of [-1,1]){
    add({x:sign*1.95,z:49.65,w:1.15,d:.48,ry:0,zone:'atlantis',height:.55,pink:false});
    add({x:sign*3.5,z:50.5,w:1.05,d:.5,ry:0,zone:'atlantis',height:.95,pink:true});
    add({x:-50+sign*2.7,z:8.8,w:1.25,d:.40,ry:0,zone:'sail',height:.65,pink:sign<0});
    for(const z of [11.6,12.9])add({x:-50+sign*5.1,z,w:.7,d:.9,ry:0,zone:'sail',height:1.35,pink:z>12});
  }
  return plots;
}

export function hotelPlantingBounds(city){
  const boxes=[],inverse=city.w.root.matrixWorld.clone().invert();
  for(const id of ['atlantis','burj_al_arab']){
    const l=city.LM[id];if(!l?.asset)continue;
    l.holder.updateWorldMatrix(true,true);
    l.asset.traverse(m=>{
      if(!m.isMesh||m.name==='Dubai_FC_Floor')return;
      m.geometry.computeBoundingBox();const b=m.geometry.boundingBox.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,m.matrixWorld));
      boxes.push({x:(b.min.x+b.max.x)/2,z:(b.min.z+b.max.z)/2,w:b.max.x-b.min.x,d:b.max.z-b.min.z});
    });
  }
  return boxes;
}

/** Source hotel podiums are not at island height. Sample their visible surface
 * at every planter corner, rejecting steps instead of floating the soil. */
export function resortGround(city,b){
  const points=[[b.x,b.z],...corners(b)],ys=[],root=city.w.root,world=new THREE.Vector3();
  root.updateWorldMatrix(true,false);
  for(const [x,z] of points){
    let y=1;
    for(const id of ['atlantis','burj_al_arab']){
      const l=city.LM[id];if(!l?.asset)continue;
      world.set(x,4,z).applyMatrix4(root.matrixWorld);
      const hits=new THREE.Raycaster(world,new THREE.Vector3(0,-1,0),0,4).intersectObject(l.asset,true);
      if(hits.length){const local=hits[0].point.clone().applyMatrix4(root.matrixWorld.clone().invert());y=Math.max(y,local.y);}
    }
    ys.push(y);
  }
  const base=Math.max(...ys),foot=Math.min(...ys);
  return base-foot<.32?{base,foot}:null;
}

export function createResortGardens({city,stoneMaterial,leafTexture}){
  const root=new THREE.Group();root.name='Dubai — crescent and hotel gardens';city.w.root.add(root);root.visible=false;
  const beds=[],materials=[],parts=new Map(),ctx=city.w.ctx;ctx.orientedObstacles??=[];
  const stats={resortBeds:0,crescentBeds:0,hotelBeds:0,triangles:0,drawCalls:0};
  let enabled=false,built=false,disposed=false,seed=23031;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const finish=(color,extra={})=>{const m=new THREE.MeshStandardMaterial({color,roughness:.92,...extra});materials.push(m);return m;};
  const stone=stoneMaterial.clone();stone.onBeforeCompile=stoneMaterial.onBeforeCompile;stone.customProgramCacheKey=stoneMaterial.customProgramCacheKey;stone.color.set('#cfc2a9');materials.push(stone);
  const soil=finish('#584a35'),bark=finish('#796049');
  const leaf=finish(leafTexture?'#c6cdab':'#587544',{map:leafTexture||null,alphaTest:.42,side:THREE.DoubleSide}),dark=leaf.clone();dark.color.set(leafTexture?'#a3b78c':'#395b32');materials.push(dark);
  const white=finish('#eee4c9',{side:THREE.DoubleSide}),pink=finish('#bc537e',{side:THREE.DoubleSide});
  function add(g,m){if(g.index){const n=g.toNonIndexed();g.dispose();g=n;}if(!parts.has(m))parts.set(m,[]);parts.get(m).push(g);}
  const box=(b,m,u,y,v,w,h,d)=>{const [x,z]=plotPoint(b,u,v);add(chamferedBox(w,h,d,.012).rotateY(b.ry||0).translate(x,y,z),m);};
  function stem(a,b,r){const delta=b.clone().sub(a);add(new THREE.CylinderGeometry(r*.65,r,delta.length(),4,1,true).applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.clone().normalize())).translate(...a.clone().add(b).multiplyScalar(.5).toArray()),bark);}
  function plant(b){
    const y=b.base,curbHeight=y-b.foot+.14,curbY=b.foot+curbHeight/2;
    box(b,soil,0,y+.07,0,b.w-.06,.10,b.d-.06);
    for(const sign of [-1,1]){box(b,stone,0,curbY,sign*(b.d/2-.025),b.w,curbHeight,.05);box(b,stone,sign*(b.w/2-.025),curbY,0,.05,curbHeight,b.d-.1);}
    for(let i=0;i<Math.ceil(b.w*65);i++){
      const [x,z]=plotPoint(b,(random()-.5)*(b.w-.14),(random()-.5)*(b.d-.10));
      add(new THREE.PlaneGeometry(.13,.20).rotateZ(random()*6.28).rotateX(-1.25+random()*.5).rotateY(b.ry||0).translate(x,y+.14+random()*.08,z),i%3?dark:leaf);
    }
    // Leaves cluster around branching stems, with low groundcover in between.
    const n=Math.ceil(b.w/.45);
    for(let j=0;j<n;j++){
      const u=(j/(n-1)-.5)*(b.w-.36),v=Math.sin(j*2.4)*b.d*.12,h=b.height*(.7+random()*.3),[x,z]=plotPoint(b,u,v);
      const tip=new THREE.Vector3(x+.035,y+.14+h,z);
      stem(new THREE.Vector3(x,y+.10,z),tip,b.height>1?.023:.009);
      for(let k=0;k<96;k++){
        const angle=random()*6.28,rr=Math.sqrt(random()),yy=random()*2-1;
        const [px,pz]=plotPoint(b,u+Math.cos(angle)*.30*rr,v+Math.sin(angle)*Math.min(.10,b.d*.20)*rr),py=y+.15+h*.55+yy*h*.35;
        add(new THREE.PlaneGeometry(.11,.18).rotateX(-.8+random()*2).rotateY(angle).rotateZ(random()*3).translate(px,py,pz),k%4?leaf:dark);
      }
      for(let k=0;k<6;k++){
        const a=random()*6.28,[px,pz]=plotPoint(b,u+Math.cos(a)*.23,v+Math.sin(a)*.09),py=y+.14+h*(.7+random()*.25);
        stem(new THREE.Vector3(x,y+.18,z),new THREE.Vector3(px,py,pz),.003);
        for(let petal=0;petal<4;petal++){const g=new THREE.CircleGeometry(b.pink?.045:.031,3);g.setIndex([1,2,3]);add(g.rotateX(-1.0).rotateY(petal*1.57).translate(px+Math.cos(petal*1.57)*.025,py,pz+Math.sin(petal*1.57)*.025),b.pink?pink:white);}
      }
    }
  }
  function build(){
    city.w.root.updateWorldMatrix(true,true);
    const bounds=hotelPlantingBounds(city);
    for(const b of planResortGardens(ctx,bounds)){
      const level=b.zone==='crescent'?{base:1,foot:1}:resortGround(city,b);if(level===null)continue;
      beds.push({...b,...level});plant(beds.at(-1));
    }
    for(const [m,geos] of parts){const geo=mergeGeometries(geos);geos.forEach(g=>g.dispose());const mesh=new THREE.Mesh(geo,m);mesh.castShadow=m!==soil;mesh.receiveShadow=true;root.add(mesh);}parts.clear();
    Object.assign(stats,{resortBeds:beds.length,crescentBeds:beds.filter(b=>b.zone==='crescent').length,hotelBeds:beds.filter(b=>b.zone!=='crescent').length,triangles:root.children.reduce((n,m)=>n+m.geometry.attributes.position.count/3,0),drawCalls:root.children.length});
    built=true;if(enabled)ctx.orientedObstacles.push(...beds);
  }
  return {root,beds,stats,apply(){if(disposed||built)return;if(['atlantis','burj_al_arab'].every(id=>!city.LM[id]||city.LM[id].loaded||city.LM[id].failed))build();},setEnabled(v){if(disposed||enabled===!!v)return;enabled=!!v;root.visible=enabled;if(built){if(enabled)ctx.orientedObstacles.push(...beds);else for(const b of beds){const i=ctx.orientedObstacles.indexOf(b);if(i>=0)ctx.orientedObstacles.splice(i,1);}}},dispose(){if(disposed)return;this.setEnabled(false);disposed=true;root.removeFromParent();root.children.forEach(m=>m.geometry.dispose());materials.forEach(m=>m.dispose());}};
}
