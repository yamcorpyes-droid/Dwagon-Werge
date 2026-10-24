'use strict';

/* ==========================================================================
   ADVENTURES (plain data)

   LEVEL_WORLDS: the themed worlds on the World Map, in order.
     grass   colours of healed land here: [light, dark, grass blades]

   LEVEL_DATA: every Adventure, in play order. Each one unlocks when the one
   before it is finished. Two ways to describe a level:

   1) Generated: an oval of living land in dead land.
     cols, rows      map size
     cx, cy          centre of the living area
     live            radius of living land; deep = radius where deep dead land starts
     stretch         [sx, sy] squash the oval (optional)
     islands         extra patches of living land: [[cx, cy, radius], ...] (optional)
     seed            changes where hidden items land
     start           items placed on living land, centre outward
     hidden          items scattered through dead land (gloomtotem goes far away)
     guardian        Guardian Statue bits hidden in dead land, away from the start
     gloom           how many Gloomlings start on the map

   2) Drawn in the level editor (hidden screen; see HOSTING.md):
     land            rows of '.' living, '#' dead, 'X' deep dead
     items           [[row, col, type], ...]
     gloom           [[row, col], ...]
     home            [row, col] where the camera starts

   Both kinds also have:
     world           which LEVEL_WORLDS entry it belongs to (1-based)
     bonus           goals for the 2nd ⭐: make {item, n} | banish {n} | collect {what, n}
     reward          items sent to camp the first time it's finished

   Stars: ⭐ build the Guardian Statue (this wins the level)
          ⭐ finish every bonus goal
          ⭐ heal all the land
   ========================================================================== */
const LEVEL_WORLDS = [
  { name: 'The First Wilds', emoji: '🌱', color: '#8fd16a', grass: null },
  { name: 'Mushroom Woods',  emoji: '🍄', color: '#c98a7a', grass: ['#7fbf68', '#76b65f', '#5c9a48'] },
  { name: 'Tidepool Coast',  emoji: '🌊', color: '#6fc3d9', grass: ['#9fd8a0', '#95d096', '#6fb88a'] },
  { name: 'Stonepeak Heights', emoji: '⛰', color: '#a49c8f', grass: ['#a8c97a', '#9ec070', '#7f9d55'] },
  { name: 'The Gloomlands',  emoji: '🌑', color: '#8a6fb0', grass: ['#86c49a', '#7dbb91', '#5e9a74'] },
];

// Guardian Statue bits. 3 Pieces make the Guardian; 3 Shards make a Piece.
const G_PIECES = ['g_piece', 'g_piece', 'g_piece'];
const G_MIXED  = ['g_piece', 'g_piece', 'g_shard', 'g_shard', 'g_shard'];
const G_SHARDY = ['g_piece', 'g_shard', 'g_shard', 'g_shard', 'g_shard', 'g_shard', 'g_shard'];
const G_SHARDS = ['g_shard', 'g_shard', 'g_shard', 'g_shard', 'g_shard', 'g_shard', 'g_shard', 'g_shard', 'g_shard'];

const LEVEL_DATA = [
  /* ---- World 1: The First Wilds ---- */
  { key: 'l1', world: 1, name: 'Sprout Meadow', cols: 8, rows: 8, cx: 3.5, cy: 3.5, live: 2.2, deep: 99, seed: 1,
    start: ['basket', 'sprout', 'sprout', 'flower', 'sprout', 'sprout'],
    hidden: ['woodchest', 'sprout', 'sprout', 'essence1', 'grasstuft'], guardian: G_PIECES,
    bonus: [{ type: 'make', item: 'tree', n: 1 }], reward: ['woodchest', 'meadow_egg'] },
  { key: 'l2', world: 1, name: 'Mushroom Hollow', cols: 10, rows: 10, cx: 4.5, cy: 4.5, live: 2.6, deep: 4.4, seed: 2,
    start: ['basket', 'meadow_egg', 'meadow_egg', 'meadow_egg', 'gloomshroom', 'gloomshroom', 'flower', 'sprout', 'sprout'],
    hidden: ['gloomshroom', 'gloomshroom', 'fairyring', 'woodchest', 'flower', 'copper', 'berry', 'bloom_egg'], guardian: G_PIECES,
    bonus: [{ type: 'make', item: 'shroomclump', n: 1 }], reward: ['ironchest', 'bloom_egg', 'bloom_egg'] },
  { key: 'l3', world: 1, name: 'Egg Cliffs', cols: 10, rows: 10, cx: 3, cy: 4.5, live: 2.6, deep: 5.5, seed: 3,
    start: ['basket', 'tide_egg', 'tide_egg', 'tide_egg', 'tide_egg', 'tide_egg', 'tide_egg', 'flower', 'sprout', 'sprout', 'pebble'],
    hidden: ['tide_egg', 'tide_egg', 'tide_egg', 'stone', 'woodchest', 'flower', 'gloomshroom'], guardian: G_MIXED,
    bonus: [{ type: 'make', item: 'tide_2', n: 1 }], reward: ['tide_egg', 'tide_egg', 'tide_egg', 'goldchest', 'chestkey'] },
  { key: 'l4', world: 1, name: 'Gloom Marsh', cols: 11, rows: 11, cx: 5, cy: 5, live: 2.6, deep: 4.3, seed: 4, gloom: 4,
    start: ['basket', 'ember_1', 'flower', 'flower', 'sprout', 'sprout', 'sprout', 'gloomshroom'],
    hidden: ['gloomtotem', 'ironchest', 'ember_egg', 'essence1', 'shroomclump', 'geode', 'berry'], guardian: G_PIECES,
    bonus: [{ type: 'banish', n: 4 }], reward: ['goldchest', 'chestkey', 'prism', 'ember_egg', 'ember_egg'] },
  { key: 'l5', world: 1, name: 'Stone Steps', cols: 12, rows: 9, cx: 2.5, cy: 4, live: 2.6, deep: 7.5, seed: 5,
    start: ['basket', 'stone_1', 'pebble', 'pebble', 'stone', 'stone', 'flower', 'sprout', 'sprout', 'sprout'],
    hidden: ['boulder', 'stone', 'stone', 'pebble', 'pebble', 'monolith', 'woodchest', 'stone_egg', 'stone_egg', 'stone_egg', 'geode', 'chestkey'],
    guardian: G_MIXED,
    bonus: [{ type: 'collect', what: 'bricks', n: 30 }], reward: ['goldchest', 'chestkey', 'cozynest', 'stone_egg', 'stone_egg', 'stone_egg'] },
  { key: 'l6', world: 1, name: 'Heart of the Wilds', cols: 12, rows: 12, cx: 5.5, cy: 5.5, live: 2.6, deep: 4.9, seed: 6, gloom: 3,
    start: ['basket', 'bloom_2', 'tree', 'flower', 'flower', 'sprout', 'sprout', 'sprout', 'star_egg', 'star_egg'],
    hidden: ['gloomtotem', 'gloomtotem', 'goldchest', 'pine', 'star_egg', 'fairyring', 'boulder', 'essence2', 'geode', 'pie', 'chestkey'],
    guardian: G_SHARDY,
    bonus: [{ type: 'make', item: 'pine', n: 1 }, { type: 'banish', n: 3 }], reward: ['hoardchest', 'chestkey', 'prism', 'prism', 'star_egg', 'star_egg', 'star_egg'] },

  /* ---- World 2: Mushroom Woods ---- */
  { key: 'l7', world: 2, name: 'Toadstool Glade', cols: 10, rows: 10, cx: 4.5, cy: 4.5, live: 2.7, deep: 4.8, seed: 7,
    start: ['basket', 'meadow_1', 'flower', 'sprout', 'sprout', 'gloomshroom', 'gloomshroom', 'gloomshroom', 'berry'],
    hidden: ['gloomshroom', 'gloomshroom', 'gloomshroom', 'copper', 'woodchest', 'grasstuft', 'berry'], guardian: G_PIECES,
    bonus: [{ type: 'make', item: 'shroomclump', n: 2 }], reward: ['ironchest', 'bloom_egg', 'chalice'] },
  { key: 'l8', world: 2, name: 'Fairy Circle', cols: 11, rows: 10, cx: 5, cy: 4.5, live: 2.4, deep: 4.6, seed: 8,
    stretch: [1.3, 1], islands: [[1.5, 1.5, 1.1], [8.5, 7.5, 1.1]],
    start: ['basket', 'bloom_egg', 'bloom_egg', 'bloom_egg', 'flower', 'sprout', 'sprout', 'shroomclump', 'shroomclump'],
    hidden: ['shroomclump', 'gloomshroom', 'gloomshroom', 'gloomshroom', 'bloom_egg', 'woodchest', 'essence1', 'silver'], guardian: G_MIXED,
    bonus: [{ type: 'make', item: 'fairyring', n: 1 }], reward: ['goldchest', 'chestkey', 'bloom_egg', 'bloom_egg'] },
  { key: 'l9', world: 2, name: 'Spore Hollow', cols: 11, rows: 11, cx: 5, cy: 5, live: 2.5, deep: 4.2, seed: 9, gloom: 3,
    start: ['basket', 'meadow_2', 'flower', 'flower', 'sprout', 'sprout', 'gloomshroom', 'gloomshroom', 'berry'],
    hidden: ['gloomtotem', 'gloomshroom', 'shroomclump', 'ironchest', 'essence1', 'essence1', 'berry', 'meadow_egg'], guardian: G_PIECES,
    bonus: [{ type: 'banish', n: 3 }, { type: 'collect', what: 'coins', n: 15 }], reward: ['ironchest', 'meadow_egg', 'meadow_egg', 'meadow_egg'] },
  { key: 'l10', world: 2, name: 'Mossy Bridge', cols: 14, rows: 8, cx: 2.5, cy: 3.5, live: 2.3, deep: 6, seed: 10,
    islands: [[11, 3.5, 1.6]],
    start: ['basket', 'bloom_1', 'flower', 'sprout', 'sprout', 'sprout', 'grasstuft'],
    hidden: ['grasstuft', 'grasstuft', 'grasspatch', 'gloomshroom', 'gloomshroom', 'woodchest', 'bloom_egg', 'flower', 'berry'], guardian: G_MIXED,
    bonus: [{ type: 'make', item: 'grasspatch', n: 1 }, { type: 'make', item: 'tree', n: 1 }], reward: ['goldchest', 'chestkey', 'basket', 'chalice'] },
  { key: 'l11', world: 2, name: 'Glowcap Grotto', cols: 12, rows: 11, cx: 5.5, cy: 5, live: 2.6, deep: 4.4, seed: 11, gloom: 2,
    start: ['basket', 'bloom_2', 'tree', 'flower', 'sprout', 'sprout', 'shroomclump', 'shroomclump', 'gloomshroom'],
    hidden: ['gloomtotem', 'shroomclump', 'fairyring', 'geode', 'goldchest', 'chestkey', 'essence2', 'pie', 'gloomshroom', 'gloomshroom'],
    guardian: G_SHARDY,
    bonus: [{ type: 'make', item: 'fairyring', n: 1 }, { type: 'banish', n: 2 }], reward: ['goldchest', 'chestkey', 'prism', 'bloom_egg'] },
  { key: 'l12', world: 2, name: 'The Toadstool Throne', cols: 13, rows: 13, cx: 6, cy: 6, live: 2.8, deep: 5, seed: 12, gloom: 3,
    start: ['basket', 'bloom_3', 'meadow_2', 'tree', 'flower', 'flower', 'sprout', 'sprout', 'fairyring', 'shroomclump', 'shroomclump'],
    hidden: ['gloomtotem', 'gloomtotem', 'fairyring', 'shroomclump', 'hoardchest', 'chestkey', 'essence2', 'pine', 'pie', 'bloom_egg', 'gloomshroom'],
    guardian: G_SHARDS,
    bonus: [{ type: 'make', item: 'pine', n: 1 }, { type: 'make', item: 'fairyring', n: 1 }, { type: 'banish', n: 4 }],
    reward: ['hoardchest', 'chestkey', 'bloom_egg', 'bloom_egg', 'bloom_egg', 'goldchalice'] },

  /* ---- World 3: Tidepool Coast ---- */
  { key: 'l13', world: 3, name: 'Seashell Shore', cols: 12, rows: 9, cx: 3, cy: 4, live: 2.6, deep: 6.8, seed: 13,
    stretch: [1.2, 1],
    start: ['basket', 'tide_1', 'tide_egg', 'tide_egg', 'tide_egg', 'flower', 'sprout', 'sprout', 'pebble', 'pebble'],
    hidden: ['tide_egg', 'tide_egg', 'tide_egg', 'tide_egg', 'pebble', 'stone', 'woodchest', 'essence1', 'moonshard'], guardian: G_PIECES,
    bonus: [{ type: 'make', item: 'tide_1', n: 2 }], reward: ['ironchest', 'tide_egg', 'tide_egg', 'chalice'] },
  { key: 'l14', world: 3, name: 'Rockpool Steps', cols: 12, rows: 10, cx: 2.5, cy: 5, live: 2.5, deep: 7, seed: 14,
    start: ['basket', 'tide_2', 'stone_1', 'flower', 'flower', 'sprout', 'sprout', 'stone', 'pebble', 'pebble'],
    hidden: ['stone', 'stone', 'boulder', 'pebble', 'geode', 'tide_egg', 'ironchest', 'essence1', 'berry'], guardian: G_MIXED,
    bonus: [{ type: 'collect', what: 'bricks', n: 20 }, { type: 'make', item: 'tree', n: 1 }], reward: ['goldchest', 'chestkey', 'tide_egg', 'tide_egg'] },
  { key: 'l15', world: 3, name: 'Moonlit Lagoon', cols: 12, rows: 12, cx: 5.5, cy: 5.5, live: 2.4, deep: 5.2, seed: 15,
    islands: [[2, 2, 1], [9.5, 9.5, 1]],
    start: ['basket', 'tide_2', 'star_egg', 'flower', 'flower', 'sprout', 'sprout', 'moonshard'],
    hidden: ['geode', 'geode', 'moonshard', 'moonshard', 'star_egg', 'star_egg', 'goldchest', 'chestkey', 'essence2', 'tide_egg'],
    guardian: G_SHARDY,
    bonus: [{ type: 'collect', what: 'moon', n: 6 }], reward: ['goldchest', 'chestkey', 'moonstone', 'star_egg'] },
  { key: 'l16', world: 3, name: 'Driftwood Cove', cols: 13, rows: 10, cx: 6, cy: 4.5, live: 2.6, deep: 5.5, seed: 16, gloom: 3,
    stretch: [1.4, 1],
    start: ['basket', 'tide_2', 'ember_1', 'tree', 'flower', 'sprout', 'sprout', 'grasstuft', 'berry'],
    hidden: ['gloomtotem', 'grasspatch', 'grasstuft', 'grasstuft', 'grasstuft', 'grasstuft', 'ironchest', 'essence1', 'essence1', 'ember_egg', 'berry', 'stone'],
    guardian: G_PIECES,
    bonus: [{ type: 'banish', n: 4 }, { type: 'make', item: 'meadow', n: 1 }], reward: ['goldchest', 'chestkey', 'ember_egg', 'ember_egg', 'chalice'] },
  { key: 'l17', world: 3, name: 'Whale Rock', cols: 13, rows: 13, cx: 6, cy: 6, live: 2.6, deep: 4.6, seed: 17,
    start: ['basket', 'tide_3', 'stone_1', 'tree', 'flower', 'sprout', 'sprout', 'boulder', 'stone', 'stone'],
    hidden: ['boulder', 'boulder', 'monolith', 'stone', 'stone', 'geode', 'goldchest', 'chestkey', 'essence2', 'tide_egg', 'tide_egg', 'pie'],
    guardian: G_MIXED,
    bonus: [{ type: 'make', item: 'monolith', n: 1 }, { type: 'collect', what: 'bricks', n: 40 }],
    reward: ['goldchest', 'chestkey', 'cozynest', 'tide_egg', 'tide_egg', 'tide_egg'] },
  { key: 'l18', world: 3, name: 'Lighthouse Point', cols: 14, rows: 12, cx: 3, cy: 6, live: 2.7, deep: 6.5, seed: 18, gloom: 3,
    islands: [[11, 2.5, 1.3], [11, 9.5, 1.3]],
    start: ['basket', 'tide_3', 'star_1', 'tree', 'tree', 'flower', 'sprout', 'sprout', 'berry', 'berry'],
    hidden: ['gloomtotem', 'gloomtotem', 'geode', 'geode', 'hoardchest', 'chestkey', 'essence2', 'essence2', 'star_egg', 'tide_egg', 'moonshard', 'pie'],
    guardian: G_SHARDS,
    bonus: [{ type: 'make', item: 'pine', n: 1 }, { type: 'banish', n: 4 }, { type: 'collect', what: 'moon', n: 5 }],
    reward: ['hoardchest', 'chestkey', 'star_egg', 'star_egg', 'moonstone', 'goldchalice'] },

  /* ---- World 4: Stonepeak Heights ---- */
  { key: 'l19', world: 4, name: 'Pebble Path', cols: 12, rows: 10, cx: 2.5, cy: 5, live: 2.5, deep: 6.5, seed: 19,
    start: ['basket', 'stone_2', 'flower', 'flower', 'sprout', 'sprout', 'pebble', 'pebble', 'pebble', 'stone'],
    hidden: ['pebble', 'pebble', 'pebble', 'stone', 'stone', 'boulder', 'woodchest', 'stone_egg', 'berry'], guardian: G_PIECES,
    bonus: [{ type: 'make', item: 'boulder', n: 1 }, { type: 'collect', what: 'bricks', n: 25 }], reward: ['ironchest', 'stone_egg', 'stone_egg', 'chalice'] },
  { key: 'l20', world: 4, name: 'Quarry Ledge', cols: 13, rows: 11, cx: 6, cy: 5, live: 2.6, deep: 5, seed: 20,
    stretch: [1.3, 1],
    start: ['basket', 'stone_2', 'stone_1', 'tree', 'flower', 'sprout', 'sprout', 'boulder', 'stone', 'stone'],
    hidden: ['boulder', 'stone', 'stone', 'stone', 'monolith', 'geode', 'goldchest', 'chestkey', 'essence1', 'essence1', 'stone_egg'],
    guardian: G_MIXED,
    bonus: [{ type: 'collect', what: 'bricks', n: 50 }], reward: ['goldchest', 'chestkey', 'stone_egg', 'stone_egg', 'twignest'] },
  { key: 'l21', world: 4, name: 'Echo Canyon', cols: 15, rows: 9, cx: 2.5, cy: 4, live: 2.4, deep: 7, seed: 21, gloom: 3,
    islands: [[12.5, 4, 1.4]],
    start: ['basket', 'stone_2', 'ember_2', 'tree', 'flower', 'sprout', 'sprout', 'stone', 'stone', 'berry'],
    hidden: ['gloomtotem', 'boulder', 'stone', 'stone', 'pebble', 'pebble', 'geode', 'ironchest', 'essence1', 'ember_egg', 'pie'],
    guardian: G_SHARDY,
    bonus: [{ type: 'banish', n: 4 }, { type: 'make', item: 'boulder', n: 1 }], reward: ['goldchest', 'chestkey', 'ember_egg', 'ember_egg'] },
  { key: 'l22', world: 4, name: 'Crystal Mine', cols: 13, rows: 13, cx: 6, cy: 6, live: 2.5, deep: 4.4, seed: 22,
    start: ['basket', 'stone_3', 'star_1', 'tree', 'flower', 'sprout', 'sprout', 'geode', 'stone', 'stone'],
    hidden: ['geode', 'geode', 'geode', 'boulder', 'monolith', 'stone', 'goldchest', 'chestkey', 'essence2', 'star_egg', 'star_egg', 'moonshard'],
    guardian: G_MIXED,
    bonus: [{ type: 'collect', what: 'moon', n: 8 }, { type: 'collect', what: 'bricks', n: 30 }], reward: ['goldchest', 'chestkey', 'moonstone', 'star_egg', 'star_egg'] },
  { key: 'l23', world: 4, name: 'Eagle Crag', cols: 14, rows: 12, cx: 3, cy: 9, live: 2.5, deep: 6.5, seed: 23, gloom: 2,
    stretch: [1.1, 1],
    start: ['basket', 'stone_3', 'meadow_3', 'tree', 'flower', 'flower', 'sprout', 'sprout', 'boulder', 'berry'],
    hidden: ['gloomtotem', 'monolith', 'boulder', 'boulder', 'stone', 'stone', 'geode', 'goldchest', 'chestkey', 'essence2', 'pine', 'meadow_egg', 'pie'],
    guardian: G_SHARDS,
    bonus: [{ type: 'make', item: 'monolith', n: 1 }, { type: 'make', item: 'pine', n: 1 }], reward: ['hoardchest', 'chestkey', 'cozynest', 'chalice'] },
  { key: 'l24', world: 4, name: 'The Summit', cols: 14, rows: 14, cx: 6.5, cy: 6.5, live: 2.8, deep: 5.2, seed: 24, gloom: 3,
    start: ['basket', 'stone_4', 'bloom_2', 'tree', 'tree', 'flower', 'sprout', 'sprout', 'monolith', 'boulder', 'pie'],
    hidden: ['gloomtotem', 'gloomtotem', 'monolith', 'monolith', 'boulder', 'boulder', 'geode', 'geode', 'hoardchest', 'chestkey', 'essence2', 'essence2', 'stone_egg', 'pine'],
    guardian: G_SHARDS,
    bonus: [{ type: 'make', item: 'monolith', n: 1 }, { type: 'banish', n: 4 }, { type: 'collect', what: 'bricks', n: 60 }],
    reward: ['hoardchest', 'chestkey', 'stone_egg', 'stone_egg', 'stone_egg', 'goldchalice'] },

  /* ---- World 5: The Gloomlands ---- */
  { key: 'l25', world: 5, name: 'Twilight Fen', cols: 12, rows: 12, cx: 5.5, cy: 5.5, live: 2.7, deep: 4.6, seed: 25, gloom: 4,
    start: ['basket', 'ember_2', 'meadow_2', 'tree', 'flower', 'flower', 'sprout', 'sprout', 'berry', 'berry'],
    hidden: ['gloomtotem', 'gloomtotem', 'ironchest', 'essence1', 'essence1', 'essence2', 'ember_egg', 'gloomshroom', 'gloomshroom', 'pie'],
    guardian: G_PIECES,
    bonus: [{ type: 'banish', n: 6 }], reward: ['goldchest', 'chestkey', 'ember_egg', 'ember_egg', 'chalice'] },
  { key: 'l26', world: 5, name: 'Hollow Woods', cols: 13, rows: 12, cx: 6, cy: 5.5, live: 2.6, deep: 4.4, seed: 26, gloom: 3,
    islands: [[1.5, 10, 1.1], [11, 1.5, 1.1]],
    start: ['basket', 'bloom_3', 'ember_2', 'tree', 'flower', 'sprout', 'sprout', 'shroomclump', 'shroomclump', 'berry'],
    hidden: ['gloomtotem', 'gloomtotem', 'fairyring', 'shroomclump', 'goldchest', 'chestkey', 'essence2', 'bloom_egg', 'pie', 'pine'],
    guardian: G_MIXED,
    bonus: [{ type: 'make', item: 'fairyring', n: 1 }, { type: 'banish', n: 4 }], reward: ['goldchest', 'chestkey', 'bloom_egg', 'bloom_egg'] },
  { key: 'l27', world: 5, name: 'Ashen Ridge', cols: 14, rows: 11, cx: 2.5, cy: 5, live: 2.6, deep: 7, seed: 27, gloom: 4,
    start: ['basket', 'ember_3', 'stone_2', 'tree', 'flower', 'flower', 'sprout', 'sprout', 'stone', 'stone', 'pie'],
    hidden: ['gloomtotem', 'gloomtotem', 'boulder', 'boulder', 'stone', 'geode', 'goldchest', 'chestkey', 'essence2', 'essence2', 'ember_egg', 'ember_egg'],
    guardian: G_SHARDY,
    bonus: [{ type: 'banish', n: 5 }, { type: 'collect', what: 'bricks', n: 30 }], reward: ['hoardchest', 'chestkey', 'ember_egg', 'ember_egg', 'chalice'] },
  { key: 'l28', world: 5, name: 'Starless Lake', cols: 14, rows: 14, cx: 6.5, cy: 6.5, live: 2.4, deep: 4.6, seed: 28, gloom: 3,
    islands: [[2.5, 2.5, 1.2], [10.5, 10.5, 1.2]],
    start: ['basket', 'star_2', 'tide_3', 'tree', 'flower', 'flower', 'sprout', 'sprout', 'geode', 'berry'],
    hidden: ['gloomtotem', 'gloomtotem', 'geode', 'geode', 'moonshard', 'moonshard', 'star_egg', 'star_egg', 'hoardchest', 'chestkey', 'essence2', 'pie'],
    guardian: G_SHARDS,
    bonus: [{ type: 'collect', what: 'moon', n: 10 }, { type: 'banish', n: 4 }], reward: ['hoardchest', 'chestkey', 'star_egg', 'star_egg', 'moonstone'] },
  { key: 'l29', world: 5, name: 'Gloomspire', cols: 15, rows: 13, cx: 7, cy: 6, live: 2.8, deep: 4.8, seed: 29, gloom: 5,
    stretch: [1.2, 1],
    start: ['basket', 'ember_3', 'stone_3', 'bloom_2', 'tree', 'tree', 'flower', 'sprout', 'sprout', 'pie', 'berry'],
    hidden: ['gloomtotem', 'gloomtotem', 'gloomtotem', 'monolith', 'boulder', 'fairyring', 'hoardchest', 'chestkey', 'essence2', 'essence2', 'pine', 'geode', 'ember_egg'],
    guardian: G_SHARDS,
    bonus: [{ type: 'banish', n: 8 }, { type: 'make', item: 'pine', n: 1 }], reward: ['hoardchest', 'chestkey', 'prism', 'prism', 'goldchalice'] },
  { key: 'l30', world: 5, name: 'Heart of the Gloom', cols: 16, rows: 16, cx: 7.5, cy: 7.5, live: 3, deep: 5.4, seed: 30, gloom: 5,
    start: ['cart', 'star_3', 'ember_3', 'stone_3', 'pine', 'tree', 'tree', 'flower', 'flower', 'sprout', 'sprout', 'pie', 'pie'],
    hidden: ['gloomtotem', 'gloomtotem', 'gloomtotem', 'gloomtotem', 'monolith', 'monolith', 'fairyring', 'meadow', 'geode', 'geode',
      'hoardchest', 'hoardchest', 'chestkey', 'chestkey', 'essence3', 'essence2', 'essence2', 'star_egg', 'star_egg', 'pine'],
    guardian: G_SHARDS,
    bonus: [{ type: 'make', item: 'worldtree', n: 1 }, { type: 'banish', n: 8 }],
    reward: ['hoardchest', 'chestkey', 'star_egg', 'star_egg', 'star_egg', 'moonorb', 'grandchalice'] },
];
