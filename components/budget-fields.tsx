"use client"

import { Input } from "@/components/ui/input"
import { BUDGET_CURRENCIES } from "@/lib/budget"
import type { BudgetCurrency } from "@/types"

// Amount plus currency inputs for a group's gift budget. The amount may be left empty for no budget
export default function BudgetFields({
  id,
  amount,
  currency,
  onAmountChange,
  onCurrencyChange,
  disabled,
}: {
  id: string
  amount: string
  currency: BudgetCurrency
  onAmountChange: (amount: string) => void
  onCurrencyChange: (currency: BudgetCurrency) => void
  disabled?: boolean
}) {
  return (
    <div className="flex gap-2">
      <Input
        id={id}
        inputMode="decimal"
        value={amount}
        onChange={(e) => onAmountChange(e.target.value)}
        placeholder="25"
        disabled={disabled}
        className="flex-1"
      />
      <select
        aria-label="Currency"
        value={currency}
        onChange={(e) => onCurrencyChange(e.target.value as BudgetCurrency)}
        disabled={disabled}
        className="border-input h-9 rounded-md border bg-transparent px-2 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
      >
        {BUDGET_CURRENCIES.map(({ code, label }) => (
          <option key={code} value={code}>
            {label}
          </option>
        ))}
      </select>
    </div>
  )
}
