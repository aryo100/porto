import type { CSSProperties } from "react"
import { EmphasisHeading } from "./content-ui"
import { externalUrl, imageUrl, type SectionAchievement } from "@/lib/section-content"

function AchievementCard({ item, index }: { item: SectionAchievement; index: number }) {
  const destination = externalUrl(item.url)
  const type = item.type || "Achievement"
  const image = imageUrl(item.image)
  const logo = imageUrl(item.logo) || "/voyager/icon.svg"
  const style = { "--card-index": index, zIndex: index + 1 } as CSSProperties
  const content = <>
    <div className="z-1 order-2 flex min-w-0 flex-col p-[clamp(19px,2.7vw,32px)] max-[700px]:p-[clamp(18px,4vw,28px)]">
      <div className="flex items-center justify-between gap-5 font-mono text-[9px] tracking-[1px] text-[var(--gold)] uppercase max-[700px]:text-[8px]"><span>{type}</span><span>{String(index + 1).padStart(2, "0")}</span></div>
      <h3 className="my-[clamp(15px,3svh,30px)] max-w-[22ch] font-[var(--display)] text-[clamp(24px,2.7vw,38px)] leading-[1.08] font-medium tracking-[-.04em] text-balance max-[700px]:my-[15px] max-[700px]:max-w-[21ch] max-[700px]:text-[clamp(24px,6vw,34px)]">{item.title}</h3>
      <p className="mb-[15px] max-w-[48ch] font-[var(--body)] text-xs leading-[1.65] text-[var(--muted)] max-[700px]:text-[11px] max-[700px]:leading-[1.5]">{item.description || `${type} from ${item.issuer || "the issuer"}`}</p>
      <div className="mt-auto flex items-center justify-between gap-5 border-t border-[#c5a46b55] pt-[18px] font-mono text-[9px] leading-[1.6] tracking-[1px] text-[var(--muted)] uppercase max-[700px]:flex-wrap max-[700px]:text-[8px]"><span>{[item.issuer, item.date].filter(Boolean).join(" · ")}</span>{destination && <span className="whitespace-nowrap text-[var(--gold)] underline underline-offset-[5px]">{type === "External" ? "Read source ↗" : "View credential ↗"}</span>}</div>
    </div>
    <div className="relative order-1 grid place-items-center overflow-hidden border-b border-[#c5a46b33] bg-transparent" aria-hidden="true">{image ? <img className="achievement-image" src={image} alt="" loading="lazy" /> : <img className="achievement-logo" src={logo} alt="" loading="lazy" />}<small className="absolute right-4 bottom-3.5 font-mono text-[8px] tracking-[1px] text-[#d9c69d]">{type} / {String(index + 1).padStart(2, "0")}</small></div>
  </>
  return destination
    ? <a className="achievement-card cursor-pointer no-underline hover:border-[var(--gold)] focus-visible:outline-2 focus-visible:outline-offset-[5px] focus-visible:outline-[var(--paper)]" style={style} href={destination} target="_blank" rel="noopener noreferrer" aria-label={`${type === "External" ? "Read source" : "View credential"}: ${item.title}`}>{content}</a>
    : <article className="achievement-card cursor-default" style={style}>{content}</article>
}

export function AchievementsSection({ heading, intro, achievements }: { heading: string; intro: string; achievements: SectionAchievement[] }) {
  return <section className="achievements section-wrap" id="achievements" aria-labelledby="achievements-title" hidden={!achievements.length} style={{ "--achievement-steps": `${Math.max(0, achievements.length - 1) * 80}svh` } as CSSProperties}>
    <div className="achievement-stage">
      <div className="section-heading achievements-heading"><div><p className="eyebrow">(05) / CERTIFICATIONS &amp; ACHIEVEMENTS</p><h2 id="achievements-title"><EmphasisHeading text={heading} /></h2></div><div className="achievement-heading-side"><p className="achievements-intro">{intro}</p><span className="achievement-progress" aria-label="Achievement progress">01 / {String(achievements.length).padStart(2, "0")}</span></div></div>
      <div className="achievement-stack">{achievements.map((item, index) => <AchievementCard key={`${item.title}-${index}`} item={item} index={index} />)}</div>
    </div>
  </section>
}
