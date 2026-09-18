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
          "x-goog-api-key": process.env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          model: "gemini-3.6-flash",
          system_instruction:
            "Você é JARVIS, um assistente pessoal inteligente. Responda sempre em português do Brasil, de forma natural, útil e objetiva.",
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

    const reply =
      data?.steps
        ?.filter(step => step.type === "model_output")
        ?.flatMap(step => step.content || [])
        ?.filter(content => content.type === "text")
        ?.map(content => content.text || "")
        ?.join("")
        ?.trim() ||
      data?.output_text ||
      "Não consegui gerar uma resposta.";

    return res.status(200).json({
      reply
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Erro interno no cérebro do JARVIS."
    });
  }
};
