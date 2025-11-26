import Link from "next/link"
// Removed ModeToggle import
import { CodeIcon } from "lucide-react"

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary" prefetch={false}>
          <CodeIcon className="h-6 w-6" />
          <span>My Portfolio</span>
        </Link>
        <nav className="hidden space-x-6 md:flex">
          <Link
            href="/"
            className="text-base font-medium text-gray-700 hover:text-primary transition-colors"
            prefetch={false}
          >
            Home
          </Link>
          <Link
            href="/experience"
            className="text-base font-medium text-gray-700 hover:text-primary transition-colors"
            prefetch={false}
          >
            Experience
          </Link>
          <Link
            href="/projects"
            className="text-base font-medium text-gray-700 hover:text-primary transition-colors"
            prefetch={false}
          >
            Projects
          </Link>
          <Link
            href="/blog"
            className="text-base font-medium text-gray-700 hover:text-primary transition-colors"
            prefetch={false}
          >
            Blog
          </Link>
        </nav>
        {/* Removed ModeToggle */}
      </div>
    </header>
  )
}
