import {shoreBulge} from '../src/shore-profile.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {quayCells,createQuayStone,quayContour} from '../src/quay-stones.js';

test('quay front is watertight across each broad crown and keeps relief outside the old seawall',()=>{
  const material=new THREE.MeshBasicMaterial();
  for(const cell of quayCells().filter((_,i)=>i%7===0)){
    const geometry=createQuayStone(cell),mesh=new THREE.Mesh(geometry,material);mesh.updateMatrixWorld(true);
    const depths=[];
    for(const p of cell.polygon)for(const t of [0,.45,.85]){
      const x=cell.center[0]+(p[0]-cell.center[0])*t,y=cell.center[1]+(p[1]-cell.center[1])*t;
      const hit=new THREE.Raycaster(new THREE.Vector3(x,y,1+shoreBulge(x)),new THREE.Vector3(0,0,-1)).intersectObject(mesh)[0];
      assert.ok(hit,'no holes between the crown and chipped rim');
      const z=hit.point.z-shoreBulge(x);assert.ok(z>-4.5&&z<-4.2,'old seawall cannot clip through exposed rock');depths.push(z);
    }
    const relief=Math.max(...depths)-Math.min(...depths);assert.ok(relief>.015&&relief<.14,'broad relief rather than flat tiles or sharp spikes');geometry.dispose();
  }
  material.dispose();
});

test('irregular quay stones are deterministic, nondegenerate and remain below the shore walkway',()=>{
  const cells=quayCells();assert.deepEqual(cells,quayCells());assert.ok(cells.length>=200&&cells.length<=260);
  let totalArea=0;const heights=new Set(),widths=[];
  for(const cell of cells){
    assert.ok(cell.polygon.length>=3);
    widths.push(Math.max(...cell.polygon.map(p=>p[0]))-Math.min(...cell.polygon.map(p=>p[0])));
    let area=0;
    cell.polygon.forEach((p,i)=>{const q=cell.polygon[(i+1)%cell.polygon.length];area+=p[0]*q[1]-q[0]*p[1];});
    area=Math.abs(area)/2;assert.ok(area>.015);totalArea+=area;
    heights.add(Math.round(cell.center[1]*100));
    const g=createQuayStone(cell),p=g.attributes.position;
    for(const a of Object.values(g.attributes))assert.ok(a.array.every(Number.isFinite));
    for(let i=0;i<p.count;i++){
      assert.ok(p.getX(i)>-33.02&&p.getX(i)<-6.98);
      assert.ok(p.getY(i)>0&&p.getY(i)<1.01);
      assert.ok(p.getZ(i)-shoreBulge(p.getX(i))>-5.3&&p.getZ(i)-shoreBulge(p.getX(i))<-4.2);
    }
    g.dispose();
  }
  assert.ok(totalArea>18&&totalArea<26*.94,'insets should leave narrow joints, not gaps or overlaps');
  assert.ok(heights.size>35,'stone centres should not form three straight courses');
  widths.sort((a,b)=>a-b);
  assert.ok(widths[Math.floor(widths.length*.95)]<.8,'95% of stones stay below 80 cm wide');
  assert.ok(widths[Math.floor(widths.length*.5)]<.55,'typical stones are smaller than the coping slabs');
  const contour=cells.map(c=>quayContour(c.center[0]));
  assert.ok(Math.max(...contour)-Math.min(...contour)>.18);
});
