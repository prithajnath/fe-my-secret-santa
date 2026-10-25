"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { authApi } from "@/lib/api"
import { setAuthCookies } from "@/app/actions"

export default function GoogleCallbackPage() {
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const exchanged = useRef(false)

  useEffect(() => {
    const code = searchParams.get("code")
    const errorParam = searchParams.get("error")

    if (errorParam) {
      setError("Google authentication was cancelled or failed")
      return
    }

    if (!code) {
      setError("No authorization code received")
      return
    }

    // Google codes are single-use; StrictMode's double effect in dev would otherwise exchange it twice
    if (exchanged.current) return
    exchanged.current = true
    // Keep the code out of the address bar and history
    window.history.replaceState(null, "", window.location.pathname)

    const handleCallback = async () => {
      try {
        const redirectUri = `${window.location.origin}/auth/google/callback`
        const response = await authApi.handleGoogleCallback(code, redirectUri)
        await setAuthCookies(response.access_token, response.refresh_token)

        // Full page load so the layout re-renders with the new session in a single request
        window.location.replace(response.user.is_new_user ? "/profile/edit?welcome=true" : "/groups")
      } catch (err) {
        setError(err instanceof Error ? err.message : "Authentication failed")
      }
    }

    handleCallback()
  }, [searchParams])

  if (error) {
    return (
      <div className="max-w-md mx-auto">
        <Card className="p-8 bg-white/50 border border-black/5 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="font-serif text-2xl mb-2">Authentication failed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/login">
            <Button className="w-full">Back to login</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      <Card className="p-8 bg-white/50 border border-black/5 text-center">
        <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-gray-400" />
        <h2 className="font-serif text-2xl mb-2">Signing you in...</h2>
        <p className="text-gray-600">Please wait while we complete your authentication.</p>
      </Card>
    </div>
  )
}
