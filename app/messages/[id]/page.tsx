import { getUser, loginPath } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import PairMessageThread from "./pair-message-thread"
import ConversationHeader from "./conversation-header"

export default async function ConversationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ role?: string }>
}) {
  const user = await getUser()
  const { id: channelId } = await params
  const { role } = await searchParams

  if (!user) {
    redirect(await loginPath())
  }

  const isGiver = role === "giver"

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/messages" className="flex items-center gap-2 text-gray-600 hover:text-black">
        <ArrowLeft className="h-4 w-4" />
        Back to Messages
      </Link>

      <ConversationHeader channelId={channelId} isGiver={isGiver} />

      <Card className="p-6 md:p-8 bg-white/50 border border-black/5">
        <PairMessageThread channelId={channelId} isGiver={isGiver} />
      </Card>
    </div>
  )
}
