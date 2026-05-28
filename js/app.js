/* ─────────────────────────────────────────────────────────────
   CHECKPOINT — app.js
   ──────────────────────────────────────────────────────────── */

// ── STATE ─────────────────────────────────────────────────────
let currentScreen = 'loading';
let activeDrop    = null;
let meadowOpen    = false;
let leaveOpen     = false;

const MOODS = ['hopeful','overwhelmed','nostalgic','lonely','peaceful','chaotic','inspired'];
const AREAS = [
  { id:'meadow',   label:'🎵 Media Meadow' },
  { id:'garden',   label:'🌸 Memory Garden' },
  { id:'workshop', label:'✏️ Creative Workshop' },
  { id:'forest',   label:'🌲 Lost & Found Forest' },
  { id:'corner',   label:'📍 Current Corner' },
];
const MOOD_ICONS = {
  hopeful:'✨', overwhelmed:'🌀', nostalgic:'🍂', lonely:'🌙',
  peaceful:'🌿', chaotic:'⚡', inspired:'🔥'
};
const AREA_ICONS = { meadow:'🎵', garden:'🌸', workshop:'✏️', forest:'🌲', corner:'📍' };

// ── BOOT ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await initDB();          // load drops from Supabase (or seed data)
  showScreen('arrival');
  buildMeadowCards();
  buildLeaveForm();
  wireEvents();
  const img = document.getElementById('arrival-scene');
  if (img && img.complete) onSceneLoaded();
});

// Called by drops.js real-time subscription when a new drop arrives
function onNewDropArrived(drop) {
  buildMeadowCards();
  buildNoticeBoardPins();
  showToast('✨ A new drop just appeared in the world!');
}

// Stub — checkpoint dots not rendered on the PNG map
function renderCheckpoints() {}

// ── SCREEN MANAGEMENT ─────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('screen-' + id);
  if (el) { el.classList.add('active'); currentScreen = id; }
  // Start the game engine when the world screen becomes active
  if (id === 'world') setTimeout(() => { initMapBoy(); }, 80);
}

function transitionTo(id) {
  if (id === 'world') {
    fadeOutLoadingAudio();   // fade the loading screen music
    stopLoadingAnimations();
    startAmbientAudio();     // start map ambient — direct click handler, always allowed
  }
  const from = document.getElementById('screen-' + currentScreen);
  if (from) {
    from.style.transition = 'opacity 0.7s ease';
    from.style.opacity = '0';
    setTimeout(() => { from.classList.remove('active'); from.style.opacity = ''; }, 700);
  }
  setTimeout(() => showScreen(id), 350);
}

// ── LOADING SEQUENCE ──────────────────────────────────────────
// Called by <img onload> and also from DOMContentLoaded if image is cached.
// Runs the loading bar, then enables the START button. No auto-navigation.
let loadingStarted = false;
function onSceneLoaded() {
  if (loadingStarted) return;
  loadingStarted = true;

  positionStartButton();
  startLoadingAnimations();
  startLoadingAudio();       // tropical house loop — plays on loading screen

  const fill    = document.getElementById('loading-fill');
  const text    = document.getElementById('loading-text');
  const overlay = document.getElementById('loading-overlay');
  const btn     = document.getElementById('start-btn');

  const steps = [
    { w: 18,  t: 150,  msg: 'Planting seeds...' },
    { w: 42,  t: 500,  msg: 'Waking up the campus...' },
    { w: 68,  t: 1000, msg: 'Hiding drops in the world...' },
    { w: 88,  t: 1500, msg: 'Almost ready...' },
    { w: 100, t: 1900, msg: 'Ready.' },
  ];
  steps.forEach(({ w, t, msg }) => {
    setTimeout(() => {
      if (fill) fill.style.width = w + '%';
      if (text) text.textContent = msg;
    }, t);
  });

  // After bar finishes: fade out overlay, THEN reveal START button
  setTimeout(() => {
    if (overlay) overlay.classList.add('hidden');
    // Wait for overlay fade (0.6s) before showing button or sparkles
    setTimeout(() => {
      if (btn) {
        btn.removeAttribute('disabled');
        btn.classList.add('ready');          // triggers glow + pointer
      }
      document.querySelectorAll('.sparkle').forEach(s => s.classList.add('visible'));
    }, 650);
  }, 2200);
}

// ── LOADING SCREEN ANIMATIONS ─────────────────────────────────
let boyFrameTimer = null; // kept so stopLoadingAnimations is safe to call

function startLoadingAnimations() {
  // Boy walk animation is pure CSS — no JS needed.
  startFallingLeaves();

  // Wind particles removed — falling leaves handle the leaf animation
}

function stopLoadingAnimations() {
  reduceAudioForMap();
}

function reduceAudioForMap() {
  // Audio now starts at map volume (0.12) directly — nothing to fade.
}

// ── FALLING LEAVES FROM TREES ─────────────────────────────────────
const TREE_POSITIONS = [
  { x: 9,  y: 28 },   // left-side tree canopy
  { x: 48, y: 28 },   // middle tree canopy
];

function startFallingLeaves() {
  const container = document.getElementById('falling-leaves');
  if (!container) return;

  function spawnLeaf(tree) {
    const screen = document.getElementById('screen-arrival');
    if (!screen || !screen.classList.contains('active')) return;

    const leaf = document.createElement('img');
    leaf.src       = 'img/Leaf.png';
    leaf.className = 'fall-leaf';

    const dur = 12 + Math.random() * 8;   // 12–20 seconds — very slow fall
    leaf.style.left = (tree.x + (-2 + Math.random() * 4)) + '%';
    leaf.style.top  = (tree.y + (Math.random() * 3)) + '%';
    leaf.style.setProperty('--lsz',      (14 + Math.random() * 10) + 'px');
    leaf.style.setProperty('--ldur',     dur + 's');
    leaf.style.setProperty('--leaf-dx',  (-30 + Math.random() * 60) + 'px');
    leaf.style.setProperty('--leaf-dy',  (200 + Math.random() * 120) + 'px');
    leaf.style.setProperty('--leaf-rot', (160 + Math.random() * 220) + 'deg');

    container.appendChild(leaf);
    setTimeout(() => leaf.remove(), (dur + 1) * 1000);
  }

  TREE_POSITIONS.forEach(tree => {
    function scheduleNext() {
      setTimeout(() => { spawnLeaf(tree); scheduleNext(); }, 5000 + Math.random() * 5000);
    }
    setTimeout(() => { spawnLeaf(tree); scheduleNext(); }, 1000 + Math.random() * 2000);
  });
}

// ── LOADING SCREEN AUDIO ──────────────────────────────────────
function startLoadingAudio() {
  const la = document.getElementById('loading-audio');
  if (!la) return;
  la.volume = 0.55;
  la.play().catch(() => {
    // Autoplay blocked — unlock on first gesture (before or same as START click)
    function unlockLoading() {
      la.play().catch(() => {});
      document.removeEventListener('pointerdown', unlockLoading);
      document.removeEventListener('keydown',     unlockLoading);
    }
    document.addEventListener('pointerdown', unlockLoading, { once: true });
    document.addEventListener('keydown',     unlockLoading, { once: true });
  });
}

function fadeOutLoadingAudio() {
  const la = document.getElementById('loading-audio');
  if (!la || la.paused) return;
  const tick = () => {
    if (la.volume > 0.04) {
      la.volume = Math.max(0, la.volume - 0.05);
      setTimeout(tick, 40);
    } else {
      la.pause();
      la.currentTime = 0;
    }
  };
  tick();
}

// ── AMBIENT AUDIO ─────────────────────────────────────────────
// startAmbientAudio() must be called directly from a user-gesture handler
// (e.g. a click callback) so every browser permits audio.play().
let audioStarted = false;
let audioMuted   = false;

function toggleMapAudio() {
  const audio = document.getElementById('ambient-audio');
  const btn   = document.getElementById('vol-toggle');
  if (!audio) return;
  audioMuted = !audioMuted;
  if (audioMuted) {
    audio.pause();
  } else {
    audio.volume = 0.20;
    audio.play().catch(() => {});
  }
  if (btn) btn.textContent = audioMuted ? '🔇' : '🔊';
}

function startAmbientAudio() {
  const audio = document.getElementById('ambient-audio');
  if (!audio || audioStarted) return;
  audio.volume = 0.20;
  const p = audio.play();
  if (p !== undefined) {
    p.then(() => {
      audioStarted = true;
    }).catch(err => {
      console.warn('[CHECKPOINT] audio.play() failed:', err.message || err);
      // Second chance: retry on the very next user interaction
      function retryOnce() {
        audio.play().then(() => { audioStarted = true; }).catch(() => {});
        document.removeEventListener('pointerdown', retryOnce);
        document.removeEventListener('keydown',     retryOnce);
      }
      document.addEventListener('pointerdown', retryOnce, { once: true });
      document.addEventListener('keydown',     retryOnce, { once: true });
    });
  }
}

// ── START BUTTON POSITIONING ──────────────────────────────────
// The painted START button sits at ~43.5% from left, ~31% from top
// of the original 3508×2480 illustration.
// JS measures the *rendered* image rect so the overlay lands precisely
// over the button regardless of screen size or aspect ratio.
const BTN_X = 0.440;   // horizontal centre of painted START button (~44% from left)
const BTN_Y = 0.340;   // vertical centre — shifted down to match illustration
const BTN_W = 0.120;   // button width as fraction of image width
const BTN_H = 0.065;   // button height as fraction of image height

function positionStartButton() {
  const img  = document.getElementById('arrival-scene');
  const btn  = document.getElementById('start-btn');
  const wrap = document.getElementById('arrival-img-wrap');
  if (!img || !btn || !wrap) return;

  // The image wrapper now has CSS inset/border-radius — use its rendered
  // dimensions so the button overlays the correct spot inside the frame.
  const natW = img.naturalWidth  || 3508;
  const natH = img.naturalHeight || 2480;
  const imgAspect  = natW / natH;
  const vW = wrap.clientWidth;
  const vH = wrap.clientHeight;
  const vAspect = vW / vH;

  // Cover math: find the rendered image rect (may extend beyond viewport)
  let rW, rH, oX, oY;
  if (vAspect > imgAspect) {
    // Screen wider → scale by width, crop top & bottom
    rW = vW; rH = vW / imgAspect;
    oX = 0;  oY = (vH - rH) / 2;        // oY is negative when cropped
  } else {
    // Screen taller → scale by height, crop sides
    rH = vH; rW = vH * imgAspect;
    oX = (vW - rW) / 2; oY = 0;         // oX is negative when cropped
  }

  // Position the invisible button over the painted START button
  const bW = rW * BTN_W;
  const bH = rH * BTN_H;
  btn.style.width     = bW + 'px';
  btn.style.height    = bH + 'px';
  btn.style.left      = (oX + rW * BTN_X - bW / 2) + 'px';
  btn.style.top       = (oY + rH * BTN_Y - bH / 2) + 'px';
  btn.style.transform = 'none';
}

// ── SPARKLES on arrival ───────────────────────────────────────
const SPARKLE_POSITIONS = [
  { l:'17%', t:'12%', delay:'0s' },
  { l:'72%', t:'9%',  delay:'1.2s' },
  { l:'43%', t:'18%', delay:'0.6s' },
  { l:'86%', t:'22%', delay:'2s' },
  { l:'8%',  t:'35%', delay:'1.8s' },
];

function buildSparkles() {
  const container = document.getElementById('sparkle-container');
  if (!container) return;
  container.innerHTML = '';
  SPARKLE_POSITIONS.forEach(({ l, t, delay }) => {
    const s = document.createElement('span');
    s.className = 'sparkle';
    s.textContent = '+';
    s.style.cssText = `left:${l}; top:${t}; --d:${(3.5 + Math.random()*2).toFixed(1)}s; animation-delay:${delay}`;
    container.appendChild(s);
  });
}

// ── WORLD MAP SVG ─────────────────────────────────────────────
// buildWorldMap removed — world is now a canvas game (js/game.js)

// ── GENERIC ZONE PANEL ────────────────────────────────────────
const ZONE_DESCS = {
  garden:   '🌸 Memory Garden — photos, memories, and quiet moments',
  workshop: '✏️ Creative Workshop — sketches, ideas, and experiments',
  forest:   '🌲 Lost & Found Forest — anonymous thoughts and hidden words',
  corner:   '📍 Current Corner — status updates and real-time energy',
};
const ZONE_BG = {
  garden:   'linear-gradient(160deg,#fce4ef 0%,#f4b8ce 100%)',
  workshop: 'linear-gradient(160deg,#f8e8a8 0%,#e8c870 100%)',
  forest:   'linear-gradient(160deg,#a8c890 0%,#5a8a40 100%)',
  corner:   'linear-gradient(160deg,#f8d070 0%,#f0a830 100%)',
};

function openZonePanel(zone) {
  const panel  = document.getElementById('panel-zone');
  const title  = document.getElementById('zone-panel-title');
  const desc   = document.getElementById('zone-panel-desc');
  const grid   = document.getElementById('zone-cards-grid');
  if (!panel) return;

  title.textContent = ZONE_DESCS[zone.id] || zone.name;
  desc.textContent  = 'Drops left behind by students who passed through here.';
  panel.style.background = ZONE_BG[zone.id] || 'linear-gradient(160deg,#f8e8b0,#e8c860)';

  const drops = getDrops().filter(d => d.area === zone.id);
  grid.innerHTML = drops.length ? drops.map(drop => `
    <div class="zone-card" onclick="openDrop('${drop.id}')">
      <div class="zc-icon">${MOOD_ICONS[drop.mood] || '📍'}</div>
      <p class="zc-text">"${drop.content.length > 120 ? drop.content.slice(0,120)+'…' : drop.content}"</p>
      <div class="zc-footer">
        <span class="mood-tag mood-${drop.mood}">${drop.mood}</span>
        <span style="font-size:.75rem;color:rgba(42,26,4,0.5);margin-left:auto">${formatDate(drop.timestamp)}</span>
      </div>
    </div>
  `).join('') : '<p style="opacity:.6;font-style:italic;padding:12px">No drops here yet — be the first to leave one.</p>';

  panel.classList.add('open');
}

function closeZonePanel() {
  document.getElementById('panel-zone').classList.remove('open');
}

// ── DROP MODAL ────────────────────────────────────────────────
function openDrop(dropId) {
  const drops = getDrops();
  const drop  = drops.find(d => d.id === dropId);
  if (!drop) return;
  activeDrop = drop;

  document.getElementById('drop-found-label').textContent =
    (AREA_ICONS[drop.area] || '📍') + '  Drop Found';

  document.getElementById('drop-content-inner').innerHTML = renderDropContent(drop);

  const caption = document.getElementById('drop-caption');
  if (drop.caption) { caption.textContent = drop.caption; caption.style.display = ''; }
  else              { caption.style.display = 'none'; }

  document.getElementById('drop-mood').className = 'mood-tag mood-' + drop.mood;
  document.getElementById('drop-mood').textContent = (MOOD_ICONS[drop.mood]||'') + ' ' + drop.mood;

  document.getElementById('drop-username').textContent  = drop.username || 'anonymous student';
  document.getElementById('drop-timestamp').textContent = formatDate(drop.timestamp);

  document.getElementById('modal-drop').classList.add('open');
}

function closeDrop() {
  document.getElementById('modal-drop').classList.remove('open');
  activeDrop = null;
}

function renderDropContent(drop) {
  if (drop.type === 'song' || drop.type === 'playlist') {
    return `<iframe src="${drop.content}" width="100%" height="152" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" style="border-radius:12px;display:block"></iframe>`;
  }
  if (drop.type === 'video') {
    return `<iframe src="${drop.content}" width="100%" height="220" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy" style="border-radius:12px;display:block"></iframe>`;
  }
  if (drop.type === 'photo') {
    return `<img src="${drop.content}" alt="" loading="lazy"/>`;
  }
  return `<blockquote class="drop-text-body">"${drop.content}"</blockquote>`;
}

// ── MEADOW PANEL ──────────────────────────────────────────────
function openMeadow() {
  document.getElementById('panel-meadow').classList.add('open');
  meadowOpen = true;
}
function closeMeadow() {
  document.getElementById('panel-meadow').classList.remove('open');
  meadowOpen = false;
}

function buildMeadowCards() {
  const grid = document.getElementById('meadow-grid');
  if (!grid) return;

  const meadowDrops = getDrops().filter(d => d.area === 'meadow');
  grid.innerHTML = meadowDrops.map(drop => `
    <div class="music-card" onclick="openDrop('${drop.id}')">
      <div class="mc-icon">${MOOD_ICONS[drop.mood] || '🎵'}</div>
      <p class="mc-text">"${drop.content.length > 100 ? drop.content.slice(0,100)+'…' : drop.content}"</p>
      <div class="mc-footer">
        <span class="mood-tag mood-${drop.mood}">${drop.mood}</span>
        <span style="font-size:0.75rem;color:#5a6818;margin-left:auto">${formatDate(drop.timestamp)}</span>
      </div>
    </div>
  `).join('');
}

// ── LEAVE DROP FORM ───────────────────────────────────────────
let selectedMood = '';
let selectedArea = '';

function buildLeaveForm() {
  // mood chips
  const moodRow = document.getElementById('mood-chips');
  if (moodRow) {
    moodRow.innerHTML = MOODS.map(m => `
      <div class="chip mood-${m}" data-mood="${m}" onclick="selectMood('${m}')">${MOOD_ICONS[m]} ${m}</div>
    `).join('');
  }

  // area chips
  const areaRow = document.getElementById('area-chips');
  if (areaRow) {
    areaRow.innerHTML = AREAS.map(a => `
      <div class="chip chip-${a.id}" data-area="${a.id}" onclick="selectArea('${a.id}')">${a.label}</div>
    `).join('');
  }

  // char count
  const msgArea = document.getElementById('drop-message');
  const counter = document.getElementById('char-count');
  if (msgArea && counter) {
    msgArea.addEventListener('input', () => {
      counter.textContent = msgArea.value.length + ' / 200';
    });
  }

  // anon toggle
  const anonBox  = document.getElementById('anon-check');
  const nameWrap = document.getElementById('name-field-wrap');
  if (anonBox && nameWrap) {
    anonBox.addEventListener('change', () => {
      nameWrap.style.display = anonBox.checked ? 'none' : 'block';
    });
  }
}

function selectMood(m) {
  selectedMood = m;
  document.querySelectorAll('#mood-chips .chip').forEach(c => {
    c.classList.toggle('selected', c.dataset.mood === m);
  });
}
function selectArea(a) {
  selectedArea = a;
  document.querySelectorAll('#area-chips .chip').forEach(c => {
    c.classList.toggle('selected', c.dataset.area === a);
  });
}

function openLeaveForm() {
  closeDrop();
  setTimeout(() => {
    document.getElementById('leave-form-wrap').style.display = '';
    document.getElementById('leave-success').style.display   = 'none';
    document.getElementById('modal-leave').classList.add('open');
    leaveOpen = true;
  }, 300);
}
function closeLeaveForm() {
  document.getElementById('modal-leave').classList.remove('open');
  leaveOpen = false;
}

async function submitDrop() {
  const url  = document.getElementById('drop-url').value.trim();
  const msg  = document.getElementById('drop-message').value.trim();
  const anon = document.getElementById('anon-check').checked;
  const name = document.getElementById('drop-name').value.trim();

  if (!msg && !url)    { showToast('Add a message or link first!'); return; }
  if (!selectedMood)   { showToast('Choose a mood for your drop'); return; }
  if (!selectedArea)   { showToast('Choose where to leave your drop'); return; }

  const areaZone  = AREAS.find(a => a.id === selectedArea);
  // scatter the drop randomly within the chosen zone's rough bounding box
  const zoneBounds = {
    meadow:   { x:[48,93], y:[5,38] },
    garden:   { x:[5,40],  y:[5,35] },
    workshop: { x:[33,72], y:[44,72] },
    forest:   { x:[3,42],  y:[56,86] },
    corner:   { x:[56,98], y:[56,86] },
  };
  const bounds = zoneBounds[selectedArea] || { x:[10,90], y:[10,90] };
  const rx = bounds.x[0] + Math.random() * (bounds.x[1] - bounds.x[0]);
  const ry = bounds.y[0] + Math.random() * (bounds.y[1] - bounds.y[0]);

  let type = 'text';
  let content = msg || url;
  if (url) {
    if (url.includes('spotify.com'))  { type = 'song'; content = toSpotifyEmbed(url); }
    else if (url.includes('youtube.com') || url.includes('youtu.be')) { type = 'video'; content = toYTEmbed(url); }
  }

  const drop = {
    id: 'u' + Date.now(),
    type, content,
    caption: msg && url ? msg : null,
    mood: selectedMood,
    area: selectedArea,
    timestamp: new Date().toISOString(),
    username: anon ? 'anonymous student' : (name || 'anonymous student'),
    position: { x: parseFloat(rx.toFixed(1)), y: parseFloat(ry.toFixed(1)) }
  };

  await saveUserDrop(drop);
  renderCheckpoints();
  buildMeadowCards();
  buildNoticeBoardPins(); // refresh board so new drop appears immediately

  // show success
  document.getElementById('leave-form-wrap').style.display = 'none';
  document.getElementById('leave-success').style.display   = 'block';

  // reset form
  selectedMood = ''; selectedArea = '';
  document.getElementById('drop-url').value     = '';
  document.getElementById('drop-message').value = '';
  document.getElementById('anon-check').checked = true;
  document.getElementById('name-field-wrap').style.display = 'none';
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
}

// ── EMBED HELPERS ─────────────────────────────────────────────
function toSpotifyEmbed(url) {
  // https://open.spotify.com/track/ID → embed URL
  const match = url.match(/spotify\.com\/(track|playlist|album)\/([A-Za-z0-9]+)/);
  if (match) return `https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator`;
  return url;
}
function toYTEmbed(url) {
  let id = '';
  const short = url.match(/youtu\.be\/([^?&]+)/);
  const long  = url.match(/[?&]v=([^&]+)/);
  if (short) id = short[1];
  else if (long) id = long[1];
  return id ? `https://www.youtube.com/embed/${id}` : url;
}

// ── WIRE EVENTS ───────────────────────────────────────────────
function wireEvents() {
  // re-position START button if window is resized
  window.addEventListener('resize', positionStartButton);

  // close modals on backdrop click
  document.getElementById('modal-drop').addEventListener('click', e => {
    if (e.target.id === 'modal-drop') closeDrop();
  });
  document.getElementById('modal-leave').addEventListener('click', e => {
    if (e.target.id === 'modal-leave') closeLeaveForm();
  });

  // escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (leaveOpen)        closeLeaveForm();
      else if (activeDrop)  closeDrop();
      else if (meadowOpen)  closeMeadow();
      else if (document.getElementById('panel-canvas').classList.contains('open'))       closeCanvasRoom();
      else if (document.getElementById('panel-library').classList.contains('open'))      closeLibrary();
      else if (document.getElementById('panel-noticeboard').classList.contains('open')) closeNoticeBoard();
      else if (document.getElementById('panel-camera').classList.contains('open'))      closeCameraCompass();
    }
  });

  // close panels on backdrop click
  document.getElementById('panel-canvas').addEventListener('click', e => {
    if (e.target.id === 'panel-canvas') closeCanvasRoom();
  });
  document.getElementById('panel-library').addEventListener('click', e => {
    if (e.target.id === 'panel-library') closeLibrary();
  });
  document.getElementById('panel-noticeboard').addEventListener('click', e => {
    if (e.target.id === 'panel-noticeboard') closeNoticeBoard();
  });
  document.getElementById('panel-camera').addEventListener('click', e => {
    if (e.target.id === 'panel-camera') closeCameraCompass();
  });

  buildSparkles();
}

// ── UTILS ─────────────────────────────────────────────────────
function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
}

let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

// ── MAP AVATAR ────────────────────────────────────────────────────
let mapBoyX        = 48;
let mapBoyY        = 80;
let mapBoyTarget   = null;
let mapBoyArrivalCb = null;   // fired when avatar reaches a zone target
let mapFrameTimer  = null;
let mapFrameIdx    = 0;
let mapBoyActive   = false;
let lastMapTime    = 0;
const MAP_SPEED    = 0.25;   // % per 16ms
const MAP_FRAMES   = [1, 2, 3, 2];
const mapKeys      = {};

function initMapBoy() {
  if (mapBoyActive) return;
  mapBoyActive = true;
  mapBoyTarget = null;   // clear any stale target so avatar starts idle
  stopMapWalk();         // ensure no walk cycle is running
  updateMapBoyPos();
  showMapFrame(1);

  document.addEventListener('keydown', e => { mapKeys[e.key.toLowerCase()] = true; });
  document.addEventListener('keyup',   e => { mapKeys[e.key.toLowerCase()] = false; });

  const wrap = document.getElementById('world-img-wrap');
  if (wrap) {
    wrap.addEventListener('click', e => {
      // Ignore clicks on UI overlays and any zone/action buttons
      if (e.target.closest('#world-overlay') ||
          e.target.closest('.map-zone-btn')  ||
          leaveOpen || activeDrop ||
          document.getElementById('panel-noticeboard').classList.contains('open')) return;
      const rect = wrap.getBoundingClientRect();
      const el   = document.getElementById('map-boy');
      const boyH = el ? (el.offsetHeight / wrap.offsetHeight) * 100 : 24;
      mapBoyTarget = {
        x: ((e.clientX - rect.left) / rect.width)  * 100,
        y: ((e.clientY - rect.top)  / rect.height) * 100 - boyH,
      };
    });
  }

  requestAnimationFrame(mapBoyLoop);
}

function mapBoyLoop(ts) {
  if (currentScreen !== 'world') { lastMapTime = 0; requestAnimationFrame(mapBoyLoop); return; }

  // Delta-time: consistent speed regardless of frame rate
  const dt    = lastMapTime ? Math.min(ts - lastMapTime, 50) : 16;
  lastMapTime = ts;
  const speed = MAP_SPEED * (dt / 16);

  const typing = document.activeElement &&
    (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA');

  let dx = 0, dy = 0;

  if (!typing) {
    if (mapKeys['w'] || mapKeys['arrowup'])    dy = -speed;
    if (mapKeys['s'] || mapKeys['arrowdown'])  dy =  speed;
    if (mapKeys['a'] || mapKeys['arrowleft'])  dx = -speed;
    if (mapKeys['d'] || mapKeys['arrowright']) dx =  speed;

    // Normalise diagonal movement so it isn't faster
    if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }

    // Manual key input cancels any in-progress zone walk
    if (dx !== 0 || dy !== 0) { mapBoyTarget = null; mapBoyArrivalCb = null; }
  }

  if (dx === 0 && dy === 0 && mapBoyTarget) {
    const tdx = mapBoyTarget.x - mapBoyX;
    const tdy = mapBoyTarget.y - mapBoyY;
    const dist = Math.sqrt(tdx * tdx + tdy * tdy);
    // Use a larger arrival radius for zone walks so the avatar stops naturally nearby
    const stopDist = mapBoyArrivalCb ? 5 : 0.3;
    if (dist > stopDist) {
      // Slow down in the last stretch so the avatar eases in smoothly
      const ease = dist < stopDist * 3 ? 0.5 : 1;
      dx = (tdx / dist) * speed * ease;
      dy = (tdy / dist) * speed * ease;
    } else {
      // Snap to stop — no more micro-corrections
      mapBoyTarget = null;
      stopMapWalk();
      if (mapBoyArrivalCb) {
        const cb = mapBoyArrivalCb;
        mapBoyArrivalCb = null;
        setTimeout(cb, 120); // brief pause before panel opens
      }
    }
  }

  if (dx !== 0 || dy !== 0) {
    // Clamp to frame edges using actual element dimensions
    const el   = document.getElementById('map-boy');
    const wrap = document.getElementById('world-img-wrap');
    let minX = 0, maxX = 100, minY = 0, maxY = 76;
    if (el && wrap) {
      const halfW = (el.offsetWidth  / wrap.offsetWidth)  * 50;
      const boyH  = (el.offsetHeight / wrap.offsetHeight) * 100;
      minX = halfW;
      maxX = 100 - halfW;
      maxY = 100 - boyH;
    }
    mapBoyX = Math.max(minX, Math.min(maxX, mapBoyX + dx));
    mapBoyY = Math.max(minY, Math.min(maxY, mapBoyY + dy));
    updateMapBoyPos();
    setMapBoyDir(dx);
    if (!mapFrameTimer) startMapWalk();
  } else {
    stopMapWalk();
  }

  requestAnimationFrame(mapBoyLoop);
}

function updateMapBoyPos() {
  const el = document.getElementById('map-boy');
  if (!el) return;
  el.style.left = mapBoyX + '%';
  el.style.top  = mapBoyY + '%';
}

function setMapBoyDir(dx) {
  const el = document.getElementById('map-boy');
  if (!el || dx === 0) return;
  el.style.transform = `translateX(-50%) scaleX(${dx < 0 ? -1 : 1})`;
}

function startMapWalk() {
  if (mapFrameTimer) return;
  mapFrameTimer = setInterval(() => {
    mapFrameIdx = (mapFrameIdx + 1) % MAP_FRAMES.length;
    showMapFrame(MAP_FRAMES[mapFrameIdx]);
  }, 180);
}

function stopMapWalk() {
  if (mapFrameTimer) { clearInterval(mapFrameTimer); mapFrameTimer = null; }
  showMapFrame(1);
}

function showMapFrame(n) {
  [1, 2, 3].forEach(i => {
    const f = document.getElementById('map-f' + i);
    if (f) f.style.opacity = (i === n) ? '1' : '0';
  });
}


// ══════════════════════════════════════════════════════════════════
// BLANK CANVAS ROOM
// ══════════════════════════════════════════════════════════════════

let canvasTool  = 'pen';
let canvasColor = '#2a1a04';
let brushSize   = 6;
let canvasDrawing = false;
let canvasReady   = false;

// ══════════════════════════════════════════════════════════════════
// CAMERA COMPASS
// ══════════════════════════════════════════════════════════════════

// Seed photos — students can add links at runtime (stored in sessionStorage)
const SEED_CAMERA_LINKS = [
  { url: 'https://www.instagram.com/camberwell_arts/', caption: 'Camberwell Arts Instagram', type: 'link' },
  { url: 'https://www.arts.ac.uk/colleges/camberwell-college-of-arts', caption: 'Camberwell College of Arts', type: 'link' },
];

function getCameraLinks() {
  const saved = JSON.parse(sessionStorage.getItem('cameraLinks') || '[]');
  return [...SEED_CAMERA_LINKS, ...saved];
}
function saveCameraLink(entry) {
  const existing = JSON.parse(sessionStorage.getItem('cameraLinks') || '[]');
  existing.unshift(entry);
  sessionStorage.setItem('cameraLinks', JSON.stringify(existing));
}

function openCameraCompass() {
  walkToZone(50, 28, () => {
    buildCameraGrid();
    document.getElementById('panel-camera').classList.add('open');
  });
}
function closeCameraCompass() {
  document.getElementById('panel-camera').classList.remove('open');
}

function buildCameraGrid() {
  const grid = document.getElementById('camera-grid');
  if (!grid) return;
  const links = getCameraLinks();
  if (!links.length) {
    grid.innerHTML = '<p style="color:#4060a0;font-style:italic">No photos pinned yet — share yours above.</p>';
    return;
  }
  grid.innerHTML = links.map(entry => {
    const isImg = /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(entry.url);
    const thumb = isImg
      ? `<img class="camera-card-thumb" src="${entry.url}" alt="${entry.caption || ''}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'camera-card-link-preview\\'><span>🔗</span><span>${entry.url}</span></div>'">`
      : `<div class="camera-card-link-preview"><span>🔗</span><span>${entry.url}</span></div>`;
    return `
      <div class="camera-card" onclick="window.open('${entry.url}','_blank','noopener')">
        ${thumb}
        <div class="camera-card-body">
          ${entry.caption ? `<div class="camera-card-caption">${entry.caption}</div>` : ''}
          <div class="camera-card-meta">${entry.url.replace(/^https?:\/\//,'').split('/')[0]}</div>
        </div>
      </div>`;
  }).join('');
}

function submitCameraLink() {
  const url     = document.getElementById('camera-link-input').value.trim();
  const caption = document.getElementById('camera-caption-input').value.trim();
  if (!url) { showToast('Paste a link first!'); return; }
  try { new URL(url); } catch { showToast('That doesn\'t look like a valid link.'); return; }
  saveCameraLink({ url, caption, type: 'link' });
  document.getElementById('camera-link-input').value   = '';
  document.getElementById('camera-caption-input').value = '';
  buildCameraGrid();
  showToast('📌 Pinned to the Camera Compass!');
}


// ══════════════════════════════════════════════════════════════════
// NOTICE BOARD
// ══════════════════════════════════════════════════════════════════

const SN_COLORS  = ['sn-yellow','sn-pink','sn-blue','sn-green','sn-orange'];
const SN_ROTATES = [-3, -1.5, 0, 1.5, 3, -2.5, 2, -0.5];

function openNoticeBoard() {
  walkToZone(43, 52, () => {
    buildNoticeBoardPins();
    document.getElementById('panel-noticeboard').classList.add('open');
  });
}
function closeNoticeBoard() {
  document.getElementById('panel-noticeboard').classList.remove('open');
}

function buildNoticeBoardPins() {
  const container = document.getElementById('noticeboard-pins');
  if (!container) return;
  const drops = getDrops();
  if (!drops.length) {
    container.innerHTML = '<p style="color:#a8d8a8;font-style:italic;padding:8px">No drops yet — be the first to leave one.</p>';
    return;
  }
  container.innerHTML = drops.map((drop, i) => {
    const color  = SN_COLORS[i % SN_COLORS.length];
    const rotate = SN_ROTATES[i % SN_ROTATES.length];

    let preview;
    if (drop.type === 'song' || drop.type === 'playlist') {
      preview = '🎵 ' + (drop.caption || 'A song drop');
    } else if (drop.type === 'video') {
      preview = '🎬 ' + (drop.caption || 'A video drop');
    } else {
      preview = drop.content.length > 160 ? drop.content.slice(0, 160) + '…' : drop.content;
    }

    return `
      <div class="sticky-note ${color}"
           style="transform:rotate(${rotate}deg)"
           onclick="openDrop('${drop.id}')">
        <div class="sn-text">${preview}</div>
        <div class="sn-footer">
          <span class="sn-mood">${MOOD_ICONS[drop.mood] || ''} ${drop.mood}</span>
          <span>${formatDate(drop.timestamp)}</span>
        </div>
      </div>`;
  }).join('');
}

// ── Walk the avatar to a map % position, then fire onArrival
function walkToZone(xPct, yPct, onArrival) {
  const el   = document.getElementById('map-boy');
  const wrap = document.getElementById('world-img-wrap');
  const boyH = (el && wrap) ? (el.offsetHeight / wrap.offsetHeight) * 100 : 24;
  mapBoyArrivalCb = onArrival;
  mapBoyTarget    = { x: xPct, y: yPct - boyH };  // feet land at yPct
}

function openLeaveFromPicnic() {
  walkToZone(74, 26, () => openLeaveForm());
}

function openCanvasRoom() {
  walkToZone(10, 74, () => {
    document.getElementById('panel-canvas').classList.add('open');
    if (!canvasReady) initDrawingCanvas();
  });
}
function closeCanvasRoom() {
  document.getElementById('panel-canvas').classList.remove('open');
}

function initDrawingCanvas() {
  canvasReady = true;
  const cv  = document.getElementById('drawing-canvas');
  const ctx = cv.getContext('2d');

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = cv.clientWidth, h = cv.clientHeight;
    cv.width  = w * dpr;
    cv.height = h * dpr;
    ctx.scale(dpr, dpr);
  }
  resize();
  window.addEventListener('resize', resize);

  function getPos(e) {
    const r = cv.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - r.left, y: src.clientY - r.top };
  }

  cv.addEventListener('pointerdown', e => {
    if (canvasTool === 'text') return; // handled separately
    canvasDrawing = true;
    cv.setPointerCapture(e.pointerId);
    ctx.beginPath();
    const p = getPos(e);
    ctx.moveTo(p.x, p.y);
    // Draw a dot on single click
    ctx.arc(p.x, p.y, brushSize / 2, 0, Math.PI * 2);
    applyStroke(ctx);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  });

  cv.addEventListener('pointermove', e => {
    if (!canvasDrawing) return;
    const p = getPos(e);
    if (canvasTool === 'eraser') {
      ctx.clearRect(p.x - brushSize, p.y - brushSize, brushSize * 2, brushSize * 2);
    } else {
      ctx.lineTo(p.x, p.y);
      applyStroke(ctx);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
    }
  });

  cv.addEventListener('pointerup',     () => { canvasDrawing = false; });
  cv.addEventListener('pointercancel', () => { canvasDrawing = false; });

  // Text tool: click canvas → float an input, commit on Enter/blur
  cv.addEventListener('click', e => {
    if (canvasTool !== 'text') return;
    const panel = document.querySelector('.canvas-panel-inner');
    const pr    = panel.getBoundingClientRect();
    const cvr   = cv.getBoundingClientRect();

    const inp = document.getElementById('canvas-text-input');
    // left/top relative to panel-inner so the input overlays the canvas pixel
    inp.style.left  = (e.clientX - pr.left) + 'px';
    inp.style.top   = (e.clientY - pr.top - 10) + 'px';
    inp.style.color = canvasColor;
    inp.style.display = 'block';
    inp.value = '';
    inp.focus();

    function commitText() {
      const txt = inp.value.trim();
      inp.style.display = 'none';
      if (!txt) return;
      // Canvas coords = click pos relative to canvas element
      const tx = e.clientX - cvr.left;
      const ty = e.clientY - cvr.top;
      ctx.font      = `${Math.max(14, brushSize * 2.5)}px Nunito, sans-serif`;
      ctx.fillStyle = canvasColor;
      ctx.fillText(txt, tx, ty);
      inp.removeEventListener('blur',    commitText);
      inp.removeEventListener('keydown', onKey);
    }
    function onKey(ke) {
      if (ke.key === 'Enter')  { ke.preventDefault(); commitText(); }
      if (ke.key === 'Escape') {
        inp.style.display = 'none';
        inp.removeEventListener('blur',    commitText);
        inp.removeEventListener('keydown', onKey);
      }
    }
    inp.addEventListener('blur',    commitText, { once: true });
    inp.addEventListener('keydown', onKey);
  });
}

function applyStroke(ctx) {
  ctx.strokeStyle = canvasColor;
  ctx.lineWidth   = brushSize;
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';
  ctx.stroke();
}

function setTool(t) {
  canvasTool = t;
  document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById('tool-' + t);
  if (btn) btn.classList.add('active');
  document.getElementById('drawing-canvas').style.cursor =
    t === 'eraser' ? 'cell' : t === 'text' ? 'text' : 'crosshair';
}

function setColor(c) {
  canvasColor = c;
  document.querySelectorAll('.swatch').forEach(s => s.classList.toggle('selected', s.dataset.color === c));
  document.getElementById('custom-color').value = c;
}

function updateBrushSize(v) {
  brushSize = parseInt(v, 10);
}

function clearCanvas() {
  const cv  = document.getElementById('drawing-canvas');
  const ctx = cv.getContext('2d');
  ctx.clearRect(0, 0, cv.width, cv.height);
}


// ══════════════════════════════════════════════════════════════════
// LIBRARY FOCUS TIMER
// ══════════════════════════════════════════════════════════════════

let timerInterval  = null;
let timerRemaining = 25 * 60; // default 25 min in seconds
let timerRunning   = false;

function openLibrary() {
  walkToZone(14, 44, () => {
    document.getElementById('panel-library').classList.add('open');
    syncTimerDisplay();
  });
}
function closeLibrary() {
  document.getElementById('panel-library').classList.remove('open');
}

function setTimerPreset(minutes) {
  if (timerRunning) return;
  timerRemaining = minutes * 60;
  document.getElementById('t-hours').value   = Math.floor(minutes / 60);
  document.getElementById('t-minutes').value = minutes % 60;
  document.getElementById('t-seconds').value = 0;
  syncTimerDisplay();
}

function readTimerInputs() {
  const h = parseInt(document.getElementById('t-hours').value,   10) || 0;
  const m = parseInt(document.getElementById('t-minutes').value, 10) || 0;
  const s = parseInt(document.getElementById('t-seconds').value, 10) || 0;
  return h * 3600 + m * 60 + s;
}

function syncTimerDisplay() {
  const disp = document.getElementById('timer-display');
  const total = timerRunning ? timerRemaining : readTimerInputs();
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  disp.textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  disp.classList.toggle('urgent', total <= 60 && timerRunning);
}

function toggleTimer() {
  const btn = document.getElementById('timer-start-btn');
  if (timerRunning) {
    // Pause
    clearInterval(timerInterval);
    timerRunning = false;
    btn.textContent = '▶ Resume';
    btn.classList.remove('running');
    document.getElementById('timer-note').textContent = 'Paused.';
  } else {
    // Start / resume
    if (!timerRunning && !timerInterval) {
      timerRemaining = readTimerInputs();
    }
    if (timerRemaining <= 0) { showToast('Set a time first!'); return; }
    timerRunning = true;
    btn.textContent = '⏸ Pause';
    btn.classList.add('running');
    document.getElementById('timer-note').textContent = 'Focus. You got this.';

    timerInterval = setInterval(() => {
      timerRemaining--;
      syncTimerDisplay();
      if (timerRemaining <= 0) {
        clearInterval(timerInterval);
        timerInterval = null;
        timerRunning  = false;
        btn.textContent = '▶ Start';
        btn.classList.remove('running');
        document.getElementById('timer-note').textContent = '✅ Session complete!';
        showToast('Timer finished — great work!');
      }
    }, 1000);
  }
}

function resetTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  timerRunning  = false;
  const btn = document.getElementById('timer-start-btn');
  btn.textContent = '▶ Start';
  btn.classList.remove('running');
  document.getElementById('t-hours').value   = 0;
  document.getElementById('t-minutes').value = 25;
  document.getElementById('t-seconds').value = 0;
  timerRemaining = 25 * 60;
  syncTimerDisplay();
  document.getElementById('timer-note').textContent = '';
}
