import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

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
  const swaps=[]; const styled=new Set();
  function styleAsset(l) {
    if(!l?.asset||styled.has(l))return;
    l.asset.traverse(o=>{
      if(!o.isMesh)return;
      const before=o.material;
      const frame=l.id==='dubai_frame';
      const after=before.clone();after.color.set(frame?'#c7a366':'#ccd0ca');after.roughness=frame?.42:.3;after.metalness=frame?.68:.62;
      after.emissiveIntensity=0;after.envMapIntensity=.85;
      after.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
        float neutral=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
        diffuseColor.rgb=mix(diffuseColor.rgb,vec3(neutral),.88)*vec3(${frame?'1.15,1.00,.72':'1.0,1.02,1.02'});`);};
      after.customProgramCacheKey=()=>frame?'ta-frame-gold-v1':'ta-museum-silver-v1';
      swaps.push({mesh:o,before,after});o.material=enabled?after:before;
    });styled.add(l);
  }
  return {root,stats:{landmarks:3,triangles:root.children.reduce((n,m)=>n+m.geometry.index.count/3,0),drawCalls:3},apply(){
    if(disposed)return;
    root.visible=enabled&&L.loaded;
    if(L.asset)L.asset.visible=!enabled;
    styleAsset(city.LM.dubai_frame);styleAsset(city.LM.museum_future);
  },setEnabled(v){enabled=!!v;root.visible=enabled&&L.loaded;if(L.asset)L.asset.visible=!enabled;swaps.forEach(s=>s.mesh.material=enabled?s.after:s.before);},dispose(){
    if(disposed)return;this.setEnabled(false);disposed=true;root.removeFromParent();root.children.forEach(m=>m.geometry.dispose());[glass,silver,plinth].forEach(m=>m.dispose());swaps.forEach(s=>s.after.dispose());
  }};
}
