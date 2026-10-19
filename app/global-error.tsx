"use client"

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return <html lang="en"><body><main style={{ fontFamily: "sans-serif", padding: "4rem", textAlign: "center" }} role="alert">
    <p>The page could not be loaded. Please try again.</p>
    <button type="button" onClick={reset}>Try again</button>
  </main></body></html>
}
