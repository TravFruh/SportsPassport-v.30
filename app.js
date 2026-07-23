const sports = ["OVERVIEW","NFL","CFB","MLB","CBB","NBA","CHECKLIST","SCRATCH MAP","PASSPORT","EDITS","PERSONAL RECORDS","ACHIEVEMENTS"];
const trackedSports = ["NFL","CFB","MLB","CBB","NBA"];
let deferredInstallPrompt = null;
let activeSport = "OVERVIEW";
let lastLeagueSport = "NFL";
let addVisitSport = "NFL";
let currentMap = null;
const state = JSON.parse(localStorage.getItem("stadiumPassportState") || "{}");
const teamEdits = JSON.parse(localStorage.getItem("stadiumPassportTeamEdits") || "{}");
function applyTeamEdits(){
  STADIUMS.forEach(team=>{const edit=teamEdits[team.id];if(edit)Object.assign(team,edit);});
}
function saveTeamEdits(){localStorage.setItem("stadiumPassportTeamEdits",JSON.stringify(teamEdits));markLocalChanged();}
applyTeamEdits();
const $ = s => document.querySelector(s);

function markLocalChanged(){localStorage.setItem("stadiumPassportLocalUpdatedAt",new Date().toISOString());window.StadiumCloud?.scheduleSync?.();}
function saveState(){ localStorage.setItem("stadiumPassportState", JSON.stringify(state)); markLocalChanged(); }
function emptyVisit(){return {id:"",date:"",season:"",gameSport:"",opponent:"",opponentMascot:"",teamName:"",teamMascot:"",teamScore:"",opponentScore:"",outcome:"",gameId:"",gameLabel:"",eventName:"",eventType:"Regular Season",neutralSite:false,venueId:"",section:"",row:"",seat:"",memory:"",notes:""};}
function getVisits(id){
  const record=state[id];
  if(!record)return [];
  if(Array.isArray(record.visits))return record.visits;
  if(record.visited){
    const legacy={...emptyVisit(),...record,id:"legacy"};delete legacy.visited;
    state[id]={visits:[legacy]};saveState();return state[id].visits;
  }
  return [];
}
function getEntry(id){const visits=getVisits(id);const latest=[...visits].sort((a,b)=>(b.date||"").localeCompare(a.date||""))[0];return latest?{...latest,visited:true}:{...emptyVisit(),visited:false};}
function visitPhotoKey(stadiumId,visitId){return `${stadiumId}::${visitId}`;}
function visitTicketKey(stadiumId,visitId){return `ticket::${stadiumId}::${visitId}`;}
function newVisitId(){return `v${Date.now()}${Math.random().toString(36).slice(2,7)}`;}
function formatDate(date){ return date ? new Date(`${date}T12:00:00`).toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'}) : "Date not entered"; }
function isVideoMedia(src){return typeof src==='string'&&src.startsWith('data:video/');}
function mediaElement(src,alt,classes=''){return isVideoMedia(src)?`<video class="${classes}" src="${src}" controls playsinline preload="metadata" aria-label="${escapeHtml(alt)}"></video>`:`<img class="${classes}" src="${src}" alt="${escapeHtml(alt)}">`; }
function readFileAsDataURL(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error||new Error('Unable to read file'));reader.readAsDataURL(file);});}

const dbPromise = new Promise((resolve,reject)=>{
  const req=indexedDB.open("stadiumPassportPhotos",1);
  req.onupgradeneeded=()=>req.result.createObjectStore("photos");
  req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error);
});
async function putPhotos(id,photos){const db=await dbPromise;return new Promise((res,rej)=>{const tx=db.transaction("photos","readwrite");tx.objectStore("photos").put(photos,id);tx.oncomplete=()=>{markLocalChanged();res();};tx.onerror=()=>rej(tx.error);});}
async function getPhotos(id){const db=await dbPromise;return new Promise((res,rej)=>{const req=db.transaction("photos").objectStore("photos").get(id);req.onsuccess=()=>{const v=req.result;res(Array.isArray(v)?v:(v?[v]:[]));};req.onerror=()=>rej(req.error);});}
async function allPhotos(){const db=await dbPromise;return new Promise((res,rej)=>{const out={};const store=db.transaction("photos").objectStore("photos");const req=store.openCursor();req.onsuccess=e=>{const c=e.target.result;if(c){out[c.key]=c.value;c.continue()}else res(out)};req.onerror=()=>rej(req.error);});}

function renderTabs(){
  $("#tabs").innerHTML=sports.map(s=>`<button class="${s===activeSport?'active':''}" data-sport="${s}">${s==='OVERVIEW'?'Overview':s==='CHECKLIST'?'Checklist':s==='SCRATCH MAP'?'Scratch Map':s==='PASSPORT'?'Passport':s==='PERSONAL RECORDS'?'Personal Records':s==='ACHIEVEMENTS'?'Achievements':s==='EDITS'?'Edits':s}</button>`).join("");
  $("#tabs").querySelectorAll("button").forEach(b=>b.onclick=()=>{activeSport=b.dataset.sport;if(trackedSports.includes(activeSport))lastLeagueSport=activeSport;render();});
}
function renderMobileNav(){
  const nav=$("#mobileBottomNav");if(!nav)return;
  const section=activeSport==='OVERVIEW'?'overview':trackedSports.includes(activeSport)?'leagues':activeSport==='SCRATCH MAP'?'map':activeSport==='PASSPORT'?'passport':activeSport==='EDITS'?'edits':'';
  nav.querySelectorAll('button').forEach(btn=>btn.classList.toggle('active',btn.dataset.mobileAction===section));
}
function bindMobileNav(){
  const nav=$("#mobileBottomNav");if(!nav)return;
  nav.querySelectorAll('button').forEach(btn=>btn.onclick=()=>{
    const action=btn.dataset.mobileAction;
    if(action==='overview')activeSport='OVERVIEW';
    else if(action==='leagues')activeSport=lastLeagueSport||'NFL';
    else if(action==='map')activeSport='SCRATCH MAP';
    else if(action==='passport')activeSport='PASSPORT';
    else if(action==='edits')activeSport='EDITS';
    else if(action==='add'){openAddVisit();return;}
    render();window.scrollTo({top:0,behavior:'smooth'});
  });
}
function openAddVisit(){
  const dialog=$("#addVisitDialog");if(!dialog)return;
  addVisitSport=trackedSports.includes(lastLeagueSport)?lastLeagueSport:'NFL';
  $("#addVisitSearch").value='';
  renderAddVisitPicker();
  if(!dialog.open)dialog.showModal();
  setTimeout(()=>$("#addVisitSearch")?.focus(),120);
}
function renderAddVisitPicker(){
  const sports=[...trackedSports];
  $("#addVisitSports").innerHTML=sports.map(s=>`<button type="button" class="${s===addVisitSport?'active':''}" data-add-sport="${s}"><span>${s}</span><small>${s==='NFL'?'Pro Football':s==='CFB'?'College Football':s==='MLB'?'Baseball':s==='CBB'?'College Basketball':'Pro Basketball'}</small></button>`).join('');
  $("#addVisitSports").querySelectorAll('button').forEach(b=>b.onclick=()=>{addVisitSport=b.dataset.addSport;renderAddVisitPicker();});
  const q=normalizeTeamName($("#addVisitSearch")?.value||'');
  const rows=STADIUMS.filter(x=>(addVisitSport==='ALL'||x.sport===addVisitSport)&&(!q||normalizeTeamName([x.team,x.venue,x.city,x.state].join(' ')).includes(q))).slice(0,120);
  $("#addVisitResults").innerHTML=rows.length?rows.map(x=>`<button type="button" class="add-visit-result" data-add-id="${x.id}"><span class="list-team-logo"><img data-logo-sport="${x.sport}" data-logo-name="${escapeHtml(x.team)}" alt="" hidden><span class="list-logo-fallback">${initials(x.team)}</span></span><span><strong>${escapeHtml(x.team)}</strong><small>${escapeHtml(x.venue)} · ${escapeHtml(x.city)}${x.state?`, ${escapeHtml(x.state)}`:''}</small></span><b>${x.sport}</b></button>`).join(''):'<p class="empty">No matching teams or venues.</p>';
  $("#addVisitResults").querySelectorAll('[data-add-id]').forEach(b=>b.onclick=()=>{$("#addVisitDialog").close();openDetail(b.dataset.addId);});
  hydrateOverviewLogos();
}
function bindAddVisitDialog(){
  const dialog=$("#addVisitDialog");
  const close=()=>{if(dialog?.open)dialog.close();};
  $("#closeAddVisit")?.addEventListener('click',close);
  $("#cancelAddVisit")?.addEventListener('click',close);
  $("#addVisitSearch")?.addEventListener('input',renderAddVisitPicker);
  dialog?.addEventListener('click',event=>{if(event.target===dialog)close();});
}
function renderSummary(){
  const cards=trackedSports.map(s=>{const rows=STADIUMS.filter(x=>x.sport===s),v=rows.filter(x=>getEntry(x.id).visited).length,pct=rows.length?Math.round(v/rows.length*100):0;return `<div class="stat"><strong>${v}/${rows.length}</strong><span>${s} visited</span><div class="completion-bar"><span style="width:${pct}%"></span></div></div>`});
  $("#summary").innerHTML=cards.join("");
}
const logoCache = JSON.parse(localStorage.getItem("stadiumPassportLogoCacheV2") || "{}");
const espnLeague = {
  NFL:["football","nfl"], MLB:["baseball","mlb"], NBA:["basketball","nba"],
  CFB:["football","college-football"], CBB:["basketball","mens-college-basketball"]
};
const directLogoCodes = {
  NFL:{
    "buffalo bills":"buf","miami dolphins":"mia","new england patriots":"ne","new york jets":"nyj","baltimore ravens":"bal","cincinnati bengals":"cin","cleveland browns":"cle","pittsburgh steelers":"pit","houston texans":"hou","indianapolis colts":"ind","jacksonville jaguars":"jax","tennessee titans":"ten","denver broncos":"den","kansas city chiefs":"kc","las vegas raiders":"lv","los angeles raiders":"lv","los angeles chargers":"lac","san diego chargers":"lac","dallas cowboys":"dal","new york giants":"nyg","philadelphia eagles":"phi","washington commanders":"wsh","washington football team":"wsh","washington redskins":"wsh","chicago bears":"chi","detroit lions":"det","green bay packers":"gb","minnesota vikings":"min","atlanta falcons":"atl","carolina panthers":"car","new orleans saints":"no","tampa bay buccaneers":"tb","arizona cardinals":"ari","los angeles rams":"lar","st louis rams":"lar","san francisco 49ers":"sf","seattle seahawks":"sea"
  },
  MLB:{
    "baltimore orioles":"bal","boston red sox":"bos","new york yankees":"nyy","tampa bay rays":"tb","toronto blue jays":"tor","chicago white sox":"chw","cleveland guardians":"cle","cleveland indians":"cle","detroit tigers":"det","kansas city royals":"kc","minnesota twins":"min","athletics":"ath","oakland athletics":"ath","sacramento athletics":"ath","houston astros":"hou","los angeles angels":"laa","anaheim angels":"laa","seattle mariners":"sea","texas rangers":"tex","atlanta braves":"atl","miami marlins":"mia","florida marlins":"mia","new york mets":"nym","philadelphia phillies":"phi","washington nationals":"wsh","montreal expos":"wsh","chicago cubs":"chc","cincinnati reds":"cin","milwaukee brewers":"mil","pittsburgh pirates":"pit","st louis cardinals":"stl","arizona diamondbacks":"ari","colorado rockies":"col","los angeles dodgers":"lad","san diego padres":"sd","san francisco giants":"sf"
  },
  NBA:{
    "boston celtics":"bos","brooklyn nets":"bkn","new jersey nets":"bkn","new york knicks":"ny","philadelphia 76ers":"phi","toronto raptors":"tor","chicago bulls":"chi","cleveland cavaliers":"cle","detroit pistons":"det","indiana pacers":"ind","milwaukee bucks":"mil","atlanta hawks":"atl","charlotte hornets":"cha","charlotte bobcats":"cha","miami heat":"mia","orlando magic":"orl","washington wizards":"wsh","washington bullets":"wsh","denver nuggets":"den","minnesota timberwolves":"min","oklahoma city thunder":"okc","seattle supersonics":"okc","portland trail blazers":"por","utah jazz":"utah","golden state warriors":"gs","los angeles clippers":"lac","la clippers":"lac","los angeles lakers":"lal","phoenix suns":"phx","sacramento kings":"sac","dallas mavericks":"dal","houston rockets":"hou","memphis grizzlies":"mem","vancouver grizzlies":"mem","new orleans pelicans":"no","new orleans hornets":"no","san antonio spurs":"sa"
  }
};
function normalizeTeamName(name){
  return String(name||"").toLowerCase().replace(/&/g,"and").replace(/[^a-z0-9]+/g," ").trim()
    .replace(/^(the )/,"").replace(/ university$/,"");
}
function inferGameSport(visit,venueSport=""){
  if(trackedSports.includes(visit?.gameSport))return visit.gameSport;
  const names=[visit?.teamName,visit?.opponent].filter(Boolean).map(normalizeTeamName);
  if(!names.length)return trackedSports.includes(venueSport)?venueSport:"NFL";
  const scores=Object.fromEntries(trackedSports.map(s=>[s,0]));
  for(const row of STADIUMS){
    const team=normalizeTeamName(row.team);
    for(const name of names){
      if(team===name)scores[row.sport]+=4;
      else if(team.includes(name)||name.includes(team))scores[row.sport]+=2;
    }
  }
  const ranked=trackedSports.slice().sort((a,b)=>scores[b]-scores[a]);
  if(scores[ranked[0]]>0)return ranked[0];
  return trackedSports.includes(venueSport)?venueSport:"NFL";
}
function gameSportOptions(selected){
  const labels={NFL:"NFL",CFB:"College Football",MLB:"MLB",CBB:"College Basketball",NBA:"NBA"};
  return trackedSports.map(s=>`<option value="${s}" ${s===selected?'selected':''}>${labels[s]}</option>`).join('');
}
function directLogoUrl(sport,name){
  const n=normalizeTeamName(name);
  if(sport==="CFB" || sport==="CBB"){
    const logos=window.COLLEGE_LOGOS||{};
    if(logos[n]) return logos[n];
    const matches=Object.keys(logos).filter(k=>k.length>2&&(n.includes(k)||k.includes(n))).sort((a,b)=>b.length-a.length);
    return matches.length?logos[matches[0]]:"";
  }
  const code=directLogoCodes[sport]?.[n];
  if(!code) return "";
  const league=sport.toLowerCase();
  return `https://a.espncdn.com/i/teamlogos/${league}/500/${code}.png`;
}
async function fetchLeagueLogos(sport){
  // College logo data is bundled with the app so local and home-screen installs
  // do not depend on a cross-origin API request.
  return;
}
function findLogo(sport,name){
  const direct=directLogoUrl(sport,name); if(direct) return direct;
  const n=normalizeTeamName(name), cached=logoCache[`${sport}:${n}`]; if(cached) return cached;
  const keys=Object.keys(logoCache).filter(k=>k.startsWith(`${sport}:`));
  const hit=keys.find(k=>{const x=k.slice(sport.length+1);return x===n||x.includes(n)||n.includes(x)});
  return hit?logoCache[hit]:"";
}
function applyLogo(img,src){
  if(!src) return;
  img.onload=()=>{img.hidden=false;img.nextElementSibling?.classList.add("has-logo");};
  img.onerror=()=>{img.hidden=true;img.nextElementSibling?.classList.remove("has-logo");};
  img.src=src;
}
async function hydrateOverviewLogos(){
  const imgs=[...document.querySelectorAll("img[data-logo-sport]")];
  imgs.forEach(img=>applyLogo(img,findLogo(img.dataset.logoSport,img.dataset.logoName)));
}
async function renderOverview(){
  document.body.classList.add("overview-mode");
  $("#controls").hidden=true;
  const cover=(await getPhotos("__cover__"))[0]||"";
  const visits=[];
  STADIUMS.forEach(stadium=>getVisits(stadium.id).forEach(visit=>visits.push({stadium,visit})));
  visits.sort((a,b)=>(b.visit.date||"0000-00-00").localeCompare(a.visit.date||"0000-00-00")||a.stadium.team.localeCompare(b.stadium.team));
  const grouped={};
  visits.forEach(item=>{const y=(item.visit.date||"").slice(0,4)||"Date not entered";(grouped[y]??=[]).push(item);});
  const years=Object.keys(grouped).sort((a,b)=>b.localeCompare(a));
  const yearHtml=(await Promise.all(years.map(async year=>`<section class="event-year"><div class="year-heading"><h2>${escapeHtml(year)}</h2><span>${grouped[year].length} event${grouped[year].length===1?'':'s'}</span></div><div class="event-stack">${(await Promise.all(grouped[year].map(item=>eventCard(item.stadium,item.visit)))).join('')}</div></section>`))).join('');
  const venueCount=new Set(visits.map(v=>v.stadium.id)).size;
  $("#content").innerHTML=`<section class="passport-cover ${cover?'has-cover':''}" ${cover?`style="background-image:linear-gradient(90deg,rgba(0,0,0,.55),rgba(0,0,0,.08)),url('${cover}')"`:''}><div><h2>Welcome Back, Travis!</h2><p>${visits.length} game visit${visits.length===1?'':'s'} · ${venueCount} unique venue${venueCount===1?'':'s'}</p></div><label class="cover-camera" title="Change cover photo">📷<input id="coverInput" type="file" accept="image/*" hidden></label></section>${visits.length?yearHtml:'<div class="empty overview-empty">Your saved visits will appear here, grouped by year.</div>'}${mapSection('All visited venues')}`;
  initVisitedMap(STADIUMS.filter(x=>getVisits(x.id).length));
  $("#coverInput").onchange=async ev=>{const f=ev.target.files[0];if(!f)return;const data=await resizeImage(f,1600,.84);await putPhotos("__cover__",[data]);renderOverview();};
  $("#content").querySelectorAll(".event-card").forEach(el=>el.onclick=()=>openDetail(el.dataset.id,el.dataset.visitId));
  hydrateOverviewLogos();
}
function initials(text){return String(text||'').split(/\s+/).filter(Boolean).slice(0,3).map(w=>w[0]).join('').toUpperCase();}
function shortDate(date){if(!date)return {day:'--',mon:'---',year:'----'};const d=new Date(`${date}T12:00:00`);return {day:String(d.getDate()).padStart(2,'0'),mon:d.toLocaleDateString(undefined,{month:'short'}).toUpperCase(),year:String(d.getFullYear())};}
async function eventCard(x,e){
  const gameSport=inferGameSport(e,x.sport);
  let photos=await getPhotos(visitPhotoKey(x.id,e.id));
  if(!photos.length&&e.id==='legacy')photos=await getPhotos(x.id);
  const thumb=photos[0]||"",d=shortDate(e.date);
  const seat=[e.section&&`Sec ${e.section}`,e.row&&`Row ${e.row}`,e.seat&&`Seat ${e.seat}`].filter(Boolean).join(' · ');
  const homeTeam=e.teamName||x.team;
  const awayTeam=e.opponent||'Opponent';
  const homeDisplay=e.teamMascot?`${homeTeam} ${e.teamMascot}`:homeTeam;
  const awayDisplay=e.opponentMascot?`${awayTeam} ${e.opponentMascot}`:awayTeam;
  const hasScore=e.teamScore!==undefined&&e.teamScore!==''&&e.opponentScore!==undefined&&e.opponentScore!=='';
  const homeScore=hasScore?escapeHtml(e.teamScore):'';
  const awayScore=hasScore?escapeHtml(e.opponentScore):'';
  const homeNumber=Number(e.teamScore),awayNumber=Number(e.opponentScore);
  const homeWinner=hasScore&&Number.isFinite(homeNumber)&&Number.isFinite(awayNumber)&&homeNumber>awayNumber;
  const awayWinner=hasScore&&Number.isFinite(homeNumber)&&Number.isFinite(awayNumber)&&awayNumber>homeNumber;
  const neutralBadge=e.neutralSite?'<span class="neutral-site-badge">Neutral Site</span>':'';
  const scoreMarkup=hasScore?`<div class="score-line" aria-label="${escapeHtml(awayTeam)} ${awayScore}, ${escapeHtml(homeTeam)} ${homeScore}"><strong class="${awayWinner?'winner':''}">${awayScore}</strong><span>-</span><strong class="${homeWinner?'winner':''}">${homeScore}</strong></div>`:'<div class="score-not-entered">Score not entered</div>';
  return `<article class="event-card sport-${gameSport.toLowerCase()}" data-id="${x.id}" data-visit-id="${escapeHtml(e.id)}"><div class="event-score"><div class="event-card-flags"><span class="event-sport">${gameSport}</span>${neutralBadge}</div>${scoreMarkup}<div class="logo-row"><div class="${awayWinner?'winner-team':''}"><span class="team-logo opponent-logo"><img data-logo-sport="${gameSport}" data-logo-name="${escapeHtml(awayDisplay)}" alt="${escapeHtml(awayTeam)} logo" hidden><span class="logo-fallback">${initials(awayTeam)}</span></span><small>${escapeHtml(awayDisplay)}</small></div><b>AT</b><div class="${homeWinner?'winner-team':''}"><span class="team-logo"><img data-logo-sport="${gameSport}" data-logo-name="${escapeHtml(homeDisplay)}" alt="${escapeHtml(homeTeam)} logo" hidden><span class="logo-fallback">${initials(homeTeam)}</span></span><small>${escapeHtml(homeDisplay)}</small></div></div><p class="event-stadium-name">${escapeHtml(x.venue)}</p></div><div class="event-photo">${thumb?mediaElement(thumb,`${x.venue} visit media`,`event-card-media`):`<div class="event-photo-placeholder">${gameSport}</div>`}</div><div class="event-meta"><div class="big-date"><strong>${d.day} ${d.mon}</strong><span>${d.year}</span></div><p>📍 ${escapeHtml(x.city)}${x.state?`, ${escapeHtml(x.state)}`:''}</p>${seat?`<p>🎟 ${escapeHtml(seat)}</p>`:''}${e.opponent?`<p class="overview-matchup-line">${escapeHtml(awayDisplay)} vs. ${escapeHtml(homeDisplay)}</p>`:''}${e.eventType?`<p class="overview-event-type">${escapeHtml(e.eventType)}${e.eventName?` · ${escapeHtml(e.eventName)}`:''}</p>`:''}</div></article>`;
}
const CONFERENCE_LOGO_DOMAINS={
  "ACC":"theacc.com","ASUN":"asunsports.org","America East":"americaeast.com","American":"theamerican.org",
  "Atlantic 10":"atlantic10.com","Big 12":"big12sports.com","Big East":"bigeast.com","Big Sky":"bigskyconf.com",
  "Big South":"bigsouthsports.com","Big Ten":"bigten.org","Big West":"bigwest.org","CAA":"caasports.com",
  "C-USA":"conferenceusa.com","CUSA":"conferenceusa.com","Horizon":"horizonleague.org","Ivy":"ivyleague.com",
  "MAAC":"maacsports.com","MAC":"getsomemaction.com","MEAC":"meacsports.com","Missouri Valley":"mvc-sports.com",
  "Mountain West":"themw.com","NEC":"northeastconference.org","Ohio Valley":"ovcsports.com","Patriot":"patriotleague.org",
  "SEC":"secsports.com","SWAC":"swac.org","Southern":"soconsports.com","Southland":"southland.org",
  "Summit":"thesummitleague.org","Sun Belt":"sunbeltsports.org","WAC":"wacsports.com","West Coast":"wccsports.com",
  "Pac-12":"pac-12.com","Independent":"ncaa.com","AFC":"nfl.com","NFC":"nfl.com",
  "American League":"mlb.com","National League":"mlb.com","Eastern Conference":"nba.com","Western Conference":"nba.com"
};
const SPORT_LOGO_DOMAINS={NFL:"nfl.com",MLB:"mlb.com",NBA:"nba.com",CFB:"ncaa.com",CBB:"ncaa.com"};
const CONFERENCE_LOGO_OVERRIDES={
  "MAC":"./mac-logo.png",
  "Summit":"./summit-league-logo.png"
};
function conferenceLogoUrl(sport,conference){
  if(CONFERENCE_LOGO_OVERRIDES[conference]) return CONFERENCE_LOGO_OVERRIDES[conference];
  const domain=CONFERENCE_LOGO_DOMAINS[conference]||SPORT_LOGO_DOMAINS[sport]||"ncaa.com";
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
}
function headerBadge(name,kind='conference',sport='',conference=''){
  const logoConference=kind==='division'?(conference||name):name;
  const src=conferenceLogoUrl(sport,logoConference);
  return `<span class="header-badge ${kind}-badge" aria-hidden="true"><img src="${src}" alt="" loading="lazy" referrerpolicy="no-referrer"></span>`;
}
function headingWithBadge(name,kind='conference',sport='',conference=''){
  return `${headerBadge(name,kind,sport,conference)}<span>${escapeHtml(name)}</span>`;
}

function renderChecklist(){
  $("#controls").hidden=true;
  const leagueNames={NFL:"NFL",MLB:"MLB",NBA:"NBA",CFB:"College Football",CBB:"College Basketball"};
  const html=trackedSports.map(sport=>{
    const rows=STADIUMS.filter(x=>x.sport===sport);
    const conferences=[...new Set(rows.map(x=>x.conference))].sort((a,b)=>a.localeCompare(b));
    return `<section class="checklist-league"><div class="checklist-league-heading"><h2>${leagueNames[sport]}</h2><span>${rows.filter(x=>getEntry(x.id).visited).length}/${rows.length} visited</span></div>${conferences.map(conf=>{const cr=rows.filter(x=>x.conference===conf),divisions=[...new Set(cr.map(x=>x.division||"Other"))];return `<div class="checklist-conference"><h3>${headingWithBadge(conf,'conference',sport,conf)}</h3>${divisions.map(div=>`<div class="checklist-division"><h4>${headingWithBadge(div,'division',sport,conf)}</h4><div class="checklist-grid">${cr.filter(x=>(x.division||"Other")===div).sort((a,b)=>a.team.localeCompare(b.team)).map(checklistItem).join("")}</div></div>`).join("")}</div>`;}).join("")}</section>`;
  }).join("");
  $("#content").innerHTML=`<section class="checklist-intro"><p class="eyebrow">COMPLETE VENUE LIST</p><h2>Your stadium checklist</h2><p>Teams turn green after you save a visit. Tap any team to view or update its entry.</p></section>${html}${mapSection('All visited venues')}`;
  $("#content").querySelectorAll(".checklist-item").forEach(el=>el.onclick=()=>openDetail(el.dataset.id));
  hydrateOverviewLogos();
  initVisitedMap(STADIUMS.filter(x=>getEntry(x.id).visited));
}
function checklistItem(x){const e=getEntry(x.id);return `<button type="button" class="checklist-item ${e.visited?'visited':''}" data-id="${x.id}"><span class="checklist-dot">${e.visited?'✓':'○'}</span><span class="list-team-logo"><img data-logo-sport="${x.sport}" data-logo-name="${escapeHtml(x.team)}" alt="${escapeHtml(x.team)} logo" hidden></span><span class="checklist-team-copy"><strong>${escapeHtml(x.team)}</strong><small>${escapeHtml(x.venue)}</small></span></button>`;}


const US_STATE_NAMES={AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",CO:"Colorado",CT:"Connecticut",DE:"Delaware",FL:"Florida",GA:"Georgia",HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",KS:"Kansas",KY:"Kentucky",LA:"Louisiana",ME:"Maine",MD:"Maryland",MA:"Massachusetts",MI:"Michigan",MN:"Minnesota",MS:"Mississippi",MO:"Missouri",MT:"Montana",NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",NJ:"New Jersey",NM:"New Mexico",NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",VA:"Virginia",WA:"Washington",WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming",DC:"District of Columbia"};
const STATE_NAME_TO_ABBR=Object.fromEntries(Object.entries(US_STATE_NAMES).map(([abbr,name])=>[name,abbr]));
const SCRATCH_GEOJSON_URL='https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json';
function scratchedStatesForSport(sport){
  const out={};
  STADIUMS.filter(x=>x.sport===sport&&US_STATE_NAMES[x.state]).forEach(x=>{
    const visits=getVisits(x.id).length;
    if(visits){out[x.state]??={venues:new Set(),visits:0};out[x.state].venues.add(x.id);out[x.state].visits+=visits;}
  });
  return out;
}
function stateSportRows(sport,abbr){return STADIUMS.filter(x=>x.sport===sport&&x.state===abbr);}
function scratchStateDetailsHtml(sport,abbr){
  const all=stateSportRows(sport,abbr),visited=all.filter(x=>getVisits(x.id).length),remaining=all.filter(x=>!getVisits(x.id).length);
  const pct=all.length?Math.round(visited.length/all.length*100):0;
  return `<div class="scratch-detail-head"><div><p class="eyebrow">${escapeHtml(sport)} STATE DETAIL</p><h3>${escapeHtml(US_STATE_NAMES[abbr]||abbr)}</h3></div><strong>${visited.length}/${all.length}</strong></div><p>${pct}% of listed ${sport} venues in this state have been visited.</p>${visited.length?`<h4>Visited</h4><div class="scratch-venue-list">${visited.map(x=>`<button type="button" data-id="${x.id}"><span class="list-team-logo"><img data-logo-sport="${x.sport}" data-logo-name="${escapeHtml(x.team)}" alt="${escapeHtml(x.team)} logo" hidden><span class="list-logo-fallback">${initials(x.team)}</span></span><span><strong>${escapeHtml(x.team)}</strong><small>${escapeHtml(x.venue)} · ${getVisits(x.id).length} visit${getVisits(x.id).length===1?'':'s'}</small></span></button>`).join('')}</div>`:'<p class="small">No visits saved in this state yet.</p>'}${remaining.length?`<h4>Remaining</h4><ul class="scratch-remaining">${remaining.map(x=>`<li>${escapeHtml(x.team)} — ${escapeHtml(x.venue)}</li>`).join('')}</ul>`:''}`;
}
async function renderScratchMap(selectedSport="NFL"){
  $("#controls").hidden=true;
  const sport=trackedSports.includes(selectedSport)?selectedSport:"NFL",scratched=scratchedStatesForSport(sport),scratchedCount=Object.keys(scratched).length;
  $("#content").innerHTML=`<section class="scratch-shell"><div class="scratch-heading"><div><p class="eyebrow">SPORT-BY-SPORT TRAVEL MAP</p><h2>${sport} Scratch Map</h2><p>States turn green after you save at least one ${sport} venue visit there.</p></div><div class="scratch-total"><strong>${scratchedCount}</strong><span>states scratched</span></div></div><div class="scratch-sport-tabs">${trackedSports.map(s=>`<button type="button" class="${s===sport?'active':''}" data-scratch-sport="${s}">${s}</button>`).join('')}</div><div id="scratchMap" class="scratch-real-map" role="region" aria-label="Interactive United States scratch map for ${sport}"></div><div class="scratch-legend"><span><i class="legend-unscratched"></i>Not yet visited</span><span><i class="legend-scratched"></i>Scratched off</span></div><div id="scratchStateDetails" class="scratch-state-details"><p>Tap any state to see visited and remaining venues.</p></div></section>`;
  $("#content").querySelectorAll('[data-scratch-sport]').forEach(b=>b.onclick=()=>renderScratchMap(b.dataset.scratchSport));
  if(typeof L==='undefined'){ $("#scratchMap").innerHTML='<div class="map-fallback">The map loads when the app has an internet connection.</div>'; return; }
  currentMap=L.map('scratchMap',{scrollWheelZoom:false,zoomControl:true}).setView([38.5,-96],4);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'&copy; OpenStreetMap contributors'}).addTo(currentMap);
  try{
    const geo=await fetch(SCRATCH_GEOJSON_URL).then(r=>{if(!r.ok)throw new Error('Map data unavailable');return r.json();});
    const layer=L.geoJSON(geo,{style:feature=>{const abbr=STATE_NAME_TO_ABBR[feature.properties.name];return {color:'#ffffff',weight:1.2,fillColor:scratched[abbr]?'#16a34a':'#9ca3af',fillOpacity:.78};},onEachFeature:(feature,l)=>{
      const abbr=STATE_NAME_TO_ABBR[feature.properties.name];if(!abbr)return;
      const all=stateSportRows(sport,abbr),visited=all.filter(x=>getVisits(x.id).length);
      l.bindTooltip(`<strong>${escapeHtml(feature.properties.name)}</strong><br>${visited.length}/${all.length} listed venues visited`,{sticky:true});
      l.on({mouseover:e=>e.target.setStyle({weight:3,fillOpacity:.95}),mouseout:e=>layer.resetStyle(e.target),click:()=>{
        $("#scratchStateDetails").innerHTML=scratchStateDetailsHtml(sport,abbr);
        $("#scratchStateDetails").querySelectorAll('[data-id]').forEach(el=>el.onclick=()=>openDetail(el.dataset.id));hydrateOverviewLogos();
      }});
    }}).addTo(currentMap);
    currentMap.fitBounds(layer.getBounds(),{padding:[12,12]});
  }catch(err){$("#scratchMap").innerHTML='<div class="map-fallback">The state outlines could not load. Check your connection and reopen the Scratch Map.</div>';}
  setTimeout(()=>currentMap&&currentMap.invalidateSize(),50);
}
function firstVisitDate(id){return getVisits(id).map(v=>v.date).filter(Boolean).sort()[0]||'';}
function completionDate(rows){const dates=rows.map(x=>firstVisitDate(x.id));return dates.every(Boolean)?dates.sort().at(-1):'';}
function badge(icon,title,description,unlocked,date=''){
  return `<article class="achievement-card ${unlocked?'unlocked':'locked'}"><div class="achievement-icon">${unlocked?icon:'🔒'}</div><div><p class="achievement-status">${unlocked?'UNLOCKED':'LOCKED'}</p><h3>${escapeHtml(title)}</h3><p>${escapeHtml(description)}</p>${unlocked?`<small>${date?`Earned ${formatDate(date)}`:'Achievement earned'}</small>`:''}</div></article>`;
}
async function renderAchievements(){
  $("#controls").hidden=true;
  const visitedRows=STADIUMS.filter(x=>getVisits(x.id).length),uniqueCount=visitedRows.length;
  const milestones=[1,10,25,50,100,250,500].map(n=>{const sorted=visitedRows.map(x=>({x,date:firstVisitDate(x.id)})).filter(v=>v.date).sort((a,b)=>a.date.localeCompare(b.date));return badge('🏟️',n===1?'First Stadium':`${n} Stadiums`,n===1?'Save your first stadium visit.':`Visit ${n} unique stadiums.`,uniqueCount>=n,sorted[n-1]?.date||'');});
  const groupBadges=[];
  ['NFL','MLB','NBA'].forEach(sport=>{
    const rows=STADIUMS.filter(x=>x.sport===sport),confs=[...new Set(rows.map(x=>x.conference))].sort((a,b)=>a.localeCompare(b));
    confs.forEach(conf=>{
      const cr=rows.filter(x=>x.conference===conf),divs=[...new Set(cr.map(x=>x.division))];
      divs.forEach(div=>{const dr=cr.filter(x=>x.division===div),date=completionDate(dr);groupBadges.push(badge(sport==='NFL'?'🏈':sport==='MLB'?'⚾':'🏀',`${conf} ${div}`,`Visit every ${sport} venue in this division.`,!!date,date));});
      const cdate=completionDate(cr);groupBadges.push(badge('🏆',conf,`Visit every ${sport} venue in this conference or league.`,!!cdate,cdate));
    });
    const date=completionDate(rows);groupBadges.push(badge('🏆',`Complete ${sport}`,`Visit every listed ${sport} venue.`,!!date,date));
  });
  ['CFB','CBB'].forEach(sport=>{
    const rows=STADIUMS.filter(x=>x.sport===sport),confs=[...new Set(rows.map(x=>x.conference))].sort((a,b)=>a.localeCompare(b));
    confs.forEach(conf=>{const cr=rows.filter(x=>x.conference===conf),date=completionDate(cr);groupBadges.push(badge(sport==='CFB'?'🏈':'🏀',`${conf} Complete`,`Visit every listed ${sport==='CFB'?'football':'basketball'} venue in ${conf}.`,!!date,date));});
    const date=completionDate(rows);groupBadges.push(badge('🏆',sport==='CFB'?'All FBS Stadiums':'All College Basketball Arenas',`Visit every listed ${sport} venue.`,!!date,date));
  });
  const photos=await allPhotos(),ticketCount=Object.entries(photos).filter(([k,v])=>k.startsWith('ticket::')&&Array.isArray(v)&&v.length).length,photoCount=Object.entries(photos).filter(([k])=>!k.startsWith('ticket::')&&k!=='__cover__').reduce((n,[,v])=>n+(Array.isArray(v)?v.length:0),0);
  const stateSet=new Set(visitedRows.map(x=>x.state));
  const special=[
    badge('🎟️','25 Ticket Scans','Attach ticket scans to 25 visits.',ticketCount>=25),
    badge('📸','100 Photos','Save 100 stadium photos.',photoCount>=100),
    badge('🌊','Coast to Coast','Record visits in both an Atlantic state and a Pacific state.',[...['CA','OR','WA','HI','AK']].some(x=>stateSet.has(x))&&[...['ME','NH','MA','RI','CT','NY','NJ','DE','MD','VA','NC','SC','GA','FL']].some(x=>stateSet.has(x))),
    badge('⭐','Texas Triple Crown','Visit at least three unique Texas venues.',visitedRows.filter(x=>x.state==='TX').length>=3),
    badge('🌴','Florida Triple Crown','Visit at least three unique Florida venues.',visitedRows.filter(x=>x.state==='FL').length>=3),
    badge('🏟️','Same Stadium, Different Teams','Visit two listed teams that share the same venue.',Object.values(visitedRows.reduce((a,x)=>{(a[x.venue]??=[]).push(x);return a;},{})).some(v=>v.length>=2)),
    badge('🎉','Five Sports in One Year','Record all five tracked sports during one calendar year.',Object.values(visitedRows.flatMap(x=>getVisits(x.id).map(v=>({sport:x.sport,year:(v.date||'').slice(0,4)}))).filter(x=>x.year).reduce((a,x)=>{(a[x.year]??=new Set()).add(x.sport);return a;},{})).some(set=>set.size===5))
  ];
  $("#content").innerHTML=`<section class="achievements-shell"><div class="achievements-hero"><div><p class="eyebrow">TROPHY CABINET</p><h2>Achievements</h2><p>Badges unlock automatically as your stadium passport grows.</p></div><div class="achievement-total"><strong>${[...milestones,...groupBadges,...special].filter(x=>x.includes('unlocked')).length}</strong><span>badges unlocked</span></div></div><section><h2>Milestones</h2><div class="achievement-grid">${milestones.join('')}</div></section><section><h2>League, Conference & Division Badges</h2><div class="achievement-grid">${groupBadges.join('')}</div></section><section><h2>Special Achievements</h2><div class="achievement-grid">${special.join('')}</div></section></section>`;
}

let selectedLeagueTeamId = null;
function renderContent(){
  $("#controls").hidden=false;
  const q=$("#search").value.toLowerCase().trim(),status=$("#statusFilter").value;
  let rows=STADIUMS.filter(x=>x.sport===activeSport).filter(x=>!q||[x.team,x.venue,x.city,x.state,x.conference,x.division].join(" ").toLowerCase().includes(q));
  if(status!=="all") rows=rows.filter(x=>status==="visited"?getEntry(x.id).visited:!getEntry(x.id).visited);
  if(!rows.length){$("#content").innerHTML='<div class="empty">No matching venues.</div>';return;}

  const conferences=[...new Set(rows.map(x=>x.conference))].sort((a,b)=>a.localeCompare(b));
  if(!selectedLeagueTeamId || !rows.some(x=>x.id===selectedLeagueTeamId)) selectedLeagueTeamId=rows[0].id;
  const selected=rows.find(x=>x.id===selectedLeagueTeamId)||rows[0];
  const selectedEntry=getEntry(selected.id);
  const selectedVisits=getVisits(selected.id);
  const visitedCount=rows.filter(x=>getEntry(x.id).visited).length;
  const pct=rows.length?Math.round(visitedCount/rows.length*100):0;

  const collegePage=activeSport==="CFB"||activeSport==="CBB";
  const conferenceNav=conferences.map(conf=>{
    const cr=rows.filter(x=>x.conference===conf),visited=cr.filter(x=>getEntry(x.id).visited).length;
    if(collegePage){
      return `<section class="league-nav-conference college-conference-nav"><button type="button" class="league-nav-head league-nav-conference-button" data-conference-target="${escapeHtml(conf)}">${headingWithBadge(conf,'conference',activeSport,conf)}<small>${visited}/${cr.length} visited · ${cr.length} teams</small><b>›</b></button></section>`;
    }
    const divisions=[...new Set(cr.map(x=>x.division||"Other"))].sort((a,b)=>a.localeCompare(b));
    return `<section class="league-nav-conference"><div class="league-nav-head">${headingWithBadge(conf,'conference',activeSport,conf)}<small>${visited}/${cr.length} visited</small></div>${divisions.map(div=>{const count=cr.filter(x=>(x.division||"Other")===div).length;return `<button type="button" class="league-nav-division" data-scroll-target="${escapeHtml(`${conf}::${div}`)}"><span><strong>${escapeHtml(div)}</strong><small>${count} team${count===1?'':'s'}</small></span><b>›</b></button>`;}).join('')}</section>`;
  }).join('');

  const teamGroups=conferences.map(conf=>{
    const cr=rows.filter(x=>x.conference===conf);
    if(collegePage){
      const teams=[...cr].sort((a,b)=>a.team.localeCompare(b.team));
      return `<section class="league-conference-section college-conference-section" data-conference-key="${escapeHtml(conf)}"><button type="button" class="league-column-head college-conference-toggle" aria-expanded="true">${headingWithBadge(conf,'conference',activeSport,conf)}<small>${cr.length} teams</small><b class="conference-chevron">⌄</b></button><div class="college-conference-teams"><div class="league-team-list">${teams.map(leagueTeamRow).join('')}</div></div></section>`;
    }
    const divisions=[...new Set(cr.map(x=>x.division||"Other"))].sort((a,b)=>a.localeCompare(b));
    return `<section class="league-conference-section"><div class="league-column-head">${headingWithBadge(conf,'conference',activeSport,conf)}<small>${cr.length} teams</small></div><div class="league-division-grid">${divisions.map(div=>{const dr=cr.filter(x=>(x.division||"Other")===div).sort((a,b)=>a.team.localeCompare(b.team));return `<section class="league-division-block" data-group-key="${escapeHtml(`${conf}::${div}`)}"><h3><span>${escapeHtml(div)}</span><small>${dr.length} teams</small></h3><div class="league-team-list">${dr.map(leagueTeamRow).join('')}</div></section>`;}).join('')}</div></section>`;
  }).join('');

  const date=selectedEntry.date?formatDate(selectedEntry.date):'No visit recorded';
  const leagueSwitcher=`<section class="mobile-league-switcher" aria-label="Choose league">${trackedSports.map(s=>`<button type="button" class="${s===activeSport?'active':''}" data-league-sport="${s}"><strong>${s}</strong><small>${s==='NFL'?'Pro Football':s==='CFB'?'College Football':s==='MLB'?'Baseball':s==='CBB'?'College Basketball':'Pro Basketball'}</small></button>`).join('')}</section>`;
  $("#content").innerHTML=`${leagueSwitcher}<section class="league-browser-shell"><aside class="league-sidebar"><div class="league-brand">${headerBadge(activeSport,'conference',activeSport,conferences[0])}<div><strong>${escapeHtml(activeSport)}</strong><small>${rows.length} listed teams</small></div></div>${conferenceNav}</aside><main class="league-team-pane"><div class="league-progress"><strong>Visited: ${visitedCount}/${rows.length} (${pct}%)</strong><div class="completion-bar"><span style="width:${pct}%"></span></div></div><div class="league-columns">${teamGroups}</div></main><aside class="league-detail-pane">${leaguePreview(selected,selectedEntry,selectedVisits,date)}</aside></section>${mapSection(`${activeSport} visited venues`)}`;

  $("#content").querySelectorAll('[data-league-sport]').forEach(button=>button.onclick=()=>{activeSport=button.dataset.leagueSport;lastLeagueSport=activeSport;selectedLeagueTeamId=null;render();window.scrollTo({top:0,behavior:'smooth'});});
  $("#content").querySelectorAll('.league-team-row').forEach(el=>el.onclick=()=>{selectedLeagueTeamId=el.dataset.id;renderContent();});
  $("#content").querySelectorAll('[data-open-detail]').forEach(el=>el.onclick=()=>openDetail(el.dataset.openDetail));
  $("#content").querySelectorAll('[data-scroll-target]').forEach(el=>el.onclick=()=>{const target=$("#content").querySelector(`[data-group-key="${CSS.escape(el.dataset.scrollTarget)}"]`);target?.scrollIntoView({behavior:'smooth',block:'start'});});
  $("#content").querySelectorAll('.college-conference-toggle').forEach(button=>button.onclick=()=>{
    const section=button.closest('.college-conference-section'),body=section?.querySelector('.college-conference-teams');
    if(!section||!body)return;
    const collapsed=section.classList.toggle('collapsed');
    button.setAttribute('aria-expanded',String(!collapsed));
  });
  $("#content").querySelectorAll('[data-conference-target]').forEach(button=>button.onclick=()=>{
    const section=$("#content").querySelector(`[data-conference-key="${CSS.escape(button.dataset.conferenceTarget)}"]`);
    if(!section)return;
    if(section.classList.contains('collapsed')){section.classList.remove('collapsed');section.querySelector('.college-conference-toggle')?.setAttribute('aria-expanded','true');}
    section.scrollIntoView({behavior:'smooth',block:'start'});
  });
  hydrateOverviewLogos();
  initVisitedMap(STADIUMS.filter(x=>x.sport===activeSport&&getEntry(x.id).visited));
}
function leagueTeamRow(x){
  const e=getEntry(x.id);
  return `<button type="button" class="league-team-row ${e.visited?'visited':''} ${x.id===selectedLeagueTeamId?'selected':''}" data-id="${x.id}"><span class="list-team-logo"><img data-logo-sport="${x.sport}" data-logo-name="${escapeHtml(x.team)}" alt="${escapeHtml(x.team)} logo" hidden><span class="list-logo-fallback">${initials(x.team)}</span></span><span class="league-team-copy"><strong>${escapeHtml(x.team)}</strong><small>${escapeHtml(x.venue)}</small><em>${escapeHtml(x.city)}${x.state?`, ${escapeHtml(x.state)}`:''}</em></span><span class="league-visit-state">${e.visited?'✓<small>Visited</small>':'○<small>Not visited</small>'}</span><b>›</b></button>`;
}
function leaguePreview(x,e,visits,date){
  return `<div class="league-preview-logo"><img data-logo-sport="${x.sport}" data-logo-name="${escapeHtml(x.team)}" alt="${escapeHtml(x.team)} logo" hidden></div><h2>${escapeHtml(x.team)}</h2><h3>${escapeHtml(x.venue)}</h3><p>${escapeHtml(x.city)}${x.state?`, ${escapeHtml(x.state)}`:''}</p><span class="preview-status ${e.visited?'visited':''}">${e.visited?'✓ Visited':'Not visited'}</span><dl><div><dt>Conference</dt><dd>${escapeHtml(x.conference)}</dd></div>${(x.sport==='CFB'||x.sport==='CBB')?'':`<div><dt>Division</dt><dd>${escapeHtml(x.division||'Other')}</dd></div>`}<div><dt>Visits</dt><dd>${visits.length}</dd></div><div><dt>Last visit</dt><dd>${escapeHtml(date)}</dd></div></dl><button type="button" class="preview-primary" data-open-detail="${x.id}">View / Edit Details</button><button type="button" class="preview-secondary" data-open-detail="${x.id}">Add New Visit</button>`;
}
function mapSection(title){return `<section class="map-section"><div class="section-heading"><div><h2>${escapeHtml(title)}</h2><p>Tap a sport-colored marker to preview the stadium exterior without leaving the app.</p></div></div><div id="visitedMap" class="visited-map" role="region" aria-label="Map of visited stadiums"></div><p id="mapEmpty" class="map-empty" hidden>No visited venues with map coordinates yet.</p></section>`;}
function initVisitedMap(venues){
  const mapEl=$("#visitedMap"),empty=$("#mapEmpty");if(!mapEl)return;
  if(typeof L==="undefined"){mapEl.innerHTML='<div class="map-fallback">The map loads when the app has an internet connection.</div>';return;}
  const mapped=venues.filter(x=>Number(x.lat)&&Number(x.lng));
  currentMap=L.map(mapEl,{scrollWheelZoom:false}).setView([39.5,-98.35],4);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'&copy; OpenStreetMap contributors'}).addTo(currentMap);
  const sportColors={NFL:'#dc2626',MLB:'#2563eb',CFB:'#92400e',CBB:'#f97316',NBA:'#7e22ce'};
  const bounds=[];
  mapped.forEach(x=>{const color=sportColors[x.sport]||'#16a34a',icon=L.divIcon({className:'passport-marker-wrap',html:`<span class="passport-marker" style="--marker-color:${color}"></span>`,iconSize:[36,36],iconAnchor:[18,34]}),m=L.marker([Number(x.lat),Number(x.lng)],{icon,title:`Open outside view of ${x.venue}`}).addTo(currentMap);bounds.push([Number(x.lat),Number(x.lng)]);m.bindTooltip(`<strong>${escapeHtml(x.team)}</strong><br>${escapeHtml(x.venue)}<br>Tap for exterior preview`,{direction:'top',offset:[0,-28]});m.on('click',()=>showStadiumExterior(x));});
  if(bounds.length){currentMap.fitBounds(bounds,{padding:[32,32],maxZoom:7});if(empty)empty.hidden=true;}else{if(empty)empty.hidden=false;}
  setTimeout(()=>currentMap&&currentMap.invalidateSize(),50);
}

function showStadiumExterior(x){
  const dialog=$("#exteriorDialog"),frame=$("#exteriorFrame"),title=$("#exteriorTitle"),details=$("#exteriorDetails"),fallback=$("#exteriorFallback");
  if(!dialog||!frame)return;
  const lat=encodeURIComponent(x.lat),lng=encodeURIComponent(x.lng);
  title.textContent=x.venue;
  details.textContent=`${x.team} · ${x.city}${x.state?`, ${x.state}`:''}`;
  frame.src=`https://www.google.com/maps?layer=c&cbll=${lat},${lng}&cbp=0,0,0,0,0&output=svembed`;
  fallback.href=`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
  dialog.showModal();
}

function card(x){const e=getEntry(x.id),visitCount=getVisits(x.id).length,date=e.date?new Date(`${e.date}T12:00:00`).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'}):'';const seat=[e.section&&`Section ${e.section}`,e.row&&`Row ${e.row}`,e.seat&&`Seat ${e.seat}`].filter(Boolean).join(' · ');return `<article class="venue-card ${e.visited?'visited':''}" data-id="${x.id}"><div class="check">${e.visited?'✓':'○'}</div><span class="list-team-logo"><img data-logo-sport="${x.sport}" data-logo-name="${escapeHtml(x.team)}" alt="${escapeHtml(x.team)} logo" hidden><span class="list-logo-fallback">${initials(x.team)}</span></span><div class="venue-card-copy"><h3>${escapeHtml(x.team)}</h3><p>${escapeHtml(x.venue)}${x.city?` · ${escapeHtml(x.city)}, ${escapeHtml(x.state)}`:''}</p>${e.visited?`<span class="visit-count">${visitCount} visit${visitCount===1?'':'s'}</span><span class="visit-date">${date?date:'Date not entered'}</span>${e.opponent?`<span class="visit-detail">Opponent: ${escapeHtml(e.opponent)}</span>`:''}${seat?`<span class="visit-detail">${escapeHtml(seat)}</span>`:''}`:''}</div></article>`}

function renderEdits(){
  const sportOptions=trackedSports.map(s=>`<option value="${s}">${s}</option>`).join('');
  const teamOptions=STADIUMS.slice().sort((a,b)=>a.sport.localeCompare(b.sport)||a.team.localeCompare(b.team)).map(x=>`<option value="${escapeHtml(x.id)}">${escapeHtml(x.sport)} — ${escapeHtml(x.team)}</option>`).join('');
  $("#content").innerHTML=`<section class="edits-page">
    <div class="edits-hero"><p class="eyebrow">APP CUSTOMIZATION</p><h2>Edits</h2><p>Change team and venue information, or manually add planned games for 2027 and beyond. Changes are saved only to this device and are included in app backups.</p></div>
    <section class="edit-panel"><h3>Edit a team or venue</h3><label>Choose team<select id="editTeamSelect"><option value="">Select a team</option>${teamOptions}</select></label><form id="teamEditForm" class="form-grid" hidden>
      <label>Team name<input id="editTeamName"></label><label>Sport<select id="editSport">${sportOptions}</select></label>
      <label>Conference<input id="editConference"></label><label>Division<input id="editDivision"></label>
      <label class="full">Venue<input id="editVenue"></label><label>City<input id="editCity"></label><label>State<input id="editState"></label>
      <label>Capacity<input id="editCapacity"></label><label>Opened<input id="editOpened"></label>
      <div class="full edit-actions"><button type="submit">Save team edits</button><button type="button" id="resetTeamEdit" class="danger-outline">Restore original values</button></div>
    </form></section>
    <section class="edit-panel"><h3>Add a future or manual game</h3><p class="small">This creates a planned game entry. You can return later to add the score, seat, photos, and memories.</p><form id="manualGameForm" class="form-grid">
      <label class="full">Team / venue<select id="manualTeam" required><option value="">Choose team or venue</option>${teamOptions}</select></label>
      <label>Date<input id="manualDate" type="date" required></label><label>Season<input id="manualSeason" type="number" min="1900" max="2100" value="2027" required></label>
      <label>Opponent<input id="manualOpponent" required placeholder="Opponent"></label><label>Game league<select id="manualSport">${sportOptions}</select></label>
      <label>Event type<select id="manualEventType"><option>Regular Season</option><option>Preseason</option><option>Playoffs</option><option>Championship</option><option>Bowl Game</option><option>College Football Playoff</option><option>Conference Tournament</option><option>NCAA Tournament</option><option>Exhibition</option><option>Other</option></select></label>
      <label>Event name<input id="manualEventName" placeholder="Optional"></label>
      <label class="full neutral-switch"><input id="manualNeutral" type="checkbox"><span>Neutral-site game</span></label>
      <label class="full" id="manualVenueWrap" hidden>Actual venue<select id="manualVenue">${teamOptions}</select></label>
      <div class="full edit-actions"><button type="submit">Add planned game</button></div>
    </form><div id="manualGameStatus" class="schedule-update-progress"></div></section>
  </section>`;
  $("#controls").hidden=true;
  const select=$("#editTeamSelect"),form=$("#teamEditForm");let selectedId='';
  const fill=()=>{selectedId=select.value;const x=STADIUMS.find(r=>r.id===selectedId);form.hidden=!x;if(!x)return;$("#editTeamName").value=x.team||'';$("#editSport").value=x.sport||'NFL';$("#editConference").value=x.conference||'';$("#editDivision").value=x.division||'';$("#editVenue").value=x.venue||'';$("#editCity").value=x.city||'';$("#editState").value=x.state||'';$("#editCapacity").value=x.capacity||'';$("#editOpened").value=x.opened||'';};
  select.onchange=fill;
  form.onsubmit=e=>{e.preventDefault();const x=STADIUMS.find(r=>r.id===selectedId);if(!x)return;const edit={team:$("#editTeamName").value.trim(),sport:$("#editSport").value,conference:$("#editConference").value.trim(),division:$("#editDivision").value.trim(),venue:$("#editVenue").value.trim(),city:$("#editCity").value.trim(),state:$("#editState").value.trim(),capacity:$("#editCapacity").value.trim(),opened:$("#editOpened").value.trim()};teamEdits[selectedId]=edit;Object.assign(x,edit);saveTeamEdits();alert('Team information saved.');renderEdits();};
  $("#resetTeamEdit").onclick=()=>{if(!selectedId||!confirm('Restore this team to the app’s original information?'))return;delete teamEdits[selectedId];saveTeamEdits();location.reload();};
  const neutral=$("#manualNeutral"),venueWrap=$("#manualVenueWrap");neutral.onchange=()=>venueWrap.hidden=!neutral.checked;
  $("#manualTeam").onchange=()=>{const x=STADIUMS.find(r=>r.id===$("#manualTeam").value);if(x)$("#manualSport").value=x.sport;};
  $("#manualGameForm").onsubmit=e=>{e.preventDefault();const sourceId=$("#manualTeam").value,source=STADIUMS.find(r=>r.id===sourceId);if(!source)return;const targetId=neutral.checked?($("#manualVenue").value||sourceId):sourceId;const visit={...emptyVisit(),id:newVisitId(),date:$("#manualDate").value,season:String($("#manualSeason").value),gameSport:$("#manualSport").value,opponent:$("#manualOpponent").value.trim(),teamName:source.team,eventName:$("#manualEventName").value.trim(),eventType:$("#manualEventType").value,neutralSite:neutral.checked,venueId:targetId};const list=getVisits(targetId);list.push(visit);state[targetId]={visits:list};saveState();$("#manualGameStatus").textContent=`Added ${source.team} vs. ${visit.opponent} on ${formatDate(visit.date)}.`;e.target.reset();$("#manualSeason").value='2027';venueWrap.hidden=true;};
}

async function render(){if($("#controls"))$("#controls").hidden=activeSport==="OVERVIEW"||activeSport==="SCRATCH MAP"||activeSport==="PASSPORT"||activeSport==="PERSONAL RECORDS"||activeSport==="ACHIEVEMENTS"||activeSport==="EDITS";if(currentMap){currentMap.remove();currentMap=null;}document.body.classList.toggle("overview-mode",activeSport==="OVERVIEW");if(trackedSports.includes(activeSport))lastLeagueSport=activeSport;renderTabs();renderMobileNav();renderSummary();if(activeSport==="OVERVIEW")await renderOverview();else if(activeSport==="CHECKLIST")renderChecklist();else if(activeSport==="SCRATCH MAP")await renderScratchMap();else if(activeSport==="PASSPORT")await renderPassport();else if(activeSport==="PERSONAL RECORDS")await renderPersonalRecords();else if(activeSport==="ACHIEVEMENTS")await renderAchievements();else if(activeSport==="EDITS")renderEdits();else renderContent();}



function allVisitRows(){
  const rows=[];STADIUMS.forEach(stadium=>getVisits(stadium.id).forEach(visit=>rows.push({stadium,visit})));return rows;
}
function visitOutcome(v){const a=Number(v.teamScore),b=Number(v.opponentScore);if(!Number.isFinite(a)||!Number.isFinite(b))return v.outcome||'';return a>b?'WIN':a<b?'LOSS':'TIE';}
function gameCardHtml(stadium,visit){
  const gameSport=inferGameSport(visit,stadium.sport);
  const outcome=visitOutcome(visit),a=visit.teamScore,b=visit.opponentScore,has=a!==''&&b!=='';
  return `<section class="saved-game-card ${outcome.toLowerCase()}"><div class="game-card-top"><span>${gameSport}</span>${outcome?`<b>${escapeHtml(outcome)}</b>`:''}</div><h3>${escapeHtml(visit.teamName||stadium.team)} vs. ${escapeHtml(visit.opponent||'Opponent')}</h3>${has?`<div class="game-card-score">${escapeHtml(a)}–${escapeHtml(b)}</div>`:''}<p>📅 ${escapeHtml(formatDate(visit.date))}</p><p>🏟️ ${escapeHtml(stadium.venue)} · ${escapeHtml(stadium.city)}${stadium.state?`, ${escapeHtml(stadium.state)}`:''}</p>${visit.gameLabel?`<p>${escapeHtml(visit.gameLabel)}</p>`:''}</section>`;
}
const PASSPORT_MOTIFS={
  "lambeau field":{icon:"❄",label:"FROZEN TUNDRA",art:"LAMBEAU LEAP",pattern:"snow"},
  "fenway park":{icon:"🧱",label:"GREEN MONSTER",art:"FENWAY",pattern:"brick"},
  "wrigley field":{icon:"🌿",label:"IVY & MARQUEE",art:"WRIGLEY",pattern:"ivy"},
  "oricle park":{icon:"🌊",label:"McCOVEY COVE",art:"THE COVE",pattern:"waves"},
  "oracle park":{icon:"🌊",label:"McCOVEY COVE",art:"THE COVE",pattern:"waves"},
  "oriole park at camden yards":{icon:"🧱",label:"B&O WAREHOUSE",art:"CAMDEN",pattern:"brick"},
  "pnc park":{icon:"🌉",label:"CLEMENTE BRIDGE",art:"THE BURGH",pattern:"bridge"},
  "yankee stadium":{icon:"♛",label:"THE FRIEZE",art:"BRONX",pattern:"arches"},
  "dodger stadium":{icon:"🌴",label:"CHAVEZ RAVINE",art:"DODGER BLUE",pattern:"sunset"},
  "kauffman stadium":{icon:"⛲",label:"THE FOUNTAINS",art:"THE K",pattern:"waves"},
  "american family field":{icon:"🏠",label:"THE RETRACTABLE ROOF",art:"MILWAUKEE",pattern:"roof"},
  "highmark stadium":{icon:"🦬",label:"BILLS MAFIA",art:"THE RALPH",pattern:"snow"},
  "arrowhead stadium":{icon:"🔊",label:"SEA OF RED",art:"ARROWHEAD",pattern:"chevrons"},
  "geha field at arrowhead stadium":{icon:"🔊",label:"SEA OF RED",art:"ARROWHEAD",pattern:"chevrons"},
  "heinz field":{icon:"🌉",label:"THREE RIVERS",art:"STEEL CITY",pattern:"steel"},
  "acrisure stadium":{icon:"🌉",label:"THREE RIVERS",art:"STEEL CITY",pattern:"steel"},
  "soldier field":{icon:"🏛",label:"LAKEFRONT COLUMNS",art:"CHICAGO",pattern:"columns"},
  "allegiant stadium":{icon:"☠",label:"THE BLACK PEARL",art:"RAIDER NATION",pattern:"metal"},
  "sofi stadium":{icon:"◉",label:"THE INFINITY SCREEN",art:"INGLEWOOD",pattern:"rings"},
  "caesars superdome":{icon:"⚜",label:"WHO DAT",art:"THE DOME",pattern:"fleur"},
  "michigan stadium":{icon:"〽",label:"THE BIG HOUSE",art:"107,000+",pattern:"bowl"},
  "beaver stadium":{icon:"⚪",label:"WHITE OUT",art:"HAPPY VALLEY",pattern:"stripes"},
  "ohio stadium":{icon:"🌰",label:"THE HORSESHOE",art:"THE SHOE",pattern:"horseshoe"},
  "neyland stadium":{icon:"▧",label:"CHECKERBOARD END ZONES",art:"ROCKY TOP",pattern:"checker"},
  "notre dame stadium":{icon:"☘",label:"TOUCHDOWN JESUS",art:"SOUTH BEND",pattern:"gold"},
  "tiger stadium":{icon:"🐯",label:"DEATH VALLEY",art:"SATURDAY NIGHT",pattern:"tiger"},
  "autzen stadium":{icon:"🪽",label:"LOUD NEVER SLEEPS",art:"AUTZEN",pattern:"wings"},
  "allen fieldhouse":{icon:"🐦",label:"BEWARE OF THE PHOG",art:"ROCK CHALK",pattern:"rafters"},
  "cameron indoor stadium":{icon:"😈",label:"CAMERON CRAZIES",art:"KRZYZEWSKIVILLE",pattern:"crowd"},
  "madison square garden":{icon:"🗽",label:"THE WORLD'S MOST FAMOUS ARENA",art:"THE GARDEN",pattern:"rings"},
  "rupp arena":{icon:"🐱",label:"BIG BLUE NATION",art:"LEXINGTON",pattern:"checker"},
  "hinkle fieldhouse":{icon:"🏀",label:"INDIANA BASKETBALL",art:"HINKLE",pattern:"windows"},
  "the palestra":{icon:"🏛",label:"CATHEDRAL OF COLLEGE BASKETBALL",art:"PHILADELPHIA",pattern:"arches"},
  "atandt stadium":{icon:"★",label:"LONE STAR & RETRACTABLE ROOF",art:"JERRY WORLD",pattern:"roof"},
  "lumen field":{icon:"🌲",label:"SPACE NEEDLE & 12s",art:"SEAHAWKS",pattern:"skyline"},
  "us bank stadium":{icon:"⛵",label:"VIKING SHIP ROOFLINE",art:"SKOL",pattern:"glass"},
  "mercedes benz stadium":{icon:"◉",label:"PINWHEEL ROOF",art:"ATLANTA",pattern:"aperture"},
  "raymond james stadium":{icon:"🏴‍☠️",label:"PIRATE SHIP",art:"TAMPA BAY",pattern:"waves"},
  "empower field at mile high":{icon:"⛰",label:"MILE HIGH ROCKIES",art:"DENVER",pattern:"mountains"},
  "lincoln financial field":{icon:"🦅",label:"PHILLY SKYLINE",art:"THE LINC",pattern:"wings"},
  "metlife stadium":{icon:"🗽",label:"NEW YORK LIGHTS",art:"MEADOWLANDS",pattern:"grid"},
  "gillette stadium":{icon:"🏛",label:"LIGHTHOUSE & BRIDGE",art:"FOXBOROUGH",pattern:"columns"},
  "hard rock stadium":{icon:"🌴",label:"MIAMI CANOPY",art:"SOUTH FLORIDA",pattern:"sunset"},
  "lucas oil stadium":{icon:"🏭",label:"BRICK FIELDHOUSE",art:"INDIANAPOLIS",pattern:"brick"},
  "ford field":{icon:"⚙",label:"MOTOR CITY",art:"DETROIT",pattern:"steel"},
  "state farm stadium":{icon:"🌵",label:"DESERT ROLLOUT FIELD",art:"ARIZONA",pattern:"rays"},
  "levi s stadium":{icon:"🌉",label:"BAY AREA TECH",art:"SANTA CLARA",pattern:"grid"},
  "george m steinbrenner field":{icon:"☀",label:"TAMPA PALMS",art:"RAYS",pattern:"sunset"},
  "rogers centre":{icon:"🗼",label:"CN TOWER & DOME",art:"TORONTO",pattern:"roof"},
  "comerica park":{icon:"🐅",label:"TIGERS & FERRIS WHEEL",art:"DETROIT",pattern:"tiger"},
  "target field":{icon:"🌆",label:"MINNEAPOLIS SKYLINE",art:"TWINS",pattern:"skyline"},
  "daikin park":{icon:"🚂",label:"UNION STATION TRAIN",art:"HOUSTON",pattern:"steel"},
  "angel stadium":{icon:"😇",label:"BIG A & HALO",art:"ANAHEIM",pattern:"rays"},
  "t mobile park":{icon:"⚓",label:"RETRACTABLE ROOF & PORT",art:"SEATTLE",pattern:"roof"},
  "globe life field":{icon:"★",label:"TEXAS RETRACTABLE ROOF",art:"ARLINGTON",pattern:"roof"},
  "truist park":{icon:"🪓",label:"THE BATTERY",art:"ATLANTA",pattern:"chevrons"},
  "loandepot park":{icon:"🐠",label:"MIAMI COLORS & GLASS",art:"MIAMI",pattern:"waves"},
  "citi field":{icon:"🍎",label:"HOME RUN APPLE",art:"QUEENS",pattern:"arches"},
  "citizens bank park":{icon:"🔔",label:"LIBERTY BELL",art:"PHILADELPHIA",pattern:"stars"},
  "nationals park":{icon:"🏛",label:"CAPITOL VISTAS",art:"WASHINGTON",pattern:"columns"},
  "great american ball park":{icon:"🚢",label:"OHIO RIVERBOATS",art:"CINCINNATI",pattern:"waves"},
  "busch stadium":{icon:"🌉",label:"GATEWAY ARCH",art:"ST LOUIS",pattern:"arches"},
  "chase field":{icon:"🌵",label:"DESERT DOME & POOL",art:"PHOENIX",pattern:"rays"},
  "coors field":{icon:"⛰",label:"ROCKPILE & MOUNTAINS",art:"DENVER",pattern:"mountains"},
  "petco park":{icon:"🏭",label:"WESTERN METAL BUILDING",art:"SAN DIEGO",pattern:"brick"},
  "td garden":{icon:"☘",label:"BANNERS IN THE GARDEN",art:"BOSTON",pattern:"rafters"},
  "barclays center":{icon:"◯",label:"BROOKLYN OCULUS",art:"BROOKLYN",pattern:"rings"},
  "united center":{icon:"🐂",label:"JORDAN & CHICAGO",art:"MADHOUSE",pattern:"grid"},
  "gainbridge fieldhouse":{icon:"🏀",label:"INDIANA FIELDHOUSE",art:"PACERS",pattern:"windows"},
  "fiserv forum":{icon:"🦌",label:"DEER DISTRICT",art:"MILWAUKEE",pattern:"chevrons"},
  "kaseya center":{icon:"🔥",label:"BISCAYNE BAY",art:"MIAMI HEAT",pattern:"waves"},
  "capital one arena":{icon:"🏛",label:"PENN QUARTER",art:"WASHINGTON",pattern:"columns"},
  "ball arena":{icon:"⛰",label:"ROCKY MOUNTAIN SKYLINE",art:"DENVER",pattern:"mountains"},
  "paycom center":{icon:"⚡",label:"THUNDER ALLEY",art:"OKLAHOMA CITY",pattern:"rays"},
  "moda center":{icon:"🌲",label:"RIP CITY PINWHEEL",art:"PORTLAND",pattern:"rings"},
  "chase center":{icon:"🌉",label:"BAY BRIDGE & THRIVE CITY",art:"SAN FRANCISCO",pattern:"bridge"},
  "intuit dome":{icon:"◉",label:"HALO BOARD",art:"INGLEWOOD",pattern:"rings"},
  "crypto com arena":{icon:"⭐",label:"LOS ANGELES SPOTLIGHT",art:"LA LIVE",pattern:"stars"},
  "golden 1 center":{icon:"👑",label:"DOWNTOWN COMMONS",art:"SACRAMENTO",pattern:"gold"},
  "frost bank center":{icon:"⭐",label:"SPURS SILVER",art:"SAN ANTONIO",pattern:"metal"},
  "camp randall stadium":{icon:"🦡",label:"JUMP AROUND",art:"MADISON",pattern:"stripes"},
  "kinnick stadium":{icon:"👋",label:"THE HOSPITAL WAVE",art:"IOWA CITY",pattern:"windows"},
  "memorial stadium":{icon:"🏟",label:"COLLEGE FOOTBALL TRADITION",art:"MEMORIAL",pattern:"bowl"},
  "darrell k royal texas memorial stadium":{icon:"🤘",label:"BEVO & THE TOWER",art:"TEXAS",pattern:"columns"},
  "ben hill griffin stadium":{icon:"🐊",label:"THE SWAMP",art:"GAINESVILLE",pattern:"waves"},
  "sanford stadium":{icon:"🐶",label:"BETWEEN THE HEDGES",art:"ATHENS",pattern:"ivy"},
  "bryant denny stadium":{icon:"🐘",label:"CRIMSON TIDE",art:"TUSCALOOSA",pattern:"stripes"},
  "jordan hare stadium":{icon:"🦅",label:"WAR EAGLE FLIGHT",art:"AUBURN",pattern:"wings"},
  "kyle field":{icon:"⭐",label:"HOME OF THE 12TH MAN",art:"AGGIELAND",pattern:"stars"},
  "doak campbell stadium":{icon:"🔥",label:"RENEGADE & OSCEOLA",art:"TALLAHASSEE",pattern:"rays"},
  "lane stadium":{icon:"🦃",label:"ENTER SANDMAN",art:"BLACKSBURG",pattern:"chevrons"},
  "rose bowl":{icon:"🌹",label:"SAN GABRIEL MOUNTAINS",art:"PASADENA",pattern:"mountains"},
  "los angeles memorial coliseum":{icon:"🔥",label:"OLYMPIC TORCH",art:"LOS ANGELES",pattern:"columns"},
  "assembly hall":{icon:"🔷",label:"ICONIC HEXAGONAL ROOF",art:"BLOOMINGTON",pattern:"roof"},
  "mackey arena":{icon:"🚂",label:"BOILERMAKER BASKETBALL",art:"WEST LAFAYETTE",pattern:"steel"},
  "phog allen fieldhouse":{icon:"🐦",label:"BEWARE OF THE PHOG",art:"ROCK CHALK",pattern:"rafters"}
};
function passportSportMeta(sport){
  return {NFL:{icon:"🏈",name:"PRO FOOTBALL",shape:"shield"},CFB:{icon:"🏈",name:"COLLEGE FOOTBALL",shape:"goalpost"},MLB:{icon:"⚾",name:"BASEBALL",shape:"round"},NBA:{icon:"🏀",name:"PRO BASKETBALL",shape:"court"},CBB:{icon:"🏀",name:"COLLEGE BASKETBALL",shape:"court"}}[sport]||{icon:"🏟",name:sport,shape:"seal"};
}
function passportHash(text){let h=2166136261;for(const c of String(text||'')){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0;}
function passportMotif(stadium){
  const key=normalizeTeamName(stadium.venue),exact=PASSPORT_MOTIFS[key];if(exact)return exact;
  const team=normalizeTeamName(stadium.team),city=String(stadium.city||'').toUpperCase();
  const sportSets={NFL:["END ZONE LANDMARK","SUNDAY TRADITION","GRIDIRON GATE"],CFB:["CAMPUS TRADITION","SATURDAY LANDMARK","COLLEGE TOWN"],MLB:["BALLPARK LANDMARK","SUMMER TRADITION","DIAMOND GATE"],NBA:["ARENA LANDMARK","CITY HARDWOOD","HOOPS DISTRICT"],CBB:["CAMPUS HARDWOOD","FIELDHOUSE TRADITION","COLLEGE HOOPS"]};
  const symbols=["★","◆","✦","⬟","◈","✪","🏟","◎"],patterns=["stripes","rays","grid","chevrons","rings","stars","skyline","mountains","glass","aperture"];
  const seed=passportHash(`${team}|${key}|${stadium.city}|${stadium.state}`),labels=sportSets[stadium.sport]||["VENUE LANDMARK"];
  return {icon:symbols[seed%symbols.length],label:`${city||stadium.state} ${labels[seed%labels.length]}`,art:String(stadium.team||stadium.venue).toUpperCase(),pattern:patterns[seed%patterns.length]};
}
function passportSpecialBadges(stadium,visit){
  const text=`${visit.gameLabel||''} ${visit.notes||''}`.toLowerCase(),badges=[];
  if(/playoff|postseason|wild card|division series|championship/.test(text))badges.push('🏆 PLAYOFF');
  if(/world series/.test(text))badges.push('⚾ WORLD SERIES');
  if(/super bowl/.test(text))badges.push('★ SUPER BOWL');
  if(/final four/.test(text))badges.push('🏀 FINAL FOUR');
  if(/opening day/.test(text))badges.push('🎆 OPENING DAY');
  if(/christmas/.test(text))badges.push('🎄 CHRISTMAS');
  if(/overtime|\bot\b/.test(text))badges.push('⏱ OVERTIME');
  if(/rain/.test(text))badges.push('🌧 RAIN GAME');
  if(/snow|blizzard|frozen/.test(text))badges.push('❄ SNOW GAME');
  if(/night|primetime|prime time/.test(text))badges.push('🌙 NIGHT GAME');
  if(/july 4|fourth of july|independence day/.test(text))badges.push('🇺🇸 JULY 4');
  return badges.slice(0,3);
}
function passportDateParts(date){if(!date)return {day:'--',month:'UND',year:'ATED'};const d=new Date(`${date}T12:00:00`);return {day:String(d.getDate()).padStart(2,'0'),month:d.toLocaleDateString(undefined,{month:'short'}).toUpperCase(),year:d.getFullYear()};}
function passportVisitNumber(stadiumId,visit){const ordered=[...getVisits(stadiumId)].sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999')||String(a.id).localeCompare(String(b.id)));return Math.max(1,ordered.findIndex(x=>x.id===visit.id)+1);}
function passportStyle(stadium,visit){const seed=passportHash(`${stadium.id}|${visit.id}|${visit.date}|${visit.opponent}`);const tilts=[-1.7,-1.1,-.6,-.2,.25,.7,1.2,1.65],sealTilts=[-13,-9,-6,6,9,12],wear=[.16,.2,.24,.28,.32],ink=[.82,.88,.93,1];return `--stamp-tilt:${tilts[seed%tilts.length]}deg;--seal-tilt:${sealTilts[(seed>>>3)%sealTilts.length]}deg;--paper-wear:${wear[(seed>>>6)%wear.length]};--ink-density:${ink[(seed>>>9)%ink.length]};--stamp-shift:${(seed%9)-4}px`;}
async function passportStampHtml(stadium,visit,index){
  const ticket=(await getPhotos(visitTicketKey(stadium.id,visit.id)))[0],photos=await getPhotos(visitPhotoKey(stadium.id,visit.id));
  const outcome=visitOutcome(visit),meta=passportSportMeta(stadium.sport),motif=passportMotif(stadium),date=passportDateParts(visit.date),logo=findLogo(stadium.sport,visit.teamName||stadium.team),badges=passportSpecialBadges(stadium,visit),visitNo=passportVisitNumber(stadium.id,visit);
  const score=visit.teamScore!==''&&visit.opponentScore!==''?`${escapeHtml(visit.teamScore)}–${escapeHtml(visit.opponentScore)}`:'',serial=passportHash(`${stadium.id}:${visit.id}`).toString(36).toUpperCase().padStart(7,'0').slice(-7);
  return `<article class="passport-stamp sport-${stadium.sport.toLowerCase()} pattern-${motif.pattern}" style="${passportStyle(stadium,visit)}" data-id="${stadium.id}" data-visit-id="${escapeHtml(visit.id)}">
    <div class="passport-paper-texture"></div><div class="passport-watermark">${escapeHtml(motif.art)}</div><div class="passport-cancel-lines" aria-hidden="true"></div>
    <header class="passport-stamp-head"><span class="passport-league-mark">${meta.icon}</span><span>${escapeHtml(meta.name)} PASSPORT</span><b>${serial}</b></header>
    <div class="passport-identity"><span class="passport-logo">${logo?`<img src="${escapeHtml(logo)}" alt="${escapeHtml(stadium.team)} logo">`:`<b>${initials(stadium.team)}</b>`}</span><div><small>${escapeHtml(motif.label)}</small><h3>${escapeHtml(stadium.venue)}</h3><p>${escapeHtml(visit.teamName||stadium.team)}</p></div><span class="passport-motif-icon">${motif.icon}</span></div>
    <div class="passport-matchup"><strong>${escapeHtml(visit.teamName||stadium.team)}</strong><span>${score||'VISITED'}</span><strong>${escapeHtml(visit.opponent||stadium.city)}</strong></div>
    <footer class="passport-stamp-foot"><div class="passport-location">📍 ${escapeHtml(stadium.city)}${stadium.state?`, ${escapeHtml(stadium.state)}`:''}<small>${outcome||'VISIT'}${ticket?' · TICKET SAVED':''}${photos.length?` · ${photos.length} MEDIA ITEM${photos.length===1?'':'S'}`:''}</small><b class="passport-visit-number">VISIT #${visitNo}</b></div><div class="passport-date-seal"><span>${date.month}</span><strong>${date.day}</strong><em>${date.year}</em></div></footer>
    ${badges.length?`<div class="passport-specials">${badges.map(x=>`<span>${escapeHtml(x)}</span>`).join('')}</div>`:''}
  </article>`;
}
async function renderPassport(){
  $("#controls").hidden=true;const rows=allVisitRows().sort((a,b)=>(b.visit.date||'').localeCompare(a.visit.date||'')||String(b.visit.id).localeCompare(String(a.visit.id)));
  const stampHtml=await Promise.all(rows.map(({stadium,visit},index)=>passportStampHtml(stadium,visit,index)));
  const pages=[];for(let i=0;i<stampHtml.length;i+=6)pages.push(`<section class="passport-page"><div class="passport-page-top"><span>UNITED STATES OF STADIUMS</span><b>PAGE ${String(i/6+1).padStart(2,'0')}</b></div><div class="passport-page-grid">${stampHtml.slice(i,i+6).join('')}</div><div class="passport-page-number">${i+1}–${Math.min(i+6,stampHtml.length)} OF ${stampHtml.length} VISITS</div></section>`);
  const uniqueVenues=new Set(rows.map(x=>x.stadium.id)).size;
  $("#content").innerHTML=`<section class="page-intro passport-intro"><span class="eyebrow">Your collection</span><h2>Passport</h2><p>${rows.length} individual visit stamp${rows.length===1?'':'s'} across ${uniqueVenues} unique venue${uniqueVenues===1?'':'s'}. Repeat trips always earn a new, one-of-a-kind stamp.</p></section><div class="passport-book">${pages.join('')||'<div class="empty">Save a game visit to earn your first passport stamp.</div>'}</div>`;
  $("#content").querySelectorAll('.passport-stamp').forEach(x=>x.onclick=()=>openDetail(x.dataset.id,x.dataset.visitId));
}
async function renderPersonalRecords(){
  $("#controls").hidden=true;const rows=allVisitRows().filter(x=>x.visit.teamScore!==''&&x.visit.opponentScore!=='');
  const scored=rows.map(x=>({...x,a:Number(x.visit.teamScore),b:Number(x.visit.opponentScore)})).filter(x=>Number.isFinite(x.a)&&Number.isFinite(x.b));
  const best=(fn,sort)=>{const z=[...scored].sort(sort)[0];return z?fn(z):'Not enough data';};
  const total=scored.length,wins=scored.filter(x=>x.a>x.b).length,losses=scored.filter(x=>x.a<x.b).length,ties=total-wins-losses;
  const counts={};rows.forEach(x=>counts[x.stadium.id]=(counts[x.stadium.id]||0)+1);const mostId=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];const most=mostId?STADIUMS.find(x=>x.id===mostId[0]):null;
  const years={};rows.forEach(x=>{const y=(x.visit.date||'').slice(0,4);if(y)years[y]=(years[y]||0)+1});const bestYear=Object.entries(years).sort((a,b)=>b[1]-a[1])[0];
  const card=(icon,title,value,detail='')=>`<article class="record-card"><span>${icon}</span><small>${title}</small><strong>${escapeHtml(value)}</strong>${detail?`<p>${escapeHtml(detail)}</p>`:''}</article>`;
  const everyVisit=allVisitRows(),teamsSeen=new Set(everyVisit.flatMap(({stadium,visit})=>[visit.teamName||stadium.team,visit.opponent]).filter(Boolean).map(normalizeTeamName)).size,neutralGames=everyVisit.filter(({visit})=>visit.neutralSite).length;
  $("#content").innerHTML=`<section class="page-intro"><span class="eyebrow">Automatically calculated</span><h2>Personal Records</h2><p>Records update every time you save a game.</p></section><div class="record-grid">${card('🏟️','Games attended',String(everyVisit.length))}${card('👥','Teams seen',String(teamsSeen))}${card('📍','Neutral-site games',String(neutralGames))}${card('🏆','Personal record',`${wins}–${losses}${ties?`–${ties}`:''}`)}${card('🔥','Highest-scoring game',best(z=>`${z.a+z.b} points`,(x,y)=>(y.a+y.b)-(x.a+x.b)),best(z=>`${z.stadium.team} vs. ${z.visit.opponent}`,(x,y)=>(y.a+y.b)-(x.a+x.b)))}${card('🧊','Lowest-scoring game',best(z=>`${z.a+z.b} points`,(x,y)=>(x.a+x.b)-(y.a+y.b)),best(z=>`${z.stadium.team} vs. ${z.visit.opponent}`,(x,y)=>(x.a+x.b)-(y.a+y.b)))}${card('💥','Biggest margin',best(z=>`${Math.abs(z.a-z.b)} points`,(x,y)=>Math.abs(y.a-y.b)-Math.abs(x.a-x.b)),best(z=>`${z.stadium.team} vs. ${z.visit.opponent}`,(x,y)=>Math.abs(y.a-y.b)-Math.abs(x.a-x.b)))}${card('🤏','Closest game',best(z=>`${Math.abs(z.a-z.b)}-point margin`,(x,y)=>Math.abs(x.a-x.b)-Math.abs(y.a-y.b)),best(z=>`${z.stadium.team} vs. ${z.visit.opponent}`,(x,y)=>Math.abs(x.a-x.b)-Math.abs(y.a-y.b)))}${card('🔁','Most visited venue',most?most.venue:'Not enough data',mostId?`${mostId[1]} visits`:'')}${card('📅','Busiest year',bestYear?bestYear[0]:'Not enough data',bestYear?`${bestYear[1]} games`:'' )}</div>`;
}
const DOWNLOADED_SCHEDULE_PREFIX = "stadiumPassportDownloadedScheduleV24_2:";
function downloadedScheduleKey(sport,team,season){return DOWNLOADED_SCHEDULE_PREFIX+[sport,normalizeTeamName(team),season].join(":");}
function readDownloadedSchedule(sport,team,season){try{const raw=localStorage.getItem(downloadedScheduleKey(sport,team,season));return raw?JSON.parse(raw):null;}catch{return null;}}
function saveDownloadedSchedule(sport,team,season,games){localStorage.setItem(downloadedScheduleKey(sport,team,season),JSON.stringify({savedAt:new Date().toISOString(),games}));}
function clearDownloadedSchedules(){Object.keys(localStorage).filter(k=>k.startsWith(DOWNLOADED_SCHEDULE_PREFIX)).forEach(k=>localStorage.removeItem(k));}

async function fetchSeasonGames(stadium,season){
  const downloaded=readDownloadedSchedule(stadium.sport,stadium.team,season);
  if(downloaded?.games?.length)return downloaded.games;
  const cfg=scoreApiConfig[stadium.sport],token=await resolveScheduleTeam(stadium.sport,stadium.team);
  const selectedYear=Number(season);
  const apiSeasons=stadium.sport==="CBB"?[selectedYear+1,selectedYear]:[selectedYear];
  const payloads=await Promise.all(apiSeasons.map(async apiSeason=>{
    const url=`https://site.api.espn.com/apis/site/v2/sports/${cfg.category}/${cfg.league}/teams/${encodeURIComponent(token)}/schedule?season=${apiSeason}`;
    try{return await fetchScheduleJson(url);}catch{return {events:[]};}
  }));
  const unique=new Map();
  payloads.flatMap(d=>d.events||[]).forEach(e=>unique.set(e.id||`${e.date}-${e.name}`,e));
  const teamWanted=normalizeTeamName(stadium.team);
  return [...unique.values()].map(e=>{
    const comp=e.competitions?.[0]||{},cs=comp.competitors||[];
    const mine=cs.find(c=>[c.team?.displayName,c.team?.shortDisplayName,c.team?.location,c.team?.name,c.team?.slug].filter(Boolean).map(normalizeTeamName).some(n=>n===teamWanted||n.includes(teamWanted)||teamWanted.includes(n)))||cs[0];
    const other=cs.find(c=>c!==mine)||cs[1];
    const isHome=mine?.homeAway==='home';
    const a=mine?.score?.displayValue??mine?.score??'',b=other?.score?.displayValue??other?.score??'';
    const status=comp?.status?.type?.state||e?.status?.type?.state;
    const date=(e.date||comp.date||'').slice(0,10);
    return {id:e.id,date,opponent:other?.team?.displayName||other?.team?.shortDisplayName||'Opponent',teamName:mine?.team?.displayName||stadium.team,teamScore:a,opponentScore:b,outcome:Number(a)>Number(b)?'WIN':Number(a)<Number(b)?'LOSS':'TIE',label:e.name||e.shortName||'Game',isHome,status};
  }).filter(g=>{
    if(!g.isHome||!g.date)return false;
    if(stadium.sport!=="CBB")return true;
    const d=new Date(`${g.date}T12:00:00`),month=d.getMonth()+1,year=d.getFullYear();
    return (year===selectedYear&&month>=7)||(year===selectedYear+1&&month<=6);
  }).sort((a,b)=>b.date.localeCompare(a.date));
}

const scoreApiConfig = {
  NFL:{category:"football",league:"nfl"},
  CFB:{category:"football",league:"college-football"},
  MLB:{category:"baseball",league:"mlb"},
  CBB:{category:"basketball",league:"mens-college-basketball"},
  NBA:{category:"basketball",league:"nba"}
};
const scheduleTeamCache = {};
const SCHEDULE_CACHE_PREFIX = "stadiumPassportScheduleV22_2:";
function scheduleCacheKey(url){return SCHEDULE_CACHE_PREFIX + btoa(unescape(encodeURIComponent(url))).replace(/=+$/g,"");}
function readScheduleCache(url,maxAgeMs=1000*60*60*24*14){
  try{const raw=localStorage.getItem(scheduleCacheKey(url));if(!raw)return null;const cached=JSON.parse(raw);if(!cached?.savedAt||Date.now()-cached.savedAt>maxAgeMs)return null;return cached.data;}catch{return null;}
}
function writeScheduleCache(url,data){try{localStorage.setItem(scheduleCacheKey(url),JSON.stringify({savedAt:Date.now(),data}));}catch{}}
async function fetchJsonAttempt(url,timeoutMs=12000){
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{const response=await fetch(url,{signal:controller.signal,cache:"no-store",headers:{Accept:"application/json"}});if(!response.ok)throw new Error(`HTTP ${response.status}`);return await response.json();}
  finally{clearTimeout(timer);}
}
async function fetchScheduleJson(url,{allowStale=true}={}){
  const cached=readScheduleCache(url);if(cached)return cached;
  const routes=[url,`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,`https://corsproxy.io/?url=${encodeURIComponent(url)}`];
  let lastError=null;
  for(const route of routes){
    for(let attempt=0;attempt<2;attempt++){
      try{const data=await fetchJsonAttempt(route,attempt?18000:12000);writeScheduleCache(url,data);return data;}
      catch(error){lastError=error;if(attempt===0)await new Promise(resolve=>setTimeout(resolve,650));}
    }
  }
  if(allowStale){
    try{const raw=localStorage.getItem(scheduleCacheKey(url));if(raw)return JSON.parse(raw).data;}catch{}
  }
  const offline=!navigator.onLine;
  throw new Error(offline?"You appear to be offline. Reconnect and tap Retry.":"The schedule provider could not be reached. Tap Retry in a moment.");
}
function collegeEspnTeamId(teamName){
  const logo=directLogoUrl("CBB",teamName)||directLogoUrl("CFB",teamName);
  const match=String(logo||"").match(/\/teamlogos\/ncaa\/500\/(\d+)\.(?:png|svg)(?:\?.*)?$/i);
  return match?match[1]:"";
}
async function resolveScheduleTeam(sport,teamName){
  const key=`${sport}:${normalizeTeamName(teamName)}`;
  if(scheduleTeamCache[key])return scheduleTeamCache[key];
  const cfg=scoreApiConfig[sport];if(!cfg)throw new Error("Scores are not available for this sport.");
  if(sport==="CBB"||sport==="CFB"){
    const collegeId=collegeEspnTeamId(teamName);
    if(collegeId){scheduleTeamCache[key]=collegeId;return collegeId;}
  }
  const direct=directLogoCodes[sport]?.[normalizeTeamName(teamName)];
  if(direct){scheduleTeamCache[key]=direct;return direct;}
  const urls=[
    `https://site.api.espn.com/apis/site/v2/sports/${cfg.category}/${cfg.league}/teams?limit=1000`,
    `https://site.api.espn.com/apis/site/v2/sports/${cfg.category}/${cfg.league}/teams?limit=1000&groups=50`
  ];
  let teams=[];
  for(const url of urls){
    try{
      const data=await fetchScheduleJson(url);
      teams.push(...(data?.sports?.[0]?.leagues?.[0]?.teams?.map(x=>x.team)||data?.teams?.map(x=>x.team||x)||[]));
    }catch{}
  }
  const wanted=normalizeTeamName(teamName);
  const ranked=teams.map(t=>({t,names:[t.displayName,t.shortDisplayName,t.location,t.name,t.nickname,t.slug].filter(Boolean).map(normalizeTeamName)}))
    .map(o=>({...o,score:Math.max(...o.names.map(n=>n===wanted?100:(n.includes(wanted)||wanted.includes(n)?70:0)),0)}))
    .sort((a,b)=>b.score-a.score);
  const hit=ranked[0];if(!hit||!hit.score)throw new Error(`Could not match ${teamName} in the online college basketball schedule.`);
  const token=hit.t.id||hit.t.abbreviation||hit.t.slug;scheduleTeamCache[key]=token;return token;
}
async function fetchScheduleThroughService(sport,team,season){
  const token=await resolveScheduleTeam(sport,team);
  const params=new URLSearchParams({sport,team:token,season:String(season)});
  const serviceUrl=`/.netlify/functions/schedule?${params}`;
  try{
    const response=await fetch(serviceUrl,{cache:"no-store",headers:{Accept:"application/json"}});
    if(!response.ok)throw new Error(`Update service returned ${response.status}`);
    const data=await response.json();
    if(!Array.isArray(data.games))throw new Error("Update service returned invalid data");
    return data.games;
  }catch(serviceError){
    const cfg=scoreApiConfig[sport];
    const apiSeasons=sport==="CBB"?[Number(season)+1,Number(season)]:[Number(season)];
    const payloads=await Promise.all(apiSeasons.map(async apiSeason=>{
      const url=`https://site.api.espn.com/apis/site/v2/sports/${cfg.category}/${cfg.league}/teams/${encodeURIComponent(token)}/schedule?season=${apiSeason}`;
      try{return await fetchScheduleJson(url);}catch{return {events:[]};}
    }));
    return normalizeScheduleEvents(payloads.flatMap(d=>d.events||[]),sport,team,season);
  }
}
function normalizeScheduleEvents(events,sport,teamName,season){
  const unique=new Map();events.forEach(e=>unique.set(e.id||`${e.date}-${e.name}`,e));
  const wanted=normalizeTeamName(teamName),selectedYear=Number(season);
  return [...unique.values()].map(e=>{
    const comp=e.competitions?.[0]||{},cs=comp.competitors||[];
    const mine=cs.find(c=>[c.team?.displayName,c.team?.shortDisplayName,c.team?.location,c.team?.name,c.team?.slug].filter(Boolean).map(normalizeTeamName).some(n=>n===wanted||n.includes(wanted)||wanted.includes(n)))||cs[0];
    const other=cs.find(c=>c!==mine)||cs[1];
    const a=mine?.score?.displayValue??mine?.score??'',b=other?.score?.displayValue??other?.score??'',status=comp?.status?.type?.state||e?.status?.type?.state,date=(e.date||comp.date||'').slice(0,10);
    return {id:e.id,date,opponent:other?.team?.displayName||other?.team?.shortDisplayName||'Opponent',opponentMascot:other?.team?.name||other?.team?.nickname||'',teamName:mine?.team?.displayName||teamName,teamMascot:mine?.team?.name||mine?.team?.nickname||'',teamScore:a,opponentScore:b,outcome:Number(a)>Number(b)?'WIN':Number(a)<Number(b)?'LOSS':'TIE',label:e.name||e.shortName||'Game',isHome:mine?.homeAway==='home',status};
  }).filter(g=>{
    if(!g.isHome||!g.date)return false;
    if(sport!=="CBB")return true;
    const d=new Date(`${g.date}T12:00:00`),m=d.getMonth()+1,y=d.getFullYear();return (y===selectedYear&&m>=7)||(y===selectedYear+1&&m<=6);
  }).sort((a,b)=>b.date.localeCompare(a.date));
}
async function runScheduleUpdate(){
  const sport=$("#scheduleUpdateSport").value,season=$("#scheduleUpdateSeason").value,button=$("#runScheduleUpdate"),progress=$("#scheduleUpdateProgress");
  if(!season){progress.textContent="Enter a season first.";return;}
  const teams=[...new Set(STADIUMS.filter(x=>x.sport===sport).map(x=>x.team))];
  button.disabled=true;let completed=0,failed=0,totalGames=0;progress.textContent=`Starting ${sport} ${season} update for ${teams.length} teams…`;
  const queue=[...teams];
  async function worker(){while(queue.length){const team=queue.shift();try{const games=await fetchScheduleThroughService(sport,team,season);saveDownloadedSchedule(sport,team,season,games);totalGames+=games.length;}catch(e){console.error(team,e);failed++;}completed++;progress.textContent=`Updated ${completed} of ${teams.length} teams · ${totalGames} home games saved${failed?` · ${failed} failed`:''}`;}}
  await Promise.all(Array.from({length:Math.min(5,teams.length)},worker));
  const stamp=new Date().toLocaleString();localStorage.setItem(`stadiumPassportLastScheduleUpdate:${sport}:${season}`,stamp);
  progress.textContent=failed?`Finished with ${failed} team${failed===1?'':'s'} unavailable. ${totalGames} home games were saved. Tap Update again later to retry.`:`Update complete. ${totalGames} home games saved for ${sport} ${season}.`;button.disabled=false;
}
function bindScheduleUpdates(){
  const now=new Date(),button=$("#scheduleUpdateBtn"),dialog=$("#scheduleUpdateDialog"),sport=$("#scheduleUpdateSport"),season=$("#scheduleUpdateSeason");
  const suggested=()=>{const y=now.getFullYear();season.value=(sport.value==="NBA"||sport.value==="CBB")?(now.getMonth()>=6?y:y-1):y;};
  button?.addEventListener('click',()=>{suggested();dialog.showModal();});sport?.addEventListener('change',suggested);
  $("#runScheduleUpdate")?.addEventListener('click',runScheduleUpdate);
  $("#clearScheduleUpdates")?.addEventListener('click',()=>{if(!confirm('Clear downloaded schedules? Your personal visits will not be affected.'))return;clearDownloadedSchedules();$("#scheduleUpdateProgress").textContent='Downloaded schedules cleared.';});
}

function matchupIncludes(event,opponent){
  if(!opponent)return true;
  const wanted=normalizeTeamName(opponent);
  return (event?.competitions?.[0]?.competitors||[]).some(c=>{const t=c.team||{};return [t.displayName,t.shortDisplayName,t.location,t.name,t.nickname,t.slug].filter(Boolean).map(normalizeTeamName).some(n=>n===wanted||n.includes(wanted)||wanted.includes(n));});
}
async function fetchRecentGames(stadium,opponent){
  const cfg=scoreApiConfig[stadium.sport];if(!cfg)throw new Error("Online scores are not available for this sport.");
  const token=await resolveScheduleTeam(stadium.sport,stadium.team);
  const now=new Date(),year=now.getFullYear();
  const seasonCount=stadium.sport==="MLB"?2:4;
  const years=Array.from({length:seasonCount},(_,i)=>year-i);
  const responses=await Promise.all(years.map(async season=>{
    const url=`https://site.api.espn.com/apis/site/v2/sports/${cfg.category}/${cfg.league}/teams/${encodeURIComponent(token)}/schedule?season=${season}`;
    try{const d=await fetchScheduleJson(url);return d.events||[];}catch{return [];}
  }));
  const unique=new Map();responses.flat().forEach(e=>unique.set(e.id||`${e.date}-${e.name}`,e));
  const teamWanted=normalizeTeamName(stadium.team);
  return [...unique.values()].filter(e=>{
    const comp=e?.competitions?.[0],state=comp?.status?.type?.state||e?.status?.type?.state;
    return state==="post"&&matchupIncludes(e,opponent);
  }).map(e=>{
    const comp=e.competitions?.[0]||{},competitors=comp.competitors||[];
    const mine=competitors.find(c=>{const t=c.team||{};return [t.displayName,t.shortDisplayName,t.location,t.name,t.slug].filter(Boolean).map(normalizeTeamName).some(n=>n===teamWanted||n.includes(teamWanted)||teamWanted.includes(n));})||competitors[0];
    const other=competitors.find(c=>c!==mine)||competitors[1];
    const teamScore=mine?.score?.displayValue??mine?.score??"";
    const opponentScore=other?.score?.displayValue??other?.score??"";
    const teamNumber=Number(teamScore),opponentNumber=Number(opponentScore);
    const hasNumericScores=Number.isFinite(teamNumber)&&Number.isFinite(opponentNumber);
    const outcome=hasNumericScores?(teamNumber>opponentNumber?"WIN":teamNumber<opponentNumber?"LOSS":"TIE"):"FINAL";
    const orderedScore=hasNumericScores?`${Math.max(teamNumber,opponentNumber)}–${Math.min(teamNumber,opponentNumber)}`:`${teamScore}–${opponentScore}`;
    return {id:e.id,date:(e.date||comp.date||"").slice(0,10),opponent:other?.team?.displayName||other?.team?.shortDisplayName||"Opponent",opponentMascot:other?.team?.name||other?.team?.nickname||other?.team?.shortDisplayName||other?.team?.displayName||"Opponent",teamScore,opponentScore,outcome,orderedScore,teamName:mine?.team?.displayName||mine?.team?.shortDisplayName||stadium.team,teamMascot:mine?.team?.name||mine?.team?.nickname||mine?.team?.shortDisplayName||mine?.team?.displayName||stadium.team,label:e.name||e.shortName||"Game"};
  }).filter(g=>g.date).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,30);
}
function recentGameRow(game){
  const outcomeClass=String(game.outcome||"final").toLowerCase();
  return `<button type="button" class="recent-game-option" data-game-id="${escapeHtml(game.id)}"><span class="recent-game-copy"><strong>${escapeHtml(formatDate(game.date))}</strong><small>${escapeHtml(game.teamName)} ${escapeHtml(game.teamScore)} · ${escapeHtml(game.opponent)} ${escapeHtml(game.opponentScore)}</small></span><span class="recent-game-result"><em class="game-outcome ${outcomeClass}">${escapeHtml(game.outcome||"FINAL")}</em><b>${escapeHtml(game.orderedScore||`${game.teamScore}–${game.opponentScore}`)}</b></span></button>`;
}

async function openDetail(id,selectedVisitId=""){
  const x=STADIUMS.find(r=>r.id===id);let visits=getVisits(id);let activeId=selectedVisitId||visits[0]?.id||"";
  async function draw(){
    visits=getVisits(id);let visit=visits.find(v=>v.id===activeId);
    const isNew=!visit;if(isNew)visit={...emptyVisit(),id:newVisitId()};
    let photos=await getPhotos(visitPhotoKey(id,visit.id));if(!photos.length&&visit.id==='legacy')photos=await getPhotos(id);
    let ticketScans=await getPhotos(visitTicketKey(id,visit.id));
    const history=visits.length?`<div class="visit-history"><div class="visit-history-heading"><h3>Visit history</h3><button type="button" id="addVisit" class="secondary">+ Add another visit</button></div>${[...visits].sort((a,b)=>(b.date||'').localeCompare(a.date||'')).map(v=>`<button type="button" class="visit-history-item ${v.id===visit.id?'active':''}" data-visit-id="${escapeHtml(v.id)}"><strong>${formatDate(v.date)}</strong><span>${v.opponent?`vs ${escapeHtml(v.opponent)}`:'Opponent not entered'}</span></button>`).join('')}</div>`:`<div class="visit-history empty-history"><p>No visits saved yet.</p></div>`;
    const gallery=()=>photos.length?photos.map((p,i)=>`<figure class="gallery-item">${mediaElement(p,`${x.team} visit media ${i+1}`,'gallery-media')}<figcaption><button type="button" class="remove-photo danger-outline" data-index="${i}">Remove</button></figcaption></figure>`).join(''):'<div class="photo-empty">No photos or videos yet</div>';
    const currentCard=(visit.date||visit.opponent||visit.teamScore!==''||visit.opponentScore!=='')?gameCardHtml(x,visit):'<div class="game-card-empty">Choose a season and game to create the game card.</div>';
    const now=new Date(),year=now.getFullYear();
    const latestSeasonStart=x.sport==='CBB'?(now.getMonth()>=6?year:year-1):year;
    const seasonYears=Array.from({length:2100-2013+1},(_,i)=>2100-i);
    const seasonOptions=seasonYears.map(y=>{const label=x.sport==='CBB'?`${y}–${String(y+1).slice(-2)}`:String(y);return `<option value="${y}" ${String(visit.season||'')===String(y)?'selected':''}>${label}</option>`;}).join('');
    const venueOptions=STADIUMS.slice().sort((a,b)=>a.venue.localeCompare(b.venue)||a.city.localeCompare(b.city)).map(v=>`<option value="${escapeHtml(v.id)}" ${(visit.venueId||id)===v.id?'selected':''}>${escapeHtml(v.venue)} — ${escapeHtml(v.city)}${v.state?`, ${escapeHtml(v.state)}`:''}</option>`).join('');
    const eventTypes=['Preseason','Regular Season','Wild Card','Divisional Round','Conference Championship','Playoffs','Championship','Super Bowl','Bowl Game','College Football Playoff','Conference Tournament','NCAA Tournament','Play-In Tournament','All-Star Game','Exhibition','International','Other'];
    const eventTypeOptions=eventTypes.map(t=>`<option value="${t}" ${(visit.eventType||'Regular Season')===t?'selected':''}>${t}</option>`).join('');
    $("#detailContent").innerHTML=`<div class="detail-title stadium-profile"><span class="eyebrow" style="color:#2563eb">${x.sport} · ${escapeHtml(x.conference)}${x.division?` · ${escapeHtml(x.division)}`:''}</span><h2>${escapeHtml(x.venue)}</h2><p>📍 ${escapeHtml(x.city)}${x.state?`, ${escapeHtml(x.state)}`:''}<br>Home of the ${escapeHtml(x.team)} · ${visits.length} saved visit${visits.length===1?'':'s'}</p></div>${history}<div class="visit-editor"><h3>${isNew?'Add a visit':'Edit visit'}</h3><div id="gameCardPreview">${currentCard}</div><section class="event-location-panel"><div class="event-location-heading"><div><h3>Game location</h3><p>Use neutral site when the team played somewhere other than its home venue.</p></div><label class="neutral-switch"><input id="neutralSite" type="checkbox" ${visit.neutralSite?'checked':''}><span>Neutral site</span></label></div><div class="form-grid game-basics-grid"><label>Game league<select id="gameSport">${gameSportOptions(inferGameSport(visit,x.sport))}</select></label><label>Event type<select id="eventType">${eventTypeOptions}</select></label><label>Event name<input id="eventName" value="${escapeHtml(visit.eventName||'')}" placeholder="e.g. Peach Bowl or Game 7"></label><label>Date<input id="visitDate" type="date" value="${visit.date||''}"></label><label id="neutralVenueLabel" class="full" ${visit.neutralSite?'':'hidden'}>Actual venue<select id="neutralVenue">${venueOptions}</select></label></div><p id="neutralVenueHelp" class="small" ${visit.neutralSite?'':'hidden'}>This visit will count for the selected stadium, not this team’s home stadium.</p><div class="matchup-editor ${visit.neutralSite?'neutral-active':''}" id="matchupEditor"><div class="matchup-column"><span class="matchup-label">Away team</span><label>Team<input id="opponent" value="${escapeHtml(visit.opponent||'')}" placeholder="Away team"></label><label>Mascot<input id="opponentMascot" value="${escapeHtml(visit.opponentMascot||'')}" placeholder="e.g. Bulldogs"></label><label>Final score<input id="opponentScore" type="number" min="0" inputmode="numeric" value="${escapeHtml(visit.opponentScore||'')}"></label></div><div class="matchup-vs">VS</div><div class="matchup-column"><span class="matchup-label">Home / listed team</span><label>Team<input id="teamName" value="${escapeHtml(visit.teamName||x.team)}" placeholder="Home team"></label><label>Mascot<input id="teamMascot" value="${escapeHtml(visit.teamMascot||'')}" placeholder="e.g. Wildcats"></label><label>Final score<input id="teamScore" type="number" min="0" inputmode="numeric" value="${escapeHtml(visit.teamScore||'')}"></label></div></div></section><div class="season-picker-panel"><label>Season<select id="seasonSelect"><option value="">Choose a season</option>${seasonOptions}</select></label><button type="button" id="loadSeasonGames">Load games</button><div id="seasonGamesResults" class="recent-games-results full"></div></div><section class="ticket-scan-section"><div class="ticket-scan-heading"><div><h3>Ticket scan</h3><p>Attach a photo or screenshot of the ticket for this visit.</p></div><label class="file-button ticket-button">🎟 Choose ticket image<input id="ticketInput" type="file" accept="image/*" hidden></label></div><div id="ticketPreview" class="ticket-preview"></div></section><div class="photo-gallery" id="photoGallery">${gallery()}</div><div class="photo-actions"><label class="file-button">Choose photos or videos from library<input id="photoInput" type="file" accept="image/*,video/*" multiple hidden></label><span class="small">Photos and videos belong to this specific visit. Large videos may use significant phone storage.</span></div><div class="form-grid"><label>Section<input id="section" value="${escapeHtml(visit.section||'')}"></label><label>Row<input id="row" value="${escapeHtml(visit.row||'')}"></label><label>Seat<input id="seat" value="${escapeHtml(visit.seat||'')}"></label><label class="full">Favorite memory<textarea id="memory">${escapeHtml(visit.memory||'')}</textarea></label><label class="full">Notes<textarea id="notes">${escapeHtml(visit.notes||'')}</textarea></label></div><div class="visit-actions"><button type="button" id="saveDetail" class="save">Save visit</button>${!isNew?'<button type="button" id="deleteVisit" class="danger-outline">Delete this visit</button>':''}</div></div><p class="small">Photos, videos, and personal details stay on this device unless you export a backup.</p>`;
    const detailDialog=$("#detailDialog");
    if(!detailDialog.open)detailDialog.showModal();
    $("#detailContent").querySelectorAll('.visit-history-item').forEach(b=>b.onclick=()=>{activeId=b.dataset.visitId;draw();});
    const add=$("#addVisit");if(add)add.onclick=()=>{activeId='';draw();};
    const wireGallery=()=>{$("#photoGallery").innerHTML=gallery();$("#photoGallery").querySelectorAll('.remove-photo').forEach(b=>b.onclick=async()=>{photos.splice(Number(b.dataset.index),1);await putPhotos(visitPhotoKey(id,visit.id),photos);wireGallery();});};wireGallery();
    $("#photoInput").onchange=async ev=>{const files=[...ev.target.files];if(!files.length)return;try{for(const f of files){if(f.type.startsWith('video/')){if(f.size>100*1024*1024){alert(`${f.name} is larger than 100 MB and was not added.`);continue;}photos.push(await readFileAsDataURL(f));}else if(f.type.startsWith('image/')){photos.push(await resizeImage(f,1200,.82));}}await putPhotos(visitPhotoKey(id,visit.id),photos);wireGallery();}catch(err){console.error(err);alert('One or more files could not be added.');}finally{ev.target.value='';}};
    const wireTicket=()=>{const box=$("#ticketPreview");box.innerHTML=ticketScans.length?`<div class="ticket-scan-card"><img src="${ticketScans[0]}" alt="Ticket scan for ${escapeHtml(x.team)}"><button type="button" id="removeTicket" class="danger-outline">Remove ticket scan</button></div>`:'<div class="ticket-empty">No ticket scan attached</div>';const remove=$("#removeTicket");if(remove)remove.onclick=async()=>{ticketScans=[];await putPhotos(visitTicketKey(id,visit.id),ticketScans);wireTicket();};};wireTicket();
    $("#ticketInput").onchange=async ev=>{const f=ev.target.files[0];if(!f)return;ticketScans=[await resizeImage(f,1600,.86)];await putPhotos(visitTicketKey(id,visit.id),ticketScans);wireTicket();ev.target.value='';};

    const updateCard=()=>{const temp={...visit,gameSport:$("#gameSport").value,date:$("#visitDate").value,opponent:$("#opponent").value,opponentMascot:$("#opponentMascot").value,teamScore:$("#teamScore").value,opponentScore:$("#opponentScore").value,teamName:$("#teamName").value.trim()||x.team,teamMascot:$("#teamMascot").value,eventName:$("#eventName").value,eventType:$("#eventType").value,neutralSite:$("#neutralSite").checked};$("#gameCardPreview").innerHTML=gameCardHtml(x,temp);};
    ["gameSport","visitDate","opponent","opponentMascot","teamScore","opponentScore","teamName","teamMascot","eventName","eventType"].forEach(k=>$("#"+k)?.addEventListener('input',updateCard));
    const neutralToggle=$("#neutralSite"),neutralVenueLabel=$("#neutralVenueLabel"),neutralVenueHelp=$("#neutralVenueHelp"),matchupEditor=$("#matchupEditor");
    neutralToggle.onchange=()=>{neutralVenueLabel.hidden=!neutralToggle.checked;neutralVenueHelp.hidden=!neutralToggle.checked;matchupEditor.classList.toggle('neutral-active',neutralToggle.checked);updateCard();};
    const loadSeason=$("#loadSeasonGames");loadSeason.onclick=async()=>{const season=$("#seasonSelect").value,results=$("#seasonGamesResults");if(!season){results.innerHTML='<p class="recent-games-empty">Choose a season first.</p>';return;}loadSeason.disabled=true;loadSeason.textContent='Loading…';try{const games=await fetchSeasonGames(x,season);if(!games.length){results.innerHTML='<p class="recent-games-empty">No home games were found for that season.</p>';return;}results.innerHTML=games.map(g=>`<button type="button" class="recent-game-option" data-game-id="${escapeHtml(g.id)}"><span class="recent-game-copy"><strong>${escapeHtml(formatDate(g.date))}</strong><small>${escapeHtml(x.team)} vs. ${escapeHtml(g.opponent)}</small></span><span class="recent-game-result"><em class="game-outcome ${g.status==='post'?g.outcome.toLowerCase():'final'}">${g.status==='post'?g.outcome:'SCHEDULED'}</em><b>${g.teamScore!==''?`${escapeHtml(g.teamScore)}–${escapeHtml(g.opponentScore)}`:''}</b></span></button>`).join('');results.querySelectorAll('[data-game-id]').forEach(btn=>btn.onclick=()=>{const g=games.find(z=>z.id===btn.dataset.gameId);visit.season=season;visit.gameSport=$("#gameSport").value;visit.gameId=g.id;visit.gameLabel=g.label;visit.teamName=g.teamName;visit.teamMascot=g.teamMascot||visit.teamMascot||"";visit.opponentMascot=g.opponentMascot||visit.opponentMascot||"";visit.outcome=g.outcome;$("#visitDate").value=g.date;$("#opponent").value=g.opponent;$("#opponentMascot").value=g.opponentMascot||"";$("#teamMascot").value=g.teamMascot||"";$("#teamScore").value=g.teamScore;$("#opponentScore").value=g.opponentScore;$("#teamScoreLabel").textContent=`${g.teamName} score`;$("#opponentScoreLabel").textContent=`${g.opponent} score`;updateCard();results.querySelectorAll('.recent-game-option').forEach(y=>y.classList.remove('selected'));btn.classList.add('selected');});}catch(e){results.innerHTML=`<div class="schedule-load-error"><p class="recent-games-empty">${escapeHtml(e.message)}</p><button type="button" class="schedule-retry">Retry</button></div>`;results.querySelector('.schedule-retry')?.addEventListener('click',()=>loadSeason.click());}finally{loadSeason.disabled=false;loadSeason.textContent='Load home games';}};
    $("#saveDetail").onclick=async()=>{const neutralSite=$("#neutralSite").checked,targetId=neutralSite?$("#neutralVenue").value:id;const saved={id:visit.id,gameSport:$("#gameSport").value,date:$("#visitDate").value,season:$("#seasonSelect").value||visit.season||"",opponent:$("#opponent").value,opponentMascot:$("#opponentMascot").value,teamName:$("#teamName").value.trim()||visit.teamName||x.team,teamMascot:$("#teamMascot").value,teamScore:$("#teamScore").value,opponentScore:$("#opponentScore").value,outcome:visit.outcome||visitOutcome({teamScore:$("#teamScore").value,opponentScore:$("#opponentScore").value}),gameId:visit.gameId||"",gameLabel:visit.gameLabel||"",eventName:$("#eventName").value,eventType:$("#eventType").value||"Regular Season",neutralSite,venueId:targetId,section:$("#section").value,row:$("#row").value,seat:$("#seat").value,memory:$("#memory").value,notes:$("#notes").value};
      const sourceNext=getVisits(id).filter(v=>v.id!==saved.id);state[id]={visits:sourceNext};
      const targetVisits=targetId===id?sourceNext:getVisits(targetId).filter(v=>v.id!==saved.id);targetVisits.push(saved);state[targetId]={visits:targetVisits};
      if(targetId!==id){const oldPhotos=await getPhotos(visitPhotoKey(id,visit.id)),oldTickets=await getPhotos(visitTicketKey(id,visit.id));if(oldPhotos.length){await putPhotos(visitPhotoKey(targetId,visit.id),oldPhotos);await putPhotos(visitPhotoKey(id,visit.id),[]);}if(oldTickets.length){await putPhotos(visitTicketKey(targetId,visit.id),oldTickets);await putPhotos(visitTicketKey(id,visit.id),[]);}}
      saveState();$("#detailDialog").close();render();};
    const del=$("#deleteVisit");if(del)del.onclick=async()=>{if(!confirm('Delete this visit?'))return;state[id]={visits:visits.filter(v=>v.id!==visit.id)};saveState();await putPhotos(visitPhotoKey(id,visit.id),[]);await putPhotos(visitTicketKey(id,visit.id),[]);$("#detailDialog").close();render();};
  }
  await draw();
}
function escapeHtml(s){return String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function resizeImage(file,max,quality){return new Promise((resolve,reject)=>{const img=new Image(),url=URL.createObjectURL(file);img.onload=()=>{let w=img.width,h=img.height;if(Math.max(w,h)>max){const r=max/Math.max(w,h);w*=r;h*=r}const c=document.createElement('canvas');c.width=Math.round(w);c.height=Math.round(h);c.getContext('2d').drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(url);resolve(c.toDataURL('image/jpeg',quality))};img.onerror=reject;img.src=url;});}

$("#search").oninput=renderContent; $("#statusFilter").onchange=renderContent;
$("#backupBtn").onclick=()=>$("#backupDialog").showModal();
const syncButton=$("#syncBtn");if(syncButton)syncButton.onclick=()=>$("#syncDialog").showModal();
$("#exportBtn").onclick=async()=>{const payload={version:3,exported:new Date().toISOString(),state,teamEdits,photos:await allPhotos()};const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(payload)],{type:'application/json'}));a.download='stadium-passport-backup.json';a.click();URL.revokeObjectURL(a.href);};
$("#importFile").onchange=async ev=>{const file=ev.target.files[0];if(!file)return;try{const data=JSON.parse(await file.text());Object.keys(state).forEach(k=>delete state[k]);Object.assign(state,data.state||{});Object.keys(teamEdits).forEach(k=>delete teamEdits[k]);Object.assign(teamEdits,data.teamEdits||{});saveTeamEdits();saveState();for(const [id,p] of Object.entries(data.photos||{}))await putPhotos(id,Array.isArray(p)?p:[p]);alert('Backup imported.');$("#backupDialog").close();render();}catch(e){alert('That backup file could not be imported.');}};
$("#resetBtn").onclick=async()=>{if(!confirm('Delete all visits, notes, and photos?'))return;localStorage.removeItem('stadiumPassportState');Object.keys(state).forEach(k=>delete state[k]);const db=await dbPromise;db.close();indexedDB.deleteDatabase('stadiumPassportPhotos');location.reload();};
bindMobileNav();
bindAddVisitDialog();
bindScheduleUpdates();
render();
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredInstallPrompt=event;const button=$("#installBtn");if(button)button.hidden=false;});
const installButton=$("#installBtn");if(installButton)installButton.addEventListener('click',async()=>{if(!deferredInstallPrompt)return;deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;installButton.hidden=true;});
window.addEventListener('appinstalled',()=>{deferredInstallPrompt=null;if(installButton)installButton.hidden=true;});
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(console.error));
