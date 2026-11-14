"use client"

import { useEffect } from "react"

export function VoyagerRuntime() {
  useEffect(() => {
    document.body.classList.add("is-loading")
    document.body.setAttribute("aria-busy", "true")

    // React reruns effects in development; load this one-time scene runtime once.
    if (!document.querySelector("script[data-voyager-runtime]")) {
      const script = document.createElement("script")
      script.type = "module"
      script.src = "/voyager/app.js"
      script.dataset.voyagerRuntime = ""
      document.body.append(script)
    }

    return () => {
      document.body.classList.remove("is-loading", "scene-ready", "scene-failed", "motion-paused")
      document.body.removeAttribute("aria-busy")
    }
  }, [])

  return null
}
