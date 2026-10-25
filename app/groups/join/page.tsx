import { getUser, loginPath } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import JoinGroupForm from "./join-group-form"

export default async function JoinGroupPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams
  const user = await getUser()

  if (!user) {
    redirect(await loginPath())
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <Link href="/groups" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black">
        <ArrowLeft className="h-4 w-4" />
        Back to groups
      </Link>

      <div>
        <h2 className="font-serif text-3xl md:text-4xl">Join a Group</h2>
        <p className="text-gray-700 mt-2">Enter an invite code to join a Secret Santa exchange</p>
      </div>

      <Card className="p-6 md:p-8 bg-white/50 border border-black/5">
        <JoinGroupForm initialCode={code} />
      </Card>

      <Card className="p-4 bg-blue-50 border border-blue-200">
        <p className="text-sm text-blue-800">
          Check your email for an invite code from a group admin. The code will look like GROUP-XXXXXX or ADMIN-XXXXXX.
        </p>
      </Card>
    </div>
  )
}
