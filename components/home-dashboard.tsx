"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  ChevronRight,
  Crown,
  Eye,
  Gift,
  Lightbulb,
  Loader2,
  MapPin,
  MessageCircle,
  Plus,
  Shuffle,
  Ticket,
  UserCircle,
  Users,
} from "lucide-react"
import { groupsApi, messagesApi, santaApi } from "@/lib/api"
import type { GroupListItem, InboxSummary, SantaRelationship, SanteeRelationship } from "@/types"

export interface DashboardUser {
  first_name: string
  hint?: string
  address?: string
  address_verified?: boolean
}

interface Exchange {
  group: GroupListItem
  santee?: SanteeRelationship
  santa?: SantaRelationship
}

type DrawState = "drawn" | "drawing" | "waiting"

function drawState({ group, santee, santa }: Exchange): DrawState {
  if (group.draw_status === "in_progress") return "drawing"
  // Older backends don't send draw info; having a pairing in the group means names were drawn
  if (group.draw_status === "done" || group.pairs_drawn_at || santee || santa) return "drawn"
  return "waiting"
}

function UnreadBadge({ count }: { count?: number }) {
  if (!count) return null
  return (
    <span className="ml-auto min-w-5 h-5 px-1.5 rounded-full bg-red-600 text-white text-[11px] font-medium flex items-center justify-center">
      {count > 99 ? "99+" : count}
      <span className="sr-only"> unread</span>
    </span>
  )
}

function ChatLink({ href, icon, label, unread }: { href: string; icon: React.ReactNode; label: string; unread?: number }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-black/5 transition-colors"
    >
      {icon}
      <span className="truncate">{label}</span>
      <UnreadBadge count={unread} />
    </Link>
  )
}

// The giftee's name stays hidden until tapped, so it isn't on screen if someone glances over
function GifteeReveal({ santee }: { santee: SanteeRelationship }) {
  const [revealed, setRevealed] = useState(false)
  const name = `${santee.santee.first_name} ${santee.santee.last_name}`

  if (!revealed) {
    return (
      <button
        type="button"
        onClick={() => setRevealed(true)}
        className="w-full flex items-center gap-3 rounded-lg border border-dashed border-red-200 bg-red-50/60 px-3 py-2.5 text-left hover:bg-red-50 transition-colors"
      >
        <Gift className="h-5 w-5 text-red-700 flex-shrink-0" />
        <span className="flex-1 min-w-0">
          <span className="block text-xs text-red-800">You&apos;re buying for</span>
          <span className="block font-medium blur-sm select-none" aria-hidden="true">
            {name}
          </span>
        </span>
        <span className="flex items-center gap-1 text-xs font-medium text-red-800">
          <Eye className="h-4 w-4" />
          Tap to reveal
        </span>
      </button>
    )
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-red-100 bg-red-50/60 px-3 py-2.5">
      <Avatar className="h-9 w-9">
        <AvatarImage src={santee.santee.avatar_url} alt="" />
        <AvatarFallback>{santee.santee.first_name[0]?.toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-red-800">You&apos;re buying for</p>
        <p className="font-medium truncate">{name}</p>
      </div>
      <Link href={`/users/${santee.santee.username}`} className="text-xs font-medium text-red-800 underline flex-shrink-0">
        Hints &amp; address
      </Link>
    </div>
  )
}

function ExchangeCard({ exchange, inbox }: { exchange: Exchange; inbox: InboxSummary | null }) {
  const { group, santee, santa } = exchange
  const state = drawState(exchange)
  const unread = (channelId?: string) => inbox?.pairs.find((p) => p.channel_id === channelId)?.unread
  const groupUnread = inbox?.groups.find((g) => g.group_id === group.id)?.unread
  const notInDraw = state === "drawn" && !santee && group.participating === false

  return (
    <Card className="p-5 gap-4 bg-white/50 border border-black/5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/groups/${group.id}`} className="font-serif text-2xl hover:underline block truncate">
            {group.name}
          </Link>
          <p className="text-sm text-gray-600 flex items-center gap-1.5 mt-0.5">
            <Users className="h-4 w-4" />
            {group.member_count} {group.member_count === 1 ? "member" : "members"}
            {group.is_admin && (
              <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-[11px] font-medium text-yellow-800">
                <Crown className="h-3 w-3" />
                Admin
              </span>
            )}
          </p>
        </div>
        {group.member_avatars && group.member_avatars.length > 0 && (
          <div className="flex -space-x-2 flex-shrink-0">
            {group.member_avatars.slice(0, 4).map((src, i) => (
              <Avatar key={i} className="h-7 w-7 ring-2 ring-white">
                <AvatarImage src={src} alt="" />
                <AvatarFallback />
              </Avatar>
            ))}
          </div>
        )}
      </div>

      <div>
        {state === "drawn" && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">
            <Shuffle className="h-3.5 w-3.5" />
            Names drawn{group.pairs_drawn_at && ` · ${format(new Date(group.pairs_drawn_at), "MMM d")}`}
          </span>
        )}
        {state === "drawing" && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-800">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Drawing names…
          </span>
        )}
        {state === "waiting" && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
            Waiting for the draw
          </span>
        )}
      </div>

      {santee && <GifteeReveal santee={santee} />}
      {notInDraw && <p className="text-sm text-gray-600">You&apos;re not part of this draw.</p>}
      {state === "waiting" && group.is_admin && (
        <p className="text-sm text-gray-600">
          Once everyone has joined,{" "}
          <Link href={`/groups/${group.id}`} className="underline hover:text-black">
            draw names
          </Link>{" "}
          to assign Secret Santas.
        </p>
      )}

      <div className="space-y-0.5 -mx-2">
        {santee && (
          <ChatLink
            href={`/messages/${santee.channel_id}?role=giver`}
            icon={<Gift className="h-4 w-4 text-red-700" />}
            label="Chat with your giftee"
            unread={unread(santee.channel_id)}
          />
        )}
        {santa && (
          <ChatLink
            href={`/messages/${santa.channel_id}?role=receiver`}
            icon={<UserCircle className="h-4 w-4 text-green-700" />}
            label="Chat with your Secret Santa"
            unread={unread(santa.channel_id)}
          />
        )}
        <ChatLink
          href={`/messages/group/${group.id}`}
          icon={<MessageCircle className="h-4 w-4 text-blue-700" />}
          label="Group chat"
          unread={groupUnread}
        />
      </div>

      <Link
        href={`/groups/${group.id}`}
        className="mt-auto flex items-center justify-end gap-1 text-sm font-medium text-gray-700 hover:text-black"
      >
        Open group
        <ChevronRight className="h-4 w-4" />
      </Link>
    </Card>
  )
}

function Nudges({ user }: { user: DashboardUser }) {
  const nudges: { icon: React.ReactNode; text: string; action: string }[] = []
  if (!user.hint?.trim()) {
    nudges.push({
      icon: <Lightbulb className="h-5 w-5 text-yellow-600" />,
      text: "Add gift hints so your Secret Santa knows what you'd love.",
      action: "Add hints",
    })
  }
  if (!user.address) {
    nudges.push({
      icon: <MapPin className="h-5 w-5 text-red-600" />,
      text: "Add your shipping address so your Secret Santa can send your gift.",
      action: "Add address",
    })
  } else if (!user.address_verified) {
    nudges.push({
      icon: <MapPin className="h-5 w-5 text-red-600" />,
      text: "Verify your address by picking it from the suggestions.",
      action: "Verify",
    })
  }
  if (nudges.length === 0) return null

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {nudges.map((nudge) => (
        <Link key={nudge.action} href="/profile/edit">
          <Card className="p-4 gap-0 bg-yellow-50/70 border border-yellow-200 hover:bg-yellow-50 transition-colors h-full">
            <div className="flex items-center gap-3">
              {nudge.icon}
              <p className="flex-1 text-sm text-gray-800">{nudge.text}</p>
              <span className="text-sm font-medium whitespace-nowrap">{nudge.action} →</span>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
}

export default function HomeDashboard({ user }: { user: DashboardUser }) {
  const [exchanges, setExchanges] = useState<Exchange[] | null>(null)
  const [inbox, setInbox] = useState<InboxSummary | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    const load = async () => {
      try {
        const [groups, santaData, inboxData] = await Promise.all([
          groupsApi.list(),
          santaApi.getRelationships(),
          messagesApi.getInbox(),
        ])
        setExchanges(
          groups.map((group) => ({
            group,
            santee: santaData.santees.find((s) => s.group_id === group.id),
            santa: santaData.santas.find((s) => s.group_id === group.id),
          })),
        )
        setInbox(inboxData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load your exchanges")
      }
    }
    load()
  }, [])

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-serif text-4xl md:text-5xl font-light">Welcome back, {user.first_name} 👋</h1>
        <p className="text-gray-700">
          {exchanges === null
            ? "Here's what's happening with your Secret Santa exchanges."
            : exchanges.length === 0
              ? "You're not in any exchanges yet."
              : `You're in ${exchanges.length} Secret Santa ${exchanges.length === 1 ? "exchange" : "exchanges"}.`}
        </p>
      </div>

      <Nudges user={user} />

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-2xl">Your exchanges</h2>
          <div className="flex gap-2">
            <Link href="/groups/join">
              <Button variant="outline" className="gap-2 bg-transparent">
                <Ticket className="h-4 w-4" />
                Join with code
              </Button>
            </Link>
            <Link href="/groups/create">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create group
              </Button>
            </Link>
          </div>
        </div>

        {error && (
          <Card className="p-4 bg-red-50 border-red-200">
            <p className="text-sm text-red-800">{error}</p>
          </Card>
        )}

        {exchanges === null && !error && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        )}

        {exchanges?.length === 0 && (
          <Card className="p-10 bg-white/50 border border-black/5 text-center gap-3">
            <Gift className="h-12 w-12 mx-auto text-gray-400" />
            <h3 className="font-serif text-2xl">Start your first exchange</h3>
            <p className="text-gray-600">Create a group and invite friends, or join one with an invite code.</p>
          </Card>
        )}

        {exchanges && exchanges.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2">
            {exchanges.map((exchange) => (
              <ExchangeCard key={exchange.group.id} exchange={exchange} inbox={inbox} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
