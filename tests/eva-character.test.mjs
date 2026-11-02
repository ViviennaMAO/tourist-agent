import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createEvaCharacter } from '../src/eva-character.js';

test('Eva is a bounded full-volume articulated model with lower detail NPC geometry',()=>{
  const face=new THREE.Texture();
  const player=createEvaCharacter({THREE,faceTexture:face});
  const npc=createEvaCharacter({THREE,faceTexture:face,detail:'medium',look:{dress:'#a6b39b',skin:'#c99978'}});
  for(const c of [player,npc]) {
    const bounds=new THREE.Box3().setFromObject(c.root),size=bounds.getSize(new THREE.Vector3());
    assert.ok(bounds.min.y>-.01&&bounds.max.y<3.3);
    assert.ok(size.x<1.2&&size.z>.7,'true-volume silhouette and controlled collision clearance');
    assert.ok(c.stats.drawCalls<=35);assert.ok(c.joints.some(j=>j.name==='knee -1'));
    c.root.traverse(o=>{if(!o.isMesh)return;for(const a of Object.values(o.geometry.attributes))assert.ok(a.array.every(Number.isFinite));
      if(o.geometry.index)assert.ok(o.geometry.index.array.every(i=>i<o.geometry.attributes.position.count));
    });
    const ray=new THREE.Raycaster(new THREE.Vector3(0,2.97,2),new THREE.Vector3(0,0,-1));
    assert.ok(ray.intersectObject(c.root,true).some(h=>h.object.material.map===face),'sculpted front face has outward winding and receives its albedo');
  }
  assert.ok(player.stats.triangles<50000&&npc.stats.triangles<30000);
  assert.ok(npc.stats.triangles<player.stats.triangles*.65);
  player.dispose();npc.dispose();
});

test('walk and run plant a sole, bend knees, preserve navigation position and freeze deterministically',()=>{
  for(const speed of [1,1.8]) {
    const c=createEvaCharacter({THREE});
    const feet=c.joints.filter(j=>j.name.startsWith('ankle'));
    const knees=c.joints.filter(j=>j.name.startsWith('knee'));
    const skirt=c.root.getObjectByName('Eva pleated A-line skirt');
    let lifted=false;
    for(let frame=0;frame<240;frame++) {
      c.animate(1/60,speed,frame/60);c.root.updateMatrixWorld(true);
      const ground=feet.map(f=>new THREE.Box3().setFromObject(f).min.y);
      assert.ok(Math.min(...ground)>-.015,'soles do not visibly pass through the ground');
      assert.ok(Math.min(...ground)<.025,'at least one foot remains planted');
      if(Math.max(...ground)>.06)lifted=true;
      for(const knee of knees) {
        const q=skirt.worldToLocal(knee.getWorldPosition(new THREE.Vector3()));
        const a=skirt.geometry.attributes.position;let front=-Infinity,back=Infinity;
        for(let i=0;i<a.count;i++)if(Math.abs(a.getY(i)-q.y)<.035){front=Math.max(front,a.getZ(i));back=Math.min(back,a.getZ(i));}
        assert.ok(q.z<front-.015&&q.z>back+.015,'cloth clears the moving knee through the gait cycle');
      }
    }
    assert.ok(lifted);assert.deepEqual(c.root.position.toArray(),[0,0,0]);
    c.animate(0,speed,180);c.root.updateMatrixWorld(true);
    const frozen=c.joints.map(j=>j.matrixWorld.elements.slice());
    c.animate(0,speed,180);c.root.updateMatrixWorld(true);
    assert.deepEqual(c.joints.map(j=>j.matrixWorld.elements),frozen);
    c.dispose();
  }
});

test('disposing characters releases owned geometry/materials once without destroying shared face texture',()=>{
  const texture=new THREE.Texture(),c=createEvaCharacter({THREE,faceTexture:texture});
  let textureDisposed=0,geometries=0;texture.addEventListener('dispose',()=>textureDisposed++);
  c.root.traverse(o=>{if(o.isMesh)o.geometry.addEventListener('dispose',()=>geometries++);});
  const expected=c.stats.drawCalls;c.dispose();c.dispose();c.animate(1/60,1,1);
  assert.equal(geometries,expected);assert.equal(textureDisposed,0);
});
