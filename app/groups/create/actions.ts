"use server"

import { getServerToken } from "@/lib/auth"
import { serverFetch } from "@/lib/server-fetch"
import { redirect } from "next/navigation"
import { apiErrorMessage } from "@/lib/utils"

const API_BASE = process.env.API_BASE_URL || "https://localhost:9100"

export async function createGroup(formData: FormData) {
  const token = await getServerToken()
  if (!token) {
    redirect("/login")
  }

  const name = formData.get("name") as string

  if (!name || name.trim().length === 0) {
    throw new Error("Group name is required")
  }

  const response = await serverFetch(`${API_BASE}/api/groups`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name: name.trim() }),
  })

  const data = await response.json()

  if (!response.ok || !data.success) {
    throw new Error(apiErrorMessage(data, "Failed to create group"))
  }

  redirect(`/groups/${data.data.id}`)
}
