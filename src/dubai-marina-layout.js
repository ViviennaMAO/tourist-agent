// Shared local-Dubai layout for geometry, collision and shore access.
export const MARINA_PIERS = [-4,7,18,29,40].map(z=>({x:94,z,w:20,d:1.2,height:1.16}));
export const MARINA_BOATS = Array.from({length:8},(_,i)=>({
  x:i%2?93:95,z:-1+Math.floor(i/2)*11+(i%2)*5,
  length:i%2?10.4+(i%3)*.6:15.2+(i%3)*.5,
  width:i%2?2.6:3.6,decks:i%2?1:3,kind:i%2?'yacht':'cruiser'
}));
export const MARINA_CAFES = [
  {x:48,z:22,w:6.2,d:4,yaw:-Math.PI/2,label:'COVE CAFE'},
  {x:48,z:31,w:6.2,d:4,yaw:-Math.PI/2,label:'PALM BISTRO'},
  {x:48,z:36.5,w:7,d:4.2,yaw:0,label:'SEA & SALT'},
  {x:59,z:36.5,w:7,d:4.2,yaw:0,label:'MARINA CAFE'},
  {x:70,z:36.5,w:7,d:4.2,yaw:0,label:'THE TERRACE'},
  {x:58,z:16,w:7,d:4,yaw:Math.PI,label:'BAY KITCHEN'},
  {x:70,z:16,w:7,d:4,yaw:Math.PI,label:'COFFEE HOUSE'},
  {x:77.7,z:0,w:6.2,d:3.6,yaw:Math.PI/2,label:'PIER CAFE'},
  {x:77.7,z:16,w:6.2,d:3.6,yaw:Math.PI/2,label:'HARBOR GRILL'},
  {x:77.7,z:25,w:6.2,d:3.6,yaw:Math.PI/2,label:'DOCKSIDE'}
];
export function cafePoint(c,x,z){return {x:c.x+Math.cos(c.yaw)*x+Math.sin(c.yaw)*z,z:c.z-Math.sin(c.yaw)*x+Math.cos(c.yaw)*z};}
export const MARINA_OBSTACLES=MARINA_CAFES.flatMap(c=>{
  const swap=Math.abs(Math.sin(c.yaw))>.5;
  return [{x:c.x,z:c.z,w:swap?c.d:c.w,d:swap?c.w:c.d},...[-1.8,1.8].map(x=>({...cafePoint(c,x,c.d/2+1.5),w:1.3,d:1.3}))];
});
