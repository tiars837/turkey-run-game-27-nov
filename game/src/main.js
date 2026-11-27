// Gobble Run — the game itself.
// One job: the loop and the state machine. Title -> running -> caught or
// escaped -> restart. It owns the score, the lives, the collisions and the
// farmer's catches, and it stages scenes for screenshots (?scene=...).

import { CANVAS_W, CANVAS_H, GROUND_Y, TUNING, GOAL_METERS } from './config.js';
import { SoundBoard } from './audio.js';
import { Input } from './input.js';
import { Turkey } from './turkey.js';
import { Farmer } from './farmer.js';
import { World } from './world.js';
import { Renderer } from './render.js';

const BEST_KEY = 'gobble-run-best';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = new Input(canvas);
    this.sound = new SoundBoard();
    this.turkey = new Turkey();
    this.farmer = new Farmer();
    this.world = new World();
    this.render = new Renderer(this.ctx);
    this.state = 'title'; // title | playing | caught | escaped
    this.score = 0;
    this.corn = 0;
    this.lives = 3;
    this.best = this.loadBest();
    this.time = 0;
    this.spottedFlash = 0;
    this.startButton = null;
    this.restartButton = null;
    this.stageShown = -1;
    this.lastTs = 0;
    this.raf = 0;

    // Screenshot staging: ?scene=title|play|caught|escaped renders that
    // screen from the game's own code, for the maker's screenshots.
    const scene = new URLSearchParams(window.location.search).get('scene');
    if (scene === 'play') this.stagePlayScene();
    else if (scene === 'caught') this.stageEndScene(false);
    else if (scene === 'escaped') this.stageEndScene(true);

    // Debug hook for the maker's play-tests (read-only state + staging).
    window.__gobble = {
      state: () => this.state,
      score: () => this.score,
      distance: () => this.world.distance,
      lives: () => this.lives,
      farmerGap: () => this.farmer.gap,
      stage: () => this.world.stage.name,
    };
  }

  loadBest() {
    try {
      return Number(window.localStorage.getItem(BEST_KEY) || 0) || 0;
    } catch {
      return 0;
    }
  }

  saveBest() {
    try {
      window.localStorage.setItem(BEST_KEY, String(this.best));
    } catch { /* storage may be off; the game plays on */ }
  }

  stagePlayScene() {
    this.startRun();
    this.world.distance = 320;
    this.score = 340;
    this.corn = 4;
    this.world.stageIndex = 1;
    this.world.stageBanner = 0;
    // A busy mid-run frame: fence ahead, knife glinting, corn overhead,
    // the farmer closing in.
    this.world.obstacles.push({ kind: 'fence', x: 760, y: GROUND_Y - 52, w: 58, h: 52 });
    this.world.obstacles.push({ kind: 'bale', x: 1050, y: GROUND_Y - 46, w: 64, h: 46 });
    this.world.knives.push({ x: 560, y: -40, state: 'warn', timer: 0.5 });
    this.world.corns.push({ x: 620, y: GROUND_Y - 170, taken: false, spin: 1 });
    this.world.corns.push({ x: 664, y: GROUND_Y - 170, taken: false, spin: 2 });
    this.world.corns.push({ x: 708, y: GROUND_Y - 170, taken: false, spin: 3 });
    this.world.haystacks.push({ x: 880, w: 110 });
    this.farmer.x = 300 - 120;
  }

  stageEndScene(escaped) {
    this.startRun();
    this.score = escaped ? 1480 : 612;
    this.corn = escaped ? 18 : 7;
    this.world.distance = escaped ? GOAL_METERS : 587;
    this.lives = escaped ? 2 : 0;
    this.state = escaped ? 'escaped' : 'caught';
    if (this.score > this.best) this.best = this.score;
  }

  startRun() {
    this.turkey.reset();
    this.farmer.reset();
    this.world.reset();
    this.score = 0;
    this.corn = 0;
    this.lives = 3;
    this.state = 'playing';
    this.stageShown = -1;
    this.sound.ensure();
    this.sound.gobble();
    this.sound.startMusic();
  }

  endRun(escaped) {
    this.state = escaped ? 'escaped' : 'caught';
    if (this.score > this.best) {
      this.best = this.score;
      this.saveBest();
    }
    this.sound.stopMusic();
    if (escaped) this.sound.escaped();
    else this.sound.caught();
  }

  loseHeart(kind) {
    this.lives -= 1;
    this.turkey.hurt();
    this.farmer.gainGround(TUNING.farmerGainHit);
    this.sound.hit();
    if (this.lives <= 0) {
      this.lives = 0;
      this.endRun(false);
    }
  }

  update(dt) {
    this.time += dt;
    if (this.state === 'title') {
      if (this.input.confirmHit || (this.startButton && this.input.clickedIn(this.startButton))) {
        this.sound.ensure();
        this.sound.click();
        this.startRun();
      }
      return;
    }
    if (this.state === 'caught' || this.state === 'escaped') {
      if (this.input.restartHit || (this.restartButton && this.input.clickedIn(this.restartButton))) {
        this.sound.click();
        this.startRun();
      }
      return;
    }

    // --- playing ---
    if (this.input.muteHit) this.sound.toggleMute();

    // Speed: base grows with distance and stage, burst/slow on keys.
    const stage = this.world.stage;
    let speed = TUNING.baseSpeed;
    speed += Math.min(TUNING.maxSpeed - TUNING.baseSpeed, this.world.distance * 0.55);
    speed *= stage.speedMul;
    if (this.input.burstHeld) speed *= TUNING.burstBonus;
    if (this.input.slowHeld) speed *= TUNING.slowFactor;
    speed *= this.turkey.speedMul;
    if (this.turkey.hidden) speed = 0;

    // Jump / duck / hide.
    if (this.input.jumpHit) this.turkey.jump(this.sound);
    if (this.input.clickHit && !this.input.clickedIn({ x: CANVAS_W - 54, y: 76, w: 40, h: 30 })) {
      this.turkey.jump(this.sound);
    }
    const hay = this.world.haystackAt(this.turkey);
    if (hay && this.input.duckHeld && this.turkey.onGround && !this.turkey.hidden) {
      this.turkey.hidden = true;
      this.turkey.hideTimer = 0;
      this.farmer.startSearch(hay.x + hay.w / 2);
      this.sound.gobble();
    }

    const wasAirborne = !this.turkey.onGround;
    this.turkey.update(dt, this.input.duckHeld);
    if (wasAirborne && this.turkey.onGround) this.sound.land();

    // The farmer chases, searches, and pokes haystacks. His pace follows
    // the turkey's: sprint to pull away, dawdle and he closes in.
    const pace = this.input.burstHeld ? 1 : this.input.slowHeld ? -1 : 0;
    const poke = this.farmer.update(dt, pace, this.turkey.hidden);
    if (poke === 'poke' && this.turkey.hidden) {
      this.turkey.hidden = false;
      this.turkey.hideTimer = 0;
      this.loseHeart('poke');
    }
    if (this.turkey.hidden && this.turkey.hideTimer > TUNING.hideSearchTime) {
      this.turkey.hidden = false; // slipped out the back while he looked
    }

    this.world.update(dt, speed, this.turkey);

    // Stage banners, with a bonus the first time each stage is reached.
    if (stage.index !== this.stageShown) {
      this.stageShown = stage.index;
      if (stage.index > 0) this.sound.gobble();
    }

    // Collisions: obstacles, knives, corn.
    if (this.turkey.invulnTimer <= 0 && !this.turkey.hidden) {
      const { result, cornGot } = this.world.collide(this.turkey);
      if (cornGot > 0) {
        this.corn += cornGot;
        this.score += cornGot * TUNING.cornScore;
        this.sound.corn();
      }
      if (result) {
        if (result.hit === 'hurt') this.loseHeart(result.kind);
        else {
          this.turkey.stumble();
          this.farmer.gainGround(TUNING.farmerGainStumble);
          this.sound.stumble();
        }
      }
    } else {
      const { cornGot } = this.world.collide(this.turkey);
      if (cornGot > 0) {
        this.corn += cornGot;
        this.score += cornGot * TUNING.cornScore;
        this.sound.corn();
      }
    }

    // The farmer grabs a feather when he gets close enough.
    if (this.farmer.catches(this.turkey.x) && !this.turkey.hidden && this.turkey.invulnTimer <= 0) {
      this.farmer.caughtFlash = 0.8;
      this.farmer.fallBack(TUNING.farmerResetGap);
      this.loseHeart('caught');
      this.spottedFlash = 0.9;
    }

    // Farmer proximity warning: a "HEY!" the moment he gets close.
    if (this.farmer.isClose && !this.wasClose) this.sound.spotted();
    this.wasClose = this.farmer.isClose;
    this.spottedFlash = Math.max(0, this.spottedFlash - dt);

    // Score ticks up with every meter.
    this.score = Math.max(this.score, Math.floor(this.world.distance) + this.corn * TUNING.cornScore + this.stageShown * TUNING.stageBonus);

    // The woods at last: escaped!
    if (this.world.distance >= GOAL_METERS) {
      this.score += 500;
      this.endRun(true);
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    if (this.state === 'title') {
      this.render.drawTitle(this, this.time);
      return;
    }
    const stage = this.world.stage;
    this.render.drawBackground(stage, this.world.scrollX, this.time);
    this.render.drawDeco(this.world.deco);
    for (const h of this.world.haystacks) {
      this.render.drawHaystack(h, this.turkey.hidden && this.world.haystackAt(this.turkey) === h);
    }
    for (const o of this.world.obstacles) this.render.drawObstacle(o, this.time);
    for (const c of this.world.corns) this.render.drawCorn(c, this.time);
    for (const k of this.world.knives) this.render.drawKnife(k, this.time);
    this.farmer.draw(ctx, this.time);
    this.turkey.draw(ctx, this.time);
    this.render.drawHud(this);
    if (this.world.stageBanner > 0) {
      this.render.drawStageBanner(stage.name, Math.min(1, this.world.stageBanner));
    }
    if (this.state === 'caught' || this.state === 'escaped') {
      this.render.drawEnd(this, this.state === 'escaped');
    }
  }

  frame(ts) {
    const dt = Math.min(0.05, (ts - this.lastTs) / 1000 || 0.016);
    this.lastTs = ts;
    this.update(dt);
    this.draw();
    this.input.endFrame();
    this.raf = requestAnimationFrame((t) => this.frame(t));
  }

  start() {
    this.raf = requestAnimationFrame((t) => {
      this.lastTs = t;
      this.frame(t);
    });
  }
}

// Boot: the canvas is the whole game.
const canvas = document.getElementById('game');
const game = new Game(canvas);
game.start();
