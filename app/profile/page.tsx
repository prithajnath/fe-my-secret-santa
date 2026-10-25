import { getUser, loginPath } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Edit, Gift, MapPin, Lightbulb, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { LogoutButton } from "./logout-button"

export default async function ProfilePage() {
  const user = await getUser()

  if (!user) {
    redirect(await loginPath())
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="font-serif text-4xl md:text-5xl font-light">Your Profile</h1>
        <p className="text-gray-700">Manage your profile and gift preferences</p>
      </div>

      <Card className="p-6 md:p-8 bg-white/50 border border-black/5">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <Avatar className="h-32 w-32 md:h-40 md:w-40">
              <AvatarImage src={user.avatar_url || "/placeholder.svg?height=200&width=200"} alt={user.first_name} />
              <AvatarFallback className="text-3xl">{getInitials(user.first_name, user.last_name)}</AvatarFallback>
            </Avatar>
            <Link href="/profile/edit" className="w-full">
              <Button variant="outline" className="w-full gap-2 bg-transparent">
                <Edit className="h-4 w-4" />
                Edit Profile
              </Button>
            </Link>
            <LogoutButton />
          </div>

          <div className="flex-1 space-y-6">
            <div className="space-y-2">
              <h2 className="font-serif text-3xl font-light">
                {user.first_name} {user.last_name}
              </h2>
              <p className="text-gray-600">@{user.username}</p>
              <p className="text-gray-600">{user.email}</p>
            </div>

            {user.hint && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-600" />
                  <h3 className="font-serif text-xl">Gift Hints</h3>
                </div>
                <p className="text-gray-700 leading-relaxed">{user.hint}</p>
              </div>
            )}

            {user.address && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-red-600" />
                  <h3 className="font-serif text-xl">Shipping Address</h3>
                </div>
                <p className="text-gray-700 leading-relaxed">{user.address}</p>
                {user.address_verified ? (
                  <p className="flex items-center gap-1.5 text-xs text-green-700">
                    <CheckCircle2 className="h-4 w-4" />
                    Verified address
                  </p>
                ) : (
                  <p className="text-xs text-gray-500">
                    Not verified.{" "}
                    <Link href="/profile/edit" className="underline hover:text-black">
                      Re-select your address from suggestions
                    </Link>{" "}
                    to verify it.
                  </p>
                )}
              </div>
            )}

            {!user.hint && !user.address && (
              <Card className="p-4 bg-yellow-50 border-yellow-200">
                <p className="text-sm text-yellow-800">
                  Add gift hints and your shipping address to help your Secret Santa find the perfect gift!
                </p>
              </Card>
            )}
          </div>
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Link href="/profile/edit">
          <Card className="p-6 bg-white/50 border border-black/5 hover:bg-white/80 transition-colors cursor-pointer h-full">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Edit className="h-6 w-6 text-blue-700" />
              </div>
              <div>
                <h3 className="font-serif text-xl mb-1">Edit Profile</h3>
                <p className="text-gray-600 text-sm">Update your name, gift hints, and shipping address</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/settings">
          <Card className="p-6 bg-white/50 border border-black/5 hover:bg-white/80 transition-colors cursor-pointer h-full">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <Gift className="h-6 w-6 text-gray-700" />
              </div>
              <div>
                <h3 className="font-serif text-xl mb-1">Account Settings</h3>
                <p className="text-gray-600 text-sm">Change your password and manage account preferences</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  )
}
