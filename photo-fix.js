(() => {
  const STYLE_ID = 'stadium-smart-photo-style-v2';

  function installStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .overview-mode .event-photo {
        position: relative;
        overflow: hidden;
        background-color: #111;
        background-position: center;
        background-repeat: no-repeat;
        background-size: cover;
      }

      .overview-mode .event-photo::after {
        content: "";
        position: absolute;
        inset: 0;
        background: rgba(0,0,0,.16);
        pointer-events: none;
        z-index: 0;
      }

      .overview-mode .event-photo img.event-card-media {
        position: relative;
        z-index: 1;
        width: 100% !important;
        height: 100% !important;
        display: block;
        object-position: center center !important;
      }

      .overview-mode .event-photo img.event-card-media.photo-is-portrait {
        object-fit: contain !important;
      }

      .overview-mode .event-photo img.event-card-media.photo-is-landscape {
        object-fit: cover !important;
      }
    `;
    document.head.appendChild(style);
  }

  function classifyImage(img) {
    if (!(img instanceof HTMLImageElement)) return;
    if (!img.matches('.overview-mode .event-photo img.event-card-media')) return;

    const apply = () => {
      if (!img.naturalWidth || !img.naturalHeight) return;
      const ratio = img.naturalWidth / img.naturalHeight;
      const portrait = ratio < 0.92;

      img.classList.toggle('photo-is-portrait', portrait);
      img.classList.toggle('photo-is-landscape', !portrait);

      const frame = img.closest('.event-photo');
      if (frame) {
        frame.style.backgroundImage = portrait ? `url("${img.currentSrc || img.src}")` : 'none';
      }
    };

    if (img.complete) apply();
    else img.addEventListener('load', apply, { once: true });
  }

  function scan(root = document) {
    root.querySelectorAll?.('.overview-mode .event-photo img.event-card-media').forEach(classifyImage);
  }

  installStyles();
  scan();

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof Element)) continue;
        if (node.matches?.('.overview-mode .event-photo img.event-card-media')) classifyImage(node);
        scan(node);
      }
    }
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('load', () => scan());
})();
