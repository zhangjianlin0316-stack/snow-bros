(function (SB) {
  'use strict';

  const FONT = '"Trebuchet MS", "Segoe UI", "DejaVu Sans", "Liberation Sans", sans-serif';

  const THEMES = [
    {
      sky: ['#17386c', '#67a6d6', '#f2c3a0'], stars: 0.05, sun: '#ffe3b0',
      mountain: ['#1a4068', '#2f628f', '#78a9cc'], tree: '#14362c', cabin: true,
      top: ['#ffffff', '#d7f3ff'], face: ['#d39255', '#7c4524'], style: 'wood',
      abyss: ['#081018', '#1a3c52'], accent: '#ffd166',
    },
    {
      sky: ['#071426', '#1d4e86', '#9fd6ef'], stars: 0.7, sun: '#f7f3ff',
      mountain: ['#12304e', '#1e5278', '#4e86aa'], tree: '#0e2c3a', cabin: false,
      top: ['#f5fdff', '#bfefff'], face: ['#8fd8ee', '#2e6f90'], style: 'ice',
      abyss: ['#040910', '#123044'], accent: '#9debff',
    },
    {
      sky: ['#120c22', '#3a2a62', '#8d6b8a'], stars: 0.85, sun: '#ffe6c2',
      mountain: ['#1a1430', '#33244e', '#5c4568'], tree: '#1a1428', cabin: false,
      top: ['#fff', '#ead9ff'], face: ['#6d6280', '#2c243c'], style: 'stone',
      abyss: ['#07060e', '#241424'], accent: '#ffb15e',
    },
    {
      sky: ['#070814', '#241038', '#5a2060'], stars: 1, sun: '#ffd0e8',
      mountain: ['#140818', '#3a1438', '#6a2458'], tree: '#140814', cabin: false,
      top: ['#fff', '#ffd0ea'], face: ['#3a243c', '#140810'], style: 'obsidian',
      abyss: ['#050208', '#2a0818'], accent: '#ff5a7a',
    },
    {
      sky: ['#081428', '#1c4e78', '#3a6ea5'], stars: 0.9, sun: '#e7fff6',
      mountain: ['#102038', '#1d4668', '#3e7898'], tree: '#102430', cabin: false,
      top: ['#ffffff', '#d8fff4'], face: ['#6a78c8', '#2a3468'], style: 'aurora',
      abyss: ['#060814', '#142040'], accent: '#8dffcf',
    },
    {
      sky: ['#d7e7f4', '#eef5fb', '#ffffff'], stars: 0, sun: '#fff',
      mountain: ['#8eafc8', '#b7d0e2', '#d5e6f2'], tree: '#5d7e96', cabin: false,
      top: ['#ffffff', '#e7f4ff'], face: ['#c5dcea', '#6f93ad'], style: 'frost',
      abyss: ['#1c3348', '#406888'], accent: '#ffffff',
    },
    {
      sky: ['#102018', '#245848', '#8fb89a'], stars: 0.25, sun: '#fff2c4',
      mountain: ['#163228', '#245444', '#4d7a62'], tree: '#0e281c', cabin: true,
      top: ['#ffffff', '#e5ffe8'], face: ['#6d8a52', '#2e4624'], style: 'wood',
      abyss: ['#07140e', '#163828'], accent: '#d6ff6b',
    },
    {
      sky: ['#0c1024', '#24386a', '#6e88b4'], stars: 0.8, sun: '#f0f6ff',
      mountain: ['#12182e', '#24345c', '#4a6490'], tree: '#12182a', cabin: false,
      top: ['#ffffff', '#d5e4ff'], face: ['#5a6e96', '#1c2744'], style: 'obsidian',
      abyss: ['#070a14', '#1a2444'], accent: '#9ec0ff',
    },
  ];

  const PAL = {
    nick: { hat: '#2c6ef0', hatDark: '#163e9e', scarf: '#4c86ff', band: '#d9e7ff', pom: '#f5fbff', body: '#f7fbff' },
    tom: { hat: '#e23848', hatDark: '#8d1b2a', scarf: '#ff5c6e', band: '#ffdfe4', pom: '#fff6f7', body: '#fff8f8' },
  };

  function themeAt(i) {
    return THEMES[i % THEMES.length];
  }

  function font(ctx, size, weight) {
    ctx.font = (weight || 700) + ' ' + size + 'px ' + FONT;
  }

  function roundPath(ctx, x, y, w, h, r) {
    const rr = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function makeCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = SB.W;
    canvas.height = SB.H;
    return canvas;
  }

  function paintSky(ctx, theme) {
    const g = ctx.createLinearGradient(0, 0, 0, SB.H);
    g.addColorStop(0, theme.sky[0]);
    g.addColorStop(0.55, theme.sky[1]);
    g.addColorStop(1, theme.sky[2]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, SB.W, SB.H);
  }

  function mountain(ctx, y, color, seed, amp, step) {
    const rng = SB.mulberry32(seed);
    ctx.beginPath();
    ctx.moveTo(0, SB.H);
    ctx.lineTo(0, y);
    let x = 0;
    while (x <= SB.W + step) {
      const h = amp * (0.35 + rng() * 0.75);
      ctx.lineTo(x, y - h);
      x += step * (0.55 + rng() * 0.7);
      ctx.lineTo(x, y - amp * (0.15 + rng() * 0.35));
    }
    ctx.lineTo(SB.W, SB.H);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  function tree(ctx, x, ground, h, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, ground - h);
    ctx.lineTo(x + h * 0.42, ground);
    ctx.lineTo(x - h * 0.42, ground);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.78)';
    ctx.beginPath();
    ctx.moveTo(x, ground - h);
    ctx.lineTo(x + h * 0.16, ground - h * 0.62);
    ctx.lineTo(x - h * 0.16, ground - h * 0.62);
    ctx.closePath();
    ctx.fill();
  }

  function cabin(ctx, x, ground) {
    ctx.fillStyle = '#6b3a28';
    ctx.fillRect(x, ground - 86, 110, 86);
    ctx.fillStyle = '#f4fbff';
    ctx.beginPath();
    ctx.moveTo(x - 16, ground - 80);
    ctx.lineTo(x + 55, ground - 150);
    ctx.lineTo(x + 126, ground - 80);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffd56a';
    ctx.fillRect(x + 42, ground - 48, 22, 28);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(x + 14, ground - 58, 18, 16);
    ctx.fillRect(x + 74, ground - 58, 18, 16);
  }

  SB.draw = {
    bakeBackground: function (themeIndex, seed) {
      const theme = themeAt(themeIndex);
      const canvas = makeCanvas();
      const ctx = canvas.getContext('2d');
      const rng = SB.mulberry32(seed || 1);
      paintSky(ctx, theme);
      if (theme.stars > 0.2) {
        for (let i = 0; i < 90; i += 1) {
          const x = rng() * SB.W;
          const y = rng() * 900;
          const r = rng() * 2.4 + 0.6;
          ctx.globalAlpha = 0.35 + rng() * 0.65;
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      if (theme.sun) {
        const sx = theme.stars > 0.6 ? 3140 : 2920;
        const sy = theme.stars > 0.6 ? 280 : 360;
        const glow = ctx.createRadialGradient(sx, sy, 20, sx, sy, 280);
        glow.addColorStop(0, 'rgba(255,255,255,0.95)');
        glow.addColorStop(0.2, theme.sun);
        glow.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(sx, sy, 280, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = theme.sun;
        ctx.beginPath();
        ctx.arc(sx, sy, 74, 0, Math.PI * 2);
        ctx.fill();
        if (theme.stars > 0.5) {
          ctx.fillStyle = 'rgba(210, 220, 240, 0.35)';
          ctx.beginPath();
          ctx.arc(sx - 18, sy - 10, 58, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.18)';
          [[-20, -8, 10], [16, 18, 7], [8, -24, 6]].forEach(function (c) {
            ctx.beginPath();
            ctx.arc(sx + c[0], sy + c[1], c[2], 0, Math.PI * 2);
            ctx.fill();
          });
        }
      }
      mountain(ctx, 1180, theme.mountain[0], seed + 3, 280, 280);
      mountain(ctx, 1320, theme.mountain[1], seed + 9, 220, 220);
      mountain(ctx, 1460, theme.mountain[2], seed + 15, 150, 180);
      const ground = 1680;
      for (let i = 0; i < 14; i += 1) {
        const x = 80 + rng() * (SB.W - 160);
        tree(ctx, x, ground, 120 + rng() * 180, theme.tree);
      }
      if (theme.cabin) {
        cabin(ctx, 520, ground);
        cabin(ctx, 2860, ground);
      }
      const abyss = ctx.createLinearGradient(0, SB.FLOOR_Y - 20, 0, SB.H);
      abyss.addColorStop(0, theme.abyss[1]);
      abyss.addColorStop(1, theme.abyss[0]);
      ctx.fillStyle = abyss;
      ctx.fillRect(0, SB.FLOOR_Y - 10, SB.W, SB.H - SB.FLOOR_Y + 10);
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      for (let x = SB.LEFT; x < SB.RIGHT; x += 70) {
        ctx.beginPath();
        ctx.moveTo(x, SB.FLOOR_Y + 30);
        ctx.lineTo(x + 18, SB.H - 40);
        ctx.lineTo(x - 18, SB.H - 40);
        ctx.fill();
      }
      return canvas;
    },

    bakePlatforms: function (platforms, themeIndex, seed) {
      const theme = themeAt(themeIndex);
      const canvas = makeCanvas();
      const ctx = canvas.getContext('2d');
      const rng = SB.mulberry32((seed || 1) + 99);
      const floors = platforms.filter(function (p) { return p.r === 0; }).sort(function (a, b) { return a.x - b.x; });
      let cursor = SB.LEFT;
      const gaps = [];
      floors.forEach(function (f) {
        if (f.x > cursor + 6) gaps.push([cursor, f.x]);
        cursor = Math.max(cursor, f.x + f.w);
      });
      if (SB.RIGHT > cursor + 6) gaps.push([cursor, SB.RIGHT]);
      gaps.forEach(function (gap) {
        const a = gap[0];
        const b = gap[1];
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(a, SB.FLOOR_Y, b - a, SB.H - SB.FLOOR_Y);
        ctx.strokeStyle = theme.accent;
        ctx.lineWidth = 8;
        ctx.globalAlpha = 0.8;
        for (let x = a + 28; x < b - 10; x += 48) {
          ctx.beginPath();
          ctx.moveTo(x, SB.FLOOR_Y + 8);
          ctx.lineTo(x + 14, SB.FLOOR_Y + 54);
          ctx.lineTo(x - 14, SB.FLOOR_Y + 54);
          ctx.closePath();
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      });
      platforms.forEach(function (p, index) {
        drawPlatform(ctx, p, theme, rng, index);
      });
      return canvas;
    },

    frame: function (ctx, game) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, SB.W, SB.H);
      if (game.bg) ctx.drawImage(game.bg, 0, 0);
      else {
        paintSky(ctx, themeAt(game.themeIndex || 0));
      }
      if (game.state === 'title') {
        drawFlakes(ctx, game, 0.55);
        drawAurora(ctx, game);
        drawTitle(ctx, game);
        return;
      }
      ctx.save();
      if (game.shake > 0.5 && !game.reduce) {
        ctx.translate((Math.random() - 0.5) * game.shake * 2, (Math.random() - 0.5) * game.shake * 2);
      }
      drawFlakes(ctx, game, 0.45);
      drawAurora(ctx, game);
      if (game.platCanvas) ctx.drawImage(game.platCanvas, 0, 0);
      game.potions.forEach(function (pot) { drawPotion(ctx, pot, game.time); });
      game.enemies.forEach(function (e) {
        if (e.state === 'snowball' && e.trail) drawTrail(ctx, e);
      });
      const actors = [];
      game.enemies.forEach(function (e) { actors.push({ y: e.y + e.h, e: e }); });
      game.players.forEach(function (p) {
        if (p.alive || p.dying > 0) actors.push({ y: p.y + p.h, p: p });
      });
      actors.sort(function (a, b) { return a.y - b.y; });
      actors.forEach(function (a) {
        if (a.p) drawPlayer(ctx, a.p, game.time);
        else if (a.e.state === 'snowball') drawSnowball(ctx, a.e, game.time);
        else drawEnemy(ctx, a.e, game.time, game.themeIndex);
      });
      game.shots.forEach(function (s) { drawShot(ctx, s); });
      game.projectiles.forEach(function (pr) { drawShard(ctx, pr); });
      drawParticles(ctx, game);
      drawFlakes(ctx, game, 1);
      ctx.restore();
      if (game.flash > 0) {
        ctx.fillStyle = 'rgba(255,255,255,' + Math.min(0.45, game.flash) + ')';
        ctx.fillRect(0, 0, SB.W, SB.H);
      }
      drawHUD(ctx, game);
      if (game.state === 'intro') drawIntro(ctx, game);
      if (game.state === 'clear') drawClear(ctx, game);
      if (game.state === 'victory') drawVictory(ctx, game);
      if (game.state === 'over') drawOver(ctx, game);
      if (game.paused) drawPaused(ctx);
      if (game.hintT > 0 && game.state === 'play') drawHint(ctx, game);
    },
  };

  function drawPlatform(ctx, p, theme, rng, index) {
    const depth = p.r === 0 ? SB.H - p.y : 78;
    const face = ctx.createLinearGradient(0, p.y, 0, p.y + Math.min(depth, 160));
    face.addColorStop(0, theme.face[0]);
    face.addColorStop(1, theme.face[1]);
    roundPath(ctx, p.x, p.y, p.w, depth, p.r === 0 ? 0 : 18);
    ctx.fillStyle = face;
    ctx.fill();
    if (theme.style === 'wood') {
      ctx.strokeStyle = 'rgba(70, 32, 16, 0.35)';
      ctx.lineWidth = 3;
      for (let x = p.x + 28; x < p.x + p.w; x += 42) {
        ctx.beginPath();
        ctx.moveTo(x, p.y + 16);
        ctx.lineTo(x, p.y + Math.min(depth - 8, 70));
        ctx.stroke();
      }
    } else if (theme.style === 'stone') {
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 2;
      for (let y = p.y + 22; y < p.y + Math.min(depth, 70); y += 22) {
        ctx.beginPath();
        ctx.moveTo(p.x + 8, y);
        ctx.lineTo(p.x + p.w - 8, y);
        ctx.stroke();
      }
    } else if (theme.style === 'ice' || theme.style === 'aurora') {
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(p.x + 20, p.y + 28);
      ctx.lineTo(p.x + p.w * 0.35, p.y + Math.min(depth, 70));
      ctx.moveTo(p.x + p.w * 0.5, p.y + 20);
      ctx.lineTo(p.x + p.w * 0.72, p.y + Math.min(depth, 64));
      ctx.stroke();
    } else if (theme.style === 'obsidian') {
      ctx.strokeStyle = theme.accent;
      ctx.globalAlpha = 0.45;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(p.x + 16, p.y + 20);
      ctx.lineTo(p.x + p.w * 0.3, p.y + 50);
      ctx.lineTo(p.x + p.w * 0.55, p.y + 24);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    const cap = ctx.createLinearGradient(0, p.y - 22, 0, p.y + 26);
    cap.addColorStop(0, theme.top[0]);
    cap.addColorStop(1, theme.top[1]);
    roundPath(ctx, p.x - 8, p.y - 18, p.w + 16, 40, 18);
    ctx.fillStyle = cap;
    ctx.fill();
    ctx.strokeStyle = 'rgba(40, 70, 100, 0.28)';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    const mounds = 2 + Math.floor(p.w / 220);
    for (let i = 0; i < mounds; i += 1) {
      const mx = p.x + 30 + ((index * 47 + i * 97) % Math.max(1, p.w - 60));
      ctx.beginPath();
      ctx.ellipse(mx, p.y - 8, 26 + (i % 3) * 6, 14, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (p.r > 0) {
      ctx.fillStyle = 'rgba(220, 244, 255, 0.9)';
      for (let x = p.x + 36; x < p.x + p.w - 20; x += 78) {
        const ih = 18 + (x % 5) * 4;
        ctx.beginPath();
        ctx.moveTo(x, p.y + 70);
        ctx.lineTo(x + 8, p.y + 70 + ih);
        ctx.lineTo(x + 16, p.y + 70);
        ctx.fill();
      }
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(p.x + 24, p.y - 4);
    ctx.lineTo(p.x + p.w - 24, p.y - 4);
    ctx.stroke();
    if (rng && rng() > 2) { /* keep rng used per platform for stable variety */ }
  }

  function drawAurora(ctx, game) {
    const id = game.themeIndex || 0;
    if (id !== 3 && id !== 4 && id !== 7) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.strokeStyle = i === 0 ? 'rgba(120,255,210,0.18)' : i === 1 ? 'rgba(190,150,255,0.16)' : 'rgba(120,180,255,0.14)';
      ctx.lineWidth = 70;
      const y = 380 + i * 80;
      ctx.moveTo(0, y);
      for (let x = 0; x <= SB.W; x += 140) {
        ctx.lineTo(x, y + Math.sin(x * 0.003 + game.time * 0.35 + i) * 46);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFlakes(ctx, game, maxZ) {
    const minZ = maxZ > 0.7 ? 0.55 : 0;
    const cap = maxZ > 0.7 ? 1 : 0.55;
    for (let i = 0; i < game.flakes.length; i += 1) {
      const f = game.flakes[i];
      if (f.z < minZ || f.z >= cap) continue;
      ctx.globalAlpha = 0.35 + f.z * 0.55;
      ctx.fillStyle = '#fff';
      if (f.kind && f.z > 0.7) flake(ctx, f.x, f.y, f.r + 4, game.time + f.drift);
      else {
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r * (0.45 + f.z), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  function flake(ctx, x, y, r, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot * 0.2);
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.lineWidth = Math.max(2, r * 0.18);
    ctx.lineCap = 'round';
    for (let i = 0; i < 6; i += 1) {
      ctx.rotate(Math.PI / 3);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(r, 0);
      ctx.moveTo(r * 0.55, 0);
      ctx.lineTo(r * 0.75, r * 0.18);
      ctx.moveTo(r * 0.55, 0);
      ctx.lineTo(r * 0.75, -r * 0.18);
      ctx.stroke();
    }
    ctx.restore();
  }

  function shadow(ctx, x, y, rx, ry) {
    ctx.fillStyle = 'rgba(10, 20, 40, 0.28)';
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function bodyColor(type, theme) {
    const sets = {
      walker: ['#e23b4a', '#ff6a45', '#e0a15c', '#d5deea', '#ff5d8f', '#7ec8ff', '#74c96d', '#dfe7f5'],
      hopper: ['#2fce8c', '#49e0c4', '#b7d86a', '#d9fff0', '#7aa2ff', '#c5e4ff', '#b6e07a', '#9bcef8'],
      wisp: ['#b388ff', '#8d78ff', '#d2b0ff', '#f2e8ff', '#9a78ff', '#c9b8ff', '#e7c8ff', '#f7f4ff'],
    };
    return (sets[type] || sets.walker)[theme % 8];
  }

  function drawPlayer(ctx, p, time) {
    if (p.invuln > 0 && Math.floor(time * 14) % 2 === 0 && p.dying <= 0) return;
    const pal = PAL[p.palette] || PAL.nick;
    const cx = p.x + p.w / 2;
    const foot = p.y + p.h;
    const bob = p.onGround ? Math.sin(time * (Math.abs(p.vx) > 20 ? 14 : 3) + p.id) * (Math.abs(p.vx) > 20 ? 5 : 2) : 0;
    const stretch = p.vy < -200 ? 1.08 : p.vy > 500 ? 0.92 : 1;
    shadow(ctx, cx, foot + 6, p.balloon > 0 ? 70 : 46, 14);
    ctx.save();
    ctx.translate(cx, foot + bob);
    ctx.scale((p.facing < 0 ? -1 : 1) * (2 - stretch), stretch);
    if (p.dying > 0) ctx.rotate((0.8 - p.dying) * 1.4);
    if (p.balloon > 0) {
      drawBalloon(ctx, pal, p, time);
      ctx.restore();
      return;
    }
    const step = Math.sin(time * 14) * (Math.abs(p.vx) > 20 ? 16 : 0);
    drawFoot(ctx, -28, step);
    drawFoot(ctx, 24, -step);
    const g = ctx.createRadialGradient(-18, -96, 8, 0, -78, 70);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.72, pal.body);
    g.addColorStop(1, '#c5d7e6');
    ctx.fillStyle = g;
    ctx.strokeStyle = 'rgba(28, 48, 74, 0.55)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(0, -74, 58, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#1c2430';
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.arc(2, -52 - i * 16, 5.5, 0, Math.PI * 2);
      ctx.fill();
    }
    const hg = ctx.createRadialGradient(-14, -176, 6, 0, -158, 50);
    hg.addColorStop(0, '#ffffff');
    hg.addColorStop(1, '#d5e4f0');
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.arc(0, -158, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    const blink = Math.floor(time + p.id * 1.7) % 4 === 0 && (time % 1) < 0.08;
    if (!blink) {
      eye(ctx, -16, -166);
      eye(ctx, 14, -166);
    } else {
      ctx.strokeStyle = '#1c2430';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-26, -166);
      ctx.lineTo(-8, -166);
      ctx.moveTo(6, -166);
      ctx.lineTo(24, -166);
      ctx.stroke();
    }
    ctx.fillStyle = '#ff8a2a';
    ctx.beginPath();
    ctx.moveTo(12, -152);
    ctx.lineTo(52, -144);
    ctx.lineTo(12, -136);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#243140';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(2, -148, 16, 0.25, Math.PI - 0.3);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 140, 160, 0.55)';
    ctx.beginPath();
    ctx.ellipse(-26, -146, 8, 5, 0, 0, Math.PI * 2);
    ctx.ellipse(24, -146, 8, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    drawBeanie(ctx, pal, time);
    drawScarf(ctx, pal, time, p.vx);
    const aim = p.shootAnim > 0 ? -0.9 : Math.sin(time * 8) * 0.12;
    drawStick(ctx, -48, -96, Math.PI - 0.5 + aim * 0.3);
    drawStick(ctx, 40, -108, aim);
    if (p.hurt > 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.beginPath();
      ctx.arc(0, -120, 70, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawFoot(ctx, x, step) {
    ctx.fillStyle = '#f4f8fb';
    ctx.strokeStyle = 'rgba(28, 48, 74, 0.45)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(x + step, -8, 22, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  function eye(ctx, x, y) {
    ctx.fillStyle = '#1b2430';
    ctx.beginPath();
    ctx.ellipse(x, y, 6, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x - 2, y - 2, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBeanie(ctx, pal, time) {
    ctx.fillStyle = pal.hatDark;
    ctx.beginPath();
    ctx.ellipse(0, -196, 48, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    const g = ctx.createLinearGradient(-40, -230, 40, -180);
    g.addColorStop(0, pal.hat);
    g.addColorStop(1, pal.hatDark);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-40, -196);
    ctx.quadraticCurveTo(-46, -250, 0, -262);
    ctx.quadraticCurveTo(48, -248, 42, -196);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(10, 20, 40, 0.35)';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = pal.band;
    ctx.fillRect(-40, -210, 82, 12);
    const py = -268 + Math.sin(time * 3) * 2;
    ctx.fillStyle = pal.pom;
    ctx.beginPath();
    ctx.arc(0, py, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  function drawScarf(ctx, pal, time, vx) {
    ctx.strokeStyle = pal.scarf;
    ctx.fillStyle = pal.scarf;
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, -124, 36, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
    const wave = Math.sin(time * 7 + (vx || 0) * 0.01) * 10;
    ctx.beginPath();
    ctx.moveTo(28, -112);
    ctx.quadraticCurveTo(70 + wave, -80, 48 + wave, -36);
    ctx.lineTo(34 + wave, -40);
    ctx.quadraticCurveTo(48, -78, 18, -108);
    ctx.fill();
  }

  function drawStick(ctx, x, y, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.strokeStyle = '#6b4428';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(46, 8);
    ctx.stroke();
    ctx.fillStyle = '#f2f6f8';
    ctx.beginPath();
    ctx.arc(50, 8, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawBalloon(ctx, pal, p, time) {
    const g = ctx.createRadialGradient(-20, -150, 10, 0, -130, 110);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.5, 'rgba(120, 255, 190, 0.85)');
    g.addColorStop(1, 'rgba(60, 170, 255, 0.9)');
    ctx.fillStyle = g;
    ctx.strokeStyle = 'rgba(20, 50, 80, 0.45)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.ellipse(0, -130, 92, 108, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    eye(ctx, -22, -146);
    eye(ctx, 18, -146);
    ctx.fillStyle = '#ff8a2a';
    ctx.beginPath();
    ctx.moveTo(8, -128);
    ctx.lineTo(42, -120);
    ctx.lineTo(8, -114);
    ctx.fill();
    ctx.strokeStyle = pal.scarf;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, -24);
    ctx.quadraticCurveTo(10, 10, 0, 18);
    ctx.stroke();
    const left = p.balloon / 8;
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(0, -130, 100, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * left);
    ctx.stroke();
  }

  function drawEnemy(ctx, e, time, theme) {
    const cx = e.x + e.w / 2;
    const foot = e.y + e.h;
    shadow(ctx, cx, foot + 4, e.w * 0.36, 12);
    ctx.save();
    ctx.translate(cx + (e.hurt > 0 ? Math.sin(time * 50) * 3 : 0), foot);
    ctx.scale(e.facing < 0 ? -1 : 1, 1);
    if (e.type === 'hopper') drawHopper(ctx, e, time, theme);
    else if (e.type === 'wisp') drawWisp(ctx, e, time, theme);
    else if (e.type === 'boss') drawBoss(ctx, e, time);
    else drawWalker(ctx, e, time, theme);
    const prog = e.snowMax ? e.snow / e.snowMax : 0;
    if (prog > 0) snowCoat(ctx, e, prog);
    ctx.restore();
  }

  function drawWalker(ctx, e, time, theme) {
    const step = Math.sin(time * 10 + e.x * 0.01) * 8;
    const col = bodyColor('walker', theme);
    ctx.fillStyle = '#5c3318';
    ctx.beginPath();
    ctx.ellipse(-24 + step, -10, 16, 10, 0, 0, Math.PI * 2);
    ctx.ellipse(22 - step, -10, 16, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    const g = ctx.createRadialGradient(-16, -78, 8, 0, -64, 62);
    g.addColorStop(0, '#fff1f2');
    g.addColorStop(0.35, col);
    g.addColorStop(1, '#6d2030');
    ctx.fillStyle = g;
    ctx.strokeStyle = 'rgba(40, 10, 16, 0.55)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.ellipse(0, -64, 52, 48, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffe7c2';
    ctx.beginPath();
    ctx.ellipse(0, -52, 24, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2f8a3a';
    ctx.beginPath();
    ctx.ellipse(0, -112, 16, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-4, -128, 10, 16, -0.4, 0, Math.PI * 2);
    ctx.fill();
    eye(ctx, -16, -74);
    eye(ctx, 16, -74);
    ctx.strokeStyle = '#3a1218';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-22, -88);
    ctx.lineTo(-8, -80);
    ctx.moveTo(22, -88);
    ctx.lineTo(8, -80);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(-8, -58);
    ctx.lineTo(-2, -46);
    ctx.lineTo(2, -58);
    ctx.moveTo(6, -58);
    ctx.lineTo(12, -46);
    ctx.lineTo(16, -58);
    ctx.fill();
  }

  function drawHopper(ctx, e, time, theme) {
    const crouch = e.onGround && e.hopWait < 0.25 ? 10 : 0;
    const col = bodyColor('hopper', theme);
    ctx.fillStyle = col;
    ctx.strokeStyle = 'rgba(10, 40, 30, 0.5)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.ellipse(-28, -8, 22, 10, 0, 0, Math.PI * 2);
    ctx.ellipse(28, -8, 22, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    const g = ctx.createRadialGradient(-10, -70, 6, 0, -50, 60);
    g.addColorStop(0, '#f4fff8');
    g.addColorStop(0.4, col);
    g.addColorStop(1, '#14684a');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, -48 - crouch, 50, 36 + crouch * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    stalkEye(ctx, -22, -78 - crouch);
    stalkEye(ctx, 20, -82 - crouch);
    ctx.fillStyle = 'rgba(255, 120, 150, 0.7)';
    ctx.beginPath();
    ctx.ellipse(-30, -40, 8, 5, 0, 0, Math.PI * 2);
    ctx.ellipse(30, -40, 8, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#143828';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -36, 12, 0.2, Math.PI - 0.2);
    ctx.stroke();
  }

  function stalkEye(ctx, x, y) {
    ctx.strokeStyle = '#14684a';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x * 0.4, y + 24);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.fillStyle = '#fff8d8';
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(10,40,30,0.4)';
    ctx.stroke();
    ctx.fillStyle = '#1b2430';
    ctx.beginPath();
    ctx.arc(x + 2, y, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawWisp(ctx, e, time, theme) {
    const col = bodyColor('wisp', theme);
    const bob = Math.sin(time * 4 + e.phase) * 6;
    ctx.translate(0, bob);
    wing(ctx, -36, -70, time, -1);
    wing(ctx, 36, -70, time, 1);
    const g = ctx.createRadialGradient(-8, -90, 4, 0, -70, 60);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.4, col);
    g.addColorStop(1, 'rgba(80, 40, 140, 0.2)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, -130);
    ctx.bezierCurveTo(58, -120, 52, -20, 0, -10);
    ctx.bezierCurveTo(-52, -20, -58, -120, 0, -130);
    ctx.fill();
    ctx.strokeStyle = 'rgba(40, 20, 70, 0.45)';
    ctx.lineWidth = 5;
    ctx.stroke();
    eye(ctx, -14, -86);
    eye(ctx, 14, -86);
    ctx.fillStyle = '#ffd56a';
    ctx.beginPath();
    ctx.moveTo(0, -132);
    ctx.lineTo(8, -112);
    ctx.lineTo(-8, -112);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, -8, 16, 22, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function wing(ctx, x, y, time, dir) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(dir * (0.4 + Math.sin(time * 16) * 0.35));
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.ellipse(dir * 16, 0, 22, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawBoss(ctx, e, time) {
    const kind = e.kind === 2;
    const col = kind ? '#8fb4e8' : '#6d4fd0';
    const g = ctx.createRadialGradient(-20, -150, 10, 0, -120, 140);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.35, col);
    g.addColorStop(1, kind ? '#1d3558' : '#241048');
    ctx.fillStyle = g;
    ctx.strokeStyle = 'rgba(10, 8, 24, 0.6)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.ellipse(0, -118, 108, 100, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = kind ? '#d7e6ff' : '#f0e6ff';
    roundPath(ctx, -78, -150, 156, 42, 16);
    ctx.fill();
    eye(ctx, -32, -132);
    eye(ctx, 28, -132);
    ctx.fillStyle = kind ? '#dce9ff' : '#ffd98a';
    for (let i = -2; i <= 2; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * 28 - 10, -210);
      ctx.lineTo(i * 28, -250 - Math.abs(i) * 8);
      ctx.lineTo(i * 28 + 10, -210);
      ctx.fill();
    }
    ctx.strokeStyle = kind ? '#9ec4ff' : '#ffd36a';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    const wave = Math.sin(time * 3) * 0.2;
    ctx.beginPath();
    ctx.moveTo(-90, -120);
    ctx.quadraticCurveTo(-140, -40 + wave * 40, -100, -20);
    ctx.moveTo(90, -120);
    ctx.quadraticCurveTo(150, -70 - wave * 30, 120, -30);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.arc(108, -30, 14, 0, Math.PI * 2);
    ctx.fill();
    if (e.bossShot < 0.25) {
      ctx.fillStyle = '#ffcf6b';
      ctx.beginPath();
      ctx.ellipse(0, -90, 18, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function snowCoat(ctx, e, prog) {
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    const h = 16 + prog * (e.type === 'boss' ? 150 : 78);
    const rx = (e.type === 'boss' ? 90 : 46) * (0.75 + prog * 0.35);
    ctx.beginPath();
    ctx.ellipse(0, -h * 0.45, rx, h * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(220, 240, 255, 0.9)';
    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath();
      ctx.arc(-rx * 0.4 + i * rx * 0.28, -8 - i * 4, 8 + prog * 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawSnowball(ctx, e, time) {
    const cx = e.x + e.w / 2;
    const cy = e.y + e.h / 2;
    const pop = e.encaseT > 0 ? 1 + Math.sin((1 - e.encaseT / 0.28) * Math.PI) * 0.12 : 1;
    const r = e.radius * pop;
    const shake = e.crack > 0.55 ? Math.sin(time * 42) * (e.crack - 0.55) * 18 : 0;
    shadow(ctx, cx, e.y + e.h + 8, r * 0.85, r * 0.28);
    ctx.save();
    ctx.translate(cx + shake, cy);
    ctx.rotate(e.spin || 0);
    const g = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.55, '#e7f4ff');
    g.addColorStop(1, '#9ec0d8');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = e.heat > 0.75 ? '#ffd0a0' : 'rgba(40,70,100,0.45)';
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.62, e.spin, e.spin + 1.4);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.35, -r * 0.38, r * 0.28, r * 0.16, -0.6, 0, Math.PI * 2);
    ctx.fill();
    if (e.crack > 0.4 || e.heat > 0.7) {
      ctx.strokeStyle = e.heat > e.crack ? 'rgba(255,220,160,0.9)' : 'rgba(40,60,80,0.7)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-r * 0.2, -r * 0.1);
      ctx.lineTo(r * 0.05, r * 0.15);
      ctx.lineTo(r * 0.3, -r * 0.05);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawTrail(ctx, e) {
    for (let i = 0; i < e.trail.length; i += 1) {
      const t = e.trail[i];
      ctx.globalAlpha = (i + 1) / e.trail.length * 0.35;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(t.x, t.y, e.radius * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawShot(ctx, s) {
    const a = Math.max(0.25, s.life / s.max);
    ctx.globalAlpha = a;
    const g = ctx.createRadialGradient(s.x - 4, s.y - 4, 2, s.x, s.y, s.r);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(1, '#c5e6ff');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(s.x - s.r * 0.8, s.y + 2, s.r * 0.45, 0, Math.PI * 2);
    ctx.arc(s.x + s.r * 0.7, s.y - 2, s.r * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawShard(ctx, pr) {
    ctx.save();
    ctx.translate(pr.x, pr.y);
    ctx.rotate(pr.spin);
    ctx.fillStyle = '#d7f4ff';
    ctx.strokeStyle = '#6ec8ef';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -pr.r);
    ctx.lineTo(pr.r * 0.7, 0);
    ctx.lineTo(0, pr.r);
    ctx.lineTo(-pr.r * 0.7, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawPotion(ctx, pot, time) {
    const bob = Math.sin(time * 3 + pot.t) * 8;
    const colors = { red: '#ff3d52', blue: '#2f7dff', yellow: '#ffc53a', green: '#2bd67a' };
    const col = colors[pot.type] || '#fff';
    ctx.save();
    ctx.translate(pot.x + pot.w / 2, pot.y + pot.h / 2 + bob);
    ctx.fillStyle = col;
    ctx.globalAlpha = 0.28;
    ctx.beginPath();
    ctx.arc(0, 0, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#f4e2c4';
    roundPath(ctx, -8, -40, 16, 12, 3);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    roundPath(ctx, -16, -30, 32, 18, 6);
    ctx.fill();
    const g = ctx.createLinearGradient(-20, -20, 20, 36);
    g.addColorStop(0, '#f7fbff');
    g.addColorStop(0.3, col);
    g.addColorStop(1, col);
    ctx.fillStyle = g;
    ctx.strokeStyle = 'rgba(20,30,50,0.45)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-12, -28);
    ctx.lineTo(-12, -8);
    ctx.bezierCurveTo(-36, 0, -32, 36, 0, 38);
    ctx.bezierCurveTo(32, 36, 36, 0, 12, -8);
    ctx.lineTo(12, -28);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.ellipse(-6, 4, 5, 12, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawParticles(ctx, game) {
    for (let i = 0; i < game.particles.length; i += 1) {
      const q = game.particles[i];
      ctx.globalAlpha = Math.max(0, q.life / (q.max || 0.5));
      ctx.fillStyle = q.color;
      ctx.beginPath();
      ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    font(ctx, 42, 800);
    ctx.textAlign = 'center';
    for (let i = 0; i < game.popups.length; i += 1) {
      const pop = game.popups[i];
      ctx.globalAlpha = Math.max(0, pop.life);
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillText(pop.text, pop.x + 3, pop.y + 3);
      ctx.fillStyle = pop.color;
      ctx.fillText(pop.text, pop.x, pop.y);
    }
    ctx.globalAlpha = 1;
  }

  function pad(n) {
    const s = String(Math.max(0, Math.floor(n)));
    return s.length >= 6 ? s : ('000000' + s).slice(-6);
  }

  function miniHead(ctx, x, y, palette) {
    const pal = PAL[palette] || PAL.nick;
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = 'rgba(20, 40, 70, 0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = pal.hat;
    ctx.beginPath();
    ctx.arc(x, y - 4, 18, Math.PI, 0);
    ctx.fill();
  }

  function pipRow(ctx, x, y, level, color) {
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.arc(x + i * 22, y, 7, 0, Math.PI * 2);
      ctx.fillStyle = i < level ? color : 'rgba(255,255,255,0.25)';
      ctx.fill();
    }
  }

  function drawHUD(ctx, game) {
    roundPath(ctx, 70, 28, 3700, 196, 28);
    ctx.fillStyle = 'rgba(8, 18, 36, 0.42)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 3;
    ctx.stroke();
    font(ctx, 28, 700);
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillText(game.players[0] ? game.players[0].name.toUpperCase() : 'NICK', 140, 78);
    ctx.textAlign = 'center';
    ctx.fillText('HIGH SCORE', 1920, 78);
    ctx.textAlign = 'right';
    const rightLabel = game.playersN > 1 ? 'TOM' : (game.def ? game.def.name.toUpperCase() : '');
    ctx.fillText(rightLabel, 3600, 78);
    font(ctx, 64, 800);
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillText(pad(game.players[0] ? game.players[0].score : 0), 144, 154);
    ctx.fillStyle = '#f5fbff';
    ctx.fillText(pad(game.players[0] ? game.players[0].score : 0), 140, 150);
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillText(pad(game.high || 0), 1924, 154);
    ctx.fillStyle = '#ffe9a8';
    ctx.fillText(pad(game.high || 0), 1920, 150);
    ctx.textAlign = 'right';
    if (game.playersN > 1 && game.players[1]) {
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillText(pad(game.players[1].score), 3604, 154);
      ctx.fillStyle = '#f5fbff';
      ctx.fillText(pad(game.players[1].score), 3600, 150);
    }
    const lives1 = game.players[0] ? game.players[0].lives : 0;
    for (let i = 0; i < Math.min(6, lives1); i += 1) miniHead(ctx, 170 + i * 56, 188, 'nick');
    if (game.playersN > 1 && game.players[1]) {
      const lives2 = game.players[1].lives;
      for (let i = 0; i < Math.min(6, lives2); i += 1) miniHead(ctx, 3520 - i * 56, 188, 'tom');
    }
    font(ctx, 32, 800);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    const stageNo = game.stage || 1;
    ctx.fillText('STAGE ' + stageNo, 1920, 196);
    if (game.players[0]) {
      const p = game.players[0];
      if (p.speedLv) pipRow(ctx, 150, 2080, p.speedLv, '#ff4d62');
      if (p.powerLv) pipRow(ctx, 240, 2080, p.powerLv, '#3d84ff');
      if (p.rangeLv) pipRow(ctx, 330, 2080, p.rangeLv, '#ffc53a');
      if (p.balloon > 0) {
        ctx.strokeStyle = '#3ee08a';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(460, 2072, 16, -Math.PI / 2, -Math.PI / 2 + (p.balloon / 8) * Math.PI * 2);
        ctx.stroke();
      }
    }
    const boss = game.enemies && game.enemies.find(function (e) { return e.type === 'boss' && e.state === 'active'; });
    if (boss) {
      const frac = boss.snow / boss.snowMax;
      roundPath(ctx, 1560, 214, 720, 22, 10);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fill();
      roundPath(ctx, 1560, 214, Math.max(0, 720 * frac), 22, 10);
      ctx.fillStyle = '#e8f7ff';
      ctx.fill();
    }
  }

  function frostPanel(ctx, x, y, w, h) {
    roundPath(ctx, x, y, w, h, 36);
    ctx.fillStyle = 'rgba(7, 14, 28, 0.96)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  function iceText(ctx, text, x, y, size) {
    font(ctx, size, 800);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(8, size * 0.07);
    ctx.strokeStyle = 'rgba(10, 30, 56, 0.9)';
    ctx.strokeText(text, x, y);
    const g = ctx.createLinearGradient(0, y - size * 0.6, 0, y + size * 0.55);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.45, '#d8f4ff');
    g.addColorStop(1, '#79b7e4');
    ctx.fillStyle = g;
    ctx.fillText(text, x, y);
    ctx.textBaseline = 'alphabetic';
  }

  function drawTitle(ctx, game) {
    const t = game.time;
    iceText(ctx, 'SNOW BROS', 1920, 300, 188);
    font(ctx, 64, 700);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e7f6ff';
    ctx.fillText('雪人兄弟', 1920, 470);
    font(ctx, 32, 600);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText('an unofficial 4K browser tribute  ·  非官方致敬', 1920, 540);
    drawPlatform(ctx, { x: 760, y: 1040, w: 2320, h: 52, r: 1 }, themeAt(0), SB.mulberry32(2), 1);
    drawPlayer(ctx, {
      id: 0, palette: 'nick', x: 980, y: 1040 - 156, w: 108, h: 156,
      facing: 1, vx: 180, vy: 0, onGround: true, dying: 0, invuln: 0,
      balloon: 0, shootAnim: Math.sin(t * 2) > 0.6 ? 0.1 : 0, hurt: 0,
    }, t);
    drawEnemy(ctx, {
      type: 'walker', x: 2460, y: 1040 - 132, w: 120, h: 132, facing: -1,
      snow: 2, snowMax: 4, hurt: 0, state: 'active', phase: 1,
    }, t, 0);
    drawSnowball(ctx, {
      x: 1680 + Math.sin(t) * 40, y: 1040 - 128, w: 128, h: 128,
      radius: 64, spin: t * 2, crack: 0, heat: 0.2, encaseT: 0, trail: [],
    }, t);
    frostPanel(ctx, 360, 1180, 3120, 820);
    font(ctx, 40, 800);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#9fd0ff';
    ctx.fillText('1P  NICK', 460, 1260);
    ctx.fillText('2P  TOM', 1960, 1260);
    font(ctx, 36, 700);
    ctx.fillStyle = '#f4fbff';
    const left = ['Arrows  move', 'Z  shoot snow', 'X  jump', 'P  pause    M  mute'];
    const right = ['A  D  move', 'W  /  G  jump', 'F  shoot snow', 'Gamepad  stick, A jump, B shoot'];
    left.forEach(function (line, i) { ctx.fillText(line, 460, 1340 + i * 64); });
    right.forEach(function (line, i) { ctx.fillText(line, 1960, 1340 + i * 64); });
    font(ctx, 32, 700);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#d5ecff';
    ctx.fillText('方向键移动 · Z 发射 · X 跳跃          WASD 移动 · F 发射 · G 跳跃', 1920, 1640);
    font(ctx, 30, 600);
    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    ctx.fillText('Shoot until an enemy is packed in snow, then push the ball. Chains score big. Wait too long and they thaw.', 1920, 1720);
    ctx.fillText('把敌人射成雪球再推走。雪球撞墙反弹、连撞加分；放太久会被挣脱。', 1920, 1770);
    const potions = [['#ff3d52', 'Red speed'], ['#2f7dff', 'Blue power'], ['#ffc53a', 'Yellow range'], ['#2bd67a', 'Green balloon']];
    potions.forEach(function (item, i) {
      const x = 620 + i * 680;
      ctx.fillStyle = item[0];
      ctx.beginPath();
      ctx.arc(x, 1855, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'left';
      font(ctx, 30, 700);
      ctx.fillText(item[1], x + 28, 1866);
    });
    ctx.textAlign = 'center';
    font(ctx, 48, 800);
    ctx.fillStyle = 'rgba(255,255,255,' + (0.45 + Math.sin(t * 4) * 0.35) + ')';
    ctx.fillText('Press  X  or  Enter  —  1 Player      Press  G  —  2 Players', 1920, 1960);
  }

  function drawIntro(ctx, game) {
    ctx.fillStyle = 'rgba(4, 10, 20, 0.28)';
    ctx.fillRect(0, 360, SB.W, 420);
    const n = game.stage;
    iceText(ctx, 'STAGE  ' + n, 1920, 500, 120);
    font(ctx, 64, 700);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    if (game.def) ctx.fillText(game.def.name + '   ·   ' + game.def.nameZh, 1920, 640);
  }

  function drawClear(ctx, game) {
    ctx.fillStyle = 'rgba(8, 16, 32, 0.4)';
    ctx.fillRect(0, 520, SB.W, 620);
    iceText(ctx, 'STAGE CLEAR', 1920, 700, 120);
    font(ctx, 48, 700);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.fillText('过关', 1920, 820);
    if (game.def) ctx.fillText(game.def.name + '  ·  ' + game.def.nameZh, 1920, 900);
    ctx.fillStyle = '#ffe9a8';
    ctx.fillText('BONUS  ' + (game.clearBonus || 0), 1920, 990);
  }

  function drawVictory(ctx, game) {
    ctx.fillStyle = 'rgba(6, 12, 28, 0.55)';
    ctx.fillRect(0, 0, SB.W, SB.H);
    iceText(ctx, 'ALL CLEAR', 1920, 760, 140);
    font(ctx, 52, 700);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.fillText('二十关通关', 1920, 920);
    font(ctx, 36, 600);
    ctx.fillText('The snowfields are quiet. Press X for an endless night, Esc for the title.', 1920, 1040);
    ctx.fillText('雪原暂时平静了。按 X 进入无尽夜，按 Esc 回标题。', 1920, 1100);
    ctx.fillStyle = '#ffe9a8';
    font(ctx, 42, 800);
    ctx.fillText('HIGH  ' + pad(game.high || 0), 1920, 1220);
  }

  function drawOver(ctx, game) {
    ctx.fillStyle = 'rgba(8, 6, 16, 0.62)';
    ctx.fillRect(0, 0, SB.W, SB.H);
    iceText(ctx, 'GAME OVER', 1920, 760, 130);
    font(ctx, 48, 700);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.fillText('游戏结束', 1920, 900);
    font(ctx, 42, 700);
    const p1 = game.players[0];
    const p2 = game.players[1];
    ctx.fillText((p1 ? p1.name : 'Nick') + '   ' + pad(p1 ? p1.score : 0), 1920, 1020);
    if (game.playersN > 1 && p2) ctx.fillText(p2.name + '   ' + pad(p2.score), 1920, 1080);
    ctx.fillStyle = '#ffe9a8';
    ctx.fillText('HIGH  ' + pad(game.high || 0), 1920, 1180);
    if (game.newRecord) {
      ctx.fillStyle = '#ffd56a';
      ctx.fillText('NEW RECORD', 1920, 1260);
    }
    font(ctx, 36, 700);
    ctx.fillStyle = 'rgba(255,255,255,' + (0.5 + Math.sin(game.time * 4) * 0.3) + ')';
    ctx.fillText('Press X to return   ·   按 X 返回', 1920, 1380);
  }

  function drawPaused(ctx) {
    ctx.fillStyle = 'rgba(4, 8, 16, 0.45)';
    ctx.fillRect(0, 0, SB.W, SB.H);
    iceText(ctx, 'PAUSED', 1920, 1000, 120);
    font(ctx, 40, 700);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.fillText('暂停', 1920, 1120);
  }

  function drawHint(ctx, game) {
    ctx.globalAlpha = Math.min(1, game.hintT);
    font(ctx, 34, 700);
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(8,16,32,0.55)';
    const text = 'Z shoot   ·   X jump   ·   walk into a snowball to kick it';
    const zh = 'Z 发射，X 跳跃，走进雪球就能踢走';
    roundPath(ctx, 760, 248, 2320, 92, 22);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText(text, 1920, 284);
    font(ctx, 28, 600);
    ctx.fillText(zh, 1920, 322);
    ctx.globalAlpha = 1;
  }
})(globalThis.SB = globalThis.SB || {});
