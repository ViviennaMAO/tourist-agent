# 第四轮：可操控的 Eva 三维角色

2026-11-02。只更新独立 tourist-agent Explore 项目。

## 角色与街区

- 删除旧 `makeGirl` 大头Q版实现，使用 `src/eva-character.js` 构建真实体积的关节模型。玩家及四名NPC全部使用新模型；NPC采用较低网格细度和柔和的配色差异。不是朝向镜头的平面立绘。
- 对照既有Eva设定，重做头身比例、投影面部、黑色中分波浪发、方领泡泡袖、腰带/缝线、织物细节、褶皱中长裙、手指及米白玛丽珍鞋。立绘与模型是两种独立资产，不声称三维模型已逐像素还原参考图。
- 使用髋/膝/踝与肩/肘/手关节。两段腿部IK保持支撑脚落地；衣裙根据腿部轮廓变形并更新法线，避免膝盖穿出。定格或静止时跳过重复布料计算。包含待机呼吸/头部小动作、头发轻摆、走路及跑步。
- 本轮迭代修复：肘部错位、下颌形状、头顶发际线、侧面头发间隙、耳朵穿出头发、躯干穿出衣料、鞋头形状、膝盖穿裙及脚底悬空。布料是几何避让，不是物理模拟；没有面部表情骨骼或动作捕捉。
- 玩家头像由新模型拍摄；名牌高度更新。步行/跑步改为3/6世界单位每秒，匹配新比例与步幅；NPC移动2单位每秒。镜头允许靠近到4.5单位；城市快捷传送继续可用。
- 街区选定建筑的底层拱窗扩展为连续拱形，阳台增加青铜交叉纹样；原水平碰撞边界不变。

## 素材与生成记录

- 使用内置 imagegen，参考既有 `src/assets/eva-guide-v1.png` 的身份特征。
- 新生成素材：`src/assets/eva-face-albedo-v1.png`，1254×1254 PNG，约2.09MB。通过Vite导入并共享给所有角色；销毁某个角色不会销毁共享贴图。
- 模型本体、衣裙、头发及动画由Three.js几何代码构建。衣料微纹理由确定性DataTexture生成。
- 原始生成结果保留在 `/Users/vivienna/.codex/generated_images/01a19c51-2598-7253-9c0f-d2c96a123ab1/exec-861cac43-8a8b-4c1d-8fd8-94db07ba8c18.png`；项目使用仓库内副本，不依赖该外部路径。
- 最终面部贴图提示词：

> Use case: identity-preserve. Asset type: 1024x1024 square face-only albedo projection texture for a real 3D game mesh, not a character portrait illustration. Reference image is Eva's identity reference. Reproduce her adult elegant semi-realistic anime face, muted green eyes, delicately arched dark eyebrows, natural rose closed lips, gentle expression. Strictly frontal, symmetric orthographic face, eyes looking straight forward. Face centered: chin at x=512,y=960; top of forehead at y=40; cheek outer edges about x=130 and x=894; eyes centered about (345,440) and (679,440); mouth around (512,735). Show only facial skin from forehead through chin. Absolutely NO hair, no eyelashes extending excessively, no ears, no neck, no clothes, no shoulders. Extend the surrounding peach skin color smoothly to fill the entire square image all the way to every edge, no silhouette edge or background. Flat diffuse/albedo color: soft skin variation, almost no directional light, no cast shadow, no glossy highlights, no baked facial outline. Keep adult refined face proportions, not a child, not chibi, no exaggerated round doll eyes. This is to map onto a separate sculpted head with 3D black hair: hair must not appear in this texture. No text, labels, panels, watermarks.

## 验证

- `npm run check`、9项Node测试、`npm run build`通过。保留Three.js分包大于500kB的提示，无新增npm依赖。
- 新测试覆盖顶点/索引有限性、人物体积与预算、正面外向绕序和贴图、步行/跑步支撑脚、全周期膝盖与裙子间隙、动画不改变导航root位置、冻结一致性、重复销毁以及共享面部贴图保留。
- 玩家45,272三角面/33次绘制；NPC26,360三角面/33次绘制。角色约3.22单位高；NPC网格细度小于玩家的65%。
- 浏览器1440×900、DPR1检查正面/侧面/背面、步行及跑步。54/54地标成功，运行错误0。局部视角本次短时记录约30–49FPS，属于本次桌面环境观察值，不是设备性能保证，也不能直接与不同会话的记录比较。真实手机GPU尚未压测。
- 390×844普通游戏界面：上方向键按住2秒触发哈利法塔介绍；Shift配合下方向键奔跑返回；东京按钮完成跨城传送并显示东京塔信息。
- 实机截图：`docs/validation/round-4/`，包含Eva正面、背面、侧面跑步、街区和手机游玩。未对截图进行图像增强。

## 继续精修的边界

角色已能实际游玩，但头发、面部与服装仍是程序化近似。后续可换为专门雕刻和拓扑优化的角色资产，并加入表情、眨眼和更细的发丝材质。全城仍有简化车辆、地标和建筑，尚未达到离线参考图的照片级质感。
