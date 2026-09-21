# WorldLine

[中文](./README.zh-CN.md)

A personal spacetime archive rendered as a 3D globe. Life events sit on Earth’s surface; a pale-gold plane flies the worldline from stop to stop. The year ruler on the right tracks proper time from the earliest event year through the latest.

Built with Vite, React, TypeScript, and Three.js (React Three Fiber).

## Features

- Discrete event hops — one wheel step (or ↑/↓) flies to the previous or next event; hops lock until the flight ends
- Orbit camera — drag to look around Earth; zoom with Ctrl/⌘+wheel or `+` / `-`
- Event crystals — hover for tips, click to open the archive panel (prev/next keeps the panel open and flies the plane)
- Map LOD — country borders appear when zoomed in; first-level regions (provinces, states, …) load for the current view
- Year ruler — scrollable Apple-style scale with month ticks; click a year to jump; needle follows the current time

## Run locally

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Typecheck and production build |
| `npm run preview` | Preview the production build |
| `npm test` | Run Vitest unit tests |

## Controls

| Input | Action |
| --- | --- |
| Wheel | Hop to previous / next event |
| Ctrl/⌘ + wheel | Zoom |
| `+` / `-` | Zoom in / out |
| Drag | Orbit Earth |
| ↑ / ↓ | Hop to previous / next event |
| Click crystal | Open event archive |
| Esc / click empty space | Close archive |

While an archive panel is open or a hop is in progress, wheel/arrow hops are ignored so the flight does not chain.

## Add your own events

Create a Markdown file under `content/events/`. The filename (without `.md`) becomes the event id.

```markdown
---
title: Noon light at the Meridian Gate
t: "2021-05-01"
place: Beijing · Forbidden City
lat: 39.916
lng: 116.397
images:
  - my-photo.jpg
tags:
  - travel
---

Body text starts here. Markdown is supported.
```

| Field | Required | Notes |
| --- | --- | --- |
| `title` | yes | Shown in the HUD and archive |
| `t` | yes | ISO date `YYYY-MM-DD` (drives timeline order) |
| `place` | yes | Short place label |
| `lat` / `lng` | yes | WGS84 coordinates |
| `images` | no | Filenames under `content/images/` |
| `tags` | no | Free-form labels |

Put images in `content/images/` with names matching the `images` list. Prefer UTF-8 text in SVG assets.

Events boot to the stop nearest today’s date.

## Project layout

```
content/
  events/          # Markdown event files
  images/          # Event images / plates
src/
  modes/globe/     # Globe scene, camera, worldline, map
  overlay/         # HUD, year ruler, archive, boot
  scene/           # Shared 3D helpers (crystals, post-FX, …)
  lib/             # Spacetime math, travel, projectors
  content/         # Event loaders / frontmatter parser
  store.ts         # App state (orbit, hop, selection)
```

## Stack

- [Vite](https://vitejs.dev/) + [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Three.js](https://threejs.org/) via [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber) / [drei](https://github.com/pmndrs/drei)
- [@react-three/postprocessing](https://github.com/pmndrs/react-postprocessing) for bloom and vignette
