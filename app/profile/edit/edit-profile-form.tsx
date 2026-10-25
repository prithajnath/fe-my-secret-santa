"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { AlertCircle, Check } from "lucide-react"
import { usersApi } from "@/lib/api"

interface ProfileData {
  firstName: string
  lastName: string
  email: string
  username: string
  hint: string
  address: string
  avatarUrl: string
}

export default function EditProfileForm({ profile }: { profile: ProfileData }) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    firstName: profile.firstName,
    lastName: profile.lastName,
    hint: profile.hint,
    address: profile.address,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)

    try {
      await usersApi.updateMe({
        first_name: formData.firstName,
        last_name: formData.lastName,
        hint: formData.hint,
        address: formData.address,
      })
      setSuccess(true)
      setTimeout(() => {
        router.push("/profile")
        router.refresh()
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
            <p className="text-sm">Profile updated successfully!</p>
          </div>
        </Card>
      )}

      <div className="flex flex-col items-center gap-4">
        <Avatar className="h-32 w-32">
          <AvatarImage src={profile.avatarUrl || "/placeholder.svg?height=200&width=200"} alt={formData.firstName} />
          <AvatarFallback className="text-3xl">{getInitials(formData.firstName, formData.lastName)}</AvatarFallback>
        </Avatar>
        <p className="text-sm text-gray-500">Avatar can be changed via Google account settings</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="firstName" className="block text-sm font-medium">
            First Name
          </label>
          <Input
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            minLength={2}
            maxLength={150}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="lastName" className="block text-sm font-medium">
            Last Name
          </label>
          <Input
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            minLength={2}
            maxLength={150}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="username" className="block text-sm font-medium">
          Username
        </label>
        <Input id="username" value={profile.username} disabled className="bg-gray-100" />
        <p className="text-xs text-gray-500">Username cannot be changed</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <Input id="email" type="email" value={profile.email} disabled className="bg-gray-100" />
        <p className="text-xs text-gray-500">Email cannot be changed</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="hint" className="block text-sm font-medium">
          Gift Hints
        </label>
        <Textarea
          id="hint"
          name="hint"
          value={formData.hint}
          onChange={handleChange}
          placeholder="I love board games and puzzles, cozy sweaters, anything coffee-related..."
          rows={3}
        />
        <p className="text-xs text-gray-500">Help your Secret Santa find the perfect gift by sharing your interests</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="address" className="block text-sm font-medium">
          Shipping Address
        </label>
        <Textarea
          id="address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="123 Main St, City, State 12345"
          rows={2}
        />
        <p className="text-xs text-gray-500">Your address is only visible to your Secret Santa</p>
      </div>

      <div className="flex gap-4">
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/profile")} className="bg-transparent">
          Cancel
        </Button>
      </div>
    </form>
  )
}
