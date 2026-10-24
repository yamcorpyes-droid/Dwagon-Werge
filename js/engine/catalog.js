'use strict';

/* ==========================================================================
   CATALOG: turns the plain data tables in js/data/ into what the game uses.
     CHAINS      -> ITEMS   (one lookup table of every item, with tier/next)
     LEVEL_DATA  -> LEVELS  (each level's map and item placement), plus 'My Levels' from the editor
     CAMP+LEVELS -> WORLDS
   ========================================================================== */

// deterministic pseudo-random for decoration and level layout
function rand(i, k) { const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return s - Math.floor(s); }

/* ---- Dwagon breeds: each becomes its own chain ----
   Egg → Lv1 → Lv2 → Lv3 → Lv4 → Cradle (tap to hatch, can't be merged) → Lv5 … Lv8 */
const BREED = Object.fromEntries(BREEDS.map(b => [b.key, b]));
for (const b of BREEDS) {
  const level = (n) => ({
    id: `${b.key}_${n}`, name: `${b.name} ${DWAGON_STAGES[n - 1]}`, emoji: n <= 4 ? '🐲' : '🐉',
    dwagon: n, breed: b.key, ability: b.ability, badge: b.badge, color: b.color, ring: b.ring, glow: n === 8,
  });
  CHAINS.push({ key: `dw_${b.key}`, label: `${b.name} Dwagons`, breed: b.key, color: b.color, ring: b.ring, items: [
    { id: `${b.key}_egg`, name: `${b.name} Dwagon Egg`, draw: 'egg', breed: b.key, shell: b.shell, spots: b.spots,
      desc: `Merge 3 to hatch a ${b.name} Hatchling! ${b.abilityText}` },
    level(1), level(2), level(3), level(4),
    { id: `${b.key}_cradle`, name: `${b.name} Cradle`, draw: 'cradle', breed: b.key, shell: b.shell, spots: b.spots,
      hatch: `${b.key}_5`, noMerge: true,
      desc: `A cradle holding a level-5 ${b.name} Dwagon. Tap it to hatch!` },
    level(5), level(6), level(7), level(8),
  ]});
}

/* ---- Items ---- */
const ITEMS = {};
for (const chain of CHAINS) {
  chain.items.forEach((it, k) => {
    ITEMS[it.id] = {
      color: chain.color || '#eee', ring: chain.ring || '#999', draw: chain.draw || 'token',
      ...it,
      chain: chain.key,
      tier: chain.merge === false ? 0 : k + 1,
      maxTier: chain.items.length,
      next: chain.merge === false ? null : (chain.items[k + 1] ? chain.items[k + 1].id : null),
    };
  });
}
const WILD = 'prism';
const isMergeable = (type) => !!ITEMS[type].next && !ITEMS[type].noMerge;

function describe(def, it) {
  let text = baseDescription(def, it);
  if (def.make && def.make.regrow && CONFIG.TIMERS_ON) {
    text += ` Holds ${def.make.charges}; regrows 1 every ${Math.round(def.make.regrow / 6000) / 10} min.`;
  }
  return text;
}
function baseDescription(def, it) {
  if (def.id === 'bubble') return CONFIG.TIMERS_ON
    ? `Holds a ${ITEMS[it.inner].name}! Pop it for ${CONFIG.BUBBLE_COST} 🌙 before it floats away (it leaves a coin if it does).`
    : `Click to pop it and get a free ${ITEMS[it.inner].name}!`;
  if (def.desc) return def.desc;
  if (def.heal) return `Click to heal the dead land closest to it (${def.heal} points).${def.next ? ' Merge 3 for a stronger orb.' : ''}`;
  if (def.dwagon) {
    const grow = def.dwagon === 4 ? 'Merge 3 to make a Cradle that hatches a level-5 dwagon.'
      : def.next ? 'Merge 3 for a stronger, faster one.' : 'The mightiest dwagon there is!';
    return `${BREED[def.breed].abilityText} Double-click a rock, mushroom or grass and it flies over to harvest it (1 ⚡ per trip; it rests in a nest to recover). Worth ${DWAGON_POWER[def.dwagon - 1]} Dwagon Power. ${grow}`;
  }
  if (def.nest) return `A home for ${def.nest} dwagons in camp. Dwagons without a nest nap instead of working.${def.next ? ' Merge 3 for a bigger nest.' : ''}`;
  if (def.harvest) return `Double-click to send a dwagon to harvest it.${def.next ? ' Merge 3 for a bigger one with more loot.' : ''}`;
  if (def.collect === 'moon') return `Click to collect ${def.value} 🌙. Moonstones skip waits: refill baskets and plants, wake tired dwagons, pop bubbles and pick locks.${def.next ? ' Merge 3 first for a bonus!' : ''}`;
  if (def.collect) return `Click to collect ${def.value} ${def.collect}.${def.next ? ' Merge 3 first for a bonus!' : ''}`;
  if (def.open) return `Click to open it and spill ${def.open.n} surprises.${def.locked ? ' Locked: needs a 🔑 Chest Key.' : ''}${def.next ? ' Merge 3 for a better chest.' : ''}`;
  return '';
}

/* ---- Levels ---- */

/** Build an Adventure level. Levels drawn in the level editor already have their
 *  land and items; the rest are an oval of living land in a sea of dead land, with
 *  start items filling living tiles from the centre outward and hidden items
 *  (and the Guardian Statue bits) scattered through dead land. */
function makeLevel(o) {
  const theme = LEVEL_WORLDS[(o.world || 1) - 1] || {};
  const base = { ...o, level: true, nests: false, bonus: o.bonus || [], reward: o.reward || [], grass: theme.grass || null };
  if (o.land) {
    const [hr, hc] = o.home || [Math.floor(o.land.length / 2), Math.floor(o.land[0].length / 2)];
    return { ...base, items: o.items || [], gloom: o.gloom || [], home: hr * o.land[0].length + hc };
  }
  const [sx, sy] = o.stretch || [1, 1];
  const land = [], live = [], dead = [];
  for (let r = 0; r < o.rows; r++) {
    let row = '';
    for (let c = 0; c < o.cols; c++) {
      const d = Math.hypot((c - o.cx) / sx, (r - o.cy) / sy);
      const island = (o.islands || []).some(([ix, iy, ir]) => Math.hypot(c - ix, r - iy) <= ir);
      const ch = d <= o.live || island ? '.' : d >= o.deep ? 'X' : '#';
      row += ch;
      (ch === '.' ? (island && d > o.live ? [] : live) : dead).push({ r, c, d, k: rand(r * o.cols + c, o.seed) });
    }
    land.push(row);
  }
  live.sort((a, b) => a.d - b.d || a.k - b.k);
  dead.sort((a, b) => a.k - b.k);
  const used = new Set(), items = [];
  const take = (list) => { const t = list.find(t => !used.has(t.r * o.cols + t.c)); used.add(t.r * o.cols + t.c); return t; };
  for (const type of o.start) { const t = take(live); items.push([t.r, t.c, type]); }
  // the Guardian is hidden well away from the start; totems go furthest of all
  const away = dead.filter(t => t.d >= (o.guardianAt || o.live + 1.5));
  for (const type of o.guardian || []) { const t = take(away.length > 8 ? away : dead); items.push([t.r, t.c, type]); }
  const far = [...dead].sort((a, b) => b.d - a.d || a.k - b.k);
  for (const type of o.hidden) { const t = take(type === 'gloomtotem' ? far : dead); items.push([t.r, t.c, type]); }
  const gloom = dead.filter(t => !used.has(t.r * o.cols + t.c)).slice(0, o.gloom || 0).map(t => [t.r, t.c]);
  const home = Math.round(o.cy) * o.cols + Math.round(o.cx);
  return { ...base, land, items, gloom, home };
}

const LEVELS = LEVEL_DATA.map(makeLevel);
const WORLDS = { camp: CAMP };
LEVELS.forEach(l => { WORLDS[l.key] = l; });
const levelIndex = (key) => LEVELS.findIndex(l => l.key === key);
const MAX_STARS = LEVELS.length * 3;

/* ---- Levels made in the level editor ('My Levels') ---- */
let customLevels = [];
function loadCustomLevels() {
  try { customLevels = JSON.parse(localStorage.getItem(CONFIG.CUSTOM_KEY)) || []; } catch (e) { customLevels = []; }
  customLevels = customLevels.filter(o => o && o.key && Array.isArray(o.land));
  for (const k in WORLDS) if (WORLDS[k].custom) delete WORLDS[k];
  for (const o of customLevels) WORLDS[o.key] = makeLevel({ ...o, custom: true, world: 0 });
}
function saveCustomLevels() {
  try { localStorage.setItem(CONFIG.CUSTOM_KEY, JSON.stringify(customLevels)); } catch (e) { /* storage unavailable */ }
  loadCustomLevels();
}
loadCustomLevels();

/* ---- Quests ---- */

/** Current progress toward a quest, from the global stats. */
function questStat(q, s) {
  if (q.made) return s.made[q.made] || 0;
  if (q.dwagonLevel) return Object.entries(s.dl || {}).reduce((n, [lv, c]) => n + (+lv >= q.dwagonLevel ? c : 0), 0);
  if (q.stat === 'power') return campPower();
  if (q.stat === 'breeds') return breedsFound();
  if (q.stat === 'stars') return stars;
  return s[q.stat] || 0;
}
// 'all' in a quest goal means "every Adventure"
QUESTS.forEach(q => { if (q.goal === 'all') q.goal = LEVELS.length; if (q.goal === 'allstars') q.goal = MAX_STARS; });
