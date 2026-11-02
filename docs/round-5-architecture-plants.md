# 第五轮：建筑纵深与植物细节

2026-11-02。独立仓库 tourist-agent；原项目没有合并或修改。

## 改动

- 迪拜低层建筑改成独立的 `dubai-villas.js` 构造：约 0.84–1.15 米深的拱廊、退进店面、二层露台、木格遮阳、分块拱石、窗台、百叶窗、圈纹栏杆、吊灯和攀花。部分原本较高的建筑保留高度余量制作风塔。既有建筑水平碰撞范围不变，拱廊是可见的空间凹进，暂不开放进入室内。
- 24 棵棕榈从 13 片规则叶簇改为 23 片弯曲、下垂、长短不一的叶簇；每棵有不同旋转与比例，细化树干叶柄残基。仍合批为 3 个实例绘制，不逐叶创建绘制对象。
- 花坛增加盆沿、叶脉、自然叶缘与三瓣花苞；小乔木增加枝梢和分层叶簇。折叠叶片使用 alpha test，可写深度并投影，不使用透明排序。带贴图时每簇 48 片、每片 4 三角形，替换旧几何模式每簇 32 片、每片 6 三角形。
- 验收模式增加「立面细节」「花园细节」机位；正常游玩不显示验收面板。

## 检查

- `npm run check`、`npm test`（11 项）、`npm run build` 通过。Three.js 的既有 500 kB bundle 提示仍存在。
- 新增射线检查：拱口和露台中央透过一米左右空隙命中退进的窗面，外侧柱子保持实体。验证旋转建筑的水平范围、最大高度、植被几何有效性、原实例恢复、共享材质纹理释放边界与路径碰撞的反复切换。
- 浏览器 1440×900、DPR 1：游戏内显示 54/54 地标成功、运行错误 0。另检查 390×844 的普通游玩布局及方向键行走。
- 同一街区机位，相机 [-353,12,-230]，目标 [-368,3,-255]，环境时间固定为 180。截图 `validation/round-5/before.png` 来自 a842580；`after.png` 来自本轮。其他截图为花园、立面、滨海和手机视图。
- 场景可见三角形约 69–75 万，比旧街区截图的 55.7 万增加；NPC 位置/可见性也影响计数。当前桌面检查约 110–120 FPS，仅为这次机器、窗口和场景读数，不能代表手机硬件性能。

## 尚有的视觉差距

这是一轮局部渐进精修，尚未达到参考图的离线建筑可视化品质。街区体量仍偏窄高，建筑类型与室内内容重复，街道、车模和远景高楼较简化；植被分布密度、真实环境反射和间接光层次仍需继续处理。截图保留真实游戏画面，没有用生成图替换验收画面。

## 叶片资源与来源

- 内置 imagegen 生成，未调用 CLI/API fallback。
- 项目资源：`src/assets/ficus-leaf-v1.png`（1254×1254 RGBA，约 1.13 MB）。生成 alpha 保留；图片没有后期抠图或改色。运行时用材质染色、折叠几何与 alpha test 显示。
- 接入：`src/realism.js` 加载；`src/dubai-landscape.js` 使用；资源由 realism 统一释放。
- 最终生成提示词：

```text
Use case: photorealistic-natural. Asset type: game foliage albedo with alpha, for instanced 3D leaves in a realistic Dubai courtyard. Generate ONE single natural ficus leaf viewed perfectly flat from directly above, tip at top, short petiole at bottom, centered upright. The leaf fills 90 percent of the height and 60 percent of the width of a square canvas. Botanical photographic surface detail: fine branching veins, subtle waxy cuticle, mildly irregular smooth elliptical edges and pointed tip, muted fresh olive green with natural variation. Flat diffuse neutral illumination, no directional highlights or shadows baked into the image. Genuine transparent RGBA background, clean antialiased alpha edge, no ground, no cast shadow, no extra leaves, no text, no labels, no frame. Production texture, not a diagram.
```
