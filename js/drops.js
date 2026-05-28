// ── SUPABASE CONFIG ───────────────────────────────────────────────────────────
// Fill these in after creating your Supabase project:
//   supabase.com → New project → Settings → API
//   Copy "Project URL" and "anon public" key
const SUPABASE_URL      = 'YOUR_PROJECT_URL';   // e.g. https://abcxyz.supabase.co
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';      // long string starting with eyJ…

const _live = SUPABASE_URL !== 'YOUR_PROJECT_URL';
let   _sb   = null;

// ── MOCK SEED DATA (shown when Supabase is not yet configured) ────────────────
const DROPS_SEED = [
  // ── MEDIA MEADOW ──────────────────────────────────────────────────────────
  {
    id: 'm1', type: 'song',
    content: 'https://open.spotify.com/embed/track/4iV5W9uYEdYUVa79Axb7Rh?utm_source=generator',
    caption: 'Played this on repeat every night during deadline week.',
    mood: 'overwhelmed', area: 'meadow', timestamp: '2024-11-12T23:45:00Z',
    username: 'anonymous student', position: { x: 72, y: 22 }
  },
  {
    id: 'm2', type: 'text',
    content: '"Songs that got me through crit" — mostly ambient stuff and one embarrassing 00s pop banger I refuse to name.',
    caption: 'You know who you are.',
    mood: 'nostalgic', area: 'meadow', timestamp: '2024-10-03T14:20:00Z',
    username: 'year 2 painting', position: { x: 80, y: 30 }
  },
  {
    id: 'm3', type: 'video',
    content: 'https://www.youtube.com/embed/kXYiU_JCYtU',
    caption: 'This kept me sane during the worst essay I ever wrote.',
    mood: 'chaotic', area: 'meadow', timestamp: '2024-09-28T09:15:00Z',
    username: 'anonymous student', position: { x: 65, y: 18 }
  },
  {
    id: 'm4', type: 'text',
    content: 'If you need a playlist for 3am studio sessions, search "Brian Eno: Music For Airports". You\'re welcome.',
    caption: 'Changed the way I work.',
    mood: 'peaceful', area: 'meadow', timestamp: '2024-08-15T03:12:00Z',
    username: 'anonymous', position: { x: 75, y: 38 }
  },
  // ── MEMORY GARDEN ─────────────────────────────────────────────────────────
  {
    id: 'g1', type: 'text',
    content: 'First day of studio — I had no idea what I was doing and everyone looked so confident. Three years later I know we were all terrified.',
    caption: 'Miss it already.',
    mood: 'nostalgic', area: 'garden', timestamp: '2024-05-20T16:30:00Z',
    username: 'final year', position: { x: 22, y: 20 }
  },
  {
    id: 'g2', type: 'text',
    content: 'Someone left wildflowers on the studio bench every Monday morning for a whole semester. Nobody ever found out who.',
    caption: 'Thank you, whoever you were.',
    mood: 'peaceful', area: 'garden', timestamp: '2024-03-11T08:00:00Z',
    username: 'anonymous student', position: { x: 15, y: 30 }
  },
  {
    id: 'g3', type: 'text',
    content: 'We ate cold chips in the courtyard after the show. It was the best meal of my life.',
    caption: null, mood: 'nostalgic', area: 'garden', timestamp: '2024-06-14T19:45:00Z',
    username: 'illustration yr3', position: { x: 28, y: 14 }
  },
  // ── CREATIVE WORKSHOP ─────────────────────────────────────────────────────
  {
    id: 'w1', type: 'text',
    content: 'Unfinished typeface — never got past 8 characters. Still think about it every few months.',
    caption: 'Maybe one day.',
    mood: 'inspired', area: 'workshop', timestamp: '2024-02-14T11:00:00Z',
    username: 'graphic design yr3', position: { x: 48, y: 55 }
  },
  {
    id: 'w2', type: 'text',
    content: 'I printed my whole dissertation the wrong size. Spent 4 hours crying. Fixed it. Won an award for it. Design school is something.',
    caption: 'It always works out.',
    mood: 'chaotic', area: 'workshop', timestamp: '2024-04-02T22:15:00Z',
    username: 'anonymous', position: { x: 55, y: 62 }
  },
  {
    id: 'w3', type: 'text',
    content: 'I kept every failed prototype. There are 47 of them. They live in a box under my bed.',
    caption: 'Evidence.',
    mood: 'inspired', area: 'workshop', timestamp: '2024-07-22T16:30:00Z',
    username: 'product design', position: { x: 42, y: 65 }
  },
  // ── LOST & FOUND FOREST ───────────────────────────────────────────────────
  {
    id: 'f1', type: 'text',
    content: 'I never once felt like I truly belonged here. But I also never wanted to leave.',
    caption: null, mood: 'lonely', area: 'forest', timestamp: '2024-06-01T03:20:00Z',
    username: 'anonymous', position: { x: 18, y: 62 }
  },
  {
    id: 'f2', type: 'text',
    content: 'To whoever finds this — you are allowed to not know what you\'re doing. None of us do.',
    caption: 'Left this for you.',
    mood: 'hopeful', area: 'forest', timestamp: '2024-01-08T21:00:00Z',
    username: 'anonymous', position: { x: 12, y: 72 }
  },
  {
    id: 'f3', type: 'text',
    content: 'Cried in the library toilets three times this semester. Each time felt different. The last time I laughed at myself. Progress.',
    caption: null, mood: 'overwhelmed', area: 'forest', timestamp: '2024-11-30T14:00:00Z',
    username: 'anonymous', position: { x: 25, y: 78 }
  },
  {
    id: 'f4', type: 'text',
    content: 'I almost dropped out in second year. I didn\'t. I\'m so glad I didn\'t.',
    caption: null, mood: 'hopeful', area: 'forest', timestamp: '2025-01-19T00:15:00Z',
    username: 'anonymous', position: { x: 8, y: 80 }
  },
  // ── CURRENT CORNER ────────────────────────────────────────────────────────
  {
    id: 'c1', type: 'text',
    content: 'Currently in the library. Deadline in 6 hours. Send help (and snacks).',
    caption: null, mood: 'overwhelmed', area: 'corner', timestamp: '2024-12-08T16:45:00Z',
    username: 'anonymous student', position: { x: 76, y: 62 }
  },
  {
    id: 'c2', type: 'text',
    content: 'Just submitted!!! Three weeks of hell and I actually did it. I actually did it.',
    caption: null, mood: 'hopeful', area: 'corner', timestamp: '2024-12-09T23:59:00Z',
    username: 'anonymous', position: { x: 84, y: 72 }
  },
  {
    id: 'c3', type: 'text',
    content: 'Why is the studio always coldest in January when the deadlines are biggest. Conspiracy.',
    caption: null, mood: 'chaotic', area: 'corner', timestamp: '2025-01-15T10:30:00Z',
    username: 'freezing student', position: { x: 70, y: 75 }
  },
  {
    id: 'c4', type: 'text',
    content: 'Currently: procrastinating by reorganising all my Pantone swatches.',
    caption: 'Totally valid.', mood: 'chaotic', area: 'corner', timestamp: '2025-02-03T14:20:00Z',
    username: 'anonymous', position: { x: 88, y: 62 }
  }
];

// ── LIVE CACHE ────────────────────────────────────────────────────────────────
let _cache = [];  // filled by initDB() — always use this via getDrops()

function _fromRow(r) {
  return {
    id:        String(r.id),
    type:      r.type      || 'text',
    content:   r.content,
    caption:   r.caption   || null,
    mood:      r.mood,
    area:      r.area,
    timestamp: r.timestamp || new Date().toISOString(),
    username:  r.username  || 'anonymous student',
    position:  { x: Number(r.position_x) || 50, y: Number(r.position_y) || 50 },
  };
}

// ── PUBLIC API ────────────────────────────────────────────────────────────────
function getDrops() { return _cache; }

async function saveUserDrop(drop) {
  if (_sb) {
    const { error } = await _sb.from('drops').insert({
      type:       drop.type,
      content:    drop.content,
      caption:    drop.caption || null,
      mood:       drop.mood,
      area:       drop.area,
      username:   drop.username,
      position_x: drop.position.x,
      position_y: drop.position.y,
    });
    if (error) {
      console.warn('[Checkpoint] Supabase insert error:', error.message);
    } else {
      _cache.unshift(drop);  // optimistic: show immediately
      return;
    }
  }
  // Fallback: sessionStorage (no Supabase or insert failed)
  const local = JSON.parse(sessionStorage.getItem('userDrops') || '[]');
  local.push(drop);
  sessionStorage.setItem('userDrops', JSON.stringify(local));
  _cache.push(drop);
}

// ── INIT — call once before rendering anything ────────────────────────────────
async function initDB() {
  if (!_live) {
    // No Supabase configured — use seed + any locally saved drops
    const local = JSON.parse(sessionStorage.getItem('userDrops') || '[]');
    _cache = [...DROPS_SEED, ...local];
    return;
  }

  try {
    _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data, error } = await _sb
      .from('drops')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(500);

    if (error) throw error;

    // Merge live drops with seed data (seed shown for visual richness until real drops come in)
    const liveIds = new Set(data.map(r => String(r.id)));
    const seeds   = DROPS_SEED.filter(d => !liveIds.has(d.id));
    _cache = [...data.map(_fromRow), ...seeds];

    // Subscribe to new drops in real time
    _sb.channel('drops-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'drops' }, payload => {
        const drop = _fromRow(payload.new);
        const exists = _cache.some(d => d.id === drop.id);
        if (!exists) {
          _cache.unshift(drop);
          if (typeof onNewDropArrived === 'function') onNewDropArrived(drop);
        }
      })
      .subscribe();

    console.log(`[Checkpoint] Loaded ${data.length} drops from Supabase.`);
  } catch (e) {
    console.warn('[Checkpoint] Supabase failed, using seed data:', e.message);
    const local = JSON.parse(sessionStorage.getItem('userDrops') || '[]');
    _cache = [...DROPS_SEED, ...local];
  }
}
