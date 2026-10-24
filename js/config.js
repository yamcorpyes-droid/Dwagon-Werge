'use strict';

/* ==========================================================================
   1. CONFIG: tweak these to change how the game feels
   ========================================================================== */
const TILE = 64;                         // world units per tile

const CONFIG = {
  HEAL_COST: { '#': 2, 'X': 3 },         // healing points: '#' dead land, 'X' deep dead land
  GLOOM_EXTRA: 2,                        // extra healing a tile needs while a Gloomling stands on it
  GLOOM_MOVE_MS: [3000, 6500],           // Gloomlings shuffle around this often
  TOTEM_MS: 20000,                       // a Gloom Totem tries to summon this often...
  TOTEM_MAX: 2,                          // ...while fewer than this many Gloomlings are near it
  GRASS_CHANCE: 0.07,                    // chance freshly healed empty land sprouts grass
  BUBBLE_CHANCE: 0.3,                    // chance a 5-merge also gives a Bonus Bubble
  STORAGE_SIZE: 12,
  COIN_CAP: 300,                         // coins you can hold before Coin Jars / Coffers / Vaults
  MOONSTAR_MS: 90000,                    // in Adventures, a Moon Star may fall about this often...
  MOONSTAR_CHANCE: 0.6,                  // ...with this chance each time
  CHALICE_COST: 1,                       // 🏆 Chalices to start (or restart) an Adventure; 0 = free. Always earned, never bought
  START_CHALICES: 5,                     // Chalices a new game starts with
  CUSTOM_KEY: 'dwagonMerge.myLevels',    // where levels made in the level editor are kept
  // ---- limits & timers: every one can be skipped with EARNED Moonstones 🌙, never money ----
  TIMERS_ON: true,                       // false = no waiting at all (everything refills instantly, bubbles free)
  DWAGON_REST_MS: 60000,                 // a dwagon regains 1 energy this often while resting in a nest
  BUBBLE_MS: 60000,                      // Bonus Bubbles float away (leaving a coin) after this long
  BUBBLE_COST: 2,                        // Moonstones to pop a Bonus Bubble
  LOCKPICK_COST: 3,                      // Moonstones to open a locked chest without a key
  MOON_MERGE_CHANCE: 0.15,               // chance a 5-merge also drops a Moon Shard
  MOON_DEEP_CHANCE: 0.05,                // chance healing deep dead land reveals a Moon Shard
  DOUBLE_CLICK_MS: 380,
  LONG_PRESS_MS: 450,                    // press and hold an item this long to use it (tablet-friendly)
  DRAG_THRESHOLD: 8,                     // screen pixels before a press becomes a drag / pan
  AUTO_HARVEST: true,                    // idle dwagons sometimes harvest things right next to home by themselves
  AUTO_HARVEST_RADIUS: 2,                // ...within this many tiles
  AUTO_HARVEST_MS: 12000,                // ...about this often
  DWAGON_SPEED: 240,                     // world px per second for a Whelp (bigger = faster)
  HARVEST_MS: 1500,                      // how long a Whelp spends harvesting (bigger = quicker)
  ZOOM_MIN: 0.45, ZOOM_MAX: 1.6,
  SAVE_KEY: 'dwagonMerge.v3',
  // Personalise this! Shown when every tile of the Home Camp is healed.
  WIN_MESSAGE: 'Every inch of land is alive again, and the dwagons have a home. Made with love, just for you. 💚',
};

const EMOJI_FONT = '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
