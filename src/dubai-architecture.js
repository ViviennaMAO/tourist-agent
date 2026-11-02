import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { appendDubaiHighrise } from './dubai-highrises.js';
import { appendDubaiVilla } from './dubai-villas.js';
import { installCurtainWallFinish } from './curtain-wall.js';
import { installSkylineAtmosphere } from './skyline-atmosphere.js';
import { chamferedBox } from './chamfered-box.js';
import { installDistrictBounce } from './district-bounce.js';
import { appendIslandVilla } from './island-villa.js';

/** Reversible, footprint-preserving facade studies for the Dubai plaza and district.
 * All details are opaque PBR meshes, merged by finish. Existing actors still own
 * the building instances; apply() suppresses them only after the actors update.
 */
export function createDubaiArchitecture({ THREE, city, stoneMaterial, district = false, island = false }) {
  const root = new THREE.Group();
  root.name = district ? 'Dubai — limestone district and bronze skyline' : 'Dubai — limestone courtyard shops';
  let enabled = true, disposed = false;
  const pools = city.w.ctx.pools;
  const candidates = (city.w.ctx.buildings || []).filter(b =>
    b.indices && Number.isInteger(b.indices.body) && b.indices.body >= 0 &&
    (island ? b.z>0&&b.w>=1.5&&b.d>=1.2&&b.h<3 : b.w >= 3 && b.d >= 3 && b.h >= 3 &&
    (district ? b.z < -16 : (b.z + b.d / 2 < -16 && b.h <= 7.5 && !b.gable && !b.crown))));
  const inStudy = b => b.x >= -31 && b.x <= -13 && b.z >= -31 && b.z <= -19;
  const rank = b => (inStudy(b) ? 0 : 1000) + (b.style === 'shops' ? 0 : 100) +
    Math.hypot(b.x + 20, b.z + 22);
  const sorted = [...candidates].sort((a, b) => rank(a) - rank(b));
  const selected = district ? sorted : sorted.slice(0, 2);
  const design = new Map();
  const materials = [], batches = new Map(), originals = new Map();
  const finish = (color, roughness, metalness = 0, extra = {}) => {
    const material = new THREE.MeshStandardMaterial({ color, roughness, metalness,
      envMapIntensity: .65, ...extra });
    materials.push(material); batches.set(material, []); return material;
  };
  // Copy the source shader explicitly: Material.clone does not retain callbacks.
  function limestone(color) {
    if (!stoneMaterial) return finish(color, .84);
    const material = stoneMaterial.clone();
    material.onBeforeCompile = stoneMaterial.onBeforeCompile;
    material.customProgramCacheKey = stoneMaterial.customProgramCacheKey;
    material.color.set(color); material.roughness = .84;
    materials.push(material); batches.set(material, []); return material;
  }
  const ivory = limestone('#f3ebdb'), warm = limestone(district ? '#e5dac6' : '#d4cabb');
  const trim = limestone('#dfd3bf');
  const metal = finish('#5c5140', .36, .72);
  const glass = finish(district ? '#536461' : '#334b53', district ? .16 : .19, district ? .52 : .38, { envMapIntensity: district ? 1.7 : 1.25 });
  const roof = finish('#9b9688', .94);
  const recess = finish(district ? '#605746' : '#4b4b43', .95);
  const wood = district ? finish('#6b513b', .82) : null;
  if (wood) {
    wood.onBeforeCompile = shader => {
      shader.vertexShader = 'varying vec3 vTimber;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvTimber = position;');
      shader.fragmentShader = 'varying vec3 vTimber;\n' + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
        float grain = sin(vTimber.y * 69.0 + sin(vTimber.x * 4.3 + vTimber.z * 3.0) * 3.0);
        diffuseColor.rgb *= 0.88 + 0.12 * grain;
      `);
    };
    wood.customProgramCacheKey = () => 'dubai-timber-grain-v1';
  }
  const skylineGlass = district ? finish('#728f9c', .19, .48, { envMapIntensity: 1.6 }) : null;
  const amberGlass = district ? finish('#6b5b43', .2, .3, { envMapIntensity:1.3, emissive:'#bd8743', emissiveIntensity:.07 }) : null;
  const lanternGlass = district ? finish('#ffe1a0', .4, 0, { emissive:'#ffca7d', emissiveIntensity:.7 }) : null;
  const plantGreen = district ? finish('#496c39', .94) : null;
  const flowers = district ? finish('#bd527b', .9) : null;
  for(const m of [glass,skylineGlass,amberGlass].filter(Boolean)) {
    m.userData.cityGlass=true;
    m.roughness=m===skylineGlass?.13:.14;
    m.envMapIntensity=m===skylineGlass?1.45:1.25;
  }
  if(skylineGlass){
    skylineGlass.userData.reflectionZone='skyline';
    skylineGlass.color.set('#829ead');skylineGlass.metalness=.62;
    skylineGlass.roughness=.12;skylineGlass.envMapIntensity=1.35;
    installCurtainWallFinish(skylineGlass);
  }
  const skylineSpandrel=district?finish('#718996',.32,.36,{envMapIntensity:.9}):null;
  if(skylineSpandrel){skylineSpandrel.userData.cityGlass=true;skylineSpandrel.userData.reflectionZone='skyline';}
  const skylineMetal = district ? finish('#71838d', .34, .55) : null;
  for (const m of [skylineGlass, skylineSpandrel, skylineMetal].filter(Boolean)) installSkylineAtmosphere(m);
  const bounce={value:1};
  if(district)for(const m of [ivory,warm,trim,recess,wood])installDistrictBounce(m,city.w.root.position.clone(),bounce);
  let dressStone=false,beveledPieces=0;
  const matrix = new THREE.Matrix4(), quaternion = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  let transform = new THREE.Matrix4();
  function box(material, x, y, z, w, h, d, angle = 0) {
    if (Math.min(w, h, d) <= 0) return;
    const dressed=dressStone&&[ivory,warm,trim].includes(material)&&Math.min(w,h,d)>=.05;
    const geometry = dressed ? chamferedBox(w,h,d,.014) : new THREE.BoxGeometry(w, h, d);
    if(dressed){beveledPieces++;geometry.setIndex(Array.from({length:geometry.attributes.position.count},(_,i)=>i));}
    quaternion.setFromAxisAngle(up, angle);
    matrix.compose(new THREE.Vector3(x, y, z), quaternion, new THREE.Vector3(1, 1, 1));
    geometry.applyMatrix4(matrix).applyMatrix4(transform);
    batches.get(material).push(geometry);
  }
  selected.forEach((b, buildingIndex) => {
    const wall = district ? (buildingIndex % 3 === 1 ? warm : ivory) : (buildingIndex === 0 ? ivory : warm);
    transform = new THREE.Matrix4().makeRotationY(b.ry || 0);
    transform.setPosition(b.x, b.base, b.z);
    const { w, d } = b;
    if(island){dressStone=true;design.set(b,appendIslandVilla({b,index:buildingIndex,finishes:{wall,trim,glass,wood,roof,recess},box}));return;}
    const traditional = !district || b.z > -38 || b.h <= 8;
    dressStone=district&&traditional;
    // District pass reshapes the skyline: two-storey foreground and a lower
    // backdrop leave the landmark legible. Horizontal collision footprints stay.
    const h = !district ? b.h : traditional
      ? Math.min(Math.max(b.h, 5.8), 6.2 + (buildingIndex % 5) * .4)
      : Math.min(b.h, 10.8 + (buildingIndex % 5) * 1.1);
    design.set(b, { treatment: traditional ? 'limestone' : 'glass', facadeHeight: h, originalHeight: b.h });
    if (!traditional) {
      Object.assign(design.get(b), appendDubaiHighrise({ THREE, b, h, index: buildingIndex,
        finishes: { wall, trim, metal, skylineGlass, skylineSpandrel, skylineMetal, glass, amberGlass, roof, recess }, box,
        add(geometry, material) { geometry.applyMatrix4(transform); batches.get(material).push(geometry); } }));
      return;
    }
    if (district) {
      const details = appendDubaiVilla({ THREE, b, h, index:buildingIndex,
        finishes:{wall,trim,metal,glass,roof,recess,wood,amberGlass,lanternGlass,plantGreen,flowers}, box,
        add(geometry, material) {
          if (!geometry.index) geometry.setIndex(Array.from({length:geometry.attributes.position.count},(_,i)=>i));
          geometry.applyMatrix4(transform); batches.get(material).push(geometry);
        } });
      Object.assign(design.get(b),details); return;
    }
    const floorCount = district && h >= 7 ? 3 : h >= 4.6 ? 2 : 1;
    const parapetHeight = .25, roofLevel = h - parapetHeight;
    const groundHeight = floorCount === 2 ? Math.min(2.65, roofLevel * .53) : roofLevel;
    const floors = floorCount === 3
      ? Array.from({ length: 3 }, (_, i) => [roofLevel * i / 3, roofLevel * (i + 1) / 3])
      : floorCount === 2 ? [[0, groundHeight], [groundHeight, roofLevel]] : [[0, roofLevel]];
    const inset = .045, thickness = .23;
    // Solid inset core occludes interiors behind recessed glazing. Wall openings
    // genuinely have side/top/bottom reveals; no glass or window texture overlay.
    box(recess, 0, roofLevel / 2, 0, w - .64, roofLevel, d - .64);
    box(trim, 0, .105, 0, w, .21, d);
    box(roof, 0, roofLevel - .045, 0, w - .2, .09, d - .2);
    for (const [level] of floors.slice(1)) {
      box(trim, 0, level - .08, 0, w, .16, d);
    }
    // Four narrow parapets preserve the exact original overall roof height.
    box(wall, 0, h - .15, d / 2 - .11, w - .08, .3, .14);
    box(wall, 0, h - .15, -d / 2 + .11, w - .08, .3, .14);
    box(wall, -w / 2 + .11, h - .15, 0, .14, .3, d - .22);
    box(wall, w / 2 - .11, h - .15, 0, .14, .3, d - .22);
    // Thin projecting cornice remains entirely inside the original footprint.
    box(trim, 0, roofLevel - .1, 0, w, .14, d);
    box(trim, 0, h - .025, d / 2 - .105, w, .05, .21);
    box(trim, 0, h - .025, -d / 2 + .105, w, .05, .21);
    box(trim, -w / 2 + .105, h - .025, 0, .21, .05, d - .42);
    box(trim, w / 2 - .105, h - .025, 0, .21, .05, d - .42);

    if (district && b.h - h >= 1.35) {
      // Rooftop objects use only the height vacated by a reduced front-row tower.
      const pw = Math.min(w - .65, 2.7), pd = Math.min(d - .65, 2.45);
      const pergolaHeight = .98;
      for (const x of [-pw / 2, pw / 2]) for (const z of [-pd / 2, pd / 2]) {
        box(wood, x, roofLevel + pergolaHeight / 2, z, .085, pergolaHeight, .085);
      }
      for (const z of [-pd / 2, pd / 2]) box(wood, 0, roofLevel + pergolaHeight, z, pw + .14, .1, .09);
      const slats = 9;
      for (let j = 0; j < slats; j++) {
        box(wood, -pw / 2 + pw * j / (slats - 1), roofLevel + pergolaHeight + .075, 0,
          .085, .065, pd + .16);
      }
      if (buildingIndex % 3 === 0 && b.h - h >= 2.05) {
        // Small barjeel wind catcher with open shaded slots and stone corner posts.
        const tw = Math.min(1.05, w * .22), tx = w / 2 - tw / 2 - .22;
        const tz = -d / 2 + tw / 2 + .22, ty = roofLevel;
        box(wall, tx, ty + .42, tz, tw, .84, tw);
        box(recess, tx, ty + 1.16, tz, tw - .16, .65, tw - .16);
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
          box(wall, tx + sx * (tw / 2 - .065), ty + 1.16, tz + sz * (tw / 2 - .065), .13, .65, .13);
        }
        box(trim, tx, ty + 1.55, tz, tw + .14, .13, tw + .14);
        box(trim, tx, ty + .84, tz, tw + .1, .09, tw + .1);
      }
    }

    // Facade coordinates: u is horizontal and v runs inward from the boundary.
    for (let side = 0; side < 4; side++) {
      const span = side % 2 === 0 ? w : d;
      const depth = side % 2 === 0 ? d : w;
      const angle = side * Math.PI / 2;
      const cs = Math.cos(angle), sn = Math.sin(angle);
      function facade(material, u, y, inward, width, height, thick) {
        const z = depth / 2 - inward;
        box(material, u * cs + z * sn, y, -u * sn + z * cs, width, height, thick, angle);
      }
      const columns = span >= 4.1 ? 3 : 2;
      const margin = .35, bay = (span - margin * 2) / columns;
      const pier = .2, openingWidth = bay - pier;
      floors.forEach(([bottom, top], floor) => {
        const isGround = floor === 0;
        const doorColumn = Math.floor(columns / 2);
        const front = side === 0;
        const lower = isGround ? .36 : bottom + .62;
        const upper = top - (isGround ? .4 : .36);
        // Upper and lower wall belts + individual piers form real window voids.
        facade(wall, 0, (upper + top) / 2, inset + thickness / 2, span - 2 * inset, top - upper, thickness);
        facade(wall, -span / 2 + margin / 2, (bottom + upper) / 2,
          inset + thickness / 2, margin, upper - bottom, thickness);
        facade(wall, span / 2 - margin / 2, (bottom + upper) / 2,
          inset + thickness / 2, margin, upper - bottom, thickness);
        for (let col = 0; col < columns; col++) {
          const center = -span / 2 + margin + bay * (col + .5);
          const door = isGround && front && col === doorColumn;
          const sill = door ? .12 : lower;
          const windowHeight = upper - sill;
          facade(wall, center, (bottom + sill) / 2, inset + thickness / 2,
            openingWidth, sill - bottom, thickness);
          for (const sign of [-1, 1]) {
            facade(wall, center + sign * bay / 2, (bottom + upper) / 2,
              inset + thickness / 2, pier, upper - bottom, thickness);
          }
          // Recessed, opaque reflective glass is backed by the interior core.
          const glassDepth = inset + .235;
          const pane = district && isGround && (col + buildingIndex) % 3 !== 0 ? amberGlass : glass;
          facade(pane, center, (sill + upper) / 2, glassDepth, openingWidth - .035,
            windowHeight - .035, .024);
          const frame = .026;
          for (const sign of [-1, 1]) {
            facade(metal, center + sign * (openingWidth / 2 - frame / 2), (sill + upper) / 2,
              glassDepth - .022, frame, windowHeight, .035);
            facade(metal, center, sign > 0 ? upper - frame / 2 : sill + frame / 2,
              glassDepth - .022, openingWidth, frame, .035);
          }
          facade(metal, center, (sill + upper) / 2, glassDepth - .023,
            .018, windowHeight, .037);
          facade(metal, center, sill + windowHeight * .74, glassDepth - .023,
            openingWidth, .02, .037);
          facade(trim, center, sill - .035, .135, openingWidth + .09, .07, .25);
          if (district && isGround && front && (door || buildingIndex % 3 === 0)) {
            // Extruded spandrel replaces the rectangular head with a true arched
            // stone opening; glass remains opaque and recessed behind the arch.
            const radius = openingWidth / 2, spring = upper - radius;
            const shape = new THREE.Shape();
            shape.moveTo(-radius, spring); shape.lineTo(-radius, upper + .04);
            shape.lineTo(radius, upper + .04); shape.lineTo(radius, spring);
            shape.absarc(0, spring, radius, 0, Math.PI, false); shape.closePath();
            const geometry = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false, curveSegments: 10 });
            geometry.translate(center, 0, depth / 2 - inset - thickness);
            geometry.rotateY(angle); geometry.applyMatrix4(transform);
            // Extrusions are nonindexed; match the box batch's indexed topology.
            const indices = Array.from({ length: geometry.attributes.position.count }, (_, i) => i);
            geometry.setIndex(indices); batches.get(wall).push(geometry);
            // Small bronze-framed wall lantern on the door pier, with warm glass.
            if(door) {
              const lu=center+bay/2, ly=Math.min(upper-.15,2.05);
              facade(metal,lu,ly,.09,.14,.36,.14);
              facade(lanternGlass,lu,ly,.015,.09,.25,.015);
            }
          }
          if (district && !isGround && (side === 0 || side === 1) && col % 2 === buildingIndex % 2) {
            // A few mashrabiya-like timber screens, with real air between slats.
            const screenHeight = Math.min(windowHeight - .12, .92);
            for (let j = 0; j < 7; j++) {
              facade(wood, center - openingWidth * .44 + openingWidth * .88 * j / 6,
                sill + screenHeight / 2 + .04, .09, .035, screenHeight, .045);
            }
            for (const y of [sill + .04, sill + screenHeight + .04]) {
              facade(wood, center, y, .09, openingWidth - .03, .045, .055);
            }
          }
          if (door) {
            facade(metal, center + .11, 1.12, glassDepth - .054, .018, .23, .025);
            // Deep stone lintel shades the entry without projecting into a path.
            facade(trim, center, upper + .08, .19, openingWidth + .24, .12, .38);
          }
          if (!isGround && front) {
            // Juliet balcony: contained within the original facade envelope.
            const railHeight = .65, railDepth = .035;
            facade(trim, center, sill - .06, .17, openingWidth + .16, .1, .34);
            for (let j = 0; j <= 6; j++) {
              facade(metal, center - openingWidth / 2 + openingWidth * j / 6,
                sill + railHeight / 2, railDepth, .026, railHeight, .028);
            }
            facade(metal, center, sill + railHeight, railDepth,
              openingWidth + .04, .045, .045);
            facade(metal, center, sill + .08, railDepth,
              openingWidth + .04, .025, .03);
            if(district) {
              // Small bronze diamond insets between the upright balcony bars.
              for(let j=0;j<3;j++) {
                const u=center-openingWidth*.32+openingWidth*.32*j;
                const h=.14, y=sill+.36, z=depth/2-.045;
                for(const r of [-Math.PI/4,Math.PI/4]) {
                  const g=new THREE.BoxGeometry(.012,h*1.42,.025);
                  g.rotateZ(r);g.translate(u,y,z);g.rotateY(angle);g.applyMatrix4(transform);batches.get(metal).push(g);
                }
              }
            }
            if(district && col === buildingIndex % columns) {
              const planterWidth=Math.min(.65,openingWidth-.12);
              facade(wood,center,sill+.15,.14,planterWidth,.16,.2);
              for(let j=0;j<9;j++) {
                const u=center-planterWidth*.43+planterWidth*.86*j/8;
                for(const [mat,rise,radius] of [[plantGreen,.27,.07],[flowers,.32,.04]]) {
                  const g=new THREE.SphereGeometry(radius,5,3);
                  g.scale(1.1,.7,1);g.translate(u,sill+rise+Math.sin(j*2.7)*.025,depth/2-.12);
                  g.rotateY(angle);g.applyMatrix4(transform);batches.get(mat).push(g);
                }
              }
            }
          }
        }
      });
    }
  });
  let triangles = 0;
  for (const [material, geometries] of batches) {
    if (!geometries.length) continue;
    const geometry = mergeGeometries(geometries, false);
    geometries.forEach(g => g.dispose());
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = `Dubai facade finish ${root.children.length + 1}`;
    mesh.castShadow = true; mesh.receiveShadow = true;
    triangles += geometry.index ? geometry.index.count / 3 : geometry.attributes.position.count / 3;
    root.add(mesh);
  }
  city.w.root.add(root);
  const mappings = { body: 'tower', crown: 'tower', roof: 'roof', pad: 'pad', antenna: 'ant', gable: 'gable' };
  const stats = { buildings: selected.length, triangles, drawCalls: root.children.length, beveledPieces,
    selected: selected.map(b => ({ x: b.x, z: b.z, w: b.w, d: b.d, h: b.h,
      base: b.base, ry: b.ry || 0, style: b.style || 'unknown', inStudy: inStudy(b), ...design.get(b) })) };
  function apply() {
    if (!enabled || disposed) return;
    const touched = new Set();
    for (const b of selected) for (const [key, poolName] of Object.entries(mappings)) {
      const index = b.indices[key], pool = pools[poolName];
      if (!Number.isInteger(index) || index < 0 || !pool) continue;
      const id = `${poolName}:${index}`;
      if (!originals.has(id)) originals.set(id, { pool, index, matrix: new THREE.Matrix4() });
      pool.m.getMatrixAt(index, originals.get(id).matrix);
      pool.hide(index); touched.add(pool);
    }
    touched.forEach(pool => pool.flush());
  }
  function restore() {
    const touched = new Set();
    originals.forEach(({ pool, index, matrix: before }) => { pool.set(index, before); touched.add(pool); });
    touched.forEach(pool => pool.flush()); originals.clear();
  }
  return { root, apply, stats, setBounce(value){bounce.value=value?1:0;}, setEnabled(value) {
    enabled = Boolean(value); root.visible = enabled && !disposed;
    if (!enabled) restore();
  }, dispose() {
    if (disposed) return;
    restore(); disposed = true; root.removeFromParent();
    root.children.forEach(mesh => mesh.geometry.dispose());
    materials.forEach(material => material.dispose());
  } };
}
