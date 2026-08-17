/* SportsPassport visit-history integrity fix — 2026-08-16 */
(function () {
  'use strict';

  function makeVisitId(stadiumId, index) {
    const base = String(stadiumId || 'stadium');
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return `v-${base}-${window.crypto.randomUUID()}`;
    }
    return `v-${base}-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 10)}`;
  }

  // Repair missing/duplicate visit IDs without changing any visit data.
  // The history UI uses the ID as its selector, so an empty or duplicated ID
  // can make a click select the wrong visit or appear to discard other visits.
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
        if (!id || seen.has(id)) {
          visit.id = makeVisitId(stadiumId, index);
          changed = true;
        }
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
  if (typeof originalOpenDetail !== 'function') return;

  // Serialize detail opens and stamp the current stadium onto the detail pane.
  // This prevents overlapping async redraws from racing each other.
  let openChain = Promise.resolve();
  window.openDetail = function (stadiumId, visitId) {
    repairVisitIds();
    const run = openChain.then(async () => {
      const result = await originalOpenDetail(stadiumId, visitId || '');
      const content = document.getElementById('detailContent');
      if (content) content.dataset.stadiumId = stadiumId;
      return result;
    });
    openChain = run.catch(() => {});
    return run;
  };

  // Replace the history item's local draw() behavior with a fresh openDetail()
  // call. The original handler closes over an async draw function; rapid clicks
  // can otherwise leave an older draw overwriting the newer selection.
  document.addEventListener('click', function (event) {
    const item = event.target.closest && event.target.closest('.visit-history-item');
    if (!item) return;
    const stadiumId = getCurrentStadiumId();
    const visitId = item.dataset.visitId || '';
    if (!stadiumId || !visitId) return;
    event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
    window.openDetail(stadiumId, visitId);
  }, true);

  repairVisitIds();
})();
