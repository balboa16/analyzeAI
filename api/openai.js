const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-5-mini";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "OpenAI API key is not configured" });
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
    max_tokens: typeof max_tokens === "number" ? max_tokens : 900,
  };

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
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
      res.status(502).json({ error: "Invalid response from OpenAI" });
      return;
    }

    const content = data?.choices?.[0]?.message?.content || "";
    res.status(200).json({ content });
  } catch (error) {
    res.status(500).json({ error: error?.message || "OpenAI request failed" });
  }
}
