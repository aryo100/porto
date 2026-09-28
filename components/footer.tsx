import Link from "next/link"
import { GithubIcon, LinkedinIcon, TwitterIcon } from "@/components/brand-icons"
import siteJson from "@/api/site.json"

type SiteData = typeof siteJson

const siteData: SiteData = siteJson

const iconMap = {
  github: GithubIcon,
  linkedin: LinkedinIcon,
  twitter: TwitterIcon,
} as const

export function Footer() {
  const { footer } = siteData

  return (
    <footer className="border-t border-gray-200 py-8 bg-muted">
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
                target="_blank"
                rel="noopener noreferrer"
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