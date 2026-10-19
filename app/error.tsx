"use client"

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return <div className="container space-y-4 py-20 text-center" role="alert">
    <p>Content could not be loaded. Please try again.</p>
    <button type="button" onClick={reset} className="rounded-md bg-primary px-4 py-2 text-primary-foreground">Try again</button>
  </div>
}
