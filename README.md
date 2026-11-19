# Neon Coast Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/people871/makefun-gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/people871/makefun-gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

An offline cover-art maker for **make.fun's "Make GTA 6 Cover Art" bounty
(gta6-cover-art-01)**: it turns any photo and a caption into multi-panel,
GTA 6-style poster art and exports it as a PNG to share. Everything runs in
the browser from static files — photos are read on your machine and never
uploaded.

## What it does

- **6 layouts** — Hero and Three, Grid 2×2, Full-Bleed + Title Block, Tilted
  Snapshot, Vertical Strip, and an original **Diagonal Vice Slice**: three
  slanted parallelogram panels over a four-frame film story strip.
- **5 gradient-map grades** — Sunset, Neon Vice, Dusk Purple, Mono Noir and
  Heat Haze — each a real per-channel colour map, plus film grain, a vignette
  and a halftone title block.
- **Any photo** — load your own photos (or use the two built-in samples), put
  one photo across several panels or different photos in each, and crop and
  position every panel by dragging and scrolling to zoom.
- **Lettering** — Anton display caps, a Pacifico neon script subtitle and a
  Bebas Neue badge ribbon, all OFL fonts shipped under `app/fonts/`. The
  caption, subtitle and badge are all editable; the default — NEON COAST /
  vice city nights / EST. 2026 — already looks like a poster.
- **One-click export** — a single button writes all three post sizes as PNGs:
  1080×1080, 1080×1350 and 1920×1080.

No Rockstar Games logo, artwork or font anywhere: the art, lettering and
fonts are original or SIL OFL licensed.

## Try it

```sh
node serve.ts
# open http://localhost:8080
```

Pick a photo, choose a layout and a grade, edit the caption, drag a panel's
photo into place, then **Export all 3 sizes**.

Deterministic screenshot scenes live behind `?shot=` hooks, e.g.
`?shot=cover&photo=pier&caption=Neon%20Coast&layout=slice&grade=neon&size=wide`
renders one cover alone; `?shot=editor&photo=pier` opens the studio with a
photo loaded. See `shots.json`.

## Handing it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/`
to the output directory and writes `dossier.json` with the vendored
`vendor/makefun-app.ts` library.

## License

MIT — see `LICENSE`. Fonts under `app/fonts/` are licensed under the SIL Open
Font License 1.1 (texts beside them). Sample photos under `app/samples/` were
made with an image model for make.fun and are free to use.
