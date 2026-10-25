"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { useTheme } from "next-themes"
import { ChevronDown, Home, LogOut, MessageCircle, Moon, Settings, Sun, User, Users } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { signOut } from "@/lib/api"

export interface NavUser {
  first_name: string
  last_name: string
  avatar_url?: string
}

const MENU_LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/groups", label: "Groups", icon: Users },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
]

const itemClass =
  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm outline-none cursor-pointer select-none data-[highlighted]:bg-black/5"

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href)
}

function ThemeItem() {
  const { resolvedTheme, setTheme } = useTheme()
  // The theme is only known in the browser; avoid a hydration mismatch on the label
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isDark = mounted && resolvedTheme === "dark"
  return (
    <DropdownMenu.Item
      className={itemClass}
      // Keep the menu open so the change is visible
      onSelect={(e) => {
        e.preventDefault()
        setTheme(isDark ? "light" : "dark")
      }}
    >
      {isDark ? <Sun className="h-4 w-4 text-gray-500" /> : <Moon className="h-4 w-4 text-gray-500" />}
      {isDark ? "Light mode" : "Dark mode"}
    </DropdownMenu.Item>
  )
}

function UserMenu({ user }: { user: NavUser }) {
  const pathname = usePathname()
  const initials = `${user.first_name[0] ?? ""}${user.last_name[0] ?? ""}`.toUpperCase()

  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger
        className="group flex items-center gap-2 rounded-full border border-black/10 bg-white/60 py-1 pl-1 pr-2.5 text-sm font-medium shadow-sm transition-colors hover:bg-white data-[state=open]:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        aria-label={`Account menu for ${user.first_name}`}
      >
        <Avatar className="h-8 w-8">
          <AvatarImage src={user.avatar_url} alt="" />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        <span className="max-w-[9rem] truncate">Hi, {user.first_name}!</span>
        <ChevronDown className="h-4 w-4 text-gray-500 transition-transform group-data-[state=open]:rotate-180" />
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 w-56 rounded-xl border border-black/10 bg-white p-1.5 text-gray-900 shadow-lg data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          <DropdownMenu.Label className="px-2.5 pt-1.5 pb-2 text-xs text-gray-500">
            Signed in as {user.first_name} {user.last_name}
          </DropdownMenu.Label>
          {MENU_LINKS.map(({ href, label, icon: Icon }) => (
            <DropdownMenu.Item key={href} asChild className={itemClass}>
              <Link href={href} className={isActive(pathname, href) ? "font-semibold" : ""}>
                <Icon className="h-4 w-4 text-gray-500" />
                {label}
              </Link>
            </DropdownMenu.Item>
          ))}
          <DropdownMenu.Separator className="my-1.5 h-px bg-black/10" />
          <ThemeItem />
          <DropdownMenu.Separator className="my-1.5 h-px bg-black/10" />
          <DropdownMenu.Item
            className={`${itemClass} text-red-700`}
            onSelect={async () => {
              await signOut()
              // Full page load so the nav and dashboard drop the session
              window.location.assign("/")
            }}
          >
            <LogOut className="h-4 w-4" />
            Log out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

export default function SiteNav({ user }: { user: NavUser | null }) {
  return (
    <nav className="border-b border-black/5">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link href="/" aria-label="My Secret Santa, home" className="flex-shrink-0">
          <Image src="/logo.png" alt="My Secret Santa" width={180} height={44} priority className="h-9 md:h-11 w-auto" />
        </Link>

        {user ? (
          <UserMenu user={user} />
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Sign up</Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
