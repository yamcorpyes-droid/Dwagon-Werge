'use strict';

/* ==========================================================================
   13. SOUND: a tiny synth, so the game needs no audio files
   ========================================================================== */
const Sound = {
  ctx: null,
  muted: false,
  ensure() {
    if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; } }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },
  tone(freq, dur = 0.12, type = 'sine', vol = 0.1, delay = 0, slideTo = null) {
    if (this.muted || !this.ctx || booting) return;
    const c = this.ctx, t0 = c.currentTime + delay;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(c.destination);
    o.start(t0); o.stop(t0 + dur + 0.02);
  },
  merge(tier, bonus) {
    const f = [440, 523, 587, 659, 784, 880][Math.min(5, tier)];
    this.tone(f, .15, 'triangle', .1);
    this.tone(f * 1.5, .2, 'triangle', .08, .08);
    if (bonus) this.tone(f * 2, .3, 'triangle', .08, .16);
  },
  pop()   { this.tone(420, .08, 'sine', .08, 0, 720); },
  thud()  { this.tone(180, .12, 'sine', .1, 0, 90); },
  coin()  { this.tone(988, .07, 'square', .04); this.tone(1319, .14, 'square', .04, .06); },
  heal()  { this.tone(660, .35, 'sine', .06, 0, 1320); },
  bloom() { this.tone(784 + Math.random() * 200, .2, 'triangle', .05); },
  quest() { [523, 659, 784, 1047].forEach((f, k) => this.tone(f, .18, 'triangle', .07, k * .09)); },
};

function updateSoundBtn() { $('soundBtn').textContent = Sound.muted ? '🔇 Sound off' : '🔊 Sound on'; }
