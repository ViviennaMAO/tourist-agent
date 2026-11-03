import * as THREE from 'three';

/** Three static, prefiltered probes sample the real courtyard and tower district.
 * Box projection supplies local parallax, rather than moving one distant sky
 * gradient across every pane. This is still an approximation, not SSR/ray tracing.
 */
export function createCityReflections({renderer,scene,city,zoneSpecs}) {
  let target=null,pmrem=null,cube=null,dirty=true,enabled=false,disposed=false,captures=0;
  const records=new Map(),hidden=[];
  const zones=zoneSpecs||{
    harbor:{position:[82,7,29],min:[34,0,-8],max:[107,36,68]},
    courtyard:{position:[-20,4.8,-9],min:[-40,0,-22],max:[0,11,4]},
    skyline:{position:[15,16,-50],min:[-64,0,-84],max:[64,32,-15]}
  };
  for(const zone of Object.values(zones)) {
    zone.origin={value:new THREE.Vector3(...zone.position)};
    zone.boxMin={value:new THREE.Vector3(...zone.min)};zone.boxMax={value:new THREE.Vector3(...zone.max)};
    zone.active={value:0};zone.filtered=null;
  }
  function discoverMaterials(){for(const root of [city.w.root,city.landmarkGroup].filter(Boolean))root.traverse(o=>{
    if(!o.isMesh)return;
    for(const m of Array.isArray(o.material)?o.material:[o.material])if(m.userData.cityGlass&&!records.has(m)){
      const zone=zones[m.userData.reflectionZone||'courtyard'];
      const before={envMap:m.envMap,compile:m.onBeforeCompile,key:m.customProgramCacheKey,zone};
      const key=m.customProgramCacheKey();records.set(m,before);dirty=true;
      m.onBeforeCompile=(shader,renderer)=>{
        before.compile.call(m,shader,renderer);
        Object.assign(shader.uniforms,{cityProbeOrigin:zone.origin,cityProbeMin:zone.boxMin,cityProbeMax:zone.boxMax,cityProbeActive:zone.active});
        shader.vertexShader='varying vec3 cityGlassWorld;\n'+shader.vertexShader;
        shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
          vec4 cityGlassPoint=vec4(transformed,1.);
          #ifdef USE_INSTANCING
            cityGlassPoint=instanceMatrix*cityGlassPoint;
          #endif
          cityGlassWorld=(modelMatrix*cityGlassPoint).xyz;`);
        shader.fragmentShader=`varying vec3 cityGlassWorld;
          uniform vec3 cityProbeOrigin,cityProbeMin,cityProbeMax; uniform float cityProbeActive;
          vec3 cityProjectedReflection(vec3 ray){
            if(cityProbeActive<.5||any(lessThan(cityGlassWorld,cityProbeMin))||any(greaterThan(cityGlassWorld,cityProbeMax)))return ray;
            vec3 safeRay=sign(ray)*max(abs(ray),vec3(.0001));
            safeRay+=vec3(equal(safeRay,vec3(0.)))*.0001;
            vec3 planes=mix(cityProbeMin,cityProbeMax,step(vec3(0.),safeRay));
            vec3 distances=(planes-cityGlassWorld)/safeRay;
            float distance=min(min(distances.x,distances.y),distances.z);
            return normalize(cityGlassWorld+ray*distance-cityProbeOrigin);
          }\n`+shader.fragmentShader;
        const chunk=THREE.ShaderChunk.envmap_physical_pars_fragment.replace(
          'reflectVec = inverseTransformDirection( reflectVec, viewMatrix );',
          'reflectVec = cityProjectedReflection(inverseTransformDirection( reflectVec, viewMatrix ));');
        shader.fragmentShader=shader.fragmentShader.replace('#include <envmap_physical_pars_fragment>',chunk);
      };
      m.customProgramCacheKey=()=>key+'-city-box-reflections-v1';m.needsUpdate=true;
    }
  });}
  discoverMaterials();
  const restoreMaps=()=>{for(const [m,r] of records){m.envMap=r.envMap;m.needsUpdate=true;}for(const zone of Object.values(zones))zone.active.value=0;};
  function assignMaps(){for(const [m,{zone}] of records)if(zone.filtered){m.envMap=zone.filtered.texture;m.needsUpdate=true;zone.active.value=1;}}
  return {invalidate(){dirty=true;},setEnabled(value){enabled=!!value;if(enabled)assignMaps();else restoreMaps();},captureIfNeeded(){
    if(disposed||!enabled||!city.w.root.visible)return;
    if(!dirty)return;
    discoverMaterials();
    if(!Object.values(city.LM||{}).every(l=>l.loaded||l.failed))return;
    if(!target){target=new THREE.WebGLCubeRenderTarget(256,{type:THREE.HalfFloatType,generateMipmaps:false});cube=new THREE.CubeCamera(.5,6000,target);pmrem=new THREE.PMREMGenerator(renderer);}
    const previous=renderer.getRenderTarget(),shadowAuto=renderer.shadowMap.autoUpdate;
    scene.updateMatrixWorld(true);restoreMaps();
    scene.traverse(o=>{
      if(o.userData.character||o.userData.excludeReflection||o.name==='Dubai — detailed sedan traffic'||o.isSprite){hidden.push([o,o.visible]);o.visible=false;}
    });
    try {
      renderer.shadowMap.autoUpdate=false;
      for(const zone of Object.values(zones)) {
        zone.origin.value.copy(city.w.root.localToWorld(new THREE.Vector3(...zone.position)));
        zone.boxMin.value.copy(city.w.root.localToWorld(new THREE.Vector3(...zone.min)));
        zone.boxMax.value.copy(city.w.root.localToWorld(new THREE.Vector3(...zone.max)));
        cube.position.copy(zone.origin.value);cube.update(renderer,scene);
        const next=pmrem.fromCubemap(target.texture);zone.filtered?.dispose();zone.filtered=next;
      }
      dirty=false;captures++;
    } finally {
      for(const [o,visible] of hidden)o.visible=visible;hidden.length=0;
      renderer.shadowMap.autoUpdate=shadowAuto;renderer.setRenderTarget(previous);assignMaps();
    }
  },get status(){return captures?`${Object.keys(zones).length} 探针 · 更新 ${captures} 次`:'等待街区资源';},dispose(){
    if(disposed)return;disposed=true;restoreMaps();
    for(const [m,r] of records){m.onBeforeCompile=r.compile;m.customProgramCacheKey=r.key;m.needsUpdate=true;}
    records.clear();for(const zone of Object.values(zones))zone.filtered?.dispose();target?.dispose();pmrem?.dispose();
  }};
}
