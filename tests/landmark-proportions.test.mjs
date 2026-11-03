import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {refineLandmarkProportions} from '../src/landmark-proportions.js';

test('landmark rescaling keeps the contact plane and restores transforms and interaction radius',()=>{
  for(const id of ['dubai_frame','museum_future','emirates_towers']){
    const holder=new THREE.Group();holder.position.set(70,1.25,-32);
    const asset=new THREE.Group();asset.scale.setScalar(2);asset.position.set(.3,.7,-.5);holder.add(asset);
    const geometry=new THREE.BoxGeometry(4,8,3).translate(2,3,-1),material=new THREE.MeshStandardMaterial();
    const mesh=new THREE.Mesh(geometry,material);mesh.position.y=.4;asset.add(mesh);
    holder.updateMatrixWorld(true);
    const bounds=()=>new THREE.Box3().setFromObject(holder),before=bounds(),saved=asset.scale.clone(),position=asset.position.clone();
    const landmark={id,holder,asset,rXZ:4,size:[8,16,6]},study=refineLandmarkProportions(landmark);
    for(let i=0;i<3;i++){
      study.setEnabled(true);study.setEnabled(true);holder.updateMatrixWorld(true);const after=bounds();
      assert.ok(Math.abs(after.min.y-before.min.y)<1e-6,'base remains on contact plane');
      assert.ok(after.max.y<before.max.y&&landmark.rXZ<4);
      assert.ok(after.getCenter(new THREE.Vector3()).distanceTo(new THREE.Vector3(before.getCenter(new THREE.Vector3()).x,after.getCenter(new THREE.Vector3()).y,before.getCenter(new THREE.Vector3()).z))<1e-6);
      assert.equal(mesh.geometry,geometry);
      study.setEnabled(false);assert.deepEqual(asset.scale.toArray(),saved.toArray());assert.deepEqual(asset.position.toArray(),position.toArray());assert.equal(landmark.rXZ,4);
    }
    study.setEnabled(true);study.dispose();study.dispose();assert.deepEqual(asset.scale.toArray(),saved.toArray());
    geometry.dispose();material.dispose();
  }
});
