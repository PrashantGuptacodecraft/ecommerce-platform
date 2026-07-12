'use client'

// Catches errors thrown in the ROOT layout itself. Must render its own
// <html>/<body> because it replaces the root layout. Intentionally minimal and
// dependency-free (a failure here means the app shell may be broken).
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          background: '#f7f6f3',
          color: '#141414',
        }}
      >
        <main style={{ textAlign: 'center', padding: '2rem' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Something went wrong</h1>
          <p style={{ marginTop: '0.5rem', color: '#5f5f5f', fontSize: '0.875rem' }}>
            Please try again.
            {error.digest ? ` Reference: ${error.digest}` : ''}
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: '1.5rem',
              height: '2.75rem',
              padding: '0 1.25rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: '#141414',
              color: '#f7f6f3',
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  )
}
