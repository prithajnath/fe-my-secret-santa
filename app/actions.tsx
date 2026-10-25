"use server"

import { clearServerTokens, setServerTokens } from "@/lib/auth"

export async function setAuthCookies(accessToken: string, refreshToken: string) {
  await setServerTokens(accessToken, refreshToken)
}

export async function clearAuthCookies() {
  await clearServerTokens()
}
