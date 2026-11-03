import * as THREE from 'three';

/** An authored red/white/blue LED programme, with slowly flowing bands.
 * It is not a copy of the supplied photograph or a live Sphere video feed. */
export function createVegasSphere({city}){
 let record=null,enabled=false,disposed=false;const time={value:0},stats={vegasSphere:0};
 function build(L){
  const root=new THREE.Group();root.name='Las Vegas — LED Sphere';L.holder.add(root);
  const screen=new THREE.ShaderMaterial({uniforms:{showTime:time},vertexShader:`varying vec2 screenUv;varying float screenFacing;void main(){screenUv=uv;screenFacing=abs(dot(normalize(normalMatrix*normal),normalize(-(modelViewMatrix*vec4(position,1.)).xyz)));gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`uniform float showTime;varying vec2 screenUv;varying float screenFacing;
   void main(){vec2 p=screenUv;float band=sin((p.y+sin(p.x*12.+showTime*.15)*.016)*81.68);float edge=fwidth(band)*1.5;vec3 red=vec3(.65,.035,.018),white=vec3(.72,.76,.78),blue=vec3(.015,.055,.36);vec3 col=mix(red,white,smoothstep(-edge,edge,band));
   if(p.y>.62){col=blue;vec2 grid=vec2(p.x*28.,(p.y-.62)*22.);grid.x+=mod(floor(grid.y),2.)*.5;vec2 q=fract(grid)-.5;float a=atan(q.y,q.x);float theta=mod(a+1.570796,6.283185)/6.283185*10.;float tooth=mod(floor(theta),2.);float radius=mix(mix(.23,.095,tooth),mix(.095,.23,tooth),fract(theta));float star=1.-smoothstep(radius-.025,radius+.025,length(q));col=mix(col,white,star);}
   vec2 cells=p*vec2(1500.,700.);float detail=1.-smoothstep(.4,1.3,max(fwidth(cells.x),fwidth(cells.y)));float led=(.88+.12*sin(cells.x*6.283)*sin(cells.y*6.283));col*=mix(1.,led,detail);
   col*=.62+.38*pow(screenFacing,.4);gl_FragColor=vec4(col,1.);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
  }`});
  const shell=new THREE.Mesh(new THREE.SphereGeometry(7.2,112,64,0,Math.PI*2,0,2.26).translate(0,6.6,0),screen);shell.castShadow=true;root.add(shell);
  const base=new THREE.MeshStandardMaterial({color:'#6e7472',roughness:.48,metalness:.32});
  const podium=new THREE.Mesh(new THREE.CylinderGeometry(6.4,6.7,1.9,80).translate(0,.95,0),base);podium.castShadow=podium.receiveShadow=true;root.add(podium);
  const glass=new THREE.MeshStandardMaterial({color:'#233c45',roughness:.2,metalness:.25});glass.userData.cityGlass=true;glass.userData.reflectionZone='strip';
  const entrance=new THREE.Mesh(new THREE.CylinderGeometry(6.53,6.66,.8,80,true).translate(0,.85,0),glass);root.add(entrance);
  record={root,L,visible:L.asset.visible,materials:[screen,base,glass]};stats.vegasSphere=1;
 }
 return {stats,apply(t=0){if(disposed)return;time.value=t;if(!record&&city.LM?.sphere?.asset)build(city.LM.sphere);if(record){record.root.visible=enabled;record.L.asset.visible=enabled?false:record.visible;}},setEnabled(v){enabled=!!v&&!disposed;if(record){record.root.visible=enabled;record.L.asset.visible=enabled?false:record.visible;}},dispose(){if(disposed)return;this.setEnabled(false);disposed=true;if(record){record.root.removeFromParent();record.root.children.forEach(m=>m.geometry.dispose());record.materials.forEach(m=>m.dispose());}}};
}
