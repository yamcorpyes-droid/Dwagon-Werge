'use strict';

/* ==========================================================================
   LEVEL EDITOR (hidden: tap the game's title 5 times, or open the page with #editor)
   Draw land, place items and Gloomlings, test the level, and save it to
   'My Levels'. The level data it shows is the same shape as a hand-drawn
   entry in js/data/levels.js, so a finished level can be pasted straight in.
   ========================================================================== */
const ED_TOOLS = [
  ['live', '🌿 Living land'], ['dead', '🟫 Dead land'], ['deep', '⬛ Deep dead land'],
  ['item', '🧺 Place item'], ['gloom', '👻 Gloomling'], ['brute', '👹 Gloom Brute'], ['lord', '👑 Gloom Lord'], ['home', '🏠 Start view'], ['erase', '🧽 Erase'],
];
const ED_QUICK = [['g_piece', '🗿 Piece'], ['g_shard', '🗿 Shard'], ['basket', '🧺'], ['flower', '🌸'], ['gloomtotem', 'Totem'], ['woodchest', 'Chest']];
const ED_LAND = { live: '.', dead: '#', deep: 'X' };

let ed = null;               // the level being edited
let edTool = 'live', edItem = 'basket', edPainting = false, edLast = -1, edCell = 32;

/** A small starter level: living land in the middle, a basket, and the Guardian's pieces. */
function blankLevel(cols = 10, rows = 10) {
  const land = [], cx = (cols - 1) / 2, cy = (rows - 1) / 2;
  for (let r = 0; r < rows; r++) {
    let row = '';
    for (let c = 0; c < cols; c++) row += Math.hypot(c - cx, r - cy) <= 2 ? '.' : '#';
    land.push(row);
  }
  const mr = Math.round(cy), mc = Math.round(cx);
  return {
    key: null, name: 'My new level', land,
    items: [[mr, mc, 'basket'], [mr, mc + 1, 'flower'], [1, 1, 'g_piece'], [1, cols - 2, 'g_piece'], [rows - 2, Math.floor(cols / 2), 'g_piece']],
    gloom: [], home: [mr, mc], bonus: [{ type: 'make', item: 'tree', n: 1 }], reward: [],
  };
}

/** Editable copy of any level (built-in, saved, or a blank one). */
function editCopy(def) {
  const cols = def.land[0].length;
  const home = typeof def.home === 'number' ? [Math.floor(def.home / cols), def.home % cols] : def.home;
  return {
    key: def.custom ? def.key : null,
    name: def.custom ? def.name : `${def.name} (my copy)`,
    land: [...def.land], items: def.items.map(x => [...x]), gloom: def.gloom.map(x => [...x]),
    home, bonus: JSON.parse(JSON.stringify(def.bonus || [])), reward: [...(def.reward || [])],
  };
}

function openEditor(key) {
  if (key && WORLDS[key]) ed = editCopy(WORLDS[key]);
  else if (!ed) ed = blankLevel();
  setupEditorUi();
  showOverlay('editorOverlay');
  edRender();
}

function setupEditorUi() {
  // load menu
  const load = $('edLoad');
  load.innerHTML = '<option value="">…</option><option value="+blank">A blank level</option>' +
    (customLevels.length ? `<optgroup label="My Levels">${customLevels.map(o => `<option value="${o.key}">${o.name}</option>`).join('')}</optgroup>` : '') +
    `<optgroup label="Adventures">${LEVELS.map((l, k) => `<option value="${l.key}">${k + 1}. ${l.name}</option>`).join('')}</optgroup>`;
  load.onchange = () => {
    const v = load.value;
    load.value = '';
    if (!v) return;
    ed = v === '+blank' ? blankLevel() : editCopy(WORLDS[v]);
    edRender();
  };
  // tools
  const tools = $('edTools');
  tools.innerHTML = '';
  for (const [id, label] of ED_TOOLS) {
    const b = document.createElement('button');
    b.textContent = label;
    b.dataset.tool = id;
    b.onclick = () => { edTool = id; edRender(); };
    tools.appendChild(b);
  }
  for (const [type, label] of ED_QUICK) {
    const b = document.createElement('button');
    b.textContent = label;
    b.title = ITEMS[type].name;
    b.className = 'quickPick';
    b.onclick = () => { edItem = type; edTool = 'item'; edRender(); };
    tools.appendChild(b);
  }
  // item menu
  const sel = $('edItem');
  sel.innerHTML = CHAINS.map(ch => {
    const opts = ch.items.filter(it => !it.hidden).map(it => `<option value="${it.id}">${it.emoji ? it.emoji + ' ' : ''}${it.name}</option>`).join('');
    return opts ? `<optgroup label="${ch.label}">${opts}</optgroup>` : '';
  }).join('');
  sel.onchange = () => { edItem = sel.value; edTool = 'item'; edRender(); };
  $('edName').oninput = () => { ed.name = $('edName').value; edWriteData(); };
  $('edResize').onclick = () => edResize(+$('edCols').value, +$('edRows').value);
  $('edApply').onclick = edApplyData;
  $('edCopy').onclick = () => {
    $('edData').select();
    (navigator.clipboard ? navigator.clipboard.writeText($('edData').value) : Promise.reject())
      .then(() => toast('📋 Level data copied.'), () => { document.execCommand('copy'); toast('📋 Level data copied.'); });
  };
  $('edTest').onclick = edTest;
  $('edSave').onclick = edSave;
  $('edDelete').onclick = edDelete;

  const cv = $('edCanvas');
  cv.onpointerdown = (e) => { edPainting = true; edLast = -1; try { cv.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } edPaint(e); };
  cv.onpointermove = (e) => { if (edPainting) edPaint(e); };
  cv.onpointerup = cv.onpointercancel = () => { edPainting = false; edWriteData(); edCheck(); };
}

const edCols = () => ed.land[0].length, edRows = () => ed.land.length;
const edItemAt = (r, c) => ed.items.findIndex(([ir, ic]) => ir === r && ic === c);
const edGloomAt = (r, c) => ed.gloom.findIndex(([ir, ic]) => ir === r && ic === c);
const edSetLand = (r, c, ch) => { ed.land[r] = ed.land[r].slice(0, c) + ch + ed.land[r].slice(c + 1); };

function edPaint(e) {
  const cv = $('edCanvas'), box = cv.getBoundingClientRect();
  const c = Math.floor((e.clientX - box.left) / box.width * edCols());
  const r = Math.floor((e.clientY - box.top) / box.height * edRows());
  if (r < 0 || c < 0 || r >= edRows() || c >= edCols()) return;
  const cell = r * edCols() + c;
  if (cell === edLast) return;
  edLast = cell;
  const it = edItemAt(r, c), gl = edGloomAt(r, c);
  if (ED_LAND[edTool]) {
    edSetLand(r, c, ED_LAND[edTool]);
    if (edTool === 'live' && gl >= 0) ed.gloom.splice(gl, 1);       // Gloomlings only live on dead land
  } else if (edTool === 'item') {
    if (it >= 0) ed.items[it][2] = edItem; else ed.items.push([r, c, edItem]);
  } else if (edTool === 'gloom' || edTool === 'brute' || edTool === 'lord') {
    if (ed.land[r][c] === '.') { toast('Gloomlings go on dead land.'); edPainting = false; return; }
    const g = edTool === 'gloom' ? [r, c] : [r, c, edTool];
    if (gl < 0) ed.gloom.push(g); else ed.gloom[gl] = g;
  } else if (edTool === 'home') {
    if (ed.land[r][c] !== '.') { toast('The start view goes on living land.'); edPainting = false; return; }
    ed.home = [r, c];
  } else if (edTool === 'erase') {
    if (it >= 0) ed.items.splice(it, 1);
    if (gl >= 0) ed.gloom.splice(gl, 1);
  }
  edDraw();
}

function edResize(cols, rows) {
  cols = clamp(Math.round(cols) || 10, 5, 24); rows = clamp(Math.round(rows) || 10, 5, 24);
  ed.land = Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => (ed.land[r] && ed.land[r][c]) || '#').join(''));
  const inside = ([r, c]) => r < rows && c < cols;
  ed.items = ed.items.filter(inside);
  ed.gloom = ed.gloom.filter(inside);
  if (!inside(ed.home)) ed.home = [Math.floor(rows / 2), Math.floor(cols / 2)];
  edRender();
}

function edRender() {
  $('edName').value = ed.name;
  $('edCols').value = edCols();
  $('edRows').value = edRows();
  $('edItem').value = edItem;
  document.querySelectorAll('#edTools [data-tool]').forEach(b => b.classList.toggle('primary', b.dataset.tool === edTool));
  $('edDelete').hidden = !ed.key;
  edDraw();
  edWriteData();
  edCheck();
}

function edDraw() {
  const cv = $('edCanvas'), wrap = cv.parentElement;
  const cols = edCols(), rows = edRows();
  edCell = clamp(Math.floor((wrap.clientWidth || 480) / cols), 18, 56);
  const dpr = window.devicePixelRatio || 1;
  cv.style.width = `${cols * edCell}px`; cv.style.height = `${rows * edCell}px`;
  cv.width = cols * edCell * dpr; cv.height = rows * edCell * dpr;
  const g = cv.getContext('2d'), k = edCell / TILE;
  g.setTransform(dpr * k, 0, 0, dpr * k, 0, 0);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const ch = ed.land[r][c], odd = (r + c) % 2;
    g.fillStyle = ch === '.' ? (odd ? '#93d36f' : '#88ca64') : ch === 'X' ? (odd ? '#3a3141' : '#352d3c') : (odd ? '#4b4152' : '#453b4c');
    g.fillRect(c * TILE, r * TILE, TILE, TILE);
  }
  const t = performance.now();
  for (const [r, c, type] of ed.items) {
    if (!ITEMS[type]) continue;
    drawItem(g, { type, charges: startCharges(type) }, c * TILE + TILE / 2, r * TILE + TILE / 2, 0.9, t,
      { pills: false, locked: ed.land[r][c] !== '.' });
  }
  for (const [r, c, kind] of ed.gloom) drawGloomling(g, c * TILE + TILE / 2, r * TILE + TILE / 2, t, r + c, kind, kind === 'lord' ? CONFIG.LORD_HP : null);
  const [hr, hc] = ed.home;
  g.strokeStyle = '#ffd34d'; g.lineWidth = 5;
  g.strokeRect(hc * TILE + 3, hr * TILE + 3, TILE - 6, TILE - 6);
}

/** The level as plain data: one map row per line so it reads like a picture. */
function edDataText() {
  const f = (v) => JSON.stringify(v);
  return '{\n' +
    `  "key": ${f(ed.key || 'my_level')}, "world": 1, "name": ${f(ed.name)},\n` +
    `  "land": [\n${ed.land.map(row => `    ${f(row)}`).join(',\n')}\n  ],\n` +
    `  "items": [${ed.items.map(f).join(', ')}],\n` +
    `  "gloom": ${f(ed.gloom)}, "home": ${f(ed.home)},\n` +
    `  "bonus": ${f(ed.bonus)},\n` +
    `  "reward": ${f(ed.reward)}\n}`;
}
function edWriteData() { if (document.activeElement !== $('edData')) $('edData').value = edDataText(); }

function edApplyData() {
  let o;
  try { o = JSON.parse($('edData').value); } catch (e) { toast('That level data has a typo in it (it must be valid JSON).'); return; }
  const ok = o && Array.isArray(o.land) && o.land.length >= 3 && o.land.every(row => typeof row === 'string' && row.length === o.land[0].length && /^[.#X]+$/.test(row));
  if (!ok) { toast('Each land row must be the same length, using only . # and X'); return; }
  const cols = o.land[0].length, rows = o.land.length;
  const inside = (x) => Array.isArray(x) && x[0] >= 0 && x[1] >= 0 && x[0] < rows && x[1] < cols;
  ed = {
    key: ed.key, name: String(o.name || ed.name).slice(0, 30), land: o.land,
    items: (o.items || []).filter(x => inside(x) && ITEMS[x[2]]),
    gloom: (o.gloom || []).filter(inside),
    home: inside(o.home) ? o.home : [Math.floor(rows / 2), Math.floor(cols / 2)],
    bonus: Array.isArray(o.bonus) ? o.bonus.filter(g => ['make', 'banish', 'collect', 'drive'].includes(g.type) && (g.type !== 'make' || ITEMS[g.item])) : [],
    reward: (o.reward || []).filter(t => ITEMS[t]),
  };
  edRender();
  toast('Level data loaded.');
}

/** Can this level be won and played? Returns a list of problems (empty = fine). */
function edProblems() {
  const out = [], count = (t) => ed.items.filter(x => x[2] === t).length;
  const pieces = count('g_piece') + Math.floor(count('g_shard') / 3) + 3 * count('guardian');
  if (pieces < 3) out.push('needs 3 🗿 Guardian Pieces (3 Shards count as 1 Piece)');
  if (!ed.land.some(row => row.includes('.'))) out.push('needs some living land');
  if (ed.land[ed.home[0]][ed.home[1]] !== '.') out.push('the 🏠 start view should be on living land');
  const source = ed.items.some(([r, c, t]) => ed.land[r][c] === '.' && (ITEMS[t].chain === 'basket' || ITEMS[t].make || ITEMS[t].heal));
  if (!source) out.push('put a Seed Basket (or plant) on living land, or there is no way to make Life Essence');
  for (const g of ed.bonus) if (g.type === 'banish' && !ed.gloom.some(x => x[2] !== 'lord') && !count('gloomtotem')) out.push('a banish goal needs Gloomlings or a Gloom Totem');
  for (const g of ed.bonus) if (g.type === 'drive' && ed.gloom.filter(x => x[2] === 'lord').length < g.n) out.push(`a drive-off goal needs ${g.n} 👑 Gloom Lord${g.n > 1 ? 's' : ''}`);
  return out;
}
function edCheck() {
  const p = edProblems();
  $('edCheck').textContent = p.length ? `⚠ This level ${p.join('; ')}.` : '✓ Ready to play.';
  $('edTest').disabled = $('edSave').disabled = p.length > 0;
}

function edLevelObject(key) {
  return { key, name: ed.name || 'My level', land: [...ed.land], items: ed.items.map(x => [...x]), gloom: ed.gloom.map(x => [...x]),
    home: [...ed.home], bonus: ed.bonus, reward: ed.reward };
}

function edTest() {
  if (edProblems().length) return;
  WORLDS[TEST_KEY] = makeLevel({ ...edLevelObject(TEST_KEY), name: `Test: ${ed.name}`, world: 0 });
  if (world.key === TEST_KEY) { particles = []; world = null; }
  delete worlds[TEST_KEY];
  $('editorOverlay').classList.remove('show');
  startLevel(TEST_KEY);
  toast('▶ Testing! Finish it, or press "Back to camp" and tap the title 5 times to return to the editor.');
}

function edSave() {
  if (edProblems().length) return;
  if (!ed.key) ed.key = `my${Date.now().toString(36)}`;
  const o = edLevelObject(ed.key), k = customLevels.findIndex(x => x.key === ed.key);
  if (k >= 0) customLevels[k] = o; else customLevels.push(o);
  if (world.key === ed.key) enterWorld('camp');
  delete worlds[ed.key];            // an old run of this level wouldn't match the new map
  saveCustomLevels();
  save();
  edRender();
  toast(`💾 Saved "${o.name}" to My Levels on the World Map.`);
}

function edDelete() {
  if (!ed.key || !confirm(`Delete "${ed.name}" from My Levels?`)) return;
  if (world.key === ed.key) enterWorld('camp');
  delete worlds[ed.key];
  customLevels = customLevels.filter(x => x.key !== ed.key);
  saveCustomLevels();
  save();
  ed.key = null;
  edRender();
  toast('Deleted from My Levels. (It is still here in the editor until you start another.)');
}
