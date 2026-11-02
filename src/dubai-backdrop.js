import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** A second and third skyline layer on the existing mainland, with real
 * collision footprints. It never extends the island or covers a landmark. */
export function createDubaiBackdrop({THREE,city}) {
  const root=new THREE.Group();root.name='Dubai — inland skyline layers';
  const ctx=city.w.ctx,footprints=[],batches=new Map();let enabled=false,disposed=false;
  function finish(color,roughness,metalness=0){const m=new THREE.MeshStandardMaterial({color,roughness,metalness,envMapIntensity:.9});batches.set(m,[]);return m;}
  const glass=finish('#718c9c',.24,.36),silver=finish('#a3afb0',.25,.45),sand=finish('#b9b5a6',.68),trim=finish('#72818a',.48,.5),roof=finish('#6d7778',.9);
  for(const m of [glass,silver]){m.userData.cityGlass=true;m.userData.reflectionZone='skyline';}
  function box(m,x,y,z,w,h,d,ry=0){batches.get(m).push(new THREE.BoxGeometry(w,h,d).rotateY(ry).translate(x,y,z));}
  for(let row=0;row<2;row++)for(let i=0;i<13;i++) {
    const x=-55+i*8.7+(row?.9:0),z=-65-row*13;
    const w=2.8+(i%3)*.45,d=3.3+(i%2)*.6,h=8+row*2+((i*7+row*11)%11);
    if(!ctx.free(x,z,w,d)||footprints.some(q=>Math.abs(q.x-x)<(q.w+w)/2+.9&&Math.abs(q.z-z)<(q.d+d)/2+.9))continue;
    const base=ctx.groundY(x,z),record={x,z,w,d,h,base};footprints.push(record);
    const skin=(i+row)%4===0?sand:(i%3===0?silver:glass);
    const tiers=(i+row)%3===0?3:2;
    for(let tier=0;tier<tiers;tier++) {
      const bottom=h*(tier===0?0:tier===1?.72:.9),top=h*(tier===0?.72:tier===1&&tiers===3?.9:1);
      const inset=1-tier*.17,ww=w*inset-.08,dd=d*inset-.08;
      box(skin,x,base+(bottom+top)/2,z,ww,top-bottom,dd);
      box(roof,x,base+top-.035,z,ww,.07,dd);
      for(let yy=bottom+.5;yy<top-.1;yy+=1.15) {
        for(const side of [-1,1]) {
          box(trim,x,base+yy,z+side*(dd/2+.012),ww,.045,.025);
          box(trim,x+side*(ww/2+.012),base+yy,z,.025,.045,dd);
        }
      }
      for(const s of [-1,1])for(const u of [-.32,0,.32]) {
        box(trim,x+ww*u,base+(bottom+top)/2,z+s*(dd/2+.02),.035,top-bottom,.04);
        box(trim,x+s*(ww/2+.02),base+(bottom+top)/2,z+dd*u,.04,top-bottom,.035);
      }
      if(tier===tiers-1) {
        const cw=ww*.7,cd=dd*.7;
        box(sand,x,base+top+.18,z,cw,.36,cd);
        if(i%4===0) box(trim,x,base+top+.85,z,.08,1.35,.08);
      }
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
