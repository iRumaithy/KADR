window.APP_CONFIG = Object.freeze({
  SUPABASE_URL: 'https://itcbahydyqhlybofcyuh.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_qL-6DKVkAc3XWJ7JH-p2_A_-8myYRgp',
  PUSH_PUBLIC_KEY: 'BO7UaVLOILAwgUF5mN-kle6lCGsCyxbG1GU97YM8Qs0Bl2Qv2JqDwmNgo_mLjfz7odi3YHEtlmzMdgfSyWNZc6o'
});

/* KADR v1.19 owner-review hotfix:
   keep TMDB poster control only inside the edit-rating modal */
(() => {
  const apply = () => {
    if (document.getElementById('kadr-clean-poster-tools')) return;
    const style = document.createElement('style');
    style.id = 'kadr-clean-poster-tools';
    style.textContent = `
      .posterTmdbTool{display:none!important}
      #detailModal button[onclick*="openWorkPosterSearch"]{display:none!important}
    `;
    document.head.appendChild(style);
  };
  if (document.head) apply();
  else document.addEventListener('DOMContentLoaded', apply, { once: true });
})();
