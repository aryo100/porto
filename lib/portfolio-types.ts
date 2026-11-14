export type SettingsData = {
  profile: { name?: string; headline?: string; email?: string; phone?: string; bio?: string; location?: string; website?: string; avatar?: string; languages?: { name: string; proficiency: string }[]; resumeSkills?: string[]; cv?: { url: string; name: string; size: number } | null }
  siteConfig: { siteTitle?: string; tagline?: string; description?: string; primaryColor?: string; theme?: string; language?: string; logoText?: string; tabTitle?: string; heroName?: string; faviconPath?: string }
  seo: { metaTitle?: string; metaDescription?: string; keywords?: string | string[]; googleAnalytics?: string; googleSearchConsole?: string; sitemap?: boolean | string; robots?: boolean | string }
  socialLinks: { github?: string; linkedin?: string; twitter?: string; instagram?: string; email?: string }
}
