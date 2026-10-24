'use strict';

/* ==========================================================================
   DWAGON BREEDS (plain data)
   Every breed gets the same life cycle, built by js/engine/catalog.js:

     Egg ×3 → Lv1 → Lv2 → Lv3 → Lv4 ×3 → Cradle (tap to hatch) → Lv5 → Lv6 → Lv7 → Lv8

   Item ids are `<key>_egg`, `<key>_1` … `<key>_8` and `<key>_cradle`.
   Like the original, merging level-4 dwagons gives a Cradle instead of a bigger
   dwagon, so Dwagon Power dips until you tap the Cradle to hatch it.

   ability (what makes the breed special):
     hardy    2 extra ⚡ energy
     miner    harvests stones and geodes twice as fast; sometimes finds an extra brick
     healer   every harvest also heals 1 point of the nearest dead land
     swift    flies 50% faster
     bloom    sometimes leaves a Life Essence after harvesting
     lucky    sometimes finds a 🌙 Moon Shard while harvesting
   ========================================================================== */
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
