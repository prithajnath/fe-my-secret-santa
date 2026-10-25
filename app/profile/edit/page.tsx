import { getUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card } from "@/components/ui/card"
import EditProfileForm from "./edit-profile-form"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function EditProfilePage() {
  const user = await getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/profile" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black">
        <ArrowLeft className="h-4 w-4" />
        Back to profile
      </Link>

      <div className="space-y-2">
        <h1 className="font-serif text-4xl md:text-5xl font-light">Edit Profile</h1>
        <p className="text-gray-700">Update your profile information and gift preferences</p>
      </div>

      <Card className="p-6 md:p-8 bg-white/50 border border-black/5">
        <EditProfileForm
          profile={{
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            username: user.username,
            hint: user.hint || "",
            address: user.address || "",
            avatarUrl: user.avatar_url || "",
          }}
        />
      </Card>
    </div>
  )
}
