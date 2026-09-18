module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Método não permitido"
    });
  }

  try {
    const { message } = req.body || {};

    if (!message) {
      return res.status(400).json({
        error: "Mensagem vazia"
      });
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
          input: message
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error:
          data?.error?.message ||
          data?.message ||
          "Erro na API do Gemini"
      });
    }

    let reply = "";

    if (data?.output_text) {
      reply = data.output_text;
    } else if (Array.isArray(data?.steps)) {
      for (const step of data.steps) {
        if (step.type === "model_output" && Array.isArray(step.content)) {
          for (const item of step.content) {
            if (item.type === "text") {
              reply += item.text || "";
            }
          }
        }
      }
    }

    reply = reply.trim();

    return res.status(200).json({
      reply: reply || "Não consegui gerar uma resposta."
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Erro interno no cérebro do JARVIS."
    });
  }
};
