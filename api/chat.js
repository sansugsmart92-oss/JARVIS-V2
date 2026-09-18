module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const { message } = req.body || {};

    if (!message) {
      return res.status(400).json({ error: "Mensagem vazia" });
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/interactions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY,
          "Api-Revision": "2026-05-20"
        },
        body: JSON.stringify({
          model: "gemini-3.6-flash",
          input: message,
          tools: [
            {
              type: "google_search"
            }
          ],
          system_instruction:
            "Você é JARVIS, assistente pessoal da Site Fácil TO. Responda em português do Brasil, naturalmente, de forma objetiva e útil. Use Google Search quando a pergunta exigir informação atual, como placares, notícias, preços, clima, horários e acontecimentos recentes. Não invente dados."
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Erro Gemini:", data);

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          data?.message ||
          "Erro na API do Gemini"
      });
    }

    let reply = data?.output_text || "";

    if (!reply && Array.isArray(data?.steps)) {
      reply = data.steps
        .filter((step) => step.type === "model_output")
        .flatMap((step) =>
          Array.isArray(step.content) ? step.content : []
        )
        .filter((content) => content.type === "text")
        .map((content) => content.text || "")
        .join("")
        .trim();
    }

    const sources = [];

    if (Array.isArray(data?.steps)) {
      for (const step of data.steps) {
        if (
          step.type === "model_output" &&
          Array.isArray(step.content)
        ) {
          for (const content of step.content) {
            if (Array.isArray(content.annotations)) {
              for (const annotation of content.annotations) {
                if (
                  annotation.type === "url_citation" &&
                  (annotation.title || annotation.url)
                ) {
                  sources.push(
                    annotation.title || annotation.url
                  );
                }
              }
            }
          }
        }
      }
    }

    return res.status(200).json({
      reply: reply || "Não consegui gerar uma resposta.",
      sources: [...new Set(sources)].slice(0, 3)
    });

  } catch (error) {
    console.error("Erro interno:", error);

    return res.status(500).json({
      error: "Erro interno no cérebro do JARVIS."
    });
  }
};
