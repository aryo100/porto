"use client"

import { Button } from "@/components/ui/button"

import Link from "next/link"
import { motion, type Variants } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLinkIcon } from "lucide-react"
import { GithubIcon } from "@/components/brand-icons"
import { assetUrl } from "@/lib/porto-service"
import type { ProjectsData } from "@/lib/portfolio-types"

export function ProjectsPageClient({ data }: { data: ProjectsData }) {
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

  const { intro, projects } = data

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
        className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
      >
        {projects.map((project, index) => (
          <motion.div key={index} variants={cardVariants} whileHover="hover">
            <Card className="bg-card text-card-foreground shadow-lg border-primary/20 rounded-xl overflow-hidden">
              <img
                src={project.image ? assetUrl(project.image) : "/placeholder.svg"}
                width={400}
                height={225}
                alt={`Project ${project.title}`}
                className="w-full h-48 object-cover"
              />
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xl font-bold text-foreground">{project.title}</CardTitle>
                <CardDescription className="text-muted-foreground text-sm">{project.description}</CardDescription>
                {(project.status || project.category) && <div className="flex flex-wrap gap-2 pt-2">
                  {project.status && <Badge variant="outline">{project.status}</Badge>}
                  {project.category && <Badge variant="secondary">{project.category}</Badge>}
                </div>}
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {project.client && <p className="mb-1 text-sm text-muted-foreground">Client: {project.client}</p>}
                {!!project.teamMembers?.length && <p className="mb-1 text-sm text-muted-foreground">Team: {project.teamMembers.join(", ")}</p>}
                {(project.startDate || project.endDate) && <p className="mb-3 text-sm text-muted-foreground">{[project.startDate?.slice(0, 10), project.endDate?.slice(0, 10)].filter(Boolean).join(" – ")}</p>}
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.tech.map((tech, i) => (
                    <Badge key={i} variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                      {tech}
                    </Badge>
                  ))}
                  {project.tags?.map((tag, i) => <Badge key={`tag-${i}`} variant="outline">{tag}</Badge>)}
                </div>
                <div className="flex gap-3">
                  {project.github && (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="flex-1 rounded-lg border-primary text-primary hover:bg-primary hover:text-white transition-colors bg-transparent"
                    >
                      <Link href={project.github} target="_blank" rel="noopener noreferrer">
                        <GithubIcon className="mr-2 h-4 w-4" />
                        GitHub
                      </Link>
                    </Button>
                  )}
                  {project.live && (
                    <Button
                      asChild
                      size="sm"
                      className="flex-1 rounded-lg bg-primary hover:bg-primary/90 text-white transition-colors"
                    >
                      <Link href={project.live} target="_blank" rel="noopener noreferrer">
                        <ExternalLinkIcon className="mr-2 h-4 w-4" />
                        Live Demo
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
