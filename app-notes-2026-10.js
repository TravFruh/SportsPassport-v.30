/* Stadium Passport — simple Notes (v42)
   A list of plain notes (title + text), newest first, with search. Saved on the device as you type
   and included in backups. */
(function(){
  const KEY='stadiumPassportNotesV1';
  const view={open:null,q:''};
  const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function read(){try{const a=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(a)?a:[];}catch{return [];}}
  function write(list){const s=JSON.stringify(list);return typeof safeSetItem==='function'?safeSetItem(KEY,s):(localStorage.setItem(KEY,s),true);}
  function upsert(note){const list=read();const i=list.findIndex(n=>n.id===note.id);if(i>=0)list[i]=note;else list.push(note);write(list);if(typeof markLocalChanged==='function')markLocalChanged();}
  function remove(id){write(read().filter(n=>n.id!==id));}
  window.readNotes=read;
  window.mergeNotes=incoming=>{if(!Array.isArray(incoming))return;const list=read();incoming.forEach(n=>{if(n&&n.id&&!list.some(m=>m.id===n.id))list.push(n);});write(list);};
  const fmt=t=>{const d=new Date(t);if(isNaN(d))return '';const now=new Date();return d.toLocaleDateString(undefined,d.getFullYear()===now.getFullYear()?{month:'short',day:'numeric'}:{month:'short',day:'numeric',year:'numeric'});};
  const firstLine=b=>String(b||'').split('\n').map(s=>s.trim()).find(Boolean)||'No additional text';

  function renderList(root){
    const q=view.q.trim().toLowerCase();
    const list=read().sort((a,b)=>(b.updated||'').localeCompare(a.updated||'')).filter(n=>!q||`${n.title}\n${n.body}`.toLowerCase().includes(q));
    root.innerHTML=`<div class="nt">
      <div class="nt-head"><div><small>MY NOTES</small><h2>Notes</h2></div><button type="button" class="nt-new" id="ntNew" aria-label="New note"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button></div>
      <label class="nt-search"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4b5563" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><input type="search" id="ntSearch" placeholder="Search notes" aria-label="Search notes" value="${e(view.q)}"></label>
      ${list.length?`<div class="nt-list">${list.map(n=>`<button type="button" class="nt-row" data-nt="${e(n.id)}"><span class="nt-row-top"><strong>${e(n.title||'Untitled note')}</strong><small>${e(fmt(n.updated))}</small></span><span class="nt-row-sub">${e(firstLine(n.body))}</span></button>`).join('')}</div>`
        :`<p class="nt-empty">${q?'No notes match your search.':'No notes yet. Tap + to write one — places to visit, sections, traditions, anything.'}</p>`}
    </div>`;
    root.querySelector('#ntNew').onclick=()=>{view.open={id:`n${Date.now().toString(36)}${Math.random().toString(36).slice(2,6)}`,title:'',body:'',updated:new Date().toISOString(),isNew:true};renderEditor(root);};
    const s=root.querySelector('#ntSearch');s.oninput=()=>{view.q=s.value;const pos=s.selectionStart;renderList(root);const n=root.querySelector('#ntSearch');n.focus();try{n.setSelectionRange(pos,pos);}catch{}};
    root.querySelectorAll('[data-nt]').forEach(b=>b.onclick=()=>{view.open={...read().find(n=>n.id===b.dataset.nt)};renderEditor(root);window.scrollTo({top:0});});
  }
  function renderEditor(root){
    const n=view.open;
    root.innerHTML=`<div class="nt">
      <div class="nt-head"><button type="button" class="nt-back" id="ntBack" aria-label="Back to notes"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg></button><div><small id="ntEdited">${n.isNew?'NEW NOTE':`EDITED ${e(fmt(n.updated).toUpperCase())}`}</small><h2>Note</h2></div><button type="button" class="nt-done" id="ntDone">Done</button></div>
      <div class="nt-paper"><input id="ntTitle" class="nt-title" placeholder="Title" aria-label="Note title" value="${e(n.title)}"><textarea id="ntBody" class="nt-body" placeholder="Write anything — places to visit, best sections, traditions, food to try…" aria-label="Note text">${e(n.body)}</textarea></div>
      ${n.isNew?'':'<button type="button" class="nt-delete" id="ntDelete">Delete note</button>'}
    </div>`;
    const t=root.querySelector('#ntTitle'),b=root.querySelector('#ntBody');
    const grow=()=>{b.style.height='auto';b.style.height=Math.max(320,b.scrollHeight)+'px';};grow();
    let timer=null;
    const save=()=>{const title=t.value.trim(),body=b.value;if(!title&&!body.trim()&&n.isNew)return;n.title=title;n.body=body;n.updated=new Date().toISOString();delete n.isNew;upsert({id:n.id,title:n.title,body:n.body,updated:n.updated});const lbl=root.querySelector('#ntEdited');if(lbl)lbl.textContent='SAVED';};
    const queue=()=>{clearTimeout(timer);timer=setTimeout(save,600);};
    t.oninput=queue;b.oninput=()=>{grow();queue();};
    const close=()=>{clearTimeout(timer);save();view.open=null;renderList(root);window.scrollTo({top:0});};
    root.querySelector('#ntBack').onclick=close;root.querySelector('#ntDone').onclick=close;
    const d=root.querySelector('#ntDelete');if(d)d.onclick=()=>{if(!confirm('Delete this note? This can’t be undone.'))return;clearTimeout(timer);remove(n.id);view.open=null;renderList(root);};
    if(n.isNew)t.focus();
  }
  window.renderNotes=function(root){if(!root)return;document.body.classList.add('notes-mode');if(view.open)renderEditor(root);else renderList(root);};
  window.leaveNotes=function(){document.body.classList.remove('notes-mode');if(view.open){const t=document.getElementById('ntTitle'),b=document.getElementById('ntBody');if(t&&b){const title=t.value.trim(),body=b.value;if(title||body.trim()){view.open.title=title;view.open.body=body;view.open.updated=new Date().toISOString();upsert({id:view.open.id,title,body,updated:view.open.updated});}}view.open=null;}};
})();
