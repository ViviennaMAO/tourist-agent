import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {installLeafDaylight} from './leaf-daylight.js';
import {createCurvedLeaf} from './curved-leaf.js';

// Replace the original solid green balls while keeping each actor's location.
export function createAbuDhabiShrubs({city,leafTexture}){
 const pool=city.w.ctx.pools.bush,count=pool.n,parts=[],leaf=createCurvedLeaf(THREE,.15,.8,true);
 for(let i=0;i<108;i++){
  const a=i*2.399963,y=-.64+(i+.5)/108*1.1,r=Math.sqrt(Math.max(0,1-Math.pow((y+.08)/.64,2)))*(.4+(i%3)*.065);
  parts.push(leaf.clone().rotateX(-.4+(i%5)*.22).rotateY(a).translate(Math.cos(a)*r,y,Math.sin(a)*r));
 }
 leaf.dispose();const geometry=mergeGeometries(parts);parts.forEach(g=>g.dispose());
 const material=new THREE.MeshStandardMaterial({color:'#c8d1ad',map:leafTexture||null,alphaTest:.42,side:THREE.DoubleSide,roughness:.94,envMapIntensity:.5});
 installLeafDaylight(material);
 const root=new THREE.InstancedMesh(geometry,material,count);root.name='Abu Dhabi — layered shrubs';root.castShadow=true;root.receiveShadow=true;root.instanceMatrix.setUsage(THREE.DynamicDrawUsage);city.w.root.add(root);
 const saved=Array.from({length:count},()=>new THREE.Matrix4());let enabled=false,valid=false,disposed=false;
 function restore(){if(!valid)return;for(let i=0;i<count;i++)pool.set(i,saved[i]);pool.flush();valid=false;}
 return {root,stats:{shrubs:count,triangles:count*geometry.index.count/3,drawCalls:1},apply(){if(!enabled||disposed)return;for(let i=0;i<count;i++){pool.m.getMatrixAt(i,saved[i]);root.setMatrixAt(i,saved[i]);pool.hide(i);}valid=true;pool.flush();root.instanceMatrix.needsUpdate=true;root.computeBoundingSphere();},setEnabled(v){enabled=!!v&&!disposed;root.visible=enabled;if(!enabled)restore();},dispose(){if(disposed)return;this.setEnabled(false);disposed=true;root.removeFromParent();geometry.dispose();material.dispose();root.dispose();}};
}
