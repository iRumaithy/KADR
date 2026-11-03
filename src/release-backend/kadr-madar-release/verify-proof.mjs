const decode=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-s.length%4)%4)),c=>c.charCodeAt(0));
export async function verifyProof(token,publicKey,appId,repository){
 if(typeof token!=='string'||token.length>22000)throw Error('Unauthorized');
 const parts=token.split('.');if(parts.length!==3)throw Error('Unauthorized');
 const [header,payload,signature]=parts;let h,p;
 try{h=JSON.parse(new TextDecoder().decode(decode(header)));p=JSON.parse(new TextDecoder().decode(decode(payload)));}catch{throw Error('Unauthorized');}
 if(h.alg!=='ES256'||h.typ!=='JWT')throw Error('Unauthorized');
 const key=await crypto.subtle.importKey('jwk',publicKey,{name:'ECDSA',namedCurve:'P-256'},false,['verify']);
 if(!await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},key,decode(signature),new TextEncoder().encode(header+'.'+payload)))throw Error('Unauthorized');
 const now=Math.floor(Date.now()/1000);
 if(p.iss!=='https://owner-hub-rumaithy.alromaithi-3bo0d.chatgpt.site'||p.aud!==appId+'-madar-release'||p.appId!==appId||p.repository!==repository||!/^\d+(?:\.\d+){1,2}(?:-[A-Za-z0-9._-]+)?$/.test(p.version)||!(/^[a-f0-9]{40}$/).test(p.commitSha)||typeof p.notes!=='string'||p.notes.length>8000||typeof p.iat!=='number'||typeof p.exp!=='number'||p.iat>now+5||p.exp<=now||p.exp>p.iat+90||now-p.iat>90||typeof p.dryRun!=='boolean')throw Error('Unauthorized');
 return p;
}
export function compareVersions(a,b){const x=a.split('.').map(Number),y=b.split('.').map(Number);for(let i=0;i<3;i++){if(x[i]!==y[i])return x[i]>y[i]?1:-1;}return 0;}
