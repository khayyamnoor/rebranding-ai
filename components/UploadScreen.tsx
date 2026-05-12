'use client';

import { useMemo, useState } from 'react';
import { UploadZone } from './UploadZone';
import { AssetGrid } from './AssetGrid';
import type { AssetType } from '@/lib/types';

interface Props {
  onStart: (logo: File, assets: AssetType[]) => void;
}

export function UploadScreen({ onStart }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [selected, setSelected] = useState<Set<AssetType>>(new Set());

  const canGenerate = useMemo(
    () => !!file && selected.size > 0,
    [file, selected],
  );

  const toggle = (t: AssetType) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  };

  return (
    <div className="min-h-screen">
      <section className="px-6 md:px-12 pt-16 md:pt-24 pb-10 max-w-5xl mx-auto">
        <h1
          className="font-display italic text-5xl md:text-7xl leading-[1.02] tracking-tight"
          style={{ letterSpacing: '-0.015em' }}
        >
          Begin with the mark.
        </h1>
        <p className="mt-5 text-muted text-lg max-w-xl">
          A single image. We read it, then build the world it lives in.
        </p>
      </section>

      <section className="px-6 md:px-12 pb-12 max-w-5xl mx-auto space-y-10">
        <div>
          <p
            className="font-display italic text-2xl mb-3"
            style={{ letterSpacing: '-0.005em' }}
          >
            The mark
          </p>
          <UploadZone
            onFile={setFile}
            fileName={file?.name ?? null}
          />
        </div>

        <div>
          <p
            className="font-display italic text-2xl mb-3"
            style={{ letterSpacing: '-0.005em' }}
          >
            The world
          </p>
          <AssetGrid selected={selected} onToggle={toggle} />
        </div>

        <button
          type="button"
          disabled={!canGenerate}
          onClick={() => file && onStart(file, Array.from(selected))}
          className="btn-primary w-full"
        >
          {canGenerate ? 'Begin' : 'A mark, and at least one application'}
        </button>
      </section>
    </div>
  );
}
