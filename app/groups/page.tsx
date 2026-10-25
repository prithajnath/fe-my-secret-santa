import { getUser, loginPath } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Crown } from "lucide-react"
import Link from "next/link"
import GroupsList from "./groups-list"

export default async function GroupsPage() {
  const user = await getUser()

  if (!user) {
    redirect(await loginPath())
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <h1 className="font-serif text-4xl md:text-5xl font-light">Your Groups</h1>
          <p className="text-gray-700">Manage your Secret Santa groups and assignments</p>
        </div>
        <Link href="/groups/create">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Group
          </Button>
        </Link>
      </div>

      <GroupsList />

      <Card className="p-6 bg-blue-50 border border-blue-200">
        <div className="flex gap-3">
          <Crown className="h-5 w-5 text-blue-700 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-blue-900">Managing Groups</h4>
            <p className="text-sm text-blue-800">
              As an admin, you can manage members, draw names, and control when Secret Santa identities are revealed.
              Invite friends by sharing your group name!
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
