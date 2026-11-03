import test from 'node:test';
import assert from 'node:assert/strict';
import { PerspectiveCamera,Vector3 } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {configureExploreCamera,keepCameraAboveGround,resetWalkingCamera} from '../src/explore-camera.js';

// Drive the actual Three.js control's mouse and single-finger input handlers.
class Canvas {
  style={};clientWidth=1280;clientHeight=720;events=new Map();
  addEventListener(type,fn){if(!this.events.has(type))this.events.set(type,new Set());this.events.get(type).add(fn);}
  removeEventListener(type,fn){this.events.get(type)?.delete(fn);}
  setPointerCapture(){} releasePointerCapture(){}
  send(type,props={}){for(const fn of [...(this.events.get(type)||[])])fn({type,pointerId:1,button:0,clientX:600,pageX:600,clientY:500,pageY:500,preventDefault(){},...props});}
}
function fixture(aspect=16/9){
 const canvas=new Canvas(),camera=new PerspectiveCamera(35,aspect,.5,6000);
 camera.position.set(0,3,-16);const controls=new OrbitControls(camera,canvas);
 configureExploreCamera(controls);controls.target.set(0,3,-33);controls.enableDamping=true;controls.dampingFactor=.08;controls.update();
 const previous=camera.position.clone();
 controls.addEventListener('change',()=>{keepCameraAboveGround(camera,controls,1.38,1,previous);previous.copy(camera.position);});
 return {canvas,camera,controls};
}
for(const pointerType of ['mouse','touch'])for(const aspect of [16/9,9/16])test(`${pointerType} drag can reveal the Burj tip from street level at aspect ${aspect}`,()=>{
 const {canvas,camera,controls}=fixture(aspect),tip=new Vector3(0,47.34,-33);
 camera.updateMatrixWorld();assert.ok(tip.clone().project(camera).y>1,'tip starts above the screen');
 canvas.send('pointerdown',{pointerType});
 // Upward drag tilts the view upwards without changing player location.
 for(let y=490;y>=355;y-=5){canvas.send('pointermove',{pointerType,clientY:y,pageY:y});controls.update();assert.ok(camera.position.y>=2.38-1e-8);}
 canvas.send('pointerup',{pointerType});for(let i=0;i<150;i++)controls.update();
 camera.updateMatrixWorld();const ndc=tip.clone().project(camera);
 assert.ok(Math.abs(ndc.x)<1&&Math.abs(ndc.y)<1&&ndc.z<1,`tower tip inside frame: ${ndc.toArray()}`);
 assert.ok(camera.position.z>-20,'camera does not get pulled into the tower base');
 assert.ok(camera.getWorldDirection(new Vector3()).y>.7,'view really looks upward');
 const pos=camera.position.clone(),target=controls.target.clone();for(let i=0;i<60;i++)controls.update();
 assert.ok(camera.position.distanceTo(pos)<.0001&&controls.target.distanceTo(target)<.0001,'resting view does not drift');
 controls.dispose();
});
test('reset after an unfinished drag returns behind the avatar without residual spin',()=>{
 const {canvas,camera,controls}=fixture();canvas.send('pointerdown',{pointerType:'mouse'});canvas.send('pointermove',{pointerType:'mouse',clientY:200,pageY:200});canvas.send('pointerup',{pointerType:'mouse'});
 const player=new Vector3(7,1.38,-16);resetWalkingCamera(camera,controls,player,0);
 assert.ok(Math.abs(camera.position.z-(player.z-24))<1e-8,'reset follows avatar facing');
 assert.ok(Math.abs(camera.position.y-14.38)<1e-8);assert.ok(controls.target.distanceTo(player.clone().add(new Vector3(0,2,0)))<1e-8);
 const before=camera.position.clone();for(let i=0;i<120;i++)controls.update();assert.ok(camera.position.distanceTo(before)<1e-8);
 assert.ok(camera.getWorldDirection(new Vector3()).y<0);controls.dispose();
});
test('overview remains above ground and returning restores upward drag range',()=>{
 const {camera,controls}=fixture();configureExploreCamera(controls,true);assert.ok(controls.maxPolarAngle<Math.PI/2);assert.equal(controls.maxDistance,5000);
 configureExploreCamera(controls);assert.ok(controls.maxPolarAngle>2.9);assert.ok(controls.maxDistance>=200);
 camera.position.set(4,-3,8);controls.target.set(4,9,-7);const before=controls.target.clone().sub(camera.position);
 keepCameraAboveGround(camera,controls,4,1);assert.equal(camera.position.y,5);assert.ok(controls.target.clone().sub(camera.position).distanceTo(before)<1e-8);
 controls.dispose();
});
