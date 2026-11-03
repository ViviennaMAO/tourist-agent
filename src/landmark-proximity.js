export const CHECKIN_RANGE=7;
/** Optional shore viewpoints use a small explicit visit area, without expanding
 * a landmark's collision or permitting the player to cross its surrounding water. */
export function landmarkVisitDistance(position,center,radius,spot,origin=[0,0]){
 const edge=Math.hypot(position.x-center.x,position.z-center.z)-radius;
 if(!spot)return edge;
 const view=Math.hypot(position.x-origin[0]-spot.pos[0],position.z-origin[1]-spot.pos[1]);
 return Math.min(edge,view+CHECKIN_RANGE-spot.radius);
}
