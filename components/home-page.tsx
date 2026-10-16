"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
// Removed Badge import as it's now in the carousel component
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileTextIcon, MailIcon, MapPinIcon } from "lucide-react"
import { GithubIcon, LinkedinIcon } from "@/components/brand-icons"
import { motion, type Variants } from "framer-motion"
import { TechLogoCarousel } from "@/components/tech-logo-carousel" // Import the new carousel component
import { assetUrl } from "@/lib/porto-service"
import type { HomeData } from "@/lib/portfolio-types"

const iconRegistry = {
  mail: MailIcon,
  github: GithubIcon,
  linkedin: LinkedinIcon,
  fileText: FileTextIcon,
} as const

type IconKey = keyof typeof iconRegistry

const resolveIcon = (
  icon?: string,
  fallback: React.ComponentType<{ className?: string }> = MailIcon,
): React.ComponentType<{ className?: string }> =>
  (iconRegistry[icon as IconKey] as React.ComponentType<{ className?: string }> | undefined) ?? fallback

const socialThemeClasses: Record<
  string,
  { card: string; button: string }
> = {
  blue: {
    card: "border-primary/20",
    button: "bg-blue-600 hover:bg-blue-700 text-white",
  },
  neutral: {
    card: "border-primary/20",
    button: "bg-gray-700 hover:bg-gray-800 text-white",
  },
  primary: {
    card: "border-primary/20",
    button: "bg-primary hover:bg-primary/90 text-white",
  },
}

const heroButtonClasses: Record<string, string> = {
  primary: "px-8 py-3 text-lg font-semibold rounded-full bg-primary hover:bg-primary/90 transition-colors shadow-md",
  outline:
    "px-8 py-3 text-lg font-semibold rounded-full border-2 border-border text-foreground hover:bg-muted transition-colors bg-transparent shadow-md",
}

const resolveTheme = (theme?: string) =>
  socialThemeClasses[theme ?? "primary"] ?? socialThemeClasses.primary

export function HomePageClient({ data }: { data: HomeData }) {

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  }

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 50 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
    hover: { y: -8, boxShadow: "0 12px 20px rgba(0,0,0,0.1)", transition: { type: "spring", stiffness: 300 } },
  }

  const { hero, ctaButtons, techStack, socialCards } = data

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative w-full py-20 md:py-32 lg:py-48 bg-gradient-to-br from-background via-secondary/50 to-background overflow-hidden">
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
              src={assetUrl(hero.avatar.src)}
              width="180"
              height="180"
              alt={hero.avatar.alt}
              className="aspect-square overflow-hidden rounded-full object-cover border-4 border-primary shadow-lg mx-auto"
            />
            <motion.h1
              variants={itemVariants}
              className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl leading-tight text-foreground"
            >
              {hero.greeting} <span className="text-primary">{hero.name}</span>!
            </motion.h1>
            <motion.p variants={itemVariants} className="text-xl font-semibold text-foreground">
              {hero.tagline}
            </motion.p>
            <motion.p
              variants={itemVariants}
              className="max-w-3xl text-lg md:text-xl lg:text-2xl text-muted-foreground mx-auto"
            >
              {hero.bio}
            </motion.p>
            {hero.location && <motion.p variants={itemVariants} className="flex items-center justify-center gap-2 text-muted-foreground"><MapPinIcon className="h-4 w-4" />{hero.location}</motion.p>}
            <motion.div
              variants={itemVariants}
              className="flex flex-col gap-4 min-[400px]:flex-row justify-center pt-4"
            >
              {ctaButtons.map((cta) => {
                const Icon = resolveIcon(cta.icon)
                const variant = cta.variant === "outline" ? "outline" : undefined
                return (
                  <Button key={cta.label} asChild variant={variant} className={heroButtonClasses[cta.variant] ?? heroButtonClasses.primary}>
                    <Link href={cta.href} target={cta.href.startsWith("http") ? "_blank" : undefined} rel={cta.href.startsWith("http") ? "noopener noreferrer" : undefined}>
                      <Icon className="mr-2 h-5 w-5" />
                      {cta.label}
                    </Link>
                  </Button>
                )
              })}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Tech Stacks Section - Now using the looping carousel */}
      <section className="py-16 md:py-24 space-y-10 bg-background">
        {/* Removed the h2 tag here */}
        <TechLogoCarousel items={techStack} /> {/* The new looping carousel component */}
      </section>

      {/* Social Media & CV Section */}
      <section className="py-16 md:py-24 bg-muted">
        <div className="container space-y-10 px-4 md:px-6">
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
            {socialCards.map((card) => {
              const Icon = resolveIcon(card.icon, LinkedinIcon)
              const theme = resolveTheme(card.theme)
              const isExternal = card.href.startsWith("http")

              return (
                <motion.div key={card.title} variants={cardVariants} whileHover="hover">
                  <Card className={`bg-card text-card-foreground shadow-lg rounded-xl ${theme.card}`}>
                    <CardHeader className="pb-4">
                      <CardTitle className="text-2xl font-bold flex items-center gap-2 text-primary">
                        <Icon className="h-6 w-6" />
                        {card.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">{card.description}</p>
                      <Button asChild className={`w-full shadow-sm rounded-lg ${theme.button}`}>
                        <Link
                          href={assetUrl(card.href)}
                          target={isExternal ? "_blank" : undefined}
                          rel={isExternal ? "noopener noreferrer" : undefined}
                          {...(card.download ? { download: true } : {})}
                        >
                          {card.ctaLabel}
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>
    </div>
  )
}
