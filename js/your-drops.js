/* ── YOUR DROPS — gallery page (Leave a Drop Part 2) ───────────────────── */

const YD_STORAGE_KEY      = 'checkpointYourDrops';
const YD_COLLECTIONS_KEY  = 'checkpointYourCollections';
const YD_PAGE_SIZE        = 8;

const YD_FAKE_COLLECTION_SLOTS = 5;

const YourDrops = (() => {
  let state = {
    tab: 'all',
    sort: 'newest',
    filterTypes: [],
    page: 1,
    openMenuId: null,
    filterOpen: false,
    dragId: null,
  };

  function loadDrops() {
    try { return JSON.parse(localStorage.getItem(YD_STORAGE_KEY) || '[]'); }
    catch { return []; }
  }

  function saveDrops(drops) {
    localStorage.setItem(YD_STORAGE_KEY, JSON.stringify(drops));
  }

  function loadCollections() {
    try { return JSON.parse(localStorage.getItem(YD_COLLECTIONS_KEY) || '[]'); }
    catch { return []; }
  }

  function saveCollections(cols) {
    localStorage.setItem(YD_COLLECTIONS_KEY, JSON.stringify(cols));
  }

  function detectCategory(url) {
    const u = url.toLowerCase();
    if (/\.(jpe?g|png|gif|webp|bmp)(\?|$)/i.test(u)) return 'memes';
    if (u.includes('tiktok.com')) return 'clips';
    if (u.includes('spotify.com/playlist') || u.includes('spotify.com/album')) return 'playlists';
    if (u.includes('spotify.com')) return 'songs';
    if (u.includes('youtube.com') || u.includes('youtu.be')) return 'films';
    if (/\.(mp3|wav|ogg|m4a)(\?|$)/i.test(u)) return 'songs';
    return 'clips';
  }

  function detectFilterType(url) {
    const cat = detectCategory(url);
    if (cat === 'memes') return 'images';
    if (cat === 'playlists') return 'playlists';
    if (cat === 'songs') return 'audio';
    if (cat === 'films' || cat === 'clips') return 'videos';
    return 'videos';
  }

  function defaultTitle(url, category) {
    const labels = { songs: 'new song', playlists: 'new playlist', films: 'new film', memes: 'new meme', clips: 'new clip' };
    try {
      const host = new URL(url).hostname.replace('www.', '');
      return host.split('.')[0] + ' drop';
    } catch {
      return labels[category] || 'untitled drop';
    }
  }

  function ytId(url) {
    const short = url.match(/youtu\.be\/([^?&]+)/);
    const long  = url.match(/[?&]v=([^&]+)/);
    return (short && short[1]) || (long && long[1]) || '';
  }

  function spotifyEmbed(url) {
    const m = url.match(/spotify\.com\/(track|playlist|album)\/([A-Za-z0-9]+)/);
    return m ? `https://open.spotify.com/embed/${m[1]}/${m[2]}?utm_source=generator` : null;
  }

  function addFromUrl(url) {
    const trimmed = (url || '').trim();
    if (!trimmed) return null;
    const drops = loadDrops();
    const category = detectCategory(trimmed);
    const drop = {
      id: 'yd' + Date.now(),
      url: trimmed,
      title: defaultTitle(trimmed, category),
      category,
      filterType: detectFilterType(trimmed),
      timestamp: new Date().toISOString(),
    };
    drops.unshift(drop);
    saveDrops(drops);
    return drop;
  }

  function deleteDrop(id) {
    saveDrops(loadDrops().filter(d => d.id !== id));
    const cols = loadCollections().map(c => ({
      ...c,
      dropIds: (c.dropIds || []).filter(did => did !== id),
    }));
    saveCollections(cols);
  }

  function updateTitle(id, title) {
    const drops = loadDrops();
    const d = drops.find(x => x.id === id);
    if (d) { d.title = (title || '').trim().slice(0, 48) || d.title; saveDrops(drops); }
  }

  function getFilteredSorted() {
    let drops = loadDrops();
    if (state.tab !== 'all') drops = drops.filter(d => d.category === state.tab);
    if (state.filterTypes.length)
      drops = drops.filter(d => state.filterTypes.includes(d.filterType));
    drops.sort((a, b) => {
      const ta = new Date(a.timestamp).getTime();
      const tb = new Date(b.timestamp).getTime();
      return state.sort === 'oldest' ? ta - tb : tb - ta;
    });
    return drops;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function previewHtml(drop) {
    const url = drop.url;
    const cat = drop.category;
    if (cat === 'memes' || /\.(jpe?g|png|gif|webp)(\?|$)/i.test(url)) {
      return `<img class="yd-preview-img" src="${escapeHtml(url)}" alt="" loading="lazy" onerror="this.parentElement.classList.add('yd-preview-fallback')"/>`;
    }
    const yt = ytId(url);
    if (yt) {
      return `<img class="yd-preview-img" src="https://img.youtube.com/vi/${escapeHtml(yt)}/mqdefault.jpg" alt="" loading="lazy"/>
              <span class="yd-play-icon" aria-hidden="true">▶</span>`;
    }
    const sp = spotifyEmbed(url);
    if (sp) {
      return `<iframe class="yd-preview-embed" src="${escapeHtml(sp)}" loading="lazy" allow="encrypted-media"></iframe>`;
    }
    if (url.includes('tiktok.com')) {
      return `<div class="yd-preview-placeholder yd-preview-tiktok"><span class="yd-play-icon">▶</span><span>tiktok</span></div>`;
    }
    if (/\.(mp3|wav|ogg|m4a)(\?|$)/i.test(url)) {
      return `<div class="yd-preview-placeholder yd-preview-audio"><span>♪</span><span>audio</span></div>`;
    }
    return `<div class="yd-preview-placeholder"><span>🔗</span><span>${escapeHtml(cat)}</span></div>`;
  }

  function renderGrid() {
    const grid = document.getElementById('yd-grid');
    if (!grid) return;

    const all = getFilteredSorted();
    const totalPages = Math.max(1, Math.ceil(all.length / YD_PAGE_SIZE));
    if (state.page > totalPages) state.page = totalPages;
    if (state.page < 1) state.page = 1;

    const start = (state.page - 1) * YD_PAGE_SIZE;
    const pageItems = all.slice(start, start + YD_PAGE_SIZE);
    const slots = [];

    for (let i = 0; i < YD_PAGE_SIZE; i++) {
      const drop = pageItems[i];
      if (drop) {
        slots.push(`
          <article class="yd-card" data-id="${drop.id}" draggable="true">
            <div class="yd-card-preview" data-open="${escapeHtml(drop.url)}">
              ${previewHtml(drop)}
            </div>
            <button type="button" class="yd-card-menu-btn" data-menu="${drop.id}" aria-label="Options">⋯</button>
            <div class="yd-card-menu" id="yd-menu-${drop.id}" hidden>
              <button type="button" data-action="open" data-id="${drop.id}">open</button>
              <button type="button" data-action="edit" data-id="${drop.id}">edit title</button>
              <button type="button" data-action="delete" data-id="${drop.id}">delete</button>
            </div>
            <div class="yd-card-footer">
              <input class="yd-card-title" type="text" value="${escapeHtml(drop.title)}" maxlength="48" data-id="${drop.id}" aria-label="Title"/>
              <span class="yd-card-type">${escapeHtml(drop.category)}</span>
            </div>
          </article>`);
      } else {
        slots.push(`<div class="yd-card yd-card-empty" aria-hidden="true"><div class="yd-empty-inner"></div></div>`);
      }
    }

    grid.innerHTML = slots.join('');
    renderPagination(totalPages, all.length);
  }

  function renderPagination(totalPages, totalItems) {
    const el = document.getElementById('yd-pagination');
    if (!el) return;
    if (totalItems === 0) {
      el.innerHTML = '<span class="yd-page-info">no drops yet — leave one on the picnic blanket</span>';
      return;
    }

    let nums = '';
    const cur = state.page;
    const show = [];
    for (let p = 1; p <= totalPages; p++) {
      if (p === 1 || p === totalPages || Math.abs(p - cur) <= 1) show.push(p);
    }
    let prev = 0;
    show.forEach(p => {
      if (p - prev > 1) nums += '<span class="yd-page-dots">…</span>';
      nums += `<button type="button" class="yd-page-num${p === cur ? ' active' : ''}" data-page="${p}">${p}</button>`;
      prev = p;
    });

    el.innerHTML =
      nums +
      (cur < totalPages ? `<button type="button" class="yd-page-next" data-page="${cur + 1}">next ›</button>` : '');
  }

  function renderCollections() {
    const row = document.getElementById('yd-collections-row');
    if (!row) return;
    const cols = loadCollections();
    let html = '';

    for (let i = 0; i < YD_FAKE_COLLECTION_SLOTS; i++) {
      const col = cols[i];
      if (col) {
        const drops = loadDrops().filter(d => (col.dropIds || []).includes(d.id));
        html += `
          <div class="yd-col-card" data-col="${col.id}">
            <div class="yd-col-name">${escapeHtml(col.name)}</div>
            <div class="yd-col-drops">${drops.length ? drops.map(d => `<span class="yd-col-chip">${escapeHtml(d.title)}</span>`).join('') : '<span class="yd-col-empty">drop media here</span>'}</div>
          </div>`;
      } else {
        html += `<div class="yd-col-card yd-col-slot-empty"><div class="yd-col-dashed"></div></div>`;
      }
    }

    html += `
      <button type="button" class="yd-col-create" id="yd-col-create-btn">
        <span class="yd-col-plus">+</span>
        <span>create new</span>
      </button>`;

    row.innerHTML = html;
  }

  function renderTabs() {
    document.querySelectorAll('.yd-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === state.tab);
    });
  }

  function renderSort() {
    const sel = document.getElementById('yd-sort-select');
    if (sel) sel.value = state.sort;
  }

  function renderFilterChips() {
    document.querySelectorAll('.yd-filter-chip').forEach(chip => {
      chip.classList.toggle('active', state.filterTypes.includes(chip.dataset.ftype));
    });
  }

  function renderAll() {
    renderTabs();
    renderSort();
    renderFilterChips();
    renderGrid();
    renderCollections();
  }

  function closeMenus() {
    state.openMenuId = null;
    document.querySelectorAll('.yd-card-menu').forEach(m => { m.hidden = true; });
  }

  function openDrop(id) {
    const drop = loadDrops().find(d => d.id === id);
    if (drop) window.open(drop.url, '_blank', 'noopener,noreferrer');
  }

  function wireEvents() {
    document.getElementById('yd-back')?.addEventListener('click', () => {
      if (typeof backToMap === 'function') backToMap();
    });

    document.querySelectorAll('.yd-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        state.tab = btn.dataset.tab;
        state.page = 1;
        closeMenus();
        renderAll();
      });
    });

    document.getElementById('yd-sort-select')?.addEventListener('change', e => {
      state.sort = e.target.value;
      state.page = 1;
      renderGrid();
    });

    document.getElementById('yd-filter-btn')?.addEventListener('click', e => {
      e.stopPropagation();
      state.filterOpen = !state.filterOpen;
      const pop = document.getElementById('yd-filter-popup');
      if (pop) pop.hidden = !state.filterOpen;
    });

    document.querySelectorAll('.yd-filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const t = chip.dataset.ftype;
        const i = state.filterTypes.indexOf(t);
        if (i >= 0) state.filterTypes.splice(i, 1);
        else state.filterTypes.push(t);
        state.page = 1;
        renderFilterChips();
        renderGrid();
      });
    });

    document.addEventListener('click', () => {
      if (state.filterOpen) {
        state.filterOpen = false;
        const pop = document.getElementById('yd-filter-popup');
        if (pop) pop.hidden = true;
      }
      closeMenus();
    });

    document.getElementById('yd-filter-popup')?.addEventListener('click', e => e.stopPropagation());

    document.getElementById('yd-grid')?.addEventListener('click', e => {
      const menuBtn = e.target.closest('.yd-card-menu-btn');
      if (menuBtn) {
        e.stopPropagation();
        const id = menuBtn.dataset.menu;
        closeMenus();
        if (state.openMenuId !== id) {
          state.openMenuId = id;
          const menu = document.getElementById('yd-menu-' + id);
          if (menu) menu.hidden = false;
        }
        return;
      }

      const action = e.target.closest('[data-action]');
      if (action) {
        e.stopPropagation();
        const id = action.dataset.id;
        if (action.dataset.action === 'open') openDrop(id);
        if (action.dataset.action === 'edit') {
          const inp = document.querySelector(`.yd-card-title[data-id="${id}"]`);
          if (inp) { inp.focus(); inp.select(); }
        }
        if (action.dataset.action === 'delete') {
          deleteDrop(id);
          renderAll();
        }
        closeMenus();
        return;
      }

      const preview = e.target.closest('.yd-card-preview[data-open]');
      if (preview) window.open(preview.dataset.open, '_blank', 'noopener,noreferrer');
    });

    document.getElementById('yd-grid')?.addEventListener('change', e => {
      if (e.target.classList.contains('yd-card-title')) {
        updateTitle(e.target.dataset.id, e.target.value);
      }
    });

    document.getElementById('yd-grid')?.addEventListener('dragstart', e => {
      const card = e.target.closest('.yd-card[data-id]');
      if (!card) return;
      state.dragId = card.dataset.id;
      e.dataTransfer.setData('text/plain', state.dragId);
      card.classList.add('yd-dragging');
    });

    document.getElementById('yd-grid')?.addEventListener('dragend', e => {
      const card = e.target.closest('.yd-card');
      if (card) card.classList.remove('yd-dragging');
      state.dragId = null;
    });

    document.getElementById('yd-collections-row')?.addEventListener('dragover', e => {
      const col = e.target.closest('.yd-col-card[data-col]');
      if (col) { e.preventDefault(); col.classList.add('yd-col-over'); }
    });

    document.getElementById('yd-collections-row')?.addEventListener('dragleave', e => {
      const col = e.target.closest('.yd-col-card[data-col]');
      if (col) col.classList.remove('yd-col-over');
    });

    document.getElementById('yd-collections-row')?.addEventListener('drop', e => {
      const col = e.target.closest('.yd-col-card[data-col]');
      if (!col || !state.dragId) return;
      e.preventDefault();
      col.classList.remove('yd-col-over');
      const cols = loadCollections();
      const c = cols.find(x => x.id === col.dataset.col);
      if (c && !(c.dropIds || []).includes(state.dragId)) {
        c.dropIds = c.dropIds || [];
        c.dropIds.push(state.dragId);
        saveCollections(cols);
        renderCollections();
      }
    });

    document.getElementById('yd-new-collection-btn')?.addEventListener('click', () => {
      const name = prompt('Collection name');
      if (!name || !name.trim()) return;
      const cols = loadCollections();
      cols.push({ id: 'col' + Date.now(), name: name.trim().slice(0, 24), dropIds: [] });
      saveCollections(cols);
      renderCollections();
    });

    document.getElementById('yd-col-create-btn')?.addEventListener('click', () => {
      document.getElementById('yd-new-collection-btn')?.click();
    });

    document.getElementById('yd-pagination')?.addEventListener('click', e => {
      const btn = e.target.closest('[data-page]');
      if (!btn) return;
      state.page = parseInt(btn.dataset.page, 10);
      renderGrid();
    });
  }

  function closePage() {
    state.filterOpen = false;
    state.openMenuId = null;
    const pop = document.getElementById('yd-filter-popup');
    if (pop) pop.hidden = true;
    closeMenus();
    document.getElementById('screen-your-drops')?.classList.remove('active');
  }

  function openPage() {
    state.page = 1;
    state.openMenuId = null;
    state.filterOpen = false;
    const pop = document.getElementById('yd-filter-popup');
    if (pop) pop.hidden = true;
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-your-drops')?.classList.add('active');
    if (typeof currentScreen !== 'undefined') currentScreen = 'your-drops';
    renderAll();
  }

  function init() {
    wireEvents();
  }

  return { init, openPage, closePage, addFromUrl, renderAll, loadDrops };
})();

function openYourDropsPage() {
  YourDrops.openPage();
}

document.addEventListener('DOMContentLoaded', () => YourDrops.init());
