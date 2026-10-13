// Owner-only indexing command. This is not exposed as a public HTTP route.
const fs=require('node:fs');
const path=require('node:path');
const core=require('../chat-core');
const data=require('../server/portfolio-data.json');
(async()=>{
  const surface=process.argv[2]||'platform';
  if(!['platform','terminal'].includes(surface))throw Error('Choose platform or terminal.');
  if(!process.env.OPENAI_API_KEY)throw Error('Set OPENAI_API_KEY in .env.local first.');
  const docs=await core.documents(data.filter(s=>s.surface===surface));
  const revision=await core.revision(docs);
  const directory=path.join(__dirname,'../.point-index');fs.mkdirSync(directory,{recursive:true});
  const file=path.join(directory,surface+'-'+revision+'.json');
  const store=(surface==='platform'?process.env.OPENAI_VECTOR_STORE_ID:process.env.OPENAI_TERMINAL_VECTOR_STORE_ID)||'';
  if(store&&!core.STORE_ID.test(store))throw Error('The configured vector store ID must begin with vs_.');
  const state=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{...(store?{storeId:store}:{})};
  if(store&&state.storeId&&store!==state.storeId)throw Error('This dataset has a checkpoint for a different store. Restore its store ID or move its checkpoint before reindexing.');
  const client=core.createClient();client.connect(process.env.OPENAI_API_KEY);
  try{await client.index({docs,state,onProgress:message=>{fs.writeFileSync(file,JSON.stringify(state,null,2));console.log(message);}});}
  finally{client.disconnect();}
  console.log((surface==='platform'?'OPENAI_VECTOR_STORE_ID':'OPENAI_TERMINAL_VECTOR_STORE_ID')+'='+state.storeId);
})().catch(()=>{console.error('Indexing could not complete. Check the environment configuration and OpenAI Storage; saved checkpoints can be resumed with the same command.');process.exitCode=1;});
