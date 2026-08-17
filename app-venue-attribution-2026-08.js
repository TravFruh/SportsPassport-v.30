/* Stadium Passport — venue attribution editor
   Lets a game belong to one team while being physically played at another team's arena.
   This keeps the college team checked off without incorrectly checking off the NBA/NFL/MLB home team. */
(function(){
  const STATE_KEY='stadiumPassportState';
  let stadiums=[];

  async function loadStadiums(){
    if(stadiums.length)return stadiums;
    try{
      const src=await fetch('data.js',{cache:'no-store'}).then(r=>r.text());
      stadiums=new Function(src+'; return STADIUMS;')();
    }catch(e){
      console.error('Venue attribution editor could not load team data.',e);
      stadiums=[];
    }
    return stadiums;
  }

  function readState(){try{return JSON.parse(localStorage.getItem(STATE_KEY)||'{}')}catch(e){return {}}}
  function writeState(state){localStorage.setItem(STATE_KEY,JSON.stringify(state));localStorage.setItem('stadiumPassportLocalUpdatedAt',new Date().toISOString());}
  function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
  function keyLabel(x){return `${x.team} — ${x.venue} · ${x.city}${x.state?', '+x.state:''}`;}

  function findCurrentVisit(){
    const active=document.querySelector('#detailContent .visit-history-item.active');
    if(!active)return null;
    const visitId=active.dataset.visitId;
    const state=readState();
    for(const [sourceId,record] of Object.entries(state)){
      const visits=Array.isArray(record?.visits)?record.visits:[];
      const visit=visits.find(v=>v.id===visitId);
      if(visit)return {state,sourceId,visit,visitId};
    }
    return null;
  }

  async function copyMedia(oldId,newId,visitId){
    if(oldId===newId)return;
    try{
      const db=await new Promise((resolve,reject)=>{const req=indexedDB.open('stadiumPassportPhotos',1);req.onupgradeneeded=()=>req.result.createObjectStore('photos');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
      const copy=async(keyFrom,keyTo)=>new Promise((resolve,reject)=>{const tx=db.transaction('photos','readwrite'),store=tx.objectStore('photos'),get=store.get(keyFrom);get.onsuccess=()=>{if(Array.isArray(get.result)&&get.result.length)store.put(get.result,keyTo);store.delete(keyFrom)};get.onerror=()=>reject(get.error);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});
      await copy(`${oldId}::${visitId}`,`${newId}::${visitId}`);
      await copy(`ticket::${oldId}::${visitId}`,`ticket::${newId}::${visitId}`);
      db.close();
    }catch(e){console.warn('Could not move visit media.',e);}
  }

  function showEditor(){
    const current=findCurrentVisit();
    if(!current){alert('Open a saved visit first, then use Edit Venue Attribution.');return;}
    const {state,sourceId,visit}=current;
    const all=stadiums.slice().sort((a,b)=>a.sport.localeCompare(b.sport)||a.team.localeCompare(b.team));
    const currentVenueId=visit.venueId||sourceId;
    const creditOptions=all.map(x=>`<option value="${esc(x.id)}" ${x.id===sourceId?'selected':''}>${esc(keyLabel(x))} (${esc(x.sport)})</option>`).join('');
    const venueOptions=all.map(x=>`<option value="${esc(x.id)}" ${x.id===currentVenueId?'selected':''}>${esc(x.venue)} — ${esc(x.city)}${x.state?', '+esc(x.state):''} (${esc(x.sport)})</option>`).join('');
    let box=document.getElementById('venueAttributionEditor');
    if(!box){box=document.createElement('div');box.id='venueAttributionEditor';document.body.appendChild(box);}
    box.innerHTML=`<div class="vat-backdrop"></div><div class="vat-panel" role="dialog" aria-modal="true" aria-labelledby="vatTitle"><button type="button" class="vat-close" id="vatClose" aria-label="Close">×</button><p class="eyebrow">VISIT ATTRIBUTION</p><h2 id="vatTitle">Edit who gets credit for this visit</h2><p class="vat-intro">Use this when you attended a college game at a professional arena. The team you select gets the visit credit, while the actual venue can be a different team's home arena.</p><label>Team credited for the game<select id="vatCreditTeam">${creditOptions}</select></label><label>Actual venue where you attended the game<select id="vatVenue">${venueOptions}</select></label><div class="vat-preview" id="vatPreview"></div><div class="vat-actions"><button type="button" class="secondary" id="vatCancel">Cancel</button><button type="button" class="save" id="vatSave">Save attribution</button></div></div>`;
    const credit=box.querySelector('#vatCreditTeam'),venue=box.querySelector('#vatVenue'),preview=box.querySelector('#vatPreview');
    const updatePreview=()=>{const c=all.find(x=>x.id===credit.value),v=all.find(x=>x.id===venue.value);preview.innerHTML=`<strong>${esc(c?.team||'Selected team')}</strong> will be marked <span class="vat-good">VISITED</span><br><span>Actual venue: ${esc(v?.venue||'Selected venue')}</span>${c&&v&&c.id!==v.id?'<br><small>The home team at the actual venue will <strong>not</strong> be marked visited.</small>':''}`;};
    credit.onchange=updatePreview;venue.onchange=updatePreview;updatePreview();
    const close=()=>box.remove();box.querySelector('#vatClose').onclick=close;box.querySelector('#vatCancel').onclick=close;box.querySelector('.vat-backdrop').onclick=close;
    box.querySelector('#vatSave').onclick=async()=>{
      const newCreditId=credit.value,newVenueId=venue.value;
      if(!newCreditId||!newVenueId)return;
      const latest=readState();
      let saved=null;
      for(const record of Object.values(latest)){const visits=Array.isArray(record?.visits)?record.visits:[];const hit=visits.find(v=>v.id===current.visitId);if(hit){saved={...hit};break;}}
      if(!saved){alert('That visit could not be found. Please reopen it and try again.');close();return;}
      saved.venueId=newVenueId;
      saved.neutralSite=newCreditId!==newVenueId;
      saved.attributionMode=newCreditId!==newVenueId?'separate-team-and-venue':'home-team';
      for(const id of Object.keys(latest)){
        if(!Array.isArray(latest[id]?.visits))continue;
        latest[id].visits=latest[id].visits.filter(v=>v.id!==current.visitId);
      }
      latest[newCreditId]??={visits:[]};
      latest[newCreditId].visits.push(saved);
      writeState(latest);
      await copyMedia(current.sourceId,newCreditId,current.visitId);
      close();
      location.reload();
    };
  }

  function injectButton(){
    const panel=document.querySelector('#detailContent .event-location-panel');
    const actions=document.querySelector('#detailContent .visit-actions');
    if(!panel||!actions||document.getElementById('editVenueAttributionBtn'))return;
    const btn=document.createElement('button');btn.type='button';btn.id='editVenueAttributionBtn';btn.className='secondary';btn.textContent='Edit Venue Attribution';btn.title='Choose which team gets credit and where the game was actually played';
    actions.insertBefore(btn,actions.firstChild);btn.onclick=async()=>{await loadStadiums();showEditor();};
  }

  const style=document.createElement('style');style.textContent=`#editVenueAttributionBtn{margin-right:8px}.vat-backdrop{position:fixed;inset:0;background:rgba(15,23,42,.58);backdrop-filter:blur(2px);z-index:100000}.vat-panel{position:fixed;z-index:100001;left:50%;top:50%;transform:translate(-50%,-50%);width:min(92vw,620px);max-height:88vh;overflow:auto;background:#fff;color:#111827;border-radius:22px;padding:28px;box-shadow:0 24px 80px rgba(0,0,0,.35);box-sizing:border-box}.vat-close{position:absolute;right:14px;top:10px;border:0;background:transparent;font-size:30px;line-height:1;cursor:pointer;color:#64748b}.vat-panel h2{margin:4px 0 10px;font-size:26px}.vat-intro{color:#475569;line-height:1.5;margin:0 0 20px}.vat-panel label{display:block;font-weight:700;margin:14px 0;color:#1e293b}.vat-panel select{display:block;width:100%;margin-top:7px;padding:12px;border:1px solid #cbd5e1;border-radius:10px;background:#fff;font:inherit}.vat-preview{margin:18px 0;padding:14px 16px;border-radius:12px;background:#f1f5f9;line-height:1.55}.vat-good{font-weight:800}.vat-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:20px}@media(max-width:600px){.vat-panel{padding:22px 18px}.vat-actions{flex-direction:column-reverse}.vat-actions button{width:100%}#editVenueAttributionBtn{margin:0 0 8px;width:100%}}`;document.head.appendChild(style);
  const observer=new MutationObserver(()=>injectButton());
  observer.observe(document.getElementById('detailContent')||document.body,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',injectButton);
})();
