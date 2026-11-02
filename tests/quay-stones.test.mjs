import {shoreBulge} from '../src/shore-profile.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {quayCells,createQuayStone,quayContour} from '../src/quay-stones.js';

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
