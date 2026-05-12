'use client';

import type { BrandProfile } from '@/lib/types';

interface Props {
  profile: BrandProfile;
}

export function BrandProfileCard({ profile }: Props) {
  return (
    <div className="card p-6 space-y-5">
      <div>
        <p className="text-xs uppercase tracking-wider text-muted mb-2">Brand profile</p>
        <p className="font-display text-2xl">{profile.style}</p>
        <p className="text-muted italic">{profile.personality}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <Field label="Tone" value={profile.tone} />
        <Field label="Environment" value={profile.environment} />
        <Field label="Lighting" value={profile.lighting} />
        <Field label="Materials" value={profile.materials?.join(', ') ?? '—'} />
      </div>

      <div>
        <p className="text-xs uppercase tracking-wider text-muted mb-2">Brand palette</p>
        <div className="flex gap-2">
          {profile.palette?.map((hex) => (
            <span
              key={hex}
              className="swatch"
              style={{ background: hex }}
              title={hex}
              aria-label={hex}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
      <p className="text-ink">{value}</p>
    </div>
  );
}
