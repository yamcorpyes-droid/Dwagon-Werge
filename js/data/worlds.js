'use strict';

/* ==========================================================================
   HOME CAMP (plain data), 24 x 24.
   The original 16 x 16 camp sits in the middle (rows/cols 4-19); an outer
   ring of wild land around it opens up in the late game.
   Land letters: '.' living land   '#' dead land   'X' deep dead land
   Mist letters: '.' clear, or the mist region letter (see `regions`)
   Items: [row, col, type]. Anything on dead land is locked until healed.
   ========================================================================== */
const CAMP_LAND = [
  'XXXXXXXXXXXXXXXXXXXXXXXX',
  'XXXXX..XXXXXXXXXX..XXXXX',
  'XXXXX..XXXXXXXXXX..XXXXX',
  'XXX##################XXX',
  'XXX#XXXXX####XXXXXXX#XXX',
  'XXX#XXX#########XXXX#XXX',
  'XXX#XX############XX#XXX',
  'XXX#X######..######X#XXX',
  'XXX#X####......######XXX',
  'XXX####.........#####XXX',
  'X..####.........#####..X',
  'X..###..........#####..X',
  'XXX####.........#####XXX',
  'XXX#####.......######XXX',
  'XXX######.....#######XXX',
  'XXX#X######..########XXX',
  'XXX#XX############XX#XXX',
  'XXX#XXX##########XXX#XXX',
  'XXX#XXXX#######XXXXX#XXX',
  'XXX#XXXXXX####XXXXXX#XXX',
  'XXX##################XXX',
  'XXXXX..XXXXXXXXXX..XXXXX',
  'XXXXX..XXXXXXXXXX..XXXXX',
  'XXXXXXXXXXXXXXXXXXXXXXXX',
];

const CAMP = {
  key: 'camp', name: '🏕 Home Camp', land: CAMP_LAND, home: 11 * 24 + 11, nests: true,
  mist: [
    'NNNNNNNNNNNNNNNNNNNNNNNN',
    'NNNNNNNNNNNNNNNNNNNNNNNN',
    'NNNNNNNNNNNNNNNNNNNNNNNN',
    'NNNNNNNNNNNNNNNNNNNNNNNN',
    'WWWWAAAAAAAAAAAAAAAAEEEE',
    'WWWWAAAAAAAAAAAAAAAAEEEE',
    'WWWWAAAAAAAAAAAAAAAAEEEE',
    'WWWWDD...........BBBEEEE',
    'WWWWDD...........BBBEEEE',
    'WWWWDD...........BBBEEEE',
    'WWWWDD...........BBBEEEE',
    'WWWWDD...........BBBEEEE',
    'WWWWDD...........BBBEEEE',
    'WWWWDD...........BBBEEEE',
    'WWWWDD...........BBBEEEE',
    'WWWWDD...........BBBEEEE',
    'WWWWDD...........BBBEEEE',
    'WWWWCCCCCCCCCCCCCCCCEEEE',
    'WWWWCCCCCCCCCCCCCCCCEEEE',
    'WWWWCCCCCCCCCCCCCCCCEEEE',
    'SSSSSSSSSSSSSSSSSSSSSSSS',
    'SSSSSSSSSSSSSSSSSSSSSSSS',
    'SSSSSSSSSSSSSSSSSSSSSSSS',
    'SSSSSSSSSSSSSSSSSSSSSSSS',
  ],
  // How each mist region clears:
  //   stars / power: enough Stars (Adventures) OR enough Dwagon Power (camp dwagons + Wonders)
  //   key:           a "cloud key": drop that exact item onto the mist
  regions: {
    A: { stars: 2, power: 30 },
    D: { stars: 5, power: 120 },
    B: { stars: 9, power: 400 },
    C: { stars: 15, power: 1200 },
    N: { key: 'tree' },
    W: { key: 'boulder' },
    S: { key: 'cozynest' },
    E: { stars: 24, power: 2500 },
  },
  items: [
    // starting garden
    [9, 8, 'basket'], [12, 9, 'twignest'], [13, 8, 'coinjar'],
    [10, 8, 'sprout'], [10, 10, 'sprout'], [11, 7, 'sprout'], [11, 9, 'sprout'], [12, 11, 'sprout'],
    [12, 8, 'flower'],
    [9, 13, 'meadow_egg'], [13, 10, 'meadow_egg'],
    [9, 15, 'gloomshroom'], [11, 15, 'gloomshroom'],
    [13, 13, 'pebble'], [14, 9, 'pebble'],
    [10, 14, 'copper'], [12, 14, 'copper'], [14, 12, 'geode'], [10, 11, 'berry'],
    // hidden in the dead land
    [16, 8, 'chestkey'],
    [7, 7, 'woodchest'], [8, 15, 'meadow_egg'], [7, 13, 'grasstuft'], [16, 11, 'stone'], [15, 8, 'shroomclump'],
    [8, 8, 'ironchest'], [15, 14, 'meadow_egg'], [12, 16, 'boulder'], [14, 15, 'silver'], [13, 6, 'flower'],
    [16, 13, 'tree'], [15, 6, 'gloomshroom'], [7, 16, 'pebble'], [16, 16, 'ironchest'],
    // behind the inner mist
    [4, 11, 'goldchest'], [5, 9, 'bloom_egg'], [6, 14, 'fairyring'],
    [9, 4, 'flower'], [13, 4, 'woodchest'],
    [11, 18, 'boulder'], [14, 17, 'monolith'], [8, 18, 'cozynest'],
    [18, 12, 'gloomtotem'], [19, 11, 'pine'], [17, 7, 'goldchest'],
    [4, 4, 'hoardchest'], [19, 19, 'prism'], [4, 19, 'goldchest'], [19, 4, 'star_egg'],
    // the outer ring: living groves with old, nearly-Wonder treasures
    [1, 5, 'fairyring'], [2, 6, 'pine'],
    [1, 17, 'meadow'], [2, 18, 'moonorb'],
    [21, 5, 'monolith'], [22, 6, 'boulder'],
    [21, 17, 'grandnest'], [22, 18, 'moonorb'],
    [10, 1, 'fairyring'], [11, 2, 'tree'],
    [10, 21, 'coincoffer'], [11, 22, 'goldchest'],
    // ...and in the ring's dead land
    [0, 0, 'hoardchest'], [0, 23, 'prism'], [23, 0, 'star_egg'], [23, 23, 'hoardchest'],
    [3, 11, 'goldchest'], [20, 12, 'ember_egg'], [12, 3, 'geode'], [12, 20, 'stone_egg'],
    [1, 11, 'gloomtotem'], [22, 11, 'gloomtotem'],
  ],
  gloom: [[17, 9], [6, 16], [14, 18], [18, 14], [2, 9], [1, 14], [21, 10], [11, 0], [16, 22]],
};

// Where the old 16 x 16 camp sits inside this one (used to move older saves in)
const CAMP_OLD_SIZE = 16, CAMP_OLD_OFFSET = 4;
