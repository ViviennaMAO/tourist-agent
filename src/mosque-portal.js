import * as THREE from 'three';

// Only the central source surround is replaced; the side bays and upper wall stay.
export const MOSQUE_PORTAL_CUT={min:[-.716,-.025,8.169],max:[.716,2.173,8.53]};
export function mosquePortalPath(){
 const p=new THREE.Path();p.moveTo(.488,0);p.lineTo(.488,.914);
 p.bezierCurveTo(.488,1.08,.57,1.28,.522,1.431);
 p.bezierCurveTo(.49,1.7,.26,1.88,0,2.011);
 p.bezierCurveTo(-.26,1.88,-.49,1.7,-.522,1.431);
 p.bezierCurveTo(-.57,1.28,-.488,1.08,-.488,.914);p.lineTo(-.488,0);return p;
}
export function mosquePortalGeometry(){
 const shape=new THREE.Shape();shape.moveTo(-.715,0);shape.lineTo(-.715,2.172);shape.lineTo(.715,2.172);shape.lineTo(.715,0);
 for(const p of mosquePortalPath().getPoints(32))shape.lineTo(p.x,p.y);
 shape.closePath();return new THREE.ExtrudeGeometry(shape,{depth:.358,bevelEnabled:false,curveSegments:32}).translate(0,0,8.17);
}
export function buildMosquePortal({add,box,white,trim=white,stone,gold}){
 add(mosquePortalGeometry(),white);
 for(const [scale,z,r,m] of [[1.03,8.553,.025,trim],[1.13,8.55,.014,stone]]){
  const points=mosquePortalPath().getPoints(32).map(p=>new THREE.Vector3(p.x*scale,p.y+(scale-1)*.16,z));
  add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),64,r,6,false),m);
 }
 box(trim,0,2.185,8.56,1.51,.045,.09);
 for(const sign of [-1,1]){
  box(trim,sign*.737,1.09,8.56,.045,2.18,.09);
  box(trim,sign*.618,.11,8.56,.17,.22,.19);
  box(trim,sign*.641,1.08,8.56,.11,.1,.12);
 }
 // Fine jamb inlays and a restrained fan motif above the pointed crown.
 for(let k=-3;k<=3;k++){
  const a=k*.2;
  add(new THREE.SphereGeometry(.013,8,6).scale(1,3,.5).rotateZ(-a).translate(Math.sin(a)*.16,2.075+Math.cos(a)*.035,8.552),gold);
 }
}
