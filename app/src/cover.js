// cover.js — the poster renderer for Sunset Strip Cover Maker.
//
// Everything on the poster is drawn here: the panel boxes for each layout,
// the photos fitted into them, the colour grade washed over the top, and
// the big gradient caption lettering. The two built-in sample photos are
// also painted here, stroke by stroke, on an offscreen canvas — original
// art made of gradients, silhouettes and shapes, never a borrowed image.

export const LAYOUTS = {
  grid: 'Poster Grid',
  strip: 'Triple Strip',
  hero: 'Hero',
};

export const GRADES = {
  sunset: {
    label: 'Sunset',
    wash: ['rgba(255,122,26,0.20)', 'rgba(255,45,120,0.16)', 'rgba(90,20,140,0.10)'],
    titleTop: '#fff3b0',
    titleBottom: '#ff7a1a',
    edge: '#2b0a3d',
    glow: 'rgba(255,122,26,0.85)',
  },
  neon: {
    label: 'Neon Nights',
    wash: ['rgba(0,229,255,0.16)', 'rgba(255,0,153,0.20)', 'rgba(40,0,90,0.14)'],
    titleTop: '#a5f3ff',
    titleBottom: '#ff2e9a',
    edge: '#0b1030',
    glow: 'rgba(0,229,255,0.9)',
  },
  dusk: {
    label: 'Dusk',
    wash: ['rgba(255,170,90,0.14)', 'rgba(120,60,180,0.18)', 'rgba(10,10,40,0.16)'],
    titleTop: '#ffe9c9',
    titleBottom: '#c96bff',
    edge: '#160a2e',
    glow: 'rgba(180,120,255,0.8)',
  },
  noir: {
    label: 'Noir',
    wash: ['rgba(255,255,255,0.05)', 'rgba(0,0,0,0.22)', 'rgba(0,0,0,0.30)'],
    titleTop: '#ffffff',
    titleBottom: '#9aa3b2',
    edge: '#000000',
    glow: 'rgba(255,255,255,0.55)',
  },
};

export const EXPORT_SIZES = [
  { id: '1080x1080', w: 1080, h: 1080, label: 'Square · 1080 × 1080' },
  { id: '1080x1350', w: 1080, h: 1350, label: 'Portrait · 1080 × 1350' },
  { id: '1920x1080', w: 1920, h: 1080, label: 'Wide · 1920 × 1080' },
];

// Panel boxes for a layout, in fractions of the poster, with a gutter
// between them. Returns [{x, y, w, h}] in pixels for a poster of size W×H.
export function panelBoxes(layout, W, H) {
  const g = Math.round(Math.min(W, H) * 0.012); // gutter
  if (layout === 'hero') {
    return [{ x: 0, y: 0, w: W, h: H }];
  }
  if (layout === 'strip') {
    const w = Math.floor((W - g * 2) / 3);
    return [0, 1, 2].map((i) => ({ x: i * (w + g), y: 0, w, h: H }));
  }
  // grid: one wide hero panel on top, two panels below it.
  const topH = Math.floor(H * 0.56);
  const botW = Math.floor((W - g) / 2);
  return [
    { x: 0, y: 0, w: W, h: topH },
    { x: 0, y: topH + g, w: botW, h: H - topH - g },
    { x: botW + g, y: topH + g, w: W - botW - g, h: H - topH - g },
  ];
}

// Which photo feeds a panel. In "one" mode every panel shows the same
// photo; in "each" mode panel i shows photo i (wrapping if fewer photos).
export function photoForPanel(state, panelIndex) {
  if (!state.photos.length) return null;
  if (state.fill === 'one') return state.photos[0];
  return state.photos[panelIndex % state.photos.length];
}

// Draw one image (or canvas) into a box, cover-fit, with a per-panel
// zoom and a drag offset in pixels (ox, oy are fractions of the box).
function fitPhoto(ctx, source, box, zoom, ox, oy) {
  const sw = source.width;
  const sh = source.height;
  const scale = Math.max(box.w / sw, box.h / sh) * zoom;
  const dw = sw * scale;
  const dh = sh * scale;
  const dx = box.x + (box.w - dw) / 2 + ox * box.w;
  const dy = box.y + (box.h - dh) / 2 + oy * box.h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(box.x, box.y, box.w, box.h);
  ctx.clip();
  ctx.drawImage(source, dx, dy, dw, dh);
  ctx.restore();
}

// Wash a colour grade over the whole poster and darken the edges so
// the caption sits on a readable band.
function washGrade(ctx, W, H, grade) {
  const sky = ctx.createLinearGradient(0, 0, W, H);
  sky.addColorStop(0, grade.wash[0]);
  sky.addColorStop(0.55, grade.wash[1]);
  sky.addColorStop(1, grade.wash[2]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  const vignette = ctx.createRadialGradient(
    W / 2, H / 2, Math.min(W, H) * 0.35,
    W / 2, H / 2, Math.max(W, H) * 0.75,
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.38)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);
}

// The big caption: gradient-filled letters with a heavy dark outline and
// a soft coloured drop shadow, plus a smaller subtitle beneath it.
function paintLettering(ctx, W, H, title, subtitle, grade) {
  const bandH = Math.round(H * 0.24);
  const bandY = H - bandH;
  const band = ctx.createLinearGradient(0, bandY, 0, H);
  band.addColorStop(0, 'rgba(0,0,0,0)');
  band.addColorStop(1, 'rgba(0,0,0,0.62)');
  ctx.fillStyle = band;
  ctx.fillRect(0, bandY, W, H - bandY);

  const titleSize = Math.round(Math.min(W, H) * 0.085);
  const font = `italic 900 ${titleSize}px "Arial Black", Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const cx = W / 2;
  const titleY = H - Math.round(H * 0.075);
  const fill = ctx.createLinearGradient(0, titleY - titleSize, 0, titleY);
  fill.addColorStop(0, grade.titleTop);
  fill.addColorStop(1, grade.titleBottom);
  ctx.save();
  ctx.font = font;
  ctx.shadowColor = grade.glow;
  ctx.shadowBlur = Math.round(titleSize * 0.35);
  ctx.shadowOffsetY = Math.round(titleSize * 0.06);
  ctx.lineJoin = 'round';
  ctx.strokeStyle = grade.edge;
  ctx.lineWidth = Math.round(titleSize * 0.14);
  ctx.strokeText(title.toUpperCase(), cx, titleY);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillStyle = fill;
  ctx.fillText(title.toUpperCase(), cx, titleY);
  ctx.restore();

  if (subtitle.trim()) {
    const subSize = Math.round(Math.min(W, H) * 0.028);
    ctx.font = `700 ${subSize}px Arial, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.92;
    const letters = subtitle.toUpperCase().split('').join('  ');
    ctx.fillText(letters, cx, titleY + subSize * 1.5);
    ctx.globalAlpha = 1;
  }
}

// Draw the whole poster onto a canvas of size W×H. state holds photos,
// per-panel placement, layout, grade, title and subtitle.
export function renderCover(canvas, W, H, state) {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const grade = GRADES[state.grade] ?? GRADES.sunset;
  const boxes = panelBoxes(state.layout, W, H);

  ctx.fillStyle = '#111016';
  ctx.fillRect(0, 0, W, H);
  boxes.forEach((box, i) => {
    const photo = photoForPanel(state, i);
    const place = state.placements[i] ?? { zoom: 1, ox: 0, oy: 0 };
    if (photo) {
      fitPhoto(ctx, photo.source, box, place.zoom, place.ox, place.oy);
    } else {
      // Empty panel: a painted placeholder so the poster never looks broken.
      const ph = ctx.createLinearGradient(box.x, box.y, box.x + box.w, box.y + box.h);
      ph.addColorStop(0, '#3a2b5c');
      ph.addColorStop(1, '#14101f');
      ctx.fillStyle = ph;
      ctx.fillRect(box.x, box.y, box.w, box.h);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = `700 ${Math.round(Math.min(box.w, box.h) * 0.07)}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('ADD A PHOTO', box.x + box.w / 2, box.y + box.h / 2);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = Math.max(2, Math.round(Math.min(W, H) * 0.004));
    ctx.strokeRect(box.x, box.y, box.w, box.h);
  });

  washGrade(ctx, W, H, grade);
  paintLettering(ctx, W, H, state.title || 'Untitled', state.subtitle || '', grade);
  return canvas;
}

// ---------------------------------------------------------------------------
// Procedural sample photos. Each scene is painted from scratch on an
// offscreen canvas: sky gradients, a sun or moon, building silhouettes
// with lit windows, palm trees, a road or pier, and water reflections.
// No borrowed pixels anywhere.

function makeScene(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')];
}

function paintBuildings(ctx, W, H, groundY, palette, seed) {
  let x = -20;
  let n = 0;
  while (x < W + 40) {
    const bw = 70 + ((seed * 37 + n * 53) % 90);
    const bh = H * (0.22 + (((seed + n * 29) % 40) / 100));
    const top = groundY - bh;
    ctx.fillStyle = palette[n % palette.length];
    ctx.fillRect(x, top, bw, bh);
    // Lit windows.
    ctx.fillStyle = 'rgba(255,214,120,0.85)';
    const cols = Math.max(1, Math.floor(bw / 22));
    const rows = Math.max(1, Math.floor(bh / 26));
    for (let r = 0; r < rows; r += 1) {
      for (let col = 0; col < cols; col += 1) {
        if ((r * 7 + col * 3 + n) % 3 === 0) {
          ctx.fillRect(x + 7 + col * 20, top + 10 + r * 24, 8, 11);
        }
      }
    }
    x += bw + 8;
    n += 1;
  }
}

function paintPalm(ctx, x, groundY, scale, lean) {
  ctx.save();
  ctx.translate(x, groundY);
  ctx.strokeStyle = '#1c0f2e';
  ctx.lineWidth = 7 * scale;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(lean * 30, -70 * scale, lean * 55, -120 * scale);
  ctx.stroke();
  ctx.translate(lean * 55, -120 * scale);
  ctx.lineWidth = 4 * scale;
  for (let i = 0; i < 6; i += 1) {
    const a = (Math.PI * (0.15 + i * 0.16)) + (lean > 0 ? 0 : Math.PI * 0.5);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(Math.cos(a) * 46 * scale, Math.sin(a) * 30 * scale - 18 * scale,
      Math.cos(a) * 78 * scale, Math.sin(a) * 46 * scale + 12 * scale);
    ctx.stroke();
  }
  ctx.restore();
}

function sceneBoulevard(w, h) {
  const [c, ctx] = makeScene(w, h);
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#2b0a4d');
  sky.addColorStop(0.45, '#c22e7a');
  sky.addColorStop(0.72, '#ff7a1a');
  sky.addColorStop(1, '#ffd166');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  // Low sun with a warm halo.
  const sunX = w * 0.68;
  const sunY = h * 0.42;
  const halo = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, w * 0.22);
  halo.addColorStop(0, 'rgba(255,240,180,0.95)');
  halo.addColorStop(0.4, 'rgba(255,160,60,0.55)');
  halo.addColorStop(1, 'rgba(255,120,40,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.arc(sunX, sunY, h * 0.085, 0, Math.PI * 2);
  ctx.fill();

  const groundY = h * 0.62;
  paintBuildings(ctx, w, h, groundY, ['#241238', '#1a0b2c', '#2e1547'], 5);
  // Street in front of the buildings.
  ctx.fillStyle = '#191022';
  ctx.fillRect(0, groundY, w, h - groundY);
  ctx.strokeStyle = 'rgba(255,214,120,0.8)';
  ctx.lineWidth = 4;
  ctx.setLineDash([26, 22]);
  ctx.beginPath();
  ctx.moveTo(0, h * 0.82);
  ctx.lineTo(w, h * 0.82);
  ctx.stroke();
  ctx.setLineDash([]);
  // A low car silhouette cruising down the street.
  ctx.fillStyle = '#0d0716';
  const carY = h * 0.74;
  ctx.beginPath();
  ctx.moveTo(w * 0.18, carY);
  ctx.lineTo(w * 0.24, carY - h * 0.045);
  ctx.lineTo(w * 0.38, carY - h * 0.05);
  ctx.lineTo(w * 0.46, carY);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(w * 0.17, carY, w * 0.3, h * 0.035);
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(w * 0.23, carY + h * 0.035, h * 0.016, 0, Math.PI * 2);
  ctx.arc(w * 0.41, carY + h * 0.035, h * 0.016, 0, Math.PI * 2);
  ctx.fill();
  paintPalm(ctx, w * 0.08, groundY + h * 0.02, 1.1, 1);
  paintPalm(ctx, w * 0.93, groundY + h * 0.02, 0.95, -1);
  return c;
}

function scenePier(w, h) {
  const [c, ctx] = makeScene(w, h);
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#05021a');
  sky.addColorStop(0.5, '#1b0f4d');
  sky.addColorStop(0.8, '#5b1a7a');
  sky.addColorStop(1, '#ff2e9a');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  // Stars.
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  for (let i = 0; i < 70; i += 1) {
    const sx = (i * 137.5) % w;
    const sy = (i * 89.3) % (h * 0.45);
    ctx.globalAlpha = 0.25 + ((i * 13) % 10) / 14;
    ctx.fillRect(sx, sy, 2.5, 2.5);
  }
  ctx.globalAlpha = 1;
  // Moon.
  ctx.fillStyle = '#e8f6ff';
  ctx.beginPath();
  ctx.arc(w * 0.2, h * 0.16, h * 0.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(5,2,26,0.85)';
  ctx.beginPath();
  ctx.arc(w * 0.225, h * 0.145, h * 0.055, 0, Math.PI * 2);
  ctx.fill();

  // A dark skyline behind the neon, so the signs sit in a city, not a void.
  const shoreY = h * 0.55;
  paintBuildings(ctx, w, h, shoreY, ['#0d0620', '#120a2e', '#0a0518'], 11);

  // Neon sign blocks on the far shore.
  const neon = ['#00e5ff', '#ff2e9a', '#ffe600', '#7C4DFF'];
  for (let i = 0; i < 9; i += 1) {
    const bx = w * (0.04 + i * 0.105);
    const bh = h * (0.06 + ((i * 31) % 12) / 100);
    const colour = neon[i % neon.length];
    ctx.save();
    ctx.shadowColor = colour;
    ctx.shadowBlur = 22;
    ctx.fillStyle = colour;
    ctx.fillRect(bx, shoreY - bh, w * 0.07, bh);
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(bx + 4, shoreY - bh + 6, w * 0.07 - 8, 5);
  }
  // Water with long neon reflections.
  const sea = ctx.createLinearGradient(0, shoreY, 0, h);
  sea.addColorStop(0, '#2a0a5e');
  sea.addColorStop(1, '#05021a');
  ctx.fillStyle = sea;
  ctx.fillRect(0, shoreY, w, h - shoreY);
  for (let i = 0; i < 9; i += 1) {
    const colour = neon[i % neon.length];
    const bx = w * (0.04 + i * 0.105);
    ctx.globalAlpha = 0.32;
    ctx.fillStyle = colour;
    const rw = w * 0.05;
    for (let r = 0; r < 8; r += 1) {
      ctx.fillRect(bx + ((r % 2) * 6 - 3), shoreY + 8 + r * 18, rw * (1 - r * 0.09), 5);
    }
  }
  ctx.globalAlpha = 1;
  // A moonlit shimmer across the water.
  ctx.fillStyle = 'rgba(232,246,255,0.16)';
  for (let r = 0; r < 6; r += 1) {
    ctx.fillRect(w * 0.14 + ((r % 2) * 14), shoreY + 14 + r * 26, w * 0.12, 4);
  }
  // Boardwalk planks along the bottom edge, with posts and a neon rail.
  ctx.fillStyle = '#150b28';
  ctx.fillRect(0, h * 0.88, w, h * 0.12);
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.lineWidth = 2;
  for (let x = 0; x < w; x += 46) {
    ctx.beginPath();
    ctx.moveTo(x, h * 0.88);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  ctx.fillStyle = '#0d0716';
  for (let x = 30; x < w; x += 120) {
    ctx.fillRect(x, h * 0.82, 10, h * 0.07);
  }
  ctx.strokeStyle = 'rgba(0,229,255,0.75)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.82);
  ctx.lineTo(w, h * 0.82);
  ctx.stroke();
  return c;
}

// Build one of the two built-in sample photos. Returns a canvas the
// renderer can draw like any loaded photo.
export function makeSample(kind) {
  if (kind === 'pier') return scenePier(1200, 800);
  return sceneBoulevard(1200, 800);
}
