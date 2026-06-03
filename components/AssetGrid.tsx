'use client';

import { ASSETS } from '@/lib/assets';
import type { AssetType } from '@/lib/types';

interface Props {
  selected: Set<AssetType>;
  onToggle: (t: AssetType) => void;
}

export function AssetGrid({ selected, onToggle }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {ASSETS.map((a) => {
        const isSel = selected.has(a.type);
        return (
          <button
            key={a.type}
            type="button"
            onClick={() => onToggle(a.type)}
            aria-pressed={isSel}
            className={[
              isSel ? 'card-selected' : 'card',
              'p-4 text-left transition-all',
              'flex flex-col items-start gap-2 min-h-[96px]',
            ].join(' ')}
          >
            <span className="font-display text-base text-ink">{a.label}</span>
            <span className="label-micro">{a.aspectRatio}</span>
          </button>
        );
      })}
    </div>
  );
}
