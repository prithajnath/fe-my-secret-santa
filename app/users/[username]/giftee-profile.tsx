"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Gift, MapPin, Lightbulb, Loader2, MessageSquare, Lock } from "lucide-react"
import { santaApi, usersApi } from "@/lib/api"
import type { PublicUserProfile, SanteeRelationship } from "@/types"

// The backend only returns this profile to the user's Secret Santa
export default function GifteeProfile({ username }: { username: string }) {
  const [profile, setProfile] = useState<PublicUserProfile | null>(null)
  const [pairings, setPairings] = useState<SanteeRelationship[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const [profileData, santaData] = await Promise.all([
          usersApi.getUser(username),
          santaApi.getRelationships(),
        ])
        setProfile(profileData)
        setPairings(santaData.santees.filter((s) => s.santee.username === username))
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile")
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [username])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <Card className="p-8 bg-white/50 border border-black/5 text-center">
        <Lock className="h-10 w-10 mx-auto text-gray-400 mb-3" />
        <h2 className="font-serif text-2xl mb-2">Profile unavailable</h2>
        <p className="text-gray-600">{error || "This profile couldn't be loaded."}</p>
      </Card>
    )
  }

  const initials = `${profile.first_name[0] ?? ""}${profile.last_name[0] ?? ""}`.toUpperCase()

  return (
    <div className="space-y-6">
      <Card className="p-6 md:p-8 bg-white/50 border border-black/5">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <Avatar className="h-32 w-32 md:h-40 md:w-40">
              <AvatarImage src={profile.avatar_url} alt={profile.first_name} />
              <AvatarFallback className="text-3xl">{initials}</AvatarFallback>
            </Avatar>
            {pairings.map((pairing) => (
              <Link key={pairing.channel_id} href={`/messages/${pairing.channel_id}?role=giver`} className="w-full">
                <Button variant="outline" className="w-full gap-2 bg-transparent">
                  <MessageSquare className="h-4 w-4" />
                  {pairings.length > 1 ? `Message · ${pairing.group_name}` : "Message anonymously"}
                </Button>
              </Link>
            ))}
          </div>

          <div className="flex-1 space-y-6">
            <div className="space-y-2">
              <p className="text-sm text-red-800 flex items-center gap-1.5">
                <Gift className="h-4 w-4" />
                You&apos;re their Secret Santa
                {pairings.length > 0 && ` in ${pairings.map((p) => p.group_name).join(", ")}`}
              </p>
              <h1 className="font-serif text-3xl md:text-4xl font-light">
                {profile.first_name} {profile.last_name}
              </h1>
              <p className="text-gray-600">@{profile.username}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                <h3 className="font-serif text-xl">Gift Hints</h3>
              </div>
              {profile.hint ? (
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{profile.hint}</p>
              ) : (
                <p className="text-gray-500">
                  {profile.first_name} hasn&apos;t added any hints yet. Ask them in your anonymous chat!
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-red-600" />
                <h3 className="font-serif text-xl">Shipping Address</h3>
              </div>
              {profile.address ? (
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{profile.address}</p>
              ) : (
                <p className="text-gray-500">No shipping address yet.</p>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
