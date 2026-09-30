# YILAN // REDLINE v0.8 — Immersive Damage Build

宜蘭市開放世界雨夜追緝瀏覽器遊戲原型。v0.8 延續 v0.7 的動態天氣、日夜、活城市、下車徒步、換乘街車、油耗、加油、車庫解鎖、國道 5 號與可連續駛入的雪山隧道，進一步強化車內與事故現場的真實感。

## v0.8 新增

- 車內擋風玻璃雨滴層，雨勢會跟動態天氣同步。
- 雙雨刷依豪雨／一般雨／細雨自動調整速度，進雪山隧道會停止。
- 玩家撞擊一般車後，事故車會煞停並開啟雙黃警示燈一段時間，而不是立刻恢復車流。
- 事故會驚動附近行人；高強度事故會生成逃離反應。
- 徒步玩家現在會被一般車流撞擊：短暫失衡、擊退、扣血與體力損耗。
- 中高強度碰撞新增玻璃碎片效果。
- 雨天輪胎水霧密度會依實際雨勢調整，並加入局部積水擴散水圈。
- 一般車流加入遠距離可見性／更新裁切，降低高畫質模式的無效負載。
- 宜蘭道路細節新增：公車候車亭、凸面鏡、交通錐、路邊設備箱。
- 原本 4K ULTRA、6 款解鎖車、機車／巴士／廂型車／皮卡、行人、紅綠燈、車損、車內視角、動態天氣、加油與雪山隧道全部保留。

## 操作

- `W / S`：加速／煞車；徒步前進／後退
- `A / D`：轉向
- `SPACE`：手煞車；徒步衝刺
- `E`：上下車／換乘街車
- `F`：加油／停止加油
- `C`：切換第三人稱／車內／電影鏡頭
- `G`：私人車庫
- `Q`：ECO / HIGH / CINEMA / 4K ULTRA
- `T`：測試下一種天氣
- `R`：返回宜蘭車站區

## 啟動

```bash
npm install
npm run dev
```

正式建置：

```bash
npm run build
```

## 技術定位

目前是 Three.js / WebGL 的高細節瀏覽器遊戲原型，4K ULTRA 指的是高解析渲染、陰影與場景密度等級；它仍不是 AAA 遊戲引擎的原生 4K 高模資產。專案架構保留後續改用高品質 glTF / PBR 資產或轉進 Unreal Engine 的空間。

雪山隧道採公開尺度與外觀概念的遊戲化場景；內部維運、救援與執法配置並非真實重建。

## Cloudflare deployment fix (v0.8.1)

This build is safe to deploy when Cloudflare's Deploy command is only:

```bash
npx wrangler deploy
```

`wrangler.toml` now contains a `[build]` hook that runs `bun run build` first, so `dist/` exists before static assets are uploaded.

Recommended Cloudflare Workers Builds settings:

- Build command: leave blank (or `bun run build`; leaving it blank avoids a duplicate build)
- Deploy command: `npx wrangler deploy`
- Root directory: project root

You can also deploy locally with:

```bash
bun install
bun run deploy
```
