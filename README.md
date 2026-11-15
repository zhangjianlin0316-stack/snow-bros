# Snow Bros · 雪人兄弟

Unofficial 4K browser tribute to Toaplan’s 1990 arcade game **Snow Bros.** (雪人兄弟). Nick and Tom pack monsters in snow, then kick the snowballs so they bounce off the walls and bowl through the rest of the round.

This is a fan game. It does not use the original ROM, sprites, music, or logos. All art is drawn in the canvas, and the music is synthesized in the browser. Toaplan and Snow Bros are the property of their owners. This project is not affiliated with them.

No build step. The game is static HTML, CSS, and JavaScript.

## Play / 开始

Open `index.html` in a browser, or serve the folder and open the site root:

```bash
python3 -m http.server 8765
```

Then visit `http://127.0.0.1:8765/`.

Click the page or press a key once so the browser can start audio.

## How to play

Each round is one screen of platforms. You can walk off the left edge and come back on the right.

1. **Shoot** snow into an enemy. A few hits pack them into a snowball.
2. **Walk into the snowball** to kick it. It rolls, speeds up, and bounces off the side walls up toward higher platforms.
3. A rolling snowball knocks out other enemies for a rising combo. If you leave a snowball sitting, the enemy thaws and breaks out.
4. Clear every enemy to finish the stage. Falling into a pit costs a life. You start with 3 lives. Extra lives are awarded as your score climbs.
5. Every 10th stage is a boss. Pack the boss in snow, then kick that snowball into a pit.
6. After stage 20 the game shows a clear screen. Continue for a harder loop of the same realms, or return to the title. The best score is stored in `localStorage`.

### Potions

| Color | Effect |
| --- | --- |
| Red | Faster movement (stacks up to 3, lasts until you are hit) |
| Blue | Heavier snow shots, so enemies freeze in fewer hits |
| Yellow | Longer shot range |
| Green | A few seconds as an invincible balloon. Touch enemies to pop them, and hold jump to float |

### Controls

| | Move | Shoot | Jump |
| --- | --- | --- | --- |
| 1P Nick | Arrow keys | Z | X |
| 2P Tom | A / D | F | W or G |

- **P** or **Esc** pauses. **M** or the Sound button mutes. Mute is remembered.
- On the title screen, **X** or **Enter** starts one player. **G** starts two players on the same keyboard.
- A gamepad works too: left stick or d-pad to move, **A** to jump, **B** to shoot, **Start** to begin or pause. The second pad is player 2.

## GitHub Pages

The site is a static root. `.nojekyll` is included so Pages serves every file.

1. Push the repository to GitHub.
2. Open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select branch `main` (or the branch you publish) and folder **`/ (root)`**.
5. Save. The game will be at `https://<user>.github.io/<repo>/`.

No build command is required. Do not set a publishing directory other than the repository root.

---

## 中文说明

这是对东亚计划 1990 年街机游戏 **雪人兄弟（Snow Bros.）** 的非官方浏览器致敬作品。尼克和汤姆把怪物射成雪球，再把雪球踢出去。雪球会撞墙反弹，并连撞其他敌人得分。

本项目没有使用原版 ROM、像素图或音乐，画面和音效都在浏览器里即时绘制和合成。与东亚计划及 Snow Bros. 的权利人无关。

不需要构建。直接用浏览器打开 `index.html`，或者在仓库目录启动静态服务器：

```bash
python3 -m http.server 8765
```

然后访问 `http://127.0.0.1:8765/`。第一次请点击页面或按任意键，以便浏览器允许播放声音。

### 玩法

每一关都是一屏平台。从屏幕左侧走出去，会从右侧回来。

1. **射击**把敌人逐渐包进雪里。打满之后敌人会变成雪球。
2. **走进雪球**就会把它踢走。雪球会加速滚动，撞到左右边界时向上弹，从而够到更高的平台。
3. 滚动的雪球撞到其他敌人会连击加分。雪球如果停在原地太久，里面的敌人会挣脱。
4. 消灭全部敌人即过关。掉进地洞会失去一条命。开局 3 条命，分数达到一定数值会加命。
5. 每 10 关是首领。把首领射成大雪球，再踢进地洞。
6. 通过第 20 关后可以选择进入更难的循环，或回到标题。最高分保存在浏览器的 `localStorage` 里。

### 药水

| 颜色 | 效果 |
| --- | --- |
| 红 | 移动变快，最多叠 3 层，被击中后消失 |
| 蓝 | 雪弹更大，更少下数就能冻住敌人 |
| 黄 | 射程更远 |
| 绿 | 短时间变成无敌气球，碰到敌人即可消灭，按住跳跃可以上浮 |

### 操作

| | 移动 | 射击 | 跳跃 |
| --- | --- | --- | --- |
| 1P 尼克 | 方向键 | Z | X |
| 2P 汤姆 | A / D | F | W 或 G |

- **P** 或 **Esc** 暂停。**M** 或右下角的 Sound 按钮静音，设置会被记住。
- 标题画面按 **X** 或 **Enter** 开始单人，按 **G** 开始双人同键盘。
- 手柄：左摇杆或十字键移动，**A** 跳跃，**B** 射击，**Start** 开始或暂停。第二个手柄是 2P。

### 启用 GitHub Pages

仓库根目录就是网站。已经放了 `.nojekyll`，避免 Pages 漏掉文件。

1. 把仓库推到 GitHub。
2. 打开 **Settings → Pages**。
3. 在 **Build and deployment** 里选择 **Deploy from a branch**。
4. 分支选 `main`（或你要发布的分支），文件夹选 **`/ (root)`**。
5. 保存。游戏地址是 `https://<用户名>.github.io/<仓库名>/`。

不需要构建命令，发布目录请保持仓库根目录。
