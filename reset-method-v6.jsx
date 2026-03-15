import { useState, useEffect, useRef } from "react";

/* ─────────────────────────────────────────────
   DESIGN TOKENS — Warm, earthy, alive
───────────────────────────────────────────── */
const T = {
  bg:       "#1A1410",
  bgSoft:   "#221C16",
  cream:    "#F5EFE6",
  creamSoft:"rgba(245,239,230,0.55)",
  creamFaint:"rgba(245,239,230,0.18)",
  gold:     "#D4A853",
  goldSoft: "rgba(212,168,83,0.18)",
  goldFaint:"rgba(212,168,83,0.08)",
  goldBorder:"rgba(212,168,83,0.3)",
  rose:     "#C97B6E",
  roseSoft: "rgba(201,123,110,0.18)",
  sage:     "#7BA68A",
  sageSoft: "rgba(123,166,138,0.18)",
  sky:      "#7A9EBF",
  skySoft:  "rgba(122,158,191,0.18)",
  sand:     "#C4A87A",
  sandSoft: "rgba(196,168,122,0.18)",
  lav:      "#9E8FB5",
};

const KOSHA = {
  1: { letter:"R", step:"Recognize",   kosha:"Manomaya Kosha",   sanskrit:"मनोमय कोश", meaning:"Mind Sheath — thought, story, belief", science:"CBT · Aaron Beck, 1960s", color:T.gold,  glow:"rgba(212,168,83,0.12)",  border:"rgba(212,168,83,0.28)"  },
  2: { letter:"E", step:"Examine",     kosha:"Manomaya Kosha",   sanskrit:"मनोमय कोश", meaning:"Mind Sheath — sorting the mental",      science:"Stoic · ACT Therapy",      color:T.sky,   glow:"rgba(122,158,191,0.12)", border:"rgba(122,158,191,0.28)" },
  3: { letter:"S", step:"Surface",     kosha:"Vijnanamaya Kosha",sanskrit:"विज्ञानमय कोश",meaning:"Wisdom Sheath — emotion & intuition", science:"Affect Labeling · UCLA 2007",color:T.rose,  glow:"rgba(201,123,110,0.12)", border:"rgba(201,123,110,0.28)" },
  4: { letter:"E", step:"Execute",     kosha:"Vijnanamaya Kosha",sanskrit:"विज्ञानमय कोश",meaning:"Wisdom Sheath — discernment into action",science:"Behavioral Activation",   color:T.sand,  glow:"rgba(196,168,122,0.12)", border:"rgba(196,168,122,0.28)" },
  5: { letter:"T", step:"Tune",        kosha:"Pranamaya Kosha",  sanskrit:"प्राणमय कोश", meaning:"Life Force — breath, prana, body energy",science:"Polyvagal Theory · Porges", color:T.sage,  glow:"rgba(123,166,138,0.12)", border:"rgba(123,166,138,0.28)" },
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400;1,500&family=DM+Sans:wght@300;400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;}
body{background:#1A1410;color:#F5EFE6;font-family:'DM Sans',sans-serif;font-weight:300;-webkit-font-smoothing:antialiased;}
::selection{background:rgba(212,168,83,0.25);}
::-webkit-scrollbar{width:3px;}
::-webkit-scrollbar-thumb{background:rgba(212,168,83,0.25);border-radius:2px;}
textarea,input{font-family:'DM Sans',sans-serif;outline:none;}
textarea::placeholder,input::placeholder{color:rgba(245,239,230,0.25);}
button{font-family:'DM Sans',sans-serif;cursor:pointer;}
@keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}
@keyframes drift{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
@keyframes glow{0%,100%{opacity:0.4}50%{opacity:0.85}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes slowSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes pop{0%{transform:scale(0.92);opacity:0}100%{transform:scale(1);opacity:1}}
@keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
@keyframes breatheIn{0%{r:52}50%{r:58}100%{r:52}}
@keyframes float1{0%,100%{transform:translate(0,0)}33%{transform:translate(4px,-6px)}66%{transform:translate(-3px,3px)}}
@keyframes float2{0%,100%{transform:translate(0,0)}33%{transform:translate(-5px,4px)}66%{transform:translate(3px,-5px)}}
@keyframes float3{0%,100%{transform:translate(0,0)}33%{transform:translate(3px,5px)}66%{transform:translate(-4px,-3px)}}
.cta-btn{display:inline-flex;align-items:center;gap:.5rem;padding:.85rem 2rem;border-radius:50px;background:rgba(212,168,83,0.15);color:#D4A853;border:1px solid rgba(212,168,83,0.35);font-size:.9rem;font-weight:500;letter-spacing:.05em;transition:all .3s ease;cursor:pointer;}
.cta-btn:hover{background:rgba(212,168,83,0.26);transform:translateY(-2px);box-shadow:0 14px 44px rgba(212,168,83,0.14);}
.ghost-btn{background:none;border:none;color:rgba(245,239,230,0.32);font-size:.8rem;padding:.3rem .5rem;transition:color .2s;cursor:pointer;}
.ghost-btn:hover{color:rgba(245,239,230,0.65);}
`;

/* ─────────────────────────────────────────────
   THE THREE CIRCLES SVG COMPONENT
   The visual heart of the entire app
───────────────────────────────────────────── */
function ThreeCircles({ size = 320, animated = true, activeLayer = null }) {
  // Three koshas as overlapping circles
  // Manomaya (Mind) = top
  // Vijnanamaya (Wisdom) = bottom-left  
  // Pranamaya (Body) = bottom-right
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.28;
  const offset = size * 0.165;

  const circles = [
    { id: "mano",  cx: cx,          cy: cy - offset,  color: T.gold,  label: "Manomaya",  eng: "Mind",   steps: "R · E", active: activeLayer === "mano"  || activeLayer === null },
    { id: "vijna", cx: cx - offset, cy: cy + offset * 0.7, color: T.rose,  label: "Vijnanamaya",eng: "Wisdom", steps: "S · E", active: activeLayer === "vijna" || activeLayer === null },
    { id: "prana", cx: cx + offset, cy: cy + offset * 0.7, color: T.sage,  label: "Pranamaya", eng: "Body",   steps: "T",     active: activeLayer === "prana" || activeLayer === null },
  ];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: "visible" }}>
      <defs>
        {circles.map(c => (
          <radialGradient key={c.id} id={`grad-${c.id}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor={c.color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={c.color} stopOpacity="0.04" />
          </radialGradient>
        ))}
        <radialGradient id="center-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#F5EFE6" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#F5EFE6" stopOpacity="0.0"  />
        </radialGradient>
        {/* Clip paths for intersection zones */}
        <clipPath id="clip-mano">
          <circle cx={circles[0].cx} cy={circles[0].cy} r={r} />
        </clipPath>
        <clipPath id="clip-vijna">
          <circle cx={circles[1].cx} cy={circles[1].cy} r={r} />
        </clipPath>
        <clipPath id="clip-prana">
          <circle cx={circles[2].cx} cy={circles[2].cy} r={r} />
        </clipPath>
      </defs>

      {/* Outer ambient glow */}
      <circle cx={cx} cy={cy + offset * 0.1} r={r * 1.8}
        fill="none" stroke="rgba(212,168,83,0.04)" strokeWidth={r * 0.6}
        style={{ filter: "blur(12px)" }} />

      {/* Main circles — filled */}
      {circles.map((c, i) => (
        <g key={c.id} style={{ animation: animated ? `float${i + 1} ${7 + i * 1.5}s ease-in-out infinite` : "none" }}>
          <circle cx={c.cx} cy={c.cy} r={r}
            fill={`url(#grad-${c.id})`}
            opacity={c.active ? 1 : 0.3}
            style={{ transition: "opacity 0.6s ease" }} />
          <circle cx={c.cx} cy={c.cy} r={r}
            fill="none"
            stroke={c.color}
            strokeWidth="1"
            opacity={c.active ? 0.45 : 0.12}
            style={{ transition: "opacity 0.6s ease" }} />
        </g>
      ))}

      {/* Intersection highlights */}
      {/* Mano ∩ Vijna */}
      <circle cx={circles[1].cx} cy={circles[1].cy} r={r}
        fill="rgba(212,168,83,0.06)" clipPath="url(#clip-mano)" />
      {/* Mano ∩ Prana */}
      <circle cx={circles[2].cx} cy={circles[2].cy} r={r}
        fill="rgba(212,168,83,0.06)" clipPath="url(#clip-mano)" />
      {/* Vijna ∩ Prana */}
      <circle cx={circles[2].cx} cy={circles[2].cy} r={r}
        fill="rgba(245,239,230,0.04)" clipPath="url(#clip-vijna)" />

      {/* Center convergence glow */}
      <circle cx={cx} cy={cy + offset * 0.18} r={r * 0.32}
        fill="url(#center-glow)" />

      {/* Center text — RESET */}
      <text x={cx} y={cy + offset * 0.14}
        textAnchor="middle" dominantBaseline="middle"
        fontFamily="'Playfair Display', serif"
        fontSize={size * 0.072}
        fontWeight="400"
        fill="rgba(245,239,230,0.82)"
        letterSpacing="0.12em">
        RESET
      </text>
      <text x={cx} y={cy + offset * 0.14 + size * 0.052}
        textAnchor="middle" dominantBaseline="middle"
        fontFamily="'DM Sans', sans-serif"
        fontSize={size * 0.028}
        fontWeight="300"
        fill="rgba(245,239,230,0.28)"
        letterSpacing="0.18em">
        METHOD
      </text>

      {/* Circle labels */}
      {circles.map((c, i) => {
        const labelY = i === 0
          ? c.cy - r - 14
          : c.cy + r + 22;
        const labelX = c.cx;
        return (
          <g key={`label-${c.id}`} opacity={c.active ? 1 : 0.3}
            style={{ transition: "opacity 0.6s ease" }}>
            <text x={labelX} y={labelY}
              textAnchor="middle"
              fontFamily="'Playfair Display', serif"
              fontSize={size * 0.042}
              fontStyle="italic"
              fill={c.color}
              opacity="0.85">
              {c.label}
            </text>
            <text x={labelX} y={i === 0 ? labelY - size * 0.036 : labelY + size * 0.036}
              textAnchor="middle"
              fontFamily="'DM Sans', sans-serif"
              fontSize={size * 0.026}
              fill="rgba(245,239,230,0.35)"
              letterSpacing="0.1em">
              {c.eng}
            </text>
          </g>
        );
      })}

      {/* Step letters floating in each circle */}
      {circles.map((c, i) => (
        <text key={`step-${c.id}`}
          x={c.cx + (i === 1 ? -size * 0.04 : i === 2 ? size * 0.04 : 0)}
          y={c.cy + (i === 0 ? -size * 0.04 : size * 0.025)}
          textAnchor="middle" dominantBaseline="middle"
          fontFamily="'Playfair Display', serif"
          fontSize={size * 0.055}
          fill={c.color}
          opacity="0.18"
          letterSpacing="0.2em">
          {c.steps}
        </text>
      ))}
    </svg>
  );
}

/* ─────────────────────────────────────────────
   ANALYSIS ENGINE (preserved from V5)
───────────────────────────────────────────── */
function deepAnalyze(text) {
  const t = text.toLowerCase();
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 4);
  const firstLine = sentences[0] || text.slice(0, 100);
  const m = {
    boss:        /\b(boss|manager|supervisor|director|lead)\b/.test(t),
    fired:       /\b(fired|let go|laid off|lose my job|losing my job)\b/.test(t),
    deadline:    /\b(deadline|due|deliver|presentation|tomorrow|friday|today|urgent)\b/.test(t),
    performance: /\b(performance|review|feedback|rating|evaluation)\b/.test(t),
    ignored:     /\b(ignored|silent|silence|cold|distant|avoiding)\b/.test(t),
    overwhelmed: /\b(overwhelmed|too much|can't cope|drowning|swamped)\b/.test(t),
    mistake:     /\b(mistake|mess|screwed|failed|wrong|error|fault)\b/.test(t),
    unfair:      /\b(unfair|not fair|credit|recognition)\b/.test(t),
    conflict:    /\b(conflict|argument|fight|tension|problem with)\b/.test(t),
    newjob:      /\b(new job|just started|first week|recently joined)\b/.test(t),
    quitting:    /\b(quit|quitting|resign|leave|thinking of leaving)\b/.test(t),
    money:       /\b(money|debt|rent|bill|financial|afford|broke|loan)\b/.test(t),
    relationship:/\b(partner|relationship|breakup|divorce|girlfriend|boyfriend|spouse|family)\b/.test(t),
    health:      /\b(health|sick|doctor|diagnosis|pain|symptom|anxious)\b/.test(t),
  };
  const catW = (text.match(/\b(never|always|definitely|ruined|disaster|hopeless|worthless|terrible|worst|failed|failure|doomed|impossible)\b/gi) || []);
  const absW = (text.match(/\b(everyone|nobody|always|never|everything|nothing|completely|totally)\b/gi) || []);

  const facts = [];
  if (firstLine.length > 10) facts.push(`You wrote: "${firstLine.slice(0, 80)}${firstLine.length > 80 ? "…" : ""}" — that is real`);
  if (m.boss)        facts.push(`There is something real happening with your manager`);
  if (m.deadline)    facts.push(`There is genuine time pressure in this situation`);
  if (m.mistake)     facts.push(`Something went wrong — that part is real`);
  if (m.overwhelmed) facts.push(`You are carrying more than feels manageable`);
  if (m.money)       facts.push(`There is a real financial concern that deserves a plan`);
  if (m.relationship)facts.push(`There is genuine tension in an important relationship`);
  if (m.health)      facts.push(`There is a health concern that deserves proper attention`);
  if (facts.length < 2) facts.push(`You are facing something genuinely difficult and real`);
  if (facts.length < 3) facts.push(`You are self-aware enough to want to work through this — that already matters`);

  const assumptions = [];
  if (m.ignored) assumptions.push(`You're assuming the silence means something bad — it might mean nothing yet`);
  if (m.boss)    assumptions.push(`You're assuming you know what your manager thinks — you don't, not yet`);
  if (m.fired)   assumptions.push(`"Getting fired" is a story — it hasn't happened`);
  if (m.mistake) assumptions.push(`You're assuming one mistake defines how everyone sees you — it almost never does`);
  if (m.newjob)  assumptions.push(`You're assuming you should already feel settled — that's too fast`);
  if (absW.length > 0) assumptions.push(`You used "${absW[0].toLowerCase()}" — that's your stressed mind speaking in absolutes`);
  if (assumptions.length < 2) assumptions.push(`You're assuming this moment reflects something permanent`);
  if (assumptions.length < 3) assumptions.push(`You're assuming others see this as negatively as you currently do`);

  const catastrophizing = [];
  if (catW.length > 0) catastrophizing.push(`You used "${catW[0].toLowerCase()}" — catastrophizing language. The situation is real but probably not that final`);
  if (m.fired)         catastrophizing.push(`Your mind jumped to worst outcome — your brain is doing its job, but not being accurate`);
  if (catastrophizing.length === 0) catastrophizing.push(`Part of you is rehearsing the worst outcome as if it's already certain — it isn't`);

  let summary = "";
  if (m.fired)              summary = `The fear of losing your job is one of the most visceral fears there is. But fear feeling certain doesn't make it fact.`;
  else if (m.boss && m.ignored) summary = `The silence from your manager is unsettling — of course it is. But your mind is filling that silence with the worst possible story.`;
  else if (m.deadline)      summary = `Deadline pressure is real. And when we're under pressure our brain makes everything feel more catastrophic than it is.`;
  else if (m.mistake)       summary = `Making a visible mistake is genuinely difficult. But one mistake almost never means what our mind tells us it means.`;
  else if (m.overwhelmed)   summary = `When everything feels like too much, it blurs into one overwhelming mass. Inside that mass there are individual things — we can sort them.`;
  else if (m.money)         summary = `Financial worry touches survival, security, and self-worth all at once. Let's separate what's confirmed from what fear is adding.`;
  else if (m.relationship)  summary = `Relationship pain touches your sense of belonging. Let's look clearly at what's actually happening versus what you're imagining.`;
  else summary = `What you're going through is genuinely difficult — not dramatic, not an overreaction. Real. And more workable than it feels from inside it.`;

  const friendNote = m.fired       ? `The fact that you're scared doesn't mean it's going to happen. Fear is loud. Let's turn the volume down.`
    : m.overwhelmed ? `You don't have to solve everything today. Just one solid piece of ground. Let's find it.`
    : m.mistake     ? `One mistake doesn't erase everything you've built. It doesn't feel that way right now — but it's true.`
    : `You're not overreacting. This is hard. And you have more ground to stand on than you can see right now.`;

  return { facts: facts.slice(0, 3), assumptions: assumptions.slice(0, 3), catastrophizing: catastrophizing.slice(0, 2), summary, friendNote };
}

function validateEmotion(emotion, situation) {
  const t = situation.toLowerCase();
  const hasBoss = /\b(boss|manager|supervisor)\b/.test(t);
  const hasFired = /\b(fired|let go|laid off|lose my job)\b/.test(t);
  const hasDeadline = /\b(deadline|due|tomorrow|urgent)\b/.test(t);
  const hasMistake = /\b(mistake|screwed|failed|error)\b/.test(t);
  const hasOverwhelmed = /\b(overwhelmed|too much|drowning)\b/.test(t);
  const hasUnfair = /\b(unfair|credit|recognition)\b/.test(t);
  const map = {
    Fear:     { v: hasFired ? `Fear of losing your job touches survival, identity, and security all at once. Of course you're scared.` : hasBoss ? `Fear of what your manager thinks — that's a normal response to someone who has power over your livelihood.` : `Fear means something important is at stake — your security, your reputation, your sense of competence.`, s:`Fear activates the amygdala and floods your system with cortisol. Your brain can't distinguish between a tiger and a difficult boss.`, h:`Naming this as fear is already powerful. Fear shrinks when we look at it directly.` },
    Anxiety:  { v: hasDeadline ? `Anxiety before a deadline is your brain preparing for everything that could go wrong. Most of it won't.` : `Work anxiety lives in the gap between where you are and where you think you should be.`, s:`Anxiety keeps your prefrontal cortex in overdrive — it consumes enormous energy, which is why you feel exhausted.`, h:`The RESET steps ahead give that anxious mind something structured to work with instead of spinning.` },
    Anger:    { v: hasUnfair ? `Anger when something feels unfair is completely legitimate. Anger signals that a value was crossed.` : `Anger usually means something that should have happened didn't — respect, fairness, honesty.`, s:`Anger activates the same neural pathways as physical pain — it genuinely hurts.`, h:`There is energy and clarity in anger when it's directed well. That's what we're going to do.` },
    Shame:    { v: hasMistake ? `Shame after a mistake doesn't just say "I did something wrong." It says "I am wrong." That distinction matters enormously.` : `Shame comes from feeling exposed. But what feels obvious to you is almost never visible to others the way you imagine.`, s:`Shame activates the same brain regions as physical pain and social exclusion — neurologically it feels like a survival threat.`, h:`You named it. That took courage. Shame shrinks significantly when it's spoken.` },
    Pressure: { v:`The pressure is real. And when we're under it we catastrophize — everything feels more high-stakes than it actually is.`, s:`Pressure triggers cortisol which narrows thinking — you literally become less creative and more reactive.`, h:`Reducing even one item of pressure right now changes your whole nervous system's response.` },
    Overwhelm:{ v:`Overwhelm means you've been given more than one nervous system can hold. You're not weak. You're overloaded.`, s:`Overwhelm floods the prefrontal cortex — even simple decisions feel impossible. That's neurological, not character.`, h:`We're going to break this into pieces your mind can actually hold.` },
    Dread:    { v:`Dread is the anticipation of something you believe is coming and can't stop. Your mind has already decided how something will end — which it hasn't.`, s:`Dread activates anticipatory anxiety circuits — your brain experiences the feared outcome emotionally before it happens.`, h:`The thing you're dreading has not happened yet. That gap is where your power lives.` },
    Sadness:  { v:`Sadness at work often comes from loss — of confidence, of a relationship, of a vision of yourself. That loss is real.`, s:`Sadness activates the anterior cingulate cortex — the same region that processes physical pain. Your sadness is neurologically real.`, h:`You don't have to feel better right now. You just have to take one small step forward.` },
  };
  const d = map[emotion];
  if (!d) return { validation:`Feeling ${emotion?.toLowerCase()} makes complete sense. Your emotional response is completely valid.`, science:`Naming an emotion — even an unusual one — measurably reduces amygdala activity (Lieberman et al., UCLA 2007).`, hope:`You found the word. That's the hardest part. Now let's move through it.` };
  return { validation: d.v, science: d.s, hope: d.h };
}

function generateActions(situation, emotion) {
  const t = situation.toLowerCase();
  const m = {
    boss:     /\b(boss|manager|supervisor)\b/.test(t),
    fired:    /\b(fired|let go|laid off|lose my job)\b/.test(t),
    deadline: /\b(deadline|due|present|tomorrow|friday|today|urgent)\b/.test(t),
    ignored:  /\b(ignored|silent|silence|cold|distant)\b/.test(t),
    overwhelmed:/\b(overwhelmed|too much|drowning|swamped)\b/.test(t),
    mistake:  /\b(mistake|screwed|failed|wrong|error)\b/.test(t),
    unfair:   /\b(unfair|credit|recognition)\b/.test(t),
    newjob:   /\b(new job|just started|first week)\b/.test(t),
    quitting: /\b(quit|resign|leave|thinking of leaving)\b/.test(t),
    money:    /\b(money|debt|rent|financial|afford)\b/.test(t),
    relationship:/\b(partner|relationship|breakup|family|friend)\b/.test(t),
  };
  const pool = [];
  if (m.boss && m.ignored) pool.push(`Send your manager one sentence today: "Do you have 10 minutes this week?" — not to fix everything, just to open a door`);
  if (m.fired)   pool.push(`Write down the actual evidence that you might be fired — the real facts, not the fear. Then write one counter-evidence`);
  if (m.fired)   pool.push(`Update one section of your CV today — not because you're leaving, but because it will make you feel less powerless`);
  if (m.deadline)pool.push(`Block 45 focused minutes right now — phone off, one tab, one task. Set a timer. Start.`);
  if (m.overwhelmed) pool.push(`Write every single task on your mind — all of them, onto paper. Get them out of your body`);
  if (m.mistake) pool.push(`Write a two-sentence acknowledgment of what happened and what you're doing about it — then send it`);
  if (m.money)   pool.push(`Write your three most pressing financial numbers on paper right now — see them clearly rather than feeling them`);
  if (m.relationship) pool.push(`Write what you wish the other person truly understood about how you feel — one honest sentence`);
  const byEmotion = {
    Fear:     [`Write exactly what you're afraid of in one specific sentence`, `Ask: what is the most realistic outcome here — not worst, most likely`],
    Anxiety:  [`Write every anxious thought right now — all of them onto paper, out of your body`, `Identify the one thing you can act on in the next 30 minutes`],
    Anger:    [`Write what you're angry about completely — privately, without any filter`, `Identify the exact boundary that was crossed. Name it.`],
    Shame:    [`Write one specific true thing you did well this week — no matter how small`, `Ask: would I speak to someone I love the way I'm speaking to myself?`],
    Pressure: [`Write every task you must do — then cross out anything not truly urgent this week`, `Push back on one thing today — "Can this wait?" is a complete sentence`],
    Overwhelm:[`Stop. Write everything in your head — every last thing. Get it all out.`, `Look at that list and circle the one smallest next step. Do only that.`],
    Dread:    [`Name exactly what you're dreading in one sentence — specific, not general`, `Ask: if the thing I dread happened, what would my very first step be?`],
    Sadness:  [`Write what you've lost or what feels out of reach right now — name it`, `Reach out to one person who makes you feel less alone — one message`],
  };
  const eActs = byEmotion[emotion] || [`Write everything on your mind right now — empty it onto paper`, `Identify the one thing that would help most and take one step toward it`];
  const defaults = [`Write the single most important thing to do today`, `Send one message that opens a door rather than closing one`, `Step away for 10 minutes — physically move. Your thinking will be clearer after.`];
  return [...new Set([...pool, ...eActs, ...defaults])].slice(0, 3);
}

/* ─────────────────────────────────────────────
   SHARED COMPONENTS
───────────────────────────────────────────── */
const SBtn = ({ onClick, disabled, color, children, style = {} }) => {
  const c = color || T.gold;
  return (
    <button onClick={onClick} disabled={disabled} style={{ display:"block", width:"100%", marginTop:"1rem", padding:".88rem 1.4rem", borderRadius:14, border:`1px solid ${disabled ? "rgba(245,239,230,0.08)" : c}`, background:disabled ? "transparent" : `${c}1A`, color:disabled ? "rgba(245,239,230,0.22)" : c, fontSize:".9rem", fontWeight:500, letterSpacing:".04em", transition:"all .2s ease", opacity:disabled ? .35 : 1, ...style }}>
      {children}
    </button>
  );
};

const ScienceBadge = ({ text, color }) => (
  <div style={{ marginTop:"1rem", padding:".6rem .95rem", borderRadius:10, background:"rgba(245,239,230,0.03)", border:"1px solid rgba(245,239,230,0.07)", display:"flex", alignItems:"flex-start", gap:".45rem" }}>
    <span style={{ fontSize:".7rem", color:color||T.gold, marginTop:"1px", flexShrink:0 }}>✦</span>
    <span style={{ fontSize:".71rem", color:"rgba(245,239,230,0.38)", lineHeight:1.62, fontStyle:"italic" }}>{text}</span>
  </div>
);

const Spinner = ({ color }) => (
  <div style={{ padding:"3rem 1rem", textAlign:"center", animation:"fadeIn .4s ease" }}>
    <div style={{ width:24, height:24, border:`1.5px solid ${color||T.gold}`, borderTopColor:"transparent", borderRadius:"50%", margin:"0 auto 1.2rem", animation:"spin 1s linear infinite" }}/>
    <div style={{ color:"rgba(245,239,230,0.5)", fontSize:".82rem", fontStyle:"italic" }}>Reading what you shared…</div>
  </div>
);

/* Warm Kosha Banner — shows the layer you're working in */
function KoshaTag({ step }) {
  const k = KOSHA[step];
  if (!k || !k.kosha) return null;
  return (
    <div style={{ display:"inline-flex", alignItems:"center", gap:".55rem", padding:".38rem .85rem .38rem .65rem", borderRadius:30, background:k.glow, border:`1px solid ${k.border}`, marginBottom:"1.2rem", animation:"fadeIn .5s ease" }}>
      <div style={{ width:6, height:6, borderRadius:"50%", background:k.color, flexShrink:0 }} />
      <span style={{ fontFamily:"'Playfair Display',serif", fontSize:".8rem", fontStyle:"italic", color:k.color, opacity:.85 }}>{k.sanskrit}</span>
      <span style={{ fontSize:".68rem", color:"rgba(245,239,230,0.3)", letterSpacing:".05em" }}>·</span>
      <span style={{ fontSize:".7rem", color:"rgba(245,239,230,0.42)", letterSpacing:".06em" }}>{k.kosha}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   STEP 0 — SITUATION
───────────────────────────────────────────── */
function StepSituation({ onNext }) {
  const [val, setVal] = useState("");
  const count = val.trim().split(/\s+/).filter(w => w).length;
  return (
    <div style={{ animation:"slideIn .4s ease" }}>
      <div style={{ padding:".75rem 1rem", borderRadius:12, background:T.goldFaint, border:`1px solid ${T.goldBorder}`, marginBottom:"1.1rem" }}>
        <div style={{ fontSize:".8rem", color:"rgba(245,239,230,0.48)", lineHeight:1.72 }}>Write freely — like texting a close friend who genuinely wants to understand. The more specific you are, the more personal your RESET will feel.</div>
      </div>
      <textarea value={val} onChange={e => setVal(e.target.value)}
        placeholder="Tell me what's going on. Don't filter it…"
        rows={7} style={{ width:"100%", background:"rgba(245,239,230,0.04)", border:"1px solid rgba(245,239,230,0.1)", borderRadius:14, padding:"1.1rem", color:"rgba(245,239,230,0.88)", fontSize:".94rem", fontWeight:300, lineHeight:1.78, resize:"none", transition:"border-color .2s" }}
        onFocus={e => e.target.style.borderColor = T.goldBorder}
        onBlur={e => e.target.style.borderColor = "rgba(245,239,230,0.1)"}
      />
      <div style={{ textAlign:"right", fontSize:".69rem", color:count < 15 ? "rgba(201,123,110,0.8)" : "rgba(123,166,138,0.8)", marginTop:".38rem", marginBottom:".6rem" }}>
        {count < 15 ? `${15 - count} more words to begin` : "✓ Ready"}
      </div>
      <div style={{ padding:".55rem .9rem", borderRadius:9, background:"rgba(245,239,230,0.02)", border:"1px solid rgba(245,239,230,0.05)", marginBottom:".2rem" }}>
        <div style={{ fontSize:".7rem", color:"rgba(245,239,230,0.28)" }}>🔒 Private. Nothing leaves your device.</div>
      </div>
      <SBtn onClick={() => onNext(val)} disabled={count < 15}>Begin my RESET →</SBtn>
    </div>
  );
}

/* ─────────────────────────────────────────────
   STEP R — RECOGNIZE
───────────────────────────────────────────── */
function StepRecognize({ situation, onNext }) {
  const [result, setResult] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [edited, setEdited] = useState(null);
  const k = KOSHA[1];

  useEffect(() => {
    const t = setTimeout(() => {
      const r = deepAnalyze(situation);
      setResult(r);
      setEdited(JSON.parse(JSON.stringify(r)));
    }, 1800);
    return () => clearTimeout(t);
  }, [situation]);

  function moveItem(from, idx, to) {
    const next = JSON.parse(JSON.stringify(edited));
    const [item] = next[from].splice(idx, 1);
    next[to].push(item);
    setEdited(next);
  }
  function deleteItem(cat, idx) {
    const next = JSON.parse(JSON.stringify(edited));
    next[cat].splice(idx, 1);
    setEdited(next);
  }
  function addItem(cat, text) {
    if (!text.trim()) return;
    const next = JSON.parse(JSON.stringify(edited));
    next[cat].push(text.trim());
    setEdited(next);
  }

  if (!result) return <Spinner color={k.color} />;

  const display = editMode ? edited : result;
  const CATS = [
    { key:"facts", title:"What is actually true", color:T.sage, bg:"rgba(123,166,138,0.07)", moveTo:[{key:"assumptions",label:"→ Assumption"},{key:"catastrophizing",label:"→ Catastrophizing"}] },
    { key:"assumptions", title:"What you might be assuming", color:T.sand, bg:"rgba(196,168,122,0.07)", moveTo:[{key:"facts",label:"→ Fact"},{key:"catastrophizing",label:"→ Catastrophizing"}] },
    { key:"catastrophizing", title:"What you might be catastrophizing", color:T.rose, bg:"rgba(201,123,110,0.07)", moveTo:[{key:"facts",label:"→ Fact"},{key:"assumptions",label:"→ Assumption"}] },
  ];

  return (
    <div style={{ animation:"fadeIn .5s ease" }}>
      <div style={{ padding:"1.1rem 1.2rem", borderRadius:16, background:k.glow, border:`1px solid ${k.border}`, marginBottom:"1.1rem" }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontStyle:"italic", color:"rgba(245,239,230,0.85)", fontSize:".95rem", lineHeight:1.8, marginBottom:".55rem" }}>"{result.summary}"</div>
        <div style={{ color:"rgba(245,239,230,0.42)", fontSize:".8rem", lineHeight:1.6 }}>{result.friendNote}</div>
      </div>
      {!editMode ? (
        <div style={{ padding:".55rem .95rem", borderRadius:9, background:"rgba(245,239,230,0.03)", border:"1px solid rgba(245,239,230,0.07)", marginBottom:"1rem", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ color:"rgba(245,239,230,0.38)", fontSize:".78rem" }}>Does this feel accurate?</span>
          <button onClick={() => setEditMode(true)} style={{ background:"none", border:"1px solid rgba(245,239,230,0.16)", borderRadius:7, color:"rgba(245,239,230,0.65)", fontSize:".73rem", padding:".25rem .65rem", cursor:"pointer" }}>Adjust it →</button>
        </div>
      ) : (
        <div style={{ padding:".55rem .95rem", borderRadius:9, background:k.glow, border:`1px solid ${k.border}`, marginBottom:"1rem", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ color:k.color, fontSize:".78rem" }}>✏️ Move, remove, or add items</span>
          <button onClick={() => setEditMode(false)} style={{ background:"none", border:`1px solid ${k.border}`, borderRadius:7, color:k.color, fontSize:".73rem", padding:".25rem .65rem", cursor:"pointer" }}>Done</button>
        </div>
      )}
      {CATS.map(cat => (
        display[cat.key]?.length > 0 && (
          <div key={cat.key} style={{ background:cat.bg, border:`1px solid ${cat.color}20`, borderRadius:14, padding:".95rem 1.05rem", marginBottom:".7rem" }}>
            <div style={{ fontSize:".64rem", fontWeight:600, letterSpacing:".14em", textTransform:"uppercase", color:cat.color, marginBottom:".45rem" }}>{cat.title}</div>
            {display[cat.key].map((item, i) => (
              <div key={i} style={{ marginBottom:".4rem" }}>
                <div style={{ fontSize:".85rem", color:"rgba(245,239,230,0.52)", padding:".25rem 0 .25rem .45rem", lineHeight:1.65 }}>· {item}</div>
                {editMode && (
                  <div style={{ display:"flex", gap:".3rem", flexWrap:"wrap", paddingLeft:".45rem", marginTop:".18rem" }}>
                    {cat.moveTo.map(mt => (
                      <button key={mt.key} onClick={() => moveItem(cat.key, i, mt.key)} style={{ background:"none", border:"1px solid rgba(245,239,230,0.1)", borderRadius:5, color:"rgba(245,239,230,0.38)", fontSize:".67rem", padding:".14rem .44rem", cursor:"pointer" }}>{mt.label}</button>
                    ))}
                    <button onClick={() => deleteItem(cat.key, i)} style={{ background:"none", border:"1px solid rgba(201,123,110,0.28)", borderRadius:5, color:T.rose, fontSize:".67rem", padding:".14rem .44rem", cursor:"pointer" }}>Remove</button>
                  </div>
                )}
              </div>
            ))}
            {editMode && <AddInline color={cat.color} onAdd={text => addItem(cat.key, text)} />}
          </div>
        )
      ))}
      <ScienceBadge color={k.color} text="Cognitive Behavioral Therapy (Aaron Beck, 1960s) — separating facts from cognitive distortions. One of the most evidence-based frameworks in existence." />
      <SBtn color={k.color} onClick={() => onNext(editMode ? edited : result)}>This feels right → Examine my control</SBtn>
    </div>
  );
}

function AddInline({ color, onAdd }) {
  const [val, setVal] = useState("");
  return (
    <div style={{ display:"flex", gap:".45rem", marginTop:".55rem" }}>
      <input value={val} onChange={e => setVal(e.target.value)} placeholder="Add your own…"
        onKeyDown={e => { if (e.key === "Enter" && val.trim()) { onAdd(val); setVal(""); } }}
        style={{ flex:1, background:"transparent", border:`1px solid ${color}28`, borderRadius:7, color:"rgba(245,239,230,0.8)", fontSize:".79rem", padding:".3rem .65rem" }} />
      <button onClick={() => { if (val.trim()) { onAdd(val); setVal(""); } }} style={{ background:`${color}18`, border:`1px solid ${color}32`, borderRadius:7, color, fontSize:".73rem", padding:".3rem .68rem" }}>Add</button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   STEP E1 — EXAMINE
───────────────────────────────────────────── */
const BUCKETS = [
  { key:"direct",   label:"Direct Control",   desc:"Things only I decide — my actions, words, choices",  color:T.sage, tb:"rgba(123,166,138,0.1)",  tbd:"rgba(123,166,138,0.32)", bc:"rgba(123,166,138,0.16)" },
  { key:"influence",label:"Can Influence",     desc:"I can affect but not fully control",                   color:T.sand, tb:"rgba(196,168,122,0.1)",  tbd:"rgba(196,168,122,0.32)", bc:"rgba(196,168,122,0.16)" },
  { key:"release",  label:"Release",           desc:"Outside my power — let it go completely",               color:T.rose, tb:"rgba(201,123,110,0.1)",  tbd:"rgba(201,123,110,0.32)", bc:"rgba(201,123,110,0.16)" },
];

function StepExamine({ onNext }) {
  const [b, setB] = useState({ direct:[], influence:[], release:[] });
  const k = KOSHA[2];
  const add = (key, v) => { if (v.trim()) setB(p => ({ ...p, [key]: [...p[key], v.trim()] })); };
  const rem = (key, i) => setB(p => ({ ...p, [key]: p[key].filter((_, j) => j !== i) }));

  return (
    <div style={{ animation:"slideIn .4s ease" }}>
      <div style={{ padding:".72rem .95rem", borderRadius:12, background:k.glow, border:`1px solid ${k.border}`, marginBottom:"1.1rem" }}>
        <div style={{ fontSize:".8rem", color:"rgba(245,239,230,0.46)", lineHeight:1.7 }}>Think about your situation. Sort concerns into these three spaces. The act of sorting itself is where the relief comes from.</div>
      </div>
      {BUCKETS.map(c => (
        <div key={c.key} style={{ marginBottom:".75rem", borderRadius:14, padding:".95rem 1.1rem", border:`1px solid ${c.bc}`, background:"rgba(245,239,230,0.02)" }}>
          <div style={{ fontSize:".68rem", fontWeight:600, letterSpacing:".12em", textTransform:"uppercase", color:c.color, marginBottom:".1rem" }}>{c.label}</div>
          <div style={{ fontSize:".73rem", color:"rgba(245,239,230,0.32)", marginBottom:".6rem" }}>{c.desc}</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:".3rem", marginBottom:b[c.key].length ? ".55rem" : 0 }}>
            {b[c.key].map((item, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:".28rem", padding:".22rem .58rem", borderRadius:20, background:c.tb, border:`1px solid ${c.tbd}`, color:c.color, fontSize:".76rem" }}>
                {item}<span onClick={() => rem(c.key, i)} style={{ opacity:.4, lineHeight:1, cursor:"pointer" }}>×</span>
              </div>
            ))}
          </div>
          <input placeholder="Type and press Enter…"
            onKeyDown={e => { if (e.key === "Enter") { add(c.key, e.target.value); e.target.value = ""; } }}
            style={{ width:"100%", background:"transparent", border:"none", borderBottom:`1px solid ${c.tbd}`, color:"rgba(245,239,230,0.78)", fontSize:".82rem", padding:".26rem 0" }} />
        </div>
      ))}
      <ScienceBadge color={k.color} text="Stoic philosophy (Epictetus) + Acceptance & Commitment Therapy. Focusing on controllables reduces anxiety and restores agency immediately." />
      <SBtn color={k.color} onClick={() => onNext(b)}>I see my power → Surface my emotion</SBtn>
    </div>
  );
}

/* ─────────────────────────────────────────────
   STEP S — SURFACE
───────────────────────────────────────────── */
const EMOTIONS = [
  { label:"Fear", emoji:"🌫️" }, { label:"Anxiety", emoji:"〰️" },
  { label:"Anger", emoji:"🔥" }, { label:"Shame", emoji:"🌑" },
  { label:"Pressure", emoji:"⏳" }, { label:"Sadness", emoji:"🌧️" },
  { label:"Overwhelm", emoji:"🌊" }, { label:"Dread", emoji:"🕳️" },
  { label:"Grief", emoji:"🫧" }, { label:"Confusion", emoji:"🌀" },
  { label:"Guilt", emoji:"⚖️" }, { label:"Loneliness", emoji:"🏔️" },
];

function StepSurface({ situation, onNext }) {
  const [sel, setSel] = useState(null);
  const [custom, setCustom] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [validation, setValidation] = useState(null);
  const k = KOSHA[3];

  function handleSelect(label) {
    setSel(label); setShowCustom(false);
    setValidation(validateEmotion(label, situation));
  }

  const emotion = showCustom ? custom : sel;

  return (
    <div style={{ animation:"slideIn .4s ease" }}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:".5rem", marginBottom:".7rem" }}>
        {EMOTIONS.map(({ label, emoji }) => (
          <div key={label} onClick={() => handleSelect(label)}
            style={{ padding:".72rem .9rem", borderRadius:12, cursor:"pointer", border:`1px solid ${sel === label && !showCustom ? k.color : "rgba(245,239,230,0.07)"}`, background:sel === label && !showCustom ? k.glow : "rgba(245,239,230,0.02)", display:"flex", alignItems:"center", gap:".55rem", transition:"all .18s ease" }}>
            <span style={{ fontSize:"1rem" }}>{emoji}</span>
            <span style={{ fontSize:".84rem", color:sel === label && !showCustom ? k.color : "rgba(245,239,230,0.42)", fontWeight:sel === label && !showCustom ? 500 : 300 }}>{label}</span>
          </div>
        ))}
      </div>
      <div onClick={() => { setShowCustom(true); setSel(null); setValidation(null); }}
        style={{ padding:".72rem .9rem", borderRadius:12, cursor:"pointer", border:`1px solid ${showCustom ? k.color : "rgba(245,239,230,0.07)"}`, background:showCustom ? k.glow : "rgba(245,239,230,0.02)", marginBottom:"1rem", transition:"all .18s ease" }}>
        <div style={{ fontSize:".84rem", color:showCustom ? k.color : "rgba(245,239,230,0.42)" }}>✍️  Something else — I'll name it myself</div>
        {showCustom && (
          <div style={{ marginTop:".5rem", display:"flex", gap:".45rem" }}>
            <input value={custom} onChange={e => setCustom(e.target.value)} autoFocus placeholder="What are you feeling?"
              style={{ flex:1, background:"transparent", border:"none", borderBottom:`1px solid ${k.border}`, color:"rgba(245,239,230,0.85)", fontSize:".86rem", padding:".26rem 0" }} />
            <button onClick={() => { if (custom.trim()) setValidation({ validation:`Feeling ${custom.toLowerCase()} makes complete sense. That's the real experience.`, science:`Naming an emotion in your own words activates the prefrontal cortex and reduces amygdala activity (Lieberman et al., UCLA 2007).`, hope:`You found the word. That's the hardest part. Now let's move through it.` }); }}
              style={{ background:k.glow, border:`1px solid ${k.border}`, borderRadius:7, color:k.color, fontSize:".73rem", padding:".26rem .65rem" }}>✓</button>
          </div>
        )}
      </div>
      {validation && (
        <div style={{ animation:"fadeIn .5s ease", marginBottom:"1rem" }}>
          <div style={{ padding:"1.05rem 1.15rem", borderRadius:14, background:k.glow, border:`1px solid ${k.border}`, marginBottom:".5rem" }}>
            <div style={{ fontSize:".66rem", color:k.color, fontWeight:600, letterSpacing:".12em", textTransform:"uppercase", marginBottom:".42rem" }}>That makes complete sense</div>
            <div style={{ color:"rgba(245,239,230,0.82)", fontSize:".9rem", lineHeight:1.8, marginBottom:".65rem" }}>{validation.validation}</div>
            <div style={{ color:"rgba(245,239,230,0.4)", fontSize:".8rem", lineHeight:1.65, fontStyle:"italic", borderTop:"1px solid rgba(245,239,230,0.07)", paddingTop:".55rem" }}>{validation.hope}</div>
          </div>
          <div style={{ padding:".55rem .85rem", borderRadius:9, background:"rgba(245,239,230,0.02)", border:"1px solid rgba(245,239,230,0.05)" }}>
            <span style={{ fontSize:".68rem", color:k.color }}>✦ </span>
            <span style={{ fontSize:".69rem", color:"rgba(245,239,230,0.32)", fontStyle:"italic" }}>{validation.science}</span>
          </div>
        </div>
      )}
      <ScienceBadge color={k.color} text="Affect Labeling — Lieberman et al., UCLA (2007). Naming an emotion measurably reduces amygdala activity. Neuroscience, not self-help." />
      <SBtn color={k.color} onClick={() => onNext(emotion)} disabled={!emotion || emotion.trim().length < 2}>Named it → Find my action</SBtn>
    </div>
  );
}

/* ─────────────────────────────────────────────
   STEP E2 — EXECUTE
───────────────────────────────────────────── */
function StepExecute({ situation, emotion, onNext }) {
  const [actions] = useState(() => generateActions(situation, emotion));
  const [extraActions, setExtraActions] = useState(null);
  const [showExtra, setShowExtra] = useState(false);
  const [sel, setSel] = useState(null);
  const [customAction, setCustomAction] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const k = KOSHA[4];

  function loadMore() {
    const second = generateActions(situation + " alternative", emotion).filter(a => !actions.includes(a));
    const fallback = [`Write what you wish someone truly understood about your situation`, `Identify one professional relationship to tend to this week`, `Set a timer for 25 minutes and do the one thing you've been avoiding`];
    setExtraActions([...second, ...fallback].filter((v, i, a) => a.indexOf(v) === i).slice(0, 3));
    setShowExtra(true); setSel(null);
  }

  const displayActions = showExtra ? extraActions : actions;
  const finalAction = showCustom ? customAction : sel;

  return (
    <div style={{ animation:"fadeIn .5s ease" }}>
      <div style={{ padding:".72rem .95rem", borderRadius:12, background:k.glow, border:`1px solid ${k.border}`, marginBottom:"1.1rem" }}>
        <div style={{ fontSize:".8rem", color:"rgba(245,239,230,0.46)", lineHeight:1.65, fontStyle:"italic" }}>These are specific to what you wrote. Choose one — just one. The smallest action is better than the perfect one you don't take.</div>
      </div>
      {displayActions?.map((a, i) => (
        <div key={`${showExtra}-${i}`} onClick={() => { setSel(a); setShowCustom(false); }}
          style={{ padding:".88rem 1rem", borderRadius:12, cursor:"pointer", marginBottom:".55rem", border:`1px solid ${sel === a && !showCustom ? k.color : "rgba(245,239,230,0.07)"}`, background:sel === a && !showCustom ? k.glow : "rgba(245,239,230,0.02)", color:sel === a && !showCustom ? k.color : "rgba(245,239,230,0.5)", fontSize:".87rem", lineHeight:1.62, fontWeight:sel === a && !showCustom ? 500 : 300, transition:"all .18s ease", animation:"pop .3s ease" }}>
          {sel === a && !showCustom ? "✓  " : ""}{a}
        </div>
      ))}
      <div onClick={() => { setShowCustom(true); setSel(null); }}
        style={{ padding:".8rem 1rem", borderRadius:12, cursor:"pointer", marginBottom:".55rem", border:`1px solid ${showCustom ? k.color : "rgba(245,239,230,0.07)"}`, background:showCustom ? k.glow : "rgba(245,239,230,0.02)", transition:"all .18s ease" }}>
        <div style={{ fontSize:".85rem", color:showCustom ? k.color : "rgba(245,239,230,0.42)" }}>✍️  I know what I need to do — I'll write it</div>
        {showCustom && (
          <input value={customAction} onChange={e => setCustomAction(e.target.value)} autoFocus placeholder="What one action will you take?"
            style={{ marginTop:".5rem", width:"100%", background:"transparent", border:"none", borderBottom:`1px solid ${k.border}`, color:"rgba(245,239,230,0.85)", fontSize:".86rem", padding:".26rem 0" }} />
        )}
      </div>
      <button onClick={loadMore} style={{ display:"block", width:"100%", padding:".58rem", borderRadius:9, border:"1px solid rgba(245,239,230,0.07)", background:"transparent", color:"rgba(245,239,230,0.32)", fontSize:".78rem", marginBottom:".2rem", cursor:"pointer" }}>
        ↻ Show different suggestions
      </button>
      <ScienceBadge color={k.color} text="Behavioral Activation — evidence-based for anxiety & depression. One specific immediate action breaks the paralysis loop and restores agency." />
      <SBtn color={k.color} onClick={() => onNext(finalAction)} disabled={!finalAction || finalAction.trim().length < 3}>I'll do this → Tune my body</SBtn>
    </div>
  );
}

/* ─────────────────────────────────────────────
   STEP T — TUNE
───────────────────────────────────────────── */
function StepTune({ onComplete }) {
  const [chosen, setChosen] = useState(null);
  const k = KOSHA[5];

  if (!chosen) return (
    <div style={{ animation:"slideIn .4s ease" }}>
      <p style={{ color:"rgba(245,239,230,0.42)", fontSize:".84rem", marginBottom:"1.3rem", lineHeight:1.78 }}>Your mind is clear. Your action is chosen. Now let your prana — your life force — settle. Choose the reset that feels right for your body right now.</p>
      {[
        { key:"breathe", icon:"○", name:"Box Breathing",       desc:"Slow guided breath — 4-4-6 rhythm",            science:"Activates vagus nerve — shifts sympathetic to parasympathetic (Polyvagal Theory)" },
        { key:"ground",  icon:"◇", name:"5-4-3-2-1 Grounding", desc:"Anchor to this moment through your senses",    science:"Interrupts anxiety loop — redirects attention to immediate physical reality" },
        { key:"release", icon:"△", name:"Physical Release",     desc:"Dissolve tension in jaw, shoulders, neck, hands",science:"Somatic release — the body holds stress physically even after the mind processes it" },
      ].map(tech => (
        <div key={tech.key} onClick={() => setChosen(tech.key)}
          style={{ padding:"1rem 1.1rem", borderRadius:14, cursor:"pointer", marginBottom:".65rem", border:"1px solid rgba(245,239,230,0.07)", background:"rgba(245,239,230,0.02)", transition:"all .2s ease" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = k.border; e.currentTarget.style.background = k.glow; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(245,239,230,0.07)"; e.currentTarget.style.background = "rgba(245,239,230,0.02)"; }}>
          <div style={{ display:"flex", alignItems:"center", gap:".85rem" }}>
            <div style={{ width:36, height:36, borderRadius:"50%", border:`1px solid ${k.border}`, display:"flex", alignItems:"center", justifyContent:"center", color:k.color, fontSize:".9rem", flexShrink:0 }}>{tech.icon}</div>
            <div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:".98rem", fontWeight:500, color:"rgba(245,239,230,0.82)", marginBottom:".12rem" }}>{tech.name}</div>
              <div style={{ fontSize:".75rem", color:"rgba(245,239,230,0.35)" }}>{tech.desc}</div>
            </div>
          </div>
          <div style={{ marginTop:".5rem", fontSize:".68rem", color:"rgba(245,239,230,0.18)", fontStyle:"italic", paddingLeft:"2.7rem" }}>✦ {tech.science}</div>
        </div>
      ))}
    </div>
  );

  if (chosen === "breathe") return <BoxBreathing onComplete={onComplete} />;
  if (chosen === "ground")  return <Grounding    onComplete={onComplete} />;
  if (chosen === "release") return <BodyRelease  onComplete={onComplete} />;
}

const PH = [
  { name:"inhale", label:"Breathe in",     dur:4, color:T.sage },
  { name:"hold",   label:"Hold gently",    dur:4, color:T.lav  },
  { name:"exhale", label:"Release slowly", dur:6, color:T.sky  },
];

function BoxBreathing({ onComplete }) {
  const [pi, setPi] = useState(0);
  const [count, setCount] = useState(4);
  const [round, setRound] = useState(0);
  const [done, setDone] = useState(false);
  const r = useRef({ pi:0, elapsed:0, round:0 });

  useEffect(() => {
    const t = setInterval(() => {
      r.current.elapsed++;
      const p = PH[r.current.pi];
      setCount(Math.max(1, p.dur - r.current.elapsed));
      if (r.current.elapsed >= p.dur) {
        r.current.elapsed = 0;
        const next = (r.current.pi + 1) % 3;
        if (r.current.pi === 2) { r.current.round++; setRound(r.current.round); if (r.current.round >= 3) { clearInterval(t); setDone(true); return; } }
        r.current.pi = next; setPi(next); setCount(PH[next].dur);
      }
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const phase = PH[pi];
  const prog = (phase.dur - count) / phase.dur;
  const scale = pi === 0 ? 1 + prog * .36 : pi === 1 ? 1.36 : 1.36 - prog * .36;

  if (done) return <TuneDone onComplete={onComplete} />;

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"1.5rem 0 1rem" }}>
      <div style={{ position:"relative", width:160, height:160, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"1.5rem" }}>
        <div style={{ position:"absolute", inset:-20, borderRadius:"50%", background:`radial-gradient(circle,${phase.color}14,transparent 65%)`, animation:"glow 3s ease infinite" }}/>
        <div style={{ width:120, height:120, borderRadius:"50%", border:`1px solid ${phase.color}`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", transform:`scale(${scale})`, transition:"transform 1s ease", background:`${phase.color}06` }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"2.6rem", fontWeight:400, color:"rgba(245,239,230,0.88)", lineHeight:1 }}>{count}</div>
          <div style={{ color:phase.color, fontSize:".56rem", letterSpacing:".18em", textTransform:"uppercase" }}>{phase.name}</div>
        </div>
      </div>
      <div style={{ color:"rgba(245,239,230,0.4)", fontStyle:"italic", fontSize:".84rem", marginBottom:".28rem" }}>{phase.label}</div>
      <div style={{ color:"rgba(245,239,230,0.18)", fontSize:".68rem" }}>Round {round + 1} of 3</div>
    </div>
  );
}

const GROUND_STEPS = [
  { prompt:"Name 5 things you can see right now — look around slowly", icon:"👁️" },
  { prompt:"Name 4 things you can physically feel or touch", icon:"🤲" },
  { prompt:"Name 3 things you can hear in this moment", icon:"👂" },
  { prompt:"Name 2 things you can smell", icon:"🌸" },
  { prompt:"Name 1 thing you can taste", icon:"👅" },
];

function Grounding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [input, setInput] = useState("");
  const [done, setDone] = useState(false);
  const k = KOSHA[5];

  function next() { if (input.trim()) { setInput(""); if (step >= 4) setDone(true); else setStep(s => s + 1); } }
  if (done) return <TuneDone onComplete={onComplete} />;
  const s = GROUND_STEPS[step];

  return (
    <div style={{ animation:"fadeIn .4s ease" }}>
      <div style={{ height:2, background:"rgba(245,239,230,0.05)", borderRadius:2, marginBottom:"1.4rem" }}>
        <div style={{ height:"100%", width:`${(step / 5) * 100}%`, background:k.color, borderRadius:2, transition:"width .5s ease" }}/>
      </div>
      <div style={{ textAlign:"center", marginBottom:"1.4rem" }}>
        <div style={{ fontSize:"2rem", marginBottom:".7rem" }}>{s.icon}</div>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.15rem", fontWeight:400, color:"rgba(245,239,230,0.82)", marginBottom:".3rem" }}>{s.prompt}</div>
        <div style={{ color:"rgba(245,239,230,0.28)", fontSize:".76rem" }}>Step {step + 1} of 5</div>
      </div>
      <textarea value={input} onChange={e => setInput(e.target.value)} rows={3} placeholder="Write what you notice…"
        style={{ width:"100%", background:"rgba(245,239,230,0.04)", border:"1px solid rgba(245,239,230,0.09)", borderRadius:12, padding:"1rem", color:"rgba(245,239,230,0.82)", fontSize:".88rem", fontWeight:300, lineHeight:1.65, resize:"none" }}
        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); next(); } }}
        onFocus={e => e.target.style.borderColor = k.border}
        onBlur={e => e.target.style.borderColor = "rgba(245,239,230,0.09)"}
      />
      <SBtn color={k.color} onClick={next} disabled={input.trim().length < 1}>{step < 4 ? "Next →" : "Complete grounding →"}</SBtn>
    </div>
  );
}

const RELEASE_STEPS = [
  { name:"Jaw release",    dur:8,  instruction:"Open your mouth wide, hold 3 seconds, then let it fall completely loose. Repeat slowly.", icon:"😮" },
  { name:"Shoulder drop",  dur:8,  instruction:"Raise both shoulders to your ears, hold 3 seconds, then drop them completely. Feel it release.", icon:"🤷" },
  { name:"Neck rolls",     dur:12, instruction:"Slowly roll your head side to side, then forward. Move like warm honey — no rush at all.", icon:"🔄" },
  { name:"Hand shake",     dur:8,  instruction:"Shake both hands loosely at your sides — like shaking off water. Let all tension fly out.", icon:"🤲" },
  { name:"Final breath",   dur:8,  instruction:"Breathe in slowly for 4 counts. Out through your mouth for 8. Release everything.", icon:"🌬️" },
];

function BodyRelease({ onComplete }) {
  const [step, setStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [stepDone, setStepDone] = useState(false);
  const [allDone, setAllDone] = useState(false);
  const intervalRef = useRef(null);
  const k = KOSHA[5];

  function startTimer() {
    const dur = RELEASE_STEPS[step].dur;
    setTimeLeft(dur); setStepDone(false);
    intervalRef.current = setInterval(() => {
      setTimeLeft(t => { if (t <= 1) { clearInterval(intervalRef.current); setStepDone(true); return 0; } return t - 1; });
    }, 1000);
  }
  function nextStep() { clearInterval(intervalRef.current); setStepDone(false); setTimeLeft(null); if (step >= 4) setAllDone(true); else setStep(s => s + 1); }
  useEffect(() => () => clearInterval(intervalRef.current), []);

  if (allDone) return <TuneDone onComplete={onComplete} />;
  const s = RELEASE_STEPS[step];

  return (
    <div style={{ animation:"fadeIn .4s ease" }}>
      <div style={{ height:2, background:"rgba(245,239,230,0.05)", borderRadius:2, marginBottom:"1.4rem" }}>
        <div style={{ height:"100%", width:`${(step / 5) * 100}%`, background:k.color, borderRadius:2, transition:"width .5s ease" }}/>
      </div>
      <div style={{ textAlign:"center", padding:"1rem 0" }}>
        <div style={{ fontSize:"2rem", marginBottom:".8rem" }}>{s.icon}</div>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.15rem", fontWeight:400, color:"rgba(245,239,230,0.82)", marginBottom:".7rem" }}>{s.name}</div>
        <div style={{ color:"rgba(245,239,230,0.4)", fontSize:".84rem", lineHeight:1.72, marginBottom:"1.3rem", maxWidth:300, margin:"0 auto 1.3rem" }}>{s.instruction}</div>
        {timeLeft !== null ? (
          <div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"2.8rem", fontWeight:300, color:k.color }}>{timeLeft}</div>
            <div style={{ color:"rgba(245,239,230,0.28)", fontSize:".7rem", marginTop:".22rem" }}>seconds</div>
          </div>
        ) : <SBtn color={k.color} onClick={startTimer}>Start {s.name} →</SBtn>}
        {stepDone && <div style={{ animation:"fadeIn .4s ease", marginTop:"1rem" }}><div style={{ color:k.color, fontSize:".86rem", marginBottom:".7rem" }}>✓ Done</div><SBtn color={k.color} onClick={nextStep}>{step < 4 ? "Next release →" : "Complete body reset →"}</SBtn></div>}
        {timeLeft !== null && !stepDone && <button onClick={() => { clearInterval(intervalRef.current); setStepDone(true); }} style={{ display:"block", margin:".85rem auto 0", background:"none", border:"none", color:"rgba(245,239,230,0.26)", fontSize:".73rem", cursor:"pointer" }}>Skip →</button>}
        <div style={{ color:"rgba(245,239,230,0.16)", fontSize:".68rem", marginTop:"1rem" }}>Step {step + 1} of 5</div>
      </div>
    </div>
  );
}

function TuneDone({ onComplete }) {
  return (
    <div style={{ textAlign:"center", padding:"2.5rem 1rem", animation:"fadeIn .8s ease" }}>
      <div style={{ fontSize:"2.2rem", marginBottom:"1rem", animation:"drift 4s ease infinite" }}>🌿</div>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.55rem", fontWeight:300, fontStyle:"italic", color:T.sage, marginBottom:".38rem" }}>Your prana has settled.</div>
      <div style={{ color:"rgba(245,239,230,0.38)", fontSize:".84rem", marginBottom:"1.8rem", lineHeight:1.75 }}>All three koshas — Manomaya, Vijnanamaya, Pranamaya.<br/>Thought. Emotion. Body. You moved through all of them.</div>
      <ScienceBadge color={T.sage} text="Polyvagal Theory (Porges) — slow exhalation activates the vagus nerve, measurably shifting your nervous system from sympathetic to parasympathetic state." />
      <SBtn color={T.sage} onClick={onComplete} style={{ marginTop:"1.1rem" }}>Complete my session →</SBtn>
    </div>
  );
}

/* ─────────────────────────────────────────────
   DONE SCREEN
───────────────────────────────────────────── */
function StepDone({ session, onNew, onHome }) {
  const items = [
    { label:"Your situation",  val:session.situation?.slice(0, 110) + (session.situation?.length > 110 ? "…" : ""), color:T.gold, bg:"rgba(212,168,83,0.07)" },
    { label:"Emotion surfaced",val:session.emotion, color:T.rose, bg:"rgba(201,123,110,0.07)" },
    { label:"Your one action", val:session.action,  color:T.sage, bg:"rgba(123,166,138,0.07)" },
  ].filter(i => i.val);

  return (
    <div style={{ textAlign:"center", animation:"fadeIn .8s ease" }}>
      <div style={{ marginBottom:"1.5rem" }}>
        <ThreeCircles size={180} animated={false} />
      </div>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.9rem", fontWeight:300, fontStyle:"italic", color:"rgba(245,239,230,0.86)", marginBottom:".22rem" }}>Session complete.</div>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:".82rem", color:T.gold, letterSpacing:".18em", textTransform:"uppercase", marginBottom:".38rem", opacity:.65 }}>Manomaya · Vijnanamaya · Pranamaya</div>
      <div style={{ color:"rgba(245,239,230,0.24)", fontSize:".72rem", marginBottom:"2rem" }}>{new Date(session.date).toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric" })}</div>

      {items.map(({ label, val, color, bg }) => (
        <div key={label} style={{ padding:".8rem 1rem", borderRadius:12, marginBottom:".55rem", textAlign:"left", background:bg, border:`1px solid ${color}1E` }}>
          <div style={{ fontSize:".62rem", fontWeight:600, letterSpacing:".14em", textTransform:"uppercase", color, marginBottom:".25rem" }}>{label}</div>
          <div style={{ fontSize:".84rem", color:"rgba(245,239,230,0.48)", lineHeight:1.55 }}>{val}</div>
        </div>
      ))}

      {/* Calming closing message */}
      <div style={{ padding:"1.5rem 1.4rem", borderRadius:16, marginBottom:"1.2rem", background:"rgba(123,166,138,0.06)", border:"1px solid rgba(123,166,138,0.18)", textAlign:"center", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-30, right:-30, width:100, height:100, borderRadius:"50%", border:"1px solid rgba(123,166,138,0.08)" }}/>
        <div style={{ position:"absolute", bottom:-20, left:-20, width:70, height:70, borderRadius:"50%", border:"1px solid rgba(123,166,138,0.08)" }}/>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.35rem", fontWeight:300, fontStyle:"italic", color:T.sage, lineHeight:1.5, marginBottom:"1rem" }}>
          All is well.<br/>You are okay.
        </div>
        <div style={{ width:32, height:1, background:"rgba(123,166,138,0.3)", margin:"0 auto 1rem" }}/>
        <div style={{ fontSize:".86rem", color:"rgba(245,239,230,0.48)", lineHeight:1.82, marginBottom:"1.1rem" }}>
          You just moved through your thoughts, your emotions, and your body — all three layers. That takes more courage than it looks like from the outside.
        </div>
        <div style={{ fontFamily:"'Playfair Display',serif", fontStyle:"italic", fontSize:".92rem", color:"rgba(245,239,230,0.35)", lineHeight:1.7, marginBottom:"1.2rem" }}>
          "The storm you were inside five minutes ago is the same storm — but you are no longer the same person standing in it."
        </div>
        {/* Breath prompt */}
        <div style={{ padding:".85rem 1.2rem", borderRadius:12, background:"rgba(123,166,138,0.08)", border:"1px solid rgba(123,166,138,0.14)" }}>
          <div style={{ fontSize:".68rem", fontWeight:600, letterSpacing:".18em", textTransform:"uppercase", color:T.sage, marginBottom:".5rem", opacity:.8 }}>One last breath</div>
          <div style={{ fontSize:".83rem", color:"rgba(245,239,230,0.42)", lineHeight:1.78 }}>
            Breathe in slowly for 4 counts.<br/>
            Hold for 2.<br/>
            Let it go completely.<br/>
            <span style={{ color:T.sage, fontStyle:"italic" }}>You're done. You're grounded. You're good.</span>
          </div>
        </div>
      </div>

      <div style={{ padding:".85rem 1.05rem", borderRadius:12, marginBottom:"1.1rem", background:T.goldFaint, border:`1px solid ${T.goldBorder}`, textAlign:"left" }}>
        <div style={{ fontSize:".65rem", fontWeight:600, letterSpacing:".12em", textTransform:"uppercase", color:T.gold, marginBottom:".35rem" }}>Your one action</div>
        <div style={{ fontSize:".8rem", color:"rgba(245,239,230,0.38)", lineHeight:1.72 }}>Do it within the next 30 minutes. Not perfectly. Not completely. Just the first small move. That's where real relief lives.</div>
      </div>

      <SBtn color={T.gold} onClick={onNew}>New session →</SBtn>
      <button onClick={onHome} style={{ display:"block", width:"100%", marginTop:".45rem", background:"none", border:"none", color:"rgba(245,239,230,0.25)", fontSize:".8rem", padding:".4rem" }}>← Back to home</button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SESSION SHELL
───────────────────────────────────────────── */
const STEP_META = [
  { hd:"What is actually real right now?",    sb:"Most of what we suffer is assumption, not fact. Let's separate them clearly — together." },
  { hd:"Where does your power actually lie?", sb:"Sorting your concerns into what you control restores your sense of agency immediately." },
  { hd:"Name what you're feeling.",           sb:"When an emotion is named precisely, its intensity drops measurably. This is neuroscience." },
  { hd:"One micro-step forward.",             sb:"Not a plan. Not a list. One small, specific, immediately doable action. That's all." },
  { hd:"Reset your nervous system.",          sb:"Your mind is clear. Your action is chosen. Now let your body — your prana — catch up." },
];

function SessionShell({ onHome }) {
  const [step, setStep] = useState(0);
  const [session, setSession] = useState({ date:new Date().toISOString() });
  const save = upd => setSession(s => ({ ...s, ...upd }));

  function finish(action) {
    const final = { ...session, action };
    setSession(final);
    try { const p = JSON.parse(localStorage.getItem("reset_v6") || "[]"); localStorage.setItem("reset_v6", JSON.stringify([final, ...p].slice(0, 30))); } catch {}
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
      <div style={{ position:"fixed", top:0, left:"50%", transform:"translateX(-50%)", width:500, height:280, background:`radial-gradient(ellipse at top,${kosha.glow},transparent 70%)`, pointerEvents:"none", zIndex:0, transition:"background 1s ease" }}/>

      {/* Nav */}
      <div style={{ position:"sticky", top:0, zIndex:50, display:"flex", justifyContent:"space-between", alignItems:"center", padding:".85rem 1.5rem", background:"rgba(26,20,16,0.92)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(245,239,230,0.05)" }}>
        <button onClick={onHome} style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.3rem", fontWeight:400, color:T.gold, background:"none", border:"none", letterSpacing:".1em", opacity:.82 }}>RESET</button>
        <div style={{ display:"flex", gap:".32rem" }}>
          {[1,2,3,4,5].map(i => {
            const k = KOSHA[i];
            const done = i < step, active = i === step;
            return (
              <div key={i} style={{ width:27, height:27, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:".7rem", fontWeight:600, background:done ? "rgba(212,168,83,0.1)" : active ? k.color : "rgba(245,239,230,0.04)", color:active ? T.bg : done ? T.gold : "rgba(245,239,230,0.22)", border:done ? "1px solid rgba(212,168,83,0.28)" : "none", transition:"all .4s ease", fontFamily:"'Playfair Display',serif" }}>
                {k.letter}
              </div>
            );
          })}
        </div>
        <div style={{ width:50 }} />
      </div>

      {/* Progress */}
      {step > 0 && step < 6 && (
        <div style={{ height:1, background:"rgba(245,239,230,0.04)" }}>
          <div style={{ height:"100%", width:`${progress}%`, background:kosha.color, transition:"width .6s ease", opacity:.6 }}/>
        </div>
      )}

      <div style={{ position:"relative", zIndex:1, maxWidth:520, margin:"0 auto", padding:"2rem 1.5rem 5rem" }}>

        {/* Kosha tag */}
        {step >= 1 && step <= 5 && <KoshaTag step={step} />}

        {/* Step heading */}
        {meta && (
          <div style={{ marginBottom:"1.35rem", animation:"fadeIn .4s ease" }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(1.45rem,3.5vw,1.95rem)", fontWeight:400, lineHeight:1.18, marginBottom:".4rem", color:"rgba(245,239,230,0.86)" }}>{meta.hd}</div>
            <div style={{ color:"rgba(245,239,230,0.35)", fontSize:".82rem", lineHeight:1.72 }}>{meta.sb}</div>
          </div>
        )}

        {/* Step 0 — start screen with three circles */}
        {step === 0 && (
          <div style={{ paddingTop:"1rem", animation:"fadeIn .5s ease" }}>
            <div style={{ display:"flex", justifyContent:"center", marginBottom:"2rem" }}>
              <ThreeCircles size={280} animated={true} activeLayer={null} />
            </div>
            <div style={{ textAlign:"center", marginBottom:"2.2rem" }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(1.8rem,5vw,2.6rem)", fontWeight:300, fontStyle:"italic", color:"rgba(245,239,230,0.86)", lineHeight:1.15, marginBottom:".6rem" }}>
                What's weighing<br/>on you right now?
              </div>
              <div style={{ fontSize:".68rem", letterSpacing:".24em", textTransform:"uppercase", color:T.gold, opacity:.55, marginBottom:"1.2rem" }}>
                Manomaya · Vijnanamaya · Pranamaya
              </div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:".88rem", fontStyle:"italic", color:"rgba(245,239,230,0.26)", lineHeight:1.72 }}>
                Three thousand years of wisdom.<br/>Five minutes. Five steps.
              </div>
            </div>
            <StepSituation onNext={v => { save({ situation:v }); setStep(1); }} />
          </div>
        )}

        {step === 1 && <StepRecognize situation={session.situation} onNext={r => { save({ clarify:r }); setStep(2); }} />}
        {step === 2 && <StepExamine onNext={b => { save({ buckets:b }); setStep(3); }} />}
        {step === 3 && <StepSurface situation={session.situation} onNext={e => { save({ emotion:e }); setStep(4); }} />}
        {step === 4 && <StepExecute situation={session.situation} emotion={session.emotion} onNext={a => finish(a)} />}
        {step === 5 && <StepTune onComplete={() => setStep(6)} />}
        {step === 6 && <StepDone session={session} onNew={() => { setStep(0); setSession({ date:new Date().toISOString() }); }} onHome={onHome} />}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   HISTORY
───────────────────────────────────────────── */
function History({ onBack, onNew }) {
  const sessions = (() => { try { return JSON.parse(localStorage.getItem("reset_v6") || "[]"); } catch { return []; } })();
  return (
    <div style={{ minHeight:"100vh", background:T.bg, padding:"2rem 1.5rem" }}>
      <style>{CSS}</style>
      <div style={{ maxWidth:540, margin:"0 auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"2.5rem" }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.75rem", fontWeight:300, fontStyle:"italic", color:"rgba(245,239,230,0.82)" }}>Your sessions</div>
          <div style={{ display:"flex", gap:".55rem" }}>
            <button onClick={onNew} style={{ padding:".38rem .8rem", borderRadius:8, border:`1px solid ${T.goldBorder}`, background:"transparent", color:T.gold, fontSize:".76rem" }}>New session</button>
            <button onClick={onBack} style={{ padding:".38rem .8rem", borderRadius:8, border:"1px solid rgba(245,239,230,0.1)", background:"transparent", color:"rgba(245,239,230,0.32)", fontSize:".76rem" }}>← Back</button>
          </div>
        </div>
        {!sessions.length ? (
          <div style={{ textAlign:"center", padding:"5rem 2rem", color:"rgba(245,239,230,0.18)" }}>
            <ThreeCircles size={140} animated={false} />
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.4rem", fontStyle:"italic", marginTop:"1.5rem", opacity:.4 }}>No sessions yet</div>
          </div>
        ) : sessions.map((s, i) => (
          <div key={i} style={{ padding:"1.1rem 1.25rem", borderRadius:14, marginBottom:".65rem", border:"1px solid rgba(245,239,230,0.07)", background:"rgba(245,239,230,0.02)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:".45rem" }}>
              <span style={{ fontSize:".64rem", padding:".18rem .55rem", borderRadius:20, background:"rgba(212,168,83,0.1)", color:T.gold, fontWeight:500, letterSpacing:".08em" }}>Session {sessions.length - i}</span>
              <span style={{ color:"rgba(245,239,230,0.18)", fontSize:".68rem" }}>{new Date(s.date).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" })}</span>
            </div>
            <div style={{ fontSize:".83rem", color:"rgba(245,239,230,0.36)", marginBottom:".45rem", fontStyle:"italic", lineHeight:1.55 }}>"{s.situation?.slice(0, 90)}{s.situation?.length > 90 ? "…" : ""}"</div>
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
function Landing({ onStart, onHistory }) {
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);

  return (
    <div style={{ background:T.bg, minHeight:"100vh", overflowX:"hidden" }}>
      <style>{CSS}</style>

      {/* Ambient top glow */}
      <div style={{ position:"fixed", top:0, left:"50%", transform:"translateX(-50%)", width:800, height:500, background:"radial-gradient(ellipse at top,rgba(212,168,83,0.07),transparent 65%)", pointerEvents:"none", zIndex:0 }}/>

      {/* Nav */}
      <nav style={{ position:"sticky", top:0, zIndex:50, display:"flex", justifyContent:"space-between", alignItems:"center", padding:"1.1rem 2.5rem", background:"rgba(26,20,16,0.88)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(245,239,230,0.05)" }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.35rem", fontWeight:400, color:T.gold, letterSpacing:".12em", opacity:.82 }}>
          RESET<span style={{ fontSize:".62rem", fontWeight:300, letterSpacing:".2em", marginLeft:".4rem", verticalAlign:"middle", opacity:.55 }}>METHOD</span>
        </div>
        <div style={{ display:"flex", gap:"1rem", alignItems:"center" }}>
          <button className="ghost-btn" onClick={onHistory}>Sessions</button>
          <button className="cta-btn" onClick={onStart} style={{ padding:".6rem 1.45rem", fontSize:".83rem" }}>Begin →</button>
        </div>
      </nav>

      {/* HERO — Three circles front and center */}
      <section style={{ position:"relative", zIndex:1, maxWidth:1100, margin:"0 auto", padding:"5rem 2.5rem 4rem", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"4rem", alignItems:"center" }}>
        <div style={{ animation:"fadeUp .9s ease" }}>
          <div style={{ fontSize:".6rem", letterSpacing:".32em", textTransform:"uppercase", color:T.gold, opacity:.65, marginBottom:"1.6rem", fontWeight:500 }}>
            Ancient Wisdom · Modern Neuroscience
          </div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(2.6rem,5vw,4.2rem)", fontWeight:400, lineHeight:1.1, marginBottom:"1.6rem", color:"rgba(245,239,230,0.88)", letterSpacing:"-.01em" }}>
            From overwhelmed<br/>to{" "}
            <em style={{ fontStyle:"italic", color:T.gold, background:"linear-gradient(90deg,#D4A853,#E8C876,#D4A853)", backgroundSize:"200% auto", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", animation:"shimmer 4s linear infinite" }}>grounded</em>
            <br/>in five minutes.
          </h1>
          <p style={{ color:"rgba(245,239,230,0.36)", fontSize:".92rem", lineHeight:1.88, maxWidth:400, marginBottom:"2.2rem", fontWeight:300 }}>
            The RESET Method moves through all three layers of stress — thought, emotion, and body — in the right sequence. Five steps. Five minutes.
          </p>
          <div style={{ display:"flex", gap:".9rem", flexWrap:"wrap", alignItems:"center" }}>
            <button className="cta-btn" onClick={onStart}>Begin a free session →</button>
            <span style={{ color:"rgba(245,239,230,0.2)", fontSize:".78rem" }}>Free · Private · 5 minutes</span>
          </div>
        </div>

        {/* Three Circles Hero Visual */}
        <div style={{ display:"flex", justifyContent:"center", animation:"fadeUp 1s .2s ease both" }}>
          <div style={{ position:"relative" }}>
            <ThreeCircles size={340} animated={true} activeLayer={null} />
            {/* Floating labels around the diagram */}
            <div style={{ position:"absolute", top:"8%", left:"-5%", animation:"drift 6s ease-in-out infinite" }}>
              <div style={{ padding:".35rem .75rem", borderRadius:20, background:"rgba(212,168,83,0.1)", border:"1px solid rgba(212,168,83,0.22)", fontSize:".68rem", color:T.gold, whiteSpace:"nowrap" }}>CBT · Aaron Beck</div>
            </div>
            <div style={{ position:"absolute", bottom:"12%", left:"-8%", animation:"drift 7s 1s ease-in-out infinite" }}>
              <div style={{ padding:".35rem .75rem", borderRadius:20, background:"rgba(201,123,110,0.1)", border:"1px solid rgba(201,123,110,0.22)", fontSize:".68rem", color:T.rose, whiteSpace:"nowrap" }}>Affect Labeling · UCLA</div>
            </div>
            <div style={{ position:"absolute", bottom:"12%", right:"-8%", animation:"drift 8s 2s ease-in-out infinite" }}>
              <div style={{ padding:".35rem .75rem", borderRadius:20, background:"rgba(123,166,138,0.1)", border:"1px solid rgba(123,166,138,0.22)", fontSize:".68rem", color:T.sage, whiteSpace:"nowrap" }}>Polyvagal Theory</div>
            </div>
          </div>
        </div>
      </section>

      {/* The insight quote */}
      <section style={{ background:"rgba(212,168,83,0.04)", borderTop:"1px solid rgba(212,168,83,0.1)", borderBottom:"1px solid rgba(212,168,83,0.1)", padding:"5rem 2.5rem", position:"relative", zIndex:1 }}>
        <div style={{ maxWidth:740, margin:"0 auto", textAlign:"center" }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(1.5rem,3.2vw,2.4rem)", fontWeight:300, fontStyle:"italic", lineHeight:1.55, color:"rgba(245,239,230,0.7)" }}>
            "Vedantic philosophy called them koshas.<br/>
            Modern neuroscience calls them cognitive distortion,<br/>affect labeling, and polyvagal regulation.<br/>
            <span style={{ color:T.gold, fontStyle:"normal", fontWeight:500 }}>They are describing the exact same three layers.</span>"
          </div>
          <div style={{ marginTop:"1.4rem", fontSize:".68rem", letterSpacing:".22em", textTransform:"uppercase", color:"rgba(245,239,230,0.18)" }}>3,000 years apart. Same map of human suffering.</div>
        </div>
      </section>

      {/* The three circles explained */}
      <section style={{ maxWidth:960, margin:"0 auto", padding:"7rem 2.5rem", position:"relative", zIndex:1 }}>
        <div style={{ textAlign:"center", marginBottom:"4rem" }}>
          <div style={{ fontSize:".6rem", letterSpacing:".3em", textTransform:"uppercase", color:T.gold, opacity:.6, marginBottom:".8rem" }}>Why three circles?</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(1.5rem,3vw,2.2rem)", fontWeight:300, fontStyle:"italic", color:"rgba(245,239,230,0.72)", lineHeight:1.4 }}>
            Because stress lives in all three layers<br/>simultaneously — and so does the solution.
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1.5rem" }}>
          {[
            { color:T.gold,  bg:"rgba(212,168,83,0.06)",  border:"rgba(212,168,83,0.2)",  title:"Manomaya Kosha", sanskrit:"मनोमय कोश", eng:"Mind Sheath", desc:"The layer of thought, story, and belief. Where we replay, catastrophize, and assume. The R and E steps live here.", science:"CBT · Cognitive Behavioral Therapy" },
            { color:T.rose,  bg:"rgba(201,123,110,0.06)", border:"rgba(201,123,110,0.2)", title:"Vijnanamaya Kosha",sanskrit:"विज्ञानमय कोश",eng:"Wisdom Sheath",desc:"The seat of emotion, intuition, and felt sense. Where feelings live before we name them. The S and E steps live here.", science:"Affect Labeling · Behavioral Activation" },
            { color:T.sage,  bg:"rgba(123,166,138,0.06)", border:"rgba(123,166,138,0.2)", title:"Pranamaya Kosha",  sanskrit:"प्राणमय कोश",  eng:"Life Force Sheath",desc:"Breath, prana, the body's energy. Stress is stored physically even after the mind processes it. The T step lives here.", science:"Polyvagal Theory · Pranayama" },
          ].map(({ color, bg, border, title, sanskrit, eng, desc, science }) => (
            <div key={title} style={{ padding:"1.6rem 1.4rem", borderRadius:18, background:bg, border:`1px solid ${border}` }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.05rem", fontStyle:"italic", color, marginBottom:".18rem" }}>{sanskrit}</div>
              <div style={{ fontSize:".62rem", fontWeight:600, letterSpacing:".18em", textTransform:"uppercase", color, opacity:.7, marginBottom:".6rem" }}>{title}</div>
              <div style={{ fontSize:".75rem", color:"rgba(245,239,230,0.32)", marginBottom:"1rem", letterSpacing:".04em" }}>{eng}</div>
              <div style={{ fontSize:".83rem", color:"rgba(245,239,230,0.52)", lineHeight:1.75, marginBottom:"1rem" }}>{desc}</div>
              <div style={{ fontSize:".66rem", color:"rgba(245,239,230,0.2)", fontStyle:"italic" }}>✦ {science}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section style={{ maxWidth:660, margin:"0 auto", padding:"2rem 2.5rem 7rem", position:"relative", zIndex:1 }}>
        <div style={{ fontSize:".6rem", letterSpacing:".3em", textTransform:"uppercase", color:T.gold, opacity:.6, marginBottom:"3rem", textAlign:"center" }}>The complete method</div>
        {[
          { k:"R", label:"Recognize reality",    kosha:"Manomaya Kosha",   full:"Separates your exact facts from assumptions from catastrophizing — personally, using your own words.", color:T.gold, science:"Aaron Beck, 1960s · 50+ years of clinical evidence" },
          { k:"E", label:"Examine your control", kosha:"Manomaya Kosha",   full:"Sort concerns into Direct Control, Can Influence, and Release. Restores your sense of power in under two minutes.", color:T.sky,  science:"Stoic philosophy + ACT therapy" },
          { k:"S", label:"Surface your emotion", kosha:"Vijnanamaya Kosha",full:"Name the exact emotion. Receive a warm, personal validation. Understand what's happening in your brain.", color:T.rose, science:"Lieberman et al., UCLA 2007 — Affect Labeling" },
          { k:"E", label:"Execute one action",   kosha:"Vijnanamaya Kosha",full:"Three micro-actions specific to your exact situation and emotion. One tiny step. Immediately doable.", color:T.sand, science:"Behavioral Activation — evidence-based" },
          { k:"T", label:"Tune your body",       kosha:"Pranamaya Kosha",  full:"Choose your body reset — box breathing, grounding, or physical release. Guided fully through each one.", color:T.sage, science:"Polyvagal Theory (Porges) · Pranayama · Vagus nerve" },
        ].map(({ k, label, kosha, full, color, science }, i) => (
          <div key={i} style={{ display:"flex", gap:"1.6rem", padding:"1.6rem 0", borderBottom:"1px solid rgba(245,239,230,0.05)" }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"2.8rem", fontWeight:300, color, lineHeight:1, minWidth:42, opacity:.72 }}>{k}</div>
            <div style={{ paddingTop:".18rem" }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.02rem", fontWeight:500, color:"rgba(245,239,230,0.8)", marginBottom:".15rem" }}>{label}</div>
              <div style={{ fontSize:".65rem", fontStyle:"italic", color, opacity:.6, letterSpacing:".06em", marginBottom:".38rem" }}>{kosha}</div>
              <div style={{ color:"rgba(245,239,230,0.36)", fontSize:".8rem", lineHeight:1.78, marginBottom:".38rem" }}>{full}</div>
              <div style={{ fontSize:".65rem", color:"rgba(245,239,230,0.18)", fontStyle:"italic" }}>✦ {science}</div>
            </div>
          </div>
        ))}
        <div style={{ marginTop:"3rem", textAlign:"center" }}>
          <button className="cta-btn" onClick={onStart}>Begin your first session →</button>
        </div>
      </section>

      {/* Works for */}
      <section style={{ background:"rgba(245,239,230,0.02)", borderTop:"1px solid rgba(245,239,230,0.04)", padding:"5rem 2.5rem", position:"relative", zIndex:1 }}>
        <div style={{ maxWidth:840, margin:"0 auto", textAlign:"center" }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(1.3rem,2.4vw,1.85rem)", fontWeight:300, fontStyle:"italic", color:"rgba(245,239,230,0.6)", marginBottom:"2.4rem", lineHeight:1.45 }}>
            Every problem has thoughts, emotions, and a body.<br/>
            <span style={{ color:T.gold }}>So RESET works for every problem.</span>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(142px,1fr))", gap:".65rem" }}>
            {["Work stress","Relationship tension","Financial worry","Health anxiety","Career uncertainty","Parenting pressure","Conflict","Life transitions","Performance anxiety","Imposter syndrome","Grief","Burnout"].map(s => (
              <div key={s} style={{ padding:".85rem 1rem", borderRadius:11, background:"rgba(245,239,230,0.02)", border:"1px solid rgba(245,239,230,0.06)", textAlign:"center", fontSize:".78rem", color:"rgba(245,239,230,0.32)", lineHeight:1.45 }}>{s}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Pull quote */}
      <section style={{ maxWidth:620, margin:"0 auto", padding:"7rem 2.5rem", position:"relative", zIndex:1 }}>
        <div style={{ borderLeft:`1px solid rgba(212,168,83,0.28)`, paddingLeft:"2rem" }}>
          <blockquote style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(1.1rem,2.1vw,1.6rem)", fontWeight:300, fontStyle:"italic", lineHeight:1.82, color:"rgba(245,239,230,0.48)" }}>
            "This is not — close your eyes and breathe.<br/>
            This is — here is the reality.<br/>
            Here is your power. Here is your action.<br/>
            <strong style={{ fontStyle:"normal", fontWeight:500, color:"rgba(245,239,230,0.8)" }}>Now breathe.</strong>"
          </blockquote>
        </div>
      </section>

      {/* Waitlist */}
      <section style={{ background:"rgba(212,168,83,0.04)", borderTop:"1px solid rgba(212,168,83,0.1)", padding:"6rem 2.5rem", position:"relative", zIndex:1 }}>
        <div style={{ maxWidth:440, margin:"0 auto", textAlign:"center" }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(1.4rem,2.8vw,2.1rem)", fontWeight:300, fontStyle:"italic", color:"rgba(245,239,230,0.75)", lineHeight:1.3, marginBottom:".85rem" }}>
            Weekly guidance from<br/>the RESET Method.
          </div>
          <p style={{ color:"rgba(245,239,230,0.28)", fontSize:".83rem", lineHeight:1.82, marginBottom:"2rem" }}>One email. One insight. One micro-action. No noise.</p>
          {joined ? (
            <div style={{ padding:"1.05rem 2rem", borderRadius:12, background:"rgba(123,166,138,0.1)", border:"1px solid rgba(123,166,138,0.24)", color:T.sage, fontSize:".88rem" }}>🌿 You're in. Welcome.</div>
          ) : (
            <div>
              <div style={{ display:"flex", gap:".6rem", flexWrap:"wrap", justifyContent:"center", marginBottom:".5rem" }}>
                <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Your email address"
                  style={{ flex:1, minWidth:195, padding:".8rem 1.1rem", borderRadius:10, border:"1px solid rgba(245,239,230,0.09)", background:"rgba(245,239,230,0.04)", color:"rgba(245,239,230,0.78)", fontSize:".88rem" }} />
                <button className="cta-btn" onClick={() => { if (email.trim()) setJoined(true); }}>Join →</button>
              </div>
              <div style={{ fontSize:".68rem", color:"rgba(245,239,230,0.18)", fontStyle:"italic" }}>✓ GDPR compliant · ✓ Unsubscribe anytime · ✓ Global</div>
            </div>
          )}
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding:"8rem 2.5rem", textAlign:"center", position:"relative", zIndex:1 }}>
        <div style={{ display:"flex", justifyContent:"center", marginBottom:"2rem" }}>
          <ThreeCircles size={200} animated={true} />
        </div>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(1.9rem,4.2vw,3.2rem)", fontWeight:300, fontStyle:"italic", color:"rgba(245,239,230,0.8)", lineHeight:1.14, marginBottom:"1.9rem" }}>
          Your first RESET<br/>is one click away.
        </div>
        <button className="cta-btn" onClick={onStart} style={{ fontSize:".95rem", padding:".95rem 2.6rem" }}>Begin your free session →</button>
        <div style={{ marginTop:".85rem", color:"rgba(245,239,230,0.16)", fontSize:".76rem" }}>Free · Private · 5 minutes · No signup needed</div>
      </section>

      <footer style={{ textAlign:"center", padding:"2rem", color:"rgba(245,239,230,0.12)", fontSize:".68rem", borderTop:"1px solid rgba(245,239,230,0.04)", letterSpacing:".06em" }}>
        © 2025 The RESET Method · Ancient wisdom · Modern neuroscience · Structured relief
      </footer>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ROOT
───────────────────────────────────────────── */
export default function App() {
  const [view, setView] = useState("landing");
  const start = () => setView("session");
  return (
    <>
      <style>{CSS}</style>
      {view === "landing" && <Landing      onStart={start} onHistory={() => setView("history")} />}
      {view === "session" && <SessionShell onHome={() => setView("landing")} />}
      {view === "history" && <History      onBack={() => setView("landing")} onNew={start} />}
    </>
  );
}
