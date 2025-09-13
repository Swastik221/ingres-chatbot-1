import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "Missing 'query' string in request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY is not configured on the server" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Grounded system-style preface for groundwater/INGRES context
    const systemPreface = [
      "You are INGRES AI, an assistant for groundwater analysis in India.",
      "Follow these rules:",
      "- Answer clearly and concisely in professional tone.",
      "- Prefer structured markdown with headings and bullet points.",
      "- When possible, include: status, key metrics, trends, and recommendations.",
      "- If user asks for charts/maps, describe what to plot and the required fields.",
      "- If data is missing, explain assumptions and suggest how to retrieve from INGRES database.",
      "- Avoid fabricating exact figures; if uncertain, provide qualitative guidance.",
    ].join("\n");

    const composedPrompt = `${systemPreface}\n\nUser query:\n${query}`;

    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

    const geminiRes = await fetch(`${url}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: composedPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          topP: 0.9,
          topK: 40,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text();
      return new Response(JSON.stringify({ error: `Gemini API error: ${geminiRes.status}`, details: errorText }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = (await geminiRes.json()) as any;
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!text) {
      return new Response(JSON.stringify({ error: "Empty response from Gemini" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    const payload = {
      query,
      response: {
        type: "text",
        data: null,
        summary: text,
      },
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: "Unexpected server error", details: err?.message || String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}