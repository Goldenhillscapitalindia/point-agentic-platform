/* ============ Point — IR report PDFs + monthly tear sheet ============
 * No dependencies: a small PDF writer (standard Type1 fonts, WinAnsi text)
 * plus the report layouts used by the IR & Reporting view.
 *   PointIRReports.templatesPdf({...})  -> Blob (all IR templates in one PDF)
 *   PointIRReports.tearsheet(...)       -> computed monthly tear sheet model
 *   PointIRReports.tearsheetHtml(model) -> markup for the Monthly tab
 *   PointIRReports.tearsheetPdf(model)  -> Blob
 */
(function(root){
  'use strict';

  /* ---------------- text helpers ---------------- */
  const WIN={0x20AC:0x80,0x201A:0x82,0x0192:0x83,0x201E:0x84,0x2026:0x85,0x2020:0x86,0x2021:0x87,0x02C6:0x88,0x2030:0x89,0x0160:0x8A,0x2039:0x8B,0x0152:0x8C,0x017D:0x8E,0x2018:0x91,0x2019:0x92,0x201C:0x93,0x201D:0x94,0x2022:0x95,0x2013:0x96,0x2014:0x97,0x02DC:0x98,0x2122:0x99,0x0161:0x9A,0x203A:0x9B,0x0153:0x9C,0x017E:0x9E,0x0178:0x9F};
  // Normalise to characters the standard PDF fonts can draw.
  const clean=s=>String(s==null?'':s).replace(/−/g,'-').replace(/[    ]/g,' ').replace(/[←-⇿]/g,'').replace(/\s+/g,' ').trim();
  function pdfString(s){
    let out='';
    for(const ch of clean(s)){
      let c=ch.codePointAt(0);
      if(c>=128&&c<160||c>255) c=WIN[c]||(c>0xffff?-1:63);
      if(c<0) continue;
      if(c===40||c===41||c===92) out+='\\'+String.fromCharCode(c);
      else if(c<32||c>126) out+='\\'+c.toString(8).padStart(3,'0');
      else out+=String.fromCharCode(c);
    }
    return out;
  }
  let measureCtx=null;
  const CSS_FONT={R:'100px Arial, Helvetica, sans-serif',B:'bold 100px Arial, Helvetica, sans-serif',I:'italic 100px Arial, Helvetica, sans-serif',S:'bold 100px "Times New Roman", Times, serif'};
  // Arial / Times New Roman share Helvetica / Times metrics, so canvas widths match the PDF.
  function textWidth(s,f,size){
    s=clean(s);
    if(!measureCtx&&typeof document!=='undefined') measureCtx=document.createElement('canvas').getContext('2d');
    if(!measureCtx) return s.length*size*0.52;
    measureCtx.font=CSS_FONT[f]||CSS_FONT.R;
    return measureCtx.measureText(s).width/100*size;
  }
  const hex=c=>{const n=parseInt(c.replace('#',''),16);return [(n>>16)&255,(n>>8)&255,n&255].map(v=>(v/255).toFixed(3)).join(' ');};
  const n2=v=>Number(v).toFixed(2);

  /* ---------------- PDF writer ---------------- */
  const FONTS={R:'Helvetica',B:'Helvetica-Bold',I:'Helvetica-Oblique',S:'Times-Bold'};
  function PdfDoc(){this.W=595.28;this.H=841.89;this.pages=[];}
  PdfDoc.prototype={
    addPage(){this.page=[];this.pages.push(this.page);return this.page;},
    rect(x,y,w,h,fill,stroke,lw){
      const p=this.page;p.push('q');
      if(fill)p.push(hex(fill)+' rg');
      if(stroke)p.push(hex(stroke)+' RG '+n2(lw||0.5)+' w');
      p.push(`${n2(x)} ${n2(this.H-y-h)} ${n2(w)} ${n2(h)} re ${fill&&stroke?'B':fill?'f':'S'}`,'Q');
    },
    line(x1,y1,x2,y2,color,lw,dash){
      this.page.push('q',hex(color||'#000000')+' RG '+n2(lw||0.5)+' w'+(dash?' [2 2] 0 d':''),`${n2(x1)} ${n2(this.H-y1)} m ${n2(x2)} ${n2(this.H-y2)} l S`,'Q');
    },
    poly(points,color,lw){
      if(points.length<2)return;
      const path=points.map(([x,y],i)=>`${n2(x)} ${n2(this.H-y)} ${i?'l':'m'}`).join(' ');
      this.page.push('q',hex(color)+' RG '+n2(lw||1)+' w 1 J 1 j',path+' S','Q');
    },
    text(s,x,y,o={}){
      const f=o.f||'R',size=o.size||9,str=pdfString(s);if(!str)return;
      const w=o.align&&o.align!=='left'?textWidth(s,f,size):0;
      const tx=o.align==='right'?x-w:o.align==='center'?x-w/2:x;
      this.page.push(`BT /${f} ${n2(size)} Tf ${hex(o.color||'#2a211a')} rg ${n2(tx)} ${n2(this.H-y)} Td (${str}) Tj ET`);
    },
    blob(){
      const objs=[];
      const add=s=>{objs.push(s);return objs.length;};
      add('<< /Type /Catalog /Pages 2 0 R >>');
      add('');// pages placeholder
      const fontIds=Object.entries(FONTS).map(([k,name])=>[k,add(`<< /Type /Font /Subtype /Type1 /BaseFont /${name} /Encoding /WinAnsiEncoding >>`)]);
      const fontRes=fontIds.map(([k,id])=>`/${k} ${id} 0 R`).join(' ');
      const kids=[];
      this.pages.forEach(ops=>{
        const content=ops.join('\n');
        const cid=add(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
        kids.push(add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${this.W} ${this.H}] /Resources << /Font << ${fontRes} >> >> /Contents ${cid} 0 R >>`));
      });
      objs[1]=`<< /Type /Pages /Kids [${kids.map(k=>k+' 0 R').join(' ')}] /Count ${kids.length} >>`;
      let out='%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';const offsets=[];
      objs.forEach((o,i)=>{offsets.push(out.length);out+=`${i+1} 0 obj\n${o}\nendobj\n`;});
      const xref=out.length;
      out+=`xref\n0 ${objs.length+1}\n0000000000 65535 f \n`+offsets.map(o=>String(o).padStart(10,'0')+' 00000 n \n').join('');
      out+=`trailer\n<< /Size ${objs.length+1} /Root 1 0 R /Info << /Producer (Point Agentic Solutions) >> >>\nstartxref\n${xref}\n%%EOF`;
      const bytes=new Uint8Array(out.length);for(let i=0;i<out.length;i++)bytes[i]=out.charCodeAt(i)&255;
      return new Blob([bytes],{type:'application/pdf'});
    }
  };

  /* ---------------- report layout (Point brand) ---------------- */
  const C={ink:'#2a211a',orange:'#d9532f',gold:'#b88a17',sage:'#687f75',cream:'#f3ede2',zebra:'#faf6ee',total:'#efe7d7',line:'#e4dac8',muted:'#7a6d5c',good:'#2f8a46',bad:'#c43e3a',white:'#ffffff'};
  const M=40;
  function Report(meta){
    this.doc=new PdfDoc();this.meta=meta;this.CW=this.doc.W-2*M;this.newPage();
  }
  Report.prototype={
    newPage(){
      const d=this.doc;d.addPage();
      d.text('Point Agentic Solutions',M,46,{f:'B',size:11});
      d.text(this.meta.subtitle||'IR & Reporting',M,59,{size:8,color:C.muted});
      const lx=d.W-M-Math.max(textWidth('POINT','S',14),textWidth('AGENTIC SOLUTIONS','B',5))-30;
      d.rect(lx,34,22,22,C.orange);
      d.text('P',lx+11,51,{f:'S',size:15,color:C.white,align:'center'});
      d.text('POINT',d.W-M,47,{f:'S',size:14,align:'right'});
      d.text('AGENTIC SOLUTIONS',d.W-M,56,{f:'B',size:5,color:C.muted,align:'right'});
      d.line(M,68,d.W-M,68,C.ink,1);
      this.y=92;
    },
    room(h){if(this.y+h>this.doc.H-66){this.newPage();return true;}return false;},
    title(s){
      this.room(60);const d=this.doc;
      d.text(s,M,this.y+14,{f:'S',size:15});
      d.line(M,this.y+23,d.W-M,this.y+23,C.ink,0.8);
      d.line(M,this.y+23,M+60,this.y+23,C.orange,2);
      this.y+=38;
    },
    wrap(s,maxW,f,size){
      const words=clean(s).split(' ');const lines=[];let cur='';
      words.forEach(w=>{const t=cur?cur+' '+w:w;if(cur&&textWidth(t,f,size)>maxW){lines.push(cur);cur=w;}else cur=t;});
      if(cur)lines.push(cur);return lines;
    },
    callout(s,o={}){
      const size=o.size||8.5,f=o.f||'I',lines=this.wrap(s,this.CW-26,f,size),h=lines.length*(size+3)+14;
      this.room(h+10);const d=this.doc;
      d.rect(M,this.y,this.CW,h,o.fill||C.cream);d.rect(M,this.y,3,h,o.bar||C.orange);
      lines.forEach((l,i)=>d.text(l,M+14,this.y+12+size*0.75+i*(size+3),{f,size,color:o.color||C.ink}));
      this.y+=h+12;
    },
    note(s){this.callout(s,{size:7,bar:'#b9ad9a',color:C.muted,fill:C.zebra});},
    subhead(s){this.room(40);this.doc.text(s,M,this.y+10,{f:'B',size:10.5});this.y+=19;},
    kpis(items){
      if(!items.length)return;
      const gap=8,n=items.length,w=(this.CW-gap*(n-1))/n,h=46;this.room(h+12);const d=this.doc;
      items.forEach(([label,value],i)=>{
        const x=M+i*(w+gap);
        d.rect(x,this.y,w,h,C.zebra,C.line,0.6);d.rect(x,this.y,w,2,i===0?C.orange:C.gold);
        d.text(clean(label).toUpperCase(),x+10,this.y+16,{f:'B',size:6.2,color:C.muted});
        let size=15;while(size>9&&textWidth(value,'S',size)>w-20)size-=1;
        d.text(value,x+10,this.y+36,{f:'S',size,color:tone(value)||C.ink});
      });
      this.y+=h+14;
    },
    table(headers,rows,o={}){
      const d=this.doc,size=o.size||7.6,pad=6,rh=o.rowH||15;
      const cols=headers.length;
      let widths=o.widths;
      if(!widths){
        widths=headers.map((h,c)=>Math.max(textWidth(h,'B',size),...rows.map(r=>textWidth(r.cells[c]||'',c===0?'B':'R',size)))+pad*2+(c===0?10:0));
        const total=widths.reduce((a,b)=>a+b,0),extra=this.CW-total;
        widths=extra>=0?widths.map((w,c)=>w+(c===0?extra*0.4:extra*0.6/Math.max(1,cols-1))):widths.map(w=>w*this.CW/total);
      }
      const align=c=>o.align?o.align[c]:(c===0?'left':'right');
      const head=()=>{
        d.rect(M,this.y,this.CW,rh+2,C.ink);
        let x=M;headers.forEach((h,c)=>{d.text(clean(h).toUpperCase(),align(c)==='right'?x+widths[c]-pad:x+pad,this.y+11,{f:'B',size:size-0.6,color:C.white,align:align(c)});x+=widths[c];});
        this.y+=rh+2;
      };
      this.room(rh*2+4);head();
      rows.forEach((r,i)=>{
        if(this.room(rh+2))head();
        const fill=r.total?C.total:r.sub?null:i%2?C.zebra:null;
        if(fill)d.rect(M,this.y,this.CW,rh,fill);
        let x=M;r.cells.forEach((v,c)=>{
          const bold=r.total||(c===0&&!r.sub);
          const color=c===0?(r.sub?C.muted:C.ink):(o.tone===false?(r.sub?C.muted:C.ink):tone(v)||(r.sub?C.muted:C.ink));
          if(c===0&&r.swatch)d.rect(x+pad,this.y+4,7,7,r.swatch);
          d.text(v,align(c)==='right'?x+widths[c]-pad:x+pad+(c===0&&r.swatch?11:0),this.y+rh/2+size*0.36,{f:bold?'B':r.sub?'I':'R',size:r.sub?size-0.4:size,color,align:align(c)});
          x+=widths[c];
        });
        d.line(M,this.y+rh,M+this.CW,this.y+rh,r.total?C.ink:C.line,r.total?0.8:0.4);
        this.y+=rh;
      });
      this.y+=12;
    },
    bars(rows){
      const d=this.doc,rh=17,lw=this.CW*0.36,tx=M+lw,tw=this.CW*0.5;
      rows.forEach((r,i)=>{
        this.room(rh+2);
        if(i%2)d.rect(M,this.y,this.CW,rh,C.zebra);
        d.text(r.label,M+6,this.y+11.5,{size:7.8});
        d.rect(tx,this.y+5,tw,7,C.total);
        d.rect(tx,this.y+5,Math.max(1.5,tw*Math.min(100,r.pct)/100),7,r.color||C.gold);
        d.text(r.value,M+this.CW-6,this.y+11.5,{f:'B',size:7.8,align:'right',color:tone(r.value)||C.ink});
        d.line(M,this.y+rh,M+this.CW,this.y+rh,C.line,0.4);
        this.y+=rh;
      });
      this.y+=12;
    },
    stack(parts){
      this.room(30);const d=this.doc;let x=M;
      parts.forEach(p=>{const w=this.CW*p.pct/100;d.rect(x,this.y,w,12,p.color);x+=w;});
      this.y+=20;
    },
    finish(){
      const d=this.doc,total=d.pages.length;
      d.pages.forEach((page,i)=>{
        d.page=page;
        d.line(M,d.H-54,d.W-M,d.H-54,C.ink,0.8);
        d.text(this.meta.footer||'Source: Point portfolio records. Past performance is not indicative of future results.',M,d.H-42,{size:6.6,color:C.muted});
        d.text('Confidential - for professional investors only. Do not copy. Do not distribute.',M,d.H-30,{f:'B',size:6.6,color:C.ink});
        d.text(`${i+1} / ${total}`,d.W-M,d.H-30,{size:7,color:C.muted,align:'right'});
      });
      return d.blob();
    }
  };
  function tone(v){
    const s=clean(v);
    if(/^\+\d/.test(s))return C.good;
    if(/^-\d|^\(\d/.test(s))return C.bad;
    return null;
  }

  /* ---------------- IR templates (read from the rendered pages, so saved edits are kept) ---------------- */
  const txt=el=>el?clean(el.textContent):'';
  const titleCase=s=>clean(s).toLowerCase().replace(/(^|[\s&/-])([a-z])/g,(m,a,b)=>a+b.toUpperCase());
  const sentence=s=>{const t=clean(s).toLowerCase().replace(/\b(ytd|qtd|mtd|itd|aum|tr|var|q[1-4])\b/g,w=>w.toUpperCase()).replace(/s&p/g,'S&P');return t.charAt(0).toUpperCase()+t.slice(1);};
  const widthOf=el=>{const m=/width:\s*([\d.]+)%/.exec(el?.getAttribute('style')||'');return m?parseFloat(m[1]):0;};
  function renderArticle(rep,article,fundName){
    const kicker=txt(article.querySelector('.tear-kicker')).split(/\s*·\s*/);
    const name=titleCase(kicker[0]||'Report'),period=titleCase(kicker[1]||'');
    rep.title(`${name} — ${fundName}${period?' — '+period:''}`);
    const kpiEls=[...article.querySelectorAll(':scope > .tear-kpis > div')];
    const kpis=kpiEls.map(k=>[txt(k.querySelector('span')),txt(k.querySelector('b'))]);
    const sub=txt(article.querySelector('.tear-title-row p'));
    const periodEl=article.querySelector('.tear-period'),periodLabel=periodEl?clean(periodEl.firstChild?.textContent||''):'',periodValue=txt(periodEl?.querySelector('b'));
    const period2=periodValue?`${sentence(periodLabel)}: ${/\d/.test(periodValue)?titleCase(periodValue):periodValue}.`:'';
    rep.callout(`${fundName} — ${sub}. ${kpis.map(([l,v])=>`${sentence(l)} ${v}`).join(' · ')}. ${period2}`);
    rep.kpis(kpis);
    article.querySelectorAll('.tear-block').forEach(block=>renderBlock(rep,block));
  }
  function renderBlock(rep,block){
    [...block.children].forEach(el=>{
      const cls=el.classList;
      if(el.tagName==='H3') rep.subhead(txt(el));
      else if(cls.contains('tear-table-wrap')||el.tagName==='TABLE'){
        const table=el.tagName==='TABLE'?el:el.querySelector('table');if(!table)return;
        const headers=[...table.querySelectorAll('thead th')].map(txt);
        const rows=[...table.querySelectorAll('tbody tr')].map(tr=>({cells:[...tr.children].map(txt)}));
        rep.table(headers,rows,{align:headers.map((h,c)=>c===0||rows.every(r=>!/\d/.test(r.cells[c]||''))?'left':'right')});
      }else if(el.tagName==='DL'){
        rep.table(['Metric','Value'],[...el.querySelectorAll('div')].map(r=>({cells:[txt(r.querySelector('dt')),txt(r.querySelector('dd'))]})),{tone:true});
      }else if(cls.contains('exposure-list')){
        rep.bars([...el.querySelectorAll('.exposure-row')].map(r=>({label:txt(r.querySelector('span')),value:txt(r.querySelector('b')),pct:widthOf(r.querySelector('i'))})));
      }else if(cls.contains('return-bars')){
        rep.bars([...el.children].map(r=>{const i=r.querySelector('i');return {label:txt(r.querySelector('span')),value:txt(r.querySelector('b')),pct:widthOf(i),color:i?.classList.contains('benchmark')?C.sage:i?.classList.contains('short')?'#9aa98f':C.gold};}));
      }else if(cls.contains('cap-stack')){
        rep.stack([...el.querySelectorAll('i')].map((i,k)=>({pct:widthOf(i),color:PALETTE[k%PALETTE.length]})));
      }else if(cls.contains('cap-legend')){
        rep.table(['Allocation','Weight'],[...el.children].map((r,k)=>({cells:[txt(r.querySelector('span')),txt(r.querySelector('b'))],swatch:PALETTE[k%PALETTE.length]})));
      }else if(cls.contains('attribution-list')){
        rep.table(['Component','Contribution'],[...el.children].map(r=>({cells:[txt(r.querySelector('span')),txt(r.querySelector('b'))],total:r.classList.contains('total')})));
      }else if(cls.contains('tear-callout')){
        rep.callout(`${sentence(txt(el.querySelector('span')))}: ${txt(el.querySelector('b'))} — ${txt(el.querySelector('small'))}`,{f:'B',size:8.5});
      }else if(cls.contains('tear-kpis')){
        rep.kpis([...el.children].map(k=>[txt(k.querySelector('span')),txt(k.querySelector('b'))]));
      }else if(txt(el)) rep.note(txt(el));
    });
  }
  const PALETTE=['#b88a17','#687f75','#aeb8a5','#8b7861','#d9532f'];
  function letterPage(rep,letterEl,fundName){
    rep.title(`Investor Letter — ${fundName}`);
    const blocks=[...letterEl.querySelectorAll('h1,h2,h3,h4,p,li')];
    const parts=blocks.length?blocks:[letterEl];
    parts.forEach(p=>{
      const t=txt(p);if(!t)return;
      if(/^H[1-4]$/.test(p.tagName)){rep.subhead(t);return;}
      const lines=rep.wrap(t,rep.CW,'R',9.2);
      lines.forEach(l=>{rep.room(14);rep.doc.text(l,M,rep.y+10,{size:9.2});rep.y+=13.5;});
      rep.y+=8;
    });
  }
  function templatesPdf({fundName,asOf,articles,letter}){
    const rep=new Report({subtitle:`IR & Reporting — ${fundName} — Investor reporting pack`,footer:`Data as of ${asOf}. Source: Point portfolio records. Past performance is not indicative of future results.`});
    articles.forEach((a,i)=>{if(i)rep.newPage();renderArticle(rep,a,fundName);});
    if(letter){rep.newPage();letterPage(rep,letter,fundName);}
    return rep.finish();
  }

  /* ---------------- monthly tear sheet model ---------------- */
  const MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const LONG=['January','February','March','April','May','June','July','August','September','October','November','December'];
  function pct(v,dp=2,sign){
    if(v==null||!isFinite(v))return '—';
    const s=(v*100).toFixed(dp);return (sign&&v>0?'+':'')+(s==='-0.00'?'0.00':s)+'%';
  }
  const compound=rs=>rs.reduce((g,r)=>g*(1+r),1)-1;
  const monthLabel=k=>`${LONG[+k.slice(5)-1]} ${k.slice(0,4)}`;
  const shortLabel=k=>`${MONTHS[+k.slice(5)-1]} ${k.slice(2,4)}`;
  const monthEnd=k=>{const y=+k.slice(0,4),m=+k.slice(5);return `${new Date(Date.UTC(y,m,0)).getUTCDate()} ${MONTHS[m-1]} ${y}`;};
  function stats(rs,rf){
    const n=rs.length;if(!n)return {};
    const cum=compound(rs),ann=Math.pow(1+cum,12/n)-1;
    const mean=rs.reduce((a,b)=>a+b,0)/n;
    const vol=Math.sqrt(rs.reduce((a,r)=>a+(r-mean)**2,0)/Math.max(1,n-1))*Math.sqrt(12);
    const down=Math.sqrt(rs.reduce((a,r)=>a+Math.min(0,r)**2,0)/n)*Math.sqrt(12);
    let w=1,peak=1,mdd=0;rs.forEach(r=>{w*=1+r;peak=Math.max(peak,w);mdd=Math.min(mdd,w/peak-1);});
    return {cum,ann,vol,down,mdd,sharpe:vol?(ann-rf)/vol:null,sortino:down?(ann-rf)/down:null,hit:rs.filter(r=>r>0).length/n};
  }
  function beta(a,b){
    const n=Math.min(a.length,b.length);if(n<3)return {beta:null,corr:null};
    const ma=a.reduce((s,x)=>s+x,0)/n,mb=b.reduce((s,x)=>s+x,0)/n;let cov=0,va=0,vb=0;
    for(let i=0;i<n;i++){cov+=(a[i]-ma)*(b[i]-mb);va+=(a[i]-ma)**2;vb+=(b[i]-mb)**2;}
    return {beta:vb?cov/vb:null,corr:va&&vb?cov/Math.sqrt(va*vb):null};
  }
  function tearsheet(data,fundId,month,extra){
    const f=data.funds[fundId]||data.funds.alpha;
    const all=f.months;month=all.some(m=>m.month===month)?month:all[all.length-1].month;
    const months=all.filter(m=>m.month<=month),keys=months.map(m=>m.month),rs=months.map(m=>m.r);
    const rf=data.riskFreeRate||0,year=month.slice(0,4),q=Math.floor((+month.slice(5)-1)/3);
    const inYear=k=>k.slice(0,4)===year&&k<=month,inQ=k=>inYear(k)&&Math.floor((+k.slice(5)-1)/3)===q;
    const benches=f.benchmarks.map(key=>{
      const b=data.benchmarks[key];const map=new Map(b.months.map(m=>[m.month,m.r]));
      const aligned=keys.map(k=>map.has(k)?map.get(k):0);
      return {key,name:b.name,symbol:b.symbol,source:b.source,asOf:b.asOf,rs:aligned,map,
        mtd:map.get(month),qtd:compound(keys.filter(inQ).map(k=>map.get(k)||0)),ytd:compound(keys.filter(inYear).map(k=>map.get(k)||0)),stats:stats(aligned,rf)};
    });
    const pick=pred=>compound(months.filter(m=>pred(m.month)).map(m=>m.r));
    const st=stats(rs,rf),rel=beta(rs,benches[0]?.rs||[]);
    const best=months.reduce((a,b)=>b.r>a.r?b:a),worst=months.reduce((a,b)=>b.r<a.r?b:a);
    const years=[...new Set(keys.map(k=>k.slice(0,4)))].sort().reverse();
    const grid=years.map(y=>{
      const row=MONTHS.map((_,i)=>{const k=`${y}-${String(i+1).padStart(2,'0')}`;const m=months.find(x=>x.month===k);return m?m.r:null;});
      const b=benches[0];const brow=MONTHS.map((_,i)=>{const k=`${y}-${String(i+1).padStart(2,'0')}`;return k<=month&&b.map.has(k)?b.map.get(k):null;});
      return {year:y,row,ytd:compound(row.filter(v=>v!=null)),bench:brow,benchYtd:compound(brow.filter(v=>v!=null))};
    });
    const ex=extra||{};
    const attr=(ex.attr||[]).slice().sort((a,b)=>Math.abs(parseFloat(b[1]))-Math.abs(parseFloat(a[1]))).slice(0,3);
    const pos=(ex.positions||[]).slice().sort((a,b)=>parseFloat(b[3])-parseFloat(a[3]));
    const drivers=attr.map(([name,value],i)=>{
      const up=parseFloat(value)>=0;
      // Lead driver cites the top contributing position; a detractor cites the weakest one.
      const p=i===0&&up?pos[0]:!up?pos[pos.length-1]:null;
      return {name,value,text:`${up?'Added':'Cost'} ${value.replace(/^[+-]/,'')} to quarter-to-date return.`+(p?` ${p[0]} (${p[1].toLowerCase()}, ${p[2]} weight) contributed ${p[3]}.`:'')};
    });
    return {
      fundId,name:f.name,strategy:f.strategy,aum:f.aum,net:f.net,gross:f.gross,longExp:ex.longExp,shortExp:ex.shortExp,
      month,monthLabel:monthLabel(month),asOf:monthEnd(month),availableMonths:all.map(m=>m.month),
      start:keys[0],startLabel:monthLabel(keys[0]),n:keys.length,rf,derived:f.derivedMonths||[],
      mtd:months[months.length-1].r,qtd:pick(inQ),ytd:pick(inYear),st,rel,best,worst,benches,grid,
      drivers,positions:ex.positions||[],generatedAt:data.generatedAt
    };
  }

  /* ---------------- monthly tear sheet markup ---------------- */
  const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const cls=v=>v==null?'':v>0?'up':v<0?'dn':'';
  function tearsheetHtml(m){
    const [b1,b2]=m.benches;
    const perfRows=[['MTD',m.mtd,b=>b.mtd],['QTD',m.qtd,b=>b.qtd],['YTD',m.ytd,b=>b.ytd],['ITD (ann.)',m.st.ann,b=>b.stats.ann]]
      .map(([k,v,g])=>`<tr><th>${k}</th><td class="${cls(v)}">${pct(v,2,true)}</td>${m.benches.map(b=>`<td class="${cls(g(b))}">${pct(g(b),2,true)}</td>`).join('')}</tr>`).join('');
    const risk=[['Annualized return',pct(m.st.ann,2,true)],['Annualized volatility',pct(m.st.vol)],['Downside volatility',pct(m.st.down)],['Max drawdown',pct(m.st.mdd)],[`Sharpe (rf ${pct(m.rf)})`,m.st.sharpe?.toFixed(2)],['Sortino',m.st.sortino?.toFixed(2)],[`Beta vs ${b1.name}`,m.rel.beta?.toFixed(2)],['Hit rate',pct(m.st.hit,1)]]
      .map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v??'—')}</dd></div>`).join('');
    const drivers=m.drivers.map((d,i)=>`<div class="ts-driver d${i}"><b>${esc(d.name)} <em class="${cls(parseFloat(d.value))}">${esc(d.value)}</em></b><p>${esc(d.text)}</p></div>`).join('');
    const head=['Year',...MONTHS,'YTD'].map(h=>`<th>${h}</th>`).join('');
    const cell=v=>`<td class="${cls(v)}">${v==null?'':pct(v,2)}</td>`;
    const grid=m.grid.map(g=>`<tr><th>${g.year}</th>${g.row.map(cell).join('')}<td class="ts-ytd ${cls(g.ytd)}">${pct(g.ytd,2)}</td></tr><tr class="ts-bench-row"><th>${esc(b1.name)}</th>${g.bench.map(cell).join('')}<td class="${cls(g.benchYtd)}">${pct(g.benchYtd,2)}</td></tr>`).join('');
    const positions=m.positions.map(p=>`<tr><th>${esc(p[0])}</th><td>${esc(p[1])}</td><td>${esc(p[2])}</td><td class="${cls(parseFloat(p[3]))}">${esc(p[3])}</td><td>${esc(p[4])}</td></tr>`).join('');
    const options=m.availableMonths.slice().reverse().map(k=>`<option value="${k}"${k===m.month?' selected':''}>${monthLabel(k)}</option>`).join('');
    const derived=m.derived.length?` Q4 monthly figures for ${[...new Set(m.derived.map(k=>k.slice(0,4)))].join(' and ')} are pro-rated from the reported calendar-year return.`:'';
    return `<div class="ts-toolbar"><h3>Tear sheet <span>${esc(MONTHS[+m.month.slice(5)-1])} ${m.month.slice(0,4)}</span></h3><label>PERIOD <select data-ts-period aria-label="Tear sheet period">${options}</select></label><button class="btn dark" type="button" data-ts-download>Download PDF</button><span class="ir-action-message" data-ts-message role="status" aria-live="polite"></span></div>
<article class="tear ts-sheet">
  <div class="tear-title-row"><div><div class="tear-kicker">MONTHLY TEAR SHEET &middot; ${esc(m.monthLabel.toUpperCase())}</div><h2>${esc(m.name)}</h2><p>${esc(m.strategy)} &middot; USD &middot; Net of fees</p></div><div class="tear-period">AS OF<br><b>${esc(m.asOf.toUpperCase())}</b><br><span class="ts-conf">Confidential &middot; institutional only</span></div></div>
  <div class="tear-kpis"><div><span>MTD RETURN</span><b class="${cls(m.mtd)}">${pct(m.mtd,2,true)}</b></div><div><span>YTD RETURN</span><b class="${cls(m.ytd)}">${pct(m.ytd,2,true)}</b></div><div><span>ITD &middot; ANNUALIZED</span><b class="${cls(m.st.ann)}">${pct(m.st.ann,2,true)}</b></div><div><span>FUND AUM</span><b>${esc(m.aum)}</b></div></div>
  <div class="tear-columns"><div class="tear-block"><h3>Performance snapshot (net of fees)</h3><div class="tear-table-wrap"><table class="tear-table"><thead><tr><th>Period</th><th>Portfolio</th>${m.benches.map(b=>`<th>${esc(b.name)}</th>`).join('')}</tr></thead><tbody>${perfRows}</tbody></table></div><p class="tear-footnote">ITD covers ${esc(m.startLabel)} – ${esc(m.monthLabel)} (${m.n} months), annualised.</p></div>
  <aside class="tear-block tear-side"><h3>Risk metrics</h3><dl>${risk}</dl></aside></div>
  <div class="tear-block"><h3>What drove performance</h3><div class="ts-drivers">${drivers}</div></div>
  <div class="tear-block"><h3>Monthly net % performance</h3><div class="tear-table-wrap"><table class="tear-table ts-grid-table"><thead><tr>${head}</tr></thead><tbody>${grid}</tbody></table></div></div>
  <div class="tear-columns"><div class="tear-block"><h3>Largest positions</h3><div class="tear-table-wrap"><table class="tear-table"><thead><tr><th>Position</th><th>Side</th><th>Weight</th><th>Contribution</th><th>Role</th></tr></thead><tbody>${positions}</tbody></table></div></div>
  <aside class="tear-block tear-side"><h3>Exposure &amp; diagnostics</h3><dl><div><dt>Long / short</dt><dd>${esc(m.longExp||'—')} / ${esc(m.shortExp||'—')}</dd></div><div><dt>Net / gross</dt><dd>${esc(m.net)} / ${esc(m.gross)}</dd></div><div><dt>Best month (${esc(shortLabel(m.best.month))})</dt><dd class="up">${pct(m.best.r,2,true)}</dd></div><div><dt>Worst month (${esc(shortLabel(m.worst.month))})</dt><dd class="dn">${pct(m.worst.r,2,true)}</dd></div><div><dt>Correlation vs ${esc(b1.name)}</dt><dd>${m.rel.corr==null?'—':m.rel.corr.toFixed(2)}</dd></div></dl></aside></div>
  <p class="tear-footnote">Fund returns are net of fees from Point portfolio records.${esc(derived)} Benchmark returns (${m.benches.map(b=>esc(b.name)).join(', ')}) are public market data from <a href="${esc(b1.source)}" target="_blank" rel="noopener">Yahoo Finance</a>, dividend-adjusted where applicable, retrieved ${esc(m.generatedAt.slice(0,10))}. Risk-free rate is the 13-week T-bill yield. Past performance is not indicative of future results.${b2?'':''}</p>
</article>`;
  }

  /* ---------------- monthly tear sheet PDF ---------------- */
  function tearsheetPdf(m){
    const [b1]=m.benches;
    const rep=new Report({subtitle:`Monthly Tear Sheet — ${m.name}`,footer:`Data as of ${m.asOf}. Sources: Point portfolio records; benchmarks via Yahoo Finance. Past performance is not indicative of future results.`});
    rep.title(`Monthly Tear Sheet — ${m.name} — ${m.monthLabel}`);
    rep.callout(`In ${m.monthLabel} ${m.name} returned ${pct(m.mtd,2,true)} net of fees versus ${pct(b1.mtd,2,true)} for the ${b1.name}. Year to date the fund is ${pct(m.ytd,2,true)} (${b1.name} ${pct(b1.ytd,2,true)}). Across ${m.n} months since ${m.startLabel} it has compounded at ${pct(m.st.ann,2)} annualised on ${pct(m.st.vol,2)} volatility — Sharpe (rf = ${pct(m.rf)}) of ${m.st.sharpe?.toFixed(2)}, max drawdown ${pct(m.st.mdd)}.`);
    rep.kpis([['MTD return',pct(m.mtd,2,true)],['YTD return',pct(m.ytd,2,true)],['ITD annualized',pct(m.st.ann,2,true)],['Fund AUM',m.aum]]);
    rep.subhead('Performance Snapshot (Net of Fees)');
    rep.table(['Period','Portfolio',...m.benches.map(b=>b.name)],[['MTD',m.mtd,b=>b.mtd],['QTD',m.qtd,b=>b.qtd],['YTD',m.ytd,b=>b.ytd],['ITD (cumulative)',m.st.cum,b=>b.stats.cum],['ITD (annualized)',m.st.ann,b=>b.stats.ann]].map(([k,v,g])=>({cells:[k,pct(v,2,true),...m.benches.map(b=>pct(g(b),2,true))]})));
    rep.subhead('Risk Metrics');
    rep.table(['Metric','Portfolio',...m.benches.map(b=>b.name)],[
      ['Annualized return',m.st.ann,'ann',1],['Annualized volatility',m.st.vol,'vol'],['Downside volatility',m.st.down,'down'],['Max drawdown',m.st.mdd,'mdd'],
      [`Sharpe ratio (rf = ${pct(m.rf)})`,m.st.sharpe,'sharpe',0,1],['Sortino ratio',m.st.sortino,'sortino',0,1],['Hit rate (% positive months)',m.st.hit,'hit']
    ].map(([k,v,key,sign,ratio])=>({cells:[k,ratio?(v==null?'—':v.toFixed(2)):pct(v,2,!!sign),...m.benches.map(b=>ratio?(b.stats[key]==null?'—':b.stats[key].toFixed(2)):pct(b.stats[key],2,!!sign))]})));
    rep.subhead('What Drove Performance');
    m.drivers.forEach((d,i)=>rep.callout(`${d.name} (${d.value}): ${d.text}`,{f:'R',size:8.2,bar:[C.orange,C.gold,C.sage][i%3]}));
    rep.subhead('Monthly Net % Performance');
    const rows=[];
    m.grid.forEach(g=>{
      rows.push({cells:[g.year,...g.row.map(v=>v==null?'':pct(v,2)),pct(g.ytd,2)]});
      rows.push({sub:true,cells:[b1.name,...g.bench.map(v=>v==null?'':pct(v,2)),pct(g.benchYtd,2)]});
    });
    rep.table(['Year',...MONTHS,'YTD'],rows,{size:6.6,rowH:14});
    if(m.positions.length){
      rep.subhead('Largest Positions');
      rep.table(['Position','Side','Weight','Contribution','Role'],m.positions.map(p=>({cells:p.slice(0,5)})),{align:['left','left','right','right','left']});
    }
    rep.subhead('Exposure & Diagnostics');
    rep.table(['Metric','Value'],[
      ['Long / short exposure',`${m.longExp||'—'} / ${m.shortExp||'—'}`],['Net / gross exposure',`${m.net} / ${m.gross}`],
      [`Best month (${monthLabel(m.best.month)})`,pct(m.best.r,2,true)],[`Worst month (${monthLabel(m.worst.month)})`,pct(m.worst.r,2,true)],
      [`Beta vs ${b1.name}`,m.rel.beta==null?'—':m.rel.beta.toFixed(2)],[`Correlation vs ${b1.name}`,m.rel.corr==null?'—':m.rel.corr.toFixed(2)],['Risk-free rate used',pct(m.rf)]
    ].map(c=>({cells:c})));
    const derived=m.derived.length?` Q4 monthly figures for ${[...new Set(m.derived.map(k=>k.slice(0,4)))].join(' and ')} are pro-rated from the reported calendar-year return.`:'';
    rep.note(`Net returns shown net of fees and expenses. Inception-to-date covers ${m.startLabel} through ${m.monthLabel}.${derived} Benchmark returns (${m.benches.map(b=>b.name).join(', ')}) are public market data retrieved from Yahoo Finance on ${m.generatedAt.slice(0,10)}, dividend-adjusted where applicable. Sharpe and Sortino use the 13-week T-bill yield as the risk-free rate. Hit rate = % of months with positive net returns.`);
    return rep.finish();
  }

  root.PointIRReports={templatesPdf,tearsheet,tearsheetHtml,tearsheetPdf};
})(typeof window!=='undefined'?window:globalThis);
