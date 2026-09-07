exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method tidak diizinkan." })
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { systemPrompt, userQuery } = body;

    if (!systemPrompt || !userQuery) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Prompt tidak lengkap." })
      };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "GEMINI_API_KEY belum dikonfigurasi di Netlify."
        })
      };
    }

    const model = process.env.GEMINI_MODEL || "gemini-flash-latest";
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/` +
      `${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const payload = {
      contents: [{ parts: [{ text: userQuery }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] }
    };

    const delays = [1000, 2000, 4000];
    let response;

    for (let attempt = 0; attempt <= delays.length; attempt++) {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) break;

      if (attempt < delays.length) {
        await new Promise(resolve => setTimeout(resolve, delays[attempt]));
      }
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: data?.error?.message || `Gemini API error ${response.status}`
        })
      };
    }

    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("") || "";

    if (!text) {
      return {
        statusCode: 502,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Respon Gemini kosong." })
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Terjadi kesalahan pada server." })
    };
  }
};
