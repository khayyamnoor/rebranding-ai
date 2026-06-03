import { NextRequest, NextResponse } from 'next/server';
import { getGenAI } from '@/lib/genai';
import { buildPrompt } from '@/lib/prompts';
import { getAsset } from '@/lib/assets';
import { getRequestTicket } from '@/lib/wadi-ticket';
import type { AssetType, BrandProfile } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 120;

interface GenerateBody {
  assetType: AssetType;
  brandProfile: BrandProfile;
  logoBase64: string;
  logoMimeType: string;
}

export async function POST(req: NextRequest) {
  try {
    const ticket = await getRequestTicket(req);
    if (!ticket) {
      return NextResponse.json({ error: 'Open this tool from Wadi' }, { status: 401 });
    }

    const body = (await req.json()) as GenerateBody;
    const { assetType, brandProfile, logoBase64, logoMimeType } = body;
    if (!assetType || !brandProfile || !logoBase64 || !logoMimeType) {
      return NextResponse.json({ error: 'Missing required field' }, { status: 400 });
    }

    const meta = getAsset(assetType);
    if (!meta) {
      return NextResponse.json({ error: `Unknown asset type: ${assetType}` }, { status: 400 });
    }

    const builtPrompt = buildPrompt(assetType, brandProfile);
    const ai = getGenAI();

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType: logoMimeType, data: logoBase64 } },
            { text: builtPrompt },
          ],
        },
      ],
      config: {
        responseModalities: ['IMAGE'],
        imageConfig: {
          aspectRatio: meta.aspectRatio,
        },
      },
    });

    let imageBase64: string | null = null;
    for (const part of response.candidates?.[0]?.content?.parts ?? []) {
      if (part.inlineData?.data) {
        imageBase64 = part.inlineData.data;
        break;
      }
    }

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'No image returned from model — may have been filtered' },
        { status: 502 },
      );
    }

    return NextResponse.json({ imageBase64 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
