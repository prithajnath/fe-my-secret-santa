import { getUser, loginPath } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import GifteeProfile from "./giftee-profile"

export default async function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const user = await getUser()
  const { username } = await params

  if (!user) {
    redirect(await loginPath())
  }

  if (decodeURIComponent(username) === user.username) {
    redirect("/profile")
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/messages" className="flex items-center gap-2 text-gray-600 hover:text-black">
        <ArrowLeft className="h-4 w-4" />
        Back to Messages
      </Link>

      <GifteeProfile username={decodeURIComponent(username)} />
    </div>
  )
}
