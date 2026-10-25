import { cache } from "react"
import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"
import type { UserProfile } from "@/types"
import { serverFetch } from "./server-fetch"
import { apiErrorMessage } from "./utils"

const API_BASE = process.env.API_BASE_URL || "https://localhost:9100"

// Set briefly after a successful refresh so a still-rejected token can't cause a redirect loop
export const REFRESHED_COOKIE = "auth_refreshed"
export const AUTH_MARKER_PARAM = "auth"

// Pages that work logged out: a bad session there just renders as logged out, never redirects
const PUBLIC_PATHS = ["/", "/login", "/register", "/forgot-password"]

// Every set and delete uses the same attributes, so a delete always matches the cookie it targets
function sessionCookie(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  }
}
const ACCESS_MAX_AGE = 60 * 60 // 1 hour
const REFRESH_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

// Server-side auth utilities
export async function getServerToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get("access_token")?.value || null
}

export async function setServerTokens(accessToken: string, refreshToken: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set("access_token", accessToken, sessionCookie(ACCESS_MAX_AGE))
  cookieStore.set("refresh_token", refreshToken, sessionCookie(REFRESH_MAX_AGE))
}

export async function clearServerTokens(): Promise<void> {
  const cookieStore = await cookies()
  for (const name of ["access_token", "refresh_token", REFRESHED_COOKIE]) {
    cookieStore.set(name, "", { ...sessionCookie(0), expires: new Date(0) })
  }
}

// Exchanges the refresh cookie for a new access token. Only callable from route handlers or
// server actions, since it sets cookies.
export async function refreshServerToken(): Promise<boolean> {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get("refresh_token")?.value
  if (!refreshToken) return false

  try {
    const response = await serverFetch(`${API_BASE}/api/auth/refresh`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${refreshToken}`,
        "Content-Type": "application/json",
      },
    })
    if (!response.ok) return false

    const data = await response.json()
    const accessToken = data?.data?.access_token
    if (!data.success || !accessToken) return false

    cookieStore.set("access_token", accessToken, sessionCookie(ACCESS_MAX_AGE))
    cookieStore.set(REFRESHED_COOKIE, "1", sessionCookie(60))
    return true
  } catch {
    return false
  }
}

type MeResult = { status: "ok"; user: UserProfile } | { status: "unauthorized" } | { status: "error" }

async function fetchMe(token: string): Promise<MeResult> {
  try {
    const response = await serverFetch(`${API_BASE}/api/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })
    if (response.status === 401 || response.status === 422) return { status: "unauthorized" }
    if (!response.ok) return { status: "error" }

    const data = await response.json()
    return data.success ? { status: "ok", user: data.data } : { status: "error" }
  } catch {
    return { status: "error" }
  }
}

// Cached so the layout and page share one /users/me call per render.
// Server components can't change cookies, so a rejected or expired access token is handed
// off to the /api/auth/refresh route handler, which refreshes once or clears the session.
export const getUser = cache(async (): Promise<UserProfile | null> => {
  const cookieStore = await cookies()
  const token = cookieStore.get("access_token")?.value
  const hasRefreshToken = !!cookieStore.get("refresh_token")?.value
  if (!token && !hasRefreshToken) return null

  if (token) {
    const result = await fetchMe(token)
    if (result.status === "ok") return result.user
    // Backend unreachable or erroring: treat as logged out for this render, but keep the session
    if (result.status === "error") return null
  }

  // The refresh/clear routes tag their redirect with ?auth=refreshed|expired. Checking the URL as
  // well as the cookie means we stop even if the browser didn't apply our cookie changes.
  const path = (await headers()).get("x-pathname") ?? "/"
  const url = new URL(path, "http://localhost")
  if (PUBLIC_PATHS.includes(url.pathname)) return null
  const authMarker = url.searchParams.get(AUTH_MARKER_PARAM)
  if (authMarker === "expired") return null

  // A fresh token being rejected too means refreshing again won't help
  if (hasRefreshToken && !authMarker && !cookieStore.get(REFRESHED_COOKIE)) {
    redirect(`/api/auth/refresh?next=${encodeURIComponent(path)}`)
  }
  redirect("/api/auth/clear")
})

export async function isAuthenticated(): Promise<boolean> {
  const user = await getUser()
  return !!user
}

// Server action for login
export async function serverLogin(username: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await serverFetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      return { success: false, error: apiErrorMessage(data, "Invalid credentials") }
    }

    await setServerTokens(data.data.access_token, data.data.refresh_token)
    return { success: true }
  } catch {
    return { success: false, error: "An error occurred. Please try again." }
  }
}

// Server action for logout
export async function serverLogout(): Promise<void> {
  const token = await getServerToken()
  if (token) {
    try {
      await serverFetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
    } catch {
      // Ignore errors during logout
    }
  }
  await clearServerTokens()
}
