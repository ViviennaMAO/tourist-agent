import {travel,connectSceneLoader} from './travel-shell.js';
let loading;
async function loadScene(){
  if(loading)return loading;
  document.body.classList.remove('travelOnly');
  loading=import('./game.js').catch(error=>{
    console.error('3D scene unavailable:',error);
    document.body.classList.add('travelOnly');
    document.getElementById('travelFallbackMessage').textContent='三维场景暂时无法加载，仍可查看地点、保存行程和打开官方信息。';
    loading=null;
  });
  return loading;
}
connectSceneLoader(loadScene);
document.getElementById('travelFallbackOpen').onclick=()=>travel.open('home');
const query=new URLSearchParams(location.search);
if(['trip','pilot-review'].includes(query.get('view'))){
  document.body.classList.add('travelOnly');travel.open(query.get('view')==='pilot-review'?'review':'route');
}else await loadScene();
