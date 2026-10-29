import type { Budget, BudgetCurrency } from "@/types"

// Same list, in the same order, as the backend accepts. USD is the default
export const BUDGET_CURRENCIES: { code: BudgetCurrency; label: string }[] = [
  { code: "USD", label: "USD ($)" },
  { code: "CAD", label: "CAD ($)" },
  { code: "GBP", label: "GBP (£)" },
  { code: "EUR", label: "EUR (€)" },
  { code: "INR", label: "INR (₹)" },
  { code: "AUD", label: "AUD ($)" },
]
export const DEFAULT_BUDGET_CURRENCY: BudgetCurrency = "USD"

// Matches the backend's cap of 1,000,000 minor units
const MAX_BUDGET = 10_000

// "$25", "£12.50", "₹1,500"
export function formatBudget(budget: Budget): string {
  const amount = budget.amount_cents / 100
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: budget.currency,
    // Hide ".00" on whole amounts
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount)
}

// What the user typed in the amount field, as a budget. Empty means no budget.
// Throws with a message for the form when the amount isn't valid
export function parseBudgetInput(amount: string, currency: BudgetCurrency): Budget | null {
  const trimmed = amount.trim()
  if (!trimmed) return null

  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    throw new Error("Enter the budget as a number, like 25 or 25.50")
  }
  const value = Number(trimmed)
  if (value > MAX_BUDGET) {
    throw new Error(`The budget can be at most ${MAX_BUDGET.toLocaleString()}`)
  }
  return { amount_cents: Math.round(value * 100), currency }
}

// A budget as the amount field's text: 2500 -> "25", 1250 -> "12.50"
export function budgetInputValue(budget: Budget | null | undefined): string {
  if (!budget) return ""
  const amount = budget.amount_cents / 100
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2)
}
