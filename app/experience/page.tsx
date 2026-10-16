import { ExperiencePageClient } from "@/components/experience-page"
import { fetchContent } from "@/lib/porto-service"
import type { ExperienceData } from "@/lib/portfolio-types"

export const dynamic = "force-dynamic"

export default async function ExperiencePage() {
  const data = await fetchContent<ExperienceData>("experience")
  return <ExperiencePageClient data={data} />
}
