import {createAbuVenues} from './abudhabi-venues.js';
import {createAbuLandscape} from './abudhabi-landscape.js';
import {createAbuPublicRealm} from './abudhabi-public-realm.js';
import {createAbuDhabiLandmarks} from './abudhabi-landmarks.js';
import {createAbuDhabiShrubs} from './abudhabi-shrubs.js';
import {createAbuDhabiScene} from './abudhabi-scene.js';
import { createPromenadeGardens } from './promenade-gardens.js';
import { createBridgeRefinement } from './bridge-refinement.js';
import { createResortGardens } from './resort-gardens.js';
import { createIslandGardens } from './island-gardens.js';
import { createDubaiWaterfront } from './dubai-waterfront.js';
import { createDubaiVehicles } from './dubai-vehicles.js';
import { createDubaiStreets } from './dubai-streets.js';
import { createDubaiArchitecture } from './dubai-architecture.js';
import { createDubaiPalms } from './dubai-palms.js';
import { createDubaiLandscape } from './dubai-landscape.js';
import { createWaterStudy } from './water-study.js';
import { createDubaiLandmarks } from './dubai-landmarks.js';
import { createDubaiBackdrop } from './dubai-backdrop.js';
import { createDubaiGardens } from './dubai-gardens.js';
import { createDubaiCoast } from './dubai-coast.js';
import { createContactShadows } from './contact-shadows.js';
import { createCityReflections } from './city-reflections.js';
import leafUrl from './assets/ficus-leaf-v1.png';

/** Reversible lighting, surfaces and local Dubai geometry studies.
 * Textures are deterministic, authored procedural materials (not scanned assets).
 * Shared source materials are never mutated: other cities retain their surfaces.
 */
export function createRealism({ THREE, renderer, scene, camera, sun, hemi, M, sky, seaMat, lagoonMat }) {
  const qs = new URLSearchParams(location.search);
  let enabled = qs.get('look') !== 'original';
  let refinementEnabled = qs.get('detail') !== 'off';
  const refinements = [], districtStudies = [], lakeSwaps = [], abuStudies=[];
  let abu=null,abuProbe=null,nearAbu=false;
  let districtEnabled = qs.get('district') !== 'off';
  let contactEnabled=qs.get('ao')!=='off',reflectionsEnabled=qs.get('reflections')!=='off',skylineEnabled=qs.get('skyline')!=='off';
  let bounceEnabled=qs.get('bounce')!=='off';
  let contact=null,probe=null,backdrop=null,dubai=null,nearDubai=false;
  const waterStudy = createWaterStudy({ THREE, seaMat, lagoonMat, renderer, scene, camera });
  const textures = [], materials = [], swaps = [], extras = [], colors = [];
  const leafTexture=new THREE.TextureLoader().load(leafUrl);
  leafTexture.colorSpace=THREE.SRGBColorSpace;
  leafTexture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  textures.push(leafTexture);
  const original = {
    exposure: renderer.toneMappingExposure, env: scene.environment,
    hemi: hemi.color.clone(), ground: hemi.groundColor.clone(), hi: hemi.intensity,
    sun: sun.color.clone(), si: sun.intensity,
    top: sky.material.uniforms.top.value.clone(), mid: sky.material.uniforms.mid.value.clone(),
    horizon: sky.material.uniforms.hor.value.clone(), fog: scene.fog.color.clone()
  };
  const skyFragment = sky.material.fragmentShader;
  sky.material.uniforms.taAtmosphere = { value: 0 };
  sky.material.fragmentShader = `uniform float taAtmosphere;
    float taHash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
    float taNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(taHash(i),taHash(i+vec2(1,0)),f.x),mix(taHash(i+vec2(0,1)),taHash(i+1.),f.x),f.y);}
    float taCloud(vec2 p){return taNoise(p)*.55+taNoise(p*2.03)*.28+taNoise(p*4.1)*.12+taNoise(p*8.2)*.05;}
    ` + skyFragment.replace('gl_FragColor = vec4(c,1.);', `
      if(taAtmosphere>.5){
        vec3 d=normalize(vD);
        float elevation=smoothstep(0.,.19,max(d.y,0.));
        c=mix(hor,vec3(.18,.32,.55),elevation);
        vec2 uv=d.xz/max(d.y+.12,.08)*2.4;
        float wisps=smoothstep(.52,.75,taCloud(uv*vec2(.65,1.8)));
        float cloud=wisps*smoothstep(.02,.18,d.y)*.43;
        c=mix(c,vec3(.91,.87,.79),cloud);
      }
      gl_FragColor = vec4(c,1.);`);
  sky.material.needsUpdate = true;
  const rng = seed => () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };

  function textureSet(kind, seed) {
    const n = 512, random = rng(seed), canvas = document.createElement('canvas'), height = document.createElement('canvas');
    canvas.width = canvas.height = height.width = height.height = n;
    const ctx = canvas.getContext('2d'), hc = height.getContext('2d');
    const data = ctx.createImageData(n, n), hd = hc.createImageData(n, n);
    const base = { limestone:[232,225,210], stone: [192, 182, 163], sand: [192, 176, 145], asphalt: [69, 71, 70], grass: [100, 115, 74] }[kind];
    const tile = Array.from({ length: 64 }, () => (random() - .5) * 19);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const i = (y * n + x) * 4, noise = (random() - .5), row = Math.floor(y / 64), xx = (x + (row % 2) * 64) % n;
      const masonry=kind==='stone'||kind==='limestone';
      const seam = masonry && (xx % 128 < (kind==='limestone'?1:2) || y % 64 < (kind==='limestone'?1:2));
      const tileValue = masonry ? tile[row * 4 + Math.floor(xx / 128)]*(kind==='limestone'?.9:.65) : 0;
      const cloud = kind === 'grass' ? 0 : Math.sin(x * Math.PI * 8 / n) * Math.cos(y * Math.PI * 6 / n);
      const delta = noise * (kind === 'grass' ? 28 : kind==='limestone'?4:13) + tileValue + cloud * (kind==='limestone'?4:2.5);
      const pore=kind==='limestone'&&random()>.994;
      for (let k = 0; k < 3; k++) data.data[i + k] = seam ? base[k] * (kind==='limestone'?.94:.91) : base[k] + delta*(kind==='limestone'?.85:1)-(pore?6:0);
      data.data[i + 3] = 255;
      const v = seam ? (kind==='limestone'?138:100) : pore?145:155 + noise * (kind === 'asphalt' ? 75 : kind==='limestone'?10:22);
      hd.data.set([v, v, v, 255], i);
    }
    ctx.putImageData(data, 0, 0); hc.putImageData(hd, 0, 0);
    const map = new THREE.CanvasTexture(canvas), bump = new THREE.CanvasTexture(height);
    for (const t of [map, bump]) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); textures.push(t);
    }
    map.colorSpace = THREE.SRGBColorSpace;
    return { map, bump };
  }
  const sets = { limestone:textureSet('limestone',4163), stone: textureSet('stone', 1102), sand: textureSet('sand', 931), asphalt: textureSet('asphalt', 83), grass: textureSet('grass', 742) };

  // World projection keeps paving at the same physical scale on scaled/extruded meshes.
  function surface(kind, { color = '#ffffff', roughness = .85, scale = .25, bump = .025, detail = 1 } = {}) {
    const mat = new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, envMapIntensity: .3 });
    mat.onBeforeCompile = sh => {
      sh.uniforms.taColor = { value: sets[kind].map };
      sh.uniforms.taHeight = { value: sets[kind].bump };
      sh.uniforms.taScale = { value: scale };
      sh.uniforms.taBump = { value: bump };
      sh.uniforms.taDetail = { value: detail };
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 taWorld;');
      sh.vertexShader = sh.vertexShader.replace('#include <project_vertex>', `#include <project_vertex>
        vec4 taP = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          taP = instanceMatrix * taP;
        #endif
        taWorld = (modelMatrix * taP).xyz;`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
        varying vec3 taWorld;
        uniform sampler2D taColor, taHeight;
        uniform float taScale, taBump, taDetail;
        vec2 taUV;
        float taMineralHash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
        float taMineralNoise(vec3 p){
          vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
          return mix(mix(mix(taMineralHash(i),taMineralHash(i+vec3(1,0,0)),f.x),mix(taMineralHash(i+vec3(0,1,0)),taMineralHash(i+vec3(1,1,0)),f.x),f.y),
          mix(mix(taMineralHash(i+vec3(0,0,1)),taMineralHash(i+vec3(1,0,1)),f.x),mix(taMineralHash(i+vec3(0,1,1)),taMineralHash(i+vec3(1,1,1)),f.x),f.y),f.z);
        }
        vec3 taBumpNormal(vec3 N, float H) {
          vec3 dx = dFdx(-vViewPosition), dy = dFdy(-vViewPosition);
          vec3 a = cross(dy, N), b = cross(N, dx);
          float det = dot(dx, a);
          vec3 grad = sign(det) * (dFdx(H) * a + dFdy(H) * b);
          return normalize(abs(det) * N - grad);
        }`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
        vec3 taN = abs(normalize(cross(dFdx(taWorld), dFdy(taWorld))));
        taUV = (taN.y > .5 ? taWorld.xz : (taN.x > taN.z ? taWorld.zy : taWorld.xy)) * taScale;
        diffuseColor.rgb *= mix(vec3(1.0), texture2D(taColor, taUV).rgb, taDetail);
        ${kind==='limestone'?`float mineral=taMineralNoise(taWorld*3.1)*.65+taMineralNoise(taWorld*17.)*.35;
        diffuseColor.rgb*=mix(.96,1.025,mineral);`:''}`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        float heightDetail=texture2D(taHeight,taUV).r*taBump;
        ${kind==='limestone'?`float stonePixel=max(length(dFdx(taWorld)),length(dFdy(taWorld)));
        heightDetail+=taMineralNoise(taWorld*95.)*.00045*(1.-smoothstep(.008,.04,stonePixel));`:''}
        normal = taBumpNormal(normal,heightDetail);`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = clamp(roughnessFactor + (texture2D(taHeight, taUV).r - .5) * .16, .1, 1.0);`);
    };
    mat.customProgramCacheKey = () => 'ta-surface-v2-' + kind;
    materials.push(mat); return mat;
  }
  const stone = surface('stone', { scale: .25, roughness: .84, bump: .010 }); // slab = 1 x .5 world units
  const sand = surface('sand', { scale: .3, bump: .013 });
  const asphalt = surface('asphalt', { scale: .55, roughness: .94, bump: .018 });
  const grass = surface('grass', { scale: .43, roughness: .98, bump: .007 });
  const sideStone = surface('stone', { color: '#c2b4a0', scale: .4, bump: .035 });
  const facadeStone = surface('limestone', { scale: .24, roughness: .86, bump: .014, detail: .92 });
  const waterfrontStone = surface('limestone', { scale: .24, roughness: .86, bump: .014, detail: .92 });
  const neutral = (source, color, roughness) => {
    const m = source.clone(); m.color.set(color); m.roughness = roughness; m.envMapIntensity = .4;
    materials.push(m); return m;
  };
  const replacement = new Map([
    [M.stone, stone], [M.sidewalk, stone], [M.concrete, stone], [M.rim, stone],
    [M.sand, sand], [M.dune, sand], [M.sandSide, sideStone],
    [M.grass, grass], [M.grassSide, neutral(M.grassSide, '#626c47', .96)],
    [M.asphalt, asphalt], [M.lake, neutral(M.lake, '#547e83', .23)],
    [M.dash, neutral(M.dash, '#ddd8c8', .88)],
    [M.concreteSide, sideStone], [M.rimWall, sideStone],
    [M.leaves, neutral(M.leaves, '#c0c0a7', .91)], [M.trunk, neutral(M.trunk, '#b1a599', .92)]
  ]);

  // A low-resolution authored daylight environment: no external HDRI dependency.
  const ec = document.createElement('canvas'); ec.width = 512; ec.height = 256;
  const eg = ec.getContext('2d'), gradient = eg.createLinearGradient(0, 0, 0, 256);
  gradient.addColorStop(0, '#8ba7c0'); gradient.addColorStop(.45, '#c6d4de');
  gradient.addColorStop(.52, '#abaa9b'); gradient.addColorStop(1, '#61594c');
  eg.fillStyle = gradient; eg.fillRect(0, 0, 512, 256);
  const glow = eg.createRadialGradient(145, 65, 2, 145, 65, 60);
  glow.addColorStop(0, 'rgba(255,250,230,1)'); glow.addColorStop(1, 'rgba(255,250,230,0)');
  eg.fillStyle = glow; eg.fillRect(0, 0, 512, 256);
  const equirect = new THREE.CanvasTexture(ec); equirect.colorSpace = THREE.SRGBColorSpace;
  equirect.mapping = THREE.EquirectangularReflectionMapping;
  const pmrem = new THREE.PMREMGenerator(renderer), envTarget = pmrem.fromEquirectangular(equirect);
  pmrem.dispose(); equirect.dispose();

  function applyEnvironment() {
    const district = enabled && refinementEnabled && districtEnabled;
    sky.material.uniforms.taAtmosphere.value = district ? 1 : 0;
    renderer.toneMappingExposure = enabled ? .90 : original.exposure;
    scene.environment = enabled ? envTarget.texture : original.env;
    hemi.color.copy(enabled ? new THREE.Color('#c4d6ef') : original.hemi);
    hemi.groundColor.copy(enabled ? new THREE.Color('#baa68d') : original.ground);
    hemi.intensity = enabled ? (district ? .50 : 1.1) : original.hi;
    sun.color.copy(enabled ? new THREE.Color('#ffe8c6') : original.sun);
    sun.intensity = enabled ? (district ? 3.55 : 2.65) : original.si;
    sky.material.uniforms.top.value.copy(enabled ? new THREE.Color('#8eaabb') : original.top);
    sky.material.uniforms.mid.value.copy(enabled ? new THREE.Color('#bdcdd2') : original.mid);
    sky.material.uniforms.hor.value.copy(enabled ? new THREE.Color(district ? '#adc5d9' : '#e0e1d8') : original.horizon);
    scene.fog.color.copy(enabled ? sky.material.uniforms.hor.value : original.fog);
    // Static reflection captures must be refreshed after exposure/environment
    // or detail changes, otherwise panes keep the previous lighting setup.
    probe?.invalidate();abuProbe?.invalidate();
  }
  function enhanceCity(c) {
    if(c.id==='abudhabi'){
      abu=c;
      c.w.root.traverse(o=>{if(!o.isMesh)return;const before=o.material,after=Array.isArray(before)?before.map(m=>replacement.get(m)||m):replacement.get(before)||before;
        if(Array.isArray(before)?after.some((m,i)=>m!==before[i]):after!==before){swaps.push({mesh:o,before,after});o.material=enabled?after:before;}
      });
      for(const name of ['bush','canopy','tower','roof']){
        const mesh=c.w.ctx.pools[name]?.m;if(!mesh?.instanceColor)continue;
        const before=mesh.instanceColor.array.slice(),after=before.slice(),palette=name==='bush'?['#647851','#819363','#5b704c']:name==='canopy'?['#ddd5bd','#d0c5a9']:['#91a4ab','#b5b5aa','#c5baa4'];
        for(let i=0;i<mesh.count;i++)new THREE.Color(palette[i%palette.length]).toArray(after,i*3);
        colors.push({mesh,before,after});mesh.instanceColor.array.set(enabled?after:before);mesh.instanceColor.needsUpdate=true;
      }
      const realm=createAbuPublicRealm({city:c,leafTexture});
      abuStudies.push(createAbuDhabiScene({city:c,leafTexture}),createAbuDhabiLandmarks({city:c}),createAbuVenues({city:c}),createAbuDhabiShrubs({city:c,leafTexture,clearedPlots:realm.plots.filter(p=>p.kind==='pergola')}),realm,createAbuLandscape({city:c,leafTexture,existing:realm.plots}),createDubaiVehicles({THREE,city:c}),createDubaiStreets({THREE,city:c,roadFilter:r=>r.kind==='road'&&!r.bridge}),createDubaiPalms({THREE,city:c,district:true}),createDubaiCoast({THREE,city:c,stoneMaterial:stone}));
      abuProbe=createCityReflections({renderer,scene,city:c,zoneSpecs:{culture:{position:[49,5,24],min:[28,0,10],max:[70,15,46]},courtyard:{position:[-15,3.5,39],min:[-37,0,13],max:[5,22,46]},skyline:{position:[5,12,-46],min:[-72,0,-80],max:[72,32,10]}}});
      syncStudies();return;
    }
    if (c.id !== 'dubai') return;
    dubai=c;
    c.w.root.traverse(o => {
      if (!o.isMesh) return;
      const before = o.material;
      const after = Array.isArray(before) ? before.map(m => replacement.get(m) || m) : replacement.get(before) || before;
      if (Array.isArray(before) ? after.some((m, i) => m !== before[i]) : after !== before) {
        swaps.push({ mesh: o, before, after }); o.material = enabled ? after : before;
      }
    });
    // Neutralize instance palette locally; source arrays and other cities remain intact.
    for (const name of ['leaves', 'bush', 'canopy', 'tower', 'roof']) {
      const mesh = c.w.ctx.pools[name]?.m;
      if (!mesh?.instanceColor) continue;
      const before = mesh.instanceColor.array.slice(), after = before.slice();
      const palette = name === 'tower' ? ['#7d969d', '#acb4ad', '#a99e85', '#b7afa1'] : name === 'roof' ? ['#c6b9a0', '#afa38c'] : name === 'canopy' ? ['#e1d8c5', '#c9b99b'] : ['#6f8152', '#536b45', '#879465', '#5e704a'];
      for (let i = 0; i < mesh.count; i++) new THREE.Color(palette[i % palette.length]).toArray(after, i * 3);
      colors.push({ mesh, before, after });
      mesh.instanceColor.array.set(enabled ? after : before); mesh.instanceColor.needsUpdate = true;
    }
    // Paving at the existing lake perimeter: stays inside its reserved footprint.
    // This is a thin surface, not a new collision obstacle or a changed route.
    const paving = new THREE.Mesh(new THREE.RingGeometry(10.04, 11.48, 96).rotateX(-Math.PI / 2), stone);
    paving.name = 'Dubai limestone promenade'; paving.position.set(0, 1.281, -33); paving.receiveShadow = true;
    c.w.root.add(paving); extras.push(paving); paving.visible = enabled;
    // A narrow outer coping helps the transition read in oblique views.
    const coping = new THREE.Mesh(new THREE.RingGeometry(11.35, 11.48, 96).rotateX(-Math.PI / 2), sideStone);
    coping.position.set(0, 1.286, -33); coping.receiveShadow = true; c.w.root.add(coping); extras.push(coping); coping.visible = enabled;
    refinements.push(createDubaiArchitecture({ THREE, city: c, stoneMaterial: facadeStone }), createDubaiPalms({ THREE, city: c }));
    const waterfront = createDubaiWaterfront({ THREE, city:c, stoneMaterial:waterfrontStone });
    districtStudies.push(waterfront, createDubaiVehicles({ THREE, city: c }), createDubaiStreets({ THREE, city: c }), createDubaiArchitecture({ THREE, city: c, stoneMaterial: facadeStone, district: true }), createDubaiPalms({ THREE, city: c, district: true }), createDubaiLandscape({ THREE, city: c, stoneMaterial: stone, waterMaterial: waterStudy.lakeMaterial, leafTexture, exclusions:waterfront.footprints, fullCoast:true }), createDubaiLandmarks({ THREE, city: c }));
    for(const r of c.w.ctx.roads||[])if(r.bridge&&r.visual){const length=Math.hypot(r.B[0]-r.A[0],r.B[1]-r.A[1]);districtStudies.push(createBridgeRefinement({...r.visual,length,halfWidth:r.hw,top:1.33,start:-r.e0*r.hw,end:length+r.e1*r.hw}));}
    const islandVillas=createDubaiArchitecture({THREE,city:c,stoneMaterial:facadeStone,district:true,island:true});
    districtStudies.push(islandVillas,createIslandGardens({THREE,city:c,plots:islandVillas.islandPlots,stoneMaterial:stone,leafTexture}),createDubaiCoast({THREE,city:c,stoneMaterial:stone}));
    districtStudies.push(createResortGardens({city:c,stoneMaterial:stone,leafTexture}));
    backdrop=createDubaiBackdrop({THREE,city:c});districtStudies.push(backdrop);
    const occupied=districtStudies.flatMap(s=>s.footprints||[]);
    const gardens=createDubaiGardens({THREE,city:c,stoneMaterial:stone,leafTexture,exclusions:occupied});
    districtStudies.push(gardens,createPromenadeGardens({city:c,stoneMaterial:stone,leafTexture,exclusions:[...occupied,...gardens.footprints]}));
    probe=createCityReflections({renderer,scene,city:c});
    lakeSwaps.push(...swaps.filter(s => s.before === M.lake));
    syncStudies();
  }
  const dir = new THREE.Vector3(-.95, .9, .75).normalize();
  const originalDir = new THREE.Vector3(Math.cos(40 * Math.PI / 180) * Math.cos(55 * Math.PI / 180), Math.sin(55 * Math.PI / 180), Math.sin(40 * Math.PI / 180) * Math.cos(55 * Math.PI / 180));
  function update({ target, overview = false, time = 0 }) {
    // Must follow the source actors: they restore the original instances each frame.
    refinements.forEach(r => r.apply(time));
    districtStudies.forEach(r => r.apply(time));
    abuStudies.forEach(r=>r.apply?.(time));
    nearAbu=!!abu&&!overview&&Math.hypot(target.x-abu.w.root.position.x,target.z-abu.w.root.position.z)<115&&camera.position.distanceTo(target)<140;
    nearDubai=!!dubai&&!overview&&Math.hypot(target.x-dubai.w.root.position.x,target.z-dubai.w.root.position.z)<110&&camera.position.distanceTo(target)<120;
    const span = overview ? 300 : Math.min(125, Math.max(24, camera.position.distanceTo(target) * .65));
    const texel = span * 2 / sun.shadow.mapSize.x;
    sun.target.position.set(Math.round(target.x / texel) * texel, 0, Math.round(target.z / texel) * texel);
    sun.position.copy(sun.target.position).addScaledVector(enabled ? dir : originalDir, 220);
    const sc = sun.shadow.camera;
    if (Math.abs(sc.right - span) > 1) {
      Object.assign(sc, { left: -span, right: span, top: span, bottom: -span, near: 1, far: 650 }); sc.updateProjectionMatrix();
    }
    sun.shadow.normalBias = .025; sun.shadow.bias = -.00012;
    const h = Math.max(0, camera.position.y);
    scene.fog.near = 240 + h * 1.6; scene.fog.far = 920 + h * 3.2;
    waterStudy.update({ sunDirection: enabled ? dir : originalDir, fog: scene.fog.color, near: scene.fog.near, far: scene.fog.far });
  }
  function setEnabled(value) {
    enabled = !!value; applyEnvironment();
    for (const s of swaps) s.mesh.material = enabled ? s.after : s.before;
    for (const c of colors) { c.mesh.instanceColor.array.set(enabled ? c.after : c.before); c.mesh.instanceColor.needsUpdate = true; }
    extras.forEach(o => o.visible = enabled);
    syncStudies();
  }
  function syncStudies() {
    refinements.forEach(r => r.setEnabled(false));
    districtStudies.forEach(r => r.setEnabled(false));
    const active = enabled && refinementEnabled;
    abuStudies.forEach(r=>r.setEnabled(active));abuProbe?.setEnabled(active&&reflectionsEnabled);
    (districtEnabled ? districtStudies : refinements).forEach(r => r.setEnabled(active));
    if(backdrop)backdrop.setEnabled(active&&districtEnabled&&skylineEnabled);
    probe?.setEnabled(active&&districtEnabled&&reflectionsEnabled);
    districtStudies.forEach(s=>s.setBounce?.(active&&bounceEnabled));
    waterStudy.setEnabled(active && districtEnabled);
    for (const s of lakeSwaps) s.mesh.material = active && districtEnabled ? waterStudy.lakeMaterial : (enabled ? s.after : s.before);
    applyEnvironment();
  }
  function setDistrictEnabled(value) { districtEnabled = !!value; syncStudies(); }
  function setRefinementEnabled(value) {
    refinementEnabled = !!value;
    syncStudies();
  }
  applyEnvironment();
  return { enhanceCity, enhanceBridge(spec){districtStudies.push(createBridgeRefinement(spec));syncStudies();}, update, setEnabled, setRefinementEnabled, setDistrictEnabled,
    render(){
      const reset=renderer.info.autoReset;renderer.info.autoReset=false;renderer.info.reset();
      try {
        renderer.render(scene,camera);
        // Capture only after the current sun matrix and shadow texture exist.
        // Sampling before this render baked a stale camera's shadows into glass.
        if(nearDubai)probe?.captureIfNeeded();
        if(nearAbu)abuProbe?.captureIfNeeded();
        waterStudy.capture(enabled&&refinementEnabled&&districtEnabled&&(nearDubai||nearAbu)&&reflectionsEnabled);
        if(enabled&&refinementEnabled&&districtEnabled&&(nearDubai||nearAbu)&&contactEnabled){
          contact??=createContactShadows({renderer,scene,camera});contact.render();
        }
      } finally {renderer.info.autoReset=reset;}
    },
    get contactEnabled(){return contactEnabled;},setContactEnabled(v){contactEnabled=!!v;},
    get bounceEnabled(){return bounceEnabled;},setBounceEnabled(v){bounceEnabled=!!v;districtStudies.forEach(s=>s.setBounce?.(bounceEnabled));probe?.invalidate();abuProbe?.invalidate();},
    get reflectionsEnabled(){return reflectionsEnabled;},setReflectionsEnabled(v){reflectionsEnabled=!!v;syncStudies();},
    get skylineEnabled(){return skylineEnabled;},setSkylineEnabled(v){skylineEnabled=!!v;syncStudies();probe?.invalidate();abuProbe?.invalidate();},
    get lightingStatus(){const active=enabled&&refinementEnabled&&districtEnabled;return `接触阴影 ${active&&contactEnabled&&(nearDubai||nearAbu)?contact?.resolution||'准备中':'关'} · 反射 ${active&&reflectionsEnabled?(nearAbu?abuProbe:probe)?.status||'准备中':'关'}`;},
    get districtEnabled() { return districtEnabled; },
    get refinementEnabled() { return refinementEnabled; },
    get refinementStats() { return (nearAbu?abuStudies:(districtEnabled ? districtStudies : refinements)).map(r => r.stats); },
    get enabled() { return enabled; }, dispose() {
    setEnabled(false); extras.forEach(o => { o.removeFromParent(); o.geometry.dispose(); });
    contact?.dispose();probe?.dispose();abuProbe?.dispose();abuStudies.forEach(r=>r.dispose());
    refinements.forEach(r => r.dispose()); districtStudies.forEach(r => r.dispose()); waterStudy.dispose();
    sky.material.fragmentShader = skyFragment; delete sky.material.uniforms.taAtmosphere; sky.material.needsUpdate = true;
    textures.forEach(t => t.dispose()); materials.forEach(m => m.dispose()); envTarget.dispose();
  } };
}
