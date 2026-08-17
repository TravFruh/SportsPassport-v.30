/* Stadium Passport: definitive visit/event opening fix — 2026-08-16 */
(function () {
  'use strict';

  // The original detail view renders asynchronously. A fast tap on a history row
  // could therefore let an older render finish after the newly selected visit,
  // making the newest event appear unopenable or causing the list to redraw.
  const nativeOpenDetail = window.openDetail;
  if (typeof nativeOpenDetail !== 'function') return;

  let currentStadiumId = '';
  let openSequence = 0;

  function repairVisitIds() {
    let state;
    try { state = JSON.parse(localStorage.getItem('stadiumPassportState') || '{}'); }
    catch { return; }
    let changed = false;
    Object.entries(state).forEach(([stadiumId, record]) => {
      if (!record || !Array.isArray(record.visits)) return;
      const seen = new Set();
      record.visits.forEach((visit, index) => {
        if (!visit || typeof visit !== 'object') return;
        let id = String(visit.id || '').trim();
        if (!id || seen.has(id)) {
          id = `v-${stadiumId}-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 9)}`;
          visit.id = id;
          changed = true;
        }
        seen.add(id);
      });
    });
    if (changed) localStorage.setItem('stadiumPassportState', JSON.stringify(state));
  }

  repairVisitIds();

  window.openDetail = function (stadiumId, visitId) {
    currentStadiumId = String(stadiumId || '');
    const sequence = ++openSequence;
    const content = document.getElementById('detailContent');
    if (content) content.dataset.stadiumId = currentStadiumId;
    return Promise.resolve(nativeOpenDetail(stadiumId, visitId || '')).then(result => {
      // Keep the stadium context attached to the detail panel for subsequent
      // history clicks. Never let an older open operation replace it.
      if (sequence === openSequence) {
        const current = document.getElementById('detailContent');
        if (current) current.dataset.stadiumId = currentStadiumId;
      }
      return result;
    });
  };

  function openSelectedVisit(visitId) {
    const id = String(visitId || '').trim();
    const stadiumId = currentStadiumId || document.getElementById('detailContent')?.dataset?.stadiumId || '';
    if (!stadiumId || !id) return false;
    // Stop the original row handler. We deliberately run one controlled open.
    window.openDetail(stadiumId, id);
    return true;
  }

  // Capture phase guarantees that the original per-row onclick in app.js does
  // not also call draw() and race this selection.
  document.addEventListener('click', function (event) {
    const historyRow = event.target.closest && event.target.closest('.visit-history-item');
    if (historyRow) {
      const visitId = historyRow.dataset.visitId;
      if (visitId && openSelectedVisit(visitId)) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }
      return;
    }

    // Passport stamps are also individual visit events and should use the same
    // controlled opener.
    const stamp = event.target.closest && event.target.closest('.passport-stamp');
    if (stamp && stamp.dataset.visitId && stamp.dataset.id) {
      currentStadiumId = stamp.dataset.id;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      window.openDetail(stamp.dataset.id, stamp.dataset.visitId);
    }
  }, true);

  // If the detail panel is opened through another app control, record its venue
  // immediately after the DOM is painted so history rows always have context.
  const observer = new MutationObserver(() => {
    const content = document.getElementById('detailContent');
    if (content && currentStadiumId && content.dataset.stadiumId !== currentStadiumId) {
      content.dataset.stadiumId = currentStadiumId;
    }
  });
  const content = document.getElementById('detailContent');
  if (content) observer.observe(content, { childList: true, subtree: true });
})();
