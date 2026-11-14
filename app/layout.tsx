import type React from "react"
import type { Metadata } from "next"
import Script from "next/script"
import "./globals.css"
import { fetchApi, websiteUrl } from "@/lib/porto-service"
import type { SettingsData } from "@/lib/portfolio-types"

function hexToHsl(value?: string): string | undefined {
  if (!value || !/^#[0-9a-fA-F]{6}$/.test(value)) return undefined
  const [r, g, b] = [1, 3, 5].map((index) => parseInt(value.slice(index, index + 2), 16) / 255)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const difference = max - min
  const lightness = (max + min) / 2
  let hue = 0
  let saturation = 0
  if (difference) {
    saturation = difference / (1 - Math.abs(2 * lightness - 1))
    switch (max) {
      case r: hue = ((g - b) / difference) % 6; break
      case g: hue = (b - r) / difference + 2; break
      default: hue = (r - g) / difference + 4
    }
    hue *= 60
  }
  return `${Math.round((hue + 360) % 360)} ${Math.round(saturation * 100)}% ${Math.round(lightness * 100)}%`
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await fetchApi<SettingsData>("/settings")
  const seoTitle = settings.seo?.metaTitle === "John Doe - Full Stack Software Engineer" ? "" : settings.seo?.metaTitle
  const seoDescription = settings.seo?.metaDescription?.startsWith("Experienced software engineer specializing in React, Node.js") ? "" : settings.seo?.metaDescription
  const title = settings.siteConfig?.tabTitle || seoTitle || settings.siteConfig?.siteTitle || settings.profile?.name || "Portfolio"
  const description = seoDescription || settings.siteConfig?.description || settings.profile?.bio || ""
  const keywords = settings.seo?.keywords
  const website = websiteUrl(settings.profile?.website)
  return {
    title: { default: title, template: `%s | ${settings.siteConfig?.siteTitle || title}` },
    description,
    keywords: Array.isArray(keywords) ? keywords : keywords?.split(",").map((item) => item.trim()).filter(Boolean),
    metadataBase: website ?? undefined,
    icons: { icon: settings.siteConfig?.faviconPath || "/voyager/icon.svg" },
    openGraph: { title, description, siteName: settings.siteConfig?.siteTitle || title, type: "website" },
    verification: settings.seo?.googleSearchConsole && settings.seo.googleSearchConsole !== "verified" ? { google: settings.seo.googleSearchConsole } : undefined,
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const settings = await fetchApi<SettingsData>("/settings")
  const primary = hexToHsl(settings.siteConfig?.primaryColor)
  const theme = settings.siteConfig?.theme
  const analyticsId = settings.seo?.googleAnalytics
  const validAnalytics = analyticsId && /^G-[A-Z0-9]+$/.test(analyticsId)
  return (
    <html lang={settings.siteConfig?.language || "en"} className={theme === "dark" ? "dark" : theme === "system" ? "system-theme" : undefined} style={primary ? { "--primary": primary } as React.CSSProperties : undefined}>
      <head>
        <script type="importmap" dangerouslySetInnerHTML={{ __html: '{"imports":{"three":"/vendor/build/three.module.js","three/addons/":"/vendor/examples/jsm/"}}' }} />
      </head>
      <body className="is-loading" aria-busy="true">
        {children}
        {validAnalytics && <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${analyticsId}`} strategy="afterInteractive" />
          <Script id="google-analytics" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${analyticsId}');`}</Script>
        </>}
      </body>
    </html>
  )
}
