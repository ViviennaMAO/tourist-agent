// Reference-driven infill stays inside the rail ring and away from the moat,
// existing buildings/trees, landmark reservations and pedestrian approaches.
export function planTokyoInfill(ctx){
 const buildings=[],reserved=[{x:-24,z:-44,w:16,d:18},{x:-44.7,z:-25,w:2.2,d:55},{x:-44.7,z:25,w:2.2,d:25},{x:12,z:-12,w:8,d:6}];
 const rows=[[-68,-62,38],[-61,-62,38],[-47,35,62],[-39,35,62],[-18,49,62],[-8,32,62],[0,-31,35],[16,8,38],[25,8,38],[34,8,38],[-14,-32,-16]];
 for(const [z0,lo,hi] of rows)for(let x=lo;x<=hi;x+=5.6){
  const i=buildings.length,w=3.2+(i%3)*.35,d=3.15+(i%2)*.4,z=z0+Math.sin(x*7.3)*.3;
  const q={x,z,w,d};
  if(!ctx.free(x,z,w+.65,d+.65))continue;
  if([...reserved,...buildings].some(b=>Math.abs(x-b.x)<(w+b.w)/2+1.35&&Math.abs(z-b.z)<(d+b.d)/2+1.35))continue;
  // Short frontage blocks in the south; a varied taller background in the north.
  const h=z<-55?8+(i*7%15):z<-30?6+(i*5%9):3.8+(i*3%6);
  buildings.push({...q,h,base:ctx.groundY(x,z),style:'mixed',indices:{},infill:true});
 }
 return buildings;
}
export function createTokyoInfillReservations(ctx,buildings){
 const obstacles=buildings.map(({x,z,w,d})=>({x,z,w:w+.38,d:d+.38}));let active=false;
 return {stats:{tokyoInfill:buildings.length},apply(){},setEnabled(v){if(active===!!v)return;active=!!v;if(active)ctx.rects.push(...obstacles);else ctx.rects=ctx.rects.filter(q=>!obstacles.includes(q));},dispose(){this.setEnabled(false);}};
}

// River bend along the existing diagonal watercourse. Trunks remain on dry
// banks; their crowns may overhang the water, as in the supplied photo.
export function planTokyoRiverTrees(ctx,extraBuildings=[]){
 const trees=[],A=[-6,-22],B=[-41.5,50.5],dx=B[0]-A[0],dz=B[1]-A[1],L=Math.hypot(dx,dz),nx=dz/L,nz=-dx/L;
 for(let j=0;j<10;j++)for(const side of [-1,1]){
  const t=.25+j*.055,x=A[0]+dx*t+nx*side*5.9,z=A[1]+dz*t+nz*side*5.9;
  if(!ctx.free(x,z,1.2,1.2)||extraBuildings.some(b=>Math.abs(x-b.x)<b.w/2+1.1&&Math.abs(z-b.z)<b.d/2+1.1))continue;
  trees.push({x,z,y:ctx.groundY(x,z),sc:1.15+(j%3)*.08,ry:0,kind:'sakura',river:true,lean:[-nx*side,-nz*side]});
 }
 return trees;
}
