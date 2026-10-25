'use strict';

/* ==========================================================================
   DWAGON BREEDS (plain data)
   Every breed gets the same life cycle, built by js/engine/catalog.js:

     Egg ×3 → Lv1 → Lv2 → Lv3 → Lv4 ×3 → Cradle (tap to hatch) → Lv5 → Lv6 → Lv7 → Lv8

   Item ids are `<key>_egg`, `<key>_1` … `<key>_8` and `<key>_cradle`.
   Like the original, merging level-4 dwagons gives a Cradle instead of a bigger
   dwagon, so Dwagon Power dips until you tap the Cradle to hatch it.

   ability: a key of ABILITIES below, which says what makes the breed special.
   ========================================================================== */

/* What each ability does. Every field is optional:
     name     shown when it triggers ("Miner: Brick!")
     energy   extra ⚡ energy
     speed    flies this many times as fast
     fast     harvests these chains (or item ids) twice as fast
     find     [item, chance]: sometimes leaves this after a harvest...
     findOn   ...but only after harvesting these chains / item ids
     heal     every harvest also sends this many healing points to the nearest dead land
     brave    hits Gloom Lords this many times as hard */
const ABILITIES = {
  hardy:     { name: 'Hardy', energy: 2 },
  miner:     { name: 'Miner', fast: ['stone', 'geode'], find: ['brick', 0.25], findOn: ['stone', 'geode'] },
  healer:    { name: 'Healer', heal: 1 },
  swift:     { name: 'Swift', speed: 1.5 },
  bloom:     { name: 'Blossoming', find: ['essence1', 0.25] },
  lucky:     { name: 'Lucky', find: ['moonshard', 0.1] },
  frost:     { name: 'Icebreaker', fast: ['snow'], find: ['silver', 0.25], findOn: ['snow'] },
  smelter:   { name: 'Smelter', fast: ['lava', 'stone'], find: ['brickstack', 0.15], findOn: ['lava', 'stone'] },
  gem:       { name: 'Gemcutter', fast: ['crystal', 'geode'], find: ['moonshard', 0.2], findOn: ['crystal', 'geode'] },
  comber:    { name: 'Beachcomber', fast: ['shell', 'pond'], find: ['silver', 0.25], findOn: ['shell', 'pond'] },
  orchard:   { name: 'Orchard-keeper', fast: ['grass', 'bed', 'wheat', 'cactus'], find: ['berry', 0.25] },
  hunter:    { name: 'Gloom-hunter', fast: ['spooky'], brave: 2 },
  thunder:   { name: 'Thunderclap', speed: 1.25, brave: 2 },
  sunbeam:   { name: 'Sunbeam', heal: 2 },
  lunar:     { name: 'Moonlit', fast: ['stardust', 'cloud'], find: ['moonshard', 0.15] },
  seeker:    { name: 'Treasure-seeker', fast: ['ruins'], find: ['chestkey', 0.06] },
  sweet:     { name: 'Sweet-tooth', find: ['candy', 0.3] },
  tireless:  { name: 'Tireless', energy: 4 },
  prismatic: { name: 'Prismatic', find: ['prism', 0.04] },
  windrider: { name: 'Windrider', speed: 2 },
};

const BREEDS = [
  { key: 'meadow', name: 'Meadow', color: '#d5f5d0', ring: '#5bbf6a', shell: '#f3ead8', spots: '#7cc35a', badge: '🌿',
    ability: 'hardy',  abilityText: 'Hardy: 2 extra ⚡ energy.' },
  { key: 'stone',  name: 'Stone',  color: '#e6e3df', ring: '#8d877f', shell: '#d9d4cd', spots: '#6d6861', badge: '⛰',
    ability: 'miner',  abilityText: 'Miner: harvests stones and geodes twice as fast, and sometimes finds an extra brick.' },
  { key: 'tide',   name: 'Tide',   color: '#d4ecfb', ring: '#3a8fd0', shell: '#e4f3ff', spots: '#3a8fd0', badge: '💧',
    ability: 'healer', abilityText: 'Healer: every harvest also heals 1 point of the nearest dead land.' },
  { key: 'ember',  name: 'Ember',  color: '#ffe0cc', ring: '#e0602a', shell: '#ffe9d6', spots: '#e0602a', badge: '🔥',
    ability: 'swift',  abilityText: 'Swift: flies 50% faster.' },
  { key: 'bloom',  name: 'Bloom',  color: '#ffe0ee', ring: '#e070a8', shell: '#fff0f6', spots: '#e070a8', badge: '🌸',
    ability: 'bloom',  abilityText: 'Blossoming: sometimes leaves a Life Essence after harvesting.' },
  { key: 'star',   name: 'Star',   color: '#ece3ff', ring: '#8a63d2', shell: '#f3edff', spots: '#f5c542', badge: '⭐',
    ability: 'lucky',  abilityText: 'Lucky: sometimes finds a 🌙 Moon Shard while harvesting.' },
  // ---- found in the later worlds ----
  { key: 'grove',  name: 'Grove',  color: '#e8f6d6', ring: '#5f9a2a', shell: '#f4fae8', spots: '#e0503a', badge: '🍎',
    ability: 'orchard', abilityText: 'Orchard-keeper: harvests grass, flower beds, wheat and cactus twice as fast, and sometimes finds a 🍓 berry.' },
  { key: 'honey',  name: 'Honey',  color: '#fff1c9', ring: '#d79a10', shell: '#fff7dd', spots: '#f2b51c', badge: '🍯',
    ability: 'sweet',  abilityText: 'Sweet-tooth: sometimes leaves a 🍬 candy (a dwagon treat) after harvesting.' },
  { key: 'frost',  name: 'Frost',  color: '#e3f4ff', ring: '#6fb6e8', shell: '#f2faff', spots: '#9fd3f5', badge: '❄',
    ability: 'frost',  abilityText: 'Icebreaker: harvests snow and ice twice as fast, and sometimes finds a silver coin.' },
  { key: 'forest', name: 'Forest', color: '#d9eedc', ring: '#2f7a46', shell: '#e9f5ea', spots: '#3f8f5a', badge: '🌲',
    ability: 'tireless', abilityText: 'Tireless: 4 extra ⚡ energy.' },
  { key: 'magma',  name: 'Magma',  color: '#ffd9c7', ring: '#c2410c', shell: '#4a3530', spots: '#ff7a2f', badge: '🌋',
    ability: 'smelter', abilityText: 'Smelter: harvests lava rocks and stones twice as fast, and sometimes finds a Brick Stack.' },
  { key: 'storm',  name: 'Storm',  color: '#e4e8f2', ring: '#4a5f8f', shell: '#eef1f8', spots: '#f5d742', badge: '⚡',
    ability: 'thunder', abilityText: 'Thunderclap: flies 25% faster and hits Gloom Lords twice as hard.' },
  { key: 'sand',   name: 'Sand',   color: '#f8ecd2', ring: '#c09048', shell: '#fbf3e2', spots: '#d9a85c', badge: '🏜',
    ability: 'seeker', abilityText: 'Treasure-seeker: harvests ancient ruins twice as fast, and sometimes finds a 🔑 Chest Key.' },
  { key: 'coral',  name: 'Coral',  color: '#ffe3dc', ring: '#f0705a', shell: '#fff1ec', spots: '#ff9a85', badge: '🐚',
    ability: 'comber', abilityText: 'Beachcomber: harvests shells and ponds twice as fast, and sometimes finds a silver coin.' },
  { key: 'gem',    name: 'Gem',    color: '#e6f7f4', ring: '#14a38b', shell: '#d9fff7', spots: '#3fd6bd', badge: '💎',
    ability: 'gem',    abilityText: 'Gemcutter: harvests crystals and geodes twice as fast, and sometimes finds a 🌙 Moon Shard.' },
  { key: 'rainbow', name: 'Rainbow', color: '#fde9f7', ring: '#c25bd6', shell: '#fff6fd', spots: '#6fd0f0', badge: '🌈',
    ability: 'prismatic', abilityText: 'Prismatic: once in a while finds a Rainbow Prism while harvesting.' },
  { key: 'shadow', name: 'Shadow', color: '#e2dbe9', ring: '#4b3a63', shell: '#6a5a7e', spots: '#c8ff6a', badge: '🌑',
    ability: 'hunter', abilityText: 'Gloom-hunter: harvests gloomy graves twice as fast, and hits Gloom Lords twice as hard.' },
  { key: 'sun',    name: 'Sun',    color: '#fff5cc', ring: '#e8a317', shell: '#fffbe6', spots: '#ffc83d', badge: '☀',
    ability: 'sunbeam', abilityText: 'Sunbeam: every harvest also heals 2 points of the nearest dead land.' },
  { key: 'lunar',  name: 'Lunar',  color: '#e6e8fb', ring: '#5c63b8', shell: '#eef0ff', spots: '#9aa3ef', badge: '🌙',
    ability: 'lunar',  abilityText: 'Moonlit: harvests stardust and clouds twice as fast, and sometimes finds a 🌙 Moon Shard.' },
  { key: 'cloud',  name: 'Cloud',  color: '#f2f6fb', ring: '#8fa3bf', shell: '#ffffff', spots: '#c5d3e6', badge: '☁',
    ability: 'windrider', abilityText: 'Windrider: flies twice as fast.' },
];

// what each level is called, e.g. "Tide Drakeling"
const DWAGON_STAGES = ['Hatchling', 'Whelp', 'Drakeling', 'Young Dwagon', 'Dwagon', 'Great Dwagon', 'Elder Dwagon', 'Ancient Dwagon'];

// Dwagon Power each level adds to the camp (Cradles add none until hatched)
const DWAGON_POWER = [1, 3, 9, 24, 60, 150, 360, 840];

// Old single-family ids from earlier saves, and what they are now
const LEGACY_IDS = {
  egg: 'meadow_egg', whelp: 'meadow_1', drakeling: 'meadow_2', dwagon: 'meadow_3',
  greatdwagon: 'meadow_4', elderdwagon: 'meadow_5',
};
