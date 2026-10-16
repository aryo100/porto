"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { SiteData } from "@/lib/portfolio-types"

export function Navbar({ siteData }: { siteData: SiteData }) {
  const pathname = usePathname()
  const { brand, nav } = siteData

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary" prefetch={false}>
          <span className="flex size-9 items-center justify-center rounded-md bg-primary text-base font-bold text-white">
            {brand.logoText}
          </span>
          <span>{brand.name}</span>
        </Link>
        <nav className="hidden space-x-6 md:flex">
          {nav.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/" && pathname.startsWith(link.href))

            return (
              <Link
                key={link.href}
                href={link.href}
                prefetch={false}
                aria-current={isActive ? "page" : undefined}
                className={
                  isActive
                    ? "relative text-base font-semibold text-primary after:absolute after:left-0 after:right-0 after:-bottom-1 after:h-0.5 after:rounded-full after:bg-primary"
                    : "text-base font-medium text-foreground hover:text-primary transition-colors"
                }
              >
                {link.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
