/**
 * Friendly state shown when Wadi reports the user hasn't added a Gemini key yet
 * (the AI proxy returns NO_KEY). The tool never handles the key itself — the
 * user adds it in Wadi. Styled minimally here; Wadi design tokens land in D.
 */
export function NeedsKeyScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: 460 }}>
        <h1 style={{ fontSize: 22, marginBottom: 10 }}>Add your Gemini key in Wadi</h1>
        <p style={{ opacity: 0.75, lineHeight: 1.55, marginBottom: 20 }}>
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
