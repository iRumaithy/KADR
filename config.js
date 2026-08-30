window.APP_CONFIG = Object.freeze({
  SUPABASE_URL: 'https://itcbahydyqhlybofcyuh.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_qL-6DKVkAc3XWJ7JH-p2_A_-8myYRgp',
  PUSH_PUBLIC_KEY: 'BO7UaVLOILAwgUF5mN-kle6lCGsCyxbG1GU97YM8Qs0Bl2Qv2JqDwmNgo_mLjfz7odi3YHEtlmzMdgfSyWNZc6o'
});

/* KADR v1.19 — TMDB poster gallery correction
   Cards stay clean. Existing ratings get a dedicated multi-poster picker inside Edit. */
(() => {
  const STYLE_ID = 'kadr-tmdb-poster-gallery-style';
  const BTN_ID = 'kadrTmdbPosterGalleryBtn';
  const MODAL_ID = 'kadrTmdbPosterGallery';
  const ENDPOINT = `${window.APP_CONFIG.SUPABASE_URL}/functions/v1/kadr-tmdb-posters`;

  function notify(msg){
    try { if (typeof toast === 'function') return toast(msg); } catch {}
    console.info('[KADR]', msg);
  }

  function addStyles(){
    ['kadr-clean-poster-tools','kadr-clean-poster-tools-v2',STYLE_ID].forEach(id => document.getElementById(id)?.remove());
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
      .posterTmdbTool{display:none!important}
      #detailModal button[onclick*="openWorkPosterSearch"]{display:none!important}

      #${BTN_ID}{
        width:100%;min-height:50px;margin-top:11px;border-radius:15px;
        border:1px solid rgba(78,196,233,.38);
        background:linear-gradient(180deg,rgba(12,57,83,.94),rgba(8,38,61,.96));
        color:#75ddff;font:inherit;font-weight:900;
        display:none;align-items:center;justify-content:center;gap:8px;
        box-shadow:0 9px 25px rgba(0,0,0,.18)
      }
      #${BTN_ID}:active{transform:scale(.985)}
      #workModal.kadr-edit-existing #${BTN_ID}{display:flex!important}
      #workModal.kadr-edit-existing #workTmdbSearchBtn{display:none!important}

      #${MODAL_ID}{
        position:fixed;inset:0;z-index:9999;background:rgba(0,5,12,.84);
        backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
        display:none;align-items:flex-end;justify-content:center
      }
      #${MODAL_ID}.show{display:flex}
      .kadrPosterGallerySheet{
        width:100%;max-width:760px;max-height:92dvh;overflow-y:auto;
        -webkit-overflow-scrolling:touch;overscroll-behavior-y:contain;
        background:linear-gradient(180deg,#102642,#071426);
        border:1px solid rgba(213,178,74,.18);
        border-radius:28px 28px 0 0;
        padding:17px 14px calc(20px + env(safe-area-inset-bottom));
        box-shadow:0 -25px 80px rgba(0,0,0,.48)
      }
      .kadrPosterGalleryHead{
        display:flex;align-items:center;justify-content:space-between;gap:12px;
        position:sticky;top:-17px;z-index:4;padding:17px 0 12px;
        background:linear-gradient(180deg,#102642 82%,rgba(16,38,66,0))
      }
      .kadrPosterGalleryHead h3{margin:0;font-size:20px}
      .kadrPosterGalleryHead p{margin:4px 0 0;color:#93a1b4;font-size:10px}
      .kadrPosterGalleryClose{
        width:42px;height:42px;flex:0 0 42px;border-radius:14px;border:1px solid rgba(192,205,222,.18);
        background:#0a1b30;color:#b9c3d1;font-size:21px
      }
      .kadrPosterGalleryState{
        margin:6px 0 12px;padding:11px 12px;border-radius:14px;
        border:1px solid rgba(192,205,222,.14);background:#07182b;color:#aeb9c8;font-size:11px
      }
      .kadrPosterGalleryGrid{
        display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px
      }
      .kadrPosterChoice{
        border:1px solid rgba(192,205,222,.16);background:#08182b;color:#f5f2e9;
        padding:5px;border-radius:15px;overflow:hidden;text-align:center
      }
      .kadrPosterChoice img{
        width:100%;aspect-ratio:2/3;display:block;object-fit:cover;border-radius:11px;background:#061426
      }
      .kadrPosterChoice span{
        min-height:25px;padding:6px 3px 2px;display:flex;align-items:center;justify-content:center;
        color:#aeb9c8;font-size:9px
      }
      .kadrPosterChoice:active{transform:scale(.985);border-color:#d5b24a}
      .kadrPosterEmpty{
        grid-column:1/-1;padding:28px 15px;text-align:center;color:#93a1b4;
        border:1px dashed rgba(192,205,222,.2);border-radius:17px
      }
      @media(max-width:420px){
        .kadrPosterGalleryGrid{grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}
        .kadrPosterChoice{padding:4px;border-radius:13px}
      }
      @supports(-webkit-touch-callout:none){
        #${MODAL_ID}{backdrop-filter:none;-webkit-backdrop-filter:none;background:rgba(0,5,12,.94)}
      }
    `;
    document.head.appendChild(s);
  }

  function buildModal(){
    if(document.getElementById(MODAL_ID)) return;
    const modal = document.createElement('div');
    modal.id = MODAL_ID;
    modal.innerHTML = `
      <div class="kadrPosterGallerySheet" role="dialog" aria-modal="true" aria-label="اختيار بوستر من TMDB">
        <div class="kadrPosterGalleryHead">
          <div>
            <h3>🖼 اختيار بوستر من TMDB</h3>
            <p>اختر الصورة التي تفضلها لنفس العمل — لن يتغير تقييمك أو بياناتك.</p>
          </div>
          <button type="button" class="kadrPosterGalleryClose" aria-label="إغلاق">×</button>
        </div>
        <div class="kadrPosterGalleryState" id="kadrPosterGalleryState">جارٍ تجهيز الصور…</div>
        <div class="kadrPosterGalleryGrid" id="kadrPosterGalleryGrid"></div>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelector('.kadrPosterGalleryClose').onclick = () => modal.classList.remove('show');
    modal.addEventListener('click', e => { if(e.target === modal) modal.classList.remove('show'); });
  }

  function ensureButton(){
    const wrap = document.querySelector('#workModal .posterChoiceWrap');
    if(!wrap) return;
    let btn = document.getElementById(BTN_ID);
    if(!btn){
      btn = document.createElement('button');
      btn.type = 'button';
      btn.id = BTN_ID;
      btn.innerHTML = '🖼 <span>اختيار بوستر من TMDB</span>';
      btn.onclick = openPosterGallery;
      wrap.appendChild(btn);
    }
  }

  function syncEditMode(){
    const modal = document.getElementById('workModal');
    const workId = document.getElementById('workId');
    if(!modal || !workId) return;
    const editing = modal.classList.contains('show') && String(workId.value || '').trim() !== '';
    modal.classList.toggle('kadr-edit-existing', editing);
  }

  async function authSession(){
    try{
      if(typeof sb !== 'undefined'){
        const {data} = await sb.auth.getSession();
        return data?.session || null;
      }
    }catch(e){ console.warn(e); }
    return null;
  }

  async function openPosterGallery(){
    buildModal();
    const modal = document.getElementById(MODAL_ID);
    const stateBox = document.getElementById('kadrPosterGalleryState');
    const grid = document.getElementById('kadrPosterGalleryGrid');

    const workId = String(document.getElementById('workId')?.value || '').trim();
    if(!workId) return notify('هذا الخيار متاح عند تعديل تقييم موجود');

    const title = String(document.getElementById('workTitle')?.value || '').trim();
    const kind = String(document.getElementById('workKind')?.value || 'movie');
    const year = Number(document.getElementById('workYear')?.value || 0) || null;
    const tmdbId = Number(document.getElementById('workTmdbId')?.value || 0) || null;
    const tmdbType = String(document.getElementById('workTmdbType')?.value || '') || null;

    modal.classList.add('show');
    stateBox.textContent = `جارٍ جلب بوسترات «${title || 'العمل'}» من TMDB…`;
    grid.innerHTML = '';

    try{
      const session = await authSession();
      if(!session?.access_token) throw new Error('NO_SESSION');

      const r = await fetch(ENDPOINT,{
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'apikey':window.APP_CONFIG.SUPABASE_PUBLISHABLE_KEY,
          'Authorization':`Bearer ${session.access_token}`
        },
        body:JSON.stringify({
          tmdb_id:tmdbId,
          tmdb_media_type:tmdbType,
          query:title,
          kind,
          year
        })
      });
      const data = await r.json().catch(()=>({}));
      if(!r.ok || !data.ok) throw new Error(data.error || 'POSTERS_FAILED');

      const posters = Array.isArray(data.posters) ? data.posters : [];
      if(data.tmdb_id) document.getElementById('workTmdbId').value = data.tmdb_id;
      if(data.tmdb_media_type) document.getElementById('workTmdbType').value = data.tmdb_media_type;

      stateBox.textContent = posters.length
        ? `${posters.length} بوستر متاح — اختر الصورة التي تعجبك`
        : 'لم يعثر TMDB على بوسترات إضافية لهذا العمل.';

      if(!posters.length){
        grid.innerHTML = '<div class="kadrPosterEmpty">لا توجد خيارات بوستر إضافية في TMDB لهذا العمل.</div>';
        return;
      }

      grid.innerHTML = posters.map((p,i)=>`
        <button type="button" class="kadrPosterChoice" data-kadr-poster="${i}">
          <img src="${String(p.thumb_url || p.url || '')}" alt="بوستر ${i+1}" loading="lazy">
          <span>${p.language ? String(p.language).toUpperCase() : 'بدون لغة'}</span>
        </button>`).join('');

      grid.onclick = e => {
        const b = e.target.closest('[data-kadr-poster]');
        if(!b) return;
        const p = posters[Number(b.dataset.kadrPoster)];
        if(!p) return;

        const url = String(p.url_high || p.url || '').trim();
        const remote = document.getElementById('workPosterRemote');
        const preview = document.getElementById('workPreview');
        const file = document.getElementById('workPoster');
        const note = document.getElementById('workTmdbPosterNote');

        if(remote) remote.value = url;
        if(file) file.value = '';
        if(preview){
          preview.src = url;
          preview.style.display = 'block';
        }
        if(note){
          note.textContent = '✓ تم اختيار بوستر من TMDB';
          note.classList.remove('hidden');
        }
        modal.classList.remove('show');
        notify('✓ تم اختيار البوستر — اضغط حفظ التقييم لتثبيته');
      };
    }catch(e){
      console.error('KADR poster gallery',e);
      stateBox.textContent = 'تعذر جلب بوسترات TMDB الآن.';
      grid.innerHTML = '<div class="kadrPosterEmpty">تعذر تحميل الصور. تحقق من الاتصال ثم حاول مرة أخرى.</div>';
    }
  }

  function init(){
    addStyles();
    buildModal();
    ensureButton();
    syncEditMode();

    const observer = new MutationObserver(()=>{
      ensureButton();
      syncEditMode();
    });
    observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});

    // Hidden input .value changes do not emit MutationObserver events, so keep a light sync.
    setInterval(syncEditMode,250);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
