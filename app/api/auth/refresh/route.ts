import { NextResponse, type NextRequest } from "next/server"
import { AUTH_MARKER_PARAM, clearServerTokens, refreshServerToken } from "@/lib/auth"
import { safeNextPath } from "@/lib/utils"

// getUser() redirects here when the access token is missing or rejected.
// Refresh once; on failure, end the session instead of retrying.
export async function GET(request: NextRequest) {
  const safeNext = safeNextPath(request.nextUrl.searchParams.get("next")) ?? "/"

  if (await refreshServerToken()) {
    const target = new URL(safeNext, request.url)
    target.searchParams.set(AUTH_MARKER_PARAM, "refreshed")
    return NextResponse.redirect(target)
  }

  await clearServerTokens()
  const login = new URL(`/login?${AUTH_MARKER_PARAM}=expired`, request.url)
  if (safeNext !== "/") login.searchParams.set("next", safeNext)
  return NextResponse.redirect(login)
}
