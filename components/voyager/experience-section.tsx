import type { SectionExperience } from "@/lib/section-content"

function label(item: SectionExperience) {
  const start = item.startDate?.slice(0, 4) || "—"
  const end = item.current ? "PRESENT" : item.endDate?.slice(0, 4) || "—"
  return `${start} — ${end} / ${item.location || item.company}`.toUpperCase()
}

export function ExperienceSection({ heading, intro, experiences }: { heading: string; intro: string; experiences: SectionExperience[] }) {
  const items = experiences.length ? experiences : [{ position: "Add work experience in Porto Control", company: "Portfolio timeline", achievements: [], startDate: `${new Date().getFullYear()}-01-01`, current: true }]
  const first = items[0]
  const year = (first.current ? new Date().getFullYear() : Number(first.endDate?.slice(0, 4))) || new Date().getFullYear()
  const digits = String(year).split("")
  return <section className="experience" id="experience" aria-labelledby="experience-title">
    <div className="experience-stage section-wrap">
      <header className="experience-clock">
        <div className="experience-dial" aria-hidden="true"><svg viewBox="0 0 600 600"><g data-experience-ticks="" /><g className="experience-dial-rings"><circle cx="300" cy="300" r="250" /><circle cx="300" cy="300" r="195" /><circle cx="300" cy="300" r="140" /><circle cx="300" cy="300" r="85" /></g><path d="M300 38V562M38 300H562" className="experience-dial-cross" /></svg></div>
        <p className="eyebrow">(03) / EXPERIENCE · HYDROGEN ATOM</p>
        <h2 id="experience-title">{heading}</h2><p className="experience-intro">{intro}</p>
        <div className="experience-number" aria-hidden="true">{digits.map((digit, index) => <span key={index} data-experience-digit={index}>{digit}</span>)}</div>
        <p className="experience-when" data-experience-when="">{label(first)}</p>
        <div className="experience-meter"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5M12 7v5l3 2" /></svg><span data-experience-count="">01</span><span className="muted">/ {String(items.length).padStart(2, "0")}</span><span className="experience-progress" aria-hidden="true"><i /></span><div className="experience-controls"><button type="button" data-experience-step="-1" aria-label="Previous experience" disabled>↑</button><button type="button" data-experience-step="1" aria-label="Next experience">↓</button></div></div>
        <p className="experience-note">{items.some((item) => item.company.includes("(illustrative)")) ? "ILLUSTRATIVE TIMELINE · EDIT IN CMS" : "PORTFOLIO TIMELINE"}</p>
      </header>
      <div className="experience-line"><ol className="experience-list">{items.map((item, index) => <li key={`${item.company}-${item.startDate}-${index}`} className={`experience-item${index === 0 ? " is-active" : ""}`} data-experience-number={item.current ? String(new Date().getFullYear()) : item.endDate?.slice(0, 4) || "—"} data-experience-label={label(item)} aria-current={index === 0 ? "step" : undefined}>
        <p className="experience-date">{label(item)}</p><h3>{item.position}</h3><p className="experience-org">{item.company}</p><ul className="experience-points">{(item.achievements || []).map((point, pointIndex) => <li key={`${point}-${pointIndex}`}>{point}</li>)}</ul>
      </li>)}</ol></div>
    </div>
  </section>
}
