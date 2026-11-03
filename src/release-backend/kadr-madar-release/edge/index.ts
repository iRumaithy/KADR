import {publicationFields} from '../publication-fields.mjs';
import {isPublishedKadrSource} from '../kadr-version.mjs';
import {verifyProof} from '../verify-proof.mjs';
import publicKey from '../public-key.json' with {type:'json'};
declare const Deno:{serve(handler:(req:Request)=>Promise<Response>):void;env:{get(key:string):string|undefined}};
const json=(body:unknown,status=200)=>{if(status>=400)console.error('KADR_RELEASE_VERIFICATION',status,JSON.stringify(body));return Response.json(body,{status,headers:{'Cache-Control':'no-store'}})};
const value=(v:string)=>v.split('.').reduce((n,p)=>n*1000+Number(p),0)*(v.split('.').length===2?1000:1);
Deno.serve(async(req:Request)=>{
 if(req.method!=='POST')return json({ok:false},405);
 let p;try{p=await verifyProof((req.headers.get('Authorization')||'').replace(/^Bearer /,''),publicKey,'kadr','iRumaithy/KADR');}catch{return json({ok:false},401);}
 try{
  const raw='https://raw.githubusercontent.com/iRumaithy/KADR/'+p.commitSha+'/',prefix='releases/v'+p.version+'/';
  const opts={redirect:'manual' as const,signal:AbortSignal.timeout(15000)};
  const files=['index.html','app.js','app.css','config.js','sw.js','manifest.webmanifest'];
  const responses=await Promise.all(files.map(f=>fetch(raw+prefix+f,opts)));if(responses.some(r=>!r.ok))return json({ok:false,error:'Missing release files'},409);
  const texts=await Promise.all(responses.map(r=>r.text()));
  if(!new RegExp("BUILD_VERSION\\s*=\\s*['\"]"+p.version.replaceAll('.','\\.')+"['\"]").test(texts[1]))return json({ok:false,error:'Version mismatch'},409);
  const url=Deno.env.get('SUPABASE_URL')!,key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,headers={apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'};
  const response=await fetch(url+'/rest/v1/mashhad_app_release?id=eq.main&select=stable_version,stable_revision,stable_git_sha',{headers,...opts});if(!response.ok)throw Error('Read failed');
  const rows:any=await response.json();if(rows.length!==1)return json({ok:false},409);const current=rows[0];
  if(value(p.version)<value(current.stable_version))return json({ok:false,error:'Downgrade blocked'},409);
  const samePublished=await isPublishedKadrSource(current,p,Object.fromEntries(files.map((name,i)=>[name,texts[i]])));
  if(p.version===current.stable_version&&!samePublished)return json({ok:false,error:'Use a new version for changed files'},409);
  if(p.dryRun)return json({ok:true,dryRun:true,version:p.version});
  const live=await fetch('https://irumaithy.github.io/KADR/madar-release.json?commit='+p.commitSha,opts);if(!live.ok)return json({ok:false,error:'Pages not ready'},409);const manifest:any=await live.json();if(manifest.commit!==p.commitSha||manifest.version!==p.version)return json({ok:false,error:'Live files mismatch'},409);
  // Verify the actual public files as well as the deployment marker.
  const publicFiles=await Promise.all(files.map(f=>fetch('https://irumaithy.github.io/KADR/'+prefix+f+'?commit='+p.commitSha,opts)));
  for(let i=0;i<files.length;i++)if(!publicFiles[i].ok||await publicFiles[i].text()!==texts[i])return json({ok:false,error:'Public asset mismatch'},409);
  if(samePublished)return json({ok:true,version:p.version,alreadyPublished:true});
  // The signed Madar proof is minted only after the owner approves this exact commit.
  // Translate that approval into KADR's existing audit fields; keep its database guard intact.
  const ownerResponse=await fetch(url+'/rest/v1/mashhad_profiles?role=eq.admin&is_active=eq.true&select=id,role,is_active&limit=2',{headers,...opts});
  if(!ownerResponse.ok)return json({ok:false,error:'Owner mapping unavailable'},502);
  const owners:any=await ownerResponse.json();if(!Array.isArray(owners)||owners.length!==1)return json({ok:false,error:'Owner mapping must be unique'},409);
  const now=new Date().toISOString(),payload=publicationFields(p,current,owners[0],now);
  const changed=await fetch(url+'/rest/v1/mashhad_app_release?id=eq.main&stable_version=eq.'+encodeURIComponent(current.stable_version)+'&stable_revision=eq.'+current.stable_revision,{...opts,method:'PATCH',headers:{...headers,Prefer:'return=representation'},body:JSON.stringify(payload)});
  const updated:any=await changed.json();if(!changed.ok||!Array.isArray(updated)||updated.length!==1)return json({ok:false,error:'Release changed'},409);
  return json({ok:true,version:p.version});
 }catch{return json({ok:false,error:'Verification unavailable'},502);}
});
