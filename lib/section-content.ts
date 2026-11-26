export type SectionExperience = {
  position: string; company: string; location?: string; startDate?: string; endDate?: string | null;
  current?: boolean; achievements?: string[];
}

export type SectionProject = {
  title: string; description?: string; category?: string; technologies?: string[];
  image?: string | null; mobileImage?: string | null; githubUrl?: string | null; liveUrl?: string | null;
  scrollAnimation?: boolean | null;
  galleryImages?: string[]; mobileGalleryImages?: string[];
  previewAnimation?: "scroll" | "gallery";
  desktopAnimation?: "off" | "scroll" | "fade" | "slide" | null;
  mobileAnimation?: "off" | "scroll" | "fade" | "slide" | null;
}

export type SectionAchievement = {
  title: string; description?: string; issuer?: string; date?: string; type?: string;
  url?: string | null; image?: string | null; logo?: string | null;
}

export type SectionPost = { title: string; description?: string; date?: string; content?: string[]; slug?: string }
export type SectionSkill = { name: string; category?: string; icon?: string }

export type SectionContent = {
  profile?: { name?: string; bio?: string; location?: string; email?: string; cv?: { url: string; name: string } };
  branding?: { logoText?: string; heroName?: string; tabTitle?: string };
  socialLinks?: { github?: string; linkedin?: string; instagram?: string; twitter?: string; email?: string };
  education?: { degree?: string; institution?: string; startDate?: string; endDate?: string } | null;
  skills?: SectionSkill[]; experiences?: SectionExperience[]; projects?: SectionProject[];
  achievements?: SectionAchievement[]; posts?: SectionPost[];
  heroEyebrow?: string; heroDescription?: string; aboutHeading?: string; aboutDescription?: string;
  journeyHeading?: string; journeyDescription?: string; toolkitHeading?: string;
  experienceHeading?: string; experienceIntro?: string; projectsHeading?: string; projectsIntro?: string;
  achievementsHeading?: string; achievementsIntro?: string; journalHeading?: string; journalIntro?: string;
  contactHeading?: string; contactIntro?: string; footerCredit?: string; footerTagline?: string;
}

export function imageUrl(value?: string | null): string {
  if (!value) return ""
  const upload = value.match(/^\/api\/v1\/uploads\/([0-9]{13}-[a-f0-9]{12}\.(?:png|jpg|jpeg|gif|webp|svg|avif)|seed-project-(?:porto(?:-mobile)?|control(?:-mobile)?|service)\.(?:jpg|svg)|seed-project-gallery-(?:fade|slide)-[12]\.svg)$/)
  if (upload) return `/api/section-content/image/${encodeURIComponent(upload[1])}`
  if (/^https:\/\//.test(value)) return value
  if (/^\/assets\/golden-record\/[a-zA-Z0-9._-]+\.(?:gif|jpg|jpeg|png|webp)$/.test(value)) return value
  if (/^\/voyager\/[a-zA-Z0-9._-]+\.svg$/.test(value)) return value
  return ""
}

export function externalUrl(value?: string | null): string {
  return value && /^https:\/\//.test(value) && !/(?:yourdomain|\.example|\/your-)/i.test(value) ? value : ""
}
