export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
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

  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!webhookUrl) {
    console.info("Lead stored locally fallback", body);
    res.status(200).json({ ok: true, forwarded: false });
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const raw = await response.text();
      console.warn("Lead webhook responded with error", raw);
      res.status(200).json({ ok: true, forwarded: false });
      return;
    }

    res.status(200).json({ ok: true, forwarded: true });
  } catch (error) {
    console.warn("Lead webhook request failed", error?.message || error);
    res.status(200).json({ ok: true, forwarded: false });
  }
}
