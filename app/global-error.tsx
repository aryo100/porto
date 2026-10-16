"use client"

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return <html lang="id"><body><main style={{ fontFamily: "sans-serif", padding: "4rem", textAlign: "center" }} role="alert">
    <p>Porto belum dapat terhubung ke porto-service.</p>
    <button type="button" onClick={reset}>Coba lagi</button>
  </main></body></html>
}
