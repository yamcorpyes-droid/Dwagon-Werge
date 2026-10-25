'use strict';

/* ==========================================================================
   WORLD MAP
   The Adventures, world by world, along a winding path. Each level unlocks
   when the one before it is finished; a world opens with its first level.
   ========================================================================== */
const MAP_DECOR = [
  ['🌱', '🌼', '🌳', '🌷', '🦋'],
  ['🍄', '🌲', '🍄', '🐌', '🌲'],
  ['🐚', '🌊', '🦀', '⛵', '🐚'],
  ['⛰', '🪨', '🦅', '⛰', '🌲'],
  ['🌑', '🕸', '🦇', '🥀', '🌫'],
  ['🌸', '🐝', '🍎', '🌷', '🦋'],
  ['❄', '🌲', '⛄', '🏔', '🦌'],
  ['🌋', '🔥', '🌑', '♨', '🦎'],
  ['🏜', '🌵', '🏛', '🐚', '🦂'],
  ['💎', '🔮', '🦇', '💠', '🕯'],
  ['🕸', '🕯', '🦉', '🍄', '🌫'],
  ['🌠', '☁', '🌙', '✨', '🌈'],
];
const CUSTOM_WORLD = { name: 'My Levels', emoji: '🛠', color: '#b0a48a' };

let mapWorld = 1;          // world tab on show (0 = My Levels)
let mapLevel = null;       // level selected on the map

const levelUnlocked = (k) => k === 0 || levelsDone.has(LEVELS[k - 1].key);
const isUnlocked = (def) => def.custom || levelUnlocked(levelIndex(def.key));
const worldLevels = (n) => n === 0 ? Object.values(WORLDS).filter(d => d.custom) : LEVELS.filter(l => l.world === n);
const nextLevel = () => LEVELS.find((l, k) => levelUnlocked(k) && !levelsDone.has(l.key)) || LEVELS[LEVELS.length - 1];

function openMap() {
  // open on the level you're in, or on the next new one
  const at = world.def.level && world.key !== TEST_KEY ? world.def : nextLevel();
  mapWorld = at.custom ? 0 : at.world;
  mapLevel = at.key;
  renderMap();
  showOverlay('advOverlay');
}

function renderMap() {
  $('advStars').textContent = `⭐ ${stars} / ${MAX_STARS} · 🏆 ${wallet.chalices} Chalice${wallet.chalices === 1 ? '' : 's'}`;
  const home = $('mapHomeBtn');
  home.textContent = inCamp() ? '🏕 You are in your Home Camp' : '🏕 Go home to camp';
  home.disabled = inCamp();
  home.onclick = () => { $('advOverlay').classList.remove('show'); enterWorld('camp'); };
  if (mapWorld === 0 && !customLevels.length) mapWorld = 1;
  renderWorldTabs();
  renderPath();
  renderLevelCard();
}

function renderWorldTabs() {
  const tabs = $('worldTabs');
  tabs.innerHTML = '';
  const list = LEVEL_WORLDS.map((w, k) => ({ ...w, n: k + 1 }));
  if (customLevels.length) list.push({ ...CUSTOM_WORLD, n: 0 });
  for (const w of list) {
    const lv = worldLevels(w.n);
    const open = w.n === 0 || isUnlocked(lv[0]);
    const got = lv.reduce((a, l) => a + (levelStars[l.key] || 0), 0);
    const b = document.createElement('button');
    b.className = 'worldTab' + (w.n === mapWorld ? ' on' : '');
    b.style.setProperty('--wc', w.color);
    b.innerHTML = `<span class="we">${open ? w.emoji : '🔒'}</span><span class="wn">${w.name}</span>` +
      `<small>${w.n ? `⭐ ${got}/${lv.length * 3}` : `${lv.length} level${lv.length === 1 ? '' : 's'}`}</small>`;
    b.disabled = !open;
    b.onclick = () => { mapWorld = w.n; mapLevel = null; renderMap(); };
    tabs.appendChild(b);
  }
  // with 12 worlds the tabs scroll sideways: keep the one on show in view
  const on = tabs.querySelector('.on');
  if (on) tabs.scrollLeft = on.offsetLeft - (tabs.clientWidth - on.offsetWidth) / 2;
}

function renderPath() {
  const lv = worldLevels(mapWorld);
  if (!lv.some(l => l.key === mapLevel)) mapLevel = (lv.find(l => isUnlocked(l) && !levelsDone.has(l.key)) || lv[0]).key;
  const info = mapWorld ? LEVEL_WORLDS[mapWorld - 1] : CUSTOM_WORLD;
  const map = $('worldMap');
  map.style.setProperty('--wc', info.color);
  // a snake of 3 levels per row
  const per = 3, rows = Math.ceil(lv.length / per), rowH = 112, H = rows * rowH + 16;
  const pos = lv.map((l, k) => {
    const row = Math.floor(k / per), col = row % 2 ? per - 1 - k % per : k % per;
    return { x: 18 + col * 32, y: 64 + row * rowH };
  });
  map.style.height = `${H}px`;
  const decor = (MAP_DECOR[mapWorld - 1] || ['🛠', '🧱', '🌱']).map((e, k) => {
    const x = 4 + rand(k, mapWorld + 3) * 90, y = 10 + rand(k, mapWorld + 9) * (H - 30);
    return `<span class="decor" style="left:${x}%;top:${y}px">${e}</span>`;
  }).join('');
  const path = pos.map((p, k) => `${k ? 'L' : 'M'}${p.x} ${p.y}`).join(' ');
  map.innerHTML = decor +
    `<svg viewBox="0 0 100 ${H}" preserveAspectRatio="none"><path d="${path}" /></svg>`;
  lv.forEach((def, k) => {
    const open = isUnlocked(def), best = levelStars[def.key] || 0;
    const b = document.createElement('button');
    b.className = 'levelNode' + (open ? '' : ' locked') + (levelsDone.has(def.key) ? ' done' : '') +
      (worlds[def.key] ? ' going' : '') + (def.key === mapLevel ? ' sel' : '') + (world.key === def.key ? ' here' : '');
    b.style.left = `${pos[k].x}%`;
    b.style.top = `${pos[k].y}px`;
    const num = def.custom ? '🛠' : levelIndex(def.key) + 1;
    b.innerHTML = `<span class="num">${open ? num : '🔒'}</span><span class="st">${def.custom ? '' : starText(best)}</span>`;
    b.title = def.name;
    b.onclick = () => { mapLevel = def.key; renderMap(); };
    map.appendChild(b);
  });
}

function renderLevelCard() {
  const def = WORLDS[mapLevel], card = $('levelCard');
  if (!def) { card.innerHTML = ''; return; }
  const k = levelIndex(def.key), open = isUnlocked(def), best = levelStars[def.key] || 0, going = !!worlds[def.key];
  const cost = levelCost(def);
  const title = def.custom ? `🛠 ${def.name}` : `${k + 1}. ${def.name}`;
  const status = !open ? `🔒 Finish ${LEVELS[k - 1].name} first`
    : world.key === def.key ? '📍 You are here'
    : going ? '▶ In progress (continuing is free)'
    : levelsDone.has(def.key) ? `Best: ${starText(best)}` : '✨ New!';
  const goals = [
    '🗿 Rebuild the Guardian Statue (wins the level)',
    def.bonus.length ? `Bonus: ${def.bonus.map(goalText).join(' · ')}` : 'Bonus: none, so this Star comes free',
    'Heal all the land',
  ];
  const reward = !def.custom && !levelsDone.has(def.key) && def.reward.length
    ? `<p class="muted">First-time reward: ${[...def.reward, 'moonstone', 'chalice'].map(t => ITEMS[t].name).join(', ')}, plus a chest that grows with your Stars.</p>`
    : '';
  card.innerHTML = `<h3>${title}</h3><div class="muted">${status}</div>` +
    `<ol class="qlist starList">${goals.map(g => `<li><span class="star">☆</span> ${g}</li>`).join('')}</ol>${reward}`;
  const btns = document.createElement('div');
  btns.className = 'btns';
  const add = (label, fn, primary) => {
    const b = document.createElement('button');
    b.textContent = label;
    if (primary) b.className = 'primary';
    b.disabled = !fn;
    if (fn) b.onclick = fn;
    btns.appendChild(b);
  };
  const close = () => $('advOverlay').classList.remove('show');
  const price = cost ? ` (🏆 ${cost})` : '';
  if (open) {
    if (world.key === def.key) add('📍 You are here', null);
    else if (going) add('▶ Continue', () => { close(); enterWorld(def.key); }, true);
    else add(`▶ Play${price}`, () => { if (startLevel(def.key)) close(); }, true);
    if (going) add(`↺ Restart${price}`, () => {
      if (!confirm(`Start ${def.name} again from the beginning? This run's progress is lost.`)) return;
      if (startLevel(def.key)) close();
    });
    if (def.custom) add('🛠 Edit', () => { close(); openEditor(def.key); });
  }
  card.appendChild(btns);
}
