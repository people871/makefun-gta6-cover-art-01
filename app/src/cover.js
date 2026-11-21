// Neon Coast cover renderer: turns loaded photos, a caption and a grade into
// poster art on any 2D canvas. Seven layouts, six gradient-map grades,
// grain, vignette, halftone title bands and OFL display lettering — every
// pixel on the cover is drawn by this file, nothing is fetched.

export const SIZES = [
  { id: 'square', label: 'Square 1080 × 1080', w: 1080, h: 1080 },
  { id: 'portrait', label: 'Portrait 1080 × 1350', w: 1080, h: 1350 },
  { id: 'wide', label: 'Wide 1920 × 1080', w: 1920, h: 1080 },
];

export const LAYOUTS = [
  { id: 'hero-three', name: 'Hero and Three', slots: 4 },
  { id: 'grid', name: 'Grid 2 × 2', slots: 4 },
  { id: 'full-bleed', name: 'Full-Bleed + Title Block', slots: 1 },
  { id: 'tilted', name: 'Tilted Snapshot', slots: 3 },
  { id: 'strip', name: 'Vertical Strip', slots: 3 },
  { id: 'slice', name: 'Diagonal Vice Slice', slots: 7 },
  { id: 'sleeve', name: 'Sunset Sleeve', slots: 4 },
];

// A grade is a three-stop gradient map: shadows, midtones and highlights each
// map to a colour, blended back over the photo at `blend`. `wash` tints the
// whole cover afterwards so the panels feel like one poster.
export const GRADES = [
  {
    id: 'sunset', name: 'Sunset',
    shadow: [38, 12, 54], mid: [255, 96, 58], high: [255, 216, 122],
    blend: 0.82, wash: ['#ff7a3c', '#c2185b'],
  },
  {
    id: 'neon', name: 'Neon Vice',
    shadow: [10, 6, 42], mid: [255, 45, 149], high: [64, 226, 255],
    blend: 0.88, wash: ['#ff2d95', '#22d3ee'],
  },
  {
    id: 'dusk', name: 'Dusk Purple',
    shadow: [14, 10, 36], mid: [124, 62, 182], high: [255, 172, 202],
    blend: 0.84, wash: ['#7c3aed', '#f472b6'],
  },
  {
    id: 'noir', name: 'Mono Noir',
    shadow: [8, 8, 10], mid: [128, 128, 132], high: [246, 246, 240],
    blend: 1.0, wash: ['#111111', '#f5f5f5'],
  },
  {
    id: 'heat', name: 'Heat Haze',
    shadow: [32, 22, 4], mid: [255, 172, 42], high: [192, 255, 222],
    blend: 0.8, wash: ['#f59e0b', '#34d399'],
  },
  {
    id: 'teal', name: 'Palm Teal',
    shadow: [6, 32, 40], mid: [0, 190, 164], high: [255, 238, 168],
    blend: 0.85, wash: ['#0d9488', '#fbbf24'],
  },
];

export function freshState() {
  return {
    layout: 'hero-three',
    grade: 'sunset',
    size: 'wide',
    caption: 'NEON COAST',
    subtitle: 'vice city nights',
    badge: 'EST. 2026',
    grain: true,
    vignette: true,
    photos: [],
    slots: [],
  };
}

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) || LAYOUTS[0];
}

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) || GRADES[0];
}

export function sizeById(id) {
  return SIZES.find((s) => s.id === id) || SIZES[0];
}

// Keep the per-panel slot list in step with the chosen layout: a slot holds
// which photo fills the panel and how it is cropped (centre + zoom).
export function syncSlots(state) {
  const want = layoutById(state.layout).slots;
  while (state.slots.length < want) {
    const i = state.slots.length;
    // The first panel is usually the hero: bias its crop a little high so a
    // face lands in frame instead of being centred out of it. The slice
    // layout's short story frames get the same treatment, more so. The
    // sleeve's tall spine panel wants a centred crop instead.
    let cy = 0.4;
    if (i === 0) cy = state.layout === 'sleeve' ? 0.5 : 0.35;
    else if (state.layout === 'slice' && i >= 3) cy = 0.28;
    state.slots.push({ photo: state.photos.length ? i % state.photos.length : 0, cx: 0.5, cy, zoom: 1 });
  }
  state.slots.length = want;
  for (const slot of state.slots) {
    if (!state.photos.length) slot.photo = 0;
    else slot.photo = Math.min(slot.photo, state.photos.length - 1);
  }
}

function clamp01(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

// Geometry of one layout, in fractions of the canvas. A panel may be a plain
// rectangle, a slanted parallelogram (`slant` shifts its top edge sideways)
// or a rotated snapshot (`rot` degrees, white `frame`). `title` is where the
// lettering goes; `strip` is the film-strip band of the slice layout.
export function layoutGeometry(layoutId) {
  const g = 0.012;
  switch (layoutId) {
    case 'grid': {
      const top = 0.83;
      const pw = (1 - g) / 2;
      const ph = (top - g) / 2;
      return {
        bg: '#160a24',
        panels: [
          { x: 0, y: 0, w: pw, h: ph },
          { x: pw + g, y: 0, w: pw, h: ph },
          { x: 0, y: ph + g, w: pw, h: ph },
          { x: pw + g, y: ph + g, w: pw, h: ph },
        ],
        title: { x: 0.035, y: top + g + 0.01, w: 0.93, h: 1 - top - g - 0.02, align: 'left', scrim: false, halftone: true, badge: true },
      };
    }
    case 'full-bleed':
      return {
        bg: '#1c0b2e',
        panels: [{ x: 0, y: 0, w: 1, h: 1 }],
        title: { x: 0.045, y: 0.68, w: 0.91, h: 0.28, align: 'left', scrim: true, halftone: true, badge: true },
      };
    case 'tilted':
      return {
        bg: '#140a1e',
        panels: [
          { x: 0.05, y: 0.1, w: 0.6, h: 0.7, rot: -4, frame: true },
          { x: 0.7, y: 0.08, w: 0.26, h: 0.34, rot: 3, frame: true },
          { x: 0.68, y: 0.48, w: 0.28, h: 0.34, rot: -2, frame: true },
        ],
        title: { x: 0.05, y: 0.86, w: 0.9, h: 0.12, align: 'left', scrim: false, halftone: false, badge: false },
      };
    case 'strip': {
      const band = 0.852;
      return {
        bg: '#160a24',
        panels: [
          { x: 0, y: 0, w: 0.36, h: band },
          { x: 0.372, y: 0, w: 0.628, h: (band - g) / 2 },
          { x: 0.372, y: (band + g) / 2, w: 0.628, h: (band - g) / 2 },
        ],
        title: { x: 0.035, y: band + g + 0.005, w: 0.93, h: 1 - band - g - 0.015, align: 'left', scrim: false, halftone: true, badge: true },
      };
    }
    case 'slice': {
      const slant = 0.055;
      const third = 1 / 3;
      const panels = [0, 1, 2].map((i) => ({
        x: i * third, y: 0, w: third + slant, h: 0.66, slant,
      }));
      const fw = (1 - 3 * g) / 4;
      for (let i = 0; i < 4; i++) {
        panels.push({ x: i * (fw + g), y: 0.68, w: fw, h: 0.22, frame: 'thin' });
      }
      return {
        bg: '#12081f',
        panels,
        strip: { x: 0, y: 0.68, w: 1, h: 0.22 },
        title: { x: 0.03, y: 0.05, w: 0.72, h: 0.17, align: 'left', scrim: false, halftone: false, badge: false, rot: -6 },
      };
    }
    case 'sleeve': {
      // Sunset Sleeve: a tall "spine" photo down the left edge like a record
      // sleeve, a wide hero panel, and two thumbs underneath it. The title
      // sits on the hero's lower edge over a scrim, badge at its right.
      const spine = 0.16;
      const heroH = 0.6;
      const hx = spine + g;
      const hw = 1 - hx;
      const tw = (hw - g) / 2;
      const ty = heroH + g;
      const th = 1 - ty;
      return {
        bg: '#12081f',
        panels: [
          { x: 0, y: 0, w: spine, h: 1 },
          { x: hx, y: 0, w: hw, h: heroH },
          { x: hx, y: ty, w: tw, h: th },
          { x: hx + tw + g, y: ty, w: tw, h: th },
        ],
        title: { x: hx + 0.025, y: 0.44, w: hw - 0.05, h: 0.15, align: 'left', scrim: true, halftone: false, badge: true },
      };
    }
    case 'hero-three':
    default: {
      const heroH = 0.585;
      const y0 = heroH + g;
      const bh = 1 - y0;
      const bw = (1 - 2 * g) / 3;
      return {
        bg: '#160a24',
        panels: [
          { x: 0, y: 0, w: 1, h: heroH },
          { x: 0, y: y0, w: bw, h: bh },
          { x: bw + g, y: y0, w: bw, h: bh },
          { x: 2 * (bw + g), y: y0, w: bw, h: bh },
        ],
        title: { x: 0.035, y: 0.4, w: 0.93, h: 0.165, align: 'left', scrim: true, halftone: false, badge: true },
      };
    }
  }
}

// A 256-entry per-channel lookup built from a grade's three stops.
function gradeLookup(grade) {
  const table = [new Uint8Array(256), new Uint8Array(256), new Uint8Array(256)];
  for (let c = 0; c < 3; c++) {
    const lo = grade.shadow[c];
    const mid = grade.mid[c];
    const hi = grade.high[c];
    for (let v = 0; v < 256; v++) {
      const t = v / 255;
      const mapped = t < 0.5
        ? lo + (mid - lo) * (t * 2)
        : mid + (hi - mid) * ((t - 0.5) * 2);
      table[c][v] = mapped;
    }
  }
  return table;
}

const gradedCache = new WeakMap();

// Paints one photo into an offscreen canvas of exactly pw x ph pixels:
// cover-fit, cropped by the slot's centre/zoom, then the grade's map.
function gradedPhoto(img, grade, pw, ph, slot) {
  const key = `${grade.id}|${pw}x${ph}|${slot.photo}|${slot.cx.toFixed(3)}|${slot.cy.toFixed(3)}|${slot.zoom.toFixed(3)}`;
  let byKey = gradedCache.get(img);
  if (!byKey) { byKey = new Map(); gradedCache.set(img, byKey); }
  const hit = byKey.get(key);
  if (hit) return hit;

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(2, pw);
  canvas.height = Math.max(2, ph);
  const ctx = canvas.getContext('2d');
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(pw / iw, ph / ih) * slot.zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  // Centre the slot's crop point on the panel, then clamp so the photo
  // never slides off and leaves a bare band at an edge.
  const dx = Math.min(0, Math.max(pw - dw, pw / 2 - slot.cx * dw));
  const dy = Math.min(0, Math.max(ph - dh, ph / 2 - slot.cy * dh));
  ctx.drawImage(img, dx, dy, dw, dh);

  const lookup = gradeLookup(grade);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const px = data.data;
  const blend = grade.blend;
  const mono = grade.id === 'noir';
  for (let i = 0; i < px.length; i += 4) {
    let r = px[i];
    let g = px[i + 1];
    let b = px[i + 2];
    if (mono) {
      const grey = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      r = g = b = grey;
    }
    px[i] = r + (lookup[0][r] - r) * blend;
    px[i + 1] = g + (lookup[1][g] - g) * blend;
    px[i + 2] = b + (lookup[2][b] - b) * blend;
  }
  ctx.putImageData(data, 0, 0);
  if (byKey.size > 24) byKey.clear();
  byKey.set(key, canvas);
  return canvas;
}

let noiseTile = null;
function grainTile() {
  if (noiseTile) return noiseTile;
  const c = document.createElement('canvas');
  c.width = 160;
  c.height = 160;
  const ctx = c.getContext('2d');
  const data = ctx.createImageData(160, 160);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = 96 + Math.floor(Math.random() * 96);
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 255;
  }
  ctx.putImageData(data, 0, 0);
  noiseTile = c;
  return c;
}

function panelPath(ctx, rect, w, h) {
  const x = rect.x * w;
  const y = rect.y * h;
  const pw = rect.w * w;
  const ph = rect.h * h;
  ctx.beginPath();
  if (rect.slant) {
    const s = rect.slant * w;
    ctx.moveTo(x + s, y);
    ctx.lineTo(x + pw + s, y);
    ctx.lineTo(x + pw, y + ph);
    ctx.lineTo(x, y + ph);
  } else {
    ctx.rect(x, y, pw, ph);
  }
  ctx.closePath();
}

function drawPanel(ctx, img, rect, slot, grade, w, h) {
  const x = rect.x * w;
  const y = rect.y * h;
  const pw = Math.max(2, Math.round(rect.w * w));
  const ph = Math.max(2, Math.round(rect.h * h));
  const graded = gradedPhoto(img, grade, pw, ph, slot);
  ctx.save();
  if (rect.rot) {
    ctx.translate(x + pw / 2, y + ph / 2);
    ctx.rotate((rect.rot * Math.PI) / 180);
    ctx.translate(-pw / 2, -ph / 2);
    if (rect.frame) {
      ctx.fillStyle = '#f8f4ec';
      ctx.shadowColor = 'rgba(0,0,0,0.55)';
      ctx.shadowBlur = pw * 0.03;
      ctx.shadowOffsetY = pw * 0.012;
      ctx.fillRect(-pw * 0.018, -ph * 0.018, pw * 1.036, ph * 1.036);
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
    }
    ctx.drawImage(graded, 0, 0);
    ctx.restore();
    return;
  }
  panelPath(ctx, rect, w, h);
  ctx.clip();
  ctx.drawImage(graded, x, y);
  if (rect.frame === 'thin') {
    ctx.strokeStyle = 'rgba(248,244,236,0.9)';
    ctx.lineWidth = Math.max(2, w * 0.002);
    ctx.stroke();
  }
  ctx.restore();
  // Hairline seam so neighbouring panels read as separate plates.
  ctx.save();
  panelPath(ctx, rect, w, h);
  ctx.strokeStyle = 'rgba(10,4,18,0.55)';
  ctx.lineWidth = Math.max(1, w * 0.0015);
  ctx.stroke();
  ctx.restore();
}

function fitCaption(ctx, text, maxWidth, startSize) {
  let size = startSize;
  ctx.font = `${size}px Anton, 'Arial Black', sans-serif`;
  while (size > 14 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${size}px Anton, 'Arial Black', sans-serif`;
  }
  return size;
}

function drawLettering(ctx, state, geo, grade, w, h) {
  const t = geo.title;
  const tx = t.x * w;
  const ty = t.y * h;
  const tw = t.w * w;
  const th = t.h * h;
  const caption = (state.caption || 'NEON COAST').trim().toUpperCase() || 'NEON COAST';

  ctx.save();
  if (t.rot) {
    ctx.translate(tx + tw * 0.12, ty + th * 0.55);
    ctx.rotate((t.rot * Math.PI) / 180);
    ctx.translate(-(tx + tw * 0.12), -(ty + th * 0.55));
  }
  if (t.scrim) {
    const scrim = ctx.createLinearGradient(0, ty - th * 0.35, 0, ty + th);
    scrim.addColorStop(0, 'rgba(8,2,16,0)');
    scrim.addColorStop(1, 'rgba(8,2,16,0.72)');
    ctx.fillStyle = scrim;
    ctx.fillRect(0, ty - th * 0.35, w, th * 1.35);
  }

  const capSize = fitCaption(ctx, caption, tw, th * 0.62);
  ctx.textAlign = t.align === 'center' ? 'center' : 'left';
  ctx.textBaseline = 'alphabetic';
  const capX = t.align === 'center' ? tx + tw / 2 : tx;
  const capY = ty + th * 0.58;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#12061f';
  ctx.lineWidth = capSize * 0.16;
  ctx.shadowColor = `rgb(${grade.mid[0]},${grade.mid[1]},${grade.mid[2]})`;
  ctx.shadowBlur = capSize * 0.12;
  ctx.strokeText(caption, capX, capY);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(caption, capX, capY);

  const sub = (state.subtitle || '').trim();
  if (sub) {
    const subSize = Math.max(12, capSize * 0.42);
    ctx.font = `${subSize}px Pacifico, cursive`;
    ctx.shadowColor = `rgb(${grade.mid[0]},${grade.mid[1]},${grade.mid[2]})`;
    ctx.shadowBlur = subSize * 0.55;
    ctx.fillStyle = '#ffe9f6';
    ctx.fillText(sub, capX, capY + subSize * 1.25);
    ctx.shadowBlur = 0;
  }
  ctx.restore();

  if (t.badge && state.badge) {
    const label = state.badge.trim().toUpperCase();
    const bSize = Math.max(11, h * 0.016);
    ctx.save();
    ctx.font = `${bSize}px 'Bebas Neue', sans-serif`;
    ctx.letterSpacing = `${Math.max(2, bSize * 0.22)}px`;
    const bw = ctx.measureText(label).width + bSize * 1.6;
    const bh = bSize * 1.9;
    const bx = tx + tw - bw;
    const by = ty - bh * 0.4;
    ctx.translate(bx + bw / 2, by + bh / 2);
    ctx.rotate(-0.03);
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
    ctx.fillStyle = '#1c0b2e';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, bSize * 0.06);
    ctx.restore();
  }
}

function drawHalftone(ctx, zone, w, h) {
  const x0 = zone.x * w;
  const y0 = zone.y * h;
  const zw = zone.w * w;
  const zh = zone.h * h;
  const step = Math.max(10, w * 0.013);
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.10)';
  for (let y = y0 + step / 2; y < y0 + zh; y += step) {
    for (let x = x0 + step / 2; x < x0 + zw; x += step) {
      const r = 1 + 1.6 * Math.abs(Math.sin(x * 0.045 + y * 0.03));
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawFilmSprockets(ctx, strip, w, h) {
  const y = strip.y * h;
  const ph = strip.h * h;
  const hole = Math.max(4, w * 0.006);
  ctx.save();
  ctx.fillStyle = 'rgba(248,244,236,0.85)';
  for (let x = w * 0.02; x < w * 0.98; x += hole * 3.2) {
    ctx.fillRect(x, y + ph * 0.06, hole, hole * 0.7);
    ctx.fillRect(x, y + ph * 0.88, hole, hole * 0.7);
  }
  ctx.restore();
}

// The one entry point: paints the whole cover for `state` onto `canvas`.
export async function renderCover(canvas, state) {
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext('2d');
  const grade = gradeById(state.grade);
  const geo = layoutGeometry(state.layout);
  syncSlots(state);

  try {
    await Promise.all([
      document.fonts.load('100px Anton'),
      document.fonts.load('100px "Bebas Neue"'),
      document.fonts.load('100px Pacifico'),
    ]);
  } catch {
    // Fallback faces in the font stacks still draw; never fail a render.
  }

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = geo.bg;
  ctx.fillRect(0, 0, w, h);

  const photos = state.photos;
  geo.panels.forEach((rect, i) => {
    const slot = state.slots[i] || { photo: 0, cx: 0.5, cy: 0.5, zoom: 1 };
    const img = photos[slot.photo];
    if (!img) {
      ctx.save();
      panelPath(ctx, rect, w, h);
      ctx.fillStyle = i % 2 ? '#2a1544' : '#241238';
      ctx.fill();
      ctx.restore();
      return;
    }
    drawPanel(ctx, img, rect, slot, grade, w, h);
  });

  if (geo.strip) drawFilmSprockets(ctx, geo.strip, w, h);

  // A soft wash across the whole cover so the panels read as one poster.
  const wash = ctx.createLinearGradient(0, 0, w, h);
  wash.addColorStop(0, grade.wash[0]);
  wash.addColorStop(1, grade.wash[1]);
  ctx.save();
  ctx.globalAlpha = 0.14;
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  if (geo.title.halftone) drawHalftone(ctx, geo.title, w, h);
  drawLettering(ctx, state, geo, grade, w, h);

  if (state.vignette) {
    const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
    vg.addColorStop(0, 'rgba(8,3,18,0)');
    vg.addColorStop(1, 'rgba(8,3,18,0.38)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
  }

  if (state.grain) {
    ctx.save();
    ctx.globalAlpha = 0.09;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = ctx.createPattern(grainTile(), 'repeat');
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // Thin poster frame.
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.28)';
  ctx.lineWidth = Math.max(2, w * 0.002);
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, w - ctx.lineWidth, h - ctx.lineWidth);
  ctx.restore();
}

// Hit-test: which panel contains canvas point (px, py)?
export function panelAt(layoutId, px, py, w, h) {
  const geo = layoutGeometry(layoutId);
  for (let i = geo.panels.length - 1; i >= 0; i--) {
    const r = geo.panels[i];
    const x = r.x * w;
    const y = r.y * h;
    const pw = r.w * w;
    const ph = r.h * h;
    if (rectContains(r, px, py, x, y, pw, ph, w)) return i;
  }
  return -1;
}

function rectContains(r, px, py, x, y, pw, ph, cw) {
  if (r.slant) {
    const s = r.slant * cw;
    const top = x + s;
    const frac = (py - y) / ph;
    const left = x + s * (1 - frac);
    return px >= left && px <= left + pw && py >= y && py <= y + ph;
  }
  if (r.rot) {
    const cx = x + pw / 2;
    const cy = y + ph / 2;
    const a = (-r.rot * Math.PI) / 180;
    const dx = px - cx;
    const dy = py - cy;
    const lx = dx * Math.cos(a) - dy * Math.sin(a);
    const ly = dx * Math.sin(a) + dy * Math.cos(a);
    return Math.abs(lx) <= pw / 2 && Math.abs(ly) <= ph / 2;
  }
  return px >= x && px <= x + pw && py >= y && py <= y + ph;
}
