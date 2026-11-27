// Gobble Run — tuning and stage definitions.
// One job: every number that shapes how the escape feels, in one place.

export const CANVAS_W = 1280;
export const CANVAS_H = 720;
export const GROUND_Y = 600;
export const TURKEY_X = 300;
export const GOAL_METERS = 1200;
export const PX_PER_METER = 12;

export const TUNING = {
  baseSpeed: 260,          // px/s at the start of the run
  maxSpeed: 540,           // px/s at the kitchen, before burst
  burstBonus: 1.45,        // hold Right/D to sprint
  slowFactor: 0.55,        // hold Left/A to ease off
  gravity: 2600,           // px/s^2
  jumpVelocity: -980,      // px/s
  doubleJumpVelocity: -820,
  stumbleTime: 0.65,       // s of slowed running after a hit
  stumbleSpeed: 0.42,      // speed multiplier while stumbling
  invulnerableTime: 1.2,   // s of flashing safety after a hit
  hideSearchTime: 2.2,     // s the farmer searches a haystack
  farmerStartGap: 260,     // px the farmer starts behind the turkey
  farmerCatchGap: 26,      // px: closer than this and he grabs a feather
  farmerResetGap: 230,     // px behind after a feather-grab escape
  farmerGainStumble: 80,   // px the farmer gains when the turkey stumbles
  farmerGainHit: 70,       // px the farmer gains on a knife/oven hit
  cornScore: 25,
  stageBonus: 250,
  knifeWarnTime: 0.55,     // s of glint before a knife drops
  knifeFallSpeed: 900,     // px/s
};

// The escape runs farmyard -> garden -> kitchen yard. Each stage changes
// the palette, the props, the speed and how often danger shows up.
export const STAGES = [
  {
    name: 'THE FARMYARD',
    from: 0,
    to: 400,
    speedMul: 1.0,
    spawnEvery: [1.15, 0.75],   // seconds between obstacles, shrinking
    knifeEvery: [3.4, 2.4],
    sky: ['#ffd9a0', '#ffb36b'],
    hills: ['#8a9a4b', '#6f7f3e'],
    ground: '#b98a4e',
    groundDark: '#9c743d',
    accent: '#e07840',
  },
  {
    name: 'THE GARDEN',
    from: 400,
    to: 800,
    speedMul: 1.15,
    spawnEvery: [0.95, 0.6],
    knifeEvery: [2.6, 1.8],
    sky: ['#ffb877', '#e26d4d'],
    hills: ['#7d6b8f', '#655673'],
    ground: '#a06a3c',
    groundDark: '#87582f',
    accent: '#f2a541',
  },
  {
    name: 'THE KITCHEN YARD',
    from: 800,
    to: 1200,
    speedMul: 1.3,
    spawnEvery: [0.8, 0.5],
    knifeEvery: [2.0, 1.3],
    sky: ['#ff9d5c', '#c94b3a'],
    hills: ['#5e4a63', '#4a3a4f'],
    ground: '#8a5a34',
    groundDark: '#704829',
    accent: '#ffd23e',
  },
];

export function stageFor(meters) {
  for (let i = STAGES.length - 1; i >= 0; i--) {
    if (meters >= STAGES[i].from) return { index: i, ...STAGES[i] };
  }
  return { index: 0, ...STAGES[0] };
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}
