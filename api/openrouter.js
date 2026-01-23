const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || "xiaomi/mimo-v2-flash:free";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "OpenRouter API key is not configured" });
    return;
  }

  let body = req.body || {};
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }

  const { messages, model, temperature, max_tokens } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "messages is required" });
    return;
  }

  const payload = {
    model: model || DEFAULT_MODEL,
    messages,
    temperature: typeof temperature === "number" ? temperature : 0.2,
    max_tokens: typeof max_tokens === "number" ? max_tokens : 900
  };

  const referer =
    process.env.OPENROUTER_APP_URL ||
    req.headers.origin ||
    req.headers.referer ||
    "https://analyze-ai-six.vercel.app";

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": referer,
        "X-Title": process.env.OPENROUTER_APP_NAME || "AnalizAI"
      },
      body: JSON.stringify(payload)
    });

    const raw = await response.text();
    if (!response.ok) {
      res.status(response.status).send(raw);
      return;
    }

    let data = null;
    try {
      data = JSON.parse(raw);
    } catch {
      res.status(502).json({ error: "Invalid response from OpenRouter" });
      return;
    }

    const content = data?.choices?.[0]?.message?.content || "";
    res.status(200).json({ content });
  } catch (error) {
    res.status(500).json({ error: error?.message || "OpenRouter request failed" });
  }
}
