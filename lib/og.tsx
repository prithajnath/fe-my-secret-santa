// Link-preview images (Open Graph / Twitter) for Discord, WhatsApp, Slack, iMessage, X...
// Rendered by next/og at build time from the wordmark, matching the site's dark festive look.
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { ImageResponse } from "next/og"

export const OG_SIZE = { width: 1200, height: 630 }
export const BRAND_RED = "#dc3c4d"

// Six-armed snowflake, same shape as public/festive-pattern.svg
function Snowflake({ x, y, size, opacity }: { x: number; y: number; size: number; opacity: number }) {
  const arms = [0, 60, 120, 180, 240, 300]
  return (
    <svg
      width={size}
      height={size}
      viewBox="-12 -12 24 24"
      style={{ position: "absolute", left: x, top: y, opacity }}
    >
      {arms.map((angle) => (
        <g key={angle} transform={`rotate(${angle})`}>
          <path
            d="M0 0V-10M0-6.2l-2.8-2.8M0-6.2l2.8-2.8M0-2.8l-1.8-1.8M0-2.8l1.8-1.8"
            stroke="#ffffff"
            strokeWidth={1.3}
            strokeLinecap="round"
            fill="none"
          />
        </g>
      ))}
    </svg>
  )
}

const FLAKES = [
  { x: 60, y: 70, size: 70, opacity: 0.12 },
  { x: 1040, y: 60, size: 90, opacity: 0.1 },
  { x: 140, y: 470, size: 56, opacity: 0.1 },
  { x: 980, y: 440, size: 110, opacity: 0.08 },
  { x: 560, y: 520, size: 44, opacity: 0.1 },
  { x: 330, y: 40, size: 40, opacity: 0.1 },
  { x: 1110, y: 300, size: 36, opacity: 0.08 },
]

async function logoDataUrl(): Promise<string> {
  const png = await readFile(join(process.cwd(), "public/logo.png"))
  return `data:image/png;base64,${png.toString("base64")}`
}

export async function renderPreviewCard({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string
  title: string
  subtitle: string
}) {
  const logo = await logoDataUrl()
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          backgroundColor: "#0b0b0d",
          backgroundImage:
            "radial-gradient(circle at 0% 0%, rgba(220,60,77,0.35), transparent 55%), radial-gradient(circle at 100% 100%, rgba(34,140,90,0.3), transparent 55%)",
          fontFamily: "Noto Sans",
        }}
      >
        {FLAKES.map((flake, i) => (
          <Snowflake key={i} {...flake} />
        ))}
        {/* Keep content centered: some apps crop previews to a square */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", maxWidth: 980 }}>
          {eyebrow && (
            <div
              style={{
                display: "flex",
                marginBottom: 28,
                padding: "8px 22px",
                borderRadius: 999,
                backgroundColor: BRAND_RED,
                color: "#ffffff",
                fontSize: 26,
                letterSpacing: 3,
              }}
            >
              {eyebrow}
            </div>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} width={eyebrow ? 560 : 720} height={eyebrow ? 137 : 176} alt="" />
          <div style={{ display: "flex", marginTop: 40, fontSize: 48, color: "#f5f5f5", textAlign: "center" }}>
            {title}
          </div>
          <div style={{ display: "flex", marginTop: 16, fontSize: 28, color: "#a3a3a3", textAlign: "center" }}>
            {subtitle}
          </div>
        </div>
      </div>
    ),
    OG_SIZE,
  )
}

// Favicon / Apple touch icon: a white gift on the brand red
export function renderGiftIcon(px: number) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: BRAND_RED,
          borderRadius: px * 0.22,
        }}
      >
        <svg width={px * 0.7} height={px * 0.7} viewBox="0 0 24 24" fill="none">
          {/* bow */}
          <path d="M12 7C10.5 4 7 3.5 6.5 5.5S9 7 12 7Zm0 0c1.5-3 5-3.5 5.5-1.5S15 7 12 7Z" fill="#fff" />
          {/* lid and box */}
          <rect x="3" y="7" width="18" height="4" rx="1" fill="#fff" />
          <rect x="4.5" y="11" width="15" height="10" rx="1" fill="#fff" />
          {/* ribbon */}
          <rect x="11" y="7" width="2" height="14" fill={BRAND_RED} />
        </svg>
      </div>
    ),
    { width: px, height: px },
  )
}
