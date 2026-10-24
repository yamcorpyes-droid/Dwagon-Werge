'use strict';

/* ==========================================================================
   DWAGON AI
   Awake dwagons pick the nearest queued harvest job, fly there, work, spawn
   loot and fly home. Idle dwagons with energy also wander off on their own to
   harvest things close to home (never what an Adventure's 'make' goal still
   needs). In camp, only as many dwagons as your nests
   hold are awake. Each breed has an ability (see js/data/dwagons.js).
   ========================================================================== */
function nestCapacity() {
  return items.reduce((n, it, i) => n + (it && usable(i) && ITEMS[it.type].nest ? ITEMS[it.type].nest : 0), 0);
}

function computeAwake() {
  const list = [];
  items.forEach((it, i) => { if (it && ITEMS[it.type].dwagon && usable(i)) list.push(i); });
  if (!world.def.nests) return new Set(list);
  // busy dwagons first, then the strongest
  list.sort((a, b) => (items[b].job ? 1 : 0) - (items[a].job ? 1 : 0) ||
    ITEMS[items[b].type].dwagon - ITEMS[items[a].type].dwagon || a - b);
  return new Set(list.slice(0, nestCapacity()));
}

/** How many harvest trips are already heading to `idx` (queued or flying). */
function tripsTo(idx) {
  return tasks.filter(t => t === idx).length +
    items.filter(d => d && d.job && d.job.target === idx && d.job.phase !== 'back').length;
}

function queueHarvest(idx) {
  const it = items[idx];
  const any = items.some((d, i) => d && ITEMS[d.type].dwagon && usable(i));
  if (!any) { toast('This needs a dwagon! Merge 3 Dwagon Eggs to hatch one.'); return; }
  awake = computeAwake();
  if (!awake.size) { toast('Your dwagons are napping: they need a Dwagon Nest to sleep in first!'); return; }
  if (![...awake].some(i => items[i].charges > 0)) {
    toast('Your dwagons are tired! They\'ll go once rested, or feed them a 🍓 treat.');
  }
  if (tripsTo(idx) >= it.charges) { toast('Dwagons are already on it!'); return; }
  tasks.push(idx);
  Sound.pop();
}

const isRock = (def) => def.chain === 'stone' || def.id === 'geode';

/** A dwagon (at `by`) finishes harvesting `target`. */
function doHarvest(target, by) {
  const it = items[target];
  if (!it || !usable(target) || !ITEMS[it.type].harvest || it.charges <= 0) return;
  const def = ITEMS[it.type];
  const spot = nearestEmpty(target);
  if (spot < 0) { toast('No space for the loot. Make some room!'); return; }
  items[spot] = create(pickWeighted(def.harvest.loot), target);
  it.charges--;
  const d = items[by];
  if (d) {
    d.charges = Math.max(0, d.charges - 1);   // costs the dwagon 1 energy
    breedBonus(ITEMS[d.type], target, def);
  }
  stats.harvests++;
  if (it.charges <= 0) {
    items[target] = null;
    addPuff(target, def.ring);
    tasks = world.tasks = tasks.filter(t => t !== target);
    if (selected === target) selected = -1;
  }
  Sound.pop();
  afterChange();
}

/** Breed abilities that trigger after a harvest. */
function breedBonus(dw, target, harvested) {
  const c = center(target);
  const bonus = (type, text) => {
    if (spawnNear(target, type) >= 0) addFloater(c.x, c.y - 40, text, '#fff3b0');
  };
  if (dw.ability === 'miner' && isRock(harvested) && Math.random() < 0.25) bonus('brick', 'Miner: extra brick!');
  if (dw.ability === 'bloom' && Math.random() < 0.25) bonus('essence1', 'Blossoming: Life Essence!');
  if (dw.ability === 'lucky' && Math.random() < 0.1) bonus('moonshard', 'Lucky: Moon Shard!');
  if (dw.ability === 'healer') {
    // send one healing point to the nearest dead land
    let best = -1, bd = Infinity;
    for (let i = 0; i < N; i++) {
      if (needOf(i) <= 0) continue;
      const dd = dist2(target, i);
      if (dd < bd) { bd = dd; best = i; }
    }
    if (best >= 0) {
      reserved[best]++;
      particles.push({ from: target, to: best, t0: now(), dur: 550 + Math.sqrt(bd) * 55 });
    }
  }
}

/** Something harvestable close to home that nobody is working on yet, or -1. */
function nearbyHarvest(home) {
  const r2 = CONFIG.AUTO_HARVEST_RADIUS ** 2 + 1;
  let best = -1, bd = Infinity;
  for (let i = 0; i < N; i++) {
    const it = items[i];
    if (!it || !usable(i) || !ITEMS[it.type].harvest || it.charges <= 0 || bonusNeeds(ITEMS[it.type])) continue;
    const d = dist2(home, i);
    if (d > r2 || d >= bd || tripsTo(i) >= it.charges) continue;
    best = i; bd = d;
  }
  return best;
}

function updateDwagons(dt, t) {
  awake = computeAwake();
  for (const i of awake) {
    const it = items[i];
    if (drag && drag.from === i) continue;
    const def = ITEMS[it.type];
    const job = it.job;

    if (!job) {
      if (it.charges <= 0) continue;   // tired dwagons stay home
      let target = -1;
      if (tasks.length) {
        let best = 0, bd = Infinity;
        tasks.forEach((tk, k) => { const d = dist2(i, tk); if (d < bd) { bd = d; best = k; } });
        target = tasks.splice(best, 1)[0];
      } else if (CONFIG.AUTO_HARVEST && t >= (it.nextAuto || 0)) {
        // a little independence: every so often, harvest something right next to home
        it.nextAuto = t + CONFIG.AUTO_HARVEST_MS * (0.7 + Math.random() * 0.6);
        target = nearbyHarvest(i);
      }
      if (target < 0) continue;
      const c = center(i);
      it.job = { target, phase: 'out', x: c.x, y: c.y, t0: t };
      if (selected === i) updateInfo();
      continue;
    }
    if (job.phase === 'work') {
      const target = items[job.target];
      const minerBoost = def.ability === 'miner' && target && isRock(ITEMS[target.type]) ? 2 : 1;
      if (t - job.t0 >= CONFIG.HARVEST_MS / (1 + 0.35 * (def.dwagon - 1)) / minerBoost) {
        doHarvest(job.target, i);
        job.phase = 'back';
      }
      continue;
    }
    // flying out or back
    const dest = center(job.phase === 'out' ? job.target : i);
    const speed = CONFIG.DWAGON_SPEED * (1 + 0.2 * (def.dwagon - 1)) * (def.ability === 'swift' ? 1.5 : 1);
    const dx = dest.x - job.x, dy = dest.y - job.y, d = Math.hypot(dx, dy), step = speed * dt;
    if (d <= step) {
      job.x = dest.x; job.y = dest.y;
      if (job.phase === 'out') { job.phase = 'work'; job.t0 = t; }
      else { it.job = null; if (selected === i) updateInfo(); }
    } else {
      job.x += dx / d * step; job.y += dy / d * step;
    }
  }
}
