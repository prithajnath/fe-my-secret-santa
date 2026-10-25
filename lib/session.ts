// Session cookie settings and the server-side token refresh, shared by proxy.ts (which can't use
// next/headers) and lib/auth.ts.
import { serverFetch } from "./server-fetch"

const API_BASE = process.env.API_BASE_URL || "https://localhost:9100"

export const ACCESS_COOKIE = "access_token"
export const REFRESH_COOKIE = "refresh_token"
// Set briefly after a successful refresh so a still-rejected token can't cause a redirect loop
export const REFRESHED_COOKIE = "auth_refreshed"

export const ACCESS_MAX_AGE = 60 * 60 // 1 hour
export const REFRESH_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

// Every set and delete uses the same attributes, so a delete always matches the cookie it targets
export function sessionCookie(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  }
}

// Parallel requests (renders, prefetches) that all see an expired token share one refresh call.
// Results, including failures, are kept briefly so requests arriving just after reuse them too.
const RESULT_TTL_MS = 30_000
const refreshes = new Map<string, { result: Promise<string | null>; settledAt?: number }>()

export function refreshAccessToken(refreshToken: string): Promise<string | null> {
  const now = Date.now()
  for (const [token, entry] of refreshes) {
    if (entry.settledAt && now - entry.settledAt > RESULT_TTL_MS) refreshes.delete(token)
  }

  const existing = refreshes.get(refreshToken)
  if (existing) return existing.result

  const entry: { result: Promise<string | null>; settledAt?: number } = {
    result: exchangeRefreshToken(refreshToken).finally(() => {
      entry.settledAt = Date.now()
    }),
  }
  refreshes.set(refreshToken, entry)
  return entry.result
}

async function exchangeRefreshToken(refreshToken: string): Promise<string | null> {
  try {
    const response = await serverFetch(`${API_BASE}/api/auth/refresh`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${refreshToken}`,
        "Content-Type": "application/json",
      },
    })
    if (!response.ok) return null

    const data = await response.json()
    const accessToken = data?.data?.access_token
    return data.success && typeof accessToken === "string" ? accessToken : null
  } catch {
    return null
  }
}
