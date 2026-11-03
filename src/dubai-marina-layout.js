// Shared geometry and navigation coordinates (Dubai-local metres).
export const WHEEL_ISLAND={x:58,z:29,r:20};
export const HARBOR={x:112,z:29,inner:32,outer:39,start:120,end:240};
export function polar(radius,degrees,center=HARBOR){const a=degrees*Math.PI/180;return {x:center.x+radius*Math.cos(a),z:center.z+radius*Math.sin(a)};}
export const MARINA_OUTLINE=[...Array.from({length:65},(_,i)=>{const p=polar(HARBOR.outer,HARBOR.start+i*(HARBOR.end-HARBOR.start)/64);return[p.x,p.z];}),...Array.from({length:65},(_,i)=>{const p=polar(HARBOR.inner,HARBOR.end-i*(HARBOR.end-HARBOR.start)/64);return[p.x,p.z];})];
export function onQuay(x,z){const dx=x-HARBOR.x,dz=z-HARBOR.z,r=Math.hypot(dx,dz),a=(Math.atan2(dz,dx)*180/Math.PI+360)%360;return r>=HARBOR.inner&&r<=HARBOR.outer&&a>=HARBOR.start&&a<=HARBOR.end;}
export function inPier(p,x,z){const dx=x-p.x,dz=z-p.z;return Math.abs(Math.cos(p.yaw)*dx-Math.sin(p.yaw)*dz)<=p.w/2&&Math.abs(Math.sin(p.yaw)*dx+Math.cos(p.yaw)*dz)<=p.d/2;}
export const MARINA_PIERS=[132,156,180,204,228].map(angle=>({...polar(23.5,angle),angle,yaw:-angle*Math.PI/180,w:17,d:1.2,height:1.16}));
export const MARINA_BOATS=[140,148,164,172,188,196,212,220].map((angle,i)=>({...polar(24,angle),angle,yaw:-Math.PI/2-angle*Math.PI/180,length:i%2?9.2:12,width:i%2?1.65:2.05,decks:i%2?1:3,kind:i%2?'yacht':'cruiser'}));
const labels=['COVE CAFE','PALM BISTRO','SEA & SALT','MARINA CAFE','THE TERRACE','BAY KITCHEN','COFFEE HOUSE','PIER CAFE','HARBOR GRILL','DOCKSIDE'];
export const MARINA_CAFES=[...[75,120,165,210,255,300].map((angle,i)=>({...polar(14.4,angle,WHEEL_ISLAND),w:6,d:3.4,yaw:Math.PI/2-angle*Math.PI/180,label:labels[i]})),...[130,150,210,230].map((angle,i)=>({...polar(37,angle),w:5.8,d:3,yaw:-Math.PI/2-angle*Math.PI/180,label:labels[i+6]}))];
export function cafePoint(c,x,z){return {x:c.x+Math.cos(c.yaw)*x+Math.sin(c.yaw)*z,z:c.z-Math.sin(c.yaw)*x+Math.cos(c.yaw)*z};}
export const MARINA_OBSTACLES=MARINA_CAFES.flatMap(c=>{
 const a=Math.abs(Math.cos(c.yaw)),b=Math.abs(Math.sin(c.yaw));
 return [{x:c.x,z:c.z,w:a*c.w+b*c.d,d:b*c.w+a*c.d,walkShape:{w:c.w,d:c.d,ry:c.yaw}},...[-1.8,1.8].map(x=>({...cafePoint(c,x,c.d/2+1.3),w:1.3,d:1.3}))];
});
