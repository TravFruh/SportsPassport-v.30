/* SportsPassport photo gallery v2: viewer lives inside the visit dialog's top layer. */
(function () {
  'use strict';

  const DETAIL = '#detailDialog';

  function moveGalleryToTop() {
    const content = document.querySelector('#detailContent');
    if (!content) return;
    const gallery = content.querySelector('#photoGallery');
    if (!gallery) return;
    const history = content.querySelector('.visit-history');
    const title = content.querySelector('.detail-title');
    const anchor = history || title;
    if (anchor && anchor.parentNode) {
      const next = anchor.nextElementSibling;
      if (next !== gallery) anchor.parentNode.insertBefore(gallery, next || null);
    }
    gallery.classList.add('sp-gallery-top');
  }

  function addStyles() {
    if (document.getElementById('spPhotoGalleryV2Styles')) return;
    const style = document.createElement('style');
    style.id = 'spPhotoGalleryV2Styles';
    style.textContent = `
      #detailContent .sp-gallery-top { margin: 14px 0 22px; }
      #detailContent #photoGallery .gallery-media { cursor: zoom-in; touch-action: manipulation; }
      #detailContent #photoGallery .gallery-item:first-child .gallery-media { outline: 2px solid rgba(37,99,235,.18); outline-offset: 2px; }
      #detailDialog .sp-photo-viewer-v2 {
        position: fixed;
        inset: 0;
        z-index: 99999;
        width: 100vw;
        height: 100vh;
        margin: 0;
        border: 0;
        padding: 0;
        background: rgba(0,0,0,.97);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        touch-action: none;
      }
      #detailDialog .sp-photo-viewer-v2[hidden] { display: none !important; }
      #detailDialog .sp-photo-stage-v2 {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 60px 12px 28px;
        box-sizing: border-box;
        touch-action: pan-y;
      }
      #detailDialog .sp-photo-stage-v2 img,
      #detailDialog .sp-photo-stage-v2 video {
        display: block;
        max-width: 100%;
        max-height: 100%;
        width: auto;
        height: auto;
        object-fit: contain;
        border-radius: 8px;
        user-select: none;
        -webkit-user-drag: none;
      }
      #detailDialog .sp-photo-viewer-v2 .sp-photo-close-v2,
      #detailDialog .sp-photo-viewer-v2 .sp-photo-prev-v2,
      #detailDialog .sp-photo-viewer-v2 .sp-photo-next-v2 {
        position: absolute;
        z-index: 5;
        width: 48px;
        height: 48px;
        border: 0;
        border-radius: 50%;
        background: rgba(255,255,255,.22);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        line-height: 1;
        font-size: 32px;
        -webkit-appearance: none;
        appearance: none;
      }
      #detailDialog .sp-photo-close-v2 { top: 12px; right: 12px; font-size: 34px; }
      #detailDialog .sp-photo-prev-v2 { left: 10px; top: 50%; transform: translateY(-50%); }
      #detailDialog .sp-photo-next-v2 { right: 10px; top: 50%; transform: translateY(-50%); }
      #detailDialog .sp-photo-counter-v2 {
        position: absolute;
        z-index: 5;
        top: 19px;
        left: 50%;
        transform: translateX(-50%);
        color: #fff;
        background: rgba(0,0,0,.5);
        border-radius: 999px;
        padding: 6px 11px;
        font: 700 13px/1 system-ui, sans-serif;
      }
      @media (max-width: 640px) {
        #detailDialog .sp-photo-stage-v2 { padding: 64px 6px 24px; }
        #detailDialog .sp-photo-prev-v2 { left: 5px; }
        #detailDialog .sp-photo-next-v2 { right: 5px; }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureViewer() {
    const dialog = document.querySelector(DETAIL);
    if (!dialog) return null;
    let viewer = dialog.querySelector('#spPhotoViewerV2');
    if (viewer) return viewer;

    viewer = document.createElement('div');
    viewer.id = 'spPhotoViewerV2';
    viewer.className = 'sp-photo-viewer-v2';
    viewer.hidden = true;
    viewer.setAttribute('aria-hidden', 'true');
    viewer.innerHTML = `
      <button type="button" class="sp-photo-close-v2" aria-label="Close photos">×</button>
      <button type="button" class="sp-photo-prev-v2" aria-label="Previous photo">‹</button>
      <div class="sp-photo-counter-v2" aria-live="polite"></div>
      <div class="sp-photo-stage-v2"></div>
      <button type="button" class="sp-photo-next-v2" aria-label="Next photo">›</button>`;
    dialog.appendChild(viewer);
    return viewer;
  }

  function install() {
    addStyles();
    const dialog = document.querySelector(DETAIL);
    if (!dialog || dialog.dataset.spGalleryV2Installed === '1') return;
    dialog.dataset.spGalleryV2Installed = '1';

    const viewer = ensureViewer();
    if (!viewer) return;
    const stage = viewer.querySelector('.sp-photo-stage-v2');
    const close = viewer.querySelector('.sp-photo-close-v2');
    const prev = viewer.querySelector('.sp-photo-prev-v2');
    const next = viewer.querySelector('.sp-photo-next-v2');
    const counter = viewer.querySelector('.sp-photo-counter-v2');
    let items = [];
    let index = 0;
    let startX = null;

    function currentItems() {
      const gallery = dialog.querySelector('#detailContent #photoGallery');
      return gallery ? [...gallery.querySelectorAll('.gallery-media')] : [];
    }

    function show(i) {
      if (!items.length) return;
      index = (i + items.length) % items.length;
      const source = items[index];
      stage.replaceChildren();
      const isVideo = source.tagName.toLowerCase() === 'video';
      const media = document.createElement(isVideo ? 'video' : 'img');
      media.src = source.currentSrc || source.src || source.getAttribute('src') || '';
      media.alt = source.alt || 'Visit photo';
      media.draggable = false;
      if (isVideo) {
        media.controls = true;
        media.playsInline = true;
        media.setAttribute('playsinline', '');
      }
      stage.appendChild(media);
      counter.textContent = `${index + 1} / ${items.length}`;
      prev.hidden = items.length < 2;
      next.hidden = items.length < 2;
    }

    function open(source) {
      items = currentItems();
      if (!items.length) return;
      const found = items.indexOf(source);
      index = found >= 0 ? found : 0;
      viewer.hidden = false;
      viewer.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      show(index);
    }

    function closeViewer() {
      viewer.hidden = true;
      viewer.setAttribute('aria-hidden', 'true');
      stage.replaceChildren();
      document.body.style.overflow = '';
      startX = null;
    }

    // Critical fix: listen on the actual top-layer visit dialog, not document/body.
    // A modal <dialog> can isolate pointer events from document-level handlers.
    dialog.addEventListener('pointerup', event => {
      if (viewer.hidden) {
        const media = event.target.closest?.('#detailContent #photoGallery .gallery-media');
        if (media) {
          event.preventDefault();
          event.stopPropagation();
          open(media);
        }
      }
    }, true);

    dialog.addEventListener('click', event => {
      if (viewer.hidden) {
        const media = event.target.closest?.('#detailContent #photoGallery .gallery-media');
        if (media) {
          event.preventDefault();
          event.stopPropagation();
          open(media);
        }
      }
    }, true);

    close.addEventListener('pointerup', event => {
      event.preventDefault();
      event.stopPropagation();
      closeViewer();
    }, true);
    prev.addEventListener('pointerup', event => {
      event.preventDefault();
      event.stopPropagation();
      show(index - 1);
    }, true);
    next.addEventListener('pointerup', event => {
      event.preventDefault();
      event.stopPropagation();
      show(index + 1);
    }, true);

    stage.addEventListener('pointerdown', event => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      startX = event.clientX;
    }, { passive: true });
    stage.addEventListener('pointerup', event => {
      if (startX == null || items.length < 2) return;
      const dx = event.clientX - startX;
      startX = null;
      if (Math.abs(dx) >= 40) {
        event.preventDefault();
        show(index + (dx < 0 ? 1 : -1));
      }
    }, { passive: false });

    viewer.addEventListener('pointerup', event => {
      if (event.target === viewer) closeViewer();
    }, true);

    document.addEventListener('keydown', event => {
      if (viewer.hidden) return;
      if (event.key === 'Escape') { event.preventDefault(); closeViewer(); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); show(index - 1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); show(index + 1); }
    });

    const observer = new MutationObserver(() => {
      moveGalleryToTop();
    });
    observer.observe(dialog.querySelector('#detailContent') || dialog, { childList: true, subtree: true });

    moveGalleryToTop();
  }

  function boot() {
    addStyles();
    install();
    moveGalleryToTop();
    if (!document.querySelector(DETAIL)?.dataset.spGalleryV2Installed) {
      setTimeout(install, 250);
      setTimeout(install, 1000);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
