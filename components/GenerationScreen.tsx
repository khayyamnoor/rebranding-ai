'use client';

import { BrandProfileCard } from './BrandProfileCard';
import { ProgressBar } from './ProgressBar';
import { AssetQueue } from './AssetQueue';
import type { AssetJob, BrandProfile } from '@/lib/types';

interface Props {
  profile: BrandProfile | null;
  jobs: AssetJob[];
  onBack: () => void;
}

export function GenerationScreen({ profile, jobs, onBack }: Props) {
  const done = jobs.filter((j) => j.status === 'done').length;
  return (
    <div className="min-h-screen">
      <header className="px-6 md:px-12 pt-8 max-w-6xl mx-auto">
        <button onClick={onBack} className="btn-ghost text-sm">
          ← Back
        </button>
      </header>

      <section className="px-6 md:px-12 py-10 max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          {profile ? (
            <BrandProfileCard profile={profile} />
          ) : (
            <div className="card p-6">
              <p className="text-muted italic font-display text-lg">Reading the mark…</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <ProgressBar value={done} total={jobs.length} />
          <AssetQueue jobs={jobs} />
        </div>
      </section>
    </div>
  );
}
