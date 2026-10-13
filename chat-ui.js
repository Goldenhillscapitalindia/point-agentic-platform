/* Shared private-demo chat UI; no credential is written to browser storage. */
(function(){
  'use strict';
  window.PointChat={mount(adapter){
    const core=window.PointChatCore, client=core.createClient();
    const histories=new Map();
    let chatController=null,indexController=null,requestId=0,connecting=false,pendingConversation=null,connectionVersion=0;
    const storageKey='point-chat-index-v1-'+adapter.surface;
    let checkpoint={};
    try{checkpoint=JSON.parse(localStorage.getItem(storageKey)||'{}');}catch(e){}
    if(!checkpoint || typeof checkpoint!=='object') checkpoint={};
    const configuredStore=window.PointChatConfig?.stores?.[adapter.surface]||'';
    let vectorStoreId=checkpoint.storeId
      ? (checkpoint.ready && core.STORE_ID.test(checkpoint.storeId)?checkpoint.storeId:'')
      : (core.STORE_ID.test(configuredStore)?configuredStore:'');
    const fab=document.createElement('button');
    fab.className='pc-launch';fab.textContent='◑ Ask Point';fab.setAttribute('aria-controls','point-chat');
    const panel=document.createElement('aside');
    panel.id='point-chat';panel.className='pc-panel';panel.hidden=true;panel.setAttribute('aria-label','Ask Point private demo');
    panel.innerHTML=`<header class="pc-head"><div><h2>Ask Point</h2><p id="pc-fund"></p></div><button type="button" id="pc-close" aria-label="Close chat">×</button></header>
      <div class="pc-toolbar"><span id="pc-connection">Not connected</span><button type="button" id="pc-settings-toggle" aria-expanded="true" aria-controls="pc-settings">Connection</button><button type="button" id="pc-clear">Clear chat</button></div>
      <section id="pc-settings" class="pc-settings" aria-label="OpenAI connection">
        <p><b>Private demo · your own key.</b> Your key stays in this tab’s memory until you disconnect or reload. Questions and fund data go directly to OpenAI. API usage and vector storage are billed to your account.</p>
        <form id="pc-connect-form"><label for="pc-key">OpenAI API key</label><input id="pc-key" type="password" autocomplete="off" spellcheck="false" placeholder="Enter your API key" />
          <label for="pc-store">Vector store ID <span>(optional)</span></label><input id="pc-store" autocomplete="off" spellcheck="false" placeholder="vs_…" />
          <div class="pc-actions"><button type="submit" id="pc-connect">Connect</button><button type="button" id="pc-disconnect">Disconnect</button></div></form>
        <p class="pc-small">Chat uses the current fund snapshot. A prefilled store ID reuses the existing knowledge base; create a new one only when needed.</p>
        <div class="pc-actions"><button type="button" id="pc-index">Create knowledge base</button><button type="button" id="pc-new-index">Start a new index</button><button type="button" id="pc-export">Download store details</button></div>
        <p id="pc-index-status" role="status"></p><p class="pc-small">Uploads the fund datasets available in this page. Files remain in your OpenAI project until you delete them. Only store and upload IDs are saved locally; never your key.</p>
      </section>
      <div id="pc-status" class="pc-status" role="status" aria-live="polite"></div>
      <div id="pc-messages" class="pc-messages" role="log" aria-label="Conversation" aria-live="polite"></div>
      <div class="pc-suggestions"><button type="button">What should the desk review first?</button><button type="button">Explain the main risk</button><button type="button">Which holdings need a closer look?</button></div>
      <form id="pc-question-form" class="pc-composer"><label for="pc-question" class="pc-sr">Question about the selected fund</label><textarea id="pc-question" rows="2" maxlength="4000" placeholder="Ask about this fund…"></textarea><button type="submit" id="pc-send">Send</button><button type="button" id="pc-stop" hidden>Stop</button></form>
      <footer class="pc-foot">Illustrative website data · GPT-5.4 mini · No trading actions</footer>`;
    document.body.append(fab,panel);
    const $=id=>panel.querySelector('#pc-'+id);
    $('store').value=vectorStoreId||checkpoint.storeId||'';
    function status(text){$('status').textContent=text;}
    function contextKey(){const s=adapter.getSnapshot();return adapter.accountScope()+'/'+s.surface+'/'+s.fundId;}
    function history(){const k=contextKey();if(!histories.has(k))histories.set(k,[]);return histories.get(k);}
    function saveCheckpoint(){try{localStorage.setItem(storageKey,JSON.stringify(checkpoint));}catch(e){$('index-status').textContent+=' Keep the store ID; browser storage is unavailable.';}}
    function settings(open){$('settings').hidden=!open;$('settings-toggle').setAttribute('aria-expanded',String(open));}
    function controls(){
      const busy=!!chatController, indexing=!!indexController;
      $('send').disabled=busy||connecting||!client.hasKey();$('stop').hidden=!busy;
      $('connect').disabled=connecting||indexing;$('index').disabled=!client.hasKey()||indexing||connecting;
      $('new-index').disabled=indexing;$('export').disabled=!checkpoint.storeId;
      $('index').textContent=checkpoint.ready?'Knowledge base ready':checkpoint.storeId?'Resume indexing':'Create knowledge base';
      $('index').disabled=$('index').disabled||Boolean(checkpoint.ready);
      $('connection').textContent=client.hasKey()?'Connected · '+(vectorStoreId?'snapshot + search':'snapshot'):'Not connected';
    }
    function message(role,text,sources,note){
      const box=document.createElement('article');box.className='pc-message pc-'+role;
      const label=document.createElement('b');label.className='pc-speaker';label.textContent=role==='user'?'You':'Ask Point';
      const content=document.createElement('div');content.className='pc-text';content.textContent=text;
      box.append(label,content);
      if(sources?.length){const detail=document.createElement('details'),summary=document.createElement('summary'),p=document.createElement('p');summary.textContent='Data supplied for this answer';p.textContent=sources.join(' · ');detail.append(summary,p);box.append(detail);}
      if(note){const p=document.createElement('p');p.className='pc-small';p.textContent=note;box.append(p);}
      $('messages').append(box);$('messages').scrollTop=$('messages').scrollHeight;
    }
    function renderHistory(){
      $('messages').replaceChildren();
      if(!history().length)message('assistant','Ask me about '+adapter.getSnapshot().fundName+'. I can explain the website’s holdings, risks, performance and decision briefs. I’ll call out missing or conflicting data.');
      else history().forEach(m=>message(m.role,m.content,m.sources,m.note));
    }
    function cancelChat(){
      requestId++;chatController?.abort();chatController=null;
      if(pendingConversation?.at(-1)?.role==='user') pendingConversation.pop();
      pendingConversation=null;controls();
    }
    function contextChanged(){cancelChat();$('fund').textContent=adapter.getSnapshot().fundName+' · demo data';$('question').value='';renderHistory();status('Conversation and evidence are scoped to the selected fund.');}
    async function send(text){
      const question=(text||$('question').value).trim();
      if(!question||chatController)return;
      if(/sk-[A-Za-z0-9_-]{12,}/.test(question)){status('Do not send API keys as chat messages. Use the private connection form.');return;}
      if(!client.hasKey()){settings(true);status('Connect your own key to ask OpenAI.');$('key').focus();return;}
      const snapshot=adapter.getSnapshot(), conversation=history(), previous=conversation.slice();
      const active=contextKey(),id=++requestId,controller=new AbortController();chatController=controller;
      $('question').value='';message('user',question);conversation.push({role:'user',content:question});pendingConversation=conversation;
      status('Reading '+snapshot.fundName+' data…');controls();
      try{
        const reply=await client.ask({snapshot,question,history:previous,vectorStoreId,signal:controller.signal});
        if(id!==requestId||active!==contextKey())return;
        conversation.push({role:'assistant',content:reply.text,sources:reply.sources,note:reply.note});
        message('assistant',reply.text,reply.sources,reply.note);status('Answer ready · check the cited sections before deciding.');
      }catch(error){
        if(id!==requestId)return;
        conversation.pop();renderHistory();$('question').value=question;
        status(error.name==='AbortError'?'Request stopped. You can edit and resend your question.':error.message);
      }finally{if(id===requestId){chatController=null;pendingConversation=null;controls();}}
    }
    function open(prefill){panel.hidden=false;fab.hidden=true;contextChanged();if(prefill){$('question').value=prefill;send();}else (client.hasKey()?$('question'):$('key')).focus();}
    function close(){panel.hidden=true;fab.hidden=false;fab.focus();}
    fab.onclick=()=>open();$('close').onclick=close;
    $('settings-toggle').onclick=()=>settings($('settings').hidden);
    $('clear').onclick=()=>{cancelChat();histories.delete(contextKey());renderHistory();status('Chat cleared for this fund.');};
    $('stop').onclick=()=>{cancelChat();renderHistory();status('Request stopped.');};
    $('disconnect').onclick=()=>{connectionVersion++;connecting=false;cancelChat();indexController?.abort();client.disconnect();$('key').value='';histories.clear();renderHistory();settings(true);status('Disconnected. The key and conversation have been cleared from this tab. Uploaded files remain in OpenAI.');controls();};
    $('question-form').onsubmit=e=>{e.preventDefault();send();};
    $('question').onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();send();}};
    panel.querySelectorAll('.pc-suggestions button').forEach(b=>b.onclick=()=>send(b.textContent));
    panel.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
    $('connect-form').onsubmit=async e=>{
      e.preventDefault();if(connecting||indexController)return;
      const version=++connectionVersion,value=$('key').value.trim(),store=$('store').value.trim();
      $('key').value='';
      if(store&&!core.STORE_ID.test(store)){status('Use a vector store ID beginning with vs_.');return;}
      cancelChat();connecting=true;controls();
      try{
        if(value)client.connect(value);
        await client.validate();if(version!==connectionVersion)return;vectorStoreId=store;
        status('Connected. You can ask about this fund or create the knowledge base.');settings(false);$('question').focus();
      }catch(error){if(version===connectionVersion){client.disconnect();status(error.message);settings(true);}}
      finally{if(version===connectionVersion){connecting=false;controls();}}
    };
    $('index').onclick=async()=>{
      if(indexController||checkpoint.ready)return;
      const controller=new AbortController();indexController=controller;controls();
      try{
        const docs=await core.documents(adapter.getAllSnapshots());
        await client.index({docs,state:checkpoint,signal:controller.signal,onProgress:(text)=>{
          saveCheckpoint();$('index-status').textContent=text;$('store').value=checkpoint.storeId||'';
        }});
        vectorStoreId=checkpoint.storeId;status('Knowledge base ready. Copy the vector store ID or download its details.');
      }catch(error){$('index-status').textContent=error.name==='AbortError'?'Indexing stopped. Saved progress can be resumed; uploaded files remain in OpenAI.':error.message;saveCheckpoint();}
      finally{indexController=null;controls();}
    };
    $('new-index').onclick=()=>{
      if(indexController)return;
      checkpoint={};vectorStoreId='';saveCheckpoint();$('store').value='';$('index-status').textContent='Ready to create a new index. Any previous store remains in your OpenAI project; delete it there if no longer needed.';controls();
    };
    $('export').onclick=()=>{
      const data={vectorStoreId:checkpoint.storeId,model:core.MODEL,surface:adapter.surface,ready:Boolean(checkpoint.ready),
        datasetRevision:checkpoint.fingerprint,fileIds:Object.values(checkpoint.files||{}),batchId:checkpoint.batchId||null,
        note:'This ID is not an API key. Use an authorized key from the same OpenAI project. Never put a shared secret in a public frontend.'};
      const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
      const a=document.createElement('a');a.href=url;a.download='point-vector-store.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    };
    document.addEventListener('point:context',contextChanged);
    contextChanged();controls();
    return {open,contextChanged};
  }};
})();
