"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import BudgetFields from "@/components/budget-fields"
import { groupsApi } from "@/lib/api"
import { DEFAULT_BUDGET_CURRENCY, parseBudgetInput } from "@/lib/budget"
import type { Budget, BudgetCurrency } from "@/types"

export default function CreateGroupForm() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [budgetAmount, setBudgetAmount] = useState("")
  const [budgetCurrency, setBudgetCurrency] = useState<BudgetCurrency>(DEFAULT_BUDGET_CURRENCY)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!name.trim()) {
      setError("Group name is required")
      return
    }

    let budget: Budget | null
    try {
      budget = parseBudgetInput(budgetAmount, budgetCurrency)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid budget")
      return
    }

    setLoading(true)

    try {
      const group = await groupsApi.create(name.trim(), budget)
      router.push(`/groups/${group.id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create group")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm font-medium">
          Group Name
        </label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Family Secret Santa 2024"
          required
        />
        <p className="text-xs text-gray-500">Choose a memorable name for your group</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="budget" className="block text-sm font-medium">
          Gift Budget <span className="font-normal text-gray-500">(optional)</span>
        </label>
        <BudgetFields
          id="budget"
          amount={budgetAmount}
          currency={budgetCurrency}
          onAmountChange={setBudgetAmount}
          onCurrencyChange={setBudgetCurrency}
        />
        <p className="text-xs text-gray-500">How much each person should spend. You can change it later</p>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating..." : "Create Group"}
      </Button>
    </form>
  )
}
