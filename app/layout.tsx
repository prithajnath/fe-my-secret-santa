import { Inter, Fraunces } from "next/font/google"
import "./globals.css"
import type React from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { Bug } from "lucide-react"
import { getUser } from "@/lib/auth"
import SiteNav from "@/components/site-nav"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "next-themes"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  axes: ["SOFT", "WONK", "opsz"],
})

const DESCRIPTION = "Organize your Secret Santa gift exchange with private groups and anonymous messaging"

export const metadata: Metadata = {
  // Link previews need absolute image URLs; previews always point at the live site
  metadataBase: new URL("https://app.mysecretsanta.io"),
  title: "My Secret Santa",
  description: DESCRIPTION,
  // og:image / twitter:image come from app/opengraph-image.tsx and app/twitter-image.tsx
  openGraph: {
    type: "website",
    siteName: "My Secret Santa",
    title: "My Secret Santa",
    description: DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "My Secret Santa",
    description: DESCRIPTION,
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  
  const user = await getUser();
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${fraunces.variable} font-sans min-h-screen flex flex-col`}>
        {/* Dark by default; the account menu's switch overrides it (stored in localStorage) */}
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <SiteNav
            user={user && { first_name: user.first_name, last_name: user.last_name, avatar_url: user.avatar_url }}
          />

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
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
