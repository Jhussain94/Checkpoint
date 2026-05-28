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
document.addEventListener('DOMContentLoaded', () => {
  showScreen('arrival');
  buildMeadowCards();
  buildLeaveForm();
  wireEvents();
  const img = document.getElementById('arrival-scene');
  if (img && img.complete) onSceneLoaded();
});

// ── SCREEN MANAGEMENT ─────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('screen-' + id);
  if (el) { el.classList.add('active'); currentScreen = id; }
  // Start the game engine when the world screen becomes active
  if (id === 'world') setTimeout(() => { if (typeof initGame === 'function') initGame(); }, 80);
}

function transitionTo(id) {
  if (id === 'world') stopLoadingAnimations(); // clean up before leaving
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
  startLoadingAnimations();  // boy walk + wind particles begin immediately
  startAmbientAudio();       // bell ambience plays throughout loading screen

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

  // Scatter wind particles (leaves + petals + sparkles)
  const container = document.getElementById('wind-particles');
  if (container && !container.childElementCount) {
    const items   = ['🍃','🌸','🍃','🌿','✦','🍃','🌸','·','🍃','✿'];
    const count   = 20;
    for (let i = 0; i < count; i++) {
      const leaf = document.createElement('span');
      leaf.className  = 'wind-leaf';
      leaf.textContent = items[i % items.length];
      leaf.style.cssText = [
        `--sz:${10 + Math.random() * 10}px`,
        `--dur:${4  + Math.random() *  5}s`,
        `--del:${     Math.random() *  7}s`,
        `--y:${10  + Math.random() * 72}%`,
        `--op:${0.5 + Math.random() * 0.4}`,
        `--rot:${160 + Math.random() * 360}deg`,
        `--lift:${-8 - Math.random() * 35}px`,
      ].join(';');
      container.appendChild(leaf);
    }
  }
}

function stopLoadingAnimations() {
  // CSS animation — nothing to cancel
  fadeOutAudio();
}

// ── AMBIENT AUDIO ─────────────────────────────────────────────
let audioStarted = false;

function startAmbientAudio() {
  const audio = document.getElementById('ambient-audio');
  if (!audio || audioStarted) return;
  audio.volume = 0.30;
  audio.play().then(() => {
    audioStarted = true;
  }).catch(() => {
    // Autoplay blocked — start on first user interaction
    const unlock = () => {
      audio.play().then(() => { audioStarted = true; });
      document.removeEventListener('click',      unlock);
      document.removeEventListener('keydown',    unlock);
      document.removeEventListener('touchstart', unlock);
    };
    document.addEventListener('click',      unlock, { once: true });
    document.addEventListener('keydown',    unlock, { once: true });
    document.addEventListener('touchstart', unlock, { once: true });
  });
}

function fadeOutAudio() {
  const audio = document.getElementById('ambient-audio');
  if (!audio || audio.paused) return;
  const tick = () => {
    if (audio.volume > 0.04) {
      audio.volume = Math.max(0, audio.volume - 0.04);
      setTimeout(tick, 50);
    } else {
      audio.pause();
      audio.volume = 0.30;
      audioStarted = false;
    }
  };
  tick();
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
    return `<iframe src="${drop.content}" height="152" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" style="border-radius:12px"></iframe>`;
  }
  if (drop.type === 'video') {
    return `<iframe src="${drop.content}" height="200" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy" style="border-radius:12px"></iframe>`;
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

function submitDrop() {
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

  saveUserDrop(drop);
  renderCheckpoints();
  buildMeadowCards();

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
    }
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
