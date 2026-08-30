window.APP_CONFIG = Object.freeze({
  SUPABASE_URL: 'https://itcbahydyqhlybofcyuh.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_qL-6DKVkAc3XWJ7JH-p2_A_-8myYRgp',
  PUSH_PUBLIC_KEY: 'BO7UaVLOILAwgUF5mN-kle6lCGsCyxbG1GU97YM8Qs0Bl2Qv2JqDwmNgo_mLjfz7odi3YHEtlmzMdgfSyWNZc6o'
});

/* KADR v1.19 owner-review hotfix 2
   - no TMDB poster icon on cards/details
   - explicit TMDB poster control inside edit-rating modal only */
(() => {
  const STYLE_ID = 'kadr-clean-poster-tools-v2';
  const EDIT_BTN_ID = 'kadrEditTmdbPosterBtn';

  function applyStyle() {
    document.getElementById('kadr-clean-poster-tools')?.remove();
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .posterTmdbTool{display:none!important}
      #detailModal button[onclick*="openWorkPosterSearch"]{display:none!important}
      #${EDIT_BTN_ID}{
        width:100%;
        margin-top:10px;
        min-height:48px;
        border-radius:14px;
        border:1px solid rgba(240,215,122,.32);
        background:linear-gradient(180deg,#142a46,#0d2038);
        color:#f0d77a;
        font-weight:850;
        display:none;
        align-items:center;
        justify-content:center;
        gap:7px;
      }
      #workModal.kadr-editing-work #${EDIT_BTN_ID}{display:flex!important}
      #workModal.kadr-editing-work #workTmdbSearchBtn{display:none!important}
    `;
    document.head.appendChild(style);
  }

  function ensureEditButton() {
    const wrap = document.querySelector('#workModal .posterChoiceWrap');
    const source = document.getElementById('workTmdbSearchBtn');
    if (!wrap || !source) return;

    let btn = document.getElementById(EDIT_BTN_ID);
    if (!btn) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.id = EDIT_BTN_ID;
      btn.textContent = '🖼 تغيير البوستر من TMDB';
      btn.addEventListener('click', () => source.click());
      wrap.appendChild(btn);
    }
  }

  function syncEditState() {
    const modal = document.getElementById('workModal');
    const workId = document.getElementById('workId');
    if (!modal || !workId) return;
    const editing = modal.classList.contains('show') && String(workId.value || '').trim().length > 0;
    modal.classList.toggle('kadr-editing-work', editing);
  }

  function init() {
    applyStyle();
    ensureEditButton();
    syncEditState();

    const modal = document.getElementById('workModal');
    const workId = document.getElementById('workId');

    if (modal) {
      new MutationObserver(() => {
        ensureEditButton();
        syncEditState();
      }).observe(modal, { attributes: true, attributeFilter: ['class'], childList: true, subtree: true });
    }

    if (workId) {
      workId.addEventListener('change', syncEditState);
      new MutationObserver(syncEditState).observe(workId, { attributes: true });
    }

    document.addEventListener('click', () => setTimeout(syncEditState, 0), true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
