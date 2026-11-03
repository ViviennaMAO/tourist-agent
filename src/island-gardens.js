import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { inPlot,plotPoint } from './island-layout.js';
import { chamferedBox } from './chamfered-box.js';

/** Small planted courts occupy the gaps between villas, leaving the opposite
 * side of each frond open. Positions are deterministic and share six batches. */
export function createIslandGardens({THREE,city,plots,stoneMaterial,leafTexture}){
  const root=new THREE.Group();root.name='Palm island — planted courts';
  const ctx=city.w.ctx,parts=new Map(),beds=[],tiles=[];let seed=22071,enabled=false,disposed=false;
  const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const stone=stoneMaterial.clone();stone.onBeforeCompile=stoneMaterial.onBeforeCompile;stone.customProgramCacheKey=stoneMaterial.customProgramCacheKey;stone.color.set('#c8bda6');
  const soil=new THREE.MeshStandardMaterial({color:'#62533a',roughness:1});
  const leaf=new THREE.MeshStandardMaterial({color:leafTexture?'#bfc9a1':'#58733a',map:leafTexture||null,alphaTest:.4,side:THREE.DoubleSide,roughness:.92});
  const dark=leaf.clone();dark.color.set(leafTexture?'#96ad81':'#364f29');
  const pink=new THREE.MeshStandardMaterial({color:'#b94f78',side:THREE.DoubleSide,roughness:.9});
  const white=pink.clone();white.color.set('#eee4c8');
  const materials=[stone,soil,leaf,dark,pink,white];
  function add(g,m){if(g.index){const ng=g.toNonIndexed();g.dispose();g=ng;}if(!parts.has(m))parts.set(m,[]);parts.get(m).push(g);}
  function box(b,m,u,y,v,w,h,d){const [x,z]=plotPoint(b,u,v);add(chamferedBox(w,h,d,.012).rotateY(b.ry||0).translate(x,y,z),m);}
  for(const f of ctx.fronds||[]){
    const villas=plots.filter(p=>p.frond===f);if(!villas.length)continue;
    const L=Math.hypot(f.B[0]-f.A[0],f.B[1]-f.A[1]),dx=(f.B[0]-f.A[0])/L,dz=(f.B[1]-f.A[1])/L;
    for(let t=3.4;t<L-.8;t+=1.35){
      const cx=f.A[0]+dx*t,cz=f.A[1]+dz*t,near=villas.reduce((a,b)=>Math.hypot(cx-a.x,cz-a.z)<Math.hypot(cx-b.x,cz-b.z)?a:b),side=near.side;
      const b={x:cx-dz*side*.84,z:cz+dx*side*.84,w:1.12,d:.64,ry:f.ang};
      const corners=[[-.56,-.32],[.56,-.32],[.56,.32],[-.56,.32]].map(([u,v])=>plotPoint(b,u,v));
      if(corners.some(([x,z])=>plots.some(p=>inPlot(p,x,z,.42)))||(ctx.palms||[]).some(p=>inPlot(b,p.x,p.z,.45)))continue;
      beds.push(b);box(b,soil,0,1.045,0,b.w,.07,b.d);
      for(const sign of [-1,1])box(b,stone,0,1.07,sign*.31,b.w,.14,.055);
      for(const sign of [-1,1])box(b,stone,sign*.54,1.07,0,.055,.14,.57);
      for(let i=0;i<115;i++){
        const u=(rand()-.5)*.98,v=(rand()-.5)*.50,[x,z]=plotPoint(b,u,v),y=1.13+rand()*(.15+.24*Math.sin((u+.55)*2.9));
        add(new THREE.PlaneGeometry(.13,.21).rotateX(-.5+rand()*1.5).rotateY(rand()*6.28).rotateZ(rand()*3).translate(x,y,z),i%3?leaf:dark);
      }
      for(let i=0;i<20;i++){
        const [x,z]=plotPoint(b,(rand()-.5)*.95,(rand()-.5)*.48),y=1.30+rand()*.18;
        for(let k=0;k<4;k++)add(new THREE.CircleGeometry(.032,3).rotateX(-1.1).rotateY(k*1.57).translate(x+Math.cos(k*1.57)*.028,y,z+Math.sin(k*1.57)*.028),beds.length%4===0?pink:white);
      }
    }
    // Individual entry aprons keep the doors connected to the free side lane.
    for(const p of villas){for(let k=0;k<3;k++){
      const [x,z]=plotPoint(p,(k-1)*.66,p.d/2+.13);
      const tile={x,z,w:.64,d:.23,ry:p.ry};box(tile,stone,0,1.018,0,.64,.026,.23);tiles.push(tile);
    }}
  }
  for(const [m,gs] of parts){const g=mergeGeometries(gs);gs.forEach(v=>v.dispose());const mesh=new THREE.Mesh(g,m);mesh.receiveShadow=true;mesh.castShadow=m!==soil;root.add(mesh);}
  city.w.root.add(root);root.visible=false;ctx.orientedObstacles??=[];
  return {root,beds,tiles,stats:{islandBeds:beds.length,triangles:root.children.reduce((s,m)=>s+m.geometry.attributes.position.count/3,0),drawCalls:root.children.length},apply(){},setEnabled(value){if(disposed||enabled===!!value)return;enabled=!!value;root.visible=enabled;if(enabled)ctx.orientedObstacles.push(...beds);else for(const b of beds){const i=ctx.orientedObstacles.indexOf(b);if(i>=0)ctx.orientedObstacles.splice(i,1);}},dispose(){if(disposed)return;this.setEnabled(false);disposed=true;root.removeFromParent();root.children.forEach(m=>m.geometry.dispose());materials.forEach(m=>m.dispose());}};
}
