"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AwardIcon, BookOpenIcon, CalendarIcon } from "lucide-react"

export default function BlogPage() {
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

  const blogAwardsData = [
    {
      type: "award",
      title: "Google Cloud Certified Professional Developer",
      date: "March 2024",
      description:
        "Achieved certification in Google Cloud Platform development, demonstrating expertise in building and deploying scalable applications.",
      link: "#", // Link to certificate or more details
      icon: AwardIcon,
    },
    {
      type: "blog",
      title: "Mastering React Hooks: A Deep Dive",
      date: "February 2024",
      description:
        "An in-depth article exploring advanced React Hooks patterns and best practices for building robust applications.",
      link: "#", // Link to blog post
      icon: BookOpenIcon,
    },
    {
      type: "award",
      title: "Microsoft Certified: Azure Developer Associate",
      date: "November 2023",
      description:
        "Validated skills in designing, building, testing, and maintaining cloud applications on Microsoft Azure.",
      link: "#",
      icon: AwardIcon,
    },
    {
      type: "blog",
      title: "Demystifying Microservices Architecture",
      date: "September 2023",
      description:
        "A comprehensive guide to understanding and implementing microservices, including benefits and challenges.",
      link: "#",
      icon: BookOpenIcon,
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
        My Achievements & Insights
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="text-muted-foreground text-center max-w-2xl mx-auto mb-12"
      >
        Here you'll find articles about various certificates, awards, and achievements I've received throughout my
        career, along with my thoughts on technology.
      </motion.p>

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        variants={containerVariants}
        className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 items-stretch" // Added items-stretch
      >
        {blogAwardsData.map((item, index) => (
          <motion.div key={index} variants={cardVariants} whileHover="hover">
            <Card className="bg-card text-card-foreground shadow-lg border-primary/20 rounded-xl flex flex-col h-full">
              {" "}
              {/* Added flex flex-col h-full */}
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xl font-bold flex items-center gap-2 text-gray-900">
                  <item.icon className="h-5 w-5 text-primary" />
                  {item.title}
                </CardTitle>
                <CardDescription className="text-muted-foreground text-sm flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4" />
                  {item.date}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0 flex flex-col flex-grow justify-between">
                {" "}
                {/* Added flex flex-col flex-grow justify-between */}
                <p className="text-sm text-gray-700 mb-4 flex-grow">
                  {" "}
                  {/* Added flex-grow */}
                  {item.description}
                </p>
                <Link
                  href={item.link}
                  className="inline-flex items-center text-sm font-medium text-primary hover:underline transition-colors mt-auto" // Added mt-auto
                  prefetch={false}
                >
                  {item.type === "award" ? "View Certificate" : "Read Article"} &rarr;
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
