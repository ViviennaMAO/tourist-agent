// First-pass, walkable miniature composition; not a surveyed city map.
export const ABU_POOLS=[{x:-25,z:39,w:10,d:1.65},{x:-5,z:39,w:10,d:1.65}];
export const ABU_BEDS=[-59,-47,24,36,48,60].map(x=>({x,z:40,w:5.2,d:1.4}));
export const ABU_BENCHES=[-59,-47,24,36,48,60].map(x=>({x,z:43.4,w:2.2,d:.65}));
export const ABU_OBSTACLES=[...ABU_POOLS,...ABU_BEDS,...ABU_BENCHES];
export function abuPromenade(x,z){return z>=37.7&&z<=45&&((x>=-66&&x<=6)||(x>=14&&x<=66));}
