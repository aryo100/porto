"use client"

import { useState, type KeyboardEvent, type MouseEvent } from "react"
import { EmphasisHeading } from "./content-ui"
import { ProjectGallery } from "./project-gallery"
import { externalUrl, imageUrl, type SectionProject } from "@/lib/section-content"

function ProjectCard({ project, index }: { project: SectionProject; index: number }) {
  const [galleryActive, setGalleryActive] = useState(false)
  const site = externalUrl(project.liveUrl)
  const github = externalUrl(project.githubUrl)
  const desktopImages = [project.image, ...(project.galleryImages ?? [])].map((value) => imageUrl(value)).filter(Boolean)
  const mobileImages = [project.mobileImage, ...(project.mobileGalleryImages ?? [])].map((value) => imageUrl(value)).filter(Boolean)
  const desktop = desktopImages[0] ?? ""
  const mobile = mobileImages[0] ?? ""
  const desktopAnimation = project.desktopAnimation ?? (project.scrollAnimation === true ? project.previewAnimation === "gallery" ? "fade" : "scroll" : project.scrollAnimation === false ? "off" : "auto")
  const mobileAnimation = project.mobileAnimation ?? (project.scrollAnimation === true ? project.previewAnimation === "gallery" ? "slide" : "scroll" : project.scrollAnimation === false ? "off" : "auto")
  const desktopGallery = (desktopAnimation === "fade" || desktopAnimation === "slide") && desktopImages.length > 1
  const mobileGallery = (mobileAnimation === "fade" || mobileAnimation === "slide") && mobileImages.length > 1
  const desktopScroll = desktopAnimation === "scroll" ? "on" : desktopAnimation === "auto" ? "auto" : "off"
  const mobileScroll = mobileAnimation === "scroll" ? "on" : mobileAnimation === "auto" ? "auto" : "off"
  const visit = (event: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>) => {
    if (!site || (event.target instanceof Element && event.target.closest("a, button"))) return
    window.open(site, "_blank", "noopener,noreferrer")
  }

  return <article className={`project-card group${mobile ? " has-mobile" : ""}${mobile && !desktop ? " mobile-only" : ""}${site ? " has-site-link cursor-pointer focus-visible:outline focus-visible:outline-offset-[7px] focus-visible:outline-[var(--gold)]" : ""}`} role={site ? "link" : undefined} tabIndex={site ? 0 : undefined} aria-label={site ? `Visit ${project.title} (opens in a new tab)` : undefined}
    onMouseEnter={() => setGalleryActive(true)} onMouseLeave={() => setGalleryActive(false)} onFocus={() => setGalleryActive(true)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setGalleryActive(false) }}
    onClick={visit} onKeyDown={(event) => { if (event.key === "Enter" && event.target === event.currentTarget) visit(event) }}>
    {(desktop || mobile) && <div className="project-media">
      {desktop && <div className="project-tilt">
        <div className="project-browser" role="img" tabIndex={desktopGallery ? undefined : 0} data-scroll-animation={desktopScroll} aria-label={`Web ${desktopGallery ? `${desktopAnimation} gallery` : "preview"} of ${project.title}.`}>
          <span className="project-browser-bar"><i /><i /><i /><span>{project.title.toLowerCase()}</span></span>
          <span className="project-browser-view">{desktopGallery ? <ProjectGallery key={desktopImages.join("|")} images={desktopImages} mode={desktopAnimation as "fade" | "slide"} active={galleryActive} /> : <span className="project-page"><img className="voyager-project-image" src={desktop} alt="" /></span>}</span>
        </div>
      </div>}
      {mobile && <div className="project-phone" data-mobile-animation="scroll" data-scroll-animation={mobileScroll} tabIndex={mobileGallery ? undefined : 0} role="img" aria-label={`Mobile ${mobileGallery ? `${mobileAnimation} gallery` : "preview"} of ${project.title}.`}>
        <div className="phone-status">9:41</div><div className="phone-screen">{mobileGallery ? <ProjectGallery key={mobileImages.join("|")} images={mobileImages} mode={mobileAnimation as "fade" | "slide"} active={galleryActive} /> : <div className="phone-scroll-track"><img src={mobile} alt="" /></div>}</div>
      </div>}
    </div>}
    <div className="project-meta"><span className="mono">PROJECT {String(index + 1).padStart(2, "0")}</span></div>
    <h3 className={site ? "group-hover:text-[var(--gold)] group-focus-visible:text-[var(--gold)]" : undefined}>{project.title}</h3>
    <p className="project-description">{project.description || ""}</p>
    {github && <a className="-mt-3 mb-[22px] self-start font-mono text-[10px] leading-[1.8] tracking-[.3px] text-[var(--gold)] uppercase hover:underline focus-visible:underline" href={github} target="_blank" rel="noopener noreferrer" onClick={(event) => event.stopPropagation()}>GitHub ↗</a>}
    <div className="project-foot"><span>{project.category || "PROJECT"}<br />{(project.technologies || []).join(" · ")}</span><span className="project-format">{desktop && mobile ? "WEB + MOBILE" : desktop ? "WEB" : mobile ? "MOBILE" : "PROJECT"}</span></div>
  </article>
}

export function ProjectsSection({ heading, intro, projects }: { heading: string; intro: string; projects: SectionProject[] }) {
  return <section className="work section-wrap" id="work" aria-labelledby="work-title">
    <div className="section-heading work-heading"><span className="work-ghost" aria-hidden="true">04</span><div><p className="eyebrow">(04) / PROJECT ARCHIVE</p><h2 id="work-title"><EmphasisHeading text={heading} /></h2></div><p>{intro}</p></div>
    <div className="project-grid">{projects.map((project, index) => <ProjectCard key={`${project.title}-${index}`} project={project} index={index} />)}</div>
  </section>
}
