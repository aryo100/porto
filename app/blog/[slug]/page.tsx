import Link from "next/link"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { CalendarIcon, ChevronLeftIcon } from "lucide-react"
import blogJson from "@/api/blog.json"
import type { BlogData, InternalEntry } from "@/lib/blog-types"

const blogData = blogJson as unknown as BlogData

function findInternalEntry(slug: string): InternalEntry | undefined {
  return blogData.entries.find(
    (item): item is InternalEntry => item.type === "internal" && item.slug === slug,
  )
}

export function generateStaticParams() {
  return blogData.entries
    .filter((entry) => entry.type === "internal")
    .map((entry) => ({ slug: entry.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const entry = findInternalEntry(slug)

  if (!entry) {
    return { title: "Article Not Found" }
  }

  return {
    title: `${entry.title} | My Insights`,
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
  const entry = findInternalEntry(slug)

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

      <p className="text-lg text-gray-700 mb-8">{entry.description}</p>

      <div className="space-y-6 text-gray-700 leading-relaxed">
        {entry.content.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </article>
  )
}
