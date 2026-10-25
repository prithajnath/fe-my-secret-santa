"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import {
  Crown,
  Users,
  Mail,
  Loader2,
  UserMinus,
  Eye,
  EyeOff,
  Shuffle,
  LogOut,
  AlertCircle,
  Check,
  MessageSquare,
  Gift,
  Lightbulb,
} from "lucide-react"
import SecretSantaCard from "./secret-santa-card"
import GroupMap from "./group-map"
import { groupsApi, santaApi } from "@/lib/api"
import type { GroupDetail as GroupDetailType, SantaRelationship, SanteeRelationship } from "@/types"

const DRAW_POLL_INTERVAL_MS = 3000
const DRAW_POLL_ATTEMPTS = 20

type DrawStatus =
  | { state: "drawing" }
  | { state: "done"; channelId: string }
  // Admin isn't participating, so there's no pairing of ours to watch for
  | { state: "started" }
  | { state: "slow" }

export default function GroupDetail({ groupId, currentUserId }: { groupId: number; currentUserId: number }) {
  const router = useRouter()
  const [group, setGroup] = useState<GroupDetailType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviting, setInviting] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [drawStatus, setDrawStatus] = useState<DrawStatus | null>(null)
  const [santee, setSantee] = useState<SanteeRelationship | null>(null)
  const [santa, setSanta] = useState<SantaRelationship | null>(null)
  const mounted = useRef(true)

  const isAdmin = group?.members.find((m) => m.user_id === currentUserId)?.is_admin || false

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const data = await groupsApi.get(groupId)
        setGroup(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load group")
      } finally {
        setLoading(false)
      }
    }
    fetchGroup()
    // The pairing cards are optional, so a failure here shouldn't block the page
    santaApi
      .getRelationships()
      .then(({ santees, santas }) => {
        setSantee(santees.find((s) => s.group_id === groupId) ?? null)
        setSanta(santas.find((s) => s.group_id === groupId) ?? null)
      })
      .catch(() => {})
  }, [groupId])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    setInviting(true)
    setInviteSuccess("")
    setError("")

    try {
      await groupsApi.inviteMember(groupId, inviteEmail)
      setInviteSuccess(`Invitation sent to ${inviteEmail}`)
      setInviteEmail("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invite")
    } finally {
      setInviting(false)
    }
  }

  const handleRemoveMember = async (userId: number, username: string) => {
    if (!confirm(`Are you sure you want to remove ${username} from the group?`)) return

    setActionLoading(`remove-${userId}`)
    try {
      await groupsApi.removeMember(groupId, userId)
      setGroup((prev) => (prev ? { ...prev, members: prev.members.filter((m) => m.user_id !== userId) } : prev))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member")
    } finally {
      setActionLoading(null)
    }
  }

  const findPairings = async () => {
    const { santees, santas } = await santaApi.getRelationships()
    return {
      santee: santees.find((s) => s.group_id === groupId),
      santa: santas.find((s) => s.group_id === groupId),
    }
  }

  const handleDrawNames = async () => {
    if (!group) return
    if (!confirm("Are you sure you want to draw names? This will assign Secret Santas to all members.")) return

    setActionLoading("draw")
    setError("")
    setDrawStatus(null)
    const participating = group.members.find((m) => m.user_id === currentUserId)?.participating ?? false
    try {
      // Snapshot the current pairing so a re-draw isn't mistaken for the previous one
      const before = participating ? (await findPairings()).santee : undefined
      await groupsApi.createPairs(groupId)

      // Pairs are drawn asynchronously; we can only watch for them if we're in the draw ourselves
      if (!participating) {
        setDrawStatus({ state: "started" })
        return
      }

      setDrawStatus({ state: "drawing" })
      for (let attempt = 0; attempt < DRAW_POLL_ATTEMPTS; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, DRAW_POLL_INTERVAL_MS))
        if (!mounted.current) return
        const found = await findPairings().catch(() => undefined)
        if (found?.santee && found.santee.channel_id !== before?.channel_id) {
          setSantee(found.santee)
          setSanta(found.santa ?? null)
          setDrawStatus({ state: "done", channelId: found.santee.channel_id })
          router.refresh()
          return
        }
      }
      setDrawStatus({ state: "slow" })
    } catch (err) {
      setDrawStatus(null)
      setError(err instanceof Error ? err.message : "Failed to draw names")
    } finally {
      if (mounted.current) setActionLoading(null)
    }
  }

  const handleToggleReveal = async () => {
    if (!group) return

    setActionLoading("reveal")
    try {
      const result = await groupsApi.toggleReveal(groupId, !group.reveal_latest_pairs)
      setGroup((prev) => (prev ? { ...prev, reveal_latest_pairs: result.reveal_latest_pairs } : prev))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle reveal")
    } finally {
      setActionLoading(null)
    }
  }

  const handleLeaveGroup = async () => {
    if (!confirm("Are you sure you want to leave this group?")) return

    setActionLoading("leave")
    try {
      await groupsApi.leave(groupId)
      router.push("/groups")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to leave group")
    } finally {
      setActionLoading(null)
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error && !group) {
    return (
      <Card className="p-6 bg-red-50 border-red-200 text-center">
        <p className="text-red-800">{error}</p>
        <Button variant="outline" className="mt-4 bg-transparent" onClick={() => router.push("/groups")}>
          Back to Groups
        </Button>
      </Card>
    )
  }

  if (!group) return null

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="font-serif text-4xl md:text-5xl font-light">{group.name}</h1>
          <Link href={`/messages/group/${group.id}`}>
            <Button variant="outline" className="gap-2 bg-transparent">
              <MessageSquare className="h-4 w-4" />
              Group chat
            </Button>
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-gray-600">
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {group.member_count} members
          </span>
          {group.reveal_latest_pairs ? (
            <span className="flex items-center gap-1 text-green-700">
              <Eye className="h-4 w-4" />
              Identities revealed
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <EyeOff className="h-4 w-4" />
              Identities hidden
            </span>
          )}
        </div>
      </div>

      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        </Card>
      )}

      {inviteSuccess && (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center gap-2 text-green-800">
            <Check className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">{inviteSuccess}</p>
          </div>
        </Card>
      )}

      {drawStatus?.state === "drawing" && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-2 text-blue-800">
            <Loader2 className="h-5 w-5 flex-shrink-0 animate-spin" />
            <p className="text-sm">Drawing names… this usually takes a few seconds.</p>
          </div>
        </Card>
      )}

      {drawStatus?.state === "done" && (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-green-800">
            <div className="flex items-center gap-2 flex-1">
              <Check className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">Names drawn! Everyone has been assigned someone to buy for.</p>
            </div>
            <Link
              href={`/messages/${drawStatus.channelId}?role=giver`}
              className="text-sm font-medium underline hover:text-green-950 sm:ml-4"
            >
              See who you&apos;re buying for
            </Link>
          </div>
        </Card>
      )}

      {drawStatus?.state === "started" && (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center gap-2 text-green-800">
            <Check className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">
              Names are being drawn. Everyone will see who they&apos;re buying for in Messages shortly.
            </p>
          </div>
        </Card>
      )}

      {drawStatus?.state === "slow" && (
        <Card className="p-4 bg-amber-50 border-amber-200">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">
              Names are still being drawn. Check{" "}
              <Link href="/messages" className="underline">
                Messages
              </Link>{" "}
              in a minute to see who you&apos;re buying for.
            </p>
          </div>
        </Card>
      )}

      {(santee || santa) && (
        <div className="grid gap-6 md:grid-cols-2">
          {santee && (
            <Card className="p-6 gap-4 bg-red-50/60 border border-red-100">
              <p className="text-sm text-red-800 flex items-center gap-1.5">
                <Gift className="h-4 w-4" />
                You&apos;re buying for
              </p>
              <div className="flex items-center gap-4 min-w-0">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={santee.santee.avatar_url} alt={santee.santee.first_name} />
                  <AvatarFallback>{getInitials(santee.santee.first_name, santee.santee.last_name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-serif text-2xl truncate">
                    {santee.santee.first_name} {santee.santee.last_name}
                  </p>
                  <p className="text-sm text-gray-600">@{santee.santee.username}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-auto">
                <Link href={`/users/${santee.santee.username}`} className="flex-1">
                  <Button className="w-full gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Hints &amp; address
                  </Button>
                </Link>
                <Link href={`/messages/${santee.channel_id}?role=giver`} className="flex-1">
                  <Button variant="outline" className="w-full gap-2 bg-transparent">
                    <MessageSquare className="h-4 w-4" />
                    Message
                  </Button>
                </Link>
              </div>
            </Card>
          )}

          {santa && <SecretSantaCard santa={santa} groupName={group.name} members={group.members} />}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6 bg-white/50 border border-black/5">
          <h3 className="font-serif text-xl mb-4 flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Invite Members
          </h3>
          <form onSubmit={handleInvite} className="space-y-3">
            <Input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="friend@example.com"
              required
            />
            <Button type="submit" className="w-full" disabled={inviting}>
              {inviting ? "Sending..." : "Send Invite"}
            </Button>
          </form>
        </Card>

        {isAdmin && (
          <Card className="p-6 bg-white/50 border border-black/5">
            <h3 className="font-serif text-xl mb-4 flex items-center gap-2">
              <Shuffle className="h-5 w-5" />
              Admin Actions
            </h3>
            <div className="space-y-3">
              <Button onClick={handleDrawNames} className="w-full gap-2" disabled={actionLoading === "draw"}>
                {actionLoading === "draw" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Shuffle className="h-4 w-4" />
                )}
                {drawStatus?.state === "drawing" ? "Drawing Names..." : "Draw Names"}
              </Button>
              <Button
                onClick={handleToggleReveal}
                variant="outline"
                className="w-full gap-2 bg-transparent"
                disabled={actionLoading === "reveal"}
              >
                {actionLoading === "reveal" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : group.reveal_latest_pairs ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                {group.reveal_latest_pairs ? "Hide Identities" : "Reveal Identities"}
              </Button>
            </div>
          </Card>
        )}
      </div>

      <GroupMap groupId={groupId} />

      <Card className="p-6 bg-white/50 border border-black/5">
        <h3 className="font-serif text-2xl mb-4">Members</h3>
        <div className="space-y-3">
          {group.members.map((member) => (
            <div
              key={member.user_id}
              className="flex items-center justify-between p-4 bg-white rounded-lg border border-black/5"
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={member.avatar_url || "/placeholder.svg?height=40&width=40"} />
                  <AvatarFallback>{getInitials(member.first_name, member.last_name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {member.first_name} {member.last_name}
                  </p>
                  <p className="text-sm text-gray-600">@{member.username}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {member.is_admin && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                    <Crown className="h-3 w-3" />
                    Admin
                  </span>
                )}
                {!member.participating && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">Not participating</span>
                )}
                {isAdmin && !member.is_admin && member.user_id !== currentUserId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveMember(member.user_id, member.username)}
                    disabled={actionLoading === `remove-${member.user_id}`}
                  >
                    {actionLoading === `remove-${member.user_id}` ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserMinus className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 bg-gray-50 border border-gray-200">
        <h3 className="font-serif text-xl mb-2">Leave Group</h3>
        <p className="text-sm text-gray-600 mb-4">You can leave this group at any time.</p>
        <Button
          variant="outline"
          className="gap-2 bg-transparent"
          onClick={handleLeaveGroup}
          disabled={actionLoading === "leave"}
        >
          {actionLoading === "leave" ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
          Leave Group
        </Button>
      </Card>
    </div>
  )
}
