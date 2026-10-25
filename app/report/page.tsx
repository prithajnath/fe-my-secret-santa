import { getUser, loginPath } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Bug } from "lucide-react"
import Link from "next/link"
import ReportIssueForm from "./report-issue-form"

export default async function ReportIssuePage() {
  const user = await getUser()

  if (!user) {
    redirect(await loginPath())
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black">
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>

      <div className="space-y-2">
        <h1 className="font-serif text-4xl md:text-5xl font-light">Report an Issue</h1>
        <p className="text-gray-700">Help us improve by reporting bugs or sharing feedback</p>
      </div>

      <Card className="p-6 md:p-8 bg-white/50 border border-black/5">
        <ReportIssueForm />
      </Card>

      <Card className="p-6 bg-blue-50 border border-blue-200">
        <div className="flex gap-3">
          <Bug className="h-5 w-5 text-blue-700 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-blue-900">Tips for reporting issues</h4>
            <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
              <li>Be specific about what you were trying to do</li>
              <li>Include any error messages you saw</li>
              <li>Describe what you expected to happen vs. what actually happened</li>
              <li>Mention if the issue happens consistently or only sometimes</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
