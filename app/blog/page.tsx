import { BlogPageClient } from "@/components/blog-page"
import { fetchContent } from "@/lib/porto-service"
import type { BlogData } from "@/lib/blog-types"

export const dynamic = "force-dynamic"

export default async function BlogPage() {
  const data = await fetchContent<BlogData>("blog")
  return <BlogPageClient data={data} />
}
