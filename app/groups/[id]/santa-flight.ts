// Santa and his reindeer fly across the group map, visiting every pin.
import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl"

type LngLat = [number, number]

export interface FlightStop {
  position: LngLat
  // Shown in the bubble while Santa hovers over this stop
  label: string
}
type MapLibre = typeof import("maplibre-gl")

// Flight time between two stops shrinks with more stops so the whole trip stays short
const MAX_HOP_MS = 1600
const MIN_HOP_MS = 700
const TOTAL_FLIGHT_MS = 9000
const PAUSE_MS = 500 // hover over each pin
const SAMPLES_PER_HOP = 60
const TRAIL_POINTS = 28
const MAX_TILT_DEG = 20
const TRAIL_SOURCE = "santa-trail"
const TRAIL_LAYER = "santa-trail-line"

// Santa faces right; flipped horizontally when flying west
const SLEIGH_SVG = `
<svg viewBox="0 0 132 52" width="132" height="52" aria-hidden="true">
  <g stroke="#7c4a24" stroke-width="2" stroke-linecap="round" fill="none">
    <path d="M98 14 l3 -9 M101 9 l4 -2 M98 14 l-2 -9 M97 8 l-3 -2"/>
    <path d="M72 16 l3 -9 M75 11 l4 -2 M72 16 l-2 -9 M71 10 l-3 -2"/>
  </g>
  <g fill="#9a5b2e">
    <ellipse cx="90" cy="24" rx="11" ry="6"/>
    <circle cx="101" cy="16" r="4.5"/>
    <ellipse cx="64" cy="26" rx="11" ry="6"/>
    <circle cx="75" cy="18" r="4.5"/>
  </g>
  <circle cx="105.5" cy="16.5" r="2.2" fill="#ef4444"/>
  <g stroke="#7c4a24" stroke-width="2.2" stroke-linecap="round">
    <path d="M84 29 l-4 7 M96 29 l3 7 M58 31 l-4 7 M70 31 l3 7"/>
  </g>
  <path d="M38 30 L64 25 M38 30 L90 23" stroke="#d4a017" stroke-width="1.2" fill="none"/>
  <path d="M6 30 h34 q6 0 6 -8 v-4 h-6 v6 q0 2 -3 2 H10 q-4 0 -4 4z" fill="#dc2626"/>
  <path d="M2 40 q4 4 10 4 h30 q6 0 8 -5" stroke="#d4a017" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M14 32 v8 M36 32 v8" stroke="#d4a017" stroke-width="2"/>
  <circle cx="22" cy="18" r="7" fill="#dc2626"/>
  <circle cx="22" cy="10" r="4.5" fill="#fcd9b8"/>
  <path d="M18 11 q4 8 8 0 q-1 5 -4 6 q-3 -1 -4 -6z" fill="#fff"/>
  <path d="M17 8 q5 -9 12 -3 l-3 1 q-4 -2 -9 2z" fill="#dc2626"/>
  <circle cx="29" cy="5.5" r="2" fill="#fff"/>
  <rect x="9" y="17" width="9" height="8" rx="1" fill="#16a34a"/>
  <rect x="9" y="20" width="9" height="2" fill="#facc15"/>
</svg>`

function sleighElement(): { root: HTMLElement; body: HTMLElement; bubble: HTMLElement } {
  const root = document.createElement("div")
  root.style.pointerEvents = "none"
  // body carries the flip/tilt transform; the inner element bobs (CSS in globals.css)
  const body = document.createElement("div")
  body.innerHTML = `<div class="santa-bob">${SLEIGH_SVG}</div>`
  const bubble = document.createElement("div")
  bubble.className =
    "absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-2 py-0.5 text-xs font-medium shadow transition-opacity duration-200"
  bubble.style.opacity = "0"
  root.className = "relative"
  root.append(bubble, body)
  return { root, body, bubble }
}

// Visit stops nearest-first, starting from the westernmost, so the path doesn't criss-cross
function orderStops(stops: FlightStop[]): FlightStop[] {
  const distance = (a: FlightStop, b: FlightStop) => Math.hypot(a.position[0] - b.position[0], a.position[1] - b.position[1])
  const remaining = [...stops].sort((a, b) => a.position[0] - b.position[0])
  const ordered = [remaining.shift()!]
  while (remaining.length) {
    const last = ordered[ordered.length - 1]
    let best = 0
    for (let i = 1; i < remaining.length; i++) {
      if (distance(remaining[i], last) < distance(remaining[best], last)) best = i
    }
    ordered.push(remaining.splice(best, 1)[0])
  }
  return ordered
}

// Quadratic Bézier with the control point lifted off the straight line, for a gentle arc
function arc(from: LngLat, to: LngLat): LngLat[] {
  const [dx, dy] = [to[0] - from[0], to[1] - from[1]]
  const control: LngLat = [(from[0] + to[0]) / 2 - dy * 0.25, (from[1] + to[1]) / 2 + Math.abs(dx) * 0.25]
  const points: LngLat[] = []
  for (let i = 0; i <= SAMPLES_PER_HOP; i++) {
    const t = i / SAMPLES_PER_HOP
    const u = 1 - t
    points.push([
      u * u * from[0] + 2 * u * t * control[0] + t * t * to[0],
      u * u * from[1] + 2 * u * t * control[1] + t * t * to[1],
    ])
  }
  return points
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

/** Flies Santa through `stops`. `done` resolves when he's gone; call `cancel` to stop early. */
export function flySanta(
  maplibregl: MapLibre,
  map: MapLibreMap,
  stops: FlightStop[],
): { done: Promise<void>; cancel: () => void } {
  if (stops.length === 0) return { done: Promise.resolve(), cancel: () => {} }

  // Enter just off the left edge of the view and leave off the right edge
  const bounds = map.getBounds()
  const margin = (bounds.getEast() - bounds.getWest()) * 0.08
  const ordered = orderStops(stops)
  const entry: LngLat = [bounds.getWest() - margin, ordered[0].position[1]]
  const exit: LngLat = [bounds.getEast() + margin, ordered[ordered.length - 1].position[1]]
  const waypoints = [entry, ...ordered.map((stop) => stop.position), exit]
  const hops = waypoints.slice(1).map((to, i) => arc(waypoints[i], to))
  const HOP_MS = Math.max(MIN_HOP_MS, Math.min(MAX_HOP_MS, TOTAL_FLIGHT_MS / hops.length))

  const { root, body, bubble } = sleighElement()
  const marker = new maplibregl.Marker({ element: root }).setLngLat(entry).addTo(map)

  const trail: LngLat[] = []
  const trailData = () => ({
    type: "Feature" as const,
    properties: {},
    geometry: { type: "LineString" as const, coordinates: trail.length > 1 ? trail : [entry, entry] },
  })
  if (!map.getSource(TRAIL_SOURCE)) {
    map.addSource(TRAIL_SOURCE, { type: "geojson", data: trailData(), lineMetrics: true })
    map.addLayer({
      id: TRAIL_LAYER,
      type: "line",
      source: TRAIL_SOURCE,
      layout: { "line-cap": "round" },
      paint: {
        "line-width": 3,
        // Fades from transparent at the tail to gold at the sleigh
        "line-gradient": ["interpolate", ["linear"], ["line-progress"], 0, "rgba(250,204,21,0)", 1, "rgba(250,204,21,0.9)"],
      },
    })
  }

  let frame = 0
  let cancelled = false
  let finish: () => void = () => {}
  const done = new Promise<void>((resolve) => (finish = resolve))

  const cleanup = () => {
    cancelAnimationFrame(frame)
    marker.remove()
    if (map.getLayer(TRAIL_LAYER)) map.removeLayer(TRAIL_LAYER)
    if (map.getSource(TRAIL_SOURCE)) map.removeSource(TRAIL_SOURCE)
    finish()
  }

  let previous: LngLat = entry
  const place = (position: LngLat) => {
    marker.setLngLat(position)
    // Face the direction of travel in screen space, tilting with the climb or descent
    const a = map.project(previous)
    const b = map.project(position)
    const [dx, dy] = [b.x - a.x, b.y - a.y]
    if (Math.hypot(dx, dy) > 0.5) {
      const west = dx < 0
      const tilt = Math.max(-MAX_TILT_DEG, Math.min(MAX_TILT_DEG, (Math.atan2(dy, Math.abs(dx)) * 180) / Math.PI))
      body.style.transform = `scaleX(${west ? -1 : 1}) rotate(${tilt}deg)`
    }
    previous = position
    trail.push(position)
    if (trail.length > TRAIL_POINTS) trail.shift()
    ;(map.getSource(TRAIL_SOURCE) as GeoJSONSource | undefined)?.setData(trailData())
  }

  // Timeline: hop, pause over the pin, hop, ... (no pause on the final exit hop)
  const lastHop = hops.length - 1
  const start = performance.now()
  const tick = (now: number) => {
    if (cancelled) return
    // rAF timestamps are the frame's start time, which can be slightly earlier than `start`
    let elapsed = Math.max(0, now - start)
    for (let i = 0; i < hops.length; i++) {
      if (elapsed < HOP_MS) {
        const samples = hops[i]
        const exact = easeInOut(elapsed / HOP_MS) * (samples.length - 1)
        const j = Math.floor(exact)
        const f = exact - j
        const next = samples[Math.min(j + 1, samples.length - 1)]
        place([samples[j][0] + (next[0] - samples[j][0]) * f, samples[j][1] + (next[1] - samples[j][1]) * f])
        bubble.style.opacity = "0"
        frame = requestAnimationFrame(tick)
        return
      }
      elapsed -= HOP_MS
      if (i < lastHop) {
        if (elapsed < PAUSE_MS) {
          // Hop i ends at ordered stop i
          bubble.textContent = ordered[i].label
          bubble.style.opacity = "1"
          frame = requestAnimationFrame(tick)
          return
        }
        elapsed -= PAUSE_MS
      }
    }
    cleanup()
  }
  frame = requestAnimationFrame(tick)

  return {
    done,
    cancel: () => {
      if (cancelled) return
      cancelled = true
      cleanup()
    },
  }
}
