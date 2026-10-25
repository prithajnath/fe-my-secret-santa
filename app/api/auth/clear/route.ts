import { NextResponse, type NextRequest } from "next/server"
import { AUTH_MARKER_PARAM, clearServerTokens } from "@/lib/auth"

// Ends a session the backend no longer accepts. getUser() can't clear cookies itself.
export async function GET(request: NextRequest) {
  await clearServerTokens()
  return NextResponse.redirect(new URL(`/login?${AUTH_MARKER_PARAM}=expired`, request.url))
}
