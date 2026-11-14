import type { SectionContent } from "@/lib/section-content"

export function EmphasisHeading({ text }: { text: string }) {
  const words = text.trim().split(/\s+/)
  const last = words.pop() || ""
  return <>{words.join(" ")} <em>{last}</em></>
}

export function SocialLinks({ content, className = "contact-links" }: { content: SectionContent; className?: string }) {
  const links = content.socialLinks || {}
  const social = [["GitHub", links.github], ["LinkedIn", links.linkedin], ["Instagram", links.instagram], ["Twitter", links.twitter]] as const
  return <nav className={className} aria-label="Social platforms and résumé download">
    {social.filter(([, url]) => url && /^https:\/\//.test(url)).map(([label, url]) =>
      <a key={label} href={url} target="_blank" rel="noopener noreferrer">{label} ↗</a>)}
    {content.profile?.cv && <a href="/api/section-content/cv" download={content.profile.cv.name || "CV.pdf"}>Download résumé ↓</a>}
  </nav>
}
