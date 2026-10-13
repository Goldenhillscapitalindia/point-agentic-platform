const {createServer}=require('../server/local');
const handler=require('../api/chat');
const port=Number(process.env.PORT)||4178;
createServer(handler).listen(port,'127.0.0.1',()=>console.log('Portfolio Intelligence: http://127.0.0.1:'+port+'/app.html'));
