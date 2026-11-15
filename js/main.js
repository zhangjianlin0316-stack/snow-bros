(function (SB) {
  'use strict';

  window.addEventListener('error', function (e) {
    document.title = 'ERR ' + (e.message || 'script error');
  });

  const canvas = document.getElementById('game');
  const muteBtn = document.getElementById('mute');
  const testOut = document.getElementById('test-out');
  const ctx = canvas.getContext('2d', { alpha: false });
  const params = new URLSearchParams(location.search);
  const game = new SB.Game();
  SB.game = game;
  SB.botEnabled = params.has('bot');

  function fit() {
    const dpr = window.devicePixelRatio || 1;
    const aspect = 16 / 9;
    let cssW = window.innerWidth;
    let cssH = cssW / aspect;
    if (cssH > window.innerHeight) {
      cssH = window.innerHeight;
      cssW = cssH * aspect;
    }
    const physW = Math.max(1, Math.round(cssW * dpr));
    const physH = Math.max(1, Math.round(physW / aspect));
    canvas.style.width = (physW / dpr) + 'px';
    canvas.style.height = (physH / dpr) + 'px';
    if (canvas.width !== SB.W) canvas.width = SB.W;
    if (canvas.height !== SB.H) canvas.height = SB.H;
  }

  function syncMute() {
    const muted = !!(SB.audio && SB.audio.muted);
    muteBtn.setAttribute('aria-pressed', muted ? 'true' : 'false');
    muteBtn.textContent = muted ? 'Muted' : 'Sound';
  }

  fit();
  syncMute();
  window.addEventListener('resize', fit);
  muteBtn.addEventListener('pointerdown', function (e) {
    e.stopPropagation();
    e.preventDefault();
    SB.audio.unlock();
    SB.audio.toggle();
    syncMute();
  });
  canvas.addEventListener('pointerdown', function () {
    SB.audio.unlock();
    if (game.state === 'title') game.pointerStart = 1;
    else if (game.state === 'over' || game.state === 'victory') game.pointerStart = 1;
  });
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  document.addEventListener('visibilitychange', function () {
    if (!SB.audio.ctx) return;
    if (document.hidden) SB.audio.ctx.suspend().catch(function () {});
    else SB.audio.ctx.resume().catch(function () {});
  });
  canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); });

  if (params.has('autotest')) {
    const result = SB.selfTest();
    const drawErrors = [];
    try {
      for (let s = 1; s <= SB.STAGES.length; s += 1) {
        game.testing = true;
        game.playersN = 1;
        game.players = [];
        game.makePlayers(1);
        game.loadStage(s);
        game.state = 'play';
        SB.draw.frame(ctx, game);
        const pix = ctx.getImageData(200, 200, 1, 1).data;
        if (pix[0] + pix[1] + pix[2] < 8) drawErrors.push('stage ' + s + ' drew black');
      }
      game.state = 'title';
      game.themeIndex = 0;
      game.rebake();
      SB.draw.frame(ctx, game);
    } catch (err) {
      drawErrors.push('draw threw ' + err.message);
    }
    const ok = result.ok && !drawErrors.length;
    const text = result.log + (drawErrors.length ? '\n' + drawErrors.join('\n') : '\n') + (ok ? '\nDRAW PASS' : '');
    testOut.style.display = 'block';
    testOut.textContent = text;
    document.title = ok ? 'AUTOTEST PASS' : 'AUTOTEST FAIL';
    SB.draw.frame(ctx, game.state === 'title' ? game : game);
    return;
  }

  if (params.has('auto') || params.has('shot')) {
    const n = parseInt(params.get('stage') || '1', 10) || 1;
    if (params.has('shot')) SB.botEnabled = true;
    game.start(params.get('players') === '2' ? 2 : 1);
    if (n > 1) game.loadStage(n);
    if (params.has('play') || params.has('shot')) {
      game.state = 'play';
      game.introT = 0;
      game.lock = 0;
      game.players.forEach(function (p) { p.invuln = 0.4; });
    }
    if (params.has('shot')) {
      SB.audio.muted = true;
      const frames = parseInt(params.get('frames') || '150', 10) || 150;
      for (let i = 0; i < frames; i += 1) {
        SB.botThink(game);
        game.update(1 / 60);
      }
      SB.draw.frame(ctx, game);
      document.title = 'SHOT stage ' + game.stage + ' ' + game.state + ' score ' + (game.players[0] ? game.players[0].score : 0);
    }
  }

  let last = performance.now();
  let acc = 0;
  const STEP = 1 / 60;

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    SB.input.poll();
    if (SB.botEnabled) SB.botThink(game);
    if (SB.input.mutePressed) {
      SB.audio.toggle();
      syncMute();
    }
    if (SB.input.any || game.pointerStart) SB.audio.unlock();
    acc += dt;
    let steps = 0;
    while (acc >= STEP && steps < 5) {
      game.update(STEP);
      acc -= STEP;
      steps += 1;
    }
    SB.input.endFrame();
    SB.audio.update(dt);
    SB.draw.frame(ctx, game);
    requestAnimationFrame(frame);
  }

  SB.audio.setMode('title');
  document.documentElement.dataset.ready = '1';
  requestAnimationFrame(frame);
})(window.SB = window.SB || {});
