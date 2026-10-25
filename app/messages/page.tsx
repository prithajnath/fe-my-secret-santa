import { getUser, loginPath } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card } from "@/components/ui/card"
import { MessageSquare } from "lucide-react"
import MessagesList from "./messages-list"

export default async function MessagesPage() {
  const user = await getUser()

  if (!user) {
    redirect(await loginPath())
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="font-serif text-4xl md:text-5xl font-light">Messages</h1>
        <p className="text-gray-700">Chat anonymously with your Secret Santa participants</p>
      </div>

      <MessagesList />

      <Card className="p-6 bg-blue-50 border border-blue-200">
        <div className="flex gap-3">
          <MessageSquare className="h-5 w-5 text-blue-700 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-blue-900">Anonymous Messaging</h4>
            <p className="text-sm text-blue-800">
              When you&apos;re receiving gifts, your Secret Santa&apos;s identity remains hidden. Messages are anonymous
              to keep the surprise! When you&apos;re giving gifts, you can see who you&apos;re shopping for.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
