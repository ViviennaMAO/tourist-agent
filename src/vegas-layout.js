// Keep the first lake/hotel study clear before procedural rocks/buildings scatter.
export const VEGAS_RESERVATIONS=[{x:-23,z:29.5,w:38,d:25}];
export const VEGAS_LAKE={x:-23,z:31,rx:15.5,rz:7.5,y:1.13};
export const VEGAS_HOTEL={x:-23,z:18.8,w:27,d:3.6,h:13,base:1};
export function vegasLakeObstacles(){
 const p=VEGAS_LAKE;
 // Thin strips approximate the ellipse without blocking the promenade corners.
 return Array.from({length:24},(_,i)=>{const z=-p.rz+(i+.5)*p.rz/12,outer=Math.max(0,Math.abs(z)-p.rz/24);return {x:p.x,z:p.z+z,w:2*p.rx*Math.sqrt(1-outer*outer/(p.rz*p.rz)),d:p.rz/12+.002};});
}
