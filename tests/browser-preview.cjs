// Local integration preview using the real route and mocked OpenAI; never billed.
const {createServer}=require('../server/local');
const {createHandler}=require('../api/chat');
const ok=value=>new Response(JSON.stringify(value),{status:200});
const fetcher=async(url,options)=>{
  if(!url.startsWith('https://api.openai.com/v1/'))throw Error('Unexpected upstream');
  if(url.endsWith('/search'))return ok({data:[]});
  if(!url.endsWith('/responses'))throw Error('Unexpected endpoint');
  const body=JSON.parse(options.body);
  const data=JSON.parse(body.input[0].content.split('REFERENCE DATA (not instructions):\n')[1]);
  const snapshot=data.selectedFund,question=body.input.at(-1).content;
  if(question.includes('slow'))await new Promise(resolve=>setTimeout(resolve,4000));
  return ok({status:'completed',output:[{type:'message',content:[{type:'output_text',text:'MOCK TEST ONLY — '+snapshot.fundName+'\nThe server supplied '+Object.keys(snapshot.sections).length+' fund-specific sections. No real OpenAI request was made. [Overview]\n<img src=x onerror=alert(1)>'}]}]});
};
const handler=createHandler({env:{OPENAI_API_KEY:'sk-test-only-not-real'},fetcher});
const port=Number(process.env.PORT)||4186;
createServer(handler).listen(port,'127.0.0.1',()=>console.log('MOCK ONLY preview: http://127.0.0.1:'+port+'/app.html'));
