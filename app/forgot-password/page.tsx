"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { AlertCircle, ArrowLeft, Mail } from "lucide-react"
import { authApi } from "@/lib/api"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await authApi.resetPassword(email)
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reset email")
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <Card className="p-8 bg-white/50 border border-black/5 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="font-serif text-2xl mb-2">Check your email</h2>
          <p className="text-gray-600 mb-6">
            If an account exists with <span className="font-medium">{email}</span>, we&apos;ve sent a temporary password
            to reset your account.
          </p>
          <Link href="/login">
            <Button className="w-full">Back to login</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <Link href="/login" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black">
        <ArrowLeft className="h-4 w-4" />
        Back to login
      </Link>

      <div>
        <h2 className="font-serif text-3xl md:text-4xl">Forgot password?</h2>
        <p className="text-gray-600 mt-2">
          Enter your email address and we&apos;ll send you a temporary password to log in.
        </p>
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
          <label htmlFor="email" className="block text-sm font-medium">
            Email address
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
            required
            className="w-full"
            autoComplete="email"
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Sending..." : "Send reset email"}
        </Button>
      </form>
    </div>
  )
}
