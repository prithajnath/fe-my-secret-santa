import { getUser, loginPath } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import GroupChat from "./group-chat"

export default async function GroupChatPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  const { id } = await params

  if (!user) {
    redirect(await loginPath())
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/messages" className="flex items-center gap-2 text-gray-600 hover:text-black">
        <ArrowLeft className="h-4 w-4" />
        Back to Messages
      </Link>

      <GroupChat
        groupId={Number(id)}
        currentUser={{
          id: user.id,
          username: user.username,
          first_name: user.first_name,
          avatar_url: user.avatar_url,
        }}
      />
    </div>
  )
}
