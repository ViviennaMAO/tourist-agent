import test from 'node:test';
import assert from 'node:assert/strict';
import {quayCells,createQuayStone,quayContour} from '../src/quay-stones.js';

test('irregular quay stones are deterministic, nondegenerate and remain below the shore walkway',()=>{
  const cells=quayCells();assert.deepEqual(cells,quayCells());assert.equal(cells.length,90);
  let totalArea=0;const heights=new Set();
  for(const cell of cells){
    assert.ok(cell.polygon.length>=3);
    let area=0;
    cell.polygon.forEach((p,i)=>{const q=cell.polygon[(i+1)%cell.polygon.length];area+=p[0]*q[1]-q[0]*p[1];});
    area=Math.abs(area)/2;assert.ok(area>.015);totalArea+=area;
    heights.add(Math.round(cell.center[1]*100));
    const g=createQuayStone(cell),p=g.attributes.position;
    for(const a of Object.values(g.attributes))assert.ok(a.array.every(Number.isFinite));
    for(let i=0;i<p.count;i++){
      assert.ok(p.getX(i)>-33.02&&p.getX(i)<-6.98);
      assert.ok(p.getY(i)>0&&p.getY(i)<1.01);
      assert.ok(p.getZ(i)>-5.3&&p.getZ(i)<-4.2);
    }
    g.dispose();
  }
  assert.ok(totalArea>18&&totalArea<26*.94,'insets should leave narrow joints, not gaps or overlaps');
  assert.ok(heights.size>35,'stone centres should not form three straight courses');
  const contour=cells.map(c=>quayContour(c.center[0]));
  assert.ok(Math.max(...contour)-Math.min(...contour)>.18);
});
