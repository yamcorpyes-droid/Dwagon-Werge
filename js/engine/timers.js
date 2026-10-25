'use strict';

/* ==========================================================================
   7b. LIMITS, TIMERS & MOONSTONES
   Seed baskets and plants regrow charges over real time (even while the game
   is closed); dwagons spend energy and rest in nests to get it back; bubbles
   float away. Every wait can be skipped with EARNED Moonstones 🌙.
   Timestamps use Date.now() so they survive closing the tab.
   ========================================================================== */
function dwagonStamina(def) { return 3 + 2 * def.dwagon + (abilityOf(def).energy || 0); }
function maxCharges(def) { return def.make ? def.make.charges : def.dwagon ? dwagonStamina(def) : 0; }

/** Resting is faster in a bigger nest: Twig 1×, Cozy 2×, Grand 4×. */
function nestBoost() {
  if (!world.def.nests) return 1;
  let best = 1;
  items.forEach((it, i) => { if (it && usable(i) && ITEMS[it.type].nest) best = Math.max(best, [1, 2, 4][ITEMS[it.type].tier - 1]); });
  return best;
}
function regenMs(def) {
  if (!CONFIG.TIMERS_ON) return 1;
  return def.make ? def.make.regrow : CONFIG.DWAGON_REST_MS / nestBoost();
}
function refillCost(def) { return def.chain === 'basket' || def.dwagon ? 1 : Math.max(1, def.tier - 1); }
function fmtTime(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function spendMoon(n) {
  if (wallet.moon < n) {
    toast(`You need ${n} 🌙 (you have ${wallet.moon}). Earn Moonstones from quests, Adventures and Moonstone Geodes.`);
    Sound.thud();
    return false;
  }
  wallet.moon -= n;
  return true;
}

/** Refill an item's charges (or wake a dwagon) right now with Moonstones. */
function refillNow(idx) {
  const it = items[idx], def = ITEMS[it.type];
  if (!spendMoon(refillCost(def))) return;
  it.charges = maxCharges(def);
  it.cd = 0;
  const c = center(idx);
  addFloater(c.x, c.y - 20, def.dwagon ? 'Wide awake!' : 'Refilled!', '#c9d0ff');
  Sound.quest();
  afterChange();
}

/** Countdown text for an item, or '' when nothing is ticking. */
function timerText(idx) {
  const it = items[idx];
  if (!it || !CONFIG.TIMERS_ON) return '';
  const def = ITEMS[it.type];
  if (def.id === 'bubble') return it.exp ? `Floats away in ${fmtTime(it.exp - Date.now())}` : '';
  const max = maxCharges(def);
  if (!max || it.charges >= max || it.job) return '';
  if (def.dwagon && world.def.nests && !awake.has(idx)) return 'Can\'t rest without room in a nest';
  if (!it.cd) return '';
  const what = def.dwagon ? '⚡ energy' : def.make.gives === 'sprout' ? 'sprout' : 'charge';
  return `Next ${what} in ${fmtTime(it.cd + regenMs(def) - Date.now())}`;
}

let timerSaveAt = 0;
/** Advance every timer in the current world. Runs each frame. */
function tickTimers() {
  const t = Date.now();
  let changed = false;
  items.forEach((it, i) => {
    if (!it || !usable(i)) return;
    const def = ITEMS[it.type];
    if (def.id === 'bubble') {
      if (CONFIG.TIMERS_ON && it.exp && t >= it.exp) {
        // nothing is ever lost: an escaped bubble leaves a coin behind
        items[i] = makeItem('copper', null);
        const c = center(i);
        addFloater(c.x, c.y - 20, 'The bubble floated away…', '#bfe9ff');
        addPuff(i, '#bfe9ff');
        if (selected === i) selected = -1;
        changed = true;
      }
      return;
    }
    const max = maxCharges(def);
    if (!max || it.charges >= max) { it.cd = 0; return; }
    // dwagons only recover while home and resting in a nest
    if (def.dwagon && (it.job || (world.def.nests && !awake.has(i)))) { it.cd = 0; return; }
    if (!it.cd) { it.cd = t; return; }
    const per = regenMs(def), n = Math.floor((t - it.cd) / per);
    if (n > 0) {
      it.charges = Math.min(max, it.charges + n);
      it.cd = it.charges >= max ? 0 : it.cd + n * per;
      changed = true;
    }
  });
  if (changed) afterChange();
  else if (t > timerSaveAt) { timerSaveAt = t + 5000; save(); }   // keep timer start times saved
}

/* ---- Falling Moon Stars (Adventures only) ---- */
function updateMoonStars(t) {
  if (!world.def.level || world.complete) return;
  if (!world.starNext) { world.starNext = t + CONFIG.MOONSTAR_MS; return; }
  if (t < world.starNext) return;
  world.starNext = t + CONFIG.MOONSTAR_MS * (0.7 + Math.random() * 0.6);
  if (Math.random() > CONFIG.MOONSTAR_CHANCE) return;
  const empty = [];
  for (let i = 0; i < N; i++) if (usable(i) && !items[i]) empty.push(i);
  if (!empty.length) return;
  const s = empty[Math.floor(Math.random() * empty.length)];
  items[s] = create('moonstar', null);
  blooms.push({ i: s, t0: now() });
  const c = center(s);
  addFloater(c.x, c.y - 24, '🌠 A Moon Star fell!', '#c9d0ff');
  Sound.bloom();
  afterChange();
}

/* ---- Dwagon treats ---- */
const dwagonCells = () => items.map((it, i) => it && ITEMS[it.type].dwagon && usable(i) ? i : -1).filter(i => i >= 0);

/** Give energy to the dwagons at `cells`. Returns true if anyone was hungry. */
function feed(cells, amount) {
  let fed = 0;
  for (const i of cells) {
    const it = items[i], max = maxCharges(ITEMS[it.type]);
    if (it.charges >= max) continue;
    it.charges = Math.min(max, it.charges + amount);
    if (it.charges >= max) it.cd = 0;
    const c = center(i);
    addFloater(c.x, c.y - 24, 'Yum! +⚡', '#ffb3b3');
    fed++;
  }
  if (!fed) { toast('Your dwagons are already full of energy!'); return false; }
  stats.treats++;
  Sound.merge(1, false);
  afterChange();
  return true;
}

/** Click a treat: a berry feeds the hungriest dwagon, a pie feeds them all. */
function useTreat(idx) {
  const def = ITEMS[items[idx].type];
  let cells = dwagonCells();
  if (!cells.length) { toast('There are no dwagons here to feed yet.'); return; }
  if (def.feed < 99) {
    const missing = (i) => maxCharges(ITEMS[items[i].type]) - items[i].charges;
    cells = cells.sort((a, b) => missing(b) - missing(a) || dist2(idx, a) - dist2(idx, b)).slice(0, 1);
  }
  if (!feed(cells, def.feed)) return;
  items[idx] = null;
  addPuff(idx, def.ring);
  if (selected === idx) selected = -1;
  afterChange();
}
