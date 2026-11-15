(function (SB) {
  'use strict';

  SB.W = 3840;
  SB.H = 2160;
  SB.COLS = 20;
  SB.LEFT = 150;
  SB.FIELD_W = 3540;
  SB.TILE = 177;
  SB.RIGHT = SB.LEFT + SB.FIELD_W;
  SB.FLOOR_Y = 1968;
  SB.ROW_DY = 270;
  SB.GRAV = 3600;
  SB.JUMP = 1560;
  SB.PLAY_TOP = 260;
  SB.MAX_FALL = 1750;

  SB.clamp = function (v, a, b) {
    return Math.max(a, Math.min(b, v));
  };

  SB.mulberry32 = function (seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  // Rows: 0 is the floor. Each step up is one jump.
  // Platforms are [row, col, length]. Enemies are [type, col, row].
  SB.STAGES = [
    {
      name: 'First Snow', nameZh: '初雪', theme: 0,
      platforms: [[0, 0, 20], [1, 1, 7], [1, 12, 7], [2, 5, 10]],
      enemies: [['walker', 4, 0], ['walker', 9, 0], ['walker', 16, 0], ['walker', 3, 1], ['walker', 14, 1]],
      potion: ['yellow', 9, 2], spawns: [2, 17],
    },
    {
      name: 'Twin Bridges', nameZh: '双桥', theme: 0,
      platforms: [[0, 0, 20], [1, 0, 6], [1, 14, 6], [2, 4, 6], [2, 11, 6], [3, 7, 6]],
      enemies: [['walker', 3, 0], ['walker', 10, 0], ['walker', 17, 0], ['hopper', 2, 1], ['hopper', 16, 1], ['walker', 8, 2]],
      potion: ['red', 9, 3], spawns: [2, 18],
    },
    {
      name: 'Stepping Stones', nameZh: '踏石', theme: 0,
      platforms: [[0, 0, 20], [1, 1, 6], [1, 14, 5], [2, 5, 6], [2, 12, 6], [3, 8, 5]],
      enemies: [['walker', 4, 0], ['walker', 12, 0], ['hopper', 3, 1], ['hopper', 15, 1], ['walker', 7, 2], ['walker', 14, 2], ['hopper', 9, 3]],
      potion: ['blue', 10, 3], spawns: [2, 17],
    },
    {
      name: 'Ice Pond', nameZh: '冰池', theme: 1,
      platforms: [[0, 0, 8], [0, 12, 8], [1, 3, 14], [2, 1, 7], [2, 12, 7], [3, 5, 10]],
      enemies: [['walker', 2, 0], ['walker', 15, 0], ['hopper', 6, 1], ['hopper', 13, 1], ['walker', 3, 2], ['walker', 15, 2], ['hopper', 8, 3]],
      potion: ['green', 9, 3], spawns: [2, 16],
    },
    {
      name: 'Hopper Hollow', nameZh: '跳蛙谷', theme: 1,
      platforms: [[0, 0, 20], [1, 0, 5], [1, 8, 4], [1, 15, 5], [2, 3, 6], [2, 11, 6], [3, 6, 8]],
      enemies: [['hopper', 4, 0], ['hopper', 12, 0], ['walker', 2, 1], ['hopper', 9, 1], ['hopper', 16, 1], ['walker', 5, 2], ['hopper', 13, 2], ['hopper', 8, 3]],
      potion: ['yellow', 9, 3], spawns: [2, 17],
    },
    {
      name: 'Lantern Night', nameZh: '灯夜', theme: 1,
      platforms: [[0, 0, 20], [1, 2, 16], [2, 0, 7], [2, 13, 7], [3, 4, 12], [4, 8, 4]],
      enemies: [['walker', 5, 0], ['walker', 15, 0], ['walker', 8, 1], ['wisp', 3, 2], ['wisp', 16, 2], ['hopper', 10, 3], ['wisp', 9, 4]],
      potion: ['blue', 9, 4], spawns: [3, 16],
    },
    {
      name: 'Broken Shelf', nameZh: '断架', theme: 2,
      platforms: [[0, 0, 7], [0, 13, 7], [1, 4, 12], [2, 0, 5], [2, 8, 4], [2, 15, 5], [3, 3, 6], [3, 11, 6], [4, 7, 6]],
      enemies: [['walker', 2, 0], ['walker', 16, 0], ['hopper', 7, 1], ['wisp', 10, 1], ['walker', 2, 2], ['hopper', 16, 2], ['walker', 5, 3], ['wisp', 13, 3], ['hopper', 9, 4]],
      potion: ['red', 9, 4], spawns: [2, 16],
    },
    {
      name: 'High Roosts', nameZh: '高栖', theme: 2,
      platforms: [[0, 0, 20], [1, 1, 5], [1, 14, 5], [2, 4, 5], [2, 11, 5], [3, 7, 6], [4, 5, 4], [4, 11, 4], [5, 7, 6]],
      enemies: [['walker', 6, 0], ['hopper', 13, 0], ['wisp', 2, 1], ['wisp', 16, 1], ['hopper', 6, 2], ['walker', 13, 2], ['hopper', 9, 3], ['wisp', 6, 4], ['wisp', 12, 4], ['walker', 9, 5]],
      potion: ['green', 8, 5], spawns: [3, 16],
    },
    {
      name: 'Gate Road', nameZh: '城门路', theme: 2,
      platforms: [[0, 0, 20], [1, 0, 9], [1, 11, 9], [2, 2, 6], [2, 12, 6], [3, 5, 10], [4, 1, 5], [4, 8, 4], [4, 14, 5]],
      enemies: [['walker', 3, 0], ['walker', 8, 0], ['walker', 15, 0], ['hopper', 4, 1], ['hopper', 15, 1], ['wisp', 4, 2], ['wisp', 14, 2], ['walker', 8, 3], ['hopper', 2, 4], ['wisp', 9, 4], ['hopper', 16, 4]],
      potion: ['blue', 9, 3], spawns: [2, 17],
    },
    {
      name: 'Frost Monarch', nameZh: '霜王', theme: 3, boss: true, bossKind: 1,
      platforms: [[0, 0, 6], [0, 14, 6], [1, 2, 6], [1, 12, 6], [2, 5, 10], [3, 3, 5], [3, 12, 5], [4, 6, 8]],
      enemies: [['boss', 8, 2], ['walker', 2, 0], ['walker', 16, 0], ['hopper', 4, 3], ['wisp', 9, 4]],
      potion: ['green', 8, 4], spawns: [1, 17],
    },
    {
      name: 'Aurora Steps', nameZh: '极光阶', theme: 4,
      platforms: [[0, 0, 20], [1, 3, 14], [2, 0, 7], [2, 13, 7], [3, 4, 5], [3, 11, 5], [4, 7, 6]],
      enemies: [['walker', 5, 0], ['hopper', 12, 0], ['walker', 9, 1], ['wisp', 2, 2], ['wisp', 16, 2], ['hopper', 6, 3], ['hopper', 13, 3], ['walker', 9, 4]],
      potion: ['yellow', 9, 4], spawns: [4, 16],
    },
    {
      name: 'Quiet Attic', nameZh: '静阁楼', theme: 4,
      platforms: [[0, 0, 20], [1, 0, 5], [1, 8, 4], [1, 15, 5], [2, 2, 8], [2, 11, 7], [3, 6, 8], [4, 4, 4], [4, 12, 4]],
      enemies: [['hopper', 2, 0], ['walker', 10, 0], ['hopper', 17, 0], ['wisp', 4, 2], ['wisp', 14, 2], ['walker', 8, 3], ['hopper', 5, 4], ['hopper', 13, 4]],
      potion: ['red', 9, 3], spawns: [2, 17],
    },
    {
      name: 'Glass Garden', nameZh: '玻璃园', theme: 4,
      platforms: [[0, 0, 5], [0, 8, 4], [0, 15, 5], [1, 2, 8], [1, 11, 7], [2, 0, 4], [2, 6, 8], [2, 16, 4], [3, 4, 12]],
      enemies: [['walker', 1, 0], ['walker', 9, 0], ['walker', 17, 0], ['hopper', 4, 1], ['walker', 2, 2], ['wisp', 8, 2], ['wisp', 17, 2], ['hopper', 10, 3]],
      potion: ['green', 8, 3], spawns: [1, 17],
    },
    {
      name: 'Crosswinds', nameZh: '侧风', theme: 5,
      platforms: [[0, 0, 20], [1, 5, 10], [2, 1, 6], [2, 8, 4], [2, 13, 6], [3, 4, 12], [4, 8, 4]],
      enemies: [['walker', 3, 0], ['hopper', 10, 0], ['walker', 16, 0], ['hopper', 9, 1], ['wisp', 3, 2], ['wisp', 15, 2], ['walker', 6, 3], ['hopper', 12, 3], ['wisp', 9, 4]],
      potion: ['blue', 9, 4], spawns: [2, 17],
    },
    {
      name: 'Moon Scaffolds', nameZh: '月台', theme: 5,
      platforms: [[0, 0, 20], [1, 0, 8], [1, 12, 8], [2, 6, 8], [3, 1, 6], [3, 13, 6], [4, 5, 10], [5, 8, 4]],
      enemies: [['hopper', 3, 0], ['walker', 10, 0], ['hopper', 16, 0], ['wisp', 3, 1], ['wisp', 15, 1], ['walker', 8, 2], ['hopper', 3, 3], ['hopper', 15, 3], ['wisp', 8, 4], ['walker', 9, 5]],
      potion: ['yellow', 9, 5], spawns: [2, 17],
    },
    {
      name: 'Narrow Ice', nameZh: '窄冰', theme: 5,
      platforms: [[0, 0, 4], [0, 16, 4], [1, 2, 6], [1, 12, 6], [2, 6, 8], [3, 4, 5], [3, 11, 5], [4, 5, 10], [5, 8, 4]],
      enemies: [['walker', 1, 0], ['walker', 17, 0], ['hopper', 4, 1], ['hopper', 14, 1], ['wisp', 8, 2], ['wisp', 6, 4], ['wisp', 12, 4], ['hopper', 9, 5]],
      potion: ['red', 9, 4], spawns: [1, 17],
    },
    {
      name: 'Pebble Roofs', nameZh: '卵石顶', theme: 6,
      platforms: [[0, 0, 20], [1, 2, 4], [1, 8, 4], [1, 14, 4], [2, 0, 6], [2, 14, 6], [3, 5, 10], [4, 3, 6], [4, 11, 6], [5, 7, 6]],
      enemies: [['walker', 4, 0], ['hopper', 10, 0], ['walker', 16, 0], ['wisp', 2, 2], ['wisp', 16, 2], ['hopper', 8, 3], ['walker', 5, 4], ['hopper', 13, 4], ['wisp', 9, 5]],
      potion: ['green', 9, 5], spawns: [3, 16],
    },
    {
      name: 'Split Hearth', nameZh: '分炉', theme: 6,
      platforms: [[0, 0, 9], [0, 11, 9], [1, 6, 8], [2, 1, 7], [2, 12, 7], [3, 4, 5], [3, 11, 5], [4, 7, 6]],
      enemies: [['walker', 3, 0], ['walker', 15, 0], ['hopper', 8, 1], ['wisp', 3, 2], ['wisp', 15, 2], ['hopper', 6, 3], ['hopper', 13, 3], ['walker', 9, 4]],
      potion: ['blue', 9, 4], spawns: [2, 16],
    },
    {
      name: 'Last Village', nameZh: '末村', theme: 6,
      platforms: [[0, 0, 20], [1, 0, 20], [2, 0, 6], [2, 14, 6], [3, 4, 12], [4, 1, 4], [4, 8, 4], [4, 15, 4], [5, 6, 8]],
      enemies: [['walker', 3, 0], ['walker', 10, 0], ['walker', 16, 0], ['hopper', 5, 1], ['hopper', 14, 1], ['wisp', 2, 2], ['wisp', 16, 2], ['walker', 8, 3], ['hopper', 2, 4], ['wisp', 9, 4], ['hopper', 16, 4], ['walker', 9, 5]],
      potion: ['yellow', 10, 5], spawns: [4, 15],
    },
    {
      name: 'Hail Regent', nameZh: '雹君', theme: 7, boss: true, bossKind: 2,
      platforms: [[0, 0, 5], [0, 15, 5], [1, 3, 5], [1, 12, 5], [2, 6, 8], [3, 4, 5], [3, 11, 5], [4, 5, 10]],
      enemies: [['boss', 8, 2], ['hopper', 1, 0], ['hopper', 17, 0], ['wisp', 5, 3], ['wisp', 13, 3], ['walker', 8, 4]],
      potion: ['red', 7, 4], spawns: [1, 17],
    },
  ];

  SB.stageDef = function (n) {
    const len = SB.STAGES.length;
    const idx = ((n - 1) % len + len) % len;
    const base = SB.STAGES[idx];
    const loop = Math.floor((n - 1) / len);
    return {
      name: base.name + (loop ? ' +' + loop : ''),
      nameZh: base.nameZh,
      theme: base.theme,
      boss: !!base.boss,
      bossKind: base.bossKind || 1,
      platforms: base.platforms,
      enemies: base.enemies,
      potion: base.potion,
      spawns: base.spawns,
      number: n,
      loop: loop,
      index: idx,
    };
  };

  SB.buildLayout = function (def) {
    return def.platforms.map(function (p) {
      const r = p[0];
      const c = p[1];
      const len = p[2];
      return {
        r: r,
        c: c,
        len: len,
        x: SB.LEFT + c * SB.TILE,
        y: SB.FLOOR_Y - r * SB.ROW_DY,
        w: len * SB.TILE,
        h: 52,
      };
    });
  };

  function overlaps(a, b) {
    return a.c < b.c + b.len && b.c < a.c + a.len;
  }

  function onPlat(def, col, row) {
    return def.platforms.some(function (p) {
      return p[0] === row && col >= p[1] && col < p[1] + p[2];
    });
  }

  SB.validateAll = function () {
    const errors = [];
    const types = new Set();
    if (SB.STAGES.length < 10) errors.push('need at least 10 stages');
    SB.STAGES.forEach(function (def, i) {
      const n = i + 1;
      const tag = 'stage ' + n;
      if (!def.platforms || !def.platforms.length) errors.push(tag + ' has no platforms');
      if (!def.enemies || !def.enemies.length) errors.push(tag + ' has no enemies');
      const expectBoss = n % 10 === 0;
      if (expectBoss !== !!def.boss) errors.push(tag + ' boss flag mismatch');
      let bosses = 0;
      def.platforms.forEach(function (p) {
        if (p[0] < 0 || p[0] > 5) errors.push(tag + ' bad row ' + p[0]);
        if (p[1] < 0 || p[2] < 3 || p[1] + p[2] > SB.COLS) errors.push(tag + ' bad span ' + p.join(','));
      });
      (def.enemies || []).forEach(function (e, ei) {
        types.add(e[0]);
        if (e[0] === 'boss') bosses += 1;
        if (!onPlat(def, e[1], e[2])) errors.push(tag + ' enemy ' + ei + ' ' + e.join(',') + ' off platform');
      });
      if (expectBoss && bosses !== 1) errors.push(tag + ' should have one boss');
      if (!expectBoss && bosses) errors.push(tag + ' unexpected boss');
      if (def.potion && !onPlat(def, def.potion[1], def.potion[2])) {
        errors.push(tag + ' potion off platform');
      }
      const nodes = def.platforms.map(function (p, idx) {
        return { r: p[0], c: p[1], len: p[2], i: idx };
      });
      const spawn = (def.spawns || [2])[0];
      let start = null;
      nodes.forEach(function (node) {
        if (spawn >= node.c && spawn < node.c + node.len && (!start || node.r < start.r)) start = node;
      });
      if (!start) {
        errors.push(tag + ' spawn not on a platform');
        return;
      }
      const seen = new Set([start.i]);
      let changed = true;
      let guard = 0;
      while (changed && guard++ < 80) {
        changed = false;
        nodes.forEach(function (p) {
          if (!seen.has(p.i)) return;
          nodes.forEach(function (q) {
            if (seen.has(q.i) || !overlaps(p, q)) return;
            if (q.r === p.r + 1 || q.r < p.r) {
              seen.add(q.i);
              changed = true;
            }
          });
        });
      }
      if (seen.size !== nodes.length) {
        const missing = nodes.filter(function (node) { return !seen.has(node.i); })
          .map(function (node) { return node.r + ':' + node.c + 'x' + node.len; });
        errors.push(tag + ' unreachable ' + missing.join(', '));
      }
    });
    ['walker', 'hopper', 'wisp'].forEach(function (t) {
      if (!types.has(t)) errors.push('missing enemy type ' + t);
    });
    return errors;
  };
})(globalThis.SB = globalThis.SB || {});
