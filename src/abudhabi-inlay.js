import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

export const MOSQUE_INLAY_BOUNDS={x:-15,z:42.25,w:33,d:4.5,y:1.085};
/** Thin coloured-stone shapes share the gloss of the surrounding marble. No
 * raised flower geometry, additional obstacle, or painted shadow is introduced. */
export function createMosqueInlay({city}){
 const root=new THREE.Group();root.name='Abu Dhabi — polished floral marble forecourt';city.w.root.add(root);
 const batches=new Map(),materials=[];let disposed=false;
 const mat=c=>{const m=new THREE.MeshPhysicalMaterial({color:c,roughness:.22,metalness:.06,clearcoat:.6,clearcoatRoughness:.18,envMapIntensity:1.25});m.userData.cityGlass=true;m.userData.reflectionZone='courtyard';materials.push(m);batches.set(m,[]);return m;};
 const white=mat('#e8eceb'),green=mat('#82978b'),blue=mat('#497685'),rose=mat('#ae8b83'),gold=mat('#b6a282');
 const add=(g,m)=>{if(g.index){const old=g;g=g.toNonIndexed();old.dispose();}batches.get(m).push(g);};
 const b=MOSQUE_INLAY_BOUNDS;add(new THREE.PlaneGeometry(b.w,b.d).rotateX(-Math.PI/2).translate(b.x,b.y,b.z),white);
 function shapeAt(shape,m,x,z,angle=0,scale=1){add(new THREE.ShapeGeometry(shape,16).scale(scale,scale,1).rotateZ(angle).rotateX(-Math.PI/2).translate(x,b.y+.002,z),m);}
 const petal=new THREE.Shape();petal.moveTo(0,0);petal.bezierCurveTo(-.2,.2,-.24,.62,0,.84);petal.bezierCurveTo(.24,.62,.2,.2,0,0);
 const leaf=new THREE.Shape();leaf.moveTo(0,0);leaf.quadraticCurveTo(-.16,.28,0,.58);leaf.quadraticCurveTo(.19,.28,0,0);
 let flowers=0;
 for(const side of [-1,1])for(let i=0;i<7;i++){
  const x=-15+side*(3.7+i*1.7),z=41.3+Math.sin(i*1.1)*.45;
  const path=new THREE.CatmullRomCurve3([new THREE.Vector3(x,0,40.1),new THREE.Vector3(x+.26*side,0,40.6),new THREE.Vector3(x-.12*side,0,z)]),pts=path.getPoints(20),v=[];
  for(let j=0;j<pts.length-1;j++){const a=pts[j],c=pts[j+1],n=new THREE.Vector3(c.z-a.z,0,a.x-c.x).normalize().multiplyScalar(.014);for(const p of [a.clone().add(n),c.clone().sub(n),c.clone().add(n),a.clone().add(n),a.clone().sub(n),c.clone().sub(n)])v.push(p.x,b.y+.001,p.z);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(Array(v.length/3*2).fill(0),2));g.computeVertexNormals();add(g,green);
  for(let k=0;k<6;k++)shapeAt(petal,i%3===0?blue:i%3===1?rose:gold,x,z,k*Math.PI/3,.5+(i%2)*.12);
  add(new THREE.CircleGeometry(.075,16).rotateX(-Math.PI/2).translate(x,b.y+.003,z),gold);
  shapeAt(leaf,green,x+.11*side,40.55,side*.8,.8);shapeAt(leaf,green,x-.08*side,40.78,-side*.7,.75);flowers++;
 }
 for(const z of [40.06,44.42])add(new THREE.PlaneGeometry(32.9,.035).rotateX(-Math.PI/2).translate(-15,b.y+.002,z),gold);
 for(const [m,parts] of batches){const g=mergeGeometries(parts);parts.forEach(g=>g.dispose());const mesh=new THREE.Mesh(g,m);mesh.receiveShadow=true;mesh.userData.skipContact=true;root.add(mesh);}
 return {root,materials,stats:{marbleFlowers:flowers,drawCalls:root.children.length},apply(){},setEnabled(v){root.visible=!!v&&!disposed;},dispose(){if(disposed)return;this.setEnabled(false);disposed=true;root.removeFromParent();root.children.forEach(m=>m.geometry.dispose());materials.forEach(m=>m.dispose());}};
}
