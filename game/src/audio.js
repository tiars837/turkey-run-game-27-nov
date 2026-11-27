// Gobble Run — all sound, synthesized live with WebAudio.
// One job: gobbles, whooshes, thuds and a little banjo-pluck loop.
// No audio files: every sound is an oscillator shaped in code.

export class SoundBoard {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.musicTimer = null;
    this.musicStep = 0;
    this.musicOn = false;
  }

  ensure() {
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
      } catch {
        return; // no audio on this machine; the game plays on silent
      }
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  tone(freq, dur, type, vol, slideTo, delay = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol || 0.2, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  noise(dur, vol, lowpass, delay = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass || 1200;
    const gain = this.ctx.createGain();
    gain.gain.value = vol || 0.15;
    src.connect(filter).connect(gain).connect(this.ctx.destination);
    src.start(t0);
  }

  gobble() {
    // Two quick descending clucks, the turkey's signature.
    this.tone(520, 0.09, 'square', 0.12, 320);
    this.tone(430, 0.09, 'square', 0.12, 260, 0.1);
    this.tone(610, 0.07, 'square', 0.09, 380, 0.2);
  }

  jump() {
    this.noise(0.18, 0.1, 2400);
    this.tone(300, 0.16, 'sine', 0.1, 620);
  }

  land() {
    this.noise(0.08, 0.08, 700);
  }

  corn() {
    this.tone(880, 0.08, 'triangle', 0.16, 1320);
    this.tone(1320, 0.1, 'triangle', 0.1, 1760, 0.06);
  }

  stumble() {
    this.noise(0.22, 0.2, 500);
    this.tone(220, 0.2, 'sawtooth', 0.12, 110);
  }

  hit() {
    this.noise(0.25, 0.25, 900);
    this.tone(160, 0.3, 'sawtooth', 0.18, 60);
  }

  spotted() {
    // The farmer's "HEY!" — a sharp two-note alert.
    this.tone(660, 0.1, 'square', 0.12, 660);
    this.tone(880, 0.14, 'square', 0.12, 880, 0.11);
  }

  caught() {
    const notes = [392, 370, 349, 311];
    notes.forEach((f, i) => this.tone(f, 0.32, 'triangle', 0.18, f * 0.94, i * 0.3));
  }

  escaped() {
    const notes = [523, 659, 784, 1047, 1319];
    notes.forEach((f, i) => this.tone(f, 0.28, 'triangle', 0.16, f, i * 0.12));
    this.tone(1047, 0.6, 'sine', 0.1, 1047, 0.6);
  }

  click() {
    this.tone(740, 0.05, 'square', 0.08, 740);
  }

  startMusic() {
    if (this.musicOn || !this.ctx) return;
    this.musicOn = true;
    // A lazy banjo-pluck loop in C major pentatonic, one pluck a beat.
    const scale = [261.6, 293.7, 329.6, 392.0, 440.0, 523.3, 587.3, 659.3];
    const pattern = [0, 2, 4, 7, 4, 2, 5, 3, 0, 2, 4, 5, 7, 5, 4, 2];
    this.musicTimer = window.setInterval(() => {
      if (this.muted || !this.ctx) return;
      const f = scale[pattern[this.musicStep % pattern.length]];
      this.tone(f, 0.22, 'triangle', 0.05, f * 0.995);
      if (this.musicStep % 4 === 0) this.tone(f / 2, 0.3, 'sine', 0.045, f / 2);
      this.musicStep++;
    }, 240);
  }

  stopMusic() {
    if (this.musicTimer) window.clearInterval(this.musicTimer);
    this.musicTimer = null;
    this.musicOn = false;
  }
}
