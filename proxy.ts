import { NextResponse, type NextRequest } from "next/server"

// Exposes the current path to server components so getUser() can send the user back
// to the same page after a token refresh
export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers)
  headers.set("x-pathname", request.nextUrl.pathname + request.nextUrl.search)
  return NextResponse.next({ request: { headers } })
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
