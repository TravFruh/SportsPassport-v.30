/* Stadium Passport — published visit page (v33)
   A saved visit opens as a finished page: cover photo, score box with seats, photo & video gallery,
   favorite memory, notes, ticket and passport stamp, on the team's color. "Edit" opens the
   existing form; "+ Add another visit" starts a new one. Empty sections hide themselves. */
(function(){
  const PRO_COLORS={
    NFL:{"buffalo bills":"#00338d","miami dolphins":"#008e97","new england patriots":"#002244","new york jets":"#125740","baltimore ravens":"#241773","cincinnati bengals":"#fb4f14","cleveland browns":"#311d00","pittsburgh steelers":"#101820","houston texans":"#03202f","indianapolis colts":"#002c5f","jacksonville jaguars":"#006778","tennessee titans":"#0c2340","denver broncos":"#fb4f14","kansas city chiefs":"#e31837","las vegas raiders":"#000000","los angeles chargers":"#0080c6","dallas cowboys":"#041e42","new york giants":"#0b2265","philadelphia eagles":"#004c54","washington commanders":"#5a1414","chicago bears":"#0b162a","detroit lions":"#0076b6","green bay packers":"#203731","minnesota vikings":"#4f2683","atlanta falcons":"#a71930","carolina panthers":"#0085ca","new orleans saints":"#101820","tampa bay buccaneers":"#d50a0a","arizona cardinals":"#97233f","los angeles rams":"#003594","san francisco 49ers":"#aa0000","seattle seahawks":"#002244"},
    NBA:{"boston celtics":"#007a33","brooklyn nets":"#000000","new york knicks":"#006bb6","philadelphia 76ers":"#006bb6","toronto raptors":"#ce1141","chicago bulls":"#ce1141","cleveland cavaliers":"#860038","detroit pistons":"#c8102e","indiana pacers":"#002d62","milwaukee bucks":"#00471b","atlanta hawks":"#e03a3e","charlotte hornets":"#1d1160","miami heat":"#98002e","orlando magic":"#0077c0","washington wizards":"#002b5c","denver nuggets":"#0e2240","minnesota timberwolves":"#0c2340","oklahoma city thunder":"#007ac1","portland trail blazers":"#e03a3e","utah jazz":"#002b5c","golden state warriors":"#1d428a","la clippers":"#c8102e","los angeles lakers":"#552583","phoenix suns":"#1d1160","sacramento kings":"#5a2d81","dallas mavericks":"#00538c","houston rockets":"#ce1141","memphis grizzlies":"#12173f","new orleans pelicans":"#0c2340","san antonio spurs":"#000000"},
    MLB:{"baltimore orioles":"#df4601","boston red sox":"#bd3039","new york yankees":"#0c2340","tampa bay rays":"#092c5c","toronto blue jays":"#134a8e","chicago white sox":"#27251f","cleveland guardians":"#00385d","detroit tigers":"#0c2340","kansas city royals":"#004687","minnesota twins":"#002b5c","athletics":"#003831","houston astros":"#002d62","los angeles angels":"#ba0021","seattle mariners":"#0c2c56","texas rangers":"#003278","atlanta braves":"#13274f","miami marlins":"#00a3e0","new york mets":"#002d72","philadelphia phillies":"#e81828","washington nationals":"#ab0003","chicago cubs":"#0e3386","cincinnati reds":"#c6011f","milwaukee brewers":"#12284b","pittsburgh pirates":"#27251f","st louis cardinals":"#c41e3a","arizona diamondbacks":"#a71930","colorado rockies":"#33006f","los angeles dodgers":"#005a9c","san diego padres":"#2f241d","san francisco giants":"#27251f"}
  };
  const FALLBACK='#1f2937';
  const COLOR_CACHE_KEY='stadiumPassportTeamColorsV1';
  const PAGE_COLOR_KEY='stadiumPassportPageColorsV1';
  const readJSON=k=>{try{return JSON.parse(localStorage.getItem(k)||'{}')||{};}catch{return {};}};
  const writeJSON=(k,v)=>{const s=JSON.stringify(v);return typeof safeSetItem==='function'?safeSetItem(k,s):(localStorage.setItem(k,s),true);};
  const esc=s=>typeof escapeHtml==='function'?escapeHtml(s):String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=s=>typeof normalizeTeamName==='function'?normalizeTeamName(s):String(s||'').toLowerCase().trim();

  function luminance(hex){
    const h=String(hex||'').replace('#','');if(!/^[0-9a-f]{6}$/i.test(h))return 0;
    const c=[0,2,4].map(i=>{const v=parseInt(h.slice(i,i+2),16)/255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);});
    return 0.2126*c[0]+0.7152*c[1]+0.0722*c[2];
  }
  const isLight=hex=>luminance(hex)>0.35;
  const asHex=v=>{const h=String(v||'').replace('#','').trim();return /^[0-9a-f]{6}$/i.test(h)?`#${h.toLowerCase()}`:'';};

  function espnIdFor(sport,name){
    const url=typeof directLogoUrl==='function'?directLogoUrl(sport,name):'';
    const m=String(url).match(/\/500\/([^/.]+)\.png/);return m?m[1].toLowerCase():'';
  }
  async function fetchEspnColor(sport,name){
    const cfg=(typeof espnLeague!=='undefined'&&espnLeague[sport])||null;if(!cfg||typeof fetchScheduleJson!=='function')return '';
    const want=espnIdFor(sport,name),wantName=norm(name);
    const urls=[`https://site.api.espn.com/apis/site/v2/sports/${cfg[0]}/${cfg[1]}/teams?limit=1000`];
    if(sport==='CBB'||sport==='CFB')urls.push(`https://site.api.espn.com/apis/site/v2/sports/${cfg[0]}/${cfg[1]}/teams?limit=1000&groups=${sport==='CBB'?50:80}`);
    for(const url of urls){
      let data;try{data=await fetchScheduleJson(url);}catch{continue;}
      const teams=(data?.sports?.[0]?.leagues?.[0]?.teams||[]).map(t=>t.team||t);
      const hit=teams.find(t=>want&&(String(t.id)===want||String(t.abbreviation||'').toLowerCase()===want))
        ||teams.find(t=>[t.displayName,t.shortDisplayName,t.location,t.name].filter(Boolean).map(norm).includes(wantName));
      if(hit){
        let col=asHex(hit.color);const alt=asHex(hit.alternateColor);
        if(!col||luminance(col)>0.8)col=alt&&luminance(alt)<=0.8?alt:col;
        if(col)return col;
      }
    }
    return '';
  }
  function knownTeamColor(stadiumId,sport,name){
    const page=readJSON(PAGE_COLOR_KEY)[stadiumId];if(page)return {color:page,custom:true};
    const pro=(PRO_COLORS[sport]||{})[norm(name)];if(pro)return {color:pro};
    const cached=readJSON(COLOR_CACHE_KEY)[`${sport}:${norm(name)}`];if(cached)return {color:cached};
    return {color:'',pending:true};
  }
  async function resolveTeamColor(sport,name){
    const key=`${sport}:${norm(name)}`;const col=await fetchEspnColor(sport,name);
    if(col){const all=readJSON(COLOR_CACHE_KEY);all[key]=col;writeJSON(COLOR_CACHE_KEY,all);}
    return col;
  }
  function applyColor(root,color){
    const c=color||FALLBACK,light=isLight(c);
    const shell=document.querySelector('#detailDialog .dialog-shell');
    [shell,root].forEach(el=>{if(!el)return;el.style.setProperty('--vv-team',c);el.style.setProperty('--vv-on-team',light?'#111827':'#ffffff');el.style.setProperty('--vv-on-team-muted',light?'#374151':'#e5e7eb');el.style.setProperty('--vv-stamp',light?'#111827':c);});
    const picker=root.querySelector('#vvColor');if(picker)picker.value=c;
  }

  function initials(name){const w=String(name||'').replace(/[^A-Za-z0-9 ]/g,' ').split(/\s+/).filter(Boolean);return (w.length>1?w.map(x=>x[0]).join('').slice(0,3):String(name||'?').slice(0,3)).toUpperCase();}
  function abbr(sport,name){const id=espnIdFor(sport,name);return id&&/^[a-z]{2,4}$/.test(id)?id.toUpperCase():initials(name);}
  function teamBadge(sport,name,color){
    const logo=typeof findLogo==='function'?findLogo(sport,name):'';
    return `<span class="vv-badge" style="background:${esc(color)}">${logo?`<img src="${esc(logo)}" alt="" onerror="this.remove()">`:''}<b>${esc(abbr(sport,name))}</b></span>`;
  }
  function shortName(full,mascot){return mascot||full;}
  function niceDate(d){if(!d)return '';const x=new Date(`${d}T12:00:00`);return x.toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric',year:'numeric'});}

  window.teamColorFor=(sport,name)=>((PRO_COLORS[sport]||{})[norm(name)])||readJSON(COLOR_CACHE_KEY)[`${sport}:${norm(name)}`]||'';
  window.renderVisitView=async function(ctx){
    const {x,visit,visits,photos,ticketScans,onEdit,onSelect,onAdd}=ctx;
    const dialog=document.getElementById('detailDialog');dialog.classList.add('visit-view-mode');
    const sport=typeof inferGameSport==='function'?inferGameSport(visit,x.sport):x.sport;
    const myTeam=visit.teamName||x.team,opp=visit.opponent||'Opponent';
    const colorTeam=(visit.neutralSite||!trackedSports.includes(x.sport))?myTeam:x.team;
    const known=knownTeamColor(x.id,sport,colorTeam);
    const outcome=(typeof visitOutcome==='function'?visitOutcome(visit):visit.outcome)||'';
    const hasScore=visit.teamScore!==''&&visit.teamScore!=null&&visit.opponentScore!==''&&visit.opponentScore!=null;
    const tN=Number(visit.teamScore),oN=Number(visit.opponentScore),homeWon=hasScore&&tN>=oN,awayWon=hasScore&&oN>=tN;
    const media=(photos||[]).filter(Boolean);
    const images=media.filter(p=>!(typeof isVideoMedia==='function'&&isVideoMedia(p)));
    const seats=[['SEC',visit.section],['ROW',visit.row],['SEAT',visit.seat]].filter(([,v])=>String(v||'').trim());
    const label=[sport,visit.eventName||visit.eventType||''].filter(Boolean).join(' · ');
    const place=[x.city,x.state].filter(Boolean).join(', ');
    const sorted=[...visits].sort((a,b)=>(b.date||'').localeCompare(a.date||''));
    const visitNo=[...visits].sort((a,b)=>(a.date||'').localeCompare(b.date||'')).findIndex(v=>v.id===visit.id)+1;
    const year=(visit.date||'').slice(0,4);
    const stamp=`<div class="vv-stamp"><span>${esc((x.city||x.venue||'').toUpperCase())}</span><strong>VISITED</strong><span>${esc(year||'')}</span></div>`;

    const cover=images.length
      ?`<div class="vv-cover-track" id="vvCoverTrack">${images.slice(0,6).map((p,i)=>`<figure class="vv-cover-slide gallery-item"><img class="gallery-media" src="${esc(p)}" alt="${esc(x.venue)} photo ${i+1}"></figure>`).join('')}</div>${images.length>1?`<div class="vv-dots">${images.slice(0,6).map((_,i)=>`<span class="${i?'':'on'}"></span>`).join('')}</div>`:''}`
      :`<div class="vv-cover-empty">${teamBadge(sport,colorTeam,'rgba(255,255,255,.18)')}${stamp}</div>`;

    let galleryHtml='';
    if(media.length){
      const tile=(p,i,cls='')=>`<figure class="gallery-item vv-tile ${cls}">${mediaElement(p,`${x.team} visit media ${i+1}`,'gallery-media')}</figure>`;
      let tiles;
      if(media.length<=3)tiles=media.map((p,i)=>tile(p,i,i===0?'big':'')).join('');
      else tiles=tile(media[0],0,'big')+tile(media[1],1)+`<button type="button" class="vv-more" id="vvShowAll"><strong>+${media.length-2}</strong><span>View gallery</span></button>`;
      galleryHtml=`<section class="vv-section"><div class="vv-head"><h3>Photos &amp; videos</h3><span>${media.length} item${media.length===1?'':'s'}</span></div><div class="vv-mosaic n${Math.min(media.length,3)}" id="vvGallery">${tiles}</div></section>`;
    }
    const notes=String(visit.notes||'').trim(),memory=String(visit.memory||'').trim();
    const longNotes=notes.length>280;

    const root=document.getElementById('detailContent');
    root.innerHTML=`<div class="vv">
      <div class="vv-cover">${cover}<button type="button" class="vv-edit" id="vvEdit"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></svg>Edit</button></div>
      <div class="vv-body">
        <section class="vv-card vv-score">
          <div class="vv-score-top"><span>${esc(label.toUpperCase())}</span>${outcome?`<b class="vv-outcome ${esc(outcome.toLowerCase())}">${esc(outcome)}</b>`:''}</div>
          <div class="vv-matchup">
            <div class="vv-team">${teamBadge(sport,opp,'#4b5563')}<span>${esc(shortName(opp,visit.opponentMascot))}</span><small>${visit.neutralSite?'':'AWAY'}</small></div>
            <div class="vv-final">${hasScore?`<strong class="${awayWon?'':'dim'}">${esc(visit.opponentScore)}</strong><i>${visit.neutralSite?'–':'@'}</i><strong class="${homeWon?'':'dim'}">${esc(visit.teamScore)}</strong>`:`<i>${visit.neutralSite?'vs.':'@'}</i>`}</div>
            <div class="vv-team home">${teamBadge(sport,myTeam,known.color||FALLBACK)}<span>${esc(shortName(myTeam,visit.teamMascot))}</span><small>${visit.neutralSite?'':'HOME'}</small></div>
          </div>
          <div class="vv-place"><strong>${esc(x.venue)}</strong><span>${esc([niceDate(visit.date),place].filter(Boolean).join(' · '))}</span>${visit.neutralSite?'<em>Neutral site</em>':''}</div>
          ${seats.length?`<div class="vv-seats n${seats.length}">${seats.map(([k,v])=>`<div><span>${k}</span><strong>${esc(v)}</strong></div>`).join('')}</div>`:''}
        </section>
        <section class="vv-visits">
          ${visits.length>1?`<div class="vv-head"><h3>Your visits here</h3><span>${visits.length} total${visitNo?` · this is #${visitNo}`:''}</span></div><div class="vv-chips">${sorted.map(v=>`<button type="button" class="vv-chip ${v.id===visit.id?'on':''}" data-visit-id="${esc(v.id)}">${esc(v.date?new Date(`${v.date}T12:00:00`).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}):'No date')}</button>`).join('')}</div>`:''}
          <button type="button" class="vv-add" id="vvAdd">+ Add another visit</button>
        </section>
        ${galleryHtml}
        ${memory?`<section class="vv-card vv-memory"><span class="vv-label">FAVORITE MEMORY</span><p>“${esc(memory)}”</p></section>`:''}
        ${notes?`<section class="vv-card vv-notes"><span class="vv-label muted">NOTES</span><p class="${longNotes?'clamped':''}" id="vvNotes">${esc(notes)}</p>${longNotes?'<button type="button" class="vv-link" id="vvMore">Read more</button>':''}</section>`:''}
        <section class="vv-extras ${ticketScans?.length?'':'single'}">
          ${ticketScans?.length?`<div class="vv-card vv-ticket"><figure class="gallery-item"><img class="gallery-media" src="${esc(ticketScans[0])}" alt="Ticket scan"></figure><span>Ticket</span></div>`:''}
          <div class="vv-card vv-stamp-card">${stamp}</div>
        </section>
        <div class="vv-color"><label for="vvColor">Page color</label><input type="color" id="vvColor" value="${esc(known.color||FALLBACK)}"><button type="button" class="vv-link" id="vvColorReset" ${known.custom?'':'hidden'}>Use team color</button></div>
      </div>
    </div>`;
    applyColor(root,known.color);
    if(known.pending){resolveTeamColor(sport,colorTeam).then(c=>{if(c&&root.querySelector('.vv')&&dialog.classList.contains('visit-view-mode')){applyColor(root,c);const b=root.querySelector('.vv-team .vv-badge');if(b)b.style.background=c;}});}

    root.querySelector('#vvEdit').onclick=onEdit;
    root.querySelector('#vvAdd').onclick=onAdd;
    root.querySelectorAll('.vv-chip').forEach(b=>b.onclick=()=>onSelect(b.dataset.visitId));
    const more=root.querySelector('#vvMore');if(more)more.onclick=()=>{const p=root.querySelector('#vvNotes');const open=p.classList.toggle('clamped');more.textContent=open?'Read more':'Show less';};
    const all=root.querySelector('#vvShowAll');if(all)all.onclick=()=>{const g=root.querySelector('#vvGallery');g.className='vv-mosaic all';g.innerHTML=media.map((p,i)=>`<figure class="gallery-item vv-tile">${mediaElement(p,`${x.team} visit media ${i+1}`,'gallery-media')}</figure>`).join('');};
    const track=root.querySelector('#vvCoverTrack');if(track){const dots=[...root.querySelectorAll('.vv-dots span')];track.addEventListener('scroll',()=>{const i=Math.round(track.scrollLeft/track.clientWidth);dots.forEach((d,j)=>d.classList.toggle('on',i===j));},{passive:true});}
    const picker=root.querySelector('#vvColor'),reset=root.querySelector('#vvColorReset');
    picker.oninput=()=>applyColor(root,picker.value);
    picker.onchange=()=>{const all=readJSON(PAGE_COLOR_KEY);all[x.id]=picker.value;writeJSON(PAGE_COLOR_KEY,all);reset.hidden=false;};
    reset.onclick=async()=>{const all=readJSON(PAGE_COLOR_KEY);delete all[x.id];writeJSON(PAGE_COLOR_KEY,all);reset.hidden=true;const k=knownTeamColor(x.id,sport,colorTeam);applyColor(root,k.color||await resolveTeamColor(sport,colorTeam));};
    const shell=dialog.querySelector('.dialog-shell');if(shell)shell.scrollTop=0;dialog.scrollTop=0;
  };

  window.leaveVisitView=function(force=true){const d=document.getElementById('detailDialog');if(d&&(force||!d.open))d.classList.remove('visit-view-mode');};
  window.showVisitToast=function(text){
    const host=document.querySelector('#detailDialog .dialog-shell')||document.body;
    const t=document.createElement('div');t.className='vv-toast';t.setAttribute('role','status');t.textContent=text;host.appendChild(t);
    setTimeout(()=>t.classList.add('out'),1800);setTimeout(()=>t.remove(),2300);
  };
  document.getElementById('detailDialog')?.addEventListener('close',()=>window.leaveVisitView(false));
})();
