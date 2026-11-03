import { refineLegacyBase } from './landmark-base.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { refineHotel, hotelSurface } from './hotel-refinement.js';
import { landmarkFinish } from './landmark-finish.js';

/** A procedural stepped tower study, with the existing landmark holder retaining
 * navigation, identity and picking. Original assets remain available for A/B. */
export function createDubaiLandmarks({ THREE, city }) {
  const L=city.LM.burj_khalifa, root=new THREE.Group(); root.name='Burj Khalifa — stepped silver facade';
  const glass=new THREE.MeshStandardMaterial({color:'#748f9c',roughness:.24,metalness:.55,envMapIntensity:1.3});
  const silver=new THREE.MeshStandardMaterial({color:'#b7c2c2',roughness:.29,metalness:.75});
  const plinth=new THREE.MeshStandardMaterial({color:'#cec9b9',roughness:.81});
  const batches=new Map([[glass,[]],[silver,[]],[plinth,[]]]);
  function add(g,m,x=0,y=0,z=0){g.translate(x,y,z);batches.get(m).push(g);}
  const H=L.cfg.h;
  add(new THREE.CylinderGeometry(2.5,2.75,.3,48),plinth,0,.15,0);
  add(new THREE.CylinderGeometry(.22,.9,H*.85,32),glass,0,H*.425+.3,0);
  for(let wing=0;wing<3;wing++) {
    const a=wing*Math.PI*2/3+.3;
    for(let tier=0;tier<9-wing;tier++) {
      const h=3.9, y=.3+tier*h, r=.76-tier*.055, offset=1.3-tier*.105;
      const x=Math.cos(a)*offset,z=Math.sin(a)*offset;
      add(new THREE.CylinderGeometry(r*.98,r,h,24),glass,x,y+h/2,z);
      for(let floor=0;floor<11;floor++) add(new THREE.CylinderGeometry(r+.018,r+.018,.025,24),silver,x,y+floor*h/11,z);
      for(let k=0;k<16;k++) {
        const angle=k/16*Math.PI*2;
        add(new THREE.CylinderGeometry(.011,.011,h,4),silver,x+Math.cos(angle)*(r+.005),y+h/2,z+Math.sin(angle)*(r+.005));
      }
      add(new THREE.CylinderGeometry(r+.025,r+.025,.08,24),silver,x,y+h,z);
    }
  }
  add(new THREE.CylinderGeometry(.045,.25,H*.18,20),silver,0,H*.88,0);
  add(new THREE.ConeGeometry(.06,H*.06,12),silver,0,H*.97,0);
  for(const [m,geos] of batches){const g=mergeGeometries(geos);geos.forEach(g=>g.dispose());const mesh=new THREE.Mesh(g,m);mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);}
  L.holder.add(root);root.visible=false;
  let enabled=false,disposed=false;
  const swaps=[]; const styled=new Set(),bases=[];
  function styleAsset(l) {
    if(!l?.asset||styled.has(l))return;
    const base=refineHotel(l)||refineLegacyBase(l);if(base){bases.push(base);base.setEnabled(enabled);}
    l.asset.traverse(o=>{
      if(!o.isMesh)return;
      const before=o.material;
      const finish=m=>{const next=landmarkFinish(m,l.id);return ['atlantis','burj_al_arab'].includes(l.id)?hotelSurface(next,l.id,o.name==='Dubai_FC_Floor'):next;};
      const after=Array.isArray(before)?before.map(finish):finish(before);
      swaps.push({mesh:o,before,after});o.material=enabled?after:before;
    });styled.add(l);
  }
  return {root,stats:{landmarks:Object.keys(city.LM).length,triangles:root.children.reduce((n,m)=>n+m.geometry.index.count/3,0),drawCalls:3},apply(){
    if(disposed)return;
    root.visible=enabled&&L.loaded;
    if(L.asset)L.asset.visible=!enabled;
    for(const [id,landmark] of Object.entries(city.LM))if(id!=='burj_khalifa')styleAsset(landmark);
  },setEnabled(v){enabled=!!v;bases.forEach(b=>b.setEnabled(enabled));root.visible=enabled&&L.loaded;if(L.asset)L.asset.visible=!enabled;swaps.forEach(s=>s.mesh.material=enabled?s.after:s.before);},dispose(){
    if(disposed)return;this.setEnabled(false);disposed=true;bases.forEach(b=>b.dispose());root.removeFromParent();root.children.forEach(m=>m.geometry.dispose());[glass,silver,plinth].forEach(m=>m.dispose());swaps.forEach(s=>(Array.isArray(s.after)?s.after:[s.after]).forEach(m=>m.dispose()));
  }};
}
