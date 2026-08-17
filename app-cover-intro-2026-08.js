/* Stadium Passport opening cover: show the Overview design, then zoom into the Overview page. */
(function () {
  'use strict';
  function startCover() {
    const cover = document.getElementById('appCoverIntro');
    if (!cover) return;

    // Show on each fresh app/page launch, but never interrupt an already-open
    // page while the browser is navigating within the app.
    requestAnimationFrame(() => {
      cover.classList.add('is-ready');
      setTimeout(() => cover.classList.add('is-exiting'), 1050);
      setTimeout(() => {
        cover.classList.add('is-hidden');
        cover.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('cover-intro-active');
      }, 1750);
    });
  }

  document.addEventListener('DOMContentLoaded', startCover, { once: true });
})();
