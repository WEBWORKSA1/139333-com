/* 139333 Lucky Number Engine — transparent, rule-based scoring of Chinese number homophones.
   For culture & entertainment. Not financial, legal or fortune-telling advice. */
(function(){
  const DIGITS = {
    "0":{w:0, zh:"零", py:"líng", sound:"零 (zero) — wholeness, a fresh start", tone:"neu"},
    "1":{w:1, zh:"一 / 幺", py:"yī / yāo", sound:"要 yào (want, will) · 一 (first, unity)", tone:"pos"},
    "2":{w:2, zh:"二", py:"èr", sound:"易 yì (easy) · pairs & harmony (好事成双)", tone:"pos"},
    "3":{w:1.5, zh:"三", py:"sān", sound:"生 (life, growth) in Cantonese saam ≈ saang; can hint 散 (scatter)", tone:"pos"},
    "4":{w:-6, zh:"四", py:"sì", sound:"死 sǐ (death) — the most avoided digit", tone:"neg"},
    "5":{w:0.5, zh:"五", py:"wǔ", sound:"我 wǒ (me) · 无 wú (none) · Five Elements", tone:"neu"},
    "6":{w:3, zh:"六", py:"liù", sound:"流 liú (smooth, flowing) · 六六大顺", tone:"pos"},
    "7":{w:0, zh:"七", py:"qī", sound:"起 qǐ (rise) · 气 qì (anger) — mixed", tone:"neu"},
    "8":{w:5, zh:"八", py:"bā", sound:"发 fā (prosper, get rich) — the luckiest digit", tone:"pos"},
    "9":{w:3.5, zh:"九", py:"jiǔ", sound:"久 jiǔ (long-lasting) · the emperor's number", tone:"pos"}
  };

  // Common combinations (value = score impact). Sources: common homophone usage; readings vary by region.
  const COMBOS = [
    ["5201314",12,"我爱你一生一世","I love you for a lifetime","pos"],
    ["1314",8,"一生一世","one life, one world — forever","pos"],
    ["1688",9,"一路发发","prosper all the way, doubled","pos"],
    ["168",7,"一路发","prosperity all the way","pos"],
    ["518",7,"我要发","I will prosper","pos"],
    ["918",6,"就要发","about to prosper","pos"],
    ["138",5,"一生发","a lifetime of prosperity","pos"],
    ["139",4,"要生久","(folk reading) wishing long life — also China Mobile's first GSM prefix","pos"],
    ["333",5,"生生生","growth, growth, growth (Cantonese reading)","pos"],
    ["520",5,"我爱你","I love you","pos"],
    ["521",4,"我爱你","I love you (variant)","pos"],
    ["8888",14,"发发发发","quadruple prosperity","pos"],
    ["888",10,"发发发","triple prosperity","pos"],
    ["88",5,"发发","double prosperity / 爸爸","pos"],
    ["6666",10,"六六大顺","everything goes smoothly","pos"],
    ["666",8,"六六六","smooth; also 'awesome' in net slang","pos"],
    ["66",4,"顺顺","double smoothness","pos"],
    ["9999",11,"久久久久","eternal","pos"],
    ["999",8,"久久久","long, long lasting","pos"],
    ["99",4,"久久","long-lasting (popular for weddings)","pos"],
    ["28",4,"易发","easy prosperity","pos"],
    ["68",4,"路发","road to wealth","pos"],
    ["58",3,"我发","I prosper","pos"],
    ["18",3,"要发","will prosper","pos"],
    ["16",2,"要顺","will go smoothly","pos"],
    ["89",3,"发久","lasting prosperity","pos"],
    ["69",2,"顺久","smooth and lasting","pos"],
    ["13",1,"实生","(Cantonese) sure to grow","pos"],
    ["33",2,"生生","(Cantonese) life & growth","pos"],
    ["748",-12,"去死吧","'go die' — strongly avoided","neg"],
    ["514",-9,"我要死","'I will die'","neg"],
    ["1414",-10,"要死要死","'want to die' repeated","neg"],
    ["14",-6,"要死","'want to die' (很多楼层跳过14)","neg"],
    ["74",-5,"气死","'furious to death'","neg"],
    ["54",-4,"我死 / 无事","'I die' (sometimes 'no trouble')","neg"],
    ["44",-6,"死死","double death","neg"],
    ["250",-6,"二百五","'idiot' — insult","neg"],
    ["38",-3,"三八","insult for a gossip (context dependent)","neg"],
    ["94",-4,"就死","'then die'","neg"],
    ["24",-3,"易死","'easy to die'","neg"],
    ["64",-3,"流死","negative flow","neg"],
    ["84",-4,"发死","'prosper-die' — cancels 8","neg"]
  ];

  function clean(s){ return String(s||"").replace(/\D/g,""); }

  function patterns(n){
    const out=[]; if(!n) return out;
    const tail=n.slice(-6);
    const m=tail.match(/(\d)\1{2,}$/);
    if(m){ const len=m[0].length; out.push({name:len>=5?"Leopard tail (AAAAA+)":len===4?"Quad tail (AAAA)":"Triple tail (AAA)",bonus:len*3+(["8","9","6"].includes(m[1])?len*2:0),len}); }
    const all=n.match(/(\d)\1{2,}/g)||[];
    if(!m && all.length) out.push({name:"Repeated run ("+all[0]+")",bonus:3});
    if(/(\d\d)\1$/.test(tail)) out.push({name:"ABAB tail",bonus:5});
    if(/(\d)\1(\d)\2$/.test(tail)&&!m) out.push({name:"AABB tail",bonus:5});
    if(/(\d)(\d)\2\1$/.test(tail)) out.push({name:"Mirror tail (ABBA)",bonus:4});
    const seqUp=/(012|123|234|345|456|567|678|789)$/.test(tail), seqDn=/(987|876|765|654|543|432|321|210)$/.test(tail);
    if(seqUp) out.push({name:"Rising straight (步步高)",bonus:5});
    if(seqDn) out.push({name:"Falling straight",bonus:-2});
    return out;
  }

  function analyze(input){
    const n=clean(input);
    if(n.length<3) return null;
    let score=50; const hits=[]; const used=new Array(n.length).fill(false);
    // Combos (longest first) — later positions weigh more (the tail is what people remember).
    const sorted=[...COMBOS].sort((a,b)=>b[0].length-a[0].length);
    sorted.forEach(([c,val,zh,en,tone])=>{
      let i=n.indexOf(c);
      while(i!==-1){
        const overlap=used.slice(i,i+c.length).some(Boolean);
        if(!overlap){
          const pos=(i+c.length)/n.length; const weight=0.6+0.8*pos;
          score+=val*weight; hits.push({code:c,zh,en,tone,at:i});
          for(let k=i;k<i+c.length;k++) used[k]=true;
        }
        i=n.indexOf(c,i+1);
      }
    });
    // Individual digits
    const digits=n.split("").map((d,i)=>{
      const info=DIGITS[d]; const pos=(i+1)/n.length; const weight=(i>=n.length-4)?1.4:0.55;
      if(!used[i]) score+=info.w*weight*0.9; else score+=info.w*weight*0.3;
      return {d,tone:info.tone,pos};
    });
    const fours=(n.match(/4/g)||[]).length, eights=(n.match(/8/g)||[]).length;
    if(fours===0){ score+=6; }
    if(n.slice(-1)==="4"&&!used[n.length-1]) score-=8;
    if(n.slice(-1)==="8"||n.slice(-1)==="9") score+=4;
    const pats=patterns(n); pats.forEach(p=>score+=p.bonus);
    // digit sum (reduced) — folk numerology add-on
    let sum=n.split("").reduce((a,b)=>a+ +b,0), red=sum; while(red>9) red=String(red).split("").reduce((a,b)=>a+ +b,0);
    score=Math.max(1,Math.min(99,Math.round(score)));
    const grade=score>=85?["Supreme 大吉","good"]:score>=70?["Very lucky 吉","good"]:score>=55?["Favourable 小吉","mid"]:score>=40?["Neutral 平","mid"]:["Unfavourable 凶","bad"];
    return {number:n,score,grade:grade[0],gradeClass:grade[1],digits,hits:hits.sort((a,b)=>a.at-b.at),patterns:pats,fours,eights,sum,reduced:red,tier:valueTier(n,pats)};
  }

  // Indicative pattern tier (NOT an appraisal). Based on publicly reported auction patterns.
  function valueTier(n,pats){
    const tail=n.slice(-8); let run=0; const m=tail.match(/(\d)\1+$/); if(m) run=m[0].length;
    const d=m?m[1]:"";
    const premium=["8","9","6"].includes(d);
    if(run>=6||(run>=5&&premium)) return {tier:"Legendary",range:"¥500,000+ (US$70k+)",note:"Comparable to record auctions (e.g. five-8 tails sold for ~¥2.25M in 2020)."};
    if(run===5||(run===4&&premium)) return {tier:"Platinum",range:"¥50,000 – ¥500,000",note:"Quad/quint tails of 8, 9 or 6 regularly draw many bidders at court auctions."};
    if(run===4||/(1688|5201314|1314|8888)$/.test(n)) return {tier:"Gold",range:"¥5,000 – ¥50,000",note:"Strong, memorable pattern with broad demand."};
    if(run===3||pats.some(p=>/ABAB|AABB|Rising|Mirror/.test(p.name))||/(168|518|888|999|666)$/.test(n)) return {tier:"Silver",range:"¥500 – ¥5,000",note:"Entry premium tier — e.g. an 888 tail sold for ¥32,300 in one court auction; most AAA tails trade far lower."};
    return {tier:"Standard",range:"Face value – ¥500",note:"No premium pattern detected. Value is mostly personal meaning."};
  }

  // Zodiac
  const ANIMALS=[
    {en:"Rat",zh:"鼠",e:"🐀",lucky:[2,3],traits:"quick-witted, resourceful, versatile"},
    {en:"Ox",zh:"牛",e:"🐂",lucky:[1,4],traits:"diligent, dependable, determined"},
    {en:"Tiger",zh:"虎",e:"🐅",lucky:[1,3,4],traits:"brave, confident, competitive"},
    {en:"Rabbit",zh:"兔",e:"🐇",lucky:[3,4,6],traits:"gentle, elegant, responsible"},
    {en:"Dragon",zh:"龙",e:"🐉",lucky:[1,6,7],traits:"confident, ambitious, charismatic"},
    {en:"Snake",zh:"蛇",e:"🐍",lucky:[2,8,9],traits:"wise, enigmatic, intuitive"},
    {en:"Horse",zh:"马",e:"🐎",lucky:[2,3,7],traits:"energetic, independent, warm"},
    {en:"Goat",zh:"羊",e:"🐐",lucky:[2,7],traits:"calm, gentle, creative"},
    {en:"Monkey",zh:"猴",e:"🐒",lucky:[4,9],traits:"sharp, curious, playful"},
    {en:"Rooster",zh:"鸡",e:"🐓",lucky:[5,7,8],traits:"observant, hardworking, courageous"},
    {en:"Dog",zh:"狗",e:"🐕",lucky:[3,4,9],traits:"loyal, honest, prudent"},
    {en:"Pig",zh:"猪",e:"🐖",lucky:[2,5,8],traits:"compassionate, generous, diligent"}
  ];
  const ELEMENTS=["Metal 金","Metal 金","Water 水","Water 水","Wood 木","Wood 木","Fire 火","Fire 火","Earth 土","Earth 土"];
  function zodiac(year,beforeLNY){
    let y=+year; if(beforeLNY) y-=1;
    const a=ANIMALS[((y-1900)%12+12)%12];
    return Object.assign({year:y,element:ELEMENTS[y%10],yin:y%2?"Yin 阴":"Yang 阳",index:((y-1900)%12+12)%12},a);
  }
  const TRIADS=[[0,4,8],[1,5,9],[2,6,10],[3,7,11]];
  const HARMONY=[[0,1],[2,11],[3,10],[4,9],[5,8],[6,7]];
  const CLASH=[[0,6],[1,7],[2,8],[3,9],[4,10],[5,11]];
  function compat(a,b){
    const has=(list)=>list.some(g=>g.includes(a)&&g.includes(b)&&(a!==b||g.length>2));
    if(HARMONY.some(p=>(p[0]===a&&p[1]===b)||(p[1]===a&&p[0]===b))) return {score:95,label:"Six Harmonies 六合 — natural allies"};
    if(TRIADS.some(t=>t.includes(a)&&t.includes(b))&&a!==b) return {score:88,label:"Triad 三合 — shared outlook"};
    if(CLASH.some(p=>(p[0]===a&&p[1]===b)||(p[1]===a&&p[0]===b))) return {score:35,label:"Clash 六冲 — opposite energies, needs effort"};
    if(a===b) return {score:70,label:"Same sign — mirror match"};
    return {score:60,label:"Neutral — depends on the people, not the stars"};
  }

  // Deterministic "number of the day"
  function numberOfDay(date){
    const d=date||new Date(); const seed=d.getFullYear()*372+d.getMonth()*31+d.getDate();
    const pool=["168","518","888","1314","139333","666","999","520","8888","1688","918","28","68","9","6","8","369","789","1668","5188","333","6688","8899","3388","1398","2828"];
    return pool[seed%pool.length];
  }

  window.LN={DIGITS,COMBOS,analyze,valueTier,zodiac,ANIMALS,compat,numberOfDay,clean,patterns};
})();
