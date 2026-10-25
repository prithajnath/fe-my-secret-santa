"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import ThemeToggle from "@/components/theme-toggle"

export interface NavUser {
  first_name: string
  last_name: string
  avatar_url?: string
}

export default function SiteNav({ user }: { user: NavUser | null }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const links = [
    { href: "/groups", label: "Groups" },
    { href: "/messages", label: "Messages" },
    { href: "/profile", label: "Profile" },
    ...(user ? [] : [{ href: "/login", label: "Login" }]),
  ]

  const avatar = (size: string) =>
    user && (
      <Avatar className={size}>
        <AvatarImage src={user.avatar_url} alt="" />
        <AvatarFallback className="text-xs">
          {`${user.first_name[0] ?? ""}${user.last_name[0] ?? ""}`.toUpperCase()}
        </AvatarFallback>
      </Avatar>
    )

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
        <Link href="/" aria-label="My Secret Santa, home" className="flex-shrink-0">
          <Image src="/logo.png" alt="My Secret Santa" width={180} height={44} priority className="h-9 md:h-11 w-auto" />
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <ThemeToggle className="-mx-4" />
          {links.map((link) =>
            // Logged in, the profile link is the user's avatar
            link.href === "/profile" && user ? (
              <Link
                key={link.href}
                href={link.href}
                aria-label="Profile"
                title={`${user.first_name} ${user.last_name}`}
                className="rounded-full ring-offset-2 hover:ring-2 hover:ring-black/20 transition-shadow"
              >
                {avatar("h-9 w-9")}
              </Link>
            ) : (
              <Link key={link.href} href={link.href} className="hover:text-gray-600 transition-colors">
                {link.label}
              </Link>
            ),
          )}
        </div>
        <div className="md:hidden flex items-center gap-1 -mr-2">
          <ThemeToggle />
          <button
            type="button"
            className="p-2"
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-menu" className="md:hidden border-t border-black/5">
          <div className="max-w-5xl mx-auto px-4 py-2 flex flex-col">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`py-3 text-lg hover:text-gray-600 transition-colors flex items-center gap-3 ${
                  pathname.startsWith(link.href) ? "font-medium" : ""
                }`}
              >
                {link.href === "/profile" && avatar("h-7 w-7")}
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}
