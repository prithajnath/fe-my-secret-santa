import { getUser, loginPath } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import SettingsForm from "./settings-form"

export default async function SettingsPage() {
  const user = await getUser()

  if (!user) {
    redirect(await loginPath())
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/profile" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black">
        <ArrowLeft className="h-4 w-4" />
        Back to profile
      </Link>

      <div className="space-y-2">
        <h1 className="font-serif text-4xl md:text-5xl font-light">Account Settings</h1>
        <p className="text-gray-700">Manage your account security and preferences</p>
      </div>

      <Card className="p-6 md:p-8 bg-white/50 border border-black/5">
        <SettingsForm email={user.email} />
      </Card>
    </div>
  )
}
