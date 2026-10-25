"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { AlertCircle, Check } from "lucide-react"
import { issuesApi } from "@/lib/api"

export default function ReportIssueForm() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [issueId, setIssueId] = useState<number | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (title.trim().length < 10) {
      setError("Title must be at least 10 characters")
      return
    }

    if (description.trim().length < 10) {
      setError("Description must be at least 10 characters")
      return
    }

    setLoading(true)

    try {
      const result = await issuesApi.report(title.trim(), description.trim())
      setSuccess(true)
      setIssueId(result.issue_id)
      setTitle("")
      setDescription("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit issue")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="font-serif text-2xl">Thank you for your report!</h3>
        <p className="text-gray-600">
          Your issue has been submitted successfully.
          {issueId && <span className="block text-sm mt-1">Issue ID: #{issueId}</span>}
        </p>
        <Button onClick={() => setSuccess(false)} variant="outline" className="mt-4 bg-transparent">
          Report Another Issue
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        <label htmlFor="title" className="block text-sm font-medium">
          Issue Title
        </label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Cannot send messages to my santee"
          required
          minLength={10}
          maxLength={150}
        />
        <p className="text-xs text-gray-500">{title.length}/150 characters (minimum 10)</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="block text-sm font-medium">
          Description
        </label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="When I try to send a message, I get an error saying 'Something went wrong'. This happens every time I click send."
          required
          minLength={10}
          maxLength={500}
          rows={6}
        />
        <p className="text-xs text-gray-500">{description.length}/500 characters (minimum 10)</p>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Submitting..." : "Submit Issue"}
      </Button>
    </form>
  )
}
