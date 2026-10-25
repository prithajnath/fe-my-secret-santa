"use client"

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useState } from "react"
import { signOut } from "@/lib/api"

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false)

  async function handleLogout() {
    setIsLoading(true)
    await signOut()
    // Full page load so every server-rendered part (nav, dashboard) drops the session
    window.location.assign("/")
  }

  return (
    <Button
      variant="outline"
      className="w-full gap-2 bg-transparent text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
      onClick={handleLogout}
      disabled={isLoading}
    >
      <LogOut className="h-4 w-4" />
      {isLoading ? "Logging out..." : "Log Out"}
    </Button>
  )
}
