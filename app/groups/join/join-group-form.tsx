"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { AlertCircle, Check } from "lucide-react"
import { invitesApi } from "@/lib/api"

// initialCode comes from invite links (/groups/join?code=GROUP-XXXX)
export default function JoinGroupForm({ initialCode }: { initialCode?: string }) {
  const router = useRouter()
  const [code, setCode] = useState(initialCode ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!code.trim()) {
      setError("Invite code is required")
      return
    }

    setLoading(true)

    try {
      const result = await invitesApi.accept(code.trim())
      setSuccess(result.message)
      setTimeout(() => {
        router.push(`/groups/${result.group_id}`)
        router.refresh()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid or expired invite code")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        </Card>
      )}

      {success && (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center gap-2 text-green-800">
            <Check className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">{success}</p>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        <label htmlFor="code" className="block text-sm font-medium">
          Invite Code
        </label>
        <Input
          id="code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="GROUP-ABC123"
          className="text-center text-lg font-mono tracking-wider uppercase"
          required
        />
        <p className="text-xs text-gray-500">Enter the invite code from your email</p>
      </div>

      <Button type="submit" className="w-full" disabled={loading || !!success}>
        {loading ? "Joining..." : "Join Group"}
      </Button>
    </form>
  )
}
