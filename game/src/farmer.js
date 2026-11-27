// Gobble Run — the farmer.
// One job: the chase. He runs behind the turkey, gains ground whenever she
// stumbles or dawdles, searches a haystack when she hides, and grabs a
// feather when he gets close enough. He never teleports: he runs.

import { GROUND_Y, TUNING } from './config.js';

export class Farmer {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = 300 - TUNING.farmerStartGap;
    this.runCycle = 0;
    this.searching = false;
    this.searchTimer = 0;
    this.searchX = 0;
    this.angry = 0;      // seconds of "HEY!" showing
    this.caughtFlash = 0;
  }

  get gap() {
    // How far behind the turkey he is, in pixels.
    return 300 - this.x;
  }

  get isClose() {
    return this.gap < 130;
  }

  gainGround(px) {
    this.x += px;
  }

  fallBack(px) {
    this.x = Math.max(-80, this.x - px);
  }

  // Called when the turkey slips into a haystack: he stops and searches it.
  startSearch(haystackX) {
    this.searching = true;
    this.searchTimer = 0;
    this.searchX = haystackX - 70;
    this.angry = 1.0;
  }

  // Returns 'poke' on the frame he jabs the pitchfork into the haystack.
  // pace: 1 the turkey sprints (he falls behind), 0 normal running,
  // -1 the turkey eases off (he closes in). He never moves at the turkey's
  // full speed: the turkey runs in place while the world scrolls, so the
  // farmer only gains or loses ground relative to her.
  update(dt, pace, turkeyHidden) {
    this.angry = Math.max(0, this.angry - dt);
    this.caughtFlash = Math.max(0, this.caughtFlash - dt);
    this.runCycle += dt * 10;

    if (this.searching) {
      // Stomp up to the haystack, then scratch his head and look around.
      this.searchTimer += dt;
      if (this.x < this.searchX) {
        this.x = Math.min(this.searchX, this.x + 320 * dt);
      }
      if (this.searchTimer >= TUNING.hideSearchTime) {
        this.searching = false;
        return 'poke';
      }
      return null;
    }

    let drift = 12; // px/s the gap closes at a normal pace
    if (pace === 1) drift = -70;   // sprinting pulls away from him
    if (pace === -1) drift = 55;   // dawdling lets him close in
    if (turkeyHidden) drift = 0;
    this.x += drift * dt;
    // Keep him from drifting off the left edge while the turkey dawdles.
    if (this.x < -60) this.x = -60;
    return null;
  }

  // Did he get a hand on the turkey this frame?
  catches(turkeyX) {
    return !this.searching && (turkeyX - this.x) <= TUNING.farmerCatchGap;
  }

  draw(ctx, t) {
    const x = this.x;
    const y = GROUND_Y;
    const legSwing = Math.sin(this.runCycle) * 12;

    ctx.save();
    ctx.translate(x, y);

    // Legs in muddy boots.
    ctx.strokeStyle = '#3a2a1a';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-10, -46); ctx.lineTo(-10 + legSwing, 0);
    ctx.moveTo(10, -46); ctx.lineTo(10 - legSwing, 0);
    ctx.stroke();

    // Overalls.
    ctx.fillStyle = '#3f6fb5';
    ctx.fillRect(-16, -84, 32, 42);
    ctx.fillStyle = '#355e9c';
    ctx.fillRect(-16, -84, 32, 10);
    // Shirt sleeves.
    ctx.fillStyle = '#c94b3a';
    ctx.fillRect(-22, -82, 10, 26);
    ctx.fillRect(12, -82, 10, 26);

    // Arms pumping; right arm holds the pitchfork.
    const armSwing = Math.sin(this.runCycle) * 8;
    ctx.strokeStyle = '#c94b3a';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(-18, -76); ctx.lineTo(-26, -52 + armSwing);
    ctx.moveTo(16, -76); ctx.lineTo(30, -58 - armSwing);
    ctx.stroke();

    // Pitchfork, raised and glinting.
    ctx.strokeStyle = '#8a8f96';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(30, -58 - armSwing); ctx.lineTo(44, -108 - armSwing);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(38, -112 - armSwing); ctx.lineTo(36, -100 - armSwing);
    ctx.moveTo(44, -114 - armSwing); ctx.lineTo(43, -101 - armSwing);
    ctx.moveTo(50, -110 - armSwing); ctx.lineTo(51, -98 - armSwing);
    ctx.stroke();

    // Head with a straw hat.
    ctx.fillStyle = '#e8b98a';
    ctx.beginPath();
    ctx.arc(0, -96, 13, 0, Math.PI * 2);
    ctx.fill();
    // Angry brows + eyes, fixed on the turkey.
    ctx.strokeStyle = '#2a1c10';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-8, -102); ctx.lineTo(-1, -99);
    ctx.moveTo(8, -102); ctx.lineTo(1, -99);
    ctx.stroke();
    ctx.fillStyle = '#1c1c1c';
    ctx.beginPath();
    ctx.arc(-4, -97, 2, 0, Math.PI * 2);
    ctx.arc(5, -97, 2, 0, Math.PI * 2);
    ctx.fill();
    // Moustache.
    ctx.fillStyle = '#6b4a2a';
    ctx.beginPath();
    ctx.ellipse(0, -88, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    // Straw hat.
    ctx.fillStyle = '#e8c85a';
    ctx.beginPath();
    ctx.ellipse(0, -106, 24, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, -110, 13, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // "HEY!" bubble when he is close or searching.
    if (this.isClose || this.searching) {
      const label = this.searching ? 'WHERE\'D SHE GO?' : 'HEY! GET BACK HERE!';
      ctx.save();
      ctx.font = 'bold 20px "Trebuchet MS", sans-serif';
      const w = ctx.measureText(label).width + 22;
      const bx = Math.min(Math.max(x - w / 2, 8), 1280 - w - 8);
      const by = y - 168;
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.strokeStyle = '#c94b3a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(bx, by, w, 34, 10);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#c94b3a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, bx + w / 2, by + 18);
      ctx.restore();
    }
  }
}
