"use client"

import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import {
  AtomIcon,
  ZapIcon,
  TypeIcon,
  LeafIcon,
  DatabaseIcon,
  ContainerIcon,
  CloudIcon,
  PaletteIcon,
  CircleDotIcon,
  FlaskConicalIcon,
  CodeIcon,
  GitForkIcon,
  BarChartIcon,
  RocketIcon,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface TechItem {
  name: string
  icon: LucideIcon
  colorClass: string
}

const techStack: TechItem[] = [
  { name: "React", icon: AtomIcon, colorClass: "bg-blue-500" },
  { name: "Next.js", icon: ZapIcon, colorClass: "bg-gray-700" },
  { name: "TypeScript", icon: TypeIcon, colorClass: "bg-blue-400" },
  { name: "Node.js", icon: LeafIcon, colorClass: "bg-green-500" },
  { name: "Express.js", icon: FlaskConicalIcon, colorClass: "bg-purple-500" },
  { name: "Python", icon: CodeIcon, colorClass: "bg-yellow-500" },
  { name: "Django", icon: GitForkIcon, colorClass: "bg-green-700" },
  { name: "PostgreSQL", icon: DatabaseIcon, colorClass: "bg-blue-700" },
  { name: "MongoDB", icon: CircleDotIcon, colorClass: "bg-green-800" },
  { name: "Docker", icon: ContainerIcon, colorClass: "bg-blue-600" },
  { name: "AWS", icon: CloudIcon, colorClass: "bg-orange-500" },
  { name: "Tailwind CSS", icon: PaletteIcon, colorClass: "bg-cyan-500" },
  { name: "GraphQL", icon: BarChartIcon, colorClass: "bg-pink-500" },
  { name: "Framer Motion", icon: RocketIcon, colorClass: "bg-indigo-500" },
]

export function TechLogoCarousel() {
  const duplicatedTechStack = [...techStack, ...techStack] // Duplicate for seamless loop

  const badgeVariants = {
    hover: { scale: 1.05, transition: { type: "spring", stiffness: 400, damping: 10 } }, // Slightly reduced scale for less "clickable" feel
  }

  return (
    <div className="relative w-full overflow-hidden py-8 bg-gradient-to-r from-white via-secondary/50 to-white border-y border-gray-200">
      {/* Mask for fade effect at edges */}
      <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>

      <motion.div
        className="flex whitespace-nowrap animate-loop-scroll"
        // We use a custom CSS animation for infinite loop,
        // but framer-motion can still handle hover effects on children
      >
        {duplicatedTechStack.map((tech, index) => (
          <motion.div
            key={index}
            variants={badgeVariants}
            whileHover="hover"
            className="inline-block mx-4 flex-shrink-0 cursor-default" // Ensure items don't wrap and cursor is default
          >
            <Badge
              className={`px-6 py-3 text-lg rounded-full text-white shadow-md ${tech.colorClass} flex items-center gap-2`}
            >
              <tech.icon className="h-6 w-6" />
              {tech.name}
            </Badge>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
