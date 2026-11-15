(function (SB) {
  'use strict';

  function blank() {
    return {
      left: false, right: false, up: false, down: false,
      jump: false, shoot: false, jumpPressed: false, shootPressed: false, aim: 0,
    };
  }

  function cx(ent) { return ent.x + ent.w / 2; }
  function foot(ent) { return ent.y + ent.h; }
  function jumpBlocked(actives, pcx, pfoot) {
    for (let i = 0; i < actives.length; i += 1) {
      const e = actives[i];
      const fy = foot(e);
      if (Math.abs(cx(e) - pcx) < 140 && fy < pfoot - 10 && fy > pfoot - 420) return true;
    }
    return false;
  }

  SB.botThink = function (game) {
    const o = blank();
    const o2 = blank();
    if (!SB.input) SB.input = {};
    SB.input.p1 = o;
    SB.input.p2 = o2;
    const p = game.players && game.players[0];
    if (!p || game.state !== 'play' || !p.alive || p.dying > 0) return;
    const actives = game.enemies.filter(function (e) { return e.state === 'active' && !e._gone; });
    const balls = game.enemies.filter(function (e) {
      return e.state === 'snowball' && !e._gone && Math.abs(e.vx) < 220;
    });
    const pcx = cx(p);
    const pfoot = foot(p);

    let target = null;
    if (balls.length) {
      balls.sort(function (a, b) { return Math.abs(cx(a) - pcx) - Math.abs(cx(b) - pcx); });
      target = balls[0];
      const ball = target;
      const bcx = cx(ball);
      let want = 1;
      if (actives.length) {
        let best = actives[0];
        let bd = Infinity;
        actives.forEach(function (e) {
          const d = Math.abs(cx(e) - bcx) + Math.abs(foot(e) - foot(ball)) * 2;
          if (d < bd) { bd = d; best = e; }
        });
        want = Math.sign(cx(best) - bcx) || 1;
      } else {
        const plat = game.platforms.find(function (pl) {
          return bcx >= pl.x && bcx <= pl.x + pl.w && Math.abs(pl.y - foot(ball)) < 36;
        });
        if (plat) want = (bcx - plat.x) < (plat.x + plat.w - bcx) ? -1 : 1;
      }
      const goal = bcx - want * (ball.w * 0.5 + 36);
      if (Math.abs(pcx - goal) > 28) {
        o.left = goal < pcx;
        o.right = goal > pcx;
      } else {
        o.left = want < 0;
        o.right = want > 0;
      }
      const dy = foot(ball) - pfoot;
      if (dy < -160 && Math.abs(bcx - pcx) < 220) o.jumpPressed = true;
    } else if (actives.length) {
      actives.sort(function (a, b) {
        const da = Math.abs(foot(a) - pfoot) * 3 + Math.abs(cx(a) - pcx);
        const db = Math.abs(foot(b) - pfoot) * 3 + Math.abs(cx(b) - pcx);
        return da - db;
      });
      target = actives[0];
      const dx = cx(target) - pcx;
      const dy = foot(target) - pfoot;
      o.aim = dx >= 0 ? 1 : -1;
      if (Math.abs(dy) < 120) {
        const adx = Math.abs(dx);
        if (adx < 190) {
          o.left = dx > 0;
          o.right = dx < 0;
          o.shoot = true;
        } else if (adx < 530) {
          o.shoot = true;
          if (adx > 430) {
            o.left = dx < 0;
            o.right = dx > 0;
          }
        } else {
          o.left = dx < 0;
          o.right = dx > 0;
        }
      } else {
        o.left = dx < 0;
        o.right = dx > 0;
        if (dy < -150 && dy > -430) {
          if (Math.abs(dx) < 90 || jumpBlocked(actives, pcx, pfoot)) {
            o.left = dx >= 0;
            o.right = dx < 0;
          } else if (Math.abs(dx) < 240) o.jumpPressed = true;
        }
      }
      const mine = game.platforms.find(function (pl) {
        return pcx >= pl.x && pcx <= pl.x + pl.w && Math.abs(pl.y - pfoot) < 24;
      });
      if (mine && p.onGround && !jumpBlocked(actives, pcx, pfoot)) {
        const same = Math.abs(foot(target) - mine.y) < 36 && cx(target) > mine.x && cx(target) < mine.x + mine.w;
        if (!same) {
          const above = game.platforms.some(function (pl) {
            return pl.y < mine.y - 80 && mine.y - pl.y < SB.ROW_DY + 50
              && pcx > pl.x + 16 && pcx < pl.x + pl.w - 16;
          });
          if (above) o.jumpPressed = true;
        }
      }
    }

    if (p.onGround && (o.left || o.right)) {
      const dir = o.right ? 1 : -1;
      const probe = pcx + dir * 78;
      const supported = game.platforms.some(function (pl) {
        return probe > pl.x + 6 && probe < pl.x + pl.w - 6 && Math.abs(pl.y - pfoot) < 30;
      });
      if (!supported) {
        const below = target && foot(target) > pfoot + 120;
        if (!below) {
          const above = game.platforms.some(function (pl) {
            return probe > pl.x && probe < pl.x + pl.w && pl.y < pfoot - 40 && pfoot - pl.y < 420;
          });
          if (above) o.jumpPressed = true;
          else {
            o.left = dir > 0;
            o.right = dir < 0;
            o.jumpPressed = false;
          }
        }
      }
    }

    const near = actives.find(function (e) {
      return Math.abs(cx(e) - pcx) < 200 && Math.abs(foot(e) - pfoot) < 150;
    });
    if (near) {
      const dx = cx(near) - pcx;
      o.left = dx > 0;
      o.right = dx < 0;
      o.shoot = true;
      o.aim = dx >= 0 ? 1 : -1;
      o.jump = false;
      o.jumpPressed = false;
    }

    for (let i = 0; i < game.projectiles.length; i += 1) {
      const pr = game.projectiles[i];
      if (pr.dead) continue;
      if (Math.abs(pr.x - pcx) < 90 && pr.y < p.y + p.h && p.y + p.h - pr.y < 260) {
        o.left = pr.x >= pcx;
        o.right = pr.x < pcx;
        o.jumpPressed = true;
      }
    }
    if (o.jumpPressed && jumpBlocked(actives, pcx, pfoot)) o.jumpPressed = false;
    if (o.jumpPressed) o.jump = true;
  };
})(globalThis.SB = globalThis.SB || {});
