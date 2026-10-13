// Local development only. Serves dist and the same function used on Vercel.
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
function createServer(handler){
  return http.createServer(async(req,res)=>{
    const url=new URL(req.url,'http://localhost');
    if(url.pathname==='/api/chat'){
      let raw='';
      try{
        for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>40000){res.writeHead(413);res.end(JSON.stringify({error:'Question is too large.'}));return;}}
        req.body=raw;
        res.status=code=>{res.statusCode=code;return res;};
        res.json=body=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(body));};
        await handler(req,res);
      }catch{if(!res.headersSent)res.writeHead(500);res.end();}
      return;
    }
    const files={'/':'index.html','/index.html':'index.html','/app':'app.html','/app.html':'app.html','/terminal':'terminal.html','/terminal.html':'terminal.html'};
    const file=files[url.pathname];
    if(!file||!['GET','HEAD'].includes(req.method)){res.writeHead(404);res.end();return;}
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.setHeader('Cache-Control','no-store');
    res.end(req.method==='HEAD'?undefined:fs.readFileSync(path.join(__dirname,'../dist',file)));
  });
}
module.exports={createServer};
