// main.js — the editor wiring for Sunset Strip Cover Maker.
//
// Owns the app state, the controls, and the live preview: loading the
// user's photos (never uploaded anywhere), picking a panel by clicking it,
// dragging a photo inside its panel, zooming, switching layouts and
// grades, and exporting the poster as a PNG. The drawing itself lives
// in cover.js; the screenshot presets live in shots.js.

import {
  EXPORT_SIZES, GRADES, LAYOUTS, makeSample, panelBoxes, renderCover,
} from './cover.js';
import { enterCoverMode, presetState, readShotParams } from './shots.js';

const $ = (id) => document.getElementById(id);
const stage = $('stage');
const status = $('status');

function freshState() {
  return {
    photos: [],
    fill: 'each',
    layout: 'grid',
    grade: 'sunset',
    title: 'Sunset Heist',
    subtitle: 'Neon Nights',
    placements: [{ zoom: 1, ox: 0, oy: 0 }, { zoom: 1, ox: 0, oy: 0 }, { zoom: 1, ox: 0, oy: 0 }],
    selected: 0,
  };
}

let state = freshState();
let previewSize = { w: 1080, h: 1080 };

function say(message) {
  status.textContent = message;
}

function drawPreview() {
  const boxes = panelBoxes(state.layout, previewSize.w, previewSize.h);
  const ratio = previewSize.w / previewSize.h;
  const maxW = 640;
  const maxH = 560;
  let w = maxW;
  let h = Math.round(w / ratio);
  if (h > maxH) {
    h = maxH;
    w = Math.round(h * ratio);
  }
  renderCover(stage, w, h, state);
  // Outline the selected panel on the preview.
  const ctx = stage.getContext('2d');
  const box = boxes[state.selected];
  if (box) {
    const sx = (box.x / previewSize.w) * w;
    const sy = (box.y / previewSize.h) * h;
    const sw = (box.w / previewSize.w) * w;
    const sh = (box.h / previewSize.h) * h;
    ctx.save();
    ctx.strokeStyle = '#ffe600';
    ctx.lineWidth = 4;
    ctx.setLineDash([14, 8]);
    ctx.strokeRect(sx + 2, sy + 2, sw - 4, sh - 4);
    ctx.restore();
  }
  $('panelLabel').textContent = `Panel ${state.selected + 1} of ${boxes.length} selected — drag the photo to move it`;
}

function syncControls() {
  document.querySelectorAll('[data-layout]').forEach((b) => {
    b.classList.toggle('active', b.dataset.layout === state.layout);
    b.setAttribute('aria-pressed', String(b.dataset.layout === state.layout));
  });
  document.querySelectorAll('[data-grade]').forEach((b) => {
    b.classList.toggle('active', b.dataset.grade === state.grade);
    b.setAttribute('aria-pressed', String(b.dataset.grade === state.grade));
  });
  document.querySelectorAll('[name="fill"]').forEach((r) => {
    r.checked = r.value === state.fill;
  });
  $('titleText').value = state.title;
  $('subtitleText').value = state.subtitle;
  $('zoomRange').value = String(Math.round((state.placements[state.selected]?.zoom ?? 1) * 100));
  $('zoomValue').textContent = `${Math.round((state.placements[state.selected]?.zoom ?? 1) * 100)}%`;
  $('photoCount').textContent = state.photos.length
    ? `${state.photos.length} photo${state.photos.length > 1 ? 's' : ''} loaded`
    : 'No photos yet — try a sample below';
}

function refresh() {
  drawPreview();
  syncControls();
}

function loadFiles(files) {
  const picked = [...files].filter((f) => f.type.startsWith('image/')).slice(0, 3);
  if (!picked.length) {
    say('Pick an image file to add it.');
    return;
  }
  let done = 0;
  picked.forEach((file) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        state.photos.push({ source: img, name: file.name });
        state.photos = state.photos.slice(0, 3);
        done += 1;
        if (done === picked.length) {
          say(`Loaded ${state.photos.length} photo${state.photos.length > 1 ? 's' : ''}. Click a panel, then drag to position it.`);
          refresh();
        }
      };
      img.onerror = () => say(`Could not read ${file.name}.`);
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function loadSample(kind) {
  const canvas = makeSample(kind);
  state.photos.push({ source: canvas, name: `${kind} sample` });
  state.photos = state.photos.slice(0, 3);
  say(`Sample photo added (${state.photos.length} of 3).`);
  refresh();
}

// Clicking the preview picks a panel; dragging moves its photo inside it.
function stagePoint(event) {
  const rect = stage.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * previewSize.w,
    y: ((event.clientY - rect.top) / rect.height) * previewSize.h,
  };
}

let drag = null;
stage.addEventListener('pointerdown', (event) => {
  const point = stagePoint(event);
  const boxes = panelBoxes(state.layout, previewSize.w, previewSize.h);
  const hit = boxes.findIndex((b) => point.x >= b.x && point.x < b.x + b.w
    && point.y >= b.y && point.y < b.y + b.h);
  if (hit === -1) return;
  state.selected = hit;
  drag = { start: point, ox: state.placements[hit].ox, oy: state.placements[hit].oy, box: boxes[hit] };
  stage.setPointerCapture(event.pointerId);
  refresh();
});
stage.addEventListener('pointermove', (event) => {
  if (!drag) return;
  const point = stagePoint(event);
  const place = state.placements[state.selected];
  place.ox = drag.ox + (point.x - drag.start.x) / drag.box.w;
  place.oy = drag.oy + (point.y - drag.start.y) / drag.box.h;
  place.ox = Math.max(-0.6, Math.min(0.6, place.ox));
  place.oy = Math.max(-0.6, Math.min(0.6, place.oy));
  drawPreview();
});
stage.addEventListener('pointerup', () => { drag = null; });
// Double-click a panel to reset its photo to the default framing.
stage.addEventListener('dblclick', () => {
  state.placements[state.selected] = { zoom: 1, ox: 0, oy: 0 };
  say(`Panel ${state.selected + 1} framing reset.`);
  refresh();
});

function exportPng() {
  const size = EXPORT_SIZES.find((s) => s.id === $('exportSize').value) ?? EXPORT_SIZES[0];
  const off = document.createElement('canvas');
  renderCover(off, size.w, size.h, state);
  off.toBlob((blob) => {
    if (!blob) {
      say('Export failed — try again.');
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cover-${state.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'cover'}-${size.id}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    say(`Exported ${size.w} × ${size.h} PNG.`);
    window.__lastExport = { w: size.w, h: size.h, bytes: blob.size };
  }, 'image/png');
}

function wire() {
  $('photoFiles').addEventListener('change', (e) => loadFiles(e.target.files));
  $('sampleBoulevard').addEventListener('click', () => loadSample('boulevard'));
  $('samplePier').addEventListener('click', () => loadSample('pier'));
  document.querySelectorAll('[data-layout]').forEach((b) => {
    b.addEventListener('click', () => {
      state.layout = b.dataset.layout;
      state.selected = 0;
      refresh();
    });
  });
  document.querySelectorAll('[data-grade]').forEach((b) => {
    b.addEventListener('click', () => {
      state.grade = b.dataset.grade;
      refresh();
    });
  });
  document.querySelectorAll('[name="fill"]').forEach((r) => {
    r.addEventListener('change', () => {
      state.fill = r.value;
      refresh();
    });
  });
  $('titleText').addEventListener('input', (e) => {
    state.title = e.target.value;
    drawPreview();
  });
  $('subtitleText').addEventListener('input', (e) => {
    state.subtitle = e.target.value;
    drawPreview();
  });
  $('zoomRange').addEventListener('input', (e) => {
    state.placements[state.selected].zoom = Number(e.target.value) / 100;
    $('zoomValue').textContent = `${e.target.value}%`;
    drawPreview();
  });
  $('exportSize').addEventListener('change', (e) => {
    const size = EXPORT_SIZES.find((s) => s.id === e.target.value) ?? EXPORT_SIZES[0];
    previewSize = { w: size.w, h: size.h };
    drawPreview();
  });
  $('exportBtn').addEventListener('click', exportPng);
  $('clearBtn').addEventListener('click', () => {
    state = freshState();
    say('Cleared — start again with a photo or a sample.');
    refresh();
  });
}

// Screenshot mode (?shot=...) sets the app up and marks itself ready;
// normal mode starts with one sample photo so the poster is never blank.
function boot() {
  wire();
  const params = readShotParams();
  if (params.mode) {
    state = presetState(params);
    previewSize = { w: params.size.w, h: params.size.h };
    if (params.mode === 'cover') {
      enterCoverMode(stage);
      renderCover(stage, previewSize.w, previewSize.h, state);
    } else {
      refresh();
    }
    document.title = `Shot: ${params.mode} ${params.size.id}`;
    window.__shotReady = true;
    return;
  }
  loadSample('boulevard');
}

boot();
