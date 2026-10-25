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
import GoogleAuthButton from "@/components/google-auth-button"
import { nextPathFromLocation } from "@/lib/utils"

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

      <GoogleAuthButton nextPath={nextPath} onError={setError} />

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
