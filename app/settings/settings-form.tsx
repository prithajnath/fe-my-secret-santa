"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { AlertCircle, Check, Eye, EyeOff, LogOut } from "lucide-react"
import { authApi } from "@/lib/api"

export default function SettingsForm({ email }: { email: string }) {
  const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPasswords, setShowPasswords] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const passwordRequirements = [
    { label: "At least 8 characters", met: newPassword.length >= 8 },
    { label: "Contains a number", met: /\d/.test(newPassword) },
    { label: "Contains a letter", met: /[a-zA-Z]/.test(newPassword) },
  ]

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match")
      return
    }

    if (!passwordRequirements.every((r) => r.met)) {
      setError("New password does not meet requirements")
      return
    }

    setLoading(true)

    try {
      await authApi.changePassword(currentPassword, newPassword)
      setSuccess("Password changed successfully")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" })
      router.push("/login")
      router.refresh()
    } catch {
      router.push("/login")
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="font-serif text-2xl">Account Information</h2>
        <div className="space-y-2">
          <label className="block text-sm font-medium">Email</label>
          <Input value={email} disabled className="bg-gray-100" />
        </div>
      </div>

      <hr className="border-black/10" />

      <form onSubmit={handleChangePassword} className="space-y-4">
        <h2 className="font-serif text-2xl">Change Password</h2>

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
          <label htmlFor="currentPassword" className="block text-sm font-medium">
            Current Password
          </label>
          <div className="relative">
            <Input
              id="currentPassword"
              type={showPasswords ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPasswords(!showPasswords)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="newPassword" className="block text-sm font-medium">
            New Password
          </label>
          <Input
            id="newPassword"
            type={showPasswords ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            maxLength={80}
          />
          <ul className="mt-2 space-y-1">
            {passwordRequirements.map((req) => (
              <li key={req.label} className="flex items-center gap-2 text-xs">
                <Check className={`h-3 w-3 ${req.met ? "text-green-600" : "text-gray-300"}`} />
                <span className={req.met ? "text-green-600" : "text-gray-500"}>{req.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="block text-sm font-medium">
            Confirm New Password
          </label>
          <Input
            id="confirmPassword"
            type={showPasswords ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "Changing..." : "Change Password"}
        </Button>
      </form>

      <hr className="border-black/10" />

      <div className="space-y-4">
        <h2 className="font-serif text-2xl">Sign Out</h2>
        <p className="text-gray-600 text-sm">Sign out of your account on this device.</p>
        <Button variant="outline" onClick={handleLogout} className="gap-2 bg-transparent">
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}
