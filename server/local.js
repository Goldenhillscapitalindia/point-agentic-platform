// Local development only. Serves dist and the same function used on Vercel.
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
function createServer(handler,{authHandler}={}){
  return http.createServer(async(req,res)=>{
    const url=new URL(req.url,'http://localhost');
    if(url.pathname==='/api/chat'||url.pathname==='/api/auth'){
      const chunks=[];
      let size=0;
      try{
        for await(const chunk of req){
          size+=chunk.length;
          if(size>40000){res.writeHead(413,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Request is too large.'}));return;}
          chunks.push(chunk);
        }
        req.body=Buffer.concat(chunks).toString('utf8');
        res.status=code=>{res.statusCode=code;return res;};
        res.json=body=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(body));};
        const route=url.pathname==='/api/auth'?(authHandler||require('../api/auth')):handler;
        await route(req,res);
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
