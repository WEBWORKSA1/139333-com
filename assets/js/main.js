/* 139333.com — core site behaviour */
(function(){
  const C=window.SITE_CONFIG||{};
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const inbox=()=>String.fromCharCode(...(C._k||[]).map(c=>c^(C._x||0)));
  window.$site={$, $$, inbox};

  /* Theme */
  const root=document.documentElement;
  try{const t=localStorage.getItem("theme"); if(t) root.setAttribute("data-theme",t);}catch(e){}
  $$("[data-theme-toggle]").forEach(b=>b.addEventListener("click",()=>{
    const dark=root.getAttribute("data-theme")==="dark"||(!root.getAttribute("data-theme")&&matchMedia("(prefers-color-scheme: dark)").matches);
    const next=dark?"light":"dark"; root.setAttribute("data-theme",next);
    try{localStorage.setItem("theme",next);}catch(e){}
  }));

  /* Mobile menu */
  const burger=$(".burger"), menu=$(".menu");
  if(burger&&menu) burger.addEventListener("click",()=>{const o=menu.classList.toggle("open"); burger.setAttribute("aria-expanded",o);});

  /* Toast */
  window.toast=function(msg){let t=$(".toast"); if(!t){t=document.createElement("div");t.className="toast";t.setAttribute("role","status");document.body.appendChild(t);} t.textContent=msg;t.classList.add("show");clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove("show"),2600);};

  /* Reveal on scroll */
  if("IntersectionObserver" in window){
    const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target);}}),{threshold:.12});
    $$(".reveal").forEach(el=>io.observe(el));
  } else $$(".reveal").forEach(el=>el.classList.add("in"));

  /* Back to top */
  const tt=$(".to-top"); if(tt){addEventListener("scroll",()=>tt.classList.toggle("show",scrollY>700),{passive:true}); tt.addEventListener("click",()=>scrollTo({top:0}));}

  /* Cookie consent + AdSense / GA loader */
  function loadThirdParty(){
    if(C.adsenseClient){
      const s=document.createElement("script"); s.async=true; s.crossOrigin="anonymous";
      s.src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client="+C.adsenseClient; document.head.appendChild(s);
      $$(".ad-slot").forEach(slot=>{
        const key=slot.dataset.slot||"inContent"; slot.classList.add("live"); slot.innerHTML="";
        const ins=document.createElement("ins"); ins.className="adsbygoogle"; ins.style.display="block";
        ins.setAttribute("data-ad-client",C.adsenseClient); if(C.adSlots&&C.adSlots[key]) ins.setAttribute("data-ad-slot",C.adSlots[key]);
        ins.setAttribute("data-ad-format","auto"); ins.setAttribute("data-full-width-responsive","true"); slot.appendChild(ins);
        try{(window.adsbygoogle=window.adsbygoogle||[]).push({});}catch(e){}
      });
    }
    if(C.ga4){
      const g=document.createElement("script"); g.async=true; g.src="https://www.googletagmanager.com/gtag/js?id="+C.ga4; document.head.appendChild(g);
      window.dataLayer=window.dataLayer||[]; window.gtag=function(){dataLayer.push(arguments);}; gtag("js",new Date()); gtag("config",C.ga4);
    }
  }
  let consent=null; try{consent=localStorage.getItem("consent");}catch(e){}
  const ck=$(".cookie");
  if(consent==="yes") loadThirdParty();
  else if(consent!=="no"&&ck){ ck.classList.add("show"); }
  $$("[data-consent]").forEach(b=>b.addEventListener("click",()=>{
    const v=b.dataset.consent; try{localStorage.setItem("consent",v);}catch(e){} ck&&ck.classList.remove("show"); if(v==="yes") loadThirdParty();
  }));

  /* Lazy YouTube (privacy-enhanced) */
  $$(".video[data-id]").forEach(v=>{
    const id=v.dataset.id;
    v.innerHTML='<img loading="lazy" alt="" src="https://i.ytimg.com/vi/'+id+'/hqdefault.jpg"><div class="play"><span aria-hidden="true">▶</span></div>';
    v.setAttribute("role","button"); v.setAttribute("tabindex","0"); v.setAttribute("aria-label","Play video: "+(v.dataset.title||"video"));
    const play=()=>{v.innerHTML='<iframe src="https://www.youtube-nocookie.com/embed/'+id+'?autoplay=1&rel=0" title="'+(v.dataset.title||"YouTube video")+'" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';};
    v.addEventListener("click",play); v.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();play();}});
  });

  /* Forms — every form posts to the private inbox via FormSubmit (address never in the page) */
  async function sendForm(form){
    const status=form.querySelector(".form-status")||(()=>{const d=document.createElement("div");d.className="form-status";d.setAttribute("role","status");form.appendChild(d);return d;})();
    const fd=new FormData(form);
    if(fd.get("_honey")) return; // bot
    const data={}; fd.forEach((v,k)=>{ if(k==="_honey") return; data[k]=data[k]?data[k]+", "+v:v; });
    data._subject="[139333.com] "+(form.dataset.form||"Inquiry")+" — "+(data.name||data.email||"new lead");
    data._template="table"; data._captcha="false";
    data.page=location.href; data.submitted=new Date().toISOString();
    const btn=form.querySelector('[type="submit"]'); if(btn){btn.disabled=true; btn.dataset.t=btn.textContent; btn.textContent="Sending…";}
    try{
      const r=await fetch("https://formsubmit.co/ajax/"+inbox(),{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify(data)});
      if(!r.ok) throw new Error("bad");
      status.className="form-status ok"; status.textContent=form.dataset.success||"Thank you — we received your request and will reply within 24–48 hours.";
      form.reset(); form.dispatchEvent(new CustomEvent("sent"));
      if(window.gtag) gtag("event","generate_lead",{form:form.dataset.form});
    }catch(e){
      status.className="form-status err";
      status.innerHTML='We could not send automatically. <a href="#" data-mail>Click here to email us instead</a>.';
      const a=status.querySelector("[data-mail]"); a.addEventListener("click",ev=>{ev.preventDefault();
        const body=Object.entries(data).filter(([k])=>!k.startsWith("_")).map(([k,v])=>k+": "+v).join("\n");
        location.href="mailto:"+inbox()+"?subject="+encodeURIComponent(data._subject)+"&body="+encodeURIComponent(body);});
    }finally{ if(btn){btn.disabled=false; btn.textContent=btn.dataset.t;} }
  }
  $$("form[data-form]").forEach(f=>{
    if(!f.querySelector('[name="_honey"]')){const h=document.createElement("input");h.type="text";h.name="_honey";h.className="hp";h.tabIndex=-1;h.autocomplete="off";h.setAttribute("aria-hidden","true");f.appendChild(h);}
    f.addEventListener("submit",e=>{e.preventDefault(); if(!f.reportValidity()) return; sendForm(f);});
  });
  /* Generic "email us" links — address assembled only on click */
  $$("[data-mailto]").forEach(a=>a.addEventListener("click",e=>{e.preventDefault(); location.href="mailto:"+inbox()+"?subject="+encodeURIComponent(a.dataset.mailto||"139333.com inquiry");}));

  /* Multi-step forms */
  $$("[data-steps]").forEach(form=>{
    const steps=$$(".step",form), bars=$$(".steps span",form); let i=0;
    const show=n=>{i=n; steps.forEach((s,k)=>s.classList.toggle("on",k===i)); bars.forEach((b,k)=>b.classList.toggle("on",k<=i));};
    $$("[data-next]",form).forEach(b=>b.addEventListener("click",()=>{
      const inputs=$$("input,select,textarea",steps[i]); for(const el of inputs){ if(!el.checkValidity()){el.reportValidity();return;} }
      show(Math.min(i+1,steps.length-1));}));
    $$("[data-prev]",form).forEach(b=>b.addEventListener("click",()=>show(Math.max(i-1,0))));
    form.addEventListener("sent",()=>show(0)); show(0);
  });

  /* Prefill from query (?service=sell&number=...) */
  const q=new URLSearchParams(location.search);
  q.forEach((v,k)=>{ $$('[name="'+k+'"]').forEach(el=>{ if(el.type==="radio"){ if(el.value===v) el.checked=true; } else if(!el.value) el.value=v; }); });

  /* Donations */
  const D=C.donate||{}; let amount=88;
  $$(".amounts button").forEach(b=>b.addEventListener("click",()=>{$$(".amounts button").forEach(x=>x.classList.remove("on")); b.classList.add("on"); amount=+b.dataset.amt||0; const c=$("#customAmt"); if(c) c.value=amount||"";}));
  const ca=$("#customAmt"); if(ca) ca.addEventListener("input",()=>{amount=+ca.value||0; $$(".amounts button").forEach(x=>x.classList.remove("on"));});
  $$("[data-donate]").forEach(b=>{
    const kind=b.dataset.donate;
    if(kind==="paypal"&&!D.paypal) b.style.display="none";
    if(kind==="stripe"&&!D.stripeLink) b.style.display="none";
    if(kind==="bmc"&&!D.buyMeACoffee) b.style.display="none";
    if(kind==="kofi"&&!D.kofi) b.style.display="none";
    b.addEventListener("click",()=>{
      const monthly=$("#monthly")&&$("#monthly").checked;
      let url="";
      if(kind==="paypal"){
        const p=new URLSearchParams({business:inbox(),currency_code:D.currency||"USD",item_name:(monthly?"Monthly support":"Support")+" — 139333.com operations"}); if(amount) p.set("amount",amount);
        url="https://www.paypal.com/donate/?"+p.toString();
      }
      if(kind==="stripe") url=D.stripeLink; if(kind==="bmc") url=D.buyMeACoffee; if(kind==="kofi") url=D.kofi;
      if(url) window.open(url,"_blank","noopener");
    });
  });
  const pg=$("[data-goal]"); if(pg&&D.goal){ const pct=Math.min(100,Math.round((D.raised||0)/D.goal*100)); pg.querySelector("i").style.width=Math.max(pct,2)+"%"; const l=$("[data-goal-label]"); if(l) l.textContent="$"+(D.raised||0).toLocaleString()+" of $"+D.goal.toLocaleString()+" yearly operations goal ("+pct+"%)"; }

  /* Countdown */
  $$("[data-countdown]").forEach(el=>{
    const end=new Date(el.dataset.countdown).getTime();
    const tick=()=>{let s=Math.max(0,Math.floor((end-Date.now())/1000)); const d=Math.floor(s/86400); s%=86400; const h=Math.floor(s/3600); s%=3600; const m=Math.floor(s/60); s%=60;
      el.innerHTML=[[d,"days"],[h,"hrs"],[m,"min"],[s,"sec"]].map(([v,l])=>'<div><b>'+String(v).padStart(2,"0")+'</b><span>'+l+'</span></div>').join("");};
    tick(); setInterval(tick,1000);
  });

  /* Share + referral link */
  $$("[data-share]").forEach(b=>b.addEventListener("click",async()=>{
    const url=b.dataset.share||location.href; const title=document.title;
    if(navigator.share){try{await navigator.share({title,url});}catch(e){}} else {try{await navigator.clipboard.writeText(url); toast("Link copied");}catch(e){prompt("Copy this link:",url);}}
  }));

  /* Exit-intent lead magnet (desktop, once per 7 days) */
  const modal=$("#leadModal");
  if(modal){
    let shown=false; let last=0; try{last=+localStorage.getItem("lm")||0;}catch(e){}
    const open=()=>{ if(shown||Date.now()-last<6048e5) return; shown=true; modal.classList.add("show"); try{localStorage.setItem("lm",Date.now());}catch(e){} };
    document.addEventListener("mouseout",e=>{ if(!e.relatedTarget&&e.clientY<8) open(); });
    setTimeout(()=>{ if(scrollY>1600) open(); },45000);
    $$("[data-close]",modal).forEach(b=>b.addEventListener("click",()=>modal.classList.remove("show")));
    modal.addEventListener("click",e=>{ if(e.target===modal) modal.classList.remove("show"); });
    addEventListener("keydown",e=>{ if(e.key==="Escape") modal.classList.remove("show"); });
  }

  /* Year */
  $$("[data-year]").forEach(e=>e.textContent=new Date().getFullYear());
})();
