/* SportsPassport targeted fixes: conference/team logos, 2026 CFB additions, and tappable/swipeable visit media. */
(function () {
  'use strict';

  const conferenceLogoOverrides = {
    'American': 'https://a.espncdn.com/i/teamlogos/ncaa_conf/500/151.png',
    'SEC': 'https://a.espncdn.com/i/teamlogos/ncaa_conf/500/8.png',
    'Pac-12': 'https://a.espncdn.com/i/teamlogos/ncaa_conf/500/9.png',
    'WAC': 'https://commons.wikimedia.org/wiki/Special:Redirect/file/WAC_current_logo.png'
  };

  const originalConferenceLogoUrl = window.conferenceLogoUrl;
  window.conferenceLogoUrl = function (sport, conference) {
    if (conferenceLogoOverrides[conference]) return conferenceLogoOverrides[conference];
    if (typeof originalConferenceLogoUrl === 'function') return originalConferenceLogoUrl(sport, conference);
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(conference || 'ncaa.com')}&sz=128`;
  };

  if (window.COLLEGE_LOGOS) {
    window.COLLEGE_LOGOS['southern california'] = 'https://a.espncdn.com/i/teamlogos/ncaa/500/30.png';
    window.COLLEGE_LOGOS['usc'] = 'https://a.espncdn.com/i/teamlogos/ncaa/500/30.png';
    window.COLLEGE_LOGOS['uab'] = 'https://a.espncdn.com/i/teamlogos/ncaa/500/5.png';
    window.COLLEGE_LOGOS['north dakota state'] = 'https://a.espncdn.com/i/teamlogos/ncaa/500/2449.png';
    window.COLLEGE_LOGOS['coastal carolina'] = 'https://a.espncdn.com/i/teamlogos/ncaa/500/324.png';
    window.COLLEGE_LOGOS['james madison'] = 'https://a.espncdn.com/i/teamlogos/ncaa/500/256.png';
  }

  const additions = [
    { id: 'CFB-166', sport: 'CFB', level: 'NCAA Football - FBS', conference: 'American', division: 'FBS', team: 'UAB', venue: 'Protective Stadium', city: 'Birmingham', state: 'AL', capacity: '45000', opened: '2021', lat: 33.5146, lng: -86.8135 },
    { id: 'CFB-167', sport: 'CFB', level: 'NCAA Football - FBS', conference: 'Mountain West', division: 'FBS', team: 'North Dakota State', venue: 'Fargodome', city: 'Fargo', state: 'ND', capacity: '18500', opened: '1992', lat: 46.8999, lng: -96.8059 },
    { id: 'CFB-168', sport: 'CFB', level: 'NCAA Football - FBS', conference: 'Sun Belt', division: 'FBS', team: 'Coastal Carolina', venue: 'Brooks Stadium', city: 'Conway', state: 'SC', capacity: '21000', opened: '2003', lat: 33.7944, lng: -79.0116 },
    { id: 'CFB-169', sport: 'CFB', level: 'NCAA Football - FBS', conference: 'Sun Belt', division: 'FBS', team: 'James Madison', venue: 'Bridgeforth Stadium', city: 'Harrisonburg', state: 'VA', capacity: '24877', opened: '1975', lat: 38.4322, lng: -78.8718 }
  ];

  if (Array.isArray(window.STADIUMS)) {
    additions.forEach(team => {
      if (!window.STADIUMS.some(x => x.id === team.id || (x.sport === team.sport && x.team === team.team))) window.STADIUMS.push(team);
    });
  }

  const style = document.createElement('style');
  style.textContent = `
    .header-badge img { width: 100%; height: 100%; object-fit: contain; image-rendering: auto; }
    .gallery-media { cursor: zoom-in !important; touch-action: pan-y; pointer-events: auto !important; }
    .sp-media-lightbox { position: fixed; inset: 0; z-index: 100000; background: rgba(0,0,0,.94); display:flex; align-items:center; justify-content:center; padding: 56px 54px 42px; }
    .sp-media-lightbox[hidden] { display:none; }
    .sp-media-lightbox-stage { width:100%; height:100%; display:flex; align-items:center; justify-content:center; overflow:hidden; touch-action:pan-y; }
    .sp-media-lightbox img, .sp-media-lightbox video { max-width:100%; max-height:100%; object-fit:contain; border-radius:8px; box-shadow:0 10px 40px rgba(0,0,0,.45); }
    .sp-media-close, .sp-media-prev, .sp-media-next { position:absolute; z-index:2; border:0; border-radius:999px; width:44px; height:44px; background:rgba(255,255,255,.16); color:#fff; font-size:30px; line-height:1; display:flex; align-items:center; justify-content:center; cursor:pointer; }
    .sp-media-close { top:14px; right:14px; }
    .sp-media-prev { left:14px; top:50%; transform:translateY(-50%); }
    .sp-media-next { right:14px; top:50%; transform:translateY(-50%); }
    .sp-media-counter { position:absolute; top:18px; left:50%; transform:translateX(-50%); color:#fff; font-size:14px; font-weight:700; background:rgba(0,0,0,.35); padding:7px 12px; border-radius:999px; }
    @media (max-width: 640px) { .sp-media-lightbox { padding: 58px 10px 30px; } .sp-media-prev { left:7px; } .sp-media-next { right:7px; } }
  `;
  document.head.appendChild(style);

  function buildLightbox() {
    if (document.getElementById('spMediaLightbox')) return document.getElementById('spMediaLightbox');
    const box = document.createElement('div');
    box.id = 'spMediaLightbox';
    box.className = 'sp-media-lightbox';
    box.hidden = true;
    box.innerHTML = `
      <button type="button" class="sp-media-close" aria-label="Close photos">×</button>
      <button type="button" class="sp-media-prev" aria-label="Previous photo">‹</button>
      <div class="sp-media-counter" aria-live="polite"></div>
      <div class="sp-media-lightbox-stage"></div>
      <button type="button" class="sp-media-next" aria-label="Next photo">›</button>`;
    const detailDialog = document.getElementById('detailDialog');
    const host = detailDialog ? detailDialog.querySelector('.dialog-shell') || detailDialog : document.body;
    host.appendChild(box);
    return box;
  }

  function attachMediaViewer() {
    const box = buildLightbox();
    const stage = box.querySelector('.sp-media-lightbox-stage');
    const counter = box.querySelector('.sp-media-counter');
    const close = box.querySelector('.sp-media-close');
    const prev = box.querySelector('.sp-media-prev');
    const next = box.querySelector('.sp-media-next');
    let items = [];
    let index = 0;
    let touchStartX = null;

    function collectItems() {
      return [...document.querySelectorAll('.gallery-item .gallery-media, .game-card-photo img, .game-card-photo video')]
        .filter(el => el.offsetParent !== null || el.closest('dialog[open]'));
    }

    function show(i) {
      if (!items.length) return;
      index = (i + items.length) % items.length;
      const source = items[index];
      stage.innerHTML = '';
      const media = source.tagName.toLowerCase() === 'video' ? document.createElement('video') : document.createElement('img');
      if (media.tagName.toLowerCase() === 'video') { media.controls = true; media.playsInline = true; }
      media.src = source.currentSrc || source.src;
      media.alt = source.alt || 'Visit photo';
      stage.appendChild(media);
      counter.textContent = `${index + 1} / ${items.length}`;
      prev.hidden = items.length < 2;
      next.hidden = items.length < 2;
    }

    function open(source) {
      items = collectItems();
      index = Math.max(0, items.indexOf(source));
      if (!items.length) return;
      box.hidden = false;
      document.body.style.overflow = 'hidden';
      show(index);
    }

    function closeBox(event) {
      if (event) { event.preventDefault(); event.stopPropagation(); }
      box.hidden = true;
      stage.innerHTML = '';
      document.body.style.overflow = '';
    }

    document.addEventListener('click', event => {
      const media = event.target.closest && event.target.closest('.gallery-item .gallery-media, .game-card-photo img, .game-card-photo video');
      if (!media) return;
      event.preventDefault();
      event.stopPropagation();
      open(media);
    }, true);

    close.addEventListener('click', closeBox);
    prev.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); show(index - 1); });
    next.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); show(index + 1); });
    box.addEventListener('click', event => { if (event.target === box) closeBox(event); });
    document.addEventListener('keydown', event => {
      if (box.hidden) return;
      if (event.key === 'Escape') closeBox(event);
      if (event.key === 'ArrowLeft') show(index - 1);
      if (event.key === 'ArrowRight') show(index + 1);
    });
    stage.addEventListener('touchstart', event => { touchStartX = event.changedTouches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', event => {
      if (touchStartX == null || items.length < 2) return;
      const dx = event.changedTouches[0].clientX - touchStartX;
      touchStartX = null;
      if (Math.abs(dx) < 40) return;
      show(index + (dx < 0 ? 1 : -1));
    }, { passive: true });
  }

  attachMediaViewer();

  function makeVisitId(stadiumId, index) {
    const base = String(stadiumId || 'stadium');
    if (window.crypto && typeof window.crypto.randomUUID === 'function') return `v-${base}-${window.crypto.randomUUID()}`;
    return `v-${base}-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function repairVisitIds() {
    let state;
    try { state = JSON.parse(localStorage.getItem('stadiumPassportState') || '{}'); } catch { return false; }
    let changed = false;
    Object.entries(state).forEach(([stadiumId, record]) => {
      if (!record || !Array.isArray(record.visits)) return;
      const seen = new Set();
      record.visits.forEach((visit, index) => {
        if (!visit || typeof visit !== 'object') return;
        const id = String(visit.id || '').trim();
        if (!id || seen.has(id)) { visit.id = makeVisitId(stadiumId, index); changed = true; }
        seen.add(visit.id);
      });
    });
    if (changed) {
      localStorage.setItem('stadiumPassportState', JSON.stringify(state));
      localStorage.setItem('stadiumPassportLocalUpdatedAt', new Date().toISOString());
      window.StadiumCloud?.scheduleSync?.();
    }
    return changed;
  }

  function getCurrentStadiumId() {
    return document.getElementById('detailContent')?.dataset?.stadiumId || '';
  }

  const originalOpenDetail = window.openDetail;
  if (typeof originalOpenDetail === 'function') {
    let openChain = Promise.resolve();
    window.openDetail = function (stadiumId, visitId) {
      const repaired = repairVisitIds();
      if (repaired) {
        window.location.reload();
        return Promise.resolve();
      }
      const run = openChain.then(async () => {
        const result = await originalOpenDetail(stadiumId, visitId || '');
        const content = document.getElementById('detailContent');
        if (content) content.dataset.stadiumId = stadiumId;
        return result;
      });
      openChain = run.catch(() => {});
      return run;
    };

    document.addEventListener('click', function (event) {
      const item = event.target.closest && event.target.closest('.visit-history-item');
      if (!item) return;
      const stadiumId = getCurrentStadiumId();
      const visitId = item.dataset.visitId || '';
      if (!stadiumId || !visitId) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      window.openDetail(stadiumId, visitId);
    }, true);
  }

  const repairedOnLoad = repairVisitIds();
  if (repairedOnLoad) {
    window.location.reload();
    return;
  }

  if (typeof window.render === 'function') {
    try { window.render(); } catch (err) { console.warn('SportsPassport targeted fixes render refresh failed', err); }
  }
})();