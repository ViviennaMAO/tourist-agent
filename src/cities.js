import {ABU_COAST} from './abudhabi-coastline.js';
import {VEGAS_RESERVATIONS} from './vegas-layout.js';
import {MARINA_OBSTACLES,MARINA_PIERS,MARINA_OUTLINE} from './dubai-marina-layout.js';
// Active Explore edition. Removed recipes remain available in Git history.
export const ASSET = 'https://resources.parallelworld.com/assets/';
export const CITIES = {
  dubai: {
    id: 'dubai', name: 'DUBAI', nameLocal: 'دبي', nameZh: '迪拜',
    bgm: ASSET + 'media/dubai/bgm.mp3',
    // pos 落点 [x,z]；h 目标高度；base 地面高度；r 占地半径（排楼时避让）；rot 朝向
    landmarks: {
      waterfront_wheel: { procedural:'wheel',walkSurface:{circle:[58,29,20],height:1.08},arrival:[58,36],name:'Dubai Waterfront Wheel',zh:'滨海摩天轮',pos:[58,29],h:32,base:1,r:15,rot:0,dur:3,walkObstacles:[{x:-4.5,z:-2.5,w:2,d:2},{x:4.5,z:-2.5,w:2,d:2},{x:-4.5,z:2.5,w:2,d:2},{x:4.5,z:2.5,w:2,d:2},{x:0,z:-2.7,w:5.5,d:1.3}]},
      cruise_terminal: { procedural:'cruise',walkSurface:{polygon:MARINA_OUTLINE,height:1.16},walkAreas:MARINA_PIERS,arrival:[79,29],name:'Dubai Cruise Pier',zh:'邮轮码头',pos:[80,13],h:6,base:0,r:7,rot:0,dur:3,walkObstacles:MARINA_OBSTACLES.map(q=>({...q,x:q.x-80,z:q.z-13}))},
      burj_khalifa:    { key: 'Dubai_Halifa__Dubai_Halifa',       tex: 'Dubai_Halifa_D.png',    name: 'Burj Khalifa',         zh: '哈利法塔',     pos: [0, -33],  h: 46, base: 1.34, r: 5, rot: 0,    dur: 5.5 },
      dubai_frame:     { key: 'Dubai_Kuang__Dubai_Kuang',         tex: 'Dubai_Kuang.png',       name: 'Dubai Frame',          zh: '迪拜相框',     pos: [-21, -43], h: 14, base: 1.25, r: 8, rot: 0,    dur: 3 },
      museum_future:   { key: 'Dubai_Museum__Dubai_Museum',       tex: 'Dubai_Museum.png',      name: 'Museum of the Future', zh: '未来博物馆',   pos: [21, -27], h: 8,  base: 1.25, r: 7, rot: 0,    dur: 3 },
      emirates_towers: { key: 'Dubai_Hotel2__Dubai_Hotel_2',      tex: 'Dubai_Hotel_2.png',     name: 'Emirates Towers',      zh: '阿联酋双塔',   pos: [41, -33], h: 18, base: 1.25, r: 6, rot: 0,    dur: 3 },
      atlantis:        { key: 'Dubai_Yatelansi__Dubai_Yatelansi', tex: 'Dubai_Yatelansi_D.png', name: 'Atlantis The Palm',    zh: '亚特兰蒂斯',   pos: [0, 55.5], h: 8,  base: 1.0,  r: 6, rot: 0,    dur: 3 },
      burj_al_arab:    { key: 'Dubai_Fanchuan__Dubai_Fanchuan',   tex: 'Dubai_Fanchuan.png',    name: 'Burj Al Arab',         zh: '帆船酒店',     pos: [-50, 15], h: 20, base: 1.0,  r: 5, rot: 0,    dur: 3.5 },
    },
    script: `stage(1,'云层俯冲',0)
cam([0,340,170],[0,0,-14])
clouds(70)
wait(2.3)
cam([12,175,175],[0,0,-18])

stage(2,'沙洲升起',4)
island('mainland','rect',[-64,-84,64,-5],9)      // 主城半岛
cam([34,128,150],[0,0,-28])
wait(0.8)
grass([-48,-57,48,-12],5)
dunes(16,[-60,-82,60,-62])                       // 远景沙丘
umbrellas([-44,-8],[44,-8],12)                   // 海滩遮阳伞

stage(3,'路网铺设',9)
cam([-58,66,42],[0,0,-30])
road([-48,-16],[48,-16])                         // 谢赫扎耶德路
road([0,-5],[0,-21])                             // 林荫大道
road([-48,-50],[48,-50])
road([-34,-50],[-34,-16])
road([34,-50],[34,-16])
cam([46,60,34],[0,0,-32])
palmsLine([-46,-13.6],[46,-13.6],22)
palmsLine([-31.6,-47],[-31.6,-19],6)
palmsLine([31.6,-47],[31.6,-19],6)

stage(4,'哈利法塔',15)
cam([30,30,2],[0,6,-33])
lake([0,-33],10)                                 // 中央人工湖
landmark('burj_khalifa')
cam([26,58,14],[0,30,-33])
wait(1.6)
fountain([0,-33],7.2,14)

stage(5,'城市长高',22)
cam([78,64,32],[0,4,-32])
block([-47,-49,-37,-19],6,'glass')
landmark('dubai_frame')
block([-31,-49,-13,-38],3,'glass')
landmark('museum_future')
cam([-70,66,30],[0,6,-34])
block([12,-49,31,-41],4,'mixed')
landmark('emirates_towers')
block([37,-49,47,-19],3,'glass')
block([-47,-57,47,-52],14,'mixed')               // 后排天际线
block([-31,-31,-13,-19],4,'shops')
block([10,-21,31,-19],2,'shops')

stage(6,'棕榈岛',31)
cam([64,74,98],[0,0,24])
road([0,-5],[0,8],'bridge')                      // 跨海栈桥
island('trunk','capsule',[0,6,0,40],3.4)
fronds([0,9],[0,37],8)                           // 16 片叶形沙洲
island('crescent','crescent',[0,22],33,2.6,112)  // 月牙防波堤
island('pad','circle',[0,55],6.5)
road([0,8],[0,39])
frondVillas(2)
frondPalms(2)
crescentPalms(28)
cam([26,40,88],[0,6,44])
landmark('atlantis')

stage(7,'帆船酒店',39)
cam([-92,34,52],[-50,10,13])
island('islet','circle',[-50,14],7)
road([-50,-5],[-50,7.6],'bridge')
landmark('burj_al_arab')
cam([-78,30,24],[-50,16,14])
heli([-50,15],15,27)

stage(8,'滨海摩天轮与邮轮码头',43)
island('wheel-plaza','circle',[58,29],20,0)
island('cruise-quay','polygon',${JSON.stringify(MARINA_OUTLINE)},0)
road([48,-5],[48,15],'bridge')
road([60,-8],[85,4],'bridge')
landmark('waterfront_wheel')
landmark('cruise_terminal')
palmsLine([49,20],[49,35],3)
palmsLine([68,22],[68,34],3)

stage(9,'城市苏醒',47)
cam([-30,96,128],[0,4,-8])
cars(18,[[[-34,-16],[34,-16],[34,-50],[-34,-50]],[[-48,-16],[48,-16]],[[0,-16],[0,39]],[[-48,-50],[48,-50]]])
yachts(5,[[38,8,4],[50,60,5],[-24,66,9],[-66,42,9],[90,-25,5]])
gulls(14)
balloon([26,-3])
// Waterfront dining terraces replace the old freestanding sign.
wait(0.6)
orbit([0,0,2],142,104,7)
wait(0.8)
title()
end(50)`
  },
  abudhabi: {
    id: 'abudhabi', name: 'ABU DHABI', nameLocal: 'أبوظبي', nameZh: '阿布扎比',
    bgm: ASSET + 'media/abu-dhabi/bgm.mp3',
    // parts 多部件地标（阿提哈德塔三栋）按宽度横向排开；normalizeHeight 先把各部件高度拉齐
    landmarks: {
      grand_mosque:  { key: 'AUH_Mosque__AUH_Mosque',             tex: 'AUH_Mosque_BaseColor.png',      name: 'Sheikh Zayed Grand Mosque', zh: '谢赫扎耶德大清真寺', pos: [-15, 27],  h: 18, base: 1.0, r: 11, rot: 0, dur: 5.5 },
      capital_gate:  { key: 'AUH_CapitalGate__AUH_CapitalGate',   tex: 'AUH_CapitalGate_BaseColor.png', name: 'Capital Gate',              zh: '首都之门',         pos: [12, -63],  h: 18, base: 1.25, r: 7,  rot: 0, dur: 3 },
      ferrari_world: { key: 'AUH_Ferrari__AUH_Ferrari',           tex: 'AUH_Ferrari_BaseColor.png',     name: 'Ferrari World',             zh: '法拉利世界',       pos: [40, -62],  h: 5,  base: 1.0, r: 15, rot: 0, dur: 3 },
      etihad_towers: { parts: [['AUH_Tower__AUH_Tower01', 'AUH_Tower01_BaseColor.png'], ['AUH_Tower__AUH_Tower02', 'AUH_Tower02_BaseColor.png'], ['AUH_Tower__AUH_Tower03', 'AUH_Tower03_BaseColor.png']],
                       normalizeHeight: true,                                                          name: 'Etihad Towers',             zh: '阿提哈德塔',       pos: [56, -20],  h: 26, base: 1.25, r: 16, rot: Math.PI / 2, dur: 3.5 },
      emirates_palace: { key: 'AUH_Hotel__AUH_Hotel',             tex: 'AUH_Hotel_BaseColor.png',       name: 'Emirates Palace',           zh: '酋长皇宫酒店',     pos: [-54, 0],   h: 9,  base: 1.0, r: 9,  rot: 0, dur: 3 },
      abrahamic:     { key: 'AUH_Abrahamic__AUH_Abrahamic',       tex: 'AUH_Abrahamic_BaseColor.png',   name: 'Abrahamic Family House',    zh: '亚伯拉罕家族之家', pos: [44, 28],   h: 6,  base: 1.0, r: 13, rot: 0, dur: 3 },
    },
    script: `stage(1,'云层俯冲',0)
cam([0,340,170],[0,0,-14])
clouds(70)
wait(2.3)
cam([12,175,175],[0,0,-18])

stage(2,'沙洲升起',4)
island('mainland','polygon',${JSON.stringify(ABU_COAST)},0)     // 阿布扎比主岛
cam([30,128,160],[0,0,-18])
wait(0.8)
plaza([-38,-50,38,12],6)                          // 中心广场地块
plaza([-68,-78,24,-52],5)                         // 北区地块
plaza([44,-46,70,10],5)                           // 东区地块
// Forecourt is reserved for marble paving and planted edges.
rocks(10,[26,-80,70,-74])

stage(3,'运河与潟湖',9)
cam([-46,84,58],[0,0,-18])
water('lagoon','rect',[-22,-36,22,-4],8)          // 中央潟湖
canal([10,-4],[10,48.5],6)                        // 南运河（画到岛外，入海口顺坡入海）
canal([-22,-26],[-74.5,-26],6)                    // 西运河
isle('capsule',[-14,-22,6,-22],6)                 // 潟湖绿洲
isle('circle',[14,-13],4)
isle('circle',[-16,-9],3)
cam([34,64,40],[0,2,-20])
sign('ABU DHABI',[-4,-22],0,1.9,2.3)
palmsLine([12,-15],[16,-11],2)
palmsLine([-17,-10],[-15,-8],1)

stage(4,'环路铺设',13.5)
cam([62,84,74],[0,0,-20])
road([-31,6],[6,6])                               // 环湖路
road([6,6],[14,6],'bridge')
road([14,6],[31,6])
road([31,6],[31,-44])
road([31,-44],[-31,-44])
road([-31,-44],[-31,-23])
road([-31,-23],[-31,-29],'bridge')
road([-31,-29],[-31,6])
road([0,-44],[0,-76])                             // 北大道
road([31,-20],[44,-20])
palmsLine([-28,9.5],[28,9.5],12)
bushes(26,[-30,-41,30,3])

stage(5,'大清真寺',20.5)
cam([6,18,58],[-15,6,27])
landmark('grand_mosque')
cam([22,36,72],[-15,8,26])
palmsLine([4.4,14],[4.4,42],6)                    // 运河两岸
palmsLine([15.6,14],[15.6,42],6)
palmsLine([-34,41],[-26,41],2)
palmsLine([-4,41],[3,41],2)                      // 清真寺前庭棕榈
// Corniche seating and shade use the refined waterfront module.

stage(6,'城市长高',26.5)
cam([66,84,24],[16,6,-52])
landmark('capital_gate')
block([-66,-77,-6,-53],12,'mixed')               // 北区
landmark('ferrari_world')
landmark('etihad_towers')
cam([-34,84,4],[18,8,-48])
block([44,-46,68,-38],2,'glass')
block([44,0,68,9],3,'mixed')
block([16,14,29,38],3,'shops')
block([-70,-50,-40,-34],5,'mixed')
block([-44,14,-29,40],3,'shops')

stage(7,'海岸地标',35)
cam([-104,44,40],[-54,4,0])
landmark('emirates_palace')
bushes(30,[-70,-20,-38,18])                       // 皇宫花园
palmsLine([-38,-31.6],[-68,-31.6],7)              // 西运河两岸
palmsLine([-38,-20.4],[-68,-20.4],7)
cam([92,40,78],[42,4,26])
landmark('abrahamic')
road([54,46],[54,64],'pier')                      // 木栈桥
heli([56,-22],18,32)

stage(8,'城市苏醒',41.5)
cam([-36,112,156],[0,4,-16])
cars(16,[[[-31,6],[31,6],[31,-44],[-31,-44]],[[0,-44],[0,-76]],[[31,-20],[44,-20]]])
yachts(4,[[-88,-30,9],[84,0,10],[30,66,10],[-40,64,9]])
gulls(14)
balloon([-30,-62])
wait(0.6)
orbit([0,0,-14],150,110,7)
wait(3.6)
title()
end(50)`
  },
  lasvegas: {
    reservedPlots: VEGAS_RESERVATIONS,
    id: 'lasvegas', name: 'LAS VEGAS', nameLocal: 'Entertainment Capital', nameZh: '拉斯维加斯',
    bgm: ASSET + 'media/las-vegas/bgm.mp3',
    landmarks: {
      sphere:  { key: 'sphere__sphere',                 tex: 'sphere.png',                                 name: 'Sphere',             zh: '拉斯维加斯球', pos: [0, -18],  h: 14, base: 1.25, r: 8,  rot: 0, dur: 5.5 },
      luxor:   { key: 'L010_LVLUXOR_1__L010_LVLUXOR_1', tex: 'Luxor_Base_color.png',                       name: 'Luxor',              zh: '卢克索酒店',   pos: [-20, -34], h: 12, base: 1.25, r: 10, rot: 0, dur: 3 },
      resorts: { key: 'Lo14_Hotel_1__Lo14_Hotel_1',     tex: 'L014_ResortWorld_1_AlbedoTransparency.png', name: 'Resorts World',      zh: '云顶世界',     pos: [20, -34],  h: 16, base: 1.25, r: 10, rot: 0, dur: 3 },
      strat:   { key: 'Vegas_Tower__Vegas_Tower',       tex: 'Vegas_Tower.png',                            name: 'Stratosphere Tower', zh: '云霄塔',       pos: [54, -46],  h: 40, base: 1.0,  r: 6,  rot: 0, dur: 4.5 },
      lvsign:  { key: 'L011_LVSIGN__L011_LVSIGN_1',     tex: 'L011_LVSIGN_AlbedoTransparency.png',         name: 'Welcome Sign',       zh: '欢迎牌',       pos: [7, 32],    h: 8,  base: 1.0,  r: 4,  rot: 0, dur: 2.5 },
      rqq:     { key: 'Vegas_Rqq__Vegas_Rqq',           tex: 'reqiqiu.png',                                name: 'Hot Air Balloon',    zh: '热气球',       pos: [-24, 0],   h: 12, base: 1.25, r: 4,  rot: 0, dur: 2.5 },
    },
    script: `stage(1,'云层俯冲',0)
cam([0,340,170],[0,0,-14])
clouds(70)
wait(2.3)
cam([12,175,175],[0,0,-18])

stage(2,'沙漠升起',4)
island('mainland','rect',[-76,-82,76,46],14)
cam([30,128,160],[0,0,-18])
wait(0.8)
mount([-62,-68],11,9,'rock')                      // 红岩台地
mount([-66,-36],7,6,'rock')
mount([62,-72],10,10,'rock')
mount([64,28],8,7,'rock')
rocks(6,[-72,-80,72,-58],2.2)                     // 大道四周的荒漠岩块（避开中央广场）
rocks(6,[-72,20,72,44],2.2)
rocks(3,[-72,-54,-46,16],2.2)
rocks(3,[46,-54,72,16],2.2)

stage(3,'大道铺设',9.5)
cam([-50,92,80],[0,0,-18])
plaza([-42,-54,42,16],5)                          // 拉斯维加斯大道
road([-38,12],[38,12])
road([38,12],[38,-50])
road([38,-50],[-38,-50])
road([-38,-50],[-38,12])
road([0,12],[0,44])
road([38,-20],[62,-20])
palmsLine([-34,-46],[34,-46],12)
palmsLine([-34,8],[34,8],12)

stage(4,'Sphere 球幕',16)
cam([20,22,16],[0,7,-18])
landmark('sphere')
cam([26,44,30],[0,8,-20])

stage(5,'金字塔与酒店',22)
cam([-56,46,10],[-20,6,-34])
landmark('luxor')
landmark('resorts')
cam([50,52,8],[20,8,-34])
block([-36,-46,36,6],4,'shops')
block([-36,-80,40,-58],10,'mixed')

stage(6,'云霄塔',28.5)
cam([84,34,-10],[54,14,-46])
landmark('strat')
cam([88,62,6],[54,24,-46])
block([44,-40,72,20],6,'shops')

stage(7,'欢迎牌与热气球',34.5)
cam([26,14,52],[7,4,32])
landmark('lvsign')
landmark('rqq')
cam([-48,40,30],[-24,6,0])
block([-72,-26,-46,40],7,'mixed')
block([10,22,40,42],4,'shops')
palmsLine([-4,16],[-4,42],5)

stage(8,'城市苏醒',41.5)
cam([-36,112,156],[0,4,-16])
cars(18,[[[-38,12],[38,12],[38,-50],[-38,-50]],[[0,12],[0,44]],[[38,-20],[62,-20]]])
yachts(4,[[-92,-20,9],[92,10,10],[30,68,10],[-50,66,9]])
heli([54,-46],14,30)
gulls(8)
wait(0.6)
orbit([0,0,-16],155,112,7)
wait(3.0)
title()
end(50)`
  }
};
export const CITY_ORDER = Object.keys(CITIES);
export const CITY_COUNT = CITY_ORDER.length;
CITY_ORDER.forEach((id,i)=>Object.assign(CITIES[id],{index:i+1,total:CITY_COUNT}));
// Keep existing city origins so Dubai's authored lighting and review views stay aligned.
export const CITY_GRID = { dubai: [-345,-230], abudhabi: [-115,-230], lasvegas: [-115,0] };

export function activeCheckinKeys(keys) {
  const valid=new Set(CITY_ORDER.flatMap(id=>Object.keys(CITIES[id].landmarks).map(k=>id+':'+k)));
  return [...keys].filter(k=>valid.has(k));
}

/** Fit the active islands and tallest landmark in landscape and portrait views. */
export function overviewFrame(aspect,fov=35) {
  const points=Object.values(CITY_GRID);
  const minX=Math.min(...points.map(p=>p[0]))-110,maxX=Math.max(...points.map(p=>p[0]))+110;
  const minZ=Math.min(...points.map(p=>p[1]))-110,maxZ=Math.max(...points.map(p=>p[1]))+110;
  const target=[(minX+maxX)/2,55,(minZ+maxZ)/2],tan=Math.tan(fov*Math.PI/360);
  let distance=0;
  for(const x of [minX,maxX])for(const y of [0,110])for(const z of [minZ,maxZ]) {
    const dx=x-target[0],dy=y-target[1],dz=z-target[2];
    distance=Math.max(distance,Math.max(Math.abs(dx)/(tan*Math.max(.2,aspect)),Math.abs(.6*dy-.8*dz)/tan)+.8*dy+.6*dz);
  }
  distance*=1.08;
  return {target,position:[target[0],target[1]+.8*distance,target[2]+.6*distance]};
}
