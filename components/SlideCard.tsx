'use client';

import type { ReactNode } from 'react';
import { getAsset } from '@/lib/assets';
import { isSystemAsset } from '@/lib/types';
import type {
  AssetType,
  BrandProfile,
  ColorEntry,
  CopyContent,
} from '@/lib/types';

const SERIF = '"Playfair Display", serif';
const SANS = '"DM Sans", sans-serif';
const GOLD = '#C9A84C';
const BG = '#FDFAF5';
const SAND = '#F5F0E8';
const INK = '#1A1714';
const MUTED = '#6B6560';

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(v.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function relLum([r, g, b]: [number, number, number]): number {
  const f = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function colorTextOn(hex: string): string {
  try {
    return relLum(hexToRgb(hex)) > 0.55 ? '#1A1714' : '#FFFFFF';
  } catch {
    return '#FFFFFF';
  }
}
function monogramDataUrl(letter: string, color: string): string {
  const safe = (letter || 'B').slice(0, 1);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'><text x='30' y='44' text-anchor='middle' font-family='Playfair Display, serif' font-size='40' font-weight='600' font-style='italic' fill='${color}' opacity='0.12'>${safe}</text></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

interface SlideCommonRefs {
  brandProfile: BrandProfile;
  logoBase64: string | null;
  logoMimeType: string | null;
  generatedAt: Date;
}

export type Slide =
  | ({ kind: 'cover' } & SlideCommonRefs)
  | ({ kind: 'atmosphere' } & SlideCommonRefs)
  | ({ kind: 'logoObjective'; content?: CopyContent['logoObjective'] } & SlideCommonRefs)
  | ({ kind: 'mark' } & SlideCommonRefs)
  | ({ kind: 'strategicIntent'; content?: CopyContent['strategicIntent'] } & SlideCommonRefs)
  | ({ kind: 'safeZone' } & SlideCommonRefs)
  | ({ kind: 'primaryColor'; content?: CopyContent['primaryColor'] } & SlideCommonRefs)
  | ({ kind: 'palette'; content?: CopyContent['palette'] } & SlideCommonRefs)
  | ({ kind: 'displayFont' } & SlideCommonRefs)
  | ({ kind: 'bodyFont'; content?: CopyContent['bodyFont'] } & SlideCommonRefs)
  | ({ kind: 'pattern'; content?: CopyContent['pattern'] } & SlideCommonRefs)
  | ({ kind: 'interlude' } & SlideCommonRefs)
  | ({
      kind: 'assetApplication';
      assetType: AssetType;
      imageBase64?: string;
      description?: string;
    } & SlideCommonRefs)
  | ({ kind: 'closing' } & SlideCommonRefs);

interface Props {
  slide: Slide;
}

export function SlideCard({ slide }: Props) {
  switch (slide.kind) {
    case 'cover':
      return <CoverSlide {...slide} />;
    case 'atmosphere':
      return <AtmosphereSlide {...slide} />;
    case 'logoObjective':
      return <LogoObjectiveSlide {...slide} />;
    case 'mark':
      return <MarkSlide {...slide} />;
    case 'strategicIntent':
      return <StrategicIntentSlide {...slide} />;
    case 'safeZone':
      return <SafeZoneSlide {...slide} />;
    case 'primaryColor':
      return <PrimaryColorSlide {...slide} />;
    case 'palette':
      return <PaletteSlide {...slide} />;
    case 'displayFont':
      return <DisplayFontSlide {...slide} />;
    case 'bodyFont':
      return <BodyFontSlide {...slide} />;
    case 'pattern':
      return <PatternSlide {...slide} />;
    case 'interlude':
      return <InterludeSlide {...slide} />;
    case 'assetApplication':
      return <AssetApplicationSlide {...slide} />;
    case 'closing':
      return <ClosingSlide {...slide} />;
  }
}

function logoSrc(b64: string | null, mt: string | null): string | null {
  if (!b64 || !mt) return null;
  return `data:${mt};base64,${b64}`;
}

function brandNameOf(p: BrandProfile): string {
  return p.brandName?.trim() || 'Brand';
}

function SlideShell({
  background = BG,
  children,
  goldRule = true,
}: {
  background?: string;
  children: ReactNode;
  goldRule?: boolean;
}) {
  return (
    <div
      style={{
        aspectRatio: '16 / 9',
        background,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {children}
      {goldRule && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 2,
            background: GOLD,
          }}
        />
      )}
    </div>
  );
}

function SectionLabel({ category, sub }: { category: string; sub: string }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <p
        style={{
          fontFamily: SERIF,
          fontStyle: 'italic',
          fontWeight: 700,
          fontSize: '0.85rem',
          color: INK,
          marginBottom: '0.15rem',
        }}
      >
        {category}
      </p>
      <p
        style={{
          fontFamily: SERIF,
          fontStyle: 'italic',
          fontWeight: 400,
          fontSize: '0.75rem',
          color: MUTED,
        }}
      >
        {sub}
      </p>
    </div>
  );
}

function TypeSpecimenCredit({ label, family }: { label: string; family: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
      <div>
        <p
          style={{
            fontFamily: SANS,
            fontSize: 9,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: MUTED,
            marginBottom: '0.15rem',
          }}
        >
          {label}
        </p>
        <p
          style={{
            fontFamily: SANS,
            fontSize: 10,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: INK,
          }}
        >
          {family}
        </p>
      </div>
      <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.25)', minWidth: 80 }} />
    </div>
  );
}

function Skeleton({ height = '0.7rem', width = '100%' }: { height?: string; width?: string }) {
  return (
    <div
      style={{
        height,
        width,
        background: 'rgba(201, 168, 76, 0.15)',
        borderRadius: 3,
        animation: 'pulse 1.4s ease-in-out infinite',
      }}
    />
  );
}

function SkeletonBlock({ lines = 3 }: { lines?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? '70%' : '100%'} />
      ))}
    </div>
  );
}

/* ---------- Slide 1: Cover ---------- */
function CoverSlide({ brandProfile, logoBase64, logoMimeType, generatedAt }: SlideCommonRefs) {
  const name = brandNameOf(brandProfile);
  const src = logoSrc(logoBase64, logoMimeType);
  const accent = brandProfile.palette?.[0] || GOLD;
  const dateStr = generatedAt.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  return (
    <SlideShell background="#FFFFFF" goldRule={false}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.4rem',
        }}
      >
        {src ? (
          // Supplied logo IS the mark — show it large, suppress the generated wordmark.
          <img
            src={src}
            alt=""
            style={{
              width: '38%',
              maxWidth: 380,
              maxHeight: 200,
              objectFit: 'contain',
            }}
          />
        ) : (
          // No logo provided — fall back to the generated wordmark.
          <h1
            style={{
              fontFamily: SERIF,
              fontWeight: 700,
              fontSize: 80,
              lineHeight: 1,
              color: '#1A1714',
              margin: 0,
              textAlign: 'center',
              letterSpacing: '-0.01em',
            }}
          >
            {name}
          </h1>
        )}
        <p
          style={{
            fontFamily: SANS,
            fontSize: 10,
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            color: accent,
            margin: 0,
            textAlign: 'center',
          }}
        >
          {name}
        </p>
      </div>
      <span
        style={{
          position: 'absolute',
          bottom: 40,
          left: 48,
          fontFamily: SANS,
          fontSize: 10,
          letterSpacing: '0.32em',
          color: '#9A9A9A',
          textTransform: 'uppercase',
        }}
      >
        Brand Identity
      </span>
      <span
        style={{
          position: 'absolute',
          bottom: 40,
          right: 48,
          fontFamily: SANS,
          fontSize: 10,
          letterSpacing: '0.32em',
          color: '#9A9A9A',
          textTransform: 'uppercase',
        }}
      >
        {dateStr}
      </span>
    </SlideShell>
  );
}

/* ---------- Atmosphere: personality line alone, near-silent ---------- */
function AtmosphereSlide({ brandProfile }: SlideCommonRefs) {
  // Source the atmosphere line from `personality` so it doesn't duplicate the
  // tagline (which lives on DisplayFontSlide as the type-specimen hero).
  const raw = (brandProfile.personality || brandProfile.tone || '').trim();
  const accent = brandProfile.palette?.[0] || GOLD;
  return (
    <SlideShell background={INK} goldRule={false}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '4rem 4rem 3rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
        }}
      >
        {raw ? (
          <h1
            style={{
              fontFamily: SERIF,
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: 'clamp(36px, 4.6vw, 64px)',
              lineHeight: 1.05,
              letterSpacing: '-0.005em',
              color: '#F5F0E8',
              margin: 0,
              maxWidth: '70%',
              textTransform: 'none',
            }}
          >
            {raw}
          </h1>
        ) : null}
        <span
          style={{
            position: 'absolute',
            top: '3rem',
            left: '4rem',
            fontFamily: SANS,
            fontSize: 10,
            letterSpacing: '0.32em',
            color: accent,
            textTransform: 'uppercase',
          }}
        >
          —
        </span>
      </div>
    </SlideShell>
  );
}

/* ---------- Mark: logo alone, no copy, breathing room ---------- */
function MarkSlide({ logoBase64, logoMimeType }: SlideCommonRefs) {
  const src = logoSrc(logoBase64, logoMimeType);
  return (
    <SlideShell background={SAND} goldRule={false}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {src && (
          <img
            src={src}
            alt=""
            style={{
              width: '32%',
              maxWidth: 260,
              maxHeight: '40%',
              objectFit: 'contain',
            }}
          />
        )}
      </div>
    </SlideShell>
  );
}

/* ---------- Interlude: full-bleed color, near-silent divider ---------- */
function InterludeSlide({ brandProfile }: SlideCommonRefs) {
  const primary = brandProfile.palette?.[0] || GOLD;
  const onColor = colorTextOn(primary);
  return (
    <SlideShell background={primary} goldRule={false}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: NOISE_URL,
          backgroundSize: 'cover',
          mixBlendMode: 'overlay',
          opacity: 0.35,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '3rem 4rem',
          display: 'flex',
          alignItems: 'flex-end',
        }}
      >
        <span
          style={{
            fontFamily: SANS,
            fontSize: 10,
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            color: onColor,
            opacity: 0.7,
          }}
        >
          Applied
        </span>
      </div>
    </SlideShell>
  );
}

/* ---------- Two-panel template (used by most text+logo slides) ---------- */
function TwoPanel({
  left,
  right,
  background = BG,
  split = '40% 60%',
  goldRule = true,
}: {
  left: ReactNode;
  right: ReactNode;
  background?: string;
  split?: string;
  goldRule?: boolean;
}) {
  return (
    <SlideShell background={background} goldRule={goldRule}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          gridTemplateColumns: split,
        }}
      >
        <div style={{ padding: '2.5rem 2rem' }}>{left}</div>
        <div style={{ position: 'relative', overflow: 'hidden' }}>{right}</div>
      </div>
    </SlideShell>
  );
}

function LogoCenter({
  src,
  align = 'center',
  scale = 0.55,
  background = '#FFFFFF',
}: {
  src: string | null;
  big?: boolean;
  align?: 'center' | 'lower-right' | 'upper-left';
  scale?: number;
  background?: string;
}) {
  const alignStyles: Record<string, { ai: string; jc: string; padding: string }> = {
    center: { ai: 'center', jc: 'center', padding: '3rem' },
    'lower-right': { ai: 'flex-end', jc: 'flex-end', padding: '3rem 3.5rem' },
    'upper-left': { ai: 'flex-start', jc: 'flex-start', padding: '3rem 3.5rem' },
  };
  const a = alignStyles[align];
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: a.ai,
        justifyContent: a.jc,
        padding: a.padding,
        background,
      }}
    >
      {src ? (
        <img
          src={src}
          alt=""
          style={{
            width: `${scale * 100}%`,
            maxWidth: 340,
            maxHeight: '70%',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      ) : null}
    </div>
  );
}

function MonogramWatermark({ letter, color }: { letter: string; color: string }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background: SAND,
        overflow: 'hidden',
      }}
    >
      <span
        style={{
          position: 'absolute',
          bottom: '-8%',
          right: '-3%',
          fontFamily: SERIF,
          fontStyle: 'italic',
          fontWeight: 500,
          fontSize: 'clamp(280px, 36vw, 520px)',
          lineHeight: 1,
          color,
          opacity: 0.08,
          letterSpacing: '-0.04em',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {letter}
      </span>
    </div>
  );
}

function assetVariant(t: AssetType): 0 | 1 | 2 {
  let h = 0;
  for (const c of t) h = (h * 31 + c.charCodeAt(0)) | 0;
  return (Math.abs(h) % 3) as 0 | 1 | 2;
}

/* ---------- Slide 2: Logo Objective ---------- */
function LogoObjectiveSlide({
  brandProfile,
  logoBase64,
  logoMimeType,
  content,
}: SlideCommonRefs & { content?: CopyContent['logoObjective'] }) {
  const src = logoSrc(logoBase64, logoMimeType);
  return (
    <TwoPanel
      split="25% 75%"
      left={
        <>
          <SectionLabel category="The Mark" sub="" />
          {content ? (
            <>
              <h2
                style={{
                  fontFamily: SERIF,
                  fontStyle: 'italic',
                  fontWeight: 500,
                  fontSize: 'clamp(22px, 2.4vw, 30px)',
                  lineHeight: 1.15,
                  letterSpacing: '-0.005em',
                  color: INK,
                  margin: '0.4rem 0 1.2rem 0',
                  maxWidth: '94%',
                }}
              >
                {content.headline}
              </h2>
              <p
                style={{
                  fontFamily: SANS,
                  fontSize: 12.5,
                  color: '#3A3A3A',
                  lineHeight: 1.7,
                  maxWidth: '94%',
                }}
              >
                {content.statement}
              </p>
            </>
          ) : (
            <div style={{ marginTop: '0.5rem' }}>
              <SkeletonBlock lines={2} />
            </div>
          )}
        </>
      }
      right={<LogoCenter src={src} align="lower-right" scale={0.42} background={SAND} />}
    />
  );
}

/* ---------- Slide 3: Strategic Intent ---------- */
function StrategicIntentSlide({
  brandProfile,
  content,
}: SlideCommonRefs & { content?: CopyContent['strategicIntent'] }) {
  const pillars = content?.pillars ?? [];
  const initial = (brandNameOf(brandProfile)[0] || 'B').toUpperCase();
  const monoColor = brandProfile.palette?.[0] || GOLD;
  return (
    <TwoPanel
      split="25% 75%"
      left={
        <>
          <SectionLabel category="Intent" sub="" />
          <div style={{ marginTop: '0.5rem' }}>
            {pillars.length > 0
              ? pillars.map((p, i) => (
                  <div
                    key={i}
                    style={{
                      paddingTop: i === 0 ? 0 : '1rem',
                      paddingBottom: '1rem',
                      borderTop: i === 0 ? 'none' : '1px solid rgba(0,0,0,0.08)',
                    }}
                  >
                    <p
                      style={{
                        fontFamily: SERIF,
                        fontStyle: 'italic',
                        fontWeight: 500,
                        fontSize: 18,
                        lineHeight: 1.1,
                        color: INK,
                        marginBottom: '0.3rem',
                      }}
                    >
                      {p.word}
                    </p>
                    <p
                      style={{
                        fontFamily: SANS,
                        fontSize: 12.5,
                        color: '#3A3A3A',
                        lineHeight: 1.6,
                        maxWidth: '94%',
                      }}
                    >
                      {p.line}
                    </p>
                  </div>
                ))
              : [0, 1, 2].map((i) => (
                  <div key={i} style={{ marginBottom: '1.2rem' }}>
                    <SkeletonBlock lines={2} />
                  </div>
                ))}
          </div>
        </>
      }
      right={<MonogramWatermark letter={initial} color={monoColor} />}
    />
  );
}

/* ---------- Slide 4: Safe Zone ---------- */
const GUIDE_PINK = '#E91E78';

function SafeZoneCell({
  src,
  scale,
}: {
  src: string | null;
  scale: number;
}) {
  const corner = (pos: { top?: number; bottom?: number; left?: number; right?: number }) => (
    <span
      style={{
        position: 'absolute',
        ...pos,
        color: GUIDE_PINK,
        fontSize: 10,
        fontFamily: SANS,
        lineHeight: 1,
        zIndex: 2,
      }}
    >
      ×
    </span>
  );
  const stripeStyle = {
    height: 22,
    width: '100%',
    backgroundImage: `repeating-linear-gradient(0deg, ${GUIDE_PINK} 0px, ${GUIDE_PINK} 1px, transparent 1px, transparent 5px)`,
    opacity: 0.8,
  } as const;
  return (
    <div
      style={{
        position: 'relative',
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '4px 4px',
      }}
    >
      {corner({ top: 6, left: 6 })}
      {corner({ top: 6, right: 6 })}
      {corner({ bottom: 6, left: 6 })}
      {corner({ bottom: 6, right: 6 })}
      <div style={stripeStyle} />
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6px 0',
        }}
      >
        {src && (
          <img
            src={src}
            alt=""
            style={{
              width: `${60 * scale}%`,
              maxHeight: '90%',
              objectFit: 'contain',
            }}
          />
        )}
      </div>
      <div style={stripeStyle} />
    </div>
  );
}

function SafeZoneSlide({ brandProfile, logoBase64, logoMimeType }: SlideCommonRefs) {
  const src = logoSrc(logoBase64, logoMimeType);
  return (
    <TwoPanel
      split="25% 75%"
      left={
        <>
          <SectionLabel category="Clear Space" sub="" />
          <h2
            style={{
              fontFamily: SERIF,
              fontStyle: 'italic',
              fontWeight: 500,
              fontSize: 'clamp(22px, 2.4vw, 30px)',
              lineHeight: 1.15,
              color: INK,
              margin: '0.4rem 0 1.2rem 0',
              maxWidth: '94%',
            }}
          >
            Room to breathe.
          </h2>
          <p
            style={{
              fontFamily: SANS,
              fontSize: 12.5,
              color: '#3A3A3A',
              lineHeight: 1.7,
              maxWidth: '94%',
              marginBottom: '1.2rem',
            }}
          >
            Clear space equals the height of the icon (×) on all sides.
          </p>
          <p
            style={{
              fontFamily: SANS,
              fontSize: 10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: MUTED,
            }}
          >
            Minimum &nbsp;·&nbsp; 2cm print &nbsp;·&nbsp; 80px digital
          </p>
        </>
      }
      right={
        <div
          style={{
            width: '100%',
            height: '100%',
            background: '#FFFFFF',
            padding: 24,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: '1fr 1fr',
            gap: 12,
          }}
        >
          <SafeZoneCell src={src} scale={1.0} />
          <SafeZoneCell src={src} scale={0.8} />
          <SafeZoneCell src={src} scale={0.65} />
          <SafeZoneCell src={src} scale={0.5} />
        </div>
      }
    />
  );
}

/* ---------- Slide 5: Primary Color ---------- */
function PrimaryColorSlide({
  brandProfile,
  content,
}: SlideCommonRefs & { content?: CopyContent['primaryColor'] }) {
  const primary = brandProfile.palette?.[0] || GOLD;
  return (
    <TwoPanel
      split="25% 75%"
      left={
        <>
          <SectionLabel category="Primary" sub="" />
          {content ? (
            <>
              <h2
                style={{
                  fontFamily: SERIF,
                  fontStyle: 'italic',
                  fontWeight: 500,
                  fontSize: 'clamp(22px, 2.4vw, 30px)',
                  lineHeight: 1.1,
                  letterSpacing: '-0.005em',
                  color: INK,
                  margin: '0.4rem 0 1.2rem 0',
                }}
              >
                {content.colorName}
              </h2>
              <p
                style={{
                  fontFamily: SANS,
                  fontSize: 12.5,
                  color: '#3A3A3A',
                  lineHeight: 1.7,
                  maxWidth: '92%',
                  marginBottom: '1.2rem',
                }}
              >
                {content.line}
              </p>
              <p
                style={{
                  fontFamily: SANS,
                  fontSize: 10,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: MUTED,
                }}
              >
                {primary.toUpperCase()}
              </p>
            </>
          ) : (
            <div style={{ marginTop: '0.5rem' }}>
              <SkeletonBlock lines={2} />
            </div>
          )}
        </>
      }
      right={
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'row',
          }}
        >
          <ColorPanel hex={primary} label={content?.colorName} />
          <ColorPanel hex={primary} label={content?.colorName} textured />
        </div>
      }
    />
  );
}

const NOISE_URL =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.18'/%3E%3C/svg%3E\")";

function ColorPanel({
  hex,
  label,
  textured = false,
}: {
  hex: string;
  label?: string;
  textured?: boolean;
}) {
  const text = colorTextOn(hex);
  return (
    <div
      style={{
        flex: 1,
        position: 'relative',
        background: hex,
        overflow: 'hidden',
      }}
    >
      {textured && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: NOISE_URL,
            backgroundSize: 'cover',
            mixBlendMode: 'overlay',
            opacity: 0.4,
            pointerEvents: 'none',
          }}
        />
      )}
      <div
        style={{
          position: 'absolute',
          left: 28,
          bottom: 28,
          color: text,
          fontFamily: SERIF,
          fontWeight: 400,
          textTransform: 'uppercase',
          opacity: 0.85,
        }}
      >
        <div style={{ fontSize: 28, lineHeight: 1.1, letterSpacing: '0.04em' }}>
          {label || hex}
        </div>
        <div
          style={{
            fontFamily: SANS,
            fontSize: 10,
            letterSpacing: '0.18em',
            opacity: 0.85,
            marginTop: 6,
          }}
        >
          {hex.toUpperCase()}
        </div>
      </div>
    </div>
  );
}

function ColorStrip({ hex, label }: { hex: string; label?: string }) {
  const text = colorTextOn(hex);
  return (
    <div
      style={{
        flex: 1,
        position: 'relative',
        background: hex,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 22,
          bottom: 24,
          color: text,
          fontFamily: SERIF,
          fontWeight: 400,
          textTransform: 'uppercase',
          opacity: 0.85,
        }}
      >
        <div style={{ fontSize: 22, lineHeight: 1.1, letterSpacing: '0.04em' }}>
          {label || hex}
        </div>
        <div
          style={{
            fontFamily: SANS,
            fontSize: 10,
            letterSpacing: '0.18em',
            opacity: 0.85,
            marginTop: 5,
          }}
        >
          {hex.toUpperCase()}
        </div>
      </div>
    </div>
  );
}

/* ---------- Slide 6: Full Palette ---------- */
function PaletteSlide({
  brandProfile,
  content,
}: SlideCommonRefs & { content?: CopyContent['palette'] }) {
  const palette = brandProfile.palette ?? [];
  const colors: ColorEntry[] =
    content?.colors ?? palette.slice(1, 4).map((hex) => ({ hex, name: hex }));
  return (
    <TwoPanel
      split="25% 75%"
      left={<SectionLabel category="Palette" sub="" />}
      right={
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'row',
          }}
        >
          {colors.map((c, i) => (
            <ColorStrip key={`${c.hex}-${i}`} hex={c.hex} label={c.name} />
          ))}
        </div>
      }
    />
  );
}

/* ---------- Slide 7: Display Font ---------- */
function DisplayFontSlide({ brandProfile }: SlideCommonRefs) {
  const taglineColor = brandProfile.palette?.[1] || INK;
  const taglineRaw = brandProfile.tagline || 'Where heritage meets excellence';
  const tagline =
    taglineRaw === taglineRaw.toUpperCase()
      ? taglineRaw.charAt(0) + taglineRaw.slice(1).toLowerCase()
      : taglineRaw;
  return (
    <SlideShell background={SAND} goldRule={false}>
      <div
        style={{
          position: 'absolute',
          top: '25%',
          left: '6%',
          width: '70%',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.6rem',
        }}
      >
        <TypeSpecimenCredit label="Headlines Font" family="Playfair Display" />
        <h2
          style={{
            fontFamily: SERIF,
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: 'clamp(54px, 6.8vw, 96px)',
            lineHeight: 1.02,
            color: taglineColor,
            margin: 0,
            letterSpacing: '-0.015em',
          }}
        >
          {tagline}
        </h2>
      </div>
    </SlideShell>
  );
}

/* ---------- Slide 8: Body Font ---------- */
function BodyFontSlide({
  content,
}: SlideCommonRefs & { content?: CopyContent['bodyFont'] }) {
  return (
    <SlideShell background={SAND} goldRule={false}>
      <div
        style={{
          position: 'absolute',
          top: '25%',
          left: '6%',
          width: '50%',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.6rem',
        }}
      >
        <TypeSpecimenCredit label="Body Text Font" family="DM Sans" />
        {content ? (
          <>
            <h2
              style={{
                fontFamily: SERIF,
                fontStyle: 'italic',
                fontWeight: 400,
                fontSize: 36,
                color: INK,
                margin: 0,
                letterSpacing: '-0.01em',
                lineHeight: 1.08,
              }}
            >
              {content.heading}
            </h2>
            <p
              style={{
                fontFamily: SANS,
                fontWeight: 400,
                fontSize: 14,
                lineHeight: 1.8,
                color: '#3A3A3A',
                margin: 0,
              }}
            >
              {content.line}
            </p>
          </>
        ) : (
          <SkeletonBlock lines={3} />
        )}
      </div>
    </SlideShell>
  );
}

/* ---------- Slide 9: Pattern ---------- */
function PatternSlide({
  brandProfile,
  content,
}: SlideCommonRefs & { content?: CopyContent['pattern'] }) {
  const monoColor = brandProfile.palette?.[0] || GOLD;
  const initial = (brandNameOf(brandProfile)[0] || 'B').toUpperCase();
  return (
    <TwoPanel
      split="25% 75%"
      left={
        <>
          <SectionLabel category="Pattern" sub="" />
          {content ? (
            <h2
              style={{
                fontFamily: SERIF,
                fontStyle: 'italic',
                fontWeight: 500,
                fontSize: 'clamp(22px, 2.3vw, 30px)',
                lineHeight: 1.2,
                letterSpacing: '-0.005em',
                color: INK,
                margin: '0.4rem 0 0 0',
                maxWidth: '94%',
              }}
            >
              {content.line}
            </h2>
          ) : (
            <div style={{ marginTop: '0.5rem' }}>
              <SkeletonBlock lines={2} />
            </div>
          )}
        </>
      }
      right={
        <div
          style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            backgroundColor: SAND,
            backgroundImage: monogramDataUrl(initial, monoColor),
            backgroundSize: '120px 120px',
            backgroundRepeat: 'repeat',
          }}
        >
          {/* Far-right column-flute: three thin tonal stripes echoing the logo's vertical motif */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              right: 0,
              width: 64,
              display: 'flex',
              flexDirection: 'row',
              gap: 8,
              padding: '0 12px',
              alignItems: 'stretch',
              background: SAND,
            }}
          >
            <div style={{ flex: 1, background: monoColor, opacity: 0.18 }} />
            <div style={{ flex: 1, background: monoColor, opacity: 0.28 }} />
            <div style={{ flex: 1, background: monoColor, opacity: 0.18 }} />
          </div>
        </div>
      }
    />
  );
}

/* ---------- Slides 10–13: Brand Application (image) ---------- */
function AssetApplicationSlide({
  brandProfile,
  assetType,
  imageBase64,
  description,
}: SlideCommonRefs & {
  assetType: AssetType;
  imageBase64?: string;
  description?: string;
}) {
  const meta = getAsset(assetType);
  const category = isSystemAsset(assetType) ? 'Pattern' : 'Application';
  const variant = assetVariant(assetType);

  const Image = ({ cover = true }: { cover?: boolean }) =>
    imageBase64 ? (
      <img
        src={`data:image/png;base64,${imageBase64}`}
        alt={meta.label}
        style={{
          width: '100%',
          height: '100%',
          objectFit: cover ? 'cover' : 'contain',
          display: 'block',
        }}
      />
    ) : (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, rgba(201,168,76,0.18), rgba(201,168,76,0.08))',
          animation: 'pulse 1.4s ease-in-out infinite',
        }}
      />
    );

  const CaptionBlock = ({ onDark = false }: { onDark?: boolean }) => (
    <>
      <p
        style={{
          fontFamily: SANS,
          fontSize: 10,
          letterSpacing: '0.32em',
          textTransform: 'uppercase',
          color: onDark ? 'rgba(255,255,255,0.6)' : MUTED,
          marginBottom: '0.6rem',
        }}
      >
        {category}
      </p>
      <h2
        style={{
          fontFamily: SERIF,
          fontStyle: 'italic',
          fontWeight: 500,
          fontSize: 'clamp(22px, 2.3vw, 30px)',
          lineHeight: 1.1,
          letterSpacing: '-0.005em',
          color: onDark ? '#F5F0E8' : INK,
          margin: 0,
          marginBottom: '1.2rem',
        }}
      >
        {meta.label}
      </h2>
      {description ? (
        <p
          style={{
            fontFamily: SANS,
            fontSize: 13,
            color: onDark ? 'rgba(245,240,232,0.85)' : '#3A3A3A',
            lineHeight: 1.7,
            maxWidth: 380,
          }}
        >
          {description}
        </p>
      ) : (
        <SkeletonBlock lines={1} />
      )}
    </>
  );

  // Variant 0: copy left (35%) / image right (65%) — current
  if (variant === 0) {
    return (
      <SlideShell background={BG}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            gridTemplateColumns: '35% 65%',
          }}
        >
          <div style={{ padding: '2.6rem 2.4rem', position: 'relative' }}>
            <CaptionBlock />
          </div>
          <div style={{ position: 'relative', overflow: 'hidden' }}>
            <Image />
          </div>
        </div>
      </SlideShell>
    );
  }

  // Variant 1: full-bleed image, caption block over a gradient in lower-left
  if (variant === 1) {
    return (
      <SlideShell background={BG} goldRule={false}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <Image />
        </div>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.25) 30%, rgba(0,0,0,0) 55%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '2.6rem',
            bottom: '2.6rem',
            maxWidth: '52%',
          }}
        >
          <CaptionBlock onDark />
        </div>
      </SlideShell>
    );
  }

  // Variant 2: image left (60%) / copy right (40%) — mirrored, with image contain on sand
  return (
    <SlideShell background={SAND}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          gridTemplateColumns: '60% 40%',
        }}
      >
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          <Image />
        </div>
        <div
          style={{
            padding: '2.6rem 2.4rem',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
          }}
        >
          <CaptionBlock />
        </div>
      </div>
    </SlideShell>
  );
}

/* ---------- Slide 14: Closing ---------- */
function ClosingSlide({ brandProfile, generatedAt }: SlideCommonRefs) {
  const name = brandNameOf(brandProfile);
  const tagline = brandProfile.tagline || '';
  const dateStr = generatedAt.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  return (
    <SlideShell background={BG}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '3.5rem 3rem',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
          }}
        >
          <h1
            style={{
              fontFamily: SERIF,
              fontSize: '4rem',
              fontWeight: 700,
              color: INK,
              margin: 0,
              letterSpacing: '-0.01em',
              textAlign: 'center',
            }}
          >
            {name}
          </h1>
          {tagline && (
            <p
              style={{
                fontFamily: SERIF,
                fontStyle: 'italic',
                fontSize: '1rem',
                color: GOLD,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                margin: 0,
              }}
            >
              {tagline}
            </p>
          )}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            color: MUTED,
            fontFamily: SANS,
            fontSize: 10,
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
          }}
        >
          <span>End</span>
          <span>{dateStr}</span>
        </div>
      </div>
    </SlideShell>
  );
}
