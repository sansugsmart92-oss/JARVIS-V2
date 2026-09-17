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
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: "Você é JARVIS, um assistente pessoal inteligente. Responda sempre em português do Brasil, de forma natural, útil e objetiva."
              }
            ]
          },
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: message
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || "Erro na API do Gemini"
      });
    }

    const reply = data?.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("")
      .trim();

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
