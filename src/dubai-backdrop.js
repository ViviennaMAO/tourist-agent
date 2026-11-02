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
  const glass=finish('#99aebb',.3,.32),silver=finish('#b6c1c6',.32,.4),sand=finish('#c2c3bd',.75),trim=finish('#9baeb8',.48,.4),roof=finish('#9ba7aa',.9);
  for(const m of [glass,silver]){m.userData.cityGlass=true;m.userData.reflectionZone='skyline';installCurtainWallFinish(m);}
  for(const m of batches.keys())installSkylineAtmosphere(m,.26);
  function box(m,x,y,z,w,h,d,ry=0){batches.get(m).push(new THREE.BoxGeometry(w,h,d).rotateY(ry).translate(x,y,z));}
  // Three broken depth bands, with deterministic offsets and varied heights.
  // A narrower cluster spacing alternates with breathing room between groups.
  for(let row=0;row<3;row++)for(let i=0;i<10;i++) {
    const seed=i*17+row*29;
    const x=-54+i*11.9+Math.sin(seed*1.7)*2.1;
    const z=-60.5-row*9.5+Math.sin(seed*.73)*1.45;
    const w=2.6+(seed%5)*.29,d=3.05+(seed%4)*.23;
    const h=8+row*2.1+((seed*7)%9)*.8;
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
      for(let yy=t.bottom+.65;yy<t.top-.1;yy+=1.35)for(const side of [-1,1]) {
        box(trim,xx,base+yy,z+side*(dd/2+.008),ww,.022,.016);
        box(trim,xx+side*(ww/2+.008),base+yy,z,.016,.022,dd);
      }
      for(const sign of [-1,1])for(const u of [-.32,0,.32]) {
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
