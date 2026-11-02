import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createDubaiStreets} from '../src/dubai-streets.js';

test('street finishes leave junctions clear, avoid bridges, and restore source markings',()=>{
  const mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial(),2);
  const before=new THREE.Matrix4().makeTranslation(0,1.395,-16);mesh.setMatrixAt(0,before);mesh.setMatrixAt(1,before);
  mesh.getMatrixAt(0,before); // Compare against the stored float32 instance data.
  const pool={m:mesh,set:(i,m)=>mesh.setMatrixAt(i,m),hide:i=>mesh.setMatrixAt(i,new THREE.Matrix4().makeScale(0,0,0)),flush(){}};
  const roads=[{A:[-20,-16],B:[20,-16],kind:'road',dashes:[{i:0,d:20}]},
    {A:[0,-30],B:[0,-16],kind:'road',dashes:[]},
    {A:[0,-5],B:[0,8],kind:'road',bridge:true,dashes:[{i:1,d:1.6}]}];
  const rects=[],city={w:{root:new THREE.Group(),ctx:{roads,pools:{dash:pool},rects}}};
  const s=createDubaiStreets({THREE,city});assert.equal(s.stats.roads,2);assert.equal(s.stats.crossings,3);
  assert.ok(s.stats.drawCalls<=6);assert.ok(s.stats.triangles<10000);
  s.root.traverse(o=>{if(!o.isMesh)return;
    for(const a of Object.values(o.geometry.attributes))assert.ok(a.array.every(Number.isFinite));
    o.geometry.computeBoundingBox();assert.ok(o.geometry.boundingBox.max.y<1.45);
  });
  s.root.updateMatrixWorld(true);
  const hits=new THREE.Raycaster(new THREE.Vector3(0,2,-16),new THREE.Vector3(0,-1,0)).intersectObject(s.root,true);
  assert.equal(hits.length,0,'no kerb spans the centre of the T junction');
  const current=new THREE.Matrix4();s.apply();mesh.getMatrixAt(0,current);assert.equal(current.elements[0],0);
  mesh.getMatrixAt(1,current);assert.deepEqual(current.elements,before.elements,'bridge untouched');
  s.setEnabled(false);mesh.getMatrixAt(0,current);assert.deepEqual(current.elements,before.elements);
  s.setEnabled(true);s.apply();s.dispose();s.dispose();mesh.getMatrixAt(0,current);assert.deepEqual(current.elements,before.elements);
  assert.deepEqual(rects,[]);assert.equal(city.w.root.children.length,0);
});
