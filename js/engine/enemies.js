'use strict';

/* ==========================================================================
   9. ENEMIES: Gloomlings, Gloom Brutes, Gloom Lords and Gloom Totems
   Gloomlings shuffle across dead land (never living land), making the tile
   they stand on harder to heal. Heal their tile to banish them.
   Gloom Brutes are big Gloomlings: slower, and their tile needs even more healing.
   Gloom Lords stand still and can't be healed away: tap one to send your
   dwagons to drive it off, a hit per trip. While one stands, it calls
   Gloomlings to its side, and the land under it can't come back to life.
   An enemy is { i, from, t0, next, kind?: 'brute' | 'lord', hp? }.
   ========================================================================== */
const lordAt = (i) => enemies.find(e => e.i === i && e.kind === 'lord');
const ENEMY_NAMES = { brute: 'Gloom Brute', lord: 'Gloom Lord' };
const enemyName = (e) => ENEMY_NAMES[e.kind] || 'Gloomling';

/** A new enemy on tile i. */
function makeEnemy(i, kind) {
  const e = { i, from: i, t0: 0, next: 0 };
  if (kind === 'brute' || kind === 'lord') e.kind = kind;
  if (kind === 'lord') e.hp = CONFIG.LORD_HP;
  return e;
}

/** Call a Gloomling (or Brute) onto dead land within `reach` of tile i, unless enough are there already. */
function summonNear(i, reach, t, kind) {
  if (enemies.filter(e => e.kind !== 'lord' && dist2(e.i, i) <= Math.max(9, reach)).length >= CONFIG.TOTEM_MAX) return;
  const spots = [];
  for (let k = 0; k < N; k++) if (dist2(k, i) <= reach && tiles[k].dead && !tiles[k].mist && !enemyAt(k)) spots.push(k);
  if (!spots.length) return;
  const s = spots[Math.floor(Math.random() * spots.length)];
  const e = makeEnemy(s, kind);
  Object.assign(e, { from: i, t0: t, next: t + 2000 });
  enemies.push(e);
  const c = center(s);
  addFloater(c.x, c.y - 20, `A ${enemyName(e)} appears!`, '#d9b8ff');
}

function updateEnemies(t) {
  for (const e of enemies) {
    if (tiles[e.i].mist) continue;            // frozen behind mist
    if (e.kind === 'lord') {
      // Lords never move, but call Gloomlings to their side
      if (!e.next) e.next = t + CONFIG.LORD_MS;
      if (t >= e.next) { e.next = t + CONFIG.LORD_MS; summonNear(e.i, 4, t); }
      continue;
    }
    if (!e.next) e.next = t + 1000 + Math.random() * 3000;
    if (t < e.next) continue;
    const slow = e.kind === 'brute' ? CONFIG.BRUTE_SLOW : 1;
    e.next = t + (CONFIG.GLOOM_MOVE_MS[0] + Math.random() * (CONFIG.GLOOM_MOVE_MS[1] - CONFIG.GLOOM_MOVE_MS[0])) * slow;
    const opts = neighbors(e.i).filter(n => tiles[n].dead && !tiles[n].mist && !enemyAt(n));
    if (!opts.length) continue;
    const old = e.i;
    e.from = old; e.i = opts[Math.floor(Math.random() * opts.length)]; e.t0 = t;
    // the tile it left may now have enough healing to come alive
    if (tiles[old].dead && tiles[old].heal >= tileNeed(old)) revive(old);
  }
  // summoners (totems, the Sunstone Circle) call more Gloomlings now and then
  items.forEach((it, i) => {
    const summons = it && ITEMS[it.type].summons;
    // totems summon while their own tile is dead; the Sunstone Circle Wonder while it's alive
    if (!summons || tiles[i].mist || (summons === 'dead') !== tiles[i].dead) return;
    const next = world.totemNext[i] || (world.totemNext[i] = t + CONFIG.TOTEM_MS);
    if (t < next) return;
    world.totemNext[i] = t + CONFIG.TOTEM_MS;
    // in the later worlds, totems sometimes call a Brute instead
    const brute = summons === 'dead' && world.def.bruteChance > 0 && Math.random() < world.def.bruteChance;
    summonNear(i, summons === 'alive' ? 16 : 4, t, brute ? 'brute' : null);
  });
}

/* ---- Gloom Lords: dwagons drive them off ---- */

/** Tap a Gloom Lord: queue a dwagon trip to hit it. */
function queueAttack(idx) {
  const e = lordAt(idx);
  if (!e) return;
  const any = items.some((d, i) => d && ITEMS[d.type].dwagon && usable(i));
  if (!any) { toast(`A Gloom Lord (❤ ${e.hp} left)! Healing can't shift it: you need a dwagon to drive it off.`); return; }
  awake = computeAwake();
  if (!awake.size) { toast('Your dwagons are napping: they need a Dwagon Nest to sleep in first!'); return; }
  if (tripsTo(idx) >= e.hp) { toast(`Your dwagons are on their way! (❤ ${e.hp} left)`); return; }
  if (![...awake].some(i => items[i].charges > 0)) toast('Your dwagons are tired! They\'ll go once rested, or feed them a 🍓 treat.');
  else toast(`⚔ A dwagon flies at the Gloom Lord! (❤ ${e.hp} left; tap again to send more)`);
  tasks.push(idx);
  Sound.pop();
}

/** How hard a dwagon hits a Gloom Lord: bigger dwagons hit harder, brave breeds twice as hard. */
const lordDamage = (def) => (1 + Math.floor((def.dwagon - 1) / 3)) * (abilityOf(def).brave || 1);

/** A dwagon (at `by`) reaches the Gloom Lord at `target` and hits it. */
function strikeLord(target, by) {
  const e = lordAt(target), d = items[by];
  if (!e || !d) return;
  const dmg = lordDamage(ITEMS[d.type]);
  d.charges = Math.max(0, d.charges - 1);   // costs the dwagon 1 energy
  e.hp = Math.max(0, e.hp - dmg);
  const c = center(target);
  addFloater(c.x, c.y - 34, e.hp ? `Pow! −${dmg} (❤ ${e.hp} left)` : 'Pow!', '#ffd6a0');
  Sound.thud();
  if (!e.hp) driveOff(e);
  afterChange();
}

function driveOff(e) {
  enemies = world.enemies = enemies.filter(x => x !== e);
  tasks = world.tasks = tasks.filter(t => t !== e.i);
  stats.lords++;
  world.lords = (world.lords || 0) + 1;
  const c = center(e.i);
  addFloater(c.x, c.y - 20, '👑 Gloom Lord driven off!', '#ffe08a');
  for (const type of CONFIG.LORD_LOOT) spawnNear(e.i, type);
  blooms.push({ i: e.i, t0: now() });
  Sound.quest();
  // healing that was already here may be enough now
  if (tiles[e.i].dead && tiles[e.i].heal >= tileNeed(e.i)) revive(e.i);
}
