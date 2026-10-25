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
