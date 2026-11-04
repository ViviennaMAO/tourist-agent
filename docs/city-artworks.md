# 城市艺术品 · 2026-11-04

三幅原创地域主题画，使用内置 imagegen 生成（未使用 CLI），每座城市的五处室内分别悬挂对应作品，共十五处。不是实景摄影或既有艺术家的作品。

- 迪拜《溪湾与沙丘》：`public/artworks/dubai-creek-dusk.jpg`
- 阿布扎比《海湾的白色回声》：`public/artworks/abudhabi-coastal-light.jpg`
- 拉斯维加斯《沙漠不夜城》：`public/artworks/lasvegas-desert-nocturne.jpg`

原始生成图为 1536×1024 PNG；仅转换为 JPEG 85 以减小加载体积，保持 3:2 构图。室内按需加载，sRGB 画布、金属画框、米白卡纸和局部画灯。工具栏“城市艺术”适配桌面及手机近看。

## 提示词

### dubai

Use case: stylized-concept. Asset type: a single original fine-art painting texture to hang in a 3D travel game's luxury interior. Dubai at blue hour: foreground old creek dhow boats and warm limestone waterfront architecture, palm silhouettes, beyond them a gracefully tapering Burj Khalifa skyline; warm sand dunes subtly flowing into the creek composition. Luminous muted teal water, sand, antique gold and dusk blue. Style: sophisticated painterly travel landscape, layered gouache and oil brushwork on subtle canvas, coherent detailed architectural forms, gallery-quality composition with atmospheric depth. Landscape 3:2 aspect ratio. Image fills the entire canvas edge to edge. Orthographic flat artwork only; no photographed room, no mockup, no frame, no border, no text, no signature, no watermark. Not a map or infographic. A composed original artwork inspired by the city, not a documentary architectural reconstruction.

### abudhabi

Use case: stylized-concept. Asset type: a single original fine-art painting texture to hang in a 3D travel game's luxury interior. Abu Dhabi coastal serenity: foreground turquoise tidal water and mangrove silhouettes, a warm pale-stone arcade reflected in still water, graceful white domes with slender minarets in the middle distance and a few elegant curved blue towers far beyond. Calm pearl white, sea green, warm sand and subtle antique gold. No humans or animals. Style: sophisticated painterly travel landscape, layered gouache and oil brushwork on subtle canvas, coherent detailed architectural forms, gallery-quality composition with atmospheric depth. Landscape 3:2 aspect ratio. Image fills the entire canvas edge to edge. Orthographic flat artwork only; no photographed room, no mockup, no frame, no border, no text, no signature, no watermark. Not a map or infographic. A composed original artwork inspired by the city, not a documentary architectural reconstruction.

### lasvegas

Use case: stylized-concept. Asset type: a single original fine-art painting texture to hang in a 3D travel game's luxury interior. Las Vegas desert nocturne: sculptural red-rock desert hills and warm distant mountains framing a luminous boulevard, restrained glowing neon ribbons, small elegant hotel skyline, an illuminated observation wheel and a radiant spherical venue. Sophisticated midnight indigo, faded coral, dusty violet and amber, celebratory but not garish. No readable signs or logos. Style: sophisticated painterly travel landscape, layered gouache and oil brushwork on subtle canvas, coherent detailed architectural forms, gallery-quality composition with atmospheric depth. Landscape 3:2 aspect ratio. Image fills the entire canvas edge to edge. Orthographic flat artwork only; no photographed room, no mockup, no frame, no border, no text, no signature, no watermark. Not a map or infographic. A composed original artwork inspired by the city, not a documentary architectural reconstruction.

参数：`transparent_background: false`，新图生成，无引用图。
