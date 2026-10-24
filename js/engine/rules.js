'use strict';

/* ==========================================================================
   6. RULES
   ========================================================================== */
const matches = (it, type) => it.type === type || it.type === WILD;

/** Same-type items (and prisms) orthogonally connected to `target`, closest first.
 *  `exclude` = cell the dragged item came from. Busy dwagons and unusable tiles never join. */
function collectGroup(target, type, exclude) {
  const ok = (i) => i !== exclude && usable(i) && items[i] && !items[i].job && matches(items[i], type);
  const cells = ok(target) ? [target] : [];
  const seen = new Set([target]);
  const queue = [target];
  while (queue.length) {
    const i = queue.shift();
    for (const n of neighbors(i)) {
      if (seen.has(n)) continue;
      seen.add(n);
      if (ok(n)) { cells.push(n); queue.push(n); }
    }
  }
  return cells;
}

/** Which chain a merge at `at` would use. A prism borrows the type of its best neighbour group. */
function mergeTypeFor(it, at, exclude) {
  if (it.type !== WILD) return isMergeable(it.type) ? it.type : null;
  const cand = [at, ...neighbors(at)].filter(i => i !== exclude && usable(i) && items[i] && !items[i].job &&
    items[i].type !== WILD && isMergeable(items[i].type));
  let best = null, size = 0;
  for (const i of cand) {
    const s = collectGroup(at, items[i].type, exclude).length;
    if (s > size) { size = s; best = items[i].type; }
  }
  return best;
}

/** 5 -> 2 (bonus), 3 -> 1. Bigger groups split into 5s first, then a 3. */
function mergeMath(n) {
  let consume = 0, produce = 0;
  while (n - consume >= 5) { consume += 5; produce += 2; }
  if (n - consume >= 3) { consume += 3; produce += 1; }
  return { consume, produce };
}

/** `cells` = board cells (BFS from target); `extra` = 1 when the dragged item is still in the hand. */
function doMerge(target, type, cells, extra) {
  const { consume, produce } = mergeMath(cells.length + extra);
  if (!produce) return false;
  const used = cells.slice(0, consume - extra);
  for (const i of used) { addPuff(i, ITEMS[type].ring); items[i] = null; }
  const next = ITEMS[type].next;
  for (let k = 0; k < produce; k++) items[used[k]] = create(next, target);

  stats.merges++;
  if (produce >= 2) {
    stats.bonus5++;
    // a free Bonus Bubble holding one more of the result
    if (Math.random() < CONFIG.BUBBLE_CHANCE) {
      const s = nearestEmpty(target);
      if (s >= 0) { items[s] = makeItem('bubble', target); items[s].inner = next; items[s].exp = Date.now() + CONFIG.BUBBLE_MS; }
    }
    if (Math.random() < CONFIG.MOON_MERGE_CHANCE) spawnNear(target, 'moonshard');
  }
  const c = center(target);
  const def = ITEMS[next];
  let text = produce >= 2 ? `Bonus! ${produce}× ${def.name}` : `+1 ${def.name}`;
  if (ITEMS[type].draw === 'egg') text = `A ${def.name} hatched!`;
  if (def.hatch) text = `A ${def.name}! Tap it to hatch`;
  if (def.wonder) {
    text = `✨ A Wonder: ${def.name}! ✨`;
    blooms.push({ i: target, t0: now() }, { i: target, t0: now() + 250 });
    if (!inCamp()) toast('A Wonder! (Wonders only add Dwagon Power when built in your Home Camp.)');
  }
  addFloater(c.x, c.y - 24, text, produce >= 2 || def.wonder ? '#ffd23a' : '#ffffff');
  Sound.merge(def.tier, produce >= 2 || !!def.wonder);
  selected = target;
  return true;
}

function resolveAt(idx) {
  const it = items[idx];
  if (!it || it.job) return;
  const type = mergeTypeFor(it, idx, -1);
  if (!type) return;
  const cells = collectGroup(idx, type, -1);
  if (cells.length >= 3) doMerge(idx, type, cells, 0);
}

const canDrag = (i) => i >= 0 && items[i] && usable(i) && !items[i].job;

/** The chain a drop of `it` onto occupied `target` would merge as (or null). */
function dropMergeType(it, target, to, from) {
  const type = it.type !== WILD ? it.type : target.type !== WILD ? target.type : mergeTypeFor(it, to, from);
  return type && isMergeable(type) && matches(target, type) ? type : null;
}

/** Drop the item from `from` onto tile `to`. */
function drop(from, to) {
  const it = items[from];
  if (!it || to < 0) return;
  if (tiles[to].mist) {
    // a cloud key: dropping the exact item it asks for clears the mist
    const need = world.def.regions[tiles[to].mist];
    if (need.key && it.type === need.key) {
      items[from] = null;
      addPuff(to, '#ffffff');
      clearMist(tiles[to].mist);
      return;
    }
    toast(need.key ? `This mist needs a ${ITEMS[need.key].name}. Drop one on it!` : 'That land is hidden in mist.');
    Sound.thud();
    return;
  }
  if (tiles[to].dead) { toast('That land is still dead. Heal it with Life Essence first.'); Sound.thud(); return; }
  if (to === from) { resolveAt(from); afterChange(); return; }

  const target = items[to];
  if (target && target.job) { toast('That dwagon is busy working.'); return; }

  if (!target) {
    items[from] = null; items[to] = it; selected = to;
    resolveAt(to);
  } else if (ITEMS[it.type].feed && ITEMS[target.type].dwagon) {
    // drop a treat on a dwagon to feed it
    if (feed([to], ITEMS[it.type].feed)) { items[from] = null; selected = to; }
  } else {
    const type = dropMergeType(it, target, to, from);
    if (type) {
      const cells = collectGroup(to, type, from);
      if (cells.length + 1 >= 3) { items[from] = null; doMerge(to, type, cells, 1); }
      else toast('You need 3 matching items touching each other to merge.');
    } else {
      // different item: swap places
      items[from] = target; target.from = to; target.t0 = now();
      items[to] = it; selected = to;
      resolveAt(to);
    }
  }
  afterChange();
}

/** Nearest empty usable tile to idx, or -1. */
function nearestEmpty(idx) {
  let best = -1, bestD = Infinity;
  for (let i = 0; i < N; i++) {
    if (!usable(i) || items[i]) continue;
    const d = dist2(idx, i);
    if (d < bestD) { bestD = d; best = i; }
  }
  return best;
}
const freeTiles = () => items.reduce((n, it, i) => n + (!it && usable(i) ? 1 : 0), 0);

function spawnNear(idx, type) {
  const s = nearestEmpty(idx);
  if (s < 0) return -1;
  items[s] = create(type, idx);
  return s;
}

function pickWeighted(loot) {
  const total = loot.reduce((a, [, w]) => a + w, 0);
  let r = Math.random() * total;
  for (const [type, w] of loot) { if ((r -= w) < 0) return type; }
  return loot[loot.length - 1][0];
}

/** Where rewards and purchases appear: next to the Seed Basket. */
function anchorTile() {
  const b = items.findIndex((it, i) => it && ITEMS[it.type].chain === 'basket' && usable(i));
  return b >= 0 ? b : world.def.home;
}

/** Double-click / "use" action. */
function useItem(idx) {
  const it = items[idx], def = ITEMS[it.type];
  if (def.make) {
    if (it.charges <= 0) {
      const wait = timerText(idx);
      toast(`This ${def.name} is regrowing${wait ? ` (${wait.toLowerCase()})` : ''}. Wait, merge it, or refill it for ${refillCost(def)} 🌙.`);
      return;
    }
    const gives = Array.isArray(def.make.gives) ? pickWeighted(def.make.gives) : def.make.gives;
    if (spawnNear(idx, gives) < 0) { toast('No free land! Merge, collect or heal to make room.'); return; }
    it.charges--;
    if (!it.cd) it.cd = Date.now();
    Sound.pop();
  } else if (def.feed) {
    useTreat(idx);
  } else if (def.hatch) {
    hatchCradle(idx);
  } else if (def.taps) {
    tapGoalStar(idx);
  } else if (def.harvest) {
    queueHarvest(idx);
  } else if (def.heal) {
    activateEssence(idx);
  } else if (def.collect) {
    collect(idx);
  } else if (def.open) {
    openChest(idx);
  } else if (def.id === 'bubble') {
    popBubble(idx);
  } else {
    toast(describe(def, it));
  }
  afterChange();
}

/** Room left for coins before you need more Coin Jars. */
const coinRoom = () => Math.max(0, coinCap() - wallet.coins);
function coinsFullToast() {
  toast(`Your coin storage is full (${coinCap()})! Merge or buy 🏺 Coin Jars to hold more.`);
  Sound.thud();
}

function collect(idx) {
  const def = ITEMS[items[idx].type];
  if (def.collect === 'coins' && def.value > coinRoom()) { selected = idx; updateInfo(); coinsFullToast(); return; }
  wallet[def.collect] += def.value;
  stats[def.collect] += def.value;
  world.collected[def.collect] = (world.collected[def.collect] || 0) + def.value;
  items[idx] = null;
  const c = center(idx);
  const look = { coins: ['coins', '#ffd23a', '#f5c542'], bricks: ['bricks', '#ffb58a', '#c4643f'], moon: ['🌙', '#c9d0ff', '#7d86d9'], chalices: ['🏆', '#ffe08a', '#d4a52a'] }[def.collect];
  addFloater(c.x, c.y - 16, `+${def.value} ${look[0]}`, look[1]);
  addPuff(idx, look[2]);
  Sound.coin();
  if (selected === idx) selected = -1;
  afterChange();
}

/** Open a chest. Locked chests use up a Chest Key from the board, or `pick` spends Moonstones. */
function openChest(idx, pick = false) {
  const def = ITEMS[items[idx].type];
  const n = def.open.n;
  if (freeTiles() + 1 < n) { toast(`This chest needs ${n} free tiles of land to open.`); return; }
  if (def.locked) {
    const key = items.findIndex((k, i) => k && k.type === 'chestkey' && usable(i));
    if (pick) {
      if (!spendMoon(CONFIG.LOCKPICK_COST)) return;
    } else if (key < 0) {
      selected = idx; updateInfo();
      toast(`Locked! Find a 🔑 Chest Key, or pick the lock for ${CONFIG.LOCKPICK_COST} 🌙.`);
      Sound.thud();
      return;
    } else {
      items[key] = null;
      addPuff(key, '#f5c542');
    }
    stats.keys++;
  }
  items[idx] = null;
  addPuff(idx, def.band);
  for (let k = 0; k < n; k++) spawnNear(idx, pickWeighted(def.open.loot));
  const c = center(idx);
  addFloater(c.x, c.y - 24, `${def.name} opened!`, '#ffe9a0');
  Sound.quest();
  if (selected === idx) selected = -1;
  afterChange();
}

/** Tap a Goal Star: one reward per tap until it's used up. */
function tapGoalStar(idx) {
  const it = items[idx], def = ITEMS[it.type];
  if (spawnNear(idx, pickWeighted(def.loot)) < 0) { toast('No free land for the prize. Make some room!'); return; }
  it.charges--;
  addPuff(idx, '#ffd23a');
  Sound.coin();
  if (it.charges <= 0) {
    items[idx] = null;
    const c = center(idx);
    addFloater(c.x, c.y - 20, 'All used up!', '#ffe9a0');
    if (selected === idx) selected = -1;
  }
  afterChange();
}

/** Tap a Cradle: the level-5 dwagon inside hatches right where it sits. */
function hatchCradle(idx) {
  const def = ITEMS[items[idx].type];
  addPuff(idx, def.spots);
  items[idx] = create(def.hatch, null);
  const c = center(idx);
  addFloater(c.x, c.y - 24, `A ${ITEMS[def.hatch].name} hatched!`, '#ffe9a0');
  Sound.quest();
  selected = idx;
  afterChange();
}

function popBubble(idx) {
  if (CONFIG.TIMERS_ON && !spendMoon(CONFIG.BUBBLE_COST)) return;
  const inner = items[idx].inner;
  addPuff(idx, '#bfe9ff');
  items[idx] = create(inner, null);
  const c = center(idx);
  addFloater(c.x, c.y - 20, `Free ${ITEMS[inner].name}!`, '#bfe9ff');
  Sound.pop();
  afterChange();
}

/* ---- Selling & storage ---- */
function sellValue(def) {
  if (def.collect || def.wonder || def.taps || def.chain === 'basket' || def.id === 'bubble' || def.id === 'gloomtotem' || def.chain === 'guardian') return 0;
  if (def.id === WILD) return 40;
  if (def.id === 'chestkey') return 10;
  if (def.breed) return def.dwagon ? Math.max(3, Math.round(dwagonPower(def) / 2)) : def.hatch ? 40 : 3;
  if (!def.tier) return 0;
  return Math.round(2 * 3 ** (def.tier - 1));
}
function sell(idx) {
  const it = items[idx], def = ITEMS[it.type], v = sellValue(def);
  if (!v || it.job) return;
  if (v > coinRoom()) { coinsFullToast(); return; }
  if ((def.tier >= 3 || def.id === WILD) && !confirm(`Sell your ${def.name} for ${v} coins?`)) return;
  items[idx] = null;
  wallet.coins += v;
  const c = center(idx);
  addFloater(c.x, c.y - 16, `+${v} coins`, '#ffd23a');
  addPuff(idx, '#f5c542');
  Sound.coin();
  selected = -1;
  afterChange();
}

function storeItem(idx) {
  const it = items[idx];
  if (!inCamp() || !it || it.job) return;
  if (storage.length >= storageSize()) { toast('Storage is full. More Dwagon Power gives more room.'); return; }
  storage.push({ type: it.type, charges: it.charges, inner: it.inner, cd: it.cd, exp: it.exp });
  items[idx] = null;
  addPuff(idx, '#c9a86a');
  Sound.pop();
  selected = -1;
  toast(`${ITEMS[it.type].name} put in 📦 Storage.`);
  afterChange();
}
function takeFromStorage(k) {
  const a = anchorTile(), s = nearestEmpty(a);
  if (s < 0) { toast('No free land to put it on.'); return; }
  const entry = storage.splice(k, 1)[0];
  items[s] = { type: entry.type, charges: entry.charges, inner: entry.inner, cd: entry.cd, exp: entry.exp, t0: now(), from: a };
  Sound.pop();
  afterChange();
}

/* ---- Quests, Adventures, winning ---- */
function checkQuests() {
  QUESTS.forEach((q, k) => {
    if (questDone[q.id] || questStat(q, stats) < q.goal) return;
    questDone[q.id] = true;
    pendingRewards.push(...q.reward, 'goalstar');
    toast(`🎉 Quest complete: ${q.text}${inCamp() ? '' : ' (reward sent to camp)'}`);
    Sound.quest();
  });
  flushRewards();
}

/** Rewards always arrive in the Home Camp. */
function flushRewards() {
  if (!inCamp()) return;
  while (pendingRewards.length) {
    if (spawnNear(anchorTile(), pendingRewards[0]) < 0) break;
    pendingRewards.shift();
  }
}

/* ---- Adventures: the Guardian, Stars and Chalices ---- */

/** "Make an Elder Pine", "Make 2× Shroom Clump" */
function makeText(g) {
  const name = ITEMS[g.item].name;
  return `Make ${g.n > 1 ? `${g.n}×` : /^[aeiou]/i.test(name) ? 'an' : 'a'} ${name}`;
}
function goalProgress(g) {
  switch (g.type) {
    case 'heal':    return { text: 'Heal all the dead land', v: world.totalDead - deadCount(), n: world.totalDead };
    case 'make':    return { text: makeText(g), v: world.made[g.item] || 0, n: g.n };
    case 'banish':  return { text: `Banish ${g.n} Gloomlings`, v: world.banished, n: g.n };
    case 'collect': return { text: `Collect ${g.n} ${g.what === 'moon' ? '🌙 Moonstones' : g.what}`, v: world.collected[g.what] || 0, n: g.n };
  }
}
function goalText(g) {
  return g.type === 'heal' ? 'Heal all the land' : g.type === 'make' ? makeText(g) :
    g.type === 'banish' ? `Banish ${g.n} Gloomlings` : `Collect ${g.n} ${g.what === 'moon' ? '🌙' : g.what}`;
}

/** Is this item a building block for an unfinished 'make' goal here? (Idle dwagons leave those alone.) */
const bonusNeeds = (def) => !!world.def.level && world.def.bonus.some(g => g.type === 'make' &&
  ITEMS[g.item].chain === def.chain && ITEMS[g.item].tier > def.tier && (world.made[g.item] || 0) < g.n);

const guardianBuilt = () => (world.made.guardian || 0) > 0;
const bonusDone = () => world.def.bonus.every(g => { const p = goalProgress(g); return p.v >= p.n; });
/** Guardian bits still lying under dead land. */
const guardianHidden = () => items.filter((it, i) => it && ITEMS[it.type].chain === 'guardian' && !usable(i)).length;

/** Stars this run has earned: none until the Guardian is built, then one each for
 *  the Guardian, the bonus goals, and healing every tile. */
function runStars() {
  if (!world.def.level || !guardianBuilt()) return 0;
  return 1 + (bonusDone() ? 1 : 0) + (deadCount() === 0 ? 1 : 0);
}
const starText = (n) => '⭐'.repeat(n) + '☆'.repeat(3 - n);

/** What it costs to start a fresh run of this level. */
const levelCost = (def) => def.custom || def.key === TEST_KEY ? 0 : CONFIG.CHALICE_COST;

/** Start (or restart) a level from scratch. Uses a 🏆 Chalice; returns false if there isn't one. */
function startLevel(key) {
  const def = WORLDS[key], cost = levelCost(def);
  if (wallet.chalices < cost) {
    toast('You need a 🏆 Chalice to start an Adventure. Earn them from quests, Goal Stars, Wonders and finishing Adventures, or buy one in the Market.');
    Sound.thud();
    return false;
  }
  wallet.chalices -= cost;
  if (world && world.key === key) { particles = []; world = null; }   // drop the old run without settling it
  delete worlds[key];
  enterWorld(key);
  if (cost) toast(`🏆 ${cost} Chalice used. Find the Guardian's pieces under the dead land!`);
  return true;
}

function showLevelOverlay(title, message, canFinish) {
  $('levelTitle').textContent = title;
  $('levelMessage').textContent = message;
  $('finishLevelBtn').hidden = !canFinish;
  $('levelStayBtn').textContent = canFinish ? 'Keep playing' : 'Lovely!';
  showOverlay('levelOverlay');
}

function checkLevel() {
  const def = world.def;
  if (!def.level) return;
  const s = runStars();
  if (!s) return;
  const key = def.key;
  const later = (fn) => setTimeout(() => { if (world.key === key) fn(); }, 700);
  if (!world.complete) {
    world.complete = true;
    stats.guardians++;
    Sound.quest();
    const more = s < 3 ? ' Finish now to collect your reward, or keep playing for more Stars.' : '';
    later(() => showLevelOverlay('🗿 The Guardian awakens!', `You rebuilt the Guardian of ${def.name}: ${starText(s)}.${more}`, true));
  } else if (s === 3 && !world.perfect) {
    world.perfect = true;
    Sound.quest();
    later(() => showLevelOverlay('⭐⭐⭐ All three Stars!', `${def.name} is fully restored. Finish to collect your best reward.`, true));
  }
}

/** End the run: rewards go home, the level resets for next time, and we return to camp. */
function finishLevel() {
  const def = world.def, s = runStars();
  if (!s) return;
  const key = def.key, reward = [];
  let text;
  if (key === TEST_KEY) {
    text = 'Test finished! (Test runs give no rewards.)';
  } else if (def.custom) {
    reward.push('woodchest');
    text = `You finished ${def.name} ${starText(s)}.`;
  } else {
    const first = !levelsDone.has(key), best = levelStars[key] || 0;
    if (first) { levelsDone.add(key); stats.levels = levelsDone.size; reward.push(...def.reward, 'moonstone', 'chalice'); }
    else reward.push('moonshard');
    reward.push(['woodchest', 'ironchest', 'goldchest'][s - 1]);
    if (s === 3) reward.push('chestkey');
    if (s === 3 && best < 3) reward.push('chalice', 'moonstone');   // first time with all three Stars
    levelStars[key] = Math.max(best, s);
    stars = totalStars();
    const gained = Math.max(0, s - best);
    text = `${def.name} finished ${starText(s)}${gained ? ` (+${gained} ⭐ Star${gained > 1 ? 's' : ''})` : ''}.`;
  }
  // any Moon Stars still lying here fly home too
  items.forEach((it, i) => { if (it && ITEMS[it.type].chain === 'moonstar' && usable(i)) reward.push(it.type); });
  pendingRewards.push(...reward);
  const names = [...new Set(reward)].map(t => {
    const n = reward.filter(r => r === t).length;
    return (n > 1 ? `${n}× ` : '') + ITEMS[t].name;
  }).join(', ');
  particles = []; world = null;   // the run is over: the level starts fresh next time
  delete worlds[key];
  enterWorld('camp');
  Sound.quest();
  showLevelOverlay(`${starText(s)} Adventure complete!`, text + (names ? ` Your reward is here in camp: ${names}.` : ''), false);
  if (key === TEST_KEY) $('levelOverlay').dataset.then = 'editor';
}

function checkWin() {
  if (!inCamp() || deadCount() > 0) return;
  stats.campClear = 1;
  if (!won) {
    won = true;
    $('winMessage').textContent = CONFIG.WIN_MESSAGE;
    setTimeout(() => showOverlay('winOverlay'), 900);
  }
}

/** Call after anything that changes the board. */
function afterChange() {
  if (booting) return;
  checkWin();
  checkLevel();
  checkQuests();
  updateHud();
  updateInfo();
  save();
}
