import { NextResponse, type NextRequest } from "next/server"
import { isExpiringSoon } from "@/lib/jwt"
import { ACCESS_COOKIE, ACCESS_MAX_AGE, REFRESH_COOKIE, refreshAccessToken, sessionCookie } from "@/lib/session"

export async function proxy(request: NextRequest) {
  const headers = new Headers(request.headers)
  // Exposes the current path to server components so getUser() can send the user back
  // to the same page after a token refresh
  headers.set("x-pathname", request.nextUrl.pathname + request.nextUrl.search)

  // Refresh an expired or nearly expired access token once, here, before any page or layout
  // renders. Otherwise every parallel render and prefetch would refresh on its own.
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value
  let refreshed: string | null = null
  if (refreshToken && (!accessToken || isExpiringSoon(accessToken))) {
    refreshed = await refreshAccessToken(refreshToken)
    if (refreshed) {
      // Server components in this same request read the new token, not the expired one
      request.cookies.set(ACCESS_COOKIE, refreshed)
      headers.set("cookie", request.cookies.toString())
    }
    // On failure, getUser() sees the bad token and falls back to /api/auth/refresh → /login
  }

  const response = NextResponse.next({ request: { headers } })
  if (refreshed) response.cookies.set(ACCESS_COOKIE, refreshed, sessionCookie(ACCESS_MAX_AGE))
  return response
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
