"use client"

import { useEffect, useState } from "react"
import { motion, type Variants } from "framer-motion"
import { BriefcaseIcon, CalendarIcon, MapPinIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import experienceJson from "@/api/experience.json"

type ExperienceData = typeof experienceJson

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

async function fetchExperienceData(): Promise<ExperienceData> {
  if (!API_BASE_URL) {
    return experienceJson
  }

  try {
    const res = await fetch(`${API_BASE_URL}/experience`, { cache: "no-store" })
    if (!res.ok) throw new Error("Failed to fetch experience data")
    // return (await res.json()) as ExperienceData
  } catch (error) {
    console.warn("[ExperiencePage] Falling back to local JSON data.", error)
  }

  return experienceJson
}

export default function ExperiencePage() {
  const [remoteExperienceData, setRemoteExperienceData] = useState<ExperienceData | null>(null)

  useEffect(() => {
    let isMounted = true

    fetchExperienceData()
      .then((data) => {
        if (isMounted) {
          setRemoteExperienceData(data)
        }
      })
      .catch((error) => console.warn("[ExperiencePage] Error fetching data, using fallback.", error))

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

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 50 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  }

  const { intro, experiences } = remoteExperienceData ?? experienceJson

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
                <CardTitle className="text-2xl font-bold text-gray-900">{exp.title}</CardTitle>
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
                <ul className="list-disc pl-5 text-gray-700 space-y-2">
                  {exp.highlights.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
