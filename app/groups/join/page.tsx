import type { Metadata } from "next"
import { getUser } from "@/lib/auth"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Gift } from "lucide-react"
import Link from "next/link"
import JoinGroupForm from "./join-group-form"

const INVITE_TITLE = "You're invited to a Secret Santa exchange"
const INVITE_DESCRIPTION = "Sign up or log in to My Secret Santa to accept your invite."

// Invite links get their own preview (image in ./opengraph-image.tsx). Stays generic, since
// anyone holding the link sees it.
export const metadata: Metadata = {
  title: INVITE_TITLE,
  description: INVITE_DESCRIPTION,
  openGraph: { type: "website", siteName: "My Secret Santa", title: INVITE_TITLE, description: INVITE_DESCRIPTION },
  twitter: { card: "summary_large_image", title: INVITE_TITLE, description: INVITE_DESCRIPTION },
}

// Logged-out visitors (and link-preview crawlers) see this instead of being bounced to /login
function InviteLanding({ code }: { code?: string }) {
  const joinPath = code ? `/groups/join?code=${encodeURIComponent(code)}` : "/groups/join"
  const next = encodeURIComponent(joinPath)
  return (
    <div className="max-w-md mx-auto space-y-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
        <Gift className="h-8 w-8 text-red-700" />
      </div>
      <div className="space-y-2">
        <h1 className="font-serif text-3xl md:text-4xl">You&apos;re invited!</h1>
        <p className="text-gray-700">Someone wants you in their Secret Santa exchange. Sign up or log in to join.</p>
      </div>
      {code && (
        <p className="text-sm text-gray-600">
          Invite code <span className="font-mono font-medium text-black">{code}</span>
        </p>
      )}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href={`/register?next=${next}`}>
          <Button className="w-full sm:w-auto">Sign up to join</Button>
        </Link>
        <Link href={`/login?next=${next}`}>
          <Button variant="outline" className="w-full sm:w-auto bg-transparent">
            I already have an account
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default async function JoinGroupPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams
  const user = await getUser()

  if (!user) {
    return <InviteLanding code={code} />
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
