import { GoogleGenAI } from "@google/genai";

export default async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method tidak diizinkan." }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { systemPrompt, userQuery } = body;

    if (!systemPrompt || !userQuery) {
      return new Response(JSON.stringify({ error: "Prompt tidak lengkap." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const ai = new GoogleGenAI({});
    const model = process.env.GEMINI_MODEL || "gemini-flash-latest";

    const attemptTimeoutMs = 25000;
    const maxAttempts = 2;
    const retryDelayMs = 500;
    let lastError;

    const withTimeout = (promise, ms) =>
      Promise.race([
        promise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Permintaan ke Gemini terlalu lama (timeout).")), ms)
        )
      ]);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await withTimeout(
          ai.models.generateContent({
            model,
            contents: userQuery,
            config: { systemInstruction: systemPrompt }
          }),
          attemptTimeoutMs
        );

        const text = response?.text || "";

        if (!text) {
          throw new Error("Respon Gemini kosong.");
        }

        return new Response(JSON.stringify({ text }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      } catch (error) {
        lastError = error;
        if (attempt < maxAttempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
        }
      }
    }

    console.error(lastError);
    return new Response(
      JSON.stringify({
        error: lastError?.message || "Gagal menghasilkan respon dari Gemini."
      }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Terjadi kesalahan pada server." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
