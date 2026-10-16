import { ProjectsPageClient } from "@/components/projects-page"
import { fetchContent } from "@/lib/porto-service"
import type { ProjectsData } from "@/lib/portfolio-types"

export const dynamic = "force-dynamic"

export default async function ProjectsPage() {
  const data = await fetchContent<ProjectsData>("projects")
  return <ProjectsPageClient data={data} />
}
