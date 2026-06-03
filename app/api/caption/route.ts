import { NextRequest, NextResponse } from 'next/server';
import { getGenAI } from '@/lib/genai';
import { getAsset } from '@/lib/assets';
import { getRequestTicket } from '@/lib/wadi';
import type { AssetType, BrandProfile } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 30;

interface CaptionBody {
  assetType: AssetType;
  brandProfile: BrandProfile;
}

const REGISTERS = [
  {
    name: 'fragment',
    direction:
      'A noun-led fragment, 3–7 words, no main verb. Atmospheric. Example shape: "Stone, brass, a held breath."',
  },
  {
    name: 'sensory',
    direction:
      'One sentence, 10–14 words, anchored to a single sensory detail (texture, weight, light, sound). No second clause.',
  },
  {
    name: 'place',
    direction:
      'A short observation set in a place, 5–10 words. Read like a margin note. Example shape: "Read first in the corridor light."',
  },
  {
    name: 'material',
    direction:
      'A material + a single verb, 4–8 words. Process-focused. Example shape: "Letterpress, pressed deep into cotton paper."',
  },
];

function pickRegister(assetType: AssetType): (typeof REGISTERS)[number] {
  let h = 0;
  for (const c of assetType) h = (h * 31 + c.charCodeAt(0)) | 0;
  return REGISTERS[Math.abs(h) % REGISTERS.length];
}

export async function POST(req: NextRequest) {
  try {
    const ticket = await getRequestTicket(req);
    if (!ticket) {
      return NextResponse.json({ error: 'Open this tool from Wadi' }, { status: 401 });
    }

    const body = (await req.json()) as CaptionBody;
    const { assetType, brandProfile } = body;
    if (!assetType || !brandProfile) {
      return NextResponse.json({ error: 'Missing assetType or brandProfile' }, { status: 400 });
    }
    const meta = getAsset(assetType);
    if (!meta) {
      return NextResponse.json({ error: `Unknown asset type: ${assetType}` }, { status: 400 });
    }

    const register = pickRegister(assetType);
    const materials = (brandProfile.materials ?? []).slice(0, 2).join(', ');

    const prompt = `You are an art director writing a single caption beside an image of a ${meta.label} in a luxury brand book.

Voice: editorial, restrained, atmospheric. Like a fashion magazine margin, not a product description.

Hard rules:
- NEVER write "The ${meta.label} embodies/reflects/communicates/captures...". This is forbidden.
- NEVER explain what the object "is for" or "represents".
- NEVER use the words: premium, elegant, sophisticated, luxurious, iconic, timeless, signature.
- No adjective chains. No "and" lists.
- One line only. No line breaks.
- No quotation marks. No emojis. No trailing period unless the line is a full sentence.

Register for this caption: ${register.direction}

Context (use sparingly — do not list materials, do not name the brand):
- Brand tone: ${brandProfile.tone}
${materials ? `- Materials present: ${materials}` : ''}

Return only the caption itself. Nothing else. No label, no prefix.`;

    const ai = getGenAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const description = (response.text ?? '')
      .trim()
      .replace(/^["“”']+|["“”']+$/g, '')
      .trim();
    if (!description) {
      return NextResponse.json({ error: 'Empty caption' }, { status: 502 });
    }
    return NextResponse.json({ description });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
