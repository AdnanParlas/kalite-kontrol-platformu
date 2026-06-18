// ============================================================
// Supabase Edge Function — Gerçek AI (Claude) ile form üretimi ve çeviri
// (OPSİYONEL) Sadece gerçek LLM kullanmak isterseniz kurun.
//
// Kurulum:
//   1) Supabase CLI: https://supabase.com/docs/guides/cli
//   2) supabase functions deploy ai --no-verify-jwt
//   3) Anahtarı gizli olarak ekleyin (asla istemciye koymayın):
//        supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//   4) js/config.js içinde AI_ENDPOINT'i fonksiyon URL'inize ayarlayın:
//        https://<proje>.supabase.co/functions/v1/ai
//
// İstek gövdesi:
//   { "action": "translate", "text": "...", "source": "tr", "target": "zh-CN" }
//   { "action": "generate_form", "product": "...", "controlType": "final", "lang": "tr" }
// ============================================================

const MODEL = "claude-opus-4-8";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function callClaude(system: string, user: string): Promise<string> {
  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) throw new Error("ANTHROPIC_API_KEY ayarlı değil");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "Claude API hatası");
  return (data.content?.[0]?.text || "").trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const body = await req.json();

    if (body.action === "translate") {
      const out = await callClaude(
        "You are a precise translator. Output ONLY the translation, no notes.",
        `Translate from ${body.source} to ${body.target}:\n\n${body.text}`,
      );
      return Response.json({ translatedText: out }, { headers: cors });
    }

    if (body.action === "generate_form") {
      const lang = body.lang === "en" ? "English" : "Turkish";
      const out = await callClaude(
        `You are a quality-control expert. Produce a concise, professional inspection checklist in ${lang}. Use numbered items with [ ] checkboxes and a PASS/FAIL result line. No preamble.`,
        `Product: ${body.product || "-"}\nInspection type: ${body.controlType || "-"}`,
      );
      return Response.json({ text: out }, { headers: cors });
    }

    return Response.json({ error: "unknown action" }, { status: 400, headers: cors });
  } catch (e) {
    return Response.json({ error: String(e?.message || e) }, { status: 500, headers: cors });
  }
});
