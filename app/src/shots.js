// Fixed scenes for screenshots, driven by the page's query string:
//   ?shot=editor&layout=grid&grade=sunset&size=wide&title=VICE%20HEIST
//   ?shot=cover&layout=trio&grade=neon&size=portrait&title=NEON%20STREETS
//   ?shot=export&layout=grid&grade=sunset&size=wide&title=VICE%20HEIST
// `editor` shows the page with a sample photo loaded; `cover` hides the
// controls and shows the cover alone; `export` sets up the same scene and
// leaves the PNG to window.__exportPNG() for the screenshot script.
// window.__shotReady is set once the scene has painted.

export async function runShot(shot, query, api) {
  const { loadSamples, state, setLayout, setGrade, setSize, redraw } = api;
  const title = document.getElementById('title');
  const subtitle = document.getElementById('subtitle');
  if (shot === 'cover') document.body.classList.add('shot-cover');
  if (query.get('layout')) setLayout(query.get('layout'));
  if (query.get('grade')) setGrade(query.get('grade'));
  if (query.get('size')) setSize(query.get('size'));
  if (query.get('title')) {
    title.value = query.get('title');
    state.title = query.get('title');
  }
  if (query.get('subtitle')) {
    subtitle.value = query.get('subtitle');
    state.subtitle = query.get('subtitle');
  }
  await loadSamples();
  redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}
