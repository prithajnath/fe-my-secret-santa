import { NextResponse, type NextRequest } from "next/server"
import { AUTH_MARKER_PARAM, clearServerTokens, refreshServerToken } from "@/lib/auth"

// getUser() redirects here when the access token is missing or rejected.
// Refresh once; on failure, end the session instead of retrying.
export async function GET(request: NextRequest) {
  const next = request.nextUrl.searchParams.get("next") ?? "/"
  // Only allow same-site paths, not "//evil.com" or absolute URLs
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/"

  if (await refreshServerToken()) {
    const target = new URL(safeNext, request.url)
    target.searchParams.set(AUTH_MARKER_PARAM, "refreshed")
    return NextResponse.redirect(target)
  }

  await clearServerTokens()
  return NextResponse.redirect(new URL(`/login?${AUTH_MARKER_PARAM}=expired`, request.url))
}
