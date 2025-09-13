import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

// System prompt tailored for INGRES AI groundwater assistant
const SYSTEM_PROMPT = `You are INGRES AI, a concise, expert assistant on India's groundwater.
- Be accurate, neutral, and cite assumptions when data is unknown.
- Prefer structured, scannable answers with headings, bullets, and key metrics.
- If the user asks for groundwater insights, analyze likely factors (recharge, extraction, trends, risk levels) and provide actionable recommendations.
- If specific regional data is unavailable, say so clearly and suggest what to ask next.
- Keep responses under 300-500 words unless the user requests more detail.`;

export async function POST(req: NextRequest) {
  try {
    const { query, context } = await req.json().catch(() => ({}));
    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Missing 'query' in request body" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server is missing GEMINI_API_KEY" },
        { status: 500 }
      );
    }

    // Build a single user message that includes system guidance + user query + lightweight context
    const composedPrompt = [
      `System Instruction:\n${SYSTEM_PROMPT}`,
      context ? `Context (untrusted, optional):\n${JSON.stringify(context)}` : null,
      `User Query:\n${query}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const resp = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
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
        safetySettings: [
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        ],
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return NextResponse.json(
        { error: `Gemini API error: ${resp.status} ${text}` },
        { status: 502 }
      );
    }

    const data = (await resp.json()) as any;
    const parts: string[] =
      data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text).filter(Boolean) || [];
    const text = parts.join("\n\n").trim();

    if (!text) {
      return NextResponse.json(
        { error: "Gemini returned empty response" },
        { status: 502 }
      );
    }

    return NextResponse.json({ text });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Unexpected server error" },
      { status: 500 }
    );
  }
}