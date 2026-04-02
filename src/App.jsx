import { useState, useEffect, useRef } from "react";

/* ─────────────────────────────────────────────
   SUPABASE — auth + session storage
───────────────────────────────────────────── */
const SUPABASE_URL = "https://wlkevpdibbsyjnlabzwn.supabase.co";
const SUPABASE_KEY = "sb_publishable_PaA94m80uBBLInEpv8AoDA_fLaYCjGX";

async function sbFetch(path, options={}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=minimal",
      ...options.headers,
    },
  });
  return res;
}

async function sendMagicLink(email) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/magiclink`, {
    method: "POST",
    headers: { "apikey": SUPABASE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return res.ok;
}

async function getSession() {
  // Check URL for magic link token
  const hash = window.location.hash;
  if (hash.includes("access_token")) {
    const params = new URLSearchParams(hash.replace("#","?"));
    const token = params.get("access_token");
    if (token) {
      // Get user from token
      const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${token}` },
      });
      if (res.ok) {
        const user = await res.json();
        const sessionData = { token, user, email: user.email };
        localStorage.setItem("reset_auth", JSON.stringify(sessionData));
        window.history.replaceState(null, "", window.location.pathname);
        return sessionData;
      }
    }
  }
  // Check localStorage
  try {
    const stored = localStorage.getItem("reset_auth");
    if (stored) return JSON.parse(stored);
  } catch {}
  return null;
}

function signOut() {
  localStorage.removeItem("reset_auth");
}

async function saveSessionToCloud(session, token) {
  // Extract user id from JWT
  let userId = null;
  try { userId = JSON.parse(atob(token.split('.')[1])).sub; } catch {}
  await sbFetch("reset_sessions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}`, "Prefer": "return=minimal" },
    body: JSON.stringify({
      user_id: userId,
      situation: session.situation,
      emotion: session.emotion,
      action: session.action,
      // created_at auto-filled by Supabase
    }),
  });
}

async function loadSessionsFromCloud(token) {
  const res = await sbFetch("reset_sessions?select=*&order=created_at.desc&limit=30", {
    headers: { "Authorization": `Bearer ${token}` },
  });
  if (res.ok) return await res.json();
  return [];
}

async function subscribeToBrevo(email) {
  const res = await fetch("/api/subscribe", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ email }) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "failed");
  return data;
}
async function callResetAI(step, situation, emotion = "", intake = {}) {
  const res = await fetch("/api/reset", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ step, situation, emotion, intake }) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.fallback) return null;
  return data.data;
}

const T = {
  // Warm parchment — strong contrast, fully readable
  bg:"#F4EEE4",     bgWarm:"#EDE5D8",
  card:"rgba(255,255,255,0.7)",   border:"rgba(100,75,45,0.2)",
  cream:"#1A1108",  muted:"rgba(26,17,8,0.72)",    faint:"rgba(26,17,8,0.42)",
  gold:"#7A5010",   goldBg:"rgba(122,80,16,0.12)",  goldBd:"rgba(122,80,16,0.32)",
  rose:"#8C3C30",   roseBg:"rgba(140,60,48,0.1)",   roseBd:"rgba(140,60,48,0.28)",
  sage:"#2A5E44",   sageBg:"rgba(42,94,68,0.1)",    sageBd:"rgba(42,94,68,0.28)",
  sky:"#28587A",    skyBg:"rgba(40,88,122,0.1)",    skyBd:"rgba(40,88,122,0.28)",
  sand:"#6A4818",   sandBg:"rgba(106,72,24,0.1)",   sandBd:"rgba(106,72,24,0.28)",
  lav:"#4E4070",
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
body{background:#F7F0E6;color:#2C1F14;font-family:'DM Sans',sans-serif;font-weight:300;-webkit-font-smoothing:antialiased;}
textarea,input{font-family:'DM Sans',sans-serif;outline:none;}
textarea::placeholder,input::placeholder{color:rgba(44,31,20,0.32);}
button{font-family:'DM Sans',sans-serif;cursor:pointer;}
::-webkit-scrollbar{width:2px;}::-webkit-scrollbar-thumb{background:rgba(139,105,72,0.25);}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes drift{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
@keyframes f1{0%,100%{transform:translate(0,0)}50%{transform:translate(3px,-5px)}}
@keyframes f2{0%,100%{transform:translate(0,0)}50%{transform:translate(-4px,4px)}}
@keyframes f3{0%,100%{transform:translate(0,0)}50%{transform:translate(4px,3px)}}
@keyframes breathe{0%,100%{opacity:0.5;transform:scale(1)}50%{opacity:0.9;transform:scale(1.06)}}
@keyframes pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.08);opacity:0.85}}
@keyframes logoGlow{0%,100%{opacity:.82}50%{opacity:1}}
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
      <text x={cx} y={cy+off*0.15} textAnchor="middle" dominantBaseline="middle" fontFamily="'Playfair Display',serif" fontSize={size*0.065} fill="rgba(44,31,20,0.78)" letterSpacing="0.1em">RESET</text>
      <text x={cx} y={cy+off*0.15+size*0.05} textAnchor="middle" dominantBaseline="middle" fontFamily="'DM Sans',sans-serif" fontSize={size*0.024} fill="rgba(44,31,20,0.35)" letterSpacing="0.2em">METHOD</text>
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
          <div style={{fontSize:".82rem",color:"rgba(44,31,20,0.55)",lineHeight:1.82,marginBottom:".75rem"}}>{d.w}</div>
          <div style={{fontSize:".74rem",color:"rgba(44,31,20,0.32)",lineHeight:1.7,fontStyle:"italic",borderTop:`1px solid ${bd}`,paddingTop:".65rem"}}>
            <span style={{color,marginRight:".3rem"}}>✦</span>{d.s}
          </div>
        </div>
      )}
    </div>
  );
}

const Btn=({onClick,disabled,color,children})=>{
  const c=color||T.gold;
  return <button onClick={onClick} disabled={disabled} style={{display:"block",width:"100%",marginTop:"1.4rem",padding:"1rem 1.4rem",borderRadius:14,border:`1px solid ${disabled?"rgba(61,46,26,0.07)":c}`,background:disabled?"transparent":`${c}12`,color:disabled?T.faint:c,fontSize:".9rem",fontWeight:500,letterSpacing:".04em",transition:"all .2s",opacity:disabled?.35:1}}>{children}</button>;
};

const Spin=({color,msg})=>(
  <div style={{padding:"2.5rem 1rem",textAlign:"center"}}>
    <div style={{width:20,height:20,border:`1.5px solid ${color||T.gold}`,borderTopColor:"transparent",borderRadius:"50%",margin:"0 auto .9rem",animation:"spin 1s linear infinite"}}/>
    {msg&&<div style={{color:T.faint,fontSize:".78rem",fontStyle:"italic"}}>{msg}</div>}
  </div>
);

function deepAnalyze(text) {
  // Gibberish guard — if input is not real text, return gentle prompt
  if(isGibberish(text)) {
    return {
      facts:[],
      mindAdding:[],
      summary:"Take a breath. When you are ready, tell me what is actually going on — even a few honest words is enough.",
      friendNote:"There is no rush. I am here when you are ready.",
      isGentle:true
    };
  }
  const t = text.toLowerCase();
  const sentences = text.split(/[.!?]+/).map(s=>s.trim()).filter(s=>s.length>6);
  const first = sentences[0] || text.slice(0,120);

  // If someone says they feel good — acknowledge it, don't treat it as a crisis
  const isPositive = /\b(feel good|feeling good|feeling great|feeling okay|i'm okay|i am okay|i'm fine|i am fine|feeling better|much better|doing well|doing good|actually good|pretty good|not bad)\b/.test(t);
  if(isPositive) {
    return {
      facts: [`You said you are feeling good — that is real and worth acknowledging`],
      mindAdding: [],
      summary: `You came here and you are okay. That matters. Sometimes checking in when things are good is the wisest thing you can do — it builds the practice before the hard moments arrive.`,
      friendNote: `Stay with this feeling for a moment. Notice it. It is real too.`,
    };
  }

  const m = {
    // Work — expanded to catch real language people use
    boss:         /\b(boss|manager|supervisor|director|colleague|coworker|team|meeting|office|work|job|career|project|task|backlog|sprint|deadline|client|report|presentation)\b/.test(t),
    fired:        /\b(fired|let go|laid off|lose my job|losing my job|redundant|terminated|dismissed)\b/.test(t),
    deadline:     /\b(deadline|due|deliver|presentation|tomorrow|urgent|overdue|running out of time|behind|late)\b/.test(t),
    mistake:      /\b(mistake|screwed|messed up|failed|wrong|error|fault|my fault|blunder|let down)\b/.test(t),
    overwhelmed:  /\b(overwhelmed|too much|can.t cope|drowning|swamped|exhausted|burnout|so much|everything|buried|snowed under|can.t keep up|falling behind|piling up|items|list|tasks)\b/.test(t),
    ignored:      /\b(ignored|silent|silence|cold|distant|avoiding|not responding|ghosting|dismissed|unheard)\b/.test(t),
    // Relationships
    relationship: /\b(partner|relationship|breakup|divorce|girlfriend|boyfriend|spouse|husband|wife|ex)\b/.test(t),
    family:       /\b(family|mother|father|parent|sister|brother|child|children|son|daughter)\b/.test(t),
    lonely:       /\b(lonely|alone|isolated|no one|nobody|disconnected|unloved)\b/.test(t),
    conflict:     /\b(argument|fight|conflict|tension|shouted|yelled|said to me|told me|hurt me)\b/.test(t),
    // Physical / health
    sleep:        /\b(sleep|sleeping|insomnia|awake|waking up|can.t sleep|not sleeping|tired|exhausted|fatigue)\b/.test(t),
    health:       /\b(health|sick|doctor|diagnosis|pain|symptom|hospital|illness|disease|cancer|anxiety disorder)\b/.test(t),
    body:         /\b(body|chest|heart racing|tight|heavy|numb|shaking|crying|tears)\b/.test(t),
    // Life / existential
    money:        /\b(money|debt|rent|bill|financial|afford|broke|loan|salary|savings)\b/.test(t),
    future:       /\b(future|direction|purpose|meaning|lost|don.t know|what to do|stuck|going nowhere)\b/.test(t),
    grief:        /\b(died|death|loss|grieving|grief|miss|missing|gone|passed away)\b/.test(t),
    rejected:     /\b(rejected|turned down|not selected|didn.t get|lost|missed out|not good enough)\b/.test(t),
    shame:        /\b(ashamed|shame|embarrassed|humiliated|stupid|worthless|failure|not enough)\b/.test(t),
    fear:         /\b(scared|afraid|fear|terrified|anxious|panic|worried|dread)\b/.test(t),
  };

  const catW = (text.match(/\b(never|always|ruined|disaster|hopeless|worthless|terrible|worst|doomed|impossible|everything is|nothing works|no point)\b/gi)||[]);
  const absW = (text.match(/\b(everyone|nobody|always|never|everything|nothing|completely|forever|no one ever)\b/gi)||[]);

  // FACTS — only what they actually mentioned
  const facts = [];
  if (m.sleep)        facts.push(`You are not sleeping — that is affecting everything else right now`);
  if (m.boss && m.ignored) facts.push(`Your manager has gone silent — that silence is real, whatever it means`);
  else if (m.boss)    facts.push(`Something real is happening with your manager`);
  if (m.deadline)     facts.push(`There is genuine time pressure in this situation`);
  if (m.mistake)      facts.push(`Something went wrong — that happened and it is real`);
  if (m.money)        facts.push(`There is a financial concern that deserves a clear look`);
  if (m.relationship) facts.push(`Something real is happening in an important relationship`);
  if (m.family)       facts.push(`Something is happening in your family — that matters deeply`);
  if (m.grief)        facts.push(`You are carrying a real loss — that is one of the heaviest things a person carries`);
  if (m.health)       facts.push(`There is a health concern — that deserves proper attention and care`);
  if (m.lonely)       facts.push(`You are feeling alone with this — that feeling is real`);
  if (m.rejected)     facts.push(`You did not get something you wanted — that loss is real`);
  if (m.future)       facts.push(`You are uncertain about your direction right now — that uncertainty is real`);
  if (m.body)         facts.push(`Your body is carrying this — the physical sensations you feel are real`);
  if (facts.length === 0 && first.length > 10) facts.push(`What you are going through right now is real`);

  // MIND ADDING — only with actual evidence
  const mindAdding = [];
  if (m.sleep && m.fear)      mindAdding.push(`The mind is turning the sleeplessness into a bigger story about what it means`);
  if (m.sleep)                mindAdding.push(`Something is keeping the mind active when the body is ready to rest`);
  if (m.ignored && m.boss)    mindAdding.push(`The silence hasn't told you what it means yet — your mind has already written that story`);
  if (m.fired)                mindAdding.push(`The fear of losing your job hasn't happened yet — right now it is a fear, not a fact`);
  if (m.mistake)              mindAdding.push(`One mistake rarely defines how others see us — that is the mind's jump, not reality`);
  if (m.future)               mindAdding.push(`Not knowing your direction feels permanent right now — but uncertainty is a moment, not a verdict`);
  if (m.lonely)               mindAdding.push(`Feeling alone is real. The story that it will always be this way — that is the mind adding to it`);
  if (m.shame)                mindAdding.push(`What happened is not the same as who you are — the mind is making that leap`);
  if (absW.length > 0)        mindAdding.push(`You used the word "${absW[0].toLowerCase()}" — when we are suffering the mind speaks in absolutes that are rarely true`);
  if (catW.length > 0)        mindAdding.push(`You used the word "${catW[0].toLowerCase()}" — that is the weight of the moment speaking, not an accurate forecast`);

  // SUMMARY — Sri Sri voice, situation-specific
  let summary = "";
  if (m.sleep)              summary = `When sleep does not come, something inside is still waiting to be heard. The body is willing. The mind is holding on to something. Not because it is broken — because it cares.`;
  else if (m.grief)         summary = `Loss is one of the most honest experiences a person has. It does not need to be fixed or moved through quickly. It needs to be felt. You are feeling it.`;
  else if (m.lonely)        summary = `Loneliness is the feeling of being separated from connection — not the absence of it. The capacity for connection is still there. It has not gone anywhere.`;
  else if (m.fired)         summary = `The fear of what might happen has arrived before the thing itself has. Fear is always early. What is actually true right now is different from what fear is showing you.`;
  else if (m.future)        summary = `When the path ahead is unclear, the mind often treats uncertainty as danger. But not knowing is not the same as lost. It is simply not yet known.`;
  else if (m.shame)         summary = `The voice that says you are not enough is not the truth. It is a layer. Underneath it, something knows its own worth — even if it cannot feel it right now.`;
  else if (m.relationship)  summary = `When something is wrong in a relationship that matters, the pain is real. It touches the deepest part of us — the part that needs to belong.`;
  else if (m.health)        summary = `When the body is unwell, it is asking for attention. Not panic — attention. There is a difference. Right now the most useful thing is clarity, not fear.`;
  else if (m.overwhelmed||m.work) {
    // Detect specific context within overwhelm
    if(t.includes("backlog")||t.includes("items")||t.includes("tasks")||t.includes("list"))
      summary = `A backlog is not just tasks. It is a weight you are carrying mentally even when you are not working. Every item on that list takes up space. No wonder it feels like too much.`;
    else if(t.includes("falling behind")||t.includes("keep up")||t.includes("behind on"))
      summary = `The feeling of falling behind has a particular quality — it makes the present moment feel like failure even when nothing has actually gone wrong yet. That gap between where you are and where you think you should be is where the anxiety lives.`;
    else
      summary = `When everything arrives at once, it becomes one undifferentiated heaviness. But inside that heaviness are individual things. They are more workable apart than together.`;
  }
  else if (m.mistake)       summary = `A mistake happened. That is real. But the story the mind tells about what that mistake means about you — that story is much larger than the mistake itself.`;
  else if (first.length > 20) {
    // Use their actual words — never generic
    const snippet = first.slice(0, 80);
    summary = `You wrote about "${snippet}${first.length>80?"…":""}". That is real. And whatever it means to you right now — that meaning matters. Let us look at it clearly.`;
  }
  else summary = `Something is weighing on you. That is enough reason to be here. Let us look at it together.`;

  const friendNote = m.sleep        ? `The body knows how to sleep. Something else needs to be set down first.`
    : m.grief         ? `Grief is not a problem to solve. It is love with nowhere to go.`
    : m.lonely        ? `You are not as alone as this moment feels.`
    : m.future        ? `Not knowing is not the same as having no future. It is simply not yet visible.`
    : m.shame         ? `What you did is not who you are.`
    : m.overwhelmed   ? `You do not need to carry all of it right now. Just this moment.`
    : m.fired         ? `Fear is loud. It is not always accurate.`
    : m.relationship  ? `What still cares is the part worth listening to.`
    : m.work || m.overwhelmed ? `You do not need to clear the whole list. You just need to find the first true thing on it.`
    : `You showed up. That already takes something.`;

  return {
    facts: facts.slice(0,3),
    mindAdding: mindAdding.slice(0,3),
    summary,
    friendNote
  };
}


function validateEmotion(emotion,situation) {
  const t = situation.toLowerCase();
  const m = {
    fired:/\b(fired|let go|lose my job)\b/.test(t),
    boss:/\b(boss|manager|supervisor)\b/.test(t),
    deadline:/\b(deadline|due|tomorrow|urgent)\b/.test(t),
    mistake:/\b(mistake|failed|wrong|screwed)\b/.test(t),
    unfair:/\b(unfair|credit|recognition)\b/.test(t),
    sleep:/\b(sleep|insomnia|awake|tired)\b/.test(t),
    grief:/\b(died|death|loss|grief|miss|gone)\b/.test(t),
    lonely:/\b(lonely|alone|isolated|no one)\b/.test(t),
    relationship:/\b(partner|breakup|divorce|spouse)\b/.test(t),
  };
  const map = {
    Fear: {
      v: m.fired ? `The fear of losing your job touches something very deep — survival, identity, security. Of course it feels this way.`
        : m.sleep ? `Fear at 3am is a very particular kind of fear. The mind, in the silence, amplifies everything. What feels certain at night is rarely certain by morning.`
        : `Fear means something matters to you. That is actually the beginning of understanding — not the problem.`,
      h: `Fear becomes smaller the moment you look at it directly. You are doing that right now.`
    },
    Anxiety: {
      v: m.deadline ? `Anxiety before a deadline is the mind trying to prepare for every possible thing that could go wrong. Most of those things will not happen.`
        : m.sleep ? `The anxiety that keeps you awake is the mind refusing to leave something unresolved. It is not punishing you. It is trying to protect you.`
        : `Anxiety is the mind living in a future that has not happened yet. Right now, in this moment, you are okay.`,
      h: `The structure ahead gives that anxious mind somewhere real to go instead of spinning.`
    },
    Anger: {
      v: m.unfair ? `Anger when something feels unfair is completely valid. It is pointing at a value that was crossed — and that matters.`
        : m.relationship ? `Anger in relationships often covers hurt. Underneath the anger, something still cares. That caring is not weakness.`
        : `Anger is always pointing at something real. It is worth listening to before it is released.`,
      h: `There is energy in anger. Used with clarity, it can move things.`
    },
    Shame: {
      v: m.mistake ? `Shame has a way of turning what you did into who you are. But you are not this mistake. You are the one who is aware of it — and that awareness is everything.`
        : `Shame lives in hiding. The moment you name it, it begins to lose its power over you.`,
      h: `What you did and who you are — these are not the same thing.`
    },
    Sadness: {
      v: m.grief ? `Grief is love with nowhere to go. It is not a problem to be solved. It is the price of having loved, and it is worth paying.`
        : m.lonely ? `Sadness and loneliness together are very heavy. You are carrying something real. You are not wrong for feeling this.`
        : `Sadness is the heart acknowledging a loss. Something real was here and now it feels gone. That is worth mourning.`,
      h: `You do not need to move through this quickly. One small step forward is enough.`
    },
    Loneliness: {
      v: `Loneliness is not the absence of people. It is the feeling of not being truly met. That feeling is one of the most human feelings there is.`,
      h: `The fact that you feel the absence of connection means the capacity for it is still alive in you.`
    },
    Grief: {
      v: `Grief does not follow a schedule. It comes when it comes. What you are feeling is the full weight of a real love or a real loss — and that deserves to be held with great care.`,
      h: `You do not have to be okay right now. Just present.`
    },
    Pressure: {
      v: `Under pressure, the mind narrows. Everything feels more permanent, more watched, more high-stakes than it actually is. This is physiology, not reality.`,
      h: `Even one pressure released right now changes the weight of all the others.`
    },
    Overwhelm: {
      v: `Overwhelm is what happens when the mind tries to hold too many things at once. You are not weak. You are overloaded. There is a difference.`,
      h: `We are going to look at one thing at a time. That is all.`
    },
    Dread: {
      v: `Dread is living the feared moment before it arrives. The mind experiences it as if it has already happened — which means you are suffering something twice. Once in imagination, once if it comes.`,
      h: `The thing you are dreading has not happened yet. That space between now and then is where your power lives.`
    },
    Confusion: {
      v: `Confusion is not failure. It is the honest state of a mind that has more information than it can currently organise. Clarity almost always follows when the pressure to have it lifts slightly.`,
      h: `You do not need to know everything right now. Just the next small step.`
    },
  };
  // Positive emotions — celebrate them
  const positiveMap = {
    Hopeful: {v:"Hopeful is a brave thing to feel. It means part of you believes things can be different. Hold that.",h:"This feeling is worth protecting. Notice what is nurturing it."},
    Calm:    {v:"Calm is not emptiness — it is clarity. Something in you has found stillness. That is real.",h:"Stay here for a moment. Let the body learn what this feels like."},
    Grateful:{v:"Gratitude is one of the most grounding states a human being can be in. Something good is registering.",h:"What specifically feels good right now? Let it land fully."},
    Happy:   {v:"Happy. That is real and it matters just as much as the hard feelings. You came here in a good moment — that is wisdom.",h:"Enjoy this. The practice works both ways — noticing good is as important as working through hard."},
  };
  if(positiveMap[emotion]) return positiveMap[emotion];

  const d = map[emotion];
  if (!d) return {
    v: `Feeling ${emotion?.toLowerCase()} right now is completely valid. Whatever word you chose — that is the real experience. Trust it.`,
    h: `You found the word for it. That is the beginning of moving through it.`
  };
  return { v: d.v, h: d.h };
}

function generateActions(situation,emotion) {
  const t = situation.toLowerCase();
  const m = {
    boss:         /\b(boss|manager|supervisor)\b/.test(t),
    fired:        /\b(fired|let go|lose my job)\b/.test(t),
    deadline:     /\b(deadline|due|tomorrow|urgent)\b/.test(t),
    overwhelmed:  /\b(overwhelmed|too much|drowning|swamped)\b/.test(t),
    mistake:      /\b(mistake|screwed|failed|wrong)\b/.test(t),
    sleep:        /\b(sleep|insomnia|awake|waking|tired)\b/.test(t),
    money:        /\b(money|debt|rent|financial|afford)\b/.test(t),
    relationship: /\b(partner|relationship|breakup|family|spouse)\b/.test(t),
    conflict:     /\b(argument|fight|conflict|tension)\b/.test(t),
    grief:        /\b(died|death|loss|grief|miss|gone)\b/.test(t),
    lonely:       /\b(lonely|alone|isolated|no one)\b/.test(t),
    health:       /\b(health|sick|doctor|pain|diagnosis)\b/.test(t),
    future:       /\b(future|direction|purpose|meaning|lost|stuck)\b/.test(t),
  };

  // Situation-specific behavioral actions — no writing, no journaling
  const pool = [];

  if (m.sleep)        pool.push(`Before you try to sleep tonight, sit quietly for 5 minutes — no phone, no input. Let the mind run out of things to say.`);
  if (m.sleep)        pool.push(`Get up, go to a different room, sit in the dark for 10 minutes. Sometimes the body needs a reset before it can rest.`);
  if (m.boss && m.overwhelmed) pool.push(`Send your manager one sentence today — "Do you have 10 minutes this week?" Open the door without trying to walk through it yet.`);
  else if (m.boss)    pool.push(`Have the one conversation you have been avoiding — prepare one sentence that opens it, not one that resolves everything.`);
  if (m.fired)        pool.push(`Do one thing today that reminds you of your professional value — reach out to one person you trust, update one thing on your profile.`);
  if (m.deadline)     pool.push(`Close everything except the one task that matters most. Set a 45-minute timer. Begin before you feel ready.`);
  if (m.mistake)      pool.push(`Address it directly and briefly — one conversation or message acknowledging what happened and what comes next. Then let it move forward.`);
  if (m.money)        pool.push(`Look at the actual number — not the feeling of it. Open the account, see the figure clearly. Reality is almost always less terrifying than the anxiety about it.`);
  if (m.relationship) pool.push(`Send one honest message — not to resolve everything, just to keep the connection open. "I would like to talk when you are ready."`);
  if (m.conflict)     pool.push(`Give yourself a few hours before responding. Most things said in tension look very different after a short pause.`);
  if (m.grief)        pool.push(`Let yourself feel it for 10 minutes without trying to move through it or fix it. Grief needs to be felt, not managed.`);
  if (m.lonely)       pool.push(`Reach out to one person today — not to explain everything, just to make contact. A small connection is still a connection.`);
  if (m.health)       pool.push(`Make the appointment or the call you have been putting off. Uncertainty is almost always harder than the actual information.`);
  if (m.future)       pool.push(`Instead of trying to find your direction, do one thing today that is completely in your control and completely within your values.`);
  if (m.overwhelmed)  pool.push(`Pick the single most pressing thing and give it your full attention for 30 minutes. Let everything else wait.`);

  // Emotion-specific behavioral actions
  const byE = {
    Fear:      [`Take one step toward the thing you are afraid of — the smallest possible step. Fear almost always shrinks when you move toward it.`],
    Anxiety:   [`Move your body for 10 minutes right now — walk, stretch, anything. The nervous system needs a physical reset before a mental one.`],
    Anger:     [`Remove yourself from the situation for 20 minutes before doing or saying anything. Let the first wave pass.`],
    Shame:     [`Tell one person you trust one true thing about what you are going through. Shame loses its power when it is spoken.`],
    Sadness:   [`Allow yourself to feel it without trying to fix it. Put on music that fits the feeling. Sometimes sadness needs to be met, not moved through.`],
    Loneliness:[`Reach out to one person today — just to make contact. It does not need to be deep. Connection starts small.`],
    Grief:     [`Do one thing that honours what you have lost — a small ritual, a quiet moment, something that acknowledges it was real.`],
    Pressure:  [`Say no to one thing today. Even something small. Pressure needs an outlet. Boundaries are that outlet.`],
    Overwhelm: [`Stop adding to the mental list. Do the one smallest thing in front of you right now. Movement, however small, is medicine.`],
    Dread:     [`Take one step toward the thing you are dreading. The anticipation is almost always worse than the reality. Almost always.`],
    Confusion: [`Stop trying to figure it all out. Do the one thing in front of you that is clear — even if everything else is not.`],
    uncertain: [`Be gentle with yourself today. Sometimes the most honest thing is to simply get through this moment with care.`],
  };

  const eA = byE[emotion] || [`Do one thing today that is completely within your control and completely aligned with your values.`];
  const fallback = [`Step outside for 10 minutes. Fresh air and physical movement shift the mind more than we expect.`];

  return [...new Set([...pool, ...eA, ...fallback])].slice(0,3);
}


function isGibberish(text) {
  const words = text.trim().split(/\s+/).filter(w=>w.length>0);
  if(words.length < 2) return false;
  // Average word length — real sentences average 3-8 chars
  const avgLen = words.reduce((s,w)=>s+w.length,0)/words.length;
  if(avgLen > 9) return true;
  // Ratio of words with no vowels — gibberish like "gfg hrh str"
  const noVowels = words.filter(w=>!/[aeiouAEIOU]/.test(w)&&w.length>1).length;
  if(words.length >= 3 && noVowels/words.length > 0.5) return true;
  // Repeated character sequences like "asdfasdf"
  if(/(.{2,})\1{3,}/.test(text)) return true;
  // Too many consecutive consonants without vowels
  const consonantRun = (text.match(/[^aeiouAEIOU\s]{5,}/g)||[]).length;
  if(consonantRun > 1) return true;
  return false;
}

function StepSituation({onNext}) {
  const [val,setVal]=useState("");
  const [phase,setPhase]=useState("write"); // write → intake
  const [intensity,setIntensity]=useState(5);
  const [duration,setDuration]=useState("");
  const [recurring,setRecurring]=useState("");

  // ── VOICE ──
  const recognitionRef = useRef(null);
  const [listening,setListening]=useState(false);
  const [inputMode,setInputMode]=useState("text");
  const [voiceSupported]=useState(()=>
    typeof window!=="undefined"&&("SpeechRecognition" in window||"webkitSpeechRecognition" in window)
  );

  function startListening(){
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR)return;
    const rec=new SR();
    recognitionRef.current=rec;
    rec.continuous=true;rec.interimResults=true;rec.lang="en-US";
    let final=val;
    rec.onresult=e=>{
      let interim="";
      for(let i=e.resultIndex;i<e.results.length;i++){
        const t=e.results[i][0].transcript;
        if(e.results[i].isFinal)final+=(final?" ":"")+t;
        else interim=t;
      }
      setVal(final+(interim?" "+interim:""));
    };
    rec.onend=()=>setListening(false);
    rec.onerror=()=>setListening(false);
    rec.start();setListening(true);
  }
  function stopListening(){recognitionRef.current?.stop();setListening(false);}

  const words=val.trim().split(/\s+/).filter(w=>w.length>0);
  const count=words.length;
  const gibberish=count>=3&&isGibberish(val);
  const ready=count>=5&&!gibberish;

  function handleBegin(){if(!ready)return;setPhase("intake");}
  function handleStart(){
    if(!duration||!recurring)return;
    onNext(val,{intensity,duration,recurring});
  }

  const durationOpts=["Just today","A few days","About a week","Several weeks","Longer"];
  const recurringOpts=["First time","Happens sometimes","Happens often","Feels constant"];

  if(phase==="intake") return (
    <div style={{animation:"slideUp .4s ease"}}>
      <p style={{fontSize:".9rem",color:T.muted,lineHeight:1.75,marginBottom:"1.5rem"}}>
        Three quick questions — they help me understand you better.
      </p>

      {/* Intensity slider */}
      <div style={{marginBottom:"1.5rem"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:".6rem"}}>
          <span style={{fontSize:".82rem",color:T.cream,fontWeight:500}}>How intense does this feel right now?</span>
          <span style={{fontFamily:"'Playfair Display',serif",fontSize:"1.4rem",color:intensity<=3?T.sage:intensity<=6?T.sand:T.rose,fontWeight:300,lineHeight:1}}>{intensity}</span>
        </div>
        <input type="range" min="1" max="10" value={intensity} onChange={e=>setIntensity(Number(e.target.value))}
          style={{width:"100%",accentColor:intensity<=3?T.sage:intensity<=6?T.sand:T.rose,height:"4px",cursor:"pointer"}}/>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:".65rem",color:T.faint,marginTop:".3rem"}}>
          <span>Manageable</span><span>Very intense</span>
        </div>
      </div>

      {/* Duration */}
      <div style={{marginBottom:"1.5rem"}}>
        <div style={{fontSize:".82rem",color:T.cream,fontWeight:500,marginBottom:".65rem"}}>How long have you been carrying this?</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:".4rem"}}>
          {durationOpts.map(d=>(
            <button key={d} onClick={()=>setDuration(d)}
              style={{padding:".38rem .85rem",borderRadius:20,border:`1px solid ${duration===d?T.goldBd:T.border}`,background:duration===d?T.goldBg:"transparent",color:duration===d?T.gold:T.muted,fontSize:".8rem",cursor:"pointer",transition:"all .15s"}}>
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Recurring */}
      <div style={{marginBottom:"1.8rem"}}>
        <div style={{fontSize:".82rem",color:T.cream,fontWeight:500,marginBottom:".65rem"}}>Is this something that comes up for you?</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:".4rem"}}>
          {recurringOpts.map(r=>(
            <button key={r} onClick={()=>setRecurring(r)}
              style={{padding:".38rem .85rem",borderRadius:20,border:`1px solid ${recurring===r?T.goldBd:T.border}`,background:recurring===r?T.goldBg:"transparent",color:recurring===r?T.gold:T.muted,fontSize:".8rem",cursor:"pointer",transition:"all .15s"}}>
              {r}
            </button>
          ))}
        </div>
      </div>

      <div style={{fontSize:".68rem",color:T.faint,marginBottom:".5rem"}}>🔒 Private. Nothing leaves your device.</div>
      <Btn onClick={handleStart} disabled={!duration||!recurring} color={T.gold}>Begin my RESET →</Btn>
      <button onClick={()=>setPhase("write")} style={{display:"block",width:"100%",marginTop:".4rem",background:"none",border:"none",color:T.faint,fontSize:".75rem",cursor:"pointer"}}>← Go back</button>
    </div>
  );

  // ── WRITE PHASE ──
  return (
    <div style={{animation:"slideUp .4s ease"}}>

      {/* Mode toggle */}
      <div style={{display:"flex",gap:".5rem",marginBottom:"1rem"}}>
        <button onClick={()=>setInputMode("text")}
          style={{flex:1,padding:".52rem",borderRadius:12,border:`1px solid ${inputMode==="text"?T.goldBd:T.border}`,background:inputMode==="text"?T.goldBg:"transparent",color:inputMode==="text"?T.gold:T.faint,fontSize:".82rem",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:".38rem",transition:"all .18s"}}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Type it
        </button>
        {voiceSupported&&(
          <button onClick={()=>setInputMode("voice")}
            style={{flex:1,padding:".52rem",borderRadius:12,border:`1px solid ${inputMode==="voice"?T.roseBd:T.border}`,background:inputMode==="voice"?T.roseBg:"transparent",color:inputMode==="voice"?T.rose:T.faint,fontSize:".82rem",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:".38rem",transition:"all .18s"}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            Speak it
          </button>
        )}
      </div>

      <p style={{fontSize:".9rem",color:T.muted,lineHeight:1.82,marginBottom:"1rem"}}>
        {inputMode==="voice"
          ?"Tap the circle and speak freely — I am listening."
          :"Write freely — like talking to a close friend. The more honest, the more personal this will feel."}
      </p>

      {/* Voice mode */}
      {inputMode==="voice"&&(
        <div style={{textAlign:"center",marginBottom:"1rem",animation:"fadeIn .3s ease"}}>
          <button onClick={listening?stopListening:startListening}
            style={{width:76,height:76,borderRadius:"50%",border:`2px solid ${listening?T.rose:T.roseBd}`,background:listening?T.roseBg:"transparent",color:listening?T.rose:T.faint,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto .8rem",cursor:"pointer",transition:"all .25s",boxShadow:listening?`0 0 22px ${T.rose}40`:"none",animation:listening?"pulse 1.5s ease infinite":"none"}}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
          </button>
          <div style={{fontSize:".8rem",color:listening?T.rose:T.faint,fontStyle:"italic",marginBottom:".6rem",transition:"color .3s"}}>
            {listening?"Listening — tap to stop":"Tap to start speaking"}
          </div>
          {val&&(
            <div style={{padding:".9rem 1rem",borderRadius:13,background:T.card,border:`1px solid ${T.border}`,textAlign:"left",marginBottom:".5rem"}}>
              <div style={{fontSize:".68rem",color:T.faint,marginBottom:".28rem",letterSpacing:".06em"}}>What I heard</div>
              <div style={{fontSize:".88rem",color:T.cream,lineHeight:1.72,fontStyle:"italic"}}>"{val}"</div>
            </div>
          )}
          {val&&<button onClick={()=>setInputMode("text")} style={{background:"none",border:"none",color:T.faint,fontSize:".74rem",cursor:"pointer",textDecoration:"underline"}}>Edit what I said</button>}
        </div>
      )}

      {/* Text mode */}
      {inputMode==="text"&&(
        <textarea value={val} onChange={e=>setVal(e.target.value)}
          placeholder="Tell me what is going on…" rows={6} autoFocus
          style={{width:"100%",background:T.card,border:`1px solid ${gibberish?"rgba(140,60,48,0.4)":T.border}`,borderRadius:14,padding:"1.1rem",color:T.cream,fontSize:".95rem",fontWeight:400,lineHeight:1.82,resize:"none",transition:"border-color .2s",marginBottom:".3rem"}}
          onFocus={e=>e.target.style.borderColor=gibberish?"rgba(140,60,48,0.4)":"rgba(122,80,16,0.35)"}
          onBlur={e=>e.target.style.borderColor=gibberish?"rgba(140,60,48,0.4)":T.border}/>
      )}

      {(inputMode==="text"||(inputMode==="voice"&&val))&&(
        <div style={{textAlign:"right",fontSize:".72rem",marginTop:".25rem",marginBottom:".65rem",color:gibberish?"rgba(140,60,48,0.85)":ready?"rgba(42,94,68,0.85)":"rgba(106,72,24,0.65)"}}>
          {gibberish?"I want to understand — could you share what is happening in your own words?"
            :ready?"✓ Ready":`${Math.max(0,5-count)} more words`}
        </div>
      )}

      <div style={{fontSize:".72rem",color:T.faint,marginBottom:".6rem"}}>🔒 Private. Nothing is recorded or stored externally.</div>
      <Btn onClick={handleBegin} disabled={!ready}>Continue →</Btn>

    </div>
  );
}

function StepRecognize({situation,onNext,intake={}}) {
  const [result,setResult]=useState(null);
  const [showEdit,setShowEdit]=useState(false);
  const {color,bg,bd}=SC[1];

  useEffect(()=>{
    async function go(){
      // Check for gibberish before calling AI
      if(isGibberish(situation)) {
        setResult({
          facts:[],
          mindAdding:[],
          summary:"Take a breath. When you are ready, tell me what is actually going on — even a few honest words is enough.",
          friendNote:"There is no rush. I am here when you are ready.",
          isGentle:true
        });
        return;
      }
      const ai=await callResetAI("recognize",situation,"",intake);
      setResult(ai?{
        summary:ai.summary||"",
        friendNote:ai.friendNote||"",
        facts:ai.facts||[],
        mindAdding:ai.mindAdding||[],
        koshaInsight:ai.koshaInsight||""
      }:deepAnalyze(situation));
    }
    setTimeout(go,300);
  },[situation]);

  if(!result) return <Spin color={color} msg="Reading what you shared — just a moment…"/>;

  // mindAdding comes directly from the new deepAnalyze
  const mindAdding = result.mindAdding || [];

  // Gentle mode — if input was unclear, show a soft prompt instead
  if(result.isGentle) return (
    <div style={{animation:"fadeIn .5s ease"}}>
      <div style={{padding:"1.4rem 1.3rem",borderRadius:16,background:bg,border:`1px solid ${bd}`,marginBottom:"1.2rem",textAlign:"center"}}>
        <div style={{fontSize:"1.5rem",marginBottom:".8rem",animation:"drift 4s ease infinite"}}>🌿</div>
        <div style={{fontFamily:"'Playfair Display',serif",fontStyle:"italic",color:"rgba(44,31,20,0.85)",fontSize:"1rem",lineHeight:1.82,marginBottom:".6rem"}}>{result.summary}</div>
        <div style={{color:T.muted,fontSize:".83rem",lineHeight:1.65}}>{result.friendNote}</div>
      </div>
      <Btn color={color} onClick={()=>onNext({facts:[],mindAdding:[],summary:result.summary,friendNote:result.friendNote})}>I'm ready — try again →</Btn>
    </div>
  );

  return (
    <div style={{animation:"fadeIn .6s ease"}}>

      {/* ── THE RESPONSE — flows like a human wrote it ── */}
      <div style={{marginBottom:"2rem"}}>

        {/* Main response — the heart of it */}
        <div style={{fontSize:"1rem",color:T.cream,lineHeight:1.92,marginBottom:"1.2rem",fontWeight:400}}>
          {result.summary}
        </div>

        {/* Friend note — one warm line */}
        {result.friendNote&&(
          <div style={{fontSize:".9rem",color:T.muted,lineHeight:1.75,paddingLeft:"1rem",borderLeft:`2px solid ${T.goldBd}`}}>
            {result.friendNote}
          </div>
        )}
      </div>

      {/* ── WHAT IS REAL — only if present, no header label ── */}
      {result.facts?.length>0&&(
        <div style={{marginBottom:"1.4rem"}}>
          {result.facts.map((item,i)=>(
            <div key={i} style={{fontSize:".9rem",color:"rgba(44,31,20,0.72)",lineHeight:1.82,marginBottom:".5rem",paddingLeft:".85rem",position:"relative"}}>
              <span style={{position:"absolute",left:0,color:T.sage,fontSize:".8rem",lineHeight:1.9}}>·</span>
              {item}
            </div>
          ))}
        </div>
      )}

      {/* ── WHAT THE MIND IS ADDING — softer, no clinical label ── */}
      {mindAdding.length>0&&(
        <div style={{marginBottom:"1.6rem",padding:".9rem 1rem",borderRadius:12,background:`${T.sand}08`,border:`1px solid ${T.sandBd}`}}>
          <div style={{fontSize:".72rem",color:T.sand,fontWeight:500,marginBottom:".5rem",letterSpacing:".06em"}}>The mind might also be adding...</div>
          {mindAdding.map((item,i)=>(
            <div key={i} style={{fontSize:".88rem",color:"rgba(44,31,20,0.52)",lineHeight:1.78,marginBottom:".35rem"}}>{item}</div>
          ))}
        </div>
      )}

      {/* ── DOES THIS FEEL RIGHT? ── */}
      <div style={{fontSize:".78rem",color:T.faint,marginBottom:"1.2rem",textAlign:"center"}}>
        Does this feel accurate to what you shared?
      </div>

      <DepthDrawer step={1}/>
      <Btn color={color} onClick={()=>onNext(result)}>Yes, this feels right →</Btn>
      <button onClick={()=>onNext(result)}
        style={{display:"block",width:"100%",marginTop:".4rem",background:"none",border:"none",color:T.faint,fontSize:".76rem",cursor:"pointer",padding:".3rem"}}>
        Not quite, but let's keep going →
      </button>
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
  {key:"direct",  label:"In my hands",      emoji:"✋", color:T.sage, bg:T.sageBg, bd:T.sageBd},
  {key:"influence",label:"I can influence", emoji:"🤝", color:T.sand, bg:T.sandBg, bd:T.sandBd},
  {key:"release", label:"Let it go",        emoji:"🍃", color:T.rose, bg:T.roseBg, bd:T.roseBd},
];

// Common concerns to tap — so they don't have to type
const QUICK_CONCERNS = [
  "the outcome","what they think","my workload","the deadline",
  "the relationship","my health","the money","my reaction",
  "the past","what happens next","my effort","their behaviour",
];

function StepExamine({onNext}) {
  const [b,setB]=useState({direct:[],influence:[],release:[]});
  const [active,setActive]=useState("direct"); // which bucket is selected
  const [custom,setCustom]=useState("");
  const {color}=SC[2];
  const totalSorted = b.direct.length + b.influence.length + b.release.length;

  function add(key,v){if(v.trim()&&!Object.values(b).flat().includes(v.trim()))setB(p=>({...p,[key]:[...p[key],v.trim()]}));}
  function rem(key,i){setB(p=>({...p,[key]:p[key].filter((_,j)=>j!==i)}));}

  return (
    <div style={{animation:"slideUp .4s ease"}}>
      <p style={{fontSize:".9rem",color:T.muted,lineHeight:1.75,marginBottom:"1.2rem"}}>
        Tap a bucket, then tap what belongs there.
      </p>

      {/* Bucket selector — three big tap targets */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:".5rem",marginBottom:"1.2rem"}}>
        {BUCKETS.map(bk=>(
          <button key={bk.key} onClick={()=>setActive(bk.key)}
            style={{padding:".75rem .5rem",borderRadius:12,border:`2px solid ${active===bk.key?bk.color:T.border}`,background:active===bk.key?bk.bg:"transparent",cursor:"pointer",transition:"all .18s",textAlign:"center"}}>
            <div style={{fontSize:"1.4rem",marginBottom:".25rem"}}>{bk.emoji}</div>
            <div style={{fontSize:".72rem",fontWeight:600,color:active===bk.key?bk.color:T.muted,letterSpacing:".04em"}}>{bk.label}</div>
            {b[bk.key].length>0&&<div style={{fontSize:".65rem",color:bk.color,marginTop:".2rem"}}>({b[bk.key].length})</div>}
          </button>
        ))}
      </div>

      {/* Quick tap concerns */}
      <div style={{marginBottom:".8rem"}}>
        <div style={{fontSize:".7rem",color:T.faint,marginBottom:".5rem",letterSpacing:".04em"}}>Tap to add to "{BUCKETS.find(bk=>bk.key===active)?.label}"</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:".35rem"}}>
          {QUICK_CONCERNS.filter(q=>!Object.values(b).flat().includes(q)).slice(0,8).map(q=>(
            <button key={q} onClick={()=>add(active,q)}
              style={{padding:".32rem .75rem",borderRadius:20,border:`1px solid ${T.border}`,background:T.card,color:T.muted,fontSize:".78rem",cursor:"pointer",transition:"all .15s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=BUCKETS.find(bk=>bk.key===active)?.color;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;}}>
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Custom input */}
      <div style={{display:"flex",gap:".4rem",marginBottom:"1rem"}}>
        <input value={custom} onChange={e=>setCustom(e.target.value)}
          placeholder="Or type your own…"
          onKeyDown={e=>{if(e.key==="Enter"&&custom.trim()){add(active,custom);setCustom("");}}}
          style={{flex:1,background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:".6rem .9rem",color:T.cream,fontSize:".85rem"}}/>
        <button onClick={()=>{if(custom.trim()){add(active,custom);setCustom("");}}}
          style={{padding:".6rem 1rem",borderRadius:10,background:BUCKETS.find(bk=>bk.key===active)?.bg,border:`1px solid ${BUCKETS.find(bk=>bk.key===active)?.bd}`,color:BUCKETS.find(bk=>bk.key===active)?.color,fontSize:".85rem",cursor:"pointer"}}>
          Add
        </button>
      </div>

      {/* What's been sorted */}
      {totalSorted>0&&(
        <div style={{marginBottom:"1rem"}}>
          {BUCKETS.map(bk=>b[bk.key].length>0&&(
            <div key={bk.key} style={{marginBottom:".5rem"}}>
              <div style={{fontSize:".65rem",color:bk.color,fontWeight:600,letterSpacing:".08em",marginBottom:".3rem"}}>{bk.emoji} {bk.label}</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:".28rem"}}>
                {b[bk.key].map((item,i)=>(
                  <span key={i} style={{padding:".2rem .55rem",borderRadius:20,background:`${bk.color}12`,border:`1px solid ${bk.bd}`,color:bk.color,fontSize:".76rem",display:"flex",alignItems:"center",gap:".3rem"}}>
                    {item}
                    <span onClick={()=>rem(bk.key,i)} style={{opacity:.45,cursor:"pointer",fontSize:".7rem"}}>×</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <DepthDrawer step={2}/>
      <Btn color={color} onClick={()=>onNext(b)} disabled={totalSorted===0}>
        {totalSorted===0?"Sort at least one thing →":"I can see this more clearly →"}
      </Btn>
      {totalSorted===0&&<button onClick={()=>onNext(b)} style={{display:"block",width:"100%",marginTop:".4rem",background:"none",border:"none",color:T.faint,fontSize:".76rem",cursor:"pointer",padding:".3rem"}}>Skip this step →</button>}
    </div>
  );
}

const EMOTIONS=[
  {l:"Fear",e:"🌫️"},{l:"Anxiety",e:"〰️"},{l:"Anger",e:"🔥"},{l:"Shame",e:"🌑"},
  {l:"Pressure",e:"⏳"},{l:"Sadness",e:"🌧️"},{l:"Overwhelm",e:"🌊"},{l:"Dread",e:"🕳️"},
  {l:"Grief",e:"🫧"},{l:"Confusion",e:"🌀"},{l:"Guilt",e:"⚖️"},{l:"Loneliness",e:"🏔️"},
  {l:"Hopeful",e:"🌱"},{l:"Calm",e:"🌊"},{l:"Grateful",e:"✨"},{l:"Happy",e:"☀️"},
];

function StepSurface({situation,onNext}) {
  const [sel,setSel]=useState(null);
  const [custom,setCustom]=useState("");
  const [showCustom,setShowCustom]=useState(false);
  const [notSure,setNotSure]=useState(false);
  const [val,setVal]=useState(null);
  const [loading,setLoading]=useState(false);
  const {color,bg,bd}=SC[3];

  const POSITIVE_EMOTIONS = ["Hopeful","Calm","Grateful","Happy","Relieved","Content","Peaceful"];

  async function pick(label){
    setSel(label);setShowCustom(false);setNotSure(false);setVal(null);setLoading(true);
    if(POSITIVE_EMOTIONS.includes(label)){
      setVal({
        v:`${label}. That is real — and it matters. Don't let it slip by unnoticed. These moments are what the practice is for.`,
        science:"",
        koshaInsight:"",
        h:"Stay with this feeling for a moment. Notice where you feel it in your body. It is worth acknowledging."
      });
      setLoading(false);
      return;
    }
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
        <div style={{fontSize:".86rem",color:notSure?color:"rgba(44,31,20,0.58)",fontWeight:notSure?500:300}}>
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
              style={{flex:1,background:"transparent",border:"none",borderBottom:`1px solid ${bd}`,color:"rgba(44,31,20,0.88)",fontSize:".83rem",padding:".22rem 0"}}/>
            <button onClick={()=>{if(custom.trim())setVal({v:`Feeling ${custom.toLowerCase()} makes complete sense.`,h:`You found the word. That's the hardest part.`});}}
              style={{background:bg,border:`1px solid ${bd}`,borderRadius:7,color,fontSize:".7rem",padding:".22rem .58rem"}}>✓</button>
          </div>
        )}
      </div>

      {loading&&<Spin color={color} msg="Finding the right words for what you are carrying…"/>}

      {val&&!loading&&(
        <div style={{animation:"slideUp .3s ease",marginBottom:".85rem"}}>
          <div style={{padding:"1rem 1.12rem",borderRadius:14,background:bg,border:`1px solid ${bd}`}}>
            <div style={{color:"rgba(44,31,20,0.85)",fontSize:".9rem",lineHeight:1.85,marginBottom:".55rem"}}>{val.v}</div>
            {val.koshaInsight&&<div style={{fontSize:".74rem",color,fontStyle:"italic",opacity:.6,lineHeight:1.65,marginBottom:".5rem"}}>✦ {val.koshaInsight}</div>}
            <div style={{color:T.muted,fontSize:".79rem",lineHeight:1.65,fontStyle:"italic",borderTop:`1px solid ${bd}`,paddingTop:".5rem"}}>{val.h}</div>
          </div>
        </div>
      )}

      <DepthDrawer step={3}/>
      <Btn color={color} onClick={()=>onNext(notSure?"uncertain":emotion)} disabled={!notSure&&(!emotion||emotion.trim().length<2)}>
        {notSure?"I'll find it as I go →":"Yes, that is what I feel →"}
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

      {aiLoading?<Spin color={color} msg="Finding something you can actually do…"/>:<>

        {/* Framing — soft, not commanding */}
        <p style={{fontSize:".95rem",color:T.cream,lineHeight:1.85,marginBottom:"1.2rem"}}>
          {framing||"You don't need to figure everything out right now. Here is one small thing that might help."}
        </p>

        {/* Pre-selected action — shown prominently */}
        {!showAll&&sel&&(
          <div style={{padding:"1.1rem 1.15rem",borderRadius:14,border:`1px solid ${color}`,background:bg,marginBottom:".75rem",animation:"slideUp .3s ease"}}>
            <div style={{fontSize:".65rem",fontWeight:600,letterSpacing:".12em",textTransform:"uppercase",color,opacity:.7,marginBottom:".5rem"}}>One small step</div>
            <div style={{fontSize:".92rem",color:"rgba(44,31,20,0.88)",lineHeight:1.75,fontWeight:400}}>{sel}</div>
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
                style={{marginTop:".4rem",width:"100%",background:"transparent",border:"none",borderBottom:`1px solid ${bd}`,color:"rgba(44,31,20,0.88)",fontSize:".83rem",padding:".2rem 0"}}/>}
            </div>
          </div>
        )}
      </>}

      <DepthDrawer step={4}/>
      <Btn color={color} onClick={()=>onNext(final)} disabled={!final||final.trim().length<3}>
        {aiLoading?"…":"I will try this →"}
      </Btn>
    </div>
  );
}

function StepTune({onComplete}) {
  const [chosen,setChosen]=useState(null);
  const {color,bg,bd}=SC[5];
  if(!chosen) return (
    <div style={{animation:"slideUp .4s ease"}}>
      <p style={{fontSize:".9rem",color:T.muted,lineHeight:1.88,marginBottom:"1.25rem",fontStyle:"normal"}}>You have done the thinking. You have chosen your step. Now — just for a moment — let your body arrive where your mind already is.</p>
      {[
        {key:"breathe",icon:"○",name:"Guided Breathing",desc:"Breathe with the circle — in, hold, out. Three rounds."},
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
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:".94rem",color:"rgba(44,31,20,0.82)",marginBottom:".09rem"}}>{t.name}</div>
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

const PH=[
  {n:"IN",    l:"Breathe in slowly",    hint:"through your nose",    d:4, c:T.sage},
  {n:"HOLD",  l:"Hold",                 hint:"gently, stay soft",    d:3, c:T.lav},
  {n:"OUT",   l:"Breathe out slowly",   hint:"all the way, fully",   d:6, c:T.sky},
];

function BoxBreathing({onComplete}) {
  const [pi,setPi]=useState(0);
  const [count,setCount]=useState(4);
  const [round,setRound]=useState(0);
  const [done,setDone]=useState(false);
  const [waiting,setWaiting]=useState(false);
  const [started,setStarted]=useState(false);
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
        setWaiting(true);
      }
    },1000);
  }

  useEffect(()=>{
    if(!started) return;
    startPhase(0);
    return()=>clearInterval(tRef.current);
  },[started]);

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

  if(!started) return (
    <div style={{textAlign:"center",padding:"1.5rem 0",animation:"fadeIn .6s ease"}}>
      <div style={{fontSize:"2rem",marginBottom:"1rem",animation:"drift 4s ease infinite"}}>🌬️</div>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.3rem",fontWeight:300,color:T.cream,lineHeight:1.5,marginBottom:".6rem"}}>
        Let's breathe together.
      </div>
      <div style={{fontSize:".9rem",color:T.muted,lineHeight:1.78,maxWidth:260,margin:"0 auto 1.5rem"}}>
        Three slow rounds — in, hold, out.<br/>
        Whenever you are ready.
      </div>
      <button onClick={()=>setStarted(true)}
        style={{padding:".9rem 2.2rem",borderRadius:50,background:T.sage,color:"#F4EEE4",border:"none",fontSize:"1rem",fontWeight:500,cursor:"pointer",boxShadow:`0 4px 16px ${T.sageBd}`,transition:"all .2s"}}
        onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
        onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
        I am ready →
      </button>
    </div>
  );

  if(done) return <TuneDone onComplete={onComplete}/>;
  const phase=PH[pi];
  const prog=waiting?1:(phase.d-count)/phase.d;
  const scale=pi===0?1+prog*.38:pi===1?1.38:1.38-prog*.38;

  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"2rem 0",userSelect:"none"}}>
      <p style={{fontSize:".88rem",color:T.muted,marginBottom:"1.5rem",textAlign:"center"}}>
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
              <div style={{fontSize:"1.8rem",marginBottom:".3rem"}}>✓</div>
              <div style={{color:phase.c,fontSize:".65rem",letterSpacing:".1em",textTransform:"uppercase",fontWeight:500}}>tap to continue</div>
            </div>
          ):(
            <>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:"3.2rem",fontWeight:300,color:T.cream,lineHeight:1,marginBottom:".25rem"}}>{count}</div>
              <div style={{color:phase.c,fontSize:".8rem",fontWeight:700,letterSpacing:".12em",textTransform:"uppercase"}}>{phase.n}</div>
            </>
          )}
        </div>
      </div>

      {/* Phase label + hint */}
      <div style={{fontFamily:"'Playfair Display',serif",color:T.cream,fontSize:"1.2rem",fontWeight:300,marginBottom:".25rem"}}>{phase.l}</div>
      <div style={{color:T.muted,fontSize:".82rem",marginBottom:".4rem"}}>{phase.hint}</div>
      <div style={{color:T.faint,fontSize:".72rem",letterSpacing:".04em"}}>Round {round+1} of 3</div>

      {/* Phase dots */}
      <div style={{display:"flex",gap:".5rem",marginTop:"1.2rem"}}>
        {PH.map((p,i)=>(
          <div key={i} style={{width:6,height:6,borderRadius:"50%",background:i===pi?p.c:"rgba(44,31,20,0.18)",transition:"background .4s"}}/>
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
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.08rem",color:T.cream,marginBottom:".28rem"}}>{s.p}</div>
        <div style={{color:T.faint,fontSize:".72rem"}}>Step {step+1} of 5</div>
      </div>
      <textarea value={input} onChange={e=>setInput(e.target.value)} rows={3} placeholder="Write what you notice…"
        style={{width:"100%",background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"1rem",color:"rgba(44,31,20,0.85)",fontSize:".87rem",fontWeight:300,lineHeight:1.65,resize:"none"}}
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
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.42rem",fontWeight:300,fontStyle:"italic",color:T.sage,marginBottom:".32rem"}}>You moved through it.</div>
      <div style={{color:T.muted,fontSize:".9rem",marginBottom:"1.8rem",lineHeight:1.82}}>Thought. Emotion. Body.<br/>All three layers. In five minutes.<br/>That is not nothing.</div>
      <Btn color={T.sage} onClick={onComplete}>Complete my session →</Btn>
    </div>
  );
}


/* ─────────────────────────────────────────────
   WISDOM SEEDS — insight at end of each session
───────────────────────────────────────────── */
const WISDOM = [
  {ancient:"The mind is everything. What you think, you become. — Buddha",science:"Neuroplasticity confirms this — repeated thought patterns physically reshape neural pathways."},
  {ancient:"You have power over your mind, not outside events. — Marcus Aurelius",science:"Locus of control research shows that focusing on controllables reduces cortisol by up to 30%."},
  {ancient:"Yoga chitta vritti nirodhah — Patanjali: Yoga is the stilling of the thought-waves of the mind.",science:"Mindful awareness of thoughts without attachment activates the prefrontal cortex and quiets the amygdala."},
  {ancient:"The wound is the place where the light enters you. — Rumi",science:"Post-traumatic growth research shows that working through difficulty builds measurably greater resilience."},
  {ancient:"Name it to tame it — the Vedas called it Namarupa: naming gives form to the formless. 3,000 years old.",science:"Lieberman, UCLA 2007: naming an emotion reduces amygdala activity by up to 50%."},
  {ancient:"In the middle of difficulty lies opportunity. — rooted in Stoic philosophy",science:"Reappraisal — finding meaning in hard moments — is one of the most evidence-based emotional regulation strategies."},
  {ancient:"Breath is the bridge which connects life to consciousness. — Thich Nhat Hanh",science:"Slow exhalation activates the vagus nerve, directly shifting the nervous system from threat to safety state."},
  {ancient:"The Vijnanamaya Kosha holds your emotions — they are not you, they are a sheath you wear. — Upanishads",science:"Emotion differentiation — the ability to precisely label feelings — predicts lower anxiety and better stress recovery."},
];

function getWisdomSeed(sessions) {
  return WISDOM[sessions % WISDOM.length];
}


/* ─────────────────────────────────────────────
   CLOSING BREATH — animated, on done screen
───────────────────────────────────────────── */
function ClosingBreath() {
  const [started, setStarted] = useState(false);
  const [phase, setPhase] = useState(0); // 0=in 1=hold 2=out 3=done
  const [count, setCount] = useState(4);
  const tRef = useRef(null);
  const rRef = useRef({phase:0, elapsed:0});
  const phases = [
    {label:"Breathe in",  n:"IN",   d:4, color:T.sage, hint:"through your nose, slowly"},
    {label:"Hold",        n:"HOLD", d:3, color:T.lav,  hint:"gently, no tension"},
    {label:"Let it go",   n:"OUT",  d:6, color:T.sky,  hint:"all the way out"},
  ];

  useEffect(()=>{
    if(!started) return;
    function tick() {
      rRef.current.elapsed++;
      const p = phases[rRef.current.phase];
      setCount(Math.max(1, p.d - rRef.current.elapsed));
      if(rRef.current.elapsed >= p.d) {
        rRef.current.elapsed = 0;
        const next = rRef.current.phase + 1;
        if(next >= 3) { clearInterval(tRef.current); setPhase(3); return; }
        rRef.current.phase = next;
        setPhase(next);
        setCount(phases[next].d);
      }
    }
    tRef.current = setInterval(tick, 1000);
    return () => clearInterval(tRef.current);
  }, [started]);

  // ── READY SCREEN — shown before breathing starts ──
  if(!started) return (
    <div style={{textAlign:"center",padding:"1.2rem 0 1.4rem",animation:"fadeIn .6s ease"}}>
      <div style={{fontSize:"2rem",marginBottom:"1rem",animation:"drift 4s ease infinite"}}>🌬️</div>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.3rem",fontWeight:300,color:T.cream,lineHeight:1.5,marginBottom:".6rem"}}>
        Let's take a breath together.
      </div>
      <div style={{fontSize:".88rem",color:T.muted,lineHeight:1.78,maxWidth:260,margin:"0 auto 1.5rem"}}>
        One slow breath — in, hold, out.<br/>
        Whenever you are ready.
      </div>
      <button onClick={()=>setStarted(true)}
        style={{padding:".85rem 2.2rem",borderRadius:50,background:T.sage,color:"#F4EEE4",border:"none",fontSize:"1rem",fontWeight:500,cursor:"pointer",boxShadow:`0 4px 16px ${T.sageBd}`,transition:"all .2s"}}
        onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
        onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
        I am ready →
      </button>
    </div>
  );

  if(phase === 3) return (
    <div style={{textAlign:"center",padding:"1.2rem 0 1.6rem",animation:"fadeIn .8s ease"}}>
      <div style={{fontSize:"2rem",marginBottom:".8rem",animation:"drift 4s ease infinite"}}>🌿</div>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.3rem",fontWeight:300,color:T.sage,marginBottom:".4rem"}}>
        You are here. You are okay.
      </div>
      <div style={{fontSize:".88rem",color:T.muted}}>That was enough.</div>
    </div>
  );

  const cur = phases[phase];
  const prog = (cur.d - count) / cur.d;
  const scale = phase===0 ? 1 + prog*.42 : phase===1 ? 1.42 : 1.42 - prog*.42;

  return (
    <div style={{textAlign:"center",padding:"1rem 0 1.2rem",userSelect:"none"}}>

      {/* Label above — big and clear */}
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.6rem",fontWeight:300,color:cur.color,marginBottom:".3rem",transition:"color .6s ease",letterSpacing:".02em"}}>
        {cur.label}
      </div>
      <div style={{fontSize:".82rem",color:T.muted,marginBottom:"1.4rem",transition:"opacity .4s"}}>
        {cur.hint}
      </div>

      {/* Circle — large, breathing */}
      <div style={{position:"relative",width:180,height:180,margin:"0 auto 1.4rem",display:"flex",alignItems:"center",justifyContent:"center"}}>
        {/* Outer glow */}
        <div style={{position:"absolute",inset:-20,borderRadius:"50%",background:`radial-gradient(circle,${cur.color}18,transparent 65%)`,transition:"background .6s ease",animation:"breathe 3s ease infinite"}}/>
        {/* Main circle */}
        <div style={{width:148,height:148,borderRadius:"50%",border:`2.5px solid ${cur.color}70`,background:`${cur.color}0A`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",transform:`scale(${scale})`,transition:"transform 1s ease, border-color .6s ease, background .6s ease",boxShadow:`0 0 30px ${cur.color}20`}}>
          {/* Count — very large */}
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:"3.8rem",fontWeight:300,color:T.cream,lineHeight:1,marginBottom:".2rem"}}>{count}</div>
          {/* Phase name */}
          <div style={{color:cur.color,fontSize:".7rem",fontWeight:700,letterSpacing:".18em",textTransform:"uppercase"}}>{cur.n}</div>
        </div>
      </div>

      {/* Progress dots */}
      <div style={{display:"flex",gap:".6rem",justifyContent:"center"}}>
        {phases.map((p,i)=>(
          <div key={i} style={{width: i===phase?20:7,height:7,borderRadius:20,background:i===phase?cur.color:i<phase?cur.color+"60":"rgba(46,34,24,0.12)",transition:"all .4s ease"}}/>
        ))}
      </div>
    </div>
  );
}

function StepDone({session,onNew,onHome}) {
  const sessionCount = (() => { try { return JSON.parse(localStorage.getItem("reset_v7")||"[]").length; } catch { return 0; } })();
  const wisdom = getWisdomSeed(sessionCount);
  const [showSummary,setShowSummary]=useState(false);
  const [shared,setShared]=useState(false);

  const items=[
    {label:"What you were carrying",val:session.situation?.slice(0,120)+(session.situation?.length>120?"…":""),color:T.gold,bg:T.goldBg},
    {label:"What you felt",val:session.emotion==="uncertain"?"Uncertain — and that's okay":session.emotion,color:T.rose,bg:T.roseBg},
    {label:"What you chose to do",val:session.action,color:T.sage,bg:T.sageBg},
  ].filter(i=>i.val);

  function handleShare() {
    const url = "https://resetmethod.app";
    const text = "I just used the RESET Method — 5 minutes through thought, emotion, and body. Free to try: " + url;
    if (navigator.share) {
      navigator.share({ title:"RESET Method", text, url }).then(()=>setShared(true)).catch(()=>{
        if(navigator.clipboard){ navigator.clipboard.writeText(url).then(()=>setShared(true)).catch(()=>{}); }
      });
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(()=>setShared(true)).catch(()=>{
        prompt("Copy this link to share:", url);
        setShared(true);
      });
    } else {
      prompt("Copy this link to share:", url);
      setShared(true);
    }
  }

  // Build personal closing message using what they shared
  const situation = session.situation || "";
  const emotion = session.emotion && session.emotion !== "uncertain" ? session.emotion.toLowerCase() : "";
  const action = session.action || "";

  // First words of their situation — personal anchor
  const situationSnippet = situation.split(/[.!?]/)[0]?.trim().slice(0,60) || "";

  const closingMsg = emotion && action
    ? `You came in carrying something real. You named what you felt — ${emotion}. And you chose to ${action.slice(0,50).toLowerCase()}${action.length>50?"…":""}. That is the whole practice.`
    : action
    ? `You came in overwhelmed. You leave with one clear step. That movement — from stuck to moving — is what this is for.`
    : `You moved through thought, emotion, and body. You showed up for yourself. That is not nothing.`;

  return (
    <div style={{animation:"fadeIn .8s ease",paddingBottom:"2rem"}}>

      {/* ── THE MOMENT — personal, calm, centred ── */}
      <div style={{textAlign:"center",padding:"1.5rem 0 2rem"}}>
        <div style={{fontSize:"2.5rem",marginBottom:"1.2rem",animation:"drift 5s ease infinite"}}>🌿</div>

        <div style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(1.8rem,4vw,2.4rem)",fontWeight:300,fontStyle:"italic",color:T.sage,lineHeight:1.25,marginBottom:"1rem"}}>
          All is well.<br/>You are okay.
        </div>

        <div style={{width:32,height:1,background:T.sageBd,margin:"0 auto 1.2rem"}}/>

        <div style={{fontSize:".95rem",color:T.muted,lineHeight:1.88,maxWidth:320,margin:"0 auto 1.2rem",fontWeight:300}}>
          {closingMsg}
        </div>

        <div style={{fontFamily:"'Playfair Display',serif",fontStyle:"italic",fontSize:".88rem",color:T.faint,lineHeight:1.82,maxWidth:340,margin:"0 auto"}}>
          "The storm you were inside five minutes ago is the same storm.<br/>
          But you are no longer the same person standing in it."
        </div>
      </div>

      {/* ── CLOSING BREATH — animated, inviting ── */}
      <ClosingBreath/>

      {/* ── ACTION — the most important thing ── */}
      {session.action&&(
        <div style={{padding:"1.2rem 1.3rem",borderRadius:16,background:T.goldBg,border:`1px solid ${T.goldBd}`,marginBottom:"1.8rem"}}>
          <div style={{fontSize:".68rem",fontWeight:600,letterSpacing:".18em",textTransform:"uppercase",color:T.gold,marginBottom:".6rem",opacity:.75}}>Your one action</div>
          <div style={{fontSize:".95rem",color:T.cream,lineHeight:1.75,marginBottom:".6rem",fontWeight:400}}>{session.action}</div>
          <div style={{fontSize:".78rem",color:T.muted,lineHeight:1.65,fontStyle:"italic"}}>
            Do this within the next 30 minutes. Not perfectly. Just the first move.
          </div>
        </div>
      )}

      {/* ── WISDOM SEED — the gift ── */}
      <div style={{padding:"1.2rem 1.3rem",borderRadius:16,background:T.skyBg,border:`1px solid ${T.skyBd}`,marginBottom:"1.8rem",animation:"slideUp .6s ease"}}>
        <div style={{fontSize:".68rem",fontWeight:600,letterSpacing:".18em",textTransform:"uppercase",color:T.sky,marginBottom:".65rem",opacity:.75}}>From the ancient record</div>
        <div style={{fontFamily:"'Playfair Display',serif",fontStyle:"italic",fontSize:".95rem",color:T.cream,lineHeight:1.82,marginBottom:".7rem"}}>
          {wisdom.ancient}
        </div>
        <div style={{fontSize:".78rem",color:T.muted,lineHeight:1.7,borderTop:`1px solid ${T.skyBd}`,paddingTop:".65rem"}}>
          ✦ {wisdom.science}
        </div>
      </div>

      {/* ── SESSION SUMMARY — collapsible ── */}
      <div style={{marginBottom:"1.5rem"}}>
        <button onClick={()=>setShowSummary(o=>!o)}
          style={{background:"none",border:"none",color:T.faint,fontSize:".78rem",cursor:"pointer",display:"flex",alignItems:"center",gap:".38rem",margin:"0 auto",padding:".3rem"}}>
          <span style={{fontSize:".55rem",transition:"transform .3s",display:"inline-block",transform:showSummary?"rotate(90deg)":"rotate(0)"}}>▶</span>
          {showSummary?"Hide this session":"View this session"}
        </button>
        {showSummary&&(
          <div style={{marginTop:".85rem",animation:"slideUp .3s ease"}}>
            {items.map(({label,val,color,bg})=>(
              <div key={label} style={{padding:".75rem 1rem",borderRadius:12,marginBottom:".42rem",textAlign:"left",background:bg,border:`1px solid ${color}1A`}}>
                <div style={{fontSize:".58rem",fontWeight:600,letterSpacing:".14em",textTransform:"uppercase",color,marginBottom:".2rem"}}>{label}</div>
                <div style={{fontSize:".82rem",color:T.muted,lineHeight:1.6}}>{val}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── SHARE ── */}
      <button onClick={handleShare}
        style={{display:"block",width:"100%",padding:".9rem",borderRadius:13,border:`1px solid ${shared?T.sageBd:T.border}`,background:shared?T.sageBg:"transparent",color:shared?T.sage:T.muted,fontSize:".88rem",cursor:"pointer",marginBottom:".55rem",transition:"all .3s",letterSpacing:".02em"}}>
        {shared?"✓ Link copied — thank you":"🌿 Share with someone who needs this"}
      </button>

      {/* ── NEXT ACTIONS ── */}
      <button onClick={onNew}
        style={{display:"block",width:"100%",padding:".9rem",borderRadius:13,border:`1px solid ${T.goldBd}`,background:T.goldBg,color:T.gold,fontSize:".9rem",fontWeight:500,cursor:"pointer",marginBottom:".45rem",letterSpacing:".02em"}}>
        New session →
      </button>
      <button onClick={onHome}
        style={{display:"block",width:"100%",background:"none",border:"none",color:T.faint,fontSize:".76rem",padding:".38rem",cursor:"pointer"}}>
        ← Back to home
      </button>

      {/* ── 24HR GENTLE INVITATION — no obligation ── */}
      <div style={{marginTop:"1.5rem",textAlign:"center",padding:".8rem 0"}}>
        <div style={{fontSize:".78rem",color:T.faint,lineHeight:1.82,fontStyle:"italic",maxWidth:280,margin:"0 auto"}}>
          If you feel like it — come back tomorrow and tell me how the action went. No pressure. Just an open door.
        </div>
      </div>

      {/* ── CONTACT after session ── */}
      <div style={{marginTop:"2rem",paddingTop:"1.8rem",borderTop:`1px solid ${T.border}`}}>
        <ContactSection context="session"/>
      </div>
    </div>
  );
}

const KOSHA = {
  1:{color:T.gold,  glow:"rgba(122,80,16,0.1)",  border:"rgba(122,80,16,0.25)",  letter:"R"},
  2:{color:T.sky,   glow:"rgba(40,88,122,0.1)",  border:"rgba(40,88,122,0.25)",  letter:"E"},
  3:{color:T.rose,  glow:"rgba(140,60,48,0.1)",  border:"rgba(140,60,48,0.25)",  letter:"S"},
  4:{color:T.sand,  glow:"rgba(106,72,24,0.1)",  border:"rgba(106,72,24,0.25)",  letter:"E"},
  5:{color:T.sage,  glow:"rgba(42,94,68,0.1)",   border:"rgba(42,94,68,0.25)",   letter:"T"},
};

const STEP_META = [
  {hd:"What is actually happening?",   sub:"Tell me what is going on. I will read every word."},
  {hd:"What is in your hands?",        sub:"Some of this belongs to you. Some of it doesn't."},
  {hd:"What are you feeling?",         sub:"Whatever it is — it makes sense. Let's name it."},
  {hd:"One small thing.",              sub:"Not a plan. Just the next move."},
  {hd:"Come back to yourself.",        sub:"Let your body catch up to where your mind just went."},
];


function SessionShell({ onHome, auth }) {
  const [step, setStep] = useState(0);
  const [session, setSession] = useState({ created_at:new Date().toISOString() });
  const save = upd => setSession(s => ({ ...s, ...upd }));

  async function finish(action) {
    const final = { ...session, action };
    setSession(final);
    try { const p = JSON.parse(localStorage.getItem("reset_v7") || "[]"); localStorage.setItem("reset_v7", JSON.stringify([final, ...p].slice(0, 30))); } catch {}
    if(auth?.token){ try{ await saveSessionToCloud(final, auth.token); }catch{} }
    setStep(6);
  }

  const meta  = step >= 1 && step <= 5 ? STEP_META[step - 1] : null;
  const kosha = KOSHA[step] || { color:T.gold, glow:"rgba(212,168,83,0.08)", border:"rgba(212,168,83,0.2)", letter:"✦" };
  const progress = step === 0 ? 0 : Math.min(Math.round((step / 5) * 100), 100);

  // Active layer for the circles
  const activeLayer = step <= 2 ? "mano" : step <= 4 ? "vijna" : step === 5 ? "prana" : null;

  return (
    <div style={{ minHeight:"100vh", background:T.bg }}>
      <style>{CSS}</style>
      <div style={{ position:"fixed", top:0, left:"50%", transform:"translateX(-50%)", width:500, height:280, background:`radial-gradient(ellipse at top,${kosha.glow},transparent 65%)`, pointerEvents:"none", zIndex:0, transition:"background 1s ease" }}/>

      {/* Nav */}
      <div style={{ position:"sticky", top:0, zIndex:50, display:"flex", justifyContent:"space-between", alignItems:"center", padding:".85rem 1.5rem", background:"rgba(244,238,228,0.96)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(245,239,230,0.05)" }}>
        <button onClick={onHome} style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.3rem", fontWeight:400, color:T.gold, background:"none", border:"none", letterSpacing:".1em", cursor:"pointer" }}>RESET</button>
        <div style={{ display:"flex", gap:".32rem" }}>
          {[1,2,3,4,5].map(i => {
            const k = KOSHA[i];
            const done = i < step, active = i === step;
            return (
              <div key={i} style={{ width:27, height:27, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:".7rem", fontWeight:600, background:done ? T.goldBg : active ? k.color : "rgba(26,17,8,0.06)", color:active ? "#F4EEE4" : done ? T.gold : "rgba(245,239,230,0.22)", border:done ? "1px solid rgba(212,168,83,0.28)" : "none", transition:"all .4s ease", fontFamily:"'Playfair Display',serif" }}>
                {k.letter}
              </div>
            );
          })}
        </div>
        <div style={{ width:50 }} />
      </div>

      {/* Journey bar — Overwhelmed → At peace */}
      {step > 0 && step < 6 && (
        <div style={{padding:".6rem 1.5rem .3rem",maxWidth:520,margin:"0 auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:".45rem"}}>
            <span style={{fontSize:".72rem",fontFamily:"'Playfair Display',serif",fontStyle:"italic",color:T.rose,opacity:.8}}>Overwhelmed</span>
            <span style={{fontSize:".72rem",fontFamily:"'Playfair Display',serif",fontStyle:"italic",color:progress>=100?T.sage:"rgba(46,34,24,0.2)",transition:"color .8s ease"}}>At peace</span>
          </div>
          <div style={{position:"relative",height:5,background:T.border,borderRadius:20}}>
            <div style={{position:"absolute",left:0,top:0,height:"100%",width:`${progress}%`,borderRadius:20,background:`linear-gradient(90deg,${T.rose}60,${kosha.color})`,transition:"width .9s cubic-bezier(0.4,0,0.2,1)"}}/>
            <div style={{position:"absolute",top:"50%",left:`${Math.max(progress,2)}%`,transform:"translate(-50%,-50%)",width:13,height:13,borderRadius:"50%",background:kosha.color,boxShadow:`0 0 10px ${kosha.color}80`,border:`2px solid ${T.bg}`,transition:"left .9s cubic-bezier(0.4,0,0.2,1)",zIndex:2}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:".38rem"}}>
            <span style={{fontSize:".65rem",color:kosha.color,fontWeight:500}}>{progress}%</span>
            <span style={{fontSize:".62rem",color:T.faint,fontStyle:"italic"}}>
              {progress<=20?"Beginning to untangle…"
                :progress<=40?"Finding what is in your power…"
                :progress<=60?"Naming what you feel…"
                :progress<=80?"Choosing one step forward…"
                :"One breath away from peace"}
            </span>
          </div>
        </div>
      )}

      <div style={{ position:"relative", zIndex:1, maxWidth:520, margin:"0 auto", padding:"2rem 1.5rem 5rem" }}>

        {/* Step heading */}
        {meta && (
          <div style={{ marginBottom:"1.35rem", animation:"fadeIn .4s ease" }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(1.45rem,3.5vw,1.95rem)", fontWeight:400, lineHeight:1.18, marginBottom:".4rem", color:T.cream }}>{meta.hd}</div>
            <div style={{ color:T.muted, fontSize:".82rem", lineHeight:1.72 }}>{meta.sub}</div>
          </div>
        )}

        {/* Step 0 — start screen with three circles */}
        {step === 0 && (
          <div style={{ paddingTop:"1rem", animation:"fadeIn .5s ease" }}>
            <div style={{ display:"flex", justifyContent:"center", marginBottom:"2rem" }}>
              <ThreeCircles size={280} animated={true} activeLayer={null} />
            </div>
            <div style={{ textAlign:"center", marginBottom:"2.2rem" }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(1.8rem,5vw,2.6rem)", fontWeight:300, fontStyle:"italic", color:T.cream, lineHeight:1.2, marginBottom:".8rem" }}>
                What's on your mind<br/>right now?
              </div>
              <div style={{ fontSize:".95rem", color:T.muted, lineHeight:1.82, maxWidth:320, margin:"0 auto", fontWeight:300 }}>
                Whatever it is — write it, or say it out loud.<br/>No rush. I'm here.
              </div>
            </div>
            <StepSituation onNext={(v,intake) => { save({ situation:v, intake }); setStep(1); }} />
          </div>
        )}

        {step === 1 && <StepRecognize situation={session.situation} intake={session.intake||{}} onNext={r => { save({ clarify:r }); setStep(2); }} />}
        {step === 2 && <StepExamine onNext={b => { save({ buckets:b }); setStep(3); }} />}
        {step === 3 && <StepSurface situation={session.situation} onNext={e => { save({ emotion:e }); setStep(4); }} />}
        {step === 4 && <StepExecute situation={session.situation} emotion={session.emotion} onNext={a => finish(a)} />}
        {step === 5 && <StepTune onComplete={() => setStep(6)} />}
        {step === 6 && <StepDone session={session} onNew={() => { setStep(0); setSession({ created_at:new Date().toISOString() }); }} onHome={onHome} />}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   HISTORY
───────────────────────────────────────────── */
function History({ onBack, onNew, auth }) {
  const sessions = (() => { try { return JSON.parse(localStorage.getItem("reset_v7") || "[]"); } catch { return []; } })();
  return (
    <div style={{ minHeight:"100vh", background:T.bg, padding:"2rem 1.5rem" }}>
      <style>{CSS}</style>
      <div style={{ maxWidth:540, margin:"0 auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"2.5rem" }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.75rem", fontWeight:300, fontStyle:"italic", color:T.muted }}>Your sessions</div>
          <div style={{ display:"flex", gap:".55rem" }}>
            <button onClick={onNew} style={{ padding:".38rem .8rem", borderRadius:8, border:`1px solid ${T.goldBorder}`, background:"transparent", color:T.gold, fontSize:".76rem" }}>New session →</button>
            <button onClick={onBack} style={{ padding:".38rem .8rem", borderRadius:8, border:"1px solid rgba(245,239,230,0.1)", background:"transparent", color:T.muted, fontSize:".76rem" }}>← Back</button>
          </div>
        </div>
        {!sessions.length ? (
          <div style={{ textAlign:"center", padding:"5rem 2rem", color:"rgba(245,239,230,0.18)" }}>
            <ThreeCircles size={140} animated={false} />
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.4rem", fontStyle:"italic", marginTop:"1.5rem", color:T.muted, opacity:.6 }}>No sessions yet</div>
          </div>
        ) : sessions.map((s, i) => (
          <div key={i} style={{ padding:"1.1rem 1.25rem", borderRadius:14, marginBottom:".65rem", border:`1px solid ${T.border}`, background:T.card }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:".45rem" }}>
              <span style={{ fontSize:".64rem", padding:".18rem .55rem", borderRadius:20, background:"rgba(212,168,83,0.1)", color:T.gold, fontWeight:500, letterSpacing:".08em" }}>Session {sessions.length - i}</span>
              <span style={{ color:T.faint, fontSize:".68rem" }}>{new Date(s.date).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" })}</span>
            </div>
            <div style={{ fontSize:".83rem", color:T.muted, marginBottom:".45rem", fontStyle:"italic", lineHeight:1.55 }}>"{s.situation?.slice(0, 90)}{s.situation?.length > 90 ? "…" : ""}"</div>
            <div style={{ display:"flex", gap:".38rem", flexWrap:"wrap" }}>
              {s.emotion && <span style={{ fontSize:".64rem", padding:".18rem .55rem", borderRadius:20, background:"rgba(201,123,110,0.1)", color:T.rose, fontWeight:500 }}>Felt: {s.emotion}</span>}
              {s.action  && <span style={{ fontSize:".64rem", padding:".18rem .55rem", borderRadius:20, background:"rgba(123,166,138,0.1)", color:T.sage, fontWeight:500 }}>✓ Action taken</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   LANDING PAGE
───────────────────────────────────────────── */
/* ─────────────────────────────────────────────
   CONTACT SECTION
───────────────────────────────────────────── */
function ContactSection({context="landing"}) {
  const [type,setType]=useState("");
  const [rating,setRating]=useState(null); // emoji rating
  const [message,setMessage]=useState("");
  const [contactEmail,setContactEmail]=useState("");
  const [sent,setSent]=useState(false);
  const [loading,setLoading]=useState(false);
  const RATINGS=[
    {v:5,e:"🌟",l:"Transformative"},
    {v:4,e:"😌",l:"Really helped"},
    {v:3,e:"🙂",l:"Helpful"},
    {v:2,e:"😐",l:"Okay"},
    {v:1,e:"😔",l:"Not for me"},
  ];
  const types=[{key:"feedback",label:"I have feedback"},{key:"question",label:"I have a question"},{key:"story",label:"I want to share my story"},{key:"other",label:"Something else"}];
  async function handleSend(){
    if(!message.trim()||!type)return;
    setLoading(true);
    try{
      await fetch("https://formsubmit.co/ajax/shindearchana1@gmail.com",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({_subject:`RESET Method — ${type}${rating?` (${rating.l})`:""}`,message:message.trim(),type,rating:rating?`${rating.e} ${rating.l}`:"not rated",source:context,reply_to:contactEmail.trim()||"not provided"})});
      setSent(true);
    }catch{setSent(true);}
    finally{setLoading(false);}
  }
  if(sent) return (
    <div style={{padding:"1.1rem 1.2rem",borderRadius:14,background:T.sageBg,border:`1px solid ${T.sageBd}`,textAlign:"center",animation:"slideUp .4s ease"}}>
      <div style={{fontSize:"1.3rem",marginBottom:".5rem"}}>🌿</div>
      <div style={{fontFamily:"'Playfair Display',serif",fontStyle:"italic",color:T.sage,fontSize:".95rem",marginBottom:".35rem"}}>Received. Thank you.</div>
      <div style={{fontSize:".8rem",color:T.muted,lineHeight:1.7}}>Every message is read personally.</div>
    </div>
  );
  return (
    <div style={{animation:"slideUp .4s ease"}}>
      {context==="landing"&&<div style={{marginBottom:"1.2rem",textAlign:"center"}}><div style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(1.1rem,2.2vw,1.55rem)",fontWeight:300,fontStyle:"italic",color:T.cream,lineHeight:1.45,marginBottom:".5rem"}}>Say something.<br/>I read every message personally.</div><div style={{fontSize:".8rem",color:T.faint}}>Feedback, questions, your story — all welcome.</div></div>}
      {context==="session"&&<div style={{marginBottom:"1rem"}}><div style={{fontFamily:"'Playfair Display',serif",fontStyle:"italic",color:T.muted,fontSize:".9rem",lineHeight:1.65,marginBottom:".28rem"}}>How was this session?</div><div style={{fontSize:".76rem",color:T.faint}}>Your feedback shapes what RESET becomes.</div></div>}
      {/* Emoji rating — for session context */}
      {context==="session"&&(
        <div style={{marginBottom:"1rem"}}>
          <div style={{fontSize:".75rem",color:T.muted,marginBottom:".55rem"}}>How did this session feel?</div>
          <div style={{display:"flex",gap:".4rem",justifyContent:"space-between"}}>
            {RATINGS.map(r=>(
              <button key={r.v} onClick={()=>setRating(r)}
                style={{flex:1,padding:".5rem .2rem",borderRadius:12,border:`1px solid ${rating?.v===r.v?T.goldBd:T.border}`,background:rating?.v===r.v?T.goldBg:"transparent",cursor:"pointer",transition:"all .15s",textAlign:"center"}}>
                <div style={{fontSize:"1.4rem",marginBottom:".2rem"}}>{r.e}</div>
                <div style={{fontSize:".58rem",color:rating?.v===r.v?T.gold:T.faint,lineHeight:1.3}}>{r.l}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{display:"flex",flexWrap:"wrap",gap:".38rem",marginBottom:".9rem"}}>
        {types.map(t=><button key={t.key} onClick={()=>setType(t.key)} style={{padding:".35rem .8rem",borderRadius:20,border:`1px solid ${type===t.key?T.goldBd:T.border}`,background:type===t.key?T.goldBg:"transparent",color:type===t.key?T.gold:T.faint,fontSize:".75rem",cursor:"pointer",transition:"all .15s"}}>{t.label}</button>)}
      </div>
      <textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder={type==="feedback"?"What's working? What isn't?":type==="question"?"What would you like to know?":type==="story"?"Tell me what happened.":"What's on your mind?"} rows={3} style={{width:"100%",background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:".9rem",color:"rgba(44,31,24,0.88)",fontSize:".86rem",fontWeight:300,lineHeight:1.72,resize:"none",marginBottom:".65rem",transition:"border-color .2s"}} onFocus={e=>e.target.style.borderColor="rgba(140,96,32,0.3)"} onBlur={e=>e.target.style.borderColor=T.border}/>
      <div style={{marginBottom:".65rem"}}>
        <div style={{fontSize:".7rem",color:T.faint,marginBottom:".35rem"}}>May I follow up with you? <span style={{opacity:.6}}>(optional)</span></div>
        <input value={contactEmail} onChange={e=>setContactEmail(e.target.value)} type="email" placeholder="Your email — only if you'd like a reply" style={{width:"100%",background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:".68rem .9rem",color:"rgba(44,31,24,0.78)",fontSize:".82rem",transition:"border-color .2s"}} onFocus={e=>e.target.style.borderColor="rgba(140,96,32,0.28)"} onBlur={e=>e.target.style.borderColor=T.border}/>
      </div>
      <button onClick={handleSend} disabled={!message.trim()||!type||loading} style={{display:"block",width:"100%",padding:".85rem",borderRadius:12,border:`1px solid ${(!message.trim()||!type)?T.border:T.goldBd}`,background:(!message.trim()||!type)?"transparent":T.goldBg,color:(!message.trim()||!type)?T.faint:T.gold,fontSize:".86rem",fontWeight:500,cursor:(!message.trim()||!type)?"default":"pointer",opacity:loading?.6:1,transition:"all .2s"}}>
        {loading?"Sending…":"Send →"}
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   AUTH MODAL
───────────────────────────────────────────── */
function AuthModal({onClose,onAuth}) {
  const [email,setEmail]=useState("");const [sent,setSent]=useState(false);const [loading,setLoading]=useState(false);const [error,setError]=useState("");
  async function handleSend(){
    if(!email.trim()||!email.includes("@")){setError("Please enter a valid email.");return;}
    setLoading(true);setError("");
    const ok=await sendMagicLink(email.trim().toLowerCase());
    if(ok)setSent(true);else setError("Something went wrong. Please try again.");
    setLoading(false);
  }
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:"1.5rem",backdropFilter:"blur(8px)"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:"#FDFAF5",borderRadius:20,padding:"2rem 1.8rem",maxWidth:380,width:"100%",border:`1px solid ${T.goldBd}`,animation:"slideUp .3s ease"}}>
        {sent?(
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:"2rem",marginBottom:"1rem"}}>📬</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontStyle:"italic",color:T.sage,fontSize:"1.05rem",marginBottom:".45rem"}}>Check your inbox.</div>
            <div style={{fontSize:".84rem",color:T.muted,lineHeight:1.8,marginBottom:"1.4rem"}}>We sent a magic link to <span style={{color:T.gold}}>{email}</span>.<br/>Click it to sign in — no password needed.</div>
            <button onClick={onClose} style={{background:"none",border:`1px solid ${T.border}`,borderRadius:10,color:T.muted,fontSize:".8rem",padding:".6rem 1.2rem",cursor:"pointer"}}>Close</button>
          </div>
        ):(
          <>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.25rem",fontWeight:300,fontStyle:"italic",color:T.cream,marginBottom:".4rem"}}>Save your sessions</div>
            <div style={{fontSize:".8rem",color:T.faint,lineHeight:1.75,marginBottom:"1.4rem"}}>Create a free account to save sessions across devices and unlock pattern insights as you build your history.</div>
            <input value={email} onChange={e=>{setEmail(e.target.value);setError("");}} type="email" placeholder="Your email address" onKeyDown={e=>{if(e.key==="Enter")handleSend();}} style={{width:"100%",background:"rgba(255,255,255,0.8)",border:`1px solid ${error?T.roseBd:T.border}`,borderRadius:11,padding:".85rem 1rem",color:T.cream,fontSize:".9rem",marginBottom:".45rem"}}/>
            {error&&<div style={{fontSize:".72rem",color:T.rose,marginBottom:".45rem"}}>{error}</div>}
            <button onClick={handleSend} disabled={loading} style={{display:"block",width:"100%",padding:".88rem",borderRadius:11,border:`1px solid ${T.goldBd}`,background:T.goldBg,color:T.gold,fontSize:".9rem",fontWeight:500,cursor:"pointer",opacity:loading?.6:1,marginBottom:".75rem"}}>{loading?"Sending…":"Send magic link →"}</button>
            <div style={{textAlign:"center",fontSize:".7rem",color:T.faint,lineHeight:1.65}}>No password. Just click the link we send you.<br/><span style={{opacity:.6}}>Free · GDPR compliant · Cancel anytime</span></div>
            <button onClick={onClose} style={{display:"block",width:"100%",marginTop:".75rem",background:"none",border:"none",color:T.faint,fontSize:".75rem",cursor:"pointer"}}>Continue without account</button>
          </>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   2AM EMERGENCY MODE
───────────────────────────────────────────── */
function EmergencyMode({onExit}) {
  const [phase,setPhase]=useState("breathe");
  const [bCount,setBCount]=useState(4);const [bPhase,setBPhase]=useState(0);const [bRound,setBRound]=useState(0);
  const tRef=useRef(null);const rRef=useRef({phase:0,elapsed:0,round:0});
  const BPH=[{n:"in",d:4,label:"Breathe in"},{n:"hold",d:4,label:"Hold"},{n:"out",d:6,label:"Let go"}];
  useEffect(()=>{
    if(phase!=="breathe")return;
    tRef.current=setInterval(()=>{
      rRef.current.elapsed++;const p=BPH[rRef.current.phase];
      setBCount(Math.max(1,p.d-rRef.current.elapsed));
      if(rRef.current.elapsed>=p.d){rRef.current.elapsed=0;const next=(rRef.current.phase+1)%3;if(rRef.current.phase===2){rRef.current.round++;setBRound(rRef.current.round);if(rRef.current.round>=3){clearInterval(tRef.current);setPhase("ground");return;}}rRef.current.phase=next;setBPhase(next);setBCount(BPH[next].d);}
    },1000);
    return()=>clearInterval(tRef.current);
  },[phase]);
  const curP=BPH[bPhase];
  if(phase==="done") return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"2rem",textAlign:"center"}}>
      <style>{CSS}</style>
      <div style={{fontSize:"2rem",marginBottom:"1.1rem",animation:"drift 4s ease infinite"}}>🌿</div>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.55rem",fontWeight:300,fontStyle:"italic",color:T.sage,marginBottom:".45rem"}}>You're okay.</div>
      <div style={{fontSize:".86rem",color:T.muted,lineHeight:1.85,maxWidth:295,marginBottom:"1.8rem"}}>You just moved through it. That took something. Be gentle with yourself right now.</div>
      <button onClick={onExit} style={{padding:".75rem 1.8rem",borderRadius:50,background:T.sageBg,color:T.sage,border:`1px solid ${T.sageBd}`,fontSize:".85rem",cursor:"pointer"}}>I'm okay — take me home</button>
    </div>
  );
  return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"2rem",textAlign:"center"}}>
      <style>{CSS}</style>
      <button onClick={onExit} style={{position:"fixed",top:"1.2rem",left:"1.2rem",background:"none",border:"none",color:T.faint,fontSize:".75rem",cursor:"pointer"}}>← Exit</button>
      {phase==="breathe"&&(
        <>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.05rem",fontWeight:300,fontStyle:"italic",color:T.muted,marginBottom:"2.2rem"}}>Just breathe with this for a moment.</div>
          <div style={{position:"relative",width:170,height:170,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"1.8rem"}}>
            <div style={{position:"absolute",inset:-18,borderRadius:"50%",background:`radial-gradient(circle,${T.sage}10,transparent 65%)`,animation:"breathe 3s ease infinite"}}/>
            <div style={{width:132,height:132,borderRadius:"50%",border:`1.5px solid ${T.sage}50`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:`${T.sage}05`,transform:bPhase===0?`scale(${1+((4-bCount)/4)*.3})`:bPhase===1?"scale(1.3)":`scale(${1.3-((6-bCount)/6)*.3})`,transition:"transform 1s ease"}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:"3.2rem",fontWeight:300,color:T.cream,lineHeight:1,marginBottom:".3rem"}}>{bCount}</div>
              <div style={{color:T.sage,fontSize:".9rem",fontWeight:500,letterSpacing:".08em",textTransform:"uppercase"}}>{curP.n}</div>
            </div>
          </div>
          <div style={{fontFamily:"'Playfair Display',serif",fontStyle:"italic",color:T.cream,fontSize:"1.1rem",fontWeight:300,marginBottom:".35rem"}}>{curP.label}</div>
          <div style={{color:T.muted,fontSize:".78rem"}}>Breath {bRound+1} of 3</div>
        </>
      )}
      {phase==="ground"&&(
        <div style={{maxWidth:310,animation:"fadeIn .8s ease"}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.15rem",fontWeight:300,fontStyle:"italic",color:T.muted,marginBottom:"1.4rem",lineHeight:1.62}}>Good. Now look around you.</div>
          <div style={{fontSize:".9rem",color:"rgba(46,34,24,0.65)",lineHeight:2.1,marginBottom:"1.8rem"}}>
              Notice 3 things you can see or sense around you.<br/>
              Feel the surface beneath you — floor, bed, chair.<br/>
              Take one slow breath all the way out.
            </div>
          <div style={{fontSize:".82rem",color:T.muted,lineHeight:1.85,marginBottom:"1.8rem",fontStyle:"italic"}}>You are here. You are safe.<br/>This moment is real and it is manageable.</div>
          <button onClick={()=>setPhase("done")} style={{padding:".8rem 2rem",borderRadius:50,background:T.sageBg,color:T.sage,border:`1px solid ${T.sageBd}`,fontSize:".85rem",cursor:"pointer",width:"100%"}}>I'm feeling a little steadier →</button>
        </div>
      )}
    </div>
  );
}


function Landing({onStart,onHistory,onEmergency,auth,onLoginClick,onSignOut}) {
  const [email,setEmail]=useState("");
  const [joined,setJoined]=useState(false);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [showMore,setShowMore]=useState(false);
  const [showComing,setShowComing]=useState(false);

  async function handleJoin(){
    if(!email.trim()||!email.includes("@")){setError("Please enter a valid email.");return;}
    setLoading(true);setError("");
    try{await subscribeToBrevo(email.trim().toLowerCase());setJoined(true);
    }
    catch{setError("Something went wrong.");}
    finally{setLoading(false);}
  }

  return (
    <div style={{background:T.bg,minHeight:"100vh",overflowX:"hidden"}}>
      <style>{CSS}</style>
      <div style={{position:"fixed",top:0,left:"50%",transform:"translateX(-50%)",width:"100%",height:"100vh",background:`radial-gradient(ellipse at 50% 30%,${T.goldBg},transparent 65%)`,pointerEvents:"none",zIndex:0}}/>

      {/* ── NAV ── */}
      <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:50,display:"flex",justifyContent:"space-between",alignItems:"center",padding:".85rem 1.8rem",background:"rgba(244,238,228,0.95)",backdropFilter:"blur(12px)",borderBottom:`1px solid ${T.border}`}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.55rem",fontWeight:400,color:T.gold,letterSpacing:".14em",lineHeight:1,cursor:"default"}}>
          RESET
          <span style={{display:"block",animation:"logoGlow 3s ease infinite",fontSize:".52rem",fontWeight:400,letterSpacing:".38em",color:T.gold,opacity:.55,marginTop:".12rem",fontFamily:"'DM Sans',sans-serif",textTransform:"uppercase"}}>Method</span>
        </div>
        <div style={{display:"flex",gap:".55rem",alignItems:"center"}}>
          {auth?(
            <>
              <button onClick={onHistory} style={{background:"none",border:"none",color:T.faint,fontSize:".82rem",cursor:"pointer"}}>Sessions</button>
              <button onClick={onSignOut} style={{background:"none",border:"none",color:T.faint,fontSize:".82rem",cursor:"pointer"}}>Sign out</button>
            </>
          ):(
            <button onClick={onLoginClick} style={{background:"none",border:`1px solid ${T.goldBd}`,borderRadius:20,color:T.gold,fontSize:".82rem",padding:".3rem .8rem",cursor:"pointer"}}>Save sessions</button>
          )}
          <button onClick={onStart}
            style={{padding:".5rem 1.2rem",borderRadius:50,background:T.gold,color:"#F4EEE4",border:"none",fontSize:".85rem",fontWeight:500,cursor:"pointer"}}>
            Begin →
          </button>
        </div>
      </nav>

      {/* ── HERO — everything on one screen ── */}
      <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"6rem 1.5rem 2rem",textAlign:"center",position:"relative",zIndex:1}}>
        <div style={{position:"relative",zIndex:1,maxWidth:520,width:"100%",animation:"fadeIn .8s ease"}}>

          <div style={{display:"flex",justifyContent:"center",marginBottom:"1.5rem"}}>
            <ThreeCircles size={168} animated={true}/>
          </div>

          <div style={{fontSize:".76rem",letterSpacing:".22em",textTransform:"uppercase",color:T.gold,opacity:.65,marginBottom:"1.2rem"}}>
            Ancient wisdom · Modern neuroscience
          </div>

          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(2.2rem,5.5vw,3.4rem)",fontWeight:400,lineHeight:1.15,color:T.cream,marginBottom:"1rem"}}>
            Feeling overwhelmed?<br/>
            <em style={{fontStyle:"italic",color:T.gold}}>Let us work through it.</em>
          </h1>

          <p style={{fontSize:"clamp(1.05rem,2vw,1.18rem)",color:T.muted,lineHeight:1.85,marginBottom:"1.8rem",fontWeight:400,maxWidth:400,margin:"0 auto 1.8rem"}}>
            Five minutes. Five steps. Thought, emotion, and body — all three layers, in the right sequence.
          </p>

          <button onClick={onStart}
            style={{display:"block",width:"100%",maxWidth:340,margin:"0 auto",padding:"1.1rem 2rem",borderRadius:16,background:T.gold,color:"#F4EEE4",border:"none",fontSize:"1.08rem",fontWeight:500,cursor:"pointer",letterSpacing:".02em",boxShadow:`0 4px 20px ${T.goldBd}`,transition:"all .22s"}}
            onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 8px 28px ${T.goldBd}`;}}
            onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow=`0 4px 20px ${T.goldBd}`;}}>
            Begin a free session →
          </button>

          <div style={{marginTop:".7rem",fontSize:".84rem",color:T.muted}}>Free · Private · No account needed</div>

          <div style={{marginTop:"1.2rem"}}>
            <button onClick={onEmergency} style={{background:"none",border:"none",color:T.rose,fontSize:".8rem",cursor:"pointer",opacity:.65}}>
              I need help right now →
            </button>
          </div>

          {/* How it works — expandable */}
          <div style={{marginTop:"2rem",borderTop:`1px solid ${T.border}`,paddingTop:"1.5rem"}}>
            <button onClick={()=>setShowMore(o=>!o)}
              style={{background:"none",border:"none",color:T.muted,fontSize:".82rem",cursor:"pointer",display:"flex",alignItems:"center",gap:".4rem",margin:"0 auto"}}>
              <span style={{transition:"transform .3s",display:"inline-block",transform:showMore?"rotate(90deg)":"rotate(0)",fontSize:".6rem"}}>▶</span>
              {showMore?"Hide":"How does it work?"}
            </button>
            {showMore&&(
              <div style={{marginTop:"1.2rem",textAlign:"left",animation:"slideUp .3s ease"}}>
                {[
                  {k:"R",label:"Recognize",desc:"Separates facts from what your mind is adding.",color:T.gold},
                  {k:"E",label:"Examine",desc:"Sorts what is in your control from what is not.",color:T.sky},
                  {k:"S",label:"Surface",desc:"Names exactly what you are feeling. Warmly.",color:T.rose},
                  {k:"E",label:"Execute",desc:"One small action. Specific to you. Right now.",color:T.sand},
                  {k:"T",label:"Tune",desc:"Guides your nervous system home.",color:T.sage},
                ].map(({k,label,desc,color},i)=>(
                  <div key={i} style={{display:"flex",gap:"1rem",padding:".9rem 0",borderBottom:i<4?`1px solid ${T.border}`:"none",alignItems:"center"}}>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:"2rem",fontWeight:300,color,lineHeight:1,minWidth:32,opacity:.7,flexShrink:0}}>{k}</div>
                    <div>
                      <span style={{fontFamily:"'Playfair Display',serif",fontSize:".98rem",fontWeight:500,color:T.cream}}>{label} </span>
                      <span style={{fontSize:".95rem",color:T.muted}}>{desc}</span>
                    </div>
                  </div>
                ))}
                <button onClick={onStart}
                  style={{display:"block",width:"100%",marginTop:"1.2rem",padding:".85rem",borderRadius:13,background:"transparent",color:T.gold,border:`1px solid ${T.goldBd}`,fontSize:".95rem",fontWeight:500,cursor:"pointer"}}>
                  Try it now →
                </button>
              </div>
            )}
          </div>

          {/* Email signup */}
          <div style={{marginTop:"1.8rem",borderTop:`1px solid ${T.border}`,paddingTop:"1.5rem"}}>
            {joined?(
              <div style={{fontSize:".85rem",color:T.sage}}>🌿 You are in. Welcome.</div>
            ):(
              <div>
                <div style={{fontSize:".8rem",color:T.faint,marginBottom:".65rem"}}>Get one insight every week — no noise.</div>
                <div style={{display:"flex",gap:".45rem"}}>
                  <input value={email} onChange={e=>{setEmail(e.target.value);setError("");}} type="email" placeholder="Your email"
                    onKeyDown={e=>{if(e.key==="Enter")handleJoin();}}
                    style={{flex:1,padding:".7rem .9rem",borderRadius:10,border:`1px solid ${error?T.roseBd:T.border}`,background:"rgba(255,255,255,0.65)",color:T.cream,fontSize:".88rem"}}/>
                  <button onClick={handleJoin} disabled={loading}
                    style={{padding:".7rem 1.1rem",borderRadius:10,background:T.goldBg,color:T.gold,border:`1px solid ${T.goldBd}`,fontSize:".88rem",fontWeight:500,cursor:"pointer",opacity:loading?.6:1,whiteSpace:"nowrap"}}>
                    {loading?"…":"Join →"}
                  </button>
                </div>
                {error&&<div style={{fontSize:".72rem",color:T.rose,marginTop:".3rem"}}>{error}</div>}
              </div>
            )}
          </div>

          {/* Contact link */}
          <div style={{marginTop:"1.2rem"}}>
            <button onClick={()=>setShowMore("contact")}
              style={{background:"none",border:"none",color:T.faint,fontSize:".72rem",cursor:"pointer"}}
              onMouseEnter={e=>e.currentTarget.style.color=T.muted}
              onMouseLeave={e=>e.currentTarget.style.color=T.faint}>
              Questions or feedback? Say hello →
            </button>
            {showMore==="contact"&&(
              <div style={{marginTop:"1rem",animation:"slideUp .3s ease"}}>
                <ContactSection context="landing"/>
              </div>
            )}
          </div>
        </div>

        <div style={{position:"absolute",bottom:"1.8rem",left:"50%",transform:"translateX(-50%)",color:T.faint,fontSize:".7rem",letterSpacing:".1em",animation:"drift 2.5s ease infinite"}}>↓</div>
      </div>

      {/* ── WHAT IS COMING — clickable ── */}
      <div style={{borderTop:`1px solid ${T.border}`,padding:"1rem 1.8rem",textAlign:"center",background:T.bgWarm}}>
        <button onClick={()=>setShowComing(o=>!o)}
          style={{background:"none",border:"none",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:".4rem",color:T.gold,fontSize:".8rem",letterSpacing:".04em"}}>
          <span style={{fontSize:".58rem",transition:"transform .3s",display:"inline-block",transform:showComing?"rotate(90deg)":"rotate(0)"}}>▶</span>
          What we are building next
        </button>
        {showComing&&(
          <div style={{maxWidth:480,margin:"1rem auto 0",animation:"slideUp .3s ease"}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontStyle:"italic",fontSize:".95rem",color:T.cream,marginBottom:"1rem",lineHeight:1.75}}>
              Relief is the beginning. What comes after is the real work.
            </div>
            <div style={{fontSize:".82rem",color:T.muted,lineHeight:1.75,marginBottom:"1.2rem"}}>
              RESET is building towards something deeper — a system that learns your patterns, reinforces your growth, and helps you build lasting resilience. Not a quick fix. A practice.
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:".65rem",textAlign:"left"}}>
              {[
                {icon:"◎",title:"Pattern awareness",desc:"After a few sessions, RESET surfaces what consistently triggers you — so you can see it coming."},
                {icon:"◈",title:"Personal growth path",desc:"Guidance that evolves with you — rooted in your actual patterns, not generic advice."},
                {icon:"◇",title:"Your ongoing journey",desc:"Every session builds on the last. Your growth, remembered and reflected back to you."},
                {icon:"○",title:"Resilience over time",desc:"Watch how you move through difficulty differently. Session by session. Week by week."},
              ].map(({icon,title,desc})=>(
                <div key={title} style={{padding:".9rem 1rem",borderRadius:12,background:T.card,border:`1px solid ${T.border}`}}>
                  <div style={{color:T.gold,fontSize:".95rem",marginBottom:".35rem",opacity:.65}}>{icon}</div>
                  <div style={{fontSize:".85rem",fontWeight:500,color:T.cream,marginBottom:".25rem"}}>{title}</div>
                  <div style={{fontSize:".78rem",color:T.muted,lineHeight:1.62}}>{desc}</div>
                  <div style={{marginTop:".5rem",fontSize:".65rem",padding:".14rem .5rem",borderRadius:20,background:T.goldBg,color:T.gold,border:`1px solid ${T.goldBd}`,display:"inline-block"}}>Soon</div>
                </div>
              ))}
            </div>
            <div style={{marginTop:"1rem",fontSize:".78rem",color:T.faint,fontStyle:"italic"}}>
              You are not just a user. You are part of building a new way of relating to stress — one that actually lasts.
            </div>
          </div>
        )}
      </div>

      <footer style={{textAlign:"center",padding:"1.5rem 1.5rem",color:T.faint,fontSize:".68rem",borderTop:`1px solid ${T.border}`}}>
        <div style={{display:"flex",justifyContent:"center",gap:"1.2rem",marginBottom:".6rem"}}>
          <a href="https://www.linkedin.com/in/archana-shinde-1a471783" target="_blank" rel="noopener noreferrer"
            style={{color:T.muted,fontSize:".8rem",textDecoration:"none",display:"flex",alignItems:"center",gap:".3rem"}}
            onMouseEnter={e=>e.currentTarget.style.color=T.gold}
            onMouseLeave={e=>e.currentTarget.style.color=T.muted}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>
            LinkedIn
          </a>
          <a href="https://www.youtube.com/@archanashinde09" target="_blank" rel="noopener noreferrer"
            style={{color:T.muted,fontSize:".8rem",textDecoration:"none",display:"flex",alignItems:"center",gap:".3rem"}}
            onMouseEnter={e=>e.currentTarget.style.color=T.rose}
            onMouseLeave={e=>e.currentTarget.style.color=T.muted}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22-2.65.28-1.3.07-2.49.1-3.59.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z"/></svg>
            YouTube
          </a>
        </div>
        <div>© 2025 The RESET Method · Ancient wisdom · Modern neuroscience · resetmethod.app</div>
      </footer>
    </div>
  );
}


export default function App() {
  const [view,setView]=useState("landing");
  const [auth,setAuth]=useState(null);
  const [showAuth,setShowAuth]=useState(false);
  const [authChecked,setAuthChecked]=useState(false);
  useEffect(()=>{ getSession().then(s=>{setAuth(s);setAuthChecked(true);}); },[]);
  const start=()=>setView("session");
  if(!authChecked) return <div style={{minHeight:"100vh",background:T.bg}}/>;
  return (
    <>
      <style>{CSS}</style>
      {view==="landing"&&<Landing onStart={start} onHistory={()=>setView("history")} onEmergency={()=>setView("emergency")} auth={auth} onLoginClick={()=>setShowAuth(true)} onSignOut={()=>{signOut();setAuth(null);}}/>}
      {view==="session"&&<SessionShell onHome={()=>setView("landing")} auth={auth}/>}
      {view==="history"&&<History onBack={()=>setView("landing")} onNew={start} auth={auth}/>}
      {view==="emergency"&&<EmergencyMode onExit={()=>setView("landing")}/>}
      {showAuth&&<AuthModal onClose={()=>setShowAuth(false)} onAuth={s=>{setAuth(s);setShowAuth(false);}}/>}
    </>
  );
}
