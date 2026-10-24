/* Stadium Passport — Passport book (v38)
   Home: cover, tallies, league chapters, recently stamped, almost unlocked.
   League: one passport page per division/conference. Visited stadiums show their own stamp style
   (chosen per stadium, never repeated on a page); locked stadiums and generic stamps (bonus stamps,
   division seals) use the league's shape: NFL shield, CFB pennant, MLB diamond, CBB hexagon. */
(function(){
  const LEAGUES={NFL:{name:'NFL',full:'National Football League',color:'#1e3a8a',shape:'shield'},
    CFB:{name:'College Football',full:'College Football',color:'#b45309',shape:'pennant'},
    MLB:{name:'MLB',full:'Major League Baseball',color:'#b91c1c',shape:'diamond'},
    CBB:{name:'College Hoops',full:"Men's College Basketball",color:'#0f766e',shape:'hexagon'}};
  const ORDER=['NFL','CFB','MLB','CBB'];
  const TIERS=[{min:10,key:'legend',label:'Legend'},{min:5,key:'gold',label:'Gold'},{min:3,key:'silver',label:'Silver'},{min:1,key:'bronze',label:'Bronze'}];
  const BASE_STYLES=['classic','postmark','visa','postage','wax','skyline','ticket','scoreboard'];
  const LEAGUE_STYLES={NFL:['pigskin'],CFB:['pennantStamp','pigskin'],MLB:['diamondStamp'],CBB:['hardwood','pennantStamp']};
  const view={league:null};
  const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const MON=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

  function hash(str){let h=2166136261;for(const c of String(str))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
  function lum(hex){const h=String(hex||'').replace('#','');if(!/^[0-9a-f]{6}$/i.test(h))return 1;const c=[0,2,4].map(i=>{const v=parseInt(h.slice(i,i+2),16)/255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);});return .2126*c[0]+.7152*c[1]+.0722*c[2];}
  function inkFor(x){const c=typeof window.teamColorFor==='function'?window.teamColorFor(x.sport,x.team):'';return c&&lum(c)<0.3?c:LEAGUES[x.sport]?.color||'#1f2937';}
  function fit(str,maxW,fs){const est=String(str).length*fs*0.55;return est>maxW?` textLength="${maxW}" lengthAdjust="spacingAndGlyphs"`:'';}
  function T(x,y,str,fs,ink,opts={}){const{w=120,weight=400,ls=1,anchor='middle'}=opts;return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Oswald, Impact, 'Arial Narrow', sans-serif" font-size="${fs}" font-weight="${weight}" fill="${ink}" letter-spacing="${ls}"${fit(str,w,fs+ls*0.6)}>${e(str)}</text>`;}
  const visitsOf=x=>(typeof getVisits==='function'?getVisits(x.id):[]).filter(Boolean);
  const byDate=(a,b)=>(a.date||'9999').localeCompare(b.date||'9999');
  function tierFor(n){return TIERS.find(t=>n>=t.min)||null;}
  function nextTier(n){return [...TIERS].reverse().find(t=>t.min>n)||null;}
  function dparts(d){if(!d)return {md:'—',y:''};const [y,m,dd]=d.split('-');return {md:`${MON[Number(m)-1]||''} ${Number(dd)||''}`.trim(),y};}

  /* ---------- League (generic) shapes ---------- */
  const SHAPE={
    shield:{outer:'M80 8L144 26V78C144 118 116 142 80 152C44 142 16 118 16 78V26Z',inner:'M80 20L132 35V78C132 110 108 130 80 139C52 130 28 110 28 78V35Z'},
    pennant:{outer:'M10 32H150L122 80L150 128H10Z',inner:'M22 44H128L106 80L128 116H22Z'},
    diamond:{outer:'M80 8l72 72-72 72L8 80z',inner:'M80 26l54 54-54 54-54-54z'},
    hexagon:{outer:'M80 8l62 36v72l-62 36-62-36V44z',inner:'M80 22l50 29v58l-50 29-50-29V51z'}
  };
  function genericStamp(shape,ink,top,big,small,{locked=false,faded=false}={}){
    const s=SHAPE[shape];const cx=shape==='pennant'?70:80;
    if(locked)return `<svg viewBox="0 0 160 160" class="sp-svg" aria-hidden="true"><path d="${s.outer}" fill="rgba(20,32,56,.04)" stroke="#9aa3ae" stroke-width="2.5" stroke-dasharray="6 6"/></svg>`;
    return `<svg viewBox="0 0 160 160" class="sp-svg" aria-hidden="true" style="opacity:${faded?.45:1}"><g fill="none" stroke="${ink}"><path d="${s.outer}" stroke-width="4"/><path d="${s.inner}" stroke-width="1.6"/></g>${top?T(cx,shape==='diamond'?66:60,top,11,ink,{w:shape==='diamond'?70:96,ls:1.5}):''}${T(cx,shape==='diamond'?88:86,big,20,ink,{w:shape==='diamond'?80:100,weight:700,ls:.5})}${small?T(cx,shape==='diamond'?104:104,small,10,ink,{w:shape==='diamond'?64:96,ls:1.2}):''}</svg>`;
  }

  /* ---------- Venue stamp styles ---------- */
  function venueStamp(style,d){
    const k=d.ink,V=d.venue,C=d.city,md=d.md,y=d.y,id=d.uid;
    switch(style){
      case 'classic': return `<svg viewBox="0 0 160 160" class="sp-svg" aria-hidden="true"><defs><path id="${id}" d="M80 80m-58 0a58 58 0 1 1 116 0a58 58 0 1 1-116 0"/></defs><g fill="none" stroke="${k}"><circle cx="80" cy="80" r="74" stroke-width="3.5"/><circle cx="80" cy="80" r="68" stroke-width="1.2"/><circle cx="80" cy="80" r="44" stroke-width="2"/></g><text font-family="Oswald, Impact, sans-serif" font-size="12" fill="${k}" letter-spacing="2"><textPath href="#${id}" textLength="350" lengthAdjust="spacingAndGlyphs">${e(V)} ★ ${e(C)} ★</textPath></text>${T(80,78,md,21,k,{w:76,weight:700,ls:.5})}${T(80,97,y,13,k,{ls:2})}</svg>`;
      case 'postmark': return `<svg viewBox="0 0 160 160" class="sp-svg" aria-hidden="true"><g fill="none" stroke="${k}" stroke-width="2.6"><circle cx="58" cy="80" r="50"/><circle cx="58" cy="80" r="44" stroke-width="1"/><path d="M98 60c9-7 16 7 25 0s16 7 25 0 8 4 10 2"/><path d="M104 74c9-7 16 7 25 0s16 7 25 0"/><path d="M106 88c9-7 16 7 25 0s16 7 25 0"/><path d="M104 102c9-7 16 7 25 0s16 7 25 0"/></g>${T(58,62,C,9,k,{w:72,ls:1})}${T(58,86,md,18,k,{w:74,weight:700})}${T(58,103,y,11,k,{ls:2})}${T(58,124,V,8,k,{w:70,ls:1})}</svg>`;
      case 'visa': return `<svg viewBox="0 0 160 160" class="sp-svg" aria-hidden="true"><g fill="none" stroke="${k}"><rect x="6" y="26" width="148" height="108" rx="10" stroke-width="3.2"/><rect x="13" y="33" width="134" height="94" rx="6" stroke-width="1.2"/><path d="M13 60H147" stroke-width="1.2"/><rect x="100" y="72" width="40" height="34" stroke-width="1.6"/></g>${T(80,53,'ADMITTED',18,k,{weight:700,ls:3,w:120})}${T(20,80,'PORT · '+V,9,k,{anchor:'start',w:76})}${T(20,96,C,9,k,{anchor:'start',w:76})}${T(20,112,d.extra||'WELCOME',9,k,{anchor:'start',w:76})}${T(120,88,md,11,k,{weight:700,w:36})}${T(120,101,y,9,k)}</svg>`;
      case 'postage': {let dots='';for(let i=0;i<8;i++){const p=14+i*19;dots+=`<circle cx="10" cy="${p}" r="4.5"/><circle cx="150" cy="${p}" r="4.5"/><circle cx="${p}" cy="10" r="4.5"/><circle cx="${p}" cy="150" r="4.5"/>`;}
        return `<svg viewBox="0 0 160 160" class="sp-svg" aria-hidden="true"><rect x="10" y="10" width="140" height="140" fill="${k}"/><g fill="var(--sp-paper,#eef1ec)">${dots}</g><rect x="22" y="22" width="116" height="116" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="1.5"/><g fill="none" stroke="rgba(255,255,255,.9)" stroke-width="2"><path d="M36 100c10-24 26-36 44-36s34 12 44 36"/><path d="M32 104h96"/><path d="M48 104v-10M64 104v-16M80 104v-20M96 104v-16M112 104v-10"/></g>${T(80,126,V,11,'#fff',{w:104,weight:700,ls:1})}${T(126,42,md,11,'#fff',{anchor:'end',weight:700,w:60})}${T(34,42,y,10,'#fff',{anchor:'start'})}</svg>`;}
      case 'wax': return `<svg viewBox="0 0 160 160" class="sp-svg" aria-hidden="true"><path d="M80 12c14 0 20 8 32 10 14 3 24 12 26 26 2 10 10 18 8 32s-10 18-12 30c-3 14-14 22-28 24-10 2-16 12-28 12s-18-10-30-12c-14-3-22-12-26-26-2-10-12-18-10-30s10-20 12-32c3-14 14-22 28-24 12-2 14-10 28-10z" fill="${k}"/><path d="M118 128c4 6 2 14 6 20" stroke="${k}" stroke-width="7" stroke-linecap="round" fill="none"/><circle cx="80" cy="80" r="44" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="3"/><circle cx="80" cy="80" r="38" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="1"/>${T(80,74,md,17,'rgba(255,255,255,.95)',{weight:700,w:70})}${T(80,92,y,11,'rgba(255,255,255,.9)',{ls:2})}${T(80,110,V,8,'rgba(255,255,255,.85)',{w:62,ls:1})}</svg>`;
      case 'skyline': return `<svg viewBox="0 0 160 160" class="sp-svg" aria-hidden="true"><g fill="none" stroke="${k}"><rect x="6" y="20" width="148" height="120" rx="60" stroke-width="3.2"/><path d="M26 104c12-32 32-46 54-46s42 14 54 46" stroke-width="2.2"/><path d="M20 108h120" stroke-width="2.2"/><path d="M38 108V94M54 108V82M70 108V76M90 108V76M106 108V82M122 108V94" stroke-width="1.6"/><path d="M40 52v-10M120 52v-10M34 42h12M114 42h12" stroke-width="2"/></g>${T(80,127,V,12,k,{w:110,weight:700,ls:1.5})}${T(80,50,`${md} · ${y}`,10,k,{w:60,ls:1})}</svg>`;
      case 'ticket': return `<svg viewBox="0 0 160 160" class="sp-svg" aria-hidden="true"><g fill="none" stroke="${k}"><path d="M6 38H60A11 11 0 0 0 82 38H154V122H82A11 11 0 0 0 60 122H6Z" stroke-width="3"/><path d="M71 50V110" stroke-width="1.5" stroke-dasharray="3 4"/></g>${T(38,70,'ADMIT',10,k,{ls:1.5})}${T(38,88,'ONE',17,k,{weight:700})}${T(38,106,`${md}`,9,k,{w:52})}${T(114,64,d.seat?'SEC · ROW · SEAT':y,8,k,{w:72,ls:1})}${T(114,86,d.seat||md,d.seat?15:17,k,{w:74,weight:700})}${T(114,106,V,8,k,{w:72,ls:1})}</svg>`;
      case 'scoreboard': return `<svg viewBox="0 0 160 160" class="sp-svg" aria-hidden="true"><rect x="6" y="30" width="148" height="100" rx="8" fill="#111827"/><rect x="12" y="36" width="136" height="88" rx="4" fill="none" stroke="#fbbf24" stroke-width="1.2" stroke-dasharray="2 3"/>${T(80,54,d.score?'FINAL':md+' '+y,10,'#fbbf24',{ls:3,w:110})}${d.score?`${T(24,82,d.awayAbbr,14,'#fde68a',{anchor:'start',ls:2,w:60})}${T(136,82,d.awayScore,19,'#fbbf24',{anchor:'end',weight:700})}${T(24,110,d.homeAbbr,14,'#fde68a',{anchor:'start',ls:2,w:60})}${T(136,110,d.homeScore,19,'#fbbf24',{anchor:'end',weight:700})}`:`${T(80,92,V,13,'#fde68a',{w:120,weight:700})}`}</svg>`;
      case 'pigskin': return `<svg viewBox="0 0 160 160" class="sp-svg" aria-hidden="true"><g fill="none" stroke="${k}"><path d="M6 80C34 26 126 26 154 80C126 134 34 134 6 80Z" stroke-width="3.5"/><path d="M18 80C44 38 116 38 142 80C116 122 44 122 18 80Z" stroke-width="1.3"/><path d="M54 80H106" stroke-width="2.4"/><path d="M62 73v14M71 73v14M80 73v14M89 73v14M98 73v14" stroke-width="2"/></g>${T(80,60,V,11,k,{w:96,ls:1.5})}${T(80,108,`${md} · ${y}`,13,k,{w:90,weight:700})}</svg>`;
      case 'pennantStamp': return `<svg viewBox="0 0 160 160" class="sp-svg" aria-hidden="true"><g fill="none" stroke="${k}"><path d="M10 34L154 80L10 126Z" stroke-width="3.2"/><path d="M20 47L122 80L20 113Z" stroke-width="1.2"/><path d="M10 28v104" stroke-width="5" stroke-linecap="round"/></g>${T(56,76,V,10,k,{w:62,ls:1})}${T(56,92,`${md} ’${String(y).slice(2)}`,11,k,{w:56,weight:700})}</svg>`;
      case 'diamondStamp': return `<svg viewBox="0 0 160 160" class="sp-svg" aria-hidden="true"><g fill="none" stroke="${k}"><path d="M80 8l72 72-72 72L8 80z" stroke-width="3.5"/><path d="M80 34l46 46-46 46-46-46z" stroke-width="1.4" stroke-dasharray="4 4"/></g><g fill="${k}"><rect x="74" y="28" width="12" height="12" transform="rotate(45 80 34)"/><rect x="120" y="74" width="12" height="12" transform="rotate(45 126 80)"/><rect x="28" y="74" width="12" height="12" transform="rotate(45 34 80)"/><path d="M74 120h12v6l-6 6-6-6z"/></g>${T(80,72,V,10,k,{w:64,ls:1})}${T(80,92,md,17,k,{w:60,weight:700})}${T(80,106,y,10,k)}</svg>`;
      case 'hardwood': return `<svg viewBox="0 0 160 160" class="sp-svg" aria-hidden="true"><g fill="none" stroke="${k}"><path d="M80 6l64 37v74l-64 37-64-37V43z" stroke-width="3.5"/><path d="M80 20l52 30v60l-52 30-52-30V50z" stroke-width="1.3"/><path d="M62 120V98h36v22" stroke-width="2"/><circle cx="80" cy="98" r="12" stroke-width="2"/><path d="M36 84h88" stroke-width="1.3"/></g>${T(80,52,V,10,k,{w:90,ls:1.5})}${T(80,72,`${md} · ${y}`,13,k,{w:90,weight:700})}</svg>`;
    }
    return '';
  }
  function styleFor(x,indexOnPage,pageSeed){
    const pool=[...BASE_STYLES,...(LEAGUE_STYLES[x.sport]||[])];
    return pool[(pageSeed+indexOnPage)%pool.length];
  }
  function stampData(x){
    const vs=visitsOf(x).slice().sort(byDate),first=vs[0]||{},dp=dparts(first.date);
    const has=first.teamScore!==''&&first.teamScore!=null&&first.opponentScore!==''&&first.opponentScore!=null;
    const abbr=n=>{const w=String(n||'').replace(/[^A-Za-z ]/g,'').split(/\s+/).filter(Boolean);return (w.length>1?w.slice(-1)[0]:w[0]||'').slice(0,4).toUpperCase();};
    const seat=[first.section,first.row,first.seat].filter(v=>String(v||'').trim()).join('·');
    return {ink:inkFor(x),venue:String(x.venue||'').toUpperCase(),city:[x.city,x.state].filter(Boolean).join(', ').toUpperCase(),md:dp.md,y:dp.y,
      uid:`sp-${String(x.id).replace(/[^A-Za-z0-9_-]/g,'')}`,score:has,awayAbbr:abbr(first.opponentMascot||first.opponent),homeAbbr:abbr(first.teamMascot||first.teamName||x.team),
      awayScore:String(first.opponentScore??''),homeScore:String(first.teamScore??''),seat:seat||'',extra:has?`FINAL ${first.opponentScore}–${first.teamScore}`:'WELCOME',
      count:vs.length,first,last:vs[vs.length-1]};
  }

  /* ---------- Grouping ---------- */
  function pageName(x){
    if(x.sport==='NFL')return `${x.conference} ${x.division}`.trim();
    if(x.sport==='MLB')return `${x.conference==='American League'?'AL':x.conference==='National League'?'NL':x.conference} ${x.division}`.trim();
    return x.conference||'Independent';
  }
  function pagesFor(sport){
    const rows=STADIUMS.filter(x=>x.sport===sport&&(typeof isCountedVenue!=='function'||isCountedVenue(x)));const map=new Map();
    rows.forEach(x=>{const n=pageName(x);if(!map.has(n))map.set(n,[]);map.get(n).push(x);});
    const pages=[...map.entries()].map(([name,list])=>({name,list:list.sort((a,b)=>a.team.localeCompare(b.team))}));
    if(sport==='NFL'||sport==='MLB')return pages;
    return pages.sort((a,b)=>a.name.localeCompare(b.name));
  }
  const isVisited=x=>visitsOf(x).length>0;

  /* ---------- Bonus stamps (generic, league-shaped) ---------- */
  function thanksgiving(y){const d=new Date(y,10,1);const off=(4-d.getDay()+7)%7;return `${y}-11-${String(1+off+21).padStart(2,'0')}`;}
  function allVisits(){const out=[];STADIUMS.forEach(x=>visitsOf(x).forEach(v=>out.push({x,v})));return out.sort((a,b)=>byDate(a.v,b.v));}
  function bonusStamps(){
    const all=allVisits();const sportOf=it=>typeof inferGameSport==='function'?inferGameSport(it.v,it.x.sport):it.x.sport;
    const regular=['','Regular Season','Preseason','Exhibition','All-Star Game','International','Other'];
    const defs=[
      {key:'post',label:'Postseason',big:'PLAYOFFS',how:'Any playoff, bowl, Super Bowl or tournament game',test:it=>!regular.includes(it.v.eventType||'')},
      {key:'neutral',label:'Neutral Site',big:'NEUTRAL',how:'A game away from both teams’ homes',test:it=>!!it.v.neutralSite},
      {key:'holiday',label:'Holiday Game',big:'HOLIDAY',how:'July 4th, Thanksgiving, Christmas or New Year’s',test:it=>{const d=it.v.date||'';const md=d.slice(5);return md==='07-04'||md==='12-25'||md==='01-01'||(d&&d===thanksgiving(Number(d.slice(0,4))));}},
      {key:'shutout',label:'Shutout',big:'SHUTOUT',how:'One team didn’t score',test:it=>it.v.teamScore!==''&&it.v.opponentScore!==''&&it.v.teamScore!=null&&it.v.opponentScore!=null&&(String(it.v.teamScore)==='0'||String(it.v.opponentScore)==='0')},
    ];
    const out=defs.map(d=>{const hits=all.filter(d.test);const h=hits[0];return {...d,earned:hits.length,date:h?.v.date||'',sport:h?sportOf(h):null,venue:h?.x.venue||''};});
    const byDay={};all.forEach(it=>{if(it.v.date)(byDay[it.v.date]=byDay[it.v.date]||[]).push(it);});
    const dh=Object.entries(byDay).find(([,l])=>l.length>1);
    out.push({key:'double',label:'Doubleheader',big:'2 IN 1',how:'Two games logged on the same day',earned:dh?1:0,date:dh?.[0]||'',sport:dh?sportOf(dh[1][0]):null,venue:'DOUBLEHEADER'});
    let trip=null;const dated=all.filter(it=>it.v.date);
    for(let i=0;i<dated.length&&!trip;i++){const start=new Date(dated[i].v.date+'T12:00:00');const ids=new Set();let lastIt=null;for(let j=i;j<dated.length;j++){const t=new Date(dated[j].v.date+'T12:00:00');if((t-start)/86400000>7)break;ids.add(dated[j].x.id);lastIt=dated[j];if(ids.size>=3){trip=lastIt;break;}}}
    out.push({key:'road',label:'Road Trip',big:'ROAD TRIP',venue:'3 IN 7 DAYS',how:'Three different stadiums within 7 days',earned:trip?1:0,date:trip?.v.date||'',sport:trip?sportOf(trip):null});
    return out;
  }

  /* ---------- Rendering ---------- */
  const lockIcon='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>';
  function rot(x){return ((hash(x.id+'r')%17)-8);}
  function slotHtml(x,i,seed){
    if(!isVisited(x))return `<button type="button" class="sp-slot locked" data-sp-open="${e(x.id)}" aria-label="${e(x.team)}, ${e(x.venue)}, locked"><span class="sp-stamp">${genericStamp(LEAGUES[x.sport].shape,'',0,0,0,{locked:true})}<span class="sp-lock">${lockIcon}</span></span><strong>${e(x.team)}</strong><small>${e(x.venue)}</small></button>`;
    const d=stampData(x),tier=tierFor(d.count),style=styleFor(x,i,seed);
    return `<button type="button" class="sp-slot" data-sp-open="${e(x.id)}" aria-label="${e(x.team)} stamp, ${e(tier.label)}"><span class="sp-stamp" style="transform:rotate(${rot(x)}deg)">${venueStamp(style,d)}${tier.key!=='bronze'?`<span class="sp-tier ${tier.key}" title="${tier.label}">${tier.key==='legend'?'★':tier.label[0]}</span>`:''}</span><strong>${e(x.team)}</strong><small>${tier.label} · ${d.count} visit${d.count===1?'':'s'}</small></button>`;
  }
  function sealHtml(page,sport){
    const done=page.list.filter(isVisited).length,total=page.list.length,complete=done===total;
    return `<div class="sp-seal-row"><svg viewBox="0 0 100 100" class="sp-seal ${complete?'on':''}" aria-hidden="true"><g fill="none" stroke="#b7922c" stroke-width="2"><circle cx="50" cy="50" r="44" stroke-dasharray="3 4"/><circle cx="50" cy="50" r="34"/></g><path d="M50 30l5.5 11.5 12.5 1.8-9 8.8 2.1 12.4L50 58.6 38.9 64.5 41 52.1l-9-8.8 12.5-1.8z" fill="${complete?'#d6b656':'none'}" stroke="#b7922c" stroke-width="2"/></svg><div><strong>${e(page.name)} ${sport==='NFL'||sport==='MLB'?'Division':'Conference'} Seal</strong><span>${complete?'Pressed! Every stadium on this page is stamped.':`Stamp every stadium on this page to press the gold seal · ${done} of ${total}`}</span><div class="sp-bar"><i style="width:${Math.round(done/total*100)}%;background:#b7922c"></i></div></div></div>`;
  }
  function retiredList(sport){return STADIUMS.filter(x=>x.sport===sport&&typeof venueStatus==='function'&&venueStatus(x)==='former'&&isVisited(x));}
  function retiredHtml(sport){const list=retiredList(sport);if(!list.length)return '';
    return `<section class="sp-page" id="sp-page-retired"><header><span>RETIRED VENUES</span><small>${list.length} STAMP${list.length===1?'':'S'} · CAN’T BE EARNED AGAIN</small></header><div class="sp-grid">${list.map((x,i)=>{const d=stampData(x),style=styleFor(x,i,hash(x.id)%11);const y=typeof venueYear==='function'?venueYear(x):'';return `<button type="button" class="sp-slot" data-sp-open="${e(x.id)}" aria-label="${e(x.venue)} retired stamp"><span class="sp-stamp sp-retired" style="transform:rotate(${rot(x)}deg)">${venueStamp(style,{...d,uid:'spx-'+hash(x.id)})}<i>RETIRED</i></span><strong>${e(x.venue)}</strong><small>${e(x.team)}${y?` · closed ${e(y)}`:''}</small></button>`;}).join('')}</div></section>`;}
  function renderLeague(root,sport){
    const L=LEAGUES[sport],pages=pagesFor(sport),rows=pages.flatMap(p=>p.list),done=rows.filter(isVisited).length;
    const bonus=bonusStamps();
    root.innerHTML=`<div class="sp-book sp-league">
      <div class="sp-league-head"><button type="button" class="sp-back" id="spBack" aria-label="Back to passport"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg></button><div><strong>${e(L.name)}</strong><span>${done} of ${rows.length} stamped · ${pages.length} pages</span></div><div class="sp-mini-bar"><i style="width:${Math.max(3,Math.round(done/rows.length*100))}%"></i></div></div>
      <div class="sp-tabs" role="tablist">${pages.map((p,i)=>`<button type="button" class="${i?'':'on'}" data-sp-page="${i}">${e(p.name)}</button>`).join('')}${retiredList(sport).length?'<button type="button" data-sp-page="retired">Retired</button>':''}<button type="button" data-sp-page="bonus">Bonus</button></div>
      ${pages.map((p,pi)=>{const seed=hash(sport+p.name)%11;const d=p.list.filter(isVisited).length;return `<section class="sp-page" id="sp-page-${pi}"><header><span>${e(p.name.toUpperCase())}</span><small>PAGE ${String(pi+1).padStart(2,'0')} · ${d} / ${p.list.length} STAMPED</small></header><div class="sp-grid">${p.list.map((x,i)=>slotHtml(x,i,seed)).join('')}</div>${sealHtml(p,sport)}<footer><span>${e(sport)} · ${done} / ${rows.length}</span><span>— ${String(pi+1).padStart(2,'0')} —</span></footer></section>`;}).join('')}
      ${retiredHtml(sport)}
      <section class="sp-page" id="sp-page-bonus"><header><span>BONUS STAMPS</span><small>EARNED ACROSS ALL LEAGUES</small></header><div class="sp-grid">${bonus.map(b=>{const sp=b.sport&&LEAGUES[b.sport]?b.sport:sport;const ink=LEAGUES[sp].color;const dp=dparts(b.date);return b.earned?`<div class="sp-slot"><span class="sp-stamp" style="transform:rotate(${(hash(b.key)%13)-6}deg)">${genericStamp(LEAGUES[sp].shape,ink,(b.venue||b.label).toUpperCase(),b.big,dp.md?`${dp.md} ${dp.y}`:'')}</span><strong>${e(b.label)}</strong><small>${b.earned>1?`Earned ${b.earned} times`:'Earned'}</small></div>`:`<div class="sp-slot locked"><span class="sp-stamp">${genericStamp(LEAGUES[sport].shape,'',0,0,0,{locked:true})}<span class="sp-lock">${lockIcon}</span></span><strong>${e(b.label)}</strong><small>${e(b.how)}</small></div>`;}).join('')}</div></section>
    </div>`;
    root.querySelector('#spBack').onclick=()=>{view.league=null;window.renderPassportBook(root);window.scrollTo({top:0});};
    root.querySelectorAll('[data-sp-page]').forEach(b=>b.onclick=()=>{root.querySelectorAll('[data-sp-page]').forEach(t=>t.classList.toggle('on',t===b));document.getElementById(`sp-page-${b.dataset.spPage}`)?.scrollIntoView({behavior:'smooth',block:'start'});});
    wireOpen(root);
  }
  function wireOpen(root){root.querySelectorAll('[data-sp-open]').forEach(b=>b.onclick=()=>{if(typeof openDetail==='function')openDetail(b.dataset.spOpen);});}

  function renderHome(root){
    const tracked=STADIUMS.filter(x=>ORDER.includes(x.sport)&&(typeof isCountedVenue!=='function'||isCountedVenue(x)));
    const visitedAll=STADIUMS.filter(x=>ORDER.includes(x.sport)&&isVisited(x));
    const visited=tracked.filter(isVisited);const bonus=bonusStamps();
    const seals=ORDER.flatMap(s=>pagesFor(s)).filter(p=>p.list.every(isVisited)).length;
    const badges=bonus.filter(b=>b.earned).length+seals;
    const recent=visitedAll.map(x=>({x,last:visitsOf(x).slice().sort(byDate).pop()})).sort((a,b)=>(b.last?.date||'').localeCompare(a.last?.date||'')).slice(0,3);
    const leaguesStamped=ORDER.filter(s=>tracked.some(x=>x.sport===s&&isVisited(x))).length;
    const almost=[];
    if(leaguesStamped<4)almost.push({t:'Grand Slam',s:`Stamp a venue in every league · ${leaguesStamped} of 4`,p:leaguesStamped/4,c:'#b7922c'});
    const pageProg=ORDER.flatMap(s=>pagesFor(s).map(p=>({s,p,d:p.list.filter(isVisited).length}))).filter(o=>o.d>0&&o.d<o.p.list.length).sort((a,b)=>b.d/b.p.list.length-a.d/a.p.list.length)[0];
    if(pageProg)almost.push({t:`${pageProg.p.name} Seal`,s:`Stamp every ${pageProg.p.name} stadium · ${pageProg.d} of ${pageProg.p.list.length}`,p:pageProg.d/pageProg.p.list.length,c:'#b7922c'});
    const up=visited.map(x=>({x,n:visitsOf(x).length})).map(o=>({...o,nt:nextTier(o.n)})).filter(o=>o.nt).sort((a,b)=>(b.n/b.nt.min)-(a.n/a.nt.min))[0];
    if(up)almost.push({t:`${up.nt.label} at ${up.x.venue}`,s:`Visit ${up.nt.min} times to upgrade the stamp · ${up.n} of ${up.nt.min}`,p:up.n/up.nt.min,c:up.nt.key==='silver'?'#8a94a3':'#b7922c'});
    const nb=bonus.find(b=>!b.earned);if(nb&&almost.length<3)almost.push({t:nb.label,s:nb.how,p:0,c:'#b7922c'});
    root.innerHTML=`<div class="sp-book sp-home">
      <div class="sp-cover"><svg width="88" height="88" viewBox="0 0 96 96" fill="none" stroke="#d6b656" stroke-width="2" aria-hidden="true"><circle cx="48" cy="48" r="44"/><circle cx="48" cy="48" r="38" stroke-dasharray="2 4"/><path d="M22 58c6-14 16-22 26-22s20 8 26 22"/><path d="M18 62h60"/><path d="M30 62v-8M40 62v-12M48 62v-14M56 62v-12M66 62v-8"/><path d="M48 18l3 7h7l-6 4 2 7-6-4-6 4 2-7-6-4h7z" fill="#d6b656" stroke="none"/></svg><span class="sp-kicker">UNITED STATES OF SPORT</span><h2>STADIUM PASSPORT</h2><div class="sp-holder"><span>HOLDER · TRAVIS</span><span>NO. SP-${String(visited.length).padStart(4,'0')}</span></div></div>
      <div class="sp-tally"><div><b>${visitedAll.length}</b><span>Stamps</span></div><div><b>${badges}</b><span>Badges</span></div><div><b class="dim">${tracked.length-visited.length}</b><span>Still locked</span></div></div>
      <h3 class="sp-h">CHAPTERS</h3>
      <div class="sp-chapters">${ORDER.map(s=>{const rows=tracked.filter(x=>x.sport===s),d=rows.filter(isVisited).length;return `<button type="button" class="sp-chapter" data-sp-league="${s}" style="--c:${LEAGUES[s].color}"><b>${e(LEAGUES[s].name)}</b><span>${d} of ${rows.length} stamped</span><div class="sp-bar"><i style="width:${rows.length?Math.round(d/rows.length*100):0}%;background:${LEAGUES[s].color}"></i></div></button>`;}).join('')}</div>
      ${recent.length?`<h3 class="sp-h">RECENTLY STAMPED</h3><div class="sp-recent">${recent.map(({x})=>{const pages=pagesFor(x.sport),p=pages.find(pg=>pg.list.includes(x)),i=p?p.list.indexOf(x):0,seed=hash(x.sport+(p?.name||''))%11;return `<button type="button" class="sp-recent-item" data-sp-open="${e(x.id)}" aria-label="${e(x.venue)} stamp"><span class="sp-stamp" style="transform:rotate(${rot(x)}deg)">${venueStamp(styleFor(x,i,seed),{...stampData(x),uid:`spr-${hash(x.id)}`})}</span></button>`;}).join('')}</div>`:''}
      ${almost.length?`<h3 class="sp-h">ALMOST UNLOCKED</h3><div class="sp-almost">${almost.slice(0,3).map(a=>`<div class="sp-almost-item"><span class="sp-lock-ring">${lockIcon}</span><div><strong>${e(a.t)}</strong><span>${e(a.s)}</span><div class="sp-bar"><i style="width:${Math.round(a.p*100)}%;background:${a.c}"></i></div></div></div>`).join('')}</div>`:''}
    </div>`;
    root.querySelectorAll('[data-sp-league]').forEach(b=>b.onclick=()=>{view.league=b.dataset.spLeague;window.renderPassportBook(root);window.scrollTo({top:0});});
    wireOpen(root);
  }
  window.renderPassportBook=function(root){
    if(!root)return;document.body.classList.add('passport-book-mode');
    if(view.league&&LEAGUES[view.league])renderLeague(root,view.league);else renderHome(root);
  };
  window.openPassportLeague=function(sport){view.league=LEAGUES[sport]?sport:null;activeSport='PASSPORT';render();window.scrollTo({top:0});};
  window.leavePassportBook=function(){document.body.classList.remove('passport-book-mode');};
})();
