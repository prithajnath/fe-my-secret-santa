"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Plus, Crown, Loader2, Wallet } from "lucide-react"
import Link from "next/link"
import { groupsApi } from "@/lib/api"
import { formatBudget } from "@/lib/budget"
import type { GroupListItem } from "@/types"

export default function GroupsList() {
  const [groups, setGroups] = useState<GroupListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const data = await groupsApi.list()
        setGroups(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load groups")
      } finally {
        setLoading(false)
      }
    }
    fetchGroups()
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
        <Button variant="outline" className="mt-4 bg-transparent" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </Card>
    )
  }

  if (groups.length === 0) {
    return (
      <Card className="p-12 bg-white/50 border border-black/5 text-center">
        <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h3 className="font-serif text-2xl mb-2">No groups yet</h3>
        <p className="text-gray-600 mb-6">Create a group or accept an invite to get started!</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/groups/create">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Group
            </Button>
          </Link>
        </div>
      </Card>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {groups.map((group) => (
        <Link key={group.id} href={`/groups/${group.id}`}>
          <Card className="p-6 bg-white/50 border border-black/5 hover:bg-white/80 transition-colors cursor-pointer h-full">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-serif text-2xl mb-1">{group.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    {group.is_admin && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                        <Crown className="h-3 w-3" />
                        Admin
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 py-4 border-y border-black/5">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-600" />
                  <span className="text-sm">{group.member_count} members</span>
                </div>
                {group.budget && (
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-gray-600" />
                    <span className="text-sm">{formatBudget(group.budget)} budget</span>
                  </div>
                )}
                {group.member_avatars && group.member_avatars.length > 0 && (
                  <div className="flex -space-x-2">
                    {group.member_avatars.slice(0, 4).map((avatar, i) => (
                      <Avatar key={i} className="h-6 w-6 border-2 border-white">
                        <AvatarImage src={avatar || "/placeholder.svg"} />
                        <AvatarFallback className="text-xs">?</AvatarFallback>
                      </Avatar>
                    ))}
                    {group.member_avatars.length > 4 && (
                      <span className="flex items-center justify-center h-6 w-6 rounded-full bg-gray-200 text-xs font-medium border-2 border-white">
                        +{group.member_avatars.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm">
                {group.reveal_latest_pairs ? (
                  <span className="text-green-700 font-medium flex items-center gap-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full" />
                    Identities revealed
                  </span>
                ) : (
                  <span className="text-gray-600 flex items-center gap-2">
                    <div className="h-2 w-2 bg-gray-400 rounded-full" />
                    Identities hidden
                  </span>
                )}
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
}
