// Reads a JWT's `exp` (seconds since epoch) without verifying the signature. Only used to decide
// when to refresh early; the backend still verifies every token. Safe in browser and server code.
export function jwtExpiry(token: string | null | undefined): number | null {
  const payload = token?.split(".")[1]
  if (!payload) return null
  try {
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    const exp = JSON.parse(json).exp
    return typeof exp === "number" ? exp : null
  } catch {
    return null
  }
}

// Refresh this long before expiry so a token can't expire mid-request
export const REFRESH_LEEWAY_SECONDS = 60

export function isExpiringSoon(token: string | null | undefined): boolean {
  const exp = jwtExpiry(token)
  // Unreadable tokens are left to the backend to judge
  if (exp === null) return false
  return exp - Date.now() / 1000 < REFRESH_LEEWAY_SECONDS
}
