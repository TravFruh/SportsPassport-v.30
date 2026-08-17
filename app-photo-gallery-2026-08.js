/* SportsPassport photo-gallery refinement: move visit photos to the top of the visit view and provide a dedicated, reliable tap/swipe viewer. */
(function () {
  'use strict';

  function moveGalleryToTop() {
    const content = document.getElementById('detailContent');
    if (!content) return;
    const gallery = content.querySelector('#photoGallery');
    const history = content.querySelector('.visit-history');
    const title = content.querySelector('.detail-title');
    if (!gallery) return;
    // Put the gallery immediately below the visit history/title and before the editor.
    const anchor = history || title;
    if (anchor && anchor.parentNode) {
      const next = anchor.nextElementSibling;
      if (next !== gallery) anchor.parentNode.insertBefore(gallery, next || null);
    }
    gallery.classList.add('sp-gallery-top');
  }

  const style = document.createElement('style');
  style.textContent = `
    #detailContent .sp-gallery-top { margin: 14px 0 22px; }
    #detailContent .sp-gallery-top .gallery-media { cursor: zoom-in; touch-action: manipulation; }
    #detailContent .sp-gallery-top .gallery-item:first-child .gallery-media { outline: 2px solid rgba(37,99,235,.18); outline-offset: 2px; }
    .sp-photo-viewer { position:fixed; inset:0; z-index:11000; background:rgba(0,0,0,.96); display:flex; align-items:center; justify-content:center; padding:56px 52px 32px; }
    .sp-photo-viewer[hidden] { display:none; }
    .sp-photo-stage { width:100%; height:100%; display:flex; align-items:center; justify-content:center; touch-action:pan-y; overflow:hidden; }
    .sp-photo-stage img, .sp-photo-stage video { max-width:100%; max-height:100%; object-fit:contain; border-radius:8px; }
    .sp-photo-viewer button { -webkit-appearance:none; appearance:none; }
    .sp-photo-close, .sp-photo-prev, .sp-photo-next { position:absolute; z-index:3; width:46px; height:46px; border:0; border-radius:50%; background:rgba(255,255,255,.2); color:#fff; display:flex; align-items:center; justify-content:center; font-size:30px; line-height:1; padding:0; }
    .sp-photo-close { top:12px; right:12px; font-size:32px; }
    .sp-photo-prev { left:12px; top:50%; transform:translateY(-50%); }
    .sp-photo-next { right:12px; top:50%; transform:translateY(-50%); }
    .sp-photo-counter { position:absolute; z-index:3; top:17px; left:50%; transform:translateX(-50%); color:#fff; background:rgba(0,0,0,.45); border-radius:999px; padding:6px 11px; font-size:13px; font-weight:700; }
    @media (max-width:640px) { .sp-photo-viewer { padding:60px 8px 24px; } .sp-photo-prev { left:6px; } .sp-photo-next { right:6px; } }
  `;
  document.head.appendChild(style);

  function buildViewer() {
    let viewer = document.getElementById('spPhotoViewer');
    if (viewer) return viewer;
    viewer = document.createElement('div');
    viewer.id = 'spPhotoViewer';
    viewer.className = 'sp-photo-viewer';
    viewer.hidden = true;
    viewer.innerHTML = `
      <button type="button" class="sp-photo-close" aria-label="Close photos">×</button>
      <button type="button" class="sp-photo-prev" aria-label="Previous photo">‹</button>
      <div class="sp-photo-counter" aria-live="polite"></div>
      <div class="sp-photo-stage"></div>
      <button type="button" class="sp-photo-next" aria-label="Next photo">›</button>`;
    document.body.appendChild(viewer);
    return viewer;
  }

  function installViewer() {
    const viewer = buildViewer();
    const stage = viewer.querySelector('.sp-photo-stage');
    const close = viewer.querySelector('.sp-photo-close');
    const prev = viewer.querySelector('.sp-photo-prev');
    const next = viewer.querySelector('.sp-photo-next');
    const counter = viewer.querySelector('.sp-photo-counter');
    let items = [];
    let index = 0;
    let startX = null;

    function currentGalleryItems() {
      const gallery = document.querySelector('#detailContent #photoGallery');
      if (!gallery) return [];
      return [...gallery.querySelectorAll('.gallery-media')];
    }

    function show(i) {
      if (!items.length) return;
      index = (i + items.length) % items.length;
      const source = items[index];
      stage.innerHTML = '';
      const isVideo = source.tagName.toLowerCase() === 'video';
      const media = document.createElement(isVideo ? 'video' : 'img');
      media.src = source.currentSrc || source.src;
      media.alt = source.alt || 'Visit photo';
      if (isVideo) { media.controls = true; media.playsInline = true; }
      stage.appendChild(media);
      counter.textContent = `${index + 1} / ${items.length}`;
      prev.hidden = items.length < 2;
      next.hidden = items.length < 2;
    }

    function open(source) {
      items = currentGalleryItems();
      index = Math.max(0, items.indexOf(source));
      if (!items.length) return;
      viewer.hidden = false;
      document.body.style.overflow = 'hidden';
      show(index);
    }

    function closeViewer() {
      viewer.hidden = true;
      stage.innerHTML = '';
      document.body.style.overflow = '';
      startX = null;
    }

    // Direct listeners on the gallery prevent the older document-level viewer from
    // intercepting the tap. The first photo is therefore the entry point.
    document.addEventListener('click', event => {
      const source = event.target.closest('#detailContent #photoGallery .gallery-media');
      if (!source) return;
      event.preventDefault();
      event.stopPropagation();
      open(source);
    }, true);

    // Use capture-phase listeners so the close button always wins immediately,
    // including on mobile browsers where a dialog/document click can otherwise interfere.
    close.addEventListener('pointerdown', event => { event.preventDefault(); event.stopPropagation(); closeViewer(); }, true);
    prev.addEventListener('pointerdown', event => { event.preventDefault(); event.stopPropagation(); show(index - 1); }, true);
    next.addEventListener('pointerdown', event => { event.preventDefault(); event.stopPropagation(); show(index + 1); }, true);
    viewer.addEventListener('pointerdown', event => { if (event.target === viewer) { event.preventDefault(); closeViewer(); } }, true);
    viewer.addEventListener('click', event => event.stopPropagation(), true);

    document.addEventListener('keydown', event => {
      if (viewer.hidden) return;
      if (event.key === 'Escape') { event.preventDefault(); closeViewer(); }
      else if (event.key === 'ArrowLeft') { event.preventDefault(); show(index - 1); }
      else if (event.key === 'ArrowRight') { event.preventDefault(); show(index + 1); }
    });

    stage.addEventListener('touchstart', event => { startX = event.changedTouches[0].clientX; }, { passive:true });
    stage.addEventListener('touchend', event => {
      if (startX == null || items.length < 2) return;
      const dx = event.changedTouches[0].clientX - startX;
      startX = null;
      if (Math.abs(dx) >= 40) show(index + (dx < 0 ? 1 : -1));
    }, { passive:true });
  }

  installViewer();
  moveGalleryToTop();

  const content = document.getElementById('detailContent');
  if (content) new MutationObserver(moveGalleryToTop).observe(content, { childList:true, subtree:true });
  else {
    const timer = setInterval(() => {
      moveGalleryToTop();
      if (document.getElementById('detailContent')) { clearInterval(timer); const el=document.getElementById('detailContent'); new MutationObserver(moveGalleryToTop).observe(el,{childList:true,subtree:true}); }
    }, 250);
    setTimeout(() => clearInterval(timer), 15000);
  }
})();
