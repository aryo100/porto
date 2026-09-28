"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

import Link from "next/link"
import { motion, type Variants } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLinkIcon } from "lucide-react"
import { GithubIcon } from "@/components/brand-icons"
import projectsJson from "@/api/projects.json"

type ProjectsData = typeof projectsJson

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

async function fetchProjectsData(): Promise<ProjectsData> {
  if (!API_BASE_URL) {
    return projectsJson
  }

  try {
    const res = await fetch(`${API_BASE_URL}/projects`, { cache: "no-store" })
    if (!res.ok) throw new Error("Failed to fetch projects data")
    // return (await res.json()) as ProjectsData
  } catch (error) {
    console.warn("[ProjectsPage] Falling back to local JSON data.", error)
  }

  return projectsJson
}

export default function ProjectsPage() {
  const [remoteProjectsData, setRemoteProjectsData] = useState<ProjectsData | null>(null)

  useEffect(() => {
    let isMounted = true

    fetchProjectsData()
      .then((data) => {
        if (isMounted) {
          setRemoteProjectsData(data)
        }
      })
      .catch((error) => console.warn("[ProjectsPage] Error fetching data, using fallback.", error))

    return () => {
      isMounted = false
    }
  }, [])
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

  const { intro, projects } = remoteProjectsData ?? projectsJson

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
                src={project.image || "/placeholder.svg"}
                width={400}
                height={225}
                alt={`Project ${project.title}`}
                className="w-full h-48 object-cover"
              />
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xl font-bold text-gray-900">{project.title}</CardTitle>
                <CardDescription className="text-muted-foreground text-sm">{project.description}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.tech.map((tech, i) => (
                    <Badge key={i} variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                      {tech}
                    </Badge>
                  ))}
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
