export async function publicReleaseReady(version,texts,fetcher=fetch){
 if(!/^\d+(?:\.\d+){1,2}$/.test(version))return false;
 const files=['index.html','app.js','app.css','config.js','manifest.webmanifest','sw.js'];
 try{return (await Promise.all(files.map(async name=>{
  if(typeof texts[name]!=='string')return false;
  const r=await fetcher('https://irumaithy.github.io/KADR/releases/v'+version+'/'+name+'?previewVersion='+version,{redirect:'error',headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(10000)});
  return r.ok&&(await r.text())===texts[name];
 }))).every(Boolean)}catch{return false}
}
