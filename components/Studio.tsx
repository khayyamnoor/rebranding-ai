'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { UploadScreen } from '@/components/UploadScreen';
import { GenerationScreen } from '@/components/GenerationScreen';
import { ResultsScreen } from '@/components/ResultsScreen';
import type {
  AssetJob,
  AssetStatus,
  AssetType,
  BrandProfile,
  CopyContent,
} from '@/lib/types';

type Phase = 'upload' | 'analyzing' | 'results';

/**
 * The interactive tool. Rendered only after the server has verified a valid
 * Wadi ticket (see app/page.tsx). The raw ticket string is passed down so every
 * API call can carry it — the API routes verify it again server-side.
 */
export function Studio({ ticket }: { ticket: string }) {
  const [phase, setPhase] = useState<Phase>('upload');
  const [profile, setProfile] = useState<BrandProfile | null>(null);
  const [copyContent, setCopyContent] = useState<CopyContent | null>(null);
  const [jobs, setJobs] = useState<AssetJob[]>([]);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [logoMimeType, setLogoMimeType] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const cancelled = useRef(false);

  // Every request to this tool's own API carries the Wadi ticket, which the
  // route re-verifies server-side before doing anything.
  const authedFetch = useCallback(
    (input: string, init: RequestInit = {}) => {
      const headers = new Headers(init.headers);
      headers.set('Authorization', `Bearer ${ticket}`);
      return fetch(input, { ...init, headers });
    },
    [ticket],
  );

  const updateJob = useCallback(
    (type: AssetType, patch: Partial<AssetJob>) => {
      setJobs((prev) =>
        prev.map((j) => (j.type === type ? { ...j, ...patch } : j)),
      );
    },
    [],
  );

  const setStatus = useCallback(
    (type: AssetType, status: AssetStatus) => updateJob(type, { status }),
    [updateJob],
  );

  const fetchCopy = useCallback(
    async (brandProfile: BrandProfile, logo: string, mt: string) => {
      try {
        const res = await authedFetch('/api/copy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brandProfile, logoBase64: logo, logoMimeType: mt }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as { content?: CopyContent };
        if (cancelled.current) return;
        if (data.content) setCopyContent(data.content);
      } catch {
        // non-fatal: slide skeletons stay visible
      }
    },
    [authedFetch],
  );

  const runImagePipeline = useCallback(
    async (
      types: AssetType[],
      brandProfile: BrandProfile,
      logo: string,
      mt: string,
    ) => {
      for (const type of types) {
        if (cancelled.current) return;
        setStatus(type, 'generating');
        try {
          const genRes = await authedFetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              assetType: type,
              brandProfile,
              logoBase64: logo,
              logoMimeType: mt,
            }),
          });
          if (!genRes.ok) {
            const e = await genRes.json().catch(() => ({}));
            throw new Error(e.error ?? 'Generation failed');
          }
          const genData = (await genRes.json()) as { imageBase64: string };
          if (cancelled.current) return;
          updateJob(type, { status: 'captioning', imageBase64: genData.imageBase64 });

          let description = '';
          try {
            const capRes = await authedFetch('/api/caption', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ assetType: type, brandProfile }),
            });
            if (capRes.ok) {
              const capData = (await capRes.json()) as { description?: string };
              description = capData.description ?? '';
            }
          } catch {
            // non-fatal
          }
          if (cancelled.current) return;
          updateJob(type, {
            status: 'done',
            imageBase64: genData.imageBase64,
            description,
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unknown error';
          updateJob(type, { status: 'error', error: msg });
        }
      }
    },
    [authedFetch, setStatus, updateJob],
  );

  const handleStart = useCallback(
    async (logoFile: File, assetTypes: AssetType[]) => {
      cancelled.current = false;
      setErrorMessage(null);
      setProfile(null);
      setCopyContent(null);
      setJobs(assetTypes.map((t) => ({ type: t, status: 'queued' })));
      setPhase('analyzing');

      try {
        const formData = new FormData();
        formData.append('logo', logoFile);
        const analyzeRes = await authedFetch('/api/analyze', {
          method: 'POST',
          body: formData,
        });
        if (!analyzeRes.ok) {
          const e = await analyzeRes.json().catch(() => ({}));
          throw new Error(e.error ?? 'Failed to analyze logo');
        }
        const analyzeData = (await analyzeRes.json()) as {
          profile: BrandProfile;
          logoBase64: string;
          logoMimeType: string;
        };
        if (cancelled.current) return;
        setProfile(analyzeData.profile);
        setLogoBase64(analyzeData.logoBase64);
        setLogoMimeType(analyzeData.logoMimeType);

        // Stay on the generation screen until every asset image is done.
        // Copy runs in parallel (faster) and updates state as it lands.
        await Promise.all([
          fetchCopy(analyzeData.profile, analyzeData.logoBase64, analyzeData.logoMimeType),
          runImagePipeline(
            assetTypes,
            analyzeData.profile,
            analyzeData.logoBase64,
            analyzeData.logoMimeType,
          ),
        ]);
        if (cancelled.current) return;
        setPhase('results');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setErrorMessage(msg);
      }
    },
    [authedFetch, fetchCopy, runImagePipeline],
  );

  const handleBack = useCallback(() => {
    cancelled.current = true;
    setPhase('upload');
    setProfile(null);
    setCopyContent(null);
    setJobs([]);
    setErrorMessage(null);
  }, []);

  const handleRestart = useCallback(() => {
    cancelled.current = true;
    setPhase('upload');
    setProfile(null);
    setCopyContent(null);
    setJobs([]);
    setLogoBase64(null);
    setLogoMimeType(null);
    setErrorMessage(null);
  }, []);

  useEffect(() => () => { cancelled.current = true; }, []);

  return (
    <main>
      {errorMessage && (
        <div
          role="alert"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 card-sand px-4 py-2 text-sm"
        >
          {errorMessage}
        </div>
      )}
      {phase === 'upload' && <UploadScreen onStart={handleStart} />}
      {phase === 'analyzing' && (
        <GenerationScreen profile={profile} jobs={jobs} onBack={handleBack} />
      )}
      {phase === 'results' && profile && (
        <ResultsScreen
          profile={profile}
          jobs={jobs}
          copyContent={copyContent}
          logoBase64={logoBase64}
          logoMimeType={logoMimeType}
          onRestart={handleRestart}
        />
      )}
    </main>
  );
}
