import { fetchApi, websiteUrl } from "@/lib/porto-service"
import type { SettingsData } from "@/lib/portfolio-types"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const settings = await fetchApi<SettingsData>("/settings")
  if (settings.seo?.robots === false || settings.seo?.robots === "false") return new Response(null, { status: 404 })

  const origin = new URL(request.url).origin
  const base = websiteUrl(settings.profile?.website)?.origin || origin
  const sitemap = settings.seo?.sitemap === false || settings.seo?.sitemap === "false" ? "" : `Sitemap: ${base}/sitemap.xml\n`
  return new Response(`User-agent: *\nAllow: /\n${sitemap}`, { headers: { "Content-Type": "text/plain; charset=utf-8" } })
}
