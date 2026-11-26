import type { ReactNode } from "react"
import { ExperienceSection } from "./experience-section"
import { ProjectsSection } from "./projects-section"
import { AchievementsSection } from "./achievements-section"
import { JournalSection } from "./journal-section"
import { ContactSection } from "./contact-section"
import { EmphasisHeading, SocialLinks } from "./content-ui"
import type { SectionContent } from "@/lib/section-content"

export function VoyagerPageLayout({ content }: { content: SectionContent }): ReactNode {
  const fullName = content.profile?.name && content.profile.name !== "[Your Name]" ? content.profile.name : "Aryo"
  const branding = content.branding || {}
  const education = content.education
  const educationYears = education ? [education.startDate?.slice(0, 4), education.endDate?.slice(0, 4)].filter(Boolean).join("–") : ""
  const groups = new Map<string, string[]>()
  for (const skill of content.skills || []) {
    const category = skill.category || "Other"
    groups.set(category, [...(groups.get(category) || []), skill.name])
  }
  return (
    <>
    <div className="site-preloader" id="site-loader" role="status" aria-live="polite">
      <img className="preloader-vinyl" src="/voyager/icon.svg?v=gold-vinyl" width="76" height="76" alt="" aria-hidden="true" />
      <p className="preloader-eyebrow">
        A SIGNAL IS ON ITS WAY
      </p>
      <div className="preloader-progress" role="progressbar" aria-label="Loading the archive" aria-valuemin={0} aria-valuemax={100} aria-valuenow={0}>
        <i>
        </i>
      </div>
      <p className="preloader-meta">
        <span data-loading-message="">
          Preparing the archive…
        </span>
        <span>
          <b data-loading-percent="">
            000
          </b>
          %
        </span>
      </p>
      <button className="preloader-retry" data-loading-retry="" hidden={true}>
        TRY AGAIN ↗
      </button>
    </div>
    <noscript>
      <style>
        {".site-preloader{display:none!important}html:has(body.is-loading),body.is-loading{overflow:auto!important}body.is-loading main,body.is-loading .site-header{opacity:1!important}"}
      </style>
    </noscript>
    <a className="skip-link" href="#work">
      Skip to projects
    </a>
    <header className="site-header">
      <a className="brand" href="#top" aria-label={`${fullName}, home`}>
        {branding.logoText || fullName.split(" ").at(-1)?.toLowerCase() || "aryo"}
        <img className="vinyl-icon brand-vinyl" src="/voyager/icon.svg" alt="" aria-hidden="true" draggable={false} />
        <small>TRANSMISSIONS<br />FROM EARTH</small>
      </a>
      <nav id="main-nav" aria-label="Main navigation">
        <a href="#top" aria-current="location">
          <sup>
            01
          </sup>
           The signal
        </a>
        <a href="#about">
          <sup>
            02
          </sup>
           About Me
        </a>
        <a href="#toolkit">
          <sup>
            03
          </sup>
           Toolkit
        </a>
        <a href="#experience">
          <sup>
            04
          </sup>
           Experience
        </a>
        <a href="#work">
          <sup>
            05
          </sup>
           Projects
        </a>
        <a href="#achievements">
          <sup>
            06
          </sup>
           Honors
        </a>
        <a href="#journal">
          <sup>
            07
          </sup>
           Journal
        </a>
        <a href="#contact">
          <sup>
            08
          </sup>
           Contact 
          <span>
            ↗
          </span>
        </a>
      </nav>
      <button className="motion-toggle" id="motion-toggle" aria-pressed="false" aria-label="Pause 3D motion">
        <i>
        </i>
         MOTION 
        <span>
          ON
        </span>
      </button>
      <button className="menu-toggle" aria-expanded="false" aria-controls="main-nav" aria-label="Open navigation">
        MENU 
        <span>
          +
        </span>
      </button>
    </header>
    <main>
      <section className="flight" id="top" aria-label="A signal from Earth, a three-chapter 3D journey">
        <div className="flight-viewport">
          <div className="star-field" aria-hidden="true">
          </div>
          <div className="orbit-guide" aria-hidden="true">
            <span>
            </span>
            <span>
            </span>
            <span>
            </span>
          </div>
          <div className="scene-mount" id="scene-mount" aria-hidden="true">
            <div className="fallback-record">
              <span>
                ✳
              </span>
              <i>
              </i>
            </div>
          </div>
          <div className="scene-topline">
            ORIGIN: EARTH 
            <i>
              ↗
            </i>
             DESTINATION: POSSIBILITY
          </div>
          <article className="chapter chapter-hero is-active" data-chapter="0">
            <div className="chapter-copy">
              <p className="eyebrow"><span className="live-dot" /> {content.heroEyebrow || content.profile?.location || ""}</p>
              <h1><EmphasisHeading text={(branding.heroName || fullName).toUpperCase()} /></h1>
              <p className="chapter-description">{content.heroDescription || ""}</p>
              <a className="text-link" href="#work">
                EXPLORE THE ARCHIVE 
                <span>
                  ↗
                </span>
              </a>
              <SocialLinks content={content} className="contact-links hero-links" />
            </div>
            <div className="object-label">
              <span className="crosshair">
                +
              </span>
              <div>
                THE GOLDEN RECORD
                <small>
                  A MESSAGE. A MEMORY. A POSSIBILITY.
                </small>
              </div>
              <span className="label-line">
              </span>
            </div>
            <div className="hero-footnote">
              <span>
                INSPIRED BY VOYAGER, 1977
              </span>
              <p>
                A small introduction.
                <br />
                For a very big universe.
              </p>
            </div>
          </article>
          <article className="chapter chapter-record" id="about" data-chapter="1" inert={true} aria-hidden="true">
            <div className="chapter-copy">
              <p className="eyebrow">
                01 / ABOUT ME
              </p>
              <h2><EmphasisHeading text={content.aboutHeading || "EVERY DETAIL CARRIES a little of us."} /></h2>
              <p className="chapter-description about-description">{content.profile?.bio || content.aboutDescription || "Add a bio in Porto Control."}</p>
              <a className="text-link" href="#contact">
                GET IN TOUCH 
                <span>
                  ↗
                </span>
              </a>
            </div>
            <span className="floating-annotation">
              FORM / MATERIAL / MEANING
            </span>
            <div className="record-node-selector" role="group" aria-label="Section two scroll stops">
              <button type="button" data-record-node="0" aria-pressed="true">
                <i>
                </i>
                NASA RECORD
              </button>
              <button type="button" data-record-node="1" aria-pressed="false">
                <i>
                </i>
                PHOTO ARCHIVE ↻
              </button>
            </div>
          </article>
          <article className="chapter chapter-voyager" data-chapter="2" inert={true} aria-hidden="true">
            <div className="chapter-copy">
              <p className="eyebrow">02 / EDUCATION</p>
              <h2><EmphasisHeading text={content.journeyHeading || "BUILT TO GO further."} /></h2>
              <p className="chapter-description">{education ? `${education.degree} · ${education.institution}${educationYears ? ` · ${educationYears}` : ""}` : "Add education in Porto Control to complete this chapter."}</p>
              <dl className="voyager-summary" aria-label={`${fullName} at a glance`}>
                {/* {[["Work chapters", content.experiences?.length || 0], ["Technologies", content.skills?.length || 0], ["Projects", content.projects?.length || 0], ["Graduation year", education?.endDate?.slice(0, 4) || ""]].filter(([, value]) => Boolean(value)).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)} */}
                {[["Work experience", ((new Date(Math.max(...(content.experiences ?? []).map(item => new Date(item.startDate??"").getTime()))).getFullYear())-(new Date(Math.min(...(content.experiences ?? []).map(item => new Date(item.startDate??"").getTime())))).getFullYear()) || 0], ["Technologies", content.skills?.length || 0], ["Projects", content.projects?.length || 0], ["Graduation year", education?.endDate?.slice(0, 4) || ""]].filter(([, value]) => Boolean(value)).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
              </dl>
              <a className="text-link" href="#work">
                DISCOVER THE WORK 
                <span>
                  ↓
                </span>
              </a>
            </div>
            <div className="object-label">
              <span className="crosshair">
                +
              </span>
              <div>
                VOYAGER 1
                <small>
                  AN EXPLORER. A CARRIER OF STORIES.
                </small>
              </div>
              <span className="label-line">
              </span>
            </div>
          </article>
          <div className="scene-loader" role="status" aria-live="polite">
            <i>
            </i>
            <span id="load-status">
              PREPARING THE TRANSMISSION
            </span>
          </div>
          <div className="flight-bottom">
            <div className="chapter-selector" role="group" aria-label="Jump to journey chapter">
              <button data-seek="0" className="active" aria-pressed="true">
                <span>
                  01
                </span>
                 THE RECORD
              </button>
              <button data-seek="1" aria-pressed="false">
                <span>
                  02
                </span>
                 THE MESSAGE
              </button>
              <button data-seek="2" aria-pressed="false">
                <span>
                  03
                </span>
                 THE JOURNEY
              </button>
            </div>
            <span className="scroll-prompt">
              SCROLL TO TRAVEL 
              <span>
                ↓
              </span>
            </span>
            <span className="journey-counter" aria-hidden="true">
              <span id="journey-progress">
                000
              </span>
               / 100
            </span>
            <div className="journey-track">
              <i id="journey-bar">
              </i>
            </div>
          </div>
        </div>
      </section>
      <section className="signal-toolkit" id="toolkit" aria-labelledby="toolkit-title">
        <div className="toolkit-wire">
          <div className="toolkit-wire-inner section-wrap">
            <header className="signal-toolkit-heading">
              <span className="toolkit-wire-mark" aria-hidden="true">
                <span className="toolkit-wire-pulse">
                </span>
              </span>
              <div className="toolkit-wire-title">
                <h2 id="toolkit-title">{content.toolkitHeading || "Toolkit"}</h2>
                <p>
                  <span data-toolkit-count="">
                    THE INSTRUMENT PANEL
                  </span>
                  <br />
                  <span data-toolkit-disciplines="">
                  </span>
                </p>
              </div>
            </header>
            <div className="toolkit-wire-rows">
              <div className="toolkit-marquee" role="group" tabIndex={0} aria-label="Technology marquee. Drag left or right, or use arrow keys.">
                <div className="toolkit-marquee-track" data-toolkit-marquee="0" aria-hidden="true">
                </div>
              </div>
              <div className="toolkit-marquee is-reversed" role="group" tabIndex={0} aria-label="Technology marquee, second row. Drag left or right, or use arrow keys.">
                <div className="toolkit-marquee-track" data-toolkit-marquee="1" aria-hidden="true">
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="signal-toolkit-body section-wrap">
          <div className="toolkit-sphere-wrap">
            <div className="toolkit-sphere" data-toolkit-sphere="" role="group" tabIndex={0} aria-label="Toolkit text globe. Drag in any direction or use all four arrow keys to rotate 360 degrees.">
            </div>
          </div>
          <div className="toolkit-skills">
            <p className="toolkit-skills-label">Skills by category</p>
            <div className="toolkit-categories">
              {[...groups.entries()].map(([category, names]) => <div key={category}><h3>{category}</h3><ul>{names.map((name) => <li key={name}>{name}</li>)}</ul></div>)}
            </div>
          </div>
        </div>
      </section>
      <ExperienceSection heading={content.experienceHeading || "Built over time."} intro={content.experienceIntro || ""} experiences={content.experiences || []} />
      <ProjectsSection heading={content.projectsHeading || "Work in Orbit."} intro={content.projectsIntro || ""} projects={content.projects || []} />
      <AchievementsSection heading={content.achievementsHeading || "Signals worth keeping."} intro={content.achievementsIntro || ""} achievements={content.achievements || []} />
      <JournalSection heading={content.journalHeading || "Notes from Earth."} intro={content.journalIntro || ""} posts={content.posts || []} />
      <ContactSection content={content} />
      <section className="credits section-wrap" id="credits" aria-label="Credits">
        <p>
          3D models: 
          <a href="https://sketchfab.com/3d-models/voyager-golden-disc-d31e1611ce4d4a0bb356321142942fb6" target="_blank" rel="noopener noreferrer">
            Voyager Golden Disc ↗
          </a>
           by memeliciouss and 
          <a href="https://sketchfab.com/3d-models/voyager-1-f626e0b2d37b46dab4c9433306720c4b" target="_blank" rel="noopener noreferrer">
            Voyager 1 ↗
          </a>
           by Sidharth1. Both are credited under Creative Commons Attribution and adapted for this portfolio’s animation.
        </p>
        <p>
          Golden Record photos: 
          <a href="https://science.nasa.gov/gallery/images-on-the-golden-record/" target="_blank" rel="noopener noreferrer">
            NASA image gallery ↗
          </a>
          . Original source links are preserved in the archive catalog; image credits remain on the linked NASA source pages.
        </p>
        <p>
          Golden Record background: 
          <a href="https://science.nasa.gov/mission/voyager/voyager-golden-record-overview/" target="_blank" rel="noopener noreferrer">
            NASA Science ↗
          </a>
          . This animation is an artistic interpretation, not a flight simulation.
        </p>
      </section>
    </main>
    <button className="back-to-top" id="back-to-top" aria-label="Back to top" title="Back to top" hidden={true}>
      <svg className="back-to-top-progress" viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r="21" pathLength="1" />
      </svg>
      <svg className="back-to-top-arrow" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 19V5M6 11l6-6 6 6" />
      </svg>
    </button>
    <noscript>
      <div className="noscript-note">
        The portfolio content is available below. Enable JavaScript to explore the 3D scroll journey, animated previews and the pulsar map.
      </div>
    </noscript>
    </>
  )
}
