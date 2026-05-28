'use strict';
(function () {

  // ── WORLD CONFIG ──────────────────────────────────────────────────────────
  const W = 2400, H = 1600;
  const SPEED     = 3.8;
  const NEAR_DIST = 100;

  const ZONES = [
    { id:'garden',   name:'Memory Garden',        emoji:'🌸', x:480,  y:400,  r:155, fill:'#f4b8ce', ring:'#d478a8' },
    { id:'meadow',   name:'Media Meadow',          emoji:'🎵', x:1920, y:400,  r:165, fill:'#c5d848', ring:'#95a818' },
    { id:'workshop', name:'Creative Workshop',     emoji:'✏️', x:1200, y:800,  r:150, fill:'#e8c870', ring:'#b89040' },
    { id:'forest',   name:'Lost & Found Forest',   emoji:'🌲', x:480,  y:1200, r:155, fill:'#5a8a40', ring:'#2a5018' },
    { id:'corner',   name:'Current Corner',        emoji:'📍', x:1920, y:1200, r:150, fill:'#f0a830', ring:'#c07810' },
  ];

  // Dirt paths between zones
  const PATHS = [
    [480, 555, 480, 1045],
    [1920, 565, 1920, 1045],
    [635, 400, 1050, 660],
    [1765, 400, 1350, 660],
    [1200, 950, 635, 1150],
    [1200, 950, 1765, 1150],
    [1050, 800, 635, 800],
    [1350, 800, 1765, 800],
    [1200, 660, 1200, 200],   // path north from workshop
    [480, 245, 1200, 200],    // top crosspath
    [1200, 200, 1920, 245],
  ];

  // Rivers (bezier: x1,y1, cp1x,cp1y, cp2x,cp2y, x2,y2)
  const RIVERS = [
    [60,  280, 190, 430, 230, 680, 170, 950],
    [170, 950, 150, 1100, 270, 1180, 230, 1430],
    [230, 1430, 310, 1530, 580, 1570, 900, 1550],
    [900, 1550, 1150, 1530, 1420, 1560, 1680, 1540],
    [2350, 180, 2280, 360, 2220, 540, 2300, 760],
    [2300, 760, 2340, 920, 2280, 1080, 2320, 1300],
    [1100, 60,  1200, 140, 1350, 120, 1500, 80],
  ];

  // Trees
  const TREES = [
    {x:120, y:130, r:38}, {x:720, y:100, r:30}, {x:1100, y:90,  r:34},
    {x:1500,y:110, r:28}, {x:1750,y:85,  r:36}, {x:2280,y:170,  r:32},
    {x:80,  y:560, r:30}, {x:70,  y:800, r:34}, {x:90,  y:1030, r:28},
    {x:2340,y:500, r:32}, {x:2330,y:830, r:30}, {x:2310,y:1060, r:36},
    {x:190, y:1480,r:34}, {x:740, y:1500,r:30}, {x:1200,y:1520, r:32},
    {x:1660,y:1490,r:28}, {x:2100,y:1460,r:34}, {x:820, y:590,  r:28},
    {x:900, y:440, r:32}, {x:750, y:940, r:26}, {x:1460,y:530,  r:30},
    {x:1570,y:950, r:34}, {x:1400,y:1230,r:28}, {x:660, y:780,  r:32},
    {x:1730,y:730, r:30}, {x:1000,y:1350,r:26}, {x:1380,y:1410, r:32},
    {x:800, y:1280,r:28}, {x:950, y:1100,r:24}, {x:1480,y:1080, r:30},
    {x:680, y:1380,r:26}, {x:1700,y:1380,r:28}, {x:340, y:300,  r:30},
    {x:580, y:160, r:26}, {x:1050,y:170, r:28}, {x:1720,y:160,  r:30},
    {x:2050,y:220, r:32}, {x:380, y:1040,r:26}, {x:600, y:1050, r:24},
  ];

  // Overgrown dark patches
  const OVERGROWN = [
    {x:310, y:1110,rx:92, ry:58}, {x:610, y:1375,rx:78, ry:52},
    {x:185, y:1355,rx:88, ry:62}, {x:725, y:1115,rx:62, ry:42},
    {x:405, y:1490,rx:82, ry:48}, {x:1060,y:1455,rx:68, ry:44},
    {x:195, y:210, rx:65, ry:42}, {x:2155,y:1405,rx:72, ry:46},
    {x:1620,y:195, rx:58, ry:38}, {x:1060,y:1250,rx:55, ry:36},
    {x:330, y:740, rx:50, ry:34}, {x:2060,y:680, rx:55, ry:38},
  ];

  // Buildings (near Workshop and Corner zones, plus scattered)
  const BUILDINGS = [
    {x:1055,y:635, w:82,  h:68, color:'#d4be8a', roof:'#a08048'},
    {x:1158,y:614, w:114, h:78, color:'#dcc890', roof:'#b08848'},
    {x:1298,y:638, w:78,  h:62, color:'#d0b878', roof:'#a07038'},
    {x:1836,y:1076,w:98,  h:72, color:'#c8b888', roof:'#988060'},
    {x:1958,y:1064,w:88,  h:65, color:'#d0c090', roof:'#a08060'},
    {x:345, y:164, w:72,  h:58, color:'#d8c8a0', roof:'#b09060'},
    {x:1840,y:180, w:80,  h:62, color:'#d4c898', roof:'#a89060'},
    {x:1050,y:145, w:68,  h:54, color:'#dcc8a0', roof:'#b09858'},
  ];

  // Benches along paths
  const BENCHES = [
    {x:480,  y:700}, {x:480,  y:900},
    {x:1920, y:700}, {x:1920, y:900},
    {x:800,  y:612}, {x:1600, y:612},
    {x:900,  y:1105},{x:1500, y:1105},
    {x:1200, y:590}, {x:340,  y:565},
    {x:1200, y:330}, {x:700,  y:260},
    {x:1700, y:260},
  ];

  // Flower clusters — around Memory Garden and Media Meadow
  const FLOWERS = (function () {
    const out = [];
    const gardenColors = ['#ff9eb5','#ffd4e0','#ff7090','#ffb0c8','#ff80a8'];
    const meadowColors = ['#d4e840','#f0f880','#c8e020','#e8f060','#b8d820'];
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2 + i * 0.31;
      const d = 88 + (i * 43 % 130);
      out.push({
        x: 480  + Math.cos(a) * d + (i * 17 % 28) - 14,
        y: 400  + Math.sin(a) * d + (i * 23 % 28) - 14,
        color: gardenColors[i % 5], r: 3 + i % 4,
      });
    }
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * Math.PI * 2 + i * 0.42;
      const d = 95 + (i * 53 % 120);
      out.push({
        x: 1920 + Math.cos(a) * d,
        y: 400  + Math.sin(a) * d,
        color: meadowColors[i % 5], r: 3 + i % 3,
      });
    }
    return out;
  })();

  // Floating ambient lights scattered across the world
  const LIGHTS = (function () {
    const hues = [55, 80, 100, 160, 200, 270, 320];
    return Array.from({length: 50}, (_, i) => ({
      x:     90 + (i * 179 % (W - 180)),
      y:     90 + (i * 257 % (H - 180)),
      phase: i * 0.91,
      size:  1.4 + (i % 3) * 0.9,
      hue:   hues[i % hues.length],
    }));
  })();

  // ── SPRITES ───────────────────────────────────────────────────────────────
  const SPRITE_META = [
    { cx: 0.11, cy: 0.90 },
    { cx: 0.34, cy: 0.95 },
    { cx: 0.84, cy: 0.96 },
  ];
  const AVATAR_H      = 190;
  const FRAME_MS      = 150;
  const WALK_SEQUENCE = [0, 1, 2, 1];

  let sprites      = [];
  let spriteFrame  = 0;
  let walkSeqIdx   = 0;
  let lastFrameTs  = 0;
  let spritesReady = false;

  function loadSprites() {
    const names = ['Boy Walking 1.png', 'Boy Walking 2.png', 'Boy Walking 3.png'];
    let loaded = 0;
    sprites = names.map(n => {
      const img = new Image();
      img.onload = () => { loaded++; if (loaded === 3) spritesReady = true; };
      img.src = 'img/' + encodeURIComponent(n);
      return img;
    });
  }

  // ── STATE ─────────────────────────────────────────────────────────────────
  const cam    = { x: 0, y: 0 };
  const player = { x: 1200, y: 800, walkCycle: 0, moving: false, facingLeft: false };
  const keys   = {};
  let target      = null;
  let pendingZone = null;
  let canvas, ctx, raf, active = false, lastTs = 0;

  // ── PUBLIC API ────────────────────────────────────────────────────────────
  window.initGame = function () {
    if (active) return;
    canvas = document.getElementById('game-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    loadSprites();
    resize();
    canvas.addEventListener('click', onCanvasClick);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', resize);
    active = true;
    lastTs = performance.now();
    raf = requestAnimationFrame(tick);
  };

  window.stopGame = function () {
    active = false;
    cancelAnimationFrame(raf);
    if (canvas) canvas.removeEventListener('click', onCanvasClick);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('resize', resize);
  };

  // ── LOOP ──────────────────────────────────────────────────────────────────
  function tick(ts) {
    if (!active) return;
    const dt = Math.min(ts - lastTs, 50);
    lastTs = ts;
    update(dt);
    draw();
    raf = requestAnimationFrame(tick);
  }

  // ── UPDATE ────────────────────────────────────────────────────────────────
  function update(dt) {
    let vx = 0, vy = 0;
    if (keys['a'] || keys['arrowleft'])  vx -= SPEED;
    if (keys['d'] || keys['arrowright']) vx += SPEED;
    if (keys['w'] || keys['arrowup'])    vy -= SPEED;
    if (keys['s'] || keys['arrowdown'])  vy += SPEED;
    if (vx && vy) { vx *= 0.707; vy *= 0.707; }

    const usingKeys = vx !== 0 || vy !== 0;
    if (usingKeys) { target = null; pendingZone = null; }

    if (target && !usingKeys) {
      const dx = target.x - player.x, dy = target.y - player.y;
      const d  = Math.hypot(dx, dy);
      if (d < SPEED + 2) {
        player.x = target.x; player.y = target.y;
        target = null;
        if (pendingZone) {
          const z = pendingZone; pendingZone = null;
          setTimeout(() => enterZone(z), 200);
        }
      } else {
        vx = dx / d * SPEED;
        vy = dy / d * SPEED;
      }
    }

    player.x = clamp(player.x + vx, 40, W - 40);
    player.y = clamp(player.y + vy, 40, H - 40);
    player.moving = vx !== 0 || vy !== 0;

    if (player.moving) {
      player.walkCycle += dt * 0.013;
      if (vx < 0) player.facingLeft = true;
      if (vx > 0) player.facingLeft = false;
      const now = performance.now();
      if (now - lastFrameTs > FRAME_MS) {
        walkSeqIdx  = (walkSeqIdx + 1) % WALK_SEQUENCE.length;
        spriteFrame = WALK_SEQUENCE[walkSeqIdx];
        lastFrameTs = now;
      }
    } else {
      spriteFrame = 1;
      walkSeqIdx  = 1;
    }

    const tx = player.x - canvas.width  / 2;
    const ty = player.y - canvas.height / 2;
    cam.x += (tx - cam.x) * 0.12;
    cam.y += (ty - cam.y) * 0.12;
    cam.x = clamp(cam.x, 0, Math.max(0, W - canvas.width));
    cam.y = clamp(cam.y, 0, Math.max(0, H - canvas.height));
  }

  // ── DRAW ──────────────────────────────────────────────────────────────────
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(-Math.round(cam.x), -Math.round(cam.y));

    drawGround();
    drawRivers();
    drawOvergrown();
    drawPaths();
    drawGardens();
    drawBuildings();
    drawTrees();
    drawBenches();
    drawZones();
    drawDropDots();
    drawFloatingLights();
    drawAvatar();

    ctx.restore();
    drawHUD();
  }

  // ── GROUND ────────────────────────────────────────────────────────────────
  function drawGround() {
    // Warm layered grass gradient
    const g = ctx.createLinearGradient(0, 0, W * 0.7, H);
    g.addColorStop(0,   '#e6efa2');
    g.addColorStop(0.35,'#d8e87c');
    g.addColorStop(0.7, '#c8da68');
    g.addColorStop(1,   '#bcd060');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Subtle grass-dot texture
    ctx.globalAlpha = 0.055;
    ctx.fillStyle = '#90b030';
    for (let i = 0; i < 1600; i++) {
      ctx.beginPath();
      ctx.arc((i * 53 + 7) % W, (i * 79 + 13) % H, 1.2 + (i % 3), 0, 6.28);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Edge vignette — darkens world borders
    const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.28, W / 2, H / 2, W * 0.78);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(20,40,0,0.3)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  }

  // ── RIVERS ────────────────────────────────────────────────────────────────
  function drawRivers() {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Bank shadow
    ctx.strokeStyle = '#6aaccc';
    ctx.lineWidth   = 38;
    ctx.globalAlpha = 0.38;
    RIVERS.forEach(bezierStroke);

    // Water body
    ctx.strokeStyle = '#8ecce8';
    ctx.lineWidth   = 24;
    ctx.globalAlpha = 0.72;
    RIVERS.forEach(bezierStroke);

    // Highlight shimmer
    ctx.strokeStyle = '#c0e8f8';
    ctx.lineWidth   = 7;
    ctx.globalAlpha = 0.42;
    RIVERS.forEach(([x1,y1,cx1,cy1,cx2,cy2,x2,y2]) => {
      ctx.beginPath();
      ctx.moveTo(x1 + 4, y1 - 4);
      ctx.bezierCurveTo(cx1 + 4, cy1 - 4, cx2 + 4, cy2 - 4, x2 + 4, y2 - 4);
      ctx.stroke();
    });

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function bezierStroke([x1, y1, cx1, cy1, cx2, cy2, x2, y2]) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.bezierCurveTo(cx1, cy1, cx2, cy2, x2, y2);
    ctx.stroke();
  }

  // ── OVERGROWN PATCHES ─────────────────────────────────────────────────────
  function drawOvergrown() {
    ctx.save();
    OVERGROWN.forEach(({ x, y, rx, ry }) => {
      const gr = ctx.createRadialGradient(x - rx * 0.2, y - ry * 0.2, 0, x, y, Math.max(rx, ry));
      gr.addColorStop(0,   '#4a7828');
      gr.addColorStop(0.55,'#3a6020');
      gr.addColorStop(1,   'rgba(38,65,18,0)');
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0, 0, 6.28);
      ctx.globalAlpha = 0.62;
      ctx.fillStyle = gr;
      ctx.fill();

      // Dark tufts for texture
      for (let i = 0; i < 9; i++) {
        const tx = x + ((i * 41 + 7) % (rx * 2)) - rx;
        const ty = y + ((i * 59 + 11) % (ry * 2)) - ry;
        ctx.beginPath();
        ctx.arc(tx, ty, 3 + i % 4, 0, 6.28);
        ctx.fillStyle = '#285010';
        ctx.globalAlpha = 0.48;
        ctx.fill();
      }
    });
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // ── PATHS ─────────────────────────────────────────────────────────────────
  function drawPaths() {
    ctx.save();
    ctx.lineCap = 'round';
    PATHS.forEach(([x1, y1, x2, y2]) => {
      ctx.globalAlpha = 0.16;
      ctx.strokeStyle = '#806020';
      ctx.lineWidth   = 54;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();

      ctx.globalAlpha = 0.52;
      ctx.strokeStyle = '#c4a040';
      ctx.lineWidth   = 42;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();

      ctx.globalAlpha = 0.36;
      ctx.strokeStyle = '#dfc068';
      ctx.lineWidth   = 26;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    });
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // ── GARDENS ───────────────────────────────────────────────────────────────
  function drawGardens() {
    ctx.save();
    FLOWERS.forEach(({ x, y, color, r }) => {
      for (let p = 0; p < 5; p++) {
        const a = (p / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.78, 0, 6.28);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.82;
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(x, y, r * 0.52, 0, 6.28);
      ctx.fillStyle = '#ffe060';
      ctx.globalAlpha = 1;
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // ── BUILDINGS ─────────────────────────────────────────────────────────────
  function drawBuildings() {
    ctx.save();
    BUILDINGS.forEach(({ x, y, w, h, color, roof }) => {
      // Drop shadow
      ctx.fillStyle = 'rgba(0,0,0,0.13)';
      ctx.fillRect(x + 7, y + 7, w, h);

      // Body
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.92;
      ctx.fillRect(x, y, w, h);

      // Pitched roof
      ctx.beginPath();
      ctx.moveTo(x - 7, y);
      ctx.lineTo(x + w / 2, y - h * 0.46);
      ctx.lineTo(x + w + 7, y);
      ctx.closePath();
      ctx.fillStyle = roof;
      ctx.globalAlpha = 0.95;
      ctx.fill();

      // Windows
      const ww = Math.max(10, w * 0.22);
      const wh = Math.max(13, h * 0.32);
      ctx.fillStyle = 'rgba(180,220,255,0.78)';
      ctx.fillRect(x + w * 0.12, y + h * 0.2, ww, wh);
      if (w > 80) ctx.fillRect(x + w * 0.6, y + h * 0.2, ww, wh);

      // Door
      const dw = w * 0.25, dh = h * 0.38;
      ctx.fillStyle = roof;
      ctx.globalAlpha = 0.82;
      ctx.fillRect(x + (w - dw) / 2, y + h - dh, dw, dh);
    });
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // ── TREES ─────────────────────────────────────────────────────────────────
  function drawTrees() {
    TREES.forEach(({ x, y, r }) => {
      ctx.beginPath(); ctx.ellipse(x + r*0.2, y + r*0.5, r*0.7, r*0.28, 0, 0, 6.28);
      ctx.fillStyle = '#1a3008'; ctx.globalAlpha = 0.16; ctx.fill();

      ctx.beginPath(); ctx.ellipse(x, y + r*0.6, r*0.14, r*0.26, 0, 0, 6.28);
      ctx.fillStyle = '#8b5a20'; ctx.globalAlpha = 0.88; ctx.fill();

      ctx.beginPath(); ctx.arc(x, y, r, 0, 6.28);
      ctx.fillStyle = '#4a8020'; ctx.globalAlpha = 0.9; ctx.fill();

      ctx.beginPath(); ctx.arc(x - r*0.28, y - r*0.28, r*0.46, 0, 6.28);
      ctx.fillStyle = '#80c040'; ctx.globalAlpha = 0.32; ctx.fill();
      ctx.globalAlpha = 1;
    });
  }

  // ── BENCHES ───────────────────────────────────────────────────────────────
  function drawBenches() {
    ctx.save();
    BENCHES.forEach(({ x, y }) => {
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.13)';
      ctx.fillRect(x - 22, y + 11, 44, 7);

      // Back rest
      ctx.fillStyle = '#c4943a';
      ctx.globalAlpha = 0.9;
      ctx.fillRect(x - 22, y - 10, 44, 5);
      ctx.fillRect(x - 20, y - 14, 5, 14);
      ctx.fillRect(x + 15, y - 14, 5, 14);

      // Seat
      ctx.fillStyle = '#d4a848';
      ctx.fillRect(x - 22, y, 44, 7);

      // Legs
      ctx.fillStyle = '#8b6020';
      ctx.fillRect(x - 17, y + 7, 5, 11);
      ctx.fillRect(x + 12, y + 7, 5, 11);
    });
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // ── ZONES ─────────────────────────────────────────────────────────────────
  function drawZones() {
    const t = performance.now();
    ZONES.forEach(z => {
      const near = isNear(z);

      if (near) {
        const pulse = 0.22 + 0.10 * Math.sin(t * 0.003);
        ctx.beginPath(); ctx.arc(z.x, z.y, z.r + 28, 0, 6.28);
        ctx.fillStyle = z.fill; ctx.globalAlpha = pulse; ctx.fill();
        ctx.globalAlpha = 1;
      }

      const gr = ctx.createRadialGradient(z.x - z.r*0.2, z.y - z.r*0.2, 0, z.x, z.y, z.r);
      gr.addColorStop(0, lighten(z.fill, 0.12)); gr.addColorStop(1, z.fill);
      ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, 6.28);
      ctx.globalAlpha = near ? 0.38 : 0.24; ctx.fillStyle = gr; ctx.fill();
      ctx.strokeStyle = z.ring; ctx.lineWidth = near ? 3 : 2;
      ctx.globalAlpha = near ? 0.9 : 0.55; ctx.stroke(); ctx.globalAlpha = 1;

      ctx.font = '28px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.globalAlpha = 0.92;
      ctx.fillText(z.emoji, z.x, z.y - 18);

      ctx.font = '700 15px "Fredoka One", cursive';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText(z.name, z.x + 1, z.y + 9);
      ctx.fillStyle = '#2a1a04';
      ctx.fillText(z.name, z.x, z.y + 8);
      ctx.globalAlpha = 1;

      if (near) {
        const label = 'Press  E  ·  click to enter';
        ctx.font = 'bold 12px Nunito, sans-serif';
        const tw = ctx.measureText(label).width;
        const px = z.x - tw / 2 - 14, py = z.y - z.r - 32;
        ctx.fillStyle = 'rgba(253,248,236,0.96)';
        roundRect(px, py, tw + 28, 26, 11); ctx.fill();
        ctx.strokeStyle = 'rgba(139,96,20,0.3)'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = '#5a3a08'; ctx.textAlign = 'center';
        ctx.fillText(label, z.x, py + 13);
      }
    });
  }

  // ── CHECKPOINT DOTS ───────────────────────────────────────────────────────
  function drawDropDots() {
    if (typeof getDrops !== 'function') return;
    const pulse = (Math.sin(performance.now() * 0.003) + 1) / 2;
    getDrops().forEach(d => {
      const wx = d.position.x / 100 * W;
      const wy = d.position.y / 100 * H;
      ctx.beginPath(); ctx.arc(wx, wy, 7 + pulse * 5, 0, 6.28);
      ctx.strokeStyle = '#ffe040'; ctx.lineWidth = 2;
      ctx.globalAlpha = 0.65 - pulse * 0.28; ctx.stroke();
      ctx.beginPath(); ctx.arc(wx, wy, 4.5, 0, 6.28);
      ctx.fillStyle = '#ffe040'; ctx.globalAlpha = 1; ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  // ── FLOATING LIGHTS ───────────────────────────────────────────────────────
  function drawFloatingLights() {
    const t = performance.now() * 0.001;
    ctx.save();
    LIGHTS.forEach(l => {
      const bobY  = Math.sin(t + l.phase) * 10;
      const pulse = 0.4 + 0.6 * Math.sin(t * 1.4 + l.phase);
      const lx = l.x, ly = l.y + bobY;

      const gl = ctx.createRadialGradient(lx, ly, 0, lx, ly, l.size * 7);
      gl.addColorStop(0,   `hsla(${l.hue},90%,80%,${0.38 * pulse})`);
      gl.addColorStop(0.5, `hsla(${l.hue},80%,70%,${0.14 * pulse})`);
      gl.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.fillStyle = gl;
      ctx.beginPath(); ctx.arc(lx, ly, l.size * 7, 0, 6.28);
      ctx.fill();

      ctx.beginPath(); ctx.arc(lx, ly, l.size * (0.55 + 0.45 * pulse), 0, 6.28);
      ctx.fillStyle = `hsla(${l.hue},100%,92%,${0.65 + 0.35 * pulse})`;
      ctx.fill();
    });
    ctx.restore();
  }

  // ── AVATAR ────────────────────────────────────────────────────────────────
  function drawAvatar() {
    const img  = sprites[spriteFrame];
    const meta = SPRITE_META[spriteFrame];
    const bob  = player.moving ? Math.sin(player.walkCycle) * 4 : 0;

    ctx.save();
    ctx.translate(player.x, player.y + bob);

    const shadowScaleX = 1 - bob * 0.018;
    const shadowAlpha  = 0.22 - bob * 0.008;
    ctx.beginPath();
    ctx.ellipse(0, 4, Math.max(8, 14 * shadowScaleX), 5, 0, 0, 6.28);
    ctx.fillStyle = `rgba(0,0,0,${Math.max(0.10, shadowAlpha)})`;
    ctx.fill();

    if (spritesReady && img && img.complete && img.naturalWidth) {
      const scale = AVATAR_H / (img.naturalHeight * 0.90);
      const rendW = img.naturalWidth  * scale;
      const rendH = img.naturalHeight * scale;
      const drawX = -(meta.cx * rendW);
      const drawY = -(meta.cy * rendH);
      if (player.facingLeft) ctx.scale(-1, 1);
      ctx.drawImage(img, drawX, drawY, rendW, rendH);
    } else {
      ctx.beginPath(); ctx.arc(0, -20, 14, 0, 6.28);
      ctx.fillStyle = '#f0c898'; ctx.fill();
      ctx.strokeStyle = '#c89060'; ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.restore();
  }

  // ── HUD ───────────────────────────────────────────────────────────────────
  function drawHUD() {
    const hint = 'WASD / ↑←↓→  ·  click to move  ·  E to enter zone';
    ctx.font = '12px Nunito, sans-serif';
    const tw = ctx.measureText(hint).width;
    ctx.fillStyle = 'rgba(42,26,4,0.62)';
    roundRect(14, canvas.height - 44, tw + 28, 30, 10); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(hint, 28, canvas.height - 29);
  }

  // ── INPUT ─────────────────────────────────────────────────────────────────
  function onKeyDown(e) {
    if (!active) return;
    const k = e.key.toLowerCase();
    keys[k] = true;
    if (['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k))
      e.preventDefault();
    if (k === 'e' || k === 'enter') {
      const z = nearestZone();
      if (z) enterZone(z);
    }
  }
  function onKeyUp(e) { keys[e.key.toLowerCase()] = false; }

  function onCanvasClick(e) {
    if (!active) return;
    const r  = canvas.getBoundingClientRect();
    const wx = e.clientX - r.left + cam.x;
    const wy = e.clientY - r.top  + cam.y;
    const z  = ZONES.find(z => Math.hypot(wx - z.x, wy - z.y) < z.r);
    if (z) { target = { x: z.x, y: z.y }; pendingZone = z; return; }
    target = { x: clamp(wx, 40, W-40), y: clamp(wy, 40, H-40) };
    pendingZone = null;
  }

  // ── ZONE ENTRY ────────────────────────────────────────────────────────────
  function enterZone(zone) {
    if (zone.id === 'meadow') {
      if (typeof openMeadow    === 'function') openMeadow();
    } else {
      if (typeof openZonePanel === 'function') openZonePanel(zone);
    }
  }

  // ── HELPERS ───────────────────────────────────────────────────────────────
  function nearestZone() { return ZONES.find(z => isNear(z)) || null; }
  function isNear(z)     { return Math.hypot(player.x - z.x, player.y - z.y) < z.r + NEAR_DIST; }
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

  function lighten(hex, t) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.min(255, (n >> 16)        + t * 255 | 0);
    const g = Math.min(255, ((n >> 8) & 0xff)+ t * 255 | 0);
    const b = Math.min(255, (n & 0xff)       + t * 255 | 0);
    return `rgb(${r},${g},${b})`;
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y);
    ctx.arcTo(x+w, y,   x+w, y+r,   r); ctx.lineTo(x+w, y+h-r);
    ctx.arcTo(x+w, y+h, x+w-r, y+h, r); ctx.lineTo(x+r, y+h);
    ctx.arcTo(x, y+h,   x, y+h-r,   r); ctx.lineTo(x, y+r);
    ctx.arcTo(x, y,     x+r, y,      r); ctx.closePath();
  }

  function resize() {
    if (!canvas) return;
    canvas.width  = (canvas.parentElement || document.body).clientWidth;
    canvas.height = (canvas.parentElement || document.body).clientHeight;
    cam.x = clamp(player.x - canvas.width  / 2, 0, Math.max(0, W - canvas.width));
    cam.y = clamp(player.y - canvas.height / 2, 0, Math.max(0, H - canvas.height));
  }

})();
