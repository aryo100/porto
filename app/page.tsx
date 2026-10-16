import { HomePageClient } from "@/components/home-page"
import { fetchContent } from "@/lib/porto-service"
import type { HomeData } from "@/lib/portfolio-types"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const data = await fetchContent<HomeData>("home")
  return <HomePageClient data={data} />
}
