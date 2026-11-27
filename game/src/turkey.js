// Gobble Run — the turkey herself.
// One job: how Tom the turkey moves (run, jump, double-jump, duck, hide,
// stumble) and how she looks, drawn feather by feather on the canvas.

import { GROUND_Y, TUNING } from './config.js';

export class Turkey {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = 300;
    this.y = GROUND_Y;
    this.vy = 0;
    this.jumps = 0;
    this.ducking = false;
    this.hidden = false;
    this.hideTimer = 0;
    this.stumbleTimer = 0;
    this.invulnTimer = 0;
    this.runCycle = 0;
    this.onGround = true;
    this.wasAirborne = false;
  }

  get width() { return 64; }
  get height() { return this.ducking ? 44 : 72; }
  get top() { return this.y - this.height; }
  get left() { return this.x - 26; }
  get right() { return this.x + 38; }

  get speedMul() {
    if (this.stumbleTimer > 0) return TUNING.stumbleSpeed;
    return 1;
  }

  jump(sound) {
    if (this.hidden) {
      // Hop out of the haystack.
      this.hidden = false;
      this.hideTimer = 0;
    }
    if (this.onGround) {
      this.vy = TUNING.jumpVelocity;
      this.jumps = 1;
      this.onGround = false;
      this.ducking = false;
      sound.jump();
      return true;
    }
    if (this.jumps < 2) {
      this.vy = TUNING.doubleJumpVelocity;
      this.jumps = 2;
      sound.jump();
      return true;
    }
    return false;
  }

  update(dt, duckHeld) {
    this.stumbleTimer = Math.max(0, this.stumbleTimer - dt);
    this.invulnTimer = Math.max(0, this.invulnTimer - dt);
    if (this.hidden) {
      this.hideTimer += dt;
      return;
    }
    this.ducking = duckHeld && this.onGround;
    this.vy += TUNING.gravity * dt;
    this.y += this.vy * dt;
    if (this.y >= GROUND_Y) {
      if (!this.onGround && this.wasAirborne) this.landed = true;
      this.y = GROUND_Y;
      this.vy = 0;
      this.onGround = true;
      this.jumps = 0;
    } else {
      this.onGround = false;
    }
    this.wasAirborne = !this.onGround;
    this.runCycle += dt * (this.onGround ? 11 : 3);
  }

  stumble() {
    this.stumbleTimer = TUNING.stumbleTime;
  }

  hurt() {
    this.invulnTimer = TUNING.invulnerableTime;
    this.stumble();
  }

  draw(ctx, t) {
    if (this.hidden) return; // tucked inside the haystack
    if (this.invulnTimer > 0 && Math.floor(t * 14) % 2 === 0) return; // flashing

    const bob = this.onGround ? Math.sin(this.runCycle) * 3 : 0;
    const x = this.x;
    const y = this.y + bob;

    ctx.save();
    ctx.translate(x, y);

    // Legs, pumping while running.
    const legSwing = this.onGround ? Math.sin(this.runCycle) * 10 : 6;
    ctx.strokeStyle = '#e07840';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-8, -14); ctx.lineTo(-8 + legSwing, 0);
    ctx.moveTo(8, -14); ctx.lineTo(8 - legSwing, 0);
    ctx.stroke();

    // Tail fan: five proud feathers.
    const fan = ['#b4552d', '#d97b2f', '#e8a13c', '#d97b2f', '#b4552d'];
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI * 0.78 + (i * Math.PI * 0.56) / 4;
      const fx = Math.cos(a) * 34;
      const fy = Math.sin(a) * 34 - 34;
      ctx.save();
      ctx.translate(-18, -40);
      ctx.rotate(a + Math.PI / 2);
      ctx.fillStyle = fan[i];
      ctx.beginPath();
      ctx.ellipse(0, -16, 9, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f2d8a0';
      ctx.beginPath();
      ctx.ellipse(0, -26, 4, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Body: a plump brown oval.
    ctx.fillStyle = '#7a4a21';
    ctx.beginPath();
    ctx.ellipse(0, -38, 30, 26, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8f5a2b';
    ctx.beginPath();
    ctx.ellipse(2, -36, 24, 20, -0.15, 0, Math.PI * 2);
    ctx.fill();

    // Wing.
    const wingFlap = this.onGround ? Math.sin(this.runCycle) * 4 : -10;
    ctx.fillStyle = '#5d3717';
    ctx.beginPath();
    ctx.ellipse(-4, -36 + wingFlap, 16, 11, -0.5, 0, Math.PI * 2);
    ctx.fill();

    // Head and neck.
    ctx.fillStyle = '#7a4a21';
    ctx.beginPath();
    ctx.ellipse(24, -62, 11, 16, 0.25, 0, Math.PI * 2);
    ctx.fill();
    // Head.
    ctx.fillStyle = '#c65b3f';
    ctx.beginPath();
    ctx.arc(30, -76, 11, 0, Math.PI * 2);
    ctx.fill();
    // Beak.
    ctx.fillStyle = '#f2a541';
    ctx.beginPath();
    ctx.moveTo(38, -79); ctx.lineTo(52, -75); ctx.lineTo(38, -71);
    ctx.closePath();
    ctx.fill();
    // Wattle, dangling red.
    ctx.fillStyle = '#d9382b';
    ctx.beginPath();
    ctx.ellipse(38, -66, 4, 8, 0.3, 0, Math.PI * 2);
    ctx.fill();
    // Eye: wide, determined.
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(32, -79, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1c1c1c';
    ctx.beginPath();
    ctx.arc(33.5, -79, 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
