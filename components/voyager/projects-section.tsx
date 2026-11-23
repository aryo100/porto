"use client"

import type { KeyboardEvent, MouseEvent } from "react"
import { EmphasisHeading } from "./content-ui"
import { ProjectGallery } from "./project-gallery"
import { externalUrl, imageUrl, type SectionProject } from "@/lib/section-content"

function ProjectCard({ project, index }: { project: SectionProject; index: number }) {
  const site = externalUrl(project.liveUrl)
  const github = externalUrl(project.githubUrl)
  const desktopImages = [project.image, ...(project.galleryImages ?? [])].map((value) => imageUrl(value)).filter(Boolean)
  const mobileImages = [project.mobileImage, ...(project.mobileGalleryImages ?? [])].map((value) => imageUrl(value)).filter(Boolean)
  const desktop = desktopImages[0] ?? ""
  const mobile = mobileImages[0] ?? ""
  const isApp = project.category === "Mobile App" || project.category === "Desktop App"
  const galleryMode = isApp ? "slide" : "fade"
  const galleryEnabled = project.scrollAnimation === true && project.previewAnimation === "gallery"
  const desktopGallery = galleryEnabled && desktopImages.length > 1
  const mobileGallery = galleryEnabled && mobileImages.length > 1
  const scrollSetting = project.previewAnimation === "gallery" ? "off" : project.scrollAnimation === true ? "on" : project.scrollAnimation === false ? "off" : "auto"
  const visit = (event: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>) => {
    if (!site || (event.target instanceof Element && event.target.closest("a, button"))) return
    window.open(site, "_blank", "noopener,noreferrer")
  }

  return <article className={`project-card group${mobile ? " has-mobile" : ""}${site ? " has-site-link cursor-pointer focus-visible:outline focus-visible:outline-offset-[7px] focus-visible:outline-[var(--gold)]" : ""}`} data-scroll-animation={project.scrollAnimation === true ? "on" : project.scrollAnimation === false ? "off" : "auto"} role={site ? "link" : undefined} tabIndex={site ? 0 : undefined} aria-label={site ? `Visit ${project.title} (opens in a new tab)` : undefined}
    onClick={visit} onKeyDown={(event) => { if (event.key === "Enter" && event.target === event.currentTarget) visit(event) }}>
    <div className="project-media">
      <div className="project-tilt">
        <div className="project-browser" role="img" tabIndex={desktopGallery ? undefined : 0} data-scroll-animation={scrollSetting} aria-label={`Desktop ${desktopGallery ? `${galleryMode} gallery` : "preview"} of ${project.title}.`}>
          <span className="project-browser-bar"><i /><i /><i /><span>{project.title.toLowerCase()}</span></span>
          <span className="project-browser-view">{desktopGallery ? <ProjectGallery key={desktopImages.join("|")} images={desktopImages} mode={galleryMode} /> : <span className="project-page">{desktop ? <img className="voyager-project-image" src={desktop} alt="" /> : <span className="voyager-project-image">{project.title}</span>}</span>}</span>
        </div>
      </div>
      {mobile && <div className="project-phone" data-mobile-animation="scroll" data-scroll-animation={scrollSetting} tabIndex={mobileGallery ? undefined : 0} role="img" aria-label={`Mobile ${mobileGallery ? `${galleryMode} gallery` : "preview"} of ${project.title}.`}>
        <div className="phone-status">9:41</div><div className="phone-screen">{mobileGallery ? <ProjectGallery key={mobileImages.join("|")} images={mobileImages} mode={galleryMode} /> : <div className="phone-scroll-track"><img src={mobile} alt="" /></div>}</div>
      </div>}
    </div>
    <div className="project-meta"><span className="mono">PROJECT {String(index + 1).padStart(2, "0")}</span></div>
    <h3 className={site ? "group-hover:text-[var(--gold)] group-focus-visible:text-[var(--gold)]" : undefined}>{project.title}</h3>
    <p className="project-description">{project.description || ""}</p>
    {github && <a className="-mt-3 mb-[22px] self-start font-mono text-[10px] leading-[1.8] tracking-[.3px] text-[var(--gold)] uppercase hover:underline focus-visible:underline" href={github} target="_blank" rel="noopener noreferrer" onClick={(event) => event.stopPropagation()}>GitHub ↗</a>}
    <div className="project-foot"><span>{project.category || "PROJECT"}<br />{(project.technologies || []).join(" · ")}</span><span className="project-format">{mobile ? "DESKTOP + MOBILE" : "DESKTOP"}</span></div>
  </article>
}

export function ProjectsSection({ heading, intro, projects }: { heading: string; intro: string; projects: SectionProject[] }) {
  return <section className="work section-wrap" id="work" aria-labelledby="work-title">
    <div className="section-heading work-heading"><span className="work-ghost" aria-hidden="true">04</span><div><p className="eyebrow">(04) / PROJECT ARCHIVE</p><h2 id="work-title"><EmphasisHeading text={heading} /></h2></div><p>{intro}</p></div>
    <div className="project-grid">{projects.map((project, index) => <ProjectCard key={`${project.title}-${index}`} project={project} index={index} />)}</div>
  </section>
}
