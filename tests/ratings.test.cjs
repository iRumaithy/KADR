const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const source=readFileSync('releases/v1.23/app.js','utf8');
const state={viewings:[],ratings:[]};
const context=vm.createContext({state,console,setTimeout,clearTimeout});
vm.runInContext(source.slice(source.indexOf('function fmtRating'),source.indexOf('function seasonsText')),context);
vm.runInContext(source.slice(source.indexOf('let ratingIndex='),source.indexOf('function criterionLabel')),context);
const work={id:'reacher',rating_override:2};
const view=(id,score,date='2026-10-18')=>({id,work_id:work.id,overall_rating:score,watched_at:date,created_at:date});
const reset=(viewings,ratings=[])=>{state.viewings=viewings;state.ratings=ratings};
const score=()=>context.finalRating(work);
reset([view('new',8.7),view('old',9.4,'2026-08-22')]);
assert(Math.abs(score()-9.05)<1e-10);
assert.equal(context.fmtRating(score()),'9.1');
reset([...state.viewings].reverse());assert.equal(context.fmtRating(score()),'9.1');
// Every viewing has equal weight, even when the number of criteria differs.
reset([view('a',null),view('b',null)],[{viewing_id:'a',rating:10},...Array.from({length:6},()=>({viewing_id:'b',rating:8}))]);
assert.equal(score(),9);
// Empty, invalid, out-of-range and unrated viewings do not contribute a zero.
reset([view('a',9),view('b',null),view('c',''),view('d','bad'),view('e',11)], [{viewing_id:'b',rating:''},{viewing_id:'b',rating:null}]);
assert.equal(score(),9);
reset([view('a',9)],[{viewing_id:'a',rating:3}]);assert.equal(score(),9);
// Legacy work-only scores survive only when the work has no rated viewings.
reset([]);assert.equal(score(),2);assert.equal(context.finalRating({id:'empty',rating_override:null}),null);
reset([view('a',8),view('b',10)]);assert.equal(score(),9);
state.viewings[0].overall_rating=6;context.invalidateRatingIndex();assert.equal(score(),8);
state.viewings.push(view('c',5));context.invalidateRatingIndex();assert.equal(score(),7);
state.viewings=state.viewings.filter(v=>v.id!=='b');assert.equal(score(),5.5);
state.ratings=[{viewing_id:'a',rating:4}];state.viewings[0].overall_rating=null;context.invalidateRatingIndex();assert.equal(score(),4.5);
// Re-rendering uses one shared index; cloud array replacements rebuild it.
const index=context.ratingData();for(let i=0;i<100;i++)assert.equal(context.ratingData(),index);
state.ratings=[{viewing_id:'a',rating:10}];assert.equal(score(),7.5);
// Exercise the actual cloud reload coordinator with a delayed read.
vm.runInContext(source.slice(source.indexOf('let cloudLoadPromise='),source.indexOf('async function performCloudLoad')),context);
let calls=0,active=0,maxActive=0,release;
context.performCloudLoad=async()=>{calls++;active++;maxActive=Math.max(maxActive,active);if(calls===1)await new Promise(resolve=>{release=resolve});active--};
(async()=>{
const first=context.loadCloud();const second=context.loadCloud();assert.equal(first,second);release();await first;assert.equal(calls,2);assert.equal(maxActive,1);
calls=0;context.performCloudLoad=async()=>{calls++};for(let i=0;i<20;i++)context.scheduleCloudReload();await new Promise(resolve=>setTimeout(resolve,240));assert.equal(calls,1);
context.performCloudLoad=async()=>{throw Error('network')};await assert.rejects(context.loadCloud());context.performCloudLoad=async()=>{calls++};await context.loadCloud();assert.equal(calls,2);
console.log('PASS: averages, equal weights, empty/invalid ratings, manual viewing scores, legacy fallback, add/edit/delete invalidation, shared index, serialized and debounced refresh, error recovery.');
})().catch(error=>{console.error(error);process.exitCode=1});
