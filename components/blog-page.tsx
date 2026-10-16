"use client"

import Link from "next/link"
import { motion, type Variants } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AwardIcon, BookOpenIcon, CalendarIcon, ExternalLinkIcon } from "lucide-react"
import type { BlogData } from "@/lib/blog-types"

export function BlogPageClient({ data }: { data: BlogData }) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  }

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 50 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
    hover: { y: -8, boxShadow: "0 12px 20px rgba(0,0,0,0.1)", transition: { type: "spring", stiffness: 300 } },
  }

  const { intro, entries } = data

  return (
    <div className="container py-12 md:py-24 lg:py-32">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.6 }}
        className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl text-center mb-8 text-primary"
      >
        {intro.headline}
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="text-muted-foreground text-center max-w-2xl mx-auto mb-12"
      >
        {intro.description}
      </motion.p>

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        variants={containerVariants}
        className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 items-stretch"
      >
        {entries.map((item, index) => {
          const isInternal = item.type === "internal"
          const isAchievement = item.type === "achievement"
          const ItemIcon = isAchievement ? AwardIcon : BookOpenIcon
          const linkLabel = isAchievement
            ? "View Certificate"
            : isInternal
              ? "Read Article"
              : "Read on External Site"
          const href =
            item.type === "internal" ? `/blog/${item.slug}` : item.url

          return (
            <motion.div key={index} variants={cardVariants} whileHover="hover">
              <Card className="bg-card text-card-foreground shadow-lg border-primary/20 rounded-xl flex flex-col h-full">
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <ItemIcon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl font-bold text-foreground leading-snug">
                      {item.title}
                    </CardTitle>
                  </div>
                  <CardDescription className="text-muted-foreground text-sm flex items-center gap-1.5 pl-14">
                    <CalendarIcon className="h-4 w-4" />
                    {item.date}
                    {"source" in item && item.source ? ` · ${item.source}` : null}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 pt-2 flex flex-col flex-grow justify-between">
                  <p className="text-sm text-foreground mb-4 flex-grow">
                    {item.description}
                  </p>
                  {href && <Link
                    href={href}
                    target={!isInternal && href.startsWith("http") ? "_blank" : undefined}
                    rel={!isInternal && href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline transition-colors mt-auto"
                    prefetch={false}
                  >
                    {linkLabel} {isInternal ? "\u00A0→" : null}
                    {!isInternal ? <ExternalLinkIcon className="h-4 w-4" /> : null}
                  </Link>}
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
