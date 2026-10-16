import Link from "next/link"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { CalendarIcon, ChevronLeftIcon } from "lucide-react"
import { fetchApi, PortoServiceError } from "@/lib/porto-service"

export const dynamic = "force-dynamic"

type BlogPost = { title: string; slug: string; date: string; description: string; content: string[] }

async function findInternalEntry(slug: string): Promise<BlogPost | null> {
  try {
    return await fetchApi<BlogPost>(`/blog-posts/slug/${encodeURIComponent(slug)}`)
  } catch (error) {
    if (error instanceof PortoServiceError && error.status === 404) return null
    throw error
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const entry = await findInternalEntry(slug)

  if (!entry) {
    return { title: "Article Not Found" }
  }

  return {
    title: entry.title,
    description: entry.description,
    openGraph: {
      title: entry.title,
      description: entry.description,
      type: "article",
      publishedTime: entry.date,
    },
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const entry = await findInternalEntry(slug)

  if (!entry) {
    notFound()
  }

  return (
    <article className="container py-12 md:py-24 lg:py-32 max-w-3xl">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline transition-colors mb-8"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Back to Articles
      </Link>

      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-primary mb-4">
          {entry.title}
        </h1>
        <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
          <CalendarIcon className="h-4 w-4" />
          {entry.date}
        </p>
      </header>

      <p className="text-lg text-foreground mb-8">{entry.description}</p>

      <div className="space-y-6 text-foreground leading-relaxed">
        {entry.content.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </article>
  )
}
