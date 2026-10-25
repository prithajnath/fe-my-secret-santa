"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Users } from "lucide-react"
import { santaApi } from "@/lib/api"

interface ConversationHeaderProps {
  channelId: string
  isGiver: boolean
}

// Pair channels don't carry their group, so look it up from the user's santa relationships
export default function ConversationHeader({ channelId, isGiver }: ConversationHeaderProps) {
  const [groupName, setGroupName] = useState<string | null>(null)
  const [santeeName, setSanteeName] = useState<string | null>(null)
  const [santeeUsername, setSanteeUsername] = useState<string | null>(null)

  useEffect(() => {
    const fetchRelationship = async () => {
      try {
        const { santas, santees } = await santaApi.getRelationships()
        const santee = santees.find((s) => s.channel_id === channelId)
        const santa = santas.find((s) => s.channel_id === channelId)
        if (santee) {
          setGroupName(santee.group_name)
          setSanteeName(`${santee.santee.first_name} ${santee.santee.last_name}`)
          setSanteeUsername(santee.santee.username)
        } else if (santa) {
          setGroupName(santa.group_name)
        }
      } catch {
        // Header falls back to the generic title
      }
    }
    fetchRelationship()
  }, [channelId])

  return (
    <div className="space-y-2">
      {groupName && (
        <p className="text-sm text-gray-600 flex items-center gap-1.5">
          <Users className="h-4 w-4" />
          {groupName}
        </p>
      )}
      <h1 className="font-serif text-3xl md:text-4xl font-light">
        {isGiver ? `Message ${santeeName ?? "Your Giftee"}` : "Message Your Secret Santa"}
      </h1>
      <p className="text-gray-600">
        {isGiver
          ? "Send messages to the person you're buying a gift for"
          : "Chat with your Secret Santa - their identity is hidden!"}
        {isGiver && santeeUsername && (
          <>
            {" · "}
            <Link href={`/users/${santeeUsername}`} className="underline hover:text-black">
              View their hints &amp; address
            </Link>
          </>
        )}
      </p>
    </div>
  )
}
