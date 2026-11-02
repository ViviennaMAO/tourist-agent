import * as THREE from 'three';

export function archPoint(t,r,h,offset=0){
  const right=t<=.5,u=right?t*2:(1-t)*2,sign=right?1:-1;
  const x=sign*r*(1-u*u),y=h*(1.3*u-.3*u*u);
  const dx=-2*r*u,dy=h*(1.3-.6*u),l=Math.hypot(dx,dy);
  return new THREE.Vector2(x+sign*dy/l*offset,y-dx/l*offset);
}
export function pointedSpandrel(r,h,spring,top){
  const shape=new THREE.Shape();shape.moveTo(-r,spring);shape.lineTo(-r,top);shape.lineTo(r,top);shape.lineTo(r,spring);
  for(let i=1;i<=32;i++){const p=archPoint(i/32,r,h);shape.lineTo(p.x,p.y+spring);}shape.closePath();
  // Actual small open stars in the solid spandrel, with a safe border around
  // the intrados and top moulding. They cast light; no painted lattice decal.
  for(let y=spring+.14;y<top-.07;y+=.17)for(let x=-r+.09;x<r-.07;x+=.17){
    const u=Math.sqrt(Math.max(0,1-Math.abs(x)/r)),archY=spring+h*(1.3*u-.3*u*u);
    if(y<archY+.13)continue;
    const hole=new THREE.Path();
    for(let j=0;j<16;j++){const a=-j*Math.PI/8,rr=j%2?.023:.042;
      const px=x+Math.cos(a)*rr,py=y+Math.sin(a)*rr;j?hole.lineTo(px,py):hole.moveTo(px,py);}
    hole.closePath();shape.holes.push(hole);
  }
  return shape;
}
