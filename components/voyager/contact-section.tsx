import { EmphasisHeading, SocialLinks } from "./content-ui"
import type { SectionContent } from "@/lib/section-content"

export function ContactSection({ content }: { content: SectionContent }) {
  const email = content.socialLinks?.email || content.profile?.email || ""
  return <>
    <section className="contact section-wrap" id="contact" aria-labelledby="contact-title">
      <div className="contact-grid">
        <div className="contact-copy">
          <p className="eyebrow">(07) / OPEN A CHANNEL</p>
          <h2 id="contact-title"><EmphasisHeading text={content.contactHeading || "Let’s build something."} /></h2>
          <p className="contact-intro">{content.contactIntro || "Open to full-time roles, freelance work, and collaborations."}</p>
          <button className="contact-address" id="contact-address" type="button" data-address={email} hidden={!email}><span>{email}</span><small>CLICK TO COPY <span aria-hidden="true">↗</span></small></button>
          <p className="contact-status" id="contact-status" role="status" aria-live="polite">{email ? "CLICK TO COPY THE EMAIL ADDRESS" : "USE A SOCIAL CHANNEL TO GET IN TOUCH"}</p>
          <SocialLinks content={content} />
        </div>
        <figure className="contact-map">
          <div className="contact-map-header" aria-hidden="true"><span>FIG. 01 / PULSAR MAP</span><span>SOL / ORIGIN</span></div>
          <canvas id="contact-map" width="520" height="440" tabIndex={0} role="group" aria-label="Interactive Golden Record pulsar map. Move, drag or use arrow keys to disturb the points. Home resets.">Golden Record diagram showing the location of the Solar System.</canvas>
          <figcaption><span><i className="live-dot" aria-hidden="true" /> SIGNAL IN RANGE</span><span>MOVE OR DRAG TO EXPLORE</span></figcaption>
        </figure>
      </div>
    </section>
    <footer className="site-footer section-wrap max-w-none border-y border-[var(--line)] bg-[#101711] px-[5%] py-[28px] pb-[30px] max-[700px]:px-[6%] max-[700px]:py-[22px]" aria-label="Site footer"><div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-[clamp(12px,2.5vw,42px)] font-mono text-[8px] leading-[1.5] tracking-[.06em] text-[var(--muted)] max-[700px]:grid-cols-[1fr_auto] max-[700px]:gap-[13px]"><span>© {new Date().getFullYear()} {(content.footerCredit || content.profile?.name || "Aryo").toUpperCase()}</span><span className="text-left max-[700px]:text-right">{content.footerTagline || "A SIGNAL FROM EARTH"}</span><a className="whitespace-nowrap text-right hover:text-[var(--gold)] max-[700px]:text-left last:max-[700px]:text-right" href="#top">Back to top ↑</a></div></footer>
  </>
}
