import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { pointInPolygon } from './shore-profile.js';
import { chamferedBox } from './chamfered-box.js';

const distanceToRoad=(x,z,r)=>{
  const dx=r.B[0]-r.A[0],dz=r.B[1]-r.A[1],t=Math.max(0,Math.min(1,((x-r.A[0])*dx+(z-r.A[1])*dz)/(dx*dx+dz*dz||1)));
  return Math.hypot(x-r.A[0]-t*dx,z-r.A[1]-t*dz);
};

/** Exposed shore of the UNION of source islands. No wall at frond/trunk
 * intersections, hotel-pad overlaps, the pilot promenade or bridge landings. */
export function coastSamples(islands,roads=[],step=.48) {
  const outlines=islands.filter(i=>i.outline?.length>2),samples=[];
  for(const [sourceIndex,island] of outlines.entries()) {
    const p=island.outline;
    const area=p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-b[0]*a[1];},0);
    for(let i=0;i<p.length;i++) {
      const a=p[i],b=p[(i+1)%p.length],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);
      if(length<1e-6)continue;
      const tx=dx/length,tz=dz/length,nx=tz*Math.sign(area),nz=-tx*Math.sign(area),n=Math.ceil(length/step);
      for(let j=0;j<n;j++) {
        const t=(j+.5)/n,x=a[0]+dx*t,z=a[1]+dz*t;
        if(island.id==='mainland'&&x>=-33&&x<=-7&&z>-5.1)continue;
        if(outlines.some((other,k)=>k!==sourceIndex&&pointInPolygon(other.outline,x+nx*.53,z+nz*.53)))continue;
        if(roads.some(r=>r.kind!=='canal'&&distanceToRoad(x,z,r)<(r.hw||2.3)+.6))continue;
        samples.push({x,z,tx,tz,nx,nz,length:length/n,id:island.id,sourceIndex});
      }
    }
  }
  return samples;
}

export function createDubaiCoast({THREE,city,stoneMaterial}) {
  const root=new THREE.Group();root.name='Dubai — complete island revetments';
  const halos=[];
  city.w.root.traverse(mesh=>{if(mesh.isMesh&&mesh.userData.shoreline){const before=mesh.material,after=before.clone();after.color.set('#647d7c');after.opacity=before.opacity*.08;halos.push({mesh,before,after});}});
  const samples=coastSamples(city.w.ctx.islands,city.w.ctx.roads);
  const cap=stoneMaterial.clone();cap.onBeforeCompile=stoneMaterial.onBeforeCompile;cap.customProgramCacheKey=stoneMaterial.customProgramCacheKey;cap.color.set('#c9bba2');
  const rock=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.96});
  rock.onBeforeCompile=shader=>{
    shader.vertexShader='varying vec3 coastPoint;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ncoastPoint=position;');
    shader.fragmentShader=`varying vec3 coastPoint;
      float coastHash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
      float coastNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
        return mix(mix(mix(coastHash(i),coastHash(i+vec3(1,0,0)),f.x),mix(coastHash(i+vec3(0,1,0)),coastHash(i+vec3(1,1,0)),f.x),f.y),
          mix(mix(coastHash(i+vec3(0,0,1)),coastHash(i+vec3(1,0,1)),f.x),mix(coastHash(i+vec3(0,1,1)),coastHash(i+vec3(1,1,1)),f.x),f.y),f.z);}
    `+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      float coastWet=1.-smoothstep(.16,.40,coastPoint.y+.018*sin(coastPoint.x*8.+coastPoint.z*5.));
      float coastGrain=coastNoise(coastPoint*32.);
      diffuseColor.rgb*=mix(1.,.58,coastWet)*(.82+.24*coastGrain);
    `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,.56,coastWet);');
    shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
      float relief=coastGrain*.005+coastNoise(coastPoint*9.)*.009;
      vec3 dx=dFdx(-vViewPosition),dy=dFdy(-vViewPosition),rx=cross(dy,normal),ry=cross(normal,dx);
      float det=dot(dx,rx);normal=normalize(abs(det)*normal-sign(det)*(dFdx(relief)*rx+dFdy(relief)*ry));
    `);
  };rock.customProgramCacheKey=()=> 'coast-wet-fieldstone-v2';
  const backing=new THREE.MeshStandardMaterial({color:'#82735d',roughness:1});
  const batches=new Map([[cap,[]],[rock,[]],[backing,[]]]);
  const add=(g,m)=>{if(g.index){const n=g.toNonIndexed();g.dispose();g=n;}batches.get(m).push(g);};
  let seed=21073;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const palette=['#8c806e','#9f8f75','#837967','#aa9a80','#948a77'].map(c=>new THREE.Color(c));
  function place(g,s,along,out,y=0){g.rotateY(-Math.atan2(s.tz,s.tx));g.translate(s.x+s.tx*along+s.nx*out,y,s.z+s.tz*along+s.nz*out);return g;}
  // Each rough stone is a chipped polygon with a bulging, faceted outer face.
  function fieldstone(w,h,depth,index) {
    const outline=[[-.5,-.34],[-.34,-.5],[.32,-.48],[.5,-.24],[.46,.30],[.23,.5],[-.33,.45],[-.5,.18]];
    const vertices=[0,0,depth+.008];
    for(const [x,y] of outline)vertices.push(x*w*(.86+rand()*.26),y*h*(.86+rand()*.26),depth*(.94+rand()*.06));
    for(const [x,y] of outline)vertices.push(x*w,y*h,-.08);
    const indices=[];
    for(let k=0;k<8;k++){const a=k+1,b=(k+1)%8+1;indices.push(0,a,b,a,a+8,b,b,a+8,b+8);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);
    const tint=palette[index%palette.length],colors=[];
    for(let i=0;i<17;i++){const c=tint.clone().multiplyScalar(.95+rand()*.08);colors.push(c.r,c.g,c.b);}
    g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    const flat=g.toNonIndexed();g.dispose();flat.computeVertexNormals();return flat;
  }
  for(const [i,s] of samples.entries()) {
    // Caps are smaller and regular; the rubble below varies in height and depth.
    add(place(chamferedBox(s.length+.006,.11,.63,.014),s,0,.20,1.015),cap);
    add(place(new THREE.BoxGeometry(s.length+.015,.9,.28),s,0,.36,.51),backing);
    for(let row=0;row<3;row++) {
      const height=.24+rand()*.12,shift=((row===1?.17:-.08)+(rand()-.5)*.22)*s.length;
      const g=fieldstone(s.length*(.88+rand()*.16),height,.16+rand()*.09,i*3+row);
      // Local +Z must face the water for either polygon winding.
      g.rotateZ((rand()-.5)*.20);
      if(s.nx*(-s.tz)+s.nz*s.tx<0)g.rotateX(Math.PI);
      add(place(g,s,shift,.43,.20+row*.29+(rand()-.5)*.075),rock);
    }
  }
  for(const [mat,parts] of batches)if(parts.length){const geo=mergeGeometries(parts);parts.forEach(g=>g.dispose());const mesh=new THREE.Mesh(geo,mat);mesh.receiveShadow=true;mesh.castShadow=false;root.add(mesh);}
  city.w.root.add(root);root.visible=false;let disposed=false,enabled=false;
  const stats={shoreSections:samples.length,shoreIslands:new Set(samples.map(s=>s.sourceIndex)).size,triangles:root.children.reduce((n,m)=>n+m.geometry.attributes.position.count/3,0),drawCalls:root.children.length};
  return {root,samples,stats,apply(){if(enabled&&!disposed)for(const h of halos)h.after.opacity=h.before.opacity*.08;},setEnabled(v){enabled=!!v&&!disposed;root.visible=enabled;for(const h of halos)h.mesh.material=enabled?h.after:h.before;},dispose(){if(disposed)return;this.setEnabled(false);disposed=true;root.removeFromParent();root.children.forEach(m=>m.geometry.dispose());[cap,rock,backing,...halos.map(h=>h.after)].forEach(m=>m.dispose());}};
}
