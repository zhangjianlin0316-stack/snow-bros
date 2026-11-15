(function (SB) {
  'use strict';

  const IDLE = {
    left: false, right: false, up: false, down: false,
    jump: false, shoot: false, jumpPressed: false, shootPressed: false, aim: 0,
  };

  const COMBO = [200, 500, 1000, 2000, 4000, 8000, 12000, 20000];
  const LIFE_AT = [20000, 50000, 100000, 160000, 220000];

  function comboValue(i) {
    return COMBO[Math.min(COMBO.length - 1, i)];
  }

  function loadHigh() {
    try {
      if (!globalThis.localStorage) return 0;
      return parseInt(localStorage.getItem('snowbros-tribute-hiscore') || '0', 10) || 0;
    } catch (err) {
      return 0;
    }
  }

  function Game() {
    this.state = 'title';
    this.paused = false;
    this.time = 0;
    this.stage = 1;
    this.loop = 0;
    this.def = null;
    this.platforms = [];
    this.enemies = [];
    this.players = [];
    this.shots = [];
    this.projectiles = [];
    this.potions = [];
    this.particles = [];
    this.popups = [];
    this.flakes = [];
    this.shake = 0;
    this.flash = 0;
    this.introT = 0;
    this.clearT = 0;
    this.lock = 0;
    this.hintT = 0;
    this.clearBonus = 0;
    this.high = loadHigh();
    this.newRecord = false;
    this.playersN = 1;
    this.endless = false;
    this.testing = false;
    this.aiPause = false;
    this.themeIndex = 0;
    this.seed = 3;
    this.bg = null;
    this.platCanvas = null;
    this.spawnCols = [2, 17];
    this.pointerStart = 0;
    this.reduce = false;
    try {
      this.reduce = !!(globalThis.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch (err) { /* ignore */ }
    this.initFlakes();
    this.rebake();
  }

  Game.prototype.initFlakes = function () {
    const n = this.reduce ? 40 : 150;
    this.flakes = [];
    for (let i = 0; i < n; i += 1) {
      this.flakes.push({
        x: Math.random() * SB.W,
        y: Math.random() * SB.H,
        z: Math.random(),
        r: 2 + Math.random() * 8,
        sp: 30 + Math.random() * 150,
        drift: Math.random() * Math.PI * 2,
        kind: Math.random() > 0.88 ? 1 : 0,
      });
    }
  };

  Game.prototype.updateFlakes = function (dt) {
    for (let i = 0; i < this.flakes.length; i += 1) {
      const f = this.flakes[i];
      f.y += f.sp * (0.35 + f.z) * dt;
      f.x += Math.sin(this.time * 0.55 + f.drift) * 28 * dt * (0.4 + f.z);
      if (f.y > SB.H + 12) {
        f.y = -12;
        f.x = Math.random() * SB.W;
      }
      if (f.x < -20) f.x = SB.W + 10;
      if (f.x > SB.W + 20) f.x = -10;
    }
  };

  Game.prototype.rebake = function () {
    if (!SB.draw || !SB.draw.bakeBackground) {
      this.bg = null;
      this.platCanvas = null;
      return;
    }
    this.bg = SB.draw.bakeBackground(this.themeIndex, this.seed);
    this.platCanvas = this.platforms.length
      ? SB.draw.bakePlatforms(this.platforms, this.themeIndex, this.seed)
      : null;
  };

  Game.prototype.saveHigh = function () {
    if (this.testing) return;
    try {
      if (globalThis.localStorage) localStorage.setItem('snowbros-tribute-hiscore', String(this.high));
    } catch (err) { /* ignore */ }
  };

  Game.prototype.makePlayers = function (n) {
    this.players = [];
    for (let i = 0; i < n; i += 1) {
      this.players.push({
        id: i,
        name: i === 0 ? 'Nick' : 'Tom',
        palette: i === 0 ? 'nick' : 'tom',
        x: 0, y: 0, w: 108, h: 156,
        vx: 0, vy: 0, facing: i === 0 ? 1 : -1,
        onGround: false, coyote: 0,
        lives: 3, score: 0, alive: true, dying: 0, pendingOut: false,
        invuln: 2, balloon: 0,
        speedLv: 0, powerLv: 0, rangeLv: 0,
        shootCd: 0, shootAnim: 0, landT: 0,
        extraAt: 0,
      });
    }
  };

  Game.prototype.statsFor = function (type) {
    const late = this.stage >= 12 || this.loop > 0;
    if (type === 'boss') {
      const kind = this.def && this.def.bossKind ? this.def.bossKind : 1;
      return { w: 250, h: 246, snowMax: kind === 2 ? 16 : 12 };
    }
    if (type === 'hopper') return { w: 126, h: 116, snowMax: late ? 5 : 4 };
    if (type === 'wisp') return { w: 116, h: 124, snowMax: 4 };
    return { w: 120, h: 132, snowMax: late ? 5 : 4 };
  };

  Game.prototype.enemySpeed = function (e) {
    const mul = 1 + (this.stage - 1) * 0.028 + this.loop * 0.18;
    if (e.type === 'boss') return 165 * mul;
    if (e.type === 'wisp') return 0;
    return (148 + this.stage * 6) * mul;
  };

  Game.prototype.breakLimit = function () {
    return Math.max(3.2, 6.5 - this.stage * 0.11 - this.loop * 0.35);
  };

  Game.prototype.lowestCovering = function (col) {
    const x = SB.LEFT + (col + 0.5) * SB.TILE;
    let best = null;
    for (let i = 0; i < this.platforms.length; i += 1) {
      const p = this.platforms[i];
      if (x >= p.x && x <= p.x + p.w && (!best || p.y > best.y)) best = p;
    }
    return best || this.platforms[0];
  };

  Game.prototype.respawn = function (p) {
    const col = this.spawnCols[p.id] != null ? this.spawnCols[p.id] : this.spawnCols[0];
    const plat = this.lowestCovering(col);
    p.w = 108;
    p.h = 156;
    p.x = SB.LEFT + (col + 0.5) * SB.TILE - p.w / 2;
    p.y = plat.y - p.h;
    p.vx = 0;
    p.vy = 0;
    p.onGround = true;
    p.alive = true;
    p.dying = 0;
    p.pendingOut = false;
    p.invuln = Math.max(p.invuln || 0, 1.6);
    p.balloon = 0;
    p.facing = p.id === 0 ? 1 : -1;
  };

  Game.prototype.makeEnemy = function (type, col, row) {
    const stats = this.statsFor(type);
    const foot = SB.FLOOR_Y - row * SB.ROW_DY;
    const plat = this.platforms.find(function (p) {
      return p.r === row && col >= p.c && col < p.c + p.len;
    });
    const enemy = {
      type: type,
      x: SB.LEFT + col * SB.TILE + (SB.TILE - stats.w) / 2,
      y: foot - stats.h,
      w: stats.w,
      h: stats.h,
      baseW: stats.w,
      baseH: stats.h,
      vx: 0,
      vy: 0,
      facing: col > 10 ? -1 : 1,
      onGround: type !== 'wisp',
      snow: 0,
      snowMax: stats.snowMax,
      state: 'active',
      hurt: 0,
      touchCd: 0,
      breakTimer: 0,
      rollTime: 0,
      radius: type === 'boss' ? 128 : 64,
      spin: 0,
      contained: 1,
      combo: 0,
      homeX: 0,
      homeY: 0,
      homeSpan: plat ? Math.min(220, plat.w * 0.3) : 150,
      phase: Math.random() * Math.PI * 2,
      hopWait: 0.45 + Math.random() * 0.8,
      bossShot: 1.1 + Math.random(),
      kind: type === 'boss' && this.def ? this.def.bossKind : 1,
      trail: [],
      encaseT: 0,
      crack: 0,
      heat: 0,
      falls: 0,
      _gone: false,
    };
    enemy.homeX = enemy.x;
    enemy.homeY = enemy.y;
    enemy.vx = enemy.facing * this.enemySpeed(enemy);
    return enemy;
  };

  Game.prototype.start = function (n) {
    this.playersN = n;
    this.players = [];
    this.endless = false;
    this.newRecord = false;
    this.makePlayers(n);
    this.loadStage(1);
  };

  Game.prototype.consumeMenu = function (input) {
    this.pointerStart = 0;
    if (input) {
      input.start1 = false;
      input.start2 = false;
      input.pausePressed = false;
    }
    if (SB.input) {
      SB.input.start1 = false;
      SB.input.start2 = false;
      SB.input.pausePressed = false;
    }
  };

  Game.prototype.toTitle = function () {
    this.state = 'title';
    this.paused = false;
    this.enemies = [];
    this.shots = [];
    this.projectiles = [];
    this.potions = [];
    this.platforms = [];
    this.themeIndex = 0;
    this.seed = 3;
    this.rebake();
    SB.audio.setPaused(false);
    SB.audio.setMode('title');
  };

  Game.prototype.loadStage = function (n) {
    this.stage = n;
    const def = SB.stageDef(n);
    this.def = def;
    this.loop = def.loop;
    this.platforms = SB.buildLayout(def);
    this.themeIndex = def.theme;
    this.seed = n * 97 + 13;
    this.enemies = [];
    this.shots = [];
    this.projectiles = [];
    this.potions = [];
    this.particles = [];
    this.popups = [];
    this.shake = 0;
    this.paused = false;
    this.spawnCols = def.spawns || [2, 17];
    if (!this.players.length) this.makePlayers(this.playersN || 1);
    for (let i = 0; i < this.players.length; i += 1) {
      const p = this.players[i];
      if (p.lives <= 0) {
        p.alive = false;
        continue;
      }
      p.invuln = 1.5;
      this.respawn(p);
    }
    for (let i = 0; i < def.enemies.length; i += 1) {
      const e = def.enemies[i];
      this.enemies.push(this.makeEnemy(e[0], e[1], e[2]));
    }
    if (def.potion) {
      const type = def.potion[0];
      const col = def.potion[1];
      const row = def.potion[2];
      const y = SB.FLOOR_Y - row * SB.ROW_DY - 72;
      const x = SB.LEFT + (col + 0.5) * SB.TILE - 26;
      this.potions.push({ type: type, x: x, y: y, w: 52, h: 68, t: Math.random() * 3 });
    }
    this.rebake();
    this.state = 'intro';
    this.introT = 1.65;
    this.lock = 0.25;
    this.hintT = n === 1 ? 8 : 0;
    SB.audio.setPaused(false);
    SB.audio.setTempo(1 + this.loop * 0.06);
    SB.audio.setMode(def.boss ? 'boss' : 'stage');
  };

  Game.prototype.popup = function (x, y, text, color) {
    this.popups.push({ x: x, y: y, text: text, color: color || '#fff', life: 0.95, vy: -78 });
    if (this.popups.length > 24) this.popups.shift();
  };

  Game.prototype.burst = function (ent, color) {
    const cx = ent.x + (ent.w ? ent.w / 2 : 0);
    const cy = ent.y + (ent.h ? ent.h / 2 : 0);
    const n = this.reduce ? 6 : 16;
    for (let i = 0; i < n; i += 1) {
      const a = (Math.PI * 2 * i) / n + Math.random() * 0.2;
      const sp = 70 + Math.random() * 280;
      this.particles.push({
        x: cx, y: cy,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 90,
        life: 0.35 + Math.random() * 0.35,
        max: 0.7,
        r: 4 + Math.random() * 7,
        color: color || '#fff',
        g: 520,
      });
    }
  };

  Game.prototype.puff = function (x, y, n, color) {
    for (let i = 0; i < n; i += 1) {
      this.particles.push({
        x: x, y: y,
        vx: (Math.random() - 0.5) * 180,
        vy: (Math.random() - 0.6) * 160,
        life: 0.25 + Math.random() * 0.2,
        max: 0.45,
        r: 3 + Math.random() * 6,
        color: color || '#fff',
        g: 80,
      });
    }
  };

  Game.prototype.addScore = function (p, n, x, y, silent) {
    if (!p) p = this.players[0];
    if (!p || n <= 0) return;
    p.score += n;
    if (p.score > this.high) {
      this.high = p.score;
      this.newRecord = true;
      this.saveHigh();
    }
    while (p.extraAt < LIFE_AT.length && p.score >= LIFE_AT[p.extraAt]) {
      p.lives = Math.min(9, p.lives + 1);
      p.extraAt += 1;
      SB.audio.sfx('life');
      this.popup(x, y - 36, '1UP', '#ffe56b');
    }
    if (!silent) this.popup(x, y, String(n), n >= 2000 ? '#ffe56b' : '#f7fbff');
  };

  Game.prototype.nearestPlayer = function (x, y) {
    let best = null;
    let bestD = 1e12;
    for (let i = 0; i < this.players.length; i += 1) {
      const p = this.players[i];
      if (!p.alive || p.dying > 0) continue;
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
    return best || this.players[0];
  };

  Game.prototype.supported = function (ent) {
    const bottom = ent.y + ent.h;
    const x1 = ent.x + ent.w * 0.28;
    const x2 = ent.x + ent.w * 0.72;
    for (let i = 0; i < this.platforms.length; i += 1) {
      const p = this.platforms[i];
      if (bottom >= p.y - 3 && bottom <= p.y + 14 && x2 > p.x && x1 < p.x + p.w) return true;
    }
    return false;
  };

  Game.prototype.supportPlat = function (ent) {
    const bottom = ent.y + ent.h;
    const x = ent.x + ent.w / 2;
    let best = null;
    for (let i = 0; i < this.platforms.length; i += 1) {
      const p = this.platforms[i];
      if (x <= p.x || x >= p.x + p.w) continue;
      if (bottom < p.y - 8 || bottom > p.y + 22) continue;
      if (!best || p.y < best.y) best = p;
    }
    return best;
  };

  Game.prototype.stepActor = function (ent, dt, opt) {
    const gravity = opt.gravity != null ? opt.gravity : SB.GRAV;
    const maxFall = opt.maxFall != null ? opt.maxFall : SB.MAX_FALL;
    if (!ent.onGround) ent.vy = Math.min(maxFall, ent.vy + gravity * dt);
    ent.x += ent.vx * dt;
    if (opt.wrap) {
      const cx = ent.x + ent.w / 2;
      if (cx < SB.LEFT) ent.x += SB.FIELD_W;
      else if (cx > SB.RIGHT) ent.x -= SB.FIELD_W;
    }
    if (opt.bounceWalls) {
      if (ent.x < SB.LEFT && ent.vx <= 0) {
        ent.x = SB.LEFT;
        ent.vx = Math.max(500, Math.abs(ent.vx) * 0.88);
        ent.vy = -SB.JUMP * 0.98;
        ent.onGround = false;
        SB.audio.sfx('bounce');
      } else if (ent.x + ent.w > SB.RIGHT && ent.vx >= 0) {
        ent.x = SB.RIGHT - ent.w;
        ent.vx = -Math.max(500, Math.abs(ent.vx) * 0.88);
        ent.vy = -SB.JUMP * 0.98;
        ent.onGround = false;
        SB.audio.sfx('bounce');
      }
    }
    const prevBottom = ent.y + ent.h;
    ent.y += ent.vy * dt;
    let landed = false;
    if (ent.vy >= 0) {
      const bottom = ent.y + ent.h;
      const inset = Math.max(10, ent.w * 0.22);
      for (let i = 0; i < this.platforms.length; i += 1) {
        const plat = this.platforms[i];
        if (ent.x + ent.w - inset <= plat.x || ent.x + inset >= plat.x + plat.w) continue;
        const crossed = prevBottom <= plat.y + 12 && bottom >= plat.y;
        const near = bottom - plat.y <= Math.max(30, Math.abs(ent.vy) * dt + 20);
        if (crossed && near) {
          ent.y = plat.y - ent.h;
          ent.vy = 0;
          ent.onGround = true;
          landed = true;
          ent.landT = 0.12;
          break;
        }
      }
    }
    if (!landed) {
      if (ent.vy === 0 && this.supported(ent)) {
        ent.onGround = true;
        const plat = this.supportPlat(ent);
        if (plat) ent.y = plat.y - ent.h;
      } else ent.onGround = false;
    }
  };

  Game.prototype.fire = function (p) {
    if (!p.alive || p.dying > 0 || p.shootCd > 0) return;
    p.shootCd = Math.max(0.11, 0.2 - p.powerLv * 0.018);
    p.shootAnim = 0.14;
    const range = 560 + p.rangeLv * 300;
    const speed = 1120;
    const dir = p.facing || 1;
    this.shots.push({
      x: p.x + p.w / 2 + dir * (p.w * 0.48),
      y: p.y + p.h * 0.46,
      vx: dir * speed,
      r: 22 + p.powerLv * 8,
      power: 1 + p.powerLv,
      life: range / speed,
      max: range / speed,
      dead: false,
    });
    this.puff(p.x + p.w / 2 + dir * 36, p.y + p.h * 0.46, 5, '#ffffff');
    SB.audio.sfx('shoot');
  };

  Game.prototype.encase = function (e) {
    if (!e || e.state === 'snowball' || e._gone) return;
    const cx = e.x + e.w / 2;
    const bottom = e.y + e.h;
    e.state = 'snowball';
    e.radius = e.type === 'boss' ? 128 : 64;
    e.w = e.radius * 2;
    e.h = e.radius * 2;
    e.x = cx - e.radius;
    e.y = bottom - e.h;
    e.vx = 0;
    e.vy = 0;
    e.snow = e.snowMax;
    e.breakTimer = 0;
    e.rollTime = 0;
    e.combo = 0;
    e.contained = 1;
    e.spin = 0;
    e.trail = [];
    e.encaseT = 0.28;
    e.onGround = true;
    const plat = this.supportPlat(e);
    if (plat) e.y = plat.y - e.h;
    SB.audio.sfx('freeze');
    this.burst(e, '#ffffff');
    this.shake = Math.min(14, this.shake + (e.type === 'boss' ? 10 : 3));
    this.addScore(this.nearestPlayer(cx, bottom), e.type === 'boss' ? 500 : 100, cx, e.y);
  };

  Game.prototype.freeEnemy = function (e) {
    const cx = e.x + e.w / 2;
    const bottom = e.y + e.h;
    e.state = 'active';
    e.w = e.baseW;
    e.h = e.baseH;
    e.x = cx - e.w / 2;
    e.y = bottom - e.h;
    e.snow = 0;
    e.vx = (e.facing || 1) * this.enemySpeed(e);
    e.vy = -240;
    e.onGround = false;
    e.breakTimer = 0;
    e.rollTime = 0;
    e.crack = 0;
    SB.audio.sfx('break');
    this.burst(e, '#d5ecff');
  };

  Game.prototype.smashSnowball = function (e, award) {
    if (!e || e._gone) return;
    e._gone = true;
    const x = e.x + e.w / 2;
    const y = e.y + e.h / 2;
    if (award) {
      const n = comboValue(e.combo);
      e.combo += 1;
      const label = e.combo > 1 ? n + '  x' + e.combo : String(n);
      const p = this.nearestPlayer(x, y);
      if (p) {
        p.score += n;
        if (p.score > this.high) {
          this.high = p.score;
          this.newRecord = true;
          this.saveHigh();
        }
        while (p.extraAt < LIFE_AT.length && p.score >= LIFE_AT[p.extraAt]) {
          p.lives = Math.min(9, p.lives + 1);
          p.extraAt += 1;
          SB.audio.sfx('life');
          this.popup(x, y - 36, '1UP', '#ffe56b');
        }
      }
      this.popup(x, y, label, n >= 2000 ? '#ffe56b' : '#f7fbff');
    }
    if (e.type === 'boss') {
      this.addScore(this.nearestPlayer(x, y), 8000, x, y - 20);
      this.shake = 22;
      this.flash = 0.45;
    }
    SB.audio.sfx('smash');
    this.burst(e, '#e7f6ff');
    this.enemies = this.enemies.filter(function (item) { return item !== e; });
    if (this.state === 'play') this.checkClear();
  };

  Game.prototype.awardCombo = function (ball, x, y) {
    const n = comboValue(ball.combo);
    ball.combo += 1;
    const text = ball.combo > 1 ? n + '  x' + ball.combo : String(n);
    const p = this.nearestPlayer(x, y);
    if (p) {
      p.score += n;
      if (p.score > this.high) {
        this.high = p.score;
        this.newRecord = true;
        this.saveHigh();
      }
      while (p.extraAt < LIFE_AT.length && p.score >= LIFE_AT[p.extraAt]) {
        p.lives = Math.min(9, p.lives + 1);
        p.extraAt += 1;
        SB.audio.sfx('life');
        this.popup(x, y - 40, '1UP', '#ffe56b');
      }
    }
    this.popup(x, y, text, n >= 2000 ? '#ffe56b' : '#ffffff');
    SB.audio.sfx('combo', { step: ball.combo });
    this.shake = Math.min(18, 3 + ball.combo * 1.4);
  };

  Game.prototype.recoverEnemy = function (e) {
    e.falls += 1;
    e.x = e.homeX;
    e.y = e.homeY;
    e.vx = (e.facing || 1) * this.enemySpeed(e);
    e.vy = 0;
    e.onGround = e.type !== 'wisp';
    e.snow = 0;
  };

  Game.prototype.landingOk = function (ent, vx) {
    const air = 0.86;
    const x = ent.x + ent.w / 2 + vx * air;
    const foot = ent.y + ent.h;
    for (let i = 0; i < this.platforms.length; i += 1) {
      const p = this.platforms[i];
      if (x <= p.x + 12 || x >= p.x + p.w - 12) continue;
      if (Math.abs(p.y - foot) <= SB.ROW_DY + 24) return true;
    }
    return false;
  };

  Game.prototype.ai = function (e, dt) {
    if (e.type === 'wisp') return;
    if (e.type === 'hopper') {
      if (e.onGround) {
        e.vx = 0;
        e.hopWait -= dt;
        if (e.hopWait <= 0) {
          const target = this.nearestPlayer(e.x, e.y);
          let dir =  e.facing || 1;
          if (target) dir = Math.sign((target.x + target.w / 2) - (e.x + e.w / 2)) || dir;
          let vx = dir * (260 + this.stage * 4);
          if (!this.landingOk(e, vx)) {
            if (this.landingOk(e, -vx)) vx = -vx;
            else vx = dir * 70;
          }
          e.facing = Math.sign(vx) || dir;
          e.vx = vx;
          e.vy = -SB.JUMP * (0.84 + Math.random() * 0.08);
          e.onGround = false;
          e.hopWait = Math.max(0.45, 1.05 - this.stage * 0.02) + Math.random() * 0.55;
          SB.audio.sfx('hop');
        }
      }
    } else {
      const speed = this.enemySpeed(e);
      if (e.onGround) {
        const ahead = e.x + e.w / 2 + e.facing * (e.w * 0.55 + 8);
        const foot = e.y + e.h + 4;
        let on = false;
        for (let i = 0; i < this.platforms.length; i += 1) {
          const p = this.platforms[i];
          if (ahead > p.x + 8 && ahead < p.x + p.w - 8 && Math.abs(p.y - foot) < 24) {
            on = true;
            break;
          }
        }
        const hitL = e.x <= SB.LEFT + 2 && e.facing < 0;
        const hitR = e.x + e.w >= SB.RIGHT - 2 && e.facing > 0;
        if (!on || hitL || hitR) {
          e.facing *= -1;
          e.x = SB.clamp(e.x, SB.LEFT, SB.RIGHT - e.w);
        }
      }
      e.vx = e.facing * speed;
      if (e.type === 'boss') {
        e.bossShot -= dt;
        if (e.bossShot <= 0) {
          e.bossShot = (e.kind === 2 ? 1.25 : 1.95) * (this.loop ? 0.85 : 1);
          this.bossVolley(e);
        }
      }
    }
  };

  Game.prototype.bossVolley = function (e) {
    const target = this.nearestPlayer(e.x, e.y);
    const ox = e.x + e.w / 2;
    const oy = e.y + e.h * 0.45;
    let base = Math.PI / 2;
    if (target && target.alive) {
      base = Math.atan2((target.y + target.h * 0.4) - oy, (target.x + target.w / 2) - ox);
    }
    const count = e.kind === 2 ? 5 : 3;
    const spread = e.kind === 2 ? 0.85 : 0.55;
    for (let i = 0; i < count; i += 1) {
      const t = count === 1 ? 0 : (i / (count - 1) - 0.5);
      const ang = base + t * spread;
      const sp = 380 + this.stage * 4;
      this.projectiles.push({
        x: ox, y: oy,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp,
        r: 18,
        life: 4.2,
        spin: Math.random() * 6,
        dead: false,
      });
    }
    SB.audio.sfx('shoot');
  };

  Game.prototype.updateWisp = function (e, dt) {
    e.phase += dt * (0.75 + this.stage * 0.012);
    const tx = e.homeX + Math.sin(e.phase) * e.homeSpan;
    const ty = e.homeY + Math.cos(e.phase * 0.82) * 48;
    e.x += (tx - e.x) * Math.min(1, dt * 1.5);
    e.y += (ty - e.y) * Math.min(1, dt * 1.5);
    e.facing = Math.sin(e.phase) >= 0 ? 1 : -1;
    e.y = SB.clamp(e.y, SB.PLAY_TOP + 8, SB.FLOOR_Y - e.h - 30);
  };

  Game.prototype.updateSnowball = function (e, dt) {
    const limit = this.breakLimit() * (e.type === 'boss' ? 1.6 : 1);
    const max = 1080 + e.contained * 36;
    if (e.onGround && Math.abs(e.vx) >= 55) {
      const dir = Math.sign(e.vx);
      e.vx = SB.clamp(e.vx + dir * 300 * dt, -max, max);
      e.rollTime += dt;
      e.breakTimer = 0;
    } else if (e.onGround && Math.abs(e.vx) < 55 && Math.abs(e.vy) < 40) {
      e.vx = 0;
      e.breakTimer += dt;
      if (e.breakTimer > limit) {
        this.freeEnemy(e);
        return;
      }
    } else e.breakTimer = 0;
    e.crack = limit ? e.breakTimer / limit : 0;
    e.heat = e.rollTime / 8.5;
    if (e.rollTime > 8.5) {
      this.smashSnowball(e, true);
      return;
    }
    this.stepActor(e, dt, { bounceWalls: true });
    e.spin += e.vx * dt / Math.max(24, e.radius);
    if (!e.trail) e.trail = [];
    if (Math.abs(e.vx) > 80) {
      e.trail.push({ x: e.x + e.w / 2, y: e.y + e.h / 2 });
      if (e.trail.length > 8) e.trail.shift();
    } else if (e.trail.length) e.trail.shift();
    if (e.y > SB.H + 30) this.smashSnowball(e, true);
  };

  Game.prototype.updateEnemy = function (e, dt) {
    if (e._gone) return;
    e.hurt = Math.max(0, e.hurt - dt);
    e.touchCd = Math.max(0, (e.touchCd || 0) - dt);
    e.encaseT = Math.max(0, (e.encaseT || 0) - dt);
    if (e.state === 'snowball') {
      this.updateSnowball(e, dt);
      return;
    }
    if (!this.aiPause) {
      if (e.type === 'wisp') this.updateWisp(e, dt);
      else {
        this.ai(e, dt);
        this.stepActor(e, dt, {});
      }
    } else if (e.type !== 'wisp') {
      e.vx = 0;
      this.stepActor(e, dt, {});
    }
    if (e.state === 'active' && e.y > SB.H + 50) this.recoverEnemy(e);
  };

  Game.prototype.tryKick = function (p) {
    if (!p.alive || p.dying > 0) return;
    for (let i = 0; i < this.enemies.length; i += 1) {
      const e = this.enemies[i];
      if (e.state !== 'snowball' || e._gone) continue;
      if (!this.overlap(p, e, 8)) continue;
      if (Math.abs(e.vx) > 260 && Math.abs(e.vy) < 500) {
        p.x += Math.sign(e.vx || 1) * 10;
        continue;
      }
      if (Math.abs(e.vx) > 200) continue;
      let dir = 0;
      if (Math.abs(p.vx) > 30) dir = Math.sign(p.vx);
      else dir = Math.sign((e.x + e.w / 2) - (p.x + p.w / 2)) || p.facing || 1;
      e.vx = dir * (700 + p.speedLv * 55);
      e.vy = -170;
      e.onGround = false;
      e.breakTimer = 0;
      SB.audio.sfx('kick');
      this.shake = Math.min(10, this.shake + 3);
    }
  };

  Game.prototype.overlap = function (a, b, pad) {
    const p = pad || 0;
    return a.x - p < b.x + b.w && a.x + a.w + p > b.x
      && a.y - p < b.y + b.h && a.y + a.h + p > b.y;
  };

  Game.prototype.circleRect = function (cx, cy, r, rect) {
    const x = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
    const y = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
    const dx = cx - x;
    const dy = cy - y;
    return dx * dx + dy * dy <= r * r;
  };

  Game.prototype.bodyBox = function (e) {
    const m = e.type === 'boss' ? 24 : 16;
    return { x: e.x + m, y: e.y + 8, w: Math.max(8, e.w - m * 2), h: Math.max(8, e.h - 14) };
  };

  Game.prototype.hitbox = function (p) {
    if (p.balloon > 0) return { x: p.x - 24, y: p.y - 28, w: p.w + 48, h: p.h + 36 };
    return { x: p.x + 18, y: p.y + 18, w: p.w - 36, h: p.h - 28 };
  };

  Game.prototype.hurtPlayer = function (p) {
    if (!p.alive || p.dying > 0 || p.invuln > 0 || p.balloon > 0) return;
    p.lives -= 1;
    p.dying = 0.78;
    p.vy = -860;
    p.vx = 0;
    p.speedLv = 0;
    p.powerLv = 0;
    p.rangeLv = 0;
    p.balloon = 0;
    p.onGround = false;
    if (p.lives <= 0) p.pendingOut = true;
    SB.audio.sfx('hurt');
    this.shake = 12;
  };

  Game.prototype.stomp = function (p, e) {
    if (e.touchCd > 0) return;
    e.touchCd = 0.32;
    if (e.type === 'boss') {
      e.snow += 1;
      e.hurt = 0.12;
      this.puff(e.x + e.w / 2, e.y + 20, 6, '#fff');
      if (e.snow >= e.snowMax) this.encase(e);
      return;
    }
    this.addScore(p, 500, e.x + e.w / 2, e.y);
    this.burst(e, '#fff');
    e._gone = true;
    SB.audio.sfx('smash');
  };

  Game.prototype.collect = function (p, pot) {
    if (pot.dead) return;
    pot.dead = true;
    this.addScore(p, 1000, pot.x, pot.y);
    if (pot.type === 'red') p.speedLv = Math.min(3, p.speedLv + 1);
    else if (pot.type === 'blue') p.powerLv = Math.min(3, p.powerLv + 1);
    else if (pot.type === 'yellow') p.rangeLv = Math.min(3, p.rangeLv + 1);
    else if (pot.type === 'green') p.balloon = 8;
    SB.audio.sfx('potion');
    this.flash = 0.22;
    const colors = { red: '#ff5a6a', blue: '#4aa3ff', yellow: '#ffd15a', green: '#49e6a0' };
    this.burst(pot, colors[pot.type] || '#fff');
  };

  Game.prototype.circlesTouch = function (a, b) {
    const ax = a.x + a.w / 2;
    const ay = a.y + a.h / 2;
    const bx = b.x + b.w / 2;
    const by = b.y + b.h / 2;
    const ra = a.state === 'snowball' ? a.radius : a.w * 0.42;
    const rb = b.state === 'snowball' ? b.radius : b.w * 0.42;
    const dx = ax - bx;
    const dy = ay - by;
    return dx * dx + dy * dy < (ra + rb) * (ra + rb);
  };

  Game.prototype.growBall = function (ball) {
    if (ball.type === 'boss') return;
    const cx = ball.x + ball.w / 2;
    const bottom = ball.y + ball.h;
    ball.radius = Math.min(168, ball.radius + 10);
    ball.w = ball.radius * 2;
    ball.h = ball.radius * 2;
    ball.x = cx - ball.radius;
    ball.y = bottom - ball.h;
  };

  Game.prototype.snowballHits = function () {
    const list = this.enemies.slice();
    for (let i = 0; i < list.length; i += 1) {
      const ball = list[i];
      if (!ball || ball._gone || ball.state !== 'snowball') continue;
      if (Math.abs(ball.vx) < 90 && Math.abs(ball.vy) < 90) continue;
      for (let j = 0; j < list.length; j += 1) {
        const other = list[j];
        if (!other || other === ball || other._gone) continue;
        if (!this.circlesTouch(ball, other)) continue;
        if (other.state === 'active') {
          if (other.type === 'boss') {
            this.awardCombo(ball, other.x + other.w / 2, other.y);
            other.snow = Math.min(other.snowMax, other.snow + 4);
            other.hurt = 0.16;
            if (other.snow >= other.snowMax) this.encase(other);
            this.smashSnowball(ball, true);
          } else {
            this.awardCombo(ball, other.x + other.w / 2, other.y);
            this.burst(other, '#ffffff');
            other._gone = true;
            ball.contained += 1;
            this.growBall(ball);
            ball.vx *= 1.06;
            ball.rollTime = Math.max(0, ball.rollTime - 1.3);
            SB.audio.sfx('smash');
          }
          break;
        }
        if (other.state === 'snowball') {
          const keep = ball.type === 'boss' ? ball : other.type === 'boss' ? other : (ball.radius >= other.radius ? ball : other);
          const drop = keep === ball ? other : ball;
          this.awardCombo(keep, drop.x, drop.y);
          keep.contained += drop.contained;
          keep.vx = (Math.abs(ball.vx) > Math.abs(other.vx) ? ball.vx : other.vx) * 1.04;
          if (keep.type !== 'boss') this.growBall(keep);
          drop._gone = true;
          this.burst(drop, '#e7f4ff');
          break;
        }
      }
    }
    if (this.enemies.some(function (e) { return e._gone; })) {
      this.enemies = this.enemies.filter(function (e) { return !e._gone; });
      this.checkClear();
    }
  };

  Game.prototype.checkClear = function () {
    if (this.state !== 'play') return;
    if (this.enemies.length === 0) this.beginClear();
  };

  Game.prototype.beginClear = function () {
    if (this.state !== 'play') return;
    this.state = 'clear';
    this.clearT = 3.15;
    this.clearBonus = 2000 + this.stage * 500;
    for (let i = 0; i < this.players.length; i += 1) {
      const p = this.players[i];
      if (p.alive && p.dying <= 0) this.addScore(p, this.clearBonus, p.x + p.w / 2, p.y, true);
    }
    this.flash = 0.35;
    this.shake = 6;
    SB.audio.setMode('silent');
    SB.audio.jingle('clear');
  };

  Game.prototype.advance = function () {
    const finishedArc = this.stage % 20 === 0 && !this.endless;
    if (finishedArc) {
      this.state = 'victory';
      SB.audio.setMode('title');
      SB.audio.jingle('victory');
      return;
    }
    this.loadStage(this.stage + 1);
  };

  Game.prototype.checkOver = function () {
    if (!this.players.length) return;
    const allGone = this.players.every(function (p) { return !p.alive && p.dying <= 0; });
    if (!allGone) return;
    this.state = 'over';
    this.saveHigh();
    SB.audio.setMode('silent');
    SB.audio.jingle('over');
  };

  Game.prototype.updatePlayer = function (p, inp, dt) {
    if (!p.alive && p.dying <= 0) return;
    p.shootCd = Math.max(0, p.shootCd - dt);
    p.shootAnim = Math.max(0, p.shootAnim - dt);
    p.landT = Math.max(0, (p.landT || 0) - dt);
    p.invuln = Math.max(0, p.invuln - dt);
    if (p.balloon > 0) p.balloon = Math.max(0, p.balloon - dt);
    if (p.dying > 0) {
      p.dying -= dt;
      p.vy = Math.min(SB.MAX_FALL, p.vy + SB.GRAV * dt);
      p.y += p.vy * dt;
      p.x += p.vx * dt;
      if (p.dying <= 0) {
        if (p.pendingOut || p.lives <= 0) {
          p.alive = false;
          p.dying = 0;
          this.checkOver();
        } else this.respawn(p);
      }
      return;
    }
    if (this.lock > 0) inp = IDLE;
    const speed = 560 * (1 + 0.22 * p.speedLv);
    if (inp.left && !inp.right) {
      p.vx = -speed;
      p.facing = -1;
    } else if (inp.right && !inp.left) {
      p.vx = speed;
      p.facing = 1;
    } else if (p.onGround) p.vx = 0;
    else p.vx *= 0.86;
    if (inp.shoot && inp.aim) p.facing = inp.aim;
    if (p.onGround) p.coyote = 0.1;
    else p.coyote = Math.max(0, p.coyote - dt);
    if (inp.jumpPressed && p.balloon <= 0 && (p.onGround || p.coyote > 0)) {
      p.vy = -SB.JUMP;
      p.onGround = false;
      p.coyote = 0;
      SB.audio.sfx('jump');
    } else if (p.balloon > 0 && (inp.jumpPressed || inp.jump)) {
      p.vy = Math.min(p.vy, -560);
    }
    if (inp.shoot) this.fire(p);
    this.stepActor(p, dt, {
      wrap: true,
      gravity: p.balloon > 0 ? 760 : SB.GRAV,
      maxFall: p.balloon > 0 ? 280 : SB.MAX_FALL,
    });
    if (p.y < SB.PLAY_TOP - 10) {
      p.y = SB.PLAY_TOP - 10;
      if (p.vy < 0) p.vy = 0;
    }
    if (p.y > SB.H + 10) this.hurtPlayer(p);
    this.tryKick(p);
  };

  Game.prototype.updatePlay = function (dt) {
    const inputs = [SB.input && SB.input.p1 ? SB.input.p1 : IDLE, SB.input && SB.input.p2 ? SB.input.p2 : IDLE];
    for (let i = 0; i < this.players.length; i += 1) this.updatePlayer(this.players[i], inputs[i] || IDLE, dt);
    if (this.state !== 'play') return;
    const list = this.enemies.slice();
    for (let i = 0; i < list.length; i += 1) this.updateEnemy(list[i], dt);
    this.enemies = this.enemies.filter(function (e) { return !e._gone; });
    if (this.state !== 'play') return;

    for (let i = 0; i < this.shots.length; i += 1) {
      const s = this.shots[i];
      s.life -= dt;
      s.x += s.vx * dt;
      if (s.x < SB.LEFT) s.x += SB.FIELD_W;
      else if (s.x > SB.RIGHT) s.x -= SB.FIELD_W;
      if (s.life <= 0) {
        s.dead = true;
        continue;
      }
      for (let j = 0; j < this.enemies.length; j += 1) {
        const e = this.enemies[j];
        if (e._gone || e.state !== 'active') continue;
        if (!this.circleRect(s.x, s.y, s.r, this.bodyBox(e))) continue;
        e.snow += s.power;
        e.hurt = 0.1;
        s.dead = true;
        this.puff(s.x, s.y, 7, '#ffffff');
        if (e.snow >= e.snowMax) this.encase(e);
        else SB.audio.sfx('splat');
        break;
      }
      if (!s.dead) {
        for (let j = 0; j < this.projectiles.length; j += 1) {
          const pr = this.projectiles[j];
          if (pr.dead) continue;
          if (Math.hypot(pr.x - s.x, pr.y - s.y) < s.r + pr.r) {
            pr.dead = true;
            s.dead = true;
            this.puff(pr.x, pr.y, 5, '#d7f1ff');
            break;
          }
        }
      }
    }
    this.shots = this.shots.filter(function (s) { return !s.dead; });
    if (this.state !== 'play') return;
    this.snowballHits();
    if (this.state !== 'play') return;

    for (let i = 0; i < this.projectiles.length; i += 1) {
      const pr = this.projectiles[i];
      pr.life -= dt;
      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;
      pr.vy += 420 * dt;
      pr.spin += dt * 5;
      if (pr.life <= 0 || pr.y > SB.H + 20 || pr.x < SB.LEFT - 80 || pr.x > SB.RIGHT + 80) pr.dead = true;
      if (pr.dead) continue;
      for (let j = 0; j < this.platforms.length; j += 1) {
        const plat = this.platforms[j];
        if (pr.vy > 0 && pr.x > plat.x && pr.x < plat.x + plat.w && pr.y >= plat.y && pr.y <= plat.y + 28) {
          pr.dead = true;
          break;
        }
      }
    }

    for (let i = 0; i < this.players.length; i += 1) {
      const p = this.players[i];
      if (!p.alive || p.dying > 0) continue;
      for (let j = 0; j < this.enemies.length; j += 1) {
        const e = this.enemies[j];
        if (e._gone || e.state !== 'active') continue;
        if (!this.overlap(this.hitbox(p), e, 0)) continue;
        if (p.balloon > 0) this.stomp(p, e);
        else {
          this.hurtPlayer(p);
          break;
        }
      }
      if (p.dying > 0 || p.balloon > 0) continue;
      if (p.invuln > 0) continue;
      for (let j = 0; j < this.projectiles.length; j += 1) {
        const pr = this.projectiles[j];
        if (pr.dead) continue;
        const dx = pr.x - (p.x + p.w / 2);
        const dy = pr.y - (p.y + p.h * 0.42);
        if (dx * dx + dy * dy < (pr.r + 34) * (pr.r + 34)) {
          pr.dead = true;
          this.hurtPlayer(p);
          break;
        }
      }
    }
    this.enemies = this.enemies.filter(function (e) { return !e._gone; });

    for (let i = 0; i < this.potions.length; i += 1) {
      const pot = this.potions[i];
      pot.t += dt;
      for (let j = 0; j < this.players.length; j += 1) {
        const p = this.players[j];
        if (!p.alive || p.dying > 0) continue;
        if (this.overlap(p, pot, 6)) this.collect(p, pot);
      }
    }
    this.potions = this.potions.filter(function (pot) { return !pot.dead; });
    this.projectiles = this.projectiles.filter(function (pr) { return !pr.dead; });
    this.checkClear();
  };

  Game.prototype.updateFx = function (dt) {
    this.updateFlakes(dt);
    for (let i = 0; i < this.particles.length; i += 1) {
      const q = this.particles[i];
      q.life -= dt;
      q.vy += (q.g || 0) * dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
    }
    this.particles = this.particles.filter(function (q) { return q.life > 0; });
    if (this.particles.length > 420) this.particles.splice(0, this.particles.length - 420);
    for (let i = 0; i < this.popups.length; i += 1) {
      const pop = this.popups[i];
      pop.life -= dt;
      pop.y += pop.vy * dt;
    }
    this.popups = this.popups.filter(function (pop) { return pop.life > 0; });
    this.shake = Math.max(0, this.shake - dt * 22);
    this.flash = Math.max(0, this.flash - dt);
    this.hintT = Math.max(0, this.hintT - dt);
    this.lock = Math.max(0, this.lock - dt);
  };

  Game.prototype.update = function (dt) {
    this.time += dt;
    const input = SB.input || {};
    if (this.state === 'title') {
      this.updateFlakes(dt);
      if (this.pointerStart === 1 || input.start1) {
        this.consumeMenu(input);
        this.start(1);
      } else if (this.pointerStart === 2 || input.start2) {
        this.consumeMenu(input);
        this.start(2);
      }
      this.pointerStart = 0;
      return;
    }
    if (!input.pausePressed) this._pauseLatched = false;
    else if (!this._pauseLatched && (this.state === 'play' || this.state === 'intro' || this.paused)) {
      this.paused = !this.paused;
      SB.audio.setPaused(this.paused);
      this._pauseLatched = true;
      input.pausePressed = false;
    }
    if (this.state === 'victory') {
      this.updateFlakes(dt);
      if (input.start1 || this.pointerStart) {
        this.endless = true;
        this.consumeMenu(input);
        this.loadStage(this.stage + 1);
      } else if (input.pausePressed) {
        this.consumeMenu(input);
        this.toTitle();
      }
      return;
    }
    if (this.state === 'over') {
      this.updateFlakes(dt);
      if (input.start1 || input.start2 || this.pointerStart) {
        this.consumeMenu(input);
        this.toTitle();
      }
      return;
    }
    if (this.paused) {
      this.updateFlakes(dt);
      return;
    }
    if (this.state === 'intro') {
      this.introT -= dt;
      this.updateFx(dt);
      if (this.introT <= 0) {
        this.state = 'play';
        this.lock = 0.28;
      }
      return;
    }
    if (this.state === 'clear') {
      this.clearT -= dt;
      this.updateFx(dt);
      if (this.clearT <= 0) this.advance();
      return;
    }
    if (this.state === 'play') {
      this.updatePlay(dt);
      this.updateFx(dt);
    }
  };

  SB.Game = Game;

  SB.selfTest = function () {
    const errors = [];
    const log = [];
    function say(msg) { log.push(msg); }
    SB.validateAll().forEach(function (err) { errors.push(err); });
    if (!SB.input) SB.input = {};
    const idle = {
      left: false, right: false, up: false, down: false,
      jump: false, shoot: false, jumpPressed: false, shootPressed: false, aim: 0,
    };
    SB.input.p1 = idle;
    SB.input.p2 = idle;
    SB.input.pausePressed = false;
    SB.input.start1 = false;
    SB.input.start2 = false;

    const game = new SB.Game();
    game.testing = true;
    game.start(1);
    game.aiPause = true;
    game.state = 'play';
    game.lock = 0;
    const player = game.players[0];
    player.invuln = 999;
    for (let i = 0; i < 30; i += 1) game.update(1 / 60);
    if (!player.onGround) errors.push('player not grounded at start, y=' + player.y);
    const y0 = player.y;
    SB.input.p1 = {
      left: false, right: false, up: false, down: false,
      jump: true, shoot: false, jumpPressed: true, shootPressed: false, aim: 0,
    };
    game.update(1 / 60);
    if (!(player.vy < -100)) errors.push('jump did not leave the ground vy=' + player.vy);
    SB.input.p1 = idle;
    let apex = player.y;
    let landed = false;
    for (let i = 0; i < 180; i += 1) {
      game.update(1 / 60);
      if (player.y < apex) apex = player.y;
      if (player.onGround && i > 8) {
        landed = true;
        break;
      }
    }
    const rose = y0 - apex;
    if (rose < SB.ROW_DY) errors.push('jump too low ' + rose.toFixed(1));
    if (!landed) errors.push('player did not land');

    const foe = game.enemies.find(function (e) { return e.state === 'active'; });
    if (!foe) errors.push('no enemy to encase');
    else {
      player.x = foe.x - 220;
      player.y = foe.y + foe.h - player.h;
      player.facing = 1;
      player.onGround = true;
      player.vy = 0;
      player.invuln = 999;
      game.aiPause = true;
      for (let n = 0; n < 8 && foe.state === 'active' && !foe._gone; n += 1) {
        game.fire(player);
        for (let f = 0; f < 45; f += 1) game.update(1 / 60);
      }
      if (foe.state !== 'snowball') errors.push('failed to encase snow=' + foe.snow + ' state=' + foe.state);
      else {
        const before = player.score;
        player.x = foe.x - player.w + 24;
        player.y = foe.y + foe.h - player.h;
        player.vx = 480;
        player.onGround = true;
        game.update(1 / 60);
        if (Math.abs(foe.vx) < 120) errors.push('kick failed vx=' + foe.vx);
        foe.y = SB.H + 120;
        game.update(1 / 60);
        if (game.enemies.indexOf(foe) !== -1) errors.push('snowball stayed on screen');
        if (player.score <= before) errors.push('smash did not score');
      }
    }

    game.potions.push({ x: player.x, y: player.y, w: 52, h: 68, type: 'green', t: 0 });
    player.balloon = 0;
    player.invuln = 999;
    game.update(1 / 60);
    if (player.balloon <= 0) errors.push('green potion missed');

    const fresh = new SB.Game();
    fresh.testing = true;
    fresh.start(1);
    fresh.state = 'play';
    fresh.lock = 0;
    fresh.aiPause = true;
    const fp = fresh.players[0];
    fp.invuln = 0;
    fp.balloon = 0;
    const enemy = fresh.enemies.find(function (e) { return e.state === 'active'; });
    const lives = fp.lives;
    if (enemy) {
      enemy.x = fp.x;
      enemy.y = fp.y;
      fresh.update(1 / 60);
      if (fp.lives === lives) errors.push('touch did not cost a life');
    }

    for (let s = 1; s <= 20; s += 1) {
      const g = new SB.Game();
      g.testing = true;
      g.playersN = 1;
      g.makePlayers(1);
      g.loadStage(s);
      if (!g.platforms.length) errors.push('stage ' + s + ' no platforms');
      if (!g.enemies.length) errors.push('stage ' + s + ' no enemies');
      g.state = 'play';
      g.aiPause = true;
      g.lock = 0;
      g.players[0].invuln = 999;
      for (let i = 0; i < 20; i += 1) g.update(1 / 60);
      const snapshot = g.enemies.slice();
      for (let i = 0; i < snapshot.length; i += 1) {
        const e = snapshot[i];
        if (e.state === 'active' && !e._gone) g.encase(e);
      }
      const balls = g.enemies.slice();
      for (let i = 0; i < balls.length; i += 1) {
        if (balls[i].state === 'snowball' && !balls[i]._gone) g.smashSnowball(balls[i], true);
      }
      g.update(1 / 60);
      if (g.enemies.length) errors.push('stage ' + s + ' not clearable, left ' + g.enemies.length);
      if (g.state !== 'clear') errors.push('stage ' + s + ' state ' + g.state);
    }

    const walk = new SB.Game();
    walk.testing = true;
    walk.start(1);
    walk.state = 'play';
    walk.lock = 0;
    walk.aiPause = false;
    walk.players[0].invuln = 999;
    for (let i = 0; i < 240; i += 1) walk.update(1 / 60);
    walk.enemies.forEach(function (e) {
      if (e.type === 'walker' && e.falls > 0) errors.push('stage 1 walker fell');
    });
    const pond = new SB.Game();
    pond.testing = true;
    pond.playersN = 1;
    pond.makePlayers(1);
    pond.loadStage(4);
    pond.state = 'play';
    pond.lock = 0;
    pond.players[0].invuln = 999;
    for (let i = 0; i < 240; i += 1) pond.update(1 / 60);
    pond.enemies.forEach(function (e) {
      if (e.type === 'walker' && e.falls > 0) errors.push('stage 4 walker fell into a pit');
    });

    if (!errors.length) say('selfTest passed (' + SB.STAGES.length + ' stages)');
    else errors.forEach(function (err) { say('FAIL ' + err); });
    return { ok: errors.length === 0, errors: errors, log: log.join('\n'), game: game };
  };
})(globalThis.SB = globalThis.SB || {});
