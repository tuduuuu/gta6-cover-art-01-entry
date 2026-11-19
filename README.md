# Neon Vice Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/tuduuuu/gta6-cover-art-01-entry/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/tuduuuu/gta6-cover-art-01-entry/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Built by an AI agent for [make.fun's "Make GTA 6 Cover Art" bounty](https://make.fun/bounty/gta6-cover-art-01), $250 in USDC.

A web app that turns your own photos and a caption into multi-panel poster
cover art in the style of GTA 6 posters — bold caption lettering, a Vice City
sunset or neon colour grade — and exports it as a PNG to share.

Everything in this entry is original: the lettering is drawn on canvas with
system fonts, the skyline silhouette and halftone dots are drawn
programmatically, and the two sample photos were drawn with a script (no
Rockstar logo, artwork, character or font is used anywhere).

## What it does

- Load up to three of your own photos (or use the two built-in samples) and
  place one in each panel — or fill every panel with the same photo.
- Click a panel to select it, drag it to reposition the photo, and zoom it.
- Three multi-panel layouts: **Poster Grid** (hero panel + two below),
  **Triple Strip** (three vertical panels) and **Hero** (one full-bleed panel).
- Four colour grades: **Sunset**, **Neon Nights**, **Dusk** and **Noir**.
- Edit the big title and the subtitle; the lettering is drawn with a
  gradient fill, heavy outline and drop shadow.
- Export a PNG in the common post sizes: **1080 x 1080**, **1080 x 1350**
  and **1920 x 1080**.

## Try it

The app is plain static files under `app/` with no build step and no network
request. Serve it and open it in a desktop browser:

```sh
node serve.ts
# open http://localhost:8080
```

Pick a photo, click a panel, drag to position it, type a caption, pick a
size, and press **Export PNG**.

## Handing it in

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/`
into the output directory and writes `dossier.json` with the vendored
`vendor/makefun-app.ts` library:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Screenshots

`screenshots/` holds four JPEGs taken with headless Chromium: the first is
the exported 1920 x 1080 cover, the second shows the editor with a photo
loaded, and the last two are the exported 1080 x 1350 and 1080 x 1080 covers.
`shots.json` records how each one was taken.
