import * as THREE from 'three';

// Seven separated jets land around the basin instead of converging into a
// white wire dome. Geometry and drops share this trajectory.
export function fountainPoint(lane,t){
  const angle=lane/7*Math.PI*2,r=.22+1.08*t;
  return [Math.cos(angle)*r,.025+4*(.82+(lane%3)*.12)*t*(1-t),Math.sin(angle)*r];
}

export function createFountainSpray(){
  const count=168,positions=new Float32Array(count*3),geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));
  geometry.boundingSphere=new THREE.Sphere(new THREE.Vector3(0,.7,0),2);
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,
    uniforms:{pixelRatio:{value:1}},
    vertexShader:`uniform float pixelRatio; varying float fade;
      void main(){vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;
        gl_PointSize=clamp(32./max(1.,-p.z),1.,3.2)*pixelRatio;fade=clamp(18./max(1.,-p.z),.2,1.);}`,
    fragmentShader:`varying float fade;
      void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;
        gl_FragColor=vec4(.78,.90,.91,(1.-smoothstep(.25,1.,r))*.55*fade);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  const mesh=new THREE.Points(geometry,material);mesh.name='Fountain moving droplets';
  mesh.userData.excludeReflection=true;
  mesh.onBeforeRender=renderer=>material.uniforms.pixelRatio.value=renderer.getPixelRatio();
  let lastTime=NaN;
  return {mesh,update(time){
    if(time===lastTime)return;lastTime=time;
    for(let i=0;i<count;i++){
      const lane=i%7,t=((i/7/24+time*(.55+lane*.025))%1+1)%1;
      const p=fountainPoint(lane,t),jitter=.008+Math.max(0,t-.6)*.08;
      positions[i*3]=p[0]+Math.sin(i*17.3)*jitter;
      positions[i*3+1]=p[1]+Math.sin(i*5.1)*jitter*.5;
      positions[i*3+2]=p[2]+Math.cos(i*11.7)*jitter;
    }
    geometry.attributes.position.needsUpdate=true;
  }};
}
