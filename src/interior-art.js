import * as THREE from 'three';

export const CITY_ART = {
 dubai:{title:'溪湾与沙丘',src:'/artworks/dubai-creek-dusk.jpg'},
 abudhabi:{title:'海湾的白色回声',src:'/artworks/abudhabi-coastal-light.jpg'},
 lasvegas:{title:'沙漠不夜城',src:'/artworks/lasvegas-desert-nocturne.jpg'}
};
// Side, position along the wall, hanging height, image width. Keep circulation clear.
const HANGINGS={mosque:[-1,1.5,2.65,2.4],palace:[-1,1.6,2.8,2.7],racing:[1,1.2,2.8,2.7],etihad:[1,3,2.8,2.7],courtyard:[-1,-.9,2.8,2.4],burj:[-1,3,2.8,2.7],future:[-1,-3,2.8,2.7],aquarium:[-1,3,2.8,2.7],sail:[-1,-1.7,2.8,2.4],harbor:[1,-1.8,2.8,2.4],sphere:[-1,2.6,2.8,2.4],luxor:[-1,1.7,2.8,2.7],resort:[-1,-2.4,2.8,1.8],strat:[-1,3,2.8,2.7],balloon:[1,3.7,2.8,2.4]};

// A late image response must never attach a texture to an already disposed room.
export function loadArtwork(material,url,loader=new THREE.TextureLoader()){
 let disposed=false,texture,settle;
 const ready=new Promise(resolve=>{settle=resolve;});
 texture=loader.load(url,t=>{if(disposed)return;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;material.map=t;material.needsUpdate=true;settle(true);},undefined,()=>settle(false));
 return {ready,dispose(){if(disposed)return;disposed=true;settle(false);texture.dispose();}};
}

export function hangCityArtwork(spec,{add,box,material,captureStart,transformSince},scene){
 const artwork=CITY_ART[spec.city], [side,z,y,w]=HANGINGS[spec.theme],h=w/1.5;
 const x=side*(spec.theme==='future'?8.12:8.58),rotation=-side*Math.PI/2;
 const matrix=new THREE.Matrix4().makeRotationY(rotation).setPosition(x,y,z),start=captureStart();
 const bronze=material('#877044',.58,.36),mat=material('#e9e2d3',0,.88),back=material('#38312b',0,.9);
 box(back,0,0,-.05,w+.42,h+.42,.12);box(mat,0,0,.025,w+.3,h+.3,.04);
 for(const yy of [-1,1])box(bronze,0,yy*(h/2+.18),.07,w+.42,.065,.13);
 for(const xx of [-1,1])box(bronze,xx*(w/2+.18),0,.07,.065,h+.32,.13);
 // Recessed canvas, without reflective glass that would obscure the brushwork.
 const canvas=material('#ffffff',0,.94);add(new THREE.PlaneGeometry(w,h).translate(0,0,.055),canvas);
 box(bronze,0,h/2+.39,.18,.055,.18,.33);box(bronze,0,h/2+.45,.34,w*.5,.055,.08);
 box(material('#ffe3b3',0,.8,.6),0,h/2+.414,.34,w*.46,.012,.05);
 transformSince(start,matrix);
 const lamp=new THREE.SpotLight('#fff1db',4,5,Math.PI/3,.8,2);
 lamp.position.set(0,h/2+.41,.36).applyMatrix4(matrix);lamp.target.position.set(0,-.15,.06).applyMatrix4(matrix);scene.add(lamp,lamp.target);
 const loading=typeof document!=='undefined'&&typeof document.createElementNS==='function'?loadArtwork(canvas,artwork.src):{ready:Promise.resolve(false),dispose(){}};
 return {artwork,ready:loading.ready,dispose:loading.dispose,shot(aspect=1){
  const distance=Math.max((h+.7)/2,(w+.7)/(2*Math.max(.2,aspect)))/Math.tan(THREE.MathUtils.degToRad(24))*1.18;
  const q=new THREE.Vector3(0,0,.06).applyMatrix4(matrix),p=new THREE.Vector3(0,0,distance).applyMatrix4(matrix);
  return {p:p.toArray(),q:q.toArray()};
 }};
}
