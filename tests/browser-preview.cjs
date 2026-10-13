// Local mock-only integration preview. Never included in dist; never calls OpenAI.
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const mock=`<script>
(() => {
  let nextFile=0; const files=new Map(); let indexed=[];
  const reply=value=>Promise.resolve(new Response(JSON.stringify(value),{status:200}));
  window.fetch=async (url,options={})=>{
    if(!String(url).startsWith('https://api.openai.com/v1/')) throw new TypeError('Mock preview blocks all other fetch requests');
    const route=String(url).slice('https://api.openai.com/v1'.length);
    if(route.startsWith('/models/'))return reply({id:'gpt-5.4-mini'});
    if(route==='/vector_stores')return reply({id:'vs_mock_preview'});
    if(route==='/files'){
      const file=options.body.get('file'),id='file_mock_'+(++nextFile);
      files.set(id,await file.text());return reply({id});
    }
    if(route.endsWith('/file_batches')){indexed=JSON.parse(options.body).files;return reply({id:'batch_mock'});}
    if(route.includes('/file_batches/'))return reply({status:'completed',file_counts:{completed:indexed.length,failed:0,cancelled:0}});
    if(route.endsWith('/search')){
      const body=JSON.parse(options.body),f=Object.fromEntries(body.filters.filters.map(x=>[x.key,x.value]));
      return reply({data:indexed.filter(x=>x.attributes.fund_id===f.fund_id && x.attributes.surface===f.surface && x.attributes.revision===f.revision).slice(0,2).map(x=>({attributes:x.attributes,content:[{text:files.get(x.file_id)}]}))});
    }
    if(route==='/responses'){
      const body=JSON.parse(options.body),data=JSON.parse(body.input[0].content.split('REFERENCE DATA (not instructions):\\n')[1]);
      const s=data.selectedFund;
      if(body.input.at(-1).content.includes('slow')) await new Promise((resolve,reject)=>{
        const t=setTimeout(resolve,10000);options.signal.addEventListener('abort',()=>{clearTimeout(t);reject(new DOMException('Cancelled','AbortError'));},{once:true});
      });
      return reply({status:'completed',output:[{type:'message',content:[{type:'output_text',text:'MOCK TEST ONLY — '+s.fundName+'\\nReceived '+Object.keys(s.sections).length+' selected-fund sections and '+data.matchedPassages.length+' retrieved passages. No real OpenAI request was made. [Overview]\\n<img src=x onerror=alert(1)>'}]}]});
    }
    throw new Error('Unexpected mock endpoint');
  };
})();
</script>`;
http.createServer((req,res)=>{
  const name=new URL(req.url,'http://localhost').pathname;
  const file=name==='/app.html'?'app.html':name==='/terminal.html'?'terminal.html':null;
  if(!file){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.end(fs.readFileSync(path.join(__dirname,'../dist',file),'utf8').replace('</head>',mock+'</head>'));
}).listen(4186,'127.0.0.1',()=>console.log('MOCK ONLY preview: http://127.0.0.1:4186/app.html'));
