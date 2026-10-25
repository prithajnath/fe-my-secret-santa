import { NextResponse } from "next/server"
import { setServerTokens } from "@/lib/auth"
import { serverFetch } from "@/lib/server-fetch"
import { apiErrorMessage } from "@/lib/utils"

const API_BASE = process.env.API_BASE_URL || "https://localhost:9100"

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    const response = await serverFetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      return NextResponse.json(
        { success: false, error: apiErrorMessage(data, "Invalid credentials") },
        { status: response.status },
      )
    }

    // Set tokens in cookies
    await setServerTokens(data.data.access_token, data.data.refresh_token)

    return NextResponse.json({
      success: true,
      data: { user: data.data.user },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "An error occurred during login" }, { status: 500 })
  }
}
