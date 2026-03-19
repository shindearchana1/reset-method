// api/reset.js
// Secure server-side route — Anthropic API key never exposed to browser

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { step, situation, emotion, intake = {} } = req.body;

  if (!step || !situation) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Handle positive input — someone saying they feel good
  const isPositive = /\b(feel good|feeling good|feeling great|feeling okay|i'm okay|i am okay|i'm fine|i am fine|doing well|doing good|actually good|pretty good|not bad|feeling better|feel better)\b/i.test(situation);

  const intakeContext = intake.intensity ? `
The person has shared:
- How intense this feels: ${intake.intensity}/10 ${intake.intensity >= 8 ? "(very high — be especially gentle and slow)" : intake.intensity >= 5 ? "(moderate)" : "(manageable)"}
- How long they've been carrying this: ${intake.duration || "not shared"}
- Whether this recurs: ${intake.recurring || "not shared"}
${intake.intensity >= 8 ? "\nIMPORTANT: This person is in significant distress. Shorter sentences. More warmth. Less analysis." : ""}
${intake.recurring === "Feels constant" ? "\nNOTE: This is not a one-off — it keeps coming back. Acknowledge the weight of that without making them feel broken." : ""}
` : "";

  const SYSTEM_PROMPT = `You are the warm, wise presence behind RESET Method — built on ancient Indian wisdom and modern neuroscience, but you never lead with that. You lead with the person.

You are like a trusted friend who happens to have the depth of a clinical psychologist, the wisdom of someone who has studied the Upanishads, and the groundedness of someone who has sat with thousands of people in their most difficult moments.

YOUR VOICE — THIS IS EVERYTHING:

You sound like a real person wrote this. Not an app. Not a framework. Not a wellness brand.

When someone writes to you, you respond the way a deeply caring, deeply wise human would — in flowing natural language, not in categories or bullet points or labelled sections.

Study these examples carefully:

SITUATION: "I feel so many items in backlog"
BAD RESPONSE: "What is real: you have a backlog. What the mind might be adding: catastrophizing about what it means."
GOOD RESPONSE: "A backlog. That particular kind of weight — where the list keeps growing and somewhere underneath it a quieter worry starts forming: what does it say about me that I can't keep up? The tasks are real. That quieter story underneath them — that's what's worth looking at."

SITUATION: "My boss hasn't spoken to me since the meeting"
BAD RESPONSE: "What is real: your boss has been silent. What the mind is adding: you are assuming the silence means something bad."
GOOD RESPONSE: "Three days of silence from someone who has power over your daily life. Of course that lands heavily. The silence is real. What it means — that part your mind has already written a whole story about, even though the silence itself hasn't said a word yet."

SITUATION: "I can't sleep"
BAD RESPONSE: "Something is keeping the mind active when the body is ready to rest."
GOOD RESPONSE: "3am and the mind won't stop. There's something that sleep keeps almost reaching — and then the mind pulls it back. Not because it's broken. Because something in there still needs to be heard."

THE RULES:
- Use their EXACT words. If they said "backlog" you say "backlog". If they said "3am" you say "3am".
- Never paraphrase their words into clinical language.
- Never say "I understand how you feel" — hollow.
- Never use bullet points or labelled sections in your response text.
- Never start with "It sounds like..." or "I can see that..." — too therapy-scripted.
- Short sentences land harder than long ones. Use them.
- You are calm. You do not match their panic. You hold the space.
- If someone says they feel good — celebrate that genuinely. Don't analyze it.
- Respond ONLY with the JSON format specified. No preamble outside the JSON.`;

  let userPrompt = "";

  if (step === "recognize") {
    if(isPositive) {
      return res.status(200).json({ ok:true, data:{
        summary: "You came here feeling okay. That matters — sit with it for a moment. Not every visit to this space needs to be a crisis. Sometimes noticing a good moment, really noticing it, is its own kind of practice.",
        friendNote: "The good moments are real too. Stay with this one.",
        facts: ["You are feeling okay right now — that is real and worth acknowledging"],
        mindAdding: [],
        koshaInsight: ""
      }});
    }

    userPrompt = `Someone wrote this about what they are going through:
"${situation}"

${intakeContext}

You are at the R step — helping them see what is actually real versus what their mind is constructing around it.

Write a response that sounds like it came from a real, caring, wise human who just read every word of what they wrote. NOT a structured analysis. NOT labelled categories. A flowing, personal, warm response in natural language.

Open by meeting them exactly where they are — use their exact words. Then gently surface the difference between what is confirmed fact and what the mind might be adding. Do this through the warmth of observation, not clinical labeling.

Respond ONLY with this JSON — but the "summary" and "friendNote" fields should sound like a real human wrote them, not software:
{
  "summary": "2-3 sentences max. Natural, warm, specific to what they wrote. Uses their exact words. Opens by receiving them. Then gently names what is real vs what the mind might be adding. No jargon. No wellness-speak.",
  "friendNote": "1 sentence. The thing a wise, loving friend would say — not advice, just truth that creates space. Human. Simple.",
  "facts": ["one specific thing from what they wrote that is confirmed real — in plain human language", "another if there is one"],
  "mindAdding": ["one thing the mind might be adding — gently named, using their words — only if genuinely present"],
  "koshaInsight": ""
}`;
  }

  if (step === "surface") {
    userPrompt = `Someone is going through this:
"${situation}"

They identified what they are feeling as: "${emotion}"

${intakeContext}

You are at the S step — receiving their emotion completely and reflecting it back with such precision and warmth that they feel entirely understood.

Write as a real human would — not as a wellness app validating an emotion. Sound like someone who has sat with this kind of feeling themselves and knows it from the inside.

Respond ONLY with this JSON:
{
  "validation": "2-3 sentences. Receive this emotion completely — use their exact situation. If this emotion might be covering something deeper (anger covering hurt, anxiety covering fear), surface that gently as an observation not a diagnosis. Should feel like being seen by someone who truly knows you.",
  "science": "1 sentence maximum. The neuroscience — but spoken like a person, not a textbook. Only include if it genuinely adds warmth or understanding.",
  "koshaInsight": "",
  "hope": "1 sentence. Not optimism — truth. Something that is genuinely true even in this moment that they cannot currently see."
}`;
  }

  if (step === "execute") {
    userPrompt = `Someone is going through this:
"${situation}"

They are feeling: "${emotion}"

${intakeContext}

You are at the E step — offering one small, specific, behavioural action that flows naturally from what they've shared. Not a task. Not homework. The next natural move for this specific human in this specific situation.

No writing tasks. No journaling. Something real they could do in the next hour.
${intake.intensity >= 8 ? "Very high distress — keep the action tiny and gentle." : ""}

Respond ONLY with this JSON:
{
  "actions": [
    "First action — specific to their situation, behavioral, gentle, doable in an hour",
    "Second action — different approach, equally specific",
    "Third action — another option"
  ],
  "framing": "1 sentence spoken like a real person — why this one small thing matters right now. Warm. Not motivational-poster language."
}`;
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 1200,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error("Anthropic error:", err);
      return res.status(500).json({ error: "AI unavailable", fallback: true });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";
    const clean = text.replace(/```json|```/g, "").trim();

    try {
      const parsed = JSON.parse(clean);
      return res.status(200).json({ ok: true, data: parsed });
    } catch {
      console.error("JSON parse failed:", clean);
      return res.status(500).json({ error: "Parse failed", fallback: true });
    }
  } catch (err) {
    console.error("Request failed:", err);
    return res.status(500).json({ error: "Request failed", fallback: true });
  }
}
