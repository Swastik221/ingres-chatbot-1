// src/app/api/ai/chat/route.ts
import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

// System prompt tailored for INGRES AI groundwater assistant
const SYSTEM_PROMPT = `
You are INGRES AI, a concise, expert assistant on India's groundwater.

- Be accurate, neutral, and cite assumptions when data is missing.
- Prefer structured, scannable answers with headings, bullets, and key metrics.
- If specific regional data is unavailable, say so clearly and suggest what to ask next.
- Keep responses under 300–500 words unless the user requests more detail.

CRITICAL OUTPUT REQUIREMENTS:
- Respond in the SAME LANGUAGE as the user's query.
- Always include a compact JSON block (fenced with \`\`\`json) that front-end can parse for charts and stats.

Example JSON schema (treat as text only, do NOT execute):
\`\`\`json
{
  "language": "en|hi|<other>",
  "explanation": "short, professional text in user's language",
  "stats": [ { "label": "string", "value": 0, "unit": "string" } ],
  "chart": {
    "type": "bar|pie|line",
    "title": "string",
    "xKey": "name",
    "yKey": "value",
    "data": [ { "name": "Region A", "value": 42 } ]
  }
}
\`\`\`
`;

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

    // Build a single composed prompt
    const composedPrompt = `
${SYSTEM_PROMPT}

User query: ${query}

Context (if any): ${context || "N/A"}
`;

    const response = await fetch(
      `${GEMINI_API_URL}?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { role: "user", parts: [{ text: composedPrompt }] },
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API Error:", data);
      return NextResponse.json(
        { error: "Failed to fetch from Gemini API", details: data },
        { status: 500 }
      );
    }

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";

    return NextResponse.json({ text });
  } catch (err: any) {
    console.error("Error in chat route:", err);
    return NextResponse.json(
      { error: "Internal server error", details: err.message },
      { status: 500 }
    );
  }
}