'use strict';

/* ==========================================================================
   SAVE / LOAD / BACKUP
   The game saves itself to the browser (localStorage). Backups are the same
   data as a .json file you can keep anywhere and import later, e.g. to move
   the game to another computer or browser.
   Storage calls are wrapped in try/catch so private windows still work,
   just without saving.
   ========================================================================== */
const SAVE_VERSION = 3;

function packWorld(w) {
  const live = w === world;
  return {
    // per tile: -1 alive, else healing so far (in-flight points folded in)
    tiles: w.tiles.map((t, i) => t.dead ? t.heal + (live ? reserved[i] : 0) : -1),
    mistOpen: w.mistOpen,
    // [type, charges, bubble contents, regrow timer start, bubble expiry]
    items: w.items.map(it => it ? [it.type, it.charges, it.inner || 0, it.cd || 0, it.exp || 0] : 0),
    // a plain tile index for a Gloomling; [tile, kind, hp] for Brutes and Lords
    enemies: w.enemies.map(e => e.kind ? [e.i, e.kind, e.hp || 0] : e.i),
    made: w.made, collected: w.collected, banished: w.banished, lords: w.lords || 0, complete: w.complete, perfect: !!w.perfect,
  };
}

/* ---- Upgrading older saves ---- */

/** Item ids that were renamed (e.g. the old single dwagon family became Meadow dwagons). */
const fixId = (id) => LEGACY_IDS[id] || id;
const fixCounts = (counts) => {
  const out = {};
  for (const k in counts || {}) out[fixId(k)] = (out[fixId(k)] || 0) + counts[k];
  return out;
};
// Quests used to be saved by position; this was their order then.
const LEGACY_QUEST_ORDER = ['flower1', 'essence1', 'heal5', 'hatch1', 'harvest1', 'treat1', 'adv1', 'coins25', 'mist1',
  'lock1', 'tree1', 'bonus5', 'barrow1', 'banish1', 'heal30', null, 'moon10', 'adv3', 'bricks50', 'pine1', 'heal80',
  null, 'advAll', 'world1', null, 'campAll'];

function unpackItem(s) {
  const type = s && fixId(s[0]);
  if (!type || !ITEMS[type]) return null;
  return { type, charges: s[1], inner: s[2] ? fixId(s[2]) : undefined, cd: s[3] || 0, exp: s[4] || 0, t0: -1e9, from: null };
}

function unpackWorld(key, d) {
  const w = buildWorld(key);
  // Saves from before the camp grew to 24x24 hold a 16x16 camp: it moves into the middle,
  // and the new outer ring starts fresh.
  const grow = key === 'camp' && d.tiles.length === CAMP_OLD_SIZE ** 2;
  const at = (k) => grow
    ? (Math.floor(k / CAMP_OLD_SIZE) + CAMP_OLD_OFFSET) * w.cols + (k % CAMP_OLD_SIZE) + CAMP_OLD_OFFSET
    : k;
  const inOld = (i) => {
    const r = Math.floor(i / w.cols) - CAMP_OLD_OFFSET, c = i % w.cols - CAMP_OLD_OFFSET;
    return r >= 0 && r < CAMP_OLD_SIZE && c >= 0 && c < CAMP_OLD_SIZE;
  };
  d.tiles.forEach((h, k) => { const i = at(k); if (h < 0) w.tiles[i].dead = false; else w.tiles[i].heal = h; });
  w.mistOpen = d.mistOpen || [];
  w.tiles.forEach(t => { if (w.mistOpen.includes(t.mist)) t.mist = null; });
  if (grow) d.items.forEach((s, k) => { w.items[at(k)] = unpackItem(s); });
  else w.items = d.items.map(unpackItem);
  const saved = (d.enemies || []).map(s => {
    const e = makeEnemy(at(Array.isArray(s) ? s[0] : s), Array.isArray(s) ? s[1] : null);
    if (e.kind === 'lord' && s[2] > 0) e.hp = s[2];
    return e;
  });
  w.enemies = grow ? w.enemies.filter(e => !inOld(e.i)).concat(saved) : saved;
  w.grew = grow;
  w.made = fixCounts(d.made); w.collected = { coins: 0, bricks: 0, moon: 0, ...d.collected };
  w.banished = d.banished || 0; w.lords = d.lords || 0; w.complete = !!d.complete; w.perfect = !!d.perfect;
  return w;
}

/** Saves from before the Guardian Statues: finished runs are put away (their rewards
 *  were already given), and runs still going get the Guardian's pieces hidden in them. */
function upgradeLevelRuns() {
  for (const k in worlds) {
    const w = worlds[k];
    if (!w.def.level) continue;
    if (w.complete) { delete worlds[k]; continue; }
    if (w.items.some(it => it && ITEMS[it.type].chain === 'guardian')) continue;
    const bits = w.def.items.filter(x => ITEMS[x[2]].chain === 'guardian').map(x => x[2]);
    const spots = w.items.map((it, i) => it || w.tiles[i].mist ? -1 : i).filter(i => i >= 0);
    const dead = spots.filter(i => w.tiles[i].dead), pool = dead.length >= bits.length ? dead : spots;
    bits.forEach((type, n) => {
      if (!pool.length) return;
      const i = pool.splice(Math.floor(rand(n, w.cols) * pool.length), 1)[0];
      w.items[i] = makeItem(type);
    });
  }
}

/** The whole game as a plain object. */
function snapshot() {
  const packed = {};
  for (const k in worlds) if (worlds[k] && k !== TEST_KEY) packed[k] = packWorld(worlds[k]);
  return {
    v: SAVE_VERSION, savedAt: new Date().toISOString(), current: world.key === TEST_KEY ? 'camp' : world.key, worlds: packed,
    wallet, stats, stars, levelsDone: [...levelsDone], levelStars, questDone, pendingRewards, storage,
    myLevels: customLevels,
    discovered: [...discovered], muted: Sound.muted, won,
  };
}

/** Does this look like one of our saves? */
const isSave = (d) => !!d && d.v === SAVE_VERSION && !!d.worlds && !!d.worlds.camp;

/** Replace the whole game with a snapshot. Throws if the data is broken. */
function restore(d) {
  booting = true;
  try {
    wallet = { coins: 0, bricks: 0, moon: 0, chalices: CONFIG.START_CHALICES, ...d.wallet };
    stats = { ...freshStats(), ...d.stats };
    stats.made = fixCounts(stats.made);
    if (!d.stats || !d.stats.dl) {
      // older saves didn't count dwagons by level: work it out from what was made
      for (const k in stats.made) if (ITEMS[k] && ITEMS[k].dwagon) stats.dl[ITEMS[k].dwagon] = (stats.dl[ITEMS[k].dwagon] || 0) + stats.made[k];
    }
    levelsDone = new Set(d.levelsDone || []);
    // saves from before star ratings: every Adventure finished then had all its goals done
    levelStars = d.levelStars ? { ...d.levelStars } : Object.fromEntries([...levelsDone].map(k => [k, 3]));
    stars = totalStars();
    // a backup brings its own 'My Levels' with it
    if (Array.isArray(d.myLevels) && d.myLevels.length) {
      for (const o of d.myLevels) if (o && o.key && !customLevels.some(x => x.key === o.key)) customLevels.push(o);
      saveCustomLevels();
    }
    questDone = {};
    if (Array.isArray(d.questDone)) d.questDone.forEach((done, k) => { if (done && LEGACY_QUEST_ORDER[k]) questDone[LEGACY_QUEST_ORDER[k]] = true; });
    else Object.assign(questDone, d.questDone);
    discovered = new Set((d.discovered || []).map(fixId));
    pendingRewards = (d.pendingRewards || []).map(fixId).filter(t => ITEMS[t]);
    storage = (d.storage || []).map(e => ({ ...e, type: fixId(e.type), inner: e.inner && fixId(e.inner) })).filter(e => ITEMS[e.type]);
    Sound.muted = !!d.muted;
    won = !!d.won;
    worlds = {}; world = null; particles = [];
    for (const k in d.worlds) {
      if (!WORLDS[k] || k === TEST_KEY) continue;
      // an Adventure whose map has changed size since this run was saved can't be continued:
      // drop the run and give its Chalice back
      const def = WORLDS[k];
      if (def.level && d.worlds[k].tiles.length !== def.land.length * def.land[0].length) {
        if (!def.custom) pendingRewards.push('chalice');
        continue;
      }
      worlds[k] = unpackWorld(k, d.worlds[k]);
    }
    if (!d.levelStars) upgradeLevelRuns();
    // a welcome gift for camps that just grew: the new Coin Jar the starting camp now has
    if (worlds.camp && worlds.camp.grew) pendingRewards.push('coinjar');
    enterWorld(worlds[d.current] ? d.current : 'camp');
  } finally {
    booting = false;
  }
}

function save() {
  if (booting) return;
  try { localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify(snapshot())); }
  catch (e) { /* storage unavailable */ }
}

function load() {
  try {
    const d = JSON.parse(localStorage.getItem(CONFIG.SAVE_KEY));
    if (!isSave(d)) return false;
    restore(d);
    return true;
  } catch (e) { return false; }
}

/* ---- Backups ---- */

/** Download the current game as a .json file. */
function exportSave() {
  const blob = new Blob([JSON.stringify(snapshot(), null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  const d = new Date(), pad = (n) => String(n).padStart(2, '0');
  a.download = `dwagon-merge-backup-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast('💾 Backup saved to your downloads.');
}

/** Load a backup file chosen by the player, replacing the current game. */
function importSave(file) {
  const reader = new FileReader();
  reader.onload = () => {
    let d;
    try { d = JSON.parse(reader.result); } catch (e) { d = null; }
    if (!isSave(d)) { toast('That file isn\'t a Dwagon Merge backup.'); return; }
    const when = d.savedAt ? ` from ${new Date(d.savedAt).toLocaleString()}` : '';
    if (!confirm(`Load the backup${when}? Your current game will be replaced.`)) return;
    const before = snapshot();
    try {
      restore(d);
    } catch (e) {
      restore(before);   // a damaged backup never wipes the current game
      toast('That backup is damaged, so nothing was changed.');
      return;
    }
    save();
    updateSoundBtn(); updateHud(); updateInfo();
    toast('💾 Backup loaded!');
  };
  reader.readAsText(file);
}
