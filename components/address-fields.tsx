"use client"

import type React from "react"
import { useEffect, useId, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { CheckCircle2, Info, Loader2, MapPin } from "lucide-react"
import { geoApi } from "@/lib/api"
import type { AddressSuggestion } from "@/types"

export interface AddressFormValue {
  line1: string
  line2: string
  city: string
  state: string
  zip: string
  // Set only when the address came from a picked suggestion; manual edits clear it
  coords: { lat: number; lon: number } | null
}

export const EMPTY_ADDRESS: AddressFormValue = { line1: "", line2: "", city: "", state: "", zip: "", coords: null }

const MIN_QUERY_LENGTH = 3
const DEBOUNCE_MS = 300

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS",
  "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC",
  "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
]

type Lookup =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; results: AddressSuggestion[] }
  | { status: "error"; message: string }

interface AddressFieldsProps {
  value: AddressFormValue
  onChange: (value: AddressFormValue) => void
  verified: boolean
  error?: string
}

export default function AddressFields({ value, onChange, verified, error }: AddressFieldsProps) {
  const [lookup, setLookup] = useState<Lookup>({ status: "idle" })
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inFlight = useRef<AbortController | null>(null)
  // Responses can arrive out of order (cold queries take seconds, cached ones milliseconds);
  // only the latest request may update the dropdown
  const latestRequest = useRef(0)
  const listboxId = useId()

  const cancelLookup = () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    inFlight.current?.abort()
    latestRequest.current++
  }

  useEffect(() => cancelLookup, [])

  const search = (query: string) => {
    cancelLookup()
    if (query.trim().length < MIN_QUERY_LENGTH) {
      setLookup({ status: "idle" })
      setOpen(false)
      return
    }

    debounceTimer.current = setTimeout(async () => {
      const requestId = ++latestRequest.current
      const controller = new AbortController()
      inFlight.current = controller
      setLookup({ status: "loading" })
      setActiveIndex(-1)
      setOpen(true)
      try {
        const results = await geoApi.autocomplete(query.trim(), controller.signal)
        if (requestId === latestRequest.current) setLookup({ status: "done", results })
      } catch (err) {
        if (controller.signal.aborted || requestId !== latestRequest.current) return
        setLookup({ status: "error", message: err instanceof Error ? err.message : "Address lookup failed" })
      }
    }, DEBOUNCE_MS)
  }

  const handleLine1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...value, line1: e.target.value, coords: null })
    search(e.target.value)
  }

  // Editing any part of a picked address means its coordinates no longer match
  const handleFieldChange = (field: "city" | "state" | "zip") => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    onChange({ ...value, [field]: e.target.value, coords: null })
  }

  const pick = (suggestion: AddressSuggestion) => {
    cancelLookup()
    setOpen(false)
    setLookup({ status: "idle" })
    onChange({
      line1: suggestion.address_line1,
      line2: value.line2,
      city: suggestion.city,
      state: suggestion.state,
      zip: suggestion.zip,
      coords: { lat: suggestion.lat, lon: suggestion.lon },
    })
  }

  const results = lookup.status === "done" ? lookup.results : []

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return
    if (e.key === "ArrowDown" && results.length > 0) {
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % results.length)
    } else if (e.key === "ArrowUp" && results.length > 0) {
      e.preventDefault()
      setActiveIndex((i) => (i <= 0 ? results.length - 1 : i - 1))
    } else if (e.key === "Enter" && activeIndex >= 0 && results[activeIndex]) {
      // Pick the suggestion instead of submitting the form
      e.preventDefault()
      pick(results[activeIndex])
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  const hasAddress = Boolean(value.line1 || value.city || value.state || value.zip)
  // A suggestion may carry a code we don't list (e.g. a territory); keep it selectable
  const stateOptions = value.state && !US_STATES.includes(value.state) ? [value.state, ...US_STATES] : US_STATES

  return (
    <div className="space-y-3">
      <div className="relative space-y-2">
        <label htmlFor="address_line1" className="block text-sm font-medium">
          Street address
        </label>
        <Input
          id="address_line1"
          value={value.line1}
          onChange={handleLine1Change}
          onKeyDown={handleKeyDown}
          onFocus={() => lookup.status !== "idle" && setOpen(true)}
          onBlur={() => setOpen(false)}
          placeholder="Start typing your address…"
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
          required={hasAddress}
        />

        {open && (
          <div
            id={listboxId}
            role="listbox"
            className="absolute z-20 left-0 right-0 top-full mt-1 rounded-md border border-black/10 bg-white shadow-lg overflow-hidden"
          >
            {lookup.status === "loading" && (
              <div className="flex items-center gap-2 px-3 py-3 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching addresses…
              </div>
            )}
            {lookup.status === "error" && (
              <div className="px-3 py-3 text-sm text-red-700">
                {lookup.message}. You can still enter your address manually.
              </div>
            )}
            {lookup.status === "done" && results.length === 0 && (
              <div className="px-3 py-3 text-sm text-gray-500">No matches. Enter your address manually below.</div>
            )}
            {results.map((suggestion, i) => (
              <div
                key={suggestion.place_id}
                id={`${listboxId}-${i}`}
                role="option"
                aria-selected={i === activeIndex}
                // mousedown fires before the input's blur closes the list
                onMouseDown={(e) => {
                  e.preventDefault()
                  pick(suggestion)
                }}
                onMouseEnter={() => setActiveIndex(i)}
                className={`flex items-start gap-2 px-3 py-2.5 text-sm cursor-pointer ${
                  i === activeIndex ? "bg-gray-100" : ""
                }`}
              >
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-400" />
                <span>{suggestion.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="address_line2" className="block text-sm font-medium">
          Apt / Unit <span className="font-normal text-gray-500">(optional)</span>
        </label>
        <Input
          id="address_line2"
          value={value.line2}
          onChange={(e) => onChange({ ...value, line2: e.target.value })}
          placeholder="Apt 4B"
          autoComplete="address-line2"
        />
      </div>

      <div className="grid grid-cols-6 gap-3">
        <div className="col-span-6 sm:col-span-3 space-y-2">
          <label htmlFor="address_city" className="block text-sm font-medium">
            City
          </label>
          <Input
            id="address_city"
            value={value.city}
            onChange={handleFieldChange("city")}
            autoComplete="address-level2"
            required={hasAddress}
          />
        </div>
        <div className="col-span-3 sm:col-span-1 space-y-2">
          <label htmlFor="address_state" className="block text-sm font-medium">
            State
          </label>
          <select
            id="address_state"
            value={value.state}
            onChange={handleFieldChange("state")}
            required={hasAddress}
            className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="">—</option>
            {stateOptions.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-3 sm:col-span-2 space-y-2">
          <label htmlFor="address_zip" className="block text-sm font-medium">
            ZIP
          </label>
          <Input
            id="address_zip"
            value={value.zip}
            onChange={handleFieldChange("zip")}
            inputMode="numeric"
            pattern="\d{5}(-\d{4})?"
            title="5-digit ZIP, or ZIP+4 like 12345-6789"
            autoComplete="postal-code"
            required={hasAddress}
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}

      {hasAddress &&
        (verified ? (
          <p className="flex items-center gap-1.5 text-xs text-green-700">
            <CheckCircle2 className="h-4 w-4" />
            Verified address
          </p>
        ) : (
          <p className="flex items-center gap-1.5 text-xs text-gray-500">
            <Info className="h-4 w-4" />
            Not verified yet. Re-select your address from the suggestions to verify it.
          </p>
        ))}
    </div>
  )
}
