// Neon Vice Cover Studio: draws the multi-panel poster cover onto a canvas.
// Everything drawn here is original: the sun, skyline and palm silhouettes
// are vector shapes drawn in code, the lettering is canvas text in system
// fonts, and no Rockstar logo, artwork, character or font is used anywhere.
// The drawing is deterministic: fixed decoration positions, no randomness,
// so the same state always draws the same cover.

export const SIZES = {
  square: { label: '1080 x 1080', width: 1080, height: 1080 },
  portrait: { label: '1080 x 1350', width: 1080, height: 1350 },
  wide: { label: '1920 x 1080', width: 1920, height: 1080 },
};

export const GRADES = {
  sunset: { label: 'Sunset', accent: '#ff8ad8', sky: '#ff9a3c' },
  neon: { label: 'Neon Nights', accent: '#5ff2ff', sky: '#ff2e9e' },
  dusk: { label: 'Dusk', accent: '#c9a7ff', sky: '#7b5cff' },
  noir: { label: 'Noir', accent: '#e8e8e8', sky: '#9a9a9a' },
};

const TITLE_FONT = '"Arial Black", "Helvetica Neue", Arial, sans-serif';
const BODY_FONT = '"Helvetica Neue", Arial, sans-serif';

/** Panel rectangles for a layout at cover size w x h (3 panels, or 1 for hero). */
export function layoutPanels(layout, w, h) {
  const b = Math.round(Math.min(w, h) * 0.022); // outer border
  const g = Math.round(Math.min(w, h) * 0.016); // gap between panels
  if (layout === 'hero') return [{ x: b, y: b, w: w - 2 * b, h: h - 2 * b }];
  if (layout === 'trio') {
    const pw = (w - 2 * b - 2 * g) / 3;
    const ph = h - 2 * b;
    return [0, 1, 2].map((i) => ({ x: b + i * (pw + g), y: b, w: pw, h: ph }));
  }
  // grid: one wide hero panel on top, two panels below it.
  const heroH = Math.round((h - 2 * b - g) * 0.54);
  const lowerH = h - 2 * b - g - heroH;
  const lowerW = (w - 2 * b - g) / 2;
  return [
    { x: b, y: b, w: w - 2 * b, h: heroH },
    { x: b, y: b + heroH + g, w: lowerW, h: lowerH },
    { x: b + lowerW + g, y: b + heroH + g, w: lowerW, h: lowerH },
  ];
}

/** Which panel (index) holds point x, y at cover size w x h, or -1. */
export function panelAt(layout, w, h, x, y) {
  const panels = layoutPanels(layout, w, h);
  for (let i = 0; i < panels.length; i += 1) {
    const p = panels[i];
    if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) return i;
  }
  return -1;
}

function roundRectPath(ctx, x, y, w, h, r) {
  const rad = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function fitCaption(ctx, text, font, maxWidth, startSize) {
  let size = startSize;
  ctx.font = font(size);
  while (size > 12 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = font(size);
  }
  return size;
}

/** Draws one photo into a panel, cover-fit, with the panel's zoom and pan. */
function drawPanelPhoto(ctx, panel, photo, zoom, dx, dy, grade) {
  ctx.save();
  roundRectPath(ctx, panel.x, panel.y, panel.w, panel.h, Math.min(panel.w, panel.h) * 0.02);
  ctx.clip();
  if (!photo) {
    const g = ctx.createLinearGradient(panel.x, panel.y, panel.x + panel.w, panel.y + panel.h);
    g.addColorStop(0, '#3a1c5e');
    g.addColorStop(0.55, '#a83a6e');
    g.addColorStop(1, '#ff7a3c');
    ctx.fillStyle = g;
    ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = `700 ${Math.round(panel.h * 0.045)}px ${BODY_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('ADD A PHOTO', panel.x + panel.w / 2, panel.y + panel.h / 2);
  } else {
    if (grade === 'noir') ctx.filter = 'grayscale(1) contrast(1.25) brightness(1.06)';
    const scale = Math.max(panel.w / photo.naturalWidth, panel.h / photo.naturalHeight) * zoom;
    const pw = photo.naturalWidth * scale;
    const ph = photo.naturalHeight * scale;
    const px = panel.x + (panel.w - pw) / 2 + dx * panel.w;
    const py = panel.y + (panel.h - ph) / 2 + dy * panel.h;
    ctx.drawImage(photo, px, py, pw, ph);
    ctx.filter = 'none';
  }
  applyGradeTint(ctx, panel, grade);
  drawPanelVignette(ctx, panel);
  ctx.restore();
  // Crisp panel edge.
  ctx.save();
  roundRectPath(ctx, panel.x, panel.y, panel.w, panel.h, Math.min(panel.w, panel.h) * 0.02);
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = Math.max(2, panel.w * 0.004);
  ctx.stroke();
  ctx.restore();
}

/** The Vice City sunset / neon colour grade, as an overlay clipped to the panel. */
function applyGradeTint(ctx, panel, grade) {
  const { x, y, w, h } = panel;
  let tint;
  if (grade === 'neon') {
    tint = ctx.createLinearGradient(x, y, x + w, y + h);
    tint.addColorStop(0, 'rgba(255,0,160,0.20)');
    tint.addColorStop(0.5, 'rgba(120,0,255,0.10)');
    tint.addColorStop(1, 'rgba(0,220,255,0.24)');
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = tint;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
    return;
  }
  if (grade === 'dusk') {
    tint = ctx.createLinearGradient(x, y, x, y + h);
    tint.addColorStop(0, 'rgba(90,40,180,0.22)');
    tint.addColorStop(1, 'rgba(0,180,200,0.16)');
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = tint;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
    return;
  }
  if (grade === 'noir') {
    ctx.fillStyle = 'rgba(24,24,48,0.14)';
    ctx.fillRect(x, y, w, h);
    return;
  }
  // sunset (default): warm light falling from the top, magenta dusk at the foot.
  tint = ctx.createLinearGradient(x, y, x, y + h);
  tint.addColorStop(0, 'rgba(255,170,80,0.06)');
  tint.addColorStop(0.55, 'rgba(255,90,120,0.16)');
  tint.addColorStop(1, 'rgba(120,20,90,0.36)');
  ctx.fillStyle = tint;
  ctx.fillRect(x, y, w, h);
}

function drawPanelVignette(ctx, panel) {
  const { x, y, w, h } = panel;
  const v = ctx.createRadialGradient(
    x + w / 2, y + h / 2, Math.min(w, h) * 0.35,
    x + w / 2, y + h / 2, Math.max(w, h) * 0.75,
  );
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.30)');
  ctx.fillStyle = v;
  ctx.fillRect(x, y, w, h);
}

/** A dusk skyline silhouette with lit windows, along the panel's foot. */
function drawSkyline(ctx, panel) {
  const base = panel.y + panel.h;
  const heights = [0.16, 0.24, 0.13, 0.30, 0.19, 0.27, 0.15, 0.22, 0.31, 0.17, 0.25, 0.14];
  const n = heights.length;
  const bw = panel.w / n;
  ctx.save();
  ctx.fillStyle = 'rgba(18,6,30,0.88)';
  for (let i = 0; i < n; i += 1) {
    const bh = panel.h * heights[i];
    ctx.fillRect(panel.x + i * bw, base - bh, bw * 0.92, bh);
  }
  // Lit windows: a fixed pattern, never random.
  const lit = ['#ffd76a', '#5ff2ff', '#ff7ad9'];
  for (let i = 0; i < n; i += 1) {
    const bh = panel.h * heights[i];
    const cols = 2;
    const rows = Math.max(1, Math.floor(bh / (panel.h * 0.055)));
    for (let c = 0; c < cols; c += 1) {
      for (let row = 0; row < rows; row += 1) {
        if ((i * 3 + c * 5 + row * 2) % 4 !== 0) continue;
        ctx.fillStyle = lit[(i + c + row) % lit.length];
        ctx.globalAlpha = 0.9;
        ctx.fillRect(
          panel.x + i * bw + bw * (0.18 + c * 0.42),
          base - bh + panel.h * 0.03 + row * panel.h * 0.055,
          bw * 0.2,
          panel.h * 0.028,
        );
      }
    }
  }
  ctx.restore();
}

/** Halftone dots in the hero panel's top-right corner, for the poster-print feel. */
function drawHalftone(ctx, panel) {
  const step = Math.max(10, panel.w * 0.022);
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 6; col += 1) {
      const r = (1 - (row + col) / 12) * step * 0.22;
      ctx.beginPath();
      ctx.arc(panel.x + panel.w - (col + 1) * step, panel.y + (row + 1) * step, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** The big title and subtitle, drawn over a dusk band across the cover's foot. */
function drawTitleBlock(ctx, w, h, title, subtitle, grade) {
  const bandTop = h * 0.66;
  const band = ctx.createLinearGradient(0, bandTop, 0, h);
  band.addColorStop(0, 'rgba(8,2,20,0)');
  band.addColorStop(0.45, 'rgba(8,2,20,0.62)');
  band.addColorStop(1, 'rgba(8,2,20,0.92)');
  ctx.fillStyle = band;
  ctx.fillRect(0, bandTop, w, h - bandTop);

  const text = (title || 'VICE HEIST').trim().toUpperCase();
  const size = fitCaption(ctx, text, (s) => `900 ${s}px ${TITLE_FONT}`, w * 0.92, Math.round(h * 0.115));
  try { ctx.letterSpacing = '2px'; } catch { /* older canvas: no letter spacing */ }
  const titleY = h * 0.885;
  const grad = ctx.createLinearGradient(0, titleY - size, 0, titleY + size * 0.1);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.55, '#ffd76a');
  grad.addColorStop(1, '#ff7a3c');
  ctx.save();
  ctx.font = `900 ${size}px ${TITLE_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = size * 0.12;
  ctx.shadowOffsetY = size * 0.03;
  ctx.strokeStyle = '#160a2e';
  ctx.lineWidth = Math.max(3, size * 0.09);
  ctx.strokeText(text, w / 2, titleY);
  ctx.fillStyle = grad;
  ctx.fillText(text, w / 2, titleY);
  ctx.restore();

  const sub = (subtitle || '').trim().toUpperCase();
  if (sub) {
    const subSize = Math.max(14, Math.round(h * 0.026));
    ctx.save();
    ctx.font = `700 ${subSize}px ${BODY_FONT}`;
    try { ctx.letterSpacing = `${Math.round(subSize * 0.32)}px`; } catch { /* no letter spacing */ }
    const subY = h * 0.945;
    const subW = ctx.measureText(sub).width;
    ctx.textAlign = 'center';
    ctx.fillStyle = GRADES[grade].accent;
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 6;
    ctx.fillText(sub, w / 2, subY);
    // Side bars flanking the subtitle.
    ctx.shadowBlur = 0;
    ctx.fillStyle = GRADES[grade].accent;
    const barW = w * 0.055;
    ctx.fillRect(w / 2 - subW / 2 - barW - 18, subY - subSize * 0.32, barW, 2);
    ctx.fillRect(w / 2 + subW / 2 + 18, subY - subSize * 0.32, barW, 2);
    ctx.restore();
  }
  try { ctx.letterSpacing = '0px'; } catch { /* no letter spacing */ }
}

/** The small original studio badge in the cover's top corner. */
function drawBadge(ctx, w, h) {
  const size = Math.max(13, Math.round(h * 0.017));
  ctx.save();
  ctx.font = `800 ${size}px ${BODY_FONT}`;
  try { ctx.letterSpacing = `${Math.round(size * 0.28)}px`; } catch { /* no letter spacing */ }
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.shadowColor = 'rgba(0,0,0,0.65)';
  ctx.shadowBlur = 5;
  ctx.fillText('NEON VICE', w * 0.035, h * 0.052);
  ctx.restore();
}

/**
 * Draws the whole cover onto `canvas` at its own size.
 * state: { layout, grade, title, subtitle, photos, panels }
 *   photos: array of images (or null); panels: [{ photo, zoom, dx, dy }]
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const layout = state.layout || 'grid';
  const grade = GRADES[state.grade] ? state.grade : 'sunset';
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#160a24';
  ctx.fillRect(0, 0, w, h);

  const panels = layoutPanels(layout, w, h);
  panels.forEach((panel, i) => {
    const slot = (state.panels && state.panels[i]) || { photo: i, zoom: 1, dx: 0, dy: 0 };
    const photo = state.photos ? state.photos[slot.photo] ?? null : null;
    drawPanelPhoto(ctx, panel, photo, slot.zoom || 1, slot.dx || 0, slot.dy || 0, grade);
  });

  // Decorations live on the first (hero) panel, clipped to it: the skyline
  // silhouette and halftone dots. The photos bring their own suns and palms.
  const hero = panels[0];
  ctx.save();
  roundRectPath(ctx, hero.x, hero.y, hero.w, hero.h, Math.min(hero.w, hero.h) * 0.02);
  ctx.clip();
  drawSkyline(ctx, hero);
  drawHalftone(ctx, hero);
  ctx.restore();

  drawTitleBlock(ctx, w, h, state.title, state.subtitle, grade);
  drawBadge(ctx, w, h);

  // Outer frame.
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = Math.max(2, w * 0.002);
  ctx.strokeRect(w * 0.008, h * 0.008, w * 0.984, h * 0.984);
  ctx.restore();
}
