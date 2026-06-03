/**
 * Friendly state shown when Wadi reports the user hasn't added a Gemini key yet
 * (the AI proxy returns NO_KEY). The tool never handles the key itself — the
 * user adds it in Wadi. Styled with the Wadi design tokens.
 */
export function NeedsKeyScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <main className="min-h-screen grid place-items-center px-6 text-center">
      <div className="max-w-md">
        <p className="label-micro mb-3">Your key · your usage</p>
        <h1 className="font-display text-3xl md:text-4xl text-ink mb-3">
          Add your Gemini key in Wadi
        </h1>
        <p className="text-soft leading-relaxed mb-7">
          This tool runs on your own Google Gemini key, so your AI usage is billed
          to you. Add a Gemini key in your Wadi account settings, then come back
          and try again.
        </p>
        <button className="btn-primary" onClick={onRetry}>
          I&apos;ve added my key — try again
        </button>
      </div>
    </main>
  );
}
