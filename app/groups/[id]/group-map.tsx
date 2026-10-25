"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import type { Map as MapLibreMap, Marker } from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { Card } from "@/components/ui/card"
import { Globe, Loader2, Map as MapIcon, MapPinOff } from "lucide-react"
import { groupsApi } from "@/lib/api"
import type { GroupMap as GroupMapData, MapMember } from "@/types"
import { flySanta, prefersReducedMotion, type FlightStop } from "./santa-flight"

// Free, keyless vector tiles; OpenStreetMap's own tile servers don't allow app traffic
// Natural map colors in both site themes
const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty"
const MAPLIBRE_WORKER_URL = "/vendor/maplibre-gl-worker.mjs"
const US_CENTER: [number, number] = [-98.5, 39.8]
// Approximate pins sit at the member's nearest major city, so never zoom in to street level
const MAX_FIT_ZOOM_APPROX = 7
const MAX_FIT_ZOOM_EXACT = 13

interface PinGroup {
  lat: number
  lon: number
  precision: "approximate" | "exact"
  members: MapMember[]
}

// Members near the same major city all get that city's point; show them as one pin
function groupPins(members: MapMember[]): PinGroup[] {
  const groups = new Map<string, PinGroup>()
  for (const member of members) {
    if (!member.location) continue
    const { lat, lon, precision } = member.location
    const key = `${lat.toFixed(5)},${lon.toFixed(5)},${precision}`
    const group = groups.get(key) ?? { lat, lon, precision, members: [] }
    group.members.push(member)
    groups.set(key, group)
  }
  return [...groups.values()]
}

// "Saint Paul, MN" for Santa's stop bubble. Approximate members at one point share their city;
// listing distinct places still covers a giftee's exact pin coinciding with it
function placeLabel(pin: PinGroup): string {
  const places = [
    ...new Set(
      pin.members
        .map((m) => m.location)
        .filter((l) => l?.city && l?.state)
        .map((l) => `${l!.city}, ${l!.state}`),
    ),
  ]
  return places.length > 0 ? places.join(" · ") : "Ho ho ho! 🎁"
}

function memberLabel(member: MapMember): string {
  if (member.is_me) return "You"
  if (member.is_my_giftee) return "Your giftee"
  return `${member.first_name} ${member.last_name}`
}

// Built with DOM APIs rather than HTML strings so names can't inject markup
function pinElement(pin: PinGroup): HTMLElement {
  const isGiftee = pin.members.some((m) => m.is_my_giftee)
  const isMe = pin.members.some((m) => m.is_me)
  const el = document.createElement("button")
  el.type = "button"
  el.setAttribute("aria-label", pin.members.map(memberLabel).join(", "))
  el.className = "relative flex items-center rounded-full bg-white p-0.5 shadow-md cursor-pointer"
  el.style.border = isGiftee ? "3px solid #dc2626" : isMe ? "3px solid #111827" : "2px dashed #6b7280"

  for (const member of pin.members.slice(0, 3)) {
    const avatar = document.createElement(member.avatar_url ? "img" : "div")
    avatar.className = "h-8 w-8 rounded-full bg-gray-200 -ml-2 first:ml-0 ring-2 ring-white object-cover"
    if (avatar instanceof HTMLImageElement) {
      avatar.src = member.avatar_url!
      avatar.alt = ""
    } else {
      avatar.className += " flex items-center justify-center text-xs font-medium text-gray-700"
      avatar.textContent = member.first_name[0]?.toUpperCase() ?? "?"
    }
    el.appendChild(avatar)
  }
  if (pin.members.length > 1) {
    const badge = document.createElement("span")
    badge.className =
      "absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-black text-white text-[11px] font-medium flex items-center justify-center"
    badge.textContent = String(pin.members.length)
    el.appendChild(badge)
  }
  if (isGiftee) {
    const tag = document.createElement("span")
    tag.className =
      "absolute left-1/2 -translate-x-1/2 -bottom-6 whitespace-nowrap rounded bg-red-600 px-1.5 py-0.5 text-[11px] font-medium text-white"
    tag.textContent = "Your giftee"
    el.appendChild(tag)
  }
  return el
}

function popupContent(pin: PinGroup): HTMLElement {
  const root = document.createElement("div")
  root.className = "space-y-1.5 text-sm"
  for (const member of pin.members) {
    const row = document.createElement("div")
    row.className = "font-medium"
    row.textContent = member.is_me || member.is_my_giftee
      ? `${member.first_name} ${member.last_name} (${memberLabel(member)})`
      : `${member.first_name} ${member.last_name}`
    root.appendChild(row)
  }
  const note = document.createElement("div")
  note.className = "text-xs text-gray-500"
  const place = pin.members[0].location
  note.textContent =
    pin.precision === "exact"
      ? "Exact location (their shipping address)"
      : place?.city && place.state
        ? `Near ${place.city}, ${place.state} · shown at their nearest major city`
        : "Shown at their nearest major city"
  root.appendChild(note)
  return root
}

export default function GroupMap({ groupId }: { groupId: number }) {
  const [data, setData] = useState<GroupMapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const container = useRef<HTMLDivElement>(null)
  const map = useRef<MapLibreMap | null>(null)
  const markers = useRef<Marker[]>([])
  const [mapReady, setMapReady] = useState(false)
  const flight = useRef<{ cancel: () => void } | null>(null)
  const flownOnce = useRef(false)
  const [flying, setFlying] = useState(false)
  const [canFly, setCanFly] = useState(false)
  const stops = useRef<FlightStop[]>([])

  const load = async () => {
    try {
      setData(await groupsApi.getMap(groupId))
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load the group map")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId])

  // maplibre-gl touches window on import, so load it only in the browser
  useEffect(() => {
    if (!container.current) return
    let cancelled = false
    import("maplibre-gl").then((maplibregl) => {
      if (cancelled || !container.current) return
      // Copied into public/ at install time (scripts/copy-maplibre-worker.mjs)
      maplibregl.setWorkerUrl(MAPLIBRE_WORKER_URL)
      const instance = new maplibregl.Map({
        container: container.current,
        style: MAP_STYLE,
        center: US_CENTER,
        zoom: 3,
        // Approximate pins are GeoNames city points; its CC BY 4.0 license requires credit
        attributionControl: {
          compact: true,
          customAttribution: 'Places © <a href="https://www.geonames.org/" target="_blank" rel="noopener">GeoNames</a> (CC BY 4.0)',
        },
      })
      instance.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right")
      instance.on("load", () => !cancelled && setMapReady(true))
      map.current = instance
    })
    return () => {
      cancelled = true
      flight.current?.cancel()
      map.current?.remove()
      map.current = null
      setMapReady(false)
    }
  }, [loading])

  // Draw pins whenever the data changes
  useEffect(() => {
    const instance = map.current
    if (!instance || !mapReady || !data) return
    let cancelled = false

    import("maplibre-gl").then((maplibregl) => {
      if (cancelled) return
      markers.current.forEach((m) => m.remove())
      markers.current = []

      const pins = groupPins(data.members)
      for (const pin of pins) {
        const marker = new maplibregl.Marker({ element: pinElement(pin) })
          .setLngLat([pin.lon, pin.lat])
          .setPopup(new maplibregl.Popup({ offset: 24, closeButton: false }).setDOMContent(popupContent(pin)))
          .addTo(instance)
        markers.current.push(marker)
      }

      if (pins.length > 0) {
        const bounds = new maplibregl.LngLatBounds()
        pins.forEach((p) => bounds.extend([p.lon, p.lat]))
        const onlyExact = pins.every((p) => p.precision === "exact")
        instance.fitBounds(bounds, {
          padding: 60,
          maxZoom: onlyExact ? MAX_FIT_ZOOM_EXACT : MAX_FIT_ZOOM_APPROX,
          duration: 0,
        })
      } else {
        instance.jumpTo({ center: US_CENTER, zoom: 3 })
      }

      stops.current = pins.map((p) => ({ position: [p.lon, p.lat], label: placeLabel(p) }))
      setCanFly(pins.length > 0 && !prefersReducedMotion())
      // Santa flies once when the map first shows pins; "Fly again" replays it
      if (!flownOnce.current && pins.length > 0 && !prefersReducedMotion()) {
        flownOnce.current = true
        startFlight()
      }
    })
    return () => {
      cancelled = true
    }
  }, [data, mapReady])

  const startFlight = () => {
    const instance = map.current
    if (!instance || stops.current.length === 0) return
    flight.current?.cancel()
    import("maplibre-gl").then((maplibregl) => {
      if (map.current !== instance) return
      setFlying(true)
      const run = flySanta(maplibregl, instance, stops.current)
      flight.current = run
      run.done.then(() => {
        if (flight.current === run) {
          flight.current = null
          setFlying(false)
        }
      })
    })
  }

  const toggle = async () => {
    if (!data) return
    setSaving(true)
    setError("")
    try {
      await groupsApi.setShowOnMap(groupId, !data.show_on_map)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update your map setting")
    } finally {
      setSaving(false)
    }
  }

  const me = data?.members.find((m) => m.is_me)
  // Opting in can't put a non-US member on the map, so the switch is disabled for them
  const outsideUs = me?.location_unavailable_reason === "outside_us"
  const offMap = data?.members.filter((m) => !m.location && !m.is_me) ?? []

  return (
    <Card className="p-6 bg-white/50 border border-black/5 gap-4">
      <h3 className="font-serif text-xl flex items-center gap-2">
        <MapIcon className="h-5 w-5" />
        Map
      </h3>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          {data && (
            <div className="flex items-start justify-between gap-4 rounded-lg border border-black/5 bg-white/60 p-4">
              <div className="space-y-1">
                <p id="show-on-map-label" className="text-sm font-medium">
                  Show my nearest major city on this group&apos;s map
                </p>
                <p className="text-xs text-gray-500">
                  Off by default and set separately for each group. Members see a pin at the major city nearest
                  you, never your address. Your Secret Santa already has your address.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={data.show_on_map}
                aria-labelledby="show-on-map-label"
                onClick={toggle}
                disabled={saving || outsideUs}
                title={outsideUs ? "The map only supports US addresses" : undefined}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors disabled:opacity-60 ${
                  data.show_on_map ? "bg-black" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    data.show_on_map ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          )}

          {me?.location_unavailable_reason === "opted_out" && (
            <p className="text-sm text-gray-600">
              You&apos;re not on the map. Turn on the switch above to show your nearest major city to this group.
            </p>
          )}
          {(outsideUs || data?.has_non_us_members) && (
            <p className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
              <Globe className="mt-0.5 h-4 w-4 flex-shrink-0" />
              {outsideUs
                ? "The map only supports US addresses, so you can't appear on it."
                : "The map only supports US addresses, so members outside the US won't appear on it."}
            </p>
          )}
          {me?.location_unavailable_reason === "no_verified_address" && (
            <p className="text-sm text-gray-600">
              You&apos;re opted in, but you won&apos;t appear until you have a verified address.{" "}
              <Link href="/profile/edit" className="underline hover:text-black">
                Pick your address from the suggestions
              </Link>{" "}
              to verify it.
            </p>
          )}

          {error && <p className="text-sm text-red-700">{error}</p>}

          <div className="relative light-palette">
            <div ref={container} className="h-[360px] w-full overflow-hidden rounded-lg border border-black/5" />
            {canFly && (
              <button
                type="button"
                onClick={startFlight}
                disabled={flying}
                className="absolute left-2 bottom-2 rounded-full bg-white/90 px-3 py-1 text-xs font-medium shadow hover:bg-white disabled:opacity-60"
              >
                {flying ? "🎅 Flying…" : "🎅 Fly again"}
              </button>
            )}
          </div>

          {offMap.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium flex items-center gap-1.5 text-gray-700">
                <MapPinOff className="h-4 w-4" />
                Not on the map
              </p>
              <p className="text-sm text-gray-600">
                {offMap.map((m) => (m.is_my_giftee ? `${m.first_name} ${m.last_name} (your giftee)` : `${m.first_name} ${m.last_name}`)).join(", ")}
              </p>
            </div>
          )}
        </>
      )}
    </Card>
  )
}
