/* SportsPassport photo gallery v4: lower close button + reliable zoom controls. */
(function () {
  'use strict';
  const DETAIL = '#detailDialog';
  function moveGalleryToTop(){const c=document.querySelector('#detailContent');if(!c)return;const g=c.querySelector('#photoGallery');if(!g)return;const h=c.querySelector('.visit-history');const t=c.querySelector('.detail-title');const a=h||t;if(a&&a.parentNode){const n=a.nextElementSibling;if(n!==g)a.parentNode.insertBefore(g,n||null)}g.classList.add('sp-gallery-top')}
  function addStyles(){if(document.getElementById('spPhotoGalleryV4Styles'))return;const s=document.createElement('style');s.id='spPhotoGalleryV4Styles';s.textContent=`
#detailContent .sp-gallery-top{margin:14px 0 22px}
#detailContent #photoGallery .gallery-media{cursor:zoom-in;touch-action:manipulation}
#detailDialog .sp-photo-viewer-v2{position:fixed;inset:0;z-index:99999;width:100vw;height:100vh;margin:0;border:0;padding:0;background:rgba(0,0,0,.97);display:flex;align-items:center;justify-content:center;overflow:hidden;touch-action:none}
#detailDialog .sp-photo-viewer-v2[hidden]{display:none!important}
#detailDialog .sp-photo-stage-v2{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:118px 12px 28px;box-sizing:border-box;touch-action:none;overflow:hidden}
#detailDialog .sp-photo-stage-v2 img,#detailDialog .sp-photo-stage-v2 video{display:block;max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;border-radius:8px;user-select:none;-webkit-user-drag:none;transform-origin:center center;will-change:transform;touch-action:none}
#detailDialog .sp-photo-viewer-v2 .sp-photo-close-v2,#detailDialog .sp-photo-viewer-v2 .sp-photo-prev-v2,#detailDialog .sp-photo-viewer-v2 .sp-photo-next-v2,#detailDialog .sp-photo-viewer-v2 .sp-photo-zoom-v2{position:absolute;z-index:20;width:54px;height:54px;border:0;border-radius:50%;background:rgba(255,255,255,.25);color:#fff;display:flex;align-items:center;justify-content:center;padding:0;line-height:1;font-family:system-ui,sans-serif;-webkit-appearance:none;appearance:none;touch-action:manipulation;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.35)}
#detailDialog .sp-photo-close-v2{top:92px;right:14px;font-size:36px}
#detailDialog .sp-photo-prev-v2{left:10px;top:50%;transform:translateY(-50%);font-size:38px}
#detailDialog .sp-photo-next-v2{right:10px;top:50%;transform:translateY(-50%);font-size:38px}
#detailDialog .sp-photo-zoom-v2{left:14px;top:92px;font-size:25px;font-weight:800}
#detailDialog .sp-photo-counter-v2{position:absolute;z-index:20;top:99px;left:50%;transform:translateX(-50%);color:#fff;background:rgba(0,0,0,.55);border-radius:999px;padding:7px 12px;font:700 13px/1 system-ui,sans-serif;pointer-events:none}
@media(max-width:640px){#detailDialog .sp-photo-stage-v2{padding:132px 6px 24px}#detailDialog .sp-photo-close-v2{top:112px;right:12px}#detailDialog .sp-photo-zoom-v2{top:112px;left:12px}#detailDialog .sp-photo-counter-v2{top:119px}#detailDialog .sp-photo-prev-v2{left:5px}#detailDialog .sp-photo-next-v2{right:5px}}
` ;document.head.appendChild(s)}
  function ensureViewer(){const d=document.querySelector(DETAIL);if(!d)return null;let v=d.querySelector('#spPhotoViewerV2');if(v)return v;v=document.createElement('div');v.id='spPhotoViewerV2';v.className='sp-photo-viewer-v2';v.hidden=true;v.setAttribute('aria-hidden','true');v.innerHTML='<button type="button" class="sp-photo-close-v2" aria-label="Close photos">×</button><button type="button" class="sp-photo-zoom-v2" aria-label="Zoom photo">＋</button><button type="button" class="sp-photo-prev-v2" aria-label="Previous photo">‹</button><div class="sp-photo-counter-v2" aria-live="polite"></div><div class="sp-photo-stage-v2"></div><button type="button" class="sp-photo-next-v2" aria-label="Next photo">›</button>';d.appendChild(v);return v}
  function install(){addStyles();const d=document.querySelector(DETAIL);if(!d||d.dataset.spGalleryV4Installed==='1')return;d.dataset.spGalleryV4Installed='1';const v=ensureViewer();if(!v)return;const st=v.querySelector('.sp-photo-stage-v2'),cl=v.querySelector('.sp-photo-close-v2'),pr=v.querySelector('.sp-photo-prev-v2'),nx=v.querySelector('.sp-photo-next-v2'),zm=v.querySelector('.sp-photo-zoom-v2'),ct=v.querySelector('.sp-photo-counter-v2');let items=[],index=0,startX=null,zoom=1,lastTap=0,pinchStart=0;
    function currentItems(){const g=d.querySelector('#detailContent #photoGallery');return g?[...g.querySelectorAll('.gallery-media')]:[]}
    function applyZoom(){const m=st.firstElementChild;if(m){m.style.transform=`scale(${zoom})`;m.style.maxWidth=zoom>1?'none':'';m.style.maxHeight=zoom>1?'none':'';m.style.cursor=zoom>1?'zoom-out':'zoom-in'}zm.textContent=zoom>1?'−':'＋';zm.setAttribute('aria-label',zoom>1?'Zoom out':'Zoom in')}
    function setZoom(z){zoom=Math.min(4,Math.max(1,z));applyZoom()}
    function show(i){if(!items.length)return;index=(i+items.length)%items.length;zoom=1;const src=items[index];st.replaceChildren();const isVideo=src.tagName.toLowerCase()==='video';const m=document.createElement(isVideo?'video':'img');m.src=src.currentSrc||src.src||src.getAttribute('src')||'';m.alt=src.alt||'Visit photo';m.draggable=false;if(isVideo){m.controls=true;m.playsInline=true;m.setAttribute('playsinline','')}st.appendChild(m);ct.textContent=`${index+1} / ${items.length}`;pr.hidden=items.length<2;nx.hidden=items.length<2;applyZoom()}
    function open(src){items=currentItems();if(!items.length)return;const f=items.indexOf(src);index=f>=0?f:0;v.hidden=false;v.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';show(index)}
    function closeViewer(){v.hidden=true;v.setAttribute('aria-hidden','true');st.replaceChildren();document.body.style.overflow='';startX=null;zoom=1}
    d.addEventListener('pointerup',e=>{if(v.hidden){const m=e.target.closest?.('#detailContent #photoGallery .gallery-media');if(m){e.preventDefault();e.stopPropagation();open(m)} }},true);
    d.addEventListener('click',e=>{if(v.hidden){const m=e.target.closest?.('#detailContent #photoGallery .gallery-media');if(m){e.preventDefault();e.stopPropagation();open(m)}}},true);
    cl.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();closeViewer()},true);cl.addEventListener('pointerup',e=>{e.preventDefault();e.stopPropagation();closeViewer()},true);
    zm.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();setZoom(zoom>1?1:2.25)},true);
    pr.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();show(index-1)},true);nx.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();show(index+1)},true);
    st.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;if(e.pointerType==='touch')startX=e.clientX},{passive:true});
    st.addEventListener('pointerup',e=>{if(e.pointerType==='touch'&&startX!=null&&items.length>1&&zoom===1){const dx=e.clientX-startX;startX=null;if(Math.abs(dx)>=40){e.preventDefault();show(index+(dx<0?1:-1))}}else startX=null},{passive:false});
    st.addEventListener('dblclick',e=>{if(e.target===st.firstElementChild){e.preventDefault();setZoom(zoom>1?1:2.25)}},true);
    st.addEventListener('wheel',e=>{e.preventDefault();setZoom(zoom+(e.deltaY<0?.25:-.25))},{passive:false});
    let pinch=false;
    st.addEventListener('touchstart',e=>{if(e.touches.length===2){pinch=true;pinchStart=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY)}},{passive:true});
    st.addEventListener('touchmove',e=>{if(!pinch||e.touches.length!==2)return;const dist=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);if(pinchStart>0)setZoom(zoom*(dist/pinchStart));pinchStart=dist;e.preventDefault()},{passive:false});
    st.addEventListener('touchend',e=>{if(e.touches.length<2)pinch=false},{passive:true});
    v.addEventListener('pointerup',e=>{if(e.target===v)closeViewer()},true);
    document.addEventListener('keydown',e=>{if(v.hidden)return;if(e.key==='Escape'){e.preventDefault();closeViewer()}if(e.key==='ArrowLeft'){e.preventDefault();show(index-1)}if(e.key==='ArrowRight'){e.preventDefault();show(index+1)}if(e.key==='+'||e.key==='='){e.preventDefault();setZoom(zoom+.25)}if(e.key==='-'){e.preventDefault();setZoom(zoom-.25)}});
    new MutationObserver(moveGalleryToTop).observe(d.querySelector('#detailContent')||d,{childList:true,subtree:true});moveGalleryToTop();
  }
  function boot(){addStyles();install();moveGalleryToTop();if(!document.querySelector(DETAIL)?.dataset.spGalleryV4Installed){setTimeout(install,250);setTimeout(install,1000)}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();