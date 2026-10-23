/* Stadium Passport — Overview banner logo slideshow (v36)
   Shows every tracked team's logo in random order, 2 seconds each, with a soft team-color tint. */
(function(){
  let timer=null;
  function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  function tint(hex,alpha){const h=String(hex||'').replace('#','');if(!/^[0-9a-f]{6}$/i.test(h))return '';const n=parseInt(h,16);return `rgba(${n>>16&255},${n>>8&255},${n&255},${alpha})`;}
  window.startLogoShow=function(el){
    clearInterval(timer);timer=null;
    if(!el||typeof STADIUMS==='undefined'||typeof findLogo!=='function')return;
    const tracked=typeof isTrackedVenue==='function'?isTrackedVenue:(x=>x.sport!=='NBA');
    const seen=new Set();
    const teams=shuffle(STADIUMS.filter(tracked).map(x=>({name:x.team,sport:x.sport,logo:findLogo(x.sport,x.team)}))
      .filter(t=>t.logo&&!seen.has(t.logo)&&seen.add(t.logo)));
    if(!teams.length)return;
    const imgs=[...el.querySelectorAll('.ls-img')],caption=el.querySelector('.ls-caption');
    let i=-1,front=0,fails=0;
    function show(){
      if(!el.isConnected){clearInterval(timer);timer=null;return;}
      if(document.hidden)return;
      i=(i+1)%teams.length;const t=teams[i],img=imgs[front^1];
      img.onload=()=>{
        fails=0;imgs[front].classList.remove('on');img.classList.add('on');front^=1;
        if(caption)caption.textContent=t.name;
        const c=typeof window.teamColorFor==='function'?window.teamColorFor(t.sport,t.name):'';
        el.style.setProperty('--ls-tint',tint(c,.22)||'rgba(174,183,196,.35)');
        el.classList.add('ls-ready');
        const next=teams[(i+1)%teams.length];if(next){const pre=new Image();pre.src=next.logo;}
      };
      img.onerror=()=>{if(++fails<15)show();else{clearInterval(timer);timer=null;}};
      img.src=t.logo;
    }
    show();timer=setInterval(show,2000);
  };
})();
