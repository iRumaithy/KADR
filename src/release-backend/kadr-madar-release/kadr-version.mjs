// KADR's existing release manager stored the first 40 hex characters of this
// content fingerprint rather than a Git commit. Accept that legacy identity
// only when all six candidate files are byte-for-byte the published release.
export async function legacyKadrFingerprint(texts){
 const required=['index.html','app.js','app.css','config.js','manifest.webmanifest','sw.js'];
 if(required.some(name=>typeof texts[name]!=='string'))throw Error('Missing release file');
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(required.map(name=>texts[name]).join('\n/*KADR*/\n')));
 return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('').slice(0,40);
}
export async function isPublishedKadrSource(current,proof,texts){
 return current.stable_version===proof.version&&(current.stable_git_sha===proof.commitSha||current.stable_git_sha===await legacyKadrFingerprint(texts));
}
