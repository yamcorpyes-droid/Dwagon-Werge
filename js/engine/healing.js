'use strict';

/* ==========================================================================
   7. HEALING & MIST
   ========================================================================== */
const enemyAt = (i) => enemies.some(e => e.i === i);
const enemyOn = (i) => enemies.find(e => e.i === i);
/** Extra healing a tile needs while this enemy stands on it (a Gloom Lord's tile can't be healed at all). */
const gloomExtra = (e) => !e || e.kind === 'lord' ? 0 : e.kind === 'brute' ? CONFIG.BRUTE_EXTRA : CONFIG.GLOOM_EXTRA;
const tileNeed = (i) => tiles[i].cost + gloomExtra(enemyOn(i));
const needOf = (i) => tiles[i].dead && !tiles[i].mist && !lordAt(i) ? tileNeed(i) - tiles[i].heal - reserved[i] : 0;

function activateEssence(idx) {
  const power = ITEMS[items[idx].type].heal;
  const targets = [];
  // one point at a time, always to the nearest tile still needing it, so points spill outward
  for (let p = 0; p < power; p++) {
    let best = -1, bestD = Infinity;
    for (let i = 0; i < N; i++) {
      if (needOf(i) <= 0) continue;
      const d = dist2(idx, i);
      if (d < bestD) { bestD = d; best = i; }
    }
    if (best < 0) break;
    reserved[best]++;
    targets.push(best);
  }
  if (!targets.length) { toast('No dead land within reach! 🌿'); return; }

  items[idx] = null;
  addPuff(idx, ITEMS.essence1.hue);
  Sound.heal();
  const t = now(), gap = Math.min(90, 1200 / power);
  targets.forEach((to, k) => particles.push({ from: idx, to, t0: t + k * gap, dur: 550 + Math.sqrt(dist2(idx, to)) * 55 }));
  if (selected === idx) selected = -1;
  afterChange();
}

function applyHeal(i) {
  reserved[i] = Math.max(0, reserved[i] - 1);
  if (!tiles[i].dead) return;
  tiles[i].heal++;
  if (tiles[i].heal >= tileNeed(i) && !lordAt(i)) revive(i);
}

let lastBloomSound = 0;
/** A dead tile comes back to life. */
function revive(i) {
  tiles[i].dead = false;
  stats.healed++;
  blooms.push({ i, t0: now() });
  if (now() - lastBloomSound > 90) { Sound.bloom(); lastBloomSound = now(); }
  const c = center(i);

  const banished = enemies.filter(e => e.i === i).length;
  if (banished) {
    enemies = world.enemies = enemies.filter(e => e.i !== i);
    stats.banished += banished; world.banished += banished;
    addFloater(c.x, c.y - 30, 'Gloomling banished!', '#e7c8ff');
  }
  const it = items[i];
  if (it && it.type === 'gloomtotem') {
    items[i] = create('ironchest', null);
    addFloater(c.x, c.y - 16, 'Gloom Totem shattered!', '#e7c8ff');
  } else if (it) {
    addFloater(c.x, c.y - 16, `Found: ${ITEMS[it.type].name}!`, '#fff6a8');
    it.t0 = now(); it.from = null;
    discover(it.type);
  } else if (banished) {
    items[i] = create('copper', null);
  } else if (tiles[i].cost >= 3 && Math.random() < CONFIG.MOON_DEEP_CHANCE) {
    items[i] = create('moonshard', null);
  } else if (Math.random() < CONFIG.GRASS_CHANCE) {
    items[i] = create('grasstuft', null);
  }
  afterChange();
}

const deadCount = () => tiles.reduce((n, t) => n + (t.dead ? 1 : 0), 0);

/** A mist region clears with enough Stars OR enough Dwagon Power.
 *  Cloud-key regions only clear when their item is dropped on them (see drop()). */
const canClearMist = (region) => {
  const need = world.def.regions[region];
  if (need.key) return false;
  return stars >= need.stars || campPower() >= need.power;
};

function tryClearMist(region) {
  const need = world.def.regions[region];
  if (need.key) {
    toast(`A cloud key! Drag a ${ITEMS[need.key].name} onto this mist to clear it.`);
    return;
  }
  if (!canClearMist(region)) {
    toast(`This mist clears with ⭐ ${need.stars} Stars (you have ${stars}) or 🐲 ${need.power} Dwagon Power (you have ${campPower()}).`);
    Sound.thud();
    return;
  }
  clearMist(region);
}

function clearMist(region) {
  tiles.forEach((t, i) => {
    if (t.mist !== region) return;
    t.mist = null;
    if (!t.dead && items[i]) discover(items[i].type);
  });
  world.mistOpen.push(region);
  stats.mist++;
  toast('The mist lifts! New land to explore.');
  Sound.quest();
  afterChange();
}
