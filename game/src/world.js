// Gobble Run — the world the turkey runs through.
// One job: spawn and move the farmyard (fences, hay bales, corn, haystacks,
// pumpkins, ovens, falling carving knives), track the stage, and answer
// "did the turkey hit anything?" every frame.

import { CANVAS_W, GROUND_Y, TUNING, stageFor } from './config.js';

function rand(a, b) {
  return a + Math.random() * (b - a);
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export class World {
  constructor() {
    this.reset();
  }

  reset() {
    this.distance = 0;        // meters run
    this.obstacles = [];      // {kind, x, y, w, h, passed}
    this.knives = [];         // {x, y, state: 'warn'|'fall', timer}
    this.corns = [];          // {x, y, taken}
    this.haystacks = [];      // {x, w}
    this.spawnTimer = 0.8;
    this.knifeTimer = 2.2;
    this.cornTimer = 1.4;
    this.hayTimer = 9;
    this.stageIndex = 0;
    this.stageBanner = 0;     // seconds left showing the stage name
    this.scrollX = 0;
    this.deco = [];           // background props {x, kind}
    this.decoTimer = 0;
    this.nearMiss = 0;
  }

  get stage() {
    return stageFor(this.distance);
  }

  // A ground obstacle the turkey must jump (or duck under a line).
  spawnObstacle() {
    const stage = this.stage.index;
    const kinds = ['fence', 'bale'];
    if (stage >= 1) kinds.push('pumpkin', 'pumpkin');
    if (stage >= 2) kinds.push('oven', 'oven');
    if (stage >= 1) kinds.push('line'); // washing line: duck under it
    const kind = pick(kinds);
    const x = CANVAS_W + rand(40, 160);
    if (kind === 'fence') this.obstacles.push({ kind, x, y: GROUND_Y - 52, w: 58, h: 52 });
    else if (kind === 'bale') this.obstacles.push({ kind, x, y: GROUND_Y - 46, w: 64, h: 46 });
    else if (kind === 'pumpkin') this.obstacles.push({ kind, x, y: GROUND_Y - 40, w: 52, h: 40 });
    else if (kind === 'oven') this.obstacles.push({ kind, x, y: GROUND_Y - 78, w: 72, h: 78 });
    else if (kind === 'line') this.obstacles.push({ kind, x, y: GROUND_Y - 118, w: 10, h: 118, duckUnder: true });
  }

  spawnKnife(turkeyX) {
    this.knives.push({
      x: turkeyX + rand(-50, 130),
      y: -40,
      state: 'warn',
      timer: TUNING.knifeWarnTime,
    });
  }

  spawnCornRow() {
    const y0 = GROUND_Y - rand(90, 190);
    const n = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      this.corns.push({ x: CANVAS_W + 60 + i * 44, y: y0, taken: false, spin: Math.random() * 6 });
    }
  }

  spawnHaystack() {
    this.haystacks.push({ x: CANVAS_W + 80, w: 110 });
  }

  spawnDeco() {
    const stage = this.stage.index;
    const kinds = stage === 0 ? ['barn', 'tree', 'fencepost'] : stage === 1 ? ['scarecrow', 'tree', 'pumpkinPatch'] : ['barn', 'tree', 'woodpile'];
    this.deco.push({ x: CANVAS_W + 60, kind: pick(kinds) });
  }

  update(dt, speed, turkey) {
    const stage = this.stage;
    if (stage.index !== this.stageIndex) {
      this.stageIndex = stage.index;
      this.stageBanner = 2.4;
    }
    this.stageBanner = Math.max(0, this.stageBanner - dt);

    // The world scrolls left at the turkey's speed.
    this.scrollX += speed * dt;
    if (!turkey.hidden) {
      this.distance += (speed * dt) / 12;
    }

    const move = (list) => {
      for (const o of list) o.x -= speed * dt;
      return list.filter((o) => o.x > -220);
    };
    this.obstacles = move(this.obstacles);
    this.corns = move(this.corns);
    this.haystacks = move(this.haystacks);
    this.deco = move(this.deco);

    // Spawning, paced by the stage.
    const t = 1 - Math.min(0.85, this.distance / 1400);
    const spawnEvery = stage.spawnEvery[0] * t + stage.spawnEvery[1] * (1 - t);
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnObstacle();
      this.spawnTimer = spawnEvery * rand(0.8, 1.25);
    }
    const knifeEvery = stage.knifeEvery[0] * t + stage.knifeEvery[1] * (1 - t);
    this.knifeTimer -= dt;
    if (this.knifeTimer <= 0) {
      this.spawnKnife(turkey.x);
      this.knifeTimer = knifeEvery * rand(0.85, 1.2);
    }
    this.cornTimer -= dt;
    if (this.cornTimer <= 0) {
      this.spawnCornRow();
      this.cornTimer = rand(2.2, 4.2);
    }
    this.hayTimer -= dt;
    if (this.hayTimer <= 0) {
      this.spawnHaystack();
      this.hayTimer = rand(8, 13);
    }
    this.decoTimer -= dt;
    if (this.decoTimer <= 0) {
      this.spawnDeco();
      this.decoTimer = rand(1.2, 2.4);
    }

    // Falling knives: warn, then drop.
    for (const k of this.knives) {
      if (k.state === 'warn') {
        k.timer -= dt;
        if (k.timer <= 0) k.state = 'fall';
      } else {
        k.y += TUNING.knifeFallSpeed * dt;
      }
    }
    this.knives = this.knives.filter((k) => k.y < GROUND_Y + 40);
  }

  // The haystack the turkey is standing in, if any.
  haystackAt(turkey) {
    return this.haystacks.find((h) => turkey.x > h.x - 20 && turkey.x < h.x + h.w + 20);
  }

  // Returns {hit, kind} for the first harmful collision this frame, and
  // collects any corn the turkey touches. `hit` is 'stumble' | 'hurt'.
  collide(turkey) {
    let result = null;
    const tTop = turkey.top + 6;
    const tBottom = turkey.y - 2;
    for (const o of this.obstacles) {
      if (o.passed) continue;
      const overlapX = turkey.right - 8 > o.x && turkey.left + 8 < o.x + o.w;
      if (!overlapX) continue;
      if (o.duckUnder) {
        // Washing line: only the turkey's head can snag it.
        if (!turkey.ducking && tTop < o.y + 30) {
          o.passed = true;
          result = { hit: 'stumble', kind: 'line' };
        }
        continue;
      }
      if (tBottom > o.y + 8) {
        o.passed = true;
        result = { hit: o.kind === 'oven' ? 'hurt' : 'stumble', kind: o.kind };
      }
    }
    for (const k of this.knives) {
      if (k.state !== 'fall' || k.done) continue;
      const kx = k.x;
      if (kx > turkey.left + 4 && kx < turkey.right - 4 && k.y + 46 > tTop && k.y < tBottom) {
        k.done = true;
        result = { hit: 'hurt', kind: 'knife' };
      }
    }
    let cornGot = 0;
    for (const c of this.corns) {
      if (c.taken) continue;
      const dx = c.x - turkey.x;
      const dy = c.y - (turkey.y - 40);
      if (Math.abs(dx) < 42 && Math.abs(dy) < 46) {
        c.taken = true;
        cornGot++;
      }
    }
    this.corns = this.corns.filter((c) => !c.taken);
    return { result, cornGot };
  }
}
