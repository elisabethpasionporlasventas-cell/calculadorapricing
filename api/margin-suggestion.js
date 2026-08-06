export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método no permitido" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Sin clave configurada: la función responde de forma controlada
    // en lugar de romper la app. Configura ANTHROPIC_API_KEY en Vercel
    // (Project Settings > Environment Variables) para activar la IA.
    res.status(200).json({ error: "La sugerencia de IA no está activada todavía." });
    return;
  }

  try {
    const { prompt } = req.body || {};
    if (!prompt) {
      res.status(400).json({ error: "Falta el prompt" });
      return;
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: "Error al contactar con la IA" });
  }
}
