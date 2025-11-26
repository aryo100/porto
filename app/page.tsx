"use client" // This component uses client-side hooks for animations

import Link from "next/link"
import { Button } from "@/components/ui/button"
// Removed Badge import as it's now in the carousel component
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GithubIcon, FileTextIcon, LinkedinIcon, MailIcon } from "lucide-react"
import { motion } from "framer-motion"
import { TechLogoCarousel } from "@/components/tech-logo-carousel" // Import the new carousel component

export default function HomePage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
    hover: { y: -8, boxShadow: "0 12px 20px rgba(0,0,0,0.1)", transition: { type: "spring", stiffness: 300 } },
  }

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative w-full py-20 md:py-32 lg:py-48 bg-gradient-to-br from-blue-50 to-green-50 overflow-hidden">
        {/* Subtle background shapes */}
        <div className="absolute inset-0 z-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-primary/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-secondary/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/2 w-48 h-48 bg-primary/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>
        <div className="container relative z-10 flex flex-col items-center justify-center text-center px-4 md:px-6">
          <motion.div initial="hidden" animate="show" variants={containerVariants} className="space-y-6">
            <motion.img
              variants={itemVariants}
              src="/placeholder.svg?height=180&width=180"
              width="180"
              height="180"
              alt="Profile Picture"
              className="aspect-square overflow-hidden rounded-full object-cover border-4 border-primary shadow-lg mx-auto"
            />
            <motion.h1
              variants={itemVariants}
              className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl leading-tight text-gray-900"
            >
              Hello, I'm <span className="text-primary">[Your Name]</span>!
            </motion.h1>
            <motion.p
              variants={itemVariants}
              className="max-w-3xl text-lg md:text-xl lg:text-2xl text-gray-700 mx-auto"
            >
              I'm a passionate software engineer who loves building delightful and impactful web experiences. Let's
              create something amazing together!
            </motion.p>
            <motion.div
              variants={itemVariants}
              className="flex flex-col gap-4 min-[400px]:flex-row justify-center pt-4"
            >
              <Button
                asChild
                className="px-8 py-3 text-lg font-semibold rounded-full bg-primary hover:bg-primary/90 transition-colors shadow-md"
              >
                <Link href="#contact">
                  <MailIcon className="mr-2 h-5 w-5" />
                  Say Hello!
                </Link>
              </Button>
              <Button
                variant="outline"
                asChild
                className="px-8 py-3 text-lg font-semibold rounded-full border-2 border-gray-300 text-gray-800 hover:bg-gray-100 transition-colors bg-transparent shadow-md"
              >
                <Link href="https://github.com/[your-github]" target="_blank" rel="noopener noreferrer">
                  <GithubIcon className="mr-2 h-5 w-5" />
                  My GitHub
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Tech Stacks Section - Now using the looping carousel */}
      <section className="py-16 md:py-24 space-y-10 bg-background">
        {/* Removed the h2 tag here */}
        <TechLogoCarousel /> {/* The new looping carousel component */}
      </section>

      {/* Social Media & CV Section */}
      <section className="container py-16 md:py-24 space-y-10 px-4 md:px-6 bg-muted">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-bold tracking-tight text-center sm:text-5xl"
        >
          Let's Connect!
        </motion.h2>
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={containerVariants}
          className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
        >
          <motion.div variants={cardVariants} whileHover="hover">
            <Card className="bg-card text-card-foreground shadow-lg border-primary/20 rounded-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-bold flex items-center gap-2 text-primary">
                  <LinkedinIcon className="h-6 w-6" />
                  LinkedIn
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Connect with me professionally on LinkedIn.</p>
                <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm rounded-lg">
                  <Link href="https://linkedin.com/in/[your-linkedin]" target="_blank" rel="noopener noreferrer">
                    Connect on LinkedIn
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={cardVariants} whileHover="hover">
            <Card className="bg-card text-card-foreground shadow-lg border-primary/20 rounded-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-bold flex items-center gap-2 text-primary">
                  <GithubIcon className="h-6 w-6" />
                  GitHub
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Explore my open-source projects and contributions.</p>
                <Button asChild className="w-full bg-gray-700 hover:bg-gray-800 text-white shadow-sm rounded-lg">
                  <Link href="https://github.com/[your-github]" target="_blank" rel="noopener noreferrer">
                    View My GitHub
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={cardVariants} whileHover="hover">
            <Card className="bg-card text-card-foreground shadow-lg border-primary/20 rounded-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-bold flex items-center gap-2 text-primary">
                  <FileTextIcon className="h-6 w-6" />
                  Download CV
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Get a detailed overview of my professional journey.</p>
                <Button asChild className="w-full bg-primary hover:bg-primary/90 text-white shadow-sm rounded-lg">
                  <Link href="/your-cv.pdf" download>
                    Download My CV
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </section>
    </div>
  )
}
