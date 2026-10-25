import { getUser, loginPath } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import GroupDetail from "./group-detail"

export default async function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  const { id } = await params

  if (!user) {
    redirect(await loginPath())
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/groups" className="flex items-center gap-2 text-gray-600 hover:text-black">
        <ArrowLeft className="h-4 w-4" />
        Back to Groups
      </Link>

      <GroupDetail groupId={Number(id)} currentUserId={user.id} />
    </div>
  )
}
