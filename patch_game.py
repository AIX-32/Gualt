import re, shutil, sys

path = "game.js"
shutil.copy(path, path + ".bak")
print("Backup saved to game.js.bak")

with open(path, "r") as f:
    src = f.read()

changes = 0

# ── Fix 1: buildGrid uses world dimensions ──────────────────────────────────
old = '''function buildGrid() {
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
    }'''
new = '''let _cachedGrid = null;
    let _gridDirty = true;
    function markGridDirty() { _gridDirty = true; }
    function getGrid() {
      if (_gridDirty || !_cachedGrid) { _cachedGrid = buildGrid(); _gridDirty = false; }
      return _cachedGrid;
    }
    function buildGrid() {
      const cols = Math.ceil(game.worldWidth / GRID);
      const rows = Math.ceil(game.worldHeight / GRID);
      const grid = Array.from({ length: rows }, () => Array(cols).fill(0));
      for (const o of game.obstacles) {
        if (isWalkableObs(o)) continue;
        const margin = 1;
        const x1 = Math.max(0, Math.floor(o.x / GRID) - margin);
        const y1 = Math.max(0, Math.floor(o.y / GRID) - margin);
        const x2 = Math.min(cols - 1, Math.ceil((o.x + o.w) / GRID) - 1 + margin);
        const y2 = Math.min(rows - 1, Math.ceil((o.y + o.h) / GRID) - 1 + margin);
        for (let gy = y1; gy <= y2; gy++)
          for (let gx = x1; gx <= x2; gx++)
            grid[gy][gx] = 1;
      }
      return { grid, cols, rows };
    }'''
if old in src:
    src = src.replace(old, new, 1); changes += 1; print("✓ Fix 1: buildGrid world dimensions + grid cache")
else:
    print("✗ Fix 1 not found — skipping")

# ── Fix 2: findPath uses getGrid() ──────────────────────────────────────────
old = '      const { grid, cols, rows } = buildGrid();'
new = '      const { grid, cols, rows } = getGrid();'
if old in src:
    src = src.replace(old, new, 1); changes += 1; print("✓ Fix 2: findPath uses cached grid")
else:
    print("✗ Fix 2 not found — skipping")

# ── Fix 3: markGridDirty after parseLevelData ────────────────────────────────
old = '''      game.bgColor = p[1]; continue; }
        if (p[0] === 'spawn' && p.length >= 4) {'''
new = '''      game.bgColor = p[1]; markGridDirty(); continue; }
        if (p[0] === 'spawn' && p.length >= 4) {'''
if old in src:
    src = src.replace(old, new, 1); changes += 1; print("✓ Fix 3: markGridDirty after level load")
else:
    print("✗ Fix 3 not found — skipping")

# ── Fix 4: markGridDirty after handleBuilderAction places obstacle ───────────
old = '''        if (obs) { game.obstacles.push(obs); game.builderLastAction = { type: 'place', obs: { ...obs } }; playSound('click'); updateBuilderCount(); }'''
new = '''        if (obs) { game.obstacles.push(obs); game.builderLastAction = { type: 'place', obs: { ...obs } }; markGridDirty(); playSound('click'); updateBuilderCount(); }'''
if old in src:
    src = src.replace(old, new, 1); changes += 1; print("✓ Fix 4: markGridDirty on builder place")
else:
    print("✗ Fix 4 not found — skipping")

# ── Fix 5: markGridDirty on builder erase ───────────────────────────────────
old = '''      idx = game.obstacles.findIndex(o => o.x === sn.x && o.y === sn.y);
      if (idx !== -1) { const o = game.obstacles[idx]; game.builderLastAction = { type: 'erase', obs: { ...o } }; game.obstacles.splice(idx, 1); updateBuilderCount(); playSound('click'); return; }'''
new = '''      idx = game.obstacles.findIndex(o => o.x === sn.x && o.y === sn.y);
      if (idx !== -1) { const o = game.obstacles[idx]; game.builderLastAction = { type: 'erase', obs: { ...o } }; game.obstacles.splice(idx, 1); markGridDirty(); updateBuilderCount(); playSound('click'); return; }'''
if old in src:
    src = src.replace(old, new, 1); changes += 1; print("✓ Fix 5: markGridDirty on builder erase")
else:
    print("✗ Fix 5 not found — skipping")

# ── Fix 6: Enemy repath timer at top of Unit.update() ───────────────────────
old = '''      if (this.fireCooldown > 0) this.fireCooldown--;'''
new = '''      if (this.fireCooldown > 0) this.fireCooldown--;
        // Re-path toward moving target every ~45 frames
        if (this.team === 'red' && this.targetUnit && this.targetUnit.hp > 0) {
          this._repathTimer = (this._repathTimer || 0) + 1;
          if (this._repathTimer > 45) {
            this._repathTimer = 0;
            if (!lineOfSightClear(this.x, this.y, this.targetUnit.x, this.targetUnit.y)) {
              const np = findPath(this.x, this.y, this.targetUnit.x, this.targetUnit.y);
              if (np.length) { this._path = np; this._pathIdx = 0; }
            } else {
              this._path = null;
            }
          }
        }'''
if old in src:
    src = src.replace(old, new, 1); changes += 1; print("✓ Fix 6: Enemy repath timer")
else:
    print("✗ Fix 6 not found — skipping")

# ── Fix 7: Unified path-follow block (enemies use path while chasing) ────────
old = '''        // Follow path if one exists (skip when chasing a target)
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
        }'''
new = '''        // Unified path-follow: works for both chasing and moving
        if (this._path && this._path.length) {
          const wp = this._path[this._pathIdx || 0];
          const pdx = wp.x - this.x, pdy = wp.y - this.y;
          if (pdx * pdx + pdy * pdy < 22 * 22) {
            this._pathIdx = (this._pathIdx || 0) + 1;
            if (this._pathIdx >= this._path.length) {
              this._path = null;
              this._pathIdx = 0;
            }
          }
          if (this._path) {
            const endGoal = this.targetUnit
              ? { x: this.targetUnit.x, y: this.targetUnit.y }
              : { x: this.targetX, y: this.targetY };
            if (!lineOfSightClear(this.x, this.y, endGoal.x, endGoal.y)) {
              const nextWp = this._path[this._pathIdx || 0];
              if (nextWp) { this.targetX = nextWp.x; this.targetY = nextWp.y; }
            } else {
              this._path = null;
              if (this.targetUnit) { this.targetX = this.targetUnit.x; this.targetY = this.targetUnit.y; }
            }
          }
        }'''
if old in src:
    src = src.replace(old, new, 1); changes += 1; print("✓ Fix 7: Unified path-follow block")
else:
    print("✗ Fix 7 not found — skipping")

# ── Fix 8: _findTarget requests path for enemies ────────────────────────────
old = '''          if (!lineOfSightClear(this.x, this.y, u.x, u.y)) continue;
          best = d; this.targetUnit = u; this._path = null;
        }
      }'''
new = '''          if (!lineOfSightClear(this.x, this.y, u.x, u.y)) continue;
          best = d; this.targetUnit = u;
        }
      }
      if (this.targetUnit && this.team === 'red') {
        if (!lineOfSightClear(this.x, this.y, this.targetUnit.x, this.targetUnit.y)) {
          const path = findPath(this.x, this.y, this.targetUnit.x, this.targetUnit.y);
          if (path.length) { this._path = path; this._pathIdx = 0; }
        } else {
          this._path = null;
        }
      }'''
if old in src:
    src = src.replace(old, new, 1); changes += 1; print("✓ Fix 8: Enemy pathfinding on target acquire")
else:
    print("✗ Fix 8 not found — skipping")

# ── Fix 9: Patrol uses pathfinding ──────────────────────────────────────────
old = '''          if (d <= 6) {
          this.idleTimer++;
          this.idleScan += 0.03;
          if (this.idleTimer > 45) {
            this.idleTimer = 0;
            const p = randomClearPatrolPos(this, this.type === 'tank' ? 90 : this.type === 'sniper' ? 110 : 70);
            this.targetX = p.x;
            this.targetY = p.y;
          }'''
new = '''          if (d <= 6) {
          this.idleTimer++;
          this.idleScan += 0.03;
          if (this.idleTimer > 45) {
            this.idleTimer = 0;
            const p = randomClearPatrolPos(this, this.type === 'tank' ? 90 : this.type === 'sniper' ? 110 : 70);
            this.targetX = p.x;
            this.targetY = p.y;
            const patrolPath = findPath(this.x, this.y, p.x, p.y);
            if (patrolPath.length) { this._path = patrolPath; this._pathIdx = 0; }
          }'''
if old in src:
    src = src.replace(old, new, 1); changes += 1; print("✓ Fix 9: Patrol pathfinding")
else:
    print("✗ Fix 9 not found — skipping")

with open(path, "w") as f:
    f.write(src)

print(f"\nDone — {changes}/9 fixes applied.")
print("Original backed up to game.js.bak")
print("Run: python3 patch_game.py to re-apply if needed")
