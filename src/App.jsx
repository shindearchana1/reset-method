import { useState, useEffect, useRef } from "react";

async function subscribeToBrevo(email) {
  const res = await fetch("/api/subscribe", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ email }) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "failed");
  return data;
}
async function callResetAI(step, situation, emotion = "") {
  const res = await fetch("/api/reset", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ step, situation, emotion }) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.fallback) return null;
  return data.data;
}

const T = {
  bg:"#3D2B18", bgWarm:"#F5EBD8", card:"rgba(255,235,195,0.07)", border:"rgba(255,235,195,0.11)",
  cream:"#F5EFE6", muted:"rgba(245,239,230,0.45)", faint:"rgba(245,239,230,0.18)",
  gold:"#D4A853", goldBg:"rgba(212,168,83,0.08)", goldBd:"rgba(212,168,83,0.22)",
  rose:"#C97B6E", roseBg:"rgba(201,123,110,0.08)", roseBd:"rgba(201,123,110,0.22)",
  sage:"#7BA68A", sageBg:"rgba(123,166,138,0.08)", sageBd:"rgba(123,166,138,0.22)",
  sky:"#7A9EBF",  skyBg:"rgba(122,158,191,0.08)",  skyBd:"rgba(122,158,191,0.22)",
  sand:"#C4A87A", sandBg:"rgba(196,168,122,0.08)", sandBd:"rgba(196,168,122,0.22)",
  lav:"#9E8FB5",
};
const SC = {
  1:{color:T.gold,bg:T.goldBg,bd:T.goldBd}, 2:{color:T.sky,bg:T.skyBg,bd:T.skyBd},
  3:{color:T.rose,bg:T.roseBg,bd:T.roseBd}, 4:{color:T.sand,bg:T.sandBg,bd:T.sandBd},
  5:{color:T.sage,bg:T.sageBg,bd:T.sageBd},
};
const DEPTH = {
  1:{k:"Manomaya Kosha",sk:"मनोमय कोश",w:"The Vedantic tradition identified this as the mind sheath — the layer where thoughts, stories, and beliefs live. What you are doing right now is exactly what Patanjali called witnessing the vrittis — the thought-waves of the mind. Seeing them clearly is the first act of freedom.",s:"Aaron Beck's CBT (1960s) — separating facts from cognitive distortions. 50+ years of clinical evidence show this single act measurably reduces anxiety."},
  2:{k:"Manomaya Kosha",sk:"मनोमय कोश",w:"Epictetus wrote 2,000 years ago: 'Some things are in our control, others are not.' The Stoics built an entire philosophy of freedom on this distinction. The Bhagavad Gita calls it nishkama karma — acting from your circle of power, releasing the rest to the universe.",s:"Acceptance and Commitment Therapy (ACT) — sorting controllables from uncontrollables measurably reduces anxiety within a single session."},
  3:{k:"Vijnanamaya Kosha",sk:"विज्ञानमय कोश",w:"The Vijnanamaya Kosha is the wisdom sheath — the seat of emotion and felt sense. Ancient seers understood that naming what you feel is the beginning of moving through it. They called this viveka — discernment. The emotion is not the enemy. It is information.",s:"Matthew Lieberman, UCLA (2007): naming an emotion reduces amygdala activity measurably. This is neuroscience, not self-help."},
  4:{k:"Vijnanamaya Kosha",sk:"विज्ञानमय कोश",w:"The Bhagavad Gita's central teaching is this: act. Not from fear, not from ego — from discernment. One conscious action from clarity is worth a thousand reactions from anxiety. Discernment becoming movement is the Vijnanamaya Kosha doing what it was designed to do.",s:"Behavioral Activation — evidence-based for anxiety and depression. One small specific immediate action breaks the neural paralysis loop."},
  5:{k:"Pranamaya Kosha",sk:"प्राणमय कोश",w:"Prana is life force — the breath that connects mind and body. Pranayama, the ancient science of breath, understood what Western medicine only confirmed recently: that how you breathe directly regulates your nervous system. Slow exhalation is the oldest medicine.",s:"Polyvagal Theory (Stephen Porges) — slow exhalation activates the vagus nerve, shifting the nervous system from threat state to safety state."},
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=DM+Sans:wght@300;400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{background:#3D2B18;color:#F5EFE6;font-family:'DM Sans',sans-serif;font-weight:300;-webkit-font-smoothing:antialiased;}
textarea,input{font-family:'DM Sans',sans-serif;outline:none;}
textarea::placeholder,input::placeholder{color:rgba(245,239,230,0.22);}
button{font-family:'DM Sans',sans-serif;cursor:pointer;}
::-webkit-scrollbar{width:2px;}::-webkit-scrollbar-thumb{background:rgba(212,168,83,0.2);}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes drift{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
@keyframes f1{0%,100%{transform:translate(0,0)}50%{transform:translate(3px,-5px)}}
@keyframes f2{0%,100%{transform:translate(0,0)}50%{transform:translate(-4px,4px)}}
@keyframes f3{0%,100%{transform:translate(0,0)}50%{transform:translate(4px,3px)}}
@keyframes breathe{0%,100%{opacity:0.5;transform:scale(1)}50%{opacity:0.9;transform:scale(1.06)}}
`;

function ThreeCircles({ size=300, animated=true }) {
  const cx=size/2, cy=size/2, r=size*0.27, off=size*0.16;
  const circles=[
    {cx,cy:cy-off,color:T.gold,a:"f1"},{cx:cx-off,cy:cy+off*0.7,color:T.rose,a:"f2"},{cx:cx+off,cy:cy+off*0.7,color:T.sage,a:"f3"}
  ];
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{overflow:"visible"}}>
      <defs>{circles.map((c,i)=>(
        <radialGradient key={i} id={`g${i}${size}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={c.color} stopOpacity="0.18"/>
          <stop offset="100%" stopColor={c.color} stopOpacity="0.02"/>
        </radialGradient>
      ))}</defs>
      {circles.map((c,i)=>(
        <g key={i} style={{animation:animated?`${c.a} ${6+i*1.5}s ease-in-out infinite`:"none"}}>
          <circle cx={c.cx} cy={c.cy} r={r} fill={`url(#g${i}${size})`}/>
          <circle cx={c.cx} cy={c.cy} r={r} fill="none" stroke={c.color} strokeWidth="0.8" opacity="0.32"/>
        </g>
      ))}
      <text x={cx} y={cy+off*0.15} textAnchor="middle" dominantBaseline="middle" fontFamily="'Playfair Display',serif" fontSize={size*0.065} fill="rgba(245,239,230,0.75)" letterSpacing="0.1em">RESET</text>
      <text x={cx} y={cy+off*0.15+size*0.05} textAnchor="middle" dominantBaseline="middle" fontFamily="'DM Sans',sans-serif" fontSize={size*0.024} fill="rgba(245,239,230,0.2)" letterSpacing="0.2em">METHOD</text>
    </svg>
  );
}

function DepthDrawer({step}) {
  const [open,setOpen]=useState(false);
  const d=DEPTH[step]; if(!d) return null;
  const {color,bg,bd}=SC[step]||{color:T.gold,bg:T.goldBg,bd:T.goldBd};
  return (
    <div style={{marginTop:"1.2rem"}}>
      <button onClick={()=>setOpen(o=>!o)} style={{background:"none",border:"none",color:T.faint,fontSize:".74rem",padding:0,display:"flex",alignItems:"center",gap:".38rem",letterSpacing:".04em"}}>
        <span style={{fontSize:".58rem",transition:"transform .3s",display:"inline-block",transform:open?"rotate(90deg)":"rotate(0)"}}>▶</span>
        {open?"Hide the ancient wisdom & science":"The ancient wisdom & science behind this step"}
      </button>
      {open&&(
        <div style={{marginTop:".75rem",padding:"1.1rem 1.2rem",borderRadius:14,background:bg,border:`1px solid ${bd}`,animation:"slideUp .3s ease"}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:".8rem",fontStyle:"italic",color,marginBottom:".12rem"}}>{d.sk}</div>
          <div style={{fontSize:".62rem",fontWeight:600,letterSpacing:".16em",textTransform:"uppercase",color,opacity:.6,marginBottom:".65rem"}}>{d.k}</div>
          <div style={{fontSize:".82rem",color:"rgba(245,239,230,0.52)",lineHeight:1.82,marginBottom:".75rem"}}>{d.w}</div>
          <div style={{fontSize:".74rem",color:"rgba(245,239,230,0.28)",lineHeight:1.7,fontStyle:"italic",borderTop:`1px solid ${bd}`,paddingTop:".65rem"}}>
            <span style={{color,marginRight:".3rem"}}>✦</span>{d.s}
          </div>
        </div>
      )}
    </div>
  );
}

const Btn=({onClick,disabled,color,children})=>{
  const c=color||T.gold;
  return <button onClick={onClick} disabled={disabled} style={{display:"block",width:"100%",marginTop:"1.4rem",padding:"1rem 1.4rem",borderRadius:14,border:`1px solid ${disabled?"rgba(245,239,230,0.07)":c}`,background:disabled?"transparent":`${c}12`,color:disabled?T.faint:c,fontSize:".9rem",fontWeight:500,letterSpacing:".04em",transition:"all .2s",opacity:disabled?.35:1}}>{children}</button>;
};

const Spin=({color,msg})=>(
  <div style={{padding:"2.5rem 1rem",textAlign:"center"}}>
    <div style={{width:20,height:20,border:`1.5px solid ${color||T.gold}`,borderTopColor:"transparent",borderRadius:"50%",margin:"0 auto .9rem",animation:"spin 1s linear infinite"}}/>
    {msg&&<div style={{color:T.faint,fontSize:".78rem",fontStyle:"italic"}}>{msg}</div>}
  </div>
);

function deepAnalyze(text) {
  // Guard — return gentle message for gibberish
  if(isGibberish(text)) {
    return {
      facts:["What you're feeling is real, even if the words aren't coming yet."],
      mindAdding:[],
      summary:"Take a breath. When you're ready, tell me what's actually going on — even a few honest words is enough.",
      friendNote:"There's no rush. I'm here when you're ready.",
      isGentle:true
    };
  }

  const t = text.toLowerCase();
  const sentences = text.split(/[.!?]+/).map(s=>s.trim()).filter(s=>s.length>6);
  const first = sentences[0] || text.slice(0,120);
  const second = sentences[1] || "";

  // Extract the most personal phrases — things they actually said
  const keyPhrases = sentences.filter(s=>s.length>15).slice(0,3);

  const m = {
    boss:         /\b(boss|manager|supervisor|director)\b/.test(t),
    fired:        /\b(fired|let go|laid off|lose my job|losing my job)\b/.test(t),
    deadline:     /\b(deadline|due|deliver|presentation|tomorrow|friday|today|urgent)\b/.test(t),
    mistake:      /\b(mistake|screwed|messed up|failed|wrong|error|fault)\b/.test(t),
    overwhelmed:  /\b(overwhelmed|too much|can't cope|drowning|swamped|exhausted)\b/.test(t),
    ignored:      /\b(ignored|silent|silence|cold|distant|avoiding|not responding)\b/.test(t),
    money:        /\b(money|debt|rent|bill|financial|afford|broke|loan|salary)\b/.test(t),
    relationship: /\b(partner|relationship|breakup|divorce|girlfriend|boyfriend|spouse|family|friend)\b/.test(t),
    health:       /\b(health|sick|doctor|diagnosis|pain|symptom|hospital|illness)\b/.test(t),
    conflict:     /\b(argument|fight|conflict|tension|shouted|yelled|said to me|told me)\b/.test(t),
    newjob:       /\b(new job|just started|first week|recently joined|new role)\b/.test(t),
    rejected:     /\b(rejected|turned down|not selected|didn't get|lost|missed out)\b/.test(t),
  };

  const catW = (text.match(/\b(never|always|ruined|disaster|hopeless|worthless|terrible|worst|failed|failure|doomed|impossible|everything is|nothing works)\b/gi)||[]);
  const absW = (text.match(/\b(everyone|nobody|always|never|everything|nothing|completely|totally|forever)\b/gi)||[]);

  // FACTS — only things they explicitly mentioned, using their words
  const facts = [];
  if (first.length > 10) facts.push(`You wrote: "${first.slice(0,90)}${first.length>90?"…":""}" — that is what's actually happening`);
  if (m.boss && m.ignored)   facts.push(`Your manager has gone silent — that silence is real, whatever it means`);
  else if (m.boss)           facts.push(`There is something real happening with your manager right now`);
  if (m.deadline)            facts.push(`There is genuine time pressure — that part is real`);
  if (m.mistake)             facts.push(`Something went wrong — that happened and it's real`);
  if (m.money)               facts.push(`There is a financial concern here that deserves a clear look`);
  if (m.relationship)        facts.push(`Something real is happening in an important relationship`);
  if (m.health)              facts.push(`There is a health concern — that deserves proper attention`);
  if (m.conflict)            facts.push(`Something was said or happened between you and someone — that is real`);
  if (m.rejected)            facts.push(`You didn't get something you wanted — that loss is real`);
  // Only add more if we have a second real sentence to reference
  if (facts.length < 2 && keyPhrases[1] && keyPhrases[1].length > 15) {
    facts.push(`"${keyPhrases[1].slice(0,80)}" — this part is real too`);
  }
  // Never add generic filler — if we only have one fact, that's fine

  // MIND ADDING — only when there's actual evidence in what they wrote
  const mindAdding = [];
  if (m.ignored && m.boss)   mindAdding.push(`The silence hasn't told you what it means yet — your mind is filling that gap with the worst version`);
  if (m.fired)               mindAdding.push(`"Getting fired" hasn't happened. Right now it is a fear, not a fact`);
  if (m.mistake)             mindAdding.push(`One mistake rarely defines how others see us — that jump is your mind, not reality`);
  if (m.newjob)              mindAdding.push(`Expecting to feel settled this quickly in a new role — that's too fast for anyone`);
  if (m.rejected)            mindAdding.push(`What this rejection means about your worth or future — that part your mind is writing, not reality`);
  if (absW.length > 0)       mindAdding.push(`You used the word "${absW[0].toLowerCase()}" — when we're stressed our mind speaks in absolutes that aren't true`);
  if (catW.length > 0)       mindAdding.push(`You used "${catW[0].toLowerCase()}" — that word is your stress talking, not an accurate forecast`);
  // Only add something if we have real evidence — never generic filler
  if (mindAdding.length === 0 && second.length > 10) {
    mindAdding.push(`The story your mind is building around what happened may be heavier than the facts support`);
  }

  // SUMMARY — personal to their situation
  let summary = "";
  if (m.fired)                    summary = `The fear of losing your job is one of the most visceral fears there is — it touches survival. But right now that fear is running ahead of the facts.`;
  else if (m.boss && m.ignored)   summary = `The silence from your manager is real — and of course it's unsettling. But silence doesn't have a meaning yet. Your mind has already written one.`;
  else if (m.deadline)            summary = `You're under real time pressure — that part is completely valid. And when we're under pressure, the brain makes everything feel more catastrophic than it is.`;
  else if (m.mistake)             summary = `Something went wrong and that's genuinely hard, especially when it feels visible. But one mistake almost never means what our mind tells us it means.`;
  else if (m.overwhelmed)         summary = `When everything lands at once it becomes one undifferentiated mass. Inside that mass there are actually separate things — and they're more manageable apart than together.`;
  else if (m.relationship)        summary = `Relationship pain has a particular weight — it touches belonging and worth. Let's look at what's actually happening versus what fear is adding.`;
  else if (m.money)               summary = `Financial worry touches survival and security at once. Let's separate what is confirmed from what anxiety is adding to it.`;
  else if (m.rejected)            summary = `Not getting something you wanted is a real loss — and it stings. What it means about you or your future is a story, not a fact.`;
  else if (first.length > 20)     summary = `What you wrote is real and it matters. Let's look clearly at what's actually true versus what the stress is adding to it.`;
  else                            summary = `What you're going through is real. And it's more workable than it feels from inside it right now.`;

  const friendNote = m.fired       ? `Fear is loud. It doesn't mean it's accurate.`
    : m.overwhelmed ? `You don't need to solve all of it today. Just one clear piece of ground.`
    : m.mistake     ? `One mistake doesn't erase what you've built. It doesn't feel that way right now — but it's true.`
    : m.relationship? `You can't control what someone else thinks or does. You can only control your next step.`
    : m.money       ? `The number is just a number. It becomes manageable the moment you look at it clearly.`
    : m.deadline    ? `One thing at a time. That's all this moment needs.`
    : m.health      ? `You don't have to figure everything out today. One step toward clarity is enough.`
    : first.length > 30 ? `What you wrote matters. Let's look at it clearly.`
    : ``;`

  return {
    facts: facts.slice(0,3),
    mindAdding: mindAdding.slice(0,3),
    summary,
    friendNote
  };
}

function validateEmotion(emotion,situation) {
  const t=situation.toLowerCase();
  const m={fired:/\b(fired|let go)\b/.test(t),boss:/\b(boss|manager)\b/.test(t),deadline:/\b(deadline|due|tomorrow)\b/.test(t),mistake:/\b(mistake|failed|wrong)\b/.test(t),unfair:/\b(unfair|credit|recognition)\b/.test(t)};
  const map={
    Fear:{v:m.fired?`Fear of losing your job touches survival and identity at once. Of course you're scared.`:`Fear means something important is at stake. It makes complete sense.`,h:`Fear shrinks when we look at it directly. You're doing that right now.`},
    Anxiety:{v:m.deadline?`Anxiety before a deadline is your brain preparing for everything that could go wrong. Most of it won't.`:`Anxiety lives in the gap between where you are and where you think you should be.`,h:`The steps ahead give your anxious mind something structured to work with.`},
    Anger:{v:m.unfair?`Anger when something feels unfair is completely valid. It's pointing at something real.`:`Anger usually means something that should have happened didn't.`,h:`There is clarity in anger when it's directed well.`},
    Shame:{v:m.mistake?`Shame doesn't just say "I did something wrong." It says "I am wrong." That distinction matters enormously.`:`Shame comes from feeling exposed. What feels obvious to you is rarely visible to others the way you imagine.`,h:`You named it. That took courage.`},
    Pressure:{v:`Under pressure, everything feels more permanent and high-stakes than it actually is.`,h:`Reducing even one pressure point changes everything.`},
    Overwhelm:{v:`Overwhelm means you've been given more than one nervous system can hold. You're not weak. You're overloaded.`,h:`We're going to break this into pieces your mind can actually hold.`},
    Dread:{v:`Dread is anticipating something you believe is coming and can't stop. Your mind has already decided the ending — which it hasn't.`,h:`The thing you're dreading has not happened yet. That gap is where your power lives.`},
    Sadness:{v:`Sadness often comes from loss — of confidence, of a relationship, of a vision of yourself. That loss is real.`,h:`You don't have to feel better right now. One small step forward is enough.`},
  };
  const d=map[emotion];
  if(!d) return {v:`Feeling ${emotion?.toLowerCase()} makes complete sense given what you're carrying.`,h:`You found the word. That's the hardest part.`};
  return d;
}

function generateActions(situation,emotion) {
  const t = situation.toLowerCase();
  const m = {
    boss:         /\b(boss|manager|supervisor)\b/.test(t),
    fired:        /\b(fired|let go|laid off|lose my job)\b/.test(t),
    deadline:     /\b(deadline|due|deliver|tomorrow|urgent)\b/.test(t),
    overwhelmed:  /\b(overwhelmed|too much|drowning|swamped)\b/.test(t),
    mistake:      /\b(mistake|screwed|messed up|failed|wrong)\b/.test(t),
    ignored:      /\b(ignored|silent|silence|cold|distant)\b/.test(t),
    money:        /\b(money|debt|rent|financial|afford)\b/.test(t),
    relationship: /\b(partner|relationship|breakup|family|friend)\b/.test(t),
    conflict:     /\b(argument|fight|conflict|tension)\b/.test(t),
    newjob:       /\b(new job|just started|first week)\b/.test(t),
    rejected:     /\b(rejected|turned down|didn't get|not selected)\b/.test(t),
    health:       /\b(health|sick|doctor|pain|diagnosis)\b/.test(t),
  };

  // Situation-specific actions — concrete, doable, no writing tasks
  const pool = [];
  if (m.boss && m.ignored)  pool.push(`Send one short message to your manager today — "Do you have 10 minutes this week?" That's it. Open the door.`);
  else if (m.boss)          pool.push(`Have the conversation you've been avoiding — prepare one sentence that opens it, not resolves it`);
  if (m.fired)              pool.push(`Do one thing that reminds you of your professional value today — update a line on your profile, reach out to one person you trust`);
  if (m.deadline)           pool.push(`Close everything except the one thing that matters most right now. Set a 45-minute timer. Begin.`);
  if (m.mistake)            pool.push(`Address it directly and briefly — one message or conversation acknowledging what happened and what you're doing next. Then move forward.`);
  if (m.money)              pool.push(`Look at the actual numbers — not the feeling of them. Open the account, see the figure, then close it. Reality is almost always less terrifying than the anxiety about it.`);
  if (m.relationship)       pool.push(`Send one honest message — not to resolve everything, just to open the door. "I'd like to talk when you're ready."`);
  if (m.conflict)           pool.push(`Give it a few hours before responding or acting — most things said in tension look different after a short pause`);
  if (m.newjob)             pool.push(`Find one person at work to have a brief, genuine conversation with today — connection makes everything easier`);
  if (m.rejected)           pool.push(`Do one small thing today that reminds you of what you're capable of — something you know you're good at`);
  if (m.health)             pool.push(`Make the appointment or the call you've been putting off — uncertainty is almost always harder than the actual information`);
  if (m.overwhelmed)        pool.push(`Pick the single most urgent thing and do only that for the next 30 minutes. Everything else can wait.`);

  // Emotion-specific actions — behavioral, not journaling
  const byE = {
    Fear:      [`Do the thing you're most afraid of doing — not all of it, just the first step. Fear almost always shrinks when you move toward it.`],
    Anxiety:   [`Get up and move your body for 10 minutes right now — walk, stretch, anything. Your nervous system needs a physical reset, not a mental one.`],
    Anger:     [`Remove yourself from the situation for 20 minutes before doing or saying anything. Let the first wave pass first.`],
    Shame:     [`Talk to one person you trust today — say something honest. Shame lives in silence and shrinks when spoken.`],
    Pressure:  [`Say no to one thing today. Even a small thing. Pressure needs an outlet, not more input.`],
    Overwhelm: [`Stop adding to the mental list. Do the one smallest thing in front of you right now — not because it solves everything, but because movement is its own medicine.`],
    Dread:     [`Take one step toward the thing you're dreading — the anticipation is always worse than the reality. Always.`],
    Sadness:   [`Reach out to one person today — not to explain everything, just to not be alone with it.`],
    uncertain: [`Be gentle with yourself today — sometimes the most useful thing is just to get through it, one hour at a time.`],
  };

  const eA = byE[emotion] || [`Do one thing today that is entirely within your control — and let everything else wait.`];
  const fallback = [`Step outside for 10 minutes. Fresh air and movement shift your thinking more than you expect.`];

  return [...new Set([...pool, ...eA, ...fallback])].slice(0,3);
}

function isGibberish(text) {
  const words = text.trim().split(/\s+/).filter(w=>w.length>0);
  if(words.length < 3) return false;
  // Check average word length — real sentences average 4-8 chars
  const avgLen = words.reduce((s,w)=>s+w.length,0)/words.length;
  if(avgLen > 12) return true;
  // Check ratio of words with no vowels (gibberish has very few vowels)
  const noVowels = words.filter(w=>!/[aeiouAEIOU]/.test(w)&&w.length>2).length;
  if(noVowels/words.length > 0.6) return true;
  // Check for repeated character sequences
  if(/(.{2,})\1{3,}/.test(text)) return true;
  return false;
}


/* ─────────────────────────────────────────────
   2AM EMERGENCY MODE
   For when someone genuinely can't function
───────────────────────────────────────────── */
function EmergencyMode({onExit}) {
  const [phase,setPhase]=useState("breathe"); // breathe → ground → done
  const [bCount,setBCount]=useState(4);
  const [bPhase,setBPhase]=useState(0); // 0=in 1=hold 2=out
  const [bRound,setBRound]=useState(0);
  const tRef=useRef(null);
  const rRef=useRef({phase:0,elapsed:0,round:0});
  const BPH=[{n:"in",d:4,label:"Breathe in"},{n:"hold",d:4,label:"Hold"},{n:"out",d:6,label:"Let go"}];

  useEffect(()=>{
    if(phase!=="breathe") return;
    tRef.current=setInterval(()=>{
      rRef.current.elapsed++;
      const p=BPH[rRef.current.phase];
      setBCount(Math.max(1,p.d-rRef.current.elapsed));
      if(rRef.current.elapsed>=p.d){
        rRef.current.elapsed=0;
        const next=(rRef.current.phase+1)%3;
        if(rRef.current.phase===2){
          rRef.current.round++;
          setBRound(rRef.current.round);
          if(rRef.current.round>=3){clearInterval(tRef.current);setPhase("ground");return;}
        }
        rRef.current.phase=next;setBPhase(next);setBCount(BPH[next].d);
      }
    },1000);
    return()=>clearInterval(tRef.current);
  },[phase]);

  if(phase==="done") return (
    <div style={{minHeight:"100vh",background:"#241608",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"2rem",textAlign:"center"}}>
      <style>{CSS}</style>
      <div style={{fontSize:"2rem",marginBottom:"1.2rem",animation:"drift 4s ease infinite"}}>🌿</div>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.6rem",fontWeight:300,fontStyle:"italic",color:T.sage,marginBottom:".5rem"}}>You're okay.</div>
      <div style={{fontSize:".88rem",color:T.muted,lineHeight:1.85,maxWidth:300,marginBottom:"2rem"}}>You just moved through it. That took something. Be gentle with yourself right now.</div>
      <button onClick={onExit} style={{padding:".75rem 1.8rem",borderRadius:50,background:T.sageBg,color:T.sage,border:`1px solid ${T.sageBd}`,fontSize:".85rem",cursor:"pointer"}}>I'm okay — take me home</button>
    </div>
  );

  const curPhase=BPH[bPhase];

  return (
    <div style={{minHeight:"100vh",background:"#241608",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"2rem",textAlign:"center"}}>
      <style>{CSS}</style>
      <button onClick={onExit} style={{position:"fixed",top:"1.2rem",left:"1.2rem",background:"none",border:"none",color:T.faint,fontSize:".75rem",cursor:"pointer"}}>← Exit</button>

      {phase==="breathe"&&(
        <>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.1rem",fontWeight:300,fontStyle:"italic",color:T.muted,marginBottom:"2.5rem"}}>Just breathe with this for a moment.</div>
          <div style={{position:"relative",width:180,height:180,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"2rem"}}>
            <div style={{position:"absolute",inset:-20,borderRadius:"50%",background:`radial-gradient(circle,${T.sage}12,transparent 65%)`,animation:"breathe 3s ease infinite"}}/>
            <div style={{width:140,height:140,borderRadius:"50%",border:`1.5px solid ${T.sage}60`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:`${T.sage}06`,transform:bPhase===0?`scale(${1+((4-bCount)/4)*.3})`:bPhase===1?"scale(1.3)":`scale(${1.3-((6-bCount)/6)*.3})`,transition:"transform 1s ease"}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:"3rem",fontWeight:300,color:"rgba(245,239,230,0.85)",lineHeight:1}}>{bCount}</div>
              <div style={{color:T.sage,fontSize:".52rem",letterSpacing:".2em",textTransform:"uppercase",marginTop:".2rem"}}>{curPhase.n}</div>
            </div>
          </div>
          <div style={{fontFamily:"'Playfair Display',serif",fontStyle:"italic",color:T.muted,fontSize:".9rem",marginBottom:".3rem"}}>{curPhase.label}</div>
          <div style={{color:T.faint,fontSize:".68rem"}}>Breath {bRound+1} of 3</div>
        </>
      )}

      {phase==="ground"&&(
        <div style={{maxWidth:320,animation:"fadeIn .8s ease"}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.2rem",fontWeight:300,fontStyle:"italic",color:T.muted,marginBottom:"1.5rem",lineHeight:1.6}}>Good. Now look around you.</div>
          <div style={{fontSize:".9rem",color:"rgba(245,239,230,0.6)",lineHeight:2,marginBottom:"2rem"}}>
            Name 3 things you can see.<br/>
            Feel your feet on the floor.<br/>
            Take one slow breath out.
          </div>
          <div style={{fontSize:".82rem",color:T.muted,lineHeight:1.85,marginBottom:"2rem",fontStyle:"italic"}}>
            You are here. You are safe. This moment is real and it is manageable.
          </div>
          <button onClick={()=>setPhase("done")} style={{padding:".8rem 2rem",borderRadius:50,background:T.sageBg,color:T.sage,border:`1px solid ${T.sageBd}`,fontSize:".85rem",cursor:"pointer",width:"100%"}}>I'm feeling a little steadier →</button>
        </div>
      )}
    </div>
  );
}

function StepSituation({onNext}) {
  const [val,setVal]=useState("");
  const words = val.trim().split(/\s+/).filter(w=>w.length>0);
  const count = words.length;
  const gibberish = count >= 10 && isGibberish(val);
  const ready = count >= 15 && !gibberish;
  return (
    <div style={{animation:"slideUp .4s ease"}}>
      <p style={{fontSize:".84rem",color:T.muted,lineHeight:1.82,marginBottom:"1.2rem"}}>Write freely — like texting a close friend. The more honest you are, the more personal this will feel.</p>
      <textarea value={val} onChange={e=>setVal(e.target.value)} placeholder="Tell me what's going on…" rows={6}
        style={{width:"100%",background:T.card,border:`1px solid ${gibberish?"rgba(201,123,110,0.4)":T.border}`,borderRadius:14,padding:"1.1rem",color:"rgba(245,239,230,0.88)",fontSize:".93rem",fontWeight:300,lineHeight:1.8,resize:"none",transition:"border-color .2s"}}
        onFocus={e=>e.target.style.borderColor=gibberish?"rgba(201,123,110,0.4)":"rgba(212,168,83,0.32)"} onBlur={e=>e.target.style.borderColor=gibberish?"rgba(201,123,110,0.4)":T.border}/>
      <div style={{textAlign:"right",fontSize:".67rem",marginTop:".32rem",marginBottom:".75rem",color:gibberish?"rgba(201,123,110,0.8)":count<15?"rgba(201,123,110,0.7)":"rgba(123,166,138,0.7)"}}>
        {gibberish?"I want to understand — could you tell me what's happening in your own words?"
          :count<15?`${15-count} more words`:"✓ Ready"}
      </div>
      <div style={{fontSize:".68rem",color:T.faint,marginBottom:".2rem"}}>🔒 Private. Nothing leaves your device.</div>
      <Btn onClick={()=>onNext(val)} disabled={!ready}>Begin →</Btn>
    </div>
  );
}

function StepRecognize({situation,onNext}) {
  const [result,setResult]=useState(null);
  const [showEdit,setShowEdit]=useState(false);
  const {color,bg,bd}=SC[1];

  useEffect(()=>{
    async function go(){
      const ai=await callResetAI("recognize",situation);
      setResult(ai?{
        summary:ai.summary||"",friendNote:ai.friendNote||"",
        facts:ai.facts||[],assumptions:ai.assumptions||[],
        catastrophizing:ai.catastrophizing||[],koshaInsight:ai.koshaInsight||""
      }:deepAnalyze(situation));
    }
    setTimeout(go,300);
  },[situation]);

  if(!result) return <Spin color={color} msg="Reading what you shared…"/>;

  // mindAdding comes directly from the new deepAnalyze
  const mindAdding = result.mindAdding || [...(result.assumptions||[]),...(result.catastrophizing||[])];

  // Gentle mode — if input was unclear, show a soft prompt instead
  if(result.isGentle) return (
    <div style={{animation:"fadeIn .5s ease"}}>
      <div style={{padding:"1.4rem 1.3rem",borderRadius:16,background:bg,border:`1px solid ${bd}`,marginBottom:"1.2rem",textAlign:"center"}}>
        <div style={{fontSize:"1.5rem",marginBottom:".8rem",animation:"drift 4s ease infinite"}}>🌿</div>
        <div style={{fontFamily:"'Playfair Display',serif",fontStyle:"italic",color:"rgba(245,239,230,0.82)",fontSize:"1rem",lineHeight:1.82,marginBottom:".6rem"}}>{result.summary}</div>
        <div style={{color:T.muted,fontSize:".83rem",lineHeight:1.65}}>{result.friendNote}</div>
      </div>
      <Btn color={color} onClick={()=>onNext({facts:[],mindAdding:[],summary:result.summary,friendNote:result.friendNote})}>I'm ready — try again →</Btn>
    </div>
  );

  return (
    <div style={{animation:"fadeIn .5s ease"}}>

      {/* Personal summary — the heart */}
      <div style={{marginBottom:"1.8rem"}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontStyle:"italic",color:"rgba(245,239,230,0.85)",fontSize:"1rem",lineHeight:1.88,marginBottom:".7rem"}}>
          "{result.summary}"
        </div>
        <div style={{color:T.muted,fontSize:".84rem",lineHeight:1.7}}>{result.friendNote}</div>
      </div>

      {/* What is real — flowing, no box */}
      <div style={{marginBottom:"1.6rem"}}>
        <div style={{fontSize:".68rem",fontWeight:500,letterSpacing:".12em",textTransform:"uppercase",color:T.sage,marginBottom:".75rem",opacity:.8}}>What is real</div>
        <div style={{borderLeft:`2px solid ${T.sageBd}`,paddingLeft:"1rem"}}>
          {result.facts.map((item,i)=>(
            <div key={i} style={{fontSize:".88rem",color:"rgba(245,239,230,0.72)",lineHeight:1.78,marginBottom:".42rem"}}>{item}</div>
          ))}
        </div>
      </div>

      {/* What the mind is adding — softer, quieter */}
      {mindAdding.length>0&&(
        <div style={{marginBottom:"1.6rem"}}>
          <div style={{fontSize:".68rem",fontWeight:500,letterSpacing:".12em",textTransform:"uppercase",color:T.sand,marginBottom:".75rem",opacity:.7}}>What the mind might be adding</div>
          <div style={{borderLeft:`2px solid ${T.sandBd}`,paddingLeft:"1rem"}}>
            {mindAdding.map((item,i)=>(
              <div key={i} style={{fontSize:".85rem",color:"rgba(245,239,230,0.48)",lineHeight:1.78,marginBottom:".42rem",fontStyle:"italic"}}>{item}</div>
            ))}
          </div>
        </div>
      )}

      {/* Kosha insight — whisper at the bottom */}
      {result.koshaInsight&&(
        <div style={{fontSize:".74rem",color:color,fontStyle:"italic",opacity:.55,lineHeight:1.65,marginBottom:"1.4rem"}}>✦ {result.koshaInsight}</div>
      )}

      {/* Adjust — small, quiet, optional */}
      <button onClick={()=>setShowEdit(o=>!o)}
        style={{background:"none",border:"none",color:T.faint,fontSize:".73rem",padding:0,marginBottom:showEdit?"1rem":".2rem",cursor:"pointer",display:"flex",alignItems:"center",gap:".35rem"}}>
        <span style={{fontSize:".58rem",transition:"transform .3s",display:"inline-block",transform:showEdit?"rotate(90deg)":"rotate(0)"}}>▶</span>
        {showEdit?"Hide":"Something feel off? Adjust it"}
      </button>

      {/* Edit panel — only when requested */}
      {showEdit&&(
        <div style={{padding:"1rem 1.1rem",borderRadius:13,background:T.card,border:`1px solid ${T.border}`,marginBottom:"1rem",animation:"slideUp .3s ease"}}>
          <div style={{fontSize:".68rem",color:T.faint,marginBottom:".85rem",lineHeight:1.65}}>Move anything that doesn't feel right.</div>
          {[
            {key:"facts",label:"What is real",color:T.sage,bd:T.sageBd},
            {key:"assumptions",label:"Assumptions",color:T.sand,bd:T.sandBd},
            {key:"catastrophizing",label:"Mind adding",color:T.rose,bd:T.roseBd},
          ].map(cat=>result[cat.key]?.length>0&&(
            <div key={cat.key} style={{marginBottom:".9rem"}}>
              <div style={{fontSize:".62rem",fontWeight:600,letterSpacing:".12em",textTransform:"uppercase",color:cat.color,marginBottom:".4rem",opacity:.7}}>{cat.label}</div>
              {result[cat.key].map((item,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:".5rem",marginBottom:".3rem",padding:".3rem .5rem",borderRadius:8,background:`${cat.color}08`}}>
                  <div style={{fontSize:".8rem",color:T.muted,lineHeight:1.6,flex:1}}>{item}</div>
                  <button onClick={()=>{const r2={...result};r2[cat.key]=[...r2[cat.key]];r2[cat.key].splice(i,1);setResult(r2);}}
                    style={{background:"none",border:"none",color:T.faint,fontSize:".7rem",cursor:"pointer",flexShrink:0,paddingTop:".1rem"}}>×</button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <DepthDrawer step={1}/>
      <Btn color={color} onClick={()=>onNext(result)}>This feels right →</Btn>
    </div>
  );
}

function AddLine({color,bd,onAdd}) {
  const [v,setV]=useState("");
  return (
    <div style={{display:"flex",gap:".38rem",marginTop:".48rem"}}>
      <input value={v} onChange={e=>setV(e.target.value)} placeholder="Add your own…"
        onKeyDown={e=>{if(e.key==="Enter"&&v.trim()){onAdd(v);setV("");}}}
        style={{flex:1,background:"transparent",border:`1px solid ${bd}`,borderRadius:7,color:"rgba(245,239,230,0.8)",fontSize:".77rem",padding:".26rem .58rem"}}/>
      <button onClick={()=>{if(v.trim()){onAdd(v);setV("");}}} style={{background:`${color}14`,border:`1px solid ${bd}`,borderRadius:7,color,fontSize:".7rem",padding:".26rem .6rem"}}>Add</button>
    </div>
  );
}

const BUCKETS=[
  {key:"direct",label:"In my control",desc:"My actions, words, choices",color:T.sage,bg:T.sageBg,bd:T.sageBd},
  {key:"influence",label:"Can influence",desc:"I can affect but not fully control",color:T.sand,bg:T.sandBg,bd:T.sandBd},
  {key:"release",label:"Let go",desc:"Outside my power completely",color:T.rose,bg:T.roseBg,bd:T.roseBd},
];

function StepExamine({onNext}) {
  const [b,setB]=useState({direct:[],influence:[],release:[]});
  const {color}=SC[2];
  const add=(key,v)=>{if(v.trim())setB(p=>({...p,[key]:[...p[key],v.trim()]}));};
  const rem=(key,i)=>setB(p=>({...p,[key]:p[key].filter((_,j)=>j!==i)}));
  return (
    <div style={{animation:"slideUp .4s ease"}}>
      <p style={{fontSize:".83rem",color:T.muted,lineHeight:1.82,marginBottom:"1.2rem"}}>Think about your situation. Sort concerns below. The act of sorting is where the relief comes from.</p>
      {BUCKETS.map(c=>(
        <div key={c.key} style={{marginBottom:".68rem",borderRadius:13,padding:".88rem 1rem",border:`1px solid ${c.bd}`,background:c.bg}}>
          <div style={{fontSize:".67rem",fontWeight:600,letterSpacing:".12em",textTransform:"uppercase",color:c.color,marginBottom:".07rem"}}>{c.label}</div>
          <div style={{fontSize:".71rem",color:T.faint,marginBottom:".52rem"}}>{c.desc}</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:".26rem",marginBottom:b[c.key].length?".48rem":0}}>
            {b[c.key].map((item,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:".24rem",padding:".19rem .52rem",borderRadius:20,background:`${c.color}12`,border:`1px solid ${c.bd}`,color:c.color,fontSize:".74rem"}}>
                {item}<span onClick={()=>rem(c.key,i)} style={{opacity:.4,cursor:"pointer"}}>×</span>
              </div>
            ))}
          </div>
          <input placeholder="Type and press Enter…"
            onKeyDown={e=>{if(e.key==="Enter"){add(c.key,e.target.value);e.target.value="";}}}
            style={{width:"100%",background:"transparent",border:"none",borderBottom:`1px solid ${c.bd}`,color:"rgba(245,239,230,0.75)",fontSize:".81rem",padding:".22rem 0"}}/>
        </div>
      ))}
      <DepthDrawer step={2}/>
      <Btn color={color} onClick={()=>onNext(b)}>I see where my power is →</Btn>
    </div>
  );
}

const EMOTIONS=[
  {l:"Fear",e:"🌫️"},{l:"Anxiety",e:"〰️"},{l:"Anger",e:"🔥"},{l:"Shame",e:"🌑"},
  {l:"Pressure",e:"⏳"},{l:"Sadness",e:"🌧️"},{l:"Overwhelm",e:"🌊"},{l:"Dread",e:"🕳️"},
  {l:"Grief",e:"🫧"},{l:"Confusion",e:"🌀"},{l:"Guilt",e:"⚖️"},{l:"Loneliness",e:"🏔️"},
];

function StepSurface({situation,onNext}) {
  const [sel,setSel]=useState(null);
  const [custom,setCustom]=useState("");
  const [showCustom,setShowCustom]=useState(false);
  const [notSure,setNotSure]=useState(false);
  const [val,setVal]=useState(null);
  const [loading,setLoading]=useState(false);
  const {color,bg,bd}=SC[3];

  async function pick(label){
    setSel(label);setShowCustom(false);setNotSure(false);setVal(null);setLoading(true);
    const ai=await callResetAI("surface",situation,label);
    setVal(ai?{v:ai.validation||"",science:ai.science||"",koshaInsight:ai.koshaInsight||"",h:ai.hope||""}:validateEmotion(label,situation));
    setLoading(false);
  }

  function handleNotSure(){
    setNotSure(true);setSel(null);setShowCustom(false);
    setVal({
      v:"That's completely okay. Not knowing what you're feeling is actually very common — especially when you're in the middle of it. Your body knows something is happening even if your mind hasn't found the word yet.",
      h:"Take a breath. Look at the options below without pressure. If one feels even slightly familiar — that's your starting point.",
      notSure:true
    });
  }

  const emotion=showCustom?custom:sel;
  return (
    <div style={{animation:"slideUp .4s ease"}}>

      {/* Not sure option — prominent, at the top */}
      <div onClick={handleNotSure}
        style={{padding:".78rem .92rem",borderRadius:12,cursor:"pointer",marginBottom:".65rem",border:`1px solid ${notSure?color:"rgba(255,245,232,0.12)"}`,background:notSure?bg:"rgba(255,245,232,0.03)",transition:"all .15s"}}>
        <div style={{fontSize:".86rem",color:notSure?color:"rgba(245,239,230,0.55)",fontWeight:notSure?500:300}}>
          🌫️  I'm not sure what I'm feeling
        </div>
      </div>

      {/* Emotion grid */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:".42rem",marginBottom:".55rem"}}>
        {EMOTIONS.map(({l,e})=>(
          <div key={l} onClick={()=>pick(l)}
            style={{padding:".62rem .8rem",borderRadius:12,cursor:"pointer",border:`1px solid ${sel===l&&!showCustom?color:T.border}`,background:sel===l&&!showCustom?bg:T.card,display:"flex",alignItems:"center",gap:".45rem",transition:"all .15s"}}>
            <span style={{fontSize:".88rem"}}>{e}</span>
            <span style={{fontSize:".81rem",color:sel===l&&!showCustom?color:T.muted,fontWeight:sel===l&&!showCustom?500:300}}>{l}</span>
          </div>
        ))}
      </div>

      {/* Name it yourself */}
      <div onClick={()=>{setShowCustom(true);setSel(null);setNotSure(false);setVal(null);}}
        style={{padding:".62rem .8rem",borderRadius:12,cursor:"pointer",marginBottom:".8rem",border:`1px solid ${showCustom?color:T.border}`,background:showCustom?bg:T.card,transition:"all .15s"}}>
        <div style={{fontSize:".81rem",color:showCustom?color:T.muted}}>✍️  Something else — I'll name it</div>
        {showCustom&&(
          <div style={{marginTop:".42rem",display:"flex",gap:".38rem"}}>
            <input value={custom} onChange={e=>setCustom(e.target.value)} autoFocus placeholder="What are you feeling?"
              style={{flex:1,background:"transparent",border:"none",borderBottom:`1px solid ${bd}`,color:"rgba(245,239,230,0.85)",fontSize:".83rem",padding:".22rem 0"}}/>
            <button onClick={()=>{if(custom.trim())setVal({v:`Feeling ${custom.toLowerCase()} makes complete sense.`,h:`You found the word. That's the hardest part.`});}}
              style={{background:bg,border:`1px solid ${bd}`,borderRadius:7,color,fontSize:".7rem",padding:".22rem .58rem"}}>✓</button>
          </div>
        )}
      </div>

      {loading&&<Spin color={color} msg="Finding the right words…"/>}

      {val&&!loading&&(
        <div style={{animation:"slideUp .3s ease",marginBottom:".85rem"}}>
          <div style={{padding:"1rem 1.12rem",borderRadius:14,background:bg,border:`1px solid ${bd}`}}>
            <div style={{color:"rgba(245,239,230,0.82)",fontSize:".9rem",lineHeight:1.85,marginBottom:".55rem"}}>{val.v}</div>
            {val.koshaInsight&&<div style={{fontSize:".74rem",color,fontStyle:"italic",opacity:.6,lineHeight:1.65,marginBottom:".5rem"}}>✦ {val.koshaInsight}</div>}
            <div style={{color:T.muted,fontSize:".79rem",lineHeight:1.65,fontStyle:"italic",borderTop:`1px solid ${bd}`,paddingTop:".5rem"}}>{val.h}</div>
          </div>
        </div>
      )}

      <DepthDrawer step={3}/>
      <Btn color={color} onClick={()=>onNext(notSure?"uncertain":emotion)} disabled={!notSure&&(!emotion||emotion.trim().length<2)}>
        {notSure?"Continue — I'll feel my way through →":"Named it →"}
      </Btn>
    </div>
  );
}

function StepExecute({situation,emotion,onNext}) {
  const [actions,setActions]=useState(()=>generateActions(situation,emotion));
  const [framing,setFraming]=useState("");
  const [aiLoading,setAiLoading]=useState(true);
  const [sel,setSel]=useState(null);
  const [showAll,setShowAll]=useState(false);
  const [custom,setCustom]=useState("");
  const [showCustom,setShowCustom]=useState(false);
  const {color,bg,bd}=SC[4];

  useEffect(()=>{
    async function go(){
      const ai=await callResetAI("execute",situation,emotion);
      if(ai?.actions?.length){
        setActions(ai.actions);
        setFraming(ai.framing||"");
        setSel(ai.actions[0]); // pre-select the best one for them
      } else {
        const fallback=generateActions(situation,emotion);
        setActions(fallback);
        setSel(fallback[0]); // pre-select even for fallback
      }
      setAiLoading(false);
    }
    go();
  },[]);

  const final=showCustom?custom:sel;

  return (
    <div style={{animation:"fadeIn .4s ease"}}>

      {aiLoading?<Spin color={color} msg="Finding something gentle to start with…"/>:<>

        {/* Framing — soft, not commanding */}
        <p style={{fontSize:".84rem",color:T.muted,lineHeight:1.82,marginBottom:"1.2rem"}}>
          {framing||"You don't need to figure everything out right now. Here's one small thing that might help."}
        </p>

        {/* Pre-selected action — shown prominently */}
        {!showAll&&sel&&(
          <div style={{padding:"1.1rem 1.15rem",borderRadius:14,border:`1px solid ${color}`,background:bg,marginBottom:".75rem",animation:"slideUp .3s ease"}}>
            <div style={{fontSize:".65rem",fontWeight:600,letterSpacing:".12em",textTransform:"uppercase",color,opacity:.7,marginBottom:".5rem"}}>One small step</div>
            <div style={{fontSize:".92rem",color:"rgba(245,239,230,0.85)",lineHeight:1.75,fontWeight:400}}>{sel}</div>
          </div>
        )}

        {/* Show alternatives — quiet link */}
        {!showAll&&(
          <button onClick={()=>setShowAll(true)}
            style={{background:"none",border:"none",color:T.faint,fontSize:".73rem",padding:"0 0 .8rem",cursor:"pointer",display:"flex",alignItems:"center",gap:".35rem"}}>
            <span style={{fontSize:".58rem"}}>▶</span> This doesn't feel right — show me others
          </button>
        )}

        {/* All options — shown when requested */}
        {showAll&&(
          <div style={{animation:"slideUp .3s ease",marginBottom:".6rem"}}>
            <div style={{fontSize:".65rem",color:T.faint,marginBottom:".65rem",letterSpacing:".04em"}}>Choose what feels most doable right now</div>
            {actions.map((a,i)=>(
              <div key={i} onClick={()=>{setSel(a);setShowCustom(false);}}
                style={{padding:".82rem .95rem",borderRadius:12,cursor:"pointer",marginBottom:".42rem",border:`1px solid ${sel===a&&!showCustom?color:T.border}`,background:sel===a&&!showCustom?bg:T.card,color:sel===a&&!showCustom?color:T.muted,fontSize:".85rem",lineHeight:1.65,fontWeight:sel===a&&!showCustom?500:300,transition:"all .15s"}}>
                {sel===a&&!showCustom?"✓  ":""}{a}
              </div>
            ))}
            <div onClick={()=>{setShowCustom(true);setSel(null);}}
              style={{padding:".78rem .95rem",borderRadius:12,cursor:"pointer",marginBottom:".42rem",border:`1px solid ${showCustom?color:T.border}`,background:showCustom?bg:T.card,transition:"all .15s"}}>
              <div style={{fontSize:".83rem",color:showCustom?color:T.muted}}>✍️  I know what I need to do</div>
              {showCustom&&<input value={custom} onChange={e=>setCustom(e.target.value)} autoFocus placeholder="What one action will you take?"
                style={{marginTop:".4rem",width:"100%",background:"transparent",border:"none",borderBottom:`1px solid ${bd}`,color:"rgba(245,239,230,0.85)",fontSize:".83rem",padding:".2rem 0"}}/>}
            </div>
          </div>
        )}
      </>}

      <DepthDrawer step={4}/>
      <Btn color={color} onClick={()=>onNext(final)} disabled={!final||final.trim().length<3}>
        {aiLoading?"…":"I can do this →"}
      </Btn>
    </div>
  );
}

function StepTune({onComplete}) {
  const [chosen,setChosen]=useState(null);
  const {color,bg,bd}=SC[5];
  if(!chosen) return (
    <div style={{animation:"slideUp .4s ease"}}>
      <p style={{fontSize:".83rem",color:T.muted,lineHeight:1.82,marginBottom:"1.25rem"}}>Your mind is clear. Your action is chosen. Now let your body catch up. Choose what feels right.</p>
      {[
        {key:"breathe",icon:"○",name:"Box Breathing",desc:"Slow guided breath — 4-4-6 rhythm"},
        {key:"ground",icon:"◇",name:"5-4-3-2-1 Grounding",desc:"Anchor to this moment through your senses"},
        {key:"release",icon:"△",name:"Physical Release",desc:"Release tension from jaw, shoulders, neck, hands"},
      ].map(t=>(
        <div key={t.key} onClick={()=>setChosen(t.key)}
          style={{padding:".92rem 1rem",borderRadius:13,cursor:"pointer",marginBottom:".58rem",border:`1px solid ${T.border}`,background:T.card,transition:"all .2s"}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=bd;e.currentTarget.style.background=bg;}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.background=T.card;}}>
          <div style={{display:"flex",alignItems:"center",gap:".75rem"}}>
            <div style={{width:33,height:33,borderRadius:"50%",border:`1px solid ${bd}`,display:"flex",alignItems:"center",justifyContent:"center",color,fontSize:".85rem",flexShrink:0}}>{t.icon}</div>
            <div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:".94rem",color:"rgba(245,239,230,0.78)",marginBottom:".09rem"}}>{t.name}</div>
              <div style={{fontSize:".72rem",color:T.faint}}>{t.desc}</div>
            </div>
          </div>
        </div>
      ))}
      <DepthDrawer step={5}/>
    </div>
  );
  if(chosen==="breathe") return <BoxBreathing onComplete={onComplete}/>;
  if(chosen==="ground")  return <Grounding onComplete={onComplete}/>;
  if(chosen==="release") return <BodyRelease onComplete={onComplete}/>;
}

const PH=[{n:"inhale",l:"Breathe in",d:4,c:T.sage},{n:"hold",l:"Hold gently",d:4,c:T.lav},{n:"exhale",l:"Release slowly",d:6,c:T.sky}];

function BoxBreathing({onComplete}) {
  const [pi,setPi]=useState(0);
  const [count,setCount]=useState(4);
  const [round,setRound]=useState(0);
  const [done,setDone]=useState(false);
  const [waiting,setWaiting]=useState(false); // waiting for user tap
  const r=useRef({pi:0,elapsed:0,round:0});
  const tRef=useRef(null);

  function startPhase(phaseIdx){
    r.current.pi=phaseIdx;
    r.current.elapsed=0;
    setWaiting(false);
    setCount(PH[phaseIdx].d);
    tRef.current=setInterval(()=>{
      r.current.elapsed++;
      const p=PH[r.current.pi];
      setCount(Math.max(1,p.d-r.current.elapsed));
      if(r.current.elapsed>=p.d){
        clearInterval(tRef.current);
        setWaiting(true); // pause — wait for tap
      }
    },1000);
  }

  useEffect(()=>{startPhase(0);return()=>clearInterval(tRef.current);},[]);

  function handleTap(){
    if(!waiting) return;
    const next=(r.current.pi+1)%3;
    if(r.current.pi===2){
      const newRound=round+1;
      setRound(newRound);
      if(newRound>=3){setDone(true);return;}
    }
    setPi(next);
    startPhase(next);
  }

  if(done) return <TuneDone onComplete={onComplete}/>;
  const phase=PH[pi];
  const prog=waiting?1:(phase.d-count)/phase.d;
  const scale=pi===0?1+prog*.38:pi===1?1.38:1.38-prog*.38;

  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"2rem 0",userSelect:"none"}}>
      <p style={{fontSize:".78rem",color:T.faint,marginBottom:"1.5rem",fontStyle:"italic",textAlign:"center"}}>
        {waiting?"Tap the circle when you're ready to continue":"Follow the circle — breathe with it"}
      </p>

      {/* Interactive circle */}
      <div onClick={handleTap} style={{position:"relative",width:170,height:170,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"1.5rem",cursor:waiting?"pointer":"default"}}>
        {/* Outer pulse */}
        <div style={{position:"absolute",inset:-20,borderRadius:"50%",background:`radial-gradient(circle,${phase.c}10,transparent 65%)`,animation:waiting?"glow 1.5s ease infinite":"breathe 3s ease infinite"}}/>

        {/* Main circle */}
        <div style={{width:130,height:130,borderRadius:"50%",border:`2px solid ${waiting?phase.c:phase.c}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",transform:`scale(${scale})`,transition:"transform 1s ease",background:waiting?`${phase.c}12`:`${phase.c}05`,boxShadow:waiting?`0 0 24px ${phase.c}30`:"none"}}>
          {waiting?(
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:"1.5rem",marginBottom:".2rem"}}>✓</div>
              <div style={{color:phase.c,fontSize:".6rem",letterSpacing:".14em",textTransform:"uppercase"}}>tap to continue</div>
            </div>
          ):(
            <>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:"2.6rem",fontWeight:300,color:"rgba(245,239,230,0.88)",lineHeight:1}}>{count}</div>
              <div style={{color:phase.c,fontSize:".52rem",letterSpacing:".18em",textTransform:"uppercase"}}>{phase.n}</div>
            </>
          )}
        </div>
      </div>

      {/* Phase label */}
      <div style={{fontFamily:"'Playfair Display',serif",fontStyle:"italic",color:T.muted,fontSize:".88rem",marginBottom:".3rem"}}>{phase.l}</div>
      <div style={{color:T.faint,fontSize:".65rem"}}>Round {round+1} of 3</div>

      {/* Phase dots */}
      <div style={{display:"flex",gap:".5rem",marginTop:"1.2rem"}}>
        {PH.map((p,i)=>(
          <div key={i} style={{width:6,height:6,borderRadius:"50%",background:i===pi?p.c:"rgba(245,239,230,0.15)",transition:"background .4s"}}/>
        ))}
      </div>
    </div>
  );
}

const GS=[{p:"Name 5 things you can see right now",i:"👁️"},{p:"Name 4 things you can physically feel",i:"🤲"},{p:"Name 3 things you can hear",i:"👂"},{p:"Name 2 things you can smell",i:"🌸"},{p:"Name 1 thing you can taste",i:"👅"}];

function Grounding({onComplete}) {
  const [step,setStep]=useState(0);const [input,setInput]=useState("");const [done,setDone]=useState(false);
  const {color}=SC[5];
  function next(){if(input.trim()){setInput("");if(step>=4)setDone(true);else setStep(s=>s+1);}}
  if(done) return <TuneDone onComplete={onComplete}/>;
  const s=GS[step];
  return (
    <div style={{animation:"fadeIn .4s ease"}}>
      <div style={{height:2,background:T.border,borderRadius:2,marginBottom:"1.4rem"}}>
        <div style={{height:"100%",width:`${(step/5)*100}%`,background:color,borderRadius:2,transition:"width .5s"}}/>
      </div>
      <div style={{textAlign:"center",marginBottom:"1.35rem"}}>
        <div style={{fontSize:"1.85rem",marginBottom:".65rem"}}>{s.i}</div>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.08rem",color:"rgba(245,239,230,0.8)",marginBottom:".28rem"}}>{s.p}</div>
        <div style={{color:T.faint,fontSize:".72rem"}}>Step {step+1} of 5</div>
      </div>
      <textarea value={input} onChange={e=>setInput(e.target.value)} rows={3} placeholder="Write what you notice…"
        style={{width:"100%",background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"1rem",color:"rgba(245,239,230,0.82)",fontSize:".87rem",fontWeight:300,lineHeight:1.65,resize:"none"}}
        onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();next();}}}
        onFocus={e=>e.target.style.borderColor=T.sageBd} onBlur={e=>e.target.style.borderColor=T.border}/>
      <Btn color={color} onClick={next} disabled={input.trim().length<1}>{step<4?"Next →":"Complete →"}</Btn>
    </div>
  );
}

const RS=[{n:"Jaw",d:8,ins:"Open wide, hold 3 seconds, let it fall completely loose.",i:"😮"},{n:"Shoulders",d:8,ins:"Raise to ears, hold 3 seconds, drop completely.",i:"🤷"},{n:"Neck",d:12,ins:"Roll slowly side to side. Move like warm honey.",i:"🔄"},{n:"Hands",d:8,ins:"Shake loosely — like shaking off water.",i:"🤲"},{n:"Breath",d:8,ins:"In for 4 counts. Out for 8. Release everything.",i:"🌬️"}];

function BodyRelease({onComplete}) {
  const [step,setStep]=useState(0);const [tLeft,setTLeft]=useState(null);const [sDone,setSDone]=useState(false);const [allDone,setAllDone]=useState(false);
  const iRef=useRef(null);const {color}=SC[5];
  function start(){const d=RS[step].d;setTLeft(d);setSDone(false);iRef.current=setInterval(()=>{setTLeft(t=>{if(t<=1){clearInterval(iRef.current);setSDone(true);return 0;}return t-1;});},1000);}
  function next(){clearInterval(iRef.current);setSDone(false);setTLeft(null);if(step>=4)setAllDone(true);else setStep(s=>s+1);}
  useEffect(()=>()=>clearInterval(iRef.current),[]);
  if(allDone) return <TuneDone onComplete={onComplete}/>;
  const s=RS[step];
  return (
    <div style={{animation:"fadeIn .4s ease"}}>
      <div style={{height:2,background:T.border,borderRadius:2,marginBottom:"1.4rem"}}>
        <div style={{height:"100%",width:`${(step/5)*100}%`,background:color,borderRadius:2,transition:"width .5s"}}/>
      </div>
      <div style={{textAlign:"center",padding:"1rem 0"}}>
        <div style={{fontSize:"1.85rem",marginBottom:".75rem"}}>{s.i}</div>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.08rem",color:"rgba(245,239,230,0.8)",marginBottom:".65rem"}}>{s.n}</div>
        <div style={{color:T.muted,fontSize:".83rem",lineHeight:1.72,marginBottom:"1.15rem",maxWidth:285,margin:"0 auto 1.15rem"}}>{s.ins}</div>
        {tLeft!==null?<div><div style={{fontFamily:"'Playfair Display',serif",fontSize:"2.7rem",fontWeight:300,color}}>{tLeft}</div><div style={{color:T.faint,fontSize:".66rem",marginTop:".18rem"}}>seconds</div></div>:<Btn color={color} onClick={start}>Start →</Btn>}
        {sDone&&<div style={{animation:"fadeIn .4s ease",marginTop:"1rem"}}><div style={{color,fontSize:".84rem",marginBottom:".65rem"}}>✓ Done</div><Btn color={color} onClick={next}>{step<4?"Next →":"Complete →"}</Btn></div>}
        {tLeft!==null&&!sDone&&<button onClick={()=>{clearInterval(iRef.current);setSDone(true);}} style={{display:"block",margin:".75rem auto 0",background:"none",border:"none",color:T.faint,fontSize:".7rem",cursor:"pointer"}}>Skip</button>}
        <div style={{color:T.faint,fontSize:".64rem",marginTop:"1rem"}}>Step {step+1} of 5</div>
      </div>
    </div>
  );
}

function TuneDone({onComplete}) {
  return (
    <div style={{textAlign:"center",padding:"2.5rem 1rem",animation:"fadeIn .8s ease"}}>
      <div style={{fontSize:"2rem",marginBottom:"1rem",animation:"drift 4s ease infinite"}}>🌿</div>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.42rem",fontWeight:300,fontStyle:"italic",color:T.sage,marginBottom:".32rem"}}>Your body has settled.</div>
      <div style={{color:T.muted,fontSize:".82rem",marginBottom:"1.8rem",lineHeight:1.78}}>Thought. Emotion. Body.<br/>You moved through all three.</div>
      <Btn color={T.sage} onClick={onComplete}>Complete my session →</Btn>
    </div>
  );
}

function StepDone({session,onNew,onHome}) {
  const items=[
    {label:"What you were carrying",val:session.situation?.slice(0,100)+(session.situation?.length>100?"…":""),color:T.gold,bg:T.goldBg},
    {label:"What you felt",val:session.emotion,color:T.rose,bg:T.roseBg},
    {label:"What you chose to do",val:session.action,color:T.sage,bg:T.sageBg},
  ].filter(i=>i.val);
  return (
    <div style={{textAlign:"center",animation:"fadeIn .8s ease"}}>
      <div style={{marginBottom:"2rem"}}>
        <div style={{fontSize:"2rem",marginBottom:"1.15rem",animation:"drift 5s ease infinite"}}>🌿</div>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.95rem",fontWeight:300,fontStyle:"italic",color:T.sage,lineHeight:1.2,marginBottom:".55rem"}}>All is well.<br/>You are okay.</div>
        <div style={{width:26,height:1,background:T.sageBd,margin:"1rem auto"}}/>
        <div style={{fontSize:".85rem",color:T.muted,lineHeight:1.88,maxWidth:330,margin:"0 auto 1rem"}}>You just moved through your thoughts, your emotions, and your body. That takes more courage than it looks like from the outside.</div>
        <div style={{fontFamily:"'Playfair Display',serif",fontStyle:"italic",fontSize:".87rem",color:T.faint,lineHeight:1.78}}>"The storm you were inside five minutes ago is the same storm.<br/>But you are no longer the same person standing in it."</div>
      </div>
      <div style={{padding:"1.15rem 1.25rem",borderRadius:16,background:T.sageBg,border:`1px solid ${T.sageBd}`,marginBottom:"1.5rem"}}>
        <div style={{fontSize:".63rem",fontWeight:600,letterSpacing:".16em",textTransform:"uppercase",color:T.sage,marginBottom:".52rem",opacity:.8}}>One last breath</div>
        <div style={{fontSize:".83rem",color:T.muted,lineHeight:1.88}}>In slowly for 4 counts.<br/>Hold for 2.<br/>Let it go completely.<br/><span style={{color:T.sage,fontStyle:"italic"}}>You're done. You're grounded. You're good.</span></div>
      </div>
      {items.map(({label,val,color,bg})=>(
        <div key={label} style={{padding:".76rem .98rem",borderRadius:12,marginBottom:".48rem",textAlign:"left",background:bg,border:`1px solid ${color}1C`}}>
          <div style={{fontSize:".59rem",fontWeight:600,letterSpacing:".14em",textTransform:"uppercase",color,marginBottom:".2rem"}}>{label}</div>
          <div style={{fontSize:".81rem",color:T.muted,lineHeight:1.55}}>{val}</div>
        </div>
      ))}
      <div style={{padding:".88rem 1rem",borderRadius:12,marginTop:".75rem",marginBottom:"1.15rem",background:T.goldBg,border:`1px solid ${T.goldBd}`,textAlign:"left"}}>
        <div style={{fontSize:".81rem",color:T.muted,lineHeight:1.72}}>Do your action within the next 30 minutes. Not perfectly. Just the first small move.</div>
      </div>
      <Btn color={T.gold} onClick={onNew}>New session →</Btn>
      <button onClick={onHome} style={{display:"block",width:"100%",marginTop:".38rem",background:"none",border:"none",color:T.faint,fontSize:".77rem",padding:".36rem"}}>← Back to home</button>
    </div>
  );
}

const SMETA=[
  {hd:"What is actually real right now?",sub:"Most suffering starts with assumption, not fact."},
  {hd:"Where does your power lie?",sub:"Sorting what you control restores agency immediately."},
  {hd:"What are you feeling?",sub:"Naming it precisely reduces its intensity. This is neuroscience."},
  {hd:"One small step forward.",sub:"Not a plan. One specific, immediately doable action."},
  {hd:"Let your body catch up.",sub:"Your mind is clear. Now bring your body along."},
];

function SessionShell({onHome}) {
  const [step,setStep]=useState(0);
  const [session,setSession]=useState({date:new Date().toISOString()});
  const save=upd=>setSession(s=>({...s,...upd}));
  function finish(action){
    const final={...session,action};setSession(final);
    try{const p=JSON.parse(localStorage.getItem("reset_v7")||"[]");localStorage.setItem("reset_v7",JSON.stringify([final,...p].slice(0,30)));}catch{}
    setStep(6);
  }
  const meta=step>=1&&step<=5?SMETA[step-1]:null;
  const sc=SC[step]||{color:T.gold,bg:T.goldBg,bd:T.goldBd};
  const progress=step===0?0:Math.min(Math.round((step/5)*100),100);
  return (
    <div style={{minHeight:"100vh",background:T.bg}}>
      <style>{CSS}</style>
      <div style={{position:"fixed",top:0,left:"50%",transform:"translateX(-50%)",width:440,height:200,background:`radial-gradient(ellipse at top,${sc.bg},transparent 70%)`,pointerEvents:"none",zIndex:0,transition:"background 1s"}}/>
      <div style={{position:"sticky",top:0,zIndex:50,display:"flex",justifyContent:"space-between",alignItems:"center",padding:".8rem 1.35rem",background:"rgba(40,27,10,0.96)",backdropFilter:"blur(20px)",borderBottom:`1px solid ${T.border}`}}>
        <button onClick={onHome} style={{fontFamily:"'Playfair Display',serif",fontSize:"1.22rem",color:T.gold,background:"none",border:"none",letterSpacing:".1em",opacity:.8}}>RESET</button>
        <div style={{display:"flex",gap:".26rem"}}>
          {"RESET".split("").map((l,i)=>{const s=i+1;const done=s<step;const active=s===step;const c=SC[s];return(
            <div key={i} style={{width:25,height:25,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:".66rem",fontWeight:600,fontFamily:"'Playfair Display',serif",background:done?"rgba(212,168,83,0.1)":active?c.color:"rgba(245,239,230,0.04)",color:active?T.bg:done?T.gold:T.faint,border:done?`1px solid ${T.goldBd}`:"none",transition:"all .4s"}}>{l}</div>
          );})}
        </div>
        <div style={{width:42}}/>
      </div>
      {step>0&&step<6&&(
        <div style={{padding:".65rem 1.35rem .4rem",maxWidth:495,margin:"0 auto"}}>
          {/* Labels — the four milestones */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:".5rem",position:"relative"}}>
            <span style={{
              fontSize:".72rem",
              color:"rgba(201,123,110,0.75)",
              fontFamily:"'Playfair Display',serif",
              fontStyle:"italic",
              letterSpacing:".02em",
            }}>Overwhelmed</span>
            <span style={{
              fontSize:".72rem",
              color: progress>=100 ? T.sage : "rgba(245,239,230,0.2)",
              fontFamily:"'Playfair Display',serif",
              fontStyle:"italic",
              letterSpacing:".02em",
              transition:"color .8s ease",
              textShadow: progress>=100 ? `0 0 14px ${T.sage}50` : "none",
            }}>At peace</span>
          </div>

          {/* Track */}
          <div style={{position:"relative",height:5,background:"rgba(255,245,232,0.07)",borderRadius:20}}>
            {/* Fill */}
            <div style={{position:"absolute",left:0,top:0,height:"100%",width:`${progress}%`,borderRadius:20,background:`linear-gradient(90deg,${T.gold}60,${sc.color})`,transition:"width .9s cubic-bezier(0.4,0,0.2,1)"}}/>
            {/* Glowing dot */}
            <div style={{position:"absolute",top:"50%",left:`${progress}%`,transform:"translate(-50%,-50%)",width:13,height:13,borderRadius:"50%",background:sc.color,boxShadow:`0 0 10px ${sc.color}80`,border:"2px solid #2D1F0F",transition:"left .9s cubic-bezier(0.4,0,0.2,1)",zIndex:2}}/>
          </div>

          {/* Percentage + message */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:".42rem"}}>
            <span style={{fontSize:".64rem",color:sc.color,fontWeight:500,letterSpacing:".04em"}}>{progress}%</span>
            <span style={{fontSize:".62rem",color:T.faint,fontStyle:"italic"}}>
              {progress<=20?"Beginning to untangle…"
                :progress<=40?"Finding what's in your power…"
                :progress<=60?"Naming what you feel…"
                :progress<=80?"Choosing one step forward…"
                :"Let your body arrive too"}
            </span>
          </div>
        </div>
      )}
      <div style={{position:"relative",zIndex:1,maxWidth:495,margin:"0 auto",padding:"1.9rem 1.35rem 5rem"}}>
        {meta&&(
          <div style={{marginBottom:"1.45rem",animation:"fadeIn .4s ease"}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(1.38rem,3.5vw,1.82rem)",fontWeight:400,lineHeight:1.18,marginBottom:".35rem",color:"rgba(245,239,230,0.84)"}}>{meta.hd}</div>
            <div style={{color:T.faint,fontSize:".78rem",lineHeight:1.7}}>{meta.sub}</div>
          </div>
        )}
        {step===0&&(
          <div style={{paddingTop:".4rem",animation:"fadeIn .5s ease"}}>
            <div style={{display:"flex",justifyContent:"center",marginBottom:"1.7rem"}}><ThreeCircles size={230} animated={true}/></div>
            <div style={{textAlign:"center",marginBottom:"1.9rem"}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(1.65rem,5vw,2.3rem)",fontWeight:300,fontStyle:"italic",color:"rgba(245,239,230,0.83)",lineHeight:1.15,marginBottom:".45rem"}}>What's weighing<br/>on you right now?</div>
              <div style={{fontSize:".76rem",color:T.faint,lineHeight:1.72,fontStyle:"italic"}}>Five minutes. Five steps. Thought, emotion, body.</div>
            </div>
            <StepSituation onNext={v=>{save({situation:v});setStep(1);}}/>
          </div>
        )}
        {step===1&&<StepRecognize situation={session.situation} onNext={r=>{save({clarify:r});setStep(2);}}/>}
        {step===2&&<StepExamine onNext={b=>{save({buckets:b});setStep(3);}}/>}
        {step===3&&<StepSurface situation={session.situation} onNext={e=>{save({emotion:e});setStep(4);}}/>}
        {step===4&&<StepExecute situation={session.situation} emotion={session.emotion} onNext={a=>finish(a)}/>}
        {step===5&&<StepTune onComplete={()=>setStep(6)}/>}
        {step===6&&<StepDone session={session} onNew={()=>{setStep(0);setSession({date:new Date().toISOString()});}} onHome={onHome}/>}
      </div>
    </div>
  );
}

function History({onBack,onNew}) {
  const sessions=(()=>{try{return JSON.parse(localStorage.getItem("reset_v7")||"[]");}catch{return[];}})();
  return (
    <div style={{minHeight:"100vh",background:T.bg,padding:"2rem 1.35rem"}}>
      <style>{CSS}</style>
      <div style={{maxWidth:480,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"2.4rem"}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.6rem",fontWeight:300,fontStyle:"italic",color:"rgba(245,239,230,0.78)"}}>Your sessions</div>
          <div style={{display:"flex",gap:".48rem"}}>
            <button onClick={onNew} style={{padding:".32rem .72rem",borderRadius:8,border:`1px solid ${T.goldBd}`,background:"transparent",color:T.gold,fontSize:".72rem"}}>New</button>
            <button onClick={onBack} style={{padding:".32rem .72rem",borderRadius:8,border:`1px solid ${T.border}`,background:"transparent",color:T.muted,fontSize:".72rem"}}>← Back</button>
          </div>
        </div>
        {!sessions.length?(
          <div style={{textAlign:"center",padding:"4rem 2rem"}}><ThreeCircles size={115} animated={false}/><div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.28rem",fontStyle:"italic",marginTop:"1.35rem",color:T.faint}}>No sessions yet</div></div>
        ):sessions.map((s,i)=>(
          <div key={i} style={{padding:"1rem 1.15rem",borderRadius:13,marginBottom:".58rem",border:`1px solid ${T.border}`,background:T.card}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:".4rem"}}>
              <span style={{fontSize:".61rem",padding:".15rem .5rem",borderRadius:20,background:T.goldBg,color:T.gold,fontWeight:500}}>Session {sessions.length-i}</span>
              <span style={{color:T.faint,fontSize:".64rem"}}>{new Date(s.date).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</span>
            </div>
            <div style={{fontSize:".8rem",color:T.muted,marginBottom:".4rem",fontStyle:"italic",lineHeight:1.55}}>"{s.situation?.slice(0,82)}{s.situation?.length>82?"…":""}"</div>
            <div style={{display:"flex",gap:".32rem",flexWrap:"wrap"}}>
              {s.emotion&&<span style={{fontSize:".6rem",padding:".14rem .5rem",borderRadius:20,background:T.roseBg,color:T.rose,fontWeight:500}}>Felt: {s.emotion}</span>}
              {s.action&&<span style={{fontSize:".6rem",padding:".14rem .5rem",borderRadius:20,background:T.sageBg,color:T.sage,fontWeight:500}}>✓ Action taken</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Landing({onStart,onHistory,onEmergency}) {
  const [email,setEmail]=useState("");
  const [joined,setJoined]=useState(false);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");

  async function handleJoin(){
    if(!email.trim()||!email.includes("@")){setError("Please enter a valid email.");return;}
    setLoading(true);setError("");
    try{await subscribeToBrevo(email.trim().toLowerCase());setJoined(true);}
    catch{setError("Something went wrong. Please try again.");}
    finally{setLoading(false);}
  }

  return (
    <div style={{background:T.bg,minHeight:"100vh",overflowX:"hidden"}}>
      <style>{CSS}</style>
      <div style={{position:"fixed",top:0,left:"50%",transform:"translateX(-50%)",width:680,height:380,background:"radial-gradient(ellipse at top,rgba(212,168,83,0.055),transparent 65%)",pointerEvents:"none",zIndex:0}}/>

      {/* Nav */}
      <nav style={{position:"sticky",top:0,zIndex:50,display:"flex",justifyContent:"space-between",alignItems:"center",padding:".95rem 2.4rem",background:"rgba(40,27,10,0.93)",backdropFilter:"blur(20px)",borderBottom:`1px solid ${T.border}`}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.28rem",color:T.gold,letterSpacing:".12em",opacity:.8}}>RESET<span style={{fontSize:".58rem",fontWeight:300,letterSpacing:".2em",marginLeft:".38rem",verticalAlign:"middle",opacity:.48}}>METHOD</span></div>
        <div style={{display:"flex",gap:".85rem",alignItems:"center"}}>
          <button style={{background:"none",border:"none",color:T.faint,fontSize:".76rem",cursor:"pointer"}} onClick={onHistory}>Sessions</button>
          <button onClick={onStart} style={{padding:".55rem 1.3rem",borderRadius:50,background:T.goldBg,color:T.gold,border:`1px solid ${T.goldBd}`,fontSize:".8rem",fontWeight:500,cursor:"pointer"}}>Begin →</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{position:"relative",zIndex:1,maxWidth:960,margin:"0 auto",padding:"5rem 2.4rem 4rem",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"3.5rem",alignItems:"center"}}>
        <div style={{animation:"slideUp .9s ease"}}>
          <div style={{fontSize:".57rem",letterSpacing:".32em",textTransform:"uppercase",color:T.gold,opacity:.58,marginBottom:"1.45rem"}}>Ancient Wisdom · Modern Neuroscience</div>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(2.3rem,5vw,3.8rem)",fontWeight:400,lineHeight:1.1,marginBottom:"1.45rem",color:"rgba(245,239,230,0.85)"}}>
            From overwhelmed<br/>to{" "}
            <em style={{color:T.gold,background:"linear-gradient(90deg,#D4A853,#E8C876,#D4A853)",backgroundSize:"200% auto",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",animation:"shimmer 4s linear infinite"}}>grounded</em>
            <br/>in five minutes.
          </h1>
          <p style={{color:T.muted,fontSize:".88rem",lineHeight:1.92,maxWidth:370,marginBottom:"1.9rem",fontWeight:300}}>Five steps through all three layers of stress — thought, emotion, and body — in the right sequence.</p>
          <div style={{display:"flex",gap:".8rem",flexWrap:"wrap",alignItems:"center"}}>
            <button onClick={onStart} style={{padding:".8rem 1.85rem",borderRadius:50,background:T.goldBg,color:T.gold,border:`1px solid ${T.goldBd}`,fontSize:".86rem",fontWeight:500,cursor:"pointer",transition:"all .3s"}}
              onMouseEnter={e=>{e.currentTarget.style.background="rgba(212,168,83,0.15)";e.currentTarget.style.transform="translateY(-2px)";}}
              onMouseLeave={e=>{e.currentTarget.style.background=T.goldBg;e.currentTarget.style.transform="translateY(0)";}}>
              Begin a free session →
            </button>
            <span style={{color:T.faint,fontSize:".74rem"}}>Free · Private · 5 min</span>
          </div>
        </div>
        <div style={{display:"flex",justifyContent:"center",animation:"slideUp 1s .18s ease both"}}>
          <ThreeCircles size={305} animated={true}/>
        </div>
      </section>

      {/* Insight */}
      <section style={{background:"rgba(212,168,83,0.03)",borderTop:`1px solid ${T.goldBd}`,borderBottom:`1px solid ${T.goldBd}`,padding:"4.5rem 2.4rem",position:"relative",zIndex:1}}>
        <div style={{maxWidth:640,margin:"0 auto",textAlign:"center"}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(1.35rem,2.8vw,2.1rem)",fontWeight:300,fontStyle:"italic",lineHeight:1.62,color:"rgba(245,239,230,0.62)"}}>
            "Vedantic philosophy called them koshas.<br/>Modern neuroscience calls them cognitive distortion, affect labeling, and polyvagal regulation.<br/>
            <span style={{color:T.gold,fontStyle:"normal",fontWeight:500}}>Same map. 3,000 years apart.</span>"
          </div>
        </div>
      </section>

      {/* Steps */}
      <section style={{maxWidth:560,margin:"0 auto",padding:"5.5rem 2.4rem",position:"relative",zIndex:1}}>
        <div style={{fontSize:".57rem",letterSpacing:".3em",textTransform:"uppercase",color:T.gold,opacity:.52,marginBottom:"2.6rem",textAlign:"center"}}>How it works</div>
        {[
          {k:"R",label:"Recognize reality",sub:"Separates facts from assumptions from catastrophizing — using your exact words.",color:T.gold},
          {k:"E",label:"Examine your control",sub:"Sort concerns into what you control, influence, or release. Restores power immediately.",color:T.sky},
          {k:"S",label:"Surface your emotion",sub:"Name exactly what you're feeling. Receive a warm, personal response. Not generic — yours.",color:T.rose},
          {k:"E",label:"Execute one action",sub:"One micro-action specific to your exact situation. Immediately doable.",color:T.sand},
          {k:"T",label:"Tune your body",sub:"Box breathing, grounding, or physical release. Your nervous system catches up.",color:T.sage},
        ].map(({k,label,sub,color},i)=>(
          <div key={i} style={{display:"flex",gap:"1.35rem",padding:"1.42rem 0",borderBottom:`1px solid ${T.border}`}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:"2.5rem",fontWeight:300,color,lineHeight:1,minWidth:36,opacity:.68}}>{k}</div>
            <div style={{paddingTop:".14rem"}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:".96rem",color:"rgba(245,239,230,0.76)",marginBottom:".2rem"}}>{label}</div>
              <div style={{color:T.faint,fontSize:".78rem",lineHeight:1.78}}>{sub}</div>
            </div>
          </div>
        ))}
        <div style={{marginTop:"2.6rem",textAlign:"center"}}>
          <button onClick={onStart} style={{padding:".8rem 1.85rem",borderRadius:50,background:T.goldBg,color:T.gold,border:`1px solid ${T.goldBd}`,fontSize:".86rem",fontWeight:500,cursor:"pointer"}}>Begin your first session →</button>
        </div>
      </section>

      {/* Pull quote */}
      <section style={{maxWidth:520,margin:"0 auto",padding:"3.5rem 2.4rem 5rem",position:"relative",zIndex:1}}>
        <div style={{borderLeft:`1px solid ${T.goldBd}`,paddingLeft:"1.7rem"}}>
          <blockquote style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(1rem,1.9vw,1.45rem)",fontWeight:300,fontStyle:"italic",lineHeight:1.88,color:T.muted}}>
            "This is not — close your eyes and breathe.<br/>This is — here is the reality.<br/>Here is your power. Here is your action.<br/>
            <strong style={{fontStyle:"normal",fontWeight:500,color:"rgba(245,239,230,0.76)"}}>Now breathe.</strong>"
          </blockquote>
        </div>
      </section>

      {/* Email */}
      <section style={{background:"rgba(212,168,83,0.03)",borderTop:`1px solid ${T.goldBd}`,padding:"4.5rem 2.4rem",position:"relative",zIndex:1}}>
        <div style={{maxWidth:380,margin:"0 auto",textAlign:"center"}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(1.25rem,2.5vw,1.88rem)",fontWeight:300,fontStyle:"italic",color:"rgba(245,239,230,0.7)",lineHeight:1.35,marginBottom:".75rem"}}>One email. One insight.<br/>Every week.</div>
          <p style={{color:T.faint,fontSize:".8rem",lineHeight:1.82,marginBottom:"1.7rem"}}>No noise. No selling. Just one thing worth carrying with you.</p>
          {joined?(
            <div style={{padding:"1rem 2rem",borderRadius:12,background:T.sageBg,border:`1px solid ${T.sageBd}`,color:T.sage,fontSize:".86rem"}}>🌿 You're in. Welcome.</div>
          ):(
            <div>
              <div style={{display:"flex",gap:".52rem",flexWrap:"wrap",justifyContent:"center",marginBottom:".42rem"}}>
                <input value={email} onChange={e=>{setEmail(e.target.value);setError("");}} type="email" placeholder="Your email"
                  onKeyDown={e=>{if(e.key==="Enter")handleJoin();}}
                  style={{flex:1,minWidth:178,padding:".75rem 1rem",borderRadius:10,border:`1px solid ${error?T.roseBd:T.border}`,background:T.card,color:"rgba(245,239,230,0.76)",fontSize:".84rem"}}/>
                <button onClick={handleJoin} disabled={loading} style={{padding:".75rem 1.25rem",borderRadius:10,background:T.goldBg,color:T.gold,border:`1px solid ${T.goldBd}`,fontSize:".84rem",fontWeight:500,cursor:"pointer",opacity:loading?.6:1}}>
                  {loading?"…":"Join →"}
                </button>
              </div>
              {error&&<div style={{fontSize:".7rem",color:T.rose,marginBottom:".38rem"}}>{error}</div>}
              <div style={{fontSize:".64rem",color:T.faint,fontStyle:"italic"}}>✓ GDPR compliant · ✓ Unsubscribe anytime</div>
            </div>
          )}
        </div>
      </section>

      {/* Final CTA */}
      <section style={{padding:"7rem 2.4rem",textAlign:"center",position:"relative",zIndex:1}}>
        <div style={{display:"flex",justifyContent:"center",marginBottom:"1.9rem"}}><ThreeCircles size={170} animated={true}/></div>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(1.75rem,3.8vw,2.9rem)",fontWeight:300,fontStyle:"italic",color:"rgba(245,239,230,0.77)",lineHeight:1.15,marginBottom:"1.75rem"}}>Your first RESET<br/>is one click away.</div>
        <button onClick={onStart} style={{padding:".88rem 2.35rem",borderRadius:50,background:T.goldBg,color:T.gold,border:`1px solid ${T.goldBd}`,fontSize:".9rem",fontWeight:500,cursor:"pointer"}}>Begin your free session →</button>
        <div style={{marginTop:".75rem",color:T.faint,fontSize:".72rem"}}>Free · Private · 5 minutes · No signup needed</div>
        <button onClick={onEmergency} style={{marginTop:"1.2rem",background:"none",border:"none",color:"rgba(201,123,110,0.5)",fontSize:".76rem",cursor:"pointer",letterSpacing:".02em"}}>
          I need help right now →
        </button>
      </section>

      {/* Coming soon — seeds the vision */}
      <section style={{borderTop:`1px solid ${T.border}`,padding:"4rem 2.4rem",position:"relative",zIndex:1}}>
        <div style={{maxWidth:580,margin:"0 auto",textAlign:"center"}}>
          <div style={{fontSize:".58rem",letterSpacing:".28em",textTransform:"uppercase",color:T.gold,opacity:.5,marginBottom:"1.2rem"}}>What we're building</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(1.2rem,2.5vw,1.75rem)",fontWeight:300,fontStyle:"italic",color:"rgba(245,239,230,0.6)",lineHeight:1.55,marginBottom:"1.8rem"}}>
            Most apps help you feel better in the moment.<br/>
            <span style={{color:"rgba(245,239,230,0.82)"}}>RESET is building something different.</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:"1rem",marginBottom:"2rem",textAlign:"left"}}>
            {[
              {icon:"◎",title:"Pattern recognition",desc:"After a few sessions, RESET will notice what triggers you — before you do.",soon:true},
              {icon:"◈",title:"Personal coaching",desc:"Guidance that learns your patterns and speaks directly to your growth.",soon:true},
              {icon:"◇",title:"Session memory",desc:"Pick up where you left off. Your journey remembered across sessions.",soon:true},
              {icon:"○",title:"Progress over time",desc:"Watch your emotional patterns shift. See yourself changing.",soon:true},
            ].map(({icon,title,desc,soon})=>(
              <div key={title} style={{padding:"1rem 1.1rem",borderRadius:13,background:T.card,border:`1px solid ${T.border}`,position:"relative"}}>
                {soon&&<span style={{position:"absolute",top:".6rem",right:".7rem",fontSize:".58rem",padding:".15rem .45rem",borderRadius:20,background:T.goldBg,color:T.gold,border:`1px solid ${T.goldBd}`,letterSpacing:".06em"}}>Soon</span>}
                <div style={{color:T.gold,fontSize:"1rem",marginBottom:".5rem",opacity:.7}}>{icon}</div>
                <div style={{fontSize:".82rem",fontWeight:500,color:"rgba(245,239,230,0.72)",marginBottom:".3rem"}}>{title}</div>
                <div style={{fontSize:".75rem",color:T.faint,lineHeight:1.7}}>{desc}</div>
              </div>
            ))}
          </div>
          <div style={{fontSize:".78rem",color:T.faint,lineHeight:1.8,fontStyle:"italic"}}>
            You are part of building this. Every session shapes what RESET becomes.
          </div>
        </div>
      </section>

      <footer style={{textAlign:"center",padding:"1.8rem",color:T.faint,fontSize:".64rem",borderTop:`1px solid ${T.border}`,opacity:.45,letterSpacing:".06em"}}>
        © 2025 The RESET Method · Ancient wisdom · Modern neuroscience
      </footer>
    </div>
  );
}

export default function App() {
  const [view,setView]=useState("landing");
  const start=()=>setView("session");
  return (
    <>
      <style>{CSS}</style>
      {view==="landing"&&<Landing onStart={start} onHistory={()=>setView("history")} onEmergency={()=>setView("emergency")}/>}
      {view==="session"&&<SessionShell onHome={()=>setView("landing")}/>}
      {view==="history"&&<History onBack={()=>setView("landing")} onNew={start}/>}
      {view==="emergency"&&<EmergencyMode onExit={()=>setView("landing")}/>}
    </>
  );
}
