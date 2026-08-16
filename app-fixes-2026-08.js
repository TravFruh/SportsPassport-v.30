/* SportsPassport targeted fixes: conference/team logos, 2026 CFB additions, and tappable/swipeable visit media. */
(function () {
  'use strict';

  const conferenceLogoOverrides = {
    'American': 'https://a.espncdn.com/i/teamlogos/ncaa_conf/500/151.png',
    'SEC': 'https://a.espncdn.com/i/teamlogos/ncaa_conf/500/8.png',
    'Pac-12': 'https://a.espncdn.com/i/teamlogos/ncaa_conf/500/9.png',
    'WAC': 'https://a.espncdn.com/i/teamlogos/ncaa_conf/500/0.png'
  };

  // WAC does not have a dependable current ESPN conference-logo asset in the
  // existing data set. Use the conference's own current site favicon only as a
  // fallback; the CSS below prevents it from being stretched/blurry.
  conferenceLogoOverrides['WAC'] = 'https://www.google.com/s2/favicons?domain=wacsports.com&sz=128';

  const originalConferenceLogoUrl = window.conferenceLogoUrl;
  window.conferenceLogoUrl = function (sport, conference) {
    if (conferenceLogoOverrides[conference]) return conferenceLogoOverrides[conference];
    if (typeof originalConferenceLogoUrl === 'function') return originalConferenceLogoUrl(sport, conference);
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(conference || 'ncaa.com')}&sz=128`;
  };

  // Fix the USC alias: the current data calls the CFB team "Southern California",
  // which otherwise falls through to the generic California logo match.
  if (window.COLLEGE_LOGOS) {
    window.COLLEGE_LOGOS['southern california'] = 'https://a.espncdn.com/i/teamlogos/ncaa/500/30.png';
    window.COLLEGE_LOGOS['usc'] = 'https://a.espncdn.com/i/teamlogos/ncaa/500/30.png';
    window.COLLEGE_LOGOS['uab'] = 'https://a.espncdn.com/i/teamlogos/ncaa/500/5.png';
    window.COLLEGE_LOGOS['north dakota state'] = 'https://a.espncdn.com/i/teamlogos/ncaa/500/2449.png';
    window.COLLEGE_LOGOS['coastal carolina'] = 'https://a.espncdn.com/i/teamlogos/ncaa/500/324.png';
    window.COLLEGE_LOGOS['james madison'] = 'https://a.espncdn.com/i/teamlogos/ncaa/500/256.png';
  }

  // Add the requested 2026 FBS schools if they are not already in the master list.
  const additions = [
    {
      id: 'CFB-166', sport: 'CFB', level: 'NCAA Football - FBS', conference: 'American', division: 'FBS',
      team: 'UAB', venue: 'Protective Stadium', city: 'Birmingham', state: 'AL',
      capacity: '45000', opened: '2021', lat: 33.5146, lng: -86.8135
    },
    {
      id: 'CFB-167', sport: 'CFB', level: 'NCAA Football - FBS', conference: 'Mountain West', division: 'FBS',
      team: 'North Dakota State', venue: 'Fargodome', city: 'Fargo', state: 'ND',
      capacity: '18500', opened: '1992', lat: 46.8999, lng: -96.8059
    },
    {
      id: 'CFB-168', sport: 'CFB', level: 'NCAA Football - FBS', conference: 'Sun Belt', division: 'FBS',
      team: 'Coastal Carolina', venue: 'Brooks Stadium', city: 'Conway', state: 'SC',
      capacity: '21000', opened: '2003', lat: 33.7944, lng: -79.0116
    },
    {
      id: 'CFB-169', sport: 'CFB', level: 'NCAA Football - FBS', conference: 'Sun Belt', division: 'FBS',
      team: 'James Madison', venue: 'Bridgeforth Stadium', city: 'Harrisonburg', state: 'VA',
      capacity: '24877', opened: '1975', lat: 38.4322, lng: -78.8718
    }
  ];

  if (Array.isArray(window.STADIUMS)) {
    additions.forEach(team => {
      if (!window.STADIUMS.some(x => x.id === team.id || (x.sport === team.sport && x.team === team.team))) {
        window.STADIUMS.push(team);
      }
    });
  }

  // Make the conference badges use crisp, appropriately sized source images.
  const style = document.createElement('style');
  style.textContent = `
    .header-badge img { width: 100%; height: 100%; object-fit: contain; image-rendering: auto; }
    .gallery-media { cursor: zoom-in; touch-action: pan-y; }
    .sp-media-lightbox { position: fixed; inset: 0; z-index: 10000; background: rgba(0,0,0,.94); display:flex; align-items:center; justify-content:center; padding: 56px 54px 42px; }
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
    document.body.appendChild(box);
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
      let media;
      if (source.tagName.toLowerCase() === 'video') {
        media = document.createElement('video');
        media.controls = true;
        media.playsInline = true;
      } else {
        media = document.createElement('img');
      }
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

    function closeBox() {
      box.hidden = true;
      stage.innerHTML = '';
      document.body.style.overflow = '';
    }

    document.addEventListener('click', event => {
      const media = event.target.closest('.gallery-item .gallery-media, .game-card-photo img, .game-card-photo video');
      if (media) open(media);
    });
    close.onclick = closeBox;
    prev.onclick = () => show(index - 1);
    next.onclick = () => show(index + 1);
    box.addEventListener('click', event => { if (event.target === box) closeBox(); });
    document.addEventListener('keydown', event => {
      if (box.hidden) return;
      if (event.key === 'Escape') closeBox();
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

  // Re-render once so the newly added CFB teams and logo aliases appear in all
  // existing league/checklist views. Personal visit state remains in local storage.
  if (typeof window.render === 'function') {
    try { window.render(); } catch (err) { console.warn('SportsPassport targeted fixes render refresh failed', err); }
  }
})();
