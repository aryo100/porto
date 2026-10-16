import { fetchApi, websiteUrl } from "@/lib/porto-service"
import type { SettingsData } from "@/lib/portfolio-types"

export const dynamic = "force-dynamic"

type PostsResponse = { data: { slug: string; updatedAt?: string }[] }

export async function GET(request: Request) {
  const settings = await fetchApi<SettingsData>("/settings")
  if (settings.seo?.sitemap === false || settings.seo?.sitemap === "false") return new Response(null, { status: 404 })

  const origin = new URL(request.url).origin
  const base = websiteUrl(settings.profile?.website)?.origin || origin
  const posts = await fetchApi<PostsResponse>("/blog-posts?limit=500")
  const paths = ["/", "/experience", "/projects", "/blog", ...posts.data.map((post) => `/blog/${encodeURIComponent(post.slug)}`)]
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((path) => `<url><loc>${new URL(path, base).href.replaceAll("&", "&amp;")}</loc></url>`).join("")}</urlset>`
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } })
}
