/* Stadium Passport — shrink large videos before saving (v45)
   Big phone videos (4K/HD) can be hundreds of MB. Instead of refusing them, the app offers to
   re-record a smaller copy (about 720p) right on the phone. It plays the video once in the
   background, so it takes about as long as the video itself. */
(function(){
  const fmtMB=b=>`${(b/1048576).toFixed(b<10485760?1:0)} MB`;
  const canShrink=()=>typeof MediaRecorder!=='undefined'&&typeof HTMLCanvasElement!=='undefined'&&!!HTMLCanvasElement.prototype.captureStream;
  function pickMime(){const list=['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/mp4;codecs=avc1','video/mp4','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'];return list.find(m=>{try{return MediaRecorder.isTypeSupported(m);}catch{return false;}})||'';}
  function host(){const d=document.querySelector('dialog[open] .dialog-shell')||document.querySelector('dialog[open]');return d||document.body;}

  window.shrinkVideoFlow=function(file,{limit,allowOriginal=false}={}){
    return new Promise(resolve=>{
      const supported=canShrink();
      const box=document.createElement('div');box.className='vs-overlay';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-label','Shrink video');
      box.innerHTML=`<div class="vs-card">
        <strong class="vs-title">This video is ${fmtMB(file.size)}</strong>
        <p class="vs-text">${supported?`${allowOriginal?'That’s large for phone storage and backups':`That’s too big to save as is${limit?` (limit ${fmtMB(limit)})`:''}`}. The app can make a smaller copy (about 720p) so it fits and backs up easily. Keep the app open while it works — it takes about as long as the video.`:`That’s too big to save as is, and this browser can’t shrink videos. Try trimming it in the Photos app first, or record at 1080p instead of 4K.`}</p>
        <div class="vs-progress" hidden><span class="vs-bar"><i></i></span><small class="vs-status">Getting ready…</small></div>
        <div class="vs-actions">${supported?'<button type="button" class="vs-go">Shrink &amp; add</button>':''}${allowOriginal?'<button type="button" class="vs-orig">Add original</button>':''}<button type="button" class="vs-cancel">${supported||allowOriginal?'Cancel':'OK'}</button></div>
      </div>`;
      host().appendChild(box);
      const done=v=>{box.remove();resolve(v);};
      let cancelled=false,stopper=null;
      box.querySelector('.vs-cancel').onclick=()=>{cancelled=true;try{stopper?.();}catch{}done(null);};
      const orig=box.querySelector('.vs-orig');if(orig)orig.onclick=()=>done(file);
      const go=box.querySelector('.vs-go');if(!go)return;
      go.onclick=()=>{
        go.disabled=true;if(orig)orig.hidden=true;box.querySelector('.vs-progress').hidden=false;
        const bar=box.querySelector('.vs-bar i'),status=box.querySelector('.vs-status');
        const url=URL.createObjectURL(file);
        const v=document.createElement('video');v.playsInline=true;v.setAttribute('playsinline','');v.preload='auto';v.src=url;
        // Audio is routed into the recording only (not the speaker). The AudioContext and play() are
        // started inside this tap so the phone allows playback with sound.
        let ac=null,audioTracks=[];
        try{ac=new (window.AudioContext||window.webkitAudioContext)();const src=ac.createMediaElementSource(v);const dest=ac.createMediaStreamDestination();src.connect(dest);audioTracks=dest.stream.getAudioTracks();ac.resume?.();}catch{ac=null;v.muted=true;}
        const playing=v.play().catch(()=>{v.muted=true;return v.play();});
        const cleanup=()=>{try{v.pause();}catch{}URL.revokeObjectURL(url);try{ac?.close();}catch{}};
        (async()=>{
          try{
            await playing;v.pause();v.currentTime=0;
            if(!v.videoWidth)await new Promise((r,j)=>{v.onloadedmetadata=r;v.onerror=()=>j(new Error('load'));});
            const long=Math.max(v.videoWidth,v.videoHeight),scale=Math.min(1,1280/long);
            const w=Math.max(2,Math.round(v.videoWidth*scale/2)*2),h=Math.max(2,Math.round(v.videoHeight*scale/2)*2);
            const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d');
            const stream=canvas.captureStream(30);audioTracks.forEach(t=>stream.addTrack(t));
            const mime=pickMime();const rec=new MediaRecorder(stream,{...(mime?{mimeType:mime}:{}),videoBitsPerSecond:2500000,audioBitsPerSecond:128000});
            const chunks=[];rec.ondataavailable=ev=>{if(ev.data&&ev.data.size)chunks.push(ev.data);};
            const stopped=new Promise(r=>rec.onstop=r);
            let running=true;stopper=()=>{running=false;try{rec.state!=='inactive'&&rec.stop();}catch{}cleanup();};
            const draw=()=>{if(!running)return;ctx.drawImage(v,0,0,w,h);const p=v.duration?v.currentTime/v.duration:0;bar.style.width=`${Math.min(100,Math.round(p*100))}%`;status.textContent=`Shrinking… ${Math.round(p*100)}%`;
              if(v.requestVideoFrameCallback)v.requestVideoFrameCallback(draw);else requestAnimationFrame(draw);};
            ctx.drawImage(v,0,0,w,h);rec.start(1000);
            await v.play();draw();
            await new Promise(r=>{v.onended=r;});
            running=false;ctx.drawImage(v,0,0,w,h);rec.stop();await stopped;cleanup();
            if(cancelled)return;
            const type=(mime||'video/mp4').split(';')[0];
            const blob=new Blob(chunks,{type});
            if(!blob.size)throw new Error('empty');
            status.textContent=`Done — ${fmtMB(file.size)} → ${fmtMB(blob.size)}`;bar.style.width='100%';
            const name=String(file.name||'video').replace(/\.[^.]+$/,'')+(type.includes('webm')?'.webm':'.mp4');
            setTimeout(()=>done(new File([blob],name,{type})),500);
          }catch(err){
            console.error('Shrink failed',err);cleanup();if(cancelled)return;
            status.textContent='Sorry — this video couldn’t be shrunk here. Try trimming it in the Photos app first.';
            go.hidden=true;box.querySelector('.vs-cancel').textContent='OK';
          }
        })();
      };
    });
  };
})();
