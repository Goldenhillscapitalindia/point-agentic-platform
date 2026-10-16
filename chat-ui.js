/* Visitor chat: all OpenAI requests and credentials stay behind /api/chat. */
(function(){
  'use strict';
  window.PointChat={mount(adapter){
    const histories=new Map();
    let controller=null,requestId=0,pending=null;
    const fab=document.createElement('button');
    fab.className='pc-launch';fab.textContent='◑ Ask Portfolio Intelligence';fab.setAttribute('aria-controls','point-chat');
    const panel=document.createElement('aside');
    panel.id='point-chat';panel.className='pc-panel';panel.hidden=true;panel.setAttribute('aria-label','Ask Portfolio Intelligence');
    panel.innerHTML=`<header class="pc-head"><div><h2>Ask Portfolio Intelligence</h2><p id="pc-fund"></p></div><button type="button" id="pc-close" aria-label="Close chat">×</button></header>
      <div class="pc-toolbar"><span id="pc-connection">Your portfolio, explained</span><button type="button" id="pc-clear">Clear chat</button></div>
      <div id="pc-status" class="pc-status" role="status" aria-live="polite"></div>
      <div id="pc-messages" class="pc-messages" role="log" aria-label="Conversation" aria-live="polite"></div>
      <div class="pc-suggestions"><button type="button">What would you reduce first?</button><button type="button">Where should we take profits?</button><button type="button">Explain the main risk</button></div>
      <form id="pc-question-form" class="pc-composer"><label for="pc-question" class="pc-sr">Question about the selected fund</label><textarea id="pc-question" rows="2" maxlength="4000" placeholder="Ask about your portfolio…"></textarea><button type="submit" id="pc-send">Ask</button><button type="button" id="pc-stop" hidden>Stop</button></form>
      <footer class="pc-foot">Based on this website’s demo data · No trading actions</footer>`;
    document.body.append(fab,panel);
    const $=id=>panel.querySelector('#pc-'+id);
    const status=text=>{$('status').textContent=text;};
    function contextKey(){const s=adapter.getSnapshot();return adapter.accountScope()+'/'+s.surface+'/'+s.fundId;}
    function history(){const k=contextKey();if(!histories.has(k))histories.set(k,[]);return histories.get(k);}
    function controls(){
      $('send').disabled=Boolean(controller);$('stop').hidden=!controller;
      panel.setAttribute('aria-busy',String(Boolean(controller)));
    }
    function message(role,text,sources,note){
      const box=document.createElement('article');box.className='pc-message pc-'+role;
      const label=document.createElement('b');label.className='pc-speaker';label.textContent=role==='user'?'You':'Portfolio Intelligence';
      const content=document.createElement('div');content.className='pc-text';content.textContent=text;
      box.append(label,content);
      if(sources?.length){const detail=document.createElement('details'),summary=document.createElement('summary'),p=document.createElement('p');summary.textContent='Data supplied for this answer';p.textContent=sources.join(' · ');detail.append(summary,p);box.append(detail);}
      if(note){const p=document.createElement('p');p.className='pc-small';p.textContent=note;box.append(p);}
      $('messages').append(box);$('messages').scrollTop=$('messages').scrollHeight;
    }
    function renderHistory(){
      $('messages').replaceChildren();
      if(!history().length)message('assistant','Let’s look at '+adapter.getSnapshot().fundName+'. Ask what to reduce, where to take profits, or why a holding needs attention. I’ll explain the suggestion using the data available for this fund.');
      else history().forEach(m=>message(m.role,m.content,m.sources,m.note));
    }
    function cancel(){
      requestId++;controller?.abort();controller=null;
      if(pending?.at(-1)?.role==='user')pending.pop();pending=null;controls();
    }
    function contextChanged(){cancel();$('fund').textContent=adapter.getSnapshot().fundName+' · demo data';$('question').value='';renderHistory();status('Answers follow your selected fund.');}
    async function send(text){
      const question=(text||$('question').value).trim();
      if(!question||controller)return;
      if(question.length>4000){status('Please keep the question under 4,000 characters.');return;}
      if(/sk-[A-Za-z0-9_-]{12,}/.test(question)){status('Remove credentials from your message.');return;}
      const snapshot=adapter.getSnapshot(),conversation=history(),active=contextKey(),id=++requestId;
      const previous=conversation.slice(-10).map(m=>({role:m.role,content:m.content.slice(0,2400)}));
      const current=new AbortController();controller=current;
      const timer=setTimeout(()=>current.abort(),65000);
      $('question').value='';message('user',question);conversation.push({role:'user',content:question});pending=conversation;
      status('Reading '+snapshot.fundName+' data…');controls();
      try{
        const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',
          body:JSON.stringify({surface:snapshot.surface,fundId:snapshot.fundId,question,history:previous}),signal:current.signal});
        let reply;try{reply=await response.json();}catch{throw new Error('Portfolio Intelligence is unavailable. Please try again later.');}
        if(response.status===401){histories.clear();window.PointAuth?.requireLogin();return;}
        if(!response.ok)throw new Error(reply.error||'Unable to complete the answer. Please retry.');
        if(typeof reply.text!=='string'||!reply.text.trim())throw new Error('No answer was returned. Please try again.');
        if(id!==requestId||active!==contextKey())return;
        conversation.push({role:'assistant',content:reply.text,sources:reply.sources,note:reply.note});
        message('assistant',reply.text,reply.sources,reply.note);status('Answer ready.');
      }catch(error){
        if(id!==requestId)return;
        conversation.pop();renderHistory();$('question').value=question;
        status(error.name==='AbortError'?'The request stopped or timed out. You can edit and resend your question.':error.name==='TypeError'?'Unable to connect. Check your connection and try again.':error.message);
      }finally{clearTimeout(timer);if(id===requestId){controller=null;pending=null;controls();}}
    }
    function open(prefill){panel.hidden=false;fab.hidden=true;contextChanged();$('question').focus();if(prefill){$('question').value=prefill;send();}}
    function close(){panel.hidden=true;fab.hidden=false;fab.focus();}
    fab.onclick=()=>open();$('close').onclick=close;
    $('clear').onclick=()=>{cancel();histories.delete(contextKey());renderHistory();status('Chat cleared for this fund.');};
    $('stop').onclick=()=>{cancel();renderHistory();status('Request stopped.');};
    $('question-form').onsubmit=e=>{e.preventDefault();send();};
    $('question').onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();send();}};
    panel.querySelectorAll('.pc-suggestions button').forEach(b=>b.onclick=()=>send(b.textContent));
    panel.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
    document.addEventListener('point:context',contextChanged);
    contextChanged();controls();
    return {open,contextChanged};
  }};
})();
