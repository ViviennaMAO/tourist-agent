# Eva 导游形象替换

2026-11-02。使用用户提供的两张 Dreamina 角色设定图作为身份与服装参考，制作城市导览中的 Eva 透明立绘。角色特征：黑色中分微卷发、绿瞳、玫瑰色唇、奶黄色方领泡泡袖中长裙、米白玛丽珍鞋。

## 素材与生成

- 工具：内置 imagegen；参考图 7052 优先用于动漫画风，2349 用于五官和服装细节。
- 最终项目素材：`src/assets/eva-guide-v1.png`，1024×1536 RGBA，透明 alpha 验证通过。
- 原始参考拼图不作为游戏素材发布。
- 最终提示词：

> Use case: identity-preserve. Asset type: production transparent full-body tour-guide character sprite for an existing web game. These two input sheets are character identity / clothing references; use the more illustrated anime style of input 1, with the elegant face of both. Create ONE single full-body woman, Eva, isolated on genuine transparent background. Preserve the reference face, adult proportions, shoulder-length glossy black center-parted softly wavy hair, muted green eyes, natural rose lips, cream pale-yellow square-neck puff-sleeve fitted-waist below-knee A-line dress, ivory Mary Jane low heels. Subtle warm welcoming closed-mouth smile, facing viewer with body turned very slightly 10 degrees; one forearm bent gently outward at waist height, open palm as a tour guide introducing the city on viewer's right; other arm relaxed. Keep the elegant semi-realistic anime illustration, soft detailed fabric folds and clean precise edges. Full head, hands, dress hem and both shoes all visible with modest transparent padding; tall portrait 1024x1536 composition centered, occupying almost full height. No background, no cast shadow on ground, no text, no panels, no extra characters, no watermark, no accessories, not chibi. Do not include the reference collage: extract/recreate only the single character faithfully.

## 接入

移除旧 `guideImg()` 临时 WebGL 渲染器，直接导入 Vite 管理的透明素材。门票商城和藏品展厅中的 Eva 也使用同一素材。Eva 与玩家/NPC 的 Three.js 模型分开；本次未替换可操控角色模型。

城市导览使用正常文档流：桌面两栏展示全身 Eva 与城市内容；窄屏顶部使用同一素材的 CSS 头像裁切、导游名称与问候语。添加图片替代文字，保留现有导览关闭、门票商城、地标与开始探索入口。

## 验证

- 语法检查与 Vite 生产构建通过。
- 桌面1440×900、窄屏390×844查看：立绘透明、无旧形象残留、文字和按钮无重叠；窄屏不再隐藏导游。
- 图片加载正常；导览返回游戏正常。浏览器错误日志为空。
- 截图见 `docs/validation/eva/`。
