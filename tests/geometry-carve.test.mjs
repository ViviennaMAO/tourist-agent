import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {carveGeometryBox} from '../src/geometry-carve.js';

test('Box subtraction opens a wall across triangle edges without losing UV continuity',()=>{
 const original=new THREE.PlaneGeometry(4,4);original.setAttribute('surfacePosition',original.attributes.position.clone());
 const cut=carveGeometryBox(original,[-1,-1,-1],[1,1,1]),p=cut.attributes.position,uv=cut.attributes.uv;let area=0;
 const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();
 for(let i=0;i<p.count;i+=3){a.fromBufferAttribute(p,i);b.fromBufferAttribute(p,i+1);c.fromBufferAttribute(p,i+2);const centroid=a.clone().add(b).add(c).divideScalar(3);assert.ok(Math.abs(centroid.x)>=1-1e-6||Math.abs(centroid.y)>=1-1e-6);area+=b.clone().sub(a).cross(c.clone().sub(a)).length()/2;}
 assert.ok(Math.abs(area-12)<1e-5);assert.equal(original.index.count,6);
 for(let i=0;i<p.count;i++){assert.ok(Math.abs(uv.getX(i)-(p.getX(i)/4+.5))<1e-6);assert.ok(Math.abs(uv.getY(i)-(p.getY(i)/4+.5))<1e-6);}
 assert.ok(cut.attributes.normal.array.every(Number.isFinite));cut.dispose();original.dispose();
});
