'use client';

import { getAsset } from '@/lib/assets';
import type { AssetJob, AssetStatus } from '@/lib/types';

const LABEL: Record<AssetStatus, string> = {
  queued: 'Waiting',
  generating: 'Rendering…',
  captioning: 'Inscribing…',
  done: '✓',
  error: 'Error',
};

interface Props {
  jobs: AssetJob[];
}

export function AssetQueue({ jobs }: Props) {
  return (
    <ul className="card divide-y divide-goldline/40">
      {jobs.map((job) => (
        <li
          key={job.type}
          className="flex items-center justify-between px-4 py-3"
        >
          <span className="font-display">{getAsset(job.type).label}</span>
          <span className={`text-sm queue-status-${job.status}`}>
            {LABEL[job.status]}
          </span>
        </li>
      ))}
    </ul>
  );
}
