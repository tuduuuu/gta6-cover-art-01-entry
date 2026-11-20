// shots.js — screenshot presets for Sunset Strip Cover Maker.
//
// When the page opens with ?shot=cover or ?shot=editor, this module sets
// the app up for a screenshot: it picks a layout, grade and caption, loads
// the built-in sample photos, and (for cover shots) hides the editor chrome
// so the poster fills the viewport. The screenshots are the app's own
// drawing, taken by headless Chromium — never edited or composited.
//
// Query knobs: shot=cover|editor, layout=grid|strip|hero,
// grade=sunset|neon|dusk|noir, size=1080x1080|1080x1350|1920x1080,
// title=..., subtitle=..., sample=boulevard|pier.

import { EXPORT_SIZES, GRADES, LAYOUTS, makeSample } from './cover.js';

export function readShotParams() {
  const q = new URLSearchParams(location.search);
  return {
    mode: q.get('shot'),
    layout: LAYOUTS[q.get('layout')] ? q.get('layout') : 'grid',
    grade: GRADES[q.get('grade')] ? q.get('grade') : 'sunset',
    size: EXPORT_SIZES.find((s) => s.id === q.get('size')) ?? EXPORT_SIZES[2],
    title: q.get('title') ?? 'Sunset Heist',
    subtitle: q.get('subtitle') ?? 'Neon Nights',
    sample: q.get('sample') === 'pier' ? 'pier' : 'boulevard',
  };
}

// Apply a screenshot preset to a fresh state object and return it.
// A single hero panel gets a slightly closer crop so the photo fills it.
export function presetState(params) {
  const first = makeSample(params.sample);
  const second = makeSample(params.sample === 'pier' ? 'boulevard' : 'pier');
  const heroZoom = params.layout === 'hero' ? 1.18 : 1.05;
  return {
    photos: [
      { source: first, name: `${params.sample} sample` },
      { source: second, name: 'second sample' },
    ],
    fill: 'each',
    layout: params.layout,
    grade: params.grade,
    title: params.title,
    subtitle: params.subtitle,
    placements: [{ zoom: heroZoom, ox: 0, oy: 0 }, { zoom: 1.1, ox: 0, oy: 0 }, { zoom: 1, ox: 0, oy: 0 }],
    selected: 0,
  };
}

// In cover mode the poster is the whole page: hide the editor chrome and
// size the stage canvas to the viewport so a viewport screenshot is the
// cover itself.
export function enterCoverMode(stage) {
  document.body.classList.add('shot-cover');
  stage.style.width = '100vw';
  stage.style.height = '100vh';
}
