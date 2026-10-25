"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { MessageSquare, Gift, UserCircle, Loader2, Users, Lock, ChevronRight } from "lucide-react"
import Link from "next/link"
import { groupsApi, santaApi } from "@/lib/api"
import { hasRevealedSanta } from "@/lib/reveal"
import type { GroupListItem, RevealData, SantaRelationship, SanteeRelationship } from "@/types"

interface GroupInbox {
  key: string
  name: string
  group: GroupListItem | null
  santee?: SanteeRelationship
  santa?: SantaRelationship
}

function buildInbox(
  groups: GroupListItem[],
  santas: SantaRelationship[],
  santees: SanteeRelationship[],
): GroupInbox[] {
  const inbox = new Map<number, GroupInbox>()
  for (const group of groups) {
    inbox.set(group.id, { key: `${group.id}`, name: group.name, group })
  }

  // A pair whose group isn't in the list (e.g. the user just left) still gets a section
  const entryFor = (groupId: number, groupName: string) => {
    if (!inbox.has(groupId)) inbox.set(groupId, { key: `${groupId}`, name: groupName, group: null })
    return inbox.get(groupId)!
  }
  for (const santee of santees) entryFor(santee.group_id, santee.group_name).santee = santee
  for (const santa of santas) entryFor(santa.group_id, santa.group_name).santa = santa

  return Array.from(inbox.values())
}

function ConversationRow({
  href,
  icon,
  iconClassName,
  title,
  groupName,
  subtitle,
}: {
  href: string
  icon: React.ReactNode
  iconClassName: string
  title: string
  groupName: string
  subtitle: string
}) {
  return (
    <Link href={href} className="flex items-center gap-4 p-4 hover:bg-white/80 transition-colors">
      <div className={`p-2.5 rounded-full ${iconClassName}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <p className="font-medium truncate">{title}</p>
          <span className="flex-shrink-0 max-w-[50%] truncate rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
            {groupName}
          </span>
        </div>
        <p className="text-sm text-gray-600 truncate">{subtitle}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
    </Link>
  )
}

export default function MessagesList() {
  const [inbox, setInbox] = useState<GroupInbox[]>([])
  const [revealedSantas, setRevealedSantas] = useState<Record<number, RevealData["secret_santa"]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchInbox = async () => {
      try {
        const [groups, santaData] = await Promise.all([groupsApi.list(), santaApi.getRelationships()])
        setInbox(buildInbox(groups, santaData.santas, santaData.santees))

        // Only name Santas the user has already revealed on the group page, so the inbox doesn't spoil it
        const revealable = santaData.santas.filter((s) => s.reveal_enabled && hasRevealedSanta(s.group_id))
        const revealed = await Promise.all(
          revealable.map((s) =>
            santaApi
              .reveal(s.group_name)
              .then((data) => [s.group_id, data.secret_santa] as const)
              .catch(() => null),
          ),
        )
        setRevealedSantas(Object.fromEntries(revealed.filter((r) => r !== null)))
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load messages")
      } finally {
        setLoading(false)
      }
    }
    fetchInbox()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-6 bg-red-50 border-red-200 text-center">
        <p className="text-red-800">{error}</p>
      </Card>
    )
  }

  if (inbox.length === 0) {
    return (
      <Card className="p-12 bg-white/50 border border-black/5 text-center">
        <MessageSquare className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h3 className="font-serif text-2xl mb-2">No conversations yet</h3>
        <p className="text-gray-600 mb-6">Join or create a Secret Santa group to start chatting!</p>
        <Link href="/groups">
          <button className="px-6 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors">
            Browse Groups
          </button>
        </Link>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {inbox.map(({ key, name, group, santee, santa }) => (
        <section key={key} className="space-y-3">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-serif text-2xl truncate">{name}</h2>
            {group && (
              <Link href={`/groups/${group.id}`} className="text-sm text-gray-600 hover:text-black flex-shrink-0">
                View group
              </Link>
            )}
          </div>

          <Card className="bg-white/50 border border-black/5 divide-y divide-black/5 overflow-hidden p-0 gap-0">
            {group && (
              <ConversationRow
                href={`/messages/group/${group.id}`}
                icon={<Users className="h-5 w-5 text-blue-700" />}
                iconClassName="bg-blue-100"
                title="Group chat"
                groupName={name}
                subtitle={`Everyone in the group · ${group.member_count} ${group.member_count === 1 ? "member" : "members"}`}
              />
            )}

            {santee && (
              <ConversationRow
                href={`/messages/${santee.channel_id}?role=giver`}
                icon={<Gift className="h-5 w-5 text-red-700" />}
                iconClassName="bg-red-100"
                title={`${santee.santee.first_name} ${santee.santee.last_name}`}
                groupName={name}
                subtitle="You're their Secret Santa · they don't know it's you"
              />
            )}

            {santa && (
              <ConversationRow
                href={`/messages/${santa.channel_id}?role=receiver`}
                icon={<UserCircle className="h-5 w-5 text-green-700" />}
                iconClassName="bg-green-100"
                title={
                  revealedSantas[santa.group_id]
                    ? `${revealedSantas[santa.group_id].first_name} ${revealedSantas[santa.group_id].last_name}`
                    : "Your Secret Santa"
                }
                groupName={name}
                subtitle={
                  revealedSantas[santa.group_id]
                    ? "Your Secret Santa"
                    : santa.reveal_enabled
                      ? "The reveal is open. Find out who it was on the group page"
                      : "Identity hidden until the reveal"
                }
              />
            )}

            {!santee && !santa && (
              <div className="flex items-center gap-4 p-4 text-gray-500">
                <div className="p-2.5 rounded-full bg-gray-100">
                  <Lock className="h-5 w-5" />
                </div>
                <p className="text-sm">Private Secret Santa chats open once names are drawn.</p>
              </div>
            )}
          </Card>
        </section>
      ))}
    </div>
  )
}
