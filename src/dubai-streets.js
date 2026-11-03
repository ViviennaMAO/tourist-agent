import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** Low street finishes only. Road clearances, heights and navigation remain
 * owned by the source world. Junction openings interrupt the kerbs/pavers. */
export function createDubaiStreets({THREE,city,palette={},roadFilter=r=>r.kind==='road'&&!r.bridge&&Math.max(r.A[1],r.B[1])<=-5}) {
  const root=new THREE.Group();root.name='Dubai — jointed kerbs and pedestrian crossings';
  const ctx=city.w.ctx,roads=(ctx.roads||[]).filter(roadFilter);
  const materials=[],batches=new Map(),originals=new Map();let enabled=true,disposed=false,grates=0,crossings=0;
  const finish=(color,roughness=0.9,metalness=0)=>{
    const m=new THREE.MeshStandardMaterial({color,roughness,metalness});materials.push(m);batches.set(m,[]);return m;
  };
  const kerb=finish(palette.kerb||'#c5b9a2'),paving=finish(palette.paving||'#bfb39d'),pavingLight=finish(palette.light||'#d4c8b1');
  const iron=finish('#50564f',.57,.6),dark=finish('#383d39'),paint=finish('#dedbcf');
  const specs=roads.map(r=>({...r,L:Math.hypot(r.B[0]-r.A[0],r.B[1]-r.A[1]),angle:Math.atan2(-(r.B[1]-r.A[1]),r.B[0]-r.A[0]),cross:[]}));
  function box(m,r,t,offset,y,w,h,d) {
    const g=new THREE.BoxGeometry(w,h,d).translate(t,y,offset).rotateY(r.angle).translate(r.A[0],0,r.A[1]);
    batches.get(m).push(g);
  }
  const point=(r,t,o=0)=>[r.A[0]+Math.cos(r.angle)*t+Math.sin(r.angle)*o,r.A[1]-Math.sin(r.angle)*t+Math.cos(r.angle)*o];
  function distance(p,r) {
    const dx=r.B[0]-r.A[0],dz=r.B[1]-r.A[1],t=Math.max(0,Math.min(1,((p[0]-r.A[0])*dx+(p[1]-r.A[1])*dz)/(r.L*r.L)));
    return Math.hypot(p[0]-r.A[0]-t*dx,p[1]-r.A[1]-t*dz);
  }
  for(const r of specs) {
    // Only genuine perpendicular road junctions receive crossings.
    const joins=[];
    for(const q of specs) {
      if(q===r||Math.abs(Math.sin(r.angle-q.angle))<.5)continue;
      for(const p of [q.A,q.B,r.A,r.B]) if(distance(p,r)<.01&&distance(p,q)<.01) {
        const t=(p[0]-r.A[0])*Math.cos(r.angle)-(p[1]-r.A[1])*Math.sin(r.angle);
        if(!joins.some(v=>Math.abs(v-t)<.1))joins.push(t);
      }
    }
    for(const t of joins) for(const sign of [-1,1]) {
      const c=t+sign*4.4;
      if(c<1.8||c>r.L-1.8||r.cross.some(v=>Math.abs(v-c)<3))continue;
      r.cross.push(c);crossings++;
      for(let j=-2;j<=2;j++)box(paint,r,c+j*.5,0,1.394,.26,.016,2.8);
    }
    const n=Math.ceil(r.L/.78),step=r.L/n;
    for(let j=0;j<n;j++)for(const sign of [-1,1]) {
      const t=(j+.5)*step;
      if(specs.some(q=>q!==r&&distance(point(r,t,sign*1.95),q)<2.7))continue;
      const ramp=r.cross.some(c=>Math.abs(c-t)<1.7);
      box(kerb,r,t,sign*1.79,ramp?1.364:1.39,step-.024,ramp?.055:.105,.23);
      box((j+sign)%3===0?pavingLight:paving,r,t,sign*2.12,1.35,step-.022,.034,.4);
      // Gutter strip lies below the asphalt top, not above the walking plane.
      box(paving,r,t,sign*1.64,1.361,step-.02,.025,.09);
      if(j%14===6&&!ramp) {
        grates++;box(dark,r,t,sign*1.54,1.386,.48,.016,.17);
        for(let k=0;k<7;k++)box(iron,r,t-.21+k*.07,sign*1.54,1.4,.022,.015,.17);
      }
    }
    r.hidden=(r.dashes||[]).filter(d=>r.cross.some(c=>Math.abs(c-d.d)<2)||joins.some(c=>Math.abs(c-d.d)<2.7));
  }
  let triangles=0;
  for(const [m,parts] of batches)if(parts.length) {
    const g=mergeGeometries(parts,false);parts.forEach(p=>p.dispose());
    const mesh=new THREE.Mesh(g,m);mesh.receiveShadow=true;root.add(mesh);triangles+=g.index.count/3;
  }
  city.w.root.add(root);
  function restore() {
    const pool=ctx.pools?.dash;if(!pool)return;
    for(const [i,m] of originals)pool.set(i,m);if(originals.size)pool.flush();originals.clear();
  }
  return {root,stats:{roads:specs.length,decorations:grates,crossings,triangles,drawCalls:root.children.length},apply(){
    if(!enabled||disposed)return;const pool=ctx.pools?.dash;if(!pool)return;
    for(const r of specs)for(const d of r.hidden) {
      if(!originals.has(d.i))originals.set(d.i,new THREE.Matrix4());
      pool.m.getMatrixAt(d.i,originals.get(d.i));pool.hide(d.i);
    }
    if(originals.size)pool.flush();
  },setEnabled(value){enabled=!!value;root.visible=enabled&&!disposed;if(!enabled)restore();},dispose(){
    if(disposed)return;disposed=true;restore();root.removeFromParent();
    root.children.forEach(m=>m.geometry.dispose());materials.forEach(m=>m.dispose());
  }};
}
