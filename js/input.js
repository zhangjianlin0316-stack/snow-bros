(function (SB) {
  'use strict';

  const held = new Set();
  const pressed = new Set();

  const BLOCK = {
    ArrowUp: 1, ArrowDown: 1, ArrowLeft: 1, ArrowRight: 1, Space: 1,
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', function (e) {
      if (BLOCK[e.code]) e.preventDefault();
      if (e.repeat) return;
      if (!held.has(e.code)) pressed.add(e.code);
      held.add(e.code);
    });
    window.addEventListener('keyup', function (e) {
      held.delete(e.code);
    });
    window.addEventListener('blur', function () {
      held.clear();
    });
  }

  function any(codes) {
    const list = Array.isArray(codes) ? codes : [codes];
    for (let i = 0; i < list.length; i += 1) if (held.has(list[i])) return true;
    return false;
  }

  function edge(codes) {
    const list = Array.isArray(codes) ? codes : [codes];
    for (let i = 0; i < list.length; i += 1) if (pressed.has(list[i])) return true;
    return false;
  }

  const padPrev = [new Array(16).fill(false), new Array(16).fill(false)];

  function readPad(index) {
    let pads = [];
    try {
      pads = navigator.getGamepads ? navigator.getGamepads() : [];
    } catch (err) {
      return null;
    }
    const gp = pads && pads[index];
    if (!gp) return null;
    const ax = gp.axes || [];
    const buttons = gp.buttons || [];
    const dead = 0.35;
    const prev = padPrev[index];
    const btn = function (i) { return !!(buttons[i] && buttons[i].pressed); };
    const edgeBtn = function (i) { return btn(i) && !prev[i]; };
    const out = {
      left: (ax[0] || 0) < -dead || btn(14),
      right: (ax[0] || 0) > dead || btn(15),
      up: (ax[1] || 0) < -dead || btn(12),
      down: (ax[1] || 0) > dead || btn(13),
      jump: btn(0) || btn(3),
      shoot: btn(1) || btn(2),
      jumpPressed: edgeBtn(0) || edgeBtn(3) || (btn(12) && !prev[12]),
      shootPressed: edgeBtn(1) || edgeBtn(2),
      start: edgeBtn(9),
    };
    for (let i = 0; i < 16; i += 1) prev[i] = btn(i);
    return out;
  }

  function mix(keyState, pad) {
    if (!pad) return keyState;
    return {
      left: keyState.left || pad.left,
      right: keyState.right || pad.right,
      up: keyState.up || pad.up,
      down: keyState.down || pad.down,
      jump: keyState.jump || pad.jump,
      shoot: keyState.shoot || pad.shoot,
      jumpPressed: keyState.jumpPressed || pad.jumpPressed,
      shootPressed: keyState.shootPressed || pad.shootPressed,
      aim: keyState.aim || 0,
    };
  }

  SB.input = {
    p1: {},
    p2: {},
    pausePressed: false,
    mutePressed: false,
    start1: false,
    start2: false,
    any: false,
    poll: function () {
      const pad1 = typeof navigator !== 'undefined' ? readPad(0) : null;
      const pad2 = typeof navigator !== 'undefined' ? readPad(1) : null;
      const k1 = {
        left: any('ArrowLeft'),
        right: any('ArrowRight'),
        up: any('ArrowUp'),
        down: any('ArrowDown'),
        jump: any(['KeyX', 'ArrowUp']),
        shoot: any('KeyZ'),
        jumpPressed: edge(['KeyX', 'ArrowUp']),
        shootPressed: edge('KeyZ'),
        aim: 0,
      };
      const k2 = {
        left: any('KeyA'),
        right: any('KeyD'),
        up: any('KeyW'),
        down: any('KeyS'),
        jump: any(['KeyG', 'KeyW']),
        shoot: any('KeyF'),
        jumpPressed: edge(['KeyG', 'KeyW']),
        shootPressed: edge('KeyF'),
        aim: 0,
      };
      this.p1 = mix(k1, pad1);
      this.p2 = mix(k2, pad2);
      this.pausePressed = pressed.has('KeyP') || pressed.has('Escape') || !!(pad1 && pad1.start) || !!(pad2 && pad2.start);
      this.mutePressed = pressed.has('KeyM');
      this.start1 = pressed.has('Enter') || pressed.has('Space') || pressed.has('KeyX') || pressed.has('KeyZ')
        || !!(pad1 && (pad1.start || pad1.jumpPressed));
      this.start2 = pressed.has('KeyG') || !!(pad2 && (pad2.start || pad2.jumpPressed));
      this.any = pressed.size > 0 || !!(pad1 && (pad1.jumpPressed || pad1.shootPressed || pad1.start));
    },
    endFrame: function () {
      pressed.clear();
    },
  };
})(globalThis.SB = globalThis.SB || {});
