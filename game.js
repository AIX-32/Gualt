// ============================================================
    //  AUDIO
    // ============================================================
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    function playSound(type) {
      if (audioCtx.state === 'suspended') audioCtx.resume();
      try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        const t = audioCtx.currentTime;

        const sounds = {
          laser: () => { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(420, t); osc.frequency.exponentialRampToValueAtTime(90, t + 0.14); gain.gain.setValueAtTime(0.06, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14); osc.start(); osc.stop(t + 0.14); },
          'heavy-shoot': () => { osc.type = 'triangle'; osc.frequency.setValueAtTime(110, t); osc.frequency.exponentialRampToValueAtTime(28, t + 0.32); gain.gain.setValueAtTime(0.18, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38); osc.start(); osc.stop(t + 0.38); },
          explosion: () => { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(90, t); osc.frequency.linearRampToValueAtTime(8, t + 0.5); gain.gain.setValueAtTime(0.22, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.52); osc.start(); osc.stop(t + 0.52); },
          deploy: () => { osc.type = 'sine'; osc.frequency.setValueAtTime(200, t); osc.frequency.exponentialRampToValueAtTime(600, t + 0.22); gain.gain.setValueAtTime(0.08, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22); osc.start(); osc.stop(t + 0.22); },
          whistle: () => { osc.type = 'sine'; osc.frequency.setValueAtTime(1100, t); osc.frequency.exponentialRampToValueAtTime(280, t + 1.1); gain.gain.setValueAtTime(0.12, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 1.15); osc.start(); osc.stop(t + 1.15); },
          click: () => { osc.type = 'sine'; osc.frequency.setValueAtTime(900, t); osc.frequency.exponentialRampToValueAtTime(1600, t + 0.045); gain.gain.setValueAtTime(0.04, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045); osc.start(); osc.stop(t + 0.045); },
          sniper: () => { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(800, t); osc.frequency.exponentialRampToValueAtTime(200, t + 0.08); gain.gain.setValueAtTime(0.12, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1); osc.start(); osc.stop(t + 0.1); },
          heal: () => { osc.type = 'sine'; osc.frequency.setValueAtTime(400, t); osc.frequency.exponentialRampToValueAtTime(700, t + 0.15); gain.gain.setValueAtTime(0.04, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15); osc.start(); osc.stop(t + 0.15); },
          smoke: () => { osc.type = 'triangle'; osc.frequency.setValueAtTime(300, t); osc.frequency.linearRampToValueAtTime(80, t + 0.2); gain.gain.setValueAtTime(0.06, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2); osc.start(); osc.stop(t + 0.2); },
        };
        if (sounds[type]) sounds[type]();
      } catch (e) { }
    }

    // ============================================================
    //  LOGGING
    // ============================================================
    function logMessage(html) {
      const log = document.getElementById('diagnostic-log');
      const t = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const el = document.createElement('div');
      el.innerHTML = `<span style="color:#52525b">[${t}]</span> ${html}`;
      log.appendChild(el);
      log.scrollTop = log.scrollHeight;
    }

    // ============================================================
    //  CANVAS & GAME STATE
    // ============================================================
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');

    function resizeCanvas() {
      const r = canvas.parentNode.getBoundingClientRect();
      canvas.width = r.width;
      canvas.height = r.height;
    }

    const GRID = 64;
    const UNIT_COSTS = { infantry: 100, tank: 250, drone: 75, sniper: 175, apc: 200, 'anti-tank': 350, commander: 250 };
    const REINFORCE_COSTS = { infantry: 100, tank: 250, drone: 75, sniper: 175, apc: 200, 'anti-tank': 350, commander: 250 };

    const LEVELS = [
      {
        id: 1,
        name: "Fromcity",
        file: "lvl1.gtm",
        budget: 1000,
        waves: 3,
        bg: '#2d5a27',
        description: "An urban assault, be careful of tanks!"
      },
      {
        id: 2,
        name: "deadland",
        file: "lvl2.gtm",
        budget: 1400,
        waves: 3,
        bg: '#5c4a3a',
        description: "A flat open space, watch out for snipers!"
      },
      {
        id: 3,
        name: "Concentration",
        file: "lvl3.gtm",
        budget: 1700,
        waves: 4,
        bg: '#5c4a3a',
        description: "Pure chaos. One spot, non-stop fighting. Anti-tanks are waiting for you."
      },
      {
        id: 4,
        name: "Lukcity",
        file: "lvl4.gtm",
        budget: 1800,
        waves: 3,
        bg: '#5e5c64',
        description: "Urban combat, retrieve the beacon. Be careful of Stationary gunners."
      },
      {
        id: 5,
        name: "Dust (0.3, old)",
        file: "lvl5.gtm",
        budget: 1300,
        waves: 3,
        bg: '#5c4a3a',
        description: "Watch out for snipers and antitanks!"
      },
      {
        id: 6,
        name: "Urcity (0.3, old)",
        file: "lvl6.gtm",
        budget: 1700,
        waves: 3,
        bg: '#4a4a4a',
        description: "Urban combat."
      },
      {
        id: 7,
        name: "Drone Attack (0.3, old)",
        file: "lvl7.gtm",
        budget: 1000,
        waves: 3,
        bg: '#5c4a3a',
        description: "A true modern fight."
      }
    ];

    const game = {
      mode: 'home',
      currentLevelId: 1,
      currentCustomLevelId: null,
      activeLevelKind: 'campaign',
      activeLevelName: '',
      activeLevelDescription: '',
      activeLevelBudget: 1000,
      activeLevelWaves: 3,
      activeLevelFile: '',
      activeLevelData: '',
      builderBudget: 1000,
      builderTestMapState: null,
      unlockedLevelId: parseInt(localStorage.getItem('gault_campaign_progress') || '1'),
      customLevels: loadCustomLevelsFromStorage(),
      credits: 500,
      wave: 1,
      waveTimer: 0,
      waveInterval: 25 * 60, // frames

      units: [],
      projectiles: [],
      effects: [],
      obstacles: [],
      trees: [],
      mines: [],
      smokeScreens: [],
      spawners: [],
      spawnerCooldown: 0,

      // Selection
      selectionStart: null,
      selectionEnd: null,
      isSelecting: false,
      pendingOrder: null,

      // Camera / world
      camera: { x: 0, y: 0 },
      worldWidth: 3200,
      worldHeight: 2400,
      keys: {},
      cameraDragging: false,
      cameraDragStart: { x: 0, y: 0 },
      cameraDragCamStart: { x: 0, y: 0 },

      // Airstrike
      airstrikeMode: false,
      airstrikeDragging: false,
      airstrikeLineStart: null,
      airstrikeLineEnd: null,
      airStriking: false,
      airstrikeTimer: 0,
      airstrikeBombCount: 0,
      airstrikePoints: [],
      airstrikeLaserTimer: 0,
      commanderStrike: null,

      // Artillery mode
      artilleryMode: false,

      // Mine/smoke mode
      mineMode: false,
      smokeMode: false,

      // Builder
      activeBrush: 'conblock',
      ruinSize: 2,
      ruinsOrientation: 'horizontal',
      wreckRotation: 0, // 0/1/2/3 = 0°/90°/180°/270°
      isBuilding: false,
      isErasing: false,
      builderHoverPos: null,
      builderLastAction: null,
      bgColor: '#18181b',
      conblockColor: '#3f3f46',

      // Deployment
      armySelection: { infantry: 0, tank: 0, drone: 0, sniper: 0, apc: 0, 'anti-tank': 0, commander: 0 },
      deployBudget: 1000,

      // FX
      floatingTexts: [],
      shakeTimer: 0,
      shakeIntensity: 0,
      gameOver: null,
      ambientDrone: null,
      showVision: false,

      // kill stats
      kills: 0,

      // Tactical mechanics
      tempoKills: 0,
      tempoTimer: 0,
      focusTracker: {},
      flankTracker: {},
    };
    resizeCanvas();
    function clampCamera() {
      game.camera.x = Math.max(0, Math.min(game.worldWidth - canvas.width, game.camera.x));
      game.camera.y = Math.max(0, Math.min(game.worldHeight - canvas.height, game.camera.y));
    }
    clampCamera();
    window.addEventListener('resize', () => { resizeCanvas(); clampCamera(); });

    // ============================================================
    //  PATHFINDING (Simple steering with wall-avoidance)
    //  Uses steering behaviours + a lightweight raycast nudge
    // ============================================================
    function getObstacleAt(x, y) {
      for (const o of game.obstacles) {
        if (isWalkableObs(o)) continue;
        if (x >= o.x && x <= o.x + o.w && y >= o.y && y <= o.y + o.h) return o;
      }
      return null;
    }

    function isWalkableObs(o) { return o.type === 'roof' || o.type === 'filled' || o.type === 'road' || o.type === 'beacon'; }

    function segmentIntersectsRect(ax, ay, bx, by, rx, ry, rw, rh) {
      // Liang-Barsky
      const dx = bx - ax, dy = by - ay;
      const p = [-dx, dx, -dy, dy];
      const q = [ax - rx, rx + rw - ax, ay - ry, ry + rh - ay];
      let u1 = -Infinity, u2 = Infinity;
      for (let i = 0; i < 4; i++) {
        if (p[i] === 0) { if (q[i] < 0) return false; }
        else { const t = q[i] / p[i]; p[i] < 0 ? (u1 = Math.max(u1, t)) : (u2 = Math.min(u2, t)); }
      }
      return u1 <= u2 && u2 >= 0 && u1 <= 1;
    }

    function lineOfSightClear(ax, ay, bx, by) {
      for (const o of game.obstacles) {
        if (isWalkableObs(o)) continue;
        if (segmentIntersectsRect(ax, ay, bx, by, o.x, o.y, o.w, o.h)) return false;
      }
      return true;
    }

    // Compute a steering direction that avoids walls
    // Returns {vx, vy} normalised or zero
    function steerAroundObstacles(unit, desiredDx, desiredDy) {
      const dist = Math.sqrt(desiredDx * desiredDx + desiredDy * desiredDy);
      if (dist < 1) return { vx: 0, vy: 0 };
      const ndx = desiredDx / dist, ndy = desiredDy / dist;

      // Whisker probes ahead
      const whiskerLen = unit.radius * 3.5;
      const angles = [0, 0.4, -0.4, 0.8, -0.8, 1.3, -1.3, 2.0, -2.0, Math.PI];
      for (const dAngle of angles) {
        const a = Math.atan2(ndy, ndx) + dAngle;
        const wx = unit.x + Math.cos(a) * whiskerLen;
        const wy = unit.y + Math.sin(a) * whiskerLen;
        let clear = true;
        for (const o of game.obstacles) {
          if (isWalkableObs(o)) continue;
          if (segmentIntersectsRect(unit.x, unit.y, wx, wy, o.x, o.y, o.w, o.h)) {
            clear = false; break;
          }
        }
        if (clear) return { vx: Math.cos(a), vy: Math.sin(a) };
      }
      // All blocked — try perpendicular
      return { vx: 0, vy: 0 };
    }

    // Push unit out of any overlapping obstacle
    function resolveObstaclePenetration(unit) {
      for (const o of game.obstacles) {
        if (isWalkableObs(o)) continue;
        const cx = Math.max(o.x, Math.min(unit.x, o.x + o.w));
        const cy = Math.max(o.y, Math.min(unit.y, o.y + o.h));
        const dx = unit.x - cx, dy = unit.y - cy;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < unit.radius + 2) {
          const overlap = unit.radius + 2 - d;
          const nx = d > 0 ? dx / d : 1, ny = d > 0 ? dy / d : 0;
          unit.x += nx * overlap;
          unit.y += ny * overlap;
        }
      }
      // Clamp to world bounds
      unit.x = Math.max(unit.radius, Math.min(game.worldWidth - unit.radius, unit.x));
      unit.y = Math.max(unit.radius, Math.min(game.worldHeight - unit.radius, unit.y));
    }

    // ============================================================
    //  SMOKE SCREENS
    // ============================================================
    function pointInSmoke(x, y) {
      for (const s of game.smokeScreens) {
        const dx = x - s.x, dy = y - s.y;
        if (dx * dx + dy * dy < s.radius * s.radius) return true;
      }
      return false;
    }

    function smokeBlocksLOS(ax, ay, bx, by) {
      for (const s of game.smokeScreens) {
        // cheap line-circle test
        const dx = bx - ax, dy = by - ay;
        const fx = ax - s.x, fy = ay - s.y;
        const a2 = dx * dx + dy * dy;
        const b2 = 2 * (fx * dx + fy * dy);
        const c2 = fx * fx + fy * fy - s.radius * s.radius;
        const disc = b2 * b2 - 4 * a2 * c2;
        if (disc >= 0) return true;
      }
      return false;
    }

    function alertEnemyOnHit(unit, attacker) {
      if (!unit || unit.team !== 'red') return;
      if (!attacker || attacker.team === unit.team) return;
      unit.targetUnit = attacker;
      unit.targetX = attacker.x;
      unit.targetY = attacker.y;
      unit.idleTimer = 0;
      unit.idleScan = Math.random() * Math.PI * 2;
    }

    function alertEnemiesOnShot(shooter, sx, sy) {
      if (shooter.team !== 'blue') return;
      const alertRadius = shooter.type === 'tank' || shooter.type === 'anti-tank' ? 500 : shooter.type === 'sniper' ? 250 : 350;
      for (const u of game.units) {
        if (u.team !== 'red') continue;
        const dx = u.x - sx, dy = u.y - sy;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > alertRadius) continue;
        if (!u.targetUnit || u.targetUnit.hp <= 0) {
          u.targetUnit = shooter;
          u.targetX = shooter.x;
          u.targetY = shooter.y;
          u.idleTimer = 0;
          u.idleScan = Math.random() * Math.PI * 2;
        } else if (u.targetUnit.team === 'blue') {
          const curD = Math.hypot(u.x - u.targetUnit.x, u.y - u.targetUnit.y);
          if (d < curD) {
            u.targetUnit = shooter;
            u.targetX = shooter.x;
            u.targetY = shooter.y;
            u.idleTimer = 0;
            u.idleScan = Math.random() * Math.PI * 2;
          }
        }
        u.suppression = Math.min(100, u.suppression + 8);
        u.suppressionTimer = 60;
      }
    }

    // ============================================================
    //  PATHFINDING (A* on grid)
    // ============================================================
    function buildGrid() {
      const cols = Math.ceil(canvas.width / GRID);
      const rows = Math.ceil(canvas.height / GRID);
      const grid = Array.from({ length: rows }, () => Array(cols).fill(0));
      const margin = 0;
      for (const o of game.obstacles) {
        if (isWalkableObs(o)) continue;
        const x1 = Math.max(0, Math.floor(o.x / GRID) - margin);
        const y1 = Math.max(0, Math.floor(o.y / GRID) - margin);
        const x2 = Math.min(cols - 1, Math.ceil((o.x + o.w) / GRID) - 1 + margin);
        const y2 = Math.min(rows - 1, Math.ceil((o.y + o.h) / GRID) - 1 + margin);
        for (let gy = y1; gy <= y2; gy++)
          for (let gx = x1; gx <= x2; gx++)
            grid[gy][gx] = 1;
      }
      return { grid, cols, rows };
    }

    function findPath(fromX, fromY, toX, toY) {
      const { grid, cols, rows } = buildGrid();
      const sc = Math.floor(fromX / GRID), sr = Math.floor(fromY / GRID);
      const ec = Math.floor(toX / GRID), er = Math.floor(toY / GRID);
      if (sc === ec && sr === er) return [];
      if (sr < 0 || sr >= rows || sc < 0 || sc >= cols) return [];
      if (er < 0 || er >= rows || ec < 0 || ec >= cols) return [];
      if (grid[sr][sc] || grid[er][ec]) return [];

      const key = (r, c) => r * cols + c;
      const h = (r, c) => Math.abs(r - er) + Math.abs(c - ec);
      const open = new Set([key(sr, sc)]);
      const cameFrom = {};
      const g = { [key(sr, sc)]: 0 };
      const f = { [key(sr, sc)]: h(sr, sc) };

      while (open.size) {
        let cur = null, curF = Infinity;
        for (const k of open) {
          if (f[k] < curF) { curF = f[k]; cur = k; }
        }
        if (cur === null) break;
        const cr = Math.floor(cur / cols), cc = cur % cols;
        if (cr === er && cc === ec) {
          const path = [];
          let k = cur;
          while (k !== undefined) {
            const r = Math.floor(k / cols), c = k % cols;
            path.push({ x: c * GRID + GRID / 2, y: r * GRID + GRID / 2 });
            k = cameFrom[k];
          }
          path.reverse();
          return path;
        }
        open.delete(cur);
        for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]]) {
          const nr = cr + dr, nc = cc + dc;
          if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
          if (grid[nr][nc]) continue;
          const nk = key(nr, nc);
          const stepCost = dr !== 0 && dc !== 0 ? 1.414 : 1;
          const ng = g[cur] + stepCost;
          if (g[nk] === undefined || ng < g[nk]) {
            g[nk] = ng;
            f[nk] = ng + h(nr, nc);
            cameFrom[nk] = cur;
            open.add(nk);
          }
        }
      }
      return [];
    }

    function randomClearPatrolPos(unit, roamDist) {
      for (let tries = 0; tries < 8; tries++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = roamDist * (0.5 + Math.random() * 0.5);
        const tx = unit.x + Math.cos(angle) * dist;
        const ty = unit.y + Math.sin(angle) * dist;
        const cx = Math.max(unit.radius, Math.min(game.worldWidth - unit.radius, tx));
        const cy = Math.max(unit.radius, Math.min(game.worldHeight - unit.radius, ty));
        let blocked = false;
        for (const o of game.obstacles) {
          if (isWalkableObs(o)) continue;
          if (cx >= o.x && cx <= o.x + o.w && cy >= o.y && cy <= o.y + o.h) { blocked = true; break; }
        }
        if (!blocked) return { x: cx, y: cy };
      }
      return { x: unit.x + (Math.random() - 0.5) * roamDist, y: unit.y + (Math.random() - 0.5) * roamDist };
    }

    // ============================================================
    //  UNIT CLASS
    // ============================================================
    class Unit {
      constructor(x, y, team, type) {
        if (type === 'inf') type = 'infantry';
        this.id = Math.random().toString(36).substr(2, 9);
        this.x = x; this.y = y;
        this.team = team; this.type = type;
        this.isSelected = false;
        this.targetX = x; this.targetY = y;
        this.angle = team === 'blue' ? 0 : Math.PI;
        this.turretAngle = this.angle;
        this.targetUnit = null;
        this.fireCooldown = 0;
        this.healCooldown = 0;
        this.beepTimer = 0;
        this.smokeTimer = 0;
        this.idleTimer = 0;
        this.idleScan = Math.random() * Math.PI * 2;
        this.suppression = 0;
        this.isIsolated = false;
        this.surprised = true;
        this.suppressionTimer = 0;
        this.mode = 'move';
        this._path = null;
        this._pathIdx = 0;
        this.stuckTimer = 0;
        this._lastTargetDist = 0;

        const defs = {
          infantry: { radius: 11, speed: 1.7, maxHp: 50, hp: 50, range: 145, damage: 10, cdMax: 42, weapon: 'bullet' },
          tank: { radius: 19, speed: 0.9, maxHp: 220, hp: 220, range: 240, damage: 45, cdMax: 105, weapon: 'shell' },
          drone: { radius: 9, speed: 3.8, maxHp: 35, hp: 35, range: 280, damage: 180, cdMax: 0, weapon: 'kamikaze', kamikazeRange: 40 },
          sniper: { radius: 10, speed: 1.3, maxHp: 40, hp: 40, range: 380, damage: 80, cdMax: 130, weapon: 'sniper' },
          apc: { radius: 16, speed: 1.1, maxHp: 140, hp: 140, range: 180, damage: 15, cdMax: 70, weapon: 'bullet', healRadius: 80, healRate: 60 },
          'anti-tank': { radius: 16, speed: 0.6, maxHp: 80, hp: 80, range: 260, damage: 200, cdMax: 200, weapon: 'shell' },
          gunner: { radius: 14, speed: 0, maxHp: 100, hp: 100, range: 250, damage: 18, cdMax: 15, weapon: 'bullet' },
          commander: { radius: 10, speed: 1.4, maxHp: 25, hp: 25, range: 1200, damage: 0, cdMax: 900, weapon: 'commander' },
        };
        Object.assign(this, defs[type]);
      }

      update() {
        if (this.fireCooldown > 0) this.fireCooldown--;

        if (this.type === 'gunner') {
          this._findTarget();
          this._aimAndShoot();
          return;
        }

        // APC passive heal (blue only)
        if (this.type === 'apc' && this.team === 'blue') {
          this.healCooldown--;
          if (this.healCooldown <= 0) {
            this.healCooldown = this.healRate;
            for (const u of game.units) {
              if (u.team === 'blue' && u !== this) {
                const dx = u.x - this.x, dy = u.y - this.y;
                if (dx * dx + dy * dy < this.healRadius * this.healRadius && u.hp < u.maxHp) {
                  u.hp = Math.min(u.maxHp, u.hp + 5);
                  addFloatingText(u.x, u.y - u.radius - 12, '+5', '#4ade80');
                  if (Math.random() < 0.3) playSound('heal');
                }
              }
            }
          }
        }

        // Drone follows target
        if (this.type === 'drone') {
          this._updateDrone();
          resolveObstaclePenetration(this);
          return;
        }

        this._updateIdlePatrol();

        // Defend mode: hold position
        if (this.team === 'blue' && this.mode === 'defend') {
          this.targetX = this.x;
          this.targetY = this.y;
          this._path = null;
        }

        // Follow path if one exists (skip when chasing a target)
        if (this._path && this._path.length && !this.targetUnit) {
          const px = this._path[this._pathIdx || 0].x;
          const py = this._path[this._pathIdx || 0].y;
          const pdx = px - this.x, pdy = py - this.y;
          if (pdx * pdx + pdy * pdy < 20 * 20) {
            this._pathIdx = (this._pathIdx || 0) + 1;
            if (this._pathIdx >= this._path.length) {
              this._path = null;
              this._pathIdx = 0;
            }
          }
        }
        if (this._path && this._path.length && !this.targetUnit) {
          const wp = this._path[this._pathIdx || 0];
          this.targetX = wp.x;
          this.targetY = wp.y;
        }

        // Movement with proper wall avoidance
        const tdx = this.targetX - this.x;
        const tdy = this.targetY - this.y;
        const tDist = Math.sqrt(tdx * tdx + tdy * tdy);

        if (tDist > 5) {
          const steer = steerAroundObstacles(this, tdx, tdy);
          const targetAngle = Math.atan2(steer.vy, steer.vx);
          let diff = targetAngle - this.angle;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          this.angle += diff * 0.12;
          this.x += steer.vx * this.speed;
          this.y += steer.vy * this.speed;
        }

        // Separation from other units
        for (const other of game.units) {
          if (other === this) continue;
          const odx = other.x - this.x, ody = other.y - this.y;
          const od = Math.sqrt(odx * odx + ody * ody);
          const minD = this.radius + other.radius + 3;
          if (od < minD && od > 0) {
            const push = 0.55;
            this.x -= (odx / od) * push;
            this.y -= (ody / od) * push;
          }
        }

        // Push out of obstacles
        resolveObstaclePenetration(this);

        // Stuck detection
        if (tDist > 10 && this._lastTargetDist > 0) {
          const prog = this._lastTargetDist - tDist;
          this._lastTargetDist = tDist;
          if (prog < 0.3) this.stuckTimer++;
          else this.stuckTimer = 0;
        } else {
          this.stuckTimer = 0;
        }
        if (this.stuckTimer > 90 && this.team === 'red' && !this.targetUnit) {
          this.stuckTimer = 0;
          const backOff = randomClearPatrolPos(this, 140);
          this.targetX = backOff.x;
          this.targetY = backOff.y;
        }
        if (this.stuckTimer > 180 && this.team === 'red' && this.targetUnit) {
          this.stuckTimer = 0;
          this.targetUnit = null;
        }

        // Enemy targeting
        this._findTarget();
        this._aimAndShoot();
      }

      _updateDrone() {
        // Clear dead/missing targets, but don't auto-acquire new ones
        if (this.targetUnit && (this.targetUnit.hp <= 0 || !game.units.includes(this.targetUnit))) {
          this.targetUnit = null;
        }

        // Red drones auto-acquire the closest blue unit
        if (!this.targetUnit && this.team === 'red') {
          let best = this.range * 2, bestU = null;
          for (const u of game.units) {
            if (u.team === 'blue' && u.hp > 0) {
              const ddx = u.x - this.x, ddy = u.y - this.y;
              const dd = ddx * ddx + ddy * ddy;
              if (dd < best * best) { best = Math.sqrt(dd); bestU = u; }
            }
          }
          if (bestU) { this.targetUnit = bestU; this.targetX = bestU.x; this.targetY = bestU.y; }
        }

        if (this.targetUnit) {
          this.targetX = this.targetUnit.x;
          this.targetY = this.targetUnit.y;
          this.beepTimer++;
        }

        const dx = this.targetX - this.x, dy = this.targetY - this.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > 3) {
          this.angle = Math.atan2(dy, dx);
          this.x += Math.cos(this.angle) * this.speed;
          this.y += Math.sin(this.angle) * this.speed;
        }
        this.turretAngle = this.angle;

        // Disruption aura: drones suppress nearby enemies
        for (const u of game.units) {
          if (u.team !== this.team) {
            const ddx = u.x - this.x, ddy = u.y - this.y;
            if (ddx * ddx + ddy * ddy < 200 * 200) {
              u.suppression = Math.min(100, u.suppression + 0.8);
              u.surprised = false;
            }
          }
        }

        // Kamikaze: detonate when close enough to any enemy (not just targetUnit)
        for (const u of game.units) {
          if (u.team !== this.team && u.hp > 0) {
            const tdx = u.x - this.x, tdy = u.y - this.y;
            if (tdx * tdx + tdy * tdy < 40 * 40) { this.detonate(); break; }
          }
        }
      }

      _findTarget() {
        if (this.targetUnit && (this.targetUnit.hp <= 0 || !game.units.includes(this.targetUnit))) this.targetUnit = null;
        if (this.targetUnit) return;
        if (this.type === 'drone') return;
        if (this.team === 'blue' && (!this.mode || this.mode === 'move')) return;

        // Suppressed enemies have reduced detection range
        let effectiveRange = this.range;
        if (this.suppression > 30) {
          effectiveRange = this.range * (1 - this.suppression / 150);
        }

        // Surprised enemies scan slower (red only)
        if (this.team === 'red' && this.surprised) {
          if (this.idleTimer < 30) return;
        }

        let best = effectiveRange;
        for (const u of game.units) {
          if (u.team === this.team) continue;
          const dx = u.x - this.x, dy = u.y - this.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d >= best) continue;
          if (this.team === 'red') {
            const ta = Math.atan2(dy, dx);
            let diff = ta - this.angle;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            if (Math.abs(diff) > Math.PI / 2.2) continue;
          }
          if (!lineOfSightClear(this.x, this.y, u.x, u.y)) continue;
          best = d; this.targetUnit = u; this._path = null;
        }
      }

      _updateIdlePatrol() {
        if (this.targetUnit) return;
        if (this.team === 'blue') {
          if (this.mode !== 'patrol') return;
          this.idleTimer++;
          if (this.idleTimer > 60) {
            this.idleTimer = 0;
            const roamAngle = Math.random() * Math.PI * 2;
            const roamDist = 80 + Math.random() * 120;
            this.targetX = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x + Math.cos(roamAngle) * roamDist));
            this.targetY = Math.max(this.radius, Math.min(canvas.height - this.radius, this.y + Math.sin(roamAngle) * roamDist));
          }
          return;
        }
        if (this.team !== 'red' || this.targetUnit) return;
        const dx = this.targetX - this.x, dy = this.targetY - this.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d <= 6) {
          this.idleTimer++;
          this.idleScan += 0.03;
          if (this.idleTimer > 45) {
            this.idleTimer = 0;
            const p = randomClearPatrolPos(this, this.type === 'tank' ? 90 : this.type === 'sniper' ? 110 : 70);
            this.targetX = p.x;
            this.targetY = p.y;
          }
        } else {
          this.idleTimer = 0;
        }
      }

      _aimAndShoot() {
        if (!this.targetUnit) {
          if (this.team === 'red') {
            this.idleScan += 0.025;
            const scanSpan = this.type === 'tank' ? 0.35 : 0.7;
            this.turretAngle = this.angle + Math.sin(this.idleScan) * scanSpan;
          } else if (this.mode === 'defend' || this.mode === 'attack') {
            this.idleScan += 0.025;
            this.turretAngle = this.angle + Math.sin(this.idleScan) * 0.7;
          } else {
            this.turretAngle = this.angle;
          }
          // Resume moving to attack destination
          if (this.mode === 'attack' && this._attackDest) {
            this.targetX = this._attackDest.x;
            this.targetY = this._attackDest.y;
          }
          return;
        }
        const dx = this.targetUnit.x - this.x, dy = this.targetUnit.y - this.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        this.turretAngle = Math.atan2(dy, dx);

        // Keep engagement distance (but hold position for defend/arrived)
        if (this.mode === 'defend') {
          if (d > this.range) this.targetUnit = null;
        } else if (this.mode === 'attack' && this._attackDest) {
          const adx = this._attackDest.x - this.x;
          const ady = this._attackDest.y - this.y;
          const atDest = adx * adx + ady * ady <= 25;
          if (atDest) {
            if (d > this.range) this.targetUnit = null;
          } else if (this.targetUnit && d <= this.range) {
            const holdDist = this.range - 15;
            if (d > holdDist - 5) {
              this.targetX = this.targetUnit.x - (dx / d) * holdDist;
              this.targetY = this.targetUnit.y - (dy / d) * holdDist;
            }
          } else {
            this.targetX = this._attackDest.x;
            this.targetY = this._attackDest.y;
          }
        } else {
          const holdDist = this.range - 15;
          if (d > holdDist - 5) {
            this.targetX = this.targetUnit.x - (dx / d) * holdDist;
            this.targetY = this.targetUnit.y - (dy / d) * holdDist;
          }
        }

        // Suppression: suppressed enemies fire less often
        let effectiveCooldown = this.fireCooldown;
        if (this.team === 'red' && this.suppression > 20) {
          // Chance to skip firing due to suppression
          if (Math.random() < this.suppression / 200) return;
        }

        // LOS check — also blocked by smoke for enemies
        if (d <= this.range && this.fireCooldown === 0) {
          // Suppressed enemies have reduced accuracy
          if (this.team === 'red' && this.suppression > 30) {
            const spread = (this.suppression / 100) * 0.3;
            this.turretAngle += (Math.random() - 0.5) * spread;
          }
          const hasSight = lineOfSightClear(this.x, this.y, this.targetUnit.x, this.targetUnit.y);
          const blockedBySmoke = this.team === 'red' && smokeBlocksLOS(this.x, this.y, this.targetUnit.x, this.targetUnit.y);
          if (hasSight && !blockedBySmoke) this.shoot();
        }
      }

      detonate() {
        const blastR = 50;
        addEffect('blast-flash', { x: this.x, y: this.y, maxRadius: 50, radius: 4, timer: 20 });
        addEffect('crater', { x: this.x, y: this.y, radius: 26, opacity: 1, timer: 500 });
        for (let i = 0; i < 12; i++) addEffect('debris', { x: this.x, y: this.y, vx: (Math.random() - .5) * 9, vy: (Math.random() - .5) * 9, size: 2 + Math.random() * 4, timer: 20 + Math.random() * 15 });
        game.units.forEach(u => {
          if (u.team !== this.team) {
            const dx = u.x - this.x, dy = u.y - this.y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < blastR) { const dmg = Math.round(this.damage * (1 - d / blastR)); u.hp -= dmg; addFloatingText(u.x, u.y - u.radius - 14, `-${dmg}`, '#ef4444'); }
          }
        });
        game.shakeTimer = 14; playSound('explosion'); this.hp = 0;
      }

      shoot() {
        if (this.type === 'commander') {
          this.fireCooldown = 900;
          const target = this.targetUnit;
          if (!target || target.hp <= 0) return;
          let otherEnemy = null, minDist = Infinity;
          for (const u of game.units) {
            if (u.team === 'red' && u !== target && u.hp > 0) {
              const dx = u.x - target.x, dy = u.y - target.y;
              const d = Math.sqrt(dx * dx + dy * dy);
              if (d < 250 && d < minDist) { otherEnemy = u; minDist = d; }
            }
          }
          if (otherEnemy) {
            triggerCommanderStrike(target.x, target.y, otherEnemy.x, otherEnemy.y);
          } else {
            triggerCommanderStrike(target.x, target.y, target.x, target.y);
          }
          return;
        }
        let cooldownReduction = 0;
        if (this.team === 'blue' && game.tempoKills > 0) {
          cooldownReduction = Math.min(game.tempoKills * 0.08, 0.3);
        }
        this.fireCooldown = Math.max(10, Math.round(this.cdMax * (1 - cooldownReduction)));
        // Projectile spawn at gun barrel end (offset like the drawn barrel)
        let px, py;
        if (this.type === 'infantry' || this.type === 'sniper') {
          const perpAngle = this.turretAngle + Math.PI / 2;
          const gripOffset = this.radius * 0.4;
          const gripForward = this.radius * 0.25;
          const blen = this.type === 'sniper' ? 22 : 16;
          const gx = this.x + Math.cos(this.turretAngle) * gripForward + Math.cos(perpAngle) * gripOffset;
          const gy = this.y + Math.sin(this.turretAngle) * gripForward + Math.sin(perpAngle) * gripOffset;
          px = gx + Math.cos(this.turretAngle) * blen;
          py = gy + Math.sin(this.turretAngle) * blen;
        } else {
          px = this.x + Math.cos(this.turretAngle) * this.radius;
          py = this.y + Math.sin(this.turretAngle) * this.radius;
        }
        game.projectiles.push({ x: px, y: py, target: this.targetUnit, sourceUnit: this, damage: this.damage, speed: this.type === 'tank' ? 6 : this.type === 'sniper' ? 14 : 9, type: this.weapon, team: this.team, vx: Math.cos(this.turretAngle), vy: Math.sin(this.turretAngle) });
        addEffect('muzzle-flash', { x: px + Math.cos(this.turretAngle) * 4, y: py + Math.sin(this.turretAngle) * 4, timer: 6, team: this.team });
        if (this.type === 'tank') playSound('heavy-shoot');
        else if (this.type === 'sniper') playSound('sniper');
        else playSound('laser');
        alertEnemiesOnShot(this, px, py);
      }

      draw() {
        ctx.save();
        const col = this.team === 'blue' ? '#3b82f6' : '#ef4444';

        // Selection ring
        if (this.isSelected) {
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.radius + 7, 0, Math.PI * 2);
          ctx.strokeStyle = '#eab308'; ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]);
        }

        // Suppression visual - pulsing red overlay
        if (this.team === 'red' && this.suppression > 20) {
          const pulse = Math.sin(Date.now() * 0.01 + this.x) * 0.3 + 0.7;
          const intensity = (this.suppression / 100) * pulse * 0.3;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.radius + 4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(239,68,68,${intensity})`;
          ctx.fill();
        }

        // Isolation visual - dimmed aura
        if (this.team === 'red' && this.isIsolated) {
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.radius + 8, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(168,85,247,0.3)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 6]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Focus fire indicator - yellow crosshair if being focused
        if (this.team === 'red' && game.focusTracker && game.focusTracker[this.id] >= 3) {
          const r = this.radius + 12 + Math.sin(Date.now() * 0.005) * 2;
          ctx.strokeStyle = 'rgba(234,179,8,0.5)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(this.x - r - 3, this.y); ctx.lineTo(this.x + r + 3, this.y);
          ctx.moveTo(this.x, this.y - r - 3); ctx.lineTo(this.x, this.y + r + 3);
          ctx.stroke();
        }

        // Flanked indicator
        if (this.team === 'red' && game.flankTracker && game.flankTracker[this.id]) {
          ctx.strokeStyle = 'rgba(251,191,36,0.6)';
          ctx.lineWidth = 2;
          const pulse2 = Math.sin(Date.now() * 0.008) * 0.3 + 0.7;
          ctx.globalAlpha = pulse2;
          // Draw small arrows pointing in from flank directions
          for (const u of game.units) {
            if (u.team === 'blue' && u.targetUnit === this && u.hp > 0) {
              const ang = Math.atan2(u.y - this.y, u.x - this.x);
              const arrowX = this.x + Math.cos(ang) * (this.radius + 14);
              const arrowY = this.y + Math.sin(ang) * (this.radius + 14);
              ctx.beginPath();
              ctx.moveTo(arrowX + Math.cos(ang) * 5, arrowY + Math.sin(ang) * 5);
              ctx.lineTo(arrowX, arrowY);
              ctx.stroke();
            }
          }
          ctx.globalAlpha = 1;
        }

        // Vision cone debug
        if (game.showVision && this.team === 'red') {
          ctx.beginPath();
          ctx.moveTo(this.x, this.y);
          ctx.arc(this.x, this.y, this.range, this.angle - Math.PI / 2.2, this.angle + Math.PI / 2.2);
          ctx.closePath();
          ctx.fillStyle = 'rgba(239,68,68,0.08)'; ctx.fill();
        }

        if (this.type === 'infantry' || this.type === 'sniper') {
          ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
          ctx.fillStyle = this.type === 'sniper' ? (this.team === 'blue' ? '#8b5cf6' : '#c084fc') : col;
          ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.stroke(); ctx.fill();
          // Gun barrel offset from center — held in one hand, like a rifle
          const perpAngle = this.turretAngle + Math.PI / 2;
          const gripOffset = this.radius * 0.4;
          const gripForward = this.radius * 0.25;
          const gx = this.x + Math.cos(this.turretAngle) * gripForward + Math.cos(perpAngle) * gripOffset;
          const gy = this.y + Math.sin(this.turretAngle) * gripForward + Math.sin(perpAngle) * gripOffset;
          const blen = this.type === 'sniper' ? 22 : 16;
          ctx.beginPath();
          ctx.moveTo(gx, gy);
          ctx.lineTo(gx + Math.cos(this.turretAngle) * blen, gy + Math.sin(this.turretAngle) * blen);
          ctx.lineWidth = this.type === 'sniper' ? 3 : 4; ctx.strokeStyle = '#000'; ctx.stroke();

        } else if (this.type === 'tank') {
          ctx.translate(this.x, this.y); ctx.rotate(this.angle);
          // Shadow for depth
          ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
          ctx.shadowBlur = 8;
          ctx.shadowOffsetY = 4;

          // Tracks (Left and Right)
          ctx.fillStyle = '#111111';
          ctx.fillRect(-this.radius * 1.1, -this.radius * 0.85, this.radius * 2.2, this.radius * 0.25);
          ctx.fillRect(-this.radius * 1.1, this.radius * 0.6, this.radius * 2.2, this.radius * 0.25);

          // Main Hull
          ctx.fillStyle = col;
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.rect(-this.radius, -this.radius * 0.6, this.radius * 2, this.radius * 1.2);
          ctx.fill();
          ctx.stroke();

          // Reset shadow for upper layers
          ctx.shadowColor = 'transparent';

          // Turret setup
          ctx.rotate(-this.angle);
          ctx.rotate(this.turretAngle);

          // Barrel
          ctx.fillStyle = col;
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.rect(0, -this.radius * 0.15, this.radius * 1.4, this.radius * 0.3);
          ctx.fill();
          ctx.stroke();

          // Muzzle Brake (Tip of the barrel)
          ctx.fillStyle = '#111111';
          ctx.beginPath();
          ctx.rect(this.radius * 1.2, -this.radius * 0.22, this.radius * 0.25, this.radius * 0.44);
          ctx.fill();
          ctx.stroke();

          // Turret Hatch
          ctx.fillStyle = col;
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, this.radius * 0.55, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Hatch Detail (Center core)
          ctx.fillStyle = '#111111';
          ctx.beginPath();
          ctx.arc(-this.radius * 0.1, 0, this.radius * 0.25, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

        } else if (this.type === 'apc') {
          ctx.translate(this.x, this.y); ctx.rotate(this.angle);
          const w = this.radius * 1.8, h = this.radius * 1.3;
          ctx.fillStyle = '#15803d'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w, h); ctx.stroke(); ctx.fill();
          // red cross
          ctx.fillStyle = '#fff';
          ctx.fillRect(-3, -8, 6, 16); ctx.fillRect(-8, -3, 16, 6);
          // heal aura ring
          ctx.rotate(-this.angle);
          if (this.healCooldown < 15) {
            ctx.beginPath(); ctx.arc(0, 0, this.healRadius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(74,222,128,${0.15 * (1 - this.healCooldown / 15)})`;
            ctx.lineWidth = 2; ctx.stroke();
          }

        } else if (this.type === 'anti-tank') {
          ctx.translate(this.x, this.y); ctx.rotate(this.angle);
          // Shadow
          ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 4;
          // Hull — angular tank destroyer shape
          ctx.fillStyle = col; ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(-this.radius, -this.radius * 0.55);
          ctx.lineTo(this.radius * 0.6, -this.radius * 0.55);
          ctx.lineTo(this.radius, -this.radius * 0.3);
          ctx.lineTo(this.radius, this.radius * 0.55);
          ctx.lineTo(-this.radius, this.radius * 0.55);
          ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.shadowColor = 'transparent';
          // Turret
          ctx.rotate(-this.angle); ctx.rotate(this.turretAngle);
          // Thick barrel
          ctx.fillStyle = col; ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.rect(0, -this.radius * 0.28, this.radius * 1.2, this.radius * 0.56); ctx.fill(); ctx.stroke();
          // Baffle ring mid-barrel
          ctx.fillStyle = '#111111';
          ctx.beginPath(); ctx.rect(this.radius * 0.45, -this.radius * 0.45, this.radius * 0.25, this.radius * 0.9); ctx.fill(); ctx.stroke();
          // Turret base
          ctx.fillStyle = col; ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(0, 0, this.radius * 0.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        } else if (this.type === 'gunner') {
          ctx.translate(this.x, this.y);
          ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
          ctx.shadowBlur = 6;
          ctx.shadowOffsetY = 3;
          ctx.fillStyle = '#111111';
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, this.radius * 1.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#222222';
          ctx.beginPath();
          ctx.arc(0, 0, this.radius * 0.9, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.shadowColor = 'transparent';
          ctx.rotate(this.turretAngle);
          ctx.fillStyle = col;
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(-this.radius * 0.2, -this.radius * 0.35, this.radius * 0.25, 0, Math.PI * 2);
          ctx.arc(-this.radius * 0.2, this.radius * 0.35, this.radius * 0.25, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#111111';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.rect(-this.radius * 0.2, -this.radius * 0.2, this.radius * 0.9, this.radius * 0.4);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.rect(0, -this.radius * 0.55, this.radius * 0.4, this.radius * 0.35);
          ctx.fill();
          ctx.stroke();
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(this.radius * 0.7, 0);
          ctx.lineTo(this.radius * 2.0, 0);
          ctx.stroke();
          ctx.fillStyle = '#111111';
          ctx.beginPath();
          ctx.rect(this.radius * 1.7, -this.radius * 0.08, this.radius * 0.3, this.radius * 0.16);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#111111';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(-this.radius * 0.4, 0, this.radius * 0.45, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else if (this.type === 'commander') {
          ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
          ctx.fillStyle = col; ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.stroke(); ctx.fill();
          ctx.beginPath(); ctx.arc(this.x + Math.cos(this.turretAngle) * this.radius * 0.3, this.y + Math.sin(this.turretAngle) * this.radius * 0.3, this.radius * 0.5, 0, Math.PI * 2);
          ctx.fillStyle = '#111'; ctx.stroke(); ctx.fill();
          const ba = this.turretAngle;
          const bx = this.x + Math.cos(ba) * this.radius * 0.35;
          const by = this.y + Math.sin(ba) * this.radius * 0.35;
          const perp = ba + Math.PI / 2;
          ctx.strokeStyle = '#111'; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.moveTo(bx + Math.cos(perp) * 2, by + Math.sin(perp) * 2);
          ctx.lineTo(bx + Math.cos(ba) * 6, by + Math.sin(ba) * 6);
          ctx.lineTo(bx - Math.cos(perp) * 2, by - Math.sin(perp) * 2);
          ctx.stroke();
        } else if (this.type === 'drone') {
          const tDist = this.targetUnit ? Math.sqrt((this.targetUnit.x - this.x) ** 2 + (this.targetUnit.y - this.y) ** 2) : Infinity;
          const armed = tDist < 150;
          if (armed) {
            const pulse = Math.sin(Date.now() * 0.025 + this.beepTimer) * .5 + .5;
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius + 5 + pulse * 5, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(239,68,68,${.4 * pulse})`; ctx.lineWidth = 1.5; ctx.stroke();
          }
          ctx.translate(this.x, this.y); ctx.rotate(this.angle + (Date.now() * 0.018));
          ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(-this.radius, -this.radius); ctx.lineTo(this.radius, this.radius);
          ctx.moveTo(this.radius, -this.radius); ctx.lineTo(-this.radius, this.radius); ctx.stroke();
          ['#3f3f46'].forEach(c => {
            [[-this.radius, -this.radius], [this.radius, -this.radius], [this.radius, this.radius], [-this.radius, this.radius]].forEach(([px, py]) => {
              ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill(); ctx.stroke();
            });
          });
          ctx.beginPath(); ctx.arc(0, 0, this.radius * .5, 0, Math.PI * 2);
          ctx.fillStyle = armed ? '#ef4444' : col; ctx.stroke(); ctx.fill();
        }

        ctx.restore();

        // HP bar
        if (this.hp < this.maxHp || this.isSelected) {
          const bw = this.radius * 2.2, bh = 4;
          const bx = this.x - this.radius * 1.1, by = this.y - this.radius - 11;
          ctx.fillStyle = '#000'; ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
          const pct = Math.max(0, this.hp / this.maxHp);
          ctx.fillStyle = pct > .6 ? '#22c55e' : pct > .3 ? '#eab308' : '#ef4444';
          ctx.fillRect(bx, by, bw * pct, bh);
        }
      }
    }

    // ============================================================
    //  EFFECTS HELPER
    // ============================================================
    function addEffect(type, props) {
      game.effects.push({ type, ...props });
    }

    function addFloatingText(x, y, text, color) {
      game.floatingTexts.push({ x, y, text, color, vy: -1.3, timer: 45 });
    }

    // ============================================================
    //  DEFAULT MAP
    // ============================================================
    function initDefaultMap() {
      game.obstacles = [
        { x: 320, y: 192, w: 128, h: 64, type: 'conblock' },
        { x: 320, y: 320, w: 64, h: 128, type: 'conblock' },
        { x: 700, y: 384, w: 192, h: 64, type: 'conblock' },
        { x: 128, y: 448, w: 128, h: 64, type: 'conblock' },
        { x: 576, y: 128, w: 64, h: 64, type: 'bunker' },
        { x: 450, y: 260, w: 64, h: 64, type: 'wall' },
        { x: 250, y: 300, w: 64, h: 128, type: 'conblock' },
      ];
    }
    initDefaultMap();

    // ============================================================
    //  SPAWN & UI UPDATES
    // ============================================================
    function spawnUnit(team, type, x, y) {
      const u = new Unit(x, y, team, type);
      game.units.push(u);
      updateTeamUiCounts();
      return u;
    }

    function updateTeamUiCounts() {
      const b = game.units.filter(u => u.team === 'blue').length;
      const r = game.units.filter(u => u.team === 'red').length;
      document.getElementById('blue-count').textContent = b;
      document.getElementById('red-count').textContent = r;
      document.getElementById('credits-count').textContent = game.credits;
      const el = document.getElementById('sidebar-spawner-count');
      if (el) el.textContent = `(${game.spawners.length})`;
      // Threat bar
      const maxRed = 12;
      document.getElementById('threat-bar').style.width = Math.min(100, r / maxRed * 100) + '%';
    }

    function updateDeployUI() {
      let total = 0;
      for (const [type, qty] of Object.entries(game.armySelection)) total += qty * UNIT_COSTS[type];
      const rem = game.deployBudget - total;
      document.getElementById('deploy-remaining').textContent = rem;
      document.getElementById('deploy-budget').textContent = game.deployBudget;
      let count = 0;
      document.querySelectorAll('.deploy-row').forEach(row => {
        const type = row.dataset.type;
        const cost = UNIT_COSTS[type];
        row.querySelector('.deploy-qty').textContent = game.armySelection[type];
        count += game.armySelection[type];
        const plus = row.querySelector('.deploy-plus');
        plus.disabled = rem < cost; plus.style.opacity = rem < cost ? .4 : 1;
      });
      document.getElementById('deploy-total-units').textContent = `${count} unit${count !== 1 ? 's' : ''}`;
    }

    // ============================================================
    //  LEVEL SELECTION & PROGRESSION
    // ============================================================
    const CUSTOM_LEVELS_STORAGE_KEY = 'gault_custom_levels';

    function loadCustomLevelsFromStorage() {
      try {
        const raw = localStorage.getItem(CUSTOM_LEVELS_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.map(normalizeCustomLevelRecord).filter(Boolean) : [];
      } catch (e) {
        console.warn('Could not load custom levels.', e);
        return [];
      }
    }

    function saveCustomLevelsToStorage() {
      localStorage.setItem(CUSTOM_LEVELS_STORAGE_KEY, JSON.stringify(game.customLevels));
    }

    function normalizeCustomLevelRecord(record) {
      if (!record || typeof record !== 'object') return null;
      const budget = parseInt(record.budget, 10);
      const waves = parseInt(record.waves, 10);
      return {
        id: record.id || `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: String(record.name || 'Untitled Custom Level'),
        description: String(record.description || 'Imported custom level.'),
        budget: Number.isFinite(budget) && budget > 0 ? budget : 1000,
        waves: Number.isFinite(waves) && waves > 0 ? waves : 3,
        bg: record.bg || '#18181b',
        data: String(record.data || ''),
        fileName: String(record.fileName || 'custom.gtm'),
        createdAt: record.createdAt || Date.now(),
      };
    }

    function extractLevelMetadata(text, fallbackName, fallbackDescription) {
      const meta = {
        name: fallbackName,
        description: fallbackDescription,
        budget: 1000,
        waves: 3,
        bg: '#18181b',
      };
      text.split(/\r?\n/).forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;
        const colonIndex = trimmed.indexOf(':');
        if (colonIndex === -1) return;
        const key = trimmed.slice(0, colonIndex).trim().toLowerCase();
        const value = trimmed.slice(colonIndex + 1).trim();
        if (!value) return;
        if (key === 'name') meta.name = value;
        else if (key === 'description' || key === 'desc') meta.description = value;
        else if (key === 'budget') meta.budget = parseInt(value, 10) || meta.budget;
        else if (key === 'waves') meta.waves = parseInt(value, 10) || meta.waves;
        else if (key === 'bg') meta.bg = value;
      });
      return meta;
    }

    function cloneMapStateFromCurrent() {
      return {
        obstacles: game.obstacles.map(item => ({ ...item })),
        spawners: game.spawners.map(item => ({ ...item })),
        trees: game.trees.map(item => ({ ...item })),
        bgColor: game.bgColor,
      };
    }

    function restoreMapState(mapState) {
      game.obstacles = mapState.obstacles.map(item => ({ ...item }));
      game.spawners = mapState.spawners.map(item => ({ ...item }));
      game.trees = mapState.trees.map(item => ({ ...item }));
      if (mapState.bgColor) game.bgColor = mapState.bgColor;
    }

    function renderCustomLevels() {
      const container = document.getElementById('custom-level-list-container');
      if (!container) return;
      container.innerHTML = '';

      if (!game.customLevels.length) {
        const empty = document.createElement('div');
        empty.className = 'border border-zinc-800 bg-zinc-950 p-4 text-xs text-zinc-500';
        empty.textContent = 'No custom levels yet. Upload a .gtm file to save it here.';
        container.appendChild(empty);
        return;
      }

      game.customLevels.forEach(level => {
        const card = document.createElement('div');
        card.className = 'flex flex-col md:flex-row items-start md:items-center justify-between border-2 border-zinc-800 bg-zinc-900 p-4 gap-3';

        const info = document.createElement('div');
        info.className = 'space-y-1 pr-4';

        const title = document.createElement('div');
        title.className = 'flex items-center gap-2';

        const tag = document.createElement('span');
        tag.className = 'text-xs px-1.5 py-0.5 font-bold bg-green-900/60 text-green-300';
        tag.textContent = 'CUSTOM';

        const name = document.createElement('span');
        name.className = 'text-lg font-black tracking-wide';
        name.style.fontFamily = 'Rajdhani, sans-serif';
        name.textContent = level.name;

        title.appendChild(tag);
        title.appendChild(name);

        const desc = document.createElement('div');
        desc.className = 'text-xs text-zinc-400 leading-relaxed max-w-md';
        desc.textContent = level.description;

        const stats = document.createElement('div');
        stats.className = 'text-[10px] text-zinc-500 flex gap-3 mt-1';
        stats.innerHTML = `<span>BUDGET: <span class="text-amber-500 font-bold">${level.budget}c</span></span> <span>WAVES: <span class="text-red-500 font-bold">${level.waves}</span></span>`;

        info.appendChild(title);
        info.appendChild(desc);
        info.appendChild(stats);

        const buttons = document.createElement('div');
        buttons.className = 'flex flex-wrap gap-2 w-full md:w-auto';

        const playBtn = document.createElement('button');
        playBtn.className = 'btn bg-green-900 hover:bg-green-800 text-green-100 px-4 py-2 text-xs font-black tracking-wider';
        playBtn.textContent = 'DEPLOY';
        playBtn.addEventListener('click', () => selectCustomLevel(level.id));

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn bg-red-950 hover:bg-red-900 text-red-200 px-4 py-2 text-xs font-black tracking-wider';
        deleteBtn.textContent = 'DELETE';
        deleteBtn.addEventListener('click', () => {
          game.customLevels = game.customLevels.filter(item => item.id !== level.id);
          saveCustomLevelsToStorage();
          renderCustomLevels();
          logMessage(`[CUSTOM] Removed ${level.name}.`);
        });

        buttons.appendChild(playBtn);
        buttons.appendChild(deleteBtn);

        card.appendChild(info);
        card.appendChild(buttons);
        container.appendChild(card);
      });
    }

    function renderLevelSelection() {
      const container = document.getElementById('level-list-container');
      container.innerHTML = '';

      LEVELS.forEach(level => {
        const isUnlocked = level.id <= game.unlockedLevelId;
        const card = document.createElement('div');
        card.className = `flex flex-col md:flex-row items-start md:items-center justify-between border-2 p-4 ${isUnlocked
          ? 'bg-zinc-900 border-zinc-700 hover:border-blue-500'
          : 'bg-zinc-950 border-zinc-900 opacity-60'
          } transition-all duration-150`;

        // Left info
        const info = document.createElement('div');
        info.className = 'space-y-1 pr-4';

        const title = document.createElement('div');
        title.className = 'flex items-center gap-2';

        const num = document.createElement('span');
        num.className = `text-xs px-1.5 py-0.5 font-bold ${isUnlocked ? 'bg-blue-900/60 text-blue-300' : 'bg-zinc-800 text-zinc-500'}`;
        num.textContent = `LEVEL ${level.id}`;

        const name = document.createElement('span');
        name.className = 'text-lg font-black tracking-wide';
        name.style.fontFamily = 'Rajdhani, sans-serif';
        name.textContent = level.name;

        title.appendChild(num);
        title.appendChild(name);

        const desc = document.createElement('div');
        desc.className = 'text-xs text-zinc-400 leading-relaxed max-w-md';
        desc.textContent = isUnlocked ? level.description : 'Locked. Complete previous sectors to unlock.';

        const stats = document.createElement('div');
        stats.className = 'text-[10px] text-zinc-500 flex gap-3 mt-1';
        stats.innerHTML = `<span>BUDGET: <span class="text-amber-500 font-bold">${level.budget}c</span></span>`;

        info.appendChild(title);
        info.appendChild(desc);
        if (isUnlocked) info.appendChild(stats);

        card.appendChild(info);

        // Action button
        const btnContainer = document.createElement('div');
        btnContainer.className = 'w-full md:w-auto mt-3 md:mt-0';

        const btn = document.createElement('button');
        if (isUnlocked) {
          btn.className = 'btn w-full md:w-32 bg-blue-900 hover:bg-blue-800 text-blue-200 py-2 px-4 text-xs font-black tracking-wider uppercase';
          btn.textContent = 'DEPLOY';
          btn.addEventListener('click', () => {
            selectLevel(level.id);
          });
        } else {
          btn.className = 'btn w-full md:w-32 bg-zinc-900 border-zinc-800 text-zinc-600 py-2 px-4 text-xs font-bold uppercase cursor-not-allowed';
          btn.textContent = 'LOCKED';
          btn.disabled = true;
        }
        btnContainer.appendChild(btn);
        card.appendChild(btnContainer);

        container.appendChild(card);
      });
    }

    function selectLevel(levelId) {
      const level = LEVELS.find(l => l.id === levelId);
      if (!level) return;
      game.currentLevelId = levelId;
      game.currentCustomLevelId = null;
      game.activeLevelKind = 'campaign';
      game.activeLevelName = level.name;
      game.activeLevelDescription = level.description;
      game.activeLevelBudget = level.budget;
      game.activeLevelWaves = level.waves;
      game.activeLevelFile = level.file;
      game.activeLevelData = '';
      game.deployBudget = level.budget;

      // Set budget labels in DOM
      const budgetVal = document.getElementById('deploy-budget');
      if (budgetVal) budgetVal.textContent = level.budget;
      const remainingVal = document.getElementById('deploy-remaining');
      if (remainingVal) remainingVal.textContent = level.budget;

      // Set deploy title
      const deployTitle = document.getElementById('deploy-title');
      if (deployTitle) deployTitle.textContent = `DEPLOY FORCES — ${level.name.toUpperCase()}`;

      setScreenMode('deployment');
    }

    function selectCustomLevel(customLevelId) {
      const level = game.customLevels.find(l => l.id === customLevelId);
      if (!level) return;
      game.currentLevelId = 0;
      game.currentCustomLevelId = customLevelId;
      game.activeLevelKind = 'custom';
      game.activeLevelName = level.name;
      game.activeLevelDescription = level.description;
      game.activeLevelBudget = level.budget;
      game.activeLevelWaves = level.waves;
      game.activeLevelFile = level.fileName;
      game.activeLevelData = level.data;
      game.deployBudget = level.budget;

      const budgetVal = document.getElementById('deploy-budget');
      if (budgetVal) budgetVal.textContent = level.budget;
      const remainingVal = document.getElementById('deploy-remaining');
      if (remainingVal) remainingVal.textContent = level.budget;

      const deployTitle = document.getElementById('deploy-title');
      if (deployTitle) deployTitle.textContent = `DEPLOY FORCES — ${level.name.toUpperCase()}`;

      setScreenMode('deployment');
    }

    async function loadSelectedLevelMap() {
      if (game.activeLevelKind === 'builder-test' && game.builderTestMapState) {
        restoreMapState(game.builderTestMapState);
        return;
      }

      const isCustom = game.activeLevelKind === 'custom' && game.currentCustomLevelId;
      const level = isCustom
        ? game.customLevels.find(l => l.id === game.currentCustomLevelId)
        : LEVELS.find(l => l.id === game.currentLevelId);
      if (!level) throw new Error('No selected level');

      game.obstacles = [];
      game.spawners = [];
      game.trees = [];
      game.bgColor = level.bg || '#18181b';

      let mapData = '';
      if (isCustom) {
        mapData = level.data;
      } else {
        const res = await fetch(level.file);
        if (!res.ok) throw new Error(`Failed to load ${level.file}`);
        mapData = await res.text();
        console.log(`Loaded level ${game.currentLevelId} from file.`);
      }

      parseLevelData(mapData);
    }

    function parseLevelData(txt) {
      const lines = txt.trim().split('\n');
      if (!lines[0] || !lines[0].startsWith('GTM')) {
        console.error("Invalid level file format");
        return;
      }
      for (let i = 1; i < lines.length; i++) {
        const p = lines[i].trim().split(/\s+/);
        if (!p.length || !p[0]) continue;
        const first = p[0].toLowerCase();
        if (first === 'name:' || first === 'description:' || first === 'desc:' || first === 'budget:' || first === 'waves:') continue;
        if (first === 'bg:' && p[1]) { game.bgColor = p[1]; continue; }
        if (p[0] === 'spawn' && p.length >= 4) {
          let st = p[3];
          if (st === 'inf') st = 'infantry';
          game.spawners.push({ x: +p[1], y: +p[2], type: st });
        } else if (p[0] === 'tree' && p.length >= 3) {
          game.trees.push({ x: +p[1], y: +p[2] });
        } else if (p.length >= 5) {
          game.obstacles.push({ type: p[0], x: +p[1], y: +p[2], w: +p[3], h: +p[4] });
        }
      }
    }

    // ============================================================
    //  SCREEN MODE MANAGER
    // ============================================================
    function setScreenMode(mode) {
      const prevMode = game.mode;
      game.mode = mode;
      const home = document.getElementById('homescreen-overlay');
      const levelSelect = document.getElementById('level-selection-overlay');
      const customLevels = document.getElementById('custom-levels-overlay');
      const deploy = document.getElementById('deployment-overlay');
      const gm = document.getElementById('game-metrics');
      const bm = document.getElementById('builder-metrics');
      const gp = document.getElementById('panel-game');
      const bp = document.getElementById('panel-builder');
      const dir = document.getElementById('game-directive-overlay');
      const badge = document.getElementById('active-mode-badge');
      const waveHud = document.getElementById('wave-hud');
      const returningFromBuilderTest = prevMode === 'simulation' && game.activeLevelKind === 'builder-test';

      // Reset mode alerts
      game.units.forEach(u => u.isSelected = false);
      const ov = document.getElementById('game-over-overlay');
      if (ov) ov.remove();
      game.gameOver = null; game.floatingTexts = []; game.airstrikeMode = false; game.airstrikeDragging = false;
      game.airstrikeLineStart = null; game.airstrikeLineEnd = null; game.mineMode = false; game.smokeMode = false; game.artilleryMode = false;
      game.commanderStrike = null; game.builderHoverPos = null; game.isBuilding = false; game.isErasing = false;
      document.getElementById('target-mode-alert').classList.add('hidden');

      // Hide all overlays
      home.classList.add('hidden'); levelSelect.classList.add('hidden'); customLevels.classList.add('hidden'); deploy.classList.add('hidden');
      gm.classList.add('hidden'); bm.classList.add('hidden');
      gp.classList.add('hidden'); bp.classList.add('hidden');
      dir.classList.add('hidden'); waveHud.classList.add('hidden');

      if (mode === 'home') {
        home.classList.remove('hidden');
        stopAmbientDrone(); playSound('click');

      } else if (mode === 'level-select') {
        game.isCampaignMode = true;
        levelSelect.classList.remove('hidden');
        renderLevelSelection();
        playSound('click');

      } else if (mode === 'custom-levels') {
        customLevels.classList.remove('hidden');
        renderCustomLevels();
        playSound('click');

      } else if (mode === 'deployment') {
        deploy.classList.remove('hidden');
        game.armySelection = { infantry: 0, tank: 0, drone: 0, sniper: 0, apc: 0, 'anti-tank': 0, commander: 0 };
        updateDeployUI(); playSound('click');

      } else if (mode === 'simulation') {
        gm.classList.remove('hidden'); gp.classList.remove('hidden');
        waveHud.classList.add('hidden');
        badge.textContent = 'COMBAT'; badge.className = 'bg-blue-900/60 border border-blue-700 text-[9px] text-blue-300 px-1.5 py-0.5 tracking-widest uppercase';

        game.camera.x = 0; game.camera.y = 0;
        game.units = []; game.projectiles = []; game.effects = [];
        game.mines = []; game.smokeScreens = []; game.shakeTimer = 0;
        game.kills = 0;

        // Load the selected level map
        const hasSelectedLevel = game.activeLevelKind === 'builder-test'
          ? true
          : game.activeLevelKind === 'custom'
            ? !!game.customLevels.find(l => l.id === game.currentCustomLevelId)
            : !!LEVELS.find(l => l.id === game.currentLevelId);
        if (hasSelectedLevel) {
          const selectedLevelName = game.activeLevelName || 'Selected Level';
          const levelBudget = game.activeLevelBudget || 1000;
          game.deployBudget = levelBudget;
          loadSelectedLevelMap().then(() => {
            const hasArmy = Object.values(game.armySelection).some(v => v > 0);
            if (hasArmy) {
              let spent = 0;
              for (const [t, q] of Object.entries(game.armySelection)) spent += q * UNIT_COSTS[t];
              game.credits = game.deployBudget - spent;
              let idx = 0;
              for (const [type, qty] of Object.entries(game.armySelection)) {
                for (let i = 0; i < qty; i++) {
                  const col = Math.floor(idx / 8); const row = idx % 8;
                  spawnUnit('blue', type, 110 + col * 65, 130 + row * 55);
                  idx++;
                }
              }
              logMessage(`[DEPLOY] ${idx} units launched on ${selectedLevelName}. ${game.credits}c remaining.`);
            } else {
              game.credits = 500;
              spawnUnit('blue', 'tank', 140, 290); spawnUnit('blue', 'infantry', 130, 210);
              spawnUnit('blue', 'infantry', 130, 370); spawnUnit('blue', 'drone', 110, 290);
              spawnUnit('blue', 'sniper', 100, 180); spawnUnit('blue', 'apc', 160, 330); spawnUnit('blue', 'commander', 100, 440);
              logMessage('[SYSTEM] Default loadout deployed on ' + selectedLevelName + '.');
            }
            // Spawn 1 unit per spawner at start
            for (const sp of game.spawners) {
              const u = spawnUnit('red', sp.type, sp.x + 16, sp.y + 16);
              const blues = game.units.filter(u2 => u2.team === 'blue');
              if (blues.length > 0) { const dest = blues[Math.floor(Math.random() * blues.length)]; u.targetX = dest.x; u.targetY = dest.y; }
            }
            logMessage(`[ENEMY] ${game.spawners.length} enemy units deployed.`);
            const hasBeacon = game.obstacles.some(o => o.type === 'beacon');
            if (hasBeacon) {
              document.getElementById('game-directive-overlay').classList.remove('hidden');
              document.getElementById('directive-title').textContent = 'MISSION OBJECTIVE';
              document.getElementById('directive-text').innerHTML = 'Reach the <b style="color:#fbbf24">beacon</b> with any unit to capture it.<br>Eliminating enemies is optional.';
            }
            startAmbientDrone();
            updateTeamUiCounts();
          }).catch(err => {
            console.error(err);
            logMessage('<span style="color:#ef4444">[ERROR] Could not load selected level.</span>');
          });
        }
        playSound('deploy');

      } else if (mode === 'builder') {
        bm.classList.remove('hidden'); bp.classList.remove('hidden');
        badge.textContent = 'BUILDER'; badge.className = 'bg-amber-900/60 border border-amber-600 text-[9px] text-amber-300 px-1.5 py-0.5 tracking-widest uppercase';
        document.getElementById('directive-text').innerHTML = 'LMB place · RMB erase<br>[1-9] brushes · [R]otate · [S]ize<br>[Z] undo · Export/Import .GTM';
        game.units = []; game.projectiles = []; game.effects = [];
        if (!returningFromBuilderTest) {
          game.obstacles = []; game.spawners = []; game.trees = [];
        }
        game.builderLastAction = null;
        game.activeLevelKind = 'builder';
        stopAmbientDrone();
        updateBuilderCount(); playSound('click');
      }
    }

    // ============================================================
    //  AMBIENT DRONE
    // ============================================================
    function startAmbientDrone() {
      if (game.ambientDrone) return;
      try {
        const osc = audioCtx.createOscillator(), gain = audioCtx.createGain(), filter = audioCtx.createBiquadFilter();
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(50, audioCtx.currentTime);
        filter.type = 'lowpass'; filter.frequency.setValueAtTime(90, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.01, audioCtx.currentTime);
        osc.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
        osc.start(); game.ambientDrone = { osc, gain, filter };
      } catch (e) { }
    }
    function stopAmbientDrone() {
      if (game.ambientDrone) { try { game.ambientDrone.osc.stop(); } catch (e) { } game.ambientDrone = null; }
    }

    // ============================================================
    //  GAME OVER
    // ============================================================
    function showGameOver(type) {
      const existing = document.getElementById('game-over-overlay');
      if (existing) existing.remove();
      const ov = document.createElement('div');
      ov.id = 'game-over-overlay'; ov.className = 'game-over-overlay fade-in';
      const kd = `Kills: ${game.kills}`;
      if (type === 'victory') {
        const level = LEVELS.find(l => l.id === game.currentLevelId);
        const levelName = game.activeLevelName || (level ? level.name : '');
        const hasNextLevel = game.currentLevelId < LEVELS.length;
        const nextBtnHTML = hasNextLevel
          ? `<button class="btn" style="background:#60a5fa;color:#0c4a6e;padding:8px 20px;font-size:12px;font-weight:900;margin-right:8px" onclick="document.getElementById('level-selection-overlay').classList.remove('hidden');document.getElementById('game-over-overlay').remove();renderLevelSelection();">NEXT LEVEL →</button>`
          : '';
        ov.innerHTML = `<div class="game-over-box" style="border-color:#22c55e;background:#052e16;">
      <div style="font-family:Rajdhani,sans-serif;font-size:2.5rem;font-weight:900;color:#22c55e">VICTORY</div>
      <div style="color:#86efac;font-size:11px;margin-bottom:6px">${levelName ? levelName + ' secured' : 'All hostiles neutralized. Sector secured.'}.</div>
      <div style="color:#4ade80;font-size:10px;margin-bottom:18px">${kd}</div>
      <div style="display:flex;gap:8px">
        ${nextBtnHTML}
        <button class="btn" style="background:#22c55e;color:#052e16;padding:8px 20px;font-size:12px;font-weight:900" onclick="setScreenMode('home')">COMMAND HQ</button>
      </div>
    </div>`;
      } else {
        ov.innerHTML = `<div class="game-over-box" style="border-color:#ef4444;background:#450a0a;">
      <div style="font-family:Rajdhani,sans-serif;font-size:2.5rem;font-weight:900;color:#ef4444">DEFEATED</div>
      <div style="color:#fca5a5;font-size:11px;margin-bottom:6px">All friendly forces lost. Mission failed.</div>
      <div style="color:#f87171;font-size:10px;margin-bottom:18px">${kd}</div>
      <button class="btn" style="background:#ef4444;color:#450a0a;padding:10px 24px;font-size:13px;font-weight:900" onclick="setScreenMode('home')">RETURN TO COMMAND</button>
    </div>`;
      }
      document.querySelector('main').appendChild(ov);
    }

    // ============================================================
    //  AIRSTRIKE
    // ============================================================
    function triggerAirStrikeLine(start, end) {
      game.credits -= 400; game.airstrikeMode = false;
      document.getElementById('target-mode-alert').classList.add('hidden');
      updateTeamUiCounts();
      const dx = end.x - start.x, dy = end.y - start.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      const nx = len > 0 ? dx / len : 1, ny = len > 0 ? dy / len : 0;
      const bombCount = 8;
      game.airStriking = true; game.airstrikeTimer = 0;
      game.airstrikeBombCount = bombCount;
      game.airstrikePoints = [];
      for (let i = 1; i <= bombCount; i++) {
        game.airstrikePoints.push({ x: start.x + dx * (i / (bombCount + 1)), y: start.y + dy * (i / (bombCount + 1)) });
      }
      game.airstrikeLaserTimer = 60;
      addEffect('a10', {
        x: start.x - nx * 300,
        y: start.y - ny * 300,
        targetX: end.x + nx * 300,
        targetY: end.y + ny * 300,
        speed: 18,
        angle: Math.atan2(end.y - start.y, end.x - start.x)
      });
      playSound('whistle');
      logMessage(`[AIRSTRIKE] Bombing corridor designated.`);
    }

    // ============================================================
    //  COMMANDER STRAFE
    // ============================================================
    function triggerCommanderStrike(x1, y1, x2, y2) {
      const dx = x2 - x1, dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      const nx = len > 0 ? dx / len : 1, ny = len > 0 ? dy / len : 0;
      const extend = 80;
      const sx = x1 - nx * extend, sy = y1 - ny * extend;
      const ex = x2 + nx * extend, ey = y2 + ny * extend;
      const totalLen = len + extend * 2;
      const count = Math.max(6, Math.min(16, Math.floor(totalLen / 25)));
      const points = [];
      for (let i = 0; i <= count; i++) {
        const t = i / count;
        points.push({
          x: sx + (ex - sx) * t + (Math.random() - 0.5) * 12,
          y: sy + (ey - sy) * t + (Math.random() - 0.5) * 12,
        });
      }
      game.commanderStrike = { points, idx: 0, timer: 0 };
      addEffect('a10', {
        x: sx - nx * 280, y: sy - ny * 280,
        targetX: ex + nx * 280, targetY: ey + ny * 280,
        speed: 18, angle: Math.atan2(dy, dx), timer: 200
      });
      addEffect('target-marker', { x: x1, y: y1, timer: 15 });
      addEffect('target-marker', { x: x2, y: y2, timer: 15 });
      playSound('whistle');
      logMessage('[COMMANDER] Strafing run called in.');
    }

    // ============================================================
    //  ARTILLERY BARRAGE
    // ============================================================
    function triggerBarrage(x, y) {
      game.credits -= 200; game.artilleryMode = false;
      document.getElementById('target-mode-alert').classList.add('hidden');
      updateTeamUiCounts();
      let delay = 0;
      for (let i = 0; i < 6; i++) {
        const bx = x + (Math.random() - .5) * 80, by = y + (Math.random() - .5) * 80;
        setTimeout(() => {
          addEffect('blast-flash', { x: bx, y: by, maxRadius: 45, radius: 4, timer: 20 });
          addEffect('crater', { x: bx, y: by, radius: 22, opacity: 1, timer: 600 });
          for (let j = 0; j < 6; j++) addEffect('debris', { x: bx, y: by, vx: (Math.random() - .5) * 7, vy: (Math.random() - .5) * 7, size: 2 + Math.random() * 3, timer: 20 + Math.random() * 15 });
          game.shakeTimer = 10; playSound('explosion');
          game.units.forEach(u => {
            const dx = u.x - bx, dy = u.y - by, d = Math.sqrt(dx * dx + dy * dy);
            if (d < 55) { const dmg = Math.round(160 * (1 - d / 55)); u.hp -= dmg; addFloatingText(u.x, u.y - 14, `-${dmg}`, '#ef4444'); alertEnemyOnHit(u, { team: 'blue', x: bx, y: by }); }
          });
        }, delay);
        delay += 200 + Math.random() * 300;
      }
      logMessage('[BARRAGE] Artillery fire mission executed.');
    }

    // ============================================================
    //  MOUSE INPUT
    // ============================================================
    function getMousePos(e) {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left + game.camera.x, y: e.clientY - r.top + game.camera.y };
    }
    function getMousePosScreen(e) {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }
    function snapToGrid(pos) {
      return { x: Math.floor(pos.x / GRID) * GRID, y: Math.floor(pos.y / GRID) * GRID };
    }

    canvas.addEventListener('contextmenu', e => e.preventDefault());

    canvas.addEventListener('mousedown', e => {
      const pos = getMousePos(e);
      if (e.button === 1) {
        game.cameraDragging = true;
        const sp = getMousePosScreen(e);
        game.cameraDragStart = { x: sp.x, y: sp.y };
        game.cameraDragCamStart = { x: game.camera.x, y: game.camera.y };
        e.preventDefault(); return;
      }

      // Airstrike drag
      if (game.airstrikeMode && e.button === 0) {
        game.airstrikeLineStart = pos; game.airstrikeLineEnd = pos; game.airstrikeDragging = true; return;
      }
      // Mine click
      if (game.mineMode && e.button === 0) {
        game.mines.push({ x: pos.x, y: pos.y }); game.credits -= 75;
        game.mineMode = false; document.getElementById('target-mode-alert').classList.add('hidden');
        updateTeamUiCounts(); playSound('click');
        logMessage(`[MINE] Laid at [${Math.round(pos.x)},${Math.round(pos.y)}].`); return;
      }
      // Smoke click
      if (game.smokeMode && e.button === 0) {
        game.smokeScreens.push({ x: pos.x, y: pos.y, radius: 60, timer: 6 * 60 });
        game.credits -= 50; game.smokeMode = false;
        document.getElementById('target-mode-alert').classList.add('hidden');
        updateTeamUiCounts(); playSound('smoke');
        logMessage(`[SMOKE] Deployed at [${Math.round(pos.x)},${Math.round(pos.y)}].`); return;
      }
      // Artillery click
      if (game.artilleryMode && e.button === 0) {
        triggerBarrage(pos.x, pos.y); return;
      }

      if (game.mode === 'builder') {
        if (e.button === 0) { game.isBuilding = true; handleBuilderAction(pos); }
        else if (e.button === 2) { game.isErasing = true; eraseBuilderAt(pos); }
        return;
      }

      if (game.mode === 'simulation') {
        if (e.button === 0) {
          game.isSelecting = true; game.selectionStart = pos; game.selectionEnd = pos;
        } else if (e.button === 2) {
          const sel = game.units.filter(u => u.isSelected && u.team === 'blue');
          if (!sel.length) return;
          let clickedEnemy = null;
          for (const u of game.units) {
            if (u.team === 'red') {
              const dx = u.x - pos.x, dy = u.y - pos.y;
              if (Math.sqrt(dx * dx + dy * dy) < u.radius + 10) { clickedEnemy = u; break; }
            }
          }
          if (clickedEnemy) {
            sel.forEach(u => {
              u.targetUnit = clickedEnemy;
              u.targetX = clickedEnemy.x;
              u.targetY = clickedEnemy.y;
              u._path = null;
            });
            addEffect('target-marker', { x: clickedEnemy.x, y: clickedEnemy.y, timer: 30 });
            logMessage(`[CMD] ${sel.length} units focused on target.`);
          } else if (game.pendingOrder) {
            const cmd = game.pendingOrder;
            const sel2 = game.units.filter(u => u.isSelected && u.team === 'blue');
            if (sel2.length) executeCommand(cmd, pos, sel2);
          } else {
            executeCommand('attack', pos, sel);
          }
        }
      }
    });
    document.querySelectorAll('.cmd-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const cmd = btn.dataset.cmd;
        const pos = game._cmdPos;
        const sel = game._cmdUnits;
        const menu = document.getElementById('cmd-menu');
        menu.classList.add('hidden');
        if (!sel || !pos) return;
        executeCommand(cmd, pos, sel);
        game._cmdPos = null;
        game._cmdUnits = null;
      });
    });
    function executeCommand(cmd, pos, sel) {
      const cols = Math.ceil(Math.sqrt(sel.length));
      const sp = 32;
      sel.forEach((u, i) => {
        const c = i % cols, r = Math.floor(i / cols);
        const tx = pos.x + (c - (cols - 1) / 2) * sp;
        const ty = pos.y + (r - (cols - 1) / 2) * sp;
        u.targetX = tx;
        u.targetY = ty;
        u.targetUnit = null;
        u.mode = cmd;
        if (cmd === 'attack') u._attackDest = { x: tx, y: ty };
        if (cmd !== 'defend') {
          const path = findPath(u.x, u.y, tx, ty);
          if (path.length) { u._path = path; u._pathIdx = 0; }
          else u._path = null;
        }
      });
      addEffect('move-marker', { x: pos.x, y: pos.y, timer: 20 });
      logMessage(`[CMD] ${sel.length} units → ${cmd.toUpperCase()} at [${Math.round(pos.x)},${Math.round(pos.y)}].`);
      updateModeUI();
    }
    document.addEventListener('click', e => {
      if (!e.target.closest('#cmd-menu')) document.getElementById('cmd-menu').classList.add('hidden');
    });

    canvas.addEventListener('mousemove', e => {
      if (game.cameraDragging) {
        const sp = getMousePosScreen(e);
        const dx = sp.x - game.cameraDragStart.x;
        const dy = sp.y - game.cameraDragStart.y;
        game.camera.x = Math.max(0, Math.min(game.worldWidth - canvas.width, game.cameraDragCamStart.x - dx));
        game.camera.y = Math.max(0, Math.min(game.worldHeight - canvas.height, game.cameraDragCamStart.y - dy));
        return;
      }
      const pos = getMousePos(e);
      if (game.airstrikeDragging) { game.airstrikeLineEnd = pos; return; }
      if (game.mode === 'builder') { game.builderHoverPos = pos; if (game.isBuilding) handleBuilderAction(pos); if (game.isErasing) eraseBuilderAt(pos); }
      else { game.builderHoverPos = null; if (game.isSelecting) game.selectionEnd = pos; }
    });

    canvas.addEventListener('mouseleave', () => { game.builderHoverPos = null; game.cameraDragging = false; });

    canvas.addEventListener('mouseup', e => {
      if (game.cameraDragging) { game.cameraDragging = false; return; }
      if (game.airstrikeDragging) {
        game.airstrikeDragging = false;
        if (game.airstrikeLineStart && game.airstrikeLineEnd) triggerAirStrikeLine(game.airstrikeLineStart, game.airstrikeLineEnd);
        game.airstrikeLineStart = null; game.airstrikeLineEnd = null; return;
      }
      if (game.mode === 'builder') { game.isBuilding = false; game.isErasing = false; return; }
      if (e.button === 0 && game.isSelecting) {
        game.isSelecting = false;
        const x1 = Math.min(game.selectionStart.x, game.selectionEnd.x);
        const y1 = Math.min(game.selectionStart.y, game.selectionEnd.y);
        const x2 = Math.max(game.selectionStart.x, game.selectionEnd.x);
        const y2 = Math.max(game.selectionStart.y, game.selectionEnd.y);
        const isClick = (x2 - x1) < 8 && (y2 - y1) < 8;
        let cnt = 0;
        game.units.forEach(u => {
          if (u.team !== 'blue') return;
          if (isClick) {
            const dx = u.x - game.selectionStart.x, dy = u.y - game.selectionStart.y;
            u.isSelected = Math.sqrt(dx * dx + dy * dy) < u.radius + 8;
          } else {
            u.isSelected = (u.x >= x1 && u.x <= x2 && u.y >= y1 && u.y <= y2);
          }
          if (u.isSelected) cnt++;
        });
        const s = document.getElementById('selection-status');
        const d = document.getElementById('selection-details');
        if (cnt > 0) { s.textContent = `${cnt} SELECTED`; d.textContent = 'RMB to command.'; }
        else { s.textContent = 'NONE'; d.textContent = 'Drag to select units.'; game.pendingOrder = null; }
        updateModeUI();
      }
    });

    // ============================================================
    //  KEYBOARD
    // ============================================================
    document.addEventListener('keydown', e => {
      const k = e.key;
      // Builder shortcuts
      if (game.mode === 'builder') {
        const map = { '1': 'brush-ruins', '2': 'brush-bunker', '3': 'brush-wall', '4': 'brush-tree', '5': 'brush-eraser', '6': 'brush-spawn-inf', '7': 'brush-spawn-tank', '8': 'brush-spawn-drone', '9': 'brush-spawn-sniper', '0': 'brush-spawn-anti-tank', '-': 'brush-filled', '=': 'brush-wreck', 'u': 'brush-roof', 'o': 'brush-road', 'p': 'brush-spawn-gunner' };
        if (map[k]) { document.getElementById(map[k]).click(); e.preventDefault(); return; }
        if (k === 'r' || k === 'R') { document.getElementById('btn-rotate-ruins').click(); e.preventDefault(); return; }
        if (k === 's' || k === 'S') { document.getElementById('btn-ruin-size').click(); e.preventDefault(); return; }
        if (k === 'z' || k === 'Z') { document.getElementById('btn-builder-undo').click(); e.preventDefault(); return; }
      }
      // Sim shortcuts
      if (game.mode === 'simulation') {
        if (k === 'a' || k === 'A') { document.getElementById('btn-air-strike').click(); e.preventDefault(); }
        if (k === 'm' || k === 'M') { document.getElementById('btn-lay-mine').click(); e.preventDefault(); }
        if (k === 'b' || k === 'B') { document.getElementById('btn-artillery').click(); e.preventDefault(); }
        if (k === 'g' || k === 'G') { document.getElementById('btn-smoke').click(); e.preventDefault(); }
      }
      if (k === 'v' || k === 'V') { game.showVision = !game.showVision; e.preventDefault(); }
      if (k === 'Escape') {
        game.airstrikeMode = false; game.mineMode = false; game.smokeMode = false; game.artilleryMode = false;
        document.getElementById('target-mode-alert').classList.add('hidden');
      }
    });

    function updateModeUI() {
      const sel = game.units.filter(u => u.isSelected && u.team === 'blue');
      const canCmd = sel.length > 0;
      const mode = canCmd ? sel[0].mode || 'move' : game.pendingOrder || 'move';
      document.querySelectorAll('#unit-mode-section .mode-btn').forEach(btn => {
        const active = canCmd && btn.dataset.mode === mode;
        btn.style.opacity = canCmd ? '1' : '0.5';
        btn.style.borderColor = active ? '#3b82f6' : '#000';
        btn.style.backgroundColor = active ? '#1e3a5f' : '';
      });
    }
    document.querySelectorAll('#unit-mode-section .mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        game.pendingOrder = mode === 'move' ? null : mode;
        game.units.filter(u => u.isSelected && u.team === 'blue').forEach(u => {
          u.mode = mode;
          u.targetUnit = null;
        });
        updateModeUI(); playSound('click');
      });
    });

    // ============================================================
    //  BUILDER ACTIONS
    // ============================================================
    function eraseBuilderAt(pos) {
      const sn = snapToGrid(pos);
      let idx = game.obstacles.findIndex(o => o.x === sn.x && o.y === sn.y);
      if (idx !== -1) { const o = game.obstacles[idx]; game.builderLastAction = { type: 'erase', obs: { ...o } }; game.obstacles.splice(idx, 1); updateBuilderCount(); playSound('click'); return; }
      idx = game.spawners.findIndex(s => s.x === sn.x && s.y === sn.y);
      if (idx !== -1) { const s = game.spawners[idx]; game.builderLastAction = { type: 'erase-spawn', sp: { ...s } }; game.spawners.splice(idx, 1); playSound('click'); return; }
      idx = game.trees.findIndex(t => t.x === sn.x && t.y === sn.y);
      if (idx !== -1) { const t = game.trees[idx]; game.builderLastAction = { type: 'erase-tree', tr: { ...t } }; game.trees.splice(idx, 1); playSound('click'); return; }
    }

    function handleBuilderAction(pos) {
      const sn = snapToGrid(pos);
      const G = GRID;
      if (game.activeBrush === 'eraser') { eraseBuilderAt(pos); return; }
      if (game.activeBrush === 'tree') {
        if (!game.trees.find(t => t.x === sn.x && t.y === sn.y)) { game.trees.push({ x: sn.x, y: sn.y }); game.builderLastAction = { type: 'place-tree', tr: { x: sn.x, y: sn.y } }; playSound('click'); }
        return;
      }
      if (game.activeBrush.startsWith('spawn-')) {
        const st = game.activeBrush.replace('spawn-', '');
        if (!game.spawners.find(s => s.x === sn.x && s.y === sn.y)) { game.spawners.push({ x: sn.x, y: sn.y, type: st }); game.builderLastAction = { type: 'place-spawn', sp: { x: sn.x, y: sn.y, type: st } }; playSound('click'); }
        return;
      }
      if (!game.obstacles.find(o => o.x === sn.x && o.y === sn.y)) {
        let obs;
        if (game.activeBrush === 'conblock' || game.activeBrush === 'filled') {
          const w = game.ruinsOrientation === 'horizontal' ? G * game.ruinSize : G;
          const h = game.ruinsOrientation === 'horizontal' ? G : G * game.ruinSize;
          obs = { x: sn.x, y: sn.y, w, h, type: game.activeBrush };
          if (game.activeBrush === 'conblock') obs.color = game.conblockColor;
        } else if (game.activeBrush === 'wreck') {
          obs = { x: sn.x, y: sn.y, w: G, h: G, type: 'wreck', rot: game.wreckRotation };
        } else if (game.activeBrush === 'bunker') {
          obs = { x: sn.x, y: sn.y, w: G, h: G, type: 'bunker' };
        } else if (game.activeBrush === 'wall') {
          obs = { x: sn.x, y: sn.y, w: G, h: G, type: 'wall' };
        } else if (game.activeBrush === 'roof') {
          const w = game.ruinsOrientation === 'horizontal' ? G * game.ruinSize : G;
          const h = game.ruinsOrientation === 'horizontal' ? G : G * game.ruinSize;
          obs = { x: sn.x, y: sn.y, w, h, type: 'roof' };
        } else if (game.activeBrush === 'road') {
          const w = game.ruinsOrientation === 'horizontal' ? G * game.ruinSize : G;
          const h = game.ruinsOrientation === 'horizontal' ? G : G * game.ruinSize;
          obs = { x: sn.x, y: sn.y, w, h, type: 'road' };
        } else if (game.activeBrush === 'beacon') {
          obs = { x: sn.x, y: sn.y, w: G, h: G, type: 'beacon' };
        }
        if (obs) { game.obstacles.push(obs); game.builderLastAction = { type: 'place', obs: { ...obs } }; playSound('click'); updateBuilderCount(); }
      }
    }

    function updateBuilderCount() { document.getElementById('builder-obs-count').textContent = game.obstacles.length; }

    // Passive credit income
    setInterval(() => {
      if (game.mode === 'simulation' && !game.gameOver) { game.credits += 8; updateTeamUiCounts(); }
    }, 3000);

    // ============================================================
    //  SIDEBAR BUTTON BINDINGS
    // ============================================================
    function buyUnit(type) {
      const cost = REINFORCE_COSTS[type];
      if (game.credits < cost) { logMessage(`<span style="color:#ef4444">[ERROR] Need ${cost}c (have ${game.credits}c)</span>`); return; }
      game.credits -= cost;
      const u = spawnUnit('blue', type, 70 + Math.random() * 70, 150 + Math.random() * (game.worldHeight - 300));
      updateTeamUiCounts();
      playSound('deploy');
      logMessage(`[REINFORCE] ${type.toUpperCase()} deployed. ${game.credits}c remaining.`);
    }

    document.getElementById('btn-menu-play').addEventListener('click', () => setScreenMode('level-select'));
    document.getElementById('btn-level-back').addEventListener('click', () => setScreenMode('home'));
    document.getElementById('btn-menu-builder').addEventListener('click', () => setScreenMode('builder'));
    document.getElementById('btn-menu-custom-levels').addEventListener('click', () => setScreenMode('custom-levels'));
    document.getElementById('btn-builder-back').addEventListener('click', () => setScreenMode('home'));
    document.getElementById('btn-switch-to-builder').addEventListener('click', () => setScreenMode('builder'));
    document.getElementById('btn-builder-test').addEventListener('click', () => {
      game.builderTestMapState = cloneMapStateFromCurrent();
      game.currentLevelId = 0;
      game.currentCustomLevelId = null;
      game.activeLevelKind = 'builder-test';
      game.activeLevelName = 'Builder Test';
      game.activeLevelDescription = 'Your editor map.';
      game.activeLevelBudget = game.builderBudget;
      game.activeLevelWaves = 3;
      game.activeLevelFile = '';
      game.activeLevelData = '';
      setScreenMode('simulation');
    });
    document.getElementById('btn-custom-levels-back').addEventListener('click', () => setScreenMode('home'));
    document.getElementById('btn-custom-levels-upload').addEventListener('click', () => document.getElementById('custom-level-file-input').click());

    document.getElementById('btn-spawn-infantry').addEventListener('click', () => { if (game.mode === 'simulation') buyUnit('infantry'); });
    document.getElementById('btn-spawn-tank').addEventListener('click', () => { if (game.mode === 'simulation') buyUnit('tank'); });
    document.getElementById('btn-spawn-drone').addEventListener('click', () => { if (game.mode === 'simulation') buyUnit('drone'); });
    document.getElementById('btn-spawn-sniper').addEventListener('click', () => { if (game.mode === 'simulation') buyUnit('sniper'); });
    document.getElementById('btn-spawn-apc').addEventListener('click', () => { if (game.mode === 'simulation') buyUnit('apc'); });
    document.getElementById('btn-spawn-anti-tank').addEventListener('click', () => { if (game.mode === 'simulation') buyUnit('anti-tank'); });
    document.getElementById('btn-spawn-commander').addEventListener('click', () => { if (game.mode === 'simulation') buyUnit('commander'); });

    document.getElementById('btn-air-strike').addEventListener('click', () => {
      if (game.mode !== 'simulation') return;
      if (game.credits < 400) { logMessage('<span style="color:#ef4444">[ERROR] Need 400c for airstrike.</span>'); return; }
      game.airstrikeMode = true;
      document.getElementById('target-mode-text').textContent = 'DRAG LINE FOR AIRSTRIKE — ESC to cancel';
      document.getElementById('target-mode-alert').classList.remove('hidden');
      logMessage('[TACTICAL] Drag a line to designate bombing corridor.');
    });

    document.getElementById('btn-lay-mine').addEventListener('click', () => {
      if (game.mode !== 'simulation') return;
      if (game.credits < 75) { logMessage('<span style="color:#ef4444">[ERROR] Need 75c for mine.</span>'); return; }
      game.mineMode = true;
      document.getElementById('target-mode-text').textContent = 'CLICK TO PLACE MINE — ESC to cancel';
      document.getElementById('target-mode-alert').classList.remove('hidden');
    });

    document.getElementById('btn-artillery').addEventListener('click', () => {
      if (game.mode !== 'simulation') return;
      if (game.credits < 200) { logMessage('<span style="color:#ef4444">[ERROR] Need 200c for barrage.</span>'); return; }
      game.artilleryMode = true;
      document.getElementById('target-mode-text').textContent = 'CLICK TARGET FOR BARRAGE — ESC to cancel';
      document.getElementById('target-mode-alert').classList.remove('hidden');
    });

    document.getElementById('btn-smoke').addEventListener('click', () => {
      if (game.mode !== 'simulation') return;
      if (game.credits < 50) { logMessage('<span style="color:#ef4444">[ERROR] Need 50c for smoke.</span>'); return; }
      game.smokeMode = true;
      document.getElementById('target-mode-text').textContent = 'CLICK TO DEPLOY SMOKE — ESC to cancel';
      document.getElementById('target-mode-alert').classList.remove('hidden');
    });

    // ============================================================
    //  DEPLOYMENT SCREEN
    // ============================================================
    document.querySelectorAll('.deploy-plus').forEach(btn => {
      btn.addEventListener('click', () => {
        const row = btn.closest('.deploy-row'), type = row.dataset.type, cost = parseInt(row.dataset.cost);
        let spent = 0;
        for (const [t, q] of Object.entries(game.armySelection)) spent += q * UNIT_COSTS[t];
        if (game.deployBudget - spent >= cost) { game.armySelection[type]++; playSound('click'); updateDeployUI(); }
      });
    });
    document.querySelectorAll('.deploy-minus').forEach(btn => {
      btn.addEventListener('click', () => {
        const row = btn.closest('.deploy-row'), type = row.dataset.type;
        if (game.armySelection[type] > 0) { game.armySelection[type]--; playSound('click'); updateDeployUI(); }
      });
    });
    document.getElementById('btn-deploy-back').addEventListener('click', () => setScreenMode('home'));
    document.getElementById('btn-deploy-launch').addEventListener('click', () => {
      const total = Object.values(game.armySelection).reduce((a, b) => a + b, 0);
      if (!total) return;
      setScreenMode('simulation');
    });

    // ============================================================
    //  BUILDER CONTROLS
    // ============================================================
    const brushMap = {
      'brush-ruins': 'conblock', 'brush-bunker': 'bunker', 'brush-wall': 'wall',
      'brush-tree': 'tree', 'brush-eraser': 'eraser', 'brush-filled': 'filled', 'brush-wreck': 'wreck',
      'brush-spawn-inf': 'spawn-infantry', 'brush-spawn-tank': 'spawn-tank', 'brush-spawn-drone': 'spawn-drone',
      'brush-spawn-sniper': 'spawn-sniper', 'brush-spawn-anti-tank': 'spawn-anti-tank', 'brush-spawn-gunner': 'spawn-gunner',
      'brush-road': 'road', 'brush-roof': 'roof', 'brush-beacon': 'beacon'
    };
    Object.entries(brushMap).forEach(([id, brush]) => {
      document.getElementById(id)?.addEventListener('click', () => {
        document.querySelectorAll('[id^="brush-"]').forEach(b => { b.style.borderColor = ''; });
        document.getElementById(id).style.borderColor = '#3b82f6';
        game.activeBrush = brush; playSound('click'); updateRuinLabel();
      });
    });

    document.getElementById('btn-rotate-ruins').addEventListener('click', e => {
      e.stopPropagation();
      if (game.activeBrush === 'wreck') {
        game.wreckRotation = (game.wreckRotation + 1) % 4;
        updateRuinLabel(); playSound('click');
      } else {
        game.ruinsOrientation = game.ruinsOrientation === 'horizontal' ? 'vertical' : 'horizontal';
        updateRuinLabel(); playSound('click');
      }
    });
    document.getElementById('btn-ruin-size').addEventListener('click', e => {
      e.stopPropagation();
      game.ruinSize = game.ruinSize >= 4 ? 1 : game.ruinSize + 1;
      updateRuinLabel(); playSound('click');
    });
    document.getElementById('btn-roof-size')?.addEventListener('click', e => {
      e.stopPropagation();
      game.ruinSize = game.ruinSize >= 4 ? 1 : game.ruinSize + 1;
      updateRuinLabel(); playSound('click');
    });
    document.getElementById('btn-rotate-roof')?.addEventListener('click', e => {
      e.stopPropagation();
      game.ruinsOrientation = game.ruinsOrientation === 'horizontal' ? 'vertical' : 'horizontal';
      updateRuinLabel(); playSound('click');
    });
    document.getElementById('btn-road-size')?.addEventListener('click', e => {
      e.stopPropagation();
      game.ruinSize = game.ruinSize >= 4 ? 1 : game.ruinSize + 1;
      updateRuinLabel(); playSound('click');
    });
    document.getElementById('btn-rotate-road')?.addEventListener('click', e => {
      e.stopPropagation();
      game.ruinsOrientation = game.ruinsOrientation === 'horizontal' ? 'vertical' : 'horizontal';
      updateRuinLabel(); playSound('click');
    });
    function updateRuinLabel() {
      document.getElementById('ruins-size-label').textContent = '';
      document.getElementById('roof-size-label').textContent = '';
      document.getElementById('road-size-label').textContent = '';
      if (game.activeBrush === 'wreck') {
        const dirs = ['→', '↓', '←', '↑'];
        document.getElementById('wreck-rot-label').textContent = dirs[game.wreckRotation];
      } else if (game.activeBrush === 'roof' || game.activeBrush === 'road' || game.activeBrush === 'conblock' || game.activeBrush === 'filled') {
        const w = game.ruinsOrientation === 'horizontal' ? game.ruinSize : 1;
        const h = game.ruinsOrientation === 'horizontal' ? 1 : game.ruinSize;
        const label = `${w}×${h}`;
        if (game.activeBrush === 'roof') document.getElementById('roof-size-label').textContent = label;
        else if (game.activeBrush === 'road') document.getElementById('road-size-label').textContent = label;
        else if (game.activeBrush === 'conblock' || game.activeBrush === 'filled') document.getElementById('ruins-size-label').textContent = label;
      }
    }

    document.getElementById('btn-builder-undo').addEventListener('click', () => {
      const a = game.builderLastAction;
      if (!a) return;
      if (a.type === 'place') { const i = game.obstacles.findIndex(o => o.x === a.obs.x && o.y === a.obs.y); if (i !== -1) game.obstacles.splice(i, 1); }
      else if (a.type === 'erase') { game.obstacles.push(a.obs); }
      else if (a.type === 'place-spawn') { const i = game.spawners.findIndex(s => s.x === a.sp.x && s.y === a.sp.y); if (i !== -1) game.spawners.splice(i, 1); }
      else if (a.type === 'erase-spawn') { game.spawners.push(a.sp); }
      else if (a.type === 'place-tree') { const i = game.trees.findIndex(t => t.x === a.tr.x && t.y === a.tr.y); if (i !== -1) game.trees.splice(i, 1); }
      else if (a.type === 'erase-tree') { game.trees.push(a.tr); }
      game.builderLastAction = null; updateBuilderCount(); playSound('click');
    });

    document.getElementById('btn-builder-clear').addEventListener('click', () => { game.obstacles = []; game.trees = []; game.spawners = []; game.builderLastAction = null; updateBuilderCount(); playSound('explosion'); });

    // Background presets
    const BG_PRESETS = {
      'bg-grass': '#2d5a27',
      'bg-stone': '#4a4a4a',
      'bg-deadgrass': '#5c4a3a',
      'bg-dark': '#18181b',
    };
    function setBgColor(hex) {
      game.bgColor = hex;
      const picker = document.getElementById('bg-custom');
      if (picker) picker.value = hex;
    }
    function updateBgUI() {
      const picker = document.getElementById('bg-custom');
      if (picker) picker.value = game.bgColor || '#18181b';
      const cp = document.getElementById('conblock-color');
      if (cp) cp.value = game.conblockColor || '#3f3f46';
    }
    Object.entries(BG_PRESETS).forEach(([id, hex]) => {
      document.getElementById(id).addEventListener('click', () => { setBgColor(hex); playSound('click'); });
    });
    document.getElementById('bg-custom').addEventListener('input', e => {
      game.bgColor = e.target.value;
    });
    document.getElementById('conblock-color').addEventListener('input', e => {
      game.conblockColor = e.target.value;
    });

    document.getElementById('btn-toggle-vignette')?.addEventListener('click', () => {
      document.querySelector('main').classList.toggle('vignette');
      const btn = document.getElementById('btn-toggle-vignette');
      const hasV = document.querySelector('main').classList.contains('vignette');
      btn.style.background = hasV ? '#3b82f6' : '#18181b';
      btn.style.color = hasV ? '#fff' : '#71717a';
    });

    function computeWorldBounds() {
      // No-op for now; world bounds already stored in game.worldWidth/Height
    }

    function updateMapSizeUI() {
      document.getElementById('map-width').value = game.worldWidth / GRID;
      document.getElementById('map-height').value = game.worldHeight / GRID;
    }
    document.getElementById('btn-resize-map')?.addEventListener('click', () => {
      const w = (parseInt(document.getElementById('map-width').value) || 50) * GRID;
      const h = (parseInt(document.getElementById('map-height').value) || 37) * GRID;
      game.worldWidth = Math.max(10 * GRID, w);
      game.worldHeight = Math.max(8 * GRID, h);
      computeWorldBounds();
      logMessage(`[BUILDER] Map resized to ${game.worldWidth}×${game.worldHeight} (${game.worldWidth/GRID}×${game.worldHeight/GRID} blocks).`);
    });
    document.getElementById('builder-budget')?.addEventListener('input', e => {
      game.builderBudget = parseInt(e.target.value) || 1000;
    });

    function exportGTM() {
      const mapName = (prompt('Map name?', 'Untitled Map') || '').trim();
      if (!mapName) return;
      const mapDescription = (prompt('Map description?', 'A custom battlefield.') || '').trim();
      const exportWaves = 3;

      let d = 'GTMv2\n';
      d += `name: ${mapName}\n`;
      d += `description: ${mapDescription || 'A custom battlefield.'}\n`;
      d += `budget: ${game.builderBudget}\n`;
      d += `waves: ${exportWaves}\n`;
      d += `bg: ${game.bgColor}\n`;
      game.obstacles.forEach(o => {
        d += `${o.type} ${o.x} ${o.y} ${o.w} ${o.h}`;
        if (o.color && o.color !== '#3f3f46') d += ` ${o.color}`;
        d += '\n';
      });
      game.spawners.forEach(s => d += `spawn ${s.x} ${s.y} ${s.type}\n`);
      game.trees.forEach(t => d += `tree ${t.x} ${t.y}\n`);
      const b = new Blob([d], { type: 'text/plain' });
      const u = URL.createObjectURL(b);
      const safeName = mapName.replace(/[^a-z0-9_ -]/gi, '').trim().replace(/\s+/g, '_') || 'map';
      const a = document.createElement('a'); a.href = u; a.download = safeName + '.gtm'; a.click(); URL.revokeObjectURL(u);
      logMessage(`[BUILDER] Exported (${game.obstacles.length} obs, ${game.trees.length} trees, ${game.spawners.length} spawners).`);
    }
    function importGTM(txt) {
      const lines = txt.trim().split('\n');
      if (!lines[0]?.startsWith('GTM')) { logMessage('<span style="color:red">[ERROR] Invalid .GTM file.</span>'); return; }
      game.obstacles = []; game.spawners = []; game.trees = [];
      game.bgColor = '#18181b';
      for (let i = 1; i < lines.length; i++) {
        const p = lines[i].trim().split(/\s+/);
        if (!p.length || !p[0]) continue;
        const lower = p[0].toLowerCase();
        if (lower === 'bg:' && p[1]) { game.bgColor = p[1]; updateBgUI(); continue; }
        if (lower === 'budget:' && p[1]) { game.builderBudget = parseInt(p[1]) || 1000; document.getElementById('builder-budget').value = game.builderBudget; continue; }
        if (p[0] === 'spawn' && p.length >= 4) game.spawners.push({ x: +p[1], y: +p[2], type: p[3] });
        else if (p[0] === 'tree' && p.length >= 3) game.trees.push({ x: +p[1], y: +p[2] });
        else if (p.length >= 5) {
          let type = p[0];
          if (type === 'ruins') type = 'conblock';
          const obs = { type, x: +p[1], y: +p[2], w: +p[3], h: +p[4] };
          if (p[5] && /^#[0-9a-f]{6}$/i.test(p[5])) obs.color = p[5];
          game.obstacles.push(obs);
        }
      }
      game.builderLastAction = null; updateBuilderCount();
      logMessage(`[BUILDER] Imported (${game.obstacles.length} obs, ${game.trees.length} trees, ${game.spawners.length} spawners).`);
    }
    document.getElementById('btn-builder-export').addEventListener('click', exportGTM);
    document.getElementById('btn-builder-import').addEventListener('click', () => document.getElementById('gtm-file-input').click());
    document.getElementById('custom-level-file-input').addEventListener('change', e => {
      const f = e.target.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = ev => {
        const txt = String(ev.target.result || '');
        if (!txt.trim().startsWith('GTM')) {
          logMessage('<span style="color:#ef4444">[ERROR] Invalid custom level file.</span>');
          return;
        }
        const fallbackName = f.name.replace(/\.[^.]+$/, '') || 'Untitled Custom Level';
        const meta = extractLevelMetadata(txt, fallbackName, 'Imported custom level.');
        const record = normalizeCustomLevelRecord({
          id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: meta.name,
          description: meta.description,
          budget: meta.budget,
          waves: meta.waves,
          data: txt,
          fileName: f.name,
          createdAt: Date.now(),
        });
        game.customLevels.unshift(record);
        saveCustomLevelsToStorage();
        renderCustomLevels();
        logMessage(`[CUSTOM] Imported ${record.name}.`);
      };
      r.readAsText(f);
      e.target.value = '';
    });
    document.getElementById('gtm-file-input').addEventListener('change', e => {
      const f = e.target.files[0]; if (!f) return;
      const r = new FileReader(); r.onload = ev => importGTM(ev.target.result); r.readAsText(f); e.target.value = '';
    });

    // ============================================================
    //  TOOLTIP
    // ============================================================
    const tooltip = document.getElementById('tooltip');
    document.querySelectorAll('[data-tip]').forEach(el => {
      el.addEventListener('mouseenter', e => { tooltip.textContent = el.dataset.tip; tooltip.style.display = 'block'; });
      el.addEventListener('mousemove', e => { tooltip.style.left = (e.clientX + 12) + 'px'; tooltip.style.top = (e.clientY + 12) + 'px'; });
      el.addEventListener('mouseleave', () => { tooltip.style.display = 'none'; });
    });

    // ============================================================
    //  GAME UPDATE LOOP
    // ============================================================
    function update() {
      if (game.mode !== 'simulation' && game.mode !== 'builder') return;

      // Camera panning
      const pan = 12;
      if (game.keys['arrowup'] || game.keys['arrowdown'] || game.keys['arrowleft'] || game.keys['arrowright']) {
        if (game.keys['arrowup']) game.camera.y = Math.max(0, game.camera.y - pan);
        if (game.keys['arrowdown']) game.camera.y = Math.min(game.worldHeight - canvas.height, game.camera.y + pan);
        if (game.keys['arrowleft']) game.camera.x = Math.max(0, game.camera.x - pan);
        if (game.keys['arrowright']) game.camera.x = Math.min(game.worldWidth - canvas.width, game.camera.x + pan);
      }

      if (game.mode !== 'simulation') return;

      // Smoke screen tick
      for (let i = game.smokeScreens.length - 1; i >= 0; i--) {
        game.smokeScreens[i].timer--;
        if (game.smokeScreens[i].timer <= 0) game.smokeScreens.splice(i, 1);
      }

      // Unit updates
      game.units.forEach(u => u.update());

      // --- TACTICAL TRACKING ---
      // Reset focus & flank tracking each frame
      game.focusTracker = {};
      game.flankTracker = {};

      // Build focus tracker: count blue units targeting each red unit
      game.units.forEach(u => {
        if (u.team === 'blue' && u.targetUnit && u.targetUnit.team === 'red' && u.targetUnit.hp > 0) {
          const targetId = u.targetUnit.id;
          game.focusTracker[targetId] = (game.focusTracker[targetId] || 0) + 1;
        }

        // Suppression decay for red units
        if (u.team === 'red') {
          if (u.suppression > 0) u.suppression = Math.max(0, u.suppression - 0.3);
          if (u.suppressionTimer > 0) u.suppressionTimer--;
        }

        // Isolation check for red units (far from allies)
        if (u.team === 'red') {
          let closeAlly = false;
          for (const other of game.units) {
            if (other === u || other.team !== 'red' || other.hp <= 0) continue;
            const idx = other.x - u.x, idy = other.y - u.y;
            if (idx * idx + idy * idy < 320 * 320) { closeAlly = true; break; }
          }
          u.isIsolated = !closeAlly;
        }
      });

      // Flank detection: for each red unit attacked by 2+ blues on opposite sides
      for (const redUnit of game.units) {
        if (redUnit.team !== 'red' || redUnit.hp <= 0) continue;
        const attackers = game.units.filter(u => u.team === 'blue' && u.targetUnit === redUnit && u.hp > 0);
        if (attackers.length >= 2) {
          // Check if any two attackers are more than 120 degrees apart
          let maxAngleDiff = 0;
          for (let i = 0; i < attackers.length; i++) {
            for (let j = i + 1; j < attackers.length; j++) {
              const a1 = Math.atan2(attackers[i].y - redUnit.y, attackers[i].x - redUnit.x);
              const a2 = Math.atan2(attackers[j].y - redUnit.y, attackers[j].x - redUnit.x);
              let diff = Math.abs(a1 - a2);
              if (diff > Math.PI) diff = Math.PI * 2 - diff;
              if (diff > maxAngleDiff) maxAngleDiff = diff;
            }
          }
          if (maxAngleDiff > Math.PI * 0.6) {
            game.flankTracker[redUnit.id] = (game.flankTracker[redUnit.id] || 0) + 1;
          }
        }
      }

      // Tempo / momentum tracking
      if (game.tempoTimer > 0) game.tempoTimer--;
      else game.tempoKills = 0;

      // Apply tempo bonus to blue units' fire rate
      if (game.tempoKills > 0) {
        const tempoBonus = Math.min(game.tempoKills * 0.08, 0.3);
        game.units.forEach(u => {
          if (u.team === 'blue' && u.cdMax) {
            u._effectiveCdReduction = tempoBonus;
          }
        });
      }

      // Death processing
      const dead = [];
      game.units = game.units.filter(u => {
        if (u.hp > 0) return true;
        dead.push(u);
        // Crater + explosion FX
        addEffect('crater', { x: u.x, y: u.y, radius: u.radius * 1.3, opacity: 1, timer: 500 });
        addEffect('blast-flash', { x: u.x, y: u.y, maxRadius: u.radius * 2.5, radius: 4, timer: 16 });
        for (let i = 0; i < 7; i++) addEffect('debris', { x: u.x, y: u.y, vx: (Math.random() - .5) * 8, vy: (Math.random() - .5) * 8, size: 2 + Math.random() * 4, timer: 20 + Math.random() * 15 });
        for (let i = 0; i < 3; i++) addEffect('smoke', { x: u.x + (Math.random() - .5) * 10, y: u.y + (Math.random() - .5) * 10, vy: -.35 - Math.random() * .4, vx: (Math.random() - .5) * .2, radius: 4 + Math.random() * 5, maxRadius: 14 + Math.random() * 10, timer: 70 + Math.random() * 35 });
        game.shakeTimer = 12; playSound('explosion');
        if (u.team === 'red') {
          game.credits += 75; game.kills++; game.tempoKills++;
          game.tempoTimer = 240; // 4 seconds at 60fps
          addFloatingText(u.x, u.y - 30, '+75c', '#eab308');
          if (game.tempoKills >= 3) {
            addFloatingText(u.x, u.y - 48, `MOMENTUM x${game.tempoKills}`, '#60a5fa');
          }
        }
        return false;
      });
      if (dead.length) updateTeamUiCounts();

      // Projectile physics
      game.projectiles.forEach(p => {
        p.x += p.vx * p.speed; p.y += p.vy * p.speed;
        // Wall collision
        for (const o of game.obstacles) {
          if (isWalkableObs(o)) continue;
          if (p.x >= o.x && p.x <= o.x + o.w && p.y >= o.y && p.y <= o.y + o.h) {
            p.toRemove = true;
            for (let i = 0; i < 3; i++) addEffect('spark', { x: p.x, y: p.y, vx: (Math.random() - .5) * 3, vy: (Math.random() - .5) * 3, timer: 10 });
            break;
          }
        }
        // Unit hit with tactical damage calculations
        for (const u of game.units) {
          if (u.team === p.team) continue;
          const dx = u.x - p.x, dy = u.y - p.y;
          if (dx * dx + dy * dy < (u.radius + 4) * (u.radius + 4)) {
            let dmg = p.damage;
            const attacker = p.sourceUnit;

            if (attacker && u.team === 'red') {
              // --- FOCUS FIRE BONUS ---
              // More blue units targeting the same enemy = extra damage per attacker
              const focusCount = game.focusTracker[u.id] || 1;
              if (focusCount > 1) {
                const focusBonus = 1 + (focusCount - 1) * 0.18;
                dmg = Math.round(dmg * focusBonus);
              }

              // --- FLANKING BONUS ---
              // If attackers on opposite sides, defender can't defend both
              const attackerAngle = Math.atan2(attacker.y - u.y, attacker.x - u.x);
              const flankCount = (game.flankTracker && game.flankTracker[u.id]) || 0;
              if (flankCount >= 1) {
                dmg = Math.round(dmg * 1.35);
                addFloatingText(u.x, u.y - u.radius - 36, 'FLANKED!', '#fbbf24');
              }

              // --- REAR DAMAGE ---
              // Hitting from behind the target's facing direction
              let diff = attackerAngle - u.angle;
              while (diff > Math.PI) diff -= Math.PI * 2;
              while (diff < -Math.PI) diff += Math.PI * 2;
              if (Math.abs(diff) > Math.PI * 0.6) {
                dmg = Math.round(dmg * 1.4);
                addFloatingText(u.x, u.y - u.radius - 24, 'REAR HIT', '#facc15');
              }

              // --- SURPRISE BONUS ---
              // First attack from outside vision cone
              if (u.surprised) {
                const relAngle = Math.atan2(attacker.y - u.y, attacker.x - u.x);
                let diff2 = relAngle - u.angle;
                while (diff2 > Math.PI) diff2 -= Math.PI * 2;
                while (diff2 < -Math.PI) diff2 += Math.PI * 2;
                if (Math.abs(diff2) > Math.PI / 2.2) {
                  dmg = Math.round(dmg * 1.5);
                  addFloatingText(u.x, u.y - u.radius - 48, 'AMBUSH!', '#ef4444');
                }
                u.surprised = false;
              }

              // --- ANTI-TANK SPECIALIZATION ---
              // Devastating vs armor, poor vs soft targets
              if (attacker && attacker.type === 'anti-tank') {
                if (u.type !== 'tank' && u.type !== 'apc') {
                  dmg = 25;
                }
              }

              // --- ISOLATION PENALTY ---
              // Isolated enemies take extra damage
              if (u.isIsolated) {
                dmg = Math.round(dmg * 1.25);
                addFloatingText(u.x, u.y - u.radius - 36, 'ISOLATED', '#a78bfa');
              }

              // Apply suppression on hit
              u.suppression = Math.min(100, u.suppression + 20);
              u.suppressionTimer = 120;
            }

            u.hp -= dmg; p.toRemove = true;
            addFloatingText(u.x, u.y - u.radius - 14, `-${dmg}`, u.team === 'red' ? '#ef4444' : '#f97316');
            alertEnemyOnHit(u, p.sourceUnit || { team: p.team, x: p.x, y: p.y });
            for (let i = 0; i < 4; i++) addEffect('spark', { x: p.x, y: p.y, vx: (Math.random() - .5) * 4, vy: (Math.random() - .5) * 4, timer: 12 });
            break;
          }
        }
        if (p.x < -20 || p.x > canvas.width + 20 || p.y < -20 || p.y > canvas.height + 20) p.toRemove = true;
      });
      game.projectiles = game.projectiles.filter(p => !p.toRemove);

      // Effects tick
      game.effects.forEach(f => {
        if (f.timer !== undefined) f.timer--;
        if (f.type === 'spark') { f.x += f.vx; f.y += f.vy; f.vy += 0.15; }
        else if (f.type === 'smoke') { f.x += f.vx || 0; f.y += f.vy || 0; f.radius += (f.maxRadius - f.radius) * 0.025; }
        else if (f.type === 'a10') {
          const dx = f.targetX - f.x, dy = f.targetY - f.y, d = Math.sqrt(dx * dx + dy * dy);
          if (d > 8) {
            f.x += dx / d * f.speed;
            f.y += dy / d * f.speed;
            f.angle = Math.atan2(dy, dx);
          } else f.timer = 0;
        }
        else if (f.type === 'debris') { f.x += f.vx; f.y += f.vy; f.vy += 0.2; f.vx *= 0.97; }
      });
      game.effects = game.effects.filter(f => f.timer === undefined || f.timer > 0);

      // Airstrike bomb drops
      if (game.airStriking && game.airstrikePoints) {
        game.airstrikeTimer++;
        if (game.airstrikeTimer % 14 === 0 && game.airstrikeBombCount > 0) {
          const idx = game.airstrikePoints.length - game.airstrikeBombCount;
          const pt = game.airstrikePoints[idx];
          const bx = pt.x + (Math.random() - .5) * 14, by = pt.y + (Math.random() - .5) * 14;
          addEffect('blast-flash', { x: bx, y: by, maxRadius: 55, radius: 5, timer: 20 });
          addEffect('crater', { x: bx, y: by, radius: 30, opacity: 1, timer: 700 });
          game.shakeTimer = 14; playSound('explosion');
          game.units.forEach(u => {
            const dx = u.x - bx, dy = u.y - by, d = Math.sqrt(dx * dx + dy * dy);
            if (d < 65) { const dmg = Math.round(260 * (1 - d / 65)); u.hp -= dmg; addFloatingText(u.x, u.y - 18, `-${dmg}`, '#ef4444'); alertEnemyOnHit(u, { team: 'blue', x: bx, y: by }); }
          });
          game.airstrikeBombCount--;
          if (!game.airstrikeBombCount) game.airStriking = false;
        }
      }
      if (game.airstrikeLaserTimer > 0) game.airstrikeLaserTimer--;

      // Commander strafing run
      if (game.commanderStrike && game.commanderStrike.idx < game.commanderStrike.points.length) {
        game.commanderStrike.timer++;
        if (game.commanderStrike.timer % 3 === 0) {
          const pt = game.commanderStrike.points[game.commanderStrike.idx];
          game.commanderStrike.idx++;
          game.units.forEach(u => {
            if (u.team === 'red') {
              const d = Math.sqrt((u.x - pt.x) ** 2 + (u.y - pt.y) ** 2);
              if (d < 35) {
                const dmg = Math.round(35 * (1 - d / 35));
                u.hp -= dmg;
                addFloatingText(u.x, u.y - 14, `-${dmg}`, '#ef4444');
                alertEnemyOnHit(u, { team: 'blue', x: pt.x, y: pt.y });
              }
            }
          });
          for (let i = 0; i < 3; i++) addEffect('spark', { x: pt.x + (Math.random() - .5) * 6, y: pt.y + (Math.random() - .5) * 6, vx: (Math.random() - .5) * 2, vy: (Math.random() - .5) * 2, timer: 6 });
          addEffect('muzzle-flash', { x: pt.x, y: pt.y, timer: 4, team: 'blue' });
        }
      }

      // Mine detonation
      for (let i = game.mines.length - 1; i >= 0; i--) {
        const mine = game.mines[i];
        for (const u of game.units) {
          if (u.team === 'blue') continue;
          const dx = u.x - mine.x, dy = u.y - mine.y;
          if (dx * dx + dy * dy < 14 * 14) {
            addEffect('blast-flash', { x: mine.x, y: mine.y, maxRadius: 45, radius: 4, timer: 20 });
            game.shakeTimer = 12; playSound('explosion');
            game.units.forEach(t => { if (t.team !== 'blue') { const td = Math.sqrt((t.x - mine.x) ** 2 + (t.y - mine.y) ** 2); if (td < 55) { const dmg = Math.round(130 * (1 - td / 55)); t.hp -= dmg; addFloatingText(t.x, t.y - 14, `-${dmg}`, '#ef4444'); alertEnemyOnHit(t, { team: 'blue', x: mine.x, y: mine.y }); } } });
            game.mines.splice(i, 1); break;
          }
        }
      }

      // Shake decay
      if (game.shakeTimer > 0) game.shakeTimer--;

      // Floating texts
      game.floatingTexts.forEach(ft => { ft.y += ft.vy; ft.timer--; });
      game.floatingTexts = game.floatingTexts.filter(ft => ft.timer > 0);

      // Game over check
      if (!game.gameOver) {
        const b = game.units.filter(u => u.team === 'blue').length;
        const r = game.units.filter(u => u.team === 'red').length;
        const beacon = game.obstacles.find(o => o.type === 'beacon');

        // Defeat if all blues are dead
        if (b === 0 && game.units.length >= 0 && dead.some(u => u.team === 'blue')) {
          game.gameOver = 'defeat';
          logMessage('<span style="color:#ef4444;font-weight:bold">[DEFEAT] All friendly forces lost.</span>');
          showGameOver('defeat');
        }

        function unlockNextLevel() {
          const level = LEVELS.find(l => l.id === game.currentLevelId);
          if (level && game.currentLevelId < LEVELS.length) {
            const nextId = game.currentLevelId + 1;
            if (nextId > game.unlockedLevelId) {
              game.unlockedLevelId = nextId;
              localStorage.setItem('gault_campaign_progress', nextId.toString());
            }
          }
        }

        if (beacon) {
          // Capture the beacon mode
          const onBeacon = game.units.some(u => u.team === 'blue' && u.hp > 0 && u.x >= beacon.x && u.x <= beacon.x + beacon.w && u.y >= beacon.y && u.y <= beacon.y + beacon.h);
          if (onBeacon && b > 0) {
            game.gameOver = 'victory';
            logMessage('<span style="color:#22c55e;font-weight:bold">[VICTORY] Beacon captured! Sector secured.</span>');
            unlockNextLevel();
            showGameOver('victory');
          }
        } else {
          // Kill all enemies mode
          if (r === 0 && game.units.filter(u => u.team === 'blue').length > 0) {
            game.gameOver = 'victory';
            logMessage('<span style="color:#22c55e;font-weight:bold">[VICTORY] Sector secured. All hostiles eliminated.</span>');
            unlockNextLevel();
            showGameOver('victory');
          }
        }
      }
    }

    // ============================================================
    //  DRAW
    // ============================================================
    function draw() {
      ctx.save();
      if (game.shakeTimer > 0) {
        const i = (game.shakeTimer / 12) * 5;
        ctx.translate((Math.random() - .5) * i * 2, (Math.random() - .5) * i * 2);
      }

      // Background + grid
      ctx.fillStyle = game.bgColor || '#18181b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // Brighten grid lines on dark backgrounds, dim on light
      const isLight = (game.bgColor || '#18181b').slice(1).match(/../g).reduce((a, c) => a + parseInt(c, 16), 0) > 400;
      ctx.strokeStyle = isLight ? 'rgba(0,0,0,0.15)' : 'rgba(39,39,42,0.8)'; ctx.lineWidth = 1;
      const gx0 = Math.floor(game.camera.x / GRID), gy0 = Math.floor(game.camera.y / GRID);
      const gx1 = Math.ceil((game.camera.x + canvas.width) / GRID);
      const gy1 = Math.ceil((game.camera.y + canvas.height) / GRID);
      for (let i = gx0; i <= gx1; i++) { const x = i * GRID - game.camera.x; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
      for (let j = gy0; j <= gy1; j++) { const y = j * GRID - game.camera.y; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }

      ctx.translate(-game.camera.x, -game.camera.y);

      // Craters (under everything)
      game.effects.filter(f => f.type === 'crater').forEach(f => {
        ctx.save();
        const op = f.timer < 80 ? f.timer / 80 : 1;
        ctx.beginPath(); ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(30,30,30,${op * 0.85})`; ctx.strokeStyle = `rgba(10,10,10,${op})`; ctx.lineWidth = 2.5;
        ctx.fill(); ctx.stroke(); ctx.restore();
      });

      // Smoke screens
      game.smokeScreens.forEach(s => {
        const alpha = Math.min(1, s.timer / 60) * 0.55;
        ctx.save();
        const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.radius);
        grad.addColorStop(0, `rgba(160,155,150,${alpha})`);
        grad.addColorStop(1, 'rgba(120,115,110,0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });

      // Obstacles
      game.obstacles.forEach(o => {
        ctx.save(); ctx.strokeStyle = '#000'; ctx.lineWidth = 3.5;
        if (o.type === 'conblock' || o.type === 'ruins') {
          ctx.fillStyle = o.color || '#3f3f46';
          ctx.fillRect(o.x, o.y, o.w, o.h); ctx.strokeRect(o.x, o.y, o.w, o.h);
          ctx.strokeStyle = 'rgba(30,30,30,0.5)'; ctx.lineWidth = 1.5;
          for (let s = 16; s < o.w; s += 22) { ctx.beginPath(); ctx.moveTo(o.x + s, o.y); ctx.lineTo(o.x + s + 12, o.y + o.h); ctx.stroke(); }
        } else if (o.type === 'filled') {
          ctx.fillStyle = '#292524';
          ctx.fillRect(o.x, o.y, o.w, o.h); ctx.strokeRect(o.x, o.y, o.w, o.h);
        } else if (o.type === 'roof') {
          let blueUnder = false;
          for (const u of game.units) {
            if (u.team === 'blue' && u.hp > 0 && u.x >= o.x && u.x <= o.x + o.w && u.y >= o.y && u.y <= o.y + o.h) {
              blueUnder = true; break;
            }
          }
          ctx.fillStyle = '#3f3f46';
          ctx.fillRect(o.x, o.y, o.w, o.h);
          if (blueUnder) ctx.globalAlpha = 0.3;
          ctx.fillStyle = '#92400e';
          ctx.fillRect(o.x, o.y, o.w, o.h); ctx.strokeRect(o.x, o.y, o.w, o.h);
          ctx.strokeStyle = '#451a03'; ctx.lineWidth = 1.5;
          for (let px = o.x + 8; px < o.x + o.w; px += 12) { ctx.beginPath(); ctx.moveTo(px, o.y); ctx.lineTo(px, o.y + o.h); ctx.stroke(); }
          if (blueUnder) ctx.globalAlpha = 1;
        } else if (o.type === 'road') {
          ctx.fillStyle = '#27272a';
          ctx.fillRect(o.x, o.y, o.w, o.h); ctx.strokeRect(o.x, o.y, o.w, o.h);
          ctx.strokeStyle = '#eab308'; ctx.lineWidth = 2; ctx.setLineDash([8, 8]);
          if (o.w >= o.h) {
            const cy = o.y + o.h / 2;
            ctx.beginPath(); ctx.moveTo(o.x, cy); ctx.lineTo(o.x + o.w, cy); ctx.stroke();
          } else {
            const cx = o.x + o.w / 2;
            ctx.beginPath(); ctx.moveTo(cx, o.y); ctx.lineTo(cx, o.y + o.h); ctx.stroke();
          }
          ctx.setLineDash([]);
        } else if (o.type === 'bunker') {
          ctx.fillStyle = '#525252';
          ctx.beginPath(); ctx.arc(o.x + o.w / 2, o.y + o.h / 2, o.w / 2 - 2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#111'; ctx.fillRect(o.x + 10, o.y + o.h / 2 - 4, o.w - 20, 8);
        } else if (o.type === 'wreck') {
          const cx = o.x + o.w / 2, cy = o.y + o.h / 2, r = o.w / 2.8;
          ctx.save(); ctx.translate(cx, cy);
          const rot = (o.rot || 0) * Math.PI / 2;
          ctx.rotate(rot);
          ctx.strokeStyle = '#000'; ctx.lineWidth = 3;

          // Shadow
          ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 3;

          // Tracks
          ctx.fillStyle = '#1c1917';
          ctx.fillRect(-r * 1.1, -r * 0.85, r * 2.2, r * 0.25);
          ctx.fillRect(-r * 1.1, r * 0.6, r * 2.2, r * 0.25);

          // Hull — darker, dented
          ctx.fillStyle = '#292524'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.rect(-r, -r * 0.6, r * 2, r * 1.2); ctx.fill(); ctx.stroke();

          // Turret — slightly tilted
          ctx.shadowColor = 'transparent';
          ctx.save();
          ctx.rotate(0.15);
          ctx.fillStyle = '#1c1917'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

          // Broken barrel — bent downward
          ctx.fillStyle = '#1c1917'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(0, -r * 0.05);
          ctx.lineTo(r * 1.2, -r * 0.05);
          ctx.lineTo(r * 1.4, r * 0.35);
          ctx.lineTo(r * 1.2, r * 0.3);
          ctx.lineTo(r * 1.0, -r * 0.05);
          ctx.closePath(); ctx.fill(); ctx.stroke();

          ctx.restore();

          // Burn mark / soot
          ctx.fillStyle = 'rgba(0,0,0,0.25)';
          ctx.beginPath(); ctx.arc(r * 0.2, -r * 0.1, r * 0.35, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'rgba(239,68,68,0.15)';
          ctx.beginPath(); ctx.arc(r * 0.3, -r * 0.15, r * 0.2, 0, Math.PI * 2); ctx.fill();
          ctx.restore();

          // Burn soot
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.beginPath(); ctx.arc(r * 0.3, -r * 0.2, r * 0.4, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'rgba(239,68,68,0.12)';
          ctx.beginPath(); ctx.arc(r * 0.4, -r * 0.25, r * 0.25, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        } else if (o.type === 'wall') {
          if (!game._camoPat) {
            const c = document.createElement('canvas'); c.width = 20; c.height = 20;
            const px = c.getContext('2d');
            px.fillStyle = '#57534e'; px.fillRect(0, 0, 20, 20);
            px.fillStyle = '#44403c'; px.fillRect(0, 0, 10, 10); px.fillRect(10, 10, 10, 10);
            game._camoPat = ctx.createPattern(c, 'repeat');
          }
          ctx.fillStyle = game._camoPat;
          ctx.fillRect(o.x, o.y, o.w, o.h); ctx.strokeRect(o.x, o.y, o.w, o.h);
          ctx.strokeStyle = '#1c1917'; ctx.lineWidth = 1;
          for (let ry = 0; ry < o.h; ry += 10) { ctx.beginPath(); ctx.moveTo(o.x, o.y + ry); ctx.lineTo(o.x + o.w, o.y + ry); ctx.stroke(); }
        } else if (o.type === 'beacon') {
          const cx = o.x + o.w / 2, cy = o.y + o.h / 2;
          const t = Date.now() / 1000;
          const pulse = 0.25 + Math.sin(t * 2.5) * 0.12;
          ctx.fillStyle = `rgba(251,191,36,${pulse})`;
          ctx.beginPath(); ctx.arc(cx, cy, o.w / 2 + 6, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#374151'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(cx, cy, o.w / 2 - 2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath(); ctx.arc(cx, cy, o.w / 3, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#fef08a';
          ctx.beginPath(); ctx.arc(cx, cy, o.w / 5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
      });

      // Trees
      game.trees.forEach(t => {
        const cx = t.x + GRID / 2, cy = t.y + GRID / 2, r = GRID * .36;
        function sr(n) { const x = Math.sin(t.x * 12.9898 + t.y * 78.233 + n * 45.164) * 43758.5453; return x - Math.floor(x); }
        ctx.save();

        // Tree colors based on background
        const tc = (() => {
          if (game.bgColor === '#5c4a3a') return { fill: '#78350f', stroke: '#451a03', hl: 'rgba(217,119,6,0.12)' };
          if (game.bgColor === '#4a4a4a') return { fill: '#57534e', stroke: '#292524', hl: 'rgba(120,113,108,0.12)' };
          if (game.bgColor === '#18181b') return { fill: '#1c1917', stroke: '#09090b', hl: 'rgba(39,39,42,0.2)' };
          return { fill: '#16a34a', stroke: '#14532d', hl: 'rgba(74,222,128,0.15)' };
        })();

        ctx.beginPath();
        for (let i = 0; i <= 12; i++) {
          const a = (i / 12) * Math.PI * 2, wig = r * (0.75 + sr(i) * .48);
          const px = cx + Math.cos(a) * wig, py = cy + Math.sin(a) * wig;
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = tc.fill; ctx.fill();
        ctx.strokeStyle = tc.stroke; ctx.lineWidth = 2; ctx.stroke();
        // Canopy highlight
        ctx.beginPath(); ctx.arc(cx - r * .2, cy - r * .2, r * .35, 0, Math.PI * 2);
        ctx.fillStyle = tc.hl; ctx.fill();
        ctx.restore();
      });

      // Spawners stay visible in builder mode, hidden during combat.
      if (game.mode !== 'simulation') {
        game.spawners.forEach(s => {
          ctx.save();
          ctx.fillStyle = 'rgba(239,68,68,0.15)'; ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.fillRect(s.x, s.y, GRID, GRID); ctx.strokeRect(s.x, s.y, GRID, GRID);
          ctx.setLineDash([]);
          ctx.fillStyle = '#ef4444'; ctx.font = 'bold 10px Share Tech Mono,monospace';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
          const lbl = s.type === 'infantry' ? 'INF' : s.type === 'tank' ? 'TNK' : s.type === 'drone' ? 'DRN' : s.type === 'sniper' ? 'SNP' : s.type === 'gunner' ? 'GNR' : 'AT';
          ctx.strokeText(lbl, s.x + 32, s.y + 32); ctx.fillText(lbl, s.x + 32, s.y + 32);
          ctx.restore();
        });
      }

      // Simulation draw
      if (game.mode === 'simulation') {
        // APC heal radius preview
        game.units.filter(u => u.type === 'apc' && u.team === 'blue').forEach(u => {
          if (u.isSelected) {
            ctx.save(); ctx.beginPath(); ctx.arc(u.x, u.y, u.healRadius, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(74,222,128,0.25)'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 5]);
            ctx.stroke(); ctx.setLineDash([]); ctx.restore();
          }
        });

        game.units.forEach(u => u.draw());

        // Mines (subtle)
        game.mines.forEach(m => {
          ctx.save();
          ctx.beginPath(); ctx.arc(m.x, m.y, 5, 0, Math.PI * 2);
          ctx.fillStyle = '#78716c'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5;
          ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.arc(m.x, m.y, 2, 0, Math.PI * 2);
          ctx.fillStyle = '#ef4444'; ctx.fill();
          ctx.restore();
        });

        // Projectiles
        game.projectiles.forEach(p => {
          ctx.save(); ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5;
          if (p.type === 'shell') { ctx.fillStyle = '#eab308'; ctx.beginPath(); ctx.arc(p.x, p.y, 5.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
          else if (p.type === 'sniper') {
            ctx.fillStyle = '#c084fc';
            ctx.beginPath(); ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            // Tracer
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 18, p.y - p.vy * 18);
            ctx.strokeStyle = 'rgba(192,132,252,0.4)'; ctx.lineWidth = 1; ctx.stroke();
          }
          else { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p.x, p.y, 2.8, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
          ctx.restore();
        });

        // Momentum / tempo display
        if (game.tempoKills >= 2) {
          ctx.save();
          const tempoBars = Math.min(game.tempoKills, 5);
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          ctx.fillRect(canvas.width - 110, 8, 102, 20);
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 1;
          ctx.strokeRect(canvas.width - 110, 8, 102, 20);
          ctx.fillStyle = '#60a5fa';
          ctx.font = 'bold 8px Share Tech Mono,monospace';
          ctx.textAlign = 'left';
          ctx.fillText('MOMENTUM', canvas.width - 105, 20);
          for (let i = 0; i < tempoBars; i++) {
            ctx.fillStyle = i < game.tempoKills ? '#60a5fa' : '#27272a';
            ctx.fillRect(canvas.width - 100 + i * 18, 24, 14, 4);
          }
          ctx.restore();
        }

        // Commander strafe indicator
        if (game.commanderStrike && game.commanderStrike.idx < game.commanderStrike.points.length) {
          const pts = game.commanderStrike.points;
          ctx.save();
          ctx.strokeStyle = 'rgba(251,191,36,0.4)'; ctx.lineWidth = 2; ctx.setLineDash([4, 6]);
          ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
          ctx.stroke(); ctx.setLineDash([]);
          const last = pts[Math.min(game.commanderStrike.idx, pts.length - 1)];
          const pulse = 0.5 + Math.sin(Date.now() * 0.02) * 0.3;
          ctx.fillStyle = `rgba(251,191,36,${pulse})`;
          ctx.beginPath(); ctx.arc(last.x, last.y, 6, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        }

        // Airstrike laser overlay
        if (game.airstrikeLaserTimer > 0 && game.airstrikePoints?.length > 1) {
          const a = 0.4 + 0.5 * Math.sin(Date.now() * .015);
          ctx.save(); ctx.strokeStyle = `rgba(239,68,68,${a})`; ctx.lineWidth = 1.5; ctx.setLineDash([5, 5]);
          const f = game.airstrikePoints[0], l = game.airstrikePoints[game.airstrikePoints.length - 1];
          ctx.beginPath(); ctx.moveTo(f.x, 0); ctx.lineTo(f.x, f.y); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(l.x, 0); ctx.lineTo(l.x, l.y); ctx.stroke();
          ctx.setLineDash([]); ctx.restore();
        }

        // Airstrike drag preview
        if (game.airstrikeDragging && game.airstrikeLineStart && game.airstrikeLineEnd) {
          ctx.save();
          ctx.strokeStyle = 'rgba(239,68,68,0.85)'; ctx.lineWidth = 2.5; ctx.setLineDash([8, 4]);
          ctx.beginPath(); ctx.moveTo(game.airstrikeLineStart.x, game.airstrikeLineStart.y);
          ctx.lineTo(game.airstrikeLineEnd.x, game.airstrikeLineEnd.y); ctx.stroke();
          const mx = (game.airstrikeLineStart.x + game.airstrikeLineEnd.x) / 2;
          const my = (game.airstrikeLineStart.y + game.airstrikeLineEnd.y) / 2;
          ctx.fillStyle = '#ef4444'; ctx.font = 'bold 11px Share Tech Mono,monospace'; ctx.textAlign = 'center';
          ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.setLineDash([]);
          ctx.strokeText('BOMBING CORRIDOR', mx, my - 14); ctx.fillText('BOMBING CORRIDOR', mx, my - 14);
          ctx.restore();
        }

        // Selection box
        if (game.isSelecting && game.selectionStart && game.selectionEnd) {
          ctx.save();
          const x = game.selectionStart.x, y = game.selectionStart.y;
          const w = game.selectionEnd.x - x, h = game.selectionEnd.y - y;
          ctx.fillStyle = 'rgba(59,130,246,0.08)'; ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]); ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h); ctx.setLineDash([]);
          ctx.restore();
        }
      }

      // Builder hover ghost
      if (game.mode === 'builder' && game.builderHoverPos) {
        const sn = snapToGrid(game.builderHoverPos);
        ctx.save();
        const erase = game.activeBrush === 'eraser';
        ctx.strokeStyle = erase ? '#ef4444' : '#eab308'; ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.fillStyle = erase ? 'rgba(239,68,68,0.1)' : 'rgba(234,179,8,0.1)';
        if (game.activeBrush === 'conblock' || game.activeBrush === 'filled' || game.activeBrush === 'roof' || game.activeBrush === 'road') {
          const w = game.ruinsOrientation === 'horizontal' ? GRID * game.ruinSize : GRID;
          const h = game.ruinsOrientation === 'horizontal' ? GRID : GRID * game.ruinSize;
          ctx.fillRect(sn.x, sn.y, w, h); ctx.strokeRect(sn.x, sn.y, w, h);
        } else if (game.activeBrush === 'wreck') {
          ctx.fillRect(sn.x, sn.y, GRID, GRID); ctx.strokeRect(sn.x, sn.y, GRID, GRID);
        } else if (game.activeBrush === 'tree') {
          ctx.strokeStyle = '#16a34a'; ctx.fillStyle = 'rgba(22,163,74,0.12)';
          ctx.fillRect(sn.x, sn.y, GRID, GRID); ctx.strokeRect(sn.x, sn.y, GRID, GRID);
        } else {
          ctx.fillRect(sn.x, sn.y, GRID, GRID); ctx.strokeRect(sn.x, sn.y, GRID, GRID);
        }
        ctx.setLineDash([]); ctx.restore();
      }

      // Effects (top layer)
      game.effects.forEach(f => {
        if (f.type === 'crater') return; // already drawn
        ctx.save();
        if (f.type === 'spark') {
          ctx.fillStyle = `rgba(251,146,60,${f.timer / 12})`;
          ctx.fillRect(f.x, f.y, 3, 3);
        } else if (f.type === 'smoke') {
          const a = Math.min(1, f.timer / 40) * 0.45;
          ctx.beginPath(); ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(115,115,115,${a})`; ctx.fill();
        } else if (f.type === 'debris') {
          ctx.globalAlpha = Math.max(0, f.timer / 25);
          ctx.translate(f.x, f.y); ctx.rotate(f.timer * .25);
          ctx.fillStyle = '#78716c'; ctx.fillRect(-f.size / 2, -f.size / 2, f.size, f.size);
        } else if (f.type === 'muzzle-flash') {
          const a = f.timer / 6;
          ctx.globalAlpha = a;
          ctx.fillStyle = f.team === 'blue' ? '#93c5fd' : '#fca5a5';
          ctx.beginPath(); ctx.arc(f.x, f.y, 6 * a, 0, Math.PI * 2); ctx.fill();
        } else if (f.type === 'move-marker') {
          ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(f.x, f.y, (20 - f.timer) * 1.5, 0, Math.PI * 2); ctx.stroke();
        } else if (f.type === 'target-marker') {
          ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2.5;
          const r = 16 + Math.sin(f.timer * .2) * 2;
          ctx.beginPath(); ctx.arc(f.x, f.y, r, 0, Math.PI * 2);
          ctx.moveTo(f.x - r - 5, f.y); ctx.lineTo(f.x + r + 5, f.y);
          ctx.moveTo(f.x, f.y - r - 5); ctx.lineTo(f.x, f.y + r + 5); ctx.stroke();
        } else if (f.type === 'blast-flash') {
          const progress = Math.max(0, 1 - (f.timer / 20));
          const r = Math.max(0.1, f.maxRadius * progress);
          ctx.beginPath(); ctx.arc(f.x, f.y, r, 0, Math.PI * 2);
          const gr = ctx.createRadialGradient(f.x, f.y, 2, f.x, f.y, r);
          gr.addColorStop(0, '#fff'); gr.addColorStop(.25, '#fbbf24'); gr.addColorStop(.7, 'rgba(239,68,68,.4)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = gr; ctx.fill();
        } else if (f.type === 'drone-mark') {
          const pulse = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
          ctx.strokeStyle = `rgba(34,211,238,${0.4 * pulse})`;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 4]);
          ctx.beginPath(); ctx.arc(f.x, f.y, 14 + Math.sin(Date.now() * 0.005 + f.x) * 3, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          // Small cyan diamond
          ctx.fillStyle = `rgba(34,211,238,${0.6 * pulse})`;
          ctx.beginPath();
          ctx.moveTo(f.x, f.y - 6); ctx.lineTo(f.x + 4, f.y);
          ctx.lineTo(f.x, f.y + 6); ctx.lineTo(f.x - 4, f.y);
          ctx.closePath(); ctx.fill();
        } else if (f.type === 'a10') {
          ctx.translate(f.x, f.y);
          ctx.rotate(f.angle);

          // High altitude shadow for a flying unit
          ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
          ctx.shadowBlur = 12;
          ctx.shadowOffsetX = 10;
          ctx.shadowOffsetY = 15;

          const len = 16 * 2.4;
          const wingSpan = 16 * 3.0;

          // Main Twin Jet Engines (Mounted high on the rear fuselage)
          ctx.fillStyle = '#111111';
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          // Left Engine
          ctx.beginPath();
          ctx.rect(-len * 0.35, -16 * 0.45, len * 0.25, 16 * 0.25);
          ctx.fill();
          ctx.stroke();
          // Right Engine
          ctx.beginPath();
          ctx.rect(-len * 0.35, 16 * 0.2, len * 0.25, 16 * 0.25);
          ctx.fill();
          ctx.stroke();

          // Main Airframe (Fuselage, Wings, Tail)
          ctx.fillStyle = '#3b82f6';
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 3;

          ctx.beginPath();
          // Nose
          ctx.moveTo(len * 0.5, -16 * 0.15);
          // Forward fuselage
          ctx.lineTo(len * 0.2, -16 * 0.2);
          // Main Straight Wings (Characteristic of the A-10)
          ctx.lineTo(len * 0.1, -wingSpan * 0.5);
          ctx.lineTo(-len * 0.1, -wingSpan * 0.5);
          ctx.lineTo(-len * 0.05, -16 * 0.2);
          // Rear fuselage
          ctx.lineTo(-len * 0.4, -16 * 0.15);
          // Tailplane / Horizontal Stabilizers
          ctx.lineTo(-len * 0.45, -16 * 0.6);
          ctx.lineTo(-len * 0.55, -16 * 0.6);
          ctx.lineTo(-len * 0.5, -16 * 0.15);
          // Symmetrical lower half
          ctx.lineTo(-len * 0.5, 16 * 0.15);
          ctx.lineTo(-len * 0.55, 16 * 0.6);
          ctx.lineTo(-len * 0.45, 16 * 0.6);
          ctx.lineTo(-len * 0.4, 16 * 0.15);
          ctx.lineTo(-len * 0.05, 16 * 0.2);
          ctx.lineTo(-len * 0.1, wingSpan * 0.5);
          ctx.lineTo(len * 0.1, wingSpan * 0.5);
          ctx.lineTo(len * 0.2, 16 * 0.2);
          ctx.lineTo(len * 0.5, 16 * 0.15);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.shadowColor = 'transparent';

          // Twin Vertical Fins (Mounted on the tips of the tailplane)
          ctx.fillStyle = '#111111';
          ctx.lineWidth = 2;
          // Left fin
          ctx.beginPath();
          ctx.rect(-len * 0.58, -16 * 0.65, len * 0.12, 16 * 0.1);
          ctx.fill();
          ctx.stroke();
          // Right fin
          ctx.beginPath();
          ctx.rect(-len * 0.58, 16 * 0.55, len * 0.12, 16 * 0.1);
          ctx.fill();
          ctx.stroke();

          // Cockpit Canopy Glass
          ctx.fillStyle = '#222222';
          ctx.beginPath();
          ctx.rect(len * 0.1, -16 * 0.08, len * 0.18, 16 * 0.16);
          ctx.fill();
          ctx.stroke();

          // The Massive GAU-8 Avenger Rotary Cannon (Protruding slightly from the nose)
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(len * 0.48, -16 * 0.04);
          ctx.lineTo(len * 0.62, -16 * 0.04);
          ctx.stroke();
        }
        ctx.restore();
      });

      // Floating texts
      game.floatingTexts.forEach(ft => {
        ctx.save(); ctx.globalAlpha = Math.min(1, ft.timer / 20);
        ctx.font = 'bold 13px Share Tech Mono,monospace'; ctx.textAlign = 'center';
        ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
        ctx.strokeText(ft.text, ft.x, ft.y);
        ctx.fillStyle = ft.color; ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      });

      // Screen-space overlays (reset transform)
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      // Minimap
      if (game.mode === 'simulation' || game.mode === 'builder') {
        const mmW = 140, mmH = 100;
        const mmX = canvas.width - mmW - 8, mmY = canvas.height - mmH - 8;
        const sx = mmW / game.worldWidth, sy = mmH / game.worldHeight;
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.strokeStyle = '#52525b'; ctx.lineWidth = 1.5;
        ctx.fillRect(mmX, mmY, mmW, mmH); ctx.strokeRect(mmX, mmY, mmW, mmH);
        // Obstacles
        ctx.fillStyle = '#444';
        game.obstacles.forEach(o => ctx.fillRect(mmX + o.x * sx, mmY + o.y * sy, Math.max(1, o.w * sx), Math.max(1, o.h * sy)));
        // Trees
        ctx.fillStyle = '#166534';
        game.trees.forEach(t => ctx.fillRect(mmX + t.x * sx, mmY + t.y * sy, 2, 2));
        // Spawners
        ctx.fillStyle = '#dc2626';
        game.spawners.forEach(s => ctx.fillRect(mmX + s.x * sx - 1, mmY + s.y * sy - 1, 3, 3));
        // Units
        game.units.forEach(u => {
          ctx.fillStyle = u.team === 'blue' ? '#3b82f6' : '#ef4444';
          ctx.fillRect(mmX + u.x * sx - 1, mmY + u.y * sy - 1, 3, 3);
        });
        // Camera viewport
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
        ctx.strokeRect(mmX + game.camera.x * sx, mmY + game.camera.y * sy, canvas.width * sx, canvas.height * sy);
      }

      ctx.restore();
    }

    // ============================================================
    //  MAIN LOOP
    // ============================================================
    function loop() {
      update(); draw();
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    // Init
    setScreenMode('home');
  