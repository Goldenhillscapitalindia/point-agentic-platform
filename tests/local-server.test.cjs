const {test}=require('node:test');
const assert=require('node:assert/strict');
const http=require('node:http');
const {once}=require('node:events');
const {setTimeout:delay}=require('node:timers/promises');
const {createServer}=require('../server/local');

test('local auth requests preserve Unicode credentials across network chunks',async t=>{
  const server=createServer(()=>{}, {authHandler:(req,res)=>res.json(JSON.parse(req.body))});
  server.listen(0,'127.0.0.1');await once(server,'listening');
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  const body=Buffer.from(JSON.stringify({action:'signup',name:'Zoë Analyst',password:'password-秘密-2026'}));
  const split=body.indexOf(Buffer.from('ë'))+1;
  const response=new Promise((resolve,reject)=>{
    const req=http.request({host:'127.0.0.1',port:server.address().port,path:'/api/auth',method:'POST',headers:{'Content-Type':'application/json'}},res=>{
      let raw='';res.setEncoding('utf8');res.on('data',chunk=>raw+=chunk);
      res.on('end',()=>{try{resolve(JSON.parse(raw));}catch(error){reject(error);}});
    });
    req.on('error',reject);req.write(body.subarray(0,split));
    delay(25).then(()=>req.end(body.subarray(split))).catch(reject);
  });
  assert.deepEqual(await response,{action:'signup',name:'Zoë Analyst',password:'password-秘密-2026'});
});

test('local server never exposes account storage or environment files',async t=>{
  const server=createServer(()=>{});
  server.listen(0,'127.0.0.1');await once(server,'listening');
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  for(const path of ['/.point-auth/auth.json','/.env','/server/auth.js']){
    const response=await fetch('http://127.0.0.1:'+server.address().port+path);
    assert.equal(response.status,404);
  }
});
