import * as THREE from 'three';

// ============================================================
// TETRA-RING: first-person Tetris on a faceted cylinder.
// The playfield is a 2D Tetris grid (COLS x ROWS) wrapped into
// a ring around the player. Columns wrap around; a "line clear"
// is a full ring of 12 blocks at one height.
// ============================================================

// ---------- Tuning ----------
const COLS = 12;                       // angular columns (ring segments)
const ROWS = 12;                       // stack height in blocks
const THETA = (Math.PI * 2) / COLS;    // angle per column
const INNER_R = 2.2;                   // inner radius of the ring wall (m)
const DEPTH = 0.55;                    // radial thickness of a block
const BLOCK_H = 0.38;                  // height of a block
const GAP = 0.05;                      // visual gap between blocks
const EYE = 1.6;                       // camera eye height
const WALL_H = ROWS * BLOCK_H;
const DANGER_ROW = ROWS - 4;           // stack height where warnings kick in
const RINGS_PER_LEVEL = 6;

const mod = (n, m) => ((n % m) + m) % m;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---------- Scene / renderer ----------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0d14);
scene.fog = new THREE.Fog(0x0a0d14, 7, 16);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, EYE, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.domElement.classList.add('game');
document.body.appendChild(renderer.domElement);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---------- Lights ----------
scene.add(new THREE.AmbientLight(0x99aacc, 0.55));

const sun = new THREE.DirectionalLight(0xffffff, 1.2);
sun.position.set(4, 10, 2);
scene.add(sun);

// The player is the lamp: nearby blocks glow as they close in.
const LAMP_WARM = new THREE.Color(0xffe2b8);
const LAMP_RED = new THREE.Color(0xff3524);
const lamp = new THREE.PointLight(LAMP_WARM, 7, 20, 2);
lamp.position.set(0, EYE + 0.4, 0);
scene.add(lamp);

// ---------- Floor + guides ----------
scene.add(new THREE.Mesh(
    new THREE.CircleGeometry(9, 64).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x141a26, roughness: 0.95 })
));

// Decorative polar grid on the floor
{
    const pts = [];
    const circle = (r, y) => {
        const n = 96;
        for (let i = 0; i < n; i++) {
            const a = (i / n) * Math.PI * 2, b = ((i + 1) / n) * Math.PI * 2;
            pts.push(r * Math.cos(a), y, r * Math.sin(a), r * Math.cos(b), y, r * Math.sin(b));
        }
    };
    [1.2, INNER_R, INNER_R + DEPTH, 4.5, 6.5, 8.5].forEach(r => circle(r, 0.005));
    for (let c = 0; c < COLS; c++) {
        const a = (c + 0.5) * THETA;
        pts.push(1.2 * Math.cos(a), 0.005, 1.2 * Math.sin(a), 8.5 * Math.cos(a), 0.005, 8.5 * Math.sin(a));
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    scene.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0x25314a, transparent: true, opacity: 0.8 })));
}

// Vertical column guides on the inside of the ring wall
{
    const pts = [];
    const r = INNER_R - 0.03;
    for (let c = 0; c < COLS; c++) {
        const a = (c + 0.5) * THETA;
        pts.push(r * Math.cos(a), 0, r * Math.sin(a), r * Math.cos(a), WALL_H, r * Math.sin(a));
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    scene.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0x3a4a70, transparent: true, opacity: 0.18 })));
}

// Danger line: red ring at the height where things get dicey
{
    const pts = [];
    const r = INNER_R - 0.03, y = DANGER_ROW * BLOCK_H, n = 96;
    for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2, b = ((i + 1) / n) * Math.PI * 2;
        pts.push(r * Math.cos(a), y, r * Math.sin(a), r * Math.cos(b), y, r * Math.sin(b));
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    scene.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xff4433, transparent: true, opacity: 0.35 })));
}

// ---------- Block geometry ----------
// One flat-faced trapezoidal wedge, built once and shared by every block.
// Local frame after the rotations below: +Y up, radial outward along +Z.
function wedgeGeometry() {
    const t = Math.tan(THETA / 2);
    const d1 = INNER_R, d2 = INNER_R + DEPTH;
    const w1 = d1 * t - GAP / 2, w2 = d2 * t - GAP / 2;
    const s = new THREE.Shape();
    s.moveTo(-w1, d1);
    s.lineTo(w1, d1);
    s.lineTo(w2, d2);
    s.lineTo(-w2, d2);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: BLOCK_H - GAP, bevelEnabled: false });
    g.rotateX(-Math.PI / 2); // extrusion -> up, radial -> -Z
    g.rotateY(Math.PI);      // radial -> +Z
    return g;
}
const WEDGE = wedgeGeometry();
const WEDGE_EDGES = new THREE.EdgesGeometry(WEDGE);
const EDGE_MAT = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 });
const GHOST_MAT = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.08, depthWrite: false });
const GHOST_EDGE_MAT = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 });

// ---------- Pieces ----------
// Standard tetrominoes as (dCol, dRow) offsets; dRow is up.
const PIECES = {
    I: { color: 0x3ec6d8, cells: [[-1, 0], [0, 0], [1, 0], [2, 0]] },
    O: { color: 0xf2c94c, cells: [[0, 0], [1, 0], [0, 1], [1, 1]] },
    T: { color: 0xb37fd4, cells: [[-1, 0], [0, 0], [1, 0], [0, 1]] },
    S: { color: 0x6fcf7a, cells: [[-1, 0], [0, 0], [0, 1], [1, 1]] },
    Z: { color: 0xe66a5f, cells: [[1, 0], [0, 0], [0, 1], [-1, 1]] },
    J: { color: 0x5a8fe0, cells: [[-1, 0], [0, 0], [1, 0], [-1, 1]] },
    L: { color: 0xe8a04b, cells: [[-1, 0], [0, 0], [1, 0], [1, 1]] },
};
const TYPE_NAMES = Object.keys(PIECES);
const MATS = {};
for (const t of TYPE_NAMES) {
    MATS[t] = new THREE.MeshStandardMaterial({
        color: PIECES[t].color, roughness: 0.4, metalness: 0.05,
        emissive: PIECES[t].color, emissiveIntensity: 0.14,
    });
}

function cellsFor(type, rot) {
    if (type === 'O') return PIECES.O.cells;
    return PIECES[type].cells.map(([x, y]) => {
        for (let i = 0; i < mod(rot, 4); i++) [x, y] = [y, -x]; // rotate CW
        return [x, y];
    });
}

function makeBlock(material, edgeMaterial) {
    const m = new THREE.Mesh(WEDGE, material);
    m.add(new THREE.LineSegments(WEDGE_EDGES, edgeMaterial));
    return m;
}

function placeBlock(mesh, col, row) {
    mesh.rotation.y = Math.PI / 2 - col * THETA; // local +Z -> column direction
    mesh.position.y = row * BLOCK_H + GAP / 2;
}

// ---------- Game state ----------
const grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
let state = 'start'; // 'start' | 'playing' | 'over'
let score = 0, rings = 0, level = 1;
let piece = null;    // { type, rot, col, row, meshes[4] }
let nextType = null;
let bag = [];
let gravityAcc = 0;

const ghostMeshes = Array.from({ length: 4 }, () => {
    const m = makeBlock(GHOST_MAT, GHOST_EDGE_MAT);
    m.visible = false;
    scene.add(m);
    return m;
});

function bagNext() {
    if (bag.length === 0) {
        bag = [...TYPE_NAMES];
        for (let i = bag.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [bag[i], bag[j]] = [bag[j], bag[i]];
        }
    }
    return bag.pop();
}

const gravityMs = () => Math.max(120, 850 * Math.pow(0.82, level - 1));

function canPlace(type, rot, col, row) {
    for (const [dx, dy] of cellsFor(type, rot)) {
        const c = mod(col + dx, COLS), r = row + dy;
        if (r < 0) return false;
        if (r < ROWS && grid[r][c]) return false; // cells above the rim are fine
    }
    return true;
}

function spawn() {
    const type = nextType ?? bagNext();
    nextType = bagNext();
    drawNext();
    piece = {
        type, rot: 0, row: ROWS,
        col: mod(Math.round(camYaw / THETA), COLS), // spawn where the player is looking
        meshes: cellsFor(type, 0).map(() => {
            const m = makeBlock(MATS[type], EDGE_MAT);
            scene.add(m);
            return m;
        }),
    };
    updatePieceMeshes();
}

function ghostRow() {
    let r = piece.row;
    while (canPlace(piece.type, piece.rot, piece.col, r - 1)) r--;
    return r;
}

function updatePieceMeshes() {
    const cells = cellsFor(piece.type, piece.rot);
    const gRow = ghostRow();
    cells.forEach(([dx, dy], i) => {
        const c = mod(piece.col + dx, COLS);
        placeBlock(piece.meshes[i], c, piece.row + dy);
        const gr = gRow + dy;
        ghostMeshes[i].visible = gr < ROWS && gr !== piece.row + dy;
        placeBlock(ghostMeshes[i], c, gr);
    });
}

function tryMove(dCol, dRow, dRot) {
    const rot = piece.rot + (dRot || 0);
    if (!canPlace(piece.type, rot, piece.col + dCol, piece.row + dRow)) return false;
    piece.col = mod(piece.col + dCol, COLS);
    piece.row += dRow;
    piece.rot = mod(rot, 4);
    updatePieceMeshes();
    return true;
}

function rotatePiece() {
    if (piece.type === 'O') return;
    // no walls on a cylinder, so just a few simple kicks
    for (const [kc, kr] of [[0, 0], [1, 0], [-1, 0], [0, 1]]) {
        if (tryMove(kc, kr, 1)) return;
    }
}

function lockPiece() {
    const cells = cellsFor(piece.type, piece.rot);
    // topping out: any cell locked above the rim ends the game
    if (cells.some(([, dy]) => piece.row + dy >= ROWS)) return gameOver();

    const touched = new Set();
    cells.forEach(([dx, dy], i) => {
        const c = mod(piece.col + dx, COLS), r = piece.row + dy;
        grid[r][c] = piece.meshes[i];
        touched.add(r);
    });
    piece = null;
    hideGhost();
    clearFullRings([...touched]);
    if (state === 'playing') spawn();
}

function hideGhost() { ghostMeshes.forEach(m => (m.visible = false)); }

// ---------- Ring clearing ----------
const tweens = []; // { mesh, fromY, toY, t0, dur, shrink }

function clearFullRings(candidateRows) {
    const full = candidateRows.filter(r => grid[r].every(Boolean)).sort((a, b) => a - b);
    if (full.length === 0) return;

    const now = performance.now();
    for (const r of full) {
        for (const mesh of grid[r]) {
            mesh.material = new THREE.MeshBasicMaterial({ color: 0xffffff });
            tweens.push({ mesh, t0: now, dur: 140, shrink: true });
        }
    }

    // compact the grid downward
    let write = full[0];
    for (let read = full[0]; read < ROWS; read++) {
        if (full.includes(read)) continue;
        if (write !== read) {
            grid[write] = grid[read];
            for (let c = 0; c < COLS; c++) {
                const mesh = grid[write][c];
                if (mesh) tweens.push({ mesh, fromY: mesh.position.y, toY: write * BLOCK_H + GAP / 2, t0: now, dur: 140 });
            }
        }
        write++;
    }
    while (write < ROWS) grid[write++] = Array(COLS).fill(null);

    rings += full.length;
    score += [0, 100, 300, 500, 800][full.length] * level;
    level = 1 + Math.floor(rings / RINGS_PER_LEVEL);
    updateHud();
    flash(full.length >= 3 ? 0.5 : 0.25);
}

function updateTweens(now) {
    for (let i = tweens.length - 1; i >= 0; i--) {
        const t = tweens[i];
        const k = clamp((now - t.t0) / t.dur, 0, 1);
        if (t.shrink) {
            t.mesh.scale.setScalar(1 - k * 0.95);
            if (k === 1) {
                scene.remove(t.mesh);
                t.mesh.material.dispose();
                tweens.splice(i, 1);
            }
        } else {
            t.mesh.position.y = t.fromY + (t.toY - t.fromY) * k;
            if (k === 1) tweens.splice(i, 1);
        }
    }
}

// ---------- Gravity / drops ----------
function tickDown() {
    if (!tryMove(0, -1, 0)) lockPiece();
}

function softDrop() {
    if (tryMove(0, -1, 0)) { score += 1; updateHud(); }
}

function hardDrop() {
    const target = ghostRow();
    score += 2 * (piece.row - target);
    piece.row = target;
    updatePieceMeshes();
    updateHud();
    lockPiece();
}

// ---------- Camera ----------
let camYaw = 0, camPitch = 0.1;
let lastManualLook = -Infinity;

function updateCamera(dt, now) {
    if (piece && now - lastManualLook > 1200) {
        // auto-follow the falling piece
        const targetYaw = piece.col * THETA;
        const targetPitch = clamp(Math.atan2((piece.row + 0.5) * BLOCK_H - EYE, INNER_R), -0.5, 0.8);
        const k = 1 - Math.exp(-4 * dt);
        camYaw += (mod(targetYaw - camYaw + Math.PI, Math.PI * 2) - Math.PI) * k;
        camPitch += (targetPitch - camPitch) * k;
    }
    camera.lookAt(
        Math.cos(camYaw) * Math.cos(camPitch),
        EYE + Math.sin(camPitch),
        Math.sin(camYaw) * Math.cos(camPitch)
    );
}

// drag to look (mouse + touch, via pointer events)
let dragging = false, lastX = 0, lastY = 0;
renderer.domElement.addEventListener('pointerdown', e => {
    dragging = true; lastX = e.clientX; lastY = e.clientY;
});
window.addEventListener('pointerup', () => (dragging = false));
window.addEventListener('pointermove', e => {
    if (!dragging) return;
    camYaw += (e.clientX - lastX) * 0.005;
    camPitch = clamp(camPitch - (e.clientY - lastY) * 0.005, -0.6, 1.2);
    lastX = e.clientX; lastY = e.clientY;
    lastManualLook = performance.now();
});

// ---------- Danger feedback ----------
const vignette = document.getElementById('vignette');
const flashEl = document.getElementById('flash');

function stackHeight() {
    for (let r = ROWS - 1; r >= 0; r--) if (grid[r].some(Boolean)) return r + 1;
    return 0;
}

function updateDanger(now) {
    const f = clamp((stackHeight() - DANGER_ROW) / (ROWS - DANGER_ROW), 0, 1);
    vignette.style.opacity = (f * 0.65).toFixed(2);
    lamp.color.lerpColors(LAMP_WARM, LAMP_RED, f);
    lamp.intensity = 7 + f * 6 * (0.7 + 0.3 * Math.sin(now * 0.006));
}

function flash(opacity) {
    flashEl.style.transition = 'none';
    flashEl.style.opacity = opacity;
    requestAnimationFrame(() => {
        flashEl.style.transition = 'opacity .3s';
        flashEl.style.opacity = 0;
    });
}

// ---------- HUD ----------
const hud = {
    score: document.getElementById('score'),
    lines: document.getElementById('lines'),
    level: document.getElementById('level'),
};
const nextCanvas = document.getElementById('next');
const nextCtx = nextCanvas.getContext('2d');

function updateHud() {
    hud.score.textContent = score;
    hud.lines.textContent = rings;
    hud.level.textContent = level;
}

function drawNext() {
    const ctx = nextCtx;
    ctx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    if (!nextType) return;
    const cells = PIECES[nextType].cells;
    const xs = cells.map(c => c[0]), ys = cells.map(c => c[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const size = 16, pad = 2;
    const ox = (nextCanvas.width - (maxX - minX + 1) * size) / 2;
    const oy = (nextCanvas.height - (maxY - minY + 1) * size) / 2;
    ctx.fillStyle = '#' + PIECES[nextType].color.toString(16).padStart(6, '0');
    for (const [x, y] of cells) {
        ctx.fillRect(ox + (x - minX) * size + pad, oy + (maxY - y) * size + pad, size - pad * 2, size - pad * 2);
    }
}

// ---------- Game flow ----------
const overlay = document.getElementById('overlay');
const finalScore = document.getElementById('final-score');
const startBtn = document.getElementById('start-btn');

function startGame() {
    // clear any previous game
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        if (grid[r][c]) { scene.remove(grid[r][c]); grid[r][c] = null; }
    }
    if (piece) { piece.meshes.forEach(m => scene.remove(m)); piece = null; }
    tweens.length = 0;
    score = 0; rings = 0; level = 1; gravityAcc = 0;
    bag = []; nextType = null;
    updateHud();
    overlay.classList.add('hidden');
    state = 'playing';
    spawn();
}

function gameOver() {
    state = 'over';
    piece = null;
    hideGhost();
    finalScore.style.display = 'block';
    finalScore.textContent = `SCORE ${score} — ${rings} RINGS`;
    startBtn.textContent = 'PLAY AGAIN';
    overlay.classList.remove('hidden');
}

startBtn.addEventListener('click', startGame);

// ---------- Input ----------
window.addEventListener('keydown', e => {
    if (state === 'start' && (e.code === 'Space' || e.code === 'Enter')) return startGame();
    if (state === 'over' && (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyR')) return startGame();
    if (state !== 'playing' || !piece) return;
    switch (e.code) {
        case 'ArrowLeft': case 'KeyA': tryMove(-1, 0, 0); break;
        case 'ArrowRight': case 'KeyD': tryMove(1, 0, 0); break;
        case 'ArrowUp': case 'KeyW': case 'KeyX': rotatePiece(); break;
        case 'ArrowDown': case 'KeyS': softDrop(); break;
        case 'Space': e.preventDefault(); hardDrop(); break;
        default: return;
    }
    e.preventDefault();
});

// touch pads (also work with mouse)
const pad = (id, fn) => {
    const el = document.getElementById(id);
    el.addEventListener('pointerdown', e => {
        e.stopPropagation();
        if (state === 'playing' && piece) fn();
    });
};
pad('pad-left', () => tryMove(-1, 0, 0));
pad('pad-right', () => tryMove(1, 0, 0));
pad('pad-rot', rotatePiece);
pad('pad-down', softDrop);
pad('pad-drop', hardDrop);

// ---------- Main loop ----------
let lastT = performance.now();
function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;

    if (state === 'playing' && piece) {
        gravityAcc += dt * 1000;
        const iv = gravityMs();
        while (gravityAcc > iv && state === 'playing') {
            gravityAcc -= iv;
            tickDown();
        }
    }

    updateTweens(now);
    updateCamera(dt, now);
    updateDanger(now);
    renderer.render(scene, camera);
}
requestAnimationFrame(frame);

// debug hook for automated testing
window.__game = {
    get state() { return state; },
    get score() { return score; },
    get rings() { return rings; },
    get piece() { return piece && { type: piece.type, col: piece.col, row: piece.row, rot: piece.rot }; },
    stackHeight,
    startGame,
    // fill a ring except skipCol, for testing clears from the console
    fillRing(row, skipCol = -1) {
        for (let c = 0; c < COLS; c++) {
            if (c === skipCol || grid[row][c]) continue;
            const m = makeBlock(MATS.J, EDGE_MAT);
            placeBlock(m, c, row);
            scene.add(m);
            grid[row][c] = m;
        }
    },
};
