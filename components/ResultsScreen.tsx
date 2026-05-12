'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { SlideCard, type Slide } from './SlideCard';
import type { AssetJob, BrandProfile, CopyContent } from '@/lib/types';

interface Props {
  profile: BrandProfile;
  jobs: AssetJob[];
  copyContent: CopyContent | null;
  logoBase64: string | null;
  logoMimeType: string | null;
  onRestart: () => void;
}

export function ResultsScreen({
  profile,
  jobs,
  copyContent,
  logoBase64,
  logoMimeType,
  onRestart,
}: Props) {
  const [generatedAt] = useState(() => new Date());
  const [index, setIndex] = useState(0);
  const [showThumbs, setShowThumbs] = useState(false);
  const [fadeKey, setFadeKey] = useState(0);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const slides = useMemo<Slide[]>(() => {
    const refs = {
      brandProfile: profile,
      logoBase64,
      logoMimeType,
      generatedAt,
    };
    const fixedHead: Slide[] = [
      { kind: 'cover', ...refs },
      { kind: 'atmosphere', ...refs },
      { kind: 'logoObjective', ...refs, content: copyContent?.logoObjective },
      { kind: 'mark', ...refs },
      { kind: 'strategicIntent', ...refs, content: copyContent?.strategicIntent },
      { kind: 'safeZone', ...refs },
      { kind: 'primaryColor', ...refs, content: copyContent?.primaryColor },
      { kind: 'palette', ...refs, content: copyContent?.palette },
      { kind: 'displayFont', ...refs },
      { kind: 'bodyFont', ...refs, content: copyContent?.bodyFont },
      { kind: 'pattern', ...refs, content: copyContent?.pattern },
    ];
    const assetSlides: Slide[] = jobs.map((j) => ({
      kind: 'assetApplication',
      ...refs,
      assetType: j.type,
      imageBase64: j.imageBase64,
      description: j.description,
    }));
    const closing: Slide = { kind: 'closing', ...refs };
    const interlude: Slide[] = assetSlides.length > 0 ? [{ kind: 'interlude', ...refs }] : [];
    return [...fixedHead, ...interlude, ...assetSlides, closing];
  }, [profile, jobs, copyContent, logoBase64, logoMimeType, generatedAt]);

  useEffect(() => {
    if (index >= slides.length) setIndex(Math.max(0, slides.length - 1));
  }, [slides.length, index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight')
        setIndex((i) => Math.min(slides.length - 1, i + 1));
      else if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [slides.length]);

  useEffect(() => {
    setFadeKey((k) => k + 1);
  }, [index]);

  const goPrev = () => setIndex((i) => Math.max(0, i - 1));
  const goNext = () => setIndex((i) => Math.min(slides.length - 1, i + 1));
  const exportPDF = () => window.print();

  const atFirst = index === 0;
  const atLast = index === slides.length - 1;
  const current = slides[index];

  return (
    <>
      <div
        className="screen-presentation min-h-screen flex flex-col"
        style={{ background: '#0B0907' }}
      >
        <header className="export-btn flex items-center justify-between px-6 md:px-10 pt-6">
          <button
            onClick={onRestart}
            className="btn-ghost text-sm"
            style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.18)' }}
          >
            ← Start over
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowThumbs((s) => !s)}
              className="btn-ghost text-sm"
              style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.18)' }}
            >
              {showThumbs ? 'Hide thumbnails' : 'View all'}
            </button>
            <button
              onClick={exportPDF}
              className="text-sm"
              style={{
                background: '#C9A84C',
                color: '#fff',
                borderRadius: 10,
                padding: '10px 14px',
                fontWeight: 500,
              }}
            >
              Export PDF
            </button>
          </div>
        </header>

        <section className="flex-1 flex items-center justify-center px-6 md:px-10 py-6">
          <div className="w-full" style={{ maxWidth: 'min(1280px, 92vw)' }}>
            <div
              key={fadeKey}
              style={{
                animation: 'fadeIn 200ms ease both',
                boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              {current && <SlideCard slide={current} />}
            </div>
          </div>
        </section>

        <nav
          className="slide-nav flex flex-col items-center gap-3 pb-6"
          style={{ color: '#fff' }}
        >
          {showThumbs && (
            <div
              className="w-full overflow-x-auto px-6 md:px-10 pb-2"
              style={{ scrollbarWidth: 'thin' }}
            >
              <div className="flex gap-3" style={{ minWidth: 'max-content' }}>
                {slides.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setIndex(i)}
                    style={{
                      width: 160,
                      flex: '0 0 auto',
                      border:
                        i === index
                          ? '1.5px solid #C9A84C'
                          : '1px solid rgba(255,255,255,0.15)',
                      borderRadius: 4,
                      overflow: 'hidden',
                      background: '#000',
                      cursor: 'pointer',
                    }}
                    aria-label={`Jump to slide ${i + 1}`}
                  >
                    <SlideCard slide={s} />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-6">
            <button
              onClick={goPrev}
              disabled={atFirst}
              aria-label="Previous slide"
              style={{
                width: 40,
                height: 40,
                borderRadius: 9999,
                border: '1px solid rgba(255,255,255,0.18)',
                color: atFirst ? 'rgba(255,255,255,0.25)' : '#fff',
                background: 'transparent',
                cursor: atFirst ? 'not-allowed' : 'pointer',
                fontSize: 18,
              }}
            >
              ←
            </button>
            <span
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 13,
                letterSpacing: '0.04em',
                color: '#cfc8be',
                minWidth: 60,
                textAlign: 'center',
              }}
            >
              {index + 1} / {slides.length}
            </span>
            <button
              onClick={goNext}
              disabled={atLast}
              aria-label="Next slide"
              style={{
                width: 40,
                height: 40,
                borderRadius: 9999,
                border: '1px solid rgba(255,255,255,0.18)',
                color: atLast ? 'rgba(255,255,255,0.25)' : '#fff',
                background: 'transparent',
                cursor: atLast ? 'not-allowed' : 'pointer',
                fontSize: 18,
              }}
            >
              →
            </button>
          </div>
        </nav>
      </div>

      {mounted &&
        createPortal(
          <div id="print-container" aria-hidden="true">
            {slides.map((s, i) => (
              <div className="slide-print" key={i}>
                <SlideCard slide={s} />
              </div>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
