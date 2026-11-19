// Neon Vice Cover Studio: wires the page. Pick photos, click a panel to select
// it, drag it to position its photo, type a caption, pick a layout, grade and
// post size, and export the cover as a PNG. A `?shot=` query sets up a fixed
// scene for a screenshot instead (see shots.js): ?shot=editor shows the page
// with a sample photo loaded, ?shot=cover shows the cover alone, and
// ?shot=export prepares a scene whose PNG the screenshot script can pull out
// with window.__exportPNG().

import { drawCover, layoutPanels, panelAt, SIZES, GRADES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const titleInput = document.getElementById('title');
const subtitleInput = document.getElementById('subtitle');
const status = document.getElementById('status');
const panelLabel = document.getElementById('panel-label');
const zoomInput = document.getElementById('zoom');
const photoInput = document.getElementById('panel-photo');
const fillAllButton = document.getElementById('fill-all');
const resetButton = document.getElementById('reset-panel');
const exportButton = document.getElementById('export');

const state = {
  layout: 'grid',
  grade: 'sunset',
  size: 'wide',
  title: 'VICE HEIST',
  subtitle: 'ONE LAST SCORE IN THE SUNSET CITY',
  photos: [null, null, null],
  panels: [
    { photo: 0, zoom: 1, dx: 0, dy: 0 },
    { photo: 1, zoom: 1, dx: 0, dy: 0 },
    { photo: 2, zoom: 1, dx: 0, dy: 0 },
  ],
};
let selectedPanel = 0;
let dragging = null;

function currentSize() {
  return SIZES[state.size];
}

function redraw() {
  const size = currentSize();
  if (canvas.width !== size.width || canvas.height !== size.height) {
    canvas.width = size.width;
    canvas.height = size.height;
  }
  drawCover(canvas, state);
  const slot = state.panels[selectedPanel] || state.panels[0];
  panelLabel.textContent = `Panel ${selectedPanel + 1} — photo ${slot.photo + 1}`;
  zoomInput.value = String(slot.zoom);
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

/** Loads the two built-in sample photos into slots 1 and 2 (slot 3 reuses 1). */
async function loadSamples() {
  const [beach, street] = await Promise.all([
    loadImage('samples/sunset-beach.jpg'),
    loadImage('samples/neon-street.jpg'),
  ]);
  state.photos = [beach, street, beach];
  redraw();
}

function setLayout(layout) {
  state.layout = layout;
  selectedPanel = 0;
  document.querySelectorAll('[data-layout]').forEach((b) => {
    b.classList.toggle('active', b.dataset.layout === layout);
  });
  redraw();
}

function setGrade(grade) {
  state.grade = grade;
  document.querySelectorAll('[data-grade]').forEach((b) => {
    b.classList.toggle('active', b.dataset.grade === grade);
  });
  redraw();
}

function setSize(size) {
  state.size = size;
  document.querySelectorAll('[data-size]').forEach((b) => {
    b.classList.toggle('active', b.dataset.size === size);
  });
  redraw();
}

/** Renders the cover at its exact export size and resolves to a PNG data URL. */
export function exportPNG() {
  return new Promise((resolve) => {
    const size = currentSize();
    const off = document.createElement('canvas');
    off.width = size.width;
    off.height = size.height;
    drawCover(off, state);
    resolve(off.toDataURL('image/png'));
  });
}

function downloadPNG() {
  exportPNG().then((url) => {
    const size = currentSize();
    const a = document.createElement('a');
    a.href = url;
    a.download = `neon-vice-cover-${size.width}x${size.height}.png`;
    a.click();
    status.textContent = `Saved neon-vice-cover-${size.width}x${size.height}.png`;
  });
}

// Panel photo upload: the file becomes a new photo slot and fills the panel.
photoInput.addEventListener('change', async (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const img = await loadImage(URL.createObjectURL(file));
  const slotIndex = state.photos.findIndex((p) => p === null);
  const at = slotIndex === -1 ? selectedPanel : slotIndex;
  state.photos[at] = img;
  state.panels[selectedPanel].photo = at;
  state.panels[selectedPanel].zoom = 1;
  state.panels[selectedPanel].dx = 0;
  state.panels[selectedPanel].dy = 0;
  status.textContent = `Photo ${at + 1} loaded into panel ${selectedPanel + 1}.`;
  redraw();
});

zoomInput.addEventListener('input', () => {
  state.panels[selectedPanel].zoom = Number(zoomInput.value);
  redraw();
});

fillAllButton.addEventListener('click', () => {
  const photo = state.panels[selectedPanel].photo;
  state.panels.forEach((p) => { p.photo = photo; });
  status.textContent = `Photo ${photo + 1} now fills every panel.`;
  redraw();
});

resetButton.addEventListener('click', () => {
  state.panels[selectedPanel].zoom = 1;
  state.panels[selectedPanel].dx = 0;
  state.panels[selectedPanel].dy = 0;
  redraw();
});

titleInput.addEventListener('input', () => { state.title = titleInput.value; redraw(); });
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redraw(); });
document.querySelectorAll('[data-layout]').forEach((b) => {
  b.addEventListener('click', () => setLayout(b.dataset.layout));
});
document.querySelectorAll('[data-grade]').forEach((b) => {
  b.addEventListener('click', () => setGrade(b.dataset.grade));
});
document.querySelectorAll('[data-size]').forEach((b) => {
  b.addEventListener('click', () => setSize(b.dataset.size));
});
exportButton.addEventListener('click', downloadPNG);

// Click a panel to select it; drag it to pan its photo.
function canvasPoint(e) {
  const rect = canvas.getBoundingClientRect();
  const size = currentSize();
  return {
    x: ((e.clientX - rect.left) / rect.width) * size.width,
    y: ((e.clientY - rect.top) / rect.height) * size.height,
  };
}
canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const hit = panelAt(state.layout, canvas.width, canvas.height, p.x, p.y);
  if (hit === -1) return;
  selectedPanel = hit;
  dragging = { x: p.x, y: p.y, dx: state.panels[hit].dx, dy: state.panels[hit].dy };
  canvas.setPointerCapture(e.pointerId);
  redraw();
});
canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const p = canvasPoint(e);
  const slot = state.panels[selectedPanel];
  const panels = layoutPanels(state.layout, canvas.width, canvas.height);
  const panel = panels[selectedPanel];
  slot.dx = Math.max(-0.45, Math.min(0.45, dragging.dx + (p.x - dragging.x) / panel.w));
  slot.dy = Math.max(-0.45, Math.min(0.45, dragging.dy + (p.y - dragging.y) / panel.h));
  redraw();
});
canvas.addEventListener('pointerup', () => { dragging = null; });

// Handles for the screenshot script and the ?shot= scenes.
window.__exportPNG = exportPNG;
window.__neonViceState = state;

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  runShot(shot, params, { loadImage, loadSamples, state, setLayout, setGrade, setSize, redraw });
} else {
  loadSamples().catch(() => redraw());
  redraw();
}
