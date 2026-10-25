import { Inter, Fraunces } from "next/font/google"
import "./globals.css"
import type React from "react"
import Link from "next/link"
import { Menu, Bug } from "lucide-react"
import { getUser } from "@/lib/auth"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  axes: ["SOFT", "WONK", "opsz"],
})

export const metadata = {
  title: "My Secret Santa",
  description: "Organize your Secret Santa gift exchange with private groups and anonymous messaging",
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  
  const user = await getUser();
  return (
    <html lang="en">
      <body className={`${inter.variable} ${fraunces.variable} font-sans min-h-screen flex flex-col`}>
        <nav className="border-b border-black/5">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="font-serif text-2xl tracking-tight">
              My Secret Santa
            </Link>
            <div className="hidden md:flex gap-8">
              <Link href="/groups" className="hover:text-gray-600 transition-colors">
                Groups
              </Link>
              <Link href="/messages" className="hover:text-gray-600 transition-colors">
                Messages
              </Link>
              <Link href="/profile" className="hover:text-gray-600 transition-colors">
                Profile
              </Link>
              {!user ? <Link href="/login" className="hover:text-gray-600 transition-colors">Login</Link> : <></>}
            </div>
            <button className="md:hidden">
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </nav>

        <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">{children}</main>

        <footer className="border-t border-black/5 mt-auto">
          <div className="max-w-5xl mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-600">
                &copy; {new Date().getFullYear()} xerocopy LLC. All rights reserved.
              </p>
              <div className="flex items-center gap-6">
                <Link
                  href="/report"
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-black transition-colors"
                >
                  <Bug className="h-4 w-4" />
                  Report Issue
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
