'use strict';

/* ==========================================================================
   5. STATE & WORLDS
   The current world's arrays are bound to these globals; every world keeps
   its own tiles/items/enemies so Adventures and the camp don't mix.
   ========================================================================== */
let COLS = 16, ROWS = 16, N = 256;
let world = null;          // current world object
let worlds = {};           // key -> world object (built when first visited)
let tiles = [];            // { dead, heal, cost, mist }
let items = [];            // null | { type, charges, t0, from, job?, inner? }
let enemies = [];          // Gloomlings: { i, from, t0, next }
let tasks = [];            // tile indices queued for dwagon harvest
let reserved = [];         // healing points in flight toward each tile

// global progress
let wallet = { coins: 0, bricks: 0, moon: 0, chalices: 0 };
let stats = null;
let stars = 0;
let levelsDone = new Set();   // Adventures finished at least once
let levelStars = {};          // Adventure key -> best ⭐ (1..3)
let questDone = {};        // quest id -> true once finished
let discovered = new Set();
let pendingRewards = [];   // reward items waiting for free space in camp
let storage = [];
let won = false;

// transient visuals
let particles = [], puffs = [], blooms = [], floaters = [];
let hintCells = null;
let selected = -1;
let lastClick = { idx: -1, t: 0 };
let awake = new Set();     // dwagons that have a nest (recomputed each frame)
let booting = true;

const rowOf = (i) => Math.floor(i / COLS);
const colOf = (i) => i % COLS;
const center = (i) => ({ x: colOf(i) * TILE + TILE / 2, y: rowOf(i) * TILE + TILE / 2 });
const dist2 = (a, b) => (rowOf(a) - rowOf(b)) ** 2 + (colOf(a) - colOf(b)) ** 2;
const now = () => performance.now();
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const worldW = () => COLS * TILE, worldH = () => ROWS * TILE;
const inCamp = () => world && world.key === 'camp';
const TEST_KEY = 'test';   // a level being tried out from the level editor
/** Stars count from the Adventures only (not 'My Levels'). */
const totalStars = () => LEVELS.reduce((n, l) => n + (levelStars[l.key] || 0), 0);

/** Usable = living land not under mist. */
const usable = (i) => !tiles[i].dead && !tiles[i].mist;

function neighbors(i) {
  const r = rowOf(i), c = colOf(i), out = [];
  if (r > 0) out.push(i - COLS);
  if (r < ROWS - 1) out.push(i + COLS);
  if (c > 0) out.push(i - 1);
  if (c < COLS - 1) out.push(i + 1);
  return out;
}

function startCharges(type) {
  const d = ITEMS[type];
  return d.harvest ? d.harvest.charges : d.taps ? d.taps : maxCharges(d);
}
function makeItem(type, from = null) { return { type, charges: startCharges(type), t0: now(), from }; }

/** Create an item through play: counts toward quests, level goals and the collection. */
function create(type, from = null) {
  const def = ITEMS[type];
  stats.made[type] = (stats.made[type] || 0) + 1;
  world.made[type] = (world.made[type] || 0) + 1;
  if (def.dwagon) stats.dl[def.dwagon] = (stats.dl[def.dwagon] || 0) + 1;
  if (def.hatch) stats.cradles++;
  discover(type);
  return makeItem(type, from);
}

/* ---- Dwagon Power ---- */
const dwagonPower = (def) => def.dwagon ? DWAGON_POWER[def.dwagon - 1] : 0;
/** Power an item adds to the camp: dwagons by level, Wonders by their own value. */
const itemPower = (def) => dwagonPower(def) || def.wonder || 0;

/** Add up something over the usable tiles of the Home Camp. */
function campSum(fn) {
  const w = worlds.camp;
  if (!w) return 0;
  return w.items.reduce((p, it, i) => p + (it && !w.tiles[i].dead && !w.tiles[i].mist ? fn(ITEMS[it.type]) : 0), 0);
}

/** Total Dwagon Power of the dwagons and Wonders in the Home Camp. */
const campPower = () => campSum(itemPower);

/** How many coins you can hold: a base amount plus every Coin Jar / Coffer / Vault in camp. */
const coinCap = () => CONFIG.COIN_CAP + campSum(def => def.vault || 0);

/** How many different breeds have turned up so far (an egg counts). */
const breedsFound = () => BREEDS.filter(b => [...discovered].some(id => ITEMS[id] && ITEMS[id].breed === b.key)).length;

function discover(type) {
  if (discovered.has(type) || ITEMS[type].hidden) return;
  discovered.add(type);
  if (!booting) toast(`📖 New discovery: ${ITEMS[type].name}!`);
}

function freshStats() {
  return { made: {}, dl: {}, healed: 0, coins: 0, bricks: 0, moon: 0, harvests: 0, bonus5: 0, merges: 0, banished: 0, levels: 0, guardians: 0, chalices: 0, mist: 0, campClear: 0, treats: 0, keys: 0, cradles: 0 };
}

/** Build a world fresh from its definition. */
function buildWorld(key) {
  const def = WORLDS[key];
  const rows = def.land.length, cols = def.land[0].length;
  const w = {
    key, def, cols, rows,
    tiles: def.land.flatMap((row, r) => [...row].map((ch, c) => ({
      dead: ch !== '.', heal: 0, cost: CONFIG.HEAL_COST[ch] || 0, mist: def.mist && def.mist[r][c] !== '.' ? def.mist[r][c] : null,
    }))),
    items: new Array(rows * cols).fill(null),
    enemies: [], tasks: [], mistOpen: [],
    made: {}, collected: { coins: 0, bricks: 0, moon: 0 }, banished: 0, complete: false,
    totemNext: {}, cam: null,
  };
  for (const [r, c, type] of def.items) w.items[r * cols + c] = makeItem(type);
  w.enemies = (def.gloom || []).map(([r, c]) => ({ i: r * cols + c, from: r * cols + c, t0: 0, next: 0 }));
  w.totalDead = w.tiles.filter(t => t.dead).length;
  w.items.forEach((it, i) => { if (it && !w.tiles[i].dead && !w.tiles[i].mist) discovered.add(it.type); });
  // label position for each mist region
  w.mistLabels = {};
  for (const k in (def.regions || {})) {
    const cells = w.tiles.map((t, i) => t.mist === k ? i : -1).filter(i => i >= 0);
    const sx = cells.reduce((a, i) => a + i % cols, 0) / cells.length;
    const sy = cells.reduce((a, i) => a + Math.floor(i / cols), 0) / cells.length;
    w.mistLabels[k] = { x: (sx + 0.5) * TILE, y: (sy + 0.5) * TILE };
  }
  return w;
}

/** Point the global arrays at a world. */
function bindWorld(w) {
  world = w;
  COLS = w.cols; ROWS = w.rows; N = COLS * ROWS;
  tiles = w.tiles; items = w.items; enemies = w.enemies; tasks = w.tasks;
  reserved = new Array(N).fill(0);
}

/** Wrap up anything in motion so a world can be put away safely. */
function settleWorld() {
  if (!world) return;
  for (const p of particles) applyHeal(p.to);
  particles = [];
  items.forEach(it => { if (it && it.job) { if (it.job.phase !== 'back') tasks.push(it.job.target); it.job = null; } });
  world.cam = { ...cam };
}

function enterWorld(key) {
  settleWorld();
  particles = [];
  bindWorld(worlds[key] || (worlds[key] = buildWorld(key)));
  selected = -1; hintCells = null; drag = null; press = null;
  puffs = []; blooms = []; floaters = [];
  if (world.cam) { Object.assign(cam, world.cam); camTouched = true; clampCam(); }
  else { camTouched = false; homeView(); }
  flushRewards();
  afterChange();
}

function newGame() {
  booting = true;
  worlds = {}; world = null;
  wallet = { coins: 0, bricks: 0, moon: 0, chalices: CONFIG.START_CHALICES };
  stats = freshStats();
  stars = 0; levelsDone = new Set(); levelStars = {};
  questDone = {};
  discovered = new Set();
  pendingRewards = []; storage = [];
  particles = []; won = false;
  enterWorld('camp');
  booting = false;
}
