import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { appendDubaiHighrise } from '../src/dubai-highrises.js';

function tower(w,d,h,index) {
  const root=new THREE.Group(), materials={};
  for(const key of ['wall','trim','metal','skylineGlass','glass','amberGlass','roof','recess']) materials[key]=new THREE.MeshStandardMaterial();
  const stats=appendDubaiHighrise({THREE,b:{w,d},h,index,finishes:materials,
    add(geometry,material){root.add(new THREE.Mesh(geometry,material));},
    box(material,x,y,z,bw,bh,bd,angle=0){
      const g=new THREE.BoxGeometry(bw,bh,bd);g.rotateY(angle);g.translate(x,y,z);
      root.add(new THREE.Mesh(g,material));
    }});
  root.updateMatrixWorld(true);
  return {root,stats,dispose(){root.children.forEach(m=>m.geometry.dispose());Object.values(materials).forEach(m=>m.dispose());}};
}

test('all tower families fit narrow collision envelopes and retain differentiated setbacks',()=>{
  const families=new Set();
  for(const index of [0,1,2,3,4]) for(const [w,d,h] of [[3,3,8.01],[4,7,13.3],[8,3.2,17.2]]) {
    const t=tower(w,d,h,index);families.add(t.stats.towerFamily);
    assert.ok(t.stats.floors>=4);assert.ok(t.root.children.length*12<12000);
    t.root.children.forEach(m=>{
      const a=m.geometry.attributes.position;
      for(let i=0;i<a.count;i++) {
        const x=a.getX(i),y=a.getY(i),z=a.getZ(i);
        assert.ok([x,y,z].every(Number.isFinite));
        assert.ok(Math.abs(x)<=w/2+1e-5&&Math.abs(z)<=d/2+1e-5&&y>=-1e-5&&y<=h+1e-5);
      }
    });
    // The upper mass must retreat from the street-facing facade, not merely
    // paint a darker stripe on an unchanged box.
    const faceAt=y=>new THREE.Raycaster(new THREE.Vector3(.3,y,d/2+2),new THREE.Vector3(0,0,-1)).intersectObject(t.root,true)[0];
    if(t.stats.setbacks) assert.ok(faceAt(h-.9).distance>faceAt(3).distance+.2);
    t.dispose();
  }
  assert.equal(families.size,5);
});

test('tower lobby has a sheltered recess and the roof stays closed beneath its louvres',()=>{
  const t=tower(5,4,15,0);
  const ray=(x,y)=>new THREE.Raycaster(new THREE.Vector3(x,y,4),new THREE.Vector3(0,0,-1)).intersectObject(t.root,true)[0];
  const lobby=ray(.25,1.3),canopy=ray(.25,2.23);
  assert.ok(lobby.distance>2.6&&lobby.distance<2.8);
  assert.ok(canopy.distance<2.1);
  const roof=new THREE.Raycaster(new THREE.Vector3(0,17,0),new THREE.Vector3(0,-1,0)).intersectObject(t.root,true)[0];
  assert.ok(roof&&roof.point.y<15&&roof.point.y>14.8);
  t.dispose();
});


test('sloping crown has a closed roof with visibly different heights at its two ends',()=>{
  const t=tower(5,4,15,4);
  const down=x=>new THREE.Raycaster(new THREE.Vector3(x,17,0),new THREE.Vector3(0,-1,0)).intersectObject(t.root,true)[0];
  const high=down(-1.5),low=down(1.5);
  assert.ok(high&&low&&high.point.y-low.point.y>.4);
  assert.ok(low.point.y>14.2&&high.point.y<15);
  t.dispose();
});
