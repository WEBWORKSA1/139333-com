/* 139333.com — interactive tools UI */
(function(){
  const {$, $$}=window.$site; const LN=window.LN; if(!LN) return;
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

  function renderAnalysis(r,target,opts={}){
    if(!r){ target.innerHTML='<p class="form-status err" style="display:block">Please enter at least 3 digits.</p>'; target.classList.add("show"); return; }
    const digits=r.digits.map(x=>'<span class="d '+x.tone+'" title="'+esc(LN.DIGITS[x.d].sound)+'">'+x.d+'</span>').join("");
    const hits=r.hits.length?r.hits.map(h=>'<li class="'+h.tone+'"><span class="tag">'+h.code+'</span><span><b class="zh">'+esc(h.zh)+'</b> — '+esc(h.en)+'</span></li>').join(""):'<li><span>No classic combinations found — the score comes from individual digits and patterns.</span></li>';
    const pats=r.patterns.length?r.patterns.map(p=>'<span class="pill '+(p.bonus>0?"pos":"neg")+'">'+esc(p.name)+'</span>').join(" "):'<span class="muted small">No special pattern</span>';
    const perDigit=[...new Set(r.number.split(""))].sort().map(d=>{const i=LN.DIGITS[d];return '<tr><td><b>'+d+'</b> <span class="zh">'+i.zh+'</span></td><td>'+i.py+'</td><td>'+esc(i.sound)+'</td></tr>';}).join("");
    target.innerHTML=
      '<div class="score-wrap"><div class="gauge" style="--p:'+r.score+'"><b data-count="'+r.score+'">0</b><small>/ 100</small></div>'+
      '<div><span class="grade '+r.gradeClass+'">'+esc(r.grade)+'</span><h3 style="margin-top:10px">'+esc(r.number)+'</h3>'+
      '<div class="digits" aria-label="Digit tones">'+digits+'</div>'+
      '<p class="small muted">Green = auspicious sound · Red = avoided sound · Grey = neutral. Fours: <b>'+r.fours+'</b> · Eights: <b>'+r.eights+'</b> · Digit sum '+r.sum+' → '+r.reduced+'</p>'+
      '<div>'+pats+'</div></div></div>'+
      '<h3 style="margin-top:22px">Combinations detected</h3><ul class="hits">'+hits+'</ul>'+
      '<div class="sponsor-slot" style="margin:14px 0"><span><b>Value tier: '+r.tier.tier+'</b> · indicative '+esc(r.tier.range)+'</span><a class="btn btn-sm btn-primary" href="valuation.html?number='+r.number+'">Get a real valuation →</a></div>'+
      (opts.full?'<h3>Digit-by-digit reading</h3><div class="table-wrap"><table><thead><tr><th>Digit</th><th>Pinyin</th><th>Sounds like</th></tr></thead><tbody>'+perDigit+'</tbody></table></div>':
      '<div class="locked"><div class="blur"><h3>Digit-by-digit reading · zodiac fit · 3 better alternatives</h3><p>Full breakdown of each digit, how this number fits your zodiac sign, and three stronger numbers with the same prefix...</p></div>'+
      '<div style="margin-top:-40px;position:relative"><h3>🔓 Unlock the full report — free</h3><p class="small">We email you the full reading plus 3 stronger alternatives. No spam; unsubscribe anytime.</p>'+
      '<form data-form="Full report unlock" data-success="Done! Your full report is unlocked below, and a copy is on its way to your inbox."><input type="hidden" name="number" value="'+r.number+'"><input type="hidden" name="score" value="'+r.score+'">'+
      '<div class="row"><input name="email" type="email" required placeholder="you@email.com" aria-label="Email"><select name="zodiac" aria-label="Your zodiac"><option value="">Your zodiac (optional)</option>'+LN.ANIMALS.map(a=>'<option>'+a.en+'</option>').join("")+'</select></div>'+
      '<label class="check"><input type="checkbox" name="consent" value="yes" required> I agree to receive my report and occasional lucky-number tips.</label>'+
      '<button class="btn btn-gold btn-block" type="submit">Email me the full report</button></form></div></div>')+
      '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px"><button class="btn btn-ghost btn-sm" data-share-result>Share result</button><a class="btn btn-ghost btn-sm" href="services.html?service=source&pattern='+r.number.slice(-4)+'">Find me a luckier number</a><a class="btn btn-ghost btn-sm" href="services.html?service=sell&number='+r.number+'">Sell this number</a></div>'+
      '<p class="small muted" style="margin-top:12px">For culture and entertainment. Readings are based on common Mandarin/Cantonese homophones, which vary by region.</p>';
    target.classList.add("show");
    const c=target.querySelector("[data-count]"); let v=0; const end=r.score; const step=()=>{v=Math.min(end,v+Math.ceil(end/30)); c.textContent=v; if(v<end) requestAnimationFrame(step);}; step();
    // bind unlock form (dynamic)
    const f=target.querySelector("form[data-form]");
    if(f){ window.$site.bindForm&&window.$site.bindForm(f); f.addEventListener("sent",()=>renderAnalysis(r,target,{full:true})); }
    const sb=target.querySelector("[data-share-result]"); if(sb) sb.addEventListener("click",async()=>{const url=location.origin+location.pathname+"?n="+r.number; const t="My number "+r.number+" scored "+r.score+"/100 on 139333.com"; if(navigator.share){try{await navigator.share({title:t,url});}catch(e){}} else {try{await navigator.clipboard.writeText(t+" "+url); toast("Result link copied");}catch(e){}}});
  }

  /* Dynamic-form binding shim: reuse main.js submit logic by re-dispatching through a hidden clone pattern */
  window.$site.bindForm=function(f){
    if(!f.querySelector('[name="_honey"]')){const h=document.createElement("input");h.type="text";h.name="_honey";h.className="hp";h.tabIndex=-1;h.autocomplete="off";f.appendChild(h);}
    f.addEventListener("submit",async e=>{
      e.preventDefault(); if(!f.reportValidity()) return;
      const fd=new FormData(f); if(fd.get("_honey")) return; const data={}; fd.forEach((v,k)=>{if(k!=="_honey") data[k]=v;});
      data._subject="[139333.com] "+f.dataset.form+" — "+(data.email||""); data._template="table"; data._captcha="false"; data.page=location.href;
      const btn=f.querySelector('[type="submit"]'); btn.disabled=true; btn.textContent="Sending…";
      try{ await fetch("https://formsubmit.co/ajax/"+window.$site.inbox(),{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify(data)}); }catch(err){}
      if(window.gtag) gtag("event","generate_lead",{form:f.dataset.form});
      toast(f.dataset.success||"Sent!"); f.dispatchEvent(new CustomEvent("sent"));
    });
  };

  /* Analyzer */
  $$("[data-analyzer]").forEach(form=>{
    const out=$(form.dataset.analyzer);
    form.addEventListener("submit",e=>{e.preventDefault(); const val=form.querySelector("[name=number]").value;
      if(form.dataset.redirect){ location.href=form.dataset.redirect+"?n="+encodeURIComponent(LN.clean(val)); return; }
      renderAnalysis(LN.analyze(val),out); out.scrollIntoView({behavior:"smooth",block:"start"}); });
    const n=new URLSearchParams(location.search).get("n"); if(n&&!form.dataset.redirect){ form.querySelector("[name=number]").value=n; renderAnalysis(LN.analyze(n),out); }
  });

  /* Plate checker */
  const pf=$("#plateForm"); if(pf) pf.addEventListener("submit",e=>{e.preventDefault(); const raw=pf.plate.value.toUpperCase(); const digits=LN.clean(raw);
    const out=$("#plateOut"); if(digits.length<2){out.innerHTML='<p class="form-status err" style="display:block">Enter a plate with at least 2 digits.</p>';out.classList.add("show");return;}
    const r=LN.analyze(digits.length<3?digits.padStart(3,"0"):digits); renderAnalysis(r,out); const letters=raw.replace(/[^A-Z]/g,"");
    if(letters) out.insertAdjacentHTML("afterbegin",'<p class="callout small">Letters <b>'+esc(letters)+'</b> are ignored in Chinese number readings — only digits carry homophone meaning. Hong Kong\'s letter-only plates are a different market (the "R" plate sold for HK$25.5M in 2023).</p>');});

  /* Valuation */
  const vf=$("#valForm"); if(vf){ const run=()=>{const r=LN.analyze(vf.number.value); const out=$("#valOut"); if(!r){out.innerHTML='<p class="form-status err" style="display:block">Enter the full number.</p>';out.classList.add("show");return;}
      out.innerHTML='<div class="grid g3"><div class="card"><div class="stat-label">Pattern tier</div><div class="stat">'+r.tier.tier+'</div></div><div class="card"><div class="stat-label">Indicative band</div><div class="stat" style="font-size:1.5rem">'+esc(r.tier.range)+'</div></div><div class="card"><div class="stat-label">Luck score</div><div class="stat">'+r.score+'/100</div></div></div><p class="callout">'+esc(r.tier.note)+' This is a pattern band, not an appraisal. Operator rules, region, contract lock-ins and buyer demand change real prices a lot.</p><a class="btn btn-primary" href="#valLead">Get a human valuation &amp; buyer outreach →</a>';
      out.classList.add("show"); const h=$("#valLead [name=number]"); if(h) h.value=r.number; };
    vf.addEventListener("submit",e=>{e.preventDefault();run();}); if(vf.number.value) run(); }

  /* Generator */
  const gf=$("#genForm"); if(gf) gf.addEventListener("submit",e=>{e.preventDefault();
    const prefix=LN.clean(gf.prefix.value), len=+gf.length.value, avoid=LN.clean(gf.avoid.value).split(""), must=LN.clean(gf.must.value), count=+gf.count.value;
    const pool="0123456789".split("").filter(d=>!avoid.includes(d)); const out=$("#genOut");
    if(!pool.length||prefix.length+must.length>len){out.innerHTML='<p class="form-status err" style="display:block">Check your settings: too many digits avoided or prefix too long.</p>';out.classList.add("show");return;}
    const seen=new Set(), res=[]; let tries=0;
    while(res.length<count*25&&tries<20000){tries++; let body=""; const free=len-prefix.length-must.length; for(let i=0;i<free;i++) body+=pool[Math.floor(Math.random()*pool.length)];
      const n=prefix+(Math.random()<.5?body+must:body.slice(0,Math.floor(Math.random()*(free+1)))+must+body.slice(Math.floor(Math.random()*(free+1))));
      const nn=n.slice(0,len); if(nn.length!==len||seen.has(nn)) continue; seen.add(nn); res.push(LN.analyze(nn)); }
    res.sort((a,b)=>b.score-a.score); const top=res.slice(0,count);
    out.innerHTML='<div class="table-wrap"><table><thead><tr><th>#</th><th>Number</th><th>Score</th><th>Highlights</th><th></th></tr></thead><tbody>'+top.map((r,i)=>'<tr><td>'+(i+1)+'</td><td><b style="letter-spacing:.06em">'+r.number+'</b></td><td><span class="grade '+r.gradeClass+'">'+r.score+'</span></td><td class="small">'+(r.hits.slice(0,3).map(h=>h.code+' '+h.zh).join(" · ")||"—")+'</td><td><a class="btn btn-sm btn-ghost" href="analyzer.html?n='+r.number+'">Analyze</a></td></tr>').join("")+'</tbody></table></div><p class="small muted" style="margin-top:10px">These are generated patterns, not available numbers. Want one of these for real? <a href="services.html?service=source">Our concierge can source it</a>.</p>';
    out.classList.add("show"); });

  /* Zodiac */
  const zf=$("#zodiacForm"); if(zf) zf.addEventListener("submit",e=>{e.preventDefault(); const z=LN.zodiac(zf.year.value,zf.early.checked); const out=$("#zodiacOut");
    out.innerHTML='<div class="card" style="display:grid;grid-template-columns:auto 1fr;gap:20px;align-items:center"><div style="font-size:4.5rem;line-height:1">'+z.e+'</div><div><span class="eyebrow">'+z.year+' · '+z.element+' · '+z.yin+'</span><h2 style="margin:0">'+z.en+' <span class="zh">'+z.zh+'</span></h2><p class="muted">Traits: '+z.traits+'</p><p><b>Lucky numbers:</b> '+z.lucky.join(", ")+' · <a href="generator.html?must='+z.lucky.join("")+'">Generate numbers with them →</a></p></div></div>';
    out.classList.add("show"); });
  const cf=$("#compatForm"); if(cf){ const opts=LN.ANIMALS.map((a,i)=>'<option value="'+i+'">'+a.e+' '+a.en+' '+a.zh+'</option>').join(""); cf.a.innerHTML=opts; cf.b.innerHTML=opts; cf.b.value="4";
    cf.addEventListener("submit",e=>{e.preventDefault(); const r=LN.compat(+cf.a.value,+cf.b.value); const out=$("#compatOut");
      out.innerHTML='<div class="score-wrap"><div class="gauge" style="--p:'+r.score+'"><b>'+r.score+'</b><small>/ 100</small></div><div><h3>'+LN.ANIMALS[+cf.a.value].en+' + '+LN.ANIMALS[+cf.b.value].en+'</h3><p>'+esc(r.label)+'</p><p class="small muted">Based on the classical triads (三合), six harmonies (六合) and six clashes (六冲).</p></div></div>'; out.classList.add("show");}); }
  const zg=$("#zodiacGrid"); if(zg){ zg.innerHTML=LN.ANIMALS.map((a,i)=>{const years=[];for(let y=1924+i;y<=2043;y+=12) years.push(y); return '<div class="card"><div style="font-size:2.2rem">'+a.e+'</div><h3>'+a.en+' <span class="zh">'+a.zh+'</span></h3><p class="small muted">'+a.traits+'</p><p class="small"><b>Lucky:</b> '+a.lucky.join(", ")+'</p><p class="small muted">'+years.join(" · ")+'</p></div>';}).join(""); }

  /* Date checker */
  const df=$("#dateForm"); if(df) df.addEventListener("submit",e=>{e.preventDefault(); const out=$("#dateOut"); const vals=$$("input[type=date]",df).map(i=>i.value).filter(Boolean);
    if(!vals.length){out.innerHTML='<p class="form-status err" style="display:block">Pick at least one date.</p>';out.classList.add("show");return;}
    const days=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const rows=vals.map(v=>{const [y,m,d]=v.split("-"); const dt=new Date(+y,+m-1,+d); const r=LN.analyze(y+m+d); const short=LN.analyze((m+d).replace(/^0/,"")+"8"); let bonus=0, notes=[];
      if(/4/.test(m+d)){notes.push("contains 4 in month/day");} if(/8/.test(m+d)){notes.push("8 in month/day");bonus+=4;} if(+d===+m){notes.push("double date (e.g. 8/8, 9/9)");bonus+=6;}
      if((m+d)==="0520"||(m+d)==="0521"){notes.push("520 'I love you' day");bonus+=8;} if(dt.getDay()===0||dt.getDay()===6) notes.push("weekend — easier for guests");
      const s=Math.max(1,Math.min(99,r.score+bonus)); return {v,day:days[dt.getDay()],s,notes,r};}).sort((a,b)=>b.s-a.s);
    out.innerHTML='<div class="table-wrap"><table><thead><tr><th>Rank</th><th>Date</th><th>Score</th><th>Why</th></tr></thead><tbody>'+rows.map((x,i)=>'<tr><td>'+(i+1)+(i===0?' 🏆':'')+'</td><td><b>'+x.v+'</b><br><span class="small muted">'+x.day+'</span></td><td><span class="grade '+x.r.gradeClass+'">'+x.s+'</span></td><td class="small">'+(x.notes.join(" · ")||"—")+(x.r.hits.length?'<br>'+x.r.hits.slice(0,3).map(h=>h.code+' '+h.zh).join(" · "):'')+'</td></tr>').join("")+'</tbody></table></div><p class="small muted" style="margin-top:10px">Number-sound check only. Traditional almanac (黄历) date selection also uses the lunar calendar and your BaZi — <a href="services.html?service=report">order a personal date report</a>.</p>';
    out.classList.add("show"); });

  /* Dictionary */
  const dict=$("#dictTable"); if(dict){
    const rows=[...Object.entries(LN.DIGITS).map(([k,v])=>({code:k,zh:v.zh,en:v.sound,tone:v.tone==="neu"?"mix":v.tone,py:v.py})),...LN.COMBOS.map(c=>({code:c[0],zh:c[2],en:c[3],tone:c[4],py:""}))];
    const draw=(q="",t="all")=>{ const f=rows.filter(r=>(t==="all"||r.tone===t)&&(!q||r.code.includes(q)||r.en.toLowerCase().includes(q.toLowerCase())||r.zh.includes(q)));
      dict.innerHTML=f.map(r=>'<tr id="n-'+r.code+'"><td><b style="font-size:1.15rem">'+r.code+'</b></td><td class="zh">'+esc(r.zh)+(r.py?'<br><span class="small muted">'+r.py+'</span>':'')+'</td><td>'+esc(r.en)+'</td><td><span class="pill '+r.tone+'">'+({pos:"Lucky",neg:"Avoid",mix:"Mixed"})[r.tone]+'</span></td><td><a class="small" href="analyzer.html?n='+(r.code.length<3?r.code.padEnd(3,r.code):r.code)+'">Check →</a></td></tr>').join("")||'<tr><td colspan="5">No match. <a href="contact.html">Suggest a meaning</a>.</td></tr>';
      const c=$("#dictCount"); if(c) c.textContent=f.length+" entries"; };
    const qi=$("#dictQ"), ti=$("#dictT"); draw(); qi.addEventListener("input",()=>draw(qi.value,ti.value)); ti.addEventListener("change",()=>draw(qi.value,ti.value));
  }

  /* Number of the day */
  $$("[data-notd]").forEach(el=>{ const n=LN.numberOfDay(); const r=LN.analyze(n.length<3?n.repeat(3):n); const h=r.hits[0];
    el.innerHTML='<div class="big-number" style="font-size:3rem">'+n+'</div><p style="margin:.4em 0"><b class="zh">'+(h?esc(h.zh):"")+'</b> '+(h?"— "+esc(h.en):"")+'</p><a class="btn btn-sm btn-ghost" href="analyzer.html?n='+r.number+'">See full reading</a>'; });
})();
