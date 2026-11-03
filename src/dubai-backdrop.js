import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { installCurtainWallFinish } from './curtain-wall.js';
import { installSkylineAtmosphere } from './skyline-atmosphere.js';
import { towerMassing, slopedCrown } from './tower-massing.js';

/** A second and third skyline layer on the existing mainland, with real
 * collision footprints. It never extends the island or covers a landmark. */
export function createDubaiBackdrop({THREE,city}) {
  const root=new THREE.Group();root.name='Dubai — inland skyline layers';
  const ctx=city.w.ctx,footprints=[],batches=new Map();let enabled=false,disposed=false;
  function finish(color,roughness,metalness=0){const m=new THREE.MeshStandardMaterial({color,roughness,metalness,envMapIntensity:.9});batches.set(m,[]);return m;}
  const glass=finish('#748b9c',.18,.24),silver=finish('#97a4aa',.20,.28),sand=finish('#a7adae',.78),trim=finish('#7b8c98',.4,.48),roof=finish('#7d898e',.9);
  for(const m of [glass,silver]){m.userData.cityGlass=true;m.userData.reflectionZone='skyline';installCurtainWallFinish(m);}
  for(const m of batches.keys())installSkylineAtmosphere(m,.20);
  function box(m,x,y,z,w,h,d,ry=0){batches.get(m).push(new THREE.BoxGeometry(w,h,d).rotateY(ry).translate(x,y,z));}
  // Three broken depth bands, with deterministic offsets and varied heights.
  // A narrower cluster spacing alternates with breathing room between groups.
  for(let row=0;row<3;row++)for(let i=0;i<10;i++) {
    const seed=i*17+row*29;
    const lanes=[[-54,-46,-34,-25,-12,9,20,35,43,55],[-57,-39,-31,-19,-8,5,15,29,45,58],[-51,-43,-27,-15,-4,11,24,37,49,57]];
    const x=lanes[row][i]+Math.sin(seed*1.7)*.65;
    const z=-60.5-row*9.2+Math.sin(seed*.73)*2.0;
    const w=2.6+(seed%5)*.29,d=3.05+(seed%4)*.23;
    // Taller shoulders frame the central landmark; staggered middling masses
    // keep a clear visual valley around its lower silhouette.
    const shoulder=Math.exp(-Math.pow((Math.abs(x)-35)/16,2));
    const h=8+row*1.35+shoulder*4.8+((seed*7)%9)*.48;
    if(!ctx.free(x,z,w,d)||footprints.some(q=>Math.abs(q.x-x)<(q.w+w)/2+.9&&Math.abs(q.z-z)<(q.d+d)/2+.9))continue;
    const base=ctx.groundY(x,z),profile=towerMassing(w,d,h,(i+row*2)%5,1.7);
    const record={x,z,w,d,h,base,family:profile.name};footprints.push(record);
    const skin=seed%7===0?sand:seed%3===0?silver:glass;
    // Even background towers have a grounded entrance when approached from
    // the rear: a thin plinth, recessed glazing and four supporting piers.
    box(sand,x,base+.065,z,w-.02,.13,d-.02);
    box(glass,x,base+.88,z,w-.55,1.5,d-.55);
    for(const sx of [-1,1])for(const sz of [-1,1])
      box(sand,x+sx*(w/2-.16),base+.87,z+sz*(d/2-.16),.18,1.6,.18);
    box(silver,x,base+1.64,z,w-.05,.12,d-.05);
    for(const t of profile.tiers) {
      const ww=t.w-.08,dd=t.d-.08,xx=x+t.x;
      box(skin,xx,base+(t.bottom+t.top)/2,z,ww,t.top-t.bottom,dd);
      box(roof,xx,base+t.top-.035,z,ww,.07,dd);
      // Quiet horizontal joints; vertical lines carry the distant silhouette.
      for(let yy=t.bottom+.42;yy<t.top-.1;yy+=.85)for(const side of [-1,1]) {
        // Flush spandrels need only their outward face; keep projecting mullions solid.
        batches.get(roof).push(new THREE.PlaneGeometry(ww,.055).rotateY(side<0?Math.PI:0).translate(xx,base+yy-.045,z+side*(dd/2+.01)));
        batches.get(trim).push(new THREE.PlaneGeometry(ww,.022).rotateY(side<0?Math.PI:0).translate(xx,base+yy,z+side*(dd/2+.016)));
        batches.get(roof).push(new THREE.PlaneGeometry(dd,.055).rotateY(side*Math.PI/2).translate(xx+side*(ww/2+.01),base+yy-.045,z));
        batches.get(trim).push(new THREE.PlaneGeometry(dd,.022).rotateY(side*Math.PI/2).translate(xx+side*(ww/2+.016),base+yy,z));
      }
      for(const sign of [-1,1])for(const u of [-.36,-.18,0,.18,.36]) {
        box(trim,xx+ww*u,base+(t.bottom+t.top)/2,z+sign*(dd/2+.012),.023,t.top-t.bottom,.025);
        box(trim,xx+sign*(ww/2+.012),base+(t.bottom+t.top)/2,z+dd*u,.025,t.top-t.bottom,.023);
      }
    }
    const t=profile.tiers.at(-1),xx=x+t.x;
    if(profile.family===4) {
      batches.get(skin).push(slopedCrown(THREE,t.w-.09,t.d-.09,h,.86).translate(xx,base,z));
    } else if(profile.family===1||profile.family===3) {
      box(skin,xx,base+h-.36,z,t.w-.09,.72,t.d-.09);
      for(const sign of [-1,1])box(silver,xx+sign*(t.w/2-.08),base+h-.3,z,.06,.6,t.d-.1);
    } else {
      box(roof,xx,base+h-.4,z,t.w*.66,.64,t.d*.65);
      box(silver,xx,base+h-.06,z,t.w*.69,.08,t.d*.68);
    }
  }
  for(const [m,gs] of batches)if(gs.length){const g=mergeGeometries(gs);gs.forEach(g=>g.dispose());const mesh=new THREE.Mesh(g,m);mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);}
  city.w.root.add(root);root.visible=false;
  const stats={buildings:footprints.length,triangles:root.children.reduce((n,m)=>n+m.geometry.index.count/3,0),drawCalls:root.children.length,backdrop:true};
  return {root,footprints,stats,apply(){},setEnabled(value){
    if(disposed||enabled===!!value)return;enabled=!!value;root.visible=enabled;
    if(enabled)ctx.rects.push(...footprints);
    else for(const r of footprints){const i=ctx.rects.indexOf(r);if(i>=0)ctx.rects.splice(i,1);}
  },dispose(){if(disposed)return;this.setEnabled(false);disposed=true;root.removeFromParent();root.children.forEach(m=>m.geometry.dispose());for(const m of batches.keys())m.dispose();}};
}
