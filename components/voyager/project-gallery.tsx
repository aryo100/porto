"use client"

import { useEffect, useState } from "react"

export function ProjectGallery({ images, mode, active }: { images: string[]; mode: "fade" | "slide"; active: boolean }) {
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    if (images.length < 2) return
    const advance = () => {
      if (document.hidden || document.body.classList.contains("motion-paused") || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
      setFrame((current) => active ? Math.min(images.length - 1, current + 1) : Math.max(0, current - 1))
    }
    const start = window.setTimeout(advance, 30)
    const timer = window.setInterval(advance, active ? 1300 : 800)
    return () => { window.clearTimeout(start); window.clearInterval(timer) }
  }, [active, images.length])

  return <span className={`project-gallery project-gallery-${mode}`} aria-hidden="true">
    {images.map((src, index) => <img key={`${src}-${index}`} src={src} alt="" className={index === frame ? "is-current" : undefined} style={mode === "slide" ? { transform: `translateX(${(frame - index) * 100}%)` } : undefined} />)}
  </span>
}
