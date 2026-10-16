import Link from "next/link"
import { MailIcon } from "lucide-react"
import { GithubIcon, LinkedinIcon, TwitterIcon } from "@/components/brand-icons"
import type { SiteData } from "@/lib/portfolio-types"

const iconMap = {
  github: GithubIcon,
  linkedin: LinkedinIcon,
  twitter: TwitterIcon,
  mail: MailIcon,
} as const

export function Footer({ siteData }: { siteData: SiteData }) {
  const { footer } = siteData

  return (
    <footer className="border-t border-border py-8 bg-muted">
      <div className="container flex flex-col items-center justify-between gap-4 px-4 md:flex-row md:px-6">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} {footer.copyrightName}. {footer.rightsText}
        </p>
        <div className="flex gap-4">
          {footer.socials.map((social) => {
            const Icon = iconMap[social.icon as keyof typeof iconMap] ?? GithubIcon
            return (
              <Link
                key={social.icon}
                href={social.href}
                target={social.href.startsWith("http") ? "_blank" : undefined}
                rel={social.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="text-muted-foreground hover:text-primary transition-colors"
                prefetch={false}
              >
                <Icon className="h-5 w-5" />
                <span className="sr-only">{social.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </footer>
  )
}
