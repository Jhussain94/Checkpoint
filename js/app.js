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
// UI must init immediately — never block on Firebase/Supabase network calls.
document.addEventListener('DOMContentLoaded', () => {
  showScreen('arrival');
  buildMeadowCards();
  buildLeaveForm();
  wireEvents();
  bootArrivalScene();

  initDB().catch(err => console.error('[Checkpoint] initDB error —', err.message));
  initFirebaseInteractive().catch(err => console.error('[Checkpoint] Firebase init error —', err.message));
});

// ── INTRO OVERLAY ─────────────────────────────────────────────
function maybeShowIntro() {
  if (localStorage.getItem('checkpoint_intro_v1')) return;
  const el = document.getElementById('intro-overlay');
  if (el) el.style.display = 'flex';
}

function dismissIntro() {
  localStorage.setItem('checkpoint_intro_v1', '1');
  const el = document.getElementById('intro-overlay');
  if (!el) return;
  el.classList.add('intro-fading');
  setTimeout(() => { el.style.display = 'none'; el.classList.remove('intro-fading'); }, 520);
}

/** Start loading sequence once the arrival illustration is ready. */
function bootArrivalScene() {
  const img = document.getElementById('arrival-scene');
  if (!img) {
    console.warn('[Checkpoint] Arrival image missing — enabling start');
    onSceneLoaded();
    return;
  }

  const start = () => onSceneLoaded();

  if (img.complete) start();
  else {
    img.addEventListener('load', start, { once: true });
    img.addEventListener('error', () => {
      console.warn('[Checkpoint] Arrival image failed to load — enabling start anyway');
      start();
    }, { once: true });
  }

  // Fallback if image load hangs
  setTimeout(() => {
    if (!loadingStarted) {
      console.warn('[Checkpoint] Arrival load timeout — enabling start');
      onSceneLoaded();
    }
  }, 8000);
}

// Called by drops.js real-time subscription when a new drop arrives
function onNewDropArrived(drop) {
  buildMeadowCards();
  buildNoticeBoardPins();
  showToast('✨ A new drop just appeared in the world!');
}

// Stub — checkpoint dots not rendered on the PNG map
function renderCheckpoints() {}

// ── SCREEN MANAGEMENT ─────────────────────────────────────────
const USERNAME_KEY = 'checkpointUsername';
const FAKE_ONLINE_NAMES = [
  'printroom', 'sketchbook', 'critsoon', 'librarykid', 'workshop',
  'risoriso', 'canteen', 'camberwellkid', 'studio3', 'latecrits',
  'moodboard', 'mediaunit', 'artsbar', 'lecture9', 'linoink',
];

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('screen-' + id);
  if (el) { el.classList.add('active'); currentScreen = id; }
  if (id === 'nickname') prepNicknamePage();
  if (id === 'world') {
    setTimeout(() => { initMapBoy(); }, 80);
    setTimeout(() => { maybeShowIntro(); }, 400);
  }
}

function transitionTo(id) {
  if (id === 'world') {
    fadeOutLoadingAudio();
    stopLoadingAnimations();
    startAmbientAudio();
  } else if (id === 'nickname' && (currentScreen === 'arrival' || currentScreen === 'loading')) {
    fadeOutLoadingAudio();
    stopLoadingAnimations();
  }
  const from = document.getElementById('screen-' + currentScreen);
  if (from) {
    from.style.transition = 'opacity 0.7s ease';
    from.style.opacity = '0';
    setTimeout(() => { from.classList.remove('active'); from.style.opacity = ''; }, 700);
  }
  setTimeout(() => showScreen(id), 350);
}

function prepNicknamePage() {
  const input = document.getElementById('nickname-input');
  const err   = document.getElementById('nickname-error');
  if (err) { err.textContent = ''; err.classList.remove('visible'); }
  if (input) {
    input.value = localStorage.getItem(USERNAME_KEY) || '';
    setTimeout(() => input.focus(), 400);
  }
}

function submitNickname() {
  const input = document.getElementById('nickname-input');
  const err   = document.getElementById('nickname-error');
  if (!input) return;

  const name = input.value.trim();
  if (!name) {
    if (err) {
      err.textContent = 'pick a nickname first';
      err.classList.add('visible');
    }
    input.focus();
    return;
  }

  localStorage.setItem(USERNAME_KEY, name.slice(0, 12));
  if (err) err.classList.remove('visible');
  transitionTo('world');
}

function renderStudyOnlineList() {
  const el = document.getElementById('study-laptop-online');
  if (!el) return;

  const user = localStorage.getItem(USERNAME_KEY) || 'guest';
  const pool = FAKE_ONLINE_NAMES.filter(n => n !== user).sort(() => Math.random() - 0.5);
  const count = 2 + Math.floor(Math.random() * 3);
  const others = pool.slice(0, count);
  const safeUser = user.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  el.innerHTML =
    '<div class="study-online-label">online now</div>' +
    '<ul class="study-online-list">' +
    `<li class="is-you">• ${safeUser}</li>` +
    others.map(n => {
      const safe = n.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `<li>• ${safe}</li>`;
    }).join('') +
    '</ul>';

  const longest = Math.max(user.length, ...others.map(n => n.length), 10);
  const fs = longest > 12 ? 11 : longest > 10 ? 12 : longest > 8 ? 13 : 15;
  el.style.setProperty('--study-online-fs', fs + 'px');
  el.style.display = '';
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
let fallLeavesActive = false;

const ARRIVAL_LEAF_FILES = [
  'img/page%202/%20Yellow%20Leaf.png',
  'img/page%202/2%20Leaf.png',
  'img/page%202/green%20leaf.png',
  'img/page%202/Orange%20Leaf.png',
  'img/page%202/red%20leaf.png',
];
const FALL_LEAF_COUNT = 10;
/* PNGs are full-canvas exports — leaf art is ~14% of image width */
const LEAF_ART_FRAC = 0.14;
const LEFT_TREE_ZONE = { xMin: 2, xMax: 14, yMin: 20, yMax: 38 };

function getRandomArrivalLeafSrc() {
  return ARRIVAL_LEAF_FILES[Math.floor(Math.random() * ARRIVAL_LEAF_FILES.length)];
}

function startLoadingAnimations() {
  startFallingLeaves();
}

function stopLoadingAnimations() {
  fallLeavesActive = false;
  const container = document.getElementById('falling-leaves');
  if (container) container.innerHTML = '';
  reduceAudioForMap();
}

function setLeafDriftPath(leaf, driftX, driftY, rot) {
  const swayAmp  = 6 + Math.random() * 10;
  const swayFreq = 1.2 + Math.random() * 0.6;
  const phase    = Math.random() * Math.PI * 2;
  const steps    = [0.16, 0.34, 0.52, 0.70, 0.88];

  steps.forEach((t, i) => {
    const sway = Math.sin(phase + t * Math.PI * swayFreq) * swayAmp;
    leaf.style.setProperty(`--leaf-dx${i + 1}`, (driftX * t + sway).toFixed(1) + 'px');
    leaf.style.setProperty(`--leaf-dy${i + 1}`, (driftY * t).toFixed(1) + 'px');
    leaf.style.setProperty(`--leaf-rot${i + 1}`, (rot * t).toFixed(1) + 'deg');
  });

  const endSway = Math.sin(phase + Math.PI * swayFreq) * swayAmp * 0.4;
  leaf.style.setProperty('--leaf-dx',  (driftX + endSway).toFixed(1) + 'px');
  leaf.style.setProperty('--leaf-dy',  driftY.toFixed(1) + 'px');
  leaf.style.setProperty('--leaf-rot', rot.toFixed(1) + 'deg');
}

function buildLoopingLeaf(container, wrapW, wrapH, index) {
  const visibleW = 8 + Math.random() * 10;
  const imgW     = visibleW / LEAF_ART_FRAC;
  const dur      = 7 + Math.random() * 7;
  const delay    = index * 1.4 + Math.random() * 5;
  const driftX   = wrapW * (0.45 + Math.random() * 0.45);
  const driftY   = wrapH * (0.10 + Math.random() * 0.16);
  const rot      = 100 + Math.random() * 260;

  const leaf = document.createElement('img');
  leaf.src       = getRandomArrivalLeafSrc();
  leaf.className = 'fall-leaf';
  leaf.alt       = '';
  leaf.style.left = (LEFT_TREE_ZONE.xMin + Math.random() * (LEFT_TREE_ZONE.xMax - LEFT_TREE_ZONE.xMin)) + '%';
  leaf.style.top  = (LEFT_TREE_ZONE.yMin + Math.random() * (LEFT_TREE_ZONE.yMax - LEFT_TREE_ZONE.yMin)) + '%';
  leaf.style.width = imgW.toFixed(1) + 'px';
  leaf.style.animationDuration = dur.toFixed(1) + 's';
  leaf.style.animationDelay    = delay.toFixed(1) + 's';
  setLeafDriftPath(leaf, driftX, driftY, rot);

  container.appendChild(leaf);
}

function startFallingLeaves() {
  const container = document.getElementById('falling-leaves');
  const wrap = document.getElementById('arrival-img-wrap');
  if (!container || !wrap) return;

  fallLeavesActive = true;
  container.innerHTML = '';

  function plant() {
    if (!fallLeavesActive) return;
    container.innerHTML = '';
    const wrapW = wrap.offsetWidth  || 700;
    const wrapH = wrap.offsetHeight || 500;
    for (let i = 0; i < FALL_LEAF_COUNT; i++) {
      buildLoopingLeaf(container, wrapW, wrapH, i);
    }
  }

  requestAnimationFrame(() => requestAnimationFrame(plant));
}

function reduceAudioForMap() {
  // Audio now starts at map volume (0.12) directly — nothing to fade.
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
  const btn  = document.getElementById('start-btn');
  const wrap = document.getElementById('arrival-img-wrap');
  if (!btn || !wrap) return;

  // Wrapper is now aspect-ratio locked to exactly match the illustration —
  // wrapper pixels map 1:1 to image fractions, no cover offset needed.
  const vW = wrap.clientWidth;
  const vH = wrap.clientHeight;

  const bW = vW * BTN_W;
  const bH = vH * BTN_H;
  btn.style.width  = bW + 'px';
  btn.style.height = bH + 'px';
  btn.style.left   = (vW * BTN_X - bW / 2) + 'px';
  btn.style.top    = (vH * BTN_Y - bH / 2) + 'px';
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
let _audioPausedForDrop = false;

function openDrop(dropId) {
  const drops = getDrops();
  const drop  = drops.find(d => d.id === dropId);
  if (!drop) return;
  activeDrop = drop;

  // Pause background music when a video or song drop opens
  const isMedia = drop.type === 'video' || drop.type === 'song' || drop.type === 'playlist' || drop.type === 'tiktok';
  if (isMedia && !audioMuted) {
    const ambient = document.getElementById('ambient-audio');
    if (ambient && !ambient.paused) {
      ambient.pause();
      _audioPausedForDrop = true;
    }
  }

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

  // Clear iframe after animation so embedded audio stops immediately
  setTimeout(() => {
    const inner = document.getElementById('drop-content-inner');
    if (inner) inner.innerHTML = '';
  }, 480);

  // Resume background music if it was paused for the drop
  if (_audioPausedForDrop) {
    _audioPausedForDrop = false;
    const ambient = document.getElementById('ambient-audio');
    if (ambient) ambient.play().catch(() => {});
  }
}

function renderDropContent(drop) {
  if (drop.type === 'tiktok') {
    return `<iframe src="${drop.content}" style="border-radius:14px;display:block;width:100%;max-width:340px;height:700px;margin:0 auto" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
  }
  if (drop.type === 'song' || drop.type === 'playlist') {
    return `<iframe src="${drop.content}" width="100%" height="352" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" style="border-radius:14px;display:block"></iframe>`;
  }
  if (drop.type === 'video') {
    const isYT = drop.content.includes('youtube') || drop.content.includes('youtu.be');
    if (isYT) {
      const ytId = drop.content.match(/embed\/([^?&/]+)/);
      if (ytId) {
        const id  = ytId[1];
        const src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
        const watchUrl = `https://www.youtube.com/watch?v=${id}`;
        const thumb = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
        return `
          <div class="yt-thumb-wrap" onclick="playYTEmbed('${id}', this)">
            <img class="yt-thumb-img" src="${thumb}" alt="Video thumbnail"/>
            <div class="yt-play-btn">▶</div>
          </div>
          <a href="${watchUrl}" target="_blank" rel="noopener" class="yt-watch-link">Open on YouTube ↗</a>`;
      }
    }
    if (drop.content.includes('vimeo.com')) {
      return `<iframe src="${drop.content}" width="100%" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen style="border-radius:14px;display:block;aspect-ratio:16/9;height:auto"></iframe>`;
    }
    return `<video src="${drop.content}" controls playsinline style="width:100%;border-radius:14px;display:block;aspect-ratio:16/9;background:#000;max-height:65vh"></video>`;
  }
  if (drop.type === 'audio') {
    return `<audio src="${drop.content}" controls style="width:100%;border-radius:14px;display:block;margin:8px 0"></audio>`;
  }
  if (drop.type === 'photo') {
    return `<img src="${drop.content}" alt="" loading="lazy"/>`;
  }
  if (/^https?:\/\//i.test(drop.content)) {
    return `<div class="drop-link-wrap"><a href="${drop.content}" target="_blank" rel="noopener noreferrer" class="drop-link">${drop.content}</a></div>`;
  }
  return `<blockquote class="drop-text-body">"${drop.content}"</blockquote>`;
}

function playYTEmbed(id, wrap) {
  wrap.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0"
    width="100%" frameborder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowfullscreen
    style="border-radius:14px;display:block;aspect-ratio:16/9;height:auto"></iframe>`;
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
function toTikTokEmbed(url) {
  const match = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
  if (match) return `https://www.tiktok.com/embed/v2/${match[1]}`;
  return url;
}
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
  return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0` : url;
}

// ── WIRE EVENTS ───────────────────────────────────────────────
function wireEvents() {
  // re-position START button if window is resized
  window.addEventListener('resize', positionStartButton);

  const startBtn = document.getElementById('start-btn');
  if (startBtn) {
    startBtn.addEventListener('click', e => {
      if (startBtn.disabled || !startBtn.classList.contains('ready')) return;
      e.preventDefault();
      transitionTo('nickname');
    });
  }

  const nicknameInput = document.getElementById('nickname-input');
  const nicknameBtn   = document.getElementById('nickname-enter-btn');
  if (nicknameBtn) {
    nicknameBtn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      submitNickname();
    });
  }
  if (nicknameInput) {
    nicknameInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') e.preventDefault();
    });
    nicknameInput.addEventListener('input', () => {
      const err = document.getElementById('nickname-error');
      if (err) err.classList.remove('visible');
    });
  }

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
      if (document.getElementById('screen-study').classList.contains('active')) { backFromStudy(); return; }
      if (document.getElementById('screen-your-drops').classList.contains('active')) { backToMap(); return; }
      if (document.getElementById('screen-leave-page').classList.contains('active')) { backToMap(); return; }
      if (leaveOpen)        closeLeaveForm();
      else if (activeDrop)  closeDrop();
      else if (meadowOpen)  closeMeadow();
      else if (document.getElementById('panel-canvas').classList.contains('open'))       closeCanvasRoom();
      else if (document.getElementById('panel-library').classList.contains('open'))      closeLibrary();
      else if (document.getElementById('screen-noticeboard').classList.contains('active')) { backToMap(); return; }
      else if (document.getElementById('screen-camera').classList.contains('active'))    backFromCamera();
    }
  });

  // close panels on backdrop click
  document.getElementById('panel-canvas').addEventListener('click', e => {
    if (e.target.id === 'panel-canvas') closeCanvasRoom();
  });
  document.getElementById('panel-library').addEventListener('click', e => {
    if (e.target.id === 'panel-library') closeLibrary();
  });

  buildSparkles();

  // ── Notice board keyboard guard ───────────────────────────────
  // When the notice board screen is active, ALL keyboard input is
  // restricted to #nb-note-input. Typing anywhere else redirects
  // focus into the textarea so text can only enter the white box.
  document.addEventListener('keydown', e => {
    const screen = document.getElementById('screen-noticeboard');
    if (!screen || !screen.classList.contains('active')) return;

    const inp = document.getElementById('nb-note-input');
    if (!inp) return;

    // Allow browser shortcuts, Escape (back), Tab (to post/back buttons)
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Escape' || e.key === 'Tab') return;

    // If focus is already on the textarea, let it handle the key normally
    if (document.activeElement === inp) return;

    // Any other key typed outside the textarea → steal focus back and
    // insert the character into the textarea so no input is lost
    e.preventDefault();
    e.stopPropagation();
    inp.focus();

    if (e.key === 'Backspace') {
      const s = inp.selectionStart, end = inp.selectionEnd;
      if (s !== end) { inp.value = inp.value.slice(0, s) + inp.value.slice(end); inp.selectionStart = inp.selectionEnd = s; }
      else if (s > 0) { inp.value = inp.value.slice(0, s - 1) + inp.value.slice(s); inp.selectionStart = inp.selectionEnd = s - 1; }
    } else if (e.key === 'Enter') {
      const s = inp.selectionStart;
      inp.value = inp.value.slice(0, s) + '\n' + inp.value.slice(s);
      inp.selectionStart = inp.selectionEnd = s + 1;
    } else if (e.key.length === 1) {
      const s = inp.selectionStart, end = inp.selectionEnd;
      inp.value = inp.value.slice(0, s) + e.key + inp.value.slice(end);
      inp.selectionStart = inp.selectionEnd = s + 1;
    }
  }, true); // capture phase so it runs before anything else

  // Prevent clicks outside the textarea from giving focus to other
  // editable elements while the notice board is visible
  document.addEventListener('focusin', e => {
    const screen = document.getElementById('screen-noticeboard');
    if (!screen || !screen.classList.contains('active')) return;
    const inp  = document.getElementById('nb-note-input');
    const post = document.getElementById('nb-post-btn');
    const back = document.getElementById('nb-back');
    if (e.target !== inp && e.target !== post && e.target !== back) {
      // Redirect focus to textarea without preventing default
      // (preventing default here can block button clicks)
      setTimeout(() => { if (inp) inp.focus(); }, 0);
    }
  }, true);

  // Notice board post button — single listener only (no inline onclick)
  const nbPost = document.getElementById('nb-post-btn');
  if (nbPost) {
    nbPost.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      submitNoticeBoardNote(e);
    });
  }

  // Disable post button when textarea is empty, enable when it has text
  const nbTa = document.getElementById('nb-note-input');
  if (nbTa && nbPost) {
    const _nbSync = () => {
      const empty = nbTa.value.trim() === '';
      nbPost.classList.toggle('nb-btn-empty', empty);
      nbPost.setAttribute('aria-disabled', empty ? 'true' : 'false');
    };
    nbTa.addEventListener('input', _nbSync);
    _nbSync(); // run once on load
  }

  // Post notice board note with Enter (Shift+Enter for newline)
  const nbInput = document.getElementById('nb-note-input');
  if (nbInput) {
    nbInput.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submitNoticeBoardNote(e);
      }
    });
  }
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
          document.getElementById('screen-noticeboard').classList.contains('active')) return;
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
  walkToZone(50, 28, () => showCameraScreen());
}
function closeCameraCompass() {
  backFromCamera();
}

function showCameraScreen() {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-camera').classList.add('active');
  ccBuildGrid();
}

function backFromCamera() {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-world').classList.add('active');
  currentScreen = 'world';
  Object.keys(mapKeys).forEach(k => { delete mapKeys[k]; });
  if (document.activeElement && document.activeElement !== document.body) {
    document.activeElement.blur();
  }
}

function ccTriggerUpload() {
  document.getElementById('cc-file-input').click();
}

function ccSetUploadStatus(msg) {
  const el = document.getElementById('cc-upload-status');
  if (!el) return;
  // Keep on-page status minimal — full errors go to toast/console only
  el.textContent = msg || '';
}

async function ccHandleUpload(input) {
  const file = input.files[0];
  if (!file) return;

  console.log('[Checkpoint] Campus Camera: file selected —', file.name, file.type, file.size + ' bytes');

  const validationError = validateCampusImageFile(file);
  if (validationError) {
    console.error('[Checkpoint] Campus Camera: upload error —', validationError);
    showToast(validationError);
    input.value = '';
    return;
  }

  ccSetUploadStatus('uploading…');

  try {
    const imageUrl = await uploadImageToCloudinary(file);
    await saveCampusCameraUpload(imageUrl, '');
    input.value = '';
    ccSetUploadStatus('photo added!');
    showToast('photo added!');
    setTimeout(() => ccSetUploadStatus(''), 3000);
  } catch (err) {
    const msg = err.message || 'Upload failed. Please try again.';
    console.error('[Checkpoint] Campus Camera: upload error —', msg);
    ccSetUploadStatus('');
    showToast(msg);
    input.value = '';
  }
}

function ccBuildGrid() {
  const grid = document.getElementById('cc-grid');
  if (!grid) return;

  const deletedUrls = JSON.parse(sessionStorage.getItem('cc_deleted_urls') || '[]');
  const allUploads  = typeof getCampusCameraUploads === 'function' ? getCampusCameraUploads() : [];
  const uploads     = allUploads.filter(e => !deletedUrls.includes(e.imageUrl || e.id || ''));

  grid.innerHTML = Array.from({ length: 6 }, (_, i) => {
    const entry = uploads[i];
    const slotClass = `photo-slot photo-slot-${i + 1}`;
    if (!entry || !entry.imageUrl) {
      return `<div class="${slotClass}"></div>`;
    }
    const alt = entry.caption ? entry.caption.replace(/"/g, '&quot;') : 'Campus photo';
    const key = entry.imageUrl || entry.id || '';
    return `<div class="${slotClass}">
              <img src="${entry.imageUrl}" alt="${alt}" loading="lazy">
              <button class="photo-del" onclick="ccDeletePhoto('${key.replace(/'/g,"\\'")}')">✕</button>
            </div>`;
  }).join('');
}

function ccDeletePhoto(key) {
  const deletedUrls = JSON.parse(sessionStorage.getItem('cc_deleted_urls') || '[]');
  if (!deletedUrls.includes(key)) deletedUrls.push(key);
  sessionStorage.setItem('cc_deleted_urls', JSON.stringify(deletedUrls));
  ccBuildGrid();
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

// ── SELFIE / PHOTO UPLOAD ─────────────────────────────────────
let _selfieDataUrl = null;

function compressImage(file) {
  const maxPx = 900, quality = 0.78;
  return new Promise(function(resolve) {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = function() {
      URL.revokeObjectURL(url);
      const scale  = Math.min(1, maxPx / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = url;
  });
}

async function handleCameraUpload(input) {
  const file = input.files[0];
  if (!file) return;
  const dataUrl = await compressImage(file);
  _selfieDataUrl = dataUrl;
  const preview = document.getElementById('cam-upload-preview');
  const img     = document.getElementById('cam-preview-img');
  if (img)     img.src = dataUrl;
  if (preview) preview.classList.add('visible');
}

async function submitSelfie() {
  if (!_selfieDataUrl) return;
  const caption = (document.getElementById('cam-selfie-caption') || {}).value || '';
  const drop = {
    id:        'p' + Date.now(),
    type:      'photo',
    content:   _selfieDataUrl,
    caption:   caption.trim() || null,
    mood:      'inspired',
    area:      'corner',
    timestamp: new Date().toISOString(),
    username:  'anonymous student',
    position:  { x: 68 + Math.random() * 22, y: 58 + Math.random() * 22 },
  };
  await saveUserDrop(drop);
  buildNoticeBoardPins();
  // reset
  _selfieDataUrl = null;
  const preview  = document.getElementById('cam-upload-preview');
  const fileInp  = document.getElementById('cam-file-input');
  const capInp   = document.getElementById('cam-selfie-caption');
  if (preview) preview.classList.remove('visible');
  if (fileInp) fileInp.value = '';
  if (capInp)  capInp.value  = '';
  showToast('📸 Photo pinned to the Notice Board!');
  closeCameraCompass();
  openNoticeBoard();
}


// ══════════════════════════════════════════════════════════════════
// NOTICE BOARD
// ══════════════════════════════════════════════════════════════════

// ── NOTICE BOARD ──────────────────────────────────────────────
const NB_STORAGE_KEY = 'checkpointNoticeBoardSlots';
const NB_DELETED_IDS_KEY = 'checkpointNoticeBoardDeletedIds';
const NB_SLOTS = ['nb-slot-0','nb-slot-1','nb-slot-2','nb-slot-3','nb-slot-4','nb-slot-5'];
let _nbIsPosting = false;

function _nbLoadDeletedIds() {
  try {
    const raw = JSON.parse(localStorage.getItem(NB_DELETED_IDS_KEY) || '[]');
    return new Set(Array.isArray(raw) ? raw.filter(Boolean) : []);
  } catch (_) { /* ignore */ }
  return new Set();
}

function _nbMarkDeleted(firebaseId) {
  if (!firebaseId) return;
  const set = _nbLoadDeletedIds();
  set.add(firebaseId);
  localStorage.setItem(NB_DELETED_IDS_KEY, JSON.stringify([...set]));
}

function _nbCompactSlots(slots) {
  const filled = slots.filter(s => s && s.text);
  while (filled.length < 6) filled.push(null);
  return filled.slice(0, 6);
}

function _nbLoadSlots() {
  try {
    const raw = JSON.parse(localStorage.getItem(NB_STORAGE_KEY) || 'null');
    if (Array.isArray(raw) && raw.length === 6) {
      return raw.map(entry => _nbNormalizeEntry(entry));
    }
  } catch (_) { /* ignore */ }
  return [null, null, null, null, null, null];
}

function _nbNormalizeEntry(entry) {
  if (!entry) return null;
  const text = String(entry.text != null ? entry.text : entry).trim();
  if (!text) return null;
  const out = { text, ts: entry.ts || Date.now() };
  if (entry.firebaseId) out.firebaseId = entry.firebaseId;
  return out;
}

function _nbSaveSlots(slots) {
  localStorage.setItem(NB_STORAGE_KEY, JSON.stringify(slots));
}

function _nbFirstEmptyIndex(slots) {
  return slots.findIndex(s => !s || !s.text);
}

function _nbClearAllNotes() {
  document.querySelectorAll('#screen-noticeboard .note-text').forEach(el => {
    if (!el.closest('.sticky-note')) el.remove();
  });
  document.querySelectorAll('#screen-noticeboard .nb-slot-text').forEach(el => el.remove());
  document.querySelectorAll('#nb-wrap > .note-text, #nb-wrap > .nb-slot-text').forEach(el => el.remove());
  document.querySelectorAll('#nb-wrap .sticky-note').forEach(el => { el.innerHTML = ''; });
}

function _nbMergeFirebase(slots) {
  if (typeof getNoticeBoardNotes !== 'function') return _nbCompactSlots(slots);

  const deleted = _nbLoadDeletedIds();
  const remote = getNoticeBoardNotes().filter(n => {
    if (!n || !String(n.text || '').trim()) return false;
    return !deleted.has(n.id);
  });
  if (!remote.length) return _nbCompactSlots(slots);

  const merged = _nbCompactSlots(slots);
  const usedIds = new Set(
    merged.filter(s => s && s.firebaseId).map(s => s.firebaseId)
  );
  const usedTexts = new Set(
    merged.filter(s => s && s.text).map(s => s.text)
  );

  const ordered = [...remote].reverse();
  let ri = 0;
  for (let i = 0; i < 6 && ri < ordered.length; i++) {
    if (!merged[i] || !merged[i].text) {
      while (ri < ordered.length) {
        const note = ordered[ri++];
        if (!note || usedIds.has(note.id) || deleted.has(note.id)) continue;
        const remoteText = String(note.text || '').trim();
        if (!remoteText || usedTexts.has(remoteText)) continue;
        merged[i] = _nbNormalizeEntry({
          text: remoteText,
          ts: Date.now(),
          firebaseId: note.id,
        });
        usedIds.add(note.id);
        usedTexts.add(remoteText);
        break;
      }
    }
  }
  return merged;
}

function _nbFitSlotText(stickyEl) {
  const el = stickyEl?.querySelector('.note-text');
  if (!el) return;

  let fs = 26;
  const minFs = 14;
  el.style.fontSize = '';

  const computed = parseFloat(window.getComputedStyle(el).fontSize) || 18;
  fs = Math.round(computed);

  const maxH = stickyEl.clientHeight * 0.85;
  let guard = 0;
  while (guard++ < 18 && fs > minFs && el.scrollHeight > maxH) {
    fs -= 1;
    el.style.fontSize = fs + 'px';
  }
}

function _nbRenderSlot(stickyEl, note, slotIndex) {
  if (!stickyEl || !stickyEl.classList.contains('sticky-note')) return;

  const text = note && note.text ? String(note.text).trim() : '';
  stickyEl.innerHTML = '';
  if (!text) return;

  const textEl = document.createElement('div');
  textEl.className = 'note-text';
  textEl.textContent = text;
  stickyEl.appendChild(textEl);

  const delBtn = document.createElement('button');
  delBtn.type = 'button';
  delBtn.className = 'note-delete';
  delBtn.setAttribute('aria-label', 'Delete note');
  delBtn.textContent = '×';
  delBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    deleteNoticeBoardNoteAtSlot(slotIndex);
  });
  stickyEl.appendChild(delBtn);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => _nbFitSlotText(stickyEl));
  });
}

function openNoticeBoard() {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-noticeboard')?.classList.add('active');
  currentScreen = 'noticeboard';
  setTimeout(() => buildNoticeBoardPins(), 50);
}

function closeNoticeBoard() {
  backToMap();
}

function buildNoticeBoardPins() {
  const wrap = document.getElementById('nb-wrap');
  if (!wrap) return;

  _nbClearAllNotes();
  const slots = _nbCompactSlots(_nbMergeFirebase(_nbLoadSlots()));
  _nbSaveSlots(slots);
  NB_SLOTS.forEach((id, i) => {
    _nbRenderSlot(document.getElementById(id), slots[i], i);
  });
}

async function deleteNoticeBoardNoteAtSlot(slotIndex) {
  if (slotIndex < 0 || slotIndex > 5) return;

  const slots = _nbLoadSlots();
  const note = slots[slotIndex];
  if (!note || !note.text) return;

  let firebaseId = note.firebaseId;
  if (!firebaseId && typeof getNoticeBoardNotes === 'function') {
    const match = getNoticeBoardNotes().find(n => n && n.text === note.text);
    if (match) firebaseId = match.id;
  }

  if (firebaseId) {
    _nbMarkDeleted(firebaseId);
    if (typeof deleteNoticeBoardNote === 'function') {
      deleteNoticeBoardNote(firebaseId).catch(err => {
        console.warn('[Checkpoint] Notice board Firebase delete failed:', err.message);
      });
    }
  }

  slots[slotIndex] = null;
  const compacted = _nbCompactSlots(slots);
  _nbSaveSlots(compacted);

  _nbClearAllNotes();
  compacted.forEach((entry, i) => {
    _nbRenderSlot(document.getElementById(NB_SLOTS[i]), entry, i);
  });

  showToast('Note removed');
}

async function submitNoticeBoardNote(e) {
  if (e && e.preventDefault) e.preventDefault();
  if (_nbIsPosting) return;

  const inp  = document.getElementById('nb-note-input');
  const btn  = document.getElementById('nb-post-btn');
  const text = inp ? inp.value.trim() : '';

  if (!text) { showToast('Write something first ✏️'); return; }
  if (text.length > 200) { showToast('Notes must be 200 characters or less'); return; }
  if (btn && btn.classList.contains('nb-btn-empty')) return;

  _nbIsPosting = true;

  try {
    const slots = _nbCompactSlots(_nbLoadSlots());
    let idx = _nbFirstEmptyIndex(slots);
    if (idx < 0) idx = 0;

    slots[idx] = { text, ts: Date.now() };
    _nbSaveSlots(slots);

    _nbRenderSlot(document.getElementById(NB_SLOTS[idx]), slots[idx], idx);

    if (inp) {
      inp.value = '';
      inp.dispatchEvent(new Event('input'));
    }

    showToast('📌 Note posted!');

    if (typeof saveNoticeBoardNote === 'function') {
      saveNoticeBoardNote(text).then(firebaseId => {
        if (!firebaseId) return;
        const updated = _nbCompactSlots(_nbLoadSlots());
        const slot = updated.find(s => s && s.text === text && !s.firebaseId);
        if (slot) {
          slot.firebaseId = firebaseId;
          _nbSaveSlots(updated);
        }
      }).catch(err => {
        console.warn('[Checkpoint] Notice board Firebase save failed:', err.message);
      });
    }
  } finally {
    setTimeout(() => { _nbIsPosting = false; }, 500);
  }
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
  walkToZone(82, 31, () => showLeaveDropPage());
}

// ── LEAVE A DROP — SCREEN 3 ───────────────────────────────────────────────
let lpSelectedMood = '';

function showLeaveDropPage() {
  const inp = document.getElementById('lp-url-input');
  if (inp) inp.value = '';
  document.getElementById('leave-page-form').style.display = '';
  document.getElementById('leave-page-success').style.display = 'none';
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-leave-page').classList.add('active');
  currentScreen = 'leave-page';
}

function backToMap() {
  if (typeof YourDrops !== 'undefined' && typeof YourDrops.closePage === 'function') {
    YourDrops.closePage();
  }

  if (activeDrop) closeDrop();

  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

  const world = document.getElementById('screen-world');
  if (world) world.classList.add('active');

  currentScreen = 'world';

  // Clear stale keyboard state so movement works immediately
  Object.keys(mapKeys).forEach(k => { delete mapKeys[k]; });
  mapBoyTarget = null;
  mapBoyArrivalCb = null;

  if (document.activeElement && document.activeElement !== document.body) {
    document.activeElement.blur();
  }
}

function selectLpMood(mood) {
  lpSelectedMood = mood;
  document.querySelectorAll('.lp-mood-chip').forEach(c => {
    c.classList.toggle('selected', c.dataset.mood === mood);
  });
}

async function submitLeavePageDrop() {
  const raw = (document.getElementById('lp-url-input').value || '').trim();
  if (!raw) { showToast('Paste a link first 🔗'); return; }

  let type = 'text', content = raw;
  if (raw.includes('tiktok.com'))                                   { type = 'tiktok'; content = toTikTokEmbed(raw); }
  else if (raw.includes('spotify.com'))                             { type = 'song';   content = toSpotifyEmbed(raw); }
  else if (raw.includes('youtube.com') || raw.includes('youtu.be')){ type = 'video';  content = toYTEmbed(raw); }
  else if (/\.(jpe?g|png|gif|webp)$/i.test(raw))                   { type = 'photo'; }

  await _saveLpDrop(type, content);
  if (typeof YourDrops !== 'undefined') YourDrops.addFromUrl(raw);
}


async function _saveLpDrop(type, content, showSuccess = true) {
  const bounds = { x: [56, 98], y: [56, 86] };
  const rx = bounds.x[0] + Math.random() * (bounds.x[1] - bounds.x[0]);
  const ry = bounds.y[0] + Math.random() * (bounds.y[1] - bounds.y[0]);

  const drop = {
    id: 'u' + Date.now(),
    type, content,
    caption: null,
    mood: 'peaceful',
    area: 'corner',
    timestamp: new Date().toISOString(),
    username: 'anonymous student',
    position: { x: parseFloat(rx.toFixed(1)), y: parseFloat(ry.toFixed(1)) }
  };

  await saveUserDrop(drop);
  renderCheckpoints();
  buildMeadowCards();
  buildNoticeBoardPins();

  if (showSuccess) {
    document.getElementById('leave-page-form').style.display = 'none';
    document.getElementById('leave-page-success').style.display = 'block';
  }
}

function openCanvasRoom() {
  walkToZone(10, 74, () => showCanvasScreen());
}

function showCanvasScreen() {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-canvas').classList.add('active');
  setTimeout(initDrawingCanvas, 80);
}

function backFromCanvas() {
  cvCancelImage();
  cvCancelTextbox();
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-world').classList.add('active');
}

// ── CANVAS DRAWING ────────────────────────────────────────────
let cvReady  = false;
let cvTool   = 'pencil';
let cvColor  = '#222222';
let cvSize   = 4;
let cvActive = false;
let cvLastX  = 0, cvLastY = 0;
let cvMidX   = 0, cvMidY  = 0;

// Per-tool rendering properties
const CV_PROPS = {
  pencil:     { alpha: 0.65, sizeM: 0.8,  cap: 'round',  eraser: false },
  pen:        { alpha: 1.0,  sizeM: 1.0,  cap: 'round',  eraser: false },
  brush:      { alpha: 0.80, sizeM: 2.8,  cap: 'round',  eraser: false },
  marker:     { alpha: 0.55, sizeM: 5.0,  cap: 'square', eraser: false },
  highlighter:{ alpha: 0.22, sizeM: 9.0,  cap: 'square', eraser: false },
  eraser:     { alpha: 1.0,  sizeM: 4.0,  cap: 'round',  eraser: true  },
};

function initDrawingCanvas() {
  const cv   = document.getElementById('cv-canvas');
  const wrap = document.getElementById('cv-wrap');
  const tb   = document.getElementById('cv-toolbar');

  if (!wrap.clientWidth || !wrap.clientHeight) { setTimeout(initDrawingCanvas, 30); return; }

  // Simple 1:1 CSS-pixel canvas — no DPR scaling needed
  cv.width  = wrap.clientWidth;
  cv.height = wrap.clientHeight - tb.offsetHeight;

  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#fafaf8';
  ctx.fillRect(0, 0, cv.width, cv.height);

  if (cvReady) return;
  cvReady = true;

  cv.addEventListener('pointerdown', cvDown);
  cv.addEventListener('pointermove', cvMove);
  cv.addEventListener('pointerup',   cvUp);
  cv.addEventListener('pointerleave',cvUp);
  cv.addEventListener('touchstart',  e => e.preventDefault(), { passive: false });
  cv.addEventListener('click',       cvCanvasClick);
  cv.addEventListener('dragover',    e => e.preventDefault());
  cv.addEventListener('drop',        cvDropImage);

  _cvInitFloat(document.getElementById('cv-img-float'));
  _cvInitFloat(document.getElementById('cv-tbox'));
}

function _cvXY(e) {
  const cv = document.getElementById('cv-canvas');
  const r  = cv.getBoundingClientRect();
  return { x: (e.clientX - r.left) * (cv.width / r.width),
           y: (e.clientY - r.top)  * (cv.height / r.height) };
}

function cvDown(e) {
  if (cvTool === 'text') return;
  // FIX: was referencing undefined `canvas` variable — now uses local `cv`
  const cv = document.getElementById('cv-canvas');
  try { cv.setPointerCapture(e.pointerId); } catch(_) {}
  cvActive = true;
  const p  = _cvXY(e);
  cvLastX = cvMidX = p.x;
  cvLastY = cvMidY = p.y;
  const props = CV_PROPS[cvTool] || CV_PROPS.pen;
  const ctx   = cv.getContext('2d');
  ctx.save();
  ctx.globalAlpha = props.alpha;
  ctx.beginPath();
  ctx.arc(p.x, p.y, Math.max(0.5, cvSize * props.sizeM / 2), 0, Math.PI * 2);
  ctx.fillStyle = props.eraser ? '#fafaf8' : cvColor;
  ctx.fill();
  ctx.restore();
}

function cvMove(e) {
  if (!cvActive) return;
  const p     = _cvXY(e);
  const cv    = document.getElementById('cv-canvas');
  const ctx   = cv.getContext('2d');
  const props = CV_PROPS[cvTool] || CV_PROPS.pen;
  const newMX = (cvLastX + p.x) / 2;
  const newMY = (cvLastY + p.y) / 2;
  ctx.save();
  ctx.globalAlpha  = props.alpha;
  ctx.strokeStyle  = props.eraser ? '#fafaf8' : cvColor;
  ctx.lineWidth    = cvSize * props.sizeM;
  ctx.lineCap      = props.cap;
  ctx.lineJoin     = 'round';
  ctx.beginPath();
  ctx.moveTo(cvMidX, cvMidY);
  ctx.quadraticCurveTo(cvLastX, cvLastY, newMX, newMY);
  ctx.stroke();
  ctx.restore();
  cvLastX = p.x;  cvLastY = p.y;
  cvMidX  = newMX; cvMidY  = newMY;
}

function cvUp() { cvActive = false; }

function cvCanvasClick(e) {
  if (cvTool !== 'text') return;
  const wr = document.getElementById('cv-wrap').getBoundingClientRect();
  cvOpenTextbox(e.clientX - wr.left, e.clientY - wr.top);
}

// ── Tool / colour / size controls ─────────────────────────────
function cvSetTool(tool) {
  cvTool = tool;
  document.querySelectorAll('.cv-tool-btn').forEach(b => b.classList.toggle('active', b.dataset.tool === tool));
  const cv = document.getElementById('cv-canvas');
  if (cv) cv.dataset.tool = tool;
}

function cvSetColor(color) {
  cvColor = color;
  document.getElementById('cv-color-picker').value = color;
  document.querySelectorAll('.cv-swatch').forEach(s =>
    s.classList.toggle('active', s.style.background === color || s.style.backgroundColor === color));
  const ta = document.getElementById('cv-tbox-ta');
  if (ta) ta.style.color = color;
}

function cvUpdateSize(val) {
  cvSize = parseInt(val);
  document.getElementById('cv-size-val').textContent = val;
  const ta = document.getElementById('cv-tbox-ta');
  if (ta) ta.style.fontSize = Math.max(14, cvSize * 3) + 'px';
}

// ── Image: floating adjustable layer ──────────────────────────
let _cvFloatImg = null;

function cvAddImage() { document.getElementById('cv-img-input').click(); }

function cvLoadImageFile(input) {
  const file = input.files[0];
  if (!file) return;
  const r = new FileReader();
  r.onload = e => _cvShowFloatImage(e.target.result);
  r.readAsDataURL(file);
  input.value = '';
}

function cvDropImage(e) {
  e.preventDefault();
  const file = Array.from(e.dataTransfer.files).find(f => f.type.startsWith('image/'));
  if (!file) return;
  const r = new FileReader();
  r.onload = ev => _cvShowFloatImage(ev.target.result);
  r.readAsDataURL(file);
}

function _cvShowFloatImage(src) {
  const img  = new Image();
  img.onload = () => {
    _cvFloatImg = img;
    const wrap    = document.getElementById('cv-wrap');
    const toolbar = document.getElementById('cv-toolbar');
    const maxW = wrap.clientWidth  * 0.6;
    const maxH = (wrap.clientHeight - toolbar.offsetHeight) * 0.6;
    // Natural size, only scale down if larger than 60% of canvas
    const scale = Math.min(1, maxW / img.naturalWidth, maxH / img.naturalHeight);
    const w = Math.round(img.naturalWidth  * scale);
    const h = Math.round(img.naturalHeight * scale);
    const x = Math.round((wrap.clientWidth  - w) / 2);
    const y = Math.round((wrap.clientHeight - h) / 2);

    const fl = document.getElementById('cv-img-float');
    fl.style.cssText = `display:block;left:${x}px;top:${y}px;width:${w}px;height:${h}px;`;
    document.getElementById('cv-img-float-el').src = src;
  };
  img.src = src;
}

function cvCommitImage() {
  const fl      = document.getElementById('cv-img-float');
  const canvas  = document.getElementById('cv-canvas');
  const wrap    = document.getElementById('cv-wrap');
  const toolbar = document.getElementById('cv-toolbar');
  const dpr     = window.devicePixelRatio || 1;
  const scaleX  = canvas.width  / (wrap.clientWidth  * dpr);
  const scaleY  = canvas.height / ((wrap.clientHeight - toolbar.offsetHeight) * dpr);
  const x  = parseFloat(fl.style.left);
  const y  = parseFloat(fl.style.top)  - toolbar.offsetHeight;
  const w  = fl.offsetWidth;
  const h  = fl.offsetHeight;
  const ctx = canvas.getContext('2d');
  // Draw at natural image quality — no forced upscale
  ctx.drawImage(_cvFloatImg, x / scaleX * dpr, y / scaleY * dpr,
    w / scaleX * dpr, h / scaleY * dpr);
  fl.style.display = 'none';
  _cvFloatImg = null;
}

function cvCancelImage() {
  document.getElementById('cv-img-float').style.display = 'none';
  _cvFloatImg = null;
}

// ── Text box: floating draggable textarea ──────────────────────
function cvOpenTextbox(x, y) {
  const tbox = document.getElementById('cv-tbox');
  const ta   = document.getElementById('cv-tbox-ta');
  const w = 200, h = 100;
  tbox.style.cssText = `display:block;left:${x}px;top:${y}px;width:${w}px;height:${h}px;`;
  ta.style.fontSize  = Math.max(14, cvSize * 3) + 'px';
  ta.style.color     = cvColor;
  ta.value = '';
  setTimeout(() => ta.focus(), 30);
}

function cvCommitTextbox() {
  const tbox   = document.getElementById('cv-tbox');
  const ta     = document.getElementById('cv-tbox-ta');
  const text   = ta.value;
  if (!text.trim()) { cvCancelTextbox(); return; }

  const canvas  = document.getElementById('cv-canvas');
  const wrap    = document.getElementById('cv-wrap');
  const toolbar = document.getElementById('cv-toolbar');
  const dpr     = window.devicePixelRatio || 1;
  const ctx     = canvas.getContext('2d');
  const fs      = Math.max(14, cvSize * 3);

  // Position of textbox relative to canvas top-left (in CSS px)
  const x = parseFloat(tbox.style.left);
  const y = parseFloat(tbox.style.top) - toolbar.offsetHeight;
  const w = tbox.offsetWidth;

  const scaleX = canvas.width  / (wrap.clientWidth  * dpr);
  const scaleY = canvas.height / ((wrap.clientHeight - toolbar.offsetHeight) * dpr);
  const cx = x / scaleX * dpr;
  const cy = y / scaleY * dpr;

  ctx.font      = `${fs}px UglyDave, sans-serif`;
  ctx.fillStyle = cvColor;

  // Word-wrap the text within the box width
  const lineH   = fs * 1.3;
  const maxW    = (w / scaleX * dpr) - 12;
  const lines   = [];
  for (const para of text.split('\n')) {
    const words = para.split(' ');
    let cur = '';
    for (const word of words) {
      const test = cur ? cur + ' ' + word : word;
      if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = word; }
      else cur = test;
    }
    lines.push(cur);
  }
  lines.forEach((line, i) => ctx.fillText(line, cx + 6, cy + fs + i * lineH));
  tbox.style.display = 'none';
}

function cvCancelTextbox() {
  document.getElementById('cv-tbox').style.display = 'none';
}

// ── Drag + resize for floating overlays ───────────────────────
let _cvDrag = null;

function _cvInitFloat(el) {
  el.addEventListener('pointerdown', e => {
    const isDot    = e.target.classList.contains('cv-hdot');
    const isBar    = !!e.target.closest('.cv-float-bar');
    const isTA     = e.target.tagName === 'TEXTAREA';
    const isHandle = e.target.id === 'cv-tbox-handle';

    if (isDot) {
      _cvDrag = {
        type: 'resize', handle: e.target.dataset.handle, el,
        startX: e.clientX, startY: e.clientY,
        origL: parseFloat(el.style.left), origT: parseFloat(el.style.top),
        origW: el.offsetWidth,            origH: el.offsetHeight,
      };
    } else if (!isBar && !isTA || isHandle) {
      // Move: from drag handle (text box) or from anywhere on image float
      _cvDrag = {
        type: 'move', el,
        startX: e.clientX, startY: e.clientY,
        origL: parseFloat(el.style.left), origT: parseFloat(el.style.top),
      };
    }
    if (_cvDrag) { e.stopPropagation(); e.preventDefault(); el.setPointerCapture(e.pointerId); }
  });
}

document.addEventListener('pointermove', e => {
  if (!_cvDrag) return;
  const dx = e.clientX - _cvDrag.startX;
  const dy = e.clientY - _cvDrag.startY;
  const el = _cvDrag.el;
  if (_cvDrag.type === 'move') {
    el.style.left = (_cvDrag.origL + dx) + 'px';
    el.style.top  = (_cvDrag.origT + dy) + 'px';
  } else {
    const h = _cvDrag.handle;
    if (h === 'se') {
      el.style.width  = Math.max(60, _cvDrag.origW + dx) + 'px';
      el.style.height = Math.max(40, _cvDrag.origH + dy) + 'px';
    } else if (h === 'sw') {
      const newW = Math.max(60, _cvDrag.origW - dx);
      el.style.left  = (_cvDrag.origL + _cvDrag.origW - newW) + 'px';
      el.style.width = newW + 'px';
      el.style.height = Math.max(40, _cvDrag.origH + dy) + 'px';
    } else if (h === 'ne') {
      el.style.width  = Math.max(60, _cvDrag.origW + dx) + 'px';
      const newH = Math.max(40, _cvDrag.origH - dy);
      el.style.top    = (_cvDrag.origT + _cvDrag.origH - newH) + 'px';
      el.style.height = newH + 'px';
    } else if (h === 'nw') {
      const newW = Math.max(60, _cvDrag.origW - dx);
      const newH = Math.max(40, _cvDrag.origH - dy);
      el.style.left   = (_cvDrag.origL + _cvDrag.origW - newW) + 'px';
      el.style.top    = (_cvDrag.origT + _cvDrag.origH - newH) + 'px';
      el.style.width  = newW + 'px';
      el.style.height = newH + 'px';
    }
  }
});
document.addEventListener('pointerup', () => { _cvDrag = null; });

// ── Download / email ──────────────────────────────────────────
function cvEmail() {
  const canvas = document.getElementById('cv-canvas');
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = 'hm-canvas.png';
  a.click();
  showToast('Canvas saved — attach it to your email 📧');
}

// ── Clear ─────────────────────────────────────────────────────
function cvClear() {
  cvCancelImage();
  cvCancelTextbox();
  const canvas = document.getElementById('cv-canvas');
  const ctx    = canvas.getContext('2d');
  ctx.fillStyle = '#fafaf8';
  ctx.fillRect(0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));
}


// ══════════════════════════════════════════════════════════════════
// LIBRARY FOCUS TIMER
// ══════════════════════════════════════════════════════════════════

let timerInterval  = null;
let timerRemaining = 25 * 60; // default 25 min in seconds
let timerRunning   = false;

function openLibrary() {
  walkToZone(14, 44, () => showStudyLobby());
}
function closeLibrary() {
  document.getElementById('panel-library').classList.remove('open');
}

function showStudyLobby() {
  fadeOutLoadingAudio();
  const ambient = document.getElementById('ambient-audio');
  if (ambient && !ambient.paused) ambient.pause();
  stopStudyMusic();
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-study').classList.add('active');
  currentScreen = 'study';
  renderStudyOnlineList();
}
function backFromStudy() {
  stopStudyTimer();
  stopStudyMusic();
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-world').classList.add('active');
  currentScreen = 'world';
  const ambient = document.getElementById('ambient-audio');
  if (ambient && !audioMuted && audioStarted) ambient.play().catch(() => {});
}

// ── STUDY MUSIC ───────────────────────────────────────────────
const STUDY_TRACKS = {
  'ink-rain':   'img/Study%20Group/Study%20Music/Ink%20Rain%20Lofi.mp3',
  'petals':     'img/Study%20Group/Study%20Music/Petals%20Lofi.mp3',
  'tokyo-cafe': 'img/Study%20Group/Study%20Music/Tokyo%20Cafe.mp3',
};

function playStudyMusic(track) {
  const audio = document.getElementById('study-audio');
  if (!audio || !STUDY_TRACKS[track]) return;
  audio.src = STUDY_TRACKS[track];
  audio.volume = 0.5;
  audio.play().catch(() => {});
  document.querySelectorAll('.study-music-btn').forEach(b => b.classList.remove('active'));
  const btn = document.querySelector(`.study-music-btn[data-track="${track}"]`);
  if (btn) btn.classList.add('active');
}

function stopStudyMusic() {
  const audio = document.getElementById('study-audio');
  if (audio) { audio.pause(); audio.currentTime = 0; }
  document.querySelectorAll('.study-music-btn').forEach(b => b.classList.remove('active'));
  const offBtn = document.getElementById('study-music-off');
  if (offBtn) offBtn.classList.add('active');
}

// ── STUDY TIMER ───────────────────────────────────────────────
let studyTimerInterval = null;
let studyTimerSeconds  = 0;
let studySelectedMin   = 0;

function openStudyTimerModal() {
  studySelectedMin = 0;
  document.querySelectorAll('.study-dur-btn').forEach(b => b.classList.remove('selected'));
  document.getElementById('study-custom-min').value = '';
  document.getElementById('study-timer-modal').classList.add('open');
}
function cancelStudyTimerModal() {
  document.getElementById('study-timer-modal').classList.remove('open');
}
function selectStudyDur(btn) {
  document.querySelectorAll('.study-dur-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  studySelectedMin = parseInt(btn.dataset.min);
  document.getElementById('study-custom-min').value = '';
}
function confirmStudyTimer() {
  const custom = parseFloat(document.getElementById('study-custom-min').value);
  const mins   = custom > 0 ? custom : studySelectedMin;
  if (!mins || mins < 0.5) { showToast('Minimum is 30 seconds ⏱'); return; }

  cancelStudyTimerModal();
  studyTimerSeconds = Math.round(mins * 60);

  // Swap start button → countdown display
  document.getElementById('study-start-btn').style.display   = 'none';
  document.getElementById('study-timer-display').style.display = 'flex';
  const online = document.getElementById('study-laptop-online');
  if (online) online.style.display = 'none';
  _tickStudyTimer();
  if (studyTimerInterval) clearInterval(studyTimerInterval);
  studyTimerInterval = setInterval(_tickStudyTimer, 1000);
}
function playStudyAlarm() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const vol = 0.28;
    function ding(t, freq) {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 2.2);
      osc.start(t);
      osc.stop(t + 2.2);
    }
    const now = ctx.currentTime;
    ding(now,       880);
    ding(now + 0.5, 1108);
    ding(now + 1.0, 1320);
  } catch (e) {}
}

function _tickStudyTimer() {
  const m = Math.floor(studyTimerSeconds / 60);
  const s = studyTimerSeconds % 60;
  const el = document.getElementById('study-timer-count');
  if (el) el.textContent = String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
  if (studyTimerSeconds <= 0) {
    clearInterval(studyTimerInterval);
    studyTimerInterval = null;
    playStudyAlarm();
    showToast('⏰ Time\'s up! Great work! 🎉');
    _resetStudyTimer();
    return;
  }
  studyTimerSeconds--;
}
function stopStudyTimer() {
  if (studyTimerInterval) { clearInterval(studyTimerInterval); studyTimerInterval = null; }
  _resetStudyTimer();
}
function _resetStudyTimer() {
  studyTimerSeconds = 0;
  document.getElementById('study-start-btn').style.display    = '';
  document.getElementById('study-timer-display').style.display = 'none';
  const online = document.getElementById('study-laptop-online');
  if (online) online.style.display = '';
  const el = document.getElementById('study-timer-count');
  if (el) el.textContent = '00:00';
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
