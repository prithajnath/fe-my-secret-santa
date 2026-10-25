"use client"

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function LogoutButton() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  async function handleLogout() {
    setIsLoading(true)
    try {
      const response = await fetch("/api/logout", { method: "POST" })
      if (response.ok) {
        router.push("/")
        router.refresh()
      }
    } catch {
      setIsLoading(false)
    }
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
