"use client"

import { motion } from "framer-motion"
import { BriefcaseIcon, CalendarIcon, MapPinIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ExperiencePage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  }

  const experienceData = [
    {
      title: "Senior Software Engineer",
      company: "Tech Innovators Inc.",
      duration: "Jan 2023 - Present",
      location: "San Francisco, CA",
      description: [
        "Led development of scalable microservices using Node.js and TypeScript.",
        "Mentored junior engineers and conducted code reviews.",
        "Optimized database queries, reducing latency by 30%.",
        "Collaborated with product teams to define and implement new features.",
      ],
    },
    {
      title: "Software Engineer",
      company: "Web Solutions Co.",
      duration: "Jul 2020 - Dec 2022",
      location: "Austin, TX",
      description: [
        "Developed front-end components with React and Next.js.",
        "Integrated RESTful APIs and managed state with Redux.",
        "Contributed to CI/CD pipeline improvements.",
        "Participated in agile development sprints.",
      ],
    },
    {
      title: "Junior Developer Intern",
      company: "Startup Hub",
      duration: "May 2019 - Aug 2019",
      location: "New York, NY",
      description: [
        "Assisted in building a Python/Django backend for a new web application.",
        "Wrote unit and integration tests.",
        "Learned version control with Git and GitHub.",
        "Supported deployment processes.",
      ],
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
        My Professional Journey
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="text-muted-foreground text-center max-w-2xl mx-auto mb-12"
      >
        A timeline of my work experience, highlighting key roles, responsibilities, and achievements.
      </motion.p>

      <motion.div initial="hidden" animate="show" variants={containerVariants} className="relative pl-8 md:pl-16">
        {/* Vertical line for timeline */}
        <div className="absolute left-4 md:left-8 top-0 bottom-0 w-1 bg-primary/20 rounded-full"></div>

        {experienceData.map((exp, index) => (
          <motion.div key={index} variants={itemVariants} className="mb-10 flex items-start relative">
            {/* Circle for timeline point */}
            <div className="absolute left-0 top-0 -ml-3 md:-ml-7 h-6 w-6 rounded-full bg-primary border-4 border-white shadow-md z-10"></div>
            <Card className="flex-1 ml-8 md:ml-12 p-6 rounded-xl shadow-lg border-primary/20 hover:shadow-xl transition-shadow duration-300">
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
                  {exp.description.map((item, i) => (
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
