/**
 * Shown when the tool is opened without a valid Wadi ticket (e.g. someone hits
 * the raw .vercel.app URL directly). It must not expose any tool functionality.
 * Styling is intentionally minimal here; it is brought onto the Wadi design
 * system in a later checkpoint.
 */
export function WadiGate() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: '24rem' }}>
        <h1 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>
          Please open this from Wadi
        </h1>
        <p style={{ fontSize: '0.95rem', lineHeight: 1.5, opacity: 0.8 }}>
          This tool runs inside the Wadi platform. Open it from your Wadi
          dashboard while signed in to use it.
        </p>
      </div>
    </main>
  );
}
