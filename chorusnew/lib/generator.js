import { norm } from "./prompts";

// The auto-generator. AI mode (if OPENAI_API_KEY / ANTHROPIC_API_KEY is set)
// invents new questions; otherwise it draws from this built-in bank. Every
// answer must be a SINGLE WORD so players can type it.

const TEMPLATE_BANK = [
  {q:"The best type of weather?",o:[{l:"Sunny",k:"sunny",w:34},{l:"Cool",k:"cool",w:24},{l:"Rainy",k:"rainy",w:18},{l:"Cloudy",k:"cloudy",w:14},{l:"Snowy",k:"snowy",w:10}]},
  {q:"The best superpower for travel?",o:[{l:"Teleportation",k:"teleportation",w:52},{l:"Flying",k:"flying",w:34},{l:"Invisibility",k:"invisibility",w:14}]},
  {q:"The most overrated food?",o:[{l:"Sushi",k:"sushi",w:24},{l:"Salad",k:"salad",w:22},{l:"Steak",k:"steak",w:20},{l:"Caviar",k:"caviar",w:18},{l:"Avocado",k:"avocado",w:16}]},
  {q:"The best pizza chain?",o:[{l:"Domino's",k:"dominos",w:44},{l:"Pizza Hut",k:"pizzahut",w:34},{l:"Papa John's",k:"papajohns",w:22}]},
  {q:"The best chocolate bar?",o:[{l:"KitKat",k:"kitkat",w:28},{l:"Snickers",k:"snickers",w:24},{l:"Twix",k:"twix",w:18},{l:"Bounty",k:"bounty",w:16},{l:"Mars",k:"mars",w:14}]},
  {q:"The worst thing to run out of?",o:[{l:"Battery",k:"battery",w:32,a:["charge"]},{l:"WiFi",k:"wifi",w:26,a:["internet","data"]},{l:"Money",k:"money",w:20},{l:"Coffee",k:"coffee",w:12},{l:"Snacks",k:"snacks",w:10}]},
  {q:"The best kind of milk?",o:[{l:"Dairy",k:"dairy",w:44,a:["regular"]},{l:"Almond",k:"almond",w:20},{l:"Oat",k:"oat",w:18},{l:"Soy",k:"soy",w:12},{l:"Coconut",k:"coconut",w:6}]},
  {q:"The best time to exercise?",o:[{l:"Morning",k:"morning",w:44},{l:"Evening",k:"evening",w:34},{l:"Afternoon",k:"afternoon",w:12},{l:"Night",k:"night",w:10}]},
  {q:"The best animal at the zoo?",o:[{l:"Lion",k:"lion",w:24},{l:"Elephant",k:"elephant",w:22},{l:"Monkey",k:"monkey",w:18},{l:"Penguin",k:"penguin",w:16},{l:"Giraffe",k:"giraffe",w:12},{l:"Tiger",k:"tiger",w:8}]},
  {q:"The most useful app?",o:[{l:"WhatsApp",k:"whatsapp",w:26},{l:"Maps",k:"maps",w:24},{l:"YouTube",k:"youtube",w:20},{l:"Gmail",k:"gmail",w:16,a:["email"]},{l:"Notes",k:"notes",w:14}]},
  {q:"The best pizza dip?",o:[{l:"Garlic",k:"garlic",w:34},{l:"Ranch",k:"ranch",w:26},{l:"Marinara",k:"marinara",w:18},{l:"Cheese",k:"cheese",w:14},{l:"BBQ",k:"bbq",w:8}]},
  {q:"The best flower?",o:[{l:"Rose",k:"rose",w:38},{l:"Tulip",k:"tulip",w:20},{l:"Sunflower",k:"sunflower",w:18},{l:"Lily",k:"lily",w:14},{l:"Orchid",k:"orchid",w:10}]},
  {q:"The best sport to watch?",o:[{l:"Football",k:"football",w:30,a:["soccer"]},{l:"Cricket",k:"cricket",w:22},{l:"Basketball",k:"basketball",w:18},{l:"Tennis",k:"tennis",w:16},{l:"Boxing",k:"boxing",w:8},{l:"Racing",k:"racing",w:6}]},
  {q:"The best planet?",o:[{l:"Earth",k:"earth",w:34},{l:"Saturn",k:"saturn",w:24},{l:"Mars",k:"mars",w:20},{l:"Jupiter",k:"jupiter",w:14},{l:"Neptune",k:"neptune",w:8}]},
  {q:"The best kind of bread?",o:[{l:"Garlic",k:"garlic",w:28},{l:"Sourdough",k:"sourdough",w:22},{l:"Baguette",k:"baguette",w:18},{l:"Naan",k:"naan",w:18},{l:"Rye",k:"rye",w:8},{l:"White",k:"white",w:6}]},
  {q:"The best way to say goodbye?",o:[{l:"Bye",k:"bye",w:34},{l:"Later",k:"later",w:24},{l:"Wave",k:"wave",w:20},{l:"Peace",k:"peace",w:12},{l:"Cya",k:"cya",w:10,a:["seeya"]}]},
  {q:"The best kind of cheese?",o:[{l:"Cheddar",k:"cheddar",w:30},{l:"Mozzarella",k:"mozzarella",w:26},{l:"Parmesan",k:"parmesan",w:18},{l:"Gouda",k:"gouda",w:14},{l:"Feta",k:"feta",w:12}]},
  {q:"The best superhero power?",o:[{l:"Flight",k:"flight",w:28},{l:"Strength",k:"strength",w:22},{l:"Speed",k:"speed",w:20},{l:"Telepathy",k:"telepathy",w:16},{l:"Healing",k:"healing",w:14}]},
  {q:"The best thing about summer?",o:[{l:"Holidays",k:"holidays",w:32,a:["vacation"]},{l:"Beach",k:"beach",w:24},{l:"Icecream",k:"icecream",w:18},{l:"Swimming",k:"swimming",w:16},{l:"Sun",k:"sun",w:10}]},
  {q:"The best drink at a party?",o:[{l:"Beer",k:"beer",w:30},{l:"Cola",k:"cola",w:22,a:["coke"]},{l:"Juice",k:"juice",w:18},{l:"Water",k:"water",w:16},{l:"Cocktail",k:"cocktail",w:14}]},
];

function prep(item) {
  if (!item || !item.q || !Array.isArray(item.o) || item.o.length < 3) return null;
  const o = item.o.slice(0, 6).map((x) => ({
    l: String(x.l || "").trim().split(/\s+/)[0].slice(0, 24), // force one word
    k: x.k ? norm(x.k) : norm(x.l),
    w: Math.max(1, Math.round(Number(x.w) || 10)),
    a: Array.isArray(x.a) ? x.a.map((s) => String(s).slice(0, 30)) : [],
  })).filter((x) => x.l && x.k);
  if (o.length < 3) return null;
  return { q: String(item.q).slice(0, 120), o };
}

export function fallbackGenerate(n, existingQuestions = []) {
  const taken = new Set(existingQuestions.map((q) => norm(q)));
  const pool = TEMPLATE_BANK.filter((t) => !taken.has(norm(t.q)));
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  return pool.slice(0, n).map(prep).filter(Boolean);
}

async function llmGenerate(n, existingQuestions = []) {
  const sys = `You generate questions for a daily "guess what the crowd said" party game.
Return ONLY a JSON array of ${n} objects, no prose. Each object:
{"q":"<a short, globally-relatable opinion question — no region-specific people/places/brands unless world-famous>",
 "o":[{"l":"<ONE-WORD answer>","w":<integer 5-40 popularity weight>,"a":["<optional alias>"]}, ... 4 to 6 answers]}
CRITICAL: every answer label "l" must be a SINGLE WORD (no spaces). Keep it light, fun, safe for all ages; no politics/religion/tragedy. Weights should show a realistic skew (one clear favourite). Avoid these existing questions: ${existingQuestions.slice(0, 60).join(" | ")}`;

  const openai = process.env.OPENAI_API_KEY;
  const anthropic = process.env.ANTHROPIC_API_KEY;
  let text = "";
  if (openai) {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${openai}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [{ role: "system", content: "Output only valid JSON." }, { role: "user", content: sys }],
        temperature: 1,
      }),
    });
    const j = await r.json();
    text = j.choices?.[0]?.message?.content || "";
  } else if (anthropic) {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": anthropic, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest",
        max_tokens: 2000,
        messages: [{ role: "user", content: sys }],
      }),
    });
    const j = await r.json();
    text = j.content?.[0]?.text || "";
  } else {
    return [];
  }
  const m = text.match(/\[[\s\S]*\]/);
  if (!m) return [];
  const arr = JSON.parse(m[0]);
  return (Array.isArray(arr) ? arr : []).map(prep).filter(Boolean);
}

export async function generateQuestions(n, existingQuestions = []) {
  if (process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY) {
    try {
      const items = await llmGenerate(n, existingQuestions);
      if (items.length) return { source: "ai", items };
    } catch (e) { /* fall through */ }
  }
  return { source: "template", items: fallbackGenerate(n, existingQuestions) };
}
