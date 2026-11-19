// Neon Coast editor: wires the controls to the renderer, loads photos from
// the machine (FileReader, never uploaded), lets each panel be cropped and
// positioned by drag and zoom, and exports all three post sizes in one click.
import { freshState, sizeById, syncSlots, renderCover, panelAt, layoutGeometry, LAYOUTS, GRADES, SIZES } from './cover.js';

const SAMPLES = ['pier', 'boulevard'];

function el(doc, id) {
  return doc.getElementById(id);
}

function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImageUrl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function createStudio(doc) {
  const state = freshState();
  const preview = el(doc, 'preview');
  const status = el(doc, 'status');
  let selected = 0;
  let renderToken = 0;
  let dragging = null;

  function say(msg) {
    if (status) status.textContent = msg;
  }

  async function render() {
    const token = ++renderToken;
    const size = sizeById(state.size);
    const scale = Math.min(760 / size.w, 760 / size.h);
    preview.width = Math.round(size.w * scale);
    preview.height = Math.round(size.h * scale);
    syncSlots(state);
    await renderCover(preview, state);
    if (token !== renderToken) return;
    drawSelection();
    updateChips();
  }

  function drawSelection() {
    const ctx = preview.getContext('2d');
    const geoPanels = selectedPanelRect();
    if (!geoPanels) return;
    ctx.save();
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 3;
    ctx.setLineDash([12, 8]);
    ctx.strokeRect(geoPanels.x + 2, geoPanels.y + 2, geoPanels.w - 4, geoPanels.h - 4);
    ctx.restore();
  }

  function selectedPanelRect() {
    const geo = layoutGeometry(state.layout);
    const rect = geo.panels[selected];
    if (!rect) return null;
    return {
      x: rect.x * preview.width,
      y: rect.y * preview.height,
      w: rect.w * preview.width,
      h: rect.h * preview.height,
    };
  }

  function updateChips() {
    const tray = el(doc, 'photo-tray');
    if (!tray) return;
    tray.querySelectorAll('.chip').forEach((chip, i) => {
      chip.classList.toggle('used', state.slots.some((s) => s.photo === i));
      chip.classList.toggle('picked', state.slots[selected] && state.slots[selected].photo === i);
    });
  }

  function addPhoto(img, name, skipSync) {
    state.photos.push(img);
    const tray = el(doc, 'photo-tray');
    const chip = doc.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.title = name || `Photo ${state.photos.length}`;
    const thumb = doc.createElement('img');
    thumb.src = img.src;
    thumb.alt = chip.title;
    chip.appendChild(thumb);
    chip.addEventListener('click', () => {
      syncSlots(state);
      state.slots[selected].photo = state.photos.length - 1;
      say(`Panel ${selected + 1} now shows ${chip.title}.`);
      render();
    });
    tray.appendChild(chip);
    if (!skipSync) syncSlots(state);
  }

  async function loadSamples() {
    // Load every sample before syncing slots, so the first sync already sees
    // both photos and spreads them across the panels instead of repeating one.
    const loaded = [];
    for (const name of SAMPLES) {
      try {
        loaded.push([await loadImageUrl(`samples/${name}.jpg`), name]);
      } catch {
        // A missing sample never blocks the studio; uploads still work.
      }
    }
    for (const [img, name] of loaded) addPhoto(img, name, true);
    syncSlots(state);
    await render();
  }

  function buildPickers() {
    const layoutBox = el(doc, 'layout-picker');
    for (const layout of LAYOUTS) {
      const b = doc.createElement('button');
      b.type = 'button';
      b.className = 'pick';
      b.dataset.layout = layout.id;
      b.textContent = `${layout.name} · ${layout.slots}`;
      b.addEventListener('click', () => {
        state.layout = layout.id;
        selected = 0;
        layoutBox.querySelectorAll('.pick').forEach((x) => x.classList.toggle('on', x === b));
        say(`${layout.name}: ${layout.slots} panels. Click a panel, drag to move its photo.`);
        render();
      });
      layoutBox.appendChild(b);
    }
    layoutBox.querySelector('.pick').classList.add('on');

    const gradeBox = el(doc, 'grade-picker');
    for (const grade of GRADES) {
      const b = doc.createElement('button');
      b.type = 'button';
      b.className = 'pick grade';
      b.dataset.grade = grade.id;
      const swatch = doc.createElement('span');
      swatch.className = 'swatch';
      swatch.style.background = `linear-gradient(135deg, rgb(${grade.shadow.join(',')}), rgb(${grade.mid.join(',')}) 55%, rgb(${grade.high.join(',')}))`;
      b.appendChild(swatch);
      b.appendChild(doc.createTextNode(grade.name));
      b.addEventListener('click', () => {
        state.grade = grade.id;
        gradeBox.querySelectorAll('.pick').forEach((x) => x.classList.toggle('on', x === b));
        say(`${grade.name} grade applied.`);
        render();
      });
      gradeBox.appendChild(b);
    }
    gradeBox.querySelector('.pick').classList.add('on');

    const sizeBox = el(doc, 'size-picker');
    for (const size of SIZES) {
      const b = doc.createElement('button');
      b.type = 'button';
      b.className = 'pick';
      b.dataset.size = size.id;
      b.textContent = size.label;
      b.addEventListener('click', () => {
        state.size = size.id;
        sizeBox.querySelectorAll('.pick').forEach((x) => x.classList.toggle('on', x === b));
        render();
      });
      sizeBox.appendChild(b);
    }
    sizeBox.querySelector('[data-size="wide"]').classList.add('on');
  }

  function wireControls() {
    el(doc, 'caption').addEventListener('input', (e) => { state.caption = e.target.value; render(); });
    el(doc, 'subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; render(); });
    el(doc, 'badge').addEventListener('input', (e) => { state.badge = e.target.value; render(); });
    el(doc, 'grain').addEventListener('change', (e) => { state.grain = e.target.checked; render(); });
    el(doc, 'vignette').addEventListener('change', (e) => { state.vignette = e.target.checked; render(); });

    el(doc, 'photo').addEventListener('change', async (e) => {
      const files = [...e.target.files];
      for (const file of files) {
        try {
          addPhoto(await loadImageFile(file), file.name);
        } catch {
          say(`Could not read ${file.name}.`);
        }
      }
      if (files.length) say(`${files.length} photo${files.length > 1 ? 's' : ''} loaded — click a photo, then a panel, to place it.`);
      render();
    });

    el(doc, 'sample-pier').addEventListener('click', async () => {
      addPhoto(await loadImageUrl('samples/pier.jpg'), 'pier');
      render();
    });
    el(doc, 'sample-boulevard').addEventListener('click', async () => {
      addPhoto(await loadImageUrl('samples/boulevard.jpg'), 'boulevard');
      render();
    });
    el(doc, 'fill-all').addEventListener('click', () => {
      syncSlots(state);
      const pick = state.slots[selected] ? state.slots[selected].photo : 0;
      state.slots.forEach((s) => { s.photo = pick; });
      say('One photo now fills every panel.');
      render();
    });
    el(doc, 'spread').addEventListener('click', () => {
      syncSlots(state);
      state.slots.forEach((s, i) => { s.photo = state.photos.length ? i % state.photos.length : 0; });
      say('Photos spread across the panels.');
      render();
    });
    el(doc, 'zoom-in').addEventListener('click', () => { bumpZoom(1.15); });
    el(doc, 'zoom-out').addEventListener('click', () => { bumpZoom(1 / 1.15); });
    el(doc, 'export-all').addEventListener('click', async () => {
      say('Exporting three sizes…');
      const made = await exportAll(false);
      say(made ? 'Saved 3 PNGs: 1080×1080, 1080×1350, 1920×1080.' : 'Export failed — try again.');
    });

    preview.addEventListener('pointerdown', (e) => {
      const rect = preview.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * preview.width;
      const py = ((e.clientY - rect.top) / rect.height) * preview.height;
      const hit = panelAt(state.layout, px, py, preview.width, preview.height);
      if (hit < 0) return;
      selected = hit;
      dragging = { x: e.clientX, y: e.clientY, slot: { ...state.slots[hit] } };
      preview.setPointerCapture(e.pointerId);
      render();
    });
    preview.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const rect = preview.getBoundingClientRect();
      const slot = state.slots[selected];
      const dx = (e.clientX - dragging.x) / rect.width;
      const dy = (e.clientY - dragging.y) / rect.height;
      slot.cx = Math.min(1, Math.max(0, dragging.slot.cx - dx * 0.9));
      slot.cy = Math.min(1, Math.max(0, dragging.slot.cy - dy * 0.9));
      render();
    });
    preview.addEventListener('pointerup', () => { dragging = null; });
    preview.addEventListener('wheel', (e) => {
      e.preventDefault();
      bumpZoom(e.deltaY < 0 ? 1.1 : 1 / 1.1);
    }, { passive: false });
  }

  function bumpZoom(factor) {
    syncSlots(state);
    const slot = state.slots[selected];
    if (!slot) return;
    slot.zoom = Math.min(3, Math.max(0.6, slot.zoom * factor));
    render();
  }

  // Renders every size at full resolution and either downloads the PNGs or
  // hands their data URLs back (the screenshot harness uses the latter).
  async function exportAll(asDataUrls) {
    const out = [];
    for (const size of SIZES) {
      const canvas = doc.createElement('canvas');
      canvas.width = size.w;
      canvas.height = size.h;
      await renderCover(canvas, state);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) return null;
      if (asDataUrls) {
        out.push({ name: `neon-coast-${size.w}x${size.h}.png`, url: await blobToDataUrl(blob), size: blob.size });
      } else {
        downloadBlob(blob, `neon-coast-${size.w}x${size.h}.png`);
        out.push({ name: `neon-coast-${size.w}x${size.h}.png`, size: blob.size });
      }
    }
    return out;
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  }

  buildPickers();
  wireControls();

  return {
    state,
    render,
    loadSamples,
    exportAll,
    selectPanel(i) { selected = i; render(); },
    setCaption(text) { state.caption = text; el(doc, 'caption').value = text; },
    setLayout(id) { state.layout = id; selected = 0; },
    setGrade(id) { state.grade = id; },
    setSize(id) { state.size = id; },
  };
}
