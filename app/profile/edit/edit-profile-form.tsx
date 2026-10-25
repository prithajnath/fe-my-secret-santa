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
import AddressFields, { EMPTY_ADDRESS, type AddressFormValue } from "@/components/address-fields"
import type { AddressComponents, AddressInput } from "@/types"

interface ProfileData {
  firstName: string
  lastName: string
  email: string
  username: string
  hint: string
  // Composed display string; for legacy accounts it's free text with no components
  address: string
  addressComponents: AddressComponents | null
  addressVerified: boolean
  avatarUrl: string
}

function toFormValue(components: AddressComponents | null): AddressFormValue {
  if (!components) return EMPTY_ADDRESS
  return {
    line1: components.address_line1,
    line2: components.address_line2 ?? "",
    city: components.city,
    state: components.state,
    zip: components.zip,
    coords: null,
  }
}

// null clears the address; coordinates are only sent for a picked suggestion
function toAddressInput(value: AddressFormValue): AddressInput | null {
  if (!value.line1.trim() && !value.city.trim() && !value.state && !value.zip.trim()) return null
  return {
    address_line1: value.line1.trim(),
    address_line2: value.line2.trim() || null,
    city: value.city.trim(),
    state: value.state,
    zip: value.zip.trim(),
    ...(value.coords && { lat: value.coords.lat, lon: value.coords.lon }),
  }
}

// Backend validation errors that belong next to the address fields rather than in the banner
const ADDRESS_ERROR = /address|city|state|zip/i

export default function EditProfileForm({ profile }: { profile: ProfileData }) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    firstName: profile.firstName,
    lastName: profile.lastName,
    hint: profile.hint,
  })
  const [address, setAddress] = useState<AddressFormValue>(() => toFormValue(profile.addressComponents))
  // Only send address_components when the user touched the address, so saving names or hints
  // never rewrites (or un-verifies) a stored address
  const [addressDirty, setAddressDirty] = useState(false)
  const [addressError, setAddressError] = useState("")
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
    setAddressError("")
    setSuccess(false)

    try {
      await usersApi.updateMe({
        first_name: formData.firstName,
        last_name: formData.lastName,
        hint: formData.hint,
        ...(addressDirty && { address_components: toAddressInput(address) }),
      })
      setSuccess(true)
      setTimeout(() => {
        router.push("/profile")
        router.refresh()
      }, 1000)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update profile"
      if (addressDirty && ADDRESS_ERROR.test(message)) setAddressError(message)
      else setError(message)
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

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Shipping Address</legend>
        <p className="text-xs text-gray-500">Your address is only visible to your Secret Santa</p>
        {!profile.addressComponents && profile.address && !addressDirty && (
          <p className="text-sm text-gray-700 bg-yellow-50 border border-yellow-200 rounded-md p-3">
            Saved address: <span className="font-medium">{profile.address}</span>
            <br />
            <span className="text-gray-600">Re-enter it below using the suggestions to verify it.</span>
          </p>
        )}
        <AddressFields
          value={address}
          onChange={(value) => {
            setAddress(value)
            setAddressDirty(true)
            setAddressError("")
          }}
          verified={addressDirty ? address.coords !== null : profile.addressVerified}
          error={addressError}
        />
      </fieldset>

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
