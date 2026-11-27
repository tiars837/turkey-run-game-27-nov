// Gobble Run — everything the player sees.
// One job: paint the farm, the kitchen yard, the turkey, the farmer, the
// dangers, the HUD and the title/end screens onto the canvas.

import { CANVAS_W, CANVAS_H, GROUND_Y, GOAL_METERS, PX_PER_METER } from './config.js';

export class Renderer {
  constructor(ctx) {
    this.ctx = ctx;
  }

  drawBackground(stage, scrollX, t) {
    const ctx = this.ctx;
    // Sky.
    const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    sky.addColorStop(0, stage.sky[0]);
    sky.addColorStop(1, stage.sky[1]);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, CANVAS_W, GROUND_Y);

    // Low autumn sun.
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    ctx.arc(1080, 110, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffe9a0';
    ctx.beginPath();
    ctx.arc(1080, 110, 60, 0, Math.PI * 2);
    ctx.globalAlpha = 0.35;
    ctx.fill();
    ctx.globalAlpha = 1;

    // Drifting clouds.
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < 4; i++) {
      const cx = ((i * 340 - scrollX * 0.15) % 1500 + 1500) % 1500 - 100;
      const cy = 70 + i * 42;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 52, 18, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 34, cy + 6, 36, 14, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Rolling hills.
    ctx.fillStyle = stage.hills[0];
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    for (let x = 0; x <= CANVAS_W; x += 40) {
      const hx = x - (scrollX * 0.3 % 400);
      ctx.lineTo(x, GROUND_Y - 90 - Math.sin((hx + scrollX * 0.3) * 0.004) * 36);
    }
    ctx.lineTo(CANVAS_W, GROUND_Y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = stage.hills[1];
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    for (let x = 0; x <= CANVAS_W; x += 40) {
      ctx.lineTo(x, GROUND_Y - 34 - Math.sin((x + scrollX * 0.5) * 0.006) * 18);
    }
    ctx.lineTo(CANVAS_W, GROUND_Y);
    ctx.closePath();
    ctx.fill();

    // Ground.
    ctx.fillStyle = stage.ground;
    ctx.fillRect(0, GROUND_Y, CANVAS_W, CANVAS_H - GROUND_Y);
    ctx.fillStyle = stage.groundDark;
    ctx.fillRect(0, GROUND_Y, CANVAS_W, 10);
    // Dirt speckles rushing past.
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    for (let i = 0; i < 26; i++) {
      const sx = ((i * 173 - scrollX * 1.0) % 1400 + 1400) % 1400 - 60;
      const sy = GROUND_Y + 24 + ((i * 47) % 84);
      ctx.fillRect(sx, sy, 14, 4);
    }
  }

  drawDeco(deco) {
    const ctx = this.ctx;
    for (const d of deco) {
      const x = d.x;
      if (d.kind === 'barn') {
        ctx.fillStyle = '#a83c2a';
        ctx.fillRect(x, GROUND_Y - 150, 150, 150);
        ctx.fillStyle = '#7e2c1f';
        ctx.beginPath();
        ctx.moveTo(x - 12, GROUND_Y - 148);
        ctx.lineTo(x + 75, GROUND_Y - 210);
        ctx.lineTo(x + 162, GROUND_Y - 148);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#f2e3c6';
        ctx.fillRect(x + 55, GROUND_Y - 90, 40, 90);
        ctx.strokeStyle = '#f2e3c6';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x + 55, GROUND_Y - 90); ctx.lineTo(x + 95, GROUND_Y);
        ctx.moveTo(x + 95, GROUND_Y - 90); ctx.lineTo(x + 55, GROUND_Y);
        ctx.stroke();
      } else if (d.kind === 'tree') {
        ctx.fillStyle = '#6b4423';
        ctx.fillRect(x + 14, GROUND_Y - 110, 16, 110);
        ctx.fillStyle = '#c96a2b';
        ctx.beginPath();
        ctx.arc(x + 22, GROUND_Y - 130, 44, 0, Math.PI * 2);
        ctx.arc(x - 12, GROUND_Y - 100, 30, 0, Math.PI * 2);
        ctx.arc(x + 56, GROUND_Y - 100, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e8a13c';
        ctx.beginPath();
        ctx.arc(x + 22, GROUND_Y - 150, 26, 0, Math.PI * 2);
        ctx.fill();
      } else if (d.kind === 'scarecrow') {
        ctx.strokeStyle = '#6b4423';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(x, GROUND_Y - 120); ctx.lineTo(x, GROUND_Y);
        ctx.moveTo(x - 34, GROUND_Y - 92); ctx.lineTo(x + 34, GROUND_Y - 92);
        ctx.stroke();
        ctx.fillStyle = '#e8c85a';
        ctx.beginPath();
        ctx.arc(x, GROUND_Y - 132, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#3f6fb5';
        ctx.fillRect(x - 26, GROUND_Y - 96, 52, 40);
        ctx.fillStyle = '#e8c85a';
        ctx.beginPath();
        ctx.ellipse(x, GROUND_Y - 146, 26, 8, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (d.kind === 'pumpkinPatch') {
        for (let i = 0; i < 3; i++) this.drawPumpkin(x + i * 34, GROUND_Y, 0.8);
      } else if (d.kind === 'woodpile') {
        ctx.fillStyle = '#8a5a34';
        for (let r = 0; r < 3; r++) {
          for (let i = 0; i < 4 - r; i++) {
            ctx.beginPath();
            ctx.arc(x + 14 + i * 26 + r * 13, GROUND_Y - 12 - r * 24, 11, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else {
        ctx.fillStyle = '#8a5a34';
        ctx.fillRect(x, GROUND_Y - 46, 8, 46);
        ctx.fillRect(x - 18, GROUND_Y - 40, 44, 7);
      }
    }
  }

  drawPumpkin(x, y, s) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = '#e07820';
    ctx.beginPath();
    ctx.ellipse(0, -18, 26, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d96a1a';
    ctx.beginPath();
    ctx.ellipse(-10, -18, 10, 18, 0, 0, Math.PI * 2);
    ctx.ellipse(10, -18, 10, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5d8a3c';
    ctx.fillRect(-3, -42, 6, 12);
    ctx.restore();
  }

  drawObstacle(o, t) {
    const ctx = this.ctx;
    if (o.kind === 'fence') {
      ctx.fillStyle = '#8a5a34';
      ctx.fillRect(o.x, o.y + 6, 6, o.h - 6);
      ctx.fillRect(o.x + o.w - 6, o.y + 6, 6, o.h - 6);
      ctx.fillStyle = '#a06a3c';
      ctx.fillRect(o.x - 4, o.y + 8, o.w + 8, 9);
      ctx.fillRect(o.x - 4, o.y + 28, o.w + 8, 9);
    } else if (o.kind === 'bale') {
      ctx.fillStyle = '#d9a83c';
      ctx.beginPath();
      ctx.arc(o.x + o.w / 2, o.y + o.h, o.w / 2, Math.PI, 0);
      ctx.fill();
      ctx.strokeStyle = '#b98a2e';
      ctx.lineWidth = 3;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(o.x + o.w / 2 + i * 12, o.y + 6);
        ctx.lineTo(o.x + o.w / 2 + i * 12, o.y + o.h - 4);
        ctx.stroke();
      }
    } else if (o.kind === 'pumpkin') {
      this.drawPumpkin(o.x + o.w / 2, o.y + o.h, 1.1);
      // Jack-o'-lantern grin.
      ctx.fillStyle = '#2a1c10';
      ctx.beginPath();
      ctx.moveTo(o.x + 14, o.y + 16); ctx.lineTo(o.x + 22, o.y + 10); ctx.lineTo(o.x + 30, o.y + 16);
      ctx.closePath();
      ctx.fill();
    } else if (o.kind === 'oven') {
      // The dreaded oven: glowing door, heat shimmer.
      ctx.fillStyle = '#4a4a52';
      ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.fillStyle = '#33333a';
      ctx.fillRect(o.x, o.y, o.w, 12);
      const glow = 0.55 + Math.sin(t * 6) * 0.25;
      ctx.fillStyle = `rgba(255,${Math.floor(120 + glow * 80)},30,${0.75 + glow * 0.25})`;
      ctx.fillRect(o.x + 10, o.y + 20, o.w - 20, 34);
      ctx.strokeStyle = '#22222a';
      ctx.lineWidth = 4;
      ctx.strokeRect(o.x + 10, o.y + 20, o.w - 20, 34);
      ctx.fillStyle = '#ff5a2a';
      ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('HOT!', o.x + o.w / 2, o.y + 70);
      // Heat wobble lines.
      ctx.strokeStyle = 'rgba(255,120,40,0.5)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const hx = o.x + 14 + i * 22;
        ctx.beginPath();
        ctx.moveTo(hx, o.y - 4 - Math.sin(t * 5 + i) * 3);
        ctx.lineTo(hx, o.y - 18 - Math.sin(t * 5 + i) * 3);
        ctx.stroke();
      }
    } else if (o.kind === 'line') {
      // Washing line: duck under it.
      ctx.strokeStyle = '#7a6a55';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(o.x - 130, o.y);
      ctx.lineTo(o.x + 140, o.y);
      ctx.stroke();
      ctx.fillStyle = '#f2e3c6';
      ctx.fillRect(o.x - 96, o.y, 26, 34);
      ctx.fillStyle = '#e07840';
      ctx.fillRect(o.x - 50, o.y, 26, 30);
      ctx.fillStyle = '#7ba05b';
      ctx.fillRect(o.x + 8, o.y, 26, 36);
      ctx.fillStyle = '#3f6fb5';
      ctx.fillRect(o.x + 62, o.y, 26, 30);
    }
  }

  drawKnife(k, t) {
    const ctx = this.ctx;
    if (k.state === 'warn') {
      // Glint on the ground where it will land.
      const a = 0.4 + Math.sin(t * 18) * 0.3;
      ctx.fillStyle = `rgba(255,60,40,${a})`;
      ctx.beginPath();
      ctx.ellipse(k.x, GROUND_Y + 8, 26, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.font = 'bold 22px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', k.x, GROUND_Y - 66);
    } else {
      // The carving knife, falling point-first.
      ctx.save();
      ctx.translate(k.x, k.y);
      ctx.fillStyle = '#c8ccd2';
      ctx.beginPath();
      ctx.moveTo(0, 46);
      ctx.lineTo(-9, 10);
      ctx.lineTo(-9, -30);
      ctx.lineTo(9, -30);
      ctx.lineTo(9, 10);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#5d3717';
      ctx.fillRect(-8, -52, 16, 24);
      ctx.restore();
    }
  }

  drawCorn(c, t) {
    const ctx = this.ctx;
    const bob = Math.sin(t * 4 + c.spin) * 3;
    ctx.save();
    ctx.translate(c.x, c.y + bob);
    ctx.rotate(Math.sin(t * 3 + c.spin) * 0.15);
    ctx.fillStyle = '#f2c230';
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d9a41f';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.ellipse(i * 5, 0, 2.5, 15, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#7ba05b';
    ctx.beginPath();
    ctx.moveTo(-8, 12); ctx.lineTo(0, 26); ctx.lineTo(8, 12);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawHaystack(h, hiddenTurkey) {
    const ctx = this.ctx;
    ctx.fillStyle = '#d9a83c';
    ctx.beginPath();
    ctx.moveTo(h.x, GROUND_Y);
    ctx.quadraticCurveTo(h.x + h.w / 2, GROUND_Y - 110, h.x + h.w, GROUND_Y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#b98a2e';
    ctx.lineWidth = 3;
    for (let i = 0; i < 5; i++) {
      const hx = h.x + 16 + i * 20;
      ctx.beginPath();
      ctx.moveTo(hx, GROUND_Y - 12);
      ctx.lineTo(hx + 6, GROUND_Y - 58 - (i % 2) * 14);
      ctx.stroke();
    }
    if (hiddenTurkey) {
      // Two tail feathers poking out — the giveaway.
      ctx.strokeStyle = '#b4552d';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(h.x + h.w / 2 - 8, GROUND_Y - 96);
      ctx.lineTo(h.x + h.w / 2 - 16, GROUND_Y - 122);
      ctx.moveTo(h.x + h.w / 2 + 6, GROUND_Y - 98);
      ctx.lineTo(h.x + h.w / 2 + 12, GROUND_Y - 124);
      ctx.stroke();
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = 'bold 15px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('HIDE: hold ↓', h.x + h.w / 2, GROUND_Y - 118);
    }
  }

  drawHud(game) {
    const ctx = this.ctx;
    // Top bar.
    ctx.fillStyle = 'rgba(30,20,10,0.55)';
    ctx.beginPath();
    ctx.roundRect(14, 12, 560, 54, 12);
    ctx.fill();
    ctx.fillStyle = '#fff3d6';
    ctx.font = 'bold 24px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`SCORE ${game.score}`, 30, 40);
    ctx.fillStyle = '#ffd23e';
    ctx.fillText(`${Math.floor(game.world.distance)} m`, 250, 40);
    // Hearts.
    for (let i = 0; i < 3; i++) {
      const hx = 420 + i * 40;
      const hy = 40;
      ctx.fillStyle = i < game.lives ? '#e63946' : 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.moveTo(hx, hy + 8);
      ctx.bezierCurveTo(hx - 14, hy - 6, hx - 6, hy - 14, hx, hy - 6);
      ctx.bezierCurveTo(hx + 6, hy - 14, hx + 14, hy - 6, hx, hy + 8);
      ctx.fill();
    }
    // Stage + goal progress, right side.
    ctx.fillStyle = 'rgba(30,20,10,0.55)';
    ctx.beginPath();
    ctx.roundRect(CANVAS_W - 344, 12, 330, 54, 12);
    ctx.fill();
    ctx.fillStyle = '#fff3d6';
    ctx.font = 'bold 17px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(game.world.stage.name, CANVAS_W - 30, 30);
    const prog = Math.min(1, game.world.distance / GOAL_METERS);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.roundRect(CANVAS_W - 314, 46, 270, 10, 5);
    ctx.fill();
    ctx.fillStyle = '#7ba05b';
    ctx.beginPath();
    ctx.roundRect(CANVAS_W - 314, 46, 270 * prog, 10, 5);
    ctx.fill();
    ctx.fillStyle = '#fff3d6';
    ctx.font = 'bold 12px "Trebuchet MS", sans-serif';
    ctx.fillText(`WOODS ${GOAL_METERS} m`, CANVAS_W - 64, 62);

    // Farmer proximity: the dread bar under the HUD.
    const gap = game.farmer.gap;
    if (gap < 200) {
      const danger = 1 - gap / 200;
      ctx.fillStyle = 'rgba(201,59,43,0.85)';
      ctx.font = 'bold 22px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        danger > 0.66 ? '🏃 FARMER RIGHT BEHIND YOU!' : 'FARMER CLOSING IN…',
        CANVAS_W / 2,
        96,
      );
    }
    // Mute state.
    ctx.fillStyle = 'rgba(30,20,10,0.55)';
    ctx.beginPath();
    ctx.roundRect(CANVAS_W - 54, 76, 40, 30, 8);
    ctx.fill();
    ctx.fillStyle = '#fff3d6';
    ctx.font = 'bold 16px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(game.sound.muted ? '🔇' : '🔊', CANVAS_W - 34, 92);
  }

  drawStageBanner(text, alpha) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(30,20,10,0.6)';
    ctx.fillRect(0, 300, CANVAS_W, 64);
    ctx.fillStyle = '#ffd23e';
    ctx.font = 'bold 40px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, CANVAS_W / 2, 332);
    ctx.restore();
  }

  drawTitle(game, t) {
    const ctx = this.ctx;
    // Warm title backdrop: the farm at dawn.
    const sky = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    sky.addColorStop(0, '#ffd9a0');
    sky.addColorStop(0.6, '#ffb36b');
    sky.addColorStop(1, '#e07840');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    // Big barn silhouette.
    ctx.fillStyle = 'rgba(120,40,20,0.55)';
    ctx.fillRect(80, 420, 260, 300);
    ctx.beginPath();
    ctx.moveTo(60, 420);
    ctx.lineTo(210, 300);
    ctx.lineTo(360, 420);
    ctx.closePath();
    ctx.fill();
    // Title.
    ctx.textAlign = 'center';
    ctx.fillStyle = '#7a2d12';
    ctx.font = 'bold 96px "Trebuchet MS", sans-serif';
    ctx.fillText('GOBBLE RUN!', CANVAS_W / 2, 150);
    ctx.fillStyle = '#fff3d6';
    ctx.font = 'bold 96px "Trebuchet MS", sans-serif';
    ctx.fillText('GOBBLE RUN!', CANVAS_W / 2, 146);
    ctx.fillStyle = '#5d2a10';
    ctx.font = 'bold 30px "Trebuchet MS", sans-serif';
    ctx.fillText('A turkey\'s Thanksgiving escape', CANVAS_W / 2, 205);

    // The turkey, front and centre, bobbing. Draw the game's own turkey
    // shifted into the title pose (scaled 1.7x, feet at the title ground).
    const s = 1.7;
    const titleX = CANVAS_W / 2 - 260;
    const titleY = 430 + Math.sin(t * 2.4) * 6;
    ctx.save();
    ctx.translate(titleX - s * game.turkey.x, titleY - s * GROUND_Y);
    ctx.scale(s, s);
    game.turkey.draw(ctx, t);
    ctx.restore();

    // The farmer, lurking at the edge with his pitchfork.
    ctx.save();
    ctx.translate(CANVAS_W / 2 + 380 - game.farmer.x, 0);
    game.farmer.draw(ctx, t);
    ctx.restore();

    // Instructions card.
    ctx.fillStyle = 'rgba(30,20,10,0.62)';
    ctx.beginPath();
    ctx.roundRect(CANVAS_W / 2 - 330, 470, 660, 118, 14);
    ctx.fill();
    ctx.fillStyle = '#fff3d6';
    ctx.font = '20px "Trebuchet MS", sans-serif';
    ctx.fillText('The farmer wants you for Thanksgiving dinner. Run 1,200 m to the woods!', CANVAS_W / 2, 500);
    ctx.fillText('SPACE / ↑ / click — jump (twice for a flap)      ↓ — duck / hide in hay', CANVAS_W / 2, 530);
    ctx.fillText('→ — sprint · ← — ease off · corn +25 · dodge knives & the oven!', CANVAS_W / 2, 560);

    // Start button, pulsing.
    const pulse = 1 + Math.sin(t * 4) * 0.04;
    ctx.save();
    ctx.translate(CANVAS_W / 2, 632);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = '#e63946';
    ctx.beginPath();
    ctx.roundRect(-130, -26, 260, 52, 26);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px "Trebuchet MS", sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('▶  START THE ESCAPE', 0, 2);
    ctx.restore();

    game.startButton = { x: CANVAS_W / 2 - 130, y: 606, w: 260, h: 52 };
  }

  drawEnd(game, escaped) {
    const ctx = this.ctx;
    ctx.fillStyle = escaped ? 'rgba(20,60,25,0.72)' : 'rgba(60,15,10,0.72)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.textAlign = 'center';
    ctx.fillStyle = escaped ? '#a8e063' : '#ff8a7a';
    ctx.font = 'bold 84px "Trebuchet MS", sans-serif';
    ctx.fillText(escaped ? 'ESCAPED!' : 'CAUGHT!', CANVAS_W / 2, 190);
    ctx.fillStyle = '#fff3d6';
    ctx.font = '26px "Trebuchet MS", sans-serif';
    if (escaped) {
      ctx.fillText('You made it to the woods — no Thanksgiving dinner for you!', CANVAS_W / 2, 250);
      ctx.fillText('The farmer is still searching the haystacks.', CANVAS_W / 2, 286);
    } else {
      ctx.fillText('The farmer got you… Thanksgiving dinner is served.', CANVAS_W / 2, 250);
      ctx.fillText('So close! The woods were just ahead.', CANVAS_W / 2, 286);
    }
    // Stats card.
    ctx.fillStyle = 'rgba(30,20,10,0.6)';
    ctx.beginPath();
    ctx.roundRect(CANVAS_W / 2 - 260, 330, 520, 130, 14);
    ctx.fill();
    ctx.fillStyle = '#ffd23e';
    ctx.font = 'bold 30px "Trebuchet MS", sans-serif';
    ctx.fillText(`FINAL SCORE  ${game.score}`, CANVAS_W / 2, 372);
    ctx.fillStyle = '#fff3d6';
    ctx.font = '22px "Trebuchet MS", sans-serif';
    ctx.fillText(
      `Distance ${Math.floor(game.world.distance)} m   •   Corn ${game.corn}   •   Best ${game.best}`,
      CANVAS_W / 2, 414,
    );
    // Restart button.
    ctx.fillStyle = '#e63946';
    ctx.beginPath();
    ctx.roundRect(CANVAS_W / 2 - 130, 500, 260, 52, 26);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px "Trebuchet MS", sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('↻  RUN AGAIN  (R)', CANVAS_W / 2, 527);
    game.restartButton = { x: CANVAS_W / 2 - 130, y: 500, w: 260, h: 52 };
  }
}
