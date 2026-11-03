import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {installLeafDaylight} from './leaf-daylight.js';
import {createCurvedLeaf} from './curved-leaf.js';
import {installSurfaceFinish} from './surface-finish.js';

export function tokyoRandom(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
/** Branching cherry trees and broadleaf trees replace the old solid crown pool.
 * Every flower is geometry: no alpha-sorted cloud or opaque pink sphere. */
export function createTokyoTrees({city,leafTexture}){
 const root=new THREE.Group();root.name='Tokyo — branching sakura and broadleaf trees';city.w.root.add(root);
 const ctx=city.w.ctx,batches=new Map(),materials=[],saved=new Map();let enabled=false,disposed=false;
 const material=(color)=>{const m=new THREE.MeshStandardMaterial({color,roughness:.9,side:THREE.DoubleSide});materials.push(m);batches.set(m,[]);return m;};
 const bark=material('#746455');installSurfaceFinish(bark,'wood');
 const greens=['#b1bf8b','#91ab78','#c2c99a'].map(c=>{const m=material(c);m.map=leafTexture||null;m.alphaTest=.22;installLeafDaylight(m);return m;});
 const pinks=['#edd3cf','#e5b9be','#f2e3d9'].map(c=>{const m=material(c);installLeafDaylight(m);return m;});
 const leaf=createCurvedLeaf(THREE,.23,.53,true);
 // A single five-petal flower; shallow folded petals catch alternating light.
 const flower=new THREE.BufferGeometry(),positions=[];
 for(let k=0;k<5;k++){
  const a=k*Math.PI*2/5,r=.07;const p=(angle,radius,y)=>[Math.cos(angle)*radius,y,Math.sin(angle)*radius];
  const rim=[p(a-.42,r*.65,.012),p(a-.22,r*.97,.02),p(a+.22,r*.97,.02),p(a+.42,r*.65,.012)];
  for(let j=0;j<3;j++)positions.push(...[p(a,0,0),rim[j],rim[j+1]].flat());
 }
 flower.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));flower.setAttribute('uv',new THREE.Float32BufferAttribute(Array(positions.length/3*2).fill(0),2));flower.computeVertexNormals();
 const add=(g,m)=>{if(g.index){const old=g;g=g.toNonIndexed();old.dispose();}batches.get(m).push(g);};
 const trees=ctx.trees||[];
 for(const [index,t] of trees.entries()){
  const rand=tokyoRandom(31457+index*7919),s=t.sc,origin=new THREE.Vector3(t.x,t.y,t.z);
  const transform=g=>g.scale(s,s,s).rotateY(t.ry).translate(...origin.toArray());
  const rod=(a,b,r1,r2)=>{const from=new THREE.Vector3(...a),to=new THREE.Vector3(...b),dir=to.clone().sub(from);const g=new THREE.CylinderGeometry(r2,r1,dir.length(),7);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize()));g.translate(...from.add(to).multiplyScalar(.5).toArray());add(transform(g),bark);};
  const fork=[.12*(rand()-.5),1.35,.16*(rand()-.5)];rod([0,0,0],fork,.14,.085);
  const sakura=t.kind==='sakura';
  for(let b=0;b<6;b++){
   const a=b*2.399+rand()*.4,r=.62+rand()*.45,tip=[Math.cos(a)*r,2.25+rand()*.9,Math.sin(a)*r];rod(fork,tip,.07,.025);
   for(let branch=0;branch<3;branch++){
    const angle=a+(branch-1)*.75,end=[tip[0]+Math.cos(angle)*(.35+rand()*.4),tip[1]+.2+rand()*.4,tip[2]+Math.sin(angle)*(.35+rand()*.4)];rod(tip,end,.023,.008);
    for(let n=0;n<(sakura?34:44);n++){
     const u=rand()*Math.PI*2,v=rand()*2-1,rr=Math.cbrt(rand()),rad=Math.sqrt(1-v*v)*rr;
     const x=end[0]+Math.cos(u)*rad*.72,y=end[1]+v*rr*.5,z=end[2]+Math.sin(u)*rad*.66;
     const g=(sakura?flower:leaf).clone().scale(...(sakura?[1.15,1.15,1.15]:[.8,.8,.8])).rotateX((rand()-.5)*2.6).rotateY(rand()*6.28).rotateZ((rand()-.5)*1.1).translate(x,y,z);
     add(transform(g),sakura?pinks[(n+b)%3]:greens[(n+b)%3]);
    }
   }
  }
 }
 leaf.dispose();flower.dispose();
 for(const [m,parts] of batches){if(!parts.length)continue;const g=mergeGeometries(parts);parts.forEach(g=>g.dispose());const mesh=new THREE.Mesh(g,m);mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);}
 return {root,stats:{tokyoTrees:trees.length,sakura:trees.filter(t=>t.kind==='sakura').length,triangles:root.children.reduce((n,m)=>n+m.geometry.attributes.position.count/3,0),drawCalls:root.children.length},
  apply(){if(disposed||!enabled)return;for(const t of trees)for(const name of ['treeTrunk','treeCrown']){
   const pool=ctx.pools[name];if(!pool)continue;const key=name+t.i;if(!saved.has(key)){const matrix=new THREE.Matrix4();pool.m.getMatrixAt(t.i,matrix);saved.set(key,{pool,i:t.i,matrix});}pool.hide(t.i);pool.flush();
  }},
  setEnabled(v){enabled=!!v&&!disposed;root.visible=enabled;if(!enabled){for(const {pool,i,matrix} of saved.values()){pool.set(i,matrix);pool.flush();}saved.clear();}},
  dispose(){if(disposed)return;this.setEnabled(false);disposed=true;root.removeFromParent();root.children.forEach(m=>m.geometry.dispose());materials.forEach(m=>m.dispose());}
 };
}
