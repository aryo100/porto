"use client"

import { motion, type Variants } from "framer-motion"
import { BriefcaseIcon, CalendarIcon, GraduationCapIcon, MapPinIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ExperienceData } from "@/lib/portfolio-types"

export function ExperiencePageClient({ data }: { data: ExperienceData }) {

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 50 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  }

  const { intro, experiences, education = [] } = data

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
        {intro.subheading}
      </motion.p>

      <motion.div initial="hidden" animate="show" variants={containerVariants} className="relative">
        {/* Vertical line for timeline */}
        <div className="absolute left-4 md:left-8 top-0 bottom-0 w-1 bg-primary/20 rounded-full -translate-x-1/2"></div>

        {experiences.map((exp, index) => (
          <motion.div key={index} variants={itemVariants} className="mb-10 relative pl-10 md:pl-16">
            {/* Circle for timeline point */}
            <div className="absolute left-4 md:left-8 top-0 -translate-x-1/2 h-6 w-6 rounded-full bg-primary border-4 border-white shadow-md z-10"></div>
            <Card className="p-6 rounded-xl shadow-lg border-primary/20 hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="p-0 pb-2">
                <CardTitle className="text-2xl font-bold text-foreground">{exp.title}</CardTitle>
                <p className="text-lg text-muted-foreground flex items-center gap-2">
                  <BriefcaseIcon className="h-5 w-5 text-primary" />
                  {exp.company}
                </p>
                <p className="text-md text-muted-foreground flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  {exp.duration}
                </p>
                <p className="text-md text-muted-foreground flex items-center gap-2">
                  <MapPinIcon className="h-5 w-5 text-primary" />
                  {exp.location}
                </p>
              </CardHeader>
              <CardContent className="p-0 pt-4">
                {exp.description && <p className="mb-3 text-foreground">{exp.description}</p>}
                <ul className="list-disc pl-5 text-foreground space-y-2">
                  {exp.highlights.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
                {!!exp.technologies?.length && <p className="mt-4 text-sm text-muted-foreground">Technologies: {exp.technologies.join(", ")}</p>}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
      {education.length > 0 && (
        <section className="mt-16" aria-labelledby="education-heading">
          <h2 id="education-heading" className="mb-8 text-center text-3xl font-bold text-primary">Education</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {education.map((item, index) => (
              <Card key={`${item.institution}-${index}`} className="border-primary/20 p-6 shadow-lg">
                <CardHeader className="p-0 pb-3">
                  <CardTitle className="text-xl">{item.degree}</CardTitle>
                  <p className="flex items-center gap-2 text-muted-foreground"><GraduationCapIcon className="h-5 w-5 text-primary" />{item.institution}</p>
                  <p className="flex items-center gap-2 text-sm text-muted-foreground"><CalendarIcon className="h-4 w-4 text-primary" />{item.duration}</p>
                  {item.location && <p className="flex items-center gap-2 text-sm text-muted-foreground"><MapPinIcon className="h-4 w-4 text-primary" />{item.location}</p>}
                </CardHeader>
                <CardContent className="space-y-3 p-0">
                  {item.gpa && <p className="text-sm">GPA: {item.gpa}</p>}
                  {item.achievements?.length > 0 && <ul className="list-disc space-y-1 pl-5 text-sm">{item.achievements.map((achievement, i) => <li key={i}>{achievement}</li>)}</ul>}
                  {item.coursework?.length > 0 && <p className="text-sm text-muted-foreground">Coursework: {item.coursework.join(", ")}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
