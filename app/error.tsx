"use client"

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return <div className="container space-y-4 py-20 text-center" role="alert">
    <p>Konten belum dapat dimuat dari porto-service.</p>
    <button type="button" onClick={reset} className="rounded-md bg-primary px-4 py-2 text-primary-foreground">Coba lagi</button>
  </div>
}
