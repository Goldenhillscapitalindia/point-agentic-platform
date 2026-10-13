const {test}=require('node:test');
const assert=require('node:assert/strict');
const core=require('../chat-core.js');
const snapshot={surface:'platform',fundId:'alpha',fundName:'Alpha Fund',scope:'Demo partial holdings',sections:{Positions:{NVDA:'$8.47M'},Risk:{limit:'60%'}}};
const response=text=>({status:'completed',output:[{type:'message',content:[{type:'output_text',text}]}]});
const ok=data=>new Response(JSON.stringify(data),{status:200});

test('chat requires an in-memory credential and disconnect removes it',async()=>{
  let calls=0;const client=core.createClient(async()=>{calls++;return ok(response('Answer'));});
  await assert.rejects(client.ask({snapshot,question:'Risk?'}),/Connect/);
  client.connect('sk-test-only-not-a-real-key');
  await client.ask({snapshot,question:'Risk?'});
  client.disconnect();await assert.rejects(client.ask({snapshot,question:'Risk?'}),/Connect/);
  assert.equal(calls,1);
});
test('retrieval filters fund, page and exact dataset revision; response uses current snapshot',async()=>{
  const calls=[];const client=core.createClient(async(url,options)=>{
    calls.push({url,body:JSON.parse(options.body)});
    return ok(url.endsWith('/search')?{data:[{attributes:{fund_id:'digital',surface:'platform'},content:[{text:'WRONG FUND SECRET'}]},
      {attributes:{fund_id:'alpha',surface:'platform',section:'Risk'},content:[{text:'Matched risk'}]}]}:response('Review the risk [Risk].'));
  });
  client.connect('sk-test-only-not-a-real-key');
  const result=await client.ask({snapshot,question:'What about that limit?',history:[{role:'user',content:'Explain net exposure'}],vectorStoreId:'vs_demo'});
  const filter=calls[0].body.filters.filters;
  assert.deepEqual(filter.map(f=>f.key),['surface','fund_id','revision']);
  assert.equal(filter[1].value,'alpha');assert.equal(filter[2].value,await core.revision(snapshot));
  assert.match(calls[0].body.query,/Explain net exposure/);
  assert.equal(calls[1].body.store,false);
  assert.match(calls[1].body.input[0].content,/8.47M/);
  assert.ok(!calls[1].body.input[0].content.includes('WRONG FUND SECRET'));
  assert.deepEqual(result.retrievedSections,['Risk']);
});
test('no matching indexed version explicitly falls back to current snapshot',async()=>{
  const client=core.createClient(async url=>ok(url.endsWith('/search')?{data:[]}:response('Snapshot answer')));
  client.connect('sk-test-only-not-a-real-key');
  const result=await client.ask({snapshot,question:'Risk?',vectorStoreId:'vs_demo'});
  assert.match(result.note,/no matching indexed version/i);
});
test('API errors never repeat a server body containing a credential',async()=>{
  const client=core.createClient(async()=>new Response(JSON.stringify({error:{message:'key sk-do-not-print'}}),{status:401}));
  client.connect('sk-test-only-not-a-real-key');
  await assert.rejects(client.validate(),error=>!error.message.includes('sk-')&&error.message.includes('rejected'));
});
test('partial or empty responses cannot masquerade as complete answers',()=>{
  assert.throws(()=>core.extractAnswer({status:'incomplete',output:[]}),/did not complete/);
  assert.throws(()=>core.extractAnswer({status:'completed',output:[]}),/no answer/);
});
test('index creates attributed files, waits for completion and resumes without duplicates',async()=>{
  const docs=await core.documents([snapshot]);const calls=[];
  const client=core.createClient(async(url,options)=>{
    calls.push({url,body:options.body});
    if(url.endsWith('/vector_stores'))return ok({id:'vs_created'});
    if(url.endsWith('/files'))return ok({id:'file_'+calls.length});
    if(url.endsWith('/file_batches'))return ok({id:'batch_created'});
    return ok({status:'completed',file_counts:{completed:2,failed:0,cancelled:0}});
  });
  client.connect('sk-test-only-not-a-real-key');const state={};
  await client.index({docs,state});assert.equal(state.ready,true);assert.equal(state.storeId,'vs_created');
  const batch=JSON.parse(calls.find(c=>c.url.endsWith('/file_batches')).body);
  assert.ok(batch.files.every(f=>f.attributes.fund_id==='alpha'));
  const before=calls.length;await client.index({docs,state});assert.equal(calls.length,before);
  state.ready=false;await client.index({docs,state});assert.equal(calls.length,before+1);
  assert.ok(!JSON.stringify(state).includes('sk-'));
});
test('failed indexing preserves IDs but does not declare success',async()=>{
  const docs=await core.documents([snapshot]);
  const state={storeId:'vs_partial',files:{[docs[0].name]:'file_1',[docs[1].name]:'file_2'},batchId:'batch_1'};
  const client=core.createClient(async()=>ok({status:'failed',file_counts:{failed:1}}));
  client.connect('sk-test-only-not-a-real-key');
  await assert.rejects(client.index({docs,state}),/could not be indexed/);
  assert.equal(state.storeId,'vs_partial');assert.ok(!state.ready);
});
test('changed website content cannot silently resume an old upload',async()=>{
  const client=core.createClient(async()=>{throw new Error('Unexpected API call');});
  client.connect('sk-test-only-not-a-real-key');
  await assert.rejects(client.index({docs:await core.documents([snapshot]),state:{fingerprint:'old'}}),/dataset changed/);
});
test('aborted request never reaches OpenAI',async()=>{
  const client=core.createClient(async()=>{throw new Error('Unexpected API call');});
  client.connect('sk-test-only-not-a-real-key');const c=new AbortController();c.abort();
  await assert.rejects(client.ask({snapshot,question:'Risk?',signal:c.signal}),{name:'AbortError'});
});
