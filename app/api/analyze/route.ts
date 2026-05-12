import { NextRequest, NextResponse } from 'next/server';
import { getGenAI } from '@/lib/genai';
import type { BrandProfile } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are a luxury brand strategist and visual identity expert.
Analyze the uploaded logo and return ONLY valid JSON with no preamble or markdown.
Return exactly this structure:
{
"brandName": "The brand or company name if readable from the logo, otherwise return 'Brand'",
"style": "2-3 word style label e.g. Luxury Minimal",
"tone": "2-3 word tone e.g. Premium Hospitality",
"environment": "3-5 word environment e.g. Five-star spa interior",
"lighting": "3-4 word lighting e.g. Warm cinematic light",
"materials": ["material1", "material2", "material3"],
"palette": ["#hex1", "#hex2", "#hex3", "#hex4"],
"personality": "One sentence brand personality",
"tagline": "A 4-6 word brand tagline in ALL CAPS (e.g. WHERE HERITAGE MEETS EXCELLENCE)"
}`;

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
    const formData = await req.formData();
    const file = formData.get('logo');
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No logo file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = file.type || 'image/png';

    const ai = getGenAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType, data: base64 } },
            { text: SYSTEM_PROMPT },
          ],
        },
      ],
    });

    const raw = response.text ?? '';
    const cleaned = stripJsonFences(raw);

    let profile: BrandProfile;
    try {
      profile = JSON.parse(cleaned) as BrandProfile;
    } catch {
      return NextResponse.json(
        { error: 'Model did not return valid JSON', raw },
        { status: 502 },
      );
    }

    return NextResponse.json({ profile, logoBase64: base64, logoMimeType: mimeType });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
