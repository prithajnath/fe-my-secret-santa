import { OG_SIZE, renderPreviewCard } from "@/lib/og"

// Invite links are the most-shared URLs. Anyone with the link sees this preview, so it stays
// generic: no group name or members.
export const alt = "You're invited to a Secret Santa exchange on My Secret Santa"
export const size = OG_SIZE
export const contentType = "image/png"

// Same card as opengraph-image.tsx; X reads twitter:image separately
export default function Image() {
  return renderPreviewCard({
    eyebrow: "YOU'RE INVITED",
    title: "Join a Secret Santa exchange",
    subtitle: "Sign up or log in to accept your invite",
  })
}
