import { VoyagerRuntime } from "@/components/voyager/runtime"
import { VoyagerPageLayout } from "@/components/voyager/page-layout"
import type { SectionContent } from "@/lib/section-content"
import { fetchContent } from "@/lib/porto-service"

export default async function HomePage() {
  const content = await fetchContent<SectionContent>("section-content")
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div className="voyager-page"><VoyagerPageLayout content={content} /></div>
      <VoyagerRuntime />
    </>
  )
}
