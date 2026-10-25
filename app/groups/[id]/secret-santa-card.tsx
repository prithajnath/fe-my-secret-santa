"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserCircle, HelpCircle, MessageSquare, Loader2, Sparkles } from "lucide-react"
import { santaApi } from "@/lib/api"
import { hasRevealedSanta, markSantaRevealed } from "@/lib/reveal"
import type { GroupMember, SantaRelationship } from "@/types"

// Spin slows from fast to slow over ~2s before landing on the real Santa
const SPIN_STEPS = 12
const SPIN_START_MS = 70
const SPIN_END_MS = 260

interface Person {
  username: string
  first_name: string
  last_name: string
  avatar_url?: string
}

type RevealState =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "spinning"; person: Person }
  | { state: "revealed"; person: Person }

interface SecretSantaCardProps {
  santa: SantaRelationship
  groupName: string
  members: GroupMember[]
}

export default function SecretSantaCard({ santa, groupName, members }: SecretSantaCardProps) {
  const [reveal, setReveal] = useState<RevealState>({ state: "idle" })
  const [error, setError] = useState("")
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    return () => timeouts.current.forEach(clearTimeout)
  }, [])

  // Already revealed on an earlier visit: show the Santa straight away, no spin
  useEffect(() => {
    if (!santa.reveal_enabled || !hasRevealedSanta(santa.group_id)) return
    setReveal({ state: "loading" })
    santaApi
      .reveal(groupName)
      .then((data) => setReveal({ state: "revealed", person: data.secret_santa }))
      .catch(() => setReveal({ state: "idle" }))
  }, [santa.group_id, santa.reveal_enabled, groupName])

  const toPerson = (username: string): Person => {
    const member = members.find((m) => m.username === username)
    return member ?? { username, first_name: username, last_name: "" }
  }

  const handleReveal = async () => {
    setError("")
    setReveal({ state: "loading" })
    try {
      const data = await santaApi.reveal(groupName)
      markSantaRevealed(santa.group_id)

      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      const decoys = data.decoy_usernames.filter((u) => u !== data.secret_santa_username)
      if (reducedMotion || decoys.length === 0) {
        setReveal({ state: "revealed", person: data.secret_santa })
        return
      }

      let elapsed = 0
      for (let step = 0; step < SPIN_STEPS; step++) {
        const delay = SPIN_START_MS + ((SPIN_END_MS - SPIN_START_MS) * step) / (SPIN_STEPS - 1)
        const person = toPerson(decoys[step % decoys.length])
        timeouts.current.push(setTimeout(() => setReveal({ state: "spinning", person }), elapsed))
        elapsed += delay
      }
      timeouts.current.push(
        setTimeout(() => setReveal({ state: "revealed", person: data.secret_santa }), elapsed),
      )
    } catch (err) {
      setReveal({ state: "idle" })
      setError(err instanceof Error ? err.message : "Failed to reveal your Secret Santa")
    }
  }

  const shown = reveal.state === "spinning" || reveal.state === "revealed" ? reveal.person : null
  const isRevealed = reveal.state === "revealed"

  return (
    <Card className="p-6 gap-4 bg-green-50/60 border border-green-100">
      <p className="text-sm text-green-800 flex items-center gap-1.5">
        <UserCircle className="h-4 w-4" />
        Your Secret Santa
      </p>

      <div className="flex items-center gap-4 min-w-0" aria-live="polite">
        {shown ? (
          <>
            <Avatar className={`h-14 w-14 ${isRevealed ? "ring-2 ring-green-500 ring-offset-2" : "opacity-70"}`}>
              <AvatarImage src={shown.avatar_url} alt={shown.first_name} />
              <AvatarFallback>{shown.first_name[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className={`font-serif text-2xl truncate ${isRevealed ? "" : "text-gray-500"}`}>
                {shown.first_name} {shown.last_name}
              </p>
              <p className="text-sm text-gray-600">{isRevealed ? `@${shown.username}` : "Who is it…"}</p>
            </div>
          </>
        ) : (
          <>
            <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <HelpCircle className="h-7 w-7 text-green-700" />
            </div>
            <div className="min-w-0">
              <p className="font-serif text-2xl">Someone in this group</p>
              <p className="text-sm text-gray-600">
                {santa.reveal_enabled
                  ? "The reveal is open. Find out who it was!"
                  : "Identity hidden until the reveal · ask them anything"}
              </p>
            </div>
          </>
        )}
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}

      {/* Same two-button layout as the giftee card; full labels live in title/aria-label */}
      <div className="flex gap-2 mt-auto">
        {santa.reveal_enabled && !isRevealed && (
          <Button
            onClick={handleReveal}
            className="flex-1 min-w-0 gap-2"
            disabled={reveal.state === "loading" || reveal.state === "spinning"}
            title="Reveal your Secret Santa"
            aria-label="Reveal your Secret Santa"
          >
            {reveal.state === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            <span className="truncate">{reveal.state === "spinning" ? "Revealing…" : "Reveal 🎁"}</span>
          </Button>
        )}
        <Link href={`/messages/${santa.channel_id}?role=receiver`} className="flex-1 min-w-0">
          <Button
            variant="outline"
            className="w-full gap-2 bg-transparent"
            title={isRevealed && shown ? `Message ${shown.first_name}` : "Message your Secret Santa"}
          >
            <MessageSquare className="h-4 w-4" />
            <span className="truncate">{isRevealed && shown ? `Message ${shown.first_name}` : "Message"}</span>
          </Button>
        </Link>
      </div>
    </Card>
  )
}
