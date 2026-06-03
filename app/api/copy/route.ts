import { NextRequest, NextResponse } from 'next/server';
import { getRequestTicket, ticketFromRequest } from '@/lib/wadi-ticket';
import { callGemini, responseText, WadiProxyError, proxyErrorBody } from '@/lib/wadi-ai';
import type { BrandProfile, CopyContent } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface CopyBody {
  brandProfile: BrandProfile;
  logoBase64?: string;
  logoMimeType?: string;
}

function stripJsonFences(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenceMatch) return fenceMatch[1].trim();
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }
  return trimmed;
}

export async function POST(req: NextRequest) {
  try {
    const ticket = await getRequestTicket(req);
    if (!ticket) {
      return NextResponse.json({ error: 'Open this tool from Wadi' }, { status: 401 });
    }
    const token = ticketFromRequest(req) as string;

    const body = (await req.json()) as CopyBody;
    const { brandProfile, logoBase64, logoMimeType } = body;
    if (!brandProfile) {
      return NextResponse.json({ error: 'Missing brandProfile' }, { status: 400 });
    }

    const palette = brandProfile.palette ?? [];
    const p0 = palette[0] ?? '#C9A84C';
    const p1 = palette[1] ?? '#1A1714';
    const p2 = palette[2] ?? '#F5F0E8';
    const p3 = palette[3] ?? '#8A6B2E';
    const brandName = brandProfile.brandName?.trim() || 'Brand';

    const prompt = `You are an art director at a luxury branding studio (think Pentagram, Base Design, Collins). You are writing the copy for an editorial brand book — not a corporate guideline document.

Brand context:
- Name: ${brandName}
- Style: ${brandProfile.style}
- Tone: ${brandProfile.tone}
- Personality: ${brandProfile.personality}
- Materials: ${(brandProfile.materials ?? []).join(', ')}
- Primary palette: ${p0}, ${p1}, ${p2}, ${p3}

VOICE RULES — read carefully, every line is enforced:
- Editorial, restrained, atmospheric. Like a fashion magazine, not a pitch deck.
- NEVER use the formula "[object] embodies/reflects/communicates [concept] through [feature]". This is the AI tell. Reject it.
- NEVER explain what something "is" or "does". Imply. Suggest. Trust the reader.
- Fragments beat sentences. A single noun phrase can carry a slide.
- No corporate vocabulary: avoid "leverage", "communicate", "premium", "elevate", "sophisticated", "iconic", "elegant" used as filler.
- Strict word counts. Each field below names a max. Going over breaks the layout — be ruthless.
- Vary rhythm between fields. Do not start every line with "A ..." or "The ...".
- No periods inside fragments. One full stop max per line, only if needed.
- No emojis. No markdown. No "—" decorative dashes inside short fragments.

Return ONLY valid JSON, no preamble, with this exact structure:
{
  "logoObjective": {
    "headline": "3–6 word editorial fragment that names what the mark holds. Examples: 'A quiet authority.' / 'Heritage, in lowercase.' / 'Restraint, drawn by hand.'",
    "statement": "One sentence, 12 words max. What the mark stands for, said once, without justification."
  },
  "strategicIntent": {
    "pillars": [
      { "word": "One word", "line": "5–9 words. A stance, not an explanation." },
      { "word": "One word", "line": "5–9 words. Different rhythm from the first." },
      { "word": "One word", "line": "5–9 words. Quieter than the others." }
    ]
  },
  "primaryColor": {
    "colorName": "A poetic 2–3 word name for ${p0} (e.g. 'Carthage Gold', 'Atlas Brass', 'Vellum Ochre'). Place-based or material-based, not adjective-based.",
    "line": "10 words max. The color's character, said as a fragment if possible."
  },
  "palette": {
    "colors": [
      { "hex": "${p1}", "name": "2–3 word poetic name" },
      { "hex": "${p2}", "name": "2–3 word poetic name" },
      { "hex": "${p3}", "name": "2–3 word poetic name" }
    ]
  },
  "bodyFont": {
    "heading": "A greeting line, 4–6 words. Not 'Welcome to X'. Something like 'Quietly, ${brandName}.' or 'And so, ${brandName}.'",
    "line": "One sentence, 16 words max. A line you might read on the inside flap of a monograph. No sales language."
  },
  "pattern": {
    "line": "One sentence or fragment, 14 words max. How the mark extends, said atmospherically. No 'this pattern is...'"
  }
}`;

    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];
    if (logoBase64 && logoMimeType) {
      parts.push({ inlineData: { mimeType: logoMimeType, data: logoBase64 } });
    }
    parts.push({ text: prompt });

    const response = await callGemini(token, {
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts }],
    });

    const raw = responseText(response);
    const cleaned = stripJsonFences(raw);

    let content: CopyContent;
    try {
      content = JSON.parse(cleaned) as CopyContent;
    } catch {
      return NextResponse.json(
        { error: 'Model did not return valid JSON', raw },
        { status: 502 },
      );
    }

    return NextResponse.json({ content });
  } catch (err) {
    if (err instanceof WadiProxyError) {
      const { status, body } = proxyErrorBody(err);
      return NextResponse.json(body, { status });
    }
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
