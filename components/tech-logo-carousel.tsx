"use client"

import { useEffect, useRef } from "react"
import { motion, type Variants } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { AtomIcon } from "lucide-react"
import { DynamicIcon, dynamicIconImports, type IconName } from "lucide-react/dynamic"

const legacyNames: Record<string, string> = {
  flaskConical: "flask-conical",
  gitFork: "git-fork",
  circleDot: "circle-dot",
  barChart: "chart-no-axes-column",
  layers3: "layers-3",
  gitBranch: "git-branch",
}

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
  color?: string
}

interface TechLogoCarouselProps {
  items: TechLogoItem[]
}

export function TechLogoCarousel({ items }: TechLogoCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const groupRef = useRef<HTMLDivElement>(null)
  const offsetRef = useRef(0)
  const widthRef = useRef(0)
  const dragRef = useRef<{ x: number } | null>(null)

  const move = (distance: number) => {
    const width = widthRef.current
    if (!width || !trackRef.current) return
    offsetRef.current = ((offsetRef.current + distance) % width + width) % width
    trackRef.current.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`
  }

  useEffect(() => {
    const group = groupRef.current
    if (!group) return
    const resize = new ResizeObserver(() => { widthRef.current = group.getBoundingClientRect().width; move(0) })
    resize.observe(group)
    widthRef.current = group.getBoundingClientRect().width
    let frame = 0
    let last = 0
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const tick = (time: number) => {
      if (last && !dragRef.current && !reducedMotion.matches) move(Math.min((time - last) / 1000, 0.1) * 42)
      last = time
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(frame); resize.disconnect() }
  }, [items])

  const normalizedItems = items.map((item, index) => {
    const iconName = legacyNames[item.icon] ?? item.icon
    const hasIcon = Object.prototype.hasOwnProperty.call(dynamicIconImports, iconName)
    const colorClass = item.colorClass ?? fallbackColors[index % fallbackColors.length]

    return {
      name: item.name,
      iconName: hasIcon ? iconName as IconName : null,
      colorClass,
      color: item.color,
    }
  })

  const badges = (copy: number) => normalizedItems.map((tech, index) => (
    <motion.div key={`${copy}-${tech.name}-${index}`} variants={badgeVariants} whileHover="hover" className="mx-4 shrink-0 cursor-grab active:cursor-grabbing">
      <Badge className={`flex items-center gap-2 rounded-full px-6 py-3 text-lg text-white shadow-md ${tech.color ? "" : tech.colorClass}`} style={tech.color ? { backgroundColor: tech.color } : undefined}>
        {tech.iconName ? <DynamicIcon name={tech.iconName} className="h-6 w-6" /> : <AtomIcon className="h-6 w-6" />}
        {tech.name}
      </Badge>
    </motion.div>
  ))

  return (
    <div
      className="relative w-full overflow-hidden py-8 bg-gradient-to-r from-background via-secondary/50 to-background border-y border-border select-none touch-pan-y cursor-grab active:cursor-grabbing"
      role="region"
      aria-label="Skill portfolio. Geser untuk melihat skill lain."
      tabIndex={0}
      onKeyDown={(event) => { if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); move(event.key === "ArrowRight" ? 120 : -120) } }}
      onPointerDown={(event) => { dragRef.current = { x: event.clientX }; event.currentTarget.setPointerCapture(event.pointerId) }}
      onPointerMove={(event) => {
        if (!dragRef.current) return
        const delta = event.clientX - dragRef.current.x
        dragRef.current.x = event.clientX
        move(-delta)
      }}
      onPointerUp={() => { dragRef.current = null }}
      onPointerCancel={() => { dragRef.current = null }}
    >
      <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none"></div>
      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none"></div>

      <div ref={trackRef} className="flex w-max whitespace-nowrap will-change-transform">
        <div ref={groupRef} className="flex shrink-0">{badges(0)}</div>
        <div className="flex shrink-0" aria-hidden="true">{badges(1)}</div>
      </div>
    </div>
  )
}
