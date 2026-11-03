import {ABU_OBSTACLES} from './abudhabi-layout.js';
import {ABU_DETAIL_OBSTACLES} from './abudhabi-details.js';
import {ABU_VENUE_AISLES} from './abudhabi-landscape.js';

export function planAbuInfill(ctx,gardens=[]){
 const out=[],reserved=[...gardens,...ABU_OBSTACLES,...ABU_DETAIL_OBSTACLES,...ABU_VENUE_AISLES,
  {x:-54,z:20,w:8,d:23},{x:-15,z:40,w:36,d:9}];
 const rows=[[-72,-64,-10],[-61,-64,-10],[-52,-64,-38],[-38,-64,-40],[4,46,66],[17,20,27],[30,20,27]];
 for(const [z,lo,hi] of rows)for(let x=lo;x<=hi;x+=6){
  const i=out.length,w=3.2+(i%3)*.35,d=3.4;
  if(!ctx.free(x,z,w+.6,d+.6))continue;
  if([...reserved,...out].some(p=>Math.abs(x-p.x)<(w+p.w)/2+1.3&&Math.abs(z-p.z)<(d+p.d)/2+1.3))continue;
  out.push({x,z,w,d,h:z<-50?9+(i*5%12):4.5+(i%3)*1.4,base:ctx.groundY(x,z),indices:{},infill:true});
 }
 return out;
}
