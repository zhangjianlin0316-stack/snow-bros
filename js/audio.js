(function (SB) {
  'use strict';

  const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

  function noteFreq(token) {
    if (!token) return 0;
    let i = 0;
    const name = token[i++];
    let acc = 0;
    if (token[i] === '#') { acc = 1; i += 1; }
    else if (token[i] === 'b') { acc = -1; i += 1; }
    const oct = parseInt(token.slice(i), 10);
    const midi = (oct + 1) * 12 + SEMI[name] + acc;
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  const STAGE_LEAD = [
    'E5', null, 'G5', null, 'A5', 'G5', 'E5', 'D5',
    'C5', null, 'D5', 'E5', 'G5', null, null, null,
    'A5', null, 'C6', null, 'A5', 'G5', 'E5', 'G5',
    'F5', 'E5', 'D5', 'C5', 'D5', 'E5', null, null,
    'G5', null, 'A5', null, 'B5', 'A5', 'G5', 'E5',
    'D5', null, 'E5', 'G5', 'A5', null, null, null,
    'C6', null, 'A5', 'G5', 'E5', 'D5', 'C5', 'D5',
    'E5', 'G5', 'D5', 'C5', 'C5', null, null, null,
  ];

  const STAGE_BASS = [
    'C3', 'C3', 'G3', 'G3', 'A2', 'A2', 'E3', 'E3',
    'F2', 'F2', 'C3', 'G2', 'C3', 'C3', 'G2', 'G2',
    'A2', 'A2', 'E3', 'E3', 'F2', 'F2', 'G2', 'G2',
    'C3', 'C3', 'G2', 'G2', 'C3', null, 'G2', null,
  ];

  const TITLE_LEAD = [
    'G4', 'C5', 'E5', null, 'D5', 'C5', 'A4', 'G4',
    'E4', null, 'G4', 'C5', 'D5', 'E5', 'C5', null,
    'F4', 'A4', 'C5', null, 'B4', 'A4', 'G4', 'E4',
    'D4', 'G4', 'B4', 'A4', 'G4', null, null, null,
  ];

  const TITLE_BASS = [
    'C3', null, 'E3', null, 'F3', null, 'C3', 'G2',
    'A2', null, 'E3', null, 'F2', null, 'G2', 'C3',
  ];

  const BOSS_LEAD = [
    'A4', 'C5', 'E5', 'C5', 'D5', 'E5', 'C5', 'A4',
    'G4', 'B4', 'D5', 'B4', 'E5', null, 'D5', 'C5',
    'A4', 'E5', 'A5', 'E5', 'F5', 'E5', 'D5', 'C5',
    'B4', 'G4', 'A4', 'E4', 'A4', null, null, null,
  ];

  const BOSS_BASS = [
    'A2', 'A2', 'E2', 'E2', 'F2', 'F2', 'C3', 'C3',
    'G2', 'G2', 'D2', 'D2', 'A2', 'A2', 'E2', 'E2',
  ];

  function readMute() {
    try {
      return globalThis.localStorage && localStorage.getItem('snowbros-tribute-mute') === '1';
    } catch (err) {
      return false;
    }
  }

  function AudioEngine() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.noise = null;
    this.muted = readMute();
    this.mode = 'title';
    this.step = 0;
    this.nextAt = 0;
    this.tempo = 1;
    this.paused = false;
    this.failed = false;
  }

  AudioEngine.prototype.stepDur = function () {
    const base = this.mode === 'title' ? 0.17 : this.mode === 'boss' ? 0.112 : 0.125;
    return base / (this.tempo || 1);
  };

  AudioEngine.prototype.ensure = function () {
    if (this.failed) return false;
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(function () {});
      }
      return true;
    }
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AC) {
      this.failed = true;
      return false;
    }
    try {
      const ctx = new AC();
      const master = ctx.createGain();
      master.gain.value = this.muted ? 0 : 0.9;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -16;
      comp.knee.value = 10;
      comp.ratio.value = 5;
      comp.attack.value = 0.003;
      comp.release.value = 0.18;
      const music = ctx.createGain();
      music.gain.value = 0.42;
      const sfx = ctx.createGain();
      sfx.gain.value = 0.7;
      music.connect(comp);
      sfx.connect(comp);
      comp.connect(master);
      master.connect(ctx.destination);
      const len = Math.floor(ctx.sampleRate * 0.25);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1;
      this.ctx = ctx;
      this.master = master;
      this.musicGain = music;
      this.sfxGain = sfx;
      this.noise = buf;
      this.nextAt = ctx.currentTime + 0.05;
      return true;
    } catch (err) {
      this.failed = true;
      return false;
    }
  };

  AudioEngine.prototype.unlock = function () {
    this.ensure();
  };

  AudioEngine.prototype.toggle = function () {
    this.muted = !this.muted;
    try {
      if (globalThis.localStorage) {
        localStorage.setItem('snowbros-tribute-mute', this.muted ? '1' : '0');
      }
    } catch (err) { /* ignore */ }
    if (!this.muted) this.unlock();
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.9;
    return this.muted;
  };

  AudioEngine.prototype.setPaused = function (paused) {
    this.paused = !!paused;
    if (this.musicGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.musicGain.gain.cancelScheduledValues(now);
      this.musicGain.gain.setTargetAtTime(paused ? 0.0001 : 0.42, now, 0.03);
    }
  };

  AudioEngine.prototype.setMode = function (mode) {
    if (this.mode === mode) {
      this.step = 0;
      if (this.ctx) this.nextAt = this.ctx.currentTime + 0.06;
      return;
    }
    this.mode = mode;
    this.step = 0;
    if (this.ctx) this.nextAt = this.ctx.currentTime + 0.05;
  };

  AudioEngine.prototype.setTempo = function (tempo) {
    this.tempo = tempo || 1;
  };

  AudioEngine.prototype.tone = function (freq, time, dur, type, gain, dest, detune) {
    if (!freq || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const amp = this.ctx.createGain();
    osc.type = type || 'square';
    osc.frequency.setValueAtTime(freq, time);
    if (detune) osc.detune.setValueAtTime(detune, time);
    amp.gain.setValueAtTime(0.0001, time);
    amp.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), time + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, time + Math.max(0.03, dur));
    osc.connect(amp);
    amp.connect(dest || this.musicGain);
    osc.start(time);
    osc.stop(time + dur + 0.04);
  };

  AudioEngine.prototype.sweep = function (f0, f1, time, dur, type, gain, dest) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const amp = this.ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(f0, time);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, f1), time + dur);
    amp.gain.setValueAtTime(0.0001, time);
    amp.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), time + 0.01);
    amp.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    osc.connect(amp);
    amp.connect(dest || this.sfxGain);
    osc.start(time);
    osc.stop(time + dur + 0.03);
  };

  AudioEngine.prototype.noiseBurst = function (time, dur, freq, gain, type) {
    if (!this.ctx || !this.noise) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = this.ctx.createBiquadFilter();
    filter.type = type || 'highpass';
    filter.frequency.value = freq;
    const amp = this.ctx.createGain();
    amp.gain.setValueAtTime(Math.max(0.0002, gain), time);
    amp.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    src.connect(filter);
    filter.connect(amp);
    amp.connect(this.sfxGain);
    src.start(time);
    src.stop(time + dur + 0.02);
  };

  AudioEngine.prototype.playStep = function (time) {
    const lead = this.mode === 'boss' ? BOSS_LEAD : this.mode === 'title' ? TITLE_LEAD : STAGE_LEAD;
    const bass = this.mode === 'boss' ? BOSS_BASS : this.mode === 'title' ? TITLE_BASS : STAGE_BASS;
    const li = this.step % lead.length;
    const bi = this.step % bass.length;
    const lf = noteFreq(lead[li]);
    const bf = noteFreq(bass[bi]);
    const dur = this.stepDur() * 0.92;
    if (lf) {
      const wave = this.mode === 'title' ? 'triangle' : 'square';
      const g = this.mode === 'title' ? 0.05 : 0.045;
      this.tone(lf, time, dur, wave, g, this.musicGain, -6);
      this.tone(lf, time, dur, wave, g * 0.7, this.musicGain, 8);
    }
    if (bf) this.tone(bf, time, dur * 1.2, 'triangle', 0.06, this.musicGain, 0);
    if (this.mode === 'title') return;
    if (this.step % 8 === 0) this.sweep(150, 52, time, 0.1, 'sine', 0.12, this.musicGain);
    else if (this.step % 8 === 4) this.noiseBurst(time, 0.09, 1400, 0.04, 'bandpass');
    else if (this.step % 2 === 1) this.noiseBurst(time, 0.03, 5000, 0.025, 'highpass');
  };

  AudioEngine.prototype.update = function () {
    if (!this.ctx || this.muted || this.paused || this.failed) return;
    if (this.mode === 'silent') return;
    const now = this.ctx.currentTime;
    if (!this.nextAt || this.nextAt < now - 0.05) this.nextAt = now + 0.02;
    const horizon = now + 0.24;
    let guard = 0;
    while (this.nextAt < horizon && guard++ < 8) {
      this.playStep(this.nextAt);
      this.step += 1;
      this.nextAt += this.stepDur();
    }
  };

  AudioEngine.prototype.jingle = function (name) {
    if (!this.ensure() || this.muted) return;
    const t = this.ctx.currentTime + 0.02;
    const s = this.sfxGain;
    const line = name === 'over'
      ? ['A4', 'F4', 'D4', 'C4']
      : name === 'life'
        ? ['C5', 'E5', 'G5', 'C6']
        : name === 'victory'
          ? ['C5', 'E5', 'G5', 'C6', 'E6', 'G5', 'C6']
          : ['C5', 'E5', 'G5', 'C6', 'E6'];
    line.forEach(function (n, i) {
      this.tone(noteFreq(n), t + i * 0.11, 0.2, 'square', 0.06, s, 0);
    }, this);
  };

  AudioEngine.prototype.sfx = function (name, opt) {
    if (this.muted || this.failed) return;
    if (!this.ensure()) return;
    try {
      const t = this.ctx.currentTime;
      const s = this.sfxGain;
      if (name === 'shoot') {
        this.tone(920, t, 0.05, 'square', 0.035, s, 0);
        this.noiseBurst(t, 0.04, 2200, 0.04, 'highpass');
      } else if (name === 'jump') {
        this.sweep(620, 280, t, 0.12, 'square', 0.05, s);
      } else if (name === 'splat') {
        this.tone(360, t, 0.06, 'sine', 0.04, s, 0);
        this.noiseBurst(t, 0.05, 800, 0.04, 'bandpass');
      } else if (name === 'freeze') {
        ['C5', 'E5', 'G5'].forEach(function (n, i) {
          this.tone(noteFreq(n), t + i * 0.05, 0.14, 'square', 0.05, s, 0);
        }, this);
      } else if (name === 'kick') {
        this.sweep(200, 60, t, 0.14, 'sine', 0.1, s);
      } else if (name === 'bounce') {
        this.tone(240, t, 0.07, 'square', 0.04, s, 0);
      } else if (name === 'combo') {
        const step = (opt && opt.step) || 1;
        this.tone(noteFreq(['C5', 'E5', 'G5', 'B5', 'D6'][Math.min(4, step)]), t, 0.12, 'square', 0.06, s, 0);
      } else if (name === 'smash') {
        this.noiseBurst(t, 0.12, 600, 0.07, 'bandpass');
        this.sweep(500, 120, t, 0.16, 'triangle', 0.06, s);
      } else if (name === 'hurt') {
        this.sweep(440, 70, t, 0.28, 'sawtooth', 0.06, s);
      } else if (name === 'break') {
        this.noiseBurst(t, 0.14, 500, 0.06, 'bandpass');
        this.sweep(300, 90, t, 0.2, 'square', 0.04, s);
      } else if (name === 'potion') {
        ['C5', 'E5', 'G5', 'C6'].forEach(function (n, i) {
          this.tone(noteFreq(n), t + i * 0.06, 0.16, 'triangle', 0.06, s, 0);
        }, this);
      } else if (name === 'life') {
        this.jingle('life');
      } else if (name === 'hop') {
        this.tone(180, t, 0.05, 'sine', 0.03, s, 0);
      }
    } catch (err) { /* audio is optional */ }
  };

  SB.audio = new AudioEngine();
})(globalThis.SB = globalThis.SB || {});
