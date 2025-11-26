"use client"

import { Button } from "@/components/ui/button"

import Link from "next/link"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLinkIcon, GithubIcon } from "lucide-react"

export default function ProjectsPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
    hover: { y: -8, boxShadow: "0 12px 20px rgba(0,0,0,0.1)", transition: { type: "spring", stiffness: 300 } },
  }

  const projectsData = [
    {
      title: "E-commerce Platform",
      description:
        "A full-stack e-commerce application with user authentication, product catalog, and payment integration.",
      tech: ["Next.js", "React", "Node.js", "PostgreSQL", "Stripe"],
      image: "/placeholder.svg?height=200&width=300",
      github: "https://github.com/your-github/ecommerce-platform",
      live: "https://ecommerce.yourdomain.com",
    },
    {
      title: "AI Chatbot Assistant",
      description:
        "An intelligent chatbot powered by large language models, capable of natural language understanding and generation.",
      tech: ["Python", "Flask", "OpenAI API", "React", "WebSockets"],
      image: "/placeholder.svg?height=200&width=300",
      github: "https://github.com/your-github/ai-chatbot",
      live: "https://chatbot.yourdomain.com",
    },
    {
      title: "Task Management App",
      description:
        "A simple and intuitive task management application to help users organize their daily tasks and boost productivity.",
      tech: ["Vue.js", "Firebase", "Tailwind CSS"],
      image: "/placeholder.svg?height=200&width=300",
      github: "https://github.com/your-github/task-app",
      live: "https://tasks.yourdomain.com",
    },
    {
      title: "Portfolio Website V2",
      description:
        "The second iteration of my personal portfolio website, focusing on modern design and interactive elements.",
      tech: ["Next.js", "TypeScript", "Tailwind CSS", "Framer Motion"],
      image: "/placeholder.svg?height=200&width=300",
      github: "https://github.com/your-github/portfolio-v2",
      live: "https://yourdomain.com",
    },
  ]

  return (
    <div className="container py-12 md:py-24 lg:py-32">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.6 }}
        className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl text-center mb-8 text-primary"
      >
        My Creative Projects
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="text-muted-foreground text-center max-w-2xl mx-auto mb-12"
      >
        Explore a selection of my personal and professional projects, each with detailed descriptions, technologies
        used, and links to live demos or source code.
      </motion.p>

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        variants={containerVariants}
        className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
      >
        {projectsData.map((project, index) => (
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
