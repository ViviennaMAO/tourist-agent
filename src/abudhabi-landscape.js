import * as THREE from 'three';
import {mergeGeometries,mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {chamferedBox} from './chamfered-box.js';
import {createCurvedLeaf} from './curved-leaf.js';
import {installSurfaceFinish} from './surface-finish.js';
import {installLeafDaylight} from './leaf-daylight.js';
import {clearUrbanPlot,createAbuPublicRealm} from './abudhabi-public-realm.js';
import {ABU_OBSTACLES} from './abudhabi-layout.js';
import {ABU_DETAIL_OBSTACLES} from './abudhabi-details.js';

// Keep the two venue arrival axes open, including the connection to the pier.
export const ABU_VENUE_AISLES=[{x:40,z:-43,w:5,d:10},{x:44,z:41,w:5,d:11}];
export function planAbuVenueGrounds(ctx,existing=[]){
 const candidates=[
  {x:64,z:-64,w:4.6,d:2.8,kind:'pergola',site:'ferrari'},
  {x:61,z:-59,w:2.4,d:6,tree:true,site:'ferrari'},
  {x:61,z:-69,w:2.4,d:4,tree:false,site:'ferrari'},
  {x:57,z:-48,w:5,d:2,tree:false,site:'ferrari'},
  {x:22,z:-51,w:3.2,d:3.4,tree:true,site:'ferrari'},
  {x:63,z:23,w:4.6,d:2.8,kind:'pergola',site:'culture'},
  {x:61,z:15,w:3,d:4,tree:true,site:'culture'},
  {x:60,z:32,w:2.2,d:3,tree:false,site:'culture'},
  {x:35,z:11,w:3.4,d:2.4,tree:true,site:'culture'},
  {x:12,z:-50,w:5,d:2.1,tree:false,site:'infill'},
  {x:21,z:-72,w:3,d:3,tree:true,site:'infill'},
 ];
 for(const x of [-65,-57,-45,-38,20,38,65])for(const z of [-70,-52,-10,12,32])candidates.push({x,z,w:4.6,d:2.4,tree:true,site:'infill'});
 const plots=[],reserved=[...existing,...ABU_OBSTACLES,...ABU_DETAIL_OBSTACLES,...ABU_VENUE_AISLES];
 for(const p of candidates){
  if(p.site==='infill'&&plots.filter(q=>q.site==='infill').length>=6)continue;
  if(clearUrbanPlot(ctx,p,[...reserved,...plots]))plots.push({kind:'garden',...p,y:ctx.groundY?.(p.x,p.z)||1});
 }
 return plots;
}

// Analytic sampling follows the original circle/capsule, with finer curvature
// than the early grass mesh. These are internal lake shores, not sea-level walls.
export function lagoonRimSamples(isles,step=.44){
 const samples=[];
 for(const [island,isle] of isles.entries()){
  const pts=[];
  const arc=(x,z,r,a,b,n)=>{for(let i=0;i<=n;i++){const t=a+(b-a)*i/n;pts.push([x+Math.cos(t)*r,z+Math.sin(t)*r]);}};
  if(isle.kind==='circle'){const [[x,z],r]=isle.args;arc(x,z,r,0,Math.PI*2,96);pts.pop();}
  else if(isle.kind==='capsule'){const [[x1,z1,x2,z2],r]=isle.args,a=Math.atan2(z2-z1,x2-x1);arc(x2,z2,r,a-Math.PI/2,a+Math.PI/2,48);arc(x1,z1,r,a+Math.PI/2,a+Math.PI*1.5,48);}
  else continue;
  for(let i=0;i<pts.length;i++){
   const a=pts[i],b=pts[(i+1)%pts.length],dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz);if(L<1e-6)continue;
   const n=Math.ceil(L/step),tx=dx/L,tz=dz/L;
   for(let j=0;j<n;j++)samples.push({x:a[0]+dx*(j+.5)/n,z:a[1]+dz*(j+.5)/n,tx,tz,nx:tz,nz:-tx,length:L/n,island});
  }
 }
 return samples;
}

export function createAbuLandscape({city,leafTexture,existing=[]}){
 const ctx=city.w.ctx,plots=planAbuVenueGrounds(ctx,existing);
 const grounds=createAbuPublicRealm({city,leafTexture,plots});grounds.root.name='Abu Dhabi — venue gardens and shade courts';
 const root=new THREE.Group();root.name='Abu Dhabi — lagoon coping and venue arrival paving';city.w.root.add(root);root.visible=false;
 const materials=[],batches=new Map();
 const material=(color,roughness=.85)=>{const m=new THREE.MeshStandardMaterial({color,roughness});materials.push(m);batches.set(m,[]);return m;};
 const cap=material('#d4c8b1'),rock=material('#a3947c'),wet=material('#746e5d',.52),mortar=material('#7a7364'),paving=material('#c4baa7'),inlay=material('#a0937b'),leaves=material('#b7c39a',.92),flowers=material('#e6dfc9');
 installSurfaceFinish(cap,'limestone');installSurfaceFinish(rock,'limestone');installSurfaceFinish(paving,'paving');
 leaves.map=leafTexture||null;leaves.side=THREE.DoubleSide;leaves.alphaTest=.18;installLeafDaylight(leaves);
 const add=(g,m)=>{if(g.index){const old=g;g=g.toNonIndexed();old.dispose();}batches.get(m).push(g);};
 const box=(m,x,y,z,w,h,d)=>add(chamferedBox(w,h,d,.012).translate(x,y,z),m);
 let seed=92817;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const samples=lagoonRimSamples(ctx.lagoonIsles||[]),leaf=createCurvedLeaf(THREE,.105,.75,false);
 function place(g,s,along,out,y){g.rotateY(-Math.atan2(s.tz,s.tx));g.translate(s.x+s.tx*along+s.nx*out,y,s.z+s.tz*along+s.nz*out);return g;}
 for(const [i,s] of samples.entries()){
  add(place(chamferedBox(s.length+.014,.12,.66,.012),s,0,.25,1.765),cap);
  add(place(new THREE.BoxGeometry(s.length+.02,.36,.13),s,0,.49,1.53),mortar);
  for(let row=0;row<2;row++){
   const phase=(i+row)%4,next=samples[i+1],previous=samples[i-1];
   if(phase===1&&previous?.island===s.island)continue;
   const joined=phase===0&&next?.island===s.island,span=s.length+(joined?next.length:0);
   const g=chamferedBox(span*(.94+rand()*.08),.16+rand()*.055,.15+rand()*.05,.025);
   // Low-amplitude, spatially coherent chips keep shared face vertices joined.
   const p=g.attributes.position;for(let k=0;k<p.count;k++){const x=p.getX(k),y=p.getY(k),z=p.getZ(k);p.setXYZ(k,x+.007*Math.sin(y*37+z*31+i),y+.008*Math.sin(x*19+z*27+i),z+.011*Math.sin(x*31+y*21+i));}g.deleteAttribute('normal');const rounded=mergeVertices(g,1e-5);g.dispose();rounded.computeVertexNormals();
   add(place(rounded,s,(joined?next.length/2:0)+(row?-.06:.04)*s.length,.55,1.405+row*.18),row?rock:wet);
  }
  // Interrupted inner ribbons preserve the city sign and existing palm bases.
  if(i%3!==0||Math.sin(i*.11+s.island)>.5)continue;
  const x=s.x-s.nx*.72,z=s.z-s.nz*.72;
  if([[12,-15],[16,-11],[-17,-10],[-15,-8]].some(([px,pz])=>Math.hypot(x-px,z-pz)<1.1))continue;
  for(let k=0;k<72;k++){
   const a=rand()*Math.PI*2,r=Math.sqrt(rand())*.54,px=x+Math.cos(a)*r,pz=z+Math.sin(a)*r,py=1.84+rand()*.38;
   add(leaf.clone().rotateX(rand()*Math.PI).rotateY(a).rotateZ(rand()*Math.PI).translate(px,py,pz),leaves);
   if(k%16===0)add(new THREE.SphereGeometry(.04,4,2).translate(px,py+.09,pz),flowers);
  }
 }
 leaf.dispose();
 // Ground-level paving and inset edge bands, not raised plinths. Each patch
 // stays inside the checked reservation, so it cannot overrun a road or canal.
 for(const p of plots){
  box(paving,p.x,p.y+.012,p.z,p.w+.35,.024,p.d+.35);
  for(const dx of [-1,1])box(inlay,p.x+dx*(p.w/2+.14),p.y+.026,p.z,.045,.008,p.d+.3);
 }
 // Keep entrance paving almost flush with the current walk surface.
 // Ferrari's strip lies east of the raised central district; the culture
 // threshold overlays the existing Corniche slabs by only 1–2 centimetres.
 for(let z=-46.5;z<=-40.5;z+=1){
  for(const x of [39,40,41])box(paving,x,1.022,z,.986,.032,.986);
  for(const x of [38.54,41.46])box(inlay,x,1.042,z,.055,.008,.99);
 }
 for(let z=39.5;z<=44.5;z+=1)for(let x=41.5;x<=46.5;x+=1)box(paving,x,1.074,z,.985,.012,.985);
 for(const x of [41.05,46.95])box(inlay,x,1.084,42,.055,.008,5.9);
 for(const z of [39.1,44.9])box(inlay,44,1.084,z,5.9,.008,.055);
 for(const [m,parts] of batches){if(!parts.length)continue;const g=mergeGeometries(parts);parts.forEach(p=>p.dispose());const mesh=new THREE.Mesh(g,m);mesh.receiveShadow=true;mesh.castShadow=m===leaves;mesh.userData.skipContact=m===paving||m===inlay;root.add(mesh);}
 let disposed=false;
 return {root,plots,samples,stats:{venueBeds:grounds.stats.gardens,venueShade:grounds.stats.pergolas,lagoonIslands:new Set(samples.map(s=>s.island)).size,lagoonSections:samples.length,triangles:grounds.stats.triangles+root.children.reduce((n,m)=>n+m.geometry.attributes.position.count/3,0),drawCalls:grounds.stats.drawCalls+root.children.length},apply(){},setEnabled(v){root.visible=!!v&&!disposed;grounds.setEnabled(v&&!disposed);},dispose(){if(disposed)return;this.setEnabled(false);disposed=true;grounds.dispose();root.removeFromParent();root.children.forEach(m=>m.geometry.dispose());materials.forEach(m=>m.dispose());}};
}
