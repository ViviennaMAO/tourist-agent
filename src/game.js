import * as THREE from 'three';
import {pointInPolygon} from './shore-profile.js';
import evaSpriteUrl from './assets/eva-sprite-atlas-v1.png';
import { createEvaSprite } from './eva-sprite.js';
import { spaceDubaiTraffic } from './dubai-vehicles.js';
import { createRealism } from './realism.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

/* =====================================================================
   1. 城市配置 —— 换城市只改这里（地标表 + 施工脚本）
   ===================================================================== */
const ASSET = 'https://resources.parallelworld.com/assets/';

const CITIES = {
  dubai: {
    id: 'dubai', name: 'DUBAI', nameLocal: 'دبي', nameZh: '迪拜', index: 2, total: 11,
    bgm: ASSET + 'media/dubai/bgm.mp3',
    // pos 落点 [x,z]；h 目标高度；base 地面高度；r 占地半径（排楼时避让）；rot 朝向
    landmarks: {
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

stage(8,'城市苏醒',44)
cam([-30,96,128],[0,4,-8])
cars(18,[[[-34,-16],[34,-16],[34,-50],[-34,-50]],[[-48,-16],[48,-16]],[[0,-16],[0,39]],[[-48,-50],[48,-50]]])
yachts(5,[[52,12,9],[50,44,11],[-24,66,9],[-66,42,9],[76,-22,7]])
gulls(14)
balloon([26,-3])
sign('DUBAI',[54,22],-0.45,0,4.6)
wait(0.6)
orbit([0,0,2],142,104,7)
wait(0.8)
title()
end(50)`
  },

  abudhabi: {
    id: 'abudhabi', name: 'ABU DHABI', nameLocal: 'أبوظبي', nameZh: '阿布扎比', index: 1, total: 11,
    bgm: ASSET + 'media/abu-dhabi/bgm.mp3',
    // parts 多部件地标（阿提哈德塔三栋）按宽度横向排开；normalizeHeight 先把各部件高度拉齐
    landmarks: {
      grand_mosque:  { key: 'AUH_Mosque__AUH_Mosque',             tex: 'AUH_Mosque_BaseColor.png',      name: 'Sheikh Zayed Grand Mosque', zh: '谢赫扎耶德大清真寺', pos: [-15, 27],  h: 18, base: 1.0, r: 11, rot: 0, dur: 5.5 },
      capital_gate:  { key: 'AUH_CapitalGate__AUH_CapitalGate',   tex: 'AUH_CapitalGate_BaseColor.png', name: 'Capital Gate',              zh: '首都之门',         pos: [12, -63],  h: 18, base: 1.25, r: 7,  rot: 0, dur: 3 },
      ferrari_world: { key: 'AUH_Ferrari__AUH_Ferrari',           tex: 'AUH_Ferrari_BaseColor.png',     name: 'Ferrari World',             zh: '法拉利世界',       pos: [40, -62],  h: 5,  base: 1.0, r: 15, rot: 0, dur: 3 },
      etihad_towers: { parts: [['AUH_Tower__AUH_Tower01', 'AUH_Tower01_BaseColor.png'], ['AUH_Tower__AUH_Tower02', 'AUH_Tower02_BaseColor.png'], ['AUH_Tower__AUH_Tower03', 'AUH_Tower03_BaseColor.png']],
                       normalizeHeight: true,                                                          name: 'Etihad Towers',             zh: '阿提哈德塔',       pos: [56, -20],  h: 17, base: 1.25, r: 16, rot: Math.PI / 2, dur: 3.5 },
      emirates_palace: { key: 'AUH_Hotel__AUH_Hotel',             tex: 'AUH_Hotel_BaseColor.png',       name: 'Emirates Palace',           zh: '酋长皇宫酒店',     pos: [-54, 0],   h: 9,  base: 1.0, r: 9,  rot: 0, dur: 3 },
      abrahamic:     { key: 'AUH_Abrahamic__AUH_Abrahamic',       tex: 'AUH_Abrahamic_BaseColor.png',   name: 'Abrahamic Family House',    zh: '亚伯拉罕家族之家', pos: [44, 28],   h: 6,  base: 1.0, r: 13, rot: 0, dur: 3 },
    },
    script: `stage(1,'云层俯冲',0)
cam([0,340,170],[0,0,-14])
clouds(70)
wait(2.3)
cam([12,175,175],[0,0,-18])

stage(2,'沙洲升起',4)
island('mainland','rect',[-72,-80,72,46],12)     // 阿布扎比主岛
cam([30,128,160],[0,0,-18])
wait(0.8)
plaza([-38,-50,38,12],6)                          // 中心广场地块
plaza([-68,-78,24,-52],5)                         // 北区地块
plaza([44,-46,70,10],5)                           // 东区地块
rocks(16,[-70,30,70,45])
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
palmsLine([-34,41],[3,41],9)                      // 清真寺前庭棕榈
umbrellas([-66,42],[66,42],16)

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

  tokyo: {
    id: 'tokyo', name: 'TOKYO', nameLocal: '東京', nameZh: '东京', index: 3, total: 11,
    bgm: ASSET + 'media/tokyo/bgm.mp3',
    landmarks: {
      tokyo_tower:     { key: 'Tokyo_Tower__Tokyo_Tower',           tex: 'Tokyo_Tower.png',            name: 'Tokyo Tower',     zh: '东京塔',     pos: [-24, -22], h: 26, base: 1.25, r: 7,  rot: 0, dur: 5.5 },
      imperial_palace: { key: 'Tokyo_Kokyo__Tokyo_Kokyo',           tex: 'Tokyo_Kokyo.png',            name: 'Imperial Palace', zh: '皇居',       pos: [12, -30],  h: 17, base: 1.75, r: 9, rot: 0, dur: 3 },
      sensoji:         { key: 'Tokyo_Asakusa_2__Tokyo_Asakusa_2',   tex: 'Tokyo_Asakusa_2.png',        name: 'Sensoji Temple',  zh: '浅草寺',     pos: [-24, -44], h: 17, base: 1.25, r: 6,  rot: 0, dur: 3 },
      skytree:         { key: 'Tokyo_Tower2__Tokyo_Tower2',         tex: 'Tokyo_Tower2.png',           name: 'Tokyo Skytree',   zh: '东京晴空塔', pos: [58, -62],  h: 42, base: 1.25, r: 6,  rot: 0, dur: 5 },
      akihabara:       { key: 'Tokoyo_Akiba__Tokoyo_Akiba',         tex: 'Tokoyo_Akiba_BaseColor.png', name: 'Akihabara',       zh: '秋叶原',     pos: [56, 22],   h: 11, base: 1.25, r: 8,  rot: 0, dur: 3 },
    },
    script: `stage(1,'云层俯冲',0)
cam([0,340,170],[0,0,-14])
clouds(70)
wait(2.3)
cam([12,175,175],[0,0,-18])

stage(2,'绿岛升起',4)
island('mainland','rect',[-76,-82,76,48],14)     // 东京主岛
cam([30,128,160],[0,0,-18])
wait(0.8)
grass([-72,-78,72,44],12)
dunes(9,[-70,-82,70,-77],'grass')                // 远景青山

stage(3,'护城河与河道',8.5)
cam([-46,84,58],[10,0,-24])
water('moat','rect',[-6,-46,30,-14],5)           // 皇居护城河
isle('rect',[-1,-41,25,-19],3)
canal([30,-30],[78.5,-30],6)                     // 东侧河道
canal([-6,-22],[-41.5,50.5],7)                   // 西南河道
cam([34,64,40],[10,2,-26])

stage(4,'道路与铁轨',13.5)
cam([66,104,96],[0,0,-18])
road([-40,8],[-26.5,8])                          // 环城路
road([-26.5,8],[-15,8],'bridge')
road([-15,8],[44,8])
road([44,8],[44,-25])
road([44,-25],[44,-35],'bridge')
road([44,-35],[44,-56])
road([44,-56],[-40,-56])
road([-40,-56],[-40,8])
road([0,8],[0,40])                               // 参道
cam([24,96,92],[-8,0,-16])
redBridge([-33,33],-0.45,12)                     // 朱红拱桥
rail([[-68,40],[68,40],[68,-74],[-68,-74]])      // 新干线环线

stage(5,'东京塔与皇居',20)
cam([6,26,18],[-24,6,-22])
landmark('tokyo_tower')
cam([12,50,30],[-24,20,-24])
landmark('imperial_palace')
cam([42,38,12],[12,4,-30])

stage(6,'樱花与寺町',26.5)
cam([-72,62,34],[-30,4,-28])
landmark('sensoji')
torii([12,-4],0,1)                               // 皇居前鸟居
block([-70,-52,-48,2],8,'wa')                    // 西侧寺町
block([-70,12,-46,38],5,'wa')
cam([-36,84,70],[-14,4,-12])
trees(46,[-38,-54,42,6],'sakura')                // 环内樱花
trees(20,[2,10,40,38],'sakura')

stage(7,'晴空塔与秋叶原',33.5)
cam([92,62,-4],[58,14,-50])
landmark('skytree')
landmark('akihabara')
cam([84,58,74],[40,6,6])
block([-66,-72,40,-62],12,'mixed')
block([50,-50,66,-38],3,'glass')
block([48,-16,68,0],3,'mixed')
block([12,12,40,38],4,'shops')
trees(36,[-72,-80,72,44],'green')
sign('TOKYO',[57,34.5],-0.35,1.25,2.8)

stage(8,'城市苏醒',42)
cam([-36,112,156],[0,4,-16])
train([[-68,40],[68,40],[68,-74],[-68,-74]],6)
cars(16,[[[-40,8],[44,8],[44,-56],[-40,-56]],[[0,8],[0,40]]])
yachts(4,[[-92,-20,9],[92,10,10],[30,70,10],[-50,68,9]])
petals(160,[-40,-56,44,8])
gulls(10)
wait(0.6)
orbit([0,0,-16],155,112,7)
wait(3.0)
title()
end(50)`
  },

  paris: {
    id: 'paris', name: 'PARIS', nameLocal: 'La Ville Lumière', nameZh: '巴黎', index: 4, total: 11,
    bgm: ASSET + 'media/paris/bgm.mp3',
    landmarks: {
      eiffel: { key: 'eiffel_tower__eiffel_tower_001', tex: 'eiffel_tower.png', name: 'Eiffel Tower',    zh: '埃菲尔铁塔', pos: [-40, -24], h: 34, base: 1.25, r: 9, rot: 0, dur: 5.5 },
      louvre: { key: 'Paris_LFG__Paris_LFG',           tex: 'Paris_LFG.png',    name: 'Louvre',          zh: '卢浮宫',     pos: [28, -36],  h: 8,  base: 1.25, r: 9, rot: 0, dur: 3 },
      arc:    { parts: [['Paris_KXM__Paris_KXM', 'Paris_KXM.png'], ['Paris_KXM__KXM_EVA', 'KXM_EVA.png']],
                                                                          name: 'Arc de Triomphe', zh: '凯旋门',     pos: [30, 8],    h: 10, base: 1.25, r: 8, rot: 0, dur: 3 },
      sacre:  { key: 'Paris_SMY__Paris_SMY',           tex: 'Paris_SMY.png',    name: 'Sacré-Cœur',      zh: '圣心大教堂', pos: [-30, -67], h: 9.5, base: 6.25, r: 14, rot: 0, dur: 3 },
    },
    script: `stage(1,'云层俯冲',0)
cam([0,340,170],[0,0,-14])
clouds(70)
wait(2.3)
cam([12,175,175],[0,0,-18])

stage(2,'绿岛升起',4)
island('mainland','rect',[-76,-82,76,44],14)
cam([30,128,160],[0,0,-18])
wait(0.8)
grass([-72,-78,72,40],12)
dunes(8,[-70,-82,70,-79],'grass')

stage(3,'塞纳河',8.5)
cam([-60,92,72],[0,0,-14])
canal([[-78.5,-3.6],[-10,-12],[78.5,-28.6]],7,false)  // 塞纳河：一条连续河道横穿全岛
mount([-30,-67],14,5,'grass')                    // 蒙马特高地
cam([40,84,64],[0,0,-20])

stage(4,'街道与桥',12.5)
cam([66,104,96],[0,0,-18])
road([-60,-50],[60,-50])
road([60,-50],[60,-30])
road([60,-30],[60,-20],'bridge')
road([60,-20],[60,24])
road([60,24],[-60,24])
road([-60,24],[-60,-1])
road([-60,-1],[-60,-11],'bridge')
road([-60,-11],[-60,-50])
road([0,-50],[0,-19])
road([0,-19],[0,-9],'bridge')
road([0,-9],[0,24])

stage(5,'埃菲尔铁塔',19.5)
cam([-14,30,16],[-40,8,-24])
landmark('eiffel')
cam([-8,58,32],[-40,24,-24])
water('pond','circle',[-40,8],4)                 // 战神广场水池
fountain([-40,8],2.4,10)
trees(26,[-58,-48,-4,20],'green')

stage(6,'卢浮宫与凯旋门',25.5)
cam([62,50,6],[28,4,-36])
landmark('louvre')
bushes(28,[2,-48,58,-24])                        // 杜乐丽花园
landmark('arc')
cam([56,40,46],[30,4,8])
sign('PARIS',[34,33],-0.3,1.25,3)
trees(20,[4,-6,58,22],'green')

stage(7,'圣心堂与街区',32)
cam([-62,58,-26],[-30,10,-67])
landmark('sacre')
block([-72,-48,-62,20],5,'paris')
block([-56,-48,-6,-34],6,'paris')
block([62,-48,72,22],4,'paris')
block([-60,28,60,40],9,'paris')
cam([20,92,90],[0,0,-30])
block([-70,-78,70,-55],12,'paris')
block([-56,-6,-4,20],6,'paris')
block([4,-6,58,20],6,'paris')
block([4,-48,58,-26],4,'paris')
trees(24,[-72,-78,72,40],'green')

stage(8,'城市苏醒',41.5)
cam([-36,112,156],[0,4,-16])
cars(16,[[[-60,-50],[60,-50],[60,24],[-60,24]],[[0,-50],[0,24]]])
yachts(4,[[-92,-20,9],[92,10,10],[30,66,10],[-50,64,9]])
balloon([20,-60])
gulls(10)
wait(0.6)
orbit([0,0,-16],155,112,7)
wait(3.0)
title()
end(50)`
  },

  newyork: {
    id: 'newyork', name: 'NEW YORK', nameLocal: 'The Big Apple', nameZh: '纽约', index: 5, total: 11,
    bgm: ASSET + 'media/new-york/bgm.mp3',
    landmarks: {
      empire:   { key: 'NewYork_Empire__NewYork_Empire', tex: 'NewYork_Empire_D.png', name: 'Empire State Building', zh: '帝国大厦', pos: [0, -36], h: 34, base: 1.25, r: 7, rot: 0, dur: 5.5 },
      skyline:  { parts: [1, 2, 3].map(i => ['Manhattan__Manhattan_0' + i, 'NewYork_Manhattan_0' + i + '_D.png']),
                                                                                    name: 'Manhattan Skyline',     zh: '曼哈顿天际线', pos: [0, -60], h: 30, base: 1.25, r: 14, rot: Math.PI / 2, dur: 3.5 },
      times:    { parts: [1, 2, 3, 4, 5].map(i => ['TimeSquare__TimeSquare_0' + i, 'NewYork_TimesSquare_0' + i + '_D.png']),
                                                                                    name: 'Times Square',          zh: '时代广场', pos: [0, 6],   h: 12, base: 1.25, r: 17, rot: Math.PI / 2, dur: 3 },
      bbridge:  { key: 'NewYork_BrooklynBridge__NewYork_BrooklynBridge', tex: 'NewYork_BrooklynBridge_D.png', name: 'Brooklyn Bridge', zh: '布鲁克林大桥', pos: [29, 8], h: 12, base: 1.0, r: 8, rot: 0, dur: 3 },
      liberty:  { key: 'L007_NYSOL_1__L007_NYSOL_1', tex: 'L007_NYSOL_AlbedoTransparency.png', name: 'Statue of Liberty', zh: '自由女神像', pos: [-6, 58], h: 18, base: 1.0, r: 5, rot: 0, dur: 4 },
    },
    script: `stage(1,'云层俯冲',0)
cam([0,340,170],[0,0,-14])
clouds(70)
wait(2.3)
cam([12,175,175],[0,0,-18])

stage(2,'三岛升起',4)
island('jersey','rect',[-80,-80,-36,44],10)       // 新泽西
island('manhattan','rect',[-22,-78,22,32],6)      // 曼哈顿
island('brooklyn','rect',[36,-80,80,44],10)       // 布鲁克林
cam([30,128,160],[0,0,-18])
island('liberty','circle',[-6,58],8)              // 自由岛
grass([-76,-76,-40,40],8)
grass([40,-76,76,40],8)
plaza([-19,-75,19,29],4)

stage(3,'曼哈顿街道',9.5)
cam([-50,92,80],[0,0,-20])
road([-12,27],[-12,-73])                          // 大道
road([12,27],[12,-73])
road([-60,-20],[-36.5,-20])
road([-36.5,-20],[-21.5,-20],'bridge')
road([-21.5,-20],[21.5,-20])
road([21.5,-20],[36.5,-20],'bridge')
road([36.5,-20],[60,-20])
road([-60,-70],[-60,30])
road([60,-70],[60,30])
cam([46,80,70],[0,0,-24])

stage(4,'帝国大厦',15.5)
cam([22,26,-6],[0,10,-36])
landmark('empire')
cam([26,58,6],[0,26,-36])

stage(5,'天际线与时代广场',21.5)
cam([-46,72,-30],[0,12,-60])
landmark('skyline')
block([-19,-75,19,29],8,'glass')
landmark('times')
cam([34,40,40],[0,6,6])
trees(20,[-76,-76,-40,40],'green')
trees(20,[40,-76,76,40],'green')

stage(6,'布鲁克林大桥',29)
cam([50,22,34],[29,4,8])
landmark('bbridge')
block([-76,-76,-62,40],6,'mixed')
block([-58,-76,-40,40],6,'glass')
block([62,-76,76,40],6,'mixed')
block([40,-12,58,40],5,'shops')

stage(7,'自由女神',35.5)
cam([20,22,84],[-6,10,58])
landmark('liberty')
cam([30,40,100],[-6,14,52])
sign('NEW YORK',[56,34],-0.3,1.25,2.4)

stage(8,'城市苏醒',41.5)
cam([-36,112,156],[0,4,-16])
cars(16,[[[-12,27],[-12,-73]],[[12,27],[12,-73]],[[-60,-20],[60,-20]]])
yachts(5,[[-6,58,15],[60,64,10],[-62,64,10],[29,-40,4],[-29,-50,4]])
gulls(12)
balloon([66,-60])
wait(0.6)
orbit([0,0,-14],160,116,7)
wait(3.0)
title()
end(50)`
  },

  lasvegas: {
    id: 'lasvegas', name: 'LAS VEGAS', nameLocal: 'Entertainment Capital', nameZh: '拉斯维加斯', index: 6, total: 11,
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
  },

  rio: {
    id: 'rio', name: 'RIO DE JANEIRO', nameLocal: 'Cidade Maravilhosa', nameZh: '里约热内卢', index: 7, total: 11,
    bgm: ASSET + 'media/rio/bgm.mp3',
    landmarks: {
      jesus:    { key: 'Rio_Jesus__Rio_Jesus',       tex: 'Rio_Jesus.png',              name: 'Christ the Redeemer',    zh: '基督像',       pos: [-52, -60], h: 14, base: 17.25, r: 6,  rot: 0, dur: 5.5 },
      maracana: { key: 'Rio_Maracana__Rio_Maracana', tex: 'Rio_Maracana_BaseColor.png', name: 'Maracanã Stadium',       zh: '马拉卡纳球场', pos: [34, -56],  h: 6,   base: 1.25, r: 13, rot: 0, dur: 3 },
      church:   { key: 'Rio_Church__Rio_Church',     tex: 'Rio_Church.png',             name: 'Metropolitan Cathedral', zh: '大都会主教座堂', pos: [-10, -50], h: 14, base: 1.25, r: 8,  rot: 0, dur: 3 },
      museum:   { key: 'Rio_Museum__Rio_Museum',     tex: 'Rio_Museum.png',             name: 'Museum of Tomorrow',     zh: '明日博物馆',   pos: [38, -12],  h: 6,   base: 1.25, r: 9,  rot: Math.PI / 2, dur: 3 },
      steps:    { key: 'Rio_Step__Rio_Step',         tex: 'Rio_Step.png',               name: 'Selarón Steps',          zh: '塞勒隆阶梯',   pos: [-22, -14], h: 5,   base: 1.25, r: 7,  rot: 0, dur: 2.5 },
    },
    script: `stage(1,'云层俯冲',0)
cam([0,340,170],[0,0,-14])
clouds(70)
wait(2.3)
cam([12,175,175],[0,0,-18])

stage(2,'海湾升起',4)
island('mainland','rect',[-78,-84,64,18],12)
cam([30,128,160],[0,0,-14])
island('beach','crescent',[-8,4],38,8,72)         // 科帕卡巴纳海滩
island('sugarloaf','circle',[52,40],8)
grass([-74,-80,60,14],10)

stage(3,'山峦',8.5)
cam([-70,80,40],[-30,8,-40])
mount([-52,-60],15,16,'grass')                    // 科尔科瓦多山
mount([52,40],6.5,15,'dome')                      // 面包山
dunes(8,[-74,-82,60,-78],'grass')
cam([60,60,90],[20,6,10])

stage(4,'海滨大道',12.5)
cam([20,96,110],[0,0,-14])
road([-70,8],[56,8])
road([-30,-30],[56,-30])
road([10,-76],[10,8])
crescentPalms(28)
palmsLine([-68,11.5],[54,11.5],16)

stage(5,'基督像',17.5)
cam([-28,32,-34],[-52,22,-60])
landmark('jesus')
cam([-22,52,-20],[-52,28,-60])

stage(6,'马拉卡纳与大教堂',23.5)
cam([66,40,-30],[34,4,-56])
landmark('maracana')
landmark('church')
cam([14,40,-20],[-10,8,-50])
block([-74,-40,-30,0],10,'shops')                 // 山坡上的彩色小屋
block([-28,-26,6,4],5,'mixed')

stage(7,'明日博物馆与阶梯',31)
cam([68,42,22],[38,3,-12])
landmark('museum')
landmark('steps')
cam([4,46,28],[-22,3,-14])
block([16,-78,58,-36],4,'mixed')
trees(40,[-74,-80,60,14],'green')
sign('RIO',[-60,34],0.3,0,3.5)

stage(8,'城市苏醒',41.5)
cam([-36,112,156],[0,4,-16])
cars(14,[[[-70,8],[56,8]],[[-30,-30],[56,-30]],[[10,-76],[10,8]]])
yachts(5,[[-8,30,6],[-72,42,10],[74,4,8],[22,64,10],[-40,64,8]])
gulls(14)
heli([-52,-60],16,40)
wait(0.6)
orbit([-6,0,-18],160,116,7)
wait(3.0)
title()
end(50)`
  },

  cairo: {
    id: 'cairo', name: 'CAIRO', nameLocal: 'القاهرة', nameZh: '开罗', index: 8, total: 11,
    bgm: ASSET + 'media/cairo/bgm.mp3',
    landmarks: {
      pyramids: { parts: [['Cairo_Pyramid__Cairo_Pyramid_2', 'Cairo_Pyramid_2.png'], ['Cairo_Pyramid__Cairo_Pyramid_3', 'Cairo_Pyramid.png']],
                                                                                       name: 'Pyramids of Giza',       zh: '吉萨金字塔',   pos: [-44, -34], h: 16, base: 1.0,  r: 19, rot: 0, dur: 5.5 },
      ctower:   { key: 'Cairo_Tower__Cairo_Tower',       tex: 'Cairo_Tower_BaseColor.png',    name: 'Cairo Tower',            zh: '开罗塔',       pos: [0, -6],    h: 22, base: 1.75, r: 4,  rot: 0, dur: 3.5 },
      mosque:   { key: 'Cairo_Qingzhen__Cairo_Qingzhen', tex: 'Cairo_Qingzhen_BaseColor.png', name: 'Mosque of Muhammad Ali', zh: '穆罕默德·阿里清真寺', pos: [48, -56], h: 14, base: 1.0, r: 8, rot: 0, dur: 3 },
      iconic:   { key: 'Cairo_Tower2__Cairo_Tower2',     tex: 'Cairo_Tower2_BaseColor.png',   name: 'Iconic Tower',           zh: '标志塔',       pos: [50, 12],   h: 24, base: 1.0,  r: 10, rot: 0, dur: 3.5 },
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
dunes(10,[-70,-82,70,-77])
rocks(12,[-72,-80,72,44])

stage(3,'尼罗河',8.5)
cam([-50,90,70],[0,0,-14])
grass([-24,-78,30,42],6)                          // 尼罗河两岸绿洲
water('nile','circle',[0,-6],13)
canal([[10,-84.5],[1,-14],[0,-6],[-8.4,48.5]],9,false)  // 尼罗河穿岛而过
isle('circle',[0,-6],7)                           // 杰济拉岛
cam([40,76,60],[0,0,-14])

stage(4,'沿河大道',13)
cam([62,96,90],[0,0,-18])
road([-20,-74],[-20,40])
road([26,-74],[26,40])
road([-20,24],[26,24],'bridge')
road([26,-28],[70,-28])
road([-20,-60],[-66,-60])
palmsLine([-16.4,-70],[-16.4,20],8)
palmsLine([22.4,-70],[22.4,20],8)

stage(5,'金字塔',18.5)
cam([-18,26,4],[-44,8,-34])
landmark('pyramids')
cam([-10,46,20],[-44,10,-34])
pyramid([-64,-51],10)                             // 另两座金字塔
pyramid([-49,-53],7)
sign('CAIRO',[-44,-4],0,1,3)

stage(6,'开罗塔与清真寺',24.5)
cam([22,28,14],[0,12,-6])
landmark('ctower')
landmark('mosque')
cam([74,40,-30],[48,6,-56])
trees(28,[-24,-78,30,42],'green')

stage(7,'新首都',31)
cam([78,36,40],[50,12,12])
landmark('iconic')
block([32,-76,72,-36],6,'adobe')
block([32,-22,72,42],8,'adobe')
block([-70,-16,-26,42],8,'adobe')
block([-70,-78,-26,-64],4,'adobe')
cam([10,90,90],[0,0,-14])

stage(8,'城市苏醒',41.5)
cam([-36,112,156],[0,4,-16])
cars(14,[[[-20,-74],[-20,40]],[[26,-74],[26,40]],[[-20,24],[26,24]],[[26,-28],[70,-28]]])
yachts(4,[[-92,0,10],[92,-20,10],[0,68,10],[-50,64,8]])
balloon([-60,-16])
gulls(10)
wait(0.6)
orbit([0,0,-16],155,112,7)
wait(3.0)
title()
end(50)`
  },

  singapore: {
    id: 'singapore', name: 'SINGAPORE', nameLocal: '新加坡', nameZh: '新加坡', index: 9, total: 11,
    bgm: ASSET + 'media/singapore/bgm.mp3',
    landmarks: {
      mbs:     { key: 'Singapore_Shoppes__Singapore_Shoppes',   tex: 'Singapore_Shoppes_D.png',   name: 'Marina Bay Sands',   zh: '滨海湾金沙', pos: [32, -27], h: 18, base: 1.25, r: 13,  rot: Math.PI / 2, dur: 5.5 },
      merlion: { key: 'Singapore_Merlion__Singapore_Merlion',   tex: 'Singapore_Merlion_D.png',   name: 'Merlion',            zh: '鱼尾狮',     pos: [-20, -2], h: 8,  base: 1.25, r: 4,  rot: 0, dur: 2.5 },
      artsci:  { key: 'Singapore_ArtScience__Singapore_ArtScience', tex: 'Singapore_ArtScience_D.png', name: 'ArtScience Museum', zh: '艺术科学博物馆', pos: [14, -1], h: 7, base: 1.25, r: 5, rot: 0, dur: 2.5 },
      garden:  { key: 'Singapore_Garden__Singapore_Garden',     tex: 'Singapore_Garden_D.png',    name: 'Gardens by the Bay', zh: '滨海湾花园', pos: [-58, -30], h: 12, base: 1.25, r: 12, rot: 0, dur: 3 },
      flyer:   { key: 'Singapore_Flyer__Singapore_Flyer_Ani',   tex: 'Singapore_Flyer_D.png',     name: 'Singapore Flyer',    zh: '新加坡摩天观景轮', pos: [52, -66], h: 18, base: 1.25, r: 17, rot: 0, dur: 3.5 },
    },
    script: `stage(1,'云层俯冲',0)
cam([0,340,170],[0,0,-14])
clouds(70)
wait(2.3)
cam([12,175,175],[0,0,-18])

stage(2,'绿岛升起',4)
island('mainland','rect',[-76,-82,76,46],14)
cam([30,128,160],[0,0,-18])
wait(0.8)
grass([-72,-78,-46,42],10)
grass([46,-78,72,42],10)
grass([-44,-78,44,-60],6)
grass([-44,18,44,42],6)

stage(3,'滨海湾',8.5)
cam([-50,90,70],[0,0,-18])
plaza([-44,-58,44,14],6)                          // 滨海湾广场
water('bay','rect',[-28,-46,24,-8],10)
canal([-6,-8],[-6,48.5],7)                        // 新加坡河
cam([40,76,60],[0,0,-22])

stage(4,'环湾道路',12.5)
cam([66,104,96],[0,0,-18])
road([-40,10],[-12,10])
road([-12,10],[0,10],'bridge')
road([0,10],[40,10])
road([40,10],[40,-54])
road([40,-54],[-40,-54])
road([-40,-54],[-40,10])
palmsLine([-36,-50],[36,-50],12)
palmsLine([-36,6],[-14,6],4)
palmsLine([2,6],[36,6],6)

stage(5,'滨海湾金沙',18)
cam([62,26,4],[32,8,-27])
landmark('mbs')
cam([66,52,18],[30,14,-28])

stage(6,'鱼尾狮与艺术科学馆',24)
cam([-30,16,22],[-20,4,-2])
landmark('merlion')
landmark('artsci')
cam([26,22,28],[14,3,-1])
block([-36,-78,30,-61],10,'glass')                // 中央商务区
trees(24,[-72,-78,72,42],'green')

stage(7,'花园与摩天轮',30.5)
cam([-90,40,0],[-58,6,-30])
landmark('garden')
landmark('flyer')
cam([84,40,-30],[52,10,-66])
block([48,-48,72,40],6,'mixed')
block([-72,18,72,40],8,'shops')
block([-72,-14,-46,14],4,'mixed')
sign('SINGAPORE',[-34,32],0.2,1.25,2.2)

stage(8,'城市苏醒',41.5)
cam([-36,112,156],[0,4,-16])
cars(16,[[[-40,10],[40,10],[40,-54],[-40,-54]]])
yachts(5,[[-92,-20,9],[92,10,10],[30,68,10],[-50,66,9],[-6,62,6]])
gulls(12)
balloon([-60,10])
wait(0.6)
orbit([0,0,-16],155,112,7)
wait(3.0)
title()
end(50)`
  },

  jakarta: {
    id: 'jakarta', name: 'JAKARTA', nameLocal: 'Kota Jakarta', nameZh: '雅加达', index: 10, total: 11,
    bgm: ASSET + 'media/jakarta/bgm.mp3',
    landmarks: {
      monas:     { key: 'M_jzdb_Monument__M_jzdb_Monument', tex: 'M_jzdb_Monument_BaseColor.png', name: 'National Monument', zh: '民族独立纪念碑', pos: [0, -22],  h: 30, base: 1.25, r: 14, rot: 0, dur: 5.5 },
      istiqlal:  { key: 'M_jzdb_Mosque__M_jzdb_Mosque',     tex: 'M_jzdb_Mosque_BaseColor.png',   name: 'Istiqlal Mosque',   zh: '伊斯蒂克拉尔清真寺', pos: [-52, -26], h: 14, base: 1.25, r: 13, rot: 0, dur: 3.5 },
      cathedral: { key: 'M_JKT_Cathedral__M_JKT_Cathedral', tex: 'M_JKT_Cathedral_BaseColor.png', name: 'Jakarta Cathedral', zh: '雅加达主教座堂', pos: [52, -30],  h: 16, base: 1.25, r: 11, rot: 0, dur: 3.5 },
    },
    script: `stage(1,'云层俯冲',0)
cam([0,340,170],[0,0,-14])
clouds(70)
wait(2.3)
cam([12,175,175],[0,0,-18])

stage(2,'绿岛与青山',4)
island('mainland','rect',[-76,-82,76,46],14)
cam([30,128,160],[0,0,-18])
wait(0.8)
grass([-72,-78,72,42],12)
mount([-56,-66],12,10,'grass')
mount([-24,-70],9,7,'grass')
mount([50,-66],12,12,'grass')

stage(3,'默迪卡广场',9)
cam([-50,90,70],[0,0,-18])
road([-32,8],[32,8])
road([32,8],[32,-52])
road([32,-52],[-32,-52])
road([-32,-52],[-32,8])
road([0,8],[0,40])
road([-70,0],[-32,0])
road([32,0],[70,0])
water('poolW','circle',[-20,-2],4)
water('poolE','circle',[20,-2],4)
fountain([-20,-2],2.2,8)
fountain([20,-2],2.2,8)
bushes(36,[-30,-50,30,6])                         // 广场树篱

stage(4,'民族独立纪念碑',17.5)
cam([20,22,24],[0,12,-22])
landmark('monas')
cam([26,58,36],[0,28,-22])

stage(5,'伊斯蒂克拉尔清真寺',23.5)
cam([-88,36,10],[-52,6,-26])
landmark('istiqlal')
cam([-80,52,26],[-52,8,-26])
block([-72,6,-36,40],6,'mixed')

stage(6,'雅加达主教座堂',29)
cam([84,30,0],[52,8,-30])
landmark('cathedral')
cam([84,50,20],[52,10,-30])
block([36,6,72,40],6,'mixed')
block([36,-56,72,-46],3,'glass')

stage(7,'城市长高',34.5)
cam([10,90,96],[0,0,-14])
sign('JAKARTA',[-14,30],0,1.25,2.8)
block([-28,14,28,40],6,'shops')
block([-72,-52,-38,-42],3,'glass')
trees(30,[-72,-78,72,42],'green')
palmsLine([-3.6,12],[-3.6,38],5)
palmsLine([3.6,12],[3.6,38],5)

stage(8,'城市苏醒',41.5)
cam([-36,112,156],[0,4,-16])
cars(16,[[[-32,8],[32,8],[32,-52],[-32,-52]],[[0,8],[0,40]],[[-70,0],[-32,0]],[[32,0],[70,0]]])
yachts(4,[[-92,-20,9],[92,10,10],[30,68,10],[-50,66,9]])
gulls(12)
balloon([40,-40])
wait(0.6)
orbit([0,0,-16],155,112,7)
wait(3.0)
title()
end(50)`
  },

  sydney: {
    id: 'sydney', name: 'SYDNEY', nameLocal: 'Harbour City', nameZh: '悉尼', index: 11, total: 11,
    bgm: ASSET + 'media/sydney/bgm.mp3',
    landmarks: {
      opera:  { key: 'Sydney_Opera__Sydney_Opera',       tex: 'Sydney_Opera_D.png',    name: 'Sydney Opera House',      zh: '悉尼歌剧院',   pos: [-22, -20], h: 8,  base: 1.0,  r: 11, rot: 0, dur: 5.5 },
      bridge: { key: 'Sydney_Bridge__Sydney_Bridge',     tex: 'Sydney_Bridge_d.png',   name: 'Sydney Harbour Bridge',   zh: '悉尼海港大桥', pos: [34, -24],  h: 12, base: 1.0,  r: 5,  rot: Math.PI / 2, dur: 3.5 },
      ship:   { key: 'Sydney_Ship__Sydney_Ship',         tex: 'Sydney_Ship_D.png',     name: 'Harbour Cruise',          zh: '港湾邮轮',     pos: [-56, -24], h: 6,  base: 0.1,  r: 4,  rot: 0, dur: 2.5 },
      stower: { key: 'Sydney_Tower__Sydney_Tower',       tex: 'Sydney_Tower_D.png',    name: 'Sydney Tower',            zh: '悉尼塔',       pos: [14, 12],   h: 30, base: 1.25, r: 9,  rot: 0, dur: 4 },
      qvb:    { key: 'Sydney_Victoria__Sydney_Victoria', tex: 'Sydney_Victoria_D.png', name: 'Queen Victoria Building', zh: '维多利亚女王大厦', pos: [50, 12], h: 8, base: 1.25, r: 8, rot: 0, dur: 3 },
    },
    script: `stage(1,'云层俯冲',0)
cam([0,340,170],[0,0,-14])
clouds(70)
wait(2.3)
cam([12,175,175],[0,0,-18])

stage(2,'两岸升起',4)
island('north','rect',[-78,-82,78,-36],10)        // 北岸
island('city','rect',[-78,-12,78,46],10)          // 市中心
cam([30,128,160],[0,0,-18])
island('point','capsule',[-30,-19,-14,-19],9)     // 便利朗角
grass([-74,-78,74,-40],8)
grass([-74,-8,-10,32],6)
plaza([-6,-8,74,32],5)

stage(3,'港湾街道',9.5)
cam([-50,92,80],[0,0,-18])
road([-70,-2],[70,-2])                            // 环形码头
road([-70,26],[70,26])
road([0,-2],[0,26])
road([34,-2],[34,26])
road([-70,-50],[70,-50])
road([34,-50],[34,-38])
umbrellas([-66,39],[66,39],16)                    // 海滩
palmsLine([-66,30],[66,30],18)

stage(4,'悉尼歌剧院',15)
cam([-2,20,4],[-22,4,-21])
landmark('opera')
cam([4,40,14],[-22,6,-21])

stage(5,'海港大桥',21)
cam([66,26,-10],[34,8,-24])
landmark('bridge')
cam([70,44,4],[34,10,-24])
landmark('ship')

stage(6,'悉尼塔与女王大厦',27.5)
cam([40,34,48],[14,14,12])
landmark('stower')
landmark('qvb')
cam([74,40,44],[50,6,12])
block([2,0,30,24],5,'glass')
block([38,0,72,24],5,'glass')

stage(7,'北岸与城区',34.5)
cam([10,92,96],[0,0,-14])
sign('SYDNEY',[-40,-60],0.15,1.25,2.8)
block([-72,0,-12,24],8,'shops')
block([-72,-76,72,-54],12,'shops')
trees(36,[-74,-78,74,-40],'green')
trees(14,[-74,-8,-10,32],'green')

stage(8,'城市苏醒',41.5)
cam([-36,112,156],[0,4,-16])
cars(16,[[[-70,-2],[70,-2]],[[-70,26],[70,26]],[[0,-2],[0,26]],[[-70,-50],[70,-50]]])
yachts(6,[[4,-24,5],[60,-24,5],[-92,-24,8],[92,-24,8],[0,64,10],[-60,62,8]])
gulls(14)
heli([-22,-21],16,22)
wait(0.6)
orbit([0,0,-16],155,112,7)
wait(3.0)
title()
end(50)`
  }
};

const QS = new URLSearchParams(location.search);
const EXPLORE = true;
const CITY_ID = QS.get('city') || 'dubai';
const CITY = CITIES[CITY_ID] || CITIES.dubai;
document.title = 'Tourist Agent · 十一城自由探索';

/* =====================================================================
   2. 工具：缓动、PRNG、矩阵
   ===================================================================== */
const clamp01 = x => x < 0 ? 0 : x > 1 ? 1 : x;
// 建设节奏：施工脚本按 BUILD_TEMPO 倍速推进（镜头跟着施工走）；海浪、车船、飞鸟、树摆等环境动态用 amb(t) 换回真实时间，保持自然速度
const BUILD_TEMPO = 1.5;
let TEMPO = 1;
const amb = t => t / TEMPO;
const lerp = (a, b, u) => a + (b - a) * u;
const smooth = u => (u = clamp01(u), u * u * (3 - 2 * u));
const easeOutCubic = u => 1 - Math.pow(1 - clamp01(u), 3);
const easeOutBack = (u, s = 1.6) => { u = clamp01(u); const c = s + 1; return 1 + c * Math.pow(u - 1, 3) + s * Math.pow(u - 1, 2); };
const prog = (t, s, d) => d <= 0 ? (t >= s ? 1 : 0) : clamp01((t - s) / d);

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function hashSeed(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; }
  return h >>> 0;
}

// 楼宇「落下 + 弹性落位」
function dropY(p, H = 28) {
  if (p <= 0) return H;
  if (p >= 1) return 0;
  if (p < 0.6) { const u = p / 0.6; return H * (1 - u * u); }
  const u = (p - 0.6) / 0.4; return Math.sin(u * Math.PI) * 0.9 * (1 - u);
}
function squash(p) {
  if (p < 0.6 || p >= 1) return 1;
  const u = (p - 0.6) / 0.4; return 1 - 0.1 * Math.sin(u * Math.PI * 2) * (1 - u);
}

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const _m = new THREE.Matrix4(), _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _e = new THREE.Euler();
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
function mat(x, y, z, ry, sx, sy, sz, rx = 0, rz = 0) {
  _p.set(x, y, z); _e.set(rx, ry, rz); _q.setFromEuler(_e); _s.set(sx, sy, sz);
  return _m.compose(_p, _q, _s);
}

/* =====================================================================
   3. 渲染层：渲染器、天空、海、灯光、材质
   ===================================================================== */
const stageEl = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: false });
const MAX_PIXEL_RATIO = 1.5, SHADOW_MAP_SIZE = 2048;
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, MAX_PIXEL_RATIO));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.localClippingEnabled = true;
stageEl.prepend(renderer.domElement);

const scene = new THREE.Scene();
const HORIZON = new THREE.Color('#D9F4FB');
scene.fog = new THREE.Fog(HORIZON, 280, 1150);

const camera = new THREE.PerspectiveCamera(35, 1, 0.5, 6000);
scene.add(camera);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.dampingFactor = 0.08;
controls.maxPolarAngle = Math.PI * 0.48;

// 天空：竖直渐变球
const sky = new THREE.Mesh(new THREE.SphereGeometry(3000, 32, 16), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { top: { value: new THREE.Color('#6FD0F2') }, mid: { value: new THREE.Color('#9FE3F7') }, hor: { value: HORIZON } },
  vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform vec3 top, mid, hor; varying vec3 vD;
    void main(){ float h = vD.y; vec3 c = h > 0.18 ? mix(mid, top, smoothstep(.18,.8,h)) : mix(hor, mid, smoothstep(-.02,.18,h));
      gl_FragColor = vec4(c,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`
}));
scene.add(sky);

// 海面：程序化着色，波光只依赖 uT（= 时间 t）
const seaMat = new THREE.ShaderMaterial({
  uniforms: {
    uT: { value: 0 }, uDeep: { value: new THREE.Color('#1677D2') }, uMid: { value: new THREE.Color('#2A97E4') },
    uFog: { value: HORIZON }, uFogNear: { value: 280 }, uFogFar: { value: 1150 }
  },
  vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
  fragmentShader: `uniform float uT, uFogNear, uFogFar; uniform vec3 uDeep, uMid, uFog; varying vec3 vW;
    void main(){
      vec2 p = vW.xz;
      float a = sin(p.x*.09 + uT*.6 + sin(p.y*.06)*2.2);
      float b = sin(p.y*.11 - uT*.5 + sin(p.x*.05)*2.0);
      vec3 col = mix(uDeep, uMid, .5 + .5*a*b);
      float d = length(cameraPosition - vW);
      // 卡通浪线：扭曲的正弦条纹 + 断续遮罩，远处淡出防闪
      vec2 q = p * 1.8;
      float wv = sin(q.x*.2 + 1.7*sin(q.y*.15 + uT*.55) + uT*.35);
      float line = smoothstep(.965, .992, wv);
      float mask = smoothstep(.2, .8, sin(q.y*.085 - q.x*.031 + uT*.25) * sin(q.x*.047 + q.y*.023 - uT*.2));
      col = mix(col, vec3(.88,.97,1.), line * mask * .6 * (1. - smoothstep(110., 380., d)));
      col = mix(col, uFog, smoothstep(uFogNear, uFogFar, d));
      gl_FragColor = vec4(col, 1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`
});
const sea = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000).rotateX(-Math.PI / 2), seaMat);
// 潟湖/运河：同一着色器、更浅的水色，共用时间 uT
const lagoonMat = new THREE.ShaderMaterial({
  side: THREE.DoubleSide,   // 河道入海口的竖直水幕两面可见
  vertexShader: seaMat.vertexShader, fragmentShader: seaMat.fragmentShader,
  uniforms: { ...seaMat.uniforms, uDeep: { value: new THREE.Color('#1E9BE0') }, uMid: { value: new THREE.Color('#47C9EC') } },
});
scene.add(sea);

// 灯光：暖白太阳 + 天空/沙地半球光
const hemi = new THREE.HemisphereLight('#D6F4FF', '#F2D399', 1.25);
scene.add(hemi);
const sun = new THREE.DirectionalLight('#FFF3DE', 2.7);
sun.castShadow = true;
sun.shadow.mapSize.set(SHADOW_MAP_SIZE, SHADOW_MAP_SIZE);
Object.assign(sun.shadow.camera, { left: -100, right: 100, top: 100, bottom: -100, near: 1, far: 500 });
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04; sun.shadow.radius = 3;
sun.target.position.set(0, 0, -10);
scene.add(sun, sun.target);
function setSun(azDeg, elDeg = 55) {
  const az = azDeg * Math.PI / 180, el = elDeg * Math.PI / 180;
  sun.position.set(Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el)).multiplyScalar(220).add(sun.target.position);
  sun.shadow.camera.updateProjectionMatrix();
}
setSun(40);

const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.78, metalness: 0, ...o });
const M = {
  sand: std('#F4C873'), sandSide: std('#D79E52'), dune: std('#EDB560'),
  grass: std('#5DBB3F'), grassSide: std('#468F2F'),
  concrete: std('#D3D7DD'), concreteSide: std('#A9B0BA'), rim: std('#EFE6D2'), rimWall: std('#EFE6D2', { side: THREE.DoubleSide }),
  wood: std('#B9895A'), rock: std('#C98B4E', { flatShading: true }), bush: std('#ffffff', { roughness: 0.85 }),
  gravel: std('#A7A39C'), sleeper: std('#7A5A40'), railSteel: std('#5B5F66', { roughness: 0.4 }),
  vermilion: std('#D7362B', { roughness: 0.6 }), ink: std('#2B2B30'), treeTrunk: std('#7A5236'), granite: std('#A7A79A', { flatShading: true }), sandstone: std('#E2B871', { flatShading: true }),
  gable: std('#ffffff', { flatShading: true, roughness: 0.7 }),
  petal: new THREE.MeshBasicMaterial({ color: '#F9B9D0', side: THREE.DoubleSide }),
  asphalt: std('#3B4049', { roughness: 0.9 }), sidewalk: std('#E8E1D3'), dash: std('#F7F7F7'),
  lake: std('#33C3DA', { roughness: 0.25 }), stone: std('#EEE7D8'),
  pad: std('#56606E'), antenna: std('#F4F4F4'), roof: std('#ffffff'),
  trunk: std('#ffffff', { vertexColors: true }), leaves: std('#ffffff', { side: THREE.DoubleSide, roughness: 0.7 }),
  canopy: std('#ffffff', { roughness: 0.6 }), pole: std('#F4F4F4'),
  carBody: std('#ffffff', { roughness: 0.35 }), carTop: std('#2B3A55', { roughness: 0.2 }),
  cloud: std('#ffffff', { roughness: 1, emissive: '#ffffff', emissiveIntensity: 0.28 }),
  white: std('#F7F9FC', { roughness: 0.5 }), navy: std('#2D4A7A', { roughness: 0.3 }), red: std('#E84A4A'),
  water: new THREE.MeshBasicMaterial({ color: '#E3F8FF', transparent: true, opacity: 0.75, depthWrite: false }),
  scaffold: std('#F59B42'),
};

// 楼宇窗带：按实例缩放后的本地坐标在着色器里画窗格，楼多高窗就多少层
const towerMat = std('#ffffff', { roughness: 0.55 });
towerMat.onBeforeCompile = sh => {
  sh.vertexShader = sh.vertexShader
    .replace('#include <common>', '#include <common>\nvarying vec3 vOP; varying vec3 vON; varying vec3 vSC;')
    .replace('#include <begin_vertex>', `#include <begin_vertex>
      vOP = position; vON = normal;
      #ifdef USE_INSTANCING
        vSC = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
      #else
        vSC = vec3(1.);
      #endif`);
  sh.fragmentShader = sh.fragmentShader
    .replace('#include <common>', '#include <common>\nvarying vec3 vOP; varying vec3 vON; varying vec3 vSC; float gWin = 0.;')
    .replace('#include <color_fragment>', `#include <color_fragment>
      {
        vec3 lp = (vOP + .5) * vSC;
        float side = 1. - step(.6, abs(vON.y));
        float u = abs(vON.x) > abs(vON.z) ? lp.z : lp.x;
        float fy = fract(lp.y / 1.15), fx = fract(u / 1.3);
        float w = step(.22, fy) * step(fy, .84) * step(.14, fx) * step(fx, .86) * side * step(.9, lp.y);
        gWin = w;
        vec3 glass = diffuseColor.rgb * (.8 + .4 * fy);
        vec3 frame = mix(vec3(.95,.97,1.), diffuseColor.rgb, .22);
        diffuseColor.rgb = mix(frame, glass, w);
      }`)
    .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, .22, gWin);')
    .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * .14 * gWin;');
};

/* ---------- 共享几何 ---------- */
const G = {
  rbox: new RoundedBoxGeometry(1, 1, 1, 2, 0.04),
  box: new THREE.BoxGeometry(1, 1, 1),
  pad: new THREE.CylinderGeometry(1, 1, 0.16, 20),
  antenna: new THREE.CylinderGeometry(0.06, 0.12, 3.2, 6).translate(0, 1.6, 0),
  canopy: new THREE.ConeGeometry(1.3, 0.55, 10).translate(0, 2.1, 0),
  pole: new THREE.CylinderGeometry(0.05, 0.05, 2.1, 5).translate(0, 1.05, 0),
  carBody: new RoundedBoxGeometry(0.95, 0.55, 2.0, 2, 0.18),
  carTop: new RoundedBoxGeometry(0.8, 0.42, 1.05, 2, 0.14),
  cloud: new THREE.IcosahedronGeometry(1, 2),
  dune: new THREE.SphereGeometry(1, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2),
  bush: new THREE.IcosahedronGeometry(1, 1),
  rock: new THREE.DodecahedronGeometry(1, 0),
  treeTrunk: new THREE.CylinderGeometry(0.2, 0.3, 1.8, 6).translate(0, 0.9, 0),
  // 樱花/阔叶树冠：几团球拼成的云朵状
  treeCrown: mergeGeometries([[0, 2.6, 0, 1.35], [0.9, 2.25, 0.35, 0.95], [-0.8, 2.35, -0.4, 1.0], [0.1, 3.25, -0.2, 0.85], [-0.3, 2.2, 0.85, 0.85]]
    .map(([x, y, z, r]) => new THREE.IcosahedronGeometry(r, 1).translate(x, y, z))),
  // 和式坡屋顶：单位三棱柱，底面 y=0、屋脊沿 z
  gable: new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-0.5, 0), new THREE.Vector2(0.5, 0), new THREE.Vector2(0, 1)]), { depth: 1, bevelEnabled: false }).translate(0, 0, -0.5),
  petal: new THREE.PlaneGeometry(0.42, 0.3),
  pyramid: new THREE.ConeGeometry(Math.SQRT1_2, 1, 4, 1).rotateY(Math.PI / 4).translate(0, 0.5, 0),
  ring: new THREE.RingGeometry(0.94, 1, 72).rotateX(-Math.PI / 2),
};
G.carTop.translate(0, 0.46, -0.1);

// 棕榈树：弯曲树干 + 8 片下垂叶片（同一局部坐标系，两个 InstancedMesh 共用实例矩阵）
const PALM_TOP = V3(0.8, 3.6, 0);
G.trunk = (() => {
  const curve = new THREE.CatmullRomCurve3([V3(0, 0, 0), V3(0.12, 1.2, 0), V3(0.42, 2.5, 0), PALM_TOP.clone()]);
  const g = new THREE.TubeGeometry(curve, 10, 0.19, 6, false);
  const pos = g.attributes.position, col = [];
  const a = new THREE.Color('#A8774A'), b = new THREE.Color('#C99A66');
  for (let i = 0; i < pos.count; i++) { const c = (Math.floor(pos.getY(i) * 3.2) % 2) ? a : b; col.push(c.r, c.g, c.b); }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return g;
})();
G.leaves = (() => {
  function leaf() {
    const L = 2.7, N = 7, pos = [], idx = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N, x = u * L, y = 0.55 * u - 1.45 * u * u;
      const w = 0.52 * Math.pow(Math.max(0, Math.sin(Math.PI * Math.min(1, u * 1.08))), 0.7) + 0.02;
      pos.push(x, y - 0.14 * w, -w, x, y + 0.07, 0, x, y - 0.14 * w, w);
    }
    for (let i = 0; i < N; i++) { const a = i * 3, b = a + 3; idx.push(a, b, a + 1, a + 1, b, b + 1, a + 1, b + 1, a + 2, a + 2, b + 1, b + 2); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
    return g;
  }
  const parts = [];
  for (let k = 0; k < 8; k++) {
    const g = leaf();
    g.rotateZ(((k * 37) % 10) / 10 * 0.35 - 0.1);
    g.rotateY(k * Math.PI * 2 / 8 + (k % 3) * 0.12);
    g.translate(PALM_TOP.x, PALM_TOP.y, PALM_TOP.z);
    parts.push(g);
  }
  const m = mergeGeometries(parts); m.computeVertexNormals(); return m;
})();

const realism = createRealism({ THREE, renderer, scene, camera, sun, hemi, M, G, sky, seaMat, lagoonMat });

/* =====================================================================
   4. 地标资产加载（官方 GLB，<script> 引入，file:// 可用）
   ===================================================================== */
const BLANK = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const gltfManager = new THREE.LoadingManager();
gltfManager.setURLModifier(u => (typeof u === 'string' && !u.startsWith('data:') && /\.(png|jpe?g|webp|tga|bmp|psd|tiff?|dds|exr)$/i.test(u)) ? BLANK : u);
const gltfLoader = new GLTFLoader(gltfManager);

function loadGlbScript(key) {
  return new Promise((res, rej) => {
    window.GLB_DATA = window.GLB_DATA || {};
    if (window.GLB_DATA[key]) return res(window.GLB_DATA[key]);
    const s = document.createElement('script');
    s.src = ASSET + 'glb/' + key + '.js';
    s.onload = () => window.GLB_DATA[key] ? res(window.GLB_DATA[key]) : rej(new Error('数据缺失: ' + key));
    s.onerror = () => rej(new Error('加载失败: ' + key));
    document.head.appendChild(s);
  });
}
function b64ToBuffer(b64) {
  const bin = atob(b64), u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return u.buffer;
}
const loadImage = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
function imageHasAlpha(img) {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'); g.drawImage(img, 0, 0, 64, 64);
  const d = g.getImageData(0, 0, 64, 64).data;
  for (let i = 3; i < d.length; i += 4) if (d[i] < 200) return true;
  return false;
}
async function loadLandmarkPart(key, texName, plane) {
  const entry = await loadGlbScript(key);
  const gltf = await new Promise((res, rej) => gltfLoader.parse(b64ToBuffer(entry.glb), '', res, rej));
  const src = entry.tex && (entry.tex[texName] || Object.values(entry.tex)[0]);
  let tex = null, alpha = false;
  if (src) {
    const img = await loadImage(src);
    tex = new THREE.Texture(img);
    tex.flipY = false; tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; tex.needsUpdate = true;
    alpha = imageHasAlpha(img);
  }
  const model = gltf.scene;
  // 带骨骼的模型（如新加坡摩天轮）静态姿态下渲染不出来：换成同几何体的普通 Mesh（与资产站做法一致）
  model.updateMatrixWorld(true);
  const skinned = []; model.traverse(o => { if (o.isSkinnedMesh) skinned.push(o); });
  for (const sm of skinned) {
    const mesh = new THREE.Mesh(sm.geometry, sm.material);
    sm.matrixWorld.decompose(mesh.position, mesh.quaternion, mesh.scale);
    sm.parent.add(mesh); sm.parent.remove(sm);
  }
  model.traverse(o => {
    if (!o.isMesh) return;
    const old = Array.isArray(o.material) ? o.material[0] : o.material;
    o.material = new THREE.MeshStandardMaterial({
      map: tex, color: tex ? 0xffffff : (old && old.color) || 0xffffff,
      roughness: 0.6, metalness: 0, side: old ? old.side : THREE.FrontSide,
      alphaTest: alpha ? 0.5 : 0, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: tex ? 0.18 : 0,
      clippingPlanes: [plane], clipShadows: true,
    });
    o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false;
  });
  return model;
}

/* 多部件地标（如阿提哈德塔三栋）：源文件都以原点为中心，按宽度横向排开；normalizeHeight 先拉齐高度 */
function layoutRow(group, normalizeHeight) {
  const items = group.children.map(o => ({ o, box: new THREE.Box3().setFromObject(o) }));
  if (normalizeHeight) {
    const maxH = Math.max(...items.map(it => it.box.max.y - it.box.min.y));
    for (const it of items) { const h = it.box.max.y - it.box.min.y; if (h > 0) it.o.scale.multiplyScalar(maxH / h); it.box.setFromObject(it.o); }
  }
  const ws = items.map(it => it.box.max.x - it.box.min.x), gap = Math.max(...ws) * 0.35;
  let cursor = -(ws.reduce((a, b) => a + b, 0) + gap * (items.length - 1)) / 2;
  items.forEach((it, i) => {
    const c = it.box.getCenter(V3());
    it.o.position.x += cursor - it.box.min.x; it.o.position.z -= c.z; it.o.position.y -= it.box.min.y;
    cursor += ws[i] + gap;
  });
}

async function loadLandmarkAsset(cfg, plane) {
  const parts = cfg.parts || [[cfg.key, cfg.tex]];
  const models = await Promise.all(parts.map(([key, tex]) => loadLandmarkPart(key, tex, plane)));
  if (models.length === 1) return models[0];
  const group = new THREE.Group(); models.forEach(m => group.add(m));
  layoutRow(group, cfg.normalizeHeight);
  return group;
}

/* 地标状态：模型、裁剪平面、扫描线、完工光环、名牌、脚手架（与种子无关，重建世界时保留） */
const landmarkLayer = new THREE.Group(); scene.add(landmarkLayer);
const ALL_LM = [];   // 所有已创建的地标（加载进度用）

function labelTexture(title, sub) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 220;
  const g = c.getContext('2d');
  const f1 = k => `800 ${64 * k}px -apple-system,"PingFang SC","Helvetica Neue",Arial`, f2 = k => `600 ${54 * k}px -apple-system,"PingFang SC",Arial`;
  g.font = f1(1); let w1 = g.measureText(title).width; g.font = f2(1); let w2 = g.measureText(sub).width;
  const k = Math.min(1, 860 / (w1 + w2 + 30)); w1 *= k; w2 *= k;   // 长名字整体缩小，保证放得下
  const W = w1 + w2 + 130 * k + 30, x0 = (1024 - W) / 2;
  g.fillStyle = 'rgba(10,30,70,.82)'; g.beginPath(); g.roundRect(x0, 40, W, 130, 65); g.fill();
  g.strokeStyle = '#FFD25A'; g.lineWidth = 6; g.stroke();
  g.fillStyle = '#fff'; g.textBaseline = 'middle';
  g.font = f1(k); g.fillText(title, x0 + 50 * k + 15, 106);
  g.fillStyle = '#FFD25A'; g.font = f2(k); g.fillText(sub, x0 + 80 * k + 15 + w1, 108);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

// 为一座城市创建地标状态并开始加载模型；parent 可以是带偏移的城市组（宣传片里十一城各占一块）
function createLandmarks(city, parent) {
 const LMc = {};
 for (const id of Object.keys(city.landmarks)) {
  const cfg = city.landmarks[id];
  const L = { id, cfg, city, loaded: false, failed: false, H: cfg.h, rXZ: cfg.r };
  L.plane = new THREE.Plane(V3(0, -1, 0), 1e5);
  L.holder = new THREE.Group(); L.holder.position.set(cfg.pos[0], cfg.base, cfg.pos[1]); L.holder.rotation.y = cfg.rot; L.holder.visible = false;
  L.holder.userData.lm = L;   // 点击拾取用
  // 脚手架占位：4 根立柱 + 横杆，未加载完时显示
  L.scaffold = new THREE.Group();
  const sw = cfg.r * 0.9;
  for (const [dx, dz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const p = new THREE.Mesh(G.box, M.scaffold); p.scale.set(0.3, 1, 0.3); p.position.set(dx * sw, 0.5, dz * sw); L.scaffold.add(p);
  }
  for (let k = 1; k <= 6; k++) {
    for (const [dx, dz, sx, sz] of [[0, -1, 2, 0], [0, 1, 2, 0], [-1, 0, 0, 2], [1, 0, 0, 2]]) {
      const b = new THREE.Mesh(G.box, M.scaffold); b.scale.set(sx ? sw * 2 : 0.18, 0.18 / cfg.h, sz ? sw * 2 : 0.18);
      b.position.set(dx * sw, k / 6.5, dz * sw); L.scaffold.add(b);
    }
  }
  L.scaffold.scale.set(1, cfg.h, 1); L.scaffold.visible = false;
  L.holder.add(L.scaffold);
  // 扫描线与完工光环（世界坐标）
  L.scan = new THREE.Mesh(new THREE.TorusGeometry(1, 0.09, 8, 64).rotateX(Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: '#7FF3FF', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  L.burst = new THREE.Mesh(G.ring, new THREE.MeshBasicMaterial({ color: '#FFD25A', transparent: true, side: THREE.DoubleSide, depthWrite: false, fog: false }));
  L.label = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTexture(cfg.name, cfg.zh), transparent: true, depthTest: false, fog: false, sizeAttenuation: false }));
  L.label.center.set(0.5, 0); L.label.renderOrder = 10;
  parent.add(L.holder, L.scan, L.burst, L.label);
  LMc[id] = L; ALL_LM.push(L);

  loadLandmarkAsset(cfg, L.plane).then(model => {
    const box = new THREE.Box3().setFromObject(model), size = box.getSize(V3()), ctr = box.getCenter(V3());
    const k = cfg.h / size.y;
    const inner = new THREE.Group(); inner.add(model);
    model.position.set(-ctr.x, -box.min.y, -ctr.z);
    inner.scale.setScalar(k);
    L.holder.add(inner); L.asset = inner;
    L.rXZ = Math.max(size.x, size.z) * k * 0.5;
    L.size = [size.x * k, size.y * k, size.z * k];   // 调试用：实际占地（排布、桥的朝向）
    L.loaded = true;
    updateLoading();
  }).catch(err => { console.error('[地标]', cfg.key || cfg.name, err); L.failed = true; updateLoading(); });
 }
 return LMc;
}
function updateLoading() {
  const el = document.getElementById('loading');
  const done = ALL_LM.filter(l => l.loaded).length, failed = ALL_LM.filter(l => l.failed).length;
  el.textContent = `地标模型 ${done}/${ALL_LM.length}` + (failed ? ` · ${failed} 个失败（脚手架占位）` : '');
  el.style.opacity = 1;
  if (done + failed === ALL_LM.length) setTimeout(() => el.style.opacity = 0, 1200);
  if (EXPLORE) gameLoadProgress();
}
const LM = {};

/* =====================================================================
   5. 场景构件（施工脚本里的每条指令 → 一个或多个 actor，actor.apply(t) 纯函数）
   ===================================================================== */
class Pool {
  constructor(root, geo, mat, cap, { shadow = true, colors = false } = {}) {
    const m = new THREE.InstancedMesh(geo, mat, cap);
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    if (colors) m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(cap * 3).fill(1), 3);
    m.castShadow = shadow; m.receiveShadow = true; m.frustumCulled = false; m.count = 0;
    for (let i = 0; i < cap; i++) m.setMatrixAt(i, ZERO);
    root.add(m); this.m = m; this.n = 0; this.cap = cap;
  }
  alloc() { if (this.n >= this.cap) throw new Error('实例池已满'); this.m.count = ++this.n; return this.n - 1; }
  set(i, M) { this.m.setMatrixAt(i, M); }
  hide(i) { this.m.setMatrixAt(i, ZERO); }
  color(i, c) { this.m.setColorAt(i, c); this.m.instanceColor.needsUpdate = true; }
  flush() { this.m.instanceMatrix.needsUpdate = true; }
}

const PAL = {
  glass: ['#4FA8F0', '#2D5BD3', '#3B82E0', '#5BC0F5', '#2A4FB8', '#63B3ED'].map(c => new THREE.Color(c)),
  pop: ['#F27BB5', '#8C6FE8', '#F59B42', '#35C2B5', '#F2C94C', '#EF6F6C'].map(c => new THREE.Color(c)),
  villa: ['#BFE6FF', '#FFE3C2', '#D9F2E6', '#F9D8E8'].map(c => new THREE.Color(c)),
  sakura: ['#F7A8C8', '#F4B6D2', '#EE93BA', '#FBC4DA'].map(c => new THREE.Color(c)),
  green: ['#4CAF50', '#3E9E43', '#66BB55', '#2E8B3E'].map(c => new THREE.Color(c)),
  wa: ['#F4EDE0', '#FFFFFF', '#EADBC4', '#F6E7D8'].map(c => new THREE.Color(c)),
  waRoof: ['#34405A', '#2F5D62', '#8C3B3B', '#4A4A58'].map(c => new THREE.Color(c)),
  paris: ['#F3E6CC', '#EEDDBF', '#F7EEDC', '#E8D3B0'].map(c => new THREE.Color(c)),
  slate: ['#5C6B82', '#4D5A70', '#66758C'].map(c => new THREE.Color(c)),
  adobe: ['#E9C99A', '#DDB27C', '#F1DDB8', '#CFA273'].map(c => new THREE.Color(c)),
  roof: ['#E07A5F', '#3FB8AF', '#F2A65A', '#6C8BE0'].map(c => new THREE.Color(c)),
  leaves: ['#3FA34D', '#2E8B3E', '#4DB35A', '#5BBF4F'].map(c => new THREE.Color(c)),
  umbrella: ['#F0605D', '#F7C948', '#4FA8F0', '#FFFFFF', '#F27BB5'].map(c => new THREE.Color(c)),
  car: ['#F0605D', '#F7C948', '#FFFFFF', '#4FA8F0', '#8C6FE8', '#2E3440', '#35C2B5'].map(c => new THREE.Color(c)),
};

// 岛屿轮廓（x,z 点列），o = 外扩量（用来生成浅水与浪花环）
function arcPts(cx, cz, r, a0, a1, n) {
  const out = [];
  for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n); out.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]); }
  return out;
}
const OUTLINE = {
  rect([x1, z1, x2, z2], r, o = 0) {
    x1 -= o; z1 -= o; x2 += o; z2 += o; r += o; const H = Math.PI / 2;
    return [...arcPts(x2 - r, z2 - r, r, 0, H, 8), ...arcPts(x1 + r, z2 - r, r, H, 2 * H, 8),
            ...arcPts(x1 + r, z1 + r, r, 2 * H, 3 * H, 8), ...arcPts(x2 - r, z1 + r, r, 3 * H, 4 * H, 8)];
  },
  circle([x, z], r, o = 0) { return arcPts(x, z, r + o, 0, Math.PI * 2, 56).slice(0, -1); },
  capsule([x1, z1, x2, z2], r, o = 0) {
    r += o; const a = Math.atan2(z2 - z1, x2 - x1);
    return [...arcPts(x2, z2, r, a - Math.PI / 2, a + Math.PI / 2, 14), ...arcPts(x1, z1, r, a + Math.PI / 2, a + 1.5 * Math.PI, 14)];
  },
  crescent([cx, cz], R, w, deg, o = 0) {
    const A = deg * Math.PI / 180, hw = w / 2 + o, N = 60, out = [];
    const P = (phi, rad) => [cx + rad * Math.sin(phi), cz + rad * Math.cos(phi)];
    for (let i = 0; i <= N; i++) out.push(P(lerp(-A, A, i / N), R + hw));
    let [ccx, ccz] = P(A, R), u = [Math.sin(A), Math.cos(A)], tg = [Math.cos(A), -Math.sin(A)];
    for (let i = 1; i < 12; i++) { const s = Math.PI * i / 12; out.push([ccx + hw * (u[0] * Math.cos(s) + tg[0] * Math.sin(s)), ccz + hw * (u[1] * Math.cos(s) + tg[1] * Math.sin(s))]); }
    for (let i = 0; i <= N; i++) out.push(P(lerp(A, -A, i / N), R - hw));
    [ccx, ccz] = P(-A, R); u = [Math.sin(-A), Math.cos(-A)]; tg = [Math.cos(-A), -Math.sin(-A)];
    for (let i = 1; i < 12; i++) { const s = Math.PI * i / 12; out.push([ccx + hw * (-u[0] * Math.cos(s) - tg[0] * Math.sin(s)), ccz + hw * (-u[1] * Math.cos(s) - tg[1] * Math.sin(s))]); }
    return out;
  },
};
const toShape = pts => new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)));
const flatGeo = pts => new THREE.ShapeGeometry(toShape(pts), 6).rotateX(-Math.PI / 2);
function boxOf(pts, y0 = 0, y1 = 2) {
  const b = new THREE.Box3();
  for (const [x, z] of pts) { b.expandByPoint(_p.set(x, y0, z)); b.expandByPoint(_p.set(x, y1, z)); }
  return b;
}

// 世界上下文：PRNG、实例池、避让表
class Ctx {
  constructor(root, seed, city, LMc) {
    this.root = root; this.rng = mulberry32(hashSeed(String(seed)));
    this.city = city; this.LM = LMc;
    this.buildings = []; this.palms = []; this.vehicles = [];
    this.camKeys = []; this.orbit = null; this.T = 50; this.title = null;
    this.roads = []; this.circles = []; this.rects = []; this.fronds = []; this.crescent = null;
    this.raised = [];   // 抬高地块：{ test(x,z), y }，决定树、楼落在多高
    this.islands = [];  // 岛屿轮廓：{ kind, args }，河道据此判断哪里是陆地、哪里该降到海面
    for (const c of Object.values(city.landmarks)) this.circles.push({ x: c.pos[0], z: c.pos[1], r: c.r });
    const R = root;
    this.pools = {
      tower: new Pool(R, G.rbox, towerMat, 420, { colors: true }),
      roof: new Pool(R, G.box, M.roof, 80, { colors: true }),
      pad: new Pool(R, G.pad, M.pad, 120),
      ant: new Pool(R, G.antenna, M.antenna, 120),
      trunk: new Pool(R, G.trunk, M.trunk, 260),
      leaves: new Pool(R, G.leaves, M.leaves, 260, { colors: true }),
      canopy: new Pool(R, G.canopy, M.canopy, 40, { colors: true }),
      pole: new Pool(R, G.pole, M.pole, 40),
      dash: new Pool(R, G.box, M.dash, 900, { shadow: false }),
      carBody: new Pool(R, G.carBody, M.carBody, 40, { colors: true }),
      carTop: new Pool(R, G.carTop, M.carTop, 40),
      cloud: new Pool(R, G.cloud, M.cloud, 560, { shadow: false }),
      bush: new Pool(R, G.bush, M.bush, 160, { colors: true }),
      rock: new Pool(R, G.rock, M.rock, 60),
      treeTrunk: new Pool(R, G.treeTrunk, M.treeTrunk, 220),
      treeCrown: new Pool(R, G.treeCrown, M.bush, 220, { colors: true }),
      gable: new Pool(R, G.gable, M.gable, 80, { colors: true }),
      petal: new Pool(R, G.petal, M.petal, 220, { shadow: false }),
    };
  }
  r(a, b) { return lerp(a, b, this.rng()); }
  pick(arr) { return arr[Math.floor(this.rng() * arr.length) % arr.length]; }
  free(x, z, w, d) {
    const rad = Math.hypot(w, d) / 2;
    for (const c of this.circles) if (Math.hypot(x - c.x, z - c.z) < c.r + rad + 0.6) return false;
    for (const r of this.roads) {
      const dx = r.B[0] - r.A[0], dz = r.B[1] - r.A[1], L2 = dx * dx + dz * dz;
      const u = clamp01(((x - r.A[0]) * dx + (z - r.A[1]) * dz) / L2);
      const px = r.A[0] + dx * u, pz = r.A[1] + dz * u;
      if (Math.abs(dx) > Math.abs(dz) ? Math.abs(z - pz) < r.hw + d / 2 + 0.6 && Math.abs(x - px) < w / 2 + 0.1
                                      : Math.abs(x - px) < r.hw + w / 2 + 0.6 && Math.abs(z - pz) < d / 2 + 0.1) return false;
    }
    for (const q of this.rects) if (Math.abs(x - q.x) < (w + q.w) / 2 + 0.9 && Math.abs(z - q.z) < (d + q.d) / 2 + 0.9) return false;
    return true;
  }
  groundY(x, z) {
    let y = 1.0;
    for (const r of this.raised) if (r.y > y && r.test(x, z)) y = r.y;
    return y;
  }
  raise(kind, args, y) { this.raised.push({ test: (x, z) => insideShape(kind, args, x, z), y }); }
}

function insideShape(kind, args, x, z) {
  if(kind==='polygon')return pointInPolygon(args[0],x,z);
  if (kind === 'rect') { const [[x1, z1, x2, z2]] = args; return x > x1 && x < x2 && z > z1 && z < z2; }
  if (kind === 'circle') { const [[cx, cz], r] = args; return Math.hypot(x - cx, z - cz) < r; }
  if (kind === 'capsule') {
    const [[x1, z1, x2, z2], r] = args, dx = x2 - x1, dz = z2 - z1;
    const u = clamp01(((x - x1) * dx + (z - z1) * dz) / (dx * dx + dz * dz));
    return Math.hypot(x - x1 - dx * u, z - z1 - dz * u) < r;
  }
  return false;
}

/* 路口拼接：某段路的端点落在另一段同类、不平行的路上（转角或丁字口）时，该端外伸。
   同向首尾相接（路→桥→路）不外伸，避免不同材质的桥面与路面重叠闪烁 */
function joinRoads(roads) {
  const segDist = (P, q) => {
    const dx = q.B[0] - q.A[0], dz = q.B[1] - q.A[1], u = clamp01(((P[0] - q.A[0]) * dx + (P[1] - q.A[1]) * dz) / (dx * dx + dz * dz));
    return Math.hypot(P[0] - q.A[0] - dx * u, P[1] - q.A[1] - dz * u);
  };
  const dir = r => { const dx = r.B[0] - r.A[0], dz = r.B[1] - r.A[1], L = Math.hypot(dx, dz); return [dx / L, dz / L]; };
  for (const r of roads) {
    if (r.kind !== 'road' && r.kind !== 'rail') continue;
    const dr = dir(r);
    for (const [P, key] of [[r.A, 'e0'], [r.B, 'e1']]) {
      r[key] = roads.some(q => q !== r && q.kind === r.kind && segDist(P, q) < 0.05 && Math.abs(dr[0] * dir(q)[1] - dr[1] * dir(q)[0]) > 0.1) ? 1 : 0;
    }
  }
}

/* 闭合折线路线（两点即往返）：按距离取点与方向，车流、列车共用 */
function makeLoop(pts) {
  const segs = []; let tot = 0;
  for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length], len = Math.hypot(b[0] - a[0], b[1] - a[1]); segs.push({ a, b, len, s0: tot }); tot += len; }
  return { segs, tot };
}
function loopAt(loop, d, lane) {
  d = ((d % loop.tot) + loop.tot) % loop.tot;
  let sg = loop.segs[0];
  for (const q of loop.segs) if (d >= q.s0 && d < q.s0 + q.len) { sg = q; break; }
  const u = (d - sg.s0) / sg.len, dx = (sg.b[0] - sg.a[0]) / sg.len, dz = (sg.b[1] - sg.a[1]) / sg.len;
  return { x: sg.a[0] + (sg.b[0] - sg.a[0]) * u - dz * lane, z: sg.a[1] + (sg.b[1] - sg.a[1]) * u + dx * lane, dx, dz };
}

/* 抬高的平地块（草坪 / 广场）：圆角矩形挤出，从地下升起 */
function slabActor(ctx, rect, r, mats, s, dur) {
  ctx.raise('rect', [rect], 1.25);
  const geo = new THREE.ExtrudeGeometry(toShape(OUTLINE.rect(rect, r)), { depth: 0.18, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.15, bevelSegments: 2, curveSegments: 8 }).rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geo, mats); mesh.receiveShadow = true; ctx.root.add(mesh);
  return {
    dur, adv: 0.6, anim: 'grow', bbox: boxOf(OUTLINE.rect(rect, r), 1, 1.3),
    actors: [{ apply(t) { const p = prog(t, s, dur); mesh.visible = p > 0; const k = easeOutCubic(p); mesh.position.y = 1.25 - 0.24 - 0.35 * (1 - k); mesh.scale.set(0.94 + 0.06 * k, 1, 0.94 + 0.06 * k); } }]
  };
}

/* 散布小物件（灌木、礁石）：避开路、水、地标与楼 */
function scatter(ctx, [x1, z1, x2, z2], n, size) {
  const out = [];
  for (let tries = 0; out.length < n && tries < n * 30; tries++) {
    const x = ctx.r(x1, x2), z = ctx.r(z1, z2);
    if (!ctx.free(x, z, size, size)) continue;
    out.push([x, z]); ctx.rects.push({ x, z, w: size * 0.6, d: size * 0.6 });   // 占位，后续排楼会避开
  }
  return out;
}

/* ---------- 指令实现：每条返回 {dur, adv, actors, bbox} ---------- */
function palmActor(ctx, x, y, z, s0, start, dur) {
  const P = ctx.pools, i = P.trunk.alloc(); P.leaves.alloc();
  const ry = ctx.r(0, Math.PI * 2), sc = s0 * ctx.r(0.85, 1.2);
  ctx.palms.push({ index: i, x, y, z, scale: sc, ry });
  P.leaves.color(i, ctx.pick(PAL.leaves));
  return {
    apply(t) {
      const p = prog(t, start, dur);
      if (p <= 0) { P.trunk.hide(i); P.leaves.hide(i); return; }
      const k = sc * easeOutBack(p, 1.8);
      const sway = Math.sin(amb(t) * 1.3 + x * 0.3 + z * 0.2) * 0.025;
      mat(x, y, z, ry, k, k, k, sway, sway * 0.6); P.trunk.set(i, _m); P.leaves.set(i, _m);
    }
  };
}

function towerActor(ctx, b, start, dur) {
  const P = ctx.pools, iB = P.tower.alloc(); P.tower.color(iB, b.color);
  const iC = b.crown ? P.tower.alloc() : -1; if (iC >= 0) P.tower.color(iC, b.color);
  const iR = b.roof ? P.roof.alloc() : -1; if (iR >= 0) P.roof.color(iR, b.roof);
  const iP = b.pad ? P.pad.alloc() : -1, iA = b.ant ? P.ant.alloc() : -1;
  const iG = b.gable ? P.gable.alloc() : -1; if (iG >= 0) P.gable.color(iG, b.gable.color);
  const ry = b.ry || 0;
  ctx.buildings.push({ ...b, indices: { body: iB, crown: iC, roof: iR, pad: iP, antenna: iA, gable: iG } });
  return {
    apply(t) {
      const p = prog(t, start, dur);
      if (p <= 0) { P.tower.hide(iB); if (iC >= 0) P.tower.hide(iC); if (iR >= 0) P.roof.hide(iR); if (iP >= 0) P.pad.hide(iP); if (iA >= 0) P.ant.hide(iA); if (iG >= 0) P.gable.hide(iG); return; }
      const y0 = b.base + dropY(p, b.dropH || 28), sq = squash(p), h = b.h * sq;
      P.tower.set(iB, mat(b.x, y0 + h / 2, b.z, ry, b.w, h, b.d));
      let top = y0 + h;
      if (iC >= 0) { const ch = b.crown.h * sq; P.tower.set(iC, mat(b.x, top + ch / 2, b.z, ry, b.crown.w, ch, b.crown.d)); top += ch; }
      if (iR >= 0) { P.roof.set(iR, mat(b.x, top + 0.17, b.z, ry, b.w * 1.12, 0.34, b.d * 1.12)); top += 0.34; }
      if (iG >= 0) { P.gable.set(iG, mat(b.x, top - 0.05, b.z, ry, b.w * 1.2, b.gable.h * sq, b.d * 1.14)); top += b.gable.h; }
      if (iP >= 0) P.pad.set(iP, mat(b.x, top + 0.08, b.z, 0, b.padR, 1, b.padR));
      if (iA >= 0) P.ant.set(iA, mat(b.x + b.w * 0.2, top, b.z - b.d * 0.2, 0, 1, 1, 1));
    }
  };
}

function towerBox(b) {
  let h = b.h + (b.crown ? b.crown.h : 0) + (b.ant ? 3.2 : 0);
  return new THREE.Box3(V3(b.x - b.w / 2, b.base, b.z - b.d / 2), V3(b.x + b.w / 2, b.base + h, b.z + b.d / 2));
}

const CMDS = {
  stage: () => ({ adv: 0 }),
  wait: (ctx, [s]) => ({ adv: s }),
  island(ctx, [id, kind, ...rest], s) { return { dur: 2.2, adv: 0.8, anim: 'rise', ...islandActor(ctx, kind, rest, s, 2.2, id) }; },

  grass: (ctx, [rect, r], s) => slabActor(ctx, rect, r, [M.grass, M.grassSide], s, 1.4),
  plaza: (ctx, [rect, r], s) => slabActor(ctx, rect, r, [M.concrete, M.concreteSide], s, 1.4),

  // 水面镶嵌（潟湖）：与海面同一套波纹着色，外圈石砌岸；从中心长出
  water(ctx, [id, kind, ...rest], s) {
    const pts = OUTLINE[kind](...rest, 0), bb = boxOf(pts, 1, 1.4), c = bb.getCenter(V3()), sz = bb.getSize(V3());
    ctx.rects.push({ x: c.x, z: c.z, w: sz.x, d: sz.z });
    const g = new THREE.Group(); g.position.set(c.x, 0, c.z); ctx.root.add(g);
    const rim = new THREE.Mesh(flatGeo(OUTLINE[kind](...rest, 1.3)).translate(-c.x, 0, -c.z), M.rim); rim.position.y = 1.29;
    const water = new THREE.Mesh(flatGeo(pts).translate(-c.x, 0, -c.z), lagoonMat); water.position.y = 1.31;
    rim.receiveShadow = true; g.add(rim, water);
    const dur = 1.6;
    return {
      dur, adv: 0.7, anim: 'grow', bbox: bb,
      actors: [{ apply(t) { const p = prog(t, s, dur); g.visible = p > 0; const k = Math.max(0.001, easeOutBack(p, 1.1)); g.scale.set(k, 1, k); } }]
    };
  },

  // 河道：沿折线铺成一条连续水带，弯道处法线平滑过渡，岸线不会错位。
  // 写法：canal([x,z],[x,z], 宽, 起点伸进水体?) 或 canal([[x,z],[x,z],...], 宽, 起点伸进水体?)
  // 起点在潟湖/护城河边时往水体里多伸进 w，方头藏在水面下；端点画到岛外即可——
  // 两岸各自在与海岸线的交点处精确截断（斜穿也贴着岸线），再伸出岛边一点，以一道小瀑布落进海里。
  // 水面恒定 1.31、石砌河岸带矮墙：走在沙滩上时就是一条石砌水渠
  canal(ctx, args, s) {
    let pts, w, extend;
    if (Array.isArray(args[0][0])) [pts, w, extend = true] = args;
    else { pts = [args[0], args[1]]; w = args[2]; extend = args[3] !== false; }
    pts = pts.map(p => [...p]);
    if (extend) { const [a, b] = pts, L = Math.hypot(b[0] - a[0], b[1] - a[1]); pts[0] = [a[0] - (b[0] - a[0]) / L * w, a[1] - (b[1] - a[1]) / L * w]; }
    for (let i = 0; i < pts.length - 1; i++) ctx.roads.push({ A: pts[i], B: pts[i + 1], hw: w / 2 + 0.8, kind: 'canal' });

    // 沿折线每 0.5 采样一次
    const P = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.5));
      for (let k = i === 0 ? 0 : 1; k <= n; k++) P.push([lerp(a[0], b[0], k / n), lerp(a[1], b[1], k / n)]);
    }
    const N = P.length;
    // 切线取前后各 2 个单位的平均：弯道处两岸平滑转过去
    const T = P.map((_, i) => { const a = P[Math.max(0, i - 4)], b = P[Math.min(N - 1, i + 4)], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[0] - a[0]) / L, (b[1] - a[1]) / L]; });
    const inLand = ([x, z]) => ctx.islands.some(il => insideShape(il.kind, il.args, x, z));
    // 在 a(岛内)→b(岛外) 之间二分出岸线交点
    const shore = (a, b) => { let lo = a, hi = b; for (let k = 0; k < 24; k++) { const m = [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2]; inLand(m) ? lo = m : hi = m; } return lo; };
    // 生成一条带的「行」：每行一对左右岸点；岛外部分在交点处截断，并沿河向外再伸 0.6 作为落水口
    const rowsFor = half => {
      const Lp = P.map(([x, z], i) => [x - T[i][1] * half, z + T[i][0] * half]), Rp = P.map(([x, z], i) => [x + T[i][1] * half, z - T[i][0] * half]);
      const ok = i => inLand(Lp[i]) && inLand(Rp[i]);
      let a = 0, b = N - 1;
      while (a < N && !ok(a)) a++;
      while (b >= 0 && !ok(b)) b--;
      if (a > b) return { rows: [], capA: false, capB: false };
      const cut = (E, i, dir) => { let j = i; while (j + dir >= 0 && j + dir < N && inLand(E[j + dir])) j += dir; return j + dir >= 0 && j + dir < N ? shore(E[j], E[j + dir]) : E[j]; };
      const rows = [], ext = (p, i, k) => [p[0] + T[i][0] * k, p[1] + T[i][1] * k];
      const capA = a > 0, capB = b < N - 1;
      if (capA) { const l = cut(Lp, a, -1), r = cut(Rp, a, -1); rows.push([ext(l, a, -0.6), ext(r, a, -0.6), true], [l, r]); }
      for (let i = a; i <= b; i++) rows.push([Lp[i], Rp[i]]);
      if (capB) { const l = cut(Lp, b, 1), r = cut(Rp, b, 1); rows.push([l, r], [ext(l, b, 0.6), ext(r, b, 0.6), true]); }
      return { rows, capA, capB };
    };
    const FALL = -0.4;   // 落水口一直落到海面以下
    // 水面：恒定 1.31；落水口那一行加一道竖直水幕
    const W = rowsFor(w / 2), wp = [], wi = [];
    W.rows.forEach(([l, r]) => wp.push(l[0], 1.31, l[1], r[0], 1.31, r[1]));
    for (let i = 0; i < W.rows.length - 1; i++) { const a = i * 2; wi.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    const fall = row => { const n = wp.length / 3, [l, r] = row; wp.push(l[0], 1.31, l[1], r[0], 1.31, r[1], l[0], FALL, l[1], r[0], FALL, r[1]); wi.push(n, n + 1, n + 2, n + 1, n + 3, n + 2); };
    if (W.capA) fall(W.rows[0]); if (W.capB) fall(W.rows[W.rows.length - 1]);
    // 石岸：顶面 1.29 + 两侧矮墙到 0.9（草坪下会被埋住，沙滩上露出成石砌渠壁）；落水口处墙落到海面以下
    const Rr = rowsFor(w / 2 + 1.2), rp = [], ri = [];
    Rr.rows.forEach(([l, r, end]) => { const bot = end ? FALL : 0.9; rp.push(l[0], 1.29, l[1], r[0], 1.29, r[1], l[0], bot, l[1], r[0], bot, r[1]); });
    for (let i = 0; i < Rr.rows.length - 1; i++) { const a = i * 4, b = a + 4; ri.push(a, b, a + 1, a + 1, b, b + 1, a, a + 2, b, b, a + 2, b + 2, a + 1, b + 1, a + 3, a + 3, b + 1, b + 3); }
    const capFace = i => { const a = i * 4; ri.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); };
    if (Rr.capA) capFace(0); if (Rr.capB) capFace(Rr.rows.length - 1);
    const geo = (pos, idx) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g; };
    const water = new THREE.Mesh(geo(wp, wi), lagoonMat), rim = new THREE.Mesh(geo(rp, ri), M.rimWall);
    rim.receiveShadow = true; ctx.root.add(rim, water);
    const bb = new THREE.Box3(); P.forEach(([x, z]) => { bb.expandByPoint(V3(x - w, 1, z - w)); bb.expandByPoint(V3(x + w, 1.5, z + w)); });
    const dur = 1.5, segW = W.rows.length - 1, segR = Rr.rows.length - 1;
    return {
      dur, adv: 0.6, anim: 'flow', bbox: bb,
      actors: [{ apply(t) {
        const p = easeOutCubic(prog(t, s, dur));
        rim.visible = water.visible = p > 0;
        // 沿河向前铺开；铺满后再显示落水口
        water.geometry.setDrawRange(0, p >= 1 ? wi.length : Math.round(segW * p) * 6);
        rim.geometry.setDrawRange(0, p >= 1 ? ri.length : Math.round(segR * p) * 18);
      } }]
    };
  },

  // 绿洲小岛：从潟湖里升起的草坪
  isle(ctx, [kind, ...rest], s) {
    ctx.raise(kind, rest, 1.75);
    const pts = OUTLINE[kind](...rest, 0), bb = boxOf(pts, 1, 2), c = bb.getCenter(V3()), sz = bb.getSize(V3());
    ctx.rects.push({ x: c.x, z: c.z, w: sz.x, d: sz.z });
    const geo = new THREE.ExtrudeGeometry(toShape(pts), { depth: 0.6, bevelEnabled: true, bevelThickness: 0.25, bevelSize: 0.5, bevelSegments: 3, curveSegments: 10 }).rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geo, [M.grass, M.grassSide]); mesh.castShadow = mesh.receiveShadow = true; ctx.root.add(mesh);
    const dur = 1.2;
    return {
      dur, adv: 0.4, anim: 'rise', bbox: bb,
      actors: [{ apply(t) { const p = prog(t, s, dur); mesh.visible = p > 0; mesh.position.y = 1.75 - 0.85 - 1.2 * (1 - easeOutBack(p, 1.4)); } }]
    };
  },

  bushes(ctx, [n, rect], s) {
    const P = ctx.pools.bush, items = [], dur = 1.6, bb = new THREE.Box3();
    for (const [x, z] of scatter(ctx, rect, n, 1.6)) {
      const i = P.alloc(), sc = ctx.r(0.9, 1.6);
      P.color(i, ctx.pick(PAL.leaves));
      items.push({ i, x, z, y: ctx.groundY(x, z), sc, st: s + ctx.r(0, dur - 0.5) });
      bb.expandByPoint(V3(x, 1, z)); bb.expandByPoint(V3(x, 3, z));
    }
    return {
      dur, adv: 0.45, anim: 'grow', bbox: bb,
      actors: [{ apply(t) { for (const b of items) { const p = prog(t, b.st, 0.5); if (p <= 0) { P.hide(b.i); continue; } const k = b.sc * easeOutBack(p, 2); P.set(b.i, mat(b.x, b.y + k * 0.7, b.z, 0, k, k * 0.85, k)); } } }]
    };
  },

  rocks(ctx, [n, rect, k = 1], s) {   // k 放大倍数：沙漠里的大块红岩用 2~3
    const P = ctx.pools.rock, items = [], dur = 1.6;
    for (const [x, z] of scatter(ctx, rect, n, 2 * k)) items.push({ i: P.alloc(), x, z, sx: ctx.r(1, 2.4) * k, sy: ctx.r(0.6, 1.3) * k, sz: ctx.r(1, 2) * k, ry: ctx.r(0, 6.28), st: s + ctx.r(0, dur - 0.5) });
    return {
      dur, adv: 0.45, anim: 'pop', bbox: new THREE.Box3(V3(rect[0], 1, rect[1]), V3(rect[2], 3, rect[3])),
      actors: [{ apply(t) { for (const r of items) { const p = prog(t, r.st, 0.5); if (p <= 0) { P.hide(r.i); continue; } const k = easeOutBack(p, 1.8); P.set(r.i, mat(r.x, 1.0, r.z, r.ry, r.sx * k, r.sy * k, r.sz * k)); } } }]
    };
  },

  // 程序生成的石块金字塔：四棱锥，从沙地里升起
  pyramid(ctx, [[x, z], s], s0) {
    const m = new THREE.Mesh(G.pyramid, M.sandstone); m.castShadow = m.receiveShadow = true;
    m.position.set(x, ctx.groundY(x, z), z); ctx.root.add(m);
    ctx.circles.push({ x, z, r: s * 0.75 });
    return {
      dur: 1.4, adv: 0.5, anim: 'rise', bbox: new THREE.Box3(V3(x - s / 2, 1, z - s / 2), V3(x + s / 2, 1 + s * 0.8, z + s / 2)),
      actors: [{ apply(t) { const p = prog(t, s0, 1.4); m.visible = p > 0; m.scale.set(s, Math.max(0.001, s * 0.8 * easeOutBack(p, 1.2)), s); } }]
    };
  },

  // 山：'grass' 绿色平顶山、'rock' 红岩台地（平顶，地标可立在山顶）、'dome' 圆顶岩峰
  mount(ctx, [[x, z], r, h, kind = 'grass'], s) {
    const base = ctx.groundY(x, z), dome = kind === 'dome', rock = kind !== 'grass';
    const geo = dome ? G.dune : new THREE.CylinderGeometry(0.55, 1, 1, 28, 1).translate(0, 0.5, 0);
    const side = rock ? M.rock : M.grassSide, top = rock ? M.rock : M.grass;
    const m = new THREE.Mesh(geo, dome ? M.granite : [side, top, top]); m.castShadow = m.receiveShadow = true;
    m.position.set(x, base - 0.05, z); ctx.root.add(m);
    ctx.circles.push({ x, z, r });
    ctx.raised.push({ test: (px, pz) => Math.hypot(px - x, pz - z) < r * 0.5, y: base + h });
    return {
      dur: 1.6, adv: 0.6, anim: 'rise', bbox: new THREE.Box3(V3(x - r, base, z - r), V3(x + r, base + h, z + r)),
      actors: [{ apply(t) { const p = prog(t, s, 1.6); m.visible = p > 0; m.scale.set(r, Math.max(0.001, h * easeOutBack(p, 1.3)), r); } }]
    };
  },

  // 环线铁轨：按路口依次铺设（首尾相连）
  rail(ctx, [pts], s) {
    const actors = [], bb = new THREE.Box3(), seg = 2.4 / pts.length;
    pts.forEach((a, i) => {
      const r = CMDS.road(ctx, [a, pts[(i + 1) % pts.length], 'rail'], s + i * seg);
      actors.push(...r.actors); bb.union(r.bbox);
    });
    return { dur: 2.4 + 1.3, adv: 0.6, anim: 'lay', actors, bbox: bb };
  },

  // 树：'sakura' 樱花 / 'green' 阔叶树，随机散布并避让
  trees(ctx, [n, rect, kind], s) {
    const P = ctx.pools, items = [], dur = 2, bb = new THREE.Box3(), pal = kind === 'green' ? PAL.green : PAL.sakura;
    for (const [x, z] of scatter(ctx, rect, n, 2.6)) {
      const i = P.treeTrunk.alloc(); P.treeCrown.alloc(); P.treeCrown.color(i, ctx.pick(pal));
      items.push({ i, x, z, y: ctx.groundY(x, z), sc: ctx.r(0.85, 1.25), ry: ctx.r(0, 6.28), st: s + ctx.r(0, dur - 0.6) });
      bb.expandByPoint(V3(x, 1, z)); bb.expandByPoint(V3(x, 5, z));
    }
    return {
      dur, adv: 0.5, anim: 'grow', bbox: bb,
      actors: [{ apply(t) { for (const b of items) { const p = prog(t, b.st, 0.6); if (p <= 0) { P.treeTrunk.hide(b.i); P.treeCrown.hide(b.i); continue; } const k = b.sc * easeOutBack(p, 1.8); mat(b.x, b.y, b.z, b.ry, k, k, k); P.treeTrunk.set(b.i, _m); P.treeCrown.set(b.i, _m); } } }]
    };
  },

  // 鸟居：两根朱红立柱 + 黑色笠木 + 贯
  torii(ctx, [[x, z], ry, size = 1], s) {
    const g = new THREE.Group(); g.position.set(x, ctx.groundY(x, z), z); g.rotation.y = ry; ctx.root.add(g);
    const H = 6 * size, W = 6 * size, parts = [];
    for (const sx of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.32 * size, 0.38 * size, H, 12), M.vermilion); p.position.set(sx * W * 0.36, H / 2, 0); parts.push(p); }
    const kasagi = new THREE.Mesh(G.rbox, M.ink); kasagi.scale.set(W * 1.12, 0.45 * size, 0.8 * size); kasagi.position.y = H + 0.35 * size;
    const shimaki = new THREE.Mesh(G.box, M.vermilion); shimaki.scale.set(W * 0.98, 0.4 * size, 0.6 * size); shimaki.position.y = H - 0.1 * size;
    const nuki = new THREE.Mesh(G.box, M.vermilion); nuki.scale.set(W * 0.86, 0.32 * size, 0.4 * size); nuki.position.y = H * 0.72;
    parts.push(kasagi, shimaki, nuki); parts.forEach(m => { m.castShadow = true; g.add(m); });
    ctx.circles.push({ x, z, r: W * 0.55 });
    return {
      dur: 1, adv: 0.4, anim: 'grow', bbox: new THREE.Box3(V3(x - W / 2, 1, z - W / 2), V3(x + W / 2, H + 2, z + W / 2)),
      actors: [{ apply(t) { const p = prog(t, s, 1); g.visible = p > 0; g.scale.set(1, Math.max(0.001, easeOutBack(p, 1.6)), 1); } }]
    };
  },

  // 朱红拱桥：按弧线分段，从一端逐段搭到另一端
  redBridge(ctx, [[x, z], ry, len], s) {
    const g = new THREE.Group(); g.position.set(x, 1.3, z); g.rotation.y = ry; ctx.root.add(g);
    const N = 12, arcH = len * 0.16, segs = [];
    for (let i = 0; i < N; i++) {
      const u0 = i / N, u1 = (i + 1) / N, x0 = (u0 - 0.5) * len, x1 = (u1 - 0.5) * len;
      const y0 = Math.sin(Math.PI * u0) * arcH, y1 = Math.sin(Math.PI * u1) * arcH, ang = Math.atan2(y1 - y0, x1 - x0), sl = Math.hypot(x1 - x0, y1 - y0) * 1.04;
      const seg = new THREE.Group(); seg.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0); seg.rotation.z = ang;
      const deck = new THREE.Mesh(G.box, M.wood); deck.scale.set(sl, 0.25, 2.6);
      seg.add(deck);
      for (const zz of [-1.25, 1.25]) {
        const rail = new THREE.Mesh(G.box, M.vermilion); rail.scale.set(sl, 0.14, 0.14); rail.position.set(0, 0.9, zz); seg.add(rail);
        const post = new THREE.Mesh(G.box, M.vermilion); post.scale.set(0.16, 0.9, 0.16); post.position.set(-sl / 2, 0.45, zz); seg.add(post);
      }
      seg.traverse(o => { if (o.isMesh) o.castShadow = true; });
      g.add(seg); segs.push({ seg, u: u1 });
    }
    return {
      dur: 1.2, adv: 0.5, anim: 'lay', bbox: new THREE.Box3(V3(x - len / 2, 1, z - len / 2), V3(x + len / 2, 2 + arcH, z + len / 2)),
      actors: [{ apply(t) { const p = prog(t, s, 1.2); g.visible = p > 0; for (const q of segs) q.seg.visible = q.u <= p + 1e-6; } }]
    };
  },

  // 新干线：沿环线铁轨跑的白色列车
  train(ctx, [pts, n = 6], s) {
    const loop = makeLoop(pts), cars = [], bodyMat = std('#F7F9FC', { roughness: 0.35 }), stripeMat = std('#1F5FBF', { roughness: 0.4 }), winMat = std('#25344D', { roughness: 0.2 });
    for (let i = 0; i < n; i++) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new RoundedBoxGeometry(1.5, 1.35, 4.3, 3, i === 0 || i === n - 1 ? 0.6 : 0.3), bodyMat); body.position.y = 0.68;
      const stripe = new THREE.Mesh(G.box, stripeMat); stripe.scale.set(1.53, 0.18, 4.0); stripe.position.y = 0.45;
      const win = new THREE.Mesh(G.box, winMat); win.scale.set(1.53, 0.32, 3.4); win.position.y = 0.98;
      [body, stripe, win].forEach(m => { m.castShadow = true; g.add(m); });
      ctx.root.add(g); cars.push(g);
    }
    return {
      dur: 1.2, adv: 0.3, anim: 'path', bbox: pts.reduce((b, [x, z]) => b.expandByPoint(V3(x, 1, z)).expandByPoint(V3(x, 3, z)), new THREE.Box3()),
      actors: [{
        apply(t) {
          const p = prog(t, s, 1.2), head = amb(t - s) * 22;
          cars.forEach((g, i) => {
            g.visible = p > 0; if (!g.visible) return;
            const q = loopAt(loop, head - i * 4.55, 0);
            g.position.set(q.x, 1.4, q.z); g.rotation.y = Math.atan2(q.dx, q.dz); g.scale.setScalar(easeOutBack(clamp01(p * 1.5 - i * 0.08), 1.5));
          });
        }
      }]
    };
  },

  // 樱花花瓣：从空中飘落，循环
  petals(ctx, [n, [x1, z1, x2, z2]], s) {
    const P = ctx.pools.petal, items = [];
    for (let i = 0; i < n; i++) items.push({ i: P.alloc(), x: ctx.r(x1, x2), z: ctx.r(z1, z2), off: ctx.r(0, 20), v: ctx.r(1.2, 2.2), ph: ctx.r(0, 6.28) });
    return {
      dur: 1.5, adv: 0.3, anim: 'loop', bbox: new THREE.Box3(V3(x1, 2, z1), V3(x2, 22, z2)),
      actors: [{
        apply(t) {
          const p = prog(t, s, 1.5);
          for (const q of items) {
            if (p <= 0) { P.hide(q.i); continue; }
            const ta = amb(t), y = 22 - ((ta * q.v + q.off) % 20), k = p;
            P.set(q.i, mat(q.x + Math.sin(ta * 0.8 + q.ph) * 2, y, q.z + Math.cos(ta * 0.6 + q.ph) * 1.5, ta * 1.7 + q.ph, k, k, k, ta * 2.3 + q.ph, ta * 1.1));
          }
        }
      }]
    };
  },

  dunes(ctx, [n, [x1, z1, x2, z2], kind], s) {   // kind 'grass' = 绿色山丘
    const actors = [], dur = 2;
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(G.dune, kind === 'grass' ? M.grass : M.dune); m.castShadow = m.receiveShadow = true;
      const hill = kind === 'grass';
      const x = ctx.r(x1, x2), z = ctx.r(z1, z2), sx = hill ? ctx.r(6, 10) : ctx.r(11, 19), sy = hill ? ctx.r(1.6, 3) : ctx.r(1.2, 2.6), sz = hill ? ctx.r(3.5, 5) : ctx.r(5, 8), st = s + dur * i / n * 0.7;
      m.position.set(x, 0.9, z); m.rotation.y = ctx.r(0, 3); ctx.root.add(m);
      actors.push({ apply(t) { const p = prog(t, st, 0.8); m.visible = p > 0; m.scale.set(sx, sy * easeOutBack(p) + 0.001, sz); } });
    }
    return { dur, adv: 0.5, anim: 'grow', actors, bbox: new THREE.Box3(V3(x1, 1, z1), V3(x2, 5, z2)) };
  },

  umbrellas(ctx, [[x1, z1], [x2, z2], n], s) {
    const P = ctx.pools, items = [], dur = 1.6;
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n, x = lerp(x1, x2, u) + ctx.r(-1, 1), z = lerp(z1, z2, u) + ctx.r(-0.8, 0.8);
      if (!ctx.free(x, z, 1.2, 1.2)) continue;   // 给路口、运河、地标让位
      const ic = P.canopy.alloc(); P.pole.alloc(); P.canopy.color(ic, ctx.pick(PAL.umbrella));
      items.push({ i: ic, x, z, st: s + dur * u * 0.7, tilt: ctx.r(-0.12, 0.12) });
    }
    return {
      dur, adv: 0.5, anim: 'pop', bbox: new THREE.Box3(V3(x1, 1, z1 - 1), V3(x2, 3.5, z2 + 1)),
      actors: [{ apply(t) { for (const c of items) { const p = prog(t, c.st, 0.5); if (p <= 0) { P.canopy.hide(c.i); P.pole.hide(c.i); continue; } const k = easeOutBack(p, 2); mat(c.x, 1.0, c.z, 0, k, k, k, c.tilt); P.canopy.set(c.i, _m); P.pole.set(c.i, _m); } } }]
    };
  },

  road(ctx, [A, B, flag], s) {
    // flag: 'bridge' 跨水桥面（白色桥身 + 桥墩）；'pier' 木栈桥（无沥青、无标线）；'rail' 铁轨（碎石道床 + 枕木 + 双轨）
    const bridge = flag === 'bridge', pier = flag === 'pier', rail = flag === 'rail', dx = B[0] - A[0], dz = B[1] - A[1], L = Math.hypot(dx, dz), th = Math.atan2(-dz, dx);
    const hw = pier ? 1.4 : rail ? 1.8 : 2.3;
    // e0/e1：两端在转角、丁字口与别的路相接时向外多铺半个路宽（编译完由 joinRoads 填入），补齐转角缺口
    const rec = { A, B, hw, bridge, kind: pier ? 'pier' : rail ? 'rail' : 'road', e0: 0, e1: 0 }; ctx.roads.push(rec);
    const g = new THREE.Group(); g.position.set(A[0], 0, A[1]); g.rotation.y = th; ctx.root.add(g);
    const side = new THREE.Mesh(G.box, pier ? M.wood : rail ? M.gravel : bridge ? M.white : M.sidewalk), asph = new THREE.Mesh(G.box, rail ? M.sleeper : M.asphalt);
    side.receiveShadow = asph.receiveShadow = true; side.castShadow = bridge || pier;
    const sideY0 = pier ? 0.95 : bridge ? 0.55 : 0.93, sideH = (pier ? 1.25 : 1.33) - sideY0;
    const sideW = rail ? 3.6 : 4.6, asphW = rail ? 2.6 : 3.3;
    g.add(side); if (!pier) g.add(asph);
    const steel = rail ? [-0.72, 0.72].map(z => { const m = new THREE.Mesh(G.box, M.railSteel); m.position.z = z; g.add(m); return m; }) : [];
    const pillars = [];
    if (bridge || pier) for (let x = 2; x < L - 1; x += pier ? 2.6 : 3.4) {
      const p = new THREE.Mesh(G.box, pier ? M.wood : M.white); p.scale.set(pier ? 0.35 : 0.7, 1.6, pier ? 2.4 : 2.6); p.position.set(x, pier ? 0.2 : -0.25, 0); p.castShadow = true; g.add(p); pillars.push(p);
    }
    const P = ctx.pools.dash, dashes = [];
    if (!pier && !rail) for (let d = 1.6; d < L - 1; d += 3) dashes.push({ i: P.alloc(), d });
    rec.dashes = dashes;
    const dur = 1.3, cos = Math.cos(th), sin = Math.sin(th);
    return {
      dur, adv: 0.6, anim: 'lay',
      bbox: new THREE.Box3(V3(Math.min(A[0], B[0]) - hw, 0.9, Math.min(A[1], B[1]) - hw), V3(Math.max(A[0], B[0]) + hw, 1.5, Math.max(A[1], B[1]) + hw)),
      actors: [{
        apply(t) {
          const p = easeOutCubic(prog(t, s, dur)), len = Math.max(0.001, L * p);
          g.visible = p > 0;
          // 路面沿本地 x 从 -e0 铺到 len+e1；人行道与沥青按各自半宽外伸，转角正好拼成方块
          const strip = (m, half, y, h, wd) => { const a = -rec.e0 * half, b = len + rec.e1 * half * p; m.scale.set(b - a, h, wd); m.position.set((a + b) / 2, y, 0); };
          strip(side, sideW / 2, sideY0 + sideH / 2, sideH, sideW);
          strip(asph, asphW / 2, 1.33, 0.1, asphW);
          for (const m of steel) strip(m, asphW / 2, 1.43, 0.14, 0.16);
          for (const pl of pillars) pl.visible = pl.position.x < len;
          const p2 = L * easeOutCubic(prog(t, s + 0.35, dur));
          for (const q of dashes) {
            if (q.d > p2) { P.hide(q.i); continue; }
            P.set(q.i, mat(A[0] + cos * q.d, 1.395, A[1] - sin * q.d, th, 1.3, 0.03, 0.18));
          }
        }
      }]
    };
  },

  palmsLine(ctx, [[x1, z1], [x2, z2], n], s) {
    const actors = [], dur = 1.8, bb = new THREE.Box3();
    for (let i = 0; i < n; i++) {
      const u = n === 1 ? 0.5 : i / (n - 1);
      const x = lerp(x1, x2, u) + ctx.r(-0.3, 0.3), z = lerp(z1, z2, u) + ctx.r(-0.3, 0.3);
      if (ctx.roads.some(r => Math.abs(r.A[0] - r.B[0]) < 0.01 && Math.abs(x - r.A[0]) < r.hw + 0.3 && z > Math.min(r.A[1], r.B[1]) - 1 && z < Math.max(r.A[1], r.B[1]) + 1)) continue;
      actors.push(palmActor(ctx, x, ctx.groundY(x, z), z, 1, s + dur * u * 0.75, 0.7));
      bb.expandByPoint(V3(x, 1, z)); bb.expandByPoint(V3(x, 6, z));
    }
    return { dur, adv: 0.45, anim: 'grow', actors, bbox: bb };
  },

  lake(ctx, [[x, z], r], s) {
    ctx.circles.push({ x, z, r: r + 1.6 });
    const g = new THREE.Group(); g.position.set(x, 0, z); ctx.root.add(g);
    const prom = new THREE.Mesh(new THREE.CircleGeometry(r + 1.5, 72).rotateX(-Math.PI / 2), M.stone); prom.position.y = 1.27;
    const water = new THREE.Mesh(new THREE.CircleGeometry(r, 72).rotateX(-Math.PI / 2), M.lake); water.position.y = 1.29;
    const plaza = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.4, 0.12, 48), M.stone); plaza.position.y = 1.32;
    const bridgeW = new THREE.Mesh(G.box, M.stone); bridgeW.scale.set(1.6, 0.1, r - 4); bridgeW.position.set(0, 1.31, 4 + (r - 4) / 2);
    for (const m of [prom, water, plaza, bridgeW]) { m.receiveShadow = true; g.add(m); }
    const dur = 1.4;
    return {
      dur, adv: 1.1, anim: 'grow', bbox: new THREE.Box3(V3(x - r - 1.5, 1.2, z - r - 1.5), V3(x + r + 1.5, 1.5, z + r + 1.5)),
      actors: [{ apply(t) { const p = prog(t, s, dur); g.visible = p > 0; const k = Math.max(0.001, easeOutBack(p, 1.2)); g.scale.set(k, 1, k); } }]
    };
  },

  fountain(ctx, [[x, z], r, n], s) {
    const jets = [];
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2, m = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.22, 1, 8).translate(0, 0.5, 0), M.water);
      m.position.set(x + Math.cos(a) * r, 1.29, z + Math.sin(a) * r); ctx.root.add(m); jets.push(m);
    }
    return {
      dur: 1, adv: 0.4, anim: 'loop', bbox: new THREE.Box3(V3(x - r, 1.2, z - r), V3(x + r, 5, z + r)),
      actors: [{ apply(t) { const p = prog(t, s, 1); jets.forEach((m, i) => { m.visible = p > 0; m.scale.set(1, Math.max(0.01, p * (2.2 + 1.3 * Math.sin(amb(t) * 2.6 + i * 0.9))), 1); }); } }]
    };
  },

  landmark(ctx, [id], s) {
    const L = ctx.LM[id]; if (!L) return {};
    const cfg = L.cfg, dur = cfg.dur;
    return {
      dur, adv: dur * 0.5, anim: 'grow-clip',
      bbox: new THREE.Box3(V3(cfg.pos[0] - cfg.r, cfg.base, cfg.pos[1] - cfg.r), V3(cfg.pos[0] + cfg.r, cfg.base + cfg.h, cfg.pos[1] + cfg.r)),
      actors: [{ landmark: id, apply(t) { applyLandmark(L, t, s, dur); } }]
    };
  },

  block(ctx, [[x1, z1, x2, z2], n, style], s) {
    const actors = [], bb = new THREE.Box3(), dur = 2.4, placed = [];
    for (let tries = 0; placed.length < n && tries < 600; tries++) {
      // 'wa' 和式町屋（矮房+坡顶）、'paris' 奶油色公寓+石板坡顶、'adobe' 沙色平顶土房
      const wa = style === 'wa', paris = style === 'paris', adobe = style === 'adobe', roofed = wa || paris;
      const pop = roofed || adobe || style === 'shops' || (style === 'mixed' && ctx.rng() < 0.45);
      const w = wa ? ctx.r(3, 4.6) : pop ? ctx.r(3.2, 5) : ctx.r(4, 6.4), d = wa ? ctx.r(3, 4.2) : pop ? ctx.r(3.2, 5) : ctx.r(4, 6.4);
      if (w > x2 - x1 || d > z2 - z1) continue;
      const x = ctx.r(x1 + w / 2, x2 - w / 2), z = ctx.r(z1 + d / 2, z2 - d / 2);
      if (!ctx.free(x, z, w, d)) continue;
      ctx.rects.push({ x, z, w, d });
      const h = wa ? ctx.r(2.2, 3.8) : paris ? ctx.r(4.5, 7.5) : adobe ? ctx.r(2.5, 6) : style === 'shops' ? ctx.r(3, 7) : pop ? ctx.r(5, 14) : (ctx.rng() < 0.15 ? ctx.r(26, 34) : ctx.r(10, 24));
      const b = { x, z, w, d, h, style, base: ctx.groundY(x, z), color: ctx.pick(wa ? PAL.wa : paris ? PAL.paris : adobe ? PAL.adobe : pop ? PAL.pop : PAL.glass) };
      if (roofed) { b.gable = { h: paris ? ctx.r(1, 1.5) : ctx.r(1.3, 2), color: ctx.pick(paris ? PAL.slate : PAL.waRoof) }; b.ry = ctx.rng() < 0.5 ? 0 : Math.PI / 2; }
      else if (adobe) { if (ctx.rng() < 0.3) { b.pad = true; b.padR = Math.min(w, d) * 0.25; } }
      else {
        if (!pop && ctx.rng() < 0.38) b.crown = { w: w * 0.62, d: d * 0.62, h: h * ctx.r(0.12, 0.25) };
        if (ctx.rng() < 0.3) b.ant = true; else if (!pop && ctx.rng() < 0.55) { b.pad = true; b.padR = Math.min(w, d) * 0.3; }
      }
      placed.push(b);
    }
    placed.sort((a, b) => (a.x + a.z * 0.3) - (b.x + b.z * 0.3));
    placed.forEach((b, i) => { actors.push(towerActor(ctx, b, s + i * dur * 0.75 / Math.max(1, placed.length), 0.9)); bb.union(towerBox(b)); });
    return { dur, adv: 0.6, anim: 'drop', actors, bbox: bb };
  },

  fronds(ctx, [[ax, az], [bx, bz], n], s) {
    const actors = [], bb = new THREE.Box3(), dur = 3, cr = { x: 0, z: 22, R: 33 - 1.3 - 2.2 };
    let k = 0;
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1), z0 = lerp(az, bz, u), beta = lerp(-12, 34, u) * Math.PI / 180;
      for (const sgn of [-1, 1]) {
        const x0 = ax + sgn * 1.6, dx = sgn * Math.cos(beta), dz = Math.sin(beta);
        let L = 24; while (L > 6 && Math.hypot(x0 + dx * L - cr.x, z0 + dz * L - cr.z) > cr.R - 1.6) L -= 0.5;
        const B = [x0 + dx * L, z0 + dz * L];
        const f = { A: [x0, z0], B, r: 1.6, ang: Math.atan2(-dz, dx) };
        ctx.fronds.push(f);
        const st = s + (k++) / (2 * n) * (dur - 1.4);
        const res = islandActor(ctx, 'capsule', [[x0, z0, B[0], B[1]], 1.6], st, 1.4, 'frond', { splash: false });
        actors.push(...res.actors); bb.union(res.bbox);
      }
    }
    return { dur, adv: 1.2, anim: 'rise', actors, bbox: bb };
  },

  frondVillas(ctx, [k], s) {
    const actors = [], bb = new THREE.Box3(), dur = 2, n = ctx.fronds.length * k;
    let j = 0;
    ctx.fronds.forEach((f, fi) => {
      for (let q = 0; q < k; q++) {
        const u = 0.42 + q * 0.42, side = (q + fi) % 2 ? 1 : -1;
        const dx = f.B[0] - f.A[0], dz = f.B[1] - f.A[1], L = Math.hypot(dx, dz), nx = -dz / L, nz = dx / L;
        const x = f.A[0] + dx * u + nx * side * 0.55, z = f.A[1] + dz * u + nz * side * 0.55;
        const b = { x, z, w: 1.9, d: 1.5, h: 1.25, base: 1.0, ry: f.ang, color: ctx.pick(PAL.villa), roof: ctx.pick(PAL.roof), dropH: 12 };
        actors.push(towerActor(ctx, b, s + (j++) / n * (dur - 0.8), 0.8)); bb.union(towerBox(b));
      }
    });
    return { dur, adv: 0.6, anim: 'drop', actors, bbox: bb };
  },

  frondPalms(ctx, [k], s) {
    const actors = [], bb = new THREE.Box3(), dur = 2, n = ctx.fronds.length * k;
    let j = 0;
    ctx.fronds.forEach((f, fi) => {
      for (let q = 0; q < k; q++) {
        const u = 0.22 + q * 0.5 + 0.12 * (fi % 2), side = (q + fi) % 2 ? -1 : 1;
        const dx = f.B[0] - f.A[0], dz = f.B[1] - f.A[1], L = Math.hypot(dx, dz);
        const x = f.A[0] + dx * u - dz / L * side * 0.7, z = f.A[1] + dz * u + dx / L * side * 0.7;
        actors.push(palmActor(ctx, x, 1.0, z, 0.8, s + (j++) / n * (dur - 0.7), 0.7)); bb.expandByPoint(V3(x, 1, z)); bb.expandByPoint(V3(x, 5, z));
      }
    });
    return { dur, adv: 0.6, anim: 'grow', actors, bbox: bb };
  },

  crescentPalms(ctx, [n], s) {
    const c = ctx.crescent; if (!c) return {};
    const actors = [], bb = new THREE.Box3(), dur = 2.2, A = c.deg * Math.PI / 180;
    for (let i = 0; i < n; i++) {
      const phi = lerp(-A + 0.06, A - 0.06, i / (n - 1));
      if (Math.abs(phi) < 0.2) continue;   // 月牙顶端留给亚特兰蒂斯
      const x = c.cx + c.R * Math.sin(phi), z = c.cz + c.R * Math.cos(phi);
      actors.push(palmActor(ctx, x, 1.0, z, 0.85, s + Math.abs(i - n / 2) / (n / 2) * (dur - 0.7), 0.7));
      bb.expandByPoint(V3(x, 1, z)); bb.expandByPoint(V3(x, 5, z));
    }
    return { dur, adv: 0.6, anim: 'grow', actors, bbox: bb };
  },

  heli(ctx, [[cx, cz], R, H], s) {
    const g = new THREE.Group(), body = new THREE.Group();
    const cab = new THREE.Mesh(new THREE.SphereGeometry(0.9, 16, 12), M.white); cab.scale.set(1, 0.85, 1.5);
    const glass = new THREE.Mesh(new THREE.SphereGeometry(0.6, 12, 10), M.carTop); glass.position.set(0, 0.15, 0.75);
    const tail = new THREE.Mesh(G.box, M.red); tail.scale.set(0.22, 0.22, 2.6); tail.position.set(0, 0.2, -2.0);
    const rotor = new THREE.Mesh(G.box, M.pad); rotor.scale.set(6, 0.05, 0.28); rotor.position.y = 0.95;
    const skid = new THREE.Mesh(G.box, M.pad); skid.scale.set(1.4, 0.08, 1.8); skid.position.y = -0.85;
    body.add(cab, glass, tail, rotor, skid); g.add(body); ctx.root.add(g);
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    return {
      dur: 1, adv: 0.4, anim: 'path', bbox: new THREE.Box3(V3(cx - R, H - 2, cz - R), V3(cx + R, H + 2, cz + R)),
      actors: [{
        apply(t) {
          const p = prog(t, s, 1.5); g.visible = p > 0; if (!g.visible) return;
          const a = amb(t - s) * 0.55;
          g.position.set(cx + Math.cos(a) * R, lerp(8, H, easeOutCubic(p)) + Math.sin(amb(t) * 1.7) * 0.4, cz + Math.sin(a) * R);
          g.rotation.set(0, Math.atan2(-Math.sin(a), Math.cos(a)), 0);
          body.rotation.z = -0.12; rotor.rotation.y = amb(t) * 28; g.scale.setScalar(easeOutBack(p) * 1.1);
        }
      }]
    };
  },

  // loops：每条是一串路口坐标，首尾相连成环（两点即来回跑）；车按路线长度分配
  cars(ctx, [n, paths], s) {
    const lens = paths.map(p => p.reduce((a, q, i) => a + Math.hypot(...[0, 1].map(k => p[(i + 1) % p.length][k] - q[k])), 0)), sum = lens.reduce((a, b) => a + b, 0);
    const P = ctx.pools, loops = paths.map((pts, i) => ({ pts, k: lens[i] / sum })).map(l => { const segs = []; let tot = 0; for (let i = 0; i < l.pts.length; i++) { const a = l.pts[i], b = l.pts[(i + 1) % l.pts.length], len = Math.hypot(b[0] - a[0], b[1] - a[1]); segs.push({ a, b, len, s0: tot }); tot += len; } return { ...l, segs, tot }; });
    const cars = [];
    for (let i = 0; i < n; i++) {
      let u = ctx.rng(), li = 0; for (; li < loops.length - 1 && u > loops[li].k; li++) u -= loops[li].k;
      const ib = P.carBody.alloc(); P.carTop.alloc(); P.carBody.color(ib, i === 0 ? new THREE.Color('#FF7A1A') : ctx.pick(PAL.car));
      cars.push({ i: ib, pose:new THREE.Matrix4(), loop: loops[li], off: ctx.r(0, loops[li].tot), v: i === 0 ? 16 : ctx.r(8, 12), st: s + i / n * 1.2 });
    }
    if (ctx.city.id === 'dubai') spaceDubaiTraffic(cars, loops[0]);
    ctx.vehicles.push(...cars);
    return {
      dur: 1.6, adv: 0.3, anim: 'path', bbox: paths.flat().reduce((b, [x, z]) => b.expandByPoint(V3(x, 1, z)).expandByPoint(V3(x, 3, z)), new THREE.Box3()),
      actors: [{
        apply(t) {
          for (const c of cars) {
            const p = prog(t, c.st, 0.4); if (p <= 0) { P.carBody.hide(c.i); P.carTop.hide(c.i); continue; }
            c.distance = amb(t - s) * c.v;
            let d = ((c.off + c.distance) % c.loop.tot + c.loop.tot) % c.loop.tot, sg = c.loop.segs[0];
            for (const q of c.loop.segs) if (d >= q.s0 && d < q.s0 + q.len) { sg = q; break; }
            const u = (d - sg.s0) / sg.len, dx = (sg.b[0] - sg.a[0]) / sg.len, dz = (sg.b[1] - sg.a[1]) / sg.len;
            const x = sg.a[0] + (sg.b[0] - sg.a[0]) * u - dz * 0.8, z = sg.a[1] + (sg.b[1] - sg.a[1]) * u + dx * 0.8;
            const k = easeOutBack(p, 2);
            mat(x, 1.66, z, Math.atan2(dx, dz), k, k, k); c.pose.copy(_m); P.carBody.set(c.i, _m); P.carTop.set(c.i, _m);
          }
        }
      }]
    };
  },

  yachts(ctx, [n, circles], s) {   // circles: [[cx,cz,R],...] 海上的环形航线
    const wakeTex = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 256; const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(26, 0); g.lineTo(38, 0); g.lineTo(64, 256); g.lineTo(0, 256); g.fill(); const t = new THREE.CanvasTexture(c); return t; })();
    const wakeMat = new THREE.MeshBasicMaterial({ map: wakeTex, transparent: true, depthWrite: false });
    const boats = [];
    for (let i = 0; i < n; i++) {
      const [cx, cz, R] = circles[i % circles.length], g = new THREE.Group();
      const hull = new THREE.Mesh(new THREE.CapsuleGeometry(0.75, 3.2, 4, 12).rotateX(Math.PI / 2), M.white); hull.scale.set(1, 0.55, 1); hull.position.y = 0.35;
      const cabin = new THREE.Mesh(G.rbox, M.navy); cabin.scale.set(1, 0.7, 1.8); cabin.position.set(0, 1.0, -0.3);
      const wake = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 11).rotateX(-Math.PI / 2), wakeMat); wake.position.set(0, 0.06, -7);
      hull.castShadow = cabin.castShadow = true; g.add(hull, cabin, wake); ctx.root.add(g);
      boats.push({ g, cx, cz, R, a0: ctx.r(0, 6.28), w: (ctx.rng() < 0.5 ? -1 : 1) * ctx.r(0.12, 0.2), st: s + i * 0.25 });
    }
    return {
      dur: 1.6, adv: 0.3, anim: 'path', bbox: new THREE.Box3(V3(-90, 0, -30), V3(90, 3, 80)),
      actors: [{
        apply(t) {
          for (const b of boats) {
            const p = prog(t, b.st, 0.8); b.g.visible = p > 0; if (!b.g.visible) continue;
            const a = b.a0 + amb(t - s) * b.w, x = b.cx + Math.cos(a) * b.R, z = b.cz + Math.sin(a) * b.R;
            const dx = -Math.sin(a) * Math.sign(b.w), dz = Math.cos(a) * Math.sign(b.w);
            b.g.position.set(x, Math.sin(amb(t) * 2 + b.a0) * 0.08, z); b.g.rotation.set(0, Math.atan2(dx, dz), Math.sin(amb(t) * 1.6 + b.a0) * 0.04);
            b.g.scale.setScalar(easeOutBack(p));
          }
        }
      }]
    };
  },

  gulls(ctx, [n], s) {
    const birds = [];
    for (let i = 0; i < n; i++) {
      const g = new THREE.Group(), body = new THREE.Mesh(G.box, M.white); body.scale.set(0.3, 0.25, 0.9); g.add(body);
      const wings = [-1, 1].map(sg => { const pv = new THREE.Group(), w = new THREE.Mesh(G.box, M.white); w.scale.set(1.5, 0.06, 0.45); w.position.x = sg * 0.75; pv.add(w); g.add(pv); return pv; });
      g.scale.setScalar(0.9); ctx.root.add(g);
      birds.push({ g, wings, cx: ctx.r(-40, 40), cz: ctx.r(-40, 40), R: ctx.r(14, 32), H: ctx.r(26, 42), a0: ctx.r(0, 6.28), w: ctx.r(0.25, 0.4), ph: ctx.r(0, 6.28), st: s + i * 0.08 });
    }
    return {
      dur: 1.6, adv: 0.3, anim: 'path', bbox: new THREE.Box3(V3(-70, 24, -70), V3(70, 44, 70)),
      actors: [{
        apply(t) {
          for (const b of birds) {
            const p = prog(t, b.st, 1); b.g.visible = p > 0; if (!b.g.visible) continue;
            const a = b.a0 + amb(t - s) * b.w;
            b.g.position.set(b.cx + Math.cos(a) * b.R, b.H + Math.sin(amb(t) + b.ph) * 1.5, b.cz + Math.sin(a) * b.R);
            b.g.rotation.set(0, Math.atan2(-Math.sin(a), Math.cos(a)), -0.25);
            const f = Math.sin(amb(t) * 7 + b.ph) * 0.55; b.wings[0].rotation.z = -f; b.wings[1].rotation.z = f;
          }
        }
      }]
    };
  },

  balloon(ctx, [[x, z]], s) {
    const g = new THREE.Group();
    const geo = new THREE.SphereGeometry(2.6, 24, 16); const col = [], pos = geo.attributes.position;
    const cs = ['#F0605D', '#F7C948', '#4FA8F0', '#FFFFFF'].map(c => new THREE.Color(c));
    for (let i = 0; i < pos.count; i++) { const a = Math.atan2(pos.getZ(i), pos.getX(i)); const c = cs[Math.floor((a + Math.PI) / (Math.PI * 2) * 12) % 4]; col.push(c.r, c.g, c.b); }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const env = new THREE.Mesh(geo, std('#ffffff', { vertexColors: true, roughness: 0.6 })); env.scale.set(1, 1.15, 1);
    const basket = new THREE.Mesh(G.rbox, std('#A8774A')); basket.scale.set(1, 0.8, 1); basket.position.y = -3.9;
    env.castShadow = basket.castShadow = true; g.add(env, basket); ctx.root.add(g);
    return {
      dur: 3, adv: 0.3, anim: 'rise', bbox: new THREE.Box3(V3(x - 3, 1, z - 3), V3(x + 3, 40, z + 3)),
      actors: [{ apply(t) { const p = prog(t, s, 3); g.visible = p > 0; const u = Math.max(0, t - s); g.position.set(x + u * 0.25, 5 + Math.min(36, u * 2.6) * smooth(u / 14 + 0.2) + Math.sin(amb(t) * 0.9) * 0.4, z - u * 0.15); g.scale.setScalar(easeOutBack(p)); } }]
    };
  },

  // sign(文字, [x,z], 朝向, 底座高度, 字号)
  sign(ctx, [text, [x, z], ry = -0.45, y0 = 0, size = 4.6], s) {
    const g = new THREE.Group(); g.position.set(x, y0, z); g.rotation.y = ry; ctx.root.add(g);
    const inner = new THREE.Group(); inner.scale.setScalar(size / 4.6); g.add(inner);
    const plat = new THREE.Mesh(G.rbox, M.white); plat.scale.set(text.length * 4.4 + 2, 0.8, 4); plat.position.y = 0.4; plat.castShadow = plat.receiveShadow = true; inner.add(plat);
    new FontLoader().load('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/helvetiker_bold.typeface.json', font => {
      const geo = new TextGeometry(text, { font, size: 4.6, height: 1.4, curveSegments: 6, bevelEnabled: true, bevelThickness: 0.25, bevelSize: 0.18, bevelSegments: 3 });
      geo.computeBoundingBox(); const bb = geo.boundingBox; geo.translate(-(bb.max.x + bb.min.x) / 2, 0, -0.7);
      const m = new THREE.Mesh(geo, std('#7FD4FF', { roughness: 0.35, emissive: '#2a8fd0', emissiveIntensity: 0.25 })); m.position.y = 0.8; m.castShadow = true; inner.add(m);
      plat.scale.x = bb.max.x - bb.min.x + 3;
    });
    const k = size / 4.6;
    return {
      dur: 1.8, adv: 0.4, anim: 'rise', bbox: new THREE.Box3(V3(x - 14 * k * text.length / 5, y0, z - 4 * k), V3(x + 14 * k * text.length / 5, y0 + 7 * k, z + 4 * k)),
      actors: [{ apply(t) { const p = prog(t, s, 1.8); g.visible = p > 0; g.position.y = y0 - 7 * k * (1 - easeOutBack(p, 1.3)) + Math.sin(amb(t) * 1.4) * 0.15 * k; } }]
    };
  },


};


function islandActor(ctx, kind, rest, s, dur, id, opt = {}) {
  const outline = o => OUTLINE[kind](...rest, o);
  ctx.islands.push({ kind, args: rest });
  if (kind === 'crescent') ctx.crescent = { cx: rest[0][0], cz: rest[0][1], R: rest[1], w: rest[2], deg: rest[3] };
  const depth = 3.2, bt = 0.35;
  const geo = new THREE.ExtrudeGeometry(toShape(outline(0)), { depth, bevelEnabled: true, bevelThickness: bt, bevelSize: 0.45, bevelSegments: 3, curveSegments: 12 }).rotateX(-Math.PI / 2);
  const land = new THREE.Mesh(geo, [M.sand, M.sandSide]); land.castShadow = false; land.receiveShadow = true;
  const flats = [
    { m: new THREE.Mesh(flatGeo(outline(6.5)), new THREE.MeshBasicMaterial({ color: '#2FB2E2', transparent: true, depthWrite: false })), y: 0.04, op: 0.6 },
    { m: new THREE.Mesh(flatGeo(outline(2.8)), new THREE.MeshBasicMaterial({ color: '#52DCE3', transparent: true, depthWrite: false })), y: 0.08, op: 0.9 },
    { m: new THREE.Mesh(flatGeo(outline(1.15)), new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, depthWrite: false })), y: 0.12, op: 0.92 },
  ];
  ctx.root.add(land); flats.forEach((f, i) => { f.m.userData.shoreline = true; f.m.position.y = f.y; f.m.renderOrder = -3 + i; ctx.root.add(f.m); });
  const bbox = boxOf(outline(0), -1, 1.1), ctr = bbox.getCenter(V3()), rad = Math.max(bbox.max.x - bbox.min.x, bbox.max.z - bbox.min.z) / 2;
  let splash = null;
  if (opt.splash !== false && kind !== 'crescent') {
    splash = new THREE.Mesh(G.ring, new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, depthWrite: false, side: THREE.DoubleSide }));
    splash.position.set(ctr.x, 0.2, ctr.z); ctx.root.add(splash);
  }
  return {
    bbox,
    actors: [{
      apply(t) {
        const p = prog(t, s, dur), on = p > 0;
        land.visible = on; flats.forEach(f => f.m.visible = on);
        if (!on) { if (splash) splash.visible = false; return; }
        land.position.y = 1.0 - depth - bt - 4.6 * (1 - easeOutBack(p, 1.15));
        flats.forEach((f, i) => f.m.material.opacity = f.op * smooth((p - i * 0.12) / 0.6));
        if (splash) {
          const q = prog(t, s + dur * 0.25, 1.8);
          splash.visible = q > 0 && q < 1;
          const k = rad * (1.02 + q * 0.45); splash.scale.set(k, 1, k);
          splash.material.opacity = 0.85 * (1 - q);
        }
      }
    }]
  };
}

function applyLandmark(L, t, s, dur) {
  const cfg = L.cfg, p = prog(t, s, dur), on = p > 0;
  L.holder.visible = on;
  const top = cfg.base + L.H * 1.03 * easeOutCubic(p) + 0.02;
  L.plane.constant = p >= 1 ? 1e5 : top;
  L.scaffold.visible = on && !L.loaded;
  if (L.scaffold.visible) L.scaffold.scale.y = Math.max(0.02, cfg.h * easeOutCubic(p));
  L.holder.children.forEach(c => { if (c !== L.scaffold) c.visible = L.loaded; });
  // 扫描线
  L.scan.visible = on && p < 1 && L.loaded;
  if (L.scan.visible) {
    const r = Math.max(1.5, L.rXZ * (0.8 - 0.45 * p));
    L.scan.position.set(cfg.pos[0], top, cfg.pos[1]); L.scan.scale.set(r, 1, r);
    L.scan.material.opacity = 0.9 * Math.min(1, (1 - p) * 8);
  }
  // 完工光环
  const q = prog(t, s + dur, 1.3);
  L.burst.visible = q > 0 && q < 1;
  if (L.burst.visible) { const r = (L.rXZ + 1) * (1 + q * 2.6); L.burst.position.set(cfg.pos[0], cfg.base + 0.15, cfg.pos[1]); L.burst.scale.set(r, 1, r); L.burst.material.opacity = 1 - q; }
  // 名牌
  const lq = t - (s + dur);
  L.label.visible = lq > 0 && lq < 3.6;
  if (L.label.visible) {
    const a = easeOutBack(clamp01(lq / 0.45), 2), fade = 1 - clamp01((lq - 3.0) / 0.6);
    const sc = 0.3;   // 屏幕空间尺寸（sizeAttenuation: false）
    L.label.scale.set(sc * a, sc * a * 220 / 1024, 1);
    L.label.position.set(cfg.pos[0], cfg.base + cfg.h + 2, cfg.pos[1]);
    L.label.material.opacity = fade;
  }
}

/* =====================================================================
   6. 脚本解释器 + 时间轴
   ===================================================================== */
// Explore compiles only world geometry and ambient actors.
function compile(src, seed, city = CITY, LMc = LM, skip = null) {
  const root = new THREE.Group(); root.name = 'world';
  const ctx = new Ctx(root, seed, city, LMc);
  const entries = [], stages = [], lines = src.split('\n');
  let cursor = 0, stage = 0;
  lines.forEach((raw, i) => {
    const code = raw.replace(/\/\/.*$/, '').trim();
    if (!code) return;
    const m = code.match(/^(\w+)\((.*)\)$/);
    if (!m) { console.warn(`第 ${i + 1} 行无法解析:`, raw); return; }
    const [, cmd, argStr] = m;
    let args;
    try { args = argStr.trim() ? JSON.parse('[' + argStr.replace(/'/g, '"') + ']') : []; }
    catch (e) { console.warn(`第 ${i + 1} 行参数错误:`, raw); return; }
    if (skip && skip.has(cmd)) return;
    const fn = CMDS[cmd];
    if (!fn) { console.warn(`第 ${i + 1} 行未知指令:`, cmd); return; }
    if (cmd === 'stage') { stage = args[0]; cursor = args[2]; stages.push({ n: args[0], title: args[1], start: args[2], line: i + 1 }); }
    const spec = fn(ctx, args, cursor) || {};
    entries.push({ id: entries.length, line: i + 1, cmd, args, stage, start: +cursor.toFixed(3), duration: spec.dur || 0, anim: spec.anim || cmd, actors: spec.actors || [], bbox: spec.bbox || null });
    cursor += spec.adv || 0;
  });
  // 地标默认隐藏（脚本里没出现的地标不显示）
  const used = new Set(entries.flatMap(e => e.actors.filter(a => a.landmark).map(a => a.landmark)));
  for (const [id, L] of Object.entries(LMc)) if (!used.has(id)) { L.holder.visible = false; L.label.visible = false; L.scan.visible = false; L.burst.visible = false; }
  joinRoads(ctx.roads);
  ctx.camKeys.sort((a, b) => a.t - b.t);
  const world = { root, ctx, entries, stages, lines, T: ctx.T, camKeys: ctx.camKeys, orbit: ctx.orbit, title: ctx.title, tempo: BUILD_TEMPO };
  world.render = t => {
    TEMPO = world.tempo;
    for (const e of entries) for (const a of e.actors) a.apply(t);
    for (const k in ctx.pools) ctx.pools[k].flush();
  };
  return world;
}

// Completed city recipes share one world. Only ambient actors continue advancing.
const CITY_ORDER = ['dubai', 'abudhabi', 'tokyo', 'paris', 'newyork', 'lasvegas', 'rio', 'cairo', 'singapore', 'jakarta', 'sydney'];
const CITY_GRID = { dubai: [-345, -230], abudhabi: [-115, -230], tokyo: [115, -230], paris: [345, -230], newyork: [345, 0], lasvegas: [115, 0], rio: [-115, 0], cairo: [-345, 0], singapore: [-230, 230], jakarta: [0, 230], sydney: [230, 230] };
const SCENE_SKIP = new Set(['cam', 'orbit', 'clouds', 'title', 'end']);
function buildExploreWorld(seed) {
  const root = new THREE.Group(); root.name = 'explore-world';
  const cities = CITY_ORDER.map(id => {
    const city = CITIES[id], [ox, oz] = CITY_GRID[id];
    const lg = new THREE.Group(); lg.position.set(ox, 0, oz); landmarkLayer.add(lg);
    const cityLM = createLandmarks(city, lg);
    const w = compile(city.script, seed + ':' + id, city, cityLM, SCENE_SKIP); w.tempo = 1;
    w.root.position.set(ox, 0, oz); root.add(w.root);
    const hero = w.entries.filter(e => e.cmd === 'landmark').reduce((a, e) => !a || e.duration > a.duration ? e : a, null);
    const cfg = city.landmarks[hero.args[0]];
    const completedAt = Math.max(60, ...w.entries.map(e => e.start + e.duration + 2));
    const c = { id, city, w, hero, H: V3(ox + cfg.pos[0], cfg.base, oz + cfg.pos[1]), h: cfg.h,
      r: Math.max(cfg.r, cfg.h * 0.35), LM: cityLM, landmarkGroup: lg, completedAt };
    w.render(completedAt);
    realism.enhanceCity(c);
    return c;
  });
  const bridgePairs = [];
  CITY_ORDER.forEach((a, i) => CITY_ORDER.slice(i + 1).forEach(b => {
    const [ax, az] = CITY_GRID[a], [bx, bz] = CITY_GRID[b];
    if (Math.hypot(ax - bx, az - bz) < 270) bridgePairs.push([a, b]);
  }));
  // 探索模式的跨海桥：沿两城中心连线，从一座岛的岸边一直铺到另一座岛的岸边（可行走）
  const exploreBridges = [];
  for (const [a, b] of bridgePairs) {
    const ca = cities.find(c => c.id === a), cb = cities.find(c => c.id === b);
    const land = (c, x, z) => { const [ox, oz] = CITY_GRID[c.id]; return c.w.ctx.islands.some(il => insideShape(il.kind, il.args, x - ox, z - oz)); };
    const A = [CITY_GRID[a][0], CITY_GRID[a][1] - 10], B = [CITY_GRID[b][0], CITY_GRID[b][1] - 10], at = t => [lerp(A[0], B[0], t), lerp(A[1], B[1], t)];
    let tA = -1, tB = -1;
    for (let k = 0; k <= 100; k++) { const t = k / 200; if (land(ca, ...at(t))) tA = t; }
    for (let k = 200; k >= 100; k--) { const t = k / 200; if (land(cb, ...at(t))) tB = t; }
    if (tA < 0 || tB < 0) continue;
    const L = Math.hypot(B[0] - A[0], B[1] - A[1]), P0 = at(tA - 3 / L), P1 = at(tB + 3 / L), len = Math.hypot(P1[0] - P0[0], P1[1] - P0[1]);
    const g = new THREE.Group(); g.position.set(P0[0], 0, P0[1]); g.rotation.y = Math.atan2(-(P1[1] - P0[1]), P1[0] - P0[0]); root.add(g);
    const deck = new THREE.Mesh(G.box, M.white); deck.scale.set(len, 0.8, 7.4); deck.position.set(len / 2, 1.1, 0); deck.castShadow = deck.receiveShadow = true;
    const glow = new THREE.Mesh(G.box, new THREE.MeshBasicMaterial({ color: '#7FF3FF', transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
    glow.scale.set(len, 0.06, 1.2); glow.position.set(len / 2, 1.53, 0); g.add(deck, glow);
    for (const zz of [-3.5, 3.5]) { const rail = new THREE.Mesh(G.box, M.white); rail.scale.set(len, 0.5, 0.25); rail.position.set(len / 2, 1.75, zz); g.add(rail); }
    for (let x = 6; x < len - 4; x += 12) { const pr = new THREE.Mesh(G.box, M.white); pr.scale.set(1.4, 3.2, 3.4); pr.position.set(x, -0.4, 0); g.add(pr); }
    exploreBridges.push({ A: P0, B: P1, hw: 3.3 });
  }
  return {
    root, cities, explore: { bridges: exploreBridges },
    render(t) {
      for (const c of cities) {
        c.w.render(c.completedAt + t);
        for (const L of Object.values(c.LM)) L.label.visible = false;
      }
      sun.target.position.copy(controls.target).setY(0); setSun(40, 55);
      const hgt = Math.max(0, camera.position.y);
      scene.fog.near = 280 + hgt * 1.6; scene.fog.far = 1150 + hgt * 3.2;
      seaMat.uniforms.uFogNear.value = scene.fog.near; seaMat.uniforms.uFogFar.value = scene.fog.far;
    }
  };
}

const $ = id => document.getElementById(id);
const state = { music: false, last: performance.now(), userCam: true, playing: false };
let world = null;
// Instance pools cannot use per-mesh frustum culling. Cull entire distant cities
// instead, while keeping their actors, assets, collision data and UI available.
function updateCityVisibility(viewCamera, target, overview = false) {
  const range = 380 + Math.min(400, Math.max(0, viewCamera.position.y) * 0.75);
  const rangeSq = range * range;
  for (const c of world.cities) {
    const [x, z] = CITY_GRID[c.id];
    const distanceSq = p => (p.x - x) ** 2 + (p.z - z) ** 2;
    const visible = overview || Math.min(distanceSq(viewCamera.position), distanceSq(target)) <= rangeSq;
    c.w.root.visible = visible;
    c.landmarkGroup.visible = visible;
  }
}
function toast(msg) { const el = $('toast'); el.textContent = msg; el.style.display = 'block'; clearTimeout(toast.h); toast.h = setTimeout(() => el.style.display = 'none', 1800); }

// Optional city ambience begins only when the user enables sound.
const bgm = $('bgm'); bgm.src = CITIES.dubai.bgm; bgm.preload = 'none'; bgm.volume = 0.5; bgm.loop = true;
let musicNow = bgm, musicCity = EXPLORE ? 'dubai' : null;
function cityMusic(id) {
  if (!EXPLORE || id === musicCity || !CITIES[id]) return;
  musicCity = id;
  const old = musicNow, nxt = new Audio(CITIES[id].bgm); nxt.loop = true; nxt.volume = 0; nxt.preload = 'none';
  musicNow = nxt;
  if (state.music) nxt.play().catch(() => {});
  const t0 = performance.now(), v0 = old.volume;
  const fade = setInterval(() => {   // 用计时器而不是动画帧：页面在后台时也能淡完
    const u = Math.min(1, (performance.now() - t0) / 1200);
    nxt.volume = 0.5 * u; old.volume = v0 * (1 - u);
    if (u >= 1) { clearInterval(fade); old.pause(); if (old !== bgm) old.src = ''; }
  }, 30);
}
function musicUI() { $('music').classList.toggle('on', state.music); $('music').textContent = state.music ? '♪ 音乐 开' : '♪ 音乐 关'; }
$('music').onclick = () => {
  state.music = !state.music; musicUI();
  if (!state.music) musicNow.pause();
  else { musicNow.volume = 0.5; musicNow.play().catch(() => toast('音乐暂时无法加载')); }
};
musicUI();
let dragFrom = null;
renderer.domElement.addEventListener('pointerdown', e => { dragFrom = [e.clientX, e.clientY]; });
addEventListener('pointerup', () => { dragFrom = null; });

/* ---------- 交互：点击地标看介绍 / GO 进入下一座城 / 宣传片结尾点城市进入 / 记录看过的城市 ---------- */
const LM_DESC = {
  'Burj Khalifa': '高 828 米，世界最高的建筑，2010 年落成。',
  'Dubai Frame': '150 米高的巨型「相框」，一边框住老城，一边框住新城。',
  'Museum of the Future': '2022 年开馆，环形外墙上刻满阿拉伯书法。',
  'Emirates Towers': '谢赫扎耶德路旁的一对三角形塔楼，一座办公、一座酒店。',
  'Atlantis The Palm': '坐落在棕榈岛顶端的度假酒店，有水上乐园和大型水族馆。',
  'Burj Al Arab': '帆船造型的酒店，建在离岸的人工岛上。',
  'Sheikh Zayed Grand Mosque': '阿联酋最大的清真寺，白色大理石与 82 座穹顶。',
  'Capital Gate': '向西倾斜 18 度的「斜塔」摩天楼。',
  'Ferrari World': '全球首个法拉利主题公园，标志性的红色屋顶。',
  'Etihad Towers': '阿布扎比海滨的玻璃塔楼群。',
  'Emirates Palace': '阿布扎比海边的宫殿式酒店，金色穹顶。',
  'Abrahamic Family House': '2023 年开放，清真寺、教堂与犹太会堂同处一园。',
  'Tokyo Tower': '高 333 米，1958 年落成，红白相间的电波塔。',
  'Imperial Palace': '天皇居所，建在江户城旧址，护城河环绕。',
  'Sensoji Temple': '东京最古老的寺院，雷门的大红灯笼最出名。',
  'Tokyo Skytree': '高 634 米，世界最高的电波塔，2012 年开放。',
  'Akihabara': '电器街与动漫文化的中心。',
  'Eiffel Tower': '为 1889 年世博会建造的铁塔，巴黎的象征。',
  'Louvre': '世界最著名的艺术博物馆之一，玻璃金字塔是它的入口。',
  'Arc de Triomphe': '纪念拿破仑胜利的凯旋门，十二条大街由此放射出去。',
  'Sacré-Cœur': '矗立在蒙马特高地上的白色圣堂，可俯瞰全城。',
  'Empire State Building': '1931 年落成的装饰艺术风格摩天楼。',
  'Manhattan Skyline': '曼哈顿密集的摩天楼群。',
  'Times Square': '巨型广告屏汇聚的「世界十字路口」。',
  'Brooklyn Bridge': '1883 年通车的悬索桥，连接曼哈顿与布鲁克林。',
  'Statue of Liberty': '法国赠送的礼物，1886 年立于纽约港口。',
  'Sphere': '2023 年开幕的球形场馆，整个外壳是一块 LED 屏。',
  'Luxor': '金字塔造型的酒店，塔顶射出一道光柱。',
  'Resorts World': '拉斯维加斯大道北段的大型度假村。',
  'Stratosphere Tower': '拉斯维加斯最高的观景塔，塔顶有惊险游乐设施。',
  'Welcome Sign': '「Welcome to Fabulous Las Vegas」欢迎牌，1959 年竖立。',
  'Hot Air Balloon': '飘在沙漠城市上空的热气球。',
  'Christ the Redeemer': '科尔科瓦多山顶的基督像，张开双臂俯瞰全城。',
  'Maracanã Stadium': '曾举办 1950 年与 2014 年世界杯决赛的球场。',
  'Metropolitan Cathedral': '圆锥形的现代主义大教堂。',
  'Museum of Tomorrow': '2015 年开馆，探讨可持续未来的科学博物馆。',
  'Selarón Steps': '艺术家塞勒隆用世界各地的瓷砖铺满的阶梯。',
  'Pyramids of Giza': '古代世界七大奇迹中唯一留存至今的一座。',
  'Cairo Tower': '尼罗河杰济拉岛上高 187 米的莲花造型塔。',
  'Mosque of Muhammad Ali': '开罗城堡里的清真寺，又称雪花石膏清真寺。',
  'Iconic Tower': '埃及新行政首都的地标摩天楼。',
  'Marina Bay Sands': '三座塔楼托起一座空中花园与无边泳池。',
  'Merlion': '狮头鱼身的鱼尾狮，新加坡的象征。',
  'ArtScience Museum': '形似莲花的艺术科学博物馆。',
  'Gardens by the Bay': '以巨型「擎天大树」闻名的滨海花园。',
  'Singapore Flyer': '高 165 米的摩天观景轮。',
  'National Monument': '高 132 米的民族独立纪念碑，顶端是金色火焰。',
  'Istiqlal Mosque': '东南亚最大的清真寺。',
  'Jakarta Cathedral': '新哥特式天主教堂，与伊斯蒂克拉尔清真寺隔街相望。',
  'Sydney Opera House': '帆形屋顶的歌剧院，2007 年列入世界遗产。',
  'Sydney Harbour Bridge': '1932 年通车的钢拱桥，昵称「衣架」。',
  'Harbour Cruise': '穿梭在悉尼港里的游轮。',
  'Sydney Tower': '悉尼最高的观景塔。',
  'Queen Victoria Building': '1898 年落成的罗马式建筑，如今是购物中心。',
};
const visibleDeep = o => { for (let x = o; x; x = x.parent) if (!x.visible) return false; return true; };
const raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2();
function rayFrom(e) { const r = renderer.domElement.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); raycaster.setFromCamera(ndc, camera); }
// 地标拾取：只算已经长出来的部分（裁剪平面以下）
function pickLandmark(e) {
  rayFrom(e);
  const vis = ALL_LM.filter(L => L.loaded && visibleDeep(L.holder));
  for (const h of raycaster.intersectObjects(vis.map(L => L.holder), true)) {
    if (!visibleDeep(h.object)) continue;
    let o = h.object; while (o && !o.userData.lm) o = o.parent;
    if (o && h.point.y <= o.userData.lm.plane.constant + 0.05) return o.userData.lm;
  }
  return null;
}
// 世界地图拾取：射线落到海平面，选择最近的城市
function pickCity(e) {
  rayFrom(e);
  const t = -raycaster.ray.origin.y / raycaster.ray.direction.y; if (!(t > 0)) return null;
  const p = raycaster.ray.at(t, V3());
  let best = null, bd = 110;
  for (const id of CITY_ORDER) { const [x, z] = CITY_GRID[id], d = Math.hypot(p.x - x, p.z - z + 14); if (d < bd) { bd = d; best = id; } }
  return best;
}
let cardL = null;
function showCard(L) {
  cardL = L;
  $('cardCity').textContent = `${String(L.city.index).padStart(2, '0')} / 11 · ${L.city.name} ${L.city.nameZh}`;
  $('cardName').textContent = L.cfg.name; $('cardZh').textContent = L.cfg.zh;
  $('cardDesc').textContent = LM_DESC[L.cfg.name] || '';
  const tk = ticketOf(L); $('cardTicket').innerHTML = `🎫 购买门票 <small>· ${tk.name} · ${fmtPWV(tk.price)} 起</small>`;
  $('card').style.display = 'block';
}
function hideCard() { $('card').style.display = 'none'; cardL = null; }

/* ---------- 门票：每个地标一个购票入口，PWV 支付（原型演示：不扣真实资产，余额与订单只存在本浏览器） ---------- */
// 票价单位 PWV（1 PWV = 1 美元）。[票名, 成人价]；儿童 = 成人 5 折，优先通道 = 成人 1.8 倍。均为占位价，按实际合作价改这里即可
const TICKET_INFO = {
  'Burj Khalifa': ['At the Top 观景台', 45], 'Dubai Frame': ['观景台', 15], 'Museum of the Future': ['博物馆门票', 40],
  'Emirates Towers': ['城市导览', 20], 'Atlantis The Palm': ['Aquaventure 水上乐园', 90], 'Burj Al Arab': ['内部导览', 70],
  'Sheikh Zayed Grand Mosque': ['导览参观', 15], 'Capital Gate': ['观景台', 25], 'Ferrari World': ['乐园门票', 85],
  'Etihad Towers': ['300 观景台', 25], 'Emirates Palace': ['宫殿导览', 30], 'Abrahamic Family House': ['导览参观', 10],
  'Tokyo Tower': ['主展望台', 9], 'Imperial Palace': ['东御苑导览', 8], 'Sensoji Temple': ['浅草导览', 12],
  'Tokyo Skytree': ['天望甲板', 20], 'Akihabara': ['动漫街区导览', 25],
  'Eiffel Tower': ['登顶票', 38], 'Louvre': ['博物馆门票', 25], 'Arc de Triomphe': ['屋顶观景', 18], 'Sacré-Cœur': ['穹顶登高', 8],
  'Empire State Building': ['86 层观景台', 48], 'Manhattan Skyline': ['天际线游船', 40], 'Times Square': ['城市导览', 25],
  'Brooklyn Bridge': ['步行导览', 20], 'Statue of Liberty': ['渡轮 + 基座', 25],
  'Sphere': ['沉浸式演出', 110], 'Luxor': ['展览门票', 35], 'Resorts World': ['度假村体验', 50], 'Stratosphere Tower': ['观景台', 30],
  'Welcome Sign': ['拍照导览', 10], 'Hot Air Balloon': ['热气球飞行', 250],
  'Christ the Redeemer': ['登山小火车', 18], 'Maracanã Stadium': ['球场导览', 25], 'Metropolitan Cathedral': ['导览参观', 8],
  'Museum of Tomorrow': ['博物馆门票', 6], 'Selarón Steps': ['街区导览', 15],
  'Pyramids of Giza': ['景区门票', 30], 'Cairo Tower': ['观景台', 12], 'Mosque of Muhammad Ali': ['城堡门票', 10], 'Iconic Tower': ['新首都导览', 25],
  'Marina Bay Sands': ['空中花园观景台', 25], 'Merlion': ['滨海游船', 20], 'ArtScience Museum': ['展览门票', 25],
  'Gardens by the Bay': ['花穹 + 云雾林', 35], 'Singapore Flyer': ['摩天轮', 30],
  'National Monument': ['登顶观景', 5], 'Istiqlal Mosque': ['导览参观', 5], 'Jakarta Cathedral': ['导览参观', 5],
  'Sydney Opera House': ['剧院导览', 30], 'Sydney Harbour Bridge': ['BridgeClimb 攀桥', 200], 'Harbour Cruise': ['港湾游船', 40],
  'Sydney Tower': ['观景台', 22], 'Queen Victoria Building': ['历史导览', 15],
};
const TIX_TYPES = [['adult', '成人票', 1], ['child', '儿童票（3–11 岁）', 0.5], ['fast', '优先通道', 1.8]];
const WALLET_KEY = 'ta_demo_pwv_balance', ORDERS_KEY = 'ta_demo_ticket_orders', COUPON_KEY = 'ta_demo_coupons';
const store = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
                set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
let pwvBalance = store.get(WALLET_KEY, 500), tixOrders = store.get(ORDERS_KEY, []);
const fmtPWV = n => `${(Math.round(n * 100) / 100).toLocaleString('en-US', { maximumFractionDigits: 2 })} PWV`;
const ticketOf = L => { const [name, price] = TICKET_INFO[L.cfg.name] || ['门票', 20]; return { name, price }; };
let tix = null;   // 当前购票会话 { L, date, qty:{adult,child,fast}, step }

function openTickets(L) {
  const d = new Date(); d.setDate(d.getDate() + 1);
  tix = { L, date: d.toISOString().slice(0, 10), qty: { adult: 1, child: 0, fast: 0 }, step: 'pick' };

  $('tix').style.display = 'flex'; renderTickets();
}
function closeTickets() { $('tix').style.display = 'none'; tix = null; if (EXPLORE) { hudRefresh(); if (GUI.panel) renderPanel(); } }
const tixTotal = () => { const p = ticketOf(tix.L).price; return TIX_TYPES.reduce((s, [k, , f]) => s + tix.qty[k] * Math.round(p * f * 100) / 100, 0); };
function renderTickets() {
  const box = $('tixBody');
  if (EXPLORE) hudRefresh();
  if (tix.step === 'mine') return renderMine(box);
  const L = tix.L, t = ticketOf(L), total = tixTotal();
  const head = `<div class="tix-city">${String(L.city.index).padStart(2, '0')} / 11 · ${L.city.name} ${L.city.nameZh}</div><h3>${L.cfg.zh} <small>${L.cfg.name}</small></h3><div class="tix-kind">🎫 ${t.name}</div>`;
  if (tix.step === 'pick') {
    const min = new Date().toISOString().slice(0, 10), max = new Date(Date.now() + 90 * 864e5).toISOString().slice(0, 10);
    box.innerHTML = head + `
      <label class="tix-row">游玩日期 <input type="date" id="tixDate" value="${tix.date}" min="${min}" max="${max}"></label>
      ${TIX_TYPES.map(([k, label, f]) => `<div class="tix-row"><span>${label}<br><b>${fmtPWV(t.price * f)}</b></span>
        <span class="step"><button data-k="${k}" data-d="-1" aria-label="减少">−</button><i>${tix.qty[k]}</i><button data-k="${k}" data-d="1" aria-label="增加">+</button></span></div>`).join('')}
      <div class="tix-total">合计 <b>${fmtPWV(total)}</b></div>
      <button class="tix-main" id="tixNext" ${total > 0 ? '' : 'disabled'}>下一步 · 选择付款方式</button>`;
    box.querySelector('#tixDate').onchange = e => { tix.date = e.target.value; };
    box.querySelectorAll('.step button').forEach(b => b.onclick = () => { const k = b.dataset.k; tix.qty[k] = Math.max(0, Math.min(10, tix.qty[k] + +b.dataset.d)); renderTickets(); });
    box.querySelector('#tixNext').onclick = () => { tix.step = 'pay'; renderTickets(); };
  } else if (tix.step === 'pay' || tix.step === 'paying') {
    const nCp = store.get(COUPON_KEY, 0), disc = nCp > 0 && tix.useCoupon !== false ? Math.min(20, Math.round(total * 20) / 100) : 0, pay = Math.round((total - disc) * 100) / 100;
    const enough = pwvBalance >= pay, paying = tix.step === 'paying';
    const lines = TIX_TYPES.filter(([k]) => tix.qty[k] > 0).map(([k, label, f]) => `<div class="tix-line"><span>${label} × ${tix.qty[k]}</span><span>${fmtPWV(tix.qty[k] * t.price * f)}</span></div>`).join('');
    box.innerHTML = head + `
      <div class="tix-sum">${lines}<div class="tix-line"><span>游玩日期</span><span>${tix.date}</span></div>${nCp > 0 ? `<label class="tix-line"><span><input type="checkbox" id="tixCp" ${disc ? 'checked' : ''} ${paying ? 'disabled' : ''}> 门票 8 折券（最高减 20）· 剩 ${nCp} 张</span><span>${disc ? '−' + fmtPWV(disc) : '不使用'}</span></label>` : ''}<div class="tix-line big"><span>应付</span><b>${fmtPWV(pay)}</b></div></div>
      <div class="tix-label">付款方式</div>
      <div class="pay sel"><span class="pwv">PWV</span><span><b>PWV 钱包</b><br><small>余额 ${fmtPWV(pwvBalance)} · 1 PWV = 1 美元</small></span><span class="dot">●</span></div>
      ${enough ? '' : `<div class="tix-warn">余额不足，还差 ${fmtPWV(pay - pwvBalance)} <button id="tixTop">演示充值 +500 PWV</button></div>`}
      <button class="tix-main" id="tixPay" ${enough && !paying ? '' : 'disabled'}>${paying ? '支付中…' : `确认支付 ${fmtPWV(pay)}`}</button>
      <button class="tix-sub" id="tixBack" ${paying ? 'disabled' : ''}>返回修改</button>
      <div class="tix-note">PWV 不贬值、不过期、随时可花；门票一经售出按景区规则改退。原型演示：不产生真实扣款。</div>`;
    const top = box.querySelector('#tixTop'); if (top) top.onclick = () => { pwvBalance += 500; store.set(WALLET_KEY, pwvBalance); renderTickets(); };
    box.querySelector('#tixBack').onclick = () => { tix.step = 'pick'; renderTickets(); };
    const cp = box.querySelector('#tixCp'); if (cp) cp.onchange = () => { tix.useCoupon = cp.checked; renderTickets(); };
    box.querySelector('#tixPay').onclick = () => {
      tix.step = 'paying'; renderTickets();
      setTimeout(() => {
        if (!tix) return;
        pwvBalance = Math.round((pwvBalance - pay) * 100) / 100; store.set(WALLET_KEY, pwvBalance);
        if (disc) store.set(COUPON_KEY, Math.max(0, store.get(COUPON_KEY, 0) - 1));
        const code = 'PW' + Date.now().toString(36).toUpperCase().slice(-6) + Math.floor(Math.random() * 1296).toString(36).toUpperCase().padStart(2, '0');
        const order = { code, city: L.city.id, cityZh: L.city.nameZh, name: L.cfg.name, zh: L.cfg.zh, kind: t.name, date: tix.date, qty: { ...tix.qty }, total: pay, disc, paidAt: new Date().toISOString() };
        tixOrders.unshift(order); store.set(ORDERS_KEY, tixOrders);
        tix.order = order; tix.step = 'done'; renderTickets();
      }, 1100);
    };
  } else if (tix.step === 'done') {
    const o = tix.order;
    box.innerHTML = `<div class="tix-ok">✓ 支付成功</div>` + head + eTicket(o) + `
      <div class="tix-line"><span>已付</span><b>${fmtPWV(o.total)}</b></div><div class="tix-line"><span>PWV 余额</span><span>${fmtPWV(pwvBalance)}</span></div>
      <button class="tix-main" id="tixMine">查看我的门票</button><button class="tix-sub" id="tixDone">完成</button>`;
    box.querySelector('#tixMine').onclick = () => { tix.step = 'mine'; renderTickets(); };
    box.querySelector('#tixDone').onclick = closeTickets;
  }
}
function renderMine(box) {
    box.innerHTML = `<h3>我的门票</h3><div class="tix-line"><span>PWV 钱包余额</span><b>${fmtPWV(pwvBalance)}</b></div>` +
      (tixOrders.length ? tixOrders.map(o => `<div class="tix-order"><div><b>${o.zh}</b> · ${o.kind}<br><small>${o.cityZh} · ${o.date} · ${TIX_TYPES.filter(([k]) => o.qty[k]).map(([k, l]) => l.replace(/（.*）/, '') + '×' + o.qty[k]).join(' ')}</small></div><div class="r">${fmtPWV(o.total)}<br><small>${o.code}</small></div></div>`).join('')
        : '<p class="tix-empty">还没有门票。点开任意地标的介绍卡即可购票。</p>') +
      `<button class="tix-sub" id="tixClose">关闭</button>`;
    box.querySelector('#tixClose').onclick = closeTickets;
}
// 电子票：订单号 + 由订单号生成的入场图案（演示，不是真实二维码）
function eTicket(o) {
  let h = 2166136261; for (const ch of o.code) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  const rnd = mulberry32(h), n = 17, cells = [];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    // 三个角是定位框（外框 + 中心 1 格），其余随机点阵
    const F = [[0, 0], [n - 5, 0], [0, n - 5]].find(([a, b]) => x >= a && x < a + 5 && y >= b && y < b + 5);
    const on = F ? (x === F[0] || x === F[0] + 4 || y === F[1] || y === F[1] + 4 || (x === F[0] + 2 && y === F[1] + 2)) : rnd() < 0.48;
    if (on) cells.push(`<rect x="${x}" y="${y}" width="1" height="1"/>`);
  }
  return `<div class="eticket"><svg viewBox="-1 -1 ${n + 2} ${n + 2}" aria-label="入场码"><rect x="-1" y="-1" width="${n + 2}" height="${n + 2}" fill="#fff"/><g fill="#0d1830">${cells.join('')}</g></svg>
    <div><div class="tix-label">入场码（演示）</div><b class="code">${o.code}</b><br><small>${o.date} · ${o.kind}<br>${TIX_TYPES.filter(([k]) => o.qty[k]).map(([k, l]) => l.replace(/（.*）/, '') + ' × ' + o.qty[k]).join('、')}</small></div></div>`;
}
$('cardTicket').onclick = () => cardL && openTickets(cardL);
$('myTix').onclick = () => { tix = { step: 'mine' };  $('tix').style.display = 'flex'; renderTickets(); };
$('tixX').onclick = closeTickets;
$('tix').addEventListener('pointerdown', e => { if (e.target.id === 'tix') closeTickets(); });
addEventListener('keydown', e => { if (e.key === 'Escape' && tix) closeTickets(); });

$('cardX').onclick = hideCard;
// 点击 = 按下后几乎没移动；拖动另作自由视角
let dragged = false;
renderer.domElement.addEventListener('pointerdown', () => { dragged = false; });
renderer.domElement.addEventListener('pointermove', e => {
  if (dragFrom && Math.hypot(e.clientX - dragFrom[0], e.clientY - dragFrom[1]) >= 5) dragged = true;
  if (dragFrom) return;
  clearTimeout(rayFrom.h); rayFrom.h = setTimeout(() => {   // 悬停：地标或可进入的城市上显示手形光标
    const other = EXPLORE && (id => id && (EX.overview || !EX.city || id !== EX.city.id))(pickCity(e));
    renderer.domElement.style.cursor = (!EX.overview && pickLandmark(e)) || other ? 'pointer' : '';
  }, 40);
});
renderer.domElement.addEventListener('pointerup', e => {
  if (dragged) return;
  const L = pickLandmark(e);
  if (L && !EX.overview) { showCard(L); return; }   // 探索模式镜头跟着小女孩，只弹介绍卡
  if (EXPLORE) { const id = pickCity(e); if (id && (EX.overview || !EX.city || id !== EX.city.id)) travelTo(id); return; }
});
addEventListener('keydown', e => { if (e.key === 'Escape') hideCard(); });

// 城市跳转与「看过」记录（只存在本浏览器）
function goCity(id) { if (CITIES[id]) travelTo(id); }
const WATCH_KEY = 'ta_city_intro_watched';
const watched = (() => { try { return new Set(JSON.parse(localStorage.getItem(WATCH_KEY) || '[]')); } catch (e) { return new Set(); } })();
function markWatched(id) {
  if (watched.has(id)) return; watched.add(id);
  try { localStorage.setItem(WATCH_KEY, JSON.stringify([...watched])); } catch (e) {}
  renderCityOptions();
}
function renderCityOptions() {
  $('city').innerHTML = Object.values(CITIES).sort((a, b) => a.index - b.index).map(c =>
    `<option value="${c.id}">${watched.has(c.id) ? '✓ ' : ''}${c.nameZh}</option>`).join('');
}
renderCityOptions();

/* =====================================================================
   8. 自由探索：Eva 图片角色在十一城之间旅行
   角色依据设定图：黑色中长波浪发（中分）、绿瞳、红唇、奶黄色方领泡泡袖高腰中长裙、米白玛丽珍鞋
   ===================================================================== */
const evaAtlasTexture = new THREE.TextureLoader().load(evaSpriteUrl, () => {
  if (GUI.ready) makeAvatar();
});
evaAtlasTexture.colorSpace = THREE.SRGBColorSpace;
evaAtlasTexture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
function makeGirl() { return createEvaSprite({ THREE, atlasTexture:evaAtlasTexture }); }
function evaGuideMarkup(className) {
  return `<svg class="${className}" viewBox="125 0 335 1024" role="img" aria-label="导游 Eva：黑色卷发、珍珠耳饰和奶黄色连衣裙"><image href="${evaSpriteUrl}" width="1536" height="1024"/></svg>`;
}

const EX = { on: EXPLORE, keys: new Set(), pos: V3(), y: 1, yaw: 0, city: null, auto: null, t0: performance.now() };
function exploreCityAt(x, z) {
  let best = null, bd = 125;
  for (const c of world.cities) { const [ox, oz] = CITY_GRID[c.id], d = Math.hypot(x - ox, z - oz + 10); if (d < bd) { bd = d; best = c; } }
  return best;
}
const segDist2 = (x, z, A, B) => { const dx = B[0] - A[0], dz = B[1] - A[1], u = clamp01(((x - A[0]) * dx + (z - A[1]) * dz) / (dx * dx + dz * dz || 1)); return Math.hypot(x - A[0] - dx * u, z - A[1] - dz * u); };
// 能不能站在 (x,z)：在岛上 / 路上（含城内的桥、栈桥）/ 跨海桥上；不能撞进地标、楼、湖、河
function walkable(x, z) {
  for (const b of world.explore.bridges) if (segDist2(x, z, b.A, b.B) < b.hw) return { y: 1.52 };
  const c = exploreCityAt(x, z); if (!c) return null;
  const [ox, oz] = CITY_GRID[c.id], lx = x - ox, lz = z - oz, ctx = c.w.ctx;
  const onRoad = ctx.roads.some(r => r.kind !== 'canal' && segDist2(lx, lz, r.A, r.B) < r.hw);
  const onLand = ctx.islands.some(il => insideShape(il.kind, il.args, lx, lz));
  if (!onLand && !onRoad) return null;
  if (!onRoad) {
    for (const r of ctx.roads) if (r.kind === 'canal' && segDist2(lx, lz, r.A, r.B) < r.hw - 0.6) return null;
    for (const q of ctx.rects) if (Math.abs(lx - q.x) < q.w / 2 + 0.45 && Math.abs(lz - q.z) < q.d / 2 + 0.45) return null;
  }
  for (const k of ctx.circles) if (Math.hypot(lx - k.x, lz - k.z) < k.r + 0.3) return null;   // 地标、湖、鸟居等
  const road = ctx.roads.find(r => r.kind !== 'canal' && segDist2(lx, lz, r.A, r.B) < r.hw);
  return { y: road ? (road.kind === 'pier' ? 1.25 : 1.38) : ctx.groundY(lx, lz), c };
}
function spawnAt(id) { const c = world.cities.find(c => c.id === id); return spawnNear(c.H, c.r); }
function spawnNear(H, r) {
  for (let rad = r + 4; rad < 80; rad += 2) for (let a = Math.PI / 2; a < Math.PI / 2 + Math.PI * 2; a += 0.3) {
    const x = H.x + Math.cos(a) * rad, z = H.z + Math.sin(a) * rad, w = walkable(x, z);
    if (w) { EX.pos.set(x, w.y, z); EX.y = w.y; EX.yaw = Math.atan2(H.x - x, H.z - z); return true; }
  }
  return false;
}
// 镜头飞行（快速传送、地图俯瞰都用它）：位置走一条向上拱起的弧线，0.9~1.2 秒
let camFly = null;
function flyCam(toP, toQ, dur = 1000, arc = 0) {
  controls.maxDistance = Math.max(controls.maxDistance, 3000);
  camFly = { t0: performance.now(), dur, fromP: camera.position.clone(), fromQ: controls.target.clone(), toP: toP.clone(), toQ: toQ.clone(), arc };
}
// 直达城市中心：落在主地标正前方，面朝它；镜头在她身后，地标完整入画；同时弹出介绍卡
function travelTo(id) {
  review.fixed = false; review.camera = '自由探索';
  const c = world.cities.find(c => c.id === id); if (c) arrive(c.H, c.h, c.r, c.LM[c.hero.args[0]], id);
}
// 直达某一座地标（任务、藏品里点它）
function goLandmark(L) { const P = V3(); L.holder.getWorldPosition(P); arrive(P, L.size ? L.size[1] : L.H, Math.max(L.rXZ, L.cfg.r), L, L.city.id); }
function arrive(P, h, r, L, id) {
  if (!spawnNear(P, r)) return;
  EX.overview = false; document.body.classList.remove('overview'); $('worldHint').style.display = 'none';
  // 构图：她在前景，地标整栋入画——距离按地标高度放大，视线对准她和地标之间、地标半腰
  // hTop：地标顶端离她脚下的高度（含山体/底座，如山顶的基督像）；35° 视角下让她和整栋地标同时入画
  const hTop = P.y + h - EX.y, dir = P.clone().sub(EX.pos).setY(0).normalize(), back = Math.max(22, hTop * 1.7, r * 1.8);
  const tq = EX.pos.clone().lerp(P, 0.9).setY(EX.y + hTop * 0.45);
  const tp = EX.pos.clone().addScaledVector(dir, -back).add(V3(0, 2 + hTop * 0.32, 0));
  EX.hold = true;   // 开始走动前保持这个构图
  const far = camera.position.distanceTo(tp);
  flyCam(tp, tq, Math.min(1400, 700 + far * 0.8), Math.min(160, far * 0.35));
  girl.root.position.copy(EX.pos); girl.root.rotation.y = EX.yaw;
  if (L) { showCard(L); EX.auto = L; }
  $('city').value = id;
  document.querySelectorAll('#cityChips button').forEach(b => b.classList.toggle('on', b.dataset.id === id));
}
// 世界地图：升到高空俯瞰十一座城，点击任意一座直达；再按一次 / Esc 回到小女孩身边
function toggleOverview(on = !EX.overview) {
  review.fixed = false; review.camera = on ? '世界地图' : '自由探索';
  EX.overview = on; document.body.classList.toggle('overview', on); hideCard(); $('worldHint').style.display = on ? 'block' : 'none';
  controls.maxDistance = on ? 5000 : 90;
  if (on) {
    EX.back = { p: camera.position.clone(), q: controls.target.clone() };
    // Fit the wide eleven-city layout on portrait screens as well as desktop.
    const fit = Math.max(1.12, Math.min(4.5, 1.6 / camera.aspect));
    flyCam(V3(0, 720 * fit, 540 * fit), V3(0, 0, -10), 1100);
  }
  else if (EX.back) flyCam(EX.back.p, EX.back.q, 1000);
}

let girl = null;
function setupExplore() {
  document.body.classList.add('explore');
  girl = makeGirl(); scene.add(girl.root);
  spawnAt('dubai');
  controls.enabled = true; state.userCam = true; state.playing = false;
  Object.assign(controls, { minDistance: 4.5, maxDistance: 90, maxPolarAngle: 1.38, enablePan: false });
  camera.position.copy(EX.pos).add(V3(0, 13, 24)); controls.target.copy(EX.pos).add(V3(0, 2, 0));
  // Start beside the pilot square only when the detailed district is active.
  // The spawn is validated against the same collision map as player movement.
  if (realism.enabled && realism.refinementEnabled && realism.districtEnabled) {
    const [ox,oz]=CITY_GRID.dubai, start=walkable(ox-20,oz-5.65);
    if (start) {
      EX.pos.set(ox-20,start.y,oz-5.65); EX.y=start.y; EX.yaw=Math.PI; EX.hold=true;
      camera.position.set(ox-17,12,oz+17); controls.target.set(ox-20,3.8,oz-10);
    }
  }
  $('worldHint').textContent = '点击任意一座城市，直达它的中心地标 · Esc 返回';

  $('hint').textContent = '方向键 / WASD 走动 · Shift 奔跑 · 拖动转视角 · 点地标看介绍 · 点城市按钮或远处的岛直达 · M 地图';
  $('city').onchange = e => { const v = e.target.value; if (CITIES[v]) travelTo(v); else goCity(v); };
  // 顶部城市快捷按钮：一点直达该城的中心地标
  $('cityChips').innerHTML = Object.values(CITIES).sort((a, b) => a.index - b.index).map(c => `<button data-id="${c.id}">${c.nameZh}</button>`).join('') + '<button id="mapBtn" title="世界地图（M）">🗺 地图</button>';
  $('cityChips').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; b.id === 'mapBtn' ? toggleOverview() : travelTo(b.dataset.id); });
  setupGameUI();
  addEventListener('keydown', e => { if (/INPUT|SELECT/.test(e.target.tagName) || uiBusy()) return; if (e.code === 'KeyM') toggleOverview(); if (e.key === 'Escape' && EX.overview) toggleOverview(false); });
  const KEYMAP = { ArrowUp: 'u', KeyW: 'u', ArrowDown: 'd', KeyS: 'd', ArrowLeft: 'l', KeyA: 'l', ArrowRight: 'r', KeyD: 'r', ShiftLeft: 'run', ShiftRight: 'run' };
  addEventListener('keydown', e => { if (/INPUT|SELECT/.test(e.target.tagName) || uiBusy()) return; const k = KEYMAP[e.code]; if (k) { EX.keys.add(k); e.preventDefault(); } }, true);
  addEventListener('keyup', e => { const k = KEYMAP[e.code]; if (k) EX.keys.delete(k); }, true);
  addEventListener('blur', () => EX.keys.clear());
  // 手机方向键：按住移动
  document.querySelectorAll('#dpad button').forEach(b => {
    const k = b.dataset.k, on = e => { e.preventDefault(); EX.keys.add(k); }, off = () => EX.keys.delete(k);
    b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off); b.addEventListener('pointercancel', off);
  });
}
function exploreStep(dt, now) {
  if (camFly) {
    const u = clamp01((now - camFly.t0) / camFly.dur), e = u * u * (3 - 2 * u);
    camera.position.lerpVectors(camFly.fromP, camFly.toP, e); camera.position.y += Math.sin(Math.PI * e) * camFly.arc;
    controls.target.lerpVectors(camFly.fromQ, camFly.toQ, e);
    if (u >= 1) { camFly = null; if (!EX.overview) controls.maxDistance = 90; }
  }
  const K = (GUI.loading || uiBusy() || camFly || EX.overview) ? new Set() : EX.keys, fx = (K.has('r') ? 1 : 0) - (K.has('l') ? 1 : 0), fz = (K.has('u') ? 1 : 0) - (K.has('d') ? 1 : 0);
  // 方向相对画面：上 = 远离镜头
  const fwd = controls.target.clone().sub(camera.position).setY(0).normalize(), right = V3(-fwd.z, 0, fwd.x);
  const mv = fwd.multiplyScalar(fz).addScaledVector(right, fx);
  let speed = 0;
  if (mv.lengthSq() > 0) {
    review.fixed = false; review.camera = '自由探索';
    mv.normalize(); const run = K.has('run'), v = run ? 6 : 3; speed = run ? 1.8 : 1;
    const step = mv.clone().multiplyScalar(v * dt), old = EX.pos.clone();
    for (const [sx, sz] of [[1, 1], [1, 0], [0, 1]]) {   // 撞墙时沿墙滑动
      const nx = old.x + step.x * sx, nz = old.z + step.z * sz;
      if (walkable(nx, nz)) { EX.pos.x = nx; EX.pos.z = nz; break; }
    }
    const targetYaw = Math.atan2(mv.x, mv.z); let d = targetYaw - EX.yaw; d -= Math.round(d / (2 * Math.PI)) * 2 * Math.PI; EX.yaw += d * Math.min(1, dt * 12);
    const delta = EX.pos.clone().sub(old); camera.position.add(delta); controls.target.add(delta);
  }
  const w = walkable(EX.pos.x, EX.pos.z), gy = w ? w.y : EX.y; EX.y += (gy - EX.y) * Math.min(1, dt * 10);
  girl.root.position.set(EX.pos.x, EX.y, EX.pos.z); girl.root.rotation.y = EX.yaw;
  girl.animate(dt, review.fixed && review.character ? review.poseSpeed : speed, now / 1000);
  if (speed > 0) EX.hold = false;   // 一走动，视线高度慢慢回到她身上
  if (!camFly && !EX.overview && !EX.hold) controls.target.y += (EX.y + 2 - controls.target.y) * Math.min(1, dt * 6);
  controls.update();
  // 进城横幅、靠近地标自动弹出介绍卡
  const c = w && w.c ? w.c : null;
  if (c && c !== EX.city) { EX.city = c; $('cityBanner').innerHTML = `<b>${c.city.name}</b> ${c.city.nameZh}<span>${String(c.city.index).padStart(2, '0')} / 11</span>`; $('cityBanner').classList.remove('show'); void $('cityBanner').offsetWidth; $('cityBanner').classList.add('show'); markWatched(c.id);  cityMusic(c.id); onCityEnter(c); }
  gameFrame(dt, now, w);
  if (uiBusy() || review.fixed) return;
  let near = null, nd = 1e9;
  for (const L of ALL_LM) { if (!L.loaded) continue; const p = V3(); L.holder.getWorldPosition(p); const d = Math.hypot(p.x - EX.pos.x, p.z - EX.pos.z) - L.rXZ; if (d < nd) { nd = d; near = L; } }
  if (EX.overview) return;
  if (!GUI.loading && near && nd < 7) checkIn(near);
  if (!GUI.loading && near && nd < 7 && cardL !== near) { showCard(near); EX.auto = near; }
  else if (EX.auto && cardL === EX.auto && nd > 12) { hideCard(); EX.auto = null; }
}

/* =====================================================================
   9. 游戏界面（自由探索）：对齐 PW 正式版的细节——加载页、头像/ID/时钟/位置、PWV 与城市印记、
      门票商城、藏品展厅、任务、GO、小女孩向导的城市导览、打卡奖励、模拟玩家与名牌
   演示数据（打卡、优惠券、玩家 ID）只存在本浏览器
   ===================================================================== */
const CITY_DESC = {
  dubai: '沙漠里长出的未来之城：世界最高的哈利法塔、帆船酒店和伸进大海的棕榈岛都在这里。',
  abudhabi: '阿联酋首都：白色大理石的谢赫扎耶德大清真寺、红顶的法拉利乐园和海边的酋长宫殿。',
  tokyo: '传统与未来交织的都市：浅草寺的雷门灯笼、红白东京塔和 634 米的晴空塔。',
  paris: '塞纳河畔的光之城：埃菲尔铁塔、卢浮宫的玻璃金字塔和十二条大街汇聚的凯旋门。',
  newyork: '不夜城：帝国大厦、时代广场的巨屏、布鲁克林大桥和港口的自由女神。',
  lasvegas: '沙漠中的娱乐之都：Sphere 球形巨屏、射出光柱的金字塔酒店和那块著名的欢迎牌。',
  rio: '山与海之城：科尔科瓦多山顶的基督像俯瞰海湾，还有马拉卡纳球场和彩色瓷砖的塞勒隆阶梯。',
  cairo: '尼罗河畔的千年古都：吉萨金字塔、莲花造型的开罗塔和城堡里的穆罕默德·阿里清真寺。',
  singapore: '花园城市：滨海湾金沙托起空中泳池，鱼尾狮守着海湾，擎天大树在花园里发光。',
  jakarta: '印尼首都：顶着金色火焰的民族纪念碑，伊斯蒂克拉尔清真寺与大教堂隔街相望。',
  sydney: '海港之城：帆形屋顶的歌剧院、昵称「衣架」的海港大桥和穿梭港湾的游船。',
};
const TIPS = ['走近地标即可点亮城市印记，集齐一城成为「文化大使」', '门票与 PWV 余额仅为本机演示，不会发生真实付款', '探索十一座城市，发现各地地标',
  '方向键 / WASD 走动，按住 Shift 奔跑', '按 M 打开世界地图，点任意一座城直达', '右下角 GO：前往下一座城市'];
const NPC_LOOKS = [
  { name: '模拟_Omar294', hair: '#30251e', dress: '#92a9ab', dress2: '#748f91', skin: '#c99978' },
  { name: '模拟_Aisha732', hair: '#9f8454', dress: '#c5a39c', dress2: '#ad8983' },
  { name: '模拟_Yuki318', hair: '#201d20', dress: '#a6b39b', dress2: '#87987a' },
  { name: '模拟_Lucas507', hair: '#5a382b', dress: '#b4acc0', dress2: '#9690a3', skin: '#deb098' },
];
const CHECK_KEY = 'ta_explore_checkins', GIFT_KEY = 'ta_explore_gift', PID_KEY = 'ta_player_id';
const GUI = { loading: EXPLORE, ready: false, seen: new Set(), panel: null, pop: null, thumbs: new Map(), shots: new Map(), npcs: [] };
let checkins = new Set(store.get(CHECK_KEY, []));
const playerId = store.get(PID_KEY, null) || (() => { const id = String(1e8 + Math.floor(Math.random() * 9e8)); store.set(PID_KEY, id); return id; })();
const lmKey = L => L.city.id + ':' + L.id;
const cityLMs = id => ALL_LM.filter(L => L.city.id === id);
const lit = L => checkins.has(lmKey(L));
const uiBusy = () => !!(tix || GUI.panel || GUI.pop || GUI.loading);
const cityOrder = () => Object.values(CITIES).sort((a, b) => a.index - b.index);
const nextCity = id => { const o = cityOrder(), i = o.findIndex(c => c.id === id); return o[(i + 1) % o.length].id; };
const lmByKey = k => ALL_LM.find(L => lmKey(L) === k);

// 截图：用主渲染器在画布左下角画一帧小图再读出来，紧接着画回正常画面（屏幕上不会闪）
const shotCam = new THREE.PerspectiveCamera(35, 1, 0.5, 6000);
// Update atlas UVs before Three uploads geometry, including the first avatar shot.
function prepareCharacterViews(viewCamera) {
  girl?.updateView(viewCamera);
  for (const npc of GUI.npcs) npc.g.updateView(viewCamera);
}
function shoot(pos, look, w, h, fov = 35) {
  const pr = renderer.getPixelRatio(), cv = renderer.domElement, W = Math.min(cv.width, Math.round(w * pr)), H = Math.min(cv.height, Math.round(h * pr));
  shotCam.fov = fov; shotCam.aspect = w / h; shotCam.updateProjectionMatrix(); shotCam.position.copy(pos); shotCam.lookAt(look);
  const lbl = ALL_LM.map(L => L.label.visible); ALL_LM.forEach(L => L.label.visible = false);
  const visibility = world.cities.map(c => [c.w.root.visible, c.landmarkGroup.visible]);
  try {
    // Collection cards can photograph a city hidden from the player's camera.
    updateCityVisibility(shotCam, look);
    renderer.setScissorTest(true); renderer.setViewport(0, 0, W / pr, H / pr); renderer.setScissor(0, 0, W / pr, H / pr);
    prepareCharacterViews(shotCam);
    renderer.render(scene, shotCam);
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    c.getContext('2d').drawImage(cv, 0, cv.height - H, W, H, 0, 0, w, h);
    return c.toDataURL('image/jpeg', 0.86);
  } finally {
    renderer.setScissorTest(false); renderer.setViewport(0, 0, cv.width / pr, cv.height / pr);
    ALL_LM.forEach((L, i) => L.label.visible = lbl[i]);
    world.cities.forEach((c, i) => {
      c.w.root.visible = visibility[i][0]; c.landmarkGroup.visible = visibility[i][1];
    });
    prepareCharacterViews(camera);
    renderer.render(scene, camera);
  }
}
// 地标藏品图：斜上方 3/4 视角，整栋入画
function thumbOf(L) {
  const k = lmKey(L); if (GUI.thumbs.has(k)) return GUI.thumbs.get(k);
  if (!L.loaded) return '';
  const c = V3(); L.holder.getWorldPosition(c); const h = L.size ? L.size[1] : L.H; c.y += h * 0.42;
  const d = Math.max(h * 1.65, L.rXZ * 3) + 6, dir = V3(0.45, 0, 1).normalize();
  const url = shoot(c.clone().addScaledVector(dir, d).add(V3(0, d * 0.45, 0)), c, 180, 180, 38);
  GUI.thumbs.set(k, url); return url;
}
// 城市明信片：主地标为中心的航拍
function cityShot(c) {
  if (GUI.shots.has(c.id)) return GUI.shots.get(c.id);
  const look = c.H.clone().add(V3(0, c.h * 0.22, 0)), d = Math.max(90, c.h * 2.1);
  const url = shoot(look.clone().add(V3(d * 0.32, d * 0.6, d * 0.92)), look, 520, 260, 42);
  GUI.shots.set(c.id, url); return url;
}
// Eva is an authored transparent guide portrait, bundled independently of player/NPC models.
function makeAvatar() {
  const f = V3(Math.sin(EX.yaw), 0, Math.cos(EX.yaw)), head = girl.root.position.clone().add(V3(0, girl.root.userData.headHeight, 0));
  $('hudAvatar').src = shoot(head.clone().addScaledVector(f, 1.4).add(V3(0, 0.04, 0)), head, 140, 140, 30);
}

function hudRefresh() {
  if (!EXPLORE) return;
  const n = checkins.size;
  $('hudPwv').textContent = (Math.round(pwvBalance * 100) / 100).toLocaleString('en-US');
  $('hudStamps').textContent = `${n}/${ALL_LM.length}`;
  $('hudLv').textContent = 1 + Math.floor(n / 4);
  const cps = store.get(COUPON_KEY, 0), shopBtn = document.querySelector('#hudSide [data-act=shop]');
  shopBtn.querySelector('.badge-n')?.remove();
  if (cps) shopBtn.insertAdjacentHTML('beforeend', `<span class="badge-n" title="门票 8 折券">${cps}</span>`);
  renderQuests();
}
function renderQuests() {
  const c = EX.city, cities = new Set([...checkins].map(k => k.split(':')[0])), q = [];
  if (c) { const ls = cityLMs(c.id), n = ls.filter(lit).length; q.push({ ic: '📍', t: `点亮${c.city.nameZh}全部地标`, p: `${n}/${ls.length}`, done: n === ls.length, act: 'lm' }); }
  q.push({ ic: '🌍', t: '游历十一城', p: `${cities.size}/11`, done: cities.size >= 11, act: 'city' });
  q.push({ ic: '🎫', t: '用 PWV 买一张景点门票', p: `${Math.min(1, tixOrders.length)}/1`, done: tixOrders.length > 0, act: 'shop' });
  $('hudQuests').innerHTML = q.map(x => `<button data-act="${x.act}" class="${x.done ? 'done' : ''}"><i>${x.done ? '✓' : x.ic}</i><span>${x.t}<b>${x.p}</b></span></button>`).join('');
}
function questGo(act) {
  if (act === 'shop') return openPanel('shop');
  if (act === 'lm') {   // 走向本城最近的还没点亮的地标
    const todo = cityLMs(EX.city.id).filter(L => L.loaded && !lit(L));
    if (!todo.length) return openPanel('coll');
    const dist = L => L.holder.getWorldPosition(V3()).distanceTo(EX.pos);
    return goLandmark(todo.sort((a, b) => dist(a) - dist(b))[0]);
  }
  const done = new Set([...checkins].map(k => k.split(':')[0])), o = cityOrder(), i = o.findIndex(c => c.id === (EX.city ? EX.city.id : 'dubai'));
  for (let k = 1; k <= o.length; k++) { const c = o[(i + k) % o.length]; if (!done.has(c.id)) return travelTo(c.id); }
}

// 弹窗（城市导览 / 奖励 / 说明）
function showPop(html, { blank = false, onClose } = {}) {
  GUI.pop = { blank, onClose }; EX.keys.clear();
  const el = $('gpop'); el.innerHTML = html; el.style.display = 'flex';
}
function closePop() { const p = GUI.pop; if (!p) return; GUI.pop = null; $('gpop').style.display = 'none'; $('gpop').innerHTML = ''; p.onClose && p.onClose(); }
function rewardPop(title, sub, items, onClose) {
  showPop(`<div class="gp-reward"><div class="rays"></div><h2>${title}</h2><div class="sub">${sub}</div><div class="items">${items.map(it =>
    `<div class="item"><div class="ico">${it.html}</div><b>${it.name}</b><small>×${it.n}</small></div>`).join('')}</div><div class="tip">点击空白区域关闭</div></div>`, { blank: true, onClose });
}
const COUPON_HTML = '<div class="coupon"><b>8折</b><span>门票券</span></div>';
function giveCoupon(n = 1) { store.set(COUPON_KEY, store.get(COUPON_KEY, 0) + n); hudRefresh(); }
function cityIntro(c, onClose) {
  const ls = cityLMs(c.id), n = ls.filter(lit).length;
  showPop(`<div class="gp-card gp-city-intro"><aside class="eva-guide" aria-label="导游 Eva"><div class="gp-eva-frame">${evaGuideMarkup("gp-eva")}</div><div class="eva-guide-copy"><strong>Eva</strong><span>你的城市导游</span><p>跟我一起逛${c.city.nameZh}吧。</p></div></aside><button class="gp-x" aria-label="关闭">×</button><div class="gp-city-content">
    <h2>欢迎来到${c.city.nameZh}<small>${c.city.name} · ${String(c.city.index).padStart(2, '0')}/11</small></h2>
    <img class="gp-photo" src="${cityShot(c)}" alt="${c.city.nameZh}">
    <p>${CITY_DESC[c.id] || ''}</p>
    <div class="gp-sub">城市印记 <b>${n}/${ls.length}</b> · 走近地标即可点亮，点图标直达</div>
    <div class="gp-items">${ls.map(L => `<figure class="${lit(L) ? '' : 'off'}" data-k="${lmKey(L)}"><img src="${thumbOf(L)}" alt=""><figcaption>${L.cfg.zh}</figcaption></figure>`).join('')}</div>
    <div class="gp-btns"><button class="alt" data-go="shop">🎫 门票商城</button><button class="ok" data-go="close">开始探索</button></div></div></div>`, { onClose });
}
function rewardToast(img, title, sub) {
  const el = $('rtoast'); el.innerHTML = `${img ? `<img src="${img}" alt="">` : ''}<div><b>${title}</b><small>${sub}</small></div>`;
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  clearTimeout(rewardToast.h); rewardToast.h = setTimeout(() => el.classList.remove('show'), 2800);
}
// 打卡：走近地标点亮城市印记；一城集齐 → 文化大使 + 门票 8 折券
function checkIn(L) {
  if (!GUI.ready || lit(L)) return;
  checkins.add(lmKey(L)); store.set(CHECK_KEY, [...checkins]); hudRefresh();
  const ls = cityLMs(L.city.id), n = ls.filter(lit).length;
  rewardToast(thumbOf(L), `打卡成功 · ${L.cfg.zh}`, `城市印记 +1 · ${L.city.nameZh} ${n}/${ls.length}`);
  if (n === ls.length) setTimeout(() => {
    giveCoupon();
    const show = () => rewardPop('恭喜获得', `点亮${L.city.nameZh}全部 ${n} 座地标`, [{ html: '<div class="medal">🏅</div>', name: `${L.city.nameZh}文化大使`, n: 1 }, { html: COUPON_HTML, name: '门票 8 折券', n: 1 }]);
    (function wait() { uiBusy() ? setTimeout(wait, 800) : show(); })();
  }, 1200);
}
function onCityEnter(c) {
  $('hudLoc').textContent = '📍 ' + c.city.nameZh;
  $('hudGoTo').textContent = '下一站 · ' + CITIES[nextCity(c.id)].nameZh;
  GUI.npcs.forEach(n => npcPlace(n, c));
  renderQuests();
  if (GUI.ready && !GUI.seen.has(c.id)) { GUI.seen.add(c.id); setTimeout(() => { if (EX.city === c && !uiBusy()) cityIntro(c); }, 900); }
}

// 全屏面板：门票商城 / 藏品展厅（左侧按城市分页）
function openPanel(kind, city = EX.city ? EX.city.id : 'dubai') {
  hideMenu(); EX.keys.clear();
  GUI.panel = { kind, city, sel: null }; $('gpanel').style.display = 'flex'; renderPanel();
}
function closePanel() { GUI.panel = null; $('gpanel').style.display = 'none'; $('gpanel').innerHTML = ''; }
const curHTML = () => `<div class="gcur"><i class="ic stamp">印</i><span>${checkins.size}/${ALL_LM.length}</span></div><div class="gcur"><i class="ic pwv">PWV</i><span>${(Math.round(pwvBalance * 100) / 100).toLocaleString('en-US')}</span></div>`;
function renderPanel() {
  const P = GUI.panel, shop = P.kind === 'shop', topup = P.city === 'topup';
  const tabs = cityOrder().map(c => { const ls = cityLMs(c.id), n = ls.filter(lit).length;
    return `<button data-city="${c.id}" class="${P.city === c.id ? 'on' : ''}">${c.nameZh}${shop ? '' : `<small>${n}/${ls.length}</small>`}</button>`; }).join('') +
    (shop ? `<button data-city="topup" class="${topup ? 'on' : ''}">充值</button>` : '');
  let main;
  if (shop && topup) main = `<p class="gp-note">1 PWV = 1 美元 · 不贬值、不过期、随时可花 · 充值不可退 · <b>原型演示：不产生真实扣款</b></p>
    <div class="tp">${[100, 500, 1000, 2000].map(v => `<button data-top="${v}"><i class="ic pwv">PWV</i><b>${v.toLocaleString('en-US')}</b>演示充值</button>`).join('')}</div>`;
  else if (shop) {
    const ls = cityLMs(P.city); if (!P.sel || P.sel.city.id !== P.city) P.sel = ls[0];
    const cps = store.get(COUPON_KEY, 0);
    main = `<p class="gp-note">${CITIES[P.city].nameZh} · ${ls.length} 个景点 · PWV 支付${cps ? ` · 你有 <b>${cps} 张门票 8 折券</b>，结算时自动使用` : ''}</p>
      <div class="sg">${ls.map((L, i) => { const t = ticketOf(L), own = tixOrders.filter(o => o.city === L.city.id && o.name === L.cfg.name).length;
        return `<div class="sc ${P.sel === L ? 'on' : ''}" data-k="${lmKey(L)}"><div class="tag">景点门票</div>${i === 0 ? '<span class="hot">HOT</span>' : ''}${own ? `<span class="own">已购 ${own}</span>` : ''}
          <img src="${thumbOf(L)}" alt=""><div class="nm">${L.cfg.zh}</div><span class="kd">${t.name}</span><div class="pr"><i class="ic pwv mini">PWV</i> ${t.price} 起</div></div>`; }).join('')}</div>`;
  } else {
    const ls = cityLMs(P.city), n = ls.filter(lit).length, rows = [];
    for (let i = 0; i < ls.length; i += 3) rows.push(ls.slice(i, i + 3));
    main = `<div class="coll-top"><span class="chip">展架点亮 <b>${n}</b> / ${ls.length}</span><span class="chip amb ${n === ls.length ? '' : 'off'}">🏅 ${CITIES[P.city].nameZh}文化大使</span></div>` +
      rows.map(r => `<div class="shelf"><div class="items">${r.map(L => `<div class="ci ${lit(L) ? '' : 'off'}" data-k="${lmKey(L)}"><img src="${thumbOf(L)}" alt="">${lit(L) ? '' : '<span class="lock">🔒</span>'}<span>${L.cfg.zh}</span></div>`).join('')}</div>
        <div class="board"></div><div class="val"><i class="ic stamp mini">印</i>${r.filter(lit).length} / ${r.length}</div></div>`).join('') +
      `<p class="gp-note" style="text-align:center">走近地标即可点亮；点击任意藏品直达它的位置</p>`;
  }
  $('gpanel').innerHTML = `<header><span class="bgw">${shop ? 'TICKETS' : 'COLLECTION'}</span><h2>${shop ? '门票商城' : '藏品展厅'}</h2><div class="pcur">${curHTML()}</div><button class="close" aria-label="返回">➜</button></header>
    <div class="gp-body"><nav>${tabs}</nav><main>${main}</main></div>${evaGuideMarkup("gp-guide")}${shop && !topup ? `<button class="buy" ${P.sel ? '' : 'disabled'}>购买</button>` : ''}`;
}

// 模拟玩家：四个使用 Eva 图片形象的角色在当前城市里闲逛
function npcPlace(n, c) {
  for (let k = 0; k < 60; k++) {
    const a = Math.random() * 6.283, r = 8 + Math.random() * 40, x = c.H.x + Math.cos(a) * r, z = c.H.z + Math.sin(a) * r, w = walkable(x, z);
    if (w && w.c === c) { n.pos.set(x, w.y, z); n.y = w.y; n.target = null; n.g.root.visible = true; return; }
  }
  n.g.root.visible = false;
}
function npcStep(n, dt, t) {
  if (!n.g.root.visible) return;
  let speed = 0;
  if (n.wait > 0) n.wait -= dt;
  else {
    for (let k = 0; k < 10 && !n.target; k++) { const a = Math.random() * 6.283, r = 6 + Math.random() * 18, x = n.pos.x + Math.cos(a) * r, z = n.pos.z + Math.sin(a) * r; if (walkable(x, z)) n.target = V3(x, 0, z); }
    if (!n.target) n.wait = 1;
    else {
      const dx = n.target.x - n.pos.x, dz = n.target.z - n.pos.z, d = Math.hypot(dx, dz);
      if (d < 0.5) { n.target = null; n.wait = 0.8 + Math.random() * 2.5; }
      else {
        const s = Math.min(d, 2 * dt), w = walkable(n.pos.x + dx / d * s, n.pos.z + dz / d * s);
        if (!w) { n.target = null; n.wait = 0.3; }
        else { n.pos.x += dx / d * s; n.pos.z += dz / d * s; n.y += (w.y - n.y) * Math.min(1, dt * 10); speed = 0.75; let a = Math.atan2(dx, dz) - n.yaw; a -= Math.round(a / 6.283) * 6.283; n.yaw += a * Math.min(1, dt * 8); }
      }
    }
  }
  n.g.root.position.set(n.pos.x, n.y, n.pos.z); n.g.root.rotation.y = n.yaw; n.g.animate(dt, speed, t + n.ph);
}
// 头顶名牌（HTML，跟着 3D 位置投影到屏幕）
const _tp = V3();
function tagAt(el, obj, W, H) {
  _tp.copy(obj.position); _tp.y += obj.userData.tagHeight || 3.15; _tp.project(camera);
  const vis = obj.visible && !EX.overview && _tp.z < 1 && Math.abs(_tp.x) < 1.05 && Math.abs(_tp.y) < 1.05 && camera.position.distanceTo(obj.position) < 150;
  el.style.display = vis ? 'block' : 'none';
  if (vis) el.style.transform = `translate(${((_tp.x + 1) / 2 * W).toFixed(1)}px,${((1 - _tp.y) / 2 * H).toFixed(1)}px) translate(-50%,-100%)`;
}
function gameFrame(dt, now) {
  for (const n of GUI.npcs) npcStep(n, dt, now / 1000);
  const W = stageEl.clientWidth, H = stageEl.clientHeight;
  tagAt(GUI.myTag, girl.root, W, H);
  for (const n of GUI.npcs) {
    tagAt(n.tag, n.g.root, W, H);
    if (review.fixed && review.character) n.tag.style.display = 'none';
  }
}

function gameLoadProgress() {
  const done = ALL_LM.filter(l => l.loaded || l.failed).length, u = ALL_LM.length ? done / ALL_LM.length : 0;
  $('glFill').style.width = (u * 100).toFixed(0) + '%'; $('glPct').textContent = (u * 100).toFixed(0) + '%';
  if (u >= 1 && $('glGo').disabled) { $('glGo').disabled = false; $('glGo').textContent = '开始探索'; }
}
function enterGame() {
  if (GUI.ready) return;
  $('gameLoad').classList.add('out'); setTimeout(() => $('gameLoad').style.display = 'none', 650);
  clearInterval(GUI.tipTimer); GUI.loading = false; GUI.ready = true;
  if (state.music) musicNow.play().then(musicUI).catch(() => {});   // 点击即用户手势，浏览器会放行自动播放
  makeAvatar(); hudRefresh();
  setTimeout(() => $('hint').classList.add('fade'), 15000);
  const c = EX.city || world.cities.find(c => c.id === 'dubai');
  GUI.seen.add(c.id);
  cityIntro(c, () => { if (!store.get(GIFT_KEY, false)) { store.set(GIFT_KEY, true); giveCoupon(); rewardPop('恭喜获得', '新手礼包 · 平行世界欢迎你', [{ html: COUPON_HTML, name: '门票 8 折券', n: 1 }]); } });
}

function hideMenu() { $('hudMenuPop').classList.remove('show'); }
function setupGameUI() {
  $('hudId').textContent = playerId;
  const tick = () => { $('hudClock').textContent = new Date().toTimeString().slice(0, 8); }; tick(); setInterval(tick, 1000);
  $('hudGoTo').textContent = '下一站 · ' + CITIES[nextCity('dubai')].nameZh;
  // 加载页：进度 + 轮播小贴士；45 秒还没加载完也放行（缺的地标用脚手架占位）
  let ti = 0; $('glTip').textContent = '💡 ' + TIPS[0];
  GUI.tipTimer = setInterval(() => { $('glTip').textContent = '💡 ' + TIPS[++ti % TIPS.length]; }, 2600);
  setTimeout(() => { if ($('glGo').disabled) { $('glGo').disabled = false; $('glGo').textContent = '开始探索'; } }, 45000);
  gameLoadProgress();
  $('glGo').onclick = enterGame;
  // 名牌 + 模拟玩家
  const tag = (txt, me) => { const d = document.createElement('div'); d.className = 'ntag' + (me ? ' me' : ''); d.textContent = txt; $('tags').appendChild(d); return d; };
  GUI.myTag = tag(playerId, true);
  GUI.npcs = NPC_LOOKS.map((look, i) => { const g = makeGirl(look); g.root.visible = false; scene.add(g.root); return { g, look, pos: V3(), y: 1, yaw: i * 1.6, wait: i * 0.4, ph: i * 1.3, tag: tag(look.name) }; });
  // HUD 按钮
  $('hudGo').onclick = () => { hideMenu(); travelTo(nextCity(EX.city ? EX.city.id : 'dubai')); };
  $('hudTop').onclick = () => openPanel('shop', 'topup');
  $('hudSide').onclick = e => { const b = e.target.closest('button'); if (!b) return; const a = b.dataset.act; hideMenu();
    if (a === 'shop' || a === 'coll') openPanel(a); else if (a === 'map') toggleOverview(); else if (a === 'mine') $('myTix').click(); };
  $('hudQuests').onclick = e => { const b = e.target.closest('button'); if (b) questGo(b.dataset.act); };
  $('hudMenu').onclick = () => {
    const el = $('hudMenuPop'); if (el.classList.toggle('show')) el.innerHTML = [['music', state.music ? '♪ 音乐：开（点击关闭）' : '♪ 音乐：关（点击开启）'], ['help', '？ 操作说明'], ['reset', '↺ 重置演示数据']].map(([k, t]) => `<button data-m="${k}">${t}</button>`).join('');
  };
  $('hudMenuPop').onclick = e => { const b = e.target.closest('button'); if (!b) return; hideMenu(); const m = b.dataset.m;
    if (m === 'music') $('music').click();
    else if (m === 'help') showPop(`<div class="gp-card" style="padding-left:22px"><button class="gp-x" aria-label="关闭">×</button><h2>操作说明</h2><ul class="gp-help">
      <li>方向键 / WASD 走动，按住 Shift 奔跑；手机用左下角方向键</li><li>拖动画面转视角，滚轮缩放</li><li>走近地标：弹出介绍并点亮城市印记；介绍卡里可用 PWV 买门票</li>
      <li>右下角 GO 前往下一座城；底部城市按钮一点直达</li><li>M 打开世界地图，Esc 关闭弹窗</li></ul><div class="gp-btns"><button class="ok" data-go="close">知道了</button></div></div>`);
    else if (m === 'reset' && confirm('清空本浏览器里的演示数据（打卡、门票订单、PWV 余额、优惠券）并重新开始？')) {
      [CHECK_KEY, GIFT_KEY, WALLET_KEY, ORDERS_KEY, COUPON_KEY, WATCH_KEY].forEach(k => { try { localStorage.removeItem(k); } catch (e) {} }); location.reload();
    }
  };
  $('gpop').onclick = e => {
    const P = GUI.pop; if (!P) return;
    const go = e.target.closest('[data-go]'), fig = e.target.closest('figure[data-k]');
    if (e.target.closest('.gp-x') || (go && go.dataset.go === 'close')) return closePop();
    if (go && go.dataset.go === 'shop') { closePop(); return openPanel('shop'); }
    if (fig) { const L = lmByKey(fig.dataset.k); closePop(); if (L) goLandmark(L); return; }
    if (P.blank || e.target.id === 'gpop') closePop();
  };
  $('gpanel').onclick = e => {
    const P = GUI.panel; if (!P) return;
    if (e.target.closest('.close')) return closePanel();
    const tabB = e.target.closest('nav button'); if (tabB) { P.city = tabB.dataset.city; P.sel = null; return renderPanel(); }
    const top = e.target.closest('[data-top]');
    if (top) { pwvBalance += +top.dataset.top; store.set(WALLET_KEY, pwvBalance); hudRefresh(); renderPanel(); return rewardToast('', `演示充值 +${top.dataset.top} PWV`, `余额 ${fmtPWV(pwvBalance)}`); }
    const card = e.target.closest('.sc'); if (card) { P.sel = lmByKey(card.dataset.k); return renderPanel(); }
    if (e.target.closest('.buy') && P.sel) return openTickets(P.sel);
    const ci = e.target.closest('.ci'); if (ci) { const L = lmByKey(ci.dataset.k); closePanel(); if (L) goLandmark(L); }
  };
  addEventListener('keydown', e => { if (e.key !== 'Escape' || tix) return; if (GUI.pop) closePop(); else if (GUI.panel) closePanel(); else hideMenu(); }, true);   // 捕获阶段：先于关票窗的监听判断
  addEventListener('pointerdown', e => { if (!e.target.closest('#hudMenuPop,#hudMenu')) hideMenu(); });
}

// Review tools are DOM controls so validation uses the same UI as a player.
const REVIEW = QS.get('review') === '1';
const review = { enabled: realism.enabled, frozen: false, fixed: false, time: 0, errors: [], fps: 0, camera: '自由探索', character: false, poseSpeed: 0 };
function setReviewCamera(kind) {
  review.fixed = true; review.character = false;
  controls.minDistance = 4.5; controls.maxPolarAngle = 1.38;
  for (let i = 0; i < 3 && GUI.pop; i++) closePop();
  closePanel(); hideCard(); camFly = null;
  EX.overview = false; EX.hold = true; EX.keys.clear(); document.body.classList.remove('overview');
  controls.maxDistance = 3000;
  const [x, z] = CITY_GRID.dubai;
  const shots = {
    island: { p: [105, 105, 130], q: [0, 3, -10], name: '迪拜全岛' },
    plaza: { p: [27, 22, -5], q: [0, 1.3, -32], name: '迪拜广场' },
    close: { p: [-7, 6, -18], q: [0, 2, -33], name: '广场近景' },
    street: { p: [-8, 12, 0], q: [-23, 3, -25], name: '西侧街区' },
    arcade: { p: [-11, 6, -18], q: [-23, 3.4, -25], name: '立面细节' },
    planting: { p: [-16, 3.7, .5], q: [-11.2, 1.7, -5.9], name: '混合种植近景' },
    corner: { p: [-17, 3, -3], q: [-12.7, 2.2, -6.75], name: '石材转角' },
    garden: { p: [-25, 3.6, -1], q: [-29, 1.9, -10], name: '花园细节' },
    road: { p: [-34, 3.8, -11], q: [-34, 1.4, -23], name: '街道细节' },
    flowers: { p: [-21, 8.2, -3], q: [-27, 5.7, -10], name: '屋顶垂花' },
    waterfront: { p: [-17, 12, 17], q: [-20, 3.8, -10], name: '滨水样板区' },
    fountain: { p: [-17, 4.2, -3.6], q: [-20, 1.6, -9.4], name: '喷泉水滴' },
    quay: { p: [-14, 2.2, 5], q: [-21, .75, -2.8], name: '护岸石材' },
    shop: { p: [-22.3, 3.7, -8.7], q: [-27.8, 2.7, -9.8], name: '店铺前场' },
    skyline: { p: [7, 18, -17], q: [20, 8, -53], name: '高楼天际线' },
    horizon: { p: [-18, 18, 53], q: [-5, 17, -30], name: '城市纵深对照' },
    east: { p: [52, 10, 3], q: [29, 3, -24], name: '东侧街区覆盖' },
    palmIsland: { p: [35, 16, 65], q: [0, 2, 43], name: '棕榈岛覆盖' },
    rear: { p: [-50, 8, -85], q: [-28, 4, -50], name: '后街与塔楼基座' },
    district: { p: [-22, 40, 78], q: [-9, 18, -28], name: '滨海街区' }
  };
  const shot = shots[kind];
  spawnAt('dubai'); girl.root.position.copy(EX.pos);
  camera.position.set(x + shot.p[0], shot.p[1], z + shot.p[2]);
  controls.target.set(x + shot.q[0], shot.q[1], z + shot.q[2]);
  camera.lookAt(controls.target); controls.update(); review.camera = shot.name;
}
function setReviewCharacter(view) {
  setReviewCamera('street'); review.character = true;
  EX.yaw = 0; girl.root.rotation.y = 0;
  controls.minDistance = view === 'portrait' ? .75 : 2; controls.maxPolarAngle = 1.52;
  const offset = view === 'portrait' ? V3(0,2.86,1.65) : view === 'back' ? V3(0,2.3,-6.4) : view === 'side' ? V3(6.4,2.3,0) : V3(0,2.3,6.4);
  camera.position.copy(EX.pos).add(offset); controls.target.copy(EX.pos).add(V3(0,view === 'portrait' ? 2.79 : 1.65,0));
  camera.lookAt(controls.target); controls.update();
  review.camera = 'Eva · ' + ({front:'正面',side:'侧面',back:'背面',portrait:'面部特写'}[view]);
}
function setReviewVehicle() {
  setReviewCamera('road');
  review.time = 180; review.frozen = true; world.render(review.time);
  const city = world.cities.find(c => c.id === 'dubai'), car = city.w.ctx.vehicles[0];
  if (!car) return;
  const origin = new THREE.Vector3().setFromMatrixPosition(car.pose);
  city.w.root.localToWorld(origin);
  const rotation = new THREE.Quaternion().setFromRotationMatrix(car.pose);
  camera.position.copy(origin).add(V3(3,1.7,4.1).applyQuaternion(rotation));
  controls.target.copy(origin).add(V3(0,.45,0));
  controls.minDistance = 2; camera.lookAt(controls.target); controls.update();
  review.camera = '车辆细节';
  $('reviewFreeze').textContent = '继续环境动画'; $('reviewFreeze').setAttribute('aria-pressed','true');
}
function setupReview() {
  if (!REVIEW) return;
  document.body.classList.add('review');
  const panel = document.createElement('section'); panel.id = 'reviewPanel'; panel.setAttribute('aria-label', '视觉验收');
  panel.innerHTML = `<strong>视觉验收 · 第十八轮</strong><div class="reviewBtns"><button data-shot="island">全岛</button><button data-shot="plaza">广场</button><button data-shot="close">近景</button><button data-shot="street">街区</button><button data-shot="district">滨海</button></div><div class="reviewBtns"><button data-shot="arcade">立面细节</button><button data-shot="garden">花园细节</button><button data-shot="road">街道细节</button><button data-shot="skyline">高楼细节</button></div><div class="reviewBtns"><button data-shot="waterfront">滨水样板</button><button data-shot="shop">店铺前场</button><button data-shot="quay">岸石细节</button><button data-shot="fountain">喷泉细节</button><button data-shot="flowers">屋顶垂花</button></div><div class="reviewBtns"><button data-shot="planting">种植层次</button><button data-shot="corner">墙角细节</button></div><div class="reviewBtns"><button id="reviewLook" aria-pressed="true">After · 写实材质</button><button id="reviewDetail" aria-pressed="true">第二轮 · 建筑与棕榈</button><button id="reviewDistrict" aria-pressed="true">第十八轮 · 天际线</button><button id="reviewFreeze" aria-pressed="false">定格环境</button></div><div class="reviewBtns"><button data-character="front">Eva 正面</button><button data-character="side">侧面</button><button data-character="back">背面</button><button id="reviewGait" aria-pressed="false">步行预览</button></div><div class="reviewBtns"><button data-character="portrait">面部特写</button><button id="reviewVehicle">车辆细节</button></div><div class="reviewBtns"><button id="reviewAO" aria-pressed="true">接触阴影 · 开</button><button id="reviewReflections" aria-pressed="true">街区反射 · 开</button><button id="reviewBounce" aria-pressed="true">拱廊反弹光 · 开</button><button id="reviewSkyline" aria-pressed="true">远景楼群 · 开</button></div><output id="reviewStatus" aria-live="polite">正在启动…</output>`;
  stageEl.append(panel);
  const coverageShots = document.createElement('div'); coverageShots.className = 'reviewBtns';
  for (const [shot, label] of [['horizon', '城市纵深'], ['east', '东侧街区'], ['palmIsland', '棕榈岛'], ['rear', '后街基座']]) {
    const button = document.createElement('button'); button.dataset.shot = shot; button.textContent = label;
    coverageShots.append(button);
  }
  panel.querySelector('strong').after(coverageShots);
  $('reviewVehicle').onclick = setReviewVehicle;
  for(const [id,label,key,setter] of [
    ['reviewAO','接触阴影','contactEnabled','setContactEnabled'],
    ['reviewBounce','拱廊反弹光','bounceEnabled','setBounceEnabled'],
    ['reviewReflections','街区反射','reflectionsEnabled','setReflectionsEnabled'],
    ['reviewSkyline','远景楼群','skylineEnabled','setSkylineEnabled']]) {
    const update=()=>{ $(id).textContent=label+' · '+(realism[key]?'开':'关');$(id).setAttribute('aria-pressed',String(realism[key])); };
    $(id).onclick=()=>{realism[setter](!realism[key]);update();};update();
  }
  $('reviewLook').textContent = review.enabled ? 'After · 写实材质' : 'Before · 基础材质';
  $('reviewLook').setAttribute('aria-pressed', String(review.enabled));
  panel.querySelectorAll('[data-shot]').forEach(b => b.onclick = () => setReviewCamera(b.dataset.shot));
  panel.querySelectorAll('[data-character]').forEach(b => b.onclick = () => setReviewCharacter(b.dataset.character));
  $('reviewGait').onclick = () => {
    if (!review.character) setReviewCharacter('front');
    review.poseSpeed = review.poseSpeed === 0 ? 1 : review.poseSpeed === 1 ? 1.8 : 0; review.frozen = false;
    $('reviewGait').setAttribute('aria-pressed', String(!!review.poseSpeed));
    $('reviewGait').textContent = review.poseSpeed === 0 ? '步行预览' : review.poseSpeed === 1 ? '跑步预览' : '返回待机';
    $('reviewFreeze').textContent = '定格环境'; $('reviewFreeze').setAttribute('aria-pressed','false');
  };
  $('reviewLook').onclick = () => {
    review.enabled = !review.enabled; realism.setEnabled(review.enabled);
    $('reviewLook').textContent = review.enabled ? 'After · 写实材质' : 'Before · 基础材质';
    $('reviewLook').setAttribute('aria-pressed', String(review.enabled));
  };
  const updateDistrictButton = () => {
    $('reviewDistrict').textContent = realism.districtEnabled ? '第十八轮 · 天际线' : '第二轮 · 局部样本';
    $('reviewDistrict').setAttribute('aria-pressed', String(realism.districtEnabled));
  };
  updateDistrictButton();
  $('reviewDistrict').onclick = () => { realism.setDistrictEnabled(!realism.districtEnabled); updateDistrictButton(); };
  const updateDetailButton = () => {
    $('reviewDetail').textContent = realism.refinementEnabled ? '几何精修 · 开' : '第一轮 · 材质基线';
    $('reviewDetail').setAttribute('aria-pressed', String(realism.refinementEnabled));
  };
  updateDetailButton();
  $('reviewDetail').onclick = () => {
    realism.setRefinementEnabled(!realism.refinementEnabled); updateDetailButton();
  };
  $('reviewFreeze').onclick = () => {
    review.frozen = !review.frozen; if (review.frozen) review.time = 180;
    $('reviewFreeze').textContent = review.frozen ? '继续环境动画' : '定格环境';
    $('reviewFreeze').setAttribute('aria-pressed', String(review.frozen));
  };
  addEventListener('error', e => review.errors.push(e.message || '资源加载失败'));
  addEventListener('unhandledrejection', e => review.errors.push(String(e.reason)));
}
function updateReview() {
  if (!REVIEW) return;
  const ok = ALL_LM.filter(l => l.loaded).length, failed = ALL_LM.filter(l => l.failed).length;
  const xyz = v => v.toArray().map(n => n.toFixed(1)).join(', ');
  $('reviewStatus').textContent = `角色：Eva 多视角图片角色 · ${girl.stats.triangles.toLocaleString()} triangles / ${girl.stats.drawCalls} calls\n状态：${GUI.ready ? '游戏运行' : '加载页面'}\n地标：成功 ${ok}/${ALL_LM.length} · 失败 ${failed}\n城市：${EX.city?.city.nameZh || '迪拜'} · ${review.camera}\n位置：${xyz(EX.pos)}\n相机：${xyz(camera.position)}\n目标：${xyz(controls.target)}\nFPS ${review.fps.toFixed(0)} · triangles ${renderer.info.render.triangles.toLocaleString()}\ndraw calls ${renderer.info.render.calls} · 精修 ${realism.enabled && realism.refinementEnabled ? '开' : '关'}\n样本 ${realism.refinementStats.map(s => s.vehicles != null ? s.vehicles + ' 辆车' : s.buildings != null ? s.buildings + ' 栋建筑' : s.palms != null ? s.palms + ' 棵棕榈' : s.landmarks != null ? s.landmarks + ' 处地标' : s.decorations + ' 处街景').join(' / ')} · 环境 ${review.time.toFixed(1)}s${review.frozen ? '（已定格）' : ''}\n画布 ${renderer.domElement.width}×${renderer.domElement.height} · DPR ${renderer.getPixelRatio().toFixed(2)}\n阴影 ${sun.shadow.mapSize.x}×${sun.shadow.mapSize.y} · 可见城市 ${world.cities.filter(c => c.w.root.visible).length}/11\n${realism.lightingStatus}\n运行错误：${review.errors.length}${review.errors.length ? '\n' + review.errors.at(-1) : ''}`;
}
function resize() {
  const pr = Math.min(devicePixelRatio || 1, MAX_PIXEL_RATIO);
  if (renderer.getPixelRatio() !== pr) renderer.setPixelRatio(pr);
  const w = stageEl.clientWidth, h = stageEl.clientHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
let fpsN = 0, fpsT = performance.now();
function frame(now) {
  const dt = Math.max(0, Math.min(0.1, (now - state.last) / 1000)); state.last = now;
  if (!review.frozen) review.time += dt;
  world.render(review.time); seaMat.uniforms.uT.value = review.time;
  // A frozen review also freezes NPC/character motion, keeping A/B frames comparable.
  const frozenReview = review.frozen && review.fixed;
  exploreStep(frozenReview ? 0 : dt, frozenReview ? 180000 : now);
  updateCityVisibility(camera, controls.target, EX.overview);
  realism.update({ target: controls.target, overview: EX.overview, time: review.time });
  prepareCharacterViews(camera);
  realism.render();
  fpsN++;
  if (now - fpsT > 500) {
    review.fps = fpsN * 1000 / (now - fpsT); fpsN = 0; fpsT = now; updateReview();
  }
  requestAnimationFrame(frame);
}
setupReview();
try {
  world = buildExploreWorld('parallel-world'); scene.add(world.root);
  setupExplore(); resize();
  requestAnimationFrame(frame);
} catch (error) {
  review.errors.push(String(error));
  $('glTip').textContent = '场景启动失败，请刷新重试。' + error.message;
  if (REVIEW) $('reviewStatus').textContent = '启动失败：' + error.stack;
  console.error(error);
}
addEventListener('pagehide', event => { if (!event.persisted) realism.dispose(); });
