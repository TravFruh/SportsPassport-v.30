/* Stadium Passport — Leagues page (v39)
   League switch + progress ring, search & filters, conference dropdowns (NFL/MLB divisions,
   college conferences) → team logo tiles → team sheet with every visit. Bucket list with stars. */
(function(){
  const LEAGUE={NFL:{name:'NFL',color:'#1e3a8a'},CFB:{name:'College Football',color:'#b45309'},MLB:{name:'MLB',color:'#b91c1c'},CBB:{name:'College Basketball',color:'#0f766e'}};
  const ORDER=['NFL','CFB','MLB','CBB'];
  const BUCKET_KEY='stadiumPassportBucketV1';
  const view={group:null,bucket:false,filter:'all',q:'',open:{}};
  const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const MON=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const vis=x=>(typeof getVisits==='function'?getVisits(x.id):[]).filter(Boolean);
  const counted=x=>typeof isCountedVenue==='function'?isCountedVenue(x):true;
  const statusOf=x=>typeof venueStatus==='function'?venueStatus(x):'current';
  const yearOf=x=>typeof venueYear==='function'?venueYear(x):'';
  const venuesOf=x=>typeof teamVenues==='function'?teamVenues(x):[x];
  const visited=x=>vis(x).length>0;
  const norm=s=>typeof normalizeTeamName==='function'?normalizeTeamName(s):String(s||'').toLowerCase();

  /* ---------- bucket list ---------- */
  function bucket(){try{const a=JSON.parse(localStorage.getItem(BUCKET_KEY)||'[]');return Array.isArray(a)?a:[];}catch{return [];}}
  function saveBucket(a){const s=JSON.stringify([...new Set(a)]);typeof safeSetItem==='function'?safeSetItem(BUCKET_KEY,s):localStorage.setItem(BUCKET_KEY,s);}
  const inBucket=id=>bucket().includes(id);
  function toggleBucket(id){const a=bucket();const i=a.indexOf(id);if(i>=0)a.splice(i,1);else a.push(id);saveBucket(a);return i<0;}
  window.readBucketList=bucket;
  window.mergeBucketList=list=>{if(Array.isArray(list))saveBucket([...bucket(),...list]);};

  /* ---------- helpers ---------- */
  function initials(n){const w=String(n||'').replace(/[^A-Za-z0-9 ]/g,' ').split(/\s+/).filter(Boolean);return (w.length>1?w.map(x=>x[0]).join('').slice(0,3):String(n||'?').slice(0,3)).toUpperCase();}
  function teamColor(x){const c=typeof window.teamColorFor==='function'?window.teamColorFor(x.sport,x.team):'';return c||LEAGUE[x.sport]?.color||'#1f2937';}
  function logo(x,size,{on}={}){
    const src=typeof findLogo==='function'?findLogo(x.sport,x.team):'';const isOn=on??visited(x);
    return `<span class="lv-logo ${isOn?'on':'off'}" style="--s:${size}px;--ring:${teamColor(x)}">${src?`<img src="${e(src)}" alt="" loading="lazy" onerror="this.remove()">`:''}<b>${e(initials(x.team))}</b></span>`;
  }
  function groupsFor(sport){
    const rows=STADIUMS.filter(x=>x.sport===sport&&counted(x));
    if(sport==='NFL'||sport==='MLB'){
      const confs=[...new Set(rows.map(x=>x.conference))];
      return confs.map(c=>({name:sport==='MLB'?c:c,divs:['East','North','South','Central','West'].map(d=>({key:`${c}|${d}`,conf:c,name:d,list:rows.filter(x=>x.conference===c&&x.division===d)})).filter(g=>g.list.length)}));
    }
    const confs=[...new Set(rows.map(x=>x.conference||'Independent'))].sort((a,b)=>a.localeCompare(b));
    return [{name:'Conferences',divs:confs.map(c=>({key:`${c}|`,conf:'',name:c,list:rows.filter(x=>(x.conference||'Independent')===c)}))}];
  }
  function findGroup(sport,key){for(const g of groupsFor(sport))for(const d of g.divs)if(d.key===key)return d;return null;}
  const passFilter=x=>view.filter==='all'||(view.filter==='visited'?visited(x):!visited(x));
  function tierLabel(n){return n>=10?'Legend':n>=5?'Gold':n>=3?'Silver':n>=1?'Bronze':'';}
  function bar(p,c){return `<span class="lv-bar"><i style="width:${Math.round(p*100)}%;background:${c}"></i></span>`;}
  const chevR='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>';
  const chevD='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
  const starSvg=f=>`<svg width="16" height="16" viewBox="0 0 24 24" fill="${f?'currentColor':'none'}" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l2.8 5.8 6.2.9-4.5 4.4 1.1 6.2L12 17.4l-5.6 2.9 1.1-6.2L3 9.7l6.2-.9z"/></svg>`;

  function headerHtml(sport){
    const n=bucket().length;
    return `<div class="lv-head"><div class="lv-head-top"><h2>${view.bucket?'Bucket list':'Leagues'}</h2><button type="button" class="lv-bucket-btn ${view.bucket?'on':''}" id="lvBucket">${starSvg(true)}Bucket list · ${n}</button></div>
      <div class="lv-switch" role="tablist">${ORDER.map(s=>`<button type="button" role="tab" aria-selected="${!view.bucket&&s===sport}" class="${!view.bucket&&s===sport?'on':''}" data-lv-sport="${s}">${s}</button>`).join('')}</div></div>`;
  }

  /* ---------- main league view ---------- */
  function renderMain(root,sport){
    const rows=STADIUMS.filter(x=>x.sport===sport&&counted(x)),done=rows.filter(visited).length,L=LEAGUE[sport];
    const last=rows.flatMap(x=>vis(x).map(v=>({x,v}))).sort((a,b)=>(b.v.date||'').localeCompare(a.v.date||''))[0];
    const C=2*Math.PI*42,pct=rows.length?done/rows.length:0;
    const q=norm(view.q);
    const results=q?rows.filter(x=>norm([x.team,x.venue,x.city,x.state,x.conference].join(' ')).includes(q)).filter(passFilter):null;
    const groups=groupsFor(sport);
    if(view.open[sport]==null)view.open[sport]=groups[0]?.name;
    root.innerHTML=`<div class="lv">${headerHtml(sport)}
      <div class="lv-hero"><svg width="88" height="88" viewBox="0 0 100 100" role="img" aria-label="${Math.round(pct*100)} percent visited"><circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" stroke-width="10"/><circle cx="50" cy="50" r="42" fill="none" stroke="${L.color}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${Math.max(pct*C,done?4:0)} ${C}" transform="rotate(-90 50 50)"/><text x="50" y="52" text-anchor="middle" font-family="Impact,'Arial Narrow',sans-serif" font-size="22" fill="#111827">${done}/${rows.length}</text><text x="50" y="68" text-anchor="middle" font-size="10" font-weight="600" fill="#4b5563">${Math.round(pct*100)}%</text></svg>
        <div><strong>${rows.length-done?`${rows.length-done} ${e(L.name)} venues to go`:`Every ${e(L.name)} venue stamped!`}</strong><span>${last?`Last visit: ${e(last.x.venue)}, ${e(typeof formatDate==='function'?formatDate(last.v.date):last.v.date)}`:'No visits in this league yet'}</span></div></div>
      <div class="lv-tools"><label class="lv-search"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4b5563" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><input type="search" id="lvSearch" placeholder="Search teams, stadiums, cities" aria-label="Search ${e(L.name)}" value="${e(view.q)}"></label>
        <div class="lv-chips">${[['all','All'],['visited','Visited'],['not','Not yet']].map(([k,l])=>`<button type="button" class="${view.filter===k?'on':''}" data-lv-filter="${k}">${l}</button>`).join('')}</div></div>
      ${results?`<section class="lv-card"><div class="lv-results-head">${results.length} result${results.length===1?'':'s'}</div>${results.map(x=>`<button type="button" class="lv-row" data-lv-team="${e(x.id)}">${logo(x,44)}<span class="lv-row-text"><strong>${e(x.team)}</strong><small>${e(x.venue)} · ${e(x.city)}${x.state?`, ${e(x.state)}`:''}</small></span>${visited(x)?`<em class="lv-tag ok">${vis(x).length} visit${vis(x).length===1?'':'s'}</em>`:inBucket(x.id)?`<em class="lv-tag star">${starSvg(true)}Bucket</em>`:''}${chevR}</button>`).join('')||'<p class="lv-empty">No matches.</p>'}</section>`:
      groups.map(g=>{const all=g.divs.flatMap(d=>d.list),gd=all.filter(visited).length,open=view.open[sport]===g.name||groups.length===1;
        return `<section class="lv-card">${groups.length>1?`<button type="button" class="lv-conf" data-lv-conf="${e(g.name)}" aria-expanded="${open}"><span><span class="lv-conf-title"><strong>${e(g.name)}</strong><small>${gd} of ${all.length}</small></span>${bar(all.length?gd/all.length:0,L.color)}</span>${chevD}</button>`:`<div class="lv-conf static"><span class="lv-conf-title"><strong>${e(g.name)}</strong><small>${gd} of ${all.length}</small></span></div>`}
          ${open?g.divs.map(d=>{const dd=d.list.filter(visited).length;const show=[...d.list].sort((a,b)=>visited(b)-visited(a)).slice(0,5);return `<button type="button" class="lv-div" data-lv-group="${e(d.key)}"><span class="lv-div-text"><span class="lv-conf-title"><strong>${e(d.name)}</strong><small>${dd} / ${d.list.length}</small></span>${bar(d.list.length?dd/d.list.length:0,L.color)}</span><span class="lv-stack">${show.map(x=>logo(x,28)).join('')}</span>${chevR}</button>`;}).join(''):''}</section>`;}).join('')}
    </div>`;
    wireHeader(root,sport);
    const s=root.querySelector('#lvSearch');s.oninput=()=>{view.q=s.value;const pos=s.selectionStart;renderMain(root,sport);const n=root.querySelector('#lvSearch');n.focus();try{n.setSelectionRange(pos,pos);}catch{}};
    root.querySelectorAll('[data-lv-filter]').forEach(b=>b.onclick=()=>{view.filter=b.dataset.lvFilter;renderMain(root,sport);});
    root.querySelectorAll('[data-lv-conf]').forEach(b=>b.onclick=()=>{view.open[sport]=view.open[sport]===b.dataset.lvConf?'':b.dataset.lvConf;renderMain(root,sport);});
    root.querySelectorAll('[data-lv-group]').forEach(b=>b.onclick=()=>{view.group={sport,key:b.dataset.lvGroup};window.renderLeaguesV2(root);window.scrollTo({top:0});});
    root.querySelectorAll('[data-lv-team]').forEach(b=>b.onclick=()=>openSheet(b.dataset.lvTeam,root));
  }

  /* ---------- division / conference teams ---------- */
  function renderGroup(root,sport,key){
    const d=findGroup(sport,key);if(!d){view.group=null;return renderMain(root,sport);}
    const done=d.list.filter(visited).length,L=LEAGUE[sport];
    const list=d.list.filter(passFilter);
    const left=d.list.filter(x=>!visited(x)),leftStar=left.filter(x=>inBucket(x.id)).length;
    root.innerHTML=`<div class="lv"><div class="lv-head lv-group-head"><div class="lv-head-top"><button type="button" class="lv-back" id="lvBack" aria-label="Back to ${e(L.name)}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg></button><div class="lv-group-title"><small>${e(sport)}${d.conf?` · ${e(d.conf)}`:''}</small><h2>${e(d.name)}</h2></div><b>${done} / ${d.list.length}</b></div>${bar(d.list.length?done/d.list.length:0,'#fbbf24')}</div>
      <div class="lv-chips lv-chips-pad">${[['all','All'],['visited','Visited'],['not','Not yet']].map(([k,l])=>`<button type="button" class="${view.filter===k?'on':''}" data-lv-filter="${k}">${l}</button>`).join('')}</div>
      <div class="lv-tiles">${list.map(x=>{const n=vis(x).length;return `<button type="button" class="lv-tile ${n?'':'off'}" data-lv-team="${e(x.id)}"><span class="lv-tile-logo">${logo(x,92)}${n?'<span class="lv-check" aria-hidden="true"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg></span>':''}</span><strong>${e(x.team)}</strong><small>${e(x.venue)}</small>${n?`<em class="lv-tag ok">${n} visit${n===1?'':'s'}</em>`:inBucket(x.id)?`<em class="lv-tag star">${starSvg(true)}Bucket list</em>`:'<em class="lv-tag">Not yet</em>'}</button>`;}).join('')||'<p class="lv-empty">Nothing here with this filter.</p>'}</div>
      ${left.length?`<div class="lv-seal"><svg width="40" height="40" viewBox="0 0 100 100" aria-hidden="true"><g fill="none" stroke="#b7922c" stroke-width="3"><circle cx="50" cy="50" r="44" stroke-dasharray="3 4"/><circle cx="50" cy="50" r="32"/></g><path d="M50 30l5.5 11.5 12.5 1.8-9 8.8 2.1 12.4L50 58.6 38.9 64.5 41 52.1l-9-8.8 12.5-1.8z" fill="none" stroke="#b7922c" stroke-width="3"/></svg><span><strong>${left.length} to go for the ${e(d.name)} seal.</strong>${leftStar?` ${leftStar===left.length?(left.length===1?'It’s':'All are'):`${leftStar} ${leftStar===1?'is':'are'}`} on your bucket list.`:''}</span></div>`:`<div class="lv-seal done"><span><strong>Seal pressed!</strong> Every venue here is stamped.</span></div>`}
    </div>`;
    root.querySelector('#lvBack').onclick=()=>{view.group=null;window.renderLeaguesV2(root);};
    root.querySelectorAll('[data-lv-filter]').forEach(b=>b.onclick=()=>{view.filter=b.dataset.lvFilter;renderGroup(root,sport,key);});
    root.querySelectorAll('[data-lv-team]').forEach(b=>b.onclick=()=>openSheet(b.dataset.lvTeam,root));
  }

  /* ---------- bucket list ---------- */
  function seasonFor(sport){const d=new Date(),y=d.getFullYear(),m=d.getMonth()+1;if(sport==='CBB')return m>=7?y:y-1;if(sport==='NFL'||sport==='CFB')return m<=2?y-1:y;return y;}
  async function nextHome(x){
    if(typeof fetchSeasonGames!=='function')return null;
    const today=new Date().toISOString().slice(0,10);
    try{const games=await fetchSeasonGames(x,String(seasonFor(x.sport)));const up=(games||[]).filter(g=>g.date>=today&&g.status!=='post').sort((a,b)=>a.date.localeCompare(b.date))[0];return up||null;}catch{return null;}
  }
  function renderBucket(root){
    const ids=bucket(),rows=ids.map(id=>STADIUMS.find(x=>x.id===id)).filter(Boolean);
    const todo=rows.filter(x=>!visited(x)),done=rows.filter(visited);
    const row=(x,isDone)=>`<div class="lv-row lv-bucket-row"><button type="button" class="lv-row-main" data-lv-team="${e(x.id)}">${logo(x,46,{on:isDone})}<span class="lv-row-text"><strong class="${isDone?'struck':''}">${e(x.team)}</strong><small>${e(x.venue)} · ${e(x.city)}${x.state?`, ${e(x.state)}`:''}</small><small class="lv-league">${e(x.sport)} · ${e(x.conference||'')}${x.division&&(x.sport==='NFL'||x.sport==='MLB')?` ${e(x.division)}`:''}</small>${isDone?`<em class="lv-tag ok">Checked off</em>`:`<em class="lv-tag next" data-next="${e(x.id)}">Checking schedule…</em>`}</span></button><button type="button" class="lv-unstar" data-lv-unstar="${e(x.id)}" aria-label="Remove ${e(x.team)} from bucket list">${starSvg(true)}</button></div>`;
    root.innerHTML=`<div class="lv">${headerHtml(lastSport())}
      <div class="lv-bucket-hero"><div><strong>My bucket list</strong><span>${done.length} of ${rows.length} checked off</span></div>${bar(rows.length?done.length/rows.length:0,'#d97706')}<p>Tap the ☆ on any team to add it here. It checks itself off when you log a visit there.</p></div>
      ${todo.length?`<section class="lv-card"><div class="lv-results-head">STILL TO GO</div>${todo.map(x=>row(x,false)).join('')}</section>`:''}
      ${done.length?`<section class="lv-card"><div class="lv-results-head">CHECKED OFF</div>${done.map(x=>row(x,true)).join('')}</section>`:''}
      ${rows.length?'':'<p class="lv-empty">Your bucket list is empty. Open any league, tap a team, and tap the star.</p>'}
      <button type="button" class="lv-add-bucket" id="lvAddBucket">+ Add stadiums from a league</button>
    </div>`;
    wireHeader(root,lastSport());
    root.querySelector('#lvAddBucket').onclick=()=>{view.bucket=false;window.renderLeaguesV2(root);};
    root.querySelectorAll('[data-lv-team]').forEach(b=>b.onclick=()=>openSheet(b.dataset.lvTeam,root));
    root.querySelectorAll('[data-lv-unstar]').forEach(b=>b.onclick=()=>{toggleBucket(b.dataset.lvUnstar);renderBucket(root);});
    todo.slice(0,12).forEach(async x=>{const g=await nextHome(x);const el=root.querySelector(`[data-next="${CSS.escape(x.id)}"]`);if(!el)return;if(g){const d=new Date(g.date+'T12:00:00');el.textContent=`Next home ${d.toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'})}`;}else el.remove();});
  }
  function lastSport(){return ORDER.includes(activeSport)?activeSport:(typeof lastLeagueSport!=='undefined'&&ORDER.includes(lastLeagueSport)?lastLeagueSport:'NFL');}

  /* ---------- team sheet ---------- */
  function closeSheet(){document.getElementById('lvSheet')?.remove();document.documentElement.classList.remove('lv-sheet-open');}
  function openSheet(id,root){
    closeSheet();const x=STADIUMS.find(r=>r.id===id);if(!x)return;
    const allV=venuesOf(x),cur=allV.find(v=>statusOf(v)==='current')||x;
    const order={current:0,coming:1,former:2};const venues=allV.slice().sort((a,b)=>order[statusOf(a)]-order[statusOf(b)]);
    const multi=venues.length>1;
    const vs=venues.flatMap(v=>vis(v).map(vv=>({...vv,__venue:v}))).sort((a,b)=>(b.date||'').localeCompare(a.date||''));const n=vs.length,nCur=vis(cur).length;
    const sportOf=v=>typeof inferGameSport==='function'?inferGameSport(v,x.sport):x.sport;
    const lockI='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>';
    const badge={current:['CURRENT HOME','#dcfce7','#166534'],coming:['COMING SOON','#fef3c7','#92400e'],former:['FORMER HOME','#fee2e2','#991b1b']};
    const venueCards=multi?`<div class="lv-sheet-sec"><div class="lv-sec-head"><span>STADIUMS</span><small>${venues.length}</small></div>${venues.map(v=>{const st=statusOf(v),[lab,bg,fg]=badge[st],c=vis(v).length,y=yearOf(v);
      const meta=st==='coming'?`Expected to open ${y||'[year]'} · doesn’t count yet`:st==='former'?(c?`Retired stamp · ${c} visit${c===1?'':'s'}`:'Closed · log past visits here'):(c?`Stamped · ${c} visit${c===1?'':'s'}`:'Not visited yet · stamp to unlock');
      return `<div class="lv-venue"><span class="lv-venue-stamp ${c?'on':''} ${st}" style="--ring:${teamColor(x)}">${c?(st==='former'?'<i>RETIRED</i>':'<b>✓</b>'):lockI}</span><span class="lv-venue-text"><em style="background:${bg};color:${fg}">${lab}${st==='former'&&y?` · CLOSED ${e(y)}`:st==='current'&&y?` · OPENED ${e(y)}`:''}</em><strong>${e(v.venue)}</strong><small>${e(v.city)}${v.state?`, ${e(v.state)}`:''}</small><small class="meta">${meta}</small></span></div>`;}).join('')}</div>`:'';
    const anyFormerVisit=venues.some(v=>statusOf(v)==='former'&&vis(v).length);
    const note=multi?(nCur?`<div class="lv-note blue"><strong>How it counts:</strong> the ${e(x.team)} are checked off because you’ve been to their current home.</div>`:anyFormerVisit?`<div class="lv-note gold"><strong>${e(cur.sport)} progress:</strong> visit ${e(cur.venue)} to check the ${e(x.team)} off again. Your earlier visits stay saved as Retired stamps.</div>`:''):'';
    const shared=typeof STADIUMS!=='undefined'?STADIUMS.filter(o=>counted(o)&&(o.teamOf||o.id)!==(cur.teamOf||cur.id)&&norm(o.venue)===norm(cur.venue)&&norm(o.city)===norm(cur.city)):[];
    const sharedHtml=shared.length?`<div class="lv-sheet-sec"><div class="lv-sec-head"><span>SHARED STADIUM</span><small>${e(cur.venue)}</small></div>${shared.map(o=>`<button type="button" class="lv-row lv-shared" data-lv-goto="${e(o.id)}">${logo(o,40)}<span class="lv-row-text"><strong>${e(o.team)}</strong><small>${visited(o)?`${vis(o).length} game${vis(o).length===1?'':'s'} seen here`:'Also plays here · not checked off yet'}</small></span>${chevR}</button>`).join('')}</div>`:'';
    const rowsHtml=vs.map(v=>{const d=v.date?new Date(v.date+'T12:00:00'):null;const home=v.teamMascot||v.teamName||x.team,away=v.opponentMascot||v.opponent||'Opponent';
      const has=v.teamScore!==''&&v.teamScore!=null&&v.opponentScore!==''&&v.opponentScore!=null;const out=(typeof visitOutcome==='function'?visitOutcome(v):v.outcome)||'';
      const seat=[v.section&&`Sec ${v.section}`,v.row&&`Row ${v.row}`,v.seat&&`Seat ${v.seat}`].filter(Boolean).join(' · ');
      const memo=String(v.memory||'').trim();
      return `<button type="button" class="lv-visit" data-lv-visit="${e(v.id)}" data-lv-vvenue="${e(v.__venue.id)}"><span class="lv-visit-date"><b>${d?String(d.getDate()).padStart(2,'0'):'—'}</b><small>${d?`${MON[d.getMonth()]} ${d.getFullYear()}`:'NO DATE'}</small></span><span class="lv-visit-text"><strong>${e(away)} ${v.neutralSite?'vs.':'@'} ${e(home)}</strong>${seat?`<small>${e(seat)}</small>`:''}${memo?`<small class="memo">“${e(memo.length>70?memo.slice(0,68)+'…':memo)}”</small>`:''}${sportOf(v)!==x.sport?`<small>${e(sportOf(v))} game</small>`:''}${multi?`<small class="lv-at">${e(v.__venue.venue)}${statusOf(v.__venue)==='former'?' · former home':''}</small>`:''}</span><span class="lv-visit-score">${has?`<b>${e(v.opponentScore)}–${e(v.teamScore)}</b>`:''}${out&&out!=='FINAL'?`<em class="res ${e(out.toLowerCase())}">${e(out)}</em>`:''}</span></button>`;}).join('');
    const starred=inBucket(x.id);
    const el=document.createElement('div');el.id='lvSheet';el.className='lv-sheet-wrap';
    el.innerHTML=`<div class="lv-backdrop" data-lv-close></div><div class="lv-sheet" role="dialog" aria-modal="true" aria-label="${e(x.team)}"><span class="lv-grab" aria-hidden="true"></span>
      <div class="lv-sheet-head">${logo(x,72,{on:true})}<div><h3>${e(x.team)}</h3><span>${e(cur.venue)} · ${e(cur.city)}${cur.state?`, ${e(cur.state)}`:''}</span><small>${e(x.sport)} · ${e(x.conference||'')}${x.division&&(x.sport==='NFL'||x.sport==='MLB')?` ${e(x.division)}`:''}</small></div>
        <button type="button" class="lv-star ${starred?'on':''}" id="lvStar" aria-pressed="${starred}" aria-label="${starred?'Remove from':'Add to'} bucket list">${starSvg(starred)}</button><button type="button" class="lv-x" data-lv-close aria-label="Close"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
      ${n?`<div class="lv-stats"><div><b>${n}</b><small>Visit${n===1?'':'s'}${multi?' (all stadiums)':''}</small></div><div><b>${nCur?e(tierLabel(nCur)):'—'}</b><small>${multi?'Current stamp':'Passport stamp'}</small></div></div>`:''}
      ${venueCards}${note}${sharedHtml}
      ${n?`<div class="lv-sheet-sec"><div class="lv-sec-head"><span>YOUR VISITS</span><small>${multi?'By date, all stadiums':'Newest first'}</small></div>${rowsHtml}</div>`:
      `<div class="lv-waiting"><strong>Your stamp is waiting</strong><span>Log a game here to unlock this stadium’s passport stamp.${starred?'':' Tap the star to add it to your bucket list.'}</span></div>`}
      <div class="lv-actions"><button type="button" class="primary" id="lvAddVisit">+ Add a visit</button>${n?'<button type="button" id="lvStamp">See passport stamp</button>':'<button type="button" id="lvNext">Next home game</button>'}</div>
      ${n?'<p class="lv-hint">Tap any visit to open its visit page</p>':''}<button type="button" class="lv-manage" id="lvManage">Manage stadiums</button></div>`;
    document.body.appendChild(el);document.documentElement.classList.add('lv-sheet-open');
    el.querySelectorAll('[data-lv-close]').forEach(b=>b.onclick=closeSheet);
    el.querySelector('#lvStar').onclick=()=>{toggleBucket(x.id);openSheet(id,root);window.renderLeaguesV2(root);};
    el.querySelectorAll('[data-lv-visit]').forEach(b=>b.onclick=()=>{closeSheet();openDetail(b.dataset.lvVvenue||x.id,b.dataset.lvVisit);});
    el.querySelectorAll('[data-lv-goto]').forEach(b=>b.onclick=()=>openSheet(b.dataset.lvGoto,root));
    el.querySelector('#lvManage').onclick=()=>window.openStadiumManager(cur.teamOf||cur.id,()=>{window.renderLeaguesV2(root);openSheet(cur.id,root);});
    el.querySelector('#lvAddVisit').onclick=async()=>{closeSheet();await openDetail(cur.id);document.getElementById('vvAdd')?.click();};
    const st=el.querySelector('#lvStamp');if(st)st.onclick=()=>{closeSheet();window.openPassportLeague?.(x.sport);};
    const nx=el.querySelector('#lvNext');if(nx)nx.onclick=async()=>{nx.disabled=true;nx.textContent='Checking…';const g=await nextHome(x);nx.textContent=g?`${new Date(g.date+'T12:00:00').toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'})} vs ${g.opponent}`:'No upcoming home games found';};
  }

  /* ---------- stadium manager ---------- */
  window.openStadiumManager=function(teamId,onDone){
    closeSheet();const base=STADIUMS.find(r=>r.id===teamId);if(!base)return;
    const draw=(msg='')=>{
      closeSheet();const list=venuesOf(base).slice();
      const el=document.createElement('div');el.id='lvSheet';el.className='lv-sheet-wrap';
      const onlyCurrent=v=>statusOf(v)==='current'&&!list.some(o=>o.id!==v.id&&statusOf(o)==='current');
      const stBtn=(v,k,l)=>{const lock=onlyCurrent(v)&&k!=='current';return `<button type="button" class="${statusOf(v)===k?'on':''}" data-st="${k}" data-id="${e(v.id)}" ${lock?'disabled aria-disabled="true"':''}>${l}</button>`;};
      el.innerHTML=`<div class="lv-backdrop" data-lv-close></div><div class="lv-sheet" role="dialog" aria-modal="true" aria-label="Manage stadiums"><span class="lv-grab" aria-hidden="true"></span>
        <div class="lv-sheet-head">${logo(base,56,{on:true})}<div><h3>${e(base.team)}</h3><span>Stadiums</span></div><button type="button" class="lv-x" data-lv-close aria-label="Close"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
        ${msg?`<div class="lv-note gold">${e(msg)}</div>`:''}
        ${list.map(v=>{const c=vis(v).length;return `<div class="lv-mg-venue"><div class="lv-mg-top"><strong>${e(v.venue)}</strong><small>${e(v.city)}${v.state?`, ${e(v.state)}`:''} · ${c} visit${c===1?'':'s'}${yearOf(v)?` · ${statusOf(v)==='former'?'closed':'opens/opened'} ${e(yearOf(v))}`:''}</small></div>
          <span class="lv-mg-label">Status</span><div class="lv-seg" role="group" aria-label="Status for ${e(v.venue)}">${stBtn(v,'current','Current')}${stBtn(v,'coming','Coming soon')}${stBtn(v,'former','Former')}</div>${onlyCurrent(v)?`<small class="lv-mg-lock">This is the team’s current stadium. To replace it, add the new stadium below, or mark another stadium Current.</small>`:''}
          ${v.teamOf?`<div class="lv-mg-actions"><button type="button" data-edit="${e(v.id)}">Edit name</button>${c?'':`<button type="button" class="danger" data-del="${e(v.id)}">Remove</button>`}</div>`:''}</div>`;}).join('')}
        <form class="lv-mg-form" id="lvAddVenue"><strong>Add a new stadium</strong><p class="lv-mg-help">Use this for a stadium that’s being built or that the team used before.</p>
          <label>Stadium name<input name="venue" required placeholder="New stadium name"></label>
          <div class="lv-mg-row"><label>City<input name="city" value="${e(base.city)}"></label><label>State<input name="state" value="${e(base.state)}" maxlength="3"></label></div>
          <div class="lv-mg-row"><label>Status<select name="status"><option value="coming">Coming soon</option><option value="current">Current</option><option value="former">Former</option></select></label><label>Year<input name="year" inputmode="numeric" placeholder="Opening or closing year" maxlength="4"></label></div>
          <p class="lv-mg-help">Past visits always stay with the stadium where they happened. Marking a stadium Current makes the old current one Former automatically.</p>
          <button type="submit" class="lv-mg-save">Save stadium</button></form></div>`;
      document.body.appendChild(el);document.documentElement.classList.add('lv-sheet-open');
      const done=()=>{closeSheet();onDone?.();};
      el.querySelectorAll('[data-lv-close]').forEach(b=>b.onclick=done);
      el.querySelectorAll('[data-st]').forEach(b=>b.onclick=()=>{const v=STADIUMS.find(r=>r.id===b.dataset.id);let y=yearOf(v);
        if(b.dataset.st!==statusOf(v)){const ask=b.dataset.st==='former'?'Year it closed (optional):':b.dataset.st==='coming'?'Expected opening year (optional):':'Year it opened (optional):';const ans=prompt(ask,y||'');if(ans===null)return;y=ans.trim();}
        const ok=applyVenueStatus(b.dataset.id,b.dataset.st,y);draw(!ok?'Every team needs one current stadium. Mark another stadium Current first.':b.dataset.st==='current'?'Saved. Any other current stadium is now marked Former.':'Saved.');});
      el.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>{const v=STADIUMS.find(r=>r.id===b.dataset.edit);const name=prompt('Stadium name',v.venue);if(!name)return;const city=prompt('City',v.city)??v.city;const st=prompt('State',v.state)??v.state;updateTeamVenue(v.id,{venue:name.trim(),city:city.trim(),state:st.trim()});draw('Saved.');});
      el.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{if(!confirm('Remove this stadium? It has no visits, so nothing else changes.'))return;removeTeamVenue(b.dataset.del);draw('Removed.');});
      el.querySelector('#lvAddVenue').onsubmit=ev=>{ev.preventDefault();const f=new FormData(ev.target);const venue=String(f.get('venue')||'').trim();if(!venue)return;
        addTeamVenue(base.id,{venue,city:String(f.get('city')||'').trim(),state:String(f.get('state')||'').trim().toUpperCase(),status:String(f.get('status')),year:String(f.get('year')||'').trim()});draw('Stadium added.');};
    };
    draw();
  };

  function wireHeader(root,sport){
    root.querySelector('#lvBucket').onclick=()=>{view.bucket=!view.bucket;view.group=null;window.renderLeaguesV2(root);window.scrollTo({top:0});};
    root.querySelectorAll('[data-lv-sport]').forEach(b=>b.onclick=()=>{view.bucket=false;view.group=null;view.q='';activeSport=b.dataset.lvSport;lastLeagueSport=activeSport;render();});
  }
  window.renderLeaguesV2=function(root){
    if(!root)return;document.body.classList.add('leagues-v2-mode');
    const sport=lastSport();
    if(view.sport!==sport){view.q='';view.group=null;view.sport=sport;}
    if(view.bucket)return renderBucket(root);
    if(view.group&&view.group.sport===sport)return renderGroup(root,sport,view.group.key);
    view.group=null;renderMain(root,sport);
  };
  window.leaveLeaguesV2=function(){document.body.classList.remove('leagues-v2-mode');closeSheet();};
  document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&document.getElementById('lvSheet'))closeSheet();});
})();
