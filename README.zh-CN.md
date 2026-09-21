# WorldLine

个人时空档案，以 3D 地球呈现。人生事件贴在地表；淡金色小飞机沿世界线飞往下一站。右侧年份尺从最早事件年份标到最晚。

技术栈：Vite、React、TypeScript、Three.js（React Three Fiber）。

[English](./README.md)

## 功能

- 离散事件跳跃 — 滚轮一步（或 ↑/↓）飞到上一个或下一个事件；飞行结束前不会连跳
- 轨道相机 — 拖拽环视地球；Ctrl/⌘+滚轮或 `+` / `-` 缩放
- 事件晶体 — 悬停显示提示，点击打开档案面板（面板内上一站/下一站会保持打开并飞飞机）
- 地图 LOD — 放大后出现国家边界；再近一些按当前视野加载一级行政区（省、州等）
- 年份尺 — 可滚动的类 Apple 刻度尺，含月份刻度；点击年份跳转；指针跟随当前时间

## 本地运行

```bash
npm install
npm run dev
```

在浏览器打开终端给出的地址（一般为 `http://localhost:5173`）。

### 脚本

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动 Vite 开发服务器 |
| `npm run build` | 类型检查并打包生产构建 |
| `npm run preview` | 预览生产构建 |
| `npm test` | 运行 Vitest 单元测试 |

## 操作

| 输入 | 作用 |
| --- | --- |
| 滚轮 | 跳到上一个 / 下一个事件 |
| Ctrl/⌘ + 滚轮 | 缩放 |
| `+` / `-` | 放大 / 缩小 |
| 拖拽 | 环绕地球 |
| ↑ / ↓ | 跳到上一个 / 下一个事件 |
| 点击晶体 | 打开事件档案 |
| Esc / 点击空白处 | 关闭档案 |

档案面板打开或飞行进行中时，滚轮与方向键跳跃会被忽略，避免连跳。

## 添加自己的事件

在 `content/events/` 下新建 Markdown 文件。文件名（不含 `.md`）即为事件 id。

```markdown
---
title: 在故宫看见午门的光
t: "2021-05-01"
place: 北京 · 故宫
lat: 39.916
lng: 116.397
images:
  - my-photo.jpg
tags:
  - 旅行
---

正文从这里开始。支持 Markdown。
```

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `title` | 是 | 显示在 HUD 与档案中 |
| `t` | 是 | ISO 日期 `YYYY-MM-DD`（决定时间线顺序） |
| `place` | 是 | 地点短标签 |
| `lat` / `lng` | 是 | WGS84 经纬度 |
| `images` | 否 | `content/images/` 下的文件名 |
| `tags` | 否 | 自由标签 |

配图放到 `content/images/`，文件名与 `images` 列表一致。SVG 建议使用 UTF-8 文本。

启动时会定位到距离今天最近的那个事件。

## 目录结构

```
content/
  events/          # Markdown 事件文件
  images/          # 事件配图
src/
  modes/globe/     # 地球场景、相机、世界线、地图
  overlay/         # HUD、年份尺、档案、启动动画
  scene/           # 共用 3D 辅助（晶体、后期等）
  lib/             # 时空计算、飞行、投影
  content/         # 事件加载与 frontmatter 解析
  store.ts         # 应用状态（轨道、跳跃、选中）
```

## 技术栈

- [Vite](https://vitejs.dev/) + [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Three.js](https://threejs.org/) via [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber) / [drei](https://github.com/pmndrs/drei)
- [@react-three/postprocessing](https://github.com/pmndrs/react-postprocessing)（bloom、vignette）
