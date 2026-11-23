"use client"

import { useEffect, useRef, useState } from "react"

export function ProjectGallery({ images, mode }: { images: string[]; mode: "fade" | "slide" }) {
  const element = useRef<HTMLSpanElement>(null)
  const [visible, setVisible] = useState(false)
  const [frame, setFrame] = useState({ current: 0, previous: -1 })

  useEffect(() => {
    const node = element.current
    if (!node) return
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.1 })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!visible || images.length < 2) return
    const timer = window.setInterval(() => {
      if (document.body.classList.contains("motion-paused") || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
      setFrame(({ current }) => ({ current: (current + 1) % images.length, previous: current }))
    }, 3600)
    return () => window.clearInterval(timer)
  }, [visible, images.length])

  return <span ref={element} className={`project-gallery project-gallery-${mode}`} aria-hidden="true">
    {images.map((src, index) => <img key={`${src}-${index}`} src={src} alt="" className={index === frame.current ? "is-current" : index === frame.previous ? "is-previous" : undefined} />)}
  </span>
}
