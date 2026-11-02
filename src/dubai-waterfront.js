import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { installStoneWear } from './stone-wear.js';
import { appendDubaiVilla } from './dubai-villas.js';
import { chamferedBox } from './chamfered-box.js';
import { installCourtyardBounce } from './courtyard-bounce.js';

/** A bounded waterfront pilot: two inward-facing shops frame the public square.
 * New collisions are owned here and are removed on A/B or disposal. */
export function createDubaiWaterfront({ THREE, city, stoneMaterial }) {
  const root = new THREE.Group(); root.name = 'Dubai — waterfront courtyard pilot';
  const ctx = city.w.ctx, batches = new Map(), materials = [], footprints = [];
  let enabled = false, disposed = false;
  function finish(color, roughness = .8, extra = {}) {
    const m = new THREE.MeshStandardMaterial({ color, roughness, ...extra });
    materials.push(m); batches.set(m, []); return m;
  }
  const wall = stoneMaterial.clone(); wall.color.set('#f5edda');
  wall.onBeforeCompile = stoneMaterial.onBeforeCompile; wall.customProgramCacheKey = stoneMaterial.customProgramCacheKey;
  materials.push(wall); batches.set(wall, []);
  const trim=stoneMaterial.clone();trim.color.set('#e4d8c0');
  trim.onBeforeCompile=stoneMaterial.onBeforeCompile;trim.customProgramCacheKey=stoneMaterial.customProgramCacheKey;
  materials.push(trim);batches.set(trim,[]);
  for(const m of [wall,trim])installStoneWear(m,city.w.root.position.clone());
  const metal = finish('#423c30', .42, { metalness: .65 });
  const glass = finish('#536563', .17, { metalness: .35, envMapIntensity: 1.5 });
  const shopGlass = finish('#c5d8d1', .12, { metalness: .12, transparent: true, opacity: .13, depthWrite: false, envMapIntensity: 1.4 });
  const roof = finish('#b0a38a'), recess = finish('#635340'), wood = finish('#765231');
  const amberGlass = finish('#8f7958', .25, { emissive: '#d39b53', emissiveIntensity: .1 });
  const lanternGlass = finish('#ffdf9e', .4, { emissive: '#ffbd68', emissiveIntensity: 1.2 });
  const plantGreen = finish('#566638'), flowers = finish('#b85177');
  for(const m of [glass,shopGlass,amberGlass])m.userData.cityGlass=true;
  const finishes = { wall, trim, metal, glass, shopGlass, roof, recess, wood, amberGlass, lanternGlass, plantGreen, flowers };
  const bounce={value:1};
  for(const m of [wall,trim,recess,wood,roof])installCourtyardBounce(m,city.w.root.position.clone(),bounce);
  let transform = new THREE.Matrix4();
  function add(g, m) {
    if (!g.index) g.setIndex(Array.from({length:g.attributes.position.count}, (_, i) => i));
    g.applyMatrix4(transform); batches.get(m).push(g);
  }
  function box(m, x, y, z, w, h, d, ry = 0) {
    const dressed=(m===wall||m===trim)&&((h>.8&&w>=.14&&w<=.35&&d>=.14&&d<=.5)||(m===trim&&w>4&&d>3&&h<.25));
    const g=dressed?chamferedBox(w,h,d,.022):new THREE.BoxGeometry(w,h,d);
    if(m.userData.paving){const indices=Array.from(g.index.array);g.setIndex([...indices.slice(0,18),...indices.slice(24)]);}
    add(g.rotateY(ry).translate(x, y, z), m);
  }
  for (const [i, x, ry] of [[0, -29.15, Math.PI / 2], [1, -10.85, -Math.PI / 2]]) {
    const z = -9.8, w = 6.4, d = 4.7, base = ctx.groundY(x, z);
    // Footprint dimensions are swapped for the ninety-degree facades.
    if (!ctx.free(x, z, d, w)) continue;
    footprints.push({x, z, w:d, d:w});
    transform = new THREE.Matrix4().makeRotationY(ry).setPosition(x, base, z);
    appendDubaiVilla({THREE, b:{w, d, h:9, interior:true}, h:i ? 6.1 : 5.8, index:i,
      finishes, box, add});
    const h=i?6.1:5.8, floor=Math.min(2.85,h*.47), front=d/2;
    // Stepped cornices and corner pilasters catch sunlight on actual returns.
    // All additions sit within the two existing pilot collision envelopes.
    for(const side of [-1,1]) {
      for(const [yy,thick,inset] of [[floor-.2,.07,.05],[h-.42,.09,.06],[h-.29,.045,.025]]) {
        box(trim,side*(w/2-.075),yy,-.56,.15,thick,d-1.15);
        if(side===1) box(trim,0,yy,-d/2+inset,w-.08,thick,inset*2);
      }
      for(const z of [-d/2+.11,front-1.25]) {
        box(trim,side*(w/2-.11),h/2-.15,z,.20,h-.42,.20);
        box(trim,side*(w/2-.14),.34,z,.28,.15,.25);
      }
    }
    // Open eight-point bronze patterns retain the view into the shaded loggia.
    for(let panel=0;panel<12;panel++) {
      const x=-w/2+.43+panel*(w-.86)/11;
      for(const turn of [0,Math.PI/4]) for(let edge=0;edge<4;edge++) {
        const a=turn+edge*Math.PI/2;
        add(new THREE.BoxGeometry(.235,.022,.027).translate(0,.1175,0)
          .rotateZ(a).translate(x,floor+.58,front-.071),metal);
      }
    }
    // Individual dentils under the arcade's stone string course.
    for(let k=0;k<28;k++) box(trim,-w/2+.2+k*(w-.4)/27,floor-.24,front-.05,.08,.11,.1);
  }
  // Pale paving with modest colour variation and actual thin joints. A darker
  // border describes the square without a raised step in the walking route.
  transform.identity();
  const pavers = ['#c9bea9', '#d0c6b3', '#c1b6a3'].map(c => {
    // These slabs already have geometric joints. A second tiled wall map
    // created dark dashes and false seams across their faces.
    const m=finish(c,.9);m.userData.paving=true;return m;
  });
  const y = ctx.groundY(-20, -9.4);
  for (let row = 0; row < 14; row++) {
    const z=-12.825+row*.525;
    let left=-32, col=0;
    while(left<-8) {
      const hash=(Math.imul(row+7,73856093)^Math.imul(col+11,19349663))>>>0;
      const width=Math.min(.55*(1+hash%3),-8-left), x=left+width/2;
      left+=width;col++;
      if (footprints.some(r => Math.abs(x-r.x)<r.w/2+width/2 && Math.abs(z-r.z)<r.d/2+.263)) continue;
      box(pavers[hash%7<4?0:hash%2+1], x, y+.022, z, width-.014, .022, .511);
    }
  }
  for (const z of [-13.04, -5.76]) box(trim, -20, y+.023, z, 24, .025, .12);
  const ring = new THREE.RingGeometry(2.66, 3.02, 80).rotateX(-Math.PI/2).translate(-20,y+.038,-9.4);
  add(ring, trim);
  for (const [m, geos] of batches) {
    if (!geos.length) continue;
    const g = mergeGeometries(geos); geos.forEach(p => p.dispose());
    const mesh = new THREE.Mesh(g, m); mesh.castShadow = !m.transparent; mesh.receiveShadow = true;
    // Use the continuous ground below for contact depth. Millimetre joints
    // are smaller than an AO texel and otherwise appear as broken black dots.
    if (pavers.includes(m)) mesh.userData.skipContact = true;
    root.add(mesh);
  }
  city.w.root.add(root); root.visible = false;
  const stats = { buildings:footprints.length, pilot:true, triangles:root.children.reduce((s,m)=>s+m.geometry.index.count/3,0), drawCalls:root.children.length };
  return {root, footprints, stats, setBounce(v){bounce.value=v?1:0;}, apply(){}, setEnabled(value) {
    if (disposed || enabled === !!value) return;
    enabled = !!value; root.visible = enabled;
    if (enabled) ctx.rects.push(...footprints);
    else for (const r of footprints) { const i=ctx.rects.indexOf(r); if(i>=0) ctx.rects.splice(i,1); }
  }, dispose() {
    if(disposed) return; this.setEnabled(false); disposed=true; root.removeFromParent();
    root.children.forEach(m=>m.geometry.dispose()); materials.forEach(m=>m.dispose());
  }};
}
