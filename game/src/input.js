// Gobble Run — keyboard and mouse input.
// One job: turn raw key and pointer events into named, edge-triggered
// actions the game loop can ask about once per frame.

export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.pressed = new Set();
    this.mouse = { x: 0, y: 0, clicked: false, down: false };
    this.canvas = canvas;
    this.anyKey = false;

    window.addEventListener('keydown', (e) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
      if (!e.repeat) this.pressed.add(e.code);
      this.keys.add(e.code);
      this.anyKey = true;
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());

    canvas.addEventListener('pointerdown', (e) => {
      const r = canvas.getBoundingClientRect();
      this.mouse.x = (e.clientX - r.left) * (canvas.width / r.width);
      this.mouse.y = (e.clientY - r.top) * (canvas.height / r.height);
      this.mouse.clicked = true;
      this.mouse.down = true;
      this.anyKey = true;
    });
    window.addEventListener('pointerup', () => { this.mouse.down = false; });
    canvas.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      this.mouse.x = (e.clientX - r.left) * (canvas.width / r.width);
      this.mouse.y = (e.clientY - r.top) * (canvas.height / r.height);
    });
  }

  down(...codes) {
    return codes.some((c) => this.keys.has(c));
  }

  // True only on the frame the key went down.
  hit(...codes) {
    return codes.some((c) => this.pressed.has(c));
  }

  get jumpHit() {
    return this.hit('Space', 'ArrowUp', 'KeyW');
  }

  get duckHeld() {
    return this.down('ArrowDown', 'KeyS');
  }

  get burstHeld() {
    return this.down('ArrowRight', 'KeyD');
  }

  get slowHeld() {
    return this.down('ArrowLeft', 'KeyA');
  }

  get confirmHit() {
    return this.hit('Enter', 'NumpadEnter', 'Space');
  }

  get restartHit() {
    return this.hit('KeyR', 'Enter', 'NumpadEnter');
  }

  get muteHit() {
    return this.hit('KeyM');
  }

  // Click inside a canvas-space rectangle {x, y, w, h}.
  clickedIn(rect) {
    if (!this.mouse.clicked) return false;
    return this.mouse.x >= rect.x && this.mouse.x <= rect.x + rect.w &&
      this.mouse.y >= rect.y && this.mouse.y <= rect.y + rect.h;
  }

  get clickHit() {
    return this.mouse.clicked;
  }

  // Call at the end of every frame: edges live for one frame only.
  endFrame() {
    this.pressed.clear();
    this.mouse.clicked = false;
    this.anyKey = false;
  }
}
