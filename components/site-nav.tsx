"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"

export default function SiteNav({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const links = [
    { href: "/groups", label: "Groups" },
    { href: "/messages", label: "Messages" },
    { href: "/profile", label: "Profile" },
    ...(isLoggedIn ? [] : [{ href: "/login", label: "Login" }]),
  ]

  // Close the mobile menu after navigating
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open])

  return (
    <nav className="border-b border-black/5">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="font-serif text-2xl tracking-tight">
          My Secret Santa
        </Link>
        <div className="hidden md:flex gap-8">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-gray-600 transition-colors">
              {link.label}
            </Link>
          ))}
        </div>
        <button
          type="button"
          className="md:hidden p-2 -mr-2"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div id="mobile-menu" className="md:hidden border-t border-black/5">
          <div className="max-w-5xl mx-auto px-4 py-2 flex flex-col">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`py-3 text-lg hover:text-gray-600 transition-colors ${
                  pathname.startsWith(link.href) ? "font-medium" : ""
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}
