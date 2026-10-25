import { getUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import CreateGroupForm from "./create-group-form"

export default async function CreateGroupPage() {
  const user = await getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <Link href="/groups" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black">
        <ArrowLeft className="h-4 w-4" />
        Back to groups
      </Link>

      <div>
        <h2 className="font-serif text-3xl md:text-4xl">Create a Group</h2>
        <p className="text-gray-700 mt-2">Set up your Secret Santa group and invite members.</p>
      </div>

      <Card className="p-6 md:p-8 bg-white/50 border border-black/5">
        <CreateGroupForm />
      </Card>
    </div>
  )
}
