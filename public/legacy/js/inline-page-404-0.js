(function () {
      const hero = document.getElementById('hero404');
      const wrap = document.getElementById('tronWrap');
      const hud = document.getElementById('tronHud');
      const canvas = document.getElementById('tron-canvas');
      const ctx = canvas.getContext('2d');
      const scoreEl = document.getElementById('tronScore');
      const bestEl = document.getElementById('tronBest');
      const msgEl = document.getElementById('tronMsg');
      const hintStart = document.getElementById('hintStart');
      const pauseBtn = document.getElementById('tronPauseBtn');
      const restartBtn = document.getElementById('tronRestartBtn');
      const gameState = document.getElementById('tronGameState');
      const gameStateTitle = document.getElementById('tronGameStateTitle');
      const gameStateText = document.getElementById('tronGameStateText');
      const gameStateMeta = document.getElementById('tronGameStateMeta');
      const diffButtons = Array.from(document.querySelectorAll('.tron-difficulty__btn'));

      if (!canvas || !ctx) return;

      const W = 700;
      const H = 460;
      const CELL = 10;
      const COLS = W / CELL;
      const ROWS = H / CELL;

      canvas.width = W;
      canvas.height = H;

      const C = {
        bg: '#04060f',
        grid: 'rgba(127,119,221,0.04)',
        p1: '#7F77DD',
        p1glow: 'rgba(127,119,221,0.6)',
        p1trail: 'rgba(127,119,221,0.35)',
        ai: '#D4537E',
        aiglow: 'rgba(212,83,126,0.6)',
        aitrail: 'rgba(212,83,126,0.3)'
      };

      const DIFFICULTY = {
        easy:   { label: 'Легко',  baseSpeed: 110, minSpeed: 72, accelEvery: 8, accelStep: 3 },
        normal: { label: 'Норма',  baseSpeed: 85,  minSpeed: 48, accelEvery: 7, accelStep: 3 },
        hard:   { label: 'Сложно', baseSpeed: 65,  minSpeed: 34, accelEvery: 6, accelStep: 4 }
      };

      let difficulty = 'normal';
      let currentSpeed = DIFFICULTY[difficulty].baseSpeed;

      let best = getBestScore();
      bestEl.textContent = String(best);

      let p1;
      let ai;
      let trail1;
      let trailAI;
      let score = 0;
      let running = false;
      let started = false;
      let paused = false;
      let gameOver = false;
      let lastTime = 0;
      let raf = 0;
      let pendingDir = null;
      let particles = [];
      let restartLockedUntil = 0;

      function getBestScore() {
        try {
          const value = parseInt(localStorage.getItem('tron404best') || '0', 10);
          return Number.isFinite(value) ? value : 0;
        } catch (e) {
          return 0;
        }
      }

      function saveBestScore(value) {
        try {
          localStorage.setItem('tron404best', String(value));
        } catch (e) {}
      }

      function now() {
        return (window.performance && typeof window.performance.now === 'function')
          ? window.performance.now()
          : Date.now();
      }

      function k(x, y) {
        return x + ',' + y;
      }

      function addTrail(set, p) {
        set.add(k(p.x, p.y));
      }

      function oob(x, y) {
        return x < 0 || x >= COLS || y < 0 || y >= ROWS;
      }

      function roundedRectPath(x, y, w, h, r) {
        const radius = Math.min(r, w / 2, h / 2);

        if (typeof ctx.roundRect === 'function') {
          ctx.beginPath();
          ctx.roundRect(x, y, w, h, radius);
          return;
        }

        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + w - radius, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
        ctx.lineTo(x + w, y + h - radius);
        ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
        ctx.lineTo(x + radius, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
      }

      function showGameUI() {
        hero.classList.add('is-hidden');
        wrap.classList.add('visible');
        hud.classList.add('visible');
        started = true;
      }

      function setStatePanel(title, text, meta, type) {
        gameStateTitle.textContent = title;
        gameStateText.textContent = text;
        gameStateMeta.textContent = meta || '';
        gameState.dataset.state = type || 'idle';
        gameState.classList.remove('is-hidden');
      }

      function hideStatePanel() {
        gameState.classList.add('is-hidden');
        gameState.dataset.state = 'hidden';
      }

      function updatePauseButton() {
        pauseBtn.textContent = paused ? 'Продолжить' : 'Пауза';
        pauseBtn.disabled = !started || gameOver;
      }

      function updateDifficultyButtons() {
        diffButtons.forEach(function (btn) {
          const active = btn.dataset.level === difficulty;
          btn.classList.toggle('is-active', active);
          btn.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
      }

      function initGame(options = {}) {
        const keepPendingDir = options.preservePending ? pendingDir : null;

        p1 = { x: Math.floor(COLS * 0.25), y: Math.floor(ROWS / 2), dx: 1, dy: 0 };
        ai = { x: Math.floor(COLS * 0.75), y: Math.floor(ROWS / 2), dx: -1, dy: 0 };

        trail1 = new Set();
        trailAI = new Set();
        score = 0;
        particles = [];
        pendingDir = keepPendingDir;
        paused = false;
        gameOver = false;
        restartLockedUntil = 0;
        currentSpeed = DIFFICULTY[difficulty].baseSpeed;

        scoreEl.textContent = '0';
        msgEl.textContent = DIFFICULTY[difficulty].label;

        addTrail(trail1, p1);
        addTrail(trailAI, ai);
        updatePauseButton();
      }

      function updateSpeed() {
        const cfg = DIFFICULTY[difficulty];
        const stages = Math.floor(score / cfg.accelEvery);
        currentSpeed = Math.max(cfg.minSpeed, cfg.baseSpeed - stages * cfg.accelStep);
      }

      function startRound() {
        if (running) return;
        if (gameOver && now() < restartLockedUntil) return;

        showGameUI();
        cancelAnimationFrame(raf);
        initGame({ preservePending: true });
        hideStatePanel();

        running = true;
        lastTime = 0;

        draw();
        raf = requestAnimationFrame(gameLoop);
      }

      function restartRound() {
        pendingDir = null;
        startRound();
      }

      function pauseGame() {
        if (!started || gameOver || paused || !running) return;

        paused = true;
        running = false;
        cancelAnimationFrame(raf);

        msgEl.textContent = 'Пауза';
        setStatePanel(
          'Пауза',
          'Игра остановлена. Продолжай, когда будешь готов.',
          'P / Esc / кнопка «Продолжить»',
          'pause'
        );
        updatePauseButton();
      }

      function resumeGame() {
        if (!started || gameOver || !paused) return;

        paused = false;
        running = true;
        msgEl.textContent = DIFFICULTY[difficulty].label;
        hideStatePanel();
        updatePauseButton();

        lastTime = 0;
        raf = requestAnimationFrame(gameLoop);
      }

      function togglePause() {
        if (paused) resumeGame();
        else pauseGame();
      }

      function setDir(dir) {
        const map = {
          up: { dx: 0, dy: -1 },
          down: { dx: 0, dy: 1 },
          left: { dx: -1, dy: 0 },
          right: { dx: 1, dy: 0 }
        };

        if (map[dir]) {
          pendingDir = map[dir];
        }
      }

      function floodFill(sx, sy, t1, t2, limit) {
        const visited = new Set();
        const queue = [[sx, sy]];
        visited.add(k(sx, sy));

        while (queue.length && visited.size < limit) {
          const item = queue.shift();
          const cx = item[0];
          const cy = item[1];

          for (const pair of [[1,0],[-1,0],[0,1],[0,-1]]) {
            const nx = cx + pair[0];
            const ny = cy + pair[1];
            const kk = k(nx, ny);

            if (!oob(nx, ny) && !t1.has(kk) && !t2.has(kk) && !visited.has(kk)) {
              visited.add(kk);
              queue.push([nx, ny]);
            }
          }
        }

        return visited.size;
      }

      function aiMove() {
        const nx = ai.x + ai.dx;
        const ny = ai.y + ai.dy;

        if (!oob(nx, ny) && !trailAI.has(k(nx, ny)) && !trail1.has(k(nx, ny))) {
          if (Math.random() > 0.1) return;
        }

        const dirs = [
          { dx: 1, dy: 0 },
          { dx: -1, dy: 0 },
          { dx: 0, dy: 1 },
          { dx: 0, dy: -1 }
        ]
          .filter(function (d) {
            return !(d.dx === -ai.dx && d.dy === -ai.dy);
          })
          .filter(function (d) {
            const tx = ai.x + d.dx;
            const ty = ai.y + d.dy;
            return !oob(tx, ty) && !trailAI.has(k(tx, ty)) && !trail1.has(k(tx, ty));
          });

        if (!dirs.length) return;

        const scored = dirs.map(function (d) {
          const tx = ai.x + d.dx;
          const ty = ai.y + d.dy;
          const dist = Math.abs(tx - p1.x) + Math.abs(ty - p1.y);
          const space = floodFill(tx, ty, trail1, trailAI, 100);
          return { d: d, val: space * 2 - dist * 0.3 };
        });

        scored.sort(function (a, b) {
          return b.val - a.val;
        });

        ai.dx = scored[0].d.dx;
        ai.dy = scored[0].d.dy;
      }

      function spawnParticles(px, py, color) {
        for (let i = 0; i < 22; i++) {
          const angle = Math.random() * Math.PI * 2;
          const spd = 1.5 + Math.random() * 4;

          particles.push({
            x: px + CELL / 2,
            y: py + CELL / 2,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd,
            life: 1,
            color: color
          });
        }
      }

      function tick() {
        if (pendingDir) {
          const d = pendingDir;
          pendingDir = null;

          if (!(d.dx === -p1.dx && d.dy === -p1.dy)) {
            p1.dx = d.dx;
            p1.dy = d.dy;
          }
        }

        aiMove();

        const nx1 = p1.x + p1.dx;
        const ny1 = p1.y + p1.dy;
        const nxAI = ai.x + ai.dx;
        const nyAI = ai.y + ai.dy;

        const p1Hit = oob(nx1, ny1) || trail1.has(k(nx1, ny1)) || trailAI.has(k(nx1, ny1));
        const aiHit = oob(nxAI, nyAI) || trailAI.has(k(nxAI, nyAI)) || trail1.has(k(nxAI, nyAI));
        const headOn = nx1 === nxAI && ny1 === nyAI;

        if (p1Hit || headOn) {
          spawnParticles(p1.x * CELL, p1.y * CELL, C.p1);
        }

        if (aiHit || headOn) {
          spawnParticles(ai.x * CELL, ai.y * CELL, C.ai);
        }

        if (p1Hit || aiHit || headOn) {
          endRound(p1Hit, aiHit, headOn);
          return;
        }

        p1.x = nx1;
        p1.y = ny1;
        ai.x = nxAI;
        ai.y = nyAI;

        addTrail(trail1, p1);
        addTrail(trailAI, ai);

        score = trail1.size - 1;
        scoreEl.textContent = String(score);
        updateSpeed();
      }

      function endRound(p1Hit, aiHit, headOn) {
        cancelAnimationFrame(raf);
        running = false;
        paused = false;
        gameOver = true;
        restartLockedUntil = now() + 300;

        if (score > best) {
          best = score;
          bestEl.textContent = String(best);
          saveBestScore(best);
        }

        draw();

        const isDraw = headOn || (p1Hit && aiHit);
        let title = 'Авария';
        let text = 'Ты врезался в след.';

        if (!p1Hit && aiHit) {
          title = 'Победа';
          text = 'Соперник разбился первым.';
          msgEl.textContent = 'Победа';
        } else if (isDraw) {
          title = 'Ничья';
          text = 'Оба райдера выбыли одновременно.';
          msgEl.textContent = 'Ничья';
        } else {
          msgEl.textContent = 'Пора ещё раз';
        }

        setStatePanel(
          title,
          text,
          'Счёт: ' + score + ' · Рекорд: ' + best + ' · Уровень: ' + DIFFICULTY[difficulty].label,
          'game-over'
        );

        updatePauseButton();
      }

      function drawGrid() {
        ctx.strokeStyle = C.grid;
        ctx.lineWidth = 1;

        for (let x = 0; x <= W; x += CELL) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, H);
          ctx.stroke();
        }

        for (let y = 0; y <= H; y += CELL) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(W, y);
          ctx.stroke();
        }
      }

      function drawTrail(set, fill, glow, head) {
        ctx.shadowColor = glow;
        ctx.shadowBlur = 6;
        ctx.fillStyle = fill;

        for (const kk of set) {
          if (kk === k(head.x, head.y)) continue;
          const parts = kk.split(',');
          const cx = Number(parts[0]);
          const cy = Number(parts[1]);
          ctx.fillRect(cx * CELL + 1, cy * CELL + 1, CELL - 2, CELL - 2);
        }

        ctx.shadowBlur = 0;
      }

      function drawHead(p, color, glow) {
        ctx.shadowColor = glow;
        ctx.shadowBlur = 18;
        ctx.fillStyle = color;

        roundedRectPath(p.x * CELL, p.y * CELL, CELL, CELL, 3);
        ctx.fill();

        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath();
        ctx.arc(p.x * CELL + CELL / 2, p.y * CELL + CELL / 2, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
      }

      function updateParticles() {
        particles = particles.filter(function (p) {
          return p.life > 0;
        });

        for (const p of particles) {
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.92;
          p.vy *= 0.92;
          p.life -= 0.04;

          ctx.globalAlpha = p.life;
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;

          ctx.beginPath();
          ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.shadowBlur = 0;
        }

        ctx.globalAlpha = 1;
      }

      function draw() {
        ctx.fillStyle = C.bg;
        ctx.fillRect(0, 0, W, H);
        drawGrid();

        if (trail1 && trailAI && p1 && ai) {
          drawTrail(trail1, C.p1trail, C.p1glow, p1);
          drawTrail(trailAI, C.aitrail, C.aiglow, ai);
          drawHead(p1, C.p1, C.p1glow);
          drawHead(ai, C.ai, C.aiglow);
        }

        updateParticles();
      }

      function drawStatic() {
        ctx.fillStyle = C.bg;
        ctx.fillRect(0, 0, W, H);
        drawGrid();
      }

      function gameLoop(ts) {
        if (!running) return;

        if (!lastTime) {
          lastTime = ts;
        }

        if (ts - lastTime >= currentSpeed) {
          lastTime = ts;
          tick();
        }

        if (running) {
          draw();
          raf = requestAnimationFrame(gameLoop);
        }
      }

      function handlePrimaryAction() {
        if (!running && !paused) {
          startRound();
        }
      }

      diffButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          const nextLevel = btn.dataset.level;
          if (!DIFFICULTY[nextLevel] || difficulty === nextLevel) return;

          difficulty = nextLevel;
          updateDifficultyButtons();
          msgEl.textContent = DIFFICULTY[difficulty].label;

          if (!running && !paused) {
            setStatePanel(
              started ? 'Уровень изменён' : 'Neon Rider',
              started ? 'Выбран новый уровень сложности.' : 'Выбери сложность и начни заезд.',
              'Текущий уровень: ' + DIFFICULTY[difficulty].label,
              'idle'
            );
          }
        });
      });

      pauseBtn.addEventListener('click', function () {
        if (!started || gameOver) return;
        togglePause();
      });

      restartBtn.addEventListener('click', function () {
        restartRound();
      });

      hero.addEventListener('click', handlePrimaryAction);

      hintStart.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        handlePrimaryAction();
      });

      canvas.addEventListener('click', function () {
        if (!started || gameOver) return;
        if (paused) {
          resumeGame();
        }
      });

      canvas.addEventListener('touchstart', function (e) {
        e.preventDefault();

        if (!e.touches || !e.touches[0]) return;
        const touch = e.touches[0];
        canvas.dataset.touchX = String(touch.clientX);
        canvas.dataset.touchY = String(touch.clientY);
      }, { passive: false });

      canvas.addEventListener('touchend', function (e) {
        e.preventDefault();

        if (!e.changedTouches || !e.changedTouches[0]) return;

        const sx = Number(canvas.dataset.touchX || 0);
        const sy = Number(canvas.dataset.touchY || 0);
        const ex = e.changedTouches[0].clientX;
        const ey = e.changedTouches[0].clientY;
        const dx = ex - sx;
        const dy = ey - sy;

        if (Math.abs(dx) < 15 && Math.abs(dy) < 15) {
          if (!started || gameOver) {
            startRound();
          } else if (paused) {
            resumeGame();
          }
          return;
        }

        if (Math.abs(dx) > Math.abs(dy)) {
          setDir(dx > 0 ? 'right' : 'left');
        } else {
          setDir(dy > 0 ? 'down' : 'up');
        }

        if (!running && !paused) {
          startRound();
        }
      }, { passive: false });

      document.addEventListener('keydown', function (e) {
        const dirMap = {
          ArrowUp: 'up',
          ArrowDown: 'down',
          ArrowLeft: 'left',
          ArrowRight: 'right',
          KeyW: 'up',
          KeyS: 'down',
          KeyA: 'left',
          KeyD: 'right'
        };

        if (dirMap[e.code]) {
          e.preventDefault();
          setDir(dirMap[e.code]);
          if (!running && !paused) {
            startRound();
          }
          return;
        }

        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          if (!started || gameOver) {
            restartRound();
          } else if (paused) {
            resumeGame();
          } else if (!running) {
            startRound();
          }
          return;
        }

        if (e.code === 'KeyP' || e.code === 'Escape') {
          e.preventDefault();
          if (started && !gameOver) {
            togglePause();
          }
        }
      });

      updateDifficultyButtons();
      updatePauseButton();
      setStatePanel(
        'Neon Rider',
        'Выбери сложность и начни заезд.',
        'Стрелки / WASD / свайп · P или Esc — пауза',
        'idle'
      );
      drawStatic();
    })();
