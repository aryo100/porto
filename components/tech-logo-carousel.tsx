"use client"

import { motion, type Variants } from "framer-motion"
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

const iconRegistry = {
  atom: AtomIcon,
  zap: ZapIcon,
  type: TypeIcon,
  leaf: LeafIcon,
  database: DatabaseIcon,
  container: ContainerIcon,
  cloud: CloudIcon,
  palette: PaletteIcon,
  circleDot: CircleDotIcon,
  flaskConical: FlaskConicalIcon,
  code: CodeIcon,
  gitFork: GitForkIcon,
  barChart: BarChartIcon,
  rocket: RocketIcon,
} as const

const fallbackColors = [
  "bg-primary",
  "bg-secondary",
  "bg-emerald-600",
  "bg-slate-600",
  "bg-orange-500",
  "bg-pink-500",
]

const badgeVariants: Variants = {
  hover: { scale: 1.05, transition: { type: "spring", stiffness: 400, damping: 10 } },
}

type TechLogoItem = {
  name: string
  icon: string
  colorClass?: string
}

interface TechLogoCarouselProps {
  items: TechLogoItem[]
}

export function TechLogoCarousel({ items }: TechLogoCarouselProps) {
  const normalizedItems = items.map((item, index) => {
    const Icon = iconRegistry[item.icon as keyof typeof iconRegistry] ?? AtomIcon
    const colorClass = item.colorClass ?? fallbackColors[index % fallbackColors.length]

    return {
      name: item.name,
      Icon,
      colorClass,
    }
  })

  const duplicatedItems = [...normalizedItems, ...normalizedItems]

  return (
    <div className="relative w-full overflow-hidden py-8 bg-gradient-to-r from-white via-secondary/50 to-white border-y border-gray-200">
      <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>

      <motion.div className="flex whitespace-nowrap animate-loop-scroll">
        {duplicatedItems.map((tech, index) => (
          <motion.div
            key={`${tech.name}-${index}`}
            variants={badgeVariants}
            whileHover="hover"
            className="inline-block mx-4 flex-shrink-0 cursor-default"
          >
            <Badge className={`px-6 py-3 text-lg rounded-full text-white shadow-md ${tech.colorClass} flex items-center gap-2`}>
              <tech.Icon className="h-6 w-6" />
              {tech.name}
            </Badge>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
