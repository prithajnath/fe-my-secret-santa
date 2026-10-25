import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// API errors look like {"error": {"message": ...}}; older paths may use a string error or top-level message
export function apiErrorMessage(body: unknown, fallback: string): string {
  const b = body as { error?: unknown; message?: unknown } | null
  const error = b?.error as { message?: unknown } | string | undefined
  if (typeof error === "object" && typeof error?.message === "string") return error.message
  if (typeof error === "string") return error
  if (typeof b?.message === "string") return b.message
  return fallback
}

// Post-login destination from ?next=. Only same-site paths, so it can't be used as an open redirect.
export function safeNextPath(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return null
  if (next === "/login" || next.startsWith("/login?")) return null
  return next
}

// Reads ?next= from the current URL (client only)
export function nextPathFromLocation(): string | null {
  return safeNextPath(new URLSearchParams(window.location.search).get("next"))
}

// sessionStorage key carrying ?next= across the Google OAuth round trip
export const AUTH_NEXT_KEY = "auth_next"
