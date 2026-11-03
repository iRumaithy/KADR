export function publicationFields(proof,current,owner,now=new Date().toISOString()){
 if(proof.dryRun!==false||!owner?.id||owner.role!=='admin'||owner.is_active!==true)throw Error('Verified owner approval required');
 if(!/^\d+(?:\.\d+){1,2}$/.test(proof.version)||!/^[a-f0-9]{40}$/.test(proof.commitSha)||!Number.isFinite(proof.iat))throw Error('Invalid verified release');
 return {stable_version:proof.version,stable_revision:Number(current.stable_revision)+1,stable_git_sha:proof.commitSha,stable_verified_at:now,stable_published_at:now,stable_published_by:owner.id,candidate_version:proof.version,candidate_available:false,candidate_status:'published',candidate_notes:proof.notes,candidate_approved_at:new Date(proof.iat*1000).toISOString(),candidate_approved_by:owner.id,last_verification_error:'',updated_at:now};
}
