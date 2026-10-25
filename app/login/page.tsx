"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { AlertCircle, Eye, EyeOff } from "lucide-react"
import { authApi } from "@/lib/api"
import { setAuthCookies } from "@/app/actions"
import { AUTH_NEXT_KEY, nextPathFromLocation } from "@/lib/utils"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  // Where to go after signing in, e.g. an invite link from an email
  const [nextPath, setNextPath] = useState<string | null>(null)

  useEffect(() => {
    setNextPath(nextPathFromLocation())
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await authApi.login(username, password)
      await setAuthCookies(response.access_token, response.refresh_token)
      // Full page load so the layout re-renders with the new session in a single request
      window.location.assign(nextPath ?? "/groups")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid username or password")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const redirectUri = `${window.location.origin}/auth/google/callback`
      const { oauth_url } = await authApi.getGoogleOAuthUrl(redirectUri)
      // Google's redirect drops our query string, so carry ?next= across in sessionStorage
      try {
        if (nextPath) sessionStorage.setItem(AUTH_NEXT_KEY, nextPath)
        else sessionStorage.removeItem(AUTH_NEXT_KEY)
      } catch {
        // Storage unavailable; the user lands on the default page instead
      }
      window.location.href = oauth_url
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initialize Google login")
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h2 className="font-serif text-3xl md:text-4xl">Welcome back</h2>
        <p className="text-gray-600 mt-2">Sign in to your Secret Santa account</p>
      </div>

      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="username" className="block text-sm font-medium">
            Username
          </label>
          <Input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="johndoe"
            required
            className="w-full"
            autoComplete="username"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <Link href="/forgot-password" className="text-sm text-gray-600 hover:text-black">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="w-full pr-10"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-stone-100 px-2 text-gray-500">Or continue with</span>
        </div>
      </div>

      <Button type="button" variant="outline" className="w-full bg-white" onClick={handleGoogleLogin}>
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Continue with Google
      </Button>

      <p className="text-sm text-gray-600 text-center">
        Don&apos;t have an account?{" "}
        <Link
          href={nextPath ? `/register?next=${encodeURIComponent(nextPath)}` : "/register"}
          className="text-black font-medium hover:underline"
        >
          Sign up
        </Link>
      </p>
    </div>
  )
}
