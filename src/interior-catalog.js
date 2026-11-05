import {EDITION} from './edition.js';
// Theme studies, not surveyed reconstructions or a ticket/payment requirement.
export const INTERIOR_LIBRARY = [
 ['abudhabi','grand_mosque','白石主祈祷厅','mosque','白石柱廊、金色壁龛与花纹地毯，沿中轴看向层叠吊灯。',['柱廊与拱梁','金色壁龛','花纹地毯']],
 ['abudhabi','emirates_palace','皇宫花园大厅','palace','在暖色石材与穹顶下，查看中央水景、会客区和室内花园。',['中央水景','穹顶与吊灯','会客花园']],
 ['abudhabi','ferrari_world','赛车设计展厅','racing','红色结构屋顶下的赛车展台、轮胎陈列与赛道微缩模型。',['赛车展台','赛道模型','机械陈列']],
 ['abudhabi','etihad_towers','海湾观景厅','etihad','弧形玻璃幕墙前的休憩区，中央沙盘呈现海湾与塔楼。',['海湾沙盘','观景玻璃','休憩区']],
 ['abudhabi','abrahamic','光与庭院展厅','courtyard','三座不同轮廓的微型建筑围绕安静水院，光线穿过细密格栅。',['三座微型建筑','水院与树影','格栅光廊']],
 ['dubai','burj_khalifa','云端城市观景厅','burj','以竖向金属肋和天际线沙盘为中心的高空观景空间。',['天际线沙盘','落地观景窗','城市展柜']],
 ['dubai','museum_future','未来生命展厅','future','环形光带包围生物舱与悬浮星球，探索未来城市的想象。',['星球装置','生命舱','环形光带']],
 ['dubai','atlantis','海底观景大厅','aquarium','在蓝色水族窗前观察鱼群、珊瑚和海底微型遗迹。',['水族窗','珊瑚花园','海底遗迹']],
 ['dubai','burj_al_arab','帆影中庭','sail','蓝金色中庭、多层挑廊与中央阶梯水景构成酒店微景观。',['阶梯水景','挑廊层次','蓝金会客区']],
 ['dubai','cruise_terminal','海港旅行大厅','harbor','弧形港湾沙盘、邮轮模型与临水咖啡座，呈现启航前的港口。',['弧形港湾','邮轮模型','临水咖啡座']],
 ['lasvegas','sphere','球幕沉浸剧场','sphere','环绕星空球幕、阶梯座席与发光舞台构成一座微型剧场。',['星空球幕','阶梯座席','发光舞台']],
 ['lasvegas','luxor','金字塔中庭','luxor','斜向框架、砂岩柱廊与金字塔展台组成沙漠主题中庭。',['金字塔展台','砂岩柱廊','斜向屋架']],
 ['lasvegas','resorts','度假花园大厅','resort','室内树木、水景和红金色会客区围合成休憩花园。',['室内花园','反射水池','会客区']],
 ['lasvegas','strat','高塔观景酒廊','strat','环形观景窗与沙漠城市沙盘，搭配靠窗座椅与吧台。',['沙漠城市','环形观景窗','靠窗酒廊']],
 ['lasvegas','rqq','巴黎气球观景舱','balloon','球形舱架、蓝金装饰与微型铁塔，构成气球主题观景空间。',['微型铁塔','球形舱架','蓝金观景台']]
].map(([city,landmark,title,theme,description,details])=>({id:`${city}:${landmark}`,city,landmark,title,theme,description,details}));
export const INTERIORS = INTERIOR_LIBRARY.filter(room=>EDITION.cities.includes(room.city));
export const interiorFor = (city,landmark)=>INTERIORS.find(x=>x.city===city&&x.landmark===landmark);
export const activeInteriorVisits = keys => [...new Set(keys)].filter(k=>INTERIORS.some(r=>r.id===k));
