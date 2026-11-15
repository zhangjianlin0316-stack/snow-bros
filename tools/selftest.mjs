import fs from 'fs';
import vm from 'vm';

const files = ['js/audio.js', 'js/stages.js', 'js/game.js', 'js/bot.js'];
const sandbox = {
  console,
  Math,
  performance: { now: () => Date.now() },
  setTimeout,
  clearTimeout,
};
sandbox.globalThis = sandbox;
sandbox.window = sandbox;
vm.createContext(sandbox);
for (const file of files) {
  vm.runInContext(fs.readFileSync(file, 'utf8'), sandbox, { filename: file });
}

const result = sandbox.SB.selfTest();
console.log(result.log);
if (!result.ok) {
  console.error(result.errors.join('\n'));
  process.exit(1);
}

const idle = {
  left: false, right: false, up: false, down: false,
  jump: false, shoot: false, jumpPressed: false, shootPressed: false, aim: 0,
};
sandbox.SB.input.p1 = idle;
sandbox.SB.input.p2 = idle;
sandbox.SB.input.pausePressed = false;
sandbox.SB.input.start1 = false;
sandbox.SB.input.start2 = false;
sandbox.SB.audio.muted = true;

function playOnce() {
  const game = new sandbox.SB.Game();
  game.testing = true;
  game.start(1);
  const limit = 60 * 180;
  let frames = 0;
  let lastStage = 1;
  const seen = new Set([1]);
  while (frames < limit && game.stage < 4 && game.state !== 'over' && game.state !== 'victory') {
    sandbox.SB.botThink(game);
    game.update(1 / 60);
    frames += 1;
    if (game.stage !== lastStage) {
      seen.add(game.stage);
      lastStage = game.stage;
    }
  }
  const p = game.players[0];
  return {
    stage: game.stage,
    state: game.state,
    score: p.score,
    lives: p.lives,
    seconds: +(frames / 60).toFixed(1),
    enemies: game.enemies.length,
    seen: [...seen],
  };
}

const runs = [];
for (let i = 0; i < 4; i += 1) runs.push(playOnce());
console.log(JSON.stringify(runs, null, 2));
if (!runs.some((run) => run.seen.includes(3))) {
  console.error('bot did not clear the opening stages');
  process.exit(1);
}
