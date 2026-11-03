import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { pointInPolygon } from './shore-profile.js';

const overlap=(a,b,pad)=>Math.abs(a.x-b.x)<(a.w+b.w)/2+pad&&Math.abs(a.z-b.z)<(a.d+b.d)/2+pad;
/** Low edge gardens frame the existing promenade, leaving the central approach
 * and a continuous inner walking lane. Test full envelopes, not just centers. */
export function planPromenadeGardens(ctx,exclusions=[]) {
  const beds=[],candidates=[];
  for(const sign of [-1,1])for(const z of [-23,-33,-43,-63,-75])
    candidates.push({x:sign*60,z,w:1.5,d:5.2,zone:'side'});
  for(const x of [-57,-46,8,18,32,44,56])candidates.push({x,z:-8.1,w:4.3,d:1.35,zone:'waterfront'});
  for(const b of candidates){
    const points=[[-1,-1],[-1,1],[1,-1],[1,1]].map(([sx,sz])=>[b.x+sx*(b.w/2+.12),b.z+sz*(b.d/2+.12)]);
    if(!points.every(([x,z])=>(ctx.islands||[]).some(i=>i.id==='mainland'&&pointInPolygon(i.outline,x,z))))continue;
    if(!ctx.free(b.x,b.z,b.w+.2,b.d+.2)||exclusions.some(q=>overlap(b,q,.8)))continue;
    if((ctx.palms||[]).some(p=>overlap(b,{...p,w:.7,d:.7},.5))||beds.some(q=>overlap(b,q,1.5)))continue;
    const heights=points.map(([x,z])=>ctx.groundY(x,z));
    if(Math.max(...heights)-Math.min(...heights)>.06)continue;
    beds.push({...b,base:Math.max(...heights)});
  }
  return beds;
}

function roundedOutline(w,d){
  const r=Math.min(.38,w*.25,d*.25),s=new THREE.Shape();
  s.moveTo(-w/2+r,-d/2);s.lineTo(w/2-r,-d/2);s.quadraticCurveTo(w/2,-d/2,w/2,-d/2+r);
  s.lineTo(w/2,d/2-r);s.quadraticCurveTo(w/2,d/2,w/2-r,d/2);s.lineTo(-w/2+r,d/2);
  s.quadraticCurveTo(-w/2,d/2,-w/2,d/2-r);s.lineTo(-w/2,-d/2+r);s.quadraticCurveTo(-w/2,-d/2,-w/2+r,-d/2);return s;
}

export function createPromenadeGardens({city,stoneMaterial,leafTexture,exclusions=[]}){
  const ctx=city.w.ctx,footprints=planPromenadeGardens(ctx,exclusions),root=new THREE.Group();root.name='Dubai — promenade flower borders';
  const stone=stoneMaterial.clone();stone.onBeforeCompile=stoneMaterial.onBeforeCompile;stone.customProgramCacheKey=stoneMaterial.customProgramCacheKey;stone.color.set('#c9bca3');
  const finish=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.92,...extra});
  const soil=finish('#554b36'),green=finish('#ccd2af',{map:leafTexture||null,alphaTest:.42,side:THREE.DoubleSide}),dark=green.clone();dark.color.set('#a5bd91');
  const white=finish('#eee7d3',{side:THREE.DoubleSide}),pink=finish('#be517d',{side:THREE.DoubleSide}),stem=finish('#687746');
  const parts=new Map([stone,soil,green,dark,white,pink,stem].map(m=>[m,[]]));
  let seed=28013;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  function add(g,m){if(g.index){const flat=g.toNonIndexed();g.dispose();g=flat;}parts.get(m).push(g);}
  for(const [index,b] of footprints.entries()){
    const rim=roundedOutline(b.w,b.d),hole=roundedOutline(b.w-.16,b.d-.16);rim.holes.push(new THREE.Path(hole.getPoints(6).reverse()));
    add(new THREE.ExtrudeGeometry(rim,{depth:.14,bevelEnabled:false,curveSegments:6}).rotateX(-Math.PI/2).translate(b.x,b.base,b.z),stone);
    add(new THREE.ShapeGeometry(hole,6).rotateX(-Math.PI/2).translate(b.x,b.base+.085,b.z),soil);
    // Clusters of different height sit in a continuous low carpet. Small flowers
    // rise through the foliage instead of forming identical floating spheres.
    const long=b.zone==='side'?b.d:b.w,n=Math.ceil(long/.5);
    for(let j=0;j<n;j++){
      const along=(j/(n-1)-.5)*(long-.85),x=b.x+(b.zone==='side'?0:along),z=b.z+(b.zone==='side'?along:0);
      const height=.20+.16*(.5+.5*Math.sin(j*1.8+index)),radius=.28;
      for(let k=0;k<76;k++){
        const a=random()*6.283,r=Math.sqrt(random())*radius,yy=Math.pow(random(),1.6);
        const g=new THREE.PlaneGeometry(.14,.21).rotateX(-1.35+random()*.85).rotateY(a).rotateZ(random()*2);
        g.translate(x+Math.cos(a)*r,b.base+.13+height*yy,z+Math.sin(a)*r);add(g,k%3?green:dark);
      }
      for(let k=0;k<6;k++){
        const a=random()*6.283,px=x+Math.cos(a)*.22,pz=z+Math.sin(a)*.22,py=b.base+.18+height*(.35+random()*.65);
        add(new THREE.CylinderGeometry(.003,.005,py-b.base-.1,3).translate(px,(py+b.base+.1)/2,pz),stem);
        const phase=random()*Math.PI*2,tilt=.12+random()*.28;
        for(let petal=0;petal<4;petal++){
          const a=phase+petal*Math.PI/2,r=index%4===1?.036:.025,g=new THREE.CircleGeometry(r,4);
          // Lift the perimeter around the recessed center: four small curved
          // petals catch different light rather than reading as a flat parasol.
          const p=g.attributes.position;
          for(let v=1;v<p.count;v++)p.setZ(v,.007+.003*(p.getY(v)/r));
          g.scale(.78,1,1);g.computeVertexNormals();
          g.rotateZ(a).rotateX(-Math.PI/2+tilt).rotateY(phase*.3);
          add(g.translate(px+Math.cos(a)*.024,py,pz+Math.sin(a)*.024),index%4===1?pink:white);
        }
      }
    }
  }
  for(const [material,geometries] of parts)if(geometries.length){const geometry=mergeGeometries(geometries);geometries.forEach(g=>g.dispose());const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);}
  city.w.root.add(root);root.visible=false;let enabled=false,disposed=false;
  const stats={promenadeBeds:footprints.length,triangles:root.children.reduce((n,m)=>n+m.geometry.attributes.position.count/3,0),drawCalls:root.children.length};
  return {root,footprints,stats,apply(){},setEnabled(v){if(disposed||enabled===!!v)return;enabled=!!v;root.visible=enabled;
    if(enabled)ctx.rects.push(...footprints);else for(const b of footprints){const i=ctx.rects.indexOf(b);if(i>=0)ctx.rects.splice(i,1);}
  },dispose(){if(disposed)return;this.setEnabled(false);disposed=true;root.removeFromParent();root.children.forEach(m=>m.geometry.dispose());for(const m of parts.keys())m.dispose();}};
}
