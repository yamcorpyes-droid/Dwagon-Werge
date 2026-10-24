'use strict';

/* ==========================================================================
   9. ENEMIES: Gloomlings and Gloom Totems
   Gloomlings shuffle across dead land (never living land), making the tile
   they stand on harder to heal. Heal their tile to banish them.
   ========================================================================== */
function updateEnemies(t) {
  for (const e of enemies) {
    if (tiles[e.i].mist) continue;            // frozen behind mist
    if (!e.next) e.next = t + 1000 + Math.random() * 3000;
    if (t < e.next) continue;
    e.next = t + CONFIG.GLOOM_MOVE_MS[0] + Math.random() * (CONFIG.GLOOM_MOVE_MS[1] - CONFIG.GLOOM_MOVE_MS[0]);
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
    const reach = summons === 'alive' ? 16 : 4;
    if (enemies.filter(e => dist2(e.i, i) <= Math.max(9, reach)).length >= CONFIG.TOTEM_MAX) return;
    const spots = [];
    for (let k = 0; k < N; k++) if (dist2(k, i) <= reach && tiles[k].dead && !tiles[k].mist && !enemyAt(k)) spots.push(k);
    if (!spots.length) return;
    const s = spots[Math.floor(Math.random() * spots.length)];
    enemies.push({ i: s, from: i, t0: t, next: t + 2000 });
    const c = center(s);
    addFloater(c.x, c.y - 20, 'A Gloomling appears!', '#d9b8ff');
  });
}
