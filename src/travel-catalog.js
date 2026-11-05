// Editorial place data. Never derive real-world locations from miniature coordinates.
export const SOURCE_CHECKED = '2026-11-05';
const place = (id, name, english, area, description, official, options = {}) => ({
  id, city: id.split(':')[0], name, english, area, description, official,
  mapQuery: `${english}, ${id.startsWith('dubai:') ? 'Dubai' : 'Abu Dhabi'}, UAE`,
  visitNote: '出发前查看官方开放安排、预约条件与价格。本站不售票。',
  partner: false, sourceChecked: SOURCE_CHECKED, ...options,
});
export const PLACES = [
  place('dubai:burj_khalifa','哈利法塔','Burj Khalifa','Downtown Dubai',
    '从天际线开始认识迪拜。先在主题观景厅看看城市轮廓，再决定是否安排现实中的观景体验。',
    'https://www.emaar.com/en/at-the-top-burj-khalifa', {interest:'skyline', duration:'建议为观景预留独立时段'}),
  place('dubai:museum_future','未来博物馆','Museum of the Future','Sheikh Zayed Road',
    '从环形建筑与未来生活的想象出发，发现你最感兴趣的城市主题。',
    'https://museumofthefuture.ae/en/', {interest:'culture', visitNote:'2026-11-05 核对时，官网提示展览暂时关闭。云游可继续；现实访问请先查看官方最新公告。'}),
  place('dubai:atlantis','亚特兰蒂斯','Atlantis The Palm','Palm Jumeirah',
    '用海洋主题微景观发现亲子旅行灵感。水族空间是艺术化创作，实际服务由运营方提供。',
    'https://www.atlantis.com/dubai/experiences', {interest:'family', visitNote:'水族、乐园、住宿是不同服务；请在运营方页面核对实际可购项目与访问条件。'}),
  place('dubai:burj_al_arab','帆船酒店','Jumeirah Burj Al Arab','Jumeirah',
    '帆形轮廓、蓝金装饰与挑廊，是这段建筑主题体验的观察重点。',
    'https://www.jumeirah.com/en/stay/dubai/jumeirah-burj-al-arab-a-jumeirah-icon', {interest:'culture', visitNote:'官网介绍酒店修缮计划。本主题中庭不代表现场当前可进入，请先核对运营方公告。'}),
  place('dubai:cruise_terminal','海港旅行主题空间','Dubai Harbour','Dubai Harbour',
    '游戏中的弧形港湾是海港主题创作。现实目的地信息指向 Dubai Harbour，不把邮轮码头等同于 Dubai Marina 游艇步道。',
    'https://www.dubaiharbour.com/', {interest:'waterfront', visitNote:'码头访问与登船以运营方安排为准。滨水半日行程位于 Dubai Marina，需要另行前往。', thematic:true}),
  place('dubai:waterfront_wheel','滨海摩天轮主题空间','Ain Dubai','Bluewaters',
    '从微缩摩天轮欣赏海湾轮廓。现实中可了解 Bluewaters 的 Ain Dubai；游戏岛屿不是实际地理比例。',
    'https://www.aindubai.com/en/contact-us', {interest:'waterfront', thematic:true}),
  place('dubai:dubai_frame','迪拜相框','Dubai Frame','Zabeel Park',
    '以相框般的建筑轮廓观察新旧城市之间的关系。',
    'https://www.dubaiframe.ae/en', {interest:'skyline'}),
  place('dubai:emirates_towers','阿联酋大厦','Emirates Towers','Sheikh Zayed Road',
    '观察双塔的轮廓与周围城市空间。公共区域与酒店服务的访问条件各不相同。',
    'https://www.visitdubai.com/en/', {interest:'skyline', officialLabel:'Visit Dubai 旅游信息'}),
  place('abudhabi:grand_mosque','谢赫扎耶德大清真寺','Sheikh Zayed Grand Mosque','Al Rawdah',
    '从白石、柱廊和柔和光线认识建筑。参观前了解访问安排与礼仪，保持安静和尊重。',
    'https://www.szgmc.gov.ae/en/worshippers/en-v-visiting-hours', {interest:'culture', visitNote:'请通过清真寺官方访问页面核对预约、服装及参观要求。主题厅不代表实际可自由进入的区域。'}),
  place('abudhabi:emirates_palace','酋长国宫殿酒店','Emirates Palace Mandarin Oriental','West Corniche',
    '庭院、穹顶和会客空间表达阿布扎比的待客文化。这是宫殿式酒店，不是 Qasr Al Watan 总统府。',
    'https://www.mandarinoriental.com/en/abu-dhabi/emirates-palace', {interest:'culture', visitNote:'参观、餐饮和住宿条件以酒店说明为准，收藏地点不代表已预约。'}),
  place('abudhabi:etihad_towers','阿提哈德塔','Conrad Abu Dhabi Etihad Towers','West Corniche',
    '从海湾沙盘和曲面玻璃，看海岸与高楼如何组成城市天际线。',
    'https://visitabudhabi.ae/en/things-to-do/culture/landmarks-and-architecture/observation-deck-at-300/', {interest:'skyline'}),
  place('abudhabi:ferrari_world','法拉利世界','Ferrari World Abu Dhabi','Yas Island',
    '通过赛车、结构和赛道模型寻找家庭出游灵感；真实游乐项目请查看运营方说明。',
    'https://www.ferrariworldabudhabi.com/en/park-overview/opening-hours', {interest:'family'}),
  place('abudhabi:abrahamic','亚伯拉罕诸教之家','Abrahamic Family House','Saadiyat Island',
    '观察三座建筑如何以不同的空间语言，围绕交流与相互理解展开。',
    'https://www.abrahamicfamilyhouse.ae/?language=en', {interest:'culture', visitNote:'请核对官方访问、导览与礼仪安排。此处不设竞赛、消费排名或宗教任务奖励。'}),
  place('abudhabi:capital_gate','首都之门','Capital Gate','Al Rawdah',
    '观察倾斜塔楼与城市轮廓；外观浏览不代表酒店内部或观景服务已开放。',
    'https://visitabudhabi.ae/en/', {interest:'skyline', officialLabel:'Experience Abu Dhabi 旅游信息'}),
  place('dubai:marina_mall','Marina Mall 滨水起点','Dubai Marina Mall','Dubai Marina',
    '从商场开始安排补给与休息，再到面向水岸的一层展开散步。',
    'https://www.dubaimarinamall.com/faqs/', {interest:'waterfront', routeOnly:true, duration:'建议停留 30–45 分钟'}),
  place('dubai:marina_promenade','商场前滨水步道','Dubai Marina Mall Promenade','Dubai Marina',
    '沿商场前的步道看看游艇与楼群，在同一片水岸放慢脚步。',
    'https://www.visitdubai.com/en/places-to-visit/marina-walk', {interest:'waterfront', routeOnly:true, duration:'建议停留 30–60 分钟'}),
  place('dubai:pier7','Pier 7 餐饮选择','Pier 7','Dubai Marina',
    '在邻近 Marina Mall 的餐饮建筑里挑选适合自己的餐厅；先查看营业和预订安排。',
    'https://www.ecm.ae/en/communities/dubai-marina/discover/whats-around/pier-7-dubai-marina/', {interest:'waterfront', routeOnly:true, duration:'建议用餐预留 60–90 分钟', visitNote:'这里是公开目的地推荐，尚非 PW 合作商家；不提供平台优惠、预订或付款。'}),
];
export const PLACE_BY_ID = new Map(PLACES.map(p=>[p.id,p]));
export const MARINA_ROUTE = Object.freeze({
  id:'dubai-marina-half-day', title:'把半天，留给海湾', subtitle:'Dubai Marina · 散步与餐饮',
  ids:Object.freeze(['dubai:marina_mall','dubai:marina_promenade','dubai:pier7']),
  note:'建议预留半日，停留时间可自由调整。这是商场周边的行程草案；步行入口、开放情况及具体路径请在地图与官网核对。',
});
export function mapUrl(id) {
  const p=PLACE_BY_ID.get(id);return p ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.mapQuery)}` : null;
}
export const INTERESTS = [
  {id:'waterfront',label:'海滨生活',room:'dubai:cruise_terminal',copy:'从港湾微景观，走向现实中的滨水半日游。'},
  {id:'skyline',label:'城市天际线',room:'dubai:burj_khalifa',copy:'先看看城市轮廓，再收藏你的观景目的地。'},
  {id:'culture',label:'建筑与文化',room:'abudhabi:grand_mosque',copy:'留意柱廊、光线，以及到访前需要了解的礼仪。'},
  {id:'family',label:'亲子与海洋',room:'dubai:atlantis',copy:'从水族主题空间开始，寻找家庭旅行灵感。'},
];

// Authored guidance describes the model on screen, not unverified real exhibits.
export const ROOM_GUIDES = {
  'dubai:cruise_terminal': ['沿着沙盘的弧线看看：码头、步道与建筑共同围合了水面。这是海港主题的微景观，并不是实际港口平面图。','比较船体、泊位和步道的尺度。大型邮轮码头与游艇港承担不同的服务，现实中需要查清登船地点。','临水座位让旅行多了一段停留。想把这样的感受带到现实，可以收藏 Dubai Marina 的滨水半日行程。'],
  'dubai:burj_khalifa': ['从沙盘观察高低错落的天际线。找到最高的轮廓，再看看低层建筑如何衬托它。','把视线转向观景窗，比较框架、玻璃和城市远景。这里表达的是观景体验，不是实际楼层的测绘复刻。','看看城市展柜里的建筑节奏。喜欢这样的视角，可以保存哈利法塔，再到官方页面选择适合的观景安排。'],
  'dubai:museum_future': ['先观察悬浮星球与周围光环的关系。这是我们对未来主题的艺术表达，并不对应馆内当前的真实展品。','看看生命舱的形状与光线，想一想你更关注自然、科技还是城市生活。','环形光带把空间连成整体。先收藏灵感，现实出行前务必核对官方开放公告。'],
  'dubai:atlantis': ['靠近水族窗，看看蓝色水光如何改变空间气氛。模型中的鱼群是静态展陈，并非实时水族直播。','观察珊瑚之间的大小、色彩和间隙。亲子旅行可以从共同观察一个细节开始。','海底微型遗迹为主题空间增加故事感。现实水族与乐园是不同服务，请通过运营方页面确认。'],
  'dubai:burj_al_arab': ['阶梯水景把视线引向中庭。比较水面反光与石材的明暗，看看它们怎样共同形成层次。','向上观察挑廊的连续节奏与空间高度。这里是帆船酒店主题演绎，不是当前现场导览。','蓝金色座席表达会客与休憩氛围。保存建筑灵感，现实服务先查看酒店最新说明。'],
  'abudhabi:grand_mosque': ['沿柱廊看向拱梁，留意白石在光线下的层次。宗教建筑中的观察应保持安静、克制与尊重。','金色壁龛在主题空间中形成视觉中心。这里用于建筑欣赏，不模拟宗教仪式或设置竞赛。','观察地毯边饰与柱列的关系。真实到访前请核对清真寺官方预约与参观礼仪。'],
  'abudhabi:emirates_palace': ['从中央水景观察穹顶与柱廊的倒影，看看对称如何组织一个迎宾空间。','抬头看吊灯和穹顶之间的尺度，感受暖光在石材上的变化。这是主题微景观。','会客区和植物让大厅更适合停留。现实目的地是宫殿酒店，不是总统府；访问条件由酒店确认。'],
  'abudhabi:etihad_towers': ['观察沙盘中的海湾与曲面塔楼，比较建筑轮廓如何回应水岸。','沿着弧形玻璃看向不同方向。这里呈现观景空间的设计想象，不等同于真实楼层布局。','靠窗座椅让观景变成一段休息。可以保存地点，再通过旅游官方页面了解现实观景服务。'],
  'abudhabi:ferrari_world': ['看看赛车模型的流线与轮胎细节。这里是一段静态设计欣赏，不是驾驶游戏。','俯看微型赛道，观察转弯与直线如何组成节奏。它表达赛车主题，不是园区导航图。','从机械陈列回到家庭旅行：适合哪些项目、有哪些限制，请以运营方当日说明为准。'],
  'abudhabi:abrahamic': ['比较三座微型建筑的轮廓与开口方式，留意它们各自的空间语言。','看看水院与树影如何形成安静的公共空间，体验交流与相互理解的主题。','光线通过格栅进入廊道，构成细密节奏。现实访问前请阅读官方导览与礼仪说明。'],
};
