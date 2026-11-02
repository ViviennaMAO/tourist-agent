# 第六轮：图片角色、街道与门窗细节

## 角色方向调整
按用户最新要求，运行中的玩家、四个模拟角色、HUD 头像和导游面板改用新参考图的图片形象。三视图 atlas 由内置 image_gen 编辑工具整理，保留透明通道，未使用 CLI。不是新建 3D 人体，也不承诺生成式整理与原图逐像素相同。

- 项目资源：`src/assets/eva-sprite-atlas-v1.png`，1536 × 1024 RGBA，约 1.92 MB。
- `src/eva-sprite.js` 使用直立平面，按相机与角色朝向选择正面、左三分之四侧面、背面；另一侧镜像。
- 各角色独立裁切 UV，共用纹理；主画面和拍照相机都在渲染前更新 UV，避免第一帧头像拍到背面。
- Alpha test + depth test/write 支持场景遮挡；脚下使用柔和接触阴影。两次绘制、四个三角面/角色。
- 导航和碰撞仍由原系统管理。走动只有轻微起伏和摆动，没有单独腿部帧，没有骨骼动作，也没有随太阳变化的完整人物投影。
- 原 `eva-character.js` 保留供历史参考，但不再导入生产游戏；旧人脸和导游 PNG 不再打包。

## 街道与建筑
- 五条迪拜大陆道路增加分段路缘、两色铺砖、低位沟槽、40 处格栅、路口斑马线。六个合并材质批次；桥梁不改。
- 路口和行人过街处中断路缘；相关旧中线隐藏，关闭街区精修时恢复。未添加导航障碍，路面高度维持原值。
- 凹进门窗增加门脚板、铜色拉手、局部褶皱窗帘；木构增加程序化细纹。沿用原建筑边界和拱廊纵深。
- 审查面板增加“街道细节”“面部特写”。它们仅在 `?review=1` 可见。
- 仍是程序化微缩场景，玻璃和石材没有达到参考图的摄影级精度。叶片保持上一轮成果。

## 验证
- `npm run check`、`npm test`（14/14）、`npm run build` 通过。Three vendor chunk 大于 500 kB 的既有构建提醒保留。
- 新测试覆盖正侧背及镜像、相机/角色相对角度、独立 UV、导航位置、冻结、纹理所有权、路口无路缘横挡、桥梁隔离和原标线恢复。
- 浏览器实测 1440 × 900 和 390 × 844：头像、正侧背、棕榈遮挡、建筑/街道路面、导游卡、触控移动及地标介绍触发。审查页 54/54 地标成功、运行错误 0。桌面观测约 120 FPS，仅代表此台机器；手机尺寸模拟不等于真机性能测试。
- 截图在 `docs/validation/round-6/`。face-before 为此前 3D 角色；eva-front/back/side-occlusion 为当前图片角色。street-before 为上轮花园机位，streets-after 为新增道路机位，二者不是严格同机位 A/B。

## 素材来源和最终提示词
用户提供的 `dreamina-2026-11-02-8294-…jpeg` 是编辑目标。保留绿眼睛、黑色波浪发、珍珠耳饰、奶黄色裙子和玛丽珍鞋。内置 image_gen，transparent_background=true。

```text
Edit target: the attached character reference sheet. Create a production game sprite atlas by extracting and cleanly isolating ONLY the three large full-body figures from the LOWER LEFT part of the sheet: the front-facing figure, the left-facing three-quarter figure, and the back-facing figure. Preserve their supplied face, large green eyes, exact black wavy hair, pearl earrings, cream-yellow puff-sleeved midi dress, ivory Mary Jane shoes, proportions, detailed rendered style and neutral poses. Do not redesign or reinterpret the character. Remove the cream background, every cast ground shadow, all portrait close-ups, garment diagrams, isolated shoes/hands, small fourth figure and AI mark. Arrange exactly these THREE full-body cutouts in a single horizontal row on a genuinely transparent RGBA background, in order FRONT, THREE-QUARTER FACING LEFT, BACK. Landscape 3:2 canvas. Three equal-width cells. Each character centered horizontally in its cell, same head and shoe baseline and same full body size, top of hair at 4 percent canvas height, shoe soles at 96 percent, small transparent padding everywhere, no overlapping cells. Preserve all hair strands and shoe edges with clean alpha, no halos, no white matte. No text, labels, grid lines or added objects. This is background extraction and layout of the supplied art, not a new 3D model.
```

