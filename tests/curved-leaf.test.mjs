import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createCurvedLeaf} from '../src/curved-leaf.js';

test('curved leaves retain UV cutouts, finite outward faces and bounded curl at both detail levels',()=>{
  for(const detailed of [true,false])for(const size of [.055,.1,.2]){
    const g=createCurvedLeaf(THREE,size,.95,detailed),p=g.attributes.position,uv=g.attributes.uv;
    assert.equal(g.index.count,detailed?18:12);
    for(let i=0;i<p.count;i++){
      assert.ok(Number.isFinite(p.getX(i)+p.getY(i)+p.getZ(i)));
      assert.ok(Math.abs(p.getX(i))<size&&Math.abs(p.getY(i))<size*1.06&&Math.abs(p.getZ(i))<size*.09);
      assert.ok(uv.getX(i)>0&&uv.getX(i)<1&&uv.getY(i)>0&&uv.getY(i)<1);
    }
    for(let i=0;i<g.index.count;i+=3){
      const a=new THREE.Vector3().fromBufferAttribute(p,g.index.getX(i));
      const b=new THREE.Vector3().fromBufferAttribute(p,g.index.getX(i+1));
      const c=new THREE.Vector3().fromBufferAttribute(p,g.index.getX(i+2));
      assert.ok(b.sub(a).cross(c.sub(a)).z>1e-6,'all faces retain their outward winding');
    }
    const mesh=new THREE.Mesh(g,new THREE.MeshBasicMaterial());mesh.updateMatrixWorld(true);
    assert.ok(new THREE.Raycaster(new THREE.Vector3(0,0,size),new THREE.Vector3(0,0,-1)).intersectObject(mesh).length>0);
    assert.equal(new THREE.Raycaster(new THREE.Vector3(size*.8,size*.8,size),new THREE.Vector3(0,0,-1)).intersectObject(mesh).length,0,'rectangle corners are absent geometry');
    g.dispose();mesh.material.dispose();
  }
});
