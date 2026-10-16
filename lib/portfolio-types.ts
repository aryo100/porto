export type HomeData = {
  hero: { greeting: string; name: string; tagline: string; bio: string; location?: string | null; avatar: { src: string; alt: string } }
  ctaButtons: { label: string; href: string; variant: string; icon: string }[]
  techStack: { name: string; icon: string; colorClass?: string; color?: string }[]
  socialCards: { title: string; description: string; href: string; ctaLabel: string; theme: string; icon: string; download?: boolean }[]
}

export type ProjectsData = {
  intro: { headline: string; description: string }
  projects: { title: string; description: string; status?: string | null; category?: string | null; tags?: string[]; client?: string | null; teamMembers?: string[]; startDate?: string | null; endDate?: string | null; image?: string | null; tech: string[]; github?: string | null; live?: string | null }[]
}

export type ExperienceData = {
  intro: { headline: string; subheading: string }
  experiences: { title: string; company: string; duration: string; location?: string | null; description?: string | null; highlights: string[]; technologies?: string[] }[]
  education: { degree: string; institution: string; duration: string; location?: string | null; gpa?: string | null; achievements: string[]; coursework: string[] }[]
}

export type SiteData = {
  brand: { name: string; icon: string; logoText: string }
  nav: { href: string; label: string }[]
  footer: { copyrightName: string; rightsText: string; socials: { icon: string; href: string; label: string }[] }
}

export type SettingsData = {
  profile: { name?: string; email?: string; bio?: string; location?: string; website?: string; avatar?: string; cv?: { url: string; name: string; size: number } | null }
  siteConfig: { siteTitle?: string; tagline?: string; description?: string; primaryColor?: string; theme?: string; language?: string }
  seo: { metaTitle?: string; metaDescription?: string; keywords?: string | string[]; googleAnalytics?: string; googleSearchConsole?: string; sitemap?: boolean | string; robots?: boolean | string }
  socialLinks: { github?: string; linkedin?: string; twitter?: string; email?: string }
}
